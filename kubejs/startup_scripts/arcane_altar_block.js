// ==============================================================================
// 🔮 ELYRIUM RPG: ARCANE ALTAR OF THE ARCHMAGE (STARTUP SCRIPT)
// Minecraft 1.21.1 NeoForge | KubeJS Startup Script
// ==============================================================================
// Registers the 3rd Workstation of the Nether Triad:
// - kubejs:arcane_altar («Магический Алтарь Чародея», Tier 4 Nether Triad)
// - Dedicated 3D workstation for Staff, Wand, Grimoire & Hybrid Weapon spell tuning.
// - 1-Click Iron's Spells scroll inscription & safe extraction.
// - Dynamic Spell Capacity & Weight monitoring.
// - Innate spell protection & elemental resonance calculation.
// ==============================================================================

StartupEvents.registry('block', event => {
    event.create('arcane_altar')
        .displayName('§d🔮 Магический Алтарь Чародея')
        .soundType('amethyst')
        .hardness(4.0)
        .resistance(15.0)
        .requiresTool(true)
        .tagBlock('minecraft:mineable/pickaxe')
        .lightLevel(0.7)
        .fullBlock(false)
        .notSolid()
        .box(1, 0, 1, 15, 2, 15)
        .box(3, 2, 3, 13, 10, 13)
        .box(0, 10, 0, 16, 13, 16)
        .box(2, 13, 2, 14, 16, 14)
        .property(BlockProperties.HORIZONTAL_FACING)
        .defaultState(state => state.set(BlockProperties.HORIZONTAL_FACING, Direction.NORTH))
        .placementState(state => state.set(BlockProperties.HORIZONTAL_FACING, state.horizontalDirection.opposite));
});
