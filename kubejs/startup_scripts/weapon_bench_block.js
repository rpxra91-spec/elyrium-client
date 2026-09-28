// ==============================================================================
// 🛠️ ELYRIUM RPG: WEAPONMASTER'S BENCH (ОРУЖЕЙНЫЙ СТОЛ)
// Minecraft 1.21.1 NeoForge | KubeJS Startup Script
// ==============================================================================

StartupEvents.registry('block', event => {
    event.create('weapon_bench')
        .displayName('§6🛠 Оружейный Стол')
        .soundType('stone')
        .hardness(5.0)
        .resistance(1200.0)
        .requiresTool(true)
        .tagBlock('minecraft:mineable/pickaxe')
        .tagBlock('minecraft:mineable/axe')
        .fullBlock(false)
        .notSolid()
        .box(0, 0, 0, 16, 16, 16)
        .property(BlockProperties.HORIZONTAL_FACING)
        .defaultState(state => state.set(BlockProperties.HORIZONTAL_FACING, Direction.NORTH))
        .placementState(state => state.set(BlockProperties.HORIZONTAL_FACING, state.horizontalDirection.opposite));
});
