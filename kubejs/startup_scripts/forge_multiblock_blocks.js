// ==============================================================================
// 🔥 ELYRIUM RPG: FORGE MULTIBLOCK STATIONS (STARTUP SCRIPT)
// Minecraft 1.21.1 NeoForge | KubeJS Startup Script
// ==============================================================================
// Registers the modular multiblock components of the Elyrium Forge:
// 1. kubejs:forge_hearth («Кузнечный Горн»):
//    - High heat generation for metallurgy and crystal tempering.
//    - Light level 12 (0.8), stone/metal sound, custom collision box.
// 2. kubejs:smithing_bench («Стол Кузнеца»):
//    - Primary workshop workstation for crafting metal/crystal gear,
//      shields, weapons, tools, and staves.
//    - Adjacency to Forge Hearth activates metallurgical crafting.
//    - Adjacency to Anvil unlocks Reinforcement (+1..+10) & Ascension tabs.
// ==============================================================================

StartupEvents.registry('block', event => {
    // 1. КУЗНЕЧНЫЙ ГОРН (Forge Hearth)
    event.create('forge_hearth')
        .displayName('§c🔥 Кузнечный Горн')
        .soundType('stone')
        .hardness(3.5)
        .resistance(12.0)
        .requiresTool(true)
        .tagBlock('minecraft:mineable/pickaxe')
        .lightLevel(0.8) // Level 12 / 15
        .fullBlock(false)
        .notSolid()
        .box(0, 0, 0, 16, 14, 16)
        .property(BlockProperties.HORIZONTAL_FACING)
        .defaultState(state => state.set(BlockProperties.HORIZONTAL_FACING, Direction.NORTH))
        .placementState(state => state.set(BlockProperties.HORIZONTAL_FACING, state.horizontalDirection.opposite));

    // 2. СТОЛ КУЗНЕЦА (Smithing Bench)
    event.create('smithing_bench')
        .displayName('§6⚒ Стол Кузнеца')
        .soundType('wood')
        .hardness(2.5)
        .resistance(6.0)
        .requiresTool(false)
        .tagBlock('minecraft:mineable/axe')
        .tagBlock('minecraft:mineable/pickaxe')
        .fullBlock(false)
        .notSolid()
        .box(0, 0, 0, 16, 16, 16)
        .property(BlockProperties.HORIZONTAL_FACING)
        .defaultState(state => state.set(BlockProperties.HORIZONTAL_FACING, Direction.NORTH))
        .placementState(state => state.set(BlockProperties.HORIZONTAL_FACING, state.horizontalDirection.opposite));
});
