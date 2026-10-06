// ==============================================================================
// ⚡ ELYRIUM: BOUNDARY WALL LOCKDOWN & DEFENSE MATRIX (PHASE 16 / CANON 11 TIERS)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 1. 8 Overworld Boundary Walls:
//    R in [1500, 4500, 8500, 13500, 19500, 26000, 31000, 35000]
//    Protected Band: R ± 8 blocks ([R-8, R+8]) across all Y in [-64, 320].
// 2. No-Build / No-Grief / No-Explosion:
//    - Block breaking and placement cancelled within R ± 8.
//    - Creative / Spectator / OP bypass enabled.
//    - TNT placement forbidden in/near wall zone.
//    - Explosions intercepted and cancelled via LevelEvents.beforeExplosion and EntityEvents.spawned.
// 3. Anti-Skip Matrix (Anti-Elytra & Anti-Enderpearl):
//    - Enforces progression seals skd_sector1_completed, skd_tier2_completed ... skd_tier8_completed.
//    - Flying over wall via Elytra (Y >= 90) or throwing Ender Pearl across barrier is neutralized.
// 4. Boss Defeat Integration & Unlock Commands:
//    - Automatic seal unlocking on boss kill.
//    - Player commands: .boundary, .рубеж
//    - Admin commands: .unlocksector <1-8|all> [on/off]
// ==============================================================================

const SECTOR_RADII = [1500, 4500, 8500, 13500, 19500, 26000, 31000, 35000];
const BOUNDARY_HALF_WIDTH = 8;
const MIN_REJECT_DIST = 1492; // 1500 - 8
const MAX_REJECT_DIST = 35008; // 35000 + 8
const MIN_PROTECTED_Y = -64;
const MAX_PROTECTED_Y = 320;

const BOUNDARY_DATA = [
    {
        tier: 1,
        radius: 1500,
        name: 'Рубеж I (Колыбель Цивилизации ➔ Пепельные Рубежи)',
        primarySeal: 'skd_sector1_completed',
        altSeals: ['skd_tier1_completed'],
        bossName: 'Хранитель Сектора I (Коболедиатор / Древний Остан / Малгарос)',
        warnMsg: '§c⚡ Древний Барьер Рубежа I не пропускает вас! Одолейте Хранителя Сектора I.'
    },
    {
        tier: 2,
        radius: 4500,
        name: 'Рубеж II (Пепельные Рубежи ➔ Предгорья Эфира)',
        primarySeal: 'skd_tier2_completed',
        altSeals: [],
        bossName: 'Предвестник (The Harbinger)',
        warnMsg: '§c⚡ Древний Барьер Рубежа II не пропускает вас! Одолейте Предвестника (Tier 2).'
    },
    {
        tier: 3,
        radius: 8500,
        name: 'Рубеж III (Предгорья Эфира ➔ Разломы Бездны)',
        primarySeal: 'skd_tier3_completed',
        altSeals: ['skd_tier4_completed'],
        bossName: 'Титан Малгарос / Левиафан (Tier 3)',
        warnMsg: '§c⚡ Древний Барьер Рубежа III не пропускает вас! Снимите печать Черной Цитадели (Tier 3).'
    },
    {
        tier: 4,
        radius: 13500,
        name: 'Рубеж IV (Разломы Бездны ➔ Звездный Фронтир)',
        primarySeal: 'skd_tier4_completed',
        altSeals: ['skd_tier5_completed'],
        bossName: 'Netherite Monstrosity / Ignis (Tier 4)',
        warnMsg: '§c⚡ Древний Барьер Рубежа IV не пропускает вас! Покорите пламя Преисподней (Tier 4).'
    },
    {
        tier: 5,
        radius: 19500,
        name: 'Рубеж V (Звездный Фронтир ➔ Скалковые Пустоши)',
        primarySeal: 'skd_tier5_completed',
        altSeals: ['skd_tier6_completed'],
        bossName: 'Sun Spirit / Valkyrie Queen (Tier 5)',
        warnMsg: '§c⚡ Древний Барьер Рубежа V не пропускает вас! Покорите Небеса Эфира (Tier 5).'
    },
    {
        tier: 6,
        radius: 26000,
        name: 'Рубеж VI (Скалковые Пустоши ➔ Священный Эдем)',
        primarySeal: 'skd_tier6_completed',
        altSeals: ['skd_tier7_completed'],
        bossName: 'Ender Dragon / Ender Guardian (Tier 6)',
        warnMsg: '§c⚡ Древний Барьер Рубежа VI не пропускает вас! Одолейте Владык Бездны Края (Tier 6).'
    },
    {
        tier: 7,
        radius: 31000,
        name: 'Рубеж VII (Священный Эдем ➔ Пределы Мортума)',
        primarySeal: 'skd_tier7_completed',
        altSeals: ['skd_tier8_completed'],
        bossName: 'Starlight Golem / Lunar Beast (Tier 7)',
        warnMsg: '§c⚡ Древний Барьер Рубежа VII не пропускает вас! Одолейте Титана Звезд (Tier 7).'
    },
    {
        tier: 8,
        radius: 35000,
        name: 'Рубеж VIII (Пределы Мортума ➔ Зона Искажения)',
        primarySeal: 'skd_tier8_completed',
        altSeals: ['skd_tier10_completed'],
        bossName: 'Warden Бездны / Древний Сталкер (Tier 8)',
        warnMsg: '§c⚡ Древний Барьер Рубежа VIII не пропускает вас! Покорите Глубины Бездны (Tier 8).'
    }
];

// -----------------------------------------------------------------------------
// HELPER FUNCTIONS: GEOMETRY & PERMISSIONS
// -----------------------------------------------------------------------------
// ⚡ CANON UPDATE (UNIFIED OVERWORLD):
// By decree of the Lead Designer, the Overworld is a single unified realm (Tier 1).
// Artificial wall lockdown is deactivated so players can freely build, explore, and run MineColonies.
const OVERWORLD_BOUNDARY_WALLS_ENABLED = false;

function isOverworld(level) {
    if (!OVERWORLD_BOUNDARY_WALLS_ENABLED) return false;
    if (!level) return false;
    let dim = String(level.dimension || level.dimensionKey || '');
    return dim.includes('overworld');
}

function getBoundaryIndex(x, z, y) {
    if (y !== undefined && (y < MIN_PROTECTED_Y || y > MAX_PROTECTED_Y)) {
        return -1;
    }
    let dist = Math.hypot(x, z);
    // Fast-Reject optimization
    if (dist < MIN_REJECT_DIST || dist > MAX_REJECT_DIST) {
        return -1;
    }
    for (let i = 0; i < SECTOR_RADII.length; i++) {
        let r = SECTOR_RADII[i];
        if (dist >= (r - BOUNDARY_HALF_WIDTH) && dist <= (r + BOUNDARY_HALF_WIDTH)) {
            return i;
        }
    }
    return -1;
}

function isInsideBoundaryWall(x, z, y) {
    return getBoundaryIndex(x, z, y) !== -1;
}

function hasBoundaryBypass(player) {
    if (!player) return false;
    if (player.isCreative && player.isCreative()) return true;
    if (player.isSpectator && player.isSpectator()) return true;
    if (player.tags && (player.tags.contains('boundary_bypass') || player.tags.contains('elytra_bypass') || player.tags.contains('op'))) return true;
    return false;
}

function hasUnlockedBoundary(player, boundaryIndex) {
    if (!player) return false;
    if (hasBoundaryBypass(player)) return true;
    if (boundaryIndex < 0 || boundaryIndex >= BOUNDARY_DATA.length) return true;

    let data = BOUNDARY_DATA[boundaryIndex];
    if (player.persistentData.getBoolean(data.primarySeal)) return true;
    if (data.altSeals && data.altSeals.length > 0) {
        for (let alt of data.altSeals) {
            if (player.persistentData.getBoolean(alt)) return true;
        }
    }
    return false;
}

function hasUnlockedSector1(player) {
    return hasUnlockedBoundary(player, 0);
}

// -----------------------------------------------------------------------------
// 1. NO-BUILD / NO-GRIEF ON BOUNDARY WALLS (R ± 8 BLOCKS, Y in [-64, 320])
// -----------------------------------------------------------------------------
BlockEvents.broken(event => {
    let level = event.level;
    if (!isOverworld(level)) return;

    let player = event.player;
    if (hasBoundaryBypass(player)) return;

    let block = event.block;
    let bIdx = getBoundaryIndex(block.x, block.z, block.y);
    if (bIdx !== -1) {
        event.cancel();
        if (player) {
            let r = SECTOR_RADII[bIdx];
            player.sendSystemMessage(Text.of(`§c🛡 Рубежный Вал (R=${r}) защищен древними чарами нерушимости!`), true);
            player.server.runCommandSilent(`playsound minecraft:block.anvil.land player ${player.username} ${block.x} ${block.y} ${block.z} 0.5 1.5`);
        }
    }
});

BlockEvents.placed(event => {
    let level = event.level;
    if (!isOverworld(level)) return;

    let player = event.player;
    if (hasBoundaryBypass(player)) return;

    let block = event.block;
    let bIdx = getBoundaryIndex(block.x, block.z, block.y);
    if (bIdx !== -1) {
        event.cancel();
        if (player) {
            let r = SECTOR_RADII[bIdx];
            player.sendSystemMessage(Text.of(`§c⚠ Магия Рубежного Вала (R=${r}) отторгает установку чужеродных блоков!`), true);
            player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ${block.x} ${block.y} ${block.z} 0.6 1.2`);
        }
        return;
    }

    // Explicit Anti-TNT placement protection in the boundary buffer (R ± 14 blocks)
    let blockId = String(block.id || '');
    if (blockId.includes('tnt')) {
        let dist = Math.hypot(block.x, block.z);
        if (dist >= (MIN_REJECT_DIST - 10) && dist <= (MAX_REJECT_DIST + 10)) {
            for (let i = 0; i < SECTOR_RADII.length; i++) {
                let r = SECTOR_RADII[i];
                if (dist >= (r - BOUNDARY_HALF_WIDTH - 6) && dist <= (r + BOUNDARY_HALF_WIDTH + 6)) {
                    event.cancel();
                    if (player) {
                        player.sendSystemMessage(Text.of(`§4🚫 Установка взрывчатки вблизи Рубежного Вала (R=${r}) строго запрещена!`), true);
                        player.server.runCommandSilent(`playsound minecraft:entity.generic.extinguish_fire player ${player.username} ${block.x} ${block.y} ${block.z} 0.8 1.0`);
                    }
                    return;
                }
            }
        }
    }
});

// -----------------------------------------------------------------------------
// 2. EXPLOSION SHIELDING (LevelEvents.beforeExplosion & Anti-TNT entities)
// -----------------------------------------------------------------------------
LevelEvents.beforeExplosion(event => {
    let level = event.level;
    if (!isOverworld(level)) return;

    let ex = event.x;
    let ez = event.z;
    if (ex === undefined && event.explosion) {
        ex = event.explosion.x;
        ez = event.explosion.z;
    }
    if (ex === undefined) return;

    let dist = Math.hypot(ex, ez);
    // Fast-Reject: if far from all boundaries
    if (dist < (MIN_REJECT_DIST - 12) || dist > (MAX_REJECT_DIST + 12)) return;

    for (let i = 0; i < SECTOR_RADII.length; i++) {
        let r = SECTOR_RADII[i];
        // Blast buffer covers R ± (8 + 6) blocks
        if (dist >= (r - BOUNDARY_HALF_WIDTH - 6) && dist <= (r + BOUNDARY_HALF_WIDTH + 6)) {
            event.cancel();
            return;
        }
    }
});

EntityEvents.spawned(event => {
    let entity = event.entity;
    if (!entity) return;

    let type = entity.type ? String(entity.type) : '';
    if (type === 'minecraft:tnt' || type === 'minecraft:tnt_minecart') {
        let level = entity.level;
        if (!isOverworld(level)) return;

        let dist = Math.hypot(entity.x, entity.z);
        if (dist < (MIN_REJECT_DIST - 10) || dist > (MAX_REJECT_DIST + 10)) return;

        for (let i = 0; i < SECTOR_RADII.length; i++) {
            let r = SECTOR_RADII[i];
            if (dist >= (r - BOUNDARY_HALF_WIDTH - 4) && dist <= (r + BOUNDARY_HALF_WIDTH + 4)) {
                entity.discard();
                return;
            }
        }
    }
});

// -----------------------------------------------------------------------------
// 3. ANTI-ELYTRA SKIP AT ALL 8 BOUNDARIES (Above Y=90 without Tier Seal)
// -----------------------------------------------------------------------------
ServerEvents.tick(event => {
    let server = event.server;
    if (server.tickCount % 4 !== 0) return; // Every 0.2s

    server.players.forEach(player => {
        if (!player || !player.isAlive()) return;
        let level = player.level;
        if (!isOverworld(level)) return;
        if (hasBoundaryBypass(player)) return;

        let px = player.x;
        let pz = player.z;
        let dist = Math.hypot(px, pz);

        // Fast-Reject optimization
        if (dist < MIN_REJECT_DIST || dist > MAX_REJECT_DIST) return;

        let bIdx = getBoundaryIndex(px, pz, player.y);
        if (bIdx === -1) return;

        // If player has unlocked this boundary, pass freely
        if (hasUnlockedBoundary(player, bIdx)) return;

        let isGliding = false;
        try {
            isGliding = (typeof player.isFallFlying === 'function' ? player.isFallFlying() : player.fallFlying) || false;
        } catch (e) {
            isGliding = false;
        }

        let chestItem = player.getChestArmorItem();
        let wearingElytra = chestItem && !chestItem.isEmpty() && chestItem.id.includes('elytra');

        if ((isGliding || wearingElytra) && player.y >= 90) {
            // Cancel gliding / stop fall flying
            try {
                if (typeof player.stopFallFlying === 'function') {
                    player.stopFallFlying();
                }
            } catch (e) {}

            // Apply gentle downward momentum and cut horizontal thrust
            let delta = player.getDeltaMovement();
            if (delta) {
                let newVx = delta.x * 0.2;
                let newVz = delta.z * 0.2;
                let newVy = Math.max(delta.y * 0.4 - 0.25, -0.4);
                player.setDeltaMovement(newVx, newVy, newVz);
            }

            // Safe descent with slow falling
            player.potionEffects.add('minecraft:slow_falling', 60, 0, false, false);

            // Visual shockwave particles
            try {
                player.level.spawnParticles('minecraft:electric_spark', true, player.x, player.y + 1.0, player.z, 0.5, 0.5, 0.5, 8, 0.1);
            } catch (e) {}

            // Actionbar warning & barrier sound (throttled to 1.5s)
            let def = BOUNDARY_DATA[bIdx];
            let now = player.level.gameTime;
            let lastWarn = player.persistentData.getLong('skd_last_barrier_warn') || 0;
            if (now - lastWarn >= 30) {
                player.persistentData.putLong('skd_last_barrier_warn', now);
                player.sendSystemMessage(Text.of(def.warnMsg), true);
                server.runCommandSilent(`playsound minecraft:block.beacon.deactivate player ${player.username} ~ ~ ~ 0.9 1.1`);
            }
        }
    });
});

// -----------------------------------------------------------------------------
// 4. ANTI-ENDERPEARL SKIP ACROSS ALL 8 BOUNDARY WALLS
// -----------------------------------------------------------------------------
// A) Intercept pearl right-click if thrown near boundary without boss defeat
ItemEvents.rightClicked(event => {
    let player = event.player;
    if (!player || hasBoundaryBypass(player)) return;

    let level = player.level;
    if (!isOverworld(level)) return;

    let item = event.item;
    if (!item || item.id !== 'minecraft:ender_pearl') return;

    let px = player.x;
    let pz = player.z;
    let dist = Math.hypot(px, pz);

    // Fast-Reject
    if (dist < (MIN_REJECT_DIST - 10) || dist > (MAX_REJECT_DIST + 10)) return;

    for (let i = 0; i < SECTOR_RADII.length; i++) {
        let r = SECTOR_RADII[i];
        if (dist >= (r - BOUNDARY_HALF_WIDTH - 5) && dist <= (r + BOUNDARY_HALF_WIDTH + 5)) {
            if (!hasUnlockedBoundary(player, i)) {
                event.cancel();
                let def = BOUNDARY_DATA[i];
                player.sendSystemMessage(Text.of(def.warnMsg), true);
                event.server.runCommandSilent(`playsound minecraft:block.glass.break player ${player.username} ~ ~ ~ 0.8 1.4`);

                let delta = player.getDeltaMovement();
                if (delta) {
                    player.setDeltaMovement(delta.x * 0.1, -0.2, delta.z * 0.1);
                }
                return;
            }
        }
    }
});

// B) Intercept pearl projectile entity spawn/teleportation across boundary
EntityEvents.checkSpawn(event => {
    let entity = event.entity;
    if (!entity || entity.type !== 'minecraft:ender_pearl') return;

    let level = entity.level;
    if (!isOverworld(level)) return;

    let owner = entity.owner;
    if (!owner || !owner.isPlayer()) return;

    let player = owner;
    if (hasBoundaryBypass(player)) return;

    let ex = entity.x;
    let ez = entity.z;
    let dist = Math.hypot(ex, ez);

    // Fast-Reject
    if (dist < MIN_REJECT_DIST || dist > MAX_REJECT_DIST) return;

    let bIdx = getBoundaryIndex(ex, ez, entity.y);
    if (bIdx !== -1 && !hasUnlockedBoundary(player, bIdx)) {
        event.cancel();
        let def = BOUNDARY_DATA[bIdx];
        player.sendSystemMessage(Text.of(def.warnMsg), true);
        player.server.runCommandSilent(`playsound minecraft:block.beacon.deactivate player ${player.username} ~ ~ ~ 0.8 1.2`);
    }
});

// -----------------------------------------------------------------------------
// 5. BOSS DEFEAT PROGRESSION HANDLER
// -----------------------------------------------------------------------------
function grantBoundaryUnlock(player, server, sectorIndex) {
    if (!player || sectorIndex < 0 || sectorIndex >= BOUNDARY_DATA.length) return;
    let data = BOUNDARY_DATA[sectorIndex];

    player.persistentData.putBoolean(data.primarySeal, true);
    if (data.altSeals) {
        for (let alt of data.altSeals) {
            player.persistentData.putBoolean(alt, true);
        }
    }

    server.runCommandSilent(`title ${player.username} times 10 70 20`);
    server.runCommandSilent(`title ${player.username} title {\"text\":\"⚡ РУБЕЖ ${data.tier} ПОКОРЕН! ⚡\",\"color\":\"gold\",\"bold\":true}`);
    server.runCommandSilent(`title ${player.username} subtitle {\"text\":\"${data.name.split(' (')[0]}: Барьер рассеян!\",\"color\":\"aqua\"}`);

    server.runCommandSilent(`playsound minecraft:block.bell.use player ${player.username} ~ ~ ~ 1.5 0.8`);
    server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete player ${player.username} ~ ~ ~ 1.0 1.0`);

    player.tell(Text.gold('════════════════════════════════════════════════════════'));
    player.tell(Text.yellow(`🏆 Древние чары Рубежного Вала R=${data.radius} растворились перед вашей силой!`));
    player.tell(Text.aqua(`   ${data.name} открыт для свободного прохода.`));
    player.tell(Text.gold('════════════════════════════════════════════════════════'));
}

function grantSector1Completion(player, server) {
    grantBoundaryUnlock(player, server, 0);
}

EntityEvents.death(event => {
    let entity = event.entity;
    if (!entity) return;

    let entityId = entity.type ? entity.type.toString().toLowerCase() : '';
    let customName = '';
    try {
        if (entity.customName) {
            customName = entity.customName.string || entity.customName.toString();
        }
    } catch (e) {}

    // Sector 1 Guardian Identification:
    // Netherite Monstrosity / Malgaros, Ancient Remnant, Kobolediator or tagged sector 1 boss
    let isSector1Guardian = false;
    if (entityId === 'cataclysm:netherite_monstrosity' ||
        entityId === 'cataclysm:ancient_remnant' ||
        entityId === 'cataclysm:kobolediator' ||
        customName.includes('Малгарос') ||
        customName.includes('Хранитель') ||
        customName.includes('Guardian') ||
        (entity.tags && (entity.tags.contains('sector1_guardian') || entity.tags.contains('boss_sector1')))) {
        isSector1Guardian = true;
    }

    if (!isSector1Guardian) return;

    let server = event.server;
    let killer = event.source ? event.source.player : null;

    let ex = entity.x;
    let ez = entity.z;

    server.players.forEach(p => {
        if (!p || !p.isAlive()) return;
        let dist = Math.hypot(p.x - ex, p.z - ez);
        if (p === killer || dist <= 64.0) {
            grantBoundaryUnlock(p, server, 0);
        }
    });
});

// -----------------------------------------------------------------------------
// 6. CHAT & TESTING COMMANDS (.boundary / .рубеж / .unlocksector <1-8>)
// -----------------------------------------------------------------------------
PlayerEvents.chat(event => {
    let rawMsg = event.message ? event.message.trim() : '';
    let msg = rawMsg.toLowerCase();
    let player = event.player;
    if (!player) return;

    if (msg === '.boundary' || msg === '!boundary' || msg === '.рубеж' || msg === '!рубеж' ||
        msg === '.sector1' || msg === '!sector1') {
        player.tell(Text.gold('══════════════ [🌍 ЕДИНЫЙ ВЕРХНИЙ МИР: ТИР 1] ══════════════'));
        player.tell(Text.green('✦ Верхний Мир является единым бесшовным пространством (Tier 1).'));
        player.tell(Text.white('  Внутренние стены отключены для свободного выживания и MineColonies.'));
        player.tell(Text.yellow('  Для проверки прогрессии по 8 тирам используйте: ').append(Text.aqua('.progression')));
        player.tell(Text.gold('════════════════════════════════════════════════════════════════'));
        event.cancel();
        return;
    }

    if (msg.startsWith('.unlocksector') || msg.startsWith('!unlocksector')) {
        let parts = msg.split(/\s+/);
        let arg = parts.length > 1 ? parts[1] : '';

        // Backward compatibility: .unlocksector1
        if (msg === '.unlocksector1' || msg === '!unlocksector1') {
            arg = '1';
        }

        if (arg === 'all') {
            for (let i = 0; i < BOUNDARY_DATA.length; i++) {
                player.persistentData.putBoolean(BOUNDARY_DATA[i].primarySeal, true);
                if (BOUNDARY_DATA[i].altSeals) {
                    for (let alt of BOUNDARY_DATA[i].altSeals) {
                        player.persistentData.putBoolean(alt, true);
                    }
                }
            }
            player.tell(Text.green('✦ [Рубежи]: ВСЕ 8 секторов и рубежей успешно РАЗБЛОКИРОВАНЫ для вас!'));
            event.server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete player ${player.username} ~ ~ ~ 1.0 1.0`);
            event.cancel();
            return;
        }

        let sectorNum = parseInt(arg, 10);
        if (isNaN(sectorNum) || sectorNum < 1 || sectorNum > 8) {
            player.tell(Text.red('⚠ Использование: .unlocksector <1-8|all> [on/off]'));
            player.tell(Text.gray('  Пример: .unlocksector 1 (переключает допуск к Сектору I / Рубежу 1500)'));
            event.cancel();
            return;
        }

        let sIdx = sectorNum - 1;
        let data = BOUNDARY_DATA[sIdx];
        let currentState = player.persistentData.getBoolean(data.primarySeal);

        let forceMode = parts.length > 2 ? parts[2] : null;
        let newState = !currentState;
        if (forceMode === 'on' || forceMode === 'true' || forceMode === '1') newState = true;
        if (forceMode === 'off' || forceMode === 'false' || forceMode === '0') newState = false;

        if (newState) {
            grantBoundaryUnlock(player, event.server, sIdx);
        } else {
            player.persistentData.putBoolean(data.primarySeal, false);
            if (data.altSeals) {
                for (let alt of data.altSeals) {
                    player.persistentData.putBoolean(alt, false);
                }
            }
            player.tell(Text.red(`✦ [Рубежи]: Допуск через ${data.name} (R=${data.radius}) СБРОШЕН (Барьер вновь активен).`));
            event.server.runCommandSilent(`playsound minecraft:block.beacon.deactivate player ${player.username} ~ ~ ~ 0.8 1.0`);
        }
        event.cancel();
        return;
    }
});
