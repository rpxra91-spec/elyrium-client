// ==============================================================================
// 🔨 ELYRIUM RPG: EQUIPMENT REINFORCEMENT RECIPES & BOSS LOOT INJECTION
// ==============================================================================
// 1. Crafting recipes for the 5 Smithing Stones across 11 Tiers:
//    - smithing_stone_1 (+1..+2): Copper, Quartz/Amethyst, Flint (Tier 1-2 Overworld).
//    - smithing_stone_2 (+3..+4): Iron/Steel, Basalt, Cinder Alloy / Nether Brick (Tier 3-4 Citadel & Nether).
//    - smithing_stone_3 (+5..+6): Zanite/Gravitite (Aether) + Dragon breath / End stone / Purpur (Tier 5-6 Aether & The End).
//    - smithing_stone_4 (+7..+8): Starlight metal (Eternal Starlight) + Echo shards / Sculk catalyst (Tier 7-8 Otherside & Starlight).
//    - smithing_stone_5 (+9..+10): Eden/Wildwood crystal (DivineRPG) + Mortum shard / Divine soul.
// 2. The Single Anti-Downgrade Catalyst: smithing_aegis (Печать Древнего Кузнеца):
//    - High-tier endgame crafting recipes: Netherite block x2, Echo Shard x4, Starlight Ingot x4, Eden Crystal x2, and Nether Star / Dragon Egg.
// 3. Boss Loot Injection (EntityEvents.drops):
//    - Bosses of T4-T6: Drop Stone 2 & 3.
//    - Bosses of T7-T8: Drop Stone 4.
//    - Bosses of T9-T11: Drop Stone 5 and rare chance for smithing_aegis.
// ==============================================================================

ServerEvents.recipes(event => {

    // --------------------------------------------------------------------------
    // 0. АДСКАЯ НАКОВАЛЬНЯ (infernal_anvil) - КУЗНИЦА НЕЗЕРА (TIER 4)
    // --------------------------------------------------------------------------
    event.shaped('kubejs:infernal_anvil', [
        'CAC',
        'BNB',
        'OZO'
    ], {
        C: 'skd:cinder_alloy_ingot',
        A: 'minecraft:anvil',
        B: 'minecraft:blaze_rod',
        N: 'minecraft:netherite_scrap',
        O: 'minecraft:crying_obsidian',
        Z: 'minecraft:obsidian'
    }).id('elyrium:crafting/infernal_anvil');

    // --------------------------------------------------------------------------
    // 1. TIER 4: КУЗНЕЧНЫЙ ОСЕЛОК I (smithing_stone_1: +1..+2) - НЕЗЕР
    // --------------------------------------------------------------------------
    // Вариант A: Пепельный Сплав + Базальт + Огненный порошок
    event.shaped('2x kubejs:smithing_stone_1', [
        ' B ',
        'PCP',
        ' B '
    ], {
        C: 'skd:cinder_alloy_ingot',
        B: 'minecraft:basalt',
        P: 'minecraft:blaze_powder'
    }).id('elyrium:crafting/smithing_stone_1_cinder');

    // Вариант B: Незеритовый обломок + Базальт + Магма (4 шт. - повышенный выход)
    event.shaped('4x kubejs:smithing_stone_1', [
        ' B ',
        'MNM',
        ' B '
    ], {
        N: 'minecraft:netherite_scrap',
        B: 'minecraft:basalt',
        M: 'minecraft:magma_block'
    }).id('elyrium:crafting/smithing_stone_1_netherite');

    // Вариант C: Адский Кирпич + Базальт + Огненный порошок (1 шт.)
    event.shaped('1x kubejs:smithing_stone_1', [
        ' B ',
        'PKP',
        ' B '
    ], {
        K: 'minecraft:nether_brick',
        B: 'minecraft:basalt',
        P: 'minecraft:blaze_powder'
    }).id('elyrium:crafting/smithing_stone_1_nether_brick');

    // --------------------------------------------------------------------------
    // 2. TIER 5: НЕБЕСНЫЙ КАМЕНЬ II (smithing_stone_2: +3..+4) - ЭФИР (THE AETHER)
    // --------------------------------------------------------------------------
    // Вариант A: Занорит + Амброзиум
    event.shaped('2x kubejs:smithing_stone_2', [
        ' A ',
        'ZZZ',
        ' A '
    ], {
        A: 'aether:ambrosium_shard',
        Z: 'aether:zanite_gemstone'
    }).id('elyrium:crafting/smithing_stone_2_zanite');

    // Вариант B: Зачарованный Гравитит + Амброзиум (4 шт. - высший выход)
    event.shaped('4x kubejs:smithing_stone_2', [
        ' G ',
        'AZA',
        ' G '
    ], {
        G: 'aether:enchanted_gravitite',
        Z: 'aether:zanite_gemstone',
        A: 'aether:ambrosium_shard'
    }).id('elyrium:crafting/smithing_stone_2_gravitite');

    // --------------------------------------------------------------------------
    // 3. TIER 6: ПУСТОТНЫЙ КАМЕНЬ III (smithing_stone_3: +5..+6) - КРАЙ (THE END)
    // --------------------------------------------------------------------------
    // Вариант A: Пурпур + Эндерняк + Дыхание Дракона (2 шт.)
    event.shaped('2x kubejs:smithing_stone_3', [
        ' P ',
        'EBE',
        ' P '
    ], {
        P: 'minecraft:purpur_block',
        E: 'minecraft:end_stone',
        B: 'minecraft:dragon_breath'
    }).id('elyrium:crafting/smithing_stone_3_dragon_breath');

    // Вариант B: Пурпур + Эндерняк + Жемчуг Края (1 шт.)
    event.shaped('1x kubejs:smithing_stone_3', [
        ' P ',
        'ESE',
        ' P '
    ], {
        P: 'minecraft:purpur_block',
        E: 'minecraft:end_stone',
        S: 'minecraft:ender_pearl'
    }).id('elyrium:crafting/smithing_stone_3_end_pearl');

    // --------------------------------------------------------------------------
    // 4. TIER 7-8: АСТРАЛЬНЫЙ КАМЕНЬ IV (smithing_stone_4: +7..+8)
    // --------------------------------------------------------------------------
    // Вариант A: Слиток Эфиросента (Eternal Starlight) + Осколки Эха + Катализатор Скалка (2 шт.)
    event.shaped('2x kubejs:smithing_stone_4', [
        ' M ',
        'ECE',
        ' M '
    ], {
        M: 'eternal_starlight:aethersent_ingot',
        E: 'minecraft:echo_shard',
        C: 'minecraft:sculk_catalyst'
    }).id('elyrium:crafting/smithing_stone_4_aethersent');

    // Вариант B: Слиток Големной Стали (Golem Steel Ingot) (2 шт.)
    event.shaped('2x kubejs:smithing_stone_4', [
        ' M ',
        'ECE',
        ' M '
    ], {
        M: 'eternal_starlight:golem_steel_ingot',
        E: 'minecraft:echo_shard',
        C: 'minecraft:sculk_catalyst'
    }).id('elyrium:crafting/smithing_stone_4_golem_steel');

    // Вариант C: Слиток Глубинного Серебра (Deepsilver Ingot) (2 шт.)
    event.shaped('2x kubejs:smithing_stone_4', [
        ' M ',
        'ECE',
        ' M '
    ], {
        M: 'eternal_starlight:deepsilver_ingot',
        E: 'minecraft:echo_shard',
        C: 'minecraft:sculk_catalyst'
    }).id('elyrium:crafting/smithing_stone_4_deepsilver');

    // Вариант D: Кристаллы Звездного Света (Красный + Синий) (1 шт.)
    event.shaped('1x kubejs:smithing_stone_4', [
        ' R ',
        'ECE',
        ' B '
    ], {
        R: 'eternal_starlight:red_starlight_crystal_shard',
        B: 'eternal_starlight:blue_starlight_crystal_shard',
        E: 'minecraft:echo_shard',
        C: 'minecraft:sculk_catalyst'
    }).id('elyrium:crafting/smithing_stone_4_crystals');

    // --------------------------------------------------------------------------
    // 5. TIER 9-11: БОЖЕСТВЕННЫЙ КАМЕНЬ МОРТУМА V (smithing_stone_5: +9..+10)
    // --------------------------------------------------------------------------
    // Вариант A: Самоцвет Мортума + Самоцвет Эдема + Божественные Осколки (2 шт.)
    event.shaped('2x kubejs:smithing_stone_5', [
        ' M ',
        'ESE',
        ' M '
    ], {
        M: 'divinerpg:mortum_gem',
        E: 'divinerpg:eden_gem',
        S: 'divinerpg:divine_shards'
    }).id('elyrium:crafting/smithing_stone_5_eden_mortum');

    // Вариант B: Самоцвет Мортума + Самоцвет Диколесья + Душа Мортума (2 шт.)
    event.shaped('2x kubejs:smithing_stone_5', [
        ' M ',
        'WSW',
        ' M '
    ], {
        M: 'divinerpg:mortum_gem',
        W: 'divinerpg:wildwood_gem',
        S: 'divinerpg:mortum_soul'
    }).id('elyrium:crafting/smithing_stone_5_wildwood_mortum');

    // Вариант C: Фрагменты Мортума + Фрагменты Эдема (1 шт.)
    event.shaped('1x kubejs:smithing_stone_5', [
        ' M ',
        'FDF',
        ' M '
    ], {
        M: 'divinerpg:mortum_fragments',
        F: 'divinerpg:eden_fragments',
        D: 'divinerpg:divine_shards'
    }).id('elyrium:crafting/smithing_stone_5_fragments');

    // --------------------------------------------------------------------------
    // 6. АНТИ-ОТКАТНЫЙ КАТАЛИЗАТОР: ПЕЧАТЬ ДРЕВНЕГО КУЗНЕЦА (smithing_aegis)
    // --------------------------------------------------------------------------
    // Рецепт с Звездой Незера (Nether Star):
    // 2 Незеритовых блока, 2 Осколка Эха, 2 Слитка Звездного Металла, 2 Самоцвета Эдема, 1 Звезда Незера
    event.shaped('kubejs:smithing_aegis', [
        'ENE',
        'LSL',
        'CNC'
    ], {
        E: 'minecraft:echo_shard',
        N: 'minecraft:netherite_block',
        L: 'eternal_starlight:aethersent_ingot',
        S: 'minecraft:nether_star',
        C: 'divinerpg:eden_gem'
    }).id('elyrium:crafting/smithing_aegis_nether_star');

    // Рецепт с Яйцом Дракона (Dragon Egg):
    event.shaped('kubejs:smithing_aegis', [
        'ENE',
        'LDL',
        'CNC'
    ], {
        E: 'minecraft:echo_shard',
        N: 'minecraft:netherite_block',
        L: 'eternal_starlight:aethersent_ingot',
        D: 'minecraft:dragon_egg',
        C: 'divinerpg:eden_gem'
    }).id('elyrium:crafting/smithing_aegis_dragon_egg');

    // Вариант 4 Осколка Эха + 2 Слитка + 2 Незеритовых блока + Звезда Незера
    event.shaped('kubejs:smithing_aegis', [
        'ELE',
        'NSN',
        'ELE'
    ], {
        E: 'minecraft:echo_shard',
        L: 'eternal_starlight:aethersent_ingot',
        N: 'minecraft:netherite_block',
        S: 'minecraft:nether_star'
    }).id('elyrium:crafting/smithing_aegis_echo_starlight_star');

    // Вариант 4 Осколка Эха + 2 Слитка + 2 Незеритовых блока + Яйцо Дракона
    event.shaped('kubejs:smithing_aegis', [
        'ELE',
        'NDN',
        'ELE'
    ], {
        E: 'minecraft:echo_shard',
        L: 'eternal_starlight:aethersent_ingot',
        N: 'minecraft:netherite_block',
        D: 'minecraft:dragon_egg'
    }).id('elyrium:crafting/smithing_aegis_echo_starlight_egg');

    // Вариант с Блоком Эдема (divinerpg:eden_block) и Звездой Незера
    event.shaped('kubejs:smithing_aegis', [
        'ENE',
        'LSL',
        'EBE'
    ], {
        E: 'minecraft:echo_shard',
        N: 'minecraft:netherite_block',
        L: 'eternal_starlight:aethersent_ingot',
        S: 'minecraft:nether_star',
        B: 'divinerpg:eden_block'
    }).id('elyrium:crafting/smithing_aegis_eden_block_star');
});

// ==============================================================================
// 7. ИНЪЕКЦИЯ ЛУТА С БОССОВ (BOSS LOOT INJECTION: EntityEvents.drops)
// ==============================================================================
EntityEvents.drops(event => {
    let entity = event.entity;
    if (!entity) return;

    let id = entity.type ? entity.type.toString().toLowerCase() : '';
    if (!id) return;

    let level = entity.level;
    let x = entity.x;
    let y = entity.y;
    let z = entity.z;

    // Вспомогательная функция выдачи кузнечной награды
    let grantStone = (stoneId, count, isLegendary) => {
        let stack = Item.of(stoneId, count);
        event.addDrop(stack);

        if (level && level.server) {
            let server = level.server;
            if (isLegendary) {
                server.runCommandSilent(`execute in ${level.dimension} run particle minecraft:totem_of_undying ${x} ${y + 1.2} ${z} 0.6 0.6 0.6 0.1 35`);
                server.runCommandSilent(`execute in ${level.dimension} run particle minecraft:firework ${x} ${y + 1.5} ${z} 0.5 0.5 0.5 0.15 20`);
                server.runCommandSilent(`execute in ${level.dimension} run playsound minecraft:ui.toast.challenge_complete master @a[distance=..48] ${x} ${y} ${z} 1.0 1.0`);
                server.tell(Text.of('§6⭐ [ЭЛИРИУМ] Из останков поверженного владыки явилась легендарная §lПечать Древнего Кузнеца§r§6!'));
            } else {
                server.runCommandSilent(`execute in ${level.dimension} run particle minecraft:enchant ${x} ${y + 0.8} ${z} 0.4 0.4 0.4 0.1 15`);
                server.runCommandSilent(`execute in ${level.dimension} run playsound minecraft:entity.experience_orb.pickup master @a[distance=..24] ${x} ${y} ${z} 0.8 1.2`);
            }
        }
    };

    // --------------------------------------------------------------------------
    // A. БОССЫ TIER 4 - TIER 6 (Шанс на Закалочный Камень II и Небесный Камень III)
    // --------------------------------------------------------------------------
    // Tier 4 Bosses: Netherite Monstrosity, Ignis, Harbinger, Wither, Maledictus
    let isT4Boss = (id === 'cataclysm:netherite_monstrosity' ||
                    id === 'cataclysm:ignis' ||
                    id === 'cataclysm:the_harbinger' ||
                    id === 'cataclysm:maledictus' ||
                    id === 'minecraft:wither');

    // Tier 5 Bosses: Sun Spirit, Valkyrie Queen, Slider
    let isT5Boss = (id.includes('sun_spirit') ||
                    id.includes('valkyrie_queen') ||
                    id.includes('slider') ||
                    (id.startsWith('aether:') && id.includes('boss')));

    // Tier 6 Bosses: Ender Dragon, Ender Guardian, Ender Golem, Leviathan
    let isT6Boss = (id === 'minecraft:ender_dragon' ||
                    id === 'cataclysm:ender_guardian' ||
                    id === 'cataclysm:ender_golem' ||
                    id === 'cataclysm:the_leviathan');

    if (isT4Boss) {
        // T4 Boss: 100% шанс на 1-2 Камня II, 35% шанс на Камень III
        let count2 = 1 + Math.floor(Math.random() * 2);
        grantStone('kubejs:smithing_stone_2', count2, false);

        if (Math.random() < 0.35) {
            grantStone('kubejs:smithing_stone_3', 1, false);
        }
        return;
    }

    if (isT5Boss) {
        // T5 Boss: 50% шанс на Камень II, 100% шанс на 1-2 Камня III
        if (Math.random() < 0.50) {
            grantStone('kubejs:smithing_stone_2', 1, false);
        }
        let count3 = 1 + Math.floor(Math.random() * 2);
        grantStone('kubejs:smithing_stone_3', count3, false);
        return;
    }

    if (isT6Boss) {
        // T6 Boss: 30% шанс на Камень II, 100% шанс на 2-3 Камня III
        if (Math.random() < 0.30) {
            grantStone('kubejs:smithing_stone_2', 1, false);
        }
        let count3 = 2 + Math.floor(Math.random() * 2);
        grantStone('kubejs:smithing_stone_3', count3, false);
        return;
    }

    // --------------------------------------------------------------------------
    // B. БОССЫ TIER 7 - TIER 8 (Шанс на Астральный Камень IV)
    // --------------------------------------------------------------------------
    // Tier 7: Starlight Golem, Lunar Monstrosity, Tangled Hatred, Permafrost, Gatekeeper
    let isT7Boss = (id.includes('starlight_golem') ||
                    id.includes('lunar_monstrosity') ||
                    id.includes('tangled_hatred') ||
                    id.includes('permafrost') ||
                    id.includes('the_gatekeeper') ||
                    (id.startsWith('eternal_starlight:') && id.includes('boss')));

    // Tier 8: Warden, Stalker, Sculk Snapper
    let isT8Boss = (id === 'minecraft:warden' ||
                    id.includes('stalker') ||
                    id.includes('sculk_snapper') ||
                    (id.startsWith('deeperdarker:') && (id.includes('boss') || id.includes('stalker'))));

    if (isT7Boss) {
        // T7 Boss: 100% шанс на 1-2 Астральных Камня IV
        let count4 = 1 + Math.floor(Math.random() * 2);
        grantStone('kubejs:smithing_stone_4', count4, false);
        return;
    }

    if (isT8Boss) {
        // T8 Boss: 100% шанс на 2-3 Астральных Камня IV
        let count4 = 2 + Math.floor(Math.random() * 2);
        grantStone('kubejs:smithing_stone_4', count4, false);
        return;
    }

    // --------------------------------------------------------------------------
    // C. БОССЫ TIER 9 - TIER 11 (Шанс на Камень Мортума V и Печать Древнего Кузнеца)
    // --------------------------------------------------------------------------
    // Tier 9 Bosses: Parasect, Wildwood Golem, Densos
    let isT9Boss = (id.includes('parasect') ||
                    id.includes('wildwood_golem') ||
                    id.includes('densos'));

    // Tier 10 Bosses: Vamacheron, Karot, Soul Stealer, Soul Fiend, Twilight Demon
    let isT10Boss = (id.includes('vamacheron') ||
                     id.includes('karot') ||
                     id.includes('soul_stealer') ||
                     id.includes('soul_fiend') ||
                     id.includes('twilight_demon'));

    // Tier 11 Bosses: Ancient Entity, Reyvor, The Eye
    let isT11Boss = (id.includes('ancient_entity') ||
                     id.includes('reyvor') ||
                     id.includes('the_eye') ||
                     (id.startsWith('divinerpg:') && id.includes('mortum') && id.includes('boss')));

    if (isT9Boss) {
        // T9 Boss: 75% шанс на 1-2 Камня Мортума V, 8% шанс на Печать Кузнеца (Aegis)
        if (Math.random() < 0.75) {
            let count5 = 1 + Math.floor(Math.random() * 2);
            grantStone('kubejs:smithing_stone_5', count5, false);
        }
        if (Math.random() < 0.08) {
            grantStone('kubejs:smithing_aegis', 1, true);
        }
        return;
    }

    if (isT10Boss) {
        // T10 Boss: 100% шанс на 1-3 Камня Мортума V, 15% шанс на Печать Кузнеца (Aegis)
        let count5 = 1 + Math.floor(Math.random() * 3);
        grantStone('kubejs:smithing_stone_5', count5, false);

        if (Math.random() < 0.15) {
            grantStone('kubejs:smithing_aegis', 1, true);
        }
        return;
    }

    if (isT11Boss) {
        // T11 Boss: 100% шанс на 2-4 Камня Мортума V, 35% шанс на Печать Кузнеца (Aegis)
        let count5 = 2 + Math.floor(Math.random() * 3);
        grantStone('kubejs:smithing_stone_5', count5, false);

        if (Math.random() < 0.35) {
            grantStone('kubejs:smithing_aegis', 1, true);
        }
        return;
    }
});
