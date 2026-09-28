// ==============================================================================
// 💎 ELYRIUM RPG: ELEMENTAL STONES CRAFTING RECIPES
// ==============================================================================
// Tier 4+ Elemental Infusion Stones recipes for Weaponmaster's Bench.
// Authentic components tied to dimensional progression:
// - Fire: Nether Fire Charge, Blaze Rod / Powder, Cinder Alloy
// - Frost: Glacial Blue Ice, Amethyst, Packed Ice
// - Lightning: Lightning Rod, Copper, Glowstone Dust
// - Shadow: Crying Obsidian, Wither/Void Essence, Obsidian
// - Holy: Golden Apple, Amethyst, Sacred Radiance
// ==============================================================================

ServerEvents.recipes(event => {

    // --------------------------------------------------------------------------
    // 1. КАМЕНЬ СТИХИИ: ПЛАМЯ (FIRE)
    // --------------------------------------------------------------------------
    event.shaped('kubejs:elemental_stone_fire', [
        ' B ',
        'FSF',
        ' B '
    ], {
        B: 'minecraft:blaze_powder',
        F: 'minecraft:fire_charge',
        S: 'minecraft:magma_block'
    }).id('elyrium:crafting/elemental_stone_fire');

    // --------------------------------------------------------------------------
    // 2. КАМЕНЬ СТИХИИ: ЛЕД (FROST)
    // --------------------------------------------------------------------------
    event.shaped('kubejs:elemental_stone_frost', [
        ' I ',
        'ASA',
        ' I '
    ], {
        I: 'minecraft:blue_ice',
        A: 'minecraft:amethyst_shard',
        S: 'minecraft:packed_ice'
    }).id('elyrium:crafting/elemental_stone_frost');

    // --------------------------------------------------------------------------
    // 3. КАМЕНЬ СТИХИИ: МОЛНИЯ (LIGHTNING)
    // --------------------------------------------------------------------------
    event.shaped('kubejs:elemental_stone_lightning', [
        ' L ',
        'GCG',
        ' L '
    ], {
        L: 'minecraft:lightning_rod',
        G: 'minecraft:glowstone_dust',
        C: 'minecraft:copper_ingot'
    }).id('elyrium:crafting/elemental_stone_lightning');

    // --------------------------------------------------------------------------
    // 4. КАМЕНЬ СТИХИИ: БЕЗДНА (SHADOW)
    // --------------------------------------------------------------------------
    event.shaped('kubejs:elemental_stone_shadow', [
        ' C ',
        'OSO',
        ' C '
    ], {
        C: 'minecraft:crying_obsidian',
        O: 'minecraft:obsidian',
        S: 'minecraft:ender_pearl'
    }).id('elyrium:crafting/elemental_stone_shadow');

    // --------------------------------------------------------------------------
    // 5. КАМЕНЬ СТИХИИ: СВЯТОСТЬ (HOLY)
    // --------------------------------------------------------------------------
    event.shaped('kubejs:elemental_stone_holy', [
        ' G ',
        'ADA',
        ' G '
    ], {
        G: 'minecraft:golden_apple',
        A: 'minecraft:amethyst_shard',
        D: 'minecraft:diamond'
    }).id('elyrium:crafting/elemental_stone_holy');

});
