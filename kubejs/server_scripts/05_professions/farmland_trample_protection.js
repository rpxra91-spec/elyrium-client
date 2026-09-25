// priority: 10
// ==============================================================================
// 🌾 ELYRIUM RPG: FARMLAND TRAMPLE PROTECTION ENGINE
// ==============================================================================
// Unlocked via Celestial Skill Tree: Класс "Мастер Земледелия" (side_farmer_class)
// Tag: 'skill_farmer_farmland_protection'
//
// 1. Players with this perk never trample farmland when running or jumping.
// 2. Farm areas within 32 blocks of an active Master Farmer are also protected
//    from mobs, animals, and stray entities trampling crops.
// ==============================================================================

BlockEvents.farmlandTrampled(event => {
    let entity = event.entity

    // 1. Direct player check
    if (entity && entity.isPlayer()) {
        if (entity.tags && entity.tags.contains('skill_farmer_farmland_protection')) {
            event.cancel()
            return
        }
    }

    // 2. Mobs / Animals protection near Master Farmer
    let level = event.level
    if (level && !level.isClientSide()) {
        let block = event.block
        let pos = block ? block.pos : null
        if (pos) {
            let nearby = level.getEntitiesWithin(AABB.of(pos.x - 32, pos.y - 8, pos.z - 32, pos.x + 32, pos.y + 8, pos.z + 32))
            for (let ent of nearby) {
                if (ent.isPlayer() && ent.tags && ent.tags.contains('skill_farmer_farmland_protection')) {
                    event.cancel()
                    return
                }
            }
        }
    }
})
