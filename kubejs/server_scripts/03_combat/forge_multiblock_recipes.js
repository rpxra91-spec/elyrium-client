// ==============================================================================
// 🔨 ELYRIUM RPG: FORGE MULTIBLOCK RECIPES (TIER 0 OVERWORLD CRAFTING)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// Allows crafting the basic modular workshop components on day 1:
// - Кузнечный Горн (Forge Hearth): 8 булыжника/сланца + уголь.
// - Стол Кузнеца (Smithing Bench): 4 доски + 2 слитка (железо/медь/кремень).
// ==============================================================================

ServerEvents.recipes(event => {
    // 1. КУЗНЕЧНЫЙ ГОРН (Coal recipe)
    event.shaped('kubejs:forge_hearth', [
        'CCC',
        'CFC',
        'CCC'
    ], {
        C: '#minecraft:stone_tool_materials',
        F: 'minecraft:coal'
    }).id('elyrium:crafting/forge_hearth_coal');

    // 2. КУЗНЕЧНЫЙ ГОРН (Charcoal recipe)
    event.shaped('kubejs:forge_hearth', [
        'CCC',
        'CFC',
        'CCC'
    ], {
        C: '#minecraft:stone_tool_materials',
        F: 'minecraft:charcoal'
    }).id('elyrium:crafting/forge_hearth_charcoal');

    // 3. КУЗНЕЧНЫЙ ГОРН (Furnace + Clay/Iron alternate)
    event.shaped('kubejs:forge_hearth', [
        'III',
        'CFC',
        'CCC'
    ], {
        I: 'minecraft:iron_ingot',
        C: 'minecraft:clay_ball',
        F: 'minecraft:furnace'
    }).id('elyrium:crafting/forge_hearth_furnace');

    // 4. СТОЛ КУЗНЕЦА (Iron Ingots)
    event.shaped('kubejs:smithing_bench', [
        'II ',
        'PP ',
        'PP '
    ], {
        I: 'minecraft:iron_ingot',
        P: '#minecraft:planks'
    }).id('elyrium:crafting/smithing_bench_iron');

    // 5. СТОЛ КУЗНЕЦА (Copper Ingots - Early Camp)
    event.shaped('kubejs:smithing_bench', [
        'CC ',
        'PP ',
        'PP '
    ], {
        C: 'minecraft:copper_ingot',
        P: '#minecraft:planks'
    }).id('elyrium:crafting/smithing_bench_copper');

    // 6. СТОЛ КУЗНЕЦА (Flint - Primitive Starter)
    event.shaped('kubejs:smithing_bench', [
        'FF ',
        'PP ',
        'PP '
    ], {
        F: 'minecraft:flint',
        P: '#minecraft:planks'
    }).id('elyrium:crafting/smithing_bench_flint');
});
