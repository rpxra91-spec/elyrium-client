// ==============================================================================
// 🔮 ELYRIUM RPG: RUNIC INSCRIPTION TABLE BLOCK REGISTRY (STARTUP SCRIPT)
// Minecraft 1.21.1 NeoForge | KubeJS Startup Script
// ==============================================================================
// Dedicated Physical Workstation for Ancient Runic Inscription & Synthesis.
// Features:
// - Custom 3D VoxelShape (Slate pedestal, central pillar, table top, lectern).
// - Emits faint runic light (lightLevel 6).
// - Horizontal facing support.
// - Pure ARPG interaction: right-click opens the custom Runic Scriptorium GUI.
// ==============================================================================

StartupEvents.registry('block', event => {

    event.create('runic_table')
        .displayName('§5🔮 Стол Рунного Начертания')
        .soundType('deepslate')
        .hardness(3.5)
        .resistance(10.0)
        .requiresTool(true)
        .tagBlock('minecraft:mineable/pickaxe')
        .fullBlock(false)
        .notSolid()
        .lightLevel(0.4) // Light level 6
        .box(1, 0, 1, 15, 2, 15)   // Нижний постамент
        .box(3, 2, 3, 13, 10, 13)  // Центральная колонна
        .box(0, 10, 0, 16, 13, 16) // Столешница из темного сланца
        .box(2, 13, 2, 14, 16, 14) // Фолиант начертания и чернильница
        .property(BlockProperties.HORIZONTAL_FACING)
        .defaultState(state => state.set(BlockProperties.HORIZONTAL_FACING, Direction.NORTH))
        .placementState(state => state.set(BlockProperties.HORIZONTAL_FACING, state.horizontalDirection.opposite));
});
