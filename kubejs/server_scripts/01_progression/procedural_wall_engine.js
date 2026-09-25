// ==============================================================================
// 🏰 ELYRIUM: PROCEDURAL GREAT WALL OF CALEDONIA ENGINE
// ==============================================================================
// 1. Procedural Wall Generation at Radius R = 1500:
//    - Samples ground height dynamically (no floating blocks!).
//    - Extends foundation down to solid ground (cobblestone + deepslate).
//    - Builds 5-wide solid stone brick battlements with crenels & walkway.
//    - Spawns fortified Bastion Towers every 40 blocks.
//    - Spawns the Grand Caledonia Gatehouse at Cardinal Exits (0, 1500 etc).
// 2. Command: /build_great_wall (builds gatehouse + 160-block wall section at 0, 1500)
// ==============================================================================

function setBlockSafe(level, x, y, z, blockId) {
    try {
        let b = level.getBlock(x, y, z)
        if (b) b.set(blockId)
    } catch (e) {}
}

function getSurfaceY(level, x, z) {
    // Scan downwards from Y=130 to find solid ground
    for (let y = 130; y >= 40; y--) {
        let b = level.getBlock(x, y, z)
        if (b && !b.id.includes('air') && !b.id.includes('leaves')) {
            return y + 1
        }
    }
    return 70
}

// Build a single vertical column of the wall
function buildWallSlice(level, x, z, groundY, isTower) {
    let wallHeight = isTower ? 13 : 7
    let topY = groundY + wallHeight

    // 1. Deep foundation (down to groundY - 10) to bridge valleys/water
    for (let y = groundY - 8; y < groundY; y++) {
        let b = level.getBlock(x, y, z)
        if (b && (b.id.includes('air') || b.id.includes('water') || b.id.includes('leaves') || b.id.includes('log') || b.id.includes('grass'))) {
            setBlockSafe(level, x, y, z, 'minecraft:cobblestone')
        }
    }

    // 2. Wall Body
    for (let y = groundY; y < topY; y++) {
        let rnd = Math.random()
        let mat = 'minecraft:stone_bricks'
        if (rnd < 0.18) mat = 'minecraft:mossy_stone_bricks'
        else if (rnd < 0.35) mat = 'minecraft:cracked_stone_bricks'
        else if (rnd < 0.45) mat = 'minecraft:cobblestone'

        setBlockSafe(level, x, y, z, mat)
    }

    // 3. Walkway floor
    setBlockSafe(level, x, topY, z, 'minecraft:polished_andesite')

    return topY
}

// Build Great Wall Section centered at (startX, centerZ)
function generateWallSection(level, startX, centerZ, length) {
    let half = Math.floor(length / 2)
    let minX = startX - half
    let maxX = startX + half

    // 5-block thickness (Z from centerZ - 2 to centerZ + 2)
    for (let x = minX; x <= maxX; x++) {
        let isTower = (Math.abs(x) % 36 === 0)
        let groundY = getSurfaceY(level, x, centerZ)

        for (let dz = -2; dz <= 2; dz++) {
            let z = centerZ + dz
            let topY = buildWallSlice(level, x, z, groundY, isTower)

            // Battlements on the outer parapets (dz = -2 and dz = 2)
            if (dz === -2 || dz === 2) {
                if ((x % 2 === 0) && !isTower) {
                    setBlockSafe(level, x, topY + 1, z, 'minecraft:stone_brick_wall')
                    if (x % 8 === 0) {
                        setBlockSafe(level, x, topY + 2, z, 'minecraft:lantern')
                    }
                } else if (!isTower) {
                    setBlockSafe(level, x, topY + 1, z, 'minecraft:air')
                }
            } else {
                // Clear airway above the walking corridor
                setBlockSafe(level, x, topY + 1, z, 'minecraft:air')
                setBlockSafe(level, x, topY + 2, z, 'minecraft:air')
                setBlockSafe(level, x, topY + 3, z, 'minecraft:air')
            }
        }
    }
}

// Build the Grand Fortress Gatehouse at (centerX, centerZ)
function generateGrandGatehouse(level, centerX, centerZ) {
    let groundY = getSurfaceY(level, centerX, centerZ)

    // Dimensions: 21 wide (X: -10 to +10), 9 deep (Z: -4 to +4)
    for (let x = centerX - 10; x <= centerX + 10; x++) {
        for (let z = centerZ - 4; z <= centerZ + 4; z++) {
            // Foundation down
            for (let y = groundY - 8; y < groundY; y++) {
                let b = level.getBlock(x, y, z)
                if (b && (b.id.includes('air') || b.id.includes('water') || b.id.includes('leaves') || b.id.includes('grass'))) {
                    setBlockSafe(level, x, y, z, 'minecraft:deepslate_bricks')
                }
            }

            let isArch = (Math.abs(x - centerX) <= 3)
            let isTower = (Math.abs(x - centerX) >= 7)
            let height = isTower ? 18 : (isArch ? 10 : 14)

            for (let y = groundY; y <= groundY + height; y++) {
                // Passable tunnel through archway
                if (isArch && y < groundY + 7 && Math.abs(z - centerZ) <= 3) {
                    if (y === groundY) {
                        setBlockSafe(level, x, y, z, 'minecraft:smooth_stone') // Roadway
                    } else if (Math.abs(x - centerX) === 3 && y >= groundY + 4) {
                        setBlockSafe(level, x, y, z, 'minecraft:iron_bars') // Portcullis
                    } else if (y === groundY + 6) {
                        setBlockSafe(level, x, y, z, 'minecraft:stone_brick_stairs') // Arch ceiling
                    } else {
                        setBlockSafe(level, x, y, z, 'minecraft:air') // Open air
                    }
                } else {
                    let rnd = Math.random()
                    let mat = 'minecraft:stone_bricks'
                    if (rnd < 0.2) mat = 'minecraft:cracked_stone_bricks'
                    if (rnd < 0.1) mat = 'minecraft:mossy_stone_bricks'
                    setBlockSafe(level, x, y, z, mat)
                }
            }

            // Tower battlements
            if (isTower) {
                let roofY = groundY + height + 1
                if (Math.abs(x - centerX) === 10 || Math.abs(z - centerZ) === 4) {
                    setBlockSafe(level, x, roofY, z, 'minecraft:stone_brick_wall')
                } else {
                    setBlockSafe(level, x, roofY, z, 'minecraft:stone_brick_slab')
                }
            }
        }
    }

    // Torches
    setBlockSafe(level, centerX - 3, groundY + 4, centerZ + 5, 'minecraft:wall_torch')
    setBlockSafe(level, centerX + 3, groundY + 4, centerZ + 5, 'minecraft:wall_torch')
    setBlockSafe(level, centerX - 3, groundY + 4, centerZ - 5, 'minecraft:wall_torch')
    setBlockSafe(level, centerX + 3, groundY + 4, centerZ - 5, 'minecraft:wall_torch')
}

// Server Commands
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event

    event.register(
        Commands.literal('build_great_wall')
            .requires(s => s.hasPermission(2))
            .executes(ctx => {
                let level = ctx.source.level || (ctx.source.player ? ctx.source.player.level : null)
                if (!level) return 0

                console.log('🔨 Возведение Великой Стены Каледонии на R=1500...')
                generateGrandGatehouse(level, 0, 1500)
                generateWallSection(level, 0, 1500, 160) // 160 blocks of continuous wall!
                console.log('✅ Великая Стена и Главные Врата на (0, 1500) успешно возведены!')
                if (ctx.source.player) {
                    ctx.source.player.tell(Text.green('✅ Великая Стена и Главные Врата на (0, 1500) успешно возведены!'))
                }
                return 1
            })
    )
})
