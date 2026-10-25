// ==============================================================================
// 👑 ELYRIUM RPG: BOSS CATALYST DROPS & EPOCHAL SYNTHESIS RECIPES
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// Guarantees that progression across the 8 Canonical Tiers is strictly locked
// behind defeating the apex bosses of each realm.
// ==============================================================================

// ------------------------------------------------------------------------------
// 1. BOSS LOOT INJECTION (EntityEvents.drops)
// ------------------------------------------------------------------------------
EntityEvents.drops(event => {
    let entity = event.entity;
    if (!entity) return;

    let id = entity.type ? entity.type.toString().toLowerCase() : '';
    if (!id) return;

    let level = entity.level;
    let x = entity.x, y = entity.y, z = entity.z;

    let grantCatalyst = (catId, tierNum, bossName) => {
        event.addDrop(Item.of(catId, 1));

        if (level && level.server) {
            let server = level.server;
            server.runCommandSilent(`execute in ${level.dimension} run particle minecraft:totem_of_undying ${x} ${y + 1.5} ${z} 0.8 0.8 0.8 0.2 60`);
            server.runCommandSilent(`execute in ${level.dimension} run particle minecraft:firework ${x} ${y + 2.0} ${z} 0.6 0.6 0.6 0.15 35`);
            server.runCommandSilent(`execute in ${level.dimension} run playsound minecraft:ui.toast.challenge_complete master @a[distance=..64] ${x} ${y} ${z} 1.2 1.0`);
            server.tell(Text.of(`§6👑 [ЭЛИРИУМ] Повержен владыка §e${bossName}§6! Получен §lКатализатор Возвышения (Тир ${tierNum})§r§6!`));
        }
    };

    // TIER 1 BOSSES (Overworld -> Drop T2 Catalyst)
    if (id === 'cataclysm:ancient_remnant' || id.includes('ancient_remnant') ||
        id === 'cataclysm:kobolediator' || id.includes('kobolediator') ||
        id === 'cataclysm:maledictus') {
        grantCatalyst('kubejs:ascension_catalyst_t2', 2, 'Черной Цитадели');
    }

    // TIER 2 BOSSES (Nether -> Drop T3 Catalyst)
    else if (id === 'cataclysm:netherite_monstrosity' ||
             id === 'cataclysm:ignis' ||
             id === 'cataclysm:the_harbinger' ||
             id === 'minecraft:wither') {
        grantCatalyst('kubejs:ascension_catalyst_t3', 3, 'Преисподней (Игнис / Монстросити)');
    }

    // TIER 3 BOSSES (Aether -> Drop T4 Catalyst)
    else if (id === 'aether:valkyrie_queen' || id.includes('valkyrie_queen') ||
             id === 'aether:sun_spirit' || id.includes('sun_spirit') ||
             id === 'aether:slider' || id.includes('slider')) {
        grantCatalyst('kubejs:ascension_catalyst_t4', 4, 'Небесного Эфира (Королева Валькирий)');
    }

    // TIER 4 BOSSES (The End -> Drop T5 Catalyst)
    else if (id === 'minecraft:ender_dragon' ||
             id === 'cataclysm:ender_guardian' ||
             id === 'cataclysm:ender_golem') {
        grantCatalyst('kubejs:ascension_catalyst_t5', 5, 'Цитаделей Края (Дракон / Страж Края)');
    }

    // TIER 5 BOSSES (Eternal Starlight -> Drop T6 Catalyst)
    else if (id.startsWith('eternal_starlight:') && (id.includes('golem') || id.includes('titan') || id.includes('beast') || id.includes('monstrosity'))) {
        grantCatalyst('kubejs:ascension_catalyst_t6', 6, 'Вечного Сияния (Звездный Голем)');
    }

    // TIER 6 BOSSES (Deeper Darker -> Drop T7 Catalyst)
    else if (id === 'minecraft:warden' || id.includes('stalker')) {
        grantCatalyst('kubejs:ascension_catalyst_t7', 7, 'Скалк-Бездны (Хранитель Warden)');
    }

    // TIER 7 BOSSES (DivineRPG Eden -> Drop T8 Catalyst)
    else if (id.startsWith('divinerpg:') && (id.includes('eden') || id.includes('wildwood') || id.includes('dramon') || id.includes('parasite'))) {
        grantCatalyst('kubejs:ascension_catalyst_t8', 8, 'Первородного Эдема');
    }
});

// ------------------------------------------------------------------------------
// 2. BOSS-BASED SYNTHESIS RECIPES (ServerEvents.recipes)
// ------------------------------------------------------------------------------
ServerEvents.recipes(event => {

    // T2: Катализатор Возвышения II (Инфернальный)
    event.shaped('kubejs:ascension_catalyst_t2', [
        'CSC',
        'SBS',
        'CSC'
    ], {
        C: 'minecraft:crying_obsidian',
        S: 'kubejs:steel_ingot',
        B: 'kubejs:world_heart'
    }).id('elyrium:progression/ascension_catalyst_t2');

    // T3: Катализатор Возвышения III (Небесный)
    event.shaped('kubejs:ascension_catalyst_t3', [
        'MCM',
        'CGC',
        'MCM'
    ], {
        M: 'minecraft:magma_block',
        C: 'skd:cinder_alloy_ingot',
        G: 'cataclysm:monstrous_horn'
    }).id('elyrium:progression/ascension_catalyst_t3_horn');

    event.shaped('kubejs:ascension_catalyst_t3', [
        'MCM',
        'CGC',
        'MCM'
    ], {
        M: 'minecraft:magma_block',
        C: 'skd:cinder_alloy_ingot',
        G: 'cataclysm:flame_eye'
    }).id('elyrium:progression/ascension_catalyst_t3_eye');

    // T4: Катализатор Возвышения IV (Пустотный)
    event.shaped('kubejs:ascension_catalyst_t4', [
        'YAY',
        'AVA',
        'YAY'
    ], {
        Y: 'aether:golden_amber',
        A: 'kubejs:celestial_astralyte_ingot',
        V: 'aether:victory_medal'
    }).id('elyrium:progression/ascension_catalyst_t4_medal');

    // T5: Катализатор Возвышения V (Астральный)
    event.shaped('kubejs:ascension_catalyst_t5', [
        'DND',
        'NCN',
        'DND'
    ], {
        D: 'minecraft:dragon_breath',
        N: 'minecraft:netherite_ingot',
        C: 'cataclysm:void_core'
    }).id('elyrium:progression/ascension_catalyst_t5_core');

    // T6: Катализатор Возвышения VI (Глубинный)
    event.shaped('kubejs:ascension_catalyst_t6', [
        'SAS',
        'ACA',
        'SAS'
    ], {
        S: 'eternal_starlight:thermal_springstone',
        A: 'eternal_starlight:aethersent_ingot',
        C: 'eternal_starlight:starlight_flower'
    }).id('elyrium:progression/ascension_catalyst_t6');

    // T7: Катализатор Возвышения VII (Эдемский)
    event.shaped('kubejs:ascension_catalyst_t7', [
        'ERE',
        'RHR',
        'ERE'
    ], {
        E: 'deeperdarker:reinforced_echo_shard',
        R: 'deeperdarker:resonarium',
        H: 'deeperdarker:heart_of_the_deep'
    }).id('elyrium:progression/ascension_catalyst_t7');

    // T8: Катализатор Возвышения VIII (Апогей Мортума)
    event.shaped('kubejs:ascension_catalyst_t8', [
        'SGS',
        'GNG',
        'SGS'
    ], {
        S: 'divinerpg:eden_soul',
        G: 'minecraft:gold_block',
        N: 'minecraft:netherite_block'
    }).id('elyrium:progression/ascension_catalyst_t8');
});
