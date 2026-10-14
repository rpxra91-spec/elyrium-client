// ==============================================================================
// 🔨 ELYRIUM RPG: FORGE MULTIBLOCK RECIPES (TIER 0 OVERWORLD CRAFTING)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// Allows crafting the basic modular workshop components on day 1:
// - Кузнечный Горн (Forge Hearth): 8 булыжника/сланца + уголь.
// - Стол Кузнеца (Smithing Bench): 4 доски + 2 слитка (железо/медь/кремень).
// ==============================================================================

// NOTE: Legacy recipes disabled. Workstations (blacksmith_workbench, blacksmith_hearth)
// are registered and crafted via steel_metallurgy_recipes.js in v0.4.35+
ServerEvents.recipes(event => {
    // Legacy recipes replaced by steel_metallurgy_recipes.js:
    // kubejs:blacksmith_workbench, kubejs:blacksmith_hearth, kubejs:infernal_crucible, kubejs:void_anvil
});

