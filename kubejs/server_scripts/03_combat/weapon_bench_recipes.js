// ==============================================================================
// 🛠️ ELYRIUM RPG: WEAPONMASTER'S BENCH & CHISEL CRAFTING RECIPES
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// Tier 4 (Nether) Canonical Crafting Gating:
// - Weaponmaster's Bench is crafted using smithing apparatus & Netherite/Cinder alloy.
// - Weaponmaster's Chisel is crafted using diamond edge & Netherite/Cinder shank.
// ==============================================================================

ServerEvents.recipes(event => {
    // --------------------------------------------------------------------------
    // 1. WEAPONMASTER'S BENCH (kubejs:weapon_bench) - TIER 4 NETHER
    // --------------------------------------------------------------------------

    // 1.1 Recipe via Netherite Scrap
    event.shaped('kubejs:weapon_bench', [
        'SGB',
        'PNP',
        'B B'
    ], {
        S: 'minecraft:smithing_table',
        G: 'minecraft:grindstone',
        B: 'minecraft:iron_block',
        P: 'minecraft:polished_blackstone',
        N: 'minecraft:netherite_scrap'
    }).id('elyrium:crafting/weapon_bench_netherite');

    // 1.2 Recipe via Cinder Alloy Ingot
    event.shaped('kubejs:weapon_bench', [
        'SGB',
        'PCP',
        'B B'
    ], {
        S: 'minecraft:smithing_table',
        G: 'minecraft:grindstone',
        B: 'minecraft:iron_block',
        P: 'minecraft:polished_blackstone',
        C: 'skd:cinder_alloy_ingot'
    }).id('elyrium:crafting/weapon_bench_cinder');

    // --------------------------------------------------------------------------
    // 2. WEAPONMASTER'S CHISEL (kubejs:weapon_chisel) - TIER 4 NETHER
    // --------------------------------------------------------------------------

    // 2.1 Recipe via Netherite Scrap
    event.shaped('kubejs:weapon_chisel', [
        '  D',
        ' N ',
        'S  '
    ], {
        D: 'minecraft:diamond',
        N: 'minecraft:netherite_scrap',
        S: 'minecraft:stick'
    }).id('elyrium:crafting/weapon_chisel_netherite');

    // 2.2 Recipe via Cinder Alloy Ingot
    event.shaped('kubejs:weapon_chisel', [
        '  D',
        ' C ',
        'S  '
    ], {
        D: 'minecraft:diamond',
        C: 'skd:cinder_alloy_ingot',
        S: 'minecraft:stick'
    }).id('elyrium:crafting/weapon_chisel_cinder');
});
