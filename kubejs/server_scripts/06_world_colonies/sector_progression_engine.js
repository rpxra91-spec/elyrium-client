// ==============================================================================
// 🗺️ ELYRIUM RPG: 8 OVERWORLD SECTORS, DIMENSIONAL MECHANICS & SOFT GATING ENGINE
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// - 8 progressive sectors mapped to dimensions from R=0 to R=35,000 blocks.
// - Atmospheric Soft Miasma (100m warning buffer -> escalating pressure without walls).
// - Dimensional Environmental Mechanics & Signature Mob Spawns in each sector.
// ==============================================================================

const SECTOR_DEFINITIONS = [
    {
        id: 1,
        name: 'Колыбель Цивилизации',
        realm: 'Оверворлд',
        minR: 0,
        maxR: 1500,
        requiredTier: 1,
        sealKey: null,
        titleColor: 'green',
        featureDesc: 'Колыбель развития, безопасность MineColonies и природные шахты',
        mobPool: []
    },
    {
        id: 2,
        name: 'Сектор II: Пепельные Рубежи',
        realm: 'The Nether',
        minR: 1500,
        maxR: 4500,
        requiredTier: 2,
        sealKey: 'skd_sector1_completed',
        titleColor: 'red',
        featureDesc: 'Инфернальное дыхание: мобы огнеупорны и поджигают при ударе',
        mobPool: ['minecraft:wither_skeleton', 'minecraft:magma_cube', 'minecraft:piglin_brute', 'minecraft:zombified_piglin']
    },
    {
        id: 3,
        name: 'Сектор III: Предгорья Эфира',
        realm: 'The Aether',
        minR: 4500,
        maxR: 8500,
        requiredTier: 3,
        sealKey: 'skd_tier4_completed',
        titleColor: 'aqua',
        featureDesc: 'Эфирная гравитация: легкие прыжки, мобы не получают урона от падений',
        mobPool: ['aether:cockatrice', 'aether:blue_swet', 'aether:golden_swet', 'aether:evil_whirlwind']
    },
    {
        id: 4,
        name: 'Сектор IV: Разломы Бездны',
        realm: 'The End',
        minR: 8500,
        maxR: 13500,
        requiredTier: 4,
        sealKey: 'skd_tier5_completed',
        titleColor: 'dark_purple',
        featureDesc: 'Пространственный сдвиг: мобы блинкуются за спину при получении урона',
        mobPool: ['minecraft:enderman', 'minecraft:endermite', 'minecraft:phantom']
    },
    {
        id: 5,
        name: 'Сектор V: Звездный Фронтир',
        realm: 'Eternal Starlight',
        minR: 13500,
        maxR: 19500,
        requiredTier: 5,
        sealKey: 'skd_tier6_completed',
        titleColor: 'light_purple',
        featureDesc: 'Звездное сияние: мобы двигаются на 20% быстрее и мерцают звездным светом',
        mobPool: ['eternal_starlight:boarwarf', 'eternal_starlight:lonestar_skeleton', 'eternal_starlight:freeze', 'eternal_starlight:astral_golem']
    },
    {
        id: 6,
        name: 'Сектор VI: Скалковые Пустоши',
        realm: 'Deeper Darker',
        minR: 19500,
        maxR: 26000,
        requiredTier: 6,
        sealKey: 'skd_tier7_completed',
        titleColor: 'dark_aqua',
        featureDesc: 'Скалк-резонанс: атаки мобов пробивают броню, бег вызывает импульсы Тьмы',
        mobPool: ['deeperdarker:shattered', 'deeperdarker:stalker', 'deeperdarker:sculk_snapper', 'deeperdarker:sculk_centipede']
    },
    {
        id: 7,
        name: 'Сектор VII: Священный Эдем',
        realm: 'DivineRPG Eden',
        minR: 26000,
        maxR: 31000,
        requiredTier: 7,
        sealKey: 'skd_tier8_completed',
        titleColor: 'gold',
        featureDesc: 'Божественная витальность: мобы обладают непрерывной регенерацией здоровья',
        mobPool: ['divinerpg:eden_cadillion', 'divinerpg:eden_tomo', 'divinerpg:madivel', 'divinerpg:wildwood_golem', 'divinerpg:sun_archer']
    },
    {
        id: 8,
        name: 'Сектор VIII: Пределы Мортума',
        realm: 'DivineRPG Mortum',
        minR: 31000,
        maxR: 35000,
        requiredTier: 8,
        sealKey: 'skd_tier10_completed',
        titleColor: 'dark_red',
        featureDesc: 'Некротическая аура: удары накладывают иссушение, вампиризм атак мобов',
        mobPool: ['divinerpg:mortum_cadillion', 'divinerpg:soul_stealer', 'divinerpg:soul_fiend', 'divinerpg:demon_of_darkness']
    }
];

function getOverworldSector(r) {
    for (let i = 0; i < SECTOR_DEFINITIONS.length; i++) {
        let sec = SECTOR_DEFINITIONS[i];
        if (r >= sec.minR && r < sec.maxR) {
            return sec;
        }
    }
    return null; // Beyond 35,000 is The Endless Fringe
}

function hasSectorAccess(player, sector) {
    if (!sector || !sector.sealKey) return true;
    if (player.isCreative && player.isCreative()) return true;
    if (player.isSpectator && player.isSpectator()) return true;
    if (player.tags && (player.tags.contains('tier_bypass') || player.tags.contains('admin_bypass'))) return true;

    let data = player.persistentData;
    if (data.getBoolean(sector.sealKey)) return true;
    if (data.getBoolean('skd_tier10_completed')) return true; // Max progression has all
    return false;
}

// -----------------------------------------------------------------------------
// 1. PERIODIC PLAYER TICK: SECTOR TRACKING, TITLES & SOFT MIASMA GATING
// -----------------------------------------------------------------------------
ServerEvents.tick(event => {
    let server = event.server;
    let tick = server.tickCount;

    server.players.forEach(player => {
        if (!player || !player.isAlive()) return;
        if ((tick + player.id) % 30 !== 0) return; // Staggered check every ~1.5s

        let dim = String(player.level.dimension);
        if (!dim.includes('overworld')) return;

        let r = Math.sqrt(player.x * player.x + player.z * player.z);
        let currentSector = getOverworldSector(r);

        // A. THE ENDLESS FRINGE (R >= 35,000)
        if (r >= 35000) {
            let lastSec = player.persistentData.getInt('lastOverworldSector');
            if (lastSec !== 99) {
                player.persistentData.putInt('lastOverworldSector', 99);
                server.runCommandSilent(`title ${player.username} times 15 80 20`);
                server.runCommandSilent(`title ${player.username} title {"text":"☠ ЗОНА ИСКАЖЕНИЯ","color":"dark_purple","bold":true}`);
                server.runCommandSilent(`title ${player.username} subtitle {"text":"Бесконечная Бездна Элириума • Мобы смертоносны","color":"red"}`);
                server.runCommandSilent(`playsound minecraft:entity.wither.spawn player ${player.username} ~ ~ ~ 1.0 0.6`);
            }
            return;
        }

        if (!currentSector) return;

        // B. SECTOR BOUNDARY ANNOUNCEMENT (TITLE & AUDIO)
        let lastSec = player.persistentData.getInt('lastOverworldSector');
        if (lastSec !== currentSector.id) {
            player.persistentData.putInt('lastOverworldSector', currentSector.id);
            server.runCommandSilent(`title ${player.username} times 10 70 20`);
            server.runCommandSilent(`title ${player.username} title {"text":"⚔ ${currentSector.name}","color":"${currentSector.titleColor}","bold":true}`);
            server.runCommandSilent(`title ${player.username} subtitle {"text":"Мир: ${currentSector.realm} • ${currentSector.featureDesc}","color":"gray"}`);
            server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete player ${player.username} ~ ~ ~ 1.0 1.0`);
        }

        // C. ATMOSPHERIC SOFT MIASMA GATING
        if (!hasSectorAccess(player, currentSector)) {
            let distPastBorder = r - currentSector.minR;

            if (distPastBorder <= 100) {
                // Buffer zone (Warning)
                let remaining = Math.max(0, Math.floor(100 - distPastBorder));
                player.displayClientMessage(Text.of(`§e⚠ [Скверна: ${currentSector.name}] Опасная черта! Сектор закрыт (осталось ${remaining}м).`), true);
                if (tick % 60 === 0) {
                    server.runCommandSilent(`playsound minecraft:block.bell.use player ${player.username} ~ ~ ~ 0.8 0.6`);
                }
            } else {
                // Active Miasma pressure
                player.potionEffects.add('minecraft:slowness', 60, 1, false, false);
                player.potionEffects.add('minecraft:weakness', 60, 1, false, false);
                player.displayClientMessage(Text.of(`§c☠ [Скверна Сектора] Древнее проклятие выжигает ваши силы! Сектор требует Печать ${currentSector.realm}!`), true);

                if (tick % 60 === 0) {
                    server.runCommandSilent(`damage ${player.username} 2 minecraft:magic`);
                    server.runCommandSilent(`particle minecraft:smoke ${player.x} ${player.y + 1} ${player.z} 0.5 0.5 0.5 0.05 15 normal`);
                    server.runCommandSilent(`playsound minecraft:entity.elder_guardian.curse player ${player.username} ~ ~ ~ 0.5 1.4`);
                }
            }
        }

        // D. ENVIRONMENTAL PLAYER PERKS
        if (currentSector.id === 3 && hasSectorAccess(player, currentSector)) {
            // Aether: low gravity lightness
            player.potionEffects.add('minecraft:jump_boost', 60, 0, false, false);
        } else if (currentSector.id === 6 && player.isSprinting()) {
            // Deeper Darker: sprinting causes sculk darkness pulse occasionally
            if (tick % 120 === 0) {
                player.potionEffects.add('minecraft:darkness', 50, 0, false, false);
                server.runCommandSilent(`particle minecraft:sculk_charge_pop ${player.x} ${player.y + 0.2} ${player.z} 0.4 0.1 0.4 0.02 10 normal`);
            }
        }
    });
});

// -----------------------------------------------------------------------------
// 2. MOB SPAWN CONVERSION & DIMENSIONAL BUFFS
// -----------------------------------------------------------------------------
EntityEvents.spawned(event => {
    let entity = event.entity;
    if (!entity || !entity.isMonster()) return;

    let level = event.level;
    if (!level || !String(level.dimension).includes('overworld')) return;

    let pData = entity.persistentData;
    if (pData.getBoolean('elyrium_sector_processed')) return;
    pData.putBoolean('elyrium_sector_processed', true);

    let r = Math.sqrt(entity.x * entity.x + entity.z * entity.z);
    let sector = getOverworldSector(r);
    if (!sector) return;

    pData.putInt('elyrium_sector', sector.id);

    // Common vanilla monsters eligible for replacement
    let typeStr = entity.type.toString();
    let isCommon = typeStr.includes('zombie') || typeStr.includes('skeleton') || typeStr.includes('spider') || typeStr.includes('creeper');

    if (isCommon && sector.mobPool && sector.mobPool.length > 0 && Math.random() < 0.35) {
        let replacementId = sector.mobPool[Math.floor(Math.random() * sector.mobPool.length)];
        try {
            let newMob = level.createEntity(replacementId);
            if (newMob) {
                newMob.setPos(entity.x, entity.y, entity.z);
                newMob.persistentData.putBoolean('elyrium_sector_processed', true);
                newMob.persistentData.putInt('elyrium_sector', sector.id);
                applySectorBuffs(newMob, sector.id);
                newMob.spawn();
                event.cancel();
                return;
            }
        } catch (e) {}
    }

    applySectorBuffs(entity, sector.id);
});

function applySectorBuffs(entity, sectorId) {
    try {
        if (sectorId === 2) {
            // Nether: permanent fire resistance
            entity.potionEffects.add('minecraft:fire_resistance', 72000, 0, false, false);
        } else if (sectorId === 5) {
            // Eternal Starlight: +20% move speed
            entity.potionEffects.add('minecraft:speed', 72000, 0, false, false);
        } else if (sectorId === 7) {
            // Eden: passive regeneration
            entity.potionEffects.add('minecraft:regeneration', 72000, 0, false, false);
        }
    } catch (e) {}
}

// -----------------------------------------------------------------------------
// 3. COMBAT SIGNATURE INTERACTIONS
// -----------------------------------------------------------------------------
EntityEvents.hurt(event => {
    let source = event.source;
    let target = event.entity;
    if (!target) return;

    let level = target.level;
    if (!level || !String(level.dimension).includes('overworld')) return;

    let attacker = source.actual;

    // A. SECTOR 3: AETHER IMMUNITY TO FALL DAMAGE FOR MOBS
    if (source.is('fall') && target.isMonster()) {
        let sec = target.persistentData.getInt('elyrium_sector');
        if (sec === 3) {
            event.cancel();
            return;
        }
    }

    // B. SECTOR 4: THE END MOB TELEPORTATION REACTION
    if (target.isMonster() && attacker && attacker.isPlayer()) {
        let sec = target.persistentData.getInt('elyrium_sector');
        if (sec === 4 && Math.random() < 0.25) {
            try {
                let angle = attacker.yaw * (Math.PI / 180.0);
                let bx = attacker.x + Math.sin(angle) * 3;
                let bz = attacker.z - Math.cos(angle) * 3;
                target.teleportTo(bx, attacker.y, bz);
                level.runCommandSilent(`playsound minecraft:entity.enderman.teleport host @a[distance=..20] ${bx} ${attacker.y} ${bz} 1.0 1.0`);
                level.runCommandSilent(`particle minecraft:portal ${bx} ${attacker.y + 1} ${bz} 0.5 0.5 0.5 0.1 25 normal`);
            } catch (e) {}
        }
    }

    // C. SECTOR 2 & 8: ATTACK ON PLAYER
    if (attacker && attacker.isMonster() && target.isPlayer()) {
        let sec = attacker.persistentData.getInt('elyrium_sector');
        if (sec === 2) {
            // Nether: ignite player
            target.setSecondsOnFire(3);
        } else if (sec === 6) {
            // Deeper Darker: bonus piercing damage
            target.attack(level.damageSources().magic(), 2.0);
        } else if (sec === 8) {
            // Mortum: Wither II & 25% lifesteal
            target.potionEffects.add('minecraft:wither', 80, 1, false, false);
            try {
                attacker.heal(event.damage * 0.25);
            } catch (e) {}
        }
    }
});
