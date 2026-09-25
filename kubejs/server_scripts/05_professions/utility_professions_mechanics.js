// ==============================================================================
// 🛠️ ELYRIUM RPG: UTILITY & EXPLORATION PROFESSIONS MECHANICS ENGINE
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 1. Охотник (Hunter):
//    - Дупликация лута при убийстве монстров (EntityEvents.death)
//    - Редкие охотничьи трофеи (золото, изумруды, самоцветы)
// 2. Путешественник (Traveler):
//    - Грация дельфина и дыхание под водой при заплыве
//    - Порыв ветра при длительном спринте
//    - Снижение и поглощение урона от падения (Feather Fall)
// 3. Строитель / Зодчий (Builder):
//    - Бережливый монтаж: шанс сберечь блок при установке
//    - Увеличенная дальность и эффекты при строительстве
// 4. Землекоп / Кладоискатель (Bagger):
//    - Бонусная удача и тайные сокровища при открытии сундуков
//    - «Бездонный карман»: сохранение уровней опыта при смерти
// ==============================================================================

// ------------------------------------------------------------------------------
// 1. ОХОТНИК: ДУПЛИКАЦИЯ ЛУТА И РЕДКИЕ ТРОФЕИ (EntityEvents.death)
// ------------------------------------------------------------------------------
const MONSTER_EXTRA_DROPS = {
    'zombie': ['minecraft:rotten_flesh', 'minecraft:iron_ingot'],
    'skeleton': ['minecraft:bone', 'minecraft:arrow'],
    'creeper': ['minecraft:gunpowder'],
    'spider': ['minecraft:string', 'minecraft:spider_eye'],
    'cave_spider': ['minecraft:string', 'minecraft:spider_eye'],
    'enderman': ['minecraft:ender_pearl'],
    'witch': ['minecraft:redstone', 'minecraft:glowstone_dust', 'minecraft:glass_bottle'],
    'blaze': ['minecraft:blaze_rod'],
    'drowned': ['minecraft:copper_ingot', 'minecraft:rotten_flesh'],
    'husk': ['minecraft:rotten_flesh', 'minecraft:iron_ingot'],
    'stray': ['minecraft:bone', 'minecraft:arrow'],
    'slime': ['minecraft:slime_ball'],
    'magma_cube': ['minecraft:magma_cream'],
    'ghast': ['minecraft:ghast_tear', 'minecraft:gunpowder'],
    'wither_skeleton': ['minecraft:bone', 'minecraft:coal']
};

const HUNTER_RARE_TROPHIES = [
    'minecraft:gold_nugget',
    'minecraft:emerald',
    'minecraft:amethyst_shard',
    'minecraft:lapis_lazuli',
    'minecraft:gold_ingot'
];

EntityEvents.death(event => {
    let source = event.source;
    if (!source) return;

    let killer = source.actual || source.player;
    if (!killer || !killer.isPlayer() || !killer.isAlive()) return;

    let victim = event.entity;
    if (!victim || victim.isPlayer() || !victim.isLiving()) return;

    // Only hostile monsters trigger hunter bonuses
    let isMonster = false;
    try {
        if (victim.isMonster && victim.isMonster()) isMonster = true;
    } catch (e) {}

    let typeStr = String(victim.type).toLowerCase();
    if (!isMonster && (typeStr.includes('monster') || typeStr.includes('zombie') || typeStr.includes('skeleton') ||
        typeStr.includes('creeper') || typeStr.includes('spider') || typeStr.includes('enderman') ||
        typeStr.includes('witch') || typeStr.includes('blaze') || typeStr.includes('slime') ||
        typeStr.includes('ghast') || typeStr.includes('drowned') || typeStr.includes('husk') ||
        typeStr.includes('stray') || typeStr.includes('pillager') || typeStr.includes('vindicator') ||
        typeStr.includes('evoker') || typeStr.includes('cataclysm'))) {
        isMonster = true;
    }

    if (!isMonster) return;

    let tags = killer.tags;
    if (!tags) return;

    // --- A. ДУПЛИКАЦИЯ ЛУТА С МОБОВ ---
    let dupChance = 0;
    if (tags.contains('skill_hunter_loot_dup_base')) dupChance += 0.10;
    if (tags.contains('skill_hunter_trophy_1')) dupChance += 0.03;
    if (tags.contains('skill_hunter_trophy_2')) dupChance += 0.03;
    if (tags.contains('skill_hunter_trophy_3')) dupChance += 0.03;
    if (tags.contains('skill_hunter_trophy_4')) dupChance += 0.03;
    if (tags.contains('skill_hunter_trophy_5')) dupChance += 0.04;
    if (tags.contains('skill_hunter_master')) dupChance += 0.08;
    if (tags.contains('skill_hunter_king_of_trophies')) dupChance += 0.12;
    if (tags.contains('skill_hunter_pinnacle')) dupChance += 0.15;

    if (dupChance > 0 && Math.random() < dupChance) {
        let matchedDrop = null;
        for (let mobKey in MONSTER_EXTRA_DROPS) {
            if (typeStr.includes(mobKey)) {
                let drops = MONSTER_EXTRA_DROPS[mobKey];
                matchedDrop = drops[Math.floor(Math.random() * drops.length)];
                break;
            }
        }
        if (!matchedDrop) matchedDrop = 'minecraft:bone';

        killer.server.runCommandSilent(`summon minecraft:item ${victim.x} ${victim.y + 0.5} ${victim.z} {Item:{id:"${matchedDrop}",Count:1b}}`);
        killer.server.runCommandSilent(`particle minecraft:happy_villager ${victim.x} ${victim.y + 0.8} ${victim.z} 0.3 0.3 0.3 0.05 6`);
        killer.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${killer.username} ~ ~ ~ 0.6 1.4`);
    }

    // --- B. РЕДКИЕ ОХОТНИЧЬИ ТРОФЕИ ---
    let rareChance = 0;
    if (tags.contains('skill_hunter_rare_drops_1')) rareChance += 0.05;
    if (tags.contains('skill_hunter_rare_drops_2')) rareChance += 0.08;
    if (tags.contains('skill_hunter_rare_drops_3')) rareChance += 0.12;

    if (rareChance > 0 && Math.random() < rareChance) {
        let trophy = HUNTER_RARE_TROPHIES[Math.floor(Math.random() * HUNTER_RARE_TROPHIES.length)];
        let count = (trophy.includes('nugget')) ? (3 + Math.floor(Math.random() * 5)) : 1;

        killer.server.runCommandSilent(`summon minecraft:item ${victim.x} ${victim.y + 0.5} ${victim.z} {Item:{id:"${trophy}",Count:${count}b}}`);
        killer.server.runCommandSilent(`particle minecraft:totem_of_undying ${victim.x} ${victim.y + 1.0} ${victim.z} 0.4 0.4 0.4 0.1 12`);
        killer.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${killer.username} ~ ~ ~ 0.5 1.8`);
        killer.sendSystemMessage(Text.of('§6🏹 [Охотник] Добыт ценный охотничий трофей!'), true);
    }
});

// ------------------------------------------------------------------------------
// 2. ПУТЕШЕСТВЕННИК: ПЛАВАНИЕ, СПРИНТ И МЯГКОЕ ПРИЗЕМЛЕНИЕ
// ------------------------------------------------------------------------------
PlayerEvents.tick(event => {
    let player = event.player;
    if (!player || !player.isAlive()) return;

    let age = (typeof player.age === 'number') ? player.age : (typeof player.tickCount === 'number' ? player.tickCount : 0);
    // Throttled to run once every 20 ticks (1 second)
    if (age % 20 !== 0) return;

    let tags = player.tags;
    if (!tags) return;

    // --- A. ГРАЦИЯ ДЕЛЬФИНА ПРИ ПЛАВАНИИ ---
    if (player.isInWater() && (tags.contains('skill_traveler_swimmer') || tags.contains('skill_traveler_pinnacle'))) {
        player.potionEffects.add('minecraft:dolphins_grace', 40, 0, false, false);
        player.potionEffects.add('minecraft:water_breathing', 40, 0, false, false);
        player.server.runCommandSilent(`particle minecraft:bubble_pop ${player.x} ${player.y + 0.5} ${player.z} 0.3 0.3 0.3 0.05 4`);
    }

    // --- B. ВЕТРЯНОЙ БЕГ (WIND RUNNER) ---
    if (player.isSprinting() && (tags.contains('skill_traveler_wind_runner') || tags.contains('skill_traveler_pinnacle'))) {
        player.potionEffects.add('minecraft:speed', 50, 0, false, false);
        player.server.runCommandSilent(`particle minecraft:cloud ${player.x} ${player.y + 0.1} ${player.z} 0.2 0.1 0.2 0.01 2`);
    }
});

// Поглощение урона от падения (Feather Fall)
EntityEvents.beforeHurt(event => {
    let victim = event.entity;
    if (!victim || !victim.isPlayer()) return;

    let source = event.source;
    if (!source) return;

    let srcType = '';
    try {
        if (source.type && source.type().id) srcType = String(source.type().id);
        else if (source.getType) srcType = String(source.getType());
        else srcType = String(source);
    } catch (e) {
        srcType = String(source);
    }

    if (srcType.toLowerCase().includes('fall')) {
        let tags = victim.tags;
        if (!tags) return;

        if (tags.contains('skill_traveler_feather_fall') || tags.contains('skill_traveler_pinnacle')) {
            // Cancel minor falls completely
            if (event.damage <= 3.5) {
                event.damage = 0;
                event.cancel();
            } else {
                event.damage *= 0.50; // 50% damage reduction on high falls
            }
            victim.server.runCommandSilent(`particle minecraft:poof ${victim.x} ${victim.y + 0.2} ${victim.z} 0.3 0.1 0.3 0.05 8`);
            victim.server.runCommandSilent(`playsound minecraft:block.wool.fall player ${victim.username} ~ ~ ~ 0.8 1.4`);
        }
    }
});

// ------------------------------------------------------------------------------
// 3. СТРОИТЕЛЬ / ЗОДЧИЙ: БЕРЕЖЛИВЫЙ МОНТАЖ И ДАЛЬНОСТЬ (BlockEvents.placed)
// ------------------------------------------------------------------------------
BlockEvents.placed(event => {
    let player = event.player;
    if (!player || player.isCreative()) return;

    let tags = player.tags;
    if (!tags) return;

    let refundChance = 0;
    if (tags.contains('skill_builder_placing_refund_2')) refundChance += 0.15;
    else if (tags.contains('skill_builder_placing_refund_1')) refundChance += 0.08;

    if (refundChance > 0 && Math.random() < refundChance) {
        let item = event.item;
        if (item && item.id) {
            player.give(item.id);
            player.sendSystemMessage(Text.of('§e🔨 [Зодчий] Блок сбережен благодаря мастерскому монтажу!'), true);
            let b = event.block;
            player.server.runCommandSilent(`particle minecraft:wax_on ${b.x + 0.5} ${b.y + 0.5} ${b.z + 0.5} 0.2 0.2 0.2 0.05 4`);
            player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.5 1.9`);
        }
    }
});

// ------------------------------------------------------------------------------
// 4. ЗЕМЛЕКОП / КЛАДОИСКАТЕЛЬ: СОКРОВИЩА В СУНДУКАХ И СОХРАНЕНИЕ ОПЫТА
// ------------------------------------------------------------------------------
const BAGGER_CHEST_LOOT = [
    'minecraft:gold_ingot',
    'minecraft:emerald',
    'minecraft:lapis_lazuli',
    'minecraft:amethyst_shard',
    'minecraft:iron_ingot',
    'minecraft:diamond',
    'minecraft:golden_apple'
];

BlockEvents.rightClicked(event => {
    let player = event.player;
    if (!player) return;

    let tags = player.tags;
    if (!tags) return;

    let block = event.block;
    let bId = String(block.id).toLowerCase();

    // Check containers: chests, barrels, decorated pots
    if (bId.includes('chest') || bId.includes('barrel') || bId.includes('decorated_pot') || bId.includes('shulker_box')) {
        let pData = player.persistentData;
        let chestKey = `bagger_loot_${block.x}_${block.y}_${block.z}`;

        // Ensure each chest only awards bonus treasure once per player
        if (!pData.getBoolean(chestKey)) {
            pData.putBoolean(chestKey, true);

            let bonusChance = 0;
            if (tags.contains('skill_bagger_chest_luck_master')) bonusChance = 0.50;
            else if (tags.contains('skill_bagger_chest_luck_3')) bonusChance = 0.35;
            else if (tags.contains('skill_bagger_chest_luck_2')) bonusChance = 0.25;
            else if (tags.contains('skill_bagger_chest_luck_1')) bonusChance = 0.15;

            if (bonusChance > 0 && Math.random() < bonusChance) {
                let rewardItem = BAGGER_CHEST_LOOT[Math.floor(Math.random() * BAGGER_CHEST_LOOT.length)];
                let count = (rewardItem.includes('lapis') || rewardItem.includes('amethyst')) ? 2 : 1;

                player.server.runCommandSilent(`summon minecraft:item ${block.x + 0.5} ${block.y + 1.1} ${block.z + 0.5} {Item:{id:"${rewardItem}",Count:${count}b}}`);
                player.server.runCommandSilent(`particle minecraft:happy_villager ${block.x + 0.5} ${block.y + 1.0} ${block.z + 0.5} 0.3 0.3 0.3 0.05 10`);
                player.server.runCommandSilent(`particle minecraft:totem_of_undying ${block.x + 0.5} ${block.y + 1.2} ${block.z + 0.5} 0.2 0.2 0.2 0.05 8`);
                player.server.runCommandSilent(`playsound minecraft:block.amethyst_block.chime player ${player.username} ~ ~ ~ 0.9 1.3`);
                player.sendSystemMessage(Text.of('§6💎 [Кладоискатель] Ваше чутьё обнаружило скрытое сокровище в тайнике!'), true);
            }
        }
    }
});

// Сохранение опыта при смерти (Safe Pocket)
EntityEvents.death(event => {
    let victim = event.entity;
    if (!victim || !victim.isPlayer()) return;

    let tags = victim.tags;
    if (!tags) return;

    let currentLvl = victim.experienceLevel;
    if (currentLvl <= 0) return;

    if (tags.contains('skill_bagger_safe_pocket_full')) {
        victim.persistentData.putInt('bagger_saved_xp', currentLvl);
    } else if (tags.contains('skill_bagger_safe_pocket_1')) {
        let halfLvl = Math.max(1, Math.floor(currentLvl * 0.5));
        victim.persistentData.putInt('bagger_saved_xp', halfLvl);
    }
});

// Восстановление сохраненного опыта после возрождения
PlayerEvents.respawned(event => {
    let player = event.player;
    if (!player) return;

    let pData = player.persistentData;
    let savedXp = pData.getInt('bagger_saved_xp') || 0;

    if (savedXp > 0) {
        pData.remove('bagger_saved_xp');
        player.server.runCommandSilent(`experience set ${player.username} ${savedXp} levels`);
        player.sendSystemMessage(Text.of(`§6📦 [Бездонный Карман] Ваш опыт сохранен: ${savedXp} уровней восстановлено!`), true);
        player.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${player.username} ~ ~ ~ 0.8 1.2`);
    }
});
