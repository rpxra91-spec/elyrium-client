// ==============================================================================
// 🚫 ELYRIUM RPG: MIGRATE EQUIPMENT CRAFTING FROM WORKBENCH TO FORGE
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// Frees the vanilla crafting table from metal armor, swords, shields, and bows:
// - Vanilla workbench remains for camp & survival needs (torches, chests, furnaces, campfires, food).
// - Metal armor, shields, weapons, and tools are forged exclusively at the Smithing Bench (Стол Кузнеца)
//   with the heat of the Forge Hearth (Кузнечный Горн)!
// - Primitive starter items (wood, stone, flint) remain untouched.
// ==============================================================================

ServerEvents.recipes(event => {
    const REMOVED_EQUIPMENT = [
        // Iron Equipment
        'minecraft:iron_helmet',
        'minecraft:iron_chestplate',
        'minecraft:iron_leggings',
        'minecraft:iron_boots',
        'minecraft:iron_sword',
        'minecraft:iron_axe',
        'minecraft:iron_pickaxe',
        'minecraft:iron_shovel',
        'minecraft:iron_hoe',

        // Golden Equipment
        'minecraft:golden_helmet',
        'minecraft:golden_chestplate',
        'minecraft:golden_leggings',
        'minecraft:golden_boots',
        'minecraft:golden_sword',
        'minecraft:golden_axe',
        'minecraft:golden_pickaxe',
        'minecraft:golden_shovel',
        'minecraft:golden_hoe',

        // Diamond Equipment
        'minecraft:diamond_helmet',
        'minecraft:diamond_chestplate',
        'minecraft:diamond_leggings',
        'minecraft:diamond_boots',
        'minecraft:diamond_sword',
        'minecraft:diamond_axe',
        'minecraft:diamond_pickaxe',
        'minecraft:diamond_shovel',
        'minecraft:diamond_hoe',

        // Shields & Ranged
        'minecraft:shield',
        'minecraft:bow',
        'minecraft:crossbow'
    ];

    REMOVED_EQUIPMENT.forEach(itemId => {
        // Only remove standard crafting table (shaped/shapeless) recipes
        event.remove({ output: itemId, type: 'minecraft:crafting_shaped' });
        event.remove({ output: itemId, type: 'minecraft:crafting_shapeless' });
    });
});
