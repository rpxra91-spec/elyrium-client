// ==============================================================================
// 💎 ELYRIUM RPG: 4-RANK ELEMENTAL STONES CRAFTING & UPGRADE RECIPES (v0.4.33)
// ==============================================================================
// Authentic components tied to dimensional progression:
// - Rank I (Common): Craftable from base dimensional elements.
// - Rank II (Uncommon): Rank I + Iron / Steel Ingot (x4)
// - Rank III (Rare): Rank II + Netherite Ingot / Cinder Alloy (x1)
// - Rank IV (Epic): Rank III + Aether Zanite / Gravitite (x2)
// ==============================================================================

ServerEvents.recipes(event => {

    const ELEMENTS = ['fire', 'frost', 'lightning', 'shadow', 'holy', 'nature'];

    // --------------------------------------------------------------------------
    // 1. BASE RECIPES: RANK I (Треснувшие Камни)
    // --------------------------------------------------------------------------

    // Пламя (Fire)
    event.shaped('kubejs:elemental_stone_fire', [
        ' B ',
        'FSF',
        ' B '
    ], {
        B: 'minecraft:blaze_powder',
        F: 'minecraft:fire_charge',
        S: 'minecraft:magma_block'
    }).id('elyrium:crafting/elemental_stone_fire_1');

    // Лед (Frost)
    event.shaped('kubejs:elemental_stone_frost', [
        ' I ',
        'ASA',
        ' I '
    ], {
        I: 'minecraft:blue_ice',
        A: 'minecraft:amethyst_shard',
        S: 'minecraft:packed_ice'
    }).id('elyrium:crafting/elemental_stone_frost_1');

    // Молния (Lightning)
    event.shaped('kubejs:elemental_stone_lightning', [
        ' L ',
        'GCG',
        ' L '
    ], {
        L: 'minecraft:lightning_rod',
        G: 'minecraft:glowstone_dust',
        C: 'minecraft:copper_ingot'
    }).id('elyrium:crafting/elemental_stone_lightning_1');

    // Бездна (Shadow)
    event.shaped('kubejs:elemental_stone_shadow', [
        ' C ',
        'OSO',
        ' C '
    ], {
        C: 'minecraft:crying_obsidian',
        O: 'minecraft:obsidian',
        S: 'minecraft:ender_pearl'
    }).id('elyrium:crafting/elemental_stone_shadow_1');

    // Свет (Holy)
    event.shaped('kubejs:elemental_stone_holy', [
        ' G ',
        'ADA',
        ' G '
    ], {
        G: 'minecraft:golden_apple',
        A: 'minecraft:amethyst_shard',
        D: 'minecraft:diamond'
    }).id('elyrium:crafting/elemental_stone_holy_1');

    // Природа (Nature)
    event.shaped('kubejs:elemental_stone_nature', [
        ' V ',
        'EHE',
        ' V '
    ], {
        V: 'minecraft:vine',
        E: 'minecraft:emerald',
        H: 'minecraft:heart_of_the_sea'
    }).id('elyrium:crafting/elemental_stone_nature_1');


    // --------------------------------------------------------------------------
    // 2. UPGRADE RECIPES: RANK I ➔ RANK II (Железо / Сталь x4)
    // --------------------------------------------------------------------------
    ELEMENTS.forEach(elem => {
        event.shaped(`kubejs:elemental_stone_${elem}_2`, [
            ' M ',
            'MSM',
            ' M '
        ], {
            S: `kubejs:elemental_stone_${elem}`,
            M: 'minecraft:iron_ingot'
        }).id(`elyrium:crafting/elemental_stone_${elem}_upgrade_2`);
    });

    // --------------------------------------------------------------------------
    // 3. UPGRADE RECIPES: RANK II ➔ RANK III (Незерит x1)
    // --------------------------------------------------------------------------
    ELEMENTS.forEach(elem => {
        event.shapeless(`kubejs:elemental_stone_${elem}_3`, [
            `kubejs:elemental_stone_${elem}_2`,
            'minecraft:netherite_ingot'
        ]).id(`elyrium:crafting/elemental_stone_${elem}_upgrade_3`);
    });

    // --------------------------------------------------------------------------
    // 4. UPGRADE RECIPES: RANK III ➔ RANK IV (Занит Эфира x2)
    // --------------------------------------------------------------------------
    ELEMENTS.forEach(elem => {
        event.shapeless(`kubejs:elemental_stone_${elem}_4`, [
            `kubejs:elemental_stone_${elem}_3`,
            'aether:zanite_gemstone',
            'aether:zanite_gemstone'
        ]).id(`elyrium:crafting/elemental_stone_${elem}_upgrade_4`);
    });

});
