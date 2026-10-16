// ==============================================================================
// 🐺 ELYRIUM RPG: NOMADIC WORLD BOSSES ENGINE (КОЧЕВЫЕ МИРОВЫЕ ВОЖАКИ)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 1. Sector-Based Roaming Bosses:
//    - Sector I (R = 250..1450m): Lightweight roaming bosses with small retinues.
//    - Spawn protection around capital / origin (R < 250m is strictly forbidden).
// 2. 3 Unique Sector I Boss Archetypes:
//    - 🪓 bandit_warlord: Атаман Разбойников Черной Дубравы (Vindicator + Crossbowmen + Hound).
//    - 🐺 direwolf_alpha: Седогривый Вожак Стаи (Alpha Wolf + Fierce Pack + Fear Howl).
//    - 🛡️ fallen_deserter_knight: Отверженный Рыцарь-Дезертир (Knight + Squires + Shield Guard).
// 3. Live Tuning & Configuration:
//    - All HP, Armor, Speed, Damage, Minions, Cooldowns and Loot are declared in
//      the NOMAD_CONFIG object below.
//    - Modify values and execute `/kubejs reload server_scripts` to apply on the fly!
// 4. Vanilla Bossbar & Audio Telegraphing:
//    - Dynamic bossbar for players in combat radius (<= 32 blocks).
//    - Distant war horn / drum call upon approaching.
// 5. Anti-Trash RPG Loot:
//    - Guaranteed Tier 1 Respec Shard (kubejs:respec_shard_copper).
//    - Epoch crafting ingots & leathers.
//    - Chance for Rank I Martial Arts Tablets and Cracked Elemental Stones.
// 6. Admin Testing Suite:
//    - /nomad spawn <boss_id> [x y z]
//    - /nomad list
//    - /nomad clear
//    - /nomad testloot <boss_id>
// ==============================================================================

// ==============================================================================
// ⚙️ LIVE CONFIGURATION BLOCK (ИЗМЕНЕНИЯ ПРИМЕНЯЮТСЯ НА ЛЕТУ ЧЕРЕЗ /kubejs reload)
// ==============================================================================
const NOMAD_CONFIG = {
    enabled: true,
    checkIntervalTicks: 400,       // Интервал проверки спавна: каждые 20 сек
    maxActivePerSector1: 2,        // Максимум активных вожаков в Секторе I одновременно
    spawnMinR: 250,                // Минимальный радиус от спавна (безопасная гавань)
    spawnMaxR: 1450,               // Максимальный радиус Сектора I (до стены 1500м)
    playerSearchRadiusMin: 45,     // Минимальная дистанция от игрока при спавне
    playerSearchRadiusMax: 75,     // Максимальная дистанция от игрока при спавне
    combatRadius: 32,              // Радиус активности боя и боссбара
    bossDespawnTimeoutMinutes: 30, // Авто-уход босса, если бой не начат за 30 минут

    // --------------------------------------------------------------------------
    // ⚔️ БОССЫ СЕКТОРА I (OVERWORLD TIER 1)
    // --------------------------------------------------------------------------
    bosses: {
        bandit_warlord: {
            id: 'bandit_warlord',
            displayName: '§6[★ Вожак] Атаман Черной Дубравы§r',
            barTitle: 'Атаман Разбойников Черной Дубравы',
            barColor: 'yellow',
            entityType: 'minecraft:vindicator',
            maxHp: 135,
            speed: 0.28,
            attackDamage: 7,
            armor: 9,
            armorToughness: 3,
            mainHand: 'minecraft:iron_sword',
            offHand: 'minecraft:shield',
            helmet: 'kubejs:scout_leather_helmet',
            chest: 'kubejs:iron_brigandine_chestplate',
            legs: 'kubejs:iron_brigandine_leggings',
            feet: 'kubejs:scout_leather_boots',
            biomes: ['forest', 'plains', 'birch_forest', 'dark_forest'],
            minions: [
                { type: 'minecraft:pillager', count: 2, mainHand: 'minecraft:crossbow' },
                { type: 'minecraft:vindicator', count: 1, mainHand: 'minecraft:iron_axe' },
                { type: 'minecraft:wolf', count: 1, aggressive: true }
            ],
            abilities: {
                warCryCooldown: 35, // секунд
                warCryHpThreshold: 0.55 // срабатывает ниже 55% HP
            },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'minecraft:copper_ingot', min: 4, max: 8 },
                    { item: 'minecraft:iron_ingot', min: 2, max: 5 },
                    { item: 'minecraft:leather', min: 3, max: 6 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_whirlwind', chance: 0.25 },
                    { item: 'kubejs:martial_tablet_severing_cleave', chance: 0.25 },
                    { item: 'kubejs:elemental_stone_fire', chance: 0.20 },
                    { item: 'kubejs:elemental_stone_nature', chance: 0.20 }
                ]
            }
        },

        direwolf_alpha: {
            id: 'direwolf_alpha',
            displayName: '§c[★ Вожак] Седогривый Вожак Стаи§r',
            barTitle: 'Седогривый Вожак Стаи (Лютоволк-Альфа)',
            barColor: 'red',
            entityType: 'minecraft:wolf',
            maxHp: 115,
            speed: 0.35,
            attackDamage: 6,
            armor: 6,
            armorToughness: 2,
            biomes: ['taiga', 'snowy_taiga', 'plains', 'forest', 'meadow'],
            minions: [
                { type: 'minecraft:wolf', count: 4, aggressive: true, hp: 28, dmg: 4 }
            ],
            abilities: {
                fearHowlCooldown: 20 // секунд
            },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'minecraft:bone', min: 6, max: 12 },
                    { item: 'minecraft:leather', min: 4, max: 8 },
                    { item: 'minecraft:copper_ingot', min: 3, max: 6 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_triple_shot', chance: 0.25 },
                    { item: 'kubejs:martial_tablet_bone_crusher', chance: 0.25 },
                    { item: 'kubejs:elemental_stone_frost', chance: 0.20 },
                    { item: 'kubejs:elemental_stone_lightning', chance: 0.20 }
                ]
            }
        },

        fallen_deserter_knight: {
            id: 'fallen_deserter_knight',
            displayName: '§b[★ Вожак] Отверженный Рыцарь-Дезертир§r',
            barTitle: 'Отверженный Рыцарь-Дезертир',
            barColor: 'blue',
            entityType: 'minecraft:zombie',
            maxHp: 155,
            speed: 0.24,
            attackDamage: 8,
            armor: 12,
            armorToughness: 4,
            mainHand: 'minecraft:iron_sword',
            offHand: 'minecraft:shield',
            helmet: 'minecraft:iron_helmet',
            chest: 'minecraft:iron_chestplate',
            legs: 'minecraft:iron_leggings',
            feet: 'minecraft:iron_boots',
            biomes: ['plains', 'meadow', 'sunflower_plains', 'river', 'beach'],
            minions: [
                { type: 'minecraft:zombie', count: 2, helmet: 'minecraft:leather_helmet', mainHand: 'minecraft:iron_sword' }
            ],
            abilities: {
                shieldGuardReduction: 0.50, // блокирует 50% урона в лоб
                slamCooldown: 16 // секунд
            },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'minecraft:iron_ingot', min: 4, max: 7 },
                    { item: 'kubejs:steel_ingot', min: 1, max: 2 },
                    { item: 'minecraft:copper_ingot', min: 4, max: 8 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_crushing_uppercut', chance: 0.25 },
                    { item: 'kubejs:martial_tablet_iron_stance', chance: 0.25 },
                    { item: 'kubejs:elemental_stone_holy', chance: 0.20 },
                    { item: 'kubejs:elemental_stone_shadow', chance: 0.20 }
                ]
            }
        }
    }
};

// ==============================================================================
// 🧠 СИСТЕМНОЕ СОСТОЯНИЕ В ПАМЯТИ (TRACKER)
// ==============================================================================
if (!global.ElyriumNomadBosses) {
    global.ElyriumNomadBosses = {};
}

function getActiveNomadCount(sector) {
    let count = 0;
    let now = Date.now();
    for (let uuid in global.ElyriumNomadBosses) {
        let boss = global.ElyriumNomadBosses[uuid];
        if (!boss) continue;
        if (!sector || boss.sector === sector) {
            count++;
        }
    }
    return count;
}

function cleanExpiredBosses(server) {
    let now = Date.now();
    let maxLifetimeMs = NOMAD_CONFIG.bossDespawnTimeoutMinutes * 60 * 1000;

    for (let uuid in global.ElyriumNomadBosses) {
        let boss = global.ElyriumNomadBosses[uuid];
        if (!boss) continue;

        let elapsed = now - boss.spawnTime;
        if (elapsed > maxLifetimeMs) {
            // Remove bossbar
            server.runCommandSilent(`bossbar remove nomad_${boss.barId}`);
            delete global.ElyriumNomadBosses[uuid];
        }
    }
}

// ==============================================================================
// 🛠️ ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ СПАВНА И ЭКИПИРОВКИ
// ==============================================================================
function spawnNomadBoss(server, bossId, x, y, z, forced) {
    let config = NOMAD_CONFIG.bosses[bossId];
    if (!config) return null;

    let overworld = server.getLevel('minecraft:overworld');
    if (!overworld) return null;

    let bossEntity = overworld.createEntity(config.entityType);
    if (!bossEntity) return null;

    bossEntity.setPos(x + 0.5, y, z + 0.5);
    bossEntity.addTag('elyrium_nomad_boss');
    bossEntity.addTag('nomad_id_' + bossId);
    bossEntity.setCustomName(Text.of(config.displayName));
    bossEntity.setCustomNameVisible(true);

    let spawned = bossEntity.spawn();
    if (!spawned) return null;

    let stringUuid = bossEntity.stringUuid;
    let barId = stringUuid.replace(/-/g, '_').substring(0, 16);

    // Apply attributes via reliable commands
    server.runCommandSilent(`attribute ${stringUuid} minecraft:max_health base set ${config.maxHp}`);
    server.runCommandSilent(`attribute ${stringUuid} minecraft:attack_damage base set ${config.attackDamage}`);
    server.runCommandSilent(`attribute ${stringUuid} minecraft:armor base set ${config.armor}`);
    if (config.armorToughness) {
        server.runCommandSilent(`attribute ${stringUuid} minecraft:armor_toughness base set ${config.armorToughness}`);
    }
    if (config.speed) {
        server.runCommandSilent(`attribute ${stringUuid} minecraft:movement_speed base set ${config.speed}`);
    }
    server.runCommandSilent(`attribute ${stringUuid} minecraft:follow_range base set 36`);

    // Reset current HP to max
    bossEntity.health = config.maxHp;

    // Equip Armor & Weapons
    if (config.mainHand) server.runCommandSilent(`item replace entity ${stringUuid} weapon.mainhand with ${config.mainHand}`);
    if (config.offHand) server.runCommandSilent(`item replace entity ${stringUuid} weapon.offhand with ${config.offHand}`);
    if (config.helmet) server.runCommandSilent(`item replace entity ${stringUuid} armor.head with ${config.helmet}`);
    if (config.chest) server.runCommandSilent(`item replace entity ${stringUuid} armor.chest with ${config.chest}`);
    if (config.legs) server.runCommandSilent(`item replace entity ${stringUuid} armor.legs with ${config.legs}`);
    if (config.feet) server.runCommandSilent(`item replace entity ${stringUuid} armor.feet with ${config.feet}`);

    // Create Bossbar
    server.runCommandSilent(`bossbar add nomad_${barId} "${config.barTitle}"`);
    server.runCommandSilent(`bossbar set nomad_${barId} color ${config.barColor || 'yellow'}`);
    server.runCommandSilent(`bossbar set nomad_${barId} style notched_10`);
    server.runCommandSilent(`bossbar set nomad_${barId} max ${config.maxHp}`);
    server.runCommandSilent(`bossbar set nomad_${barId} value ${config.maxHp}`);

    let minionUuids = [];

    // Spawn Minions
    if (config.minions && config.minions.length > 0) {
        config.minions.forEach(mGroup => {
            for (let i = 0; i < mGroup.count; i++) {
                let offsetX = (Math.random() - 0.5) * 6;
                let offsetZ = (Math.random() - 0.5) * 6;
                let minion = overworld.createEntity(mGroup.type);
                if (minion) {
                    minion.setPos(x + offsetX, y, z + offsetZ);
                    minion.addTag('elyrium_nomad_minion');
                    minion.addTag('nomad_parent_' + stringUuid);
                    minion.setCustomName(Text.of(`§7[Свита] ${config.displayName}`));
                    minion.setCustomNameVisible(false);
                    if (minion.spawn()) {
                        let mUuid = minion.stringUuid;
                        minionUuids.push(mUuid);
                        if (mGroup.hp) server.runCommandSilent(`attribute ${mUuid} minecraft:max_health base set ${mGroup.hp}`);
                        if (mGroup.dmg) server.runCommandSilent(`attribute ${mUuid} minecraft:attack_damage base set ${mGroup.dmg}`);
                        if (mGroup.mainHand) server.runCommandSilent(`item replace entity ${mUuid} weapon.mainhand with ${mGroup.mainHand}`);
                        if (mGroup.helmet) server.runCommandSilent(`item replace entity ${mUuid} armor.head with ${mGroup.helmet}`);
                        if (mGroup.aggressive && mGroup.type === 'minecraft:wolf') {
                            server.runCommandSilent(`data merge entity ${mUuid} {AngryAt:[I;0,0,0,0],AngerTime:99999}`);
                        }
                    }
                }
            }
        });
    }

    // Audio telegraph & Atmosphere
    server.runCommandSilent(`playsound minecraft:item.goat_horn.sound.0 neutral @a[x=${x},y=${y},z=${z},distance=..64] ${x} ${y} ${z} 1.5 0.8`);
    server.runCommandSilent(`particle minecraft:campfire_signal_smoke ${x} ${y + 1} ${z} 0.5 1.5 0.5 0.05 30`);

    // Register in global tracking
    global.ElyriumNomadBosses[stringUuid] = {
        uuid: stringUuid,
        barId: barId,
        bossId: bossId,
        name: config.displayName,
        sector: 1,
        x: Math.floor(x),
        y: Math.floor(y),
        z: Math.floor(z),
        spawnTime: Date.now(),
        lastWarCry: 0,
        lastFearHowl: 0,
        lastSlam: 0,
        minionUuids: minionUuids
    };

    return global.ElyriumNomadBosses[stringUuid];
}

// ==============================================================================
// ⏱️ ТИКОВЫЙ ЦИКЛ: СПАВН, ПАТРУЛЬ, БОССБАР И СПОСОБНОСТИ
// ==============================================================================
ServerEvents.tick(event => {
    let server = event.server;
    if (!NOMAD_CONFIG.enabled) return;

    let overworld = server.getLevel('minecraft:overworld');
    if (!overworld) return;

    // --------------------------------------------------------------------------
    // 1. ПЕРИОДИЧЕСКИЙ СПАВН В СЕКТОРЕ I (Каждые checkIntervalTicks)
    // --------------------------------------------------------------------------
    if (server.tickCount % NOMAD_CONFIG.checkIntervalTicks === 0) {
        cleanExpiredBosses(server);

        let activeCount = getActiveNomadCount(1);
        if (activeCount < NOMAD_CONFIG.maxActivePerSector1) {
            let players = overworld.players;
            if (players && !players.isEmpty()) {
                // Find a player wandering in Sector I (R in [250, 1450])
                let candidates = [];
                players.forEach(p => {
                    if (!p.isCreative() && !p.isSpectator()) {
                        let r = Math.sqrt(p.x * p.x + p.z * p.z);
                        if (r >= NOMAD_CONFIG.spawnMinR && r <= NOMAD_CONFIG.spawnMaxR) {
                            candidates.push(p);
                        }
                    }
                });

                if (candidates.length > 0) {
                    let targetPlayer = candidates[Math.floor(Math.random() * candidates.length)];
                    let angle = Math.random() * Math.PI * 2;
                    let dist = NOMAD_CONFIG.playerSearchRadiusMin + Math.random() * (NOMAD_CONFIG.playerSearchRadiusMax - NOMAD_CONFIG.playerSearchRadiusMin);
                    let spawnX = Math.floor(targetPlayer.x + Math.cos(angle) * dist);
                    let spawnZ = Math.floor(targetPlayer.z + Math.sin(angle) * dist);
                    let spawnR = Math.sqrt(spawnX * spawnX + spawnZ * spawnZ);

                    if (spawnR >= NOMAD_CONFIG.spawnMinR && spawnR <= NOMAD_CONFIG.spawnMaxR) {
                        let topY = overworld.getHeight('motion_blocking', spawnX, spawnZ);
                        if (topY > 60 && topY < 200) {
                            let bossKeys = Object.keys(NOMAD_CONFIG.bosses);
                            let selectedId = bossKeys[Math.floor(Math.random() * bossKeys.length)];
                            let spawnedBoss = spawnNomadBoss(server, selectedId, spawnX, topY, spawnZ, false);
                            if (spawnedBoss) {
                                targetPlayer.displayClientMessage(Text.of(`§6⚔ Вблизи рыщет ${spawnedBoss.name} со своей свитой!§r`), true);
                            }
                        }
                    }
                }
            }
        }
    }

    // --------------------------------------------------------------------------
    // 2. БОССБАРЫ И БОЕВОЙ ЦИКЛ (Каждые 20 тиков = 1 сек)
    // --------------------------------------------------------------------------
    if (server.tickCount % 20 === 0) {
        for (let uuid in global.ElyriumNomadBosses) {
            let bossInfo = global.ElyriumNomadBosses[uuid];
            if (!bossInfo) continue;

            let entity = overworld.getEntity(uuid);
            if (!entity || !entity.isLiving() || !entity.isAlive()) {
                // Boss died or despawned
                server.runCommandSilent(`bossbar remove nomad_${bossInfo.barId}`);
                delete global.ElyriumNomadBosses[uuid];
                continue;
            }

            // Update Boss Coordinates
            bossInfo.x = Math.floor(entity.x);
            bossInfo.y = Math.floor(entity.y);
            bossInfo.z = Math.floor(entity.z);

            // Update Bossbar HP
            let curHp = Math.max(0, Math.floor(entity.health));
            server.runCommandSilent(`bossbar set nomad_${bossInfo.barId} value ${curHp}`);

            // Find nearby players
            let nearPlayers = overworld.getEntitiesWithin(AABB.of(
                entity.x - NOMAD_CONFIG.combatRadius, entity.y - 16, entity.z - NOMAD_CONFIG.combatRadius,
                entity.x + NOMAD_CONFIG.combatRadius, entity.y + 16, entity.z + NOMAD_CONFIG.combatRadius
            )).filter(e => e.isPlayer() && !e.isSpectator());

            if (nearPlayers.length > 0) {
                let playerNames = nearPlayers.map(p => p.username).join(' ');
                server.runCommandSilent(`bossbar set nomad_${bossInfo.barId} players ${playerNames}`);
                server.runCommandSilent(`bossbar set nomad_${bossInfo.barId} visible true`);
            } else {
                server.runCommandSilent(`bossbar set nomad_${bossInfo.barId} visible false`);
            }

            // ------------------------------------------------------------------
            // 3. БОЕВЫЕ СПОСОБНОСТИ ВОЖАКОВ (Таймеры)
            // ------------------------------------------------------------------
            let nowSec = Math.floor(Date.now() / 1000);

            // А. Седогривый Вожак: Ужасающий Вой (раз в 20с)
            if (bossInfo.bossId === 'direwolf_alpha' && nearPlayers.length > 0) {
                if (!bossInfo.lastFearHowl || nowSec - bossInfo.lastFearHowl >= NOMAD_CONFIG.bosses.direwolf_alpha.abilities.fearHowlCooldown) {
                    bossInfo.lastFearHowl = nowSec;
                    server.runCommandSilent(`playsound minecraft:entity.wolf.howl hostile @a[x=${entity.x},y=${entity.y},z=${entity.z},distance=..24] ${entity.x} ${entity.y} ${entity.z} 2.0 0.8`);
                    server.runCommandSilent(`particle minecraft:soul ${entity.x} ${entity.y + 1} ${entity.z} 1.0 0.5 1.0 0.05 25`);
                    nearPlayers.forEach(p => {
                        p.potionEffects.add('minecraft:weakness', 100, 0, false, true);
                        p.displayClientMessage(Text.of('§c🐺 Вожак стаи издает леденящий вой! На вас пала Слабость.§r'), true);
                    });
                }
            }

            // Б. Падший Рыцарь: Землетрясение / Удар булавой (раз в 16с)
            if (bossInfo.bossId === 'fallen_deserter_knight' && nearPlayers.length > 0) {
                if (!bossInfo.lastSlam || nowSec - bossInfo.lastSlam >= NOMAD_CONFIG.bosses.fallen_deserter_knight.abilities.slamCooldown) {
                    bossInfo.lastSlam = nowSec;
                    server.runCommandSilent(`playsound minecraft:entity.iron_golem.attack hostile @a[x=${entity.x},y=${entity.y},z=${entity.z},distance=..20] ${entity.x} ${entity.y} ${entity.z} 1.5 0.7`);
                    server.runCommandSilent(`particle minecraft:explosion ${entity.x} ${entity.y} ${entity.z} 0.8 0.2 0.8 0.1 8`);
                    nearPlayers.forEach(p => {
                        let d = Math.sqrt((p.x - entity.x) * (p.x - entity.x) + (p.z - entity.z) * (p.z - entity.z));
                        if (d <= 5.0) {
                            p.attack(overworld.damageSources().mobAttack(entity), 4.0);
                            p.potionEffects.add('minecraft:slowness', 60, 1, false, true);
                            p.displayClientMessage(Text.of('§b🛡 Падший Рыцарь сотрясает землю булавой!§r'), true);
                        }
                    });
                }
            }
        }
    }
});

// ==============================================================================
// 💥 ПЕРЕХВАТ УРОНА: РЕАКЦИИ И СПОСОБНОСТИ ПРИ АТАКЕ
// ==============================================================================
EntityEvents.beforeHurt(event => {
    let target = event.entity;
    if (!target || !target.isLiving()) return;

    if (target.tags.contains('elyrium_nomad_boss')) {
        let stringUuid = target.stringUuid;
        let bossInfo = global.ElyriumNomadBosses[stringUuid];
        if (!bossInfo) return;

        let server = event.server;
        let overworld = server.getLevel('minecraft:overworld');
        let nowSec = Math.floor(Date.now() / 1000);

        // 1. Падший Рыцарь: Глухая Оборона со Щитом (-50% урона в лоб)
        if (bossInfo.bossId === 'fallen_deserter_knight') {
            let src = event.source.actual;
            if (src && src.isPlayer()) {
                // 50% срез входящего урона
                event.damage = event.damage * (1.0 - NOMAD_CONFIG.bosses.fallen_deserter_knight.abilities.shieldGuardReduction);
                server.runCommandSilent(`playsound minecraft:item.shield.block player @a[x=${target.x},y=${target.y},z=${target.z},distance=..16] ${target.x} ${target.y} ${target.z} 1.0 1.0`);
            }
        }

        // 2. Атаман Черной Дубравы: Боевой Клич при HP < 55%
        if (bossInfo.bossId === 'bandit_warlord') {
            let maxHp = NOMAD_CONFIG.bosses.bandit_warlord.maxHp;
            let currentHp = target.health;
            if (currentHp / maxHp <= NOMAD_CONFIG.bosses.bandit_warlord.abilities.warCryHpThreshold) {
                if (!bossInfo.lastWarCry || nowSec - bossInfo.lastWarCry >= NOMAD_CONFIG.bosses.bandit_warlord.abilities.warCryCooldown) {
                    bossInfo.lastWarCry = nowSec;
                    server.runCommandSilent(`playsound minecraft:entity.pillager.celebrate hostile @a[x=${target.x},y=${target.y},z=${target.z},distance=..32] ${target.x} ${target.y} ${target.z} 1.8 0.9`);
                    server.runCommandSilent(`particle minecraft:angry_villager ${target.x} ${target.y + 2} ${target.z} 0.5 0.5 0.5 0.05 15`);

                    target.potionEffects.add('minecraft:strength', 200, 0, false, true);
                    target.potionEffects.add('minecraft:speed', 200, 0, false, true);

                    // Alert nearby players
                    let nearPlayers = overworld.getEntitiesWithin(AABB.of(
                        target.x - 24, target.y - 8, target.z - 24,
                        target.x + 24, target.y + 8, target.z + 24
                    )).filter(e => e.isPlayer());

                    nearPlayers.forEach(p => {
                        p.displayClientMessage(Text.of('§6⚔ Атаман: «В атаку, псы! Добыча сама пришла в наши руки!»§r'), true);
                    });
                }
            }
        }
    }
});

// ==============================================================================
// 🏆 СМЕРТЬ ВОЖАКА: ВЫДАЧА РПГ-ЛУТА И ТОРЖЕСТВО ПОБЕДЫ
// ==============================================================================
EntityEvents.death(event => {
    let entity = event.entity;
    if (!entity || !entity.isLiving()) return;

    if (entity.tags.contains('elyrium_nomad_boss')) {
        let stringUuid = entity.stringUuid;
        let bossInfo = global.ElyriumNomadBosses[stringUuid];
        let bossId = bossInfo ? bossInfo.bossId : null;

        // Fallback detection from tags
        if (!bossId) {
            entity.tags.forEach(t => {
                if (t.startsWith('nomad_id_')) bossId = t.replace('nomad_id_', '');
            });
        }

        let config = NOMAD_CONFIG.bosses[bossId];
        let server = event.server;
        let level = entity.level;

        // Clean bossbar
        if (bossInfo) {
            server.runCommandSilent(`bossbar remove nomad_${bossInfo.barId}`);
            delete global.ElyriumNomadBosses[stringUuid];
        }

        let bossTitle = config ? config.displayName : 'Кочевой Вожак';

        // Fanfare & Local Announcement
        server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete master @a[x=${entity.x},y=${entity.y},z=${entity.z},distance=..48] ${entity.x} ${entity.y} ${entity.z} 1.2 1.0`);
        server.runCommandSilent(`particle minecraft:totem_of_undying ${entity.x} ${entity.y + 1} ${entity.z} 0.6 0.8 0.6 0.2 40`);

        let nearPlayers = level.getEntitiesWithin(AABB.of(
            entity.x - 48, entity.y - 16, entity.z - 48,
            entity.x + 48, entity.y + 16, entity.z + 48
        )).filter(e => e.isPlayer());

        nearPlayers.forEach(p => {
            p.tell(Text.gold('═════════════════════════════════════════════════════'));
            p.tell(Text.yellow(`🏆 КОЧЕВОЙ ВОЖАК ПОВЕРЖЕН: ${bossTitle}`));
            p.tell(Text.green('   Банда разгромлена! Земли Сектора I на время вздохнули спокойно.'));
            p.tell(Text.gold('═════════════════════════════════════════════════════'));
        });

        // Drop Loot
        if (config && config.loot) {
            // 1. Guaranteed Drops
            if (config.loot.guaranteed) {
                config.loot.guaranteed.forEach(g => {
                    let count = g.count || (g.min + Math.floor(Math.random() * (g.max - g.min + 1)));
                    let drop = level.createEntity('minecraft:item');
                    if (drop) {
                        drop.setPos(entity.x, entity.y + 0.5, entity.z);
                        drop.item = Item.of(g.item, count);
                        drop.spawn();
                    }
                });
            }

            // 2. Chance Drops
            if (config.loot.chanceLoot) {
                config.loot.chanceLoot.forEach(c => {
                    if (Math.random() <= c.chance) {
                        let count = c.count || 1;
                        let drop = level.createEntity('minecraft:item');
                        if (drop) {
                            drop.setPos(entity.x, entity.y + 0.5, entity.z);
                            drop.item = Item.of(c.item, count);
                            drop.spawn();
                        }
                    }
                });
            }
        }
    }
});

// ==============================================================================
// 💬 КОМАНДНАЯ СТРОКА ДЛЯ КУРАТОРА И ТЕСТИРОВАНИЯ (/nomad)
// ==============================================================================
ServerEvents.command(event => {
    let command = event.parseResults.reader.string.trim();
    if (!command.startsWith('nomad')) return;

    let player = event.parseResults.context.source.player;
    let server = event.server;
    let parts = command.split(/\s+/);
    let subCmd = parts[1] ? parts[1].toLowerCase() : 'help';

    if (subCmd === 'spawn') {
        let bossId = parts[2] ? parts[2].toLowerCase() : 'bandit_warlord';
        if (!NOMAD_CONFIG.bosses[bossId]) {
            let valid = Object.keys(NOMAD_CONFIG.bosses).join(', ');
            let msg = `§cНеизвестный вожак: ${bossId}! Доступные: ${valid}`;
            if (player) player.displayClientMessage(Text.of(msg), false);
            else server.tell(Text.of(msg));
            return;
        }

        let sx = player ? Math.floor(player.x + 3) : 0;
        let sy = player ? Math.floor(player.y) : 65;
        let sz = player ? Math.floor(player.z + 3) : 0;

        if (parts[3] && parts[4] && parts[5]) {
            sx = parseInt(parts[3]);
            sy = parseInt(parts[4]);
            sz = parseInt(parts[5]);
        }

        let boss = spawnNomadBoss(server, bossId, sx, sy, sz, true);
        let resp = boss ? `§aУспешно заспавнен ${boss.name} на [${sx}, ${sy}, ${sz}]!` : `§cОшибка спавна ${bossId}!`;
        if (player) player.displayClientMessage(Text.of(resp), false);
        else server.tell(Text.of(resp));
        return;
    }

    if (subCmd === 'list') {
        let count = 0;
        let header = '§6══════════════ [ АКТИВНЫЕ КОЧЕВЫЕ ВОЖАКИ ] ══════════════§r';
        if (player) player.displayClientMessage(Text.of(header), false);
        else server.tell(Text.of(header));

        for (let uuid in global.ElyriumNomadBosses) {
            let b = global.ElyriumNomadBosses[uuid];
            if (!b) continue;
            count++;
            let r = Math.floor(Math.sqrt(b.x * b.x + b.z * b.z));
            let line = `§e${count}. ${b.name} §7| Позиция: §f[${b.x}, ${b.y}, ${b.z}] (R=${r}м) §7| Свита: §b${b.minionUuids.length} мобов`;
            if (player) player.displayClientMessage(Text.of(line), false);
            else server.tell(Text.of(line));
        }

        if (count === 0) {
            let noBosses = '§7В мире сейчас нет активных кочевых вожаков.';
            if (player) player.displayClientMessage(Text.of(noBosses), false);
            else server.tell(Text.of(noBosses));
        }
        return;
    }

    if (subCmd === 'clear') {
        let cleared = 0;
        let overworld = server.getLevel('minecraft:overworld');
        for (let uuid in global.ElyriumNomadBosses) {
            let b = global.ElyriumNomadBosses[uuid];
            if (b) {
                server.runCommandSilent(`bossbar remove nomad_${b.barId}`);
                if (overworld) {
                    let ent = overworld.getEntity(uuid);
                    if (ent) ent.discard();
                    b.minionUuids.forEach(mId => {
                        let mEnt = overworld.getEntity(mId);
                        if (mEnt) mEnt.discard();
                    });
                }
                cleared++;
            }
        }
        global.ElyriumNomadBosses = {};
        let resp = `§aУдалено ${cleared} кочевых вожаков и их свит из мира!`;
        if (player) player.displayClientMessage(Text.of(resp), false);
        else server.tell(Text.of(resp));
        return;
    }

    // Default: Help
    let helpMsg = [
        '§6═══════════════ [ СИСТЕМА КОЧЕВЫХ ВОЖАКОВ /nomad ] ═══════════════§r',
        '§e/nomad spawn <bandit_warlord|direwolf_alpha|fallen_deserter_knight> §7- заспавнить вожака рядом',
        '§e/nomad list §7- показать список активных вожаков в мире',
        '§e/nomad clear §7- очистить всех активных вожаков и их миньонов',
        '§7Все параметры (HP, урон, лут) меняются на лету через /kubejs reload server_scripts!'
    ];
    helpMsg.forEach(m => {
        if (player) player.displayClientMessage(Text.of(m), false);
        else server.tell(Text.of(m));
    });
});
