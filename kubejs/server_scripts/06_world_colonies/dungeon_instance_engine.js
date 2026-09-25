// ==============================================================================
// 🏛️ ELYRIUM: DUAL NETHER INSTANCE & CLASSIC COLORED PORTAL ENGINE (KUBEJS 1.21.1)
// ==============================================================================
// - 100% Authentic Classic Nether Portal Dimensions: Outer 4x5, Inner Aperture 2x3.
// - Solid Shimmering Colored Portal Curtains (NOT transparent air!):
//   * Red Portal (Zone A: Basalt Citadel): divinerpg:mortum_portal (Crimson Shimmer)
//   * Blue Portal (Zone B: Soul Sanctum): divinerpg:iceika_portal (Soul Cyan Shimmer)
// - Instant, seamless teleportation upon stepping into the portal curtain.
// ==============================================================================

let dungeonState = 'READY' // READY, IN_PROGRESS, LOOTING, COMPLETED
let dungeonLootTimeRemaining = 900 // 15 minutes (in seconds)

const PORTAL_RED = { x: 2100, y: 94, z: 0, gs: 0, name: '§cКрасный Разлом (Базальтовая Цитадель, T4)' }
const PORTAL_BLUE = { x: 2115, y: 94, z: 0, gs: 0, name: '§bСиний Разлом (Святилище Душ, T4)' }

function getDim(level) {
    let s = String(level.dimension)
    if (s.includes('inst_nether')) return 'elyrium:inst_nether'
    if (s.includes('the_nether') || s.includes('DIM-1')) return 'minecraft:the_nether'
    if (s.includes('the_end') || s.includes('DIM1')) return 'minecraft:the_end'
    if (s.includes('overworld')) return 'minecraft:overworld'
    return s
}

// Build Overworld Dual Portal Promenade with Authentic 4x5 Classic Frames
function buildOverworldPromenade(server) {
    if (dungeonState === 'COMPLETED') return

    // 1. Promenade Terrace (X: 2090 to 2125, Y: 94, Z: -12 to 4)
    server.runCommandSilent('fill 2090 94 -12 2125 94 4 minecraft:polished_blackstone_bricks')
    server.runCommandSilent('fill 2092 94 -10 2123 94 2 minecraft:smooth_stone')

    // Clean up any old duplicate or misaligned frames completely
    server.runCommandSilent('fill 2093 95 -2 2123 102 2 minecraft:air')

    // Observation Terrace at (2107, 95, -8)
    server.runCommandSilent('fill 2105 95 -9 2110 95 -7 minecraft:chiseled_polished_blackstone')
    server.runCommandSilent('setblock 2107 96 -8 minecraft:lodestone')
    server.runCommandSilent('setblock 2107 97 -8 minecraft:lantern[hanging=false]')

    // Terrace Railings
    server.runCommandSilent('fill 2090 95 -12 2125 95 -12 minecraft:stone_brick_wall')
    server.runCommandSilent('fill 2090 95 -12 2090 95 4 minecraft:stone_brick_wall')
    server.runCommandSilent('fill 2125 95 -12 2125 95 4 minecraft:stone_brick_wall')

    // 2. PORTAL 1 (RED - Classic 4x5 Frame, Inner 2x3 at X: 2100..2101, Y: 95..97, Z: 0)
    // Foundation platform
    server.runCommandSilent('fill 2097 94 -2 2104 94 2 minecraft:red_nether_bricks')
    server.runCommandSilent('fill 2098 94 -1 2103 94 1 minecraft:polished_blackstone_bricks')
    // Frame base (sill)
    server.runCommandSilent('setblock 2099 94 0 minecraft:gilded_blackstone')
    server.runCommandSilent('setblock 2100 94 0 minecraft:crying_obsidian')
    server.runCommandSilent('setblock 2101 94 0 minecraft:crying_obsidian')
    server.runCommandSilent('setblock 2102 94 0 minecraft:gilded_blackstone')
    // Pillars (height 3)
    server.runCommandSilent('fill 2099 95 0 2099 97 0 minecraft:crying_obsidian')
    server.runCommandSilent('fill 2102 95 0 2102 97 0 minecraft:crying_obsidian')
    // Lintel (top)
    server.runCommandSilent('setblock 2099 98 0 minecraft:gilded_blackstone')
    server.runCommandSilent('setblock 2100 98 0 minecraft:crying_obsidian')
    server.runCommandSilent('setblock 2101 98 0 minecraft:crying_obsidian')
    server.runCommandSilent('setblock 2102 98 0 minecraft:gilded_blackstone')
    // Details
    server.runCommandSilent('setblock 2099 99 0 minecraft:lantern[hanging=false]')
    server.runCommandSilent('setblock 2102 99 0 minecraft:lantern[hanging=false]')
    server.runCommandSilent('setblock 2097 95 0 minecraft:fire')
    server.runCommandSilent('setblock 2104 95 0 minecraft:fire')
    // Inner Portal Curtain (2 wide x 3 high) - DEEP CRIMSON PORTAL
    server.runCommandSilent('fill 2100 95 0 2101 97 0 minecraft:air')
    server.runCommandSilent('kill @e[type=block_display,tag=elyrium_portal_red]')
    for (let x of [2100, 2101]) {
        for (let y of [95, 96, 97]) {
            server.runCommandSilent(`summon block_display ${x}.0 ${y}.0 0.0 {Tags:["elyrium_portal_red"],block_state:{Name:"divinerpg:mortum_portal",Properties:{axis:"x"}}}`)
        }
    }

    // 3. PORTAL 2 (BLUE - Classic 4x5 Frame, Inner 2x3 at X: 2115..2116, Y: 95..97, Z: 0)
    // Foundation platform
    server.runCommandSilent('fill 2112 94 -2 2119 94 2 minecraft:soul_soil')
    server.runCommandSilent('fill 2113 94 -1 2118 94 1 minecraft:dark_prismarine')
    // Frame base (sill)
    server.runCommandSilent('setblock 2114 94 0 minecraft:crying_obsidian')
    server.runCommandSilent('setblock 2115 94 0 minecraft:dark_prismarine')
    server.runCommandSilent('setblock 2116 94 0 minecraft:dark_prismarine')
    server.runCommandSilent('setblock 2117 94 0 minecraft:crying_obsidian')
    // Pillars (height 3)
    server.runCommandSilent('fill 2114 95 0 2114 97 0 minecraft:dark_prismarine')
    server.runCommandSilent('fill 2117 95 0 2117 97 0 minecraft:dark_prismarine')
    // Lintel (top)
    server.runCommandSilent('setblock 2114 98 0 minecraft:crying_obsidian')
    server.runCommandSilent('setblock 2115 98 0 minecraft:dark_prismarine')
    server.runCommandSilent('setblock 2116 98 0 minecraft:dark_prismarine')
    server.runCommandSilent('setblock 2117 98 0 minecraft:crying_obsidian')
    // Details
    server.runCommandSilent('setblock 2114 99 0 minecraft:soul_lantern[hanging=false]')
    server.runCommandSilent('setblock 2117 99 0 minecraft:soul_lantern[hanging=false]')
    server.runCommandSilent('setblock 2112 95 0 minecraft:soul_fire')
    server.runCommandSilent('setblock 2119 95 0 minecraft:soul_fire')
    // Inner Portal Curtain (2 wide x 3 high) - DEEP OCEAN / SOUL BLUE PORTAL
    server.runCommandSilent('fill 2115 95 0 2116 97 0 minecraft:air')
    server.runCommandSilent('kill @e[type=block_display,tag=elyrium_portal_blue]')
    for (let x of [2115, 2116]) {
        for (let y of [95, 96, 97]) {
            server.runCommandSilent(`summon block_display ${x}.0 ${y}.0 0.0 {Tags:["elyrium_portal_blue"],block_state:{Name:"divinerpg:wildwood_portal",Properties:{axis:"x"}}}`)
        }
    }
}

// Build Zone A: Red Bedrock Citadel around (0, 60, 0)
function buildZoneA(server) {
    let dim = 'elyrium:inst_nether'

    // Floor & Ceiling in central area
    server.runCommandSilent(`execute in ${dim} run fill -70 50 -190 70 50 90 minecraft:bedrock`)
    server.runCommandSilent(`execute in ${dim} run fill -70 110 -190 70 110 90 minecraft:bedrock`)
    server.runCommandSilent(`execute in ${dim} run fill -70 51 -190 70 51 90 minecraft:crimson_nylium`)

    // Red Lava Moats and Surface Formations
    server.runCommandSilent(`execute in ${dim} run fill -60 51 -40 60 51 -35 minecraft:lava`)
    server.runCommandSilent(`execute in ${dim} run fill -60 51 75 60 51 80 minecraft:lava`)

    // Basalt Pillars & Ancient Debris
    const pillarsA = [
        { x: -50, z: -50 }, { x: 50, z: -50 }, { x: -50, z: 50 }, { x: 50, z: 50 }
    ]
    for (let col of pillarsA) {
        server.runCommandSilent(`execute in ${dim} run fill ${col.x - 2} 51 ${col.z - 2} ${col.x + 2} 65 ${col.z + 2} minecraft:basalt`)
    }
    server.runCommandSilent(`execute in ${dim} run fill -20 51 -20 -18 53 -18 minecraft:ancient_debris`)
    server.runCommandSilent(`execute in ${dim} run fill 18 51 -20 20 53 -18 minecraft:ancient_debris`)

    // Ceiling Shroomlights
    for (let cx = -40; cx <= 40; cx += 20) {
        for (let cz = -180; cz <= 60; cz += 30) {
            server.runCommandSilent(`execute in ${dim} run setblock ${cx} 109 ${cz} minecraft:shroomlight`)
            server.runCommandSilent(`execute in ${dim} run fill ${cx} 105 ${cz} ${cx} 108 ${cz} minecraft:chain`)
        }
    }

    // Entrance Viewing Balcony at (0, 65, -180)
    server.runCommandSilent(`execute in ${dim} run fill -12 65 -185 12 65 -170 minecraft:polished_blackstone_bricks`)
    server.runCommandSilent(`execute in ${dim} run fill -12 66 -185 -12 66 -170 minecraft:polished_blackstone_wall`)
    server.runCommandSilent(`execute in ${dim} run fill 12 66 -185 12 66 -170 minecraft:polished_blackstone_wall`)
    server.runCommandSilent(`execute in ${dim} run fill -12 66 -185 12 66 -185 minecraft:polished_blackstone_wall`)

    // Return Classic 4x5 Portal Frame on Balcony (X: -1..2, Y: 65..69, Z: -177)
    server.runCommandSilent(`execute in ${dim} run fill -1 65 -177 2 65 -177 minecraft:crying_obsidian`)
    server.runCommandSilent(`execute in ${dim} run fill -1 66 -177 -1 68 -177 minecraft:crying_obsidian`)
    server.runCommandSilent(`execute in ${dim} run fill 2 66 -177 2 68 -177 minecraft:crying_obsidian`)
    server.runCommandSilent(`execute in ${dim} run fill -1 69 -177 2 69 -177 minecraft:crying_obsidian`)
    server.runCommandSilent(`execute in ${dim} run fill 0 66 -177 1 68 -177 minecraft:air`)
    server.runCommandSilent(`execute in ${dim} run kill @e[type=block_display,tag=elyrium_portal_return_a]`)
    for (let x of [0, 1]) {
        for (let y of [66, 67, 68]) {
            server.runCommandSilent(`execute in ${dim} run summon block_display ${x}.0 ${y}.0 -177.0 {Tags:["elyrium_portal_return_a"],block_state:{Name:"divinerpg:mortum_portal",Properties:{axis:"x"}}}`)
        }
    }

    // Exit Altar on Balcony
    server.runCommandSilent(`execute in ${dim} run setblock 0 66 -181 minecraft:lodestone`)
    server.runCommandSilent(`execute in ${dim} run setblock 0 67 -181 minecraft:crying_obsidian`)

    // Grand Bridge (Z: -170 to -40)
    server.runCommandSilent(`execute in ${dim} run fill -5 65 -170 5 65 -40 minecraft:polished_blackstone_bricks`)
    server.runCommandSilent(`execute in ${dim} run fill -5 66 -170 -5 66 -40 minecraft:polished_blackstone_wall`)
    server.runCommandSilent(`execute in ${dim} run fill 5 66 -170 5 66 -40 minecraft:polished_blackstone_wall`)

    // Central Gothic Citadel Floor around (0, 60, 0)
    server.runCommandSilent(`execute in ${dim} run fill -50 60 -40 50 60 70 minecraft:polished_blackstone_bricks`)
    server.runCommandSilent(`execute in ${dim} run fill -40 60 -30 40 60 60 minecraft:chiseled_polished_blackstone`)

    // 4 Spires with Fire Braziers
    const spiresA = [
        { x: -35, z: -20 }, { x: 35, z: -20 }, { x: -35, z: 50 }, { x: 35, z: 50 }
    ]
    for (let pil of spiresA) {
        server.runCommandSilent(`execute in ${dim} run fill ${pil.x - 3} 61 ${pil.z - 3} ${pil.x + 3} 95 ${pil.z + 3} minecraft:chiseled_polished_blackstone`)
        server.runCommandSilent(`execute in ${dim} run fill ${pil.x - 2} 62 ${pil.z - 4} ${pil.x + 2} 62 ${pil.z - 4} minecraft:fire`)
        server.runCommandSilent(`execute in ${dim} run fill ${pil.x - 2} 62 ${pil.z + 4} ${pil.x + 2} 62 ${pil.z + 4} minecraft:fire`)
    }

    // Boss Dais at (0, 65, 0)
    server.runCommandSilent(`execute in ${dim} run fill -16 63 -16 16 64 16 minecraft:polished_blackstone_bricks`)
    server.runCommandSilent(`execute in ${dim} run fill -12 65 -12 12 65 12 minecraft:gilded_blackstone`)
    server.runCommandSilent(`execute in ${dim} run fill -8 65 -8 8 65 8 minecraft:crying_obsidian`)
    server.runCommandSilent(`execute in ${dim} run setblock 0 65 0 minecraft:respawn_anchor[charges=4]`)

    // Spawn Boss: Netherite Monstrosity & Elites
    server.runCommandSilent(`execute in ${dim} unless entity @e[type=cataclysm:netherite_monstrosity,distance=..100,x=0,y=66,z=0] run summon cataclysm:netherite_monstrosity 0 66 0 {CustomName:'{\"text\":\"👹 Инфернальный Разрушитель [Владыка Бездны]\",\"color\":\"dark_red\",\"bold\":true}',Attributes:[{id:\"minecraft:generic.max_health\",base:1200.0f},{id:\"minecraft:generic.attack_damage\",base:35.0f},{id:\"minecraft:generic.armor\",base:25.0f},{id:\"minecraft:generic.knockback_resistance\",base:1.0f}],Health:1200.0f}`)

    const eliteA = [
        { x: -12, y: 65, z: -10 }, { x: 12, y: 65, z: -10 }, { x: -12, y: 65, z: 10 }, { x: 12, y: 65, z: 10 }
    ]
    for (let pos of eliteA) {
        server.runCommandSilent(`execute in ${dim} unless entity @e[type=minecraft:wither_skeleton,distance=..8,x=${pos.x},y=${pos.y},z=${pos.z}] run summon minecraft:wither_skeleton ${pos.x} ${pos.y} ${pos.z} {CustomName:'{\"text\":\"💀 Пепельный Палач [Элита Т4]\",\"color\":\"red\",\"bold\":true}',HandItems:[{id:\"simplyswords:netherite_claymore\",count:1},{id:\"minecraft:shield\",count:1}],ArmorItems:[{id:\"minecraft:netherite_boots\",count:1},{id:\"minecraft:netherite_leggings\",count:1},{id:\"minecraft:netherite_chestplate\",count:1},{id:\"minecraft:netherite_helmet\",count:1}],Attributes:[{id:\"minecraft:generic.max_health\",base:450.0f},{id:\"minecraft:generic.attack_damage\",base:18.0f},{id:\"minecraft:generic.armor\",base:20.0f},{id:\"minecraft:generic.movement_speed\",base:0.30f}],Health:450.0f,active_effects:[{id:\"minecraft:fire_resistance\",amplifier:0,duration:999999},{id:\"minecraft:resistance\",amplifier:1,duration:999999},{id:\"minecraft:strength\",amplifier:1,duration:999999}]}`)
    }
}

// Build Zone B: Blue Soul Sanctum around (5000, 60, 0)
function buildZoneB(server) {
    let dim = 'elyrium:inst_nether'
    let bx = 5000

    // Floor & Ceiling in Zone B central area
    server.runCommandSilent(`execute in ${dim} run fill ${bx - 70} 50 -190 ${bx + 70} 50 90 minecraft:bedrock`)
    server.runCommandSilent(`execute in ${dim} run fill ${bx - 70} 110 -190 ${bx + 70} 110 90 minecraft:bedrock`)
    server.runCommandSilent(`execute in ${dim} run fill ${bx - 70} 51 -190 ${bx + 70} 51 90 minecraft:soul_soil`)

    // Blue Soul Fire Moats
    server.runCommandSilent(`execute in ${dim} run fill ${bx - 60} 51 -40 ${bx + 60} 51 -35 minecraft:soul_sand`)
    server.runCommandSilent(`execute in ${dim} run fill ${bx - 60} 52 -40 ${bx + 60} 52 -35 minecraft:soul_fire`)
    server.runCommandSilent(`execute in ${dim} run fill ${bx - 60} 51 75 ${bx + 60} 51 80 minecraft:soul_sand`)
    server.runCommandSilent(`execute in ${dim} run fill ${bx - 60} 52 75 ${bx + 60} 52 80 minecraft:soul_fire`)

    // Warped Nylium & Basalt Columns
    server.runCommandSilent(`execute in ${dim} run fill ${bx - 30} 51 -20 ${bx - 10} 51 0 minecraft:warped_nylium`)
    server.runCommandSilent(`execute in ${dim} run fill ${bx + 10} 51 -20 ${bx + 30} 51 0 minecraft:warped_nylium`)

    const pillarsB = [
        { x: bx - 50, z: -50 }, { x: bx + 50, z: -50 }, { x: bx - 50, z: 50 }, { x: bx + 50, z: 50 }
    ]
    for (let col of pillarsB) {
        server.runCommandSilent(`execute in ${dim} run fill ${col.x - 2} 51 ${col.z - 2} ${col.x + 2} 65 ${col.z + 2} minecraft:smooth_basalt`)
    }

    // Ceiling Soul Lanterns
    for (let cx = bx - 40; cx <= bx + 40; cx += 20) {
        for (let cz = -180; cz <= 60; cz += 30) {
            server.runCommandSilent(`execute in ${dim} run setblock ${cx} 109 ${cz} minecraft:crying_obsidian`)
            server.runCommandSilent(`execute in ${dim} run fill ${cx} 105 ${cz} ${cx} 108 ${cz} minecraft:chain`)
            server.runCommandSilent(`execute in ${dim} run setblock ${cx} 104 ${cz} minecraft:soul_lantern[hanging=true]`)
        }
    }

    // Entrance Viewing Balcony at (5000, 65, -180)
    server.runCommandSilent(`execute in ${dim} run fill ${bx - 12} 65 -185 ${bx + 12} 65 -170 minecraft:polished_basalt`)
    server.runCommandSilent(`execute in ${dim} run fill ${bx - 12} 66 -185 ${bx - 12} 66 -170 minecraft:blackstone_wall`)
    server.runCommandSilent(`execute in ${dim} run fill ${bx + 12} 66 -185 ${bx + 12} 66 -170 minecraft:blackstone_wall`)
    server.runCommandSilent(`execute in ${dim} run fill ${bx - 12} 66 -185 ${bx + 12} 66 -185 minecraft:blackstone_wall`)

    // Return Classic 4x5 Portal Frame on Balcony (X: 4999..5002, Y: 65..69, Z: -177)
    server.runCommandSilent(`execute in ${dim} run fill ${bx - 1} 65 -177 ${bx + 2} 65 -177 minecraft:crying_obsidian`)
    server.runCommandSilent(`execute in ${dim} run fill ${bx - 1} 66 -177 ${bx - 1} 68 -177 minecraft:dark_prismarine`)
    server.runCommandSilent(`execute in ${dim} run fill ${bx + 2} 66 -177 ${bx + 2} 68 -177 minecraft:dark_prismarine`)
    server.runCommandSilent(`execute in ${dim} run fill ${bx - 1} 69 -177 ${bx + 2} 69 -177 minecraft:dark_prismarine`)
    server.runCommandSilent(`execute in ${dim} run fill ${bx} 66 -177 ${bx + 1} 68 -177 minecraft:air`)
    server.runCommandSilent(`execute in ${dim} run kill @e[type=block_display,tag=elyrium_portal_return_b]`)
    for (let x of [bx, bx + 1]) {
        for (let y of [66, 67, 68]) {
            server.runCommandSilent(`execute in ${dim} run summon block_display ${x}.0 ${y}.0 -177.0 {Tags:["elyrium_portal_return_b"],block_state:{Name:"divinerpg:wildwood_portal",Properties:{axis:"x"}}}`)
        }
    }

    // Exit Altar on Balcony
    server.runCommandSilent(`execute in ${dim} run setblock ${bx} 66 -181 minecraft:lodestone`)
    server.runCommandSilent(`execute in ${dim} run setblock ${bx} 67 -181 minecraft:soul_lantern[hanging=false]`)

    // Grand Blue Bridge (Z: -170 to -40)
    server.runCommandSilent(`execute in ${dim} run fill ${bx - 5} 65 -170 ${bx + 5} 65 -40 minecraft:polished_basalt`)
    server.runCommandSilent(`execute in ${dim} run fill ${bx - 5} 66 -170 ${bx - 5} 66 -40 minecraft:blackstone_wall`)
    server.runCommandSilent(`execute in ${dim} run fill ${bx + 5} 66 -170 ${bx + 5} 66 -40 minecraft:blackstone_wall`)
    for (let bz = -160; bz <= -50; bz += 20) {
        server.runCommandSilent(`execute in ${dim} run setblock ${bx - 5} 67 ${bz} minecraft:soul_lantern[hanging=false]`)
        server.runCommandSilent(`execute in ${dim} run setblock ${bx + 5} 67 ${bz} minecraft:soul_lantern[hanging=false]`)
    }

    // Central Soul Sanctum Floor around (5000, 60, 0)
    server.runCommandSilent(`execute in ${dim} run fill ${bx - 50} 60 -40 ${bx + 50} 60 70 minecraft:polished_basalt`)
    server.runCommandSilent(`execute in ${dim} run fill ${bx - 40} 60 -30 ${bx + 40} 60 60 minecraft:soul_soil`)

    // 4 Spires with Blue Soul Fire
    const spiresB = [
        { x: bx - 35, z: -20 }, { x: bx + 35, z: -20 }, { x: bx - 35, z: 50 }, { x: bx + 35, z: 50 }
    ]
    for (let pil of spiresB) {
        server.runCommandSilent(`execute in ${dim} run fill ${pil.x - 3} 61 ${pil.z - 3} ${pil.x + 3} 95 ${pil.z + 3} minecraft:smooth_basalt`)
        server.runCommandSilent(`execute in ${dim} run fill ${pil.x - 2} 61 ${pil.z - 4} ${pil.x + 2} 61 ${pil.z - 4} minecraft:soul_sand`)
        server.runCommandSilent(`execute in ${dim} run fill ${pil.x - 2} 62 ${pil.z - 4} ${pil.x + 2} 62 ${pil.z - 4} minecraft:soul_fire`)
        server.runCommandSilent(`execute in ${dim} run fill ${pil.x - 2} 61 ${pil.z + 4} ${pil.x + 2} 61 ${pil.z + 4} minecraft:soul_sand`)
        server.runCommandSilent(`execute in ${dim} run fill ${pil.x - 2} 62 ${pil.z + 4} ${pil.x + 2} 62 ${pil.z + 4} minecraft:soul_fire`)
    }

    // Soul Pyramid & Dais at (5000, 65, 0)
    server.runCommandSilent(`execute in ${dim} run fill ${bx - 16} 63 -16 ${bx + 16} 64 16 minecraft:polished_basalt`)
    server.runCommandSilent(`execute in ${dim} run fill ${bx - 12} 65 -12 ${bx + 12} 65 12 minecraft:soul_soil`)
    server.runCommandSilent(`execute in ${dim} run fill ${bx - 8} 65 -8 ${bx + 8} 65 8 minecraft:warped_wart_block`)
    server.runCommandSilent(`execute in ${dim} run setblock ${bx} 65 0 minecraft:respawn_anchor[charges=4]`)

    // Spawn Boss in Zone B: Ignis & Ignited Revenants
    server.runCommandSilent(`execute in ${dim} unless entity @e[type=cataclysm:ignis,distance=..100,x=${bx},y=66,z=0] run summon cataclysm:ignis ${bx} 66 0 {CustomName:'{\"text\":\"👑 Повелитель Огня Душ [Босс Зоны Б]\",\"color\":\"aqua\",\"bold\":true}',Attributes:[{id:\"minecraft:generic.max_health\",base:1000.0f},{id:\"minecraft:generic.attack_damage\",base:30.0f},{id:\"minecraft:generic.armor\",base:25.0f}],Health:1000.0f}`)

    const revenants = [
        { x: bx - 12, y: 65, z: -10 }, { x: bx + 12, y: 65, z: -10 }
    ]
    for (let pos of revenants) {
        server.runCommandSilent(`execute in ${dim} unless entity @e[type=cataclysm:ignited_revenant,distance=..8,x=${pos.x},y=${pos.y},z=${pos.z}] run summon cataclysm:ignited_revenant ${pos.x} ${pos.y} ${pos.z} {CustomName:'{\"text\":\"🔥 Элитный Вестник Огня Душ\",\"color\":\"dark_aqua\",\"bold\":true}'}`)
    }
}

// Build All Content
function buildAllContent(server) {
    buildOverworldPromenade(server)
    buildZoneA(server)
    buildZoneB(server)
}

// Server Startup Event
ServerEvents.loaded(event => {
    let server = event.server
    dungeonState = 'READY'
    dungeonLootTimeRemaining = 900
    buildAllContent(server)
})

// Native Portal Detection & Teleportation via ServerEvents.tick
ServerEvents.tick(event => {
    let server = event.server
    if (server.tickCount % 2 !== 0) return

    // 1. RED PORTAL (Basalt Citadel) - Bounding Box: X [2099.0..2102.5], Y [94.0..99.0], Z [-1.0..2.0]
    server.runCommandSilent('execute in minecraft:overworld as @a[x=2099.0,y=94.0,z=-1.0,dx=3.5,dy=5.0,dz=3.0] at @s run playsound minecraft:entity.enderman.teleport player @s ~ ~ ~ 1.2 0.9')
    server.runCommandSilent('execute in minecraft:overworld as @a[x=2099.0,y=94.0,z=-1.0,dx=3.5,dy=5.0,dz=3.0] at @s run playsound minecraft:block.respawn_anchor.deplete player @s ~ ~ ~ 1.0 0.8')
    server.runCommandSilent('execute in minecraft:overworld as @a[x=2099.0,y=94.0,z=-1.0,dx=3.5,dy=5.0,dz=3.0] at @s run title @s times 5 45 10')
    server.runCommandSilent('execute in minecraft:overworld as @a[x=2099.0,y=94.0,z=-1.0,dx=3.5,dy=5.0,dz=3.0] at @s run title @s title {"text":"⚔ БАЗАЛЬТОВАЯ ЦИТАДЕЛЬ ⚔","color":"red","bold":true}')
    server.runCommandSilent('execute in minecraft:overworld as @a[x=2099.0,y=94.0,z=-1.0,dx=3.5,dy=5.0,dz=3.0] at @s run title @s subtitle {"text":"Рейд Т4 • Разрушитель Осквернения","color":"gold"}')
    server.runCommandSilent('execute in minecraft:overworld as @a[x=2099.0,y=94.0,z=-1.0,dx=3.5,dy=5.0,dz=3.0] at @s run execute in elyrium:inst_nether run tp @s 0.5 66.0 -174.0 0.0 0.0')

    // 2. BLUE PORTAL (Soul Sanctum) - Bounding Box: X [2114.0..2117.5], Y [94.0..99.0], Z [-1.0..2.0]
    server.runCommandSilent('execute in minecraft:overworld as @a[x=2114.0,y=94.0,z=-1.0,dx=3.5,dy=5.0,dz=3.0] at @s run playsound minecraft:entity.enderman.teleport player @s ~ ~ ~ 1.2 1.2')
    server.runCommandSilent('execute in minecraft:overworld as @a[x=2114.0,y=94.0,z=-1.0,dx=3.5,dy=5.0,dz=3.0] at @s run playsound minecraft:block.respawn_anchor.deplete player @s ~ ~ ~ 1.0 1.2')
    server.runCommandSilent('execute in minecraft:overworld as @a[x=2114.0,y=94.0,z=-1.0,dx=3.5,dy=5.0,dz=3.0] at @s run title @s times 5 45 10')
    server.runCommandSilent('execute in minecraft:overworld as @a[x=2114.0,y=94.0,z=-1.0,dx=3.5,dy=5.0,dz=3.0] at @s run title @s title {"text":"⚡ СВЯТИЛИЩЕ ДУШ ⚡","color":"aqua","bold":true}')
    server.runCommandSilent('execute in minecraft:overworld as @a[x=2114.0,y=94.0,z=-1.0,dx=3.5,dy=5.0,dz=3.0] at @s run title @s subtitle {"text":"Рейд Т4 • Повелитель Огня Душ","color":"light_purple"}')
    server.runCommandSilent('execute in minecraft:overworld as @a[x=2114.0,y=94.0,z=-1.0,dx=3.5,dy=5.0,dz=3.0] at @s run execute in elyrium:inst_nether run tp @s 5000.5 66.0 -174.0 0.0 0.0')

    // 3. RETURN PORTAL BALCONY A (from Citadel) - Bounding Box: X [-1.0..2.5], Y [65.0..70.0], Z [-178.5..-175.5]
    server.runCommandSilent('execute in elyrium:inst_nether as @a[x=-1.0,y=65.0,z=-178.5,dx=3.5,dy=5.0,dz=3.0] at @s run playsound minecraft:entity.enderman.teleport player @s ~ ~ ~ 1.0 1.0')
    server.runCommandSilent('execute in elyrium:inst_nether as @a[x=-1.0,y=65.0,z=-178.5,dx=3.5,dy=5.0,dz=3.0] at @s run title @s actionbar {"text":"✨ Возвращение на Променад Верхнего Мира","color":"green"}')
    server.runCommandSilent('execute in elyrium:inst_nether as @a[x=-1.0,y=65.0,z=-178.5,dx=3.5,dy=5.0,dz=3.0] at @s run execute in minecraft:overworld run tp @s 2100.5 95.0 -3.0 180.0 0.0')

    // 4. RETURN PORTAL BALCONY B (from Sanctum) - Bounding Box: X [4999.0..5002.5], Y [65.0..70.0], Z [-178.5..-175.5]
    server.runCommandSilent('execute in elyrium:inst_nether as @a[x=4999.0,y=65.0,z=-178.5,dx=3.5,dy=5.0,dz=3.0] at @s run playsound minecraft:entity.enderman.teleport player @s ~ ~ ~ 1.0 1.2')
    server.runCommandSilent('execute in elyrium:inst_nether as @a[x=4999.0,y=65.0,z=-178.5,dx=3.5,dy=5.0,dz=3.0] at @s run title @s actionbar {"text":"✨ Возвращение на Променад Верхнего Мира","color":"green"}')
    server.runCommandSilent('execute in elyrium:inst_nether as @a[x=4999.0,y=65.0,z=-178.5,dx=3.5,dy=5.0,dz=3.0] at @s run execute in minecraft:overworld run tp @s 2115.5 95.0 -3.0 180.0 0.0')

    // Ambient portal particles (every 10 ticks)
    if (server.tickCount % 10 === 0) {
        server.runCommandSilent('execute in minecraft:overworld run particle minecraft:crimson_spore 2100.5 96.0 0.5 0.5 1.0 0.2 0.02 6')
        server.runCommandSilent('execute in minecraft:overworld run particle minecraft:flame 2100.5 95.5 0.5 0.4 0.6 0.2 0.01 3')
        server.runCommandSilent('execute in minecraft:overworld run particle minecraft:soul_fire_flame 2115.5 96.0 0.5 0.5 1.0 0.2 0.02 6')
        server.runCommandSilent('execute in minecraft:overworld run particle minecraft:glow 2115.5 96.0 0.5 0.5 1.0 0.2 0.01 4')
        server.runCommandSilent('execute in elyrium:inst_nether run particle minecraft:crimson_spore 0.5 67.0 -176.5 0.5 1.0 0.2 0.02 5')
        server.runCommandSilent('execute in elyrium:inst_nether run particle minecraft:soul_fire_flame 5000.5 67.0 -176.5 0.5 1.0 0.2 0.02 5')
    }
})

// Player Tick Loop: Boundary Enforcement & Timer
PlayerEvents.tick(event => {
    let player = event.player
    let dim = String(player.level.dimension)
    let px = player.x
    let py = player.y
    let pz = player.z

    if (dim.includes('inst_nether')) {
        // 500-Block Bedrock Box Boundary Enforcement
        if (player.age % 10 === 0) {
            let isZoneB = (px > 2500)
            let centerX = isZoneB ? 5000 : 0
            let relX = px - centerX

            let outOfBounds = false
            let targetX = px
            let targetZ = pz
            let targetY = py

            if (Math.abs(relX) > 246) {
                targetX = centerX + Math.sign(relX) * 242
                outOfBounds = true
            }
            if (Math.abs(pz) > 246) {
                targetZ = Math.sign(pz) * 242
                outOfBounds = true
            }
            if (py < 50) {
                targetY = 66
                targetX = centerX + 0.5
                targetZ = -174.0
                outOfBounds = true
            } else if (py > 108) {
                targetY = 104
                outOfBounds = true
            }

            if (outOfBounds) {
                player.teleportTo('elyrium:inst_nether', targetX, targetY, targetZ, player.yaw, player.pitch)
                server.runCommandSilent(`title ${player.username} actionbar {\"text\":\"🛡 Пределы Арены (500 блоков)! Вы не можете покинуть Инст.\",\"color\":\"red\"}`)
                server.runCommandSilent(`playsound minecraft:block.beacon.deactivate ambient @a[name=${player.username}] ~ ~ ~ 1.0 1.2`)
            }
        }

        // 15-minute Looting Actionbar Timer
        if (dungeonState === 'LOOTING' && player.age % 20 === 0) {
            let mins = Math.floor(dungeonLootTimeRemaining / 60)
            let secs = dungeonLootTimeRemaining % 60
            let timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs
            server.runCommandSilent(`title ${player.username} actionbar {\"text\":\"⏳ Схлопывание через: §e${timeStr} §8| §cЗаберите трофеи и активируйте Алтарь!\",\"color\":\"gold\"}`)
        }
    }
})

// Right-click Exit Altar Interaction
BlockEvents.rightClicked(event => {
    let player = event.player
    let block = event.block
    let dim = getDim(player.level)

    if (dim.includes('inst_nether')) {
        if (block.id === 'minecraft:lodestone' || block.id === 'minecraft:crying_obsidian') {
            player.tell('§a✨ Вы эвакуируетесь через Алтарь на Променад!')
            player.teleportTo('minecraft:overworld', 2107, 95, -8, 180, 0)
            player.server.runCommandSilent(`playsound minecraft:entity.player.levelup ambient @a[name=${player.username}] 2107 95 -8 1.0 1.2`)
            event.cancel()
        }
    }
})

// Admin Testing & Management Commands
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event

    event.register(Commands.literal('dungeon_build_arena')
        .requires(s => s.hasPermission(2))
        .executes(ctx => {
            let server = ctx.source.server
            buildAllContent(server)
            ctx.source.sendSuccess(Component.literal('§a[Инст] Классические порталы 4х5 (Красный и Синий) и арены построены!'), true)
            return 1
        })
    )

    event.register(Commands.literal('dungeon_reset')
        .requires(s => s.hasPermission(2))
        .executes(ctx => {
            let server = ctx.source.server
            dungeonState = 'READY'
            dungeonLootTimeRemaining = 900
            buildAllContent(server)
            ctx.source.sendSuccess(Component.literal('§a[Инст] Инст полностью сброшен!'), true)
            return 1
        })
    )
})
