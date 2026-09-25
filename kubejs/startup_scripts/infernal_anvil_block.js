// ==============================================================================
// 🔥 ELYRIUM RPG: INFERNAL ANVIL (АДСКАЯ НАКОВАЛЬНЯ)
// Minecraft 1.21.1 NeoForge | KubeJS Startup Script
// ==============================================================================

StartupEvents.registry('block', event => {
    event.create('infernal_anvil')
        .displayName('§c🔥 Адская Наковальня')
        .soundType('anvil')
        .hardness(50.0)
        .resistance(1200.0)
        .requiresTool(true)
        .tagBlock('minecraft:mineable/pickaxe')
        .tagBlock('minecraft:needs_diamond_tool')
        .lightLevel(0.6)
        .fullBlock(false)
        .notSolid()
        .box(2, 0, 2, 14, 16, 14)
        .property(BlockProperties.HORIZONTAL_FACING)
        .defaultState(state => state.set(BlockProperties.HORIZONTAL_FACING, Direction.NORTH))
        .placementState(state => state.set(BlockProperties.HORIZONTAL_FACING, state.horizontalDirection.clockWise));
});
