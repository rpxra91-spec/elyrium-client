// ==============================================================================
// 🏛️ ELYRIUM RPG: ECONOMY, WAYSTONES OVERHAUL & CRAFTING RESTRICTIONS
// Minecraft 1.21.1 NeoForge | KubeJS Server Script (Subphase 6.4)
// ==============================================================================
// 1. Remove all crafting recipes for Waystones:
//    - Waystones can NOT be crafted by players.
//    - They can only be discovered in Capital (0,0), Towns, Taverns, and Dungeon Gates.
// ==============================================================================

ServerEvents.recipes(event => {
    // 1. Remove all crafting recipes for Waystones mod
    event.remove({ mod: 'waystones', type: 'minecraft:crafting_shaped' })
    event.remove({ mod: 'waystones', type: 'minecraft:crafting_shapeless' })

    // Also remove any waystone crafting recipes targeting waystone items
    event.remove({ output: '#waystones:waystones' })
    event.remove({ output: 'waystones:waystone' })
    event.remove({ output: 'waystones:mossy_waystone' })
    event.remove({ output: 'waystones:sandy_waystone' })
    event.remove({ output: 'waystones:warp_stone' })
    event.remove({ output: 'waystones:warp_plate' })
    event.remove({ output: 'waystones:portstone' })
    event.remove({ output: 'waystones:sharestone' })
})
