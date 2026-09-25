// KubeJS Script: MineColonies Dynamic Safe Zone (Town Hall Height Relative)
// 1. Completely blocks natural monster spawns inside colony above (TownHall_Y - 15)
// 2. Blocks Phantoms (Фантомы) from harassing players building in the colony!
// 3. Leaves deep underground caves below (TownHall_Y - 15) alive for mining and farming.
// 4. Fully allows official raids and siege enemies to spawn!

EntityEvents.checkSpawn(event => {
    let entity = event.entity
    if (!entity || !entity.isLiving() || entity.isPlayer()) return

    let type = entity.type.toString()

    // Hostile monsters check (including Phantoms / Фантомы!)
    let isHostile = entity.isMonster() || type.includes('phantom') ||
                    type.includes('zombie') || type.includes('skeleton') || 
                    type.includes('creeper') || type.includes('spider') || 
                    type.includes('witch') || type.includes('enderman') || 
                    type.includes('slime')

    if (!isHostile) return

    // Never cancel official raiders from MineColonies or custom raid mobs
    if (type.includes('minecolonies:') || type.includes('raider')) return

    // Check colony territory and Town Hall relative height
    try {
        let ColonyManager = Java.loadClass('com.minecolonies.api.colony.IColonyManager').getInstance()
        if (ColonyManager) {
            let level = event.level.minecraftLevel
            let pos = event.entity.blockPosition()
            let colony = ColonyManager.getIColony(level, pos)

            if (colony) {
                let centerPos = colony.getCenter()
                let townHallY = centerPos ? centerPos.getY() : 64

                // Safe zone applies to surface, sky (Phantoms), buildings and basements down to (TownHall - 10)
                if (pos.getY() >= (townHallY - 10)) {
                    event.cancel()
                }
                // Deep caves below (TownHall - 10) keep spawning mobs normally!
            }
        }
    } catch (e) {
        // Fallback
    }
})
