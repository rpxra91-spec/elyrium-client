
function findFrameForBlock(level, dim, bx, by, bz) {
    // 1. Check knownPortalFrames first
    for (let kf of knownPortalFrames) {
        if (kf.dim !== dim) continue
        if (kf.axis === 'x') {
            if (Math.abs(bz - kf.z0) <= 2 && bx >= kf.x0 - 2 && bx <= kf.x0 + 3 && by >= kf.y0 - 2 && by <= kf.y0 + 5) {
                return kf
            }
        } else {
            if (Math.abs(bx - kf.x0) <= 2 && bz >= kf.z0 - 2 && bz <= kf.z0 + 3 && by >= kf.y0 - 2 && by <= kf.y0 + 5) {
                return kf
            }
        }
    }

    // 2. Direct detection around (bx, by, bz)
    let f = detectFrame(level, bx, by, bz)
    if (f) return f

    // 3. Expanded radial search around clicked block
    for (let ox of [-2, -1, 0, 1, 2]) {
        for (let oy of [-3, -2, -1, 0, 1, 2, 3]) {
            for (let oz of [-2, -1, 0, 1, 2]) {
                f = detectFrame(level, bx + ox, by + oy, bz + oz)
                if (f) return f
            }
        }
    }
    return null
}
let lastExtinguishTime = {}
let lastIgniteTime = {}
// ==============================================================================
//  ELYRIUM RPG: PROGRESSION PORTAL ENGINE (DYNAMIC 1:8 NETHER PORTALS)
//  Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================

const PORTAL_FILE = 'kubejs/data/progression_portals.json'

// In-memory active portals storage
let activeProgressionPortals = []

// ONLY custom frame blocks allowed (crying obsidian is NOT allowed)
const VALID_NETHER_FRAME_BLOCKS = [
    'kubejs:infernal_portal_frame',
    'kubejs:infernal_portal_frame_active',
    'kubejs:infernal_portal_frame_eye_left',
    'kubejs:infernal_portal_frame_eye_right',
    'kubejs:infernal_portal_corner_dormant',
    'kubejs:infernal_portal_corner_active',
    'kubejs:infernal_portal_pillar_dormant',
    'kubejs:infernal_portal_pillar_active',
    'kubejs:infernal_portal_pillar_left_dormant',
    'kubejs:infernal_portal_pillar_right_dormant',
    'kubejs:infernal_portal_pillar_left_active',
    'kubejs:infernal_portal_pillar_right_active',
    'kubejs:infernal_portal_pillar_bottom_left_dormant',
    'kubejs:infernal_portal_pillar_bottom_right_dormant',
    'kubejs:infernal_portal_pillar_bottom_left_active',
    'kubejs:infernal_portal_pillar_bottom_right_active',
    'kubejs:infernal_portal_pillar_middle_left_dormant',
    'kubejs:infernal_portal_pillar_middle_right_dormant',
    'kubejs:infernal_portal_pillar_middle_left_active',
    'kubejs:infernal_portal_pillar_middle_right_active',
    'kubejs:infernal_portal_pillar_top_left_dormant',
    'kubejs:infernal_portal_pillar_top_right_dormant',
    'kubejs:infernal_portal_pillar_top_left_active',
    'kubejs:infernal_portal_pillar_top_right_active',
    'kubejs:infernal_portal_threshold_dormant',
    'kubejs:infernal_portal_threshold_active',
    'kubejs:infernal_portal_keystone_left_dormant',
    'kubejs:infernal_portal_keystone_right_dormant'
]

// Helper: Get Dimension String
function getDimId(level) {
    if (!level) return 'minecraft:overworld'
    let d = String(level.dimension)
    if (d.includes('ResourceKey') && d.includes('/')) {
        let parts = d.split('/')
        return parts[parts.length - 1].replace(']', '').trim()
    }
    return d.replace('minecraft:dimension:', '')
}

// Load active portals from disk
function loadPortals(server) {
    try {
        let raw = JsonIO.read(PORTAL_FILE)
        let data = (raw && raw.portals) ? raw.portals : raw
        if (data) {
            let list = []
            if (Array.isArray(data)) {
                list = data
            } else if (typeof data.size === 'function') {
                for (let i = 0; i < data.size(); i++) {
                    list.push(data.get(i))
                }
            } else if (data.length !== undefined) {
                for (let i = 0; i < data.length; i++) {
                    list.push(data[i])
                }
            } else {
                for (let k in data) {
                    list.push(data[k])
                }
            }
            activeProgressionPortals = list
            if (server && activeProgressionPortals.length > 0) {
                server.tell(`§a[Порталы Прогрессии] Загружено активных порталов: ${activeProgressionPortals.length}`)
            }
        } else {
            activeProgressionPortals = []
        }
    } catch (e) {
        console.error('Failed to load progression portals: ' + e)
        activeProgressionPortals = []
    }
}

// Save active portals to disk
function savePortals() {
    try {
        JsonIO.write(PORTAL_FILE, { portals: activeProgressionPortals })
    } catch (e) {
        console.error('Failed to save progression portals: ' + e)
    }
}

// ------------------------------------------------------------------------------
// Anti-Farm System: Track auto-generated frame blocks so they drop 0 items on break
// ------------------------------------------------------------------------------
const GENERATED_FRAMES_FILE = 'kubejs/data/generated_frame_blocks.json'
let generatedFrameBlocks = new Set()

function loadGeneratedFrames() {
    try {
        let raw = JsonIO.read(GENERATED_FRAMES_FILE)
        let list = (raw && raw.blocks) ? raw.blocks : raw
        if (list && Array.isArray(list)) {
            generatedFrameBlocks = new Set(list)
        } else {
            generatedFrameBlocks = new Set()
        }
    } catch (e) {
        generatedFrameBlocks = new Set()
    }
}

function saveGeneratedFrames() {
    try {
        JsonIO.write(GENERATED_FRAMES_FILE, { blocks: Array.from(generatedFrameBlocks) })
    } catch (e) {
        console.error('Failed to save generated frame blocks: ' + e)
    }
}

function registerGeneratedFrameBlocks(dim, x0, y0, z0, axis) {
    let coords = []
    if (axis === 'x') {
        for (let x = x0 - 1; x <= x0 + 2; x++) coords.push(`${dim}:${x}:${y0 - 1}:${z0}`)
        for (let y = y0; y <= y0 + 2; y++) {
            coords.push(`${dim}:${x0 - 1}:${y}:${z0}`)
            coords.push(`${dim}:${x0 + 2}:${y}:${z0}`)
        }
        for (let x = x0 - 1; x <= x0 + 2; x++) coords.push(`${dim}:${x}:${y0 + 3}:${z0}`)
    } else {
        for (let z = z0 - 1; z <= z0 + 2; z++) coords.push(`${dim}:${x0}:${y0 - 1}:${z}`)
        for (let y = y0; y <= y0 + 2; y++) {
            coords.push(`${dim}:${x0}:${y}:${z0 - 1}`)
            coords.push(`${dim}:${x0}:${y}:${z0 + 2}`)
        }
        for (let z = z0 - 1; z <= z0 + 2; z++) coords.push(`${dim}:${x0}:${y0 + 3}:${z}`)
    }

    for (let c of coords) {
        generatedFrameBlocks.add(c)
    }
    saveGeneratedFrames()
}

// ------------------------------------------------------------------------------
// Anti-Farm System: Track auto-generated platform blocks (floor, walls, lanterns)
// They drop 0 items on break, but mine at normal speed with NO fatigue and NO warnings
// ------------------------------------------------------------------------------
const GENERATED_PLATFORMS_FILE = 'kubejs/data/generated_platform_blocks.json'
let generatedPlatformBlocks = new Set()

function loadGeneratedPlatforms() {
    try {
        let raw = JsonIO.read(GENERATED_PLATFORMS_FILE)
        let list = (raw && raw.blocks) ? raw.blocks : raw
        if (list && Array.isArray(list)) {
            generatedPlatformBlocks = new Set(list)
        } else {
            generatedPlatformBlocks = new Set()
        }
    } catch (e) {
        generatedPlatformBlocks = new Set()
    }
}

function saveGeneratedPlatforms() {
    try {
        JsonIO.write(GENERATED_PLATFORMS_FILE, { blocks: Array.from(generatedPlatformBlocks) })
    } catch (e) {
        console.error('Failed to save generated platform blocks: ' + e)
    }
}

function registerGeneratedPlatformBlocks(dim, minX, maxX, minZ, maxZ, ny) {
    // Floor
    for (let x = minX; x <= maxX; x++) {
        for (let z = minZ; z <= maxZ; z++) {
            generatedPlatformBlocks.add(`${dim}:${x}:${ny - 1}:${z}`)
        }
    }
    // Perimeter railings
    for (let x = minX; x <= maxX; x++) {
        generatedPlatformBlocks.add(`${dim}:${x}:${ny}:${minZ}`)
        generatedPlatformBlocks.add(`${dim}:${x}:${ny}:${maxZ}`)
    }
    for (let z = minZ; z <= maxZ; z++) {
        generatedPlatformBlocks.add(`${dim}:${minX}:${ny}:${z}`)
        generatedPlatformBlocks.add(`${dim}:${maxX}:${ny}:${z}`)
    }
    // Corner lanterns & downward foundation pillars
    for (let px of [minX, maxX]) {
        for (let pz of [minZ, maxZ]) {
            generatedPlatformBlocks.add(`${dim}:${px}:${ny + 1}:${pz}`)
            for (let py = ny - 16; py <= ny - 2; py++) {
                generatedPlatformBlocks.add(`${dim}:${px}:${py}:${pz}`)
            }
        }
    }
    saveGeneratedPlatforms()
}

// ------------------------------------------------------------------------------
// Known Portal Frames Registry: Remembers physical frame locations (built or generated)
// Prevents duplicate portal spawns by reconnecting to existing frames in the area
// ------------------------------------------------------------------------------
const KNOWN_FRAMES_FILE = 'kubejs/data/known_portal_frames.json'
let knownPortalFrames = []

function loadKnownFrames() {
    try {
        let raw = JsonIO.read(KNOWN_FRAMES_FILE)
        let list = (raw && raw.frames) ? raw.frames : raw
        if (list && Array.isArray(list)) {
            knownPortalFrames = list
        } else {
            knownPortalFrames = []
        }
    } catch (e) {
        knownPortalFrames = []
    }
}

function saveKnownFrames() {
    try {
        JsonIO.write(KNOWN_FRAMES_FILE, { frames: knownPortalFrames })
    } catch (e) {
        console.error('Failed to save known portal frames: ' + e)
    }
}

function registerKnownFrame(dim, x0, y0, z0, axis) {
    let existing = knownPortalFrames.find(f => f.dim === dim && f.x0 === x0 && f.y0 === y0 && f.z0 === z0)
    if (!existing) {
        knownPortalFrames.push({ dim: dim, x0: x0, y0: y0, z0: z0, axis: axis })
        saveKnownFrames()
    }
}

function countIntactFrameBlocks(level, kf) {
    let count = 0
    let coords = []
    if (kf.axis === 'x') {
        // Bottom sill (2)
        coords.push({ x: kf.x0, y: kf.y0 - 1, z: kf.z0 })
        coords.push({ x: kf.x0 + 1, y: kf.y0 - 1, z: kf.z0 })
        // Top lintel (2)
        coords.push({ x: kf.x0, y: kf.y0 + 3, z: kf.z0 })
        coords.push({ x: kf.x0 + 1, y: kf.y0 + 3, z: kf.z0 })
        // Left pillar (3)
        for (let y = kf.y0; y <= kf.y0 + 2; y++) {
            coords.push({ x: kf.x0 - 1, y: y, z: kf.z0 })
        }
        // Right pillar (3)
        for (let y = kf.y0; y <= kf.y0 + 2; y++) {
            coords.push({ x: kf.x0 + 2, y: y, z: kf.z0 })
        }
    } else {
        // Axis Z
        // Bottom sill (2)
        coords.push({ x: kf.x0, y: kf.y0 - 1, z: kf.z0 })
        coords.push({ x: kf.x0, y: kf.y0 - 1, z: kf.z0 + 1 })
        // Top lintel (2)
        coords.push({ x: kf.x0, y: kf.y0 + 3, z: kf.z0 })
        coords.push({ x: kf.x0, y: kf.y0 + 3, z: kf.z0 + 1 })
        // Left pillar (3)
        for (let y = kf.y0; y <= kf.y0 + 2; y++) {
            coords.push({ x: kf.x0, y: y, z: kf.z0 - 1 })
        }
        // Right pillar (3)
        for (let y = kf.y0; y <= kf.y0 + 2; y++) {
            coords.push({ x: kf.x0, y: y, z: kf.z0 + 2 })
        }
    }

    for (let c of coords) {
        if (isFrameBlock(level, c.x, c.y, c.z)) {
            count++
        }
    }
    return count
}

function checkAndUnregisterDemolishedFrames(level, dim, bx, by, bz, player) {
    let beforeCount = knownPortalFrames.length
    knownPortalFrames = knownPortalFrames.filter(kf => {
        if (kf.dim !== dim) return true
        let isPart = false
        if (kf.axis === 'x') {
            if (bz === kf.z0 && bx >= kf.x0 - 1 && bx <= kf.x0 + 2 && by >= kf.y0 - 1 && by <= kf.y0 + 3) {
                let isInner = (bx >= kf.x0 && bx <= kf.x0 + 1 && by >= kf.y0 && by <= kf.y0 + 2)
                if (!isInner) isPart = true
            }
        } else {
            if (bx === kf.x0 && bz >= kf.z0 - 1 && bz <= kf.z0 + 2 && by >= kf.y0 - 1 && by <= kf.y0 + 3) {
                let isInner = (bz >= kf.z0 && bz <= kf.z0 + 1 && by >= kf.y0 && by <= kf.y0 + 2)
                if (!isInner) isPart = true
            }
        }

        if (!isPart) return true

        // Count remaining blocks
        let remaining = countIntactFrameBlocks(level, kf)
        if (isFrameBlock(level, bx, by, bz)) {
            remaining -= 1
        }
        // Frame is ONLY demolished if less than 4 structural blocks remain (out of 10)
        if (remaining < 4) {
            if (player) {
                player.server.runCommandSilent(`title ${player.username} actionbar {"text":"§e[Разлом] Рамка портала полностью разобрана.","color":"gold"}`)
            }
            return false
        }
        return true
    })

    if (knownPortalFrames.length !== beforeCount) {
        saveKnownFrames()
    }
}

loadGeneratedFrames()
loadGeneratedPlatforms()
loadKnownFrames()


// Check if a block is a valid frame block
function isFrameBlock(level, x, y, z) {
    let block = level.getBlock(x, y, z)
    if (!block) return false
    return VALID_NETHER_FRAME_BLOCKS.includes(String(block.id))
}

// Dynamically swap 14 frame blocks: 12 border blocks flare into runic magma, 2 center keystone blocks merge into the Predatory Eye
// Dynamically swap frame blocks: Dormant Bone Bastion (sculpted unlit) vs Active Blazing Bastion (glowing gems, runes & living eye)
// Dynamically swap frame blocks: Dormant Bone Bastion (sculpted unlit) vs Active Blazing Bastion (glowing gems, runes & living eye)


// ==============================================================================
//  EXPANDED 3x4 BASTION SYSTEM (SEAMLESS 5x6 MONUMENT WITH 3-BLOCK EYE)
// ==============================================================================

// Purge any displays belonging to a portal ID via Java direct
function purgePortalDisplaysDirect(server, dim, portalId) {
    let lvl = server.getLevel(dim)
    if (!lvl) return
    let targetTag = `tag_${portalId}`
    let hitboxTag = `hitbox_${portalId}`
    let entities = lvl.getEntities()
    for (let e of entities) {
        let t = String(e.type)
        if (t !== 'minecraft:block_display' && t !== 'minecraft:interaction') continue
        let tags = e.tags
        if (tags) {
            try {
                if (tags.contains(targetTag) || tags.contains(hitboxTag)) e.discard()
            } catch(err) {
                try {
                    if (tags.indexOf(targetTag) !== -1 || tags.indexOf(hitboxTag) !== -1) e.discard()
                } catch(err2) {}
            }
        }
    }
}

// Clear any remaining outer blocks or aperture blocks of old expansions
function clearActiveBastionBlocks(server, dim, axis, x0, y0, z0) {
    if (!server) return
    let lvl = server.getLevel(dim)

    function setAir(x, y, z) {
        if (lvl) {
            try { lvl.getBlock(x, y, z).set('minecraft:air') } catch(e) {}
        }
        server.runCommandSilent(`execute in ${dim} run setblock ${x} ${y} ${z} minecraft:air`)
    }

    if (axis === 'x') {
        for (let x = x0; x <= x0 + 1; x++) {
            for (let y = y0; y <= y0 + 2; y++) {
                setAir(x, y, z0)
            }
        }
    } else {
        for (let z = z0; z <= z0 + 1; z++) {
            for (let y = y0; y <= y0 + 2; y++) {
                setAir(x0, y, z)
            }
        }
    }
}

// Canonical 14-Block In-Place Portal Activation (4x5 outer, 2x3 inner opening)
function activateCanonicalPortal(server, dim, axis, x0, y0, z0, portalId) {
    if (!server) return
    let targetTag = `tag_${portalId}`
    let groupTag = `expanded_portal_${x0}_${y0}_${z0}`

    // 1. Purge any lingering displays or interaction entities
    server.runCommandSilent(`execute in ${dim} run kill @e[type=block_display,tag=${targetTag}]`)
    server.runCommandSilent(`execute in ${dim} run kill @e[type=block_display,tag=${groupTag}]`)
    server.runCommandSilent(`execute in ${dim} run kill @e[type=interaction,tag=${groupTag}]`)

    // 2. Do NOT clear outer blocks - preserve all world blocks around the 14 frame positions

    // 3. Set the 14 Canonical Blocks to ACTIVE state
    setFrameBlocksState(server, dim, axis, x0, y0, z0, 'active', portalId)
}

// Backward compatibility aliases
function spawnExpandedActiveBastion(server, dim, axis, x0, y0, z0, portalId) {
    activateCanonicalPortal(server, dim, axis, x0, y0, z0, portalId)
}

function triggerExpansionAnimation(server, dim, axis, x0, y0, z0, portalId, onComplete) {
    activateCanonicalPortal(server, dim, axis, x0, y0, z0, portalId)
    if (typeof onComplete === 'function') onComplete()
}

function triggerCollapseAnimation(server, dim, axis, x0, y0, z0) {
    let midX = (axis === 'x' ? x0 + 0.5 : x0)
    let midY = y0 + 1.5
    let midZ = (axis === 'z' ? z0 + 0.5 : z0)

    server.runCommandSilent(`playsound minecraft:block.fire.extinguish block @a ${midX} ${midY} ${midZ} 1.2 1.0`)
    server.runCommandSilent(`particle minecraft:smoke ${midX} ${midY} ${midZ} 1.0 1.5 1.0 0.05 40`)

    clearActiveBastionBlocks(server, dim, axis, x0, y0, z0)
    setFrameBlocksState(server, dim, axis, x0, y0, z0, 'dormant')
}

function setFrameBlocksState(server, dim, axis, x0, y0, z0, targetBlockState, portalId) {
    if (!server) return
    let isActive = (targetBlockState === 'active')
    let lvl = server.getLevel(dim)

    let p = activeProgressionPortals.find(p => p.dim === dim && p.x0 === x0 && p.y0 === y0 && p.z0 === z0)
    let pid = portalId || (p ? p.id : `infernal_${x0}_${y0}_${z0}`)

    // Clean any stray displays or hitboxes
    let groupTag = `expanded_portal_${x0}_${y0}_${z0}`
    server.runCommandSilent(`execute in ${dim} run kill @e[type=block_display,tag=${groupTag}]`)
    server.runCommandSilent(`execute in ${dim} run kill @e[type=interaction,tag=${groupTag}]`)

    // 1. Corners
    let topCornerBlock = isActive ? 'kubejs:infernal_portal_corner_active' : 'kubejs:infernal_portal_corner_dormant'
    let botCornerLeft  = isActive ? 'kubejs:infernal_portal_pillar_left_active'  : 'kubejs:infernal_portal_pillar_left_dormant'
    let botCornerRight = isActive ? 'kubejs:infernal_portal_pillar_right_active' : 'kubejs:infernal_portal_pillar_right_dormant'

    // 2. Threshold (2 blocks)
    let threshBlock = isActive ? 'kubejs:infernal_portal_threshold_active' : 'kubejs:infernal_portal_threshold_dormant'

    // 3. Arch / Eye (2 blocks)
    let keyLeft = isActive ? 'kubejs:infernal_portal_frame_eye_left' : 'kubejs:infernal_portal_keystone_left_dormant'
    let keyRight = isActive ? 'kubejs:infernal_portal_frame_eye_right' : 'kubejs:infernal_portal_keystone_right_dormant'

    // 4. Pillars (3 blocks high each, authentic ancient runic inscriptions)
    let pBotL = isActive ? 'kubejs:infernal_portal_pillar_bottom_left_active'  : 'kubejs:infernal_portal_pillar_bottom_left_dormant'
    let pMidL = isActive ? 'kubejs:infernal_portal_pillar_middle_left_active'  : 'kubejs:infernal_portal_pillar_middle_left_dormant'
    let pTopL = isActive ? 'kubejs:infernal_portal_pillar_top_left_active'     : 'kubejs:infernal_portal_pillar_top_left_dormant'

    let pBotR = isActive ? 'kubejs:infernal_portal_pillar_bottom_right_active' : 'kubejs:infernal_portal_pillar_bottom_right_dormant'
    let pMidR = isActive ? 'kubejs:infernal_portal_pillar_middle_right_active' : 'kubejs:infernal_portal_pillar_middle_right_dormant'
    let pTopR = isActive ? 'kubejs:infernal_portal_pillar_top_right_active'    : 'kubejs:infernal_portal_pillar_top_right_dormant'

    let pillarListLeft  = [pBotL, pMidL, pTopL]
    let pillarListRight = [pBotR, pMidR, pTopR]

    function placeBlock(x, y, z, id) {
        if (lvl) {
            try { lvl.getBlock(x, y, z).set(id) } catch(e) {}
        }
        server.runCommandSilent(`execute in ${dim} run setblock ${x} ${y} ${z} ${id}`)
    }

    if (axis === 'x') {
        // Bottom Threshold & Corners (Y = y0 - 1)
        placeBlock(x0 - 1, y0 - 1, z0, botCornerLeft)
        placeBlock(x0,     y0 - 1, z0, threshBlock)
        placeBlock(x0 + 1, y0 - 1, z0, threshBlock)
        placeBlock(x0 + 2, y0 - 1, z0, botCornerRight)

        // Left & Right Pillars (Y = y0 .. y0 + 2)
        for (let iy = 0; iy <= 2; iy++) {
            placeBlock(x0 - 1, y0 + iy, z0, pillarListLeft[iy])
            placeBlock(x0 + 2, y0 + iy, z0, pillarListRight[iy])
        }

        // Top Arch & Corners (Y = y0 + 3)
        placeBlock(x0 - 1, y0 + 3, z0, topCornerBlock)
        placeBlock(x0,     y0 + 3, z0, keyLeft)
        placeBlock(x0 + 1, y0 + 3, z0, keyRight)
        placeBlock(x0 + 2, y0 + 3, z0, topCornerBlock)

        // Inner Aperture (2 wide x 3 high: X = x0..x0+1, Y = y0..y0+2)
        server.runCommandSilent(`execute in ${dim} run fill ${x0} ${y0} ${z0} ${x0 + 1} ${y0 + 2} ${z0} minecraft:air replace minecraft:fire`)
        server.runCommandSilent(`execute in ${dim} run fill ${x0} ${y0} ${z0} ${x0 + 1} ${y0 + 2} ${z0} minecraft:air replace #minecraft:replaceable`)

        if (isActive) {
            server.runCommandSilent(`execute in ${dim} run kill @e[type=block_display,tag=tag_${pid}]`)
            for (let ix = x0; ix <= x0 + 1; ix++) {
                for (let iy = y0; iy <= y0 + 2; iy++) {
                    server.runCommandSilent(`execute in ${dim} run summon block_display ${ix}.0 ${iy}.0 ${z0}.0 {Tags:["elyrium_progression_portal","tag_${pid}"],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[1f,1f,1f]},block_state:{Name:"divinerpg:mortum_portal",Properties:{axis:"x"}}}`)
                }
            }
        } else {
            server.runCommandSilent(`execute in ${dim} run kill @e[type=block_display,tag=tag_${pid}]`)
            for (let ix = 0; ix <= 1; ix++) {
                for (let iy = 0; iy <= 2; iy++) {
                    placeBlock(x0 + ix, y0 + iy, z0, 'minecraft:air')
                }
            }
        }
    } else {
        // Axis Z
        // Bottom Threshold & Corners (Y = y0 - 1)
        placeBlock(x0, y0 - 1, z0 - 1, botCornerLeft)
        placeBlock(x0, y0 - 1, z0,     threshBlock)
        placeBlock(x0, y0 - 1, z0 + 1, threshBlock)
        placeBlock(x0, y0 - 1, z0 + 2, botCornerRight)

        // Left & Right Pillars (Y = y0 .. y0 + 2)
        for (let iy = 0; iy <= 2; iy++) {
            placeBlock(x0, y0 + iy, z0 - 1, pillarListLeft[iy])
            placeBlock(x0, y0 + iy, z0 + 2, pillarListRight[iy])
        }

        // Top Arch & Corners (Y = y0 + 3)
        placeBlock(x0, y0 + 3, z0 - 1, topCornerBlock)
        placeBlock(x0, y0 + 3, z0,     keyLeft)
        placeBlock(x0, y0 + 3, z0 + 1, keyRight)
        placeBlock(x0, y0 + 3, z0 + 2, topCornerBlock)

        // Inner Aperture (2 wide x 3 high: Z = z0..z0+1, Y = y0..y0+2)
        server.runCommandSilent(`execute in ${dim} run fill ${x0} ${y0} ${z0} ${x0} ${y0 + 2} ${z0 + 1} minecraft:air replace minecraft:fire`)
        server.runCommandSilent(`execute in ${dim} run fill ${x0} ${y0} ${z0} ${x0} ${y0 + 2} ${z0 + 1} minecraft:air replace #minecraft:replaceable`)

        if (isActive) {
            server.runCommandSilent(`execute in ${dim} run kill @e[type=block_display,tag=tag_${pid}]`)
            for (let iz = z0; iz <= z0 + 1; iz++) {
                for (let iy = y0; iy <= y0 + 2; iy++) {
                    server.runCommandSilent(`execute in ${dim} run summon block_display ${x0}.0 ${iy}.0 ${iz}.0 {Tags:["elyrium_progression_portal","tag_${pid}"],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[1f,1f,1f]},block_state:{Name:"divinerpg:mortum_portal",Properties:{axis:"z"}}}`)
                }
            }
        } else {
            server.runCommandSilent(`execute in ${dim} run kill @e[type=block_display,tag=tag_${pid}]`)
            for (let iz = 0; iz <= 1; iz++) {
                for (let iy = 0; iy <= 2; iy++) {
                    placeBlock(x0, y0 + iy, z0 + iz, 'minecraft:air')
                }
            }
        }
    }

    if (isActive) {
        server.runCommandSilent(`execute in ${dim} run playsound minecraft:block.respawn_anchor.set_spawn block @a ${x0} ${y0 + 1} ${z0} 1.2 0.8`)
    } else {
        server.runCommandSilent(`execute in ${dim} run playsound minecraft:block.respawn_anchor.deplete block @a ${x0} ${y0 + 1} ${z0} 1.2 0.7`)
    }
}

function revertDormantFrameToStandard(server, dim, axis, x0, y0, z0, brokenX, brokenY, brokenZ) {
    if (!server) return
    let framePositions = []
    if (axis === 'x') {
        framePositions.push([x0, y0 - 1, z0], [x0 + 1, y0 - 1, z0])
        framePositions.push([x0 - 1, y0 - 1, z0], [x0 + 2, y0 - 1, z0])
        framePositions.push([x0 - 1, y0 + 3, z0], [x0 + 2, y0 + 3, z0])
        for (let iy = 0; iy <= 2; iy++) {
            framePositions.push([x0 - 1, y0 + iy, z0], [x0 + 2, y0 + iy, z0])
        }
        framePositions.push([x0, y0 + 3, z0], [x0 + 1, y0 + 3, z0])
    } else {
        framePositions.push([x0, y0 - 1, z0], [x0, y0 - 1, z0 + 1])
        framePositions.push([x0, y0 - 1, z0 - 1], [x0, y0 - 1, z0 + 2])
        framePositions.push([x0, y0 + 3, z0 - 1], [x0, y0 + 3, z0 + 2])
        for (let iy = 0; iy <= 2; iy++) {
            framePositions.push([x0, y0 + iy, z0 - 1], [x0, y0 + iy, z0 + 2])
        }
        framePositions.push([x0, y0 + 3, z0], [x0, y0 + 3, z0 + 1])
    }

    let level = server.getLevel(dim)
    for (let pos of framePositions) {
        if (pos[0] === brokenX && pos[1] === brokenY && pos[2] === brokenZ) continue
        if (level) {
            let b = level.getBlock(pos[0], pos[1], pos[2])
            if (b && VALID_NETHER_FRAME_BLOCKS.includes(String(b.id)) && String(b.id) !== 'kubejs:infernal_portal_frame') {
                server.runCommandSilent(`execute in ${dim} run setblock ${pos[0]} ${pos[1]} ${pos[2]} kubejs:infernal_portal_frame`)
            }
        }
    }

    server.runCommandSilent(`execute in ${dim} run playsound minecraft:block.respawn_anchor.deplete block @a ${x0} ${y0 + 1} ${z0} 1.2 0.7`)
    server.runCommandSilent(`execute in ${dim} run particle minecraft:smoke ${x0 + 0.5} ${y0 + 1} ${z0 + 0.5} 1.2 1.5 1.2 0.05 35`)
    server.runCommandSilent(`execute in ${dim} run particle minecraft:ash ${x0 + 0.5} ${y0 + 1} ${z0 + 0.5} 1.0 1.5 1.0 0.05 25`)
}

function isAirBlock(level, x, y, z) {
    let block = level.getBlock(x, y, z)
    if (!block) return true
    let id = String(block.id)
    return id === 'minecraft:air' || id === 'minecraft:cave_air' || id === 'minecraft:void_air' ||
           id === 'minecraft:fire' || id === 'minecraft:soul_fire' || id === 'minecraft:light' ||
           id.includes('grass') || id.includes('flower') || id.includes('snow') || id.includes('fern')
}

// Multiblock Detection: Try to match a 4x5 frame (inner 2x3) around the target coordinate
function detectFrame(level, cx, cy, cz) {
    // 1. Try X-Axis Alignment: inner opening [x0..x0+1, y0..y0+2, z0]
    for (let dz = -1; dz <= 1; dz++) {
        let z0 = cz + dz
        for (let dy = -4; dy <= 2; dy++) {
            for (let dx = -3; dx <= 2; dx++) {
                let x0 = cx + dx
                let y0 = cy + dy

                // Check 6 inner blocks are air
                let innerAir = true
                for (let ix = 0; ix <= 1; ix++) {
                    for (let iy = 0; iy <= 2; iy++) {
                        if (!isAirBlock(level, x0 + ix, y0 + iy, z0)) {
                            innerAir = false
                            break
                        }
                    }
                    if (!innerAir) break
                }

                if (innerAir) {
                    let borderValid =
                        isFrameBlock(level, x0, y0 - 1, z0) &&
                        isFrameBlock(level, x0 + 1, y0 - 1, z0) &&
                        isFrameBlock(level, x0, y0 + 3, z0) &&
                        isFrameBlock(level, x0 + 1, y0 + 3, z0) &&
                        isFrameBlock(level, x0 - 1, y0, z0) &&
                        isFrameBlock(level, x0 - 1, y0 + 1, z0) &&
                        isFrameBlock(level, x0 - 1, y0 + 2, z0) &&
                        isFrameBlock(level, x0 + 2, y0, z0) &&
                        isFrameBlock(level, x0 + 2, y0 + 1, z0) &&
                        isFrameBlock(level, x0 + 2, y0 + 2, z0)

                    if (borderValid) {
                        return { axis: 'x', x0: x0, y0: y0, z0: z0 }
                    }
                }
            }
        }
    }

    // 2. Try Z-Axis Alignment: inner opening [x0, y0..y0+2, z0..z0+1]
    for (let dx = -1; dx <= 1; dx++) {
        let x0 = cx + dx
        for (let dy = -4; dy <= 2; dy++) {
            for (let dz = -3; dz <= 2; dz++) {
                let y0 = cy + dy
                let z0 = cz + dz

                let innerAir = true
                for (let iz = 0; iz <= 1; iz++) {
                    for (let iy = 0; iy <= 2; iy++) {
                        if (!isAirBlock(level, x0, y0 + iy, z0 + iz)) {
                            innerAir = false
                            break
                        }
                    }
                    if (!innerAir) break
                }

                if (innerAir) {
                    let borderValid =
                        isFrameBlock(level, x0, y0 - 1, z0) &&
                        isFrameBlock(level, x0, y0 - 1, z0 + 1) &&
                        isFrameBlock(level, x0, y0 + 3, z0) &&
                        isFrameBlock(level, x0, y0 + 3, z0 + 1) &&
                        isFrameBlock(level, x0, y0, z0 - 1) &&
                        isFrameBlock(level, x0, y0 + 1, z0 - 1) &&
                        isFrameBlock(level, x0, y0 + 2, z0 - 1) &&
                        isFrameBlock(level, x0, y0, z0 + 2) &&
                        isFrameBlock(level, x0, y0 + 1, z0 + 2) &&
                        isFrameBlock(level, x0, y0 + 2, z0 + 2)

                    if (borderValid) {
                        return { axis: 'z', x0: x0, y0: y0, z0: z0 }
                    }
                }
            }
        }
    }

    return null
}

// Find safe surface in the Nether with solid ground and adequate headroom (Vanilla Style)
function findSafeNetherSurface(server, targetX, targetZ, preferredY) {
    let level = server.getLevel('minecraft:the_nether')
    let defaultY = (preferredY && preferredY >= 45 && preferredY <= 85) ? preferredY : 70
    if (!level) return { x: targetX, y: defaultY, z: targetZ }

    // Pre-force load chunks so level.getBlock() can read real terrain blocks
    server.runCommandSilent(`execute in minecraft:the_nether positioned ${targetX} 64 ${targetZ} run forceload add ~-16 ~-16 ~16 ~16`)

    let bestPos = null
    let minScore = 999999

    for (let r = 0; r <= 24; r++) {
        for (let dx = -r; dx <= r; dx++) {
            for (let dz = -r; dz <= r; dz++) {
                if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue
                let x = targetX + dx
                let z = targetZ + dz

                // Scan Y from 95 down to 35 (safe range above Nether lava sea)
                for (let y = 95; y >= 35; y--) {
                    let below = level.getBlock(x, y - 1, z)
                    if (!below) continue
                    let belowId = String(below.id)

                    // Must have solid non-hazardous ground below
                    if (belowId === 'minecraft:air' || belowId === 'minecraft:cave_air' || belowId === 'minecraft:void_air' ||
                        belowId.includes('lava') || belowId.includes('fire')) {
                        continue
                    }

                    // Must have at least 5 vertical air blocks for the 5-high portal frame + headroom
                    let clear = true
                    for (let h = 0; h < 5; h++) {
                        let b = level.getBlock(x, y + h, z)
                        let bid = b ? String(b.id) : 'minecraft:air'
                        if (bid !== 'minecraft:air' && bid !== 'minecraft:cave_air' &&
                            !bid.includes('grass') && !bid.includes('spore') && !bid.includes('flower') &&
                            !bid.includes('vine') && !bid.includes('fungus') && !bid.includes('mushroom')) {
                            clear = false
                            break
                        }
                    }
                    if (!clear) continue

                    // Measure headroom above portal (to avoid cramped crawlspaces and structure underbellies!)
                    let headroom = 0
                    for (let h = 5; h <= 14; h++) {
                        let b = level.getBlock(x, y + h, z)
                        let bid = b ? String(b.id) : 'minecraft:air'
                        if (bid === 'minecraft:air' || bid === 'minecraft:cave_air') {
                            headroom++
                        } else {
                            break
                        }
                    }

                    // Heavily penalize cramped spaces with < 4 blocks headroom above portal
                    let crampedPenalty = headroom < 4 ? 80 : 0

                    let dist = Math.sqrt(dx * dx + dz * dz)
                    let score = dist * 1.2 + Math.abs(y - defaultY) * 0.5 - Math.min(headroom, 8) * 1.5 + crampedPenalty
                    if (score < minScore) {
                        minScore = score
                        bestPos = { x: x, y: y, z: z }
                    }
                }
            }
        }
        if (bestPos && r >= 3 && minScore < 40) break // Found a great open spot close to target
    }

    if (bestPos) return bestPos
    return { x: targetX, y: defaultY, z: targetZ }
}



// Find safe surface in Overworld (Y 60..120)
function findSafeOverworldSurface(server, targetX, targetZ) {
    let level = server.getLevel('minecraft:overworld')
    if (!level) return { x: targetX, y: 70, z: targetZ }

    let bestPos = null
    let minScore = 999999

    for (let r = 0; r <= 32; r += 4) {
        for (let dx = -r; dx <= r; dx += 4) {
            for (let dz = -r; dz <= r; dz += 4) {
                let x = targetX + dx
                let z = targetZ + dz

                for (let y = 95; y >= 60; y--) {
                    let b = level.getBlock(x, y, z)
                    if (!b) continue
                    let bid = String(b.id)

                    if (bid === 'minecraft:air' || bid === 'minecraft:cave_air' || bid === 'minecraft:void_air' ||
                        bid.includes('water') || bid.includes('lava') || bid.includes('leaves') ||
                        bid.includes('log') || bid.includes('wood') || bid.includes('mushroom') ||
                        bid.includes('plant') || bid.includes('vine')) {
                        continue
                    }

                    let clear = true
                    for (let h = 1; h <= 5; h++) {
                        let ab = level.getBlock(x, y + h, z)
                        let abid = ab ? String(ab.id) : 'minecraft:air'
                        if (abid !== 'minecraft:air' && abid !== 'minecraft:cave_air' && !abid.includes('grass') && !abid.includes('flower') && !abid.includes('snow')) {
                            clear = false
                            break
                        }
                    }
                    if (!clear) continue

                    let dist = Math.sqrt(dx * dx + dz * dz)
                    let altitudePenalty = (y > 80) ? (y - 80) * 4 : 0
                    let score = dist + Math.abs(y - 68) * 0.8 + altitudePenalty

                    if (score < minScore) {
                        minScore = score
                        bestPos = { x: x, y: y + 1, z: z }
                    }
                }
            }
        }
        if (bestPos && r >= 8 && minScore < 30) break
    }

    if (bestPos) return bestPos
    return { x: targetX, y: 70, z: targetZ }
}

// Dynamically spawn a matching 5x6 Expanded Bastion in Overworld on safe terrain (True Vanilla)
function spawnOverworldPortal(server, ox, oy, oz, axis, portalId) {
    let dim = 'minecraft:overworld'

    server.runCommandSilent(`execute in ${dim} positioned ${ox} ${oy} ${oz} run kill @e[type=block_display,tag=elyrium_progression_portal,distance=..8]`)
    server.runCommandSilent(`execute in ${dim} positioned ${ox} ${oy} ${oz} run kill @e[type=interaction,tag=elyrium_progression_portal,distance=..8]`)

    let minX = ox - 1
    let maxX = ox + 2
    let minZ = (axis === 'z' ? oz - 1 : oz - 1)
    let maxZ = (axis === 'z' ? oz + 2 : oz + 1)

    server.runCommandSilent(`execute in ${dim} run fill ${minX} ${oy - 1} ${minZ} ${maxX} ${oy - 1} ${maxZ} minecraft:stone_bricks replace minecraft:air`)
    server.runCommandSilent(`execute in ${dim} run fill ${minX} ${oy - 1} ${minZ} ${maxX} ${oy - 1} ${maxZ} minecraft:stone_bricks replace minecraft:cave_air`)
    server.runCommandSilent(`execute in ${dim} run fill ${minX} ${oy - 1} ${minZ} ${maxX} ${oy - 1} ${maxZ} minecraft:stone_bricks replace minecraft:void_air`)
    server.runCommandSilent(`execute in ${dim} run fill ${minX} ${oy - 1} ${minZ} ${maxX} ${oy - 1} ${maxZ} minecraft:stone_bricks replace minecraft:water`)
    server.runCommandSilent(`execute in ${dim} run fill ${minX} ${oy - 1} ${minZ} ${maxX} ${oy - 1} ${maxZ} minecraft:stone_bricks replace minecraft:lava`)
    server.runCommandSilent(`execute in ${dim} run fill ${minX} ${oy} ${minZ} ${maxX} ${oy + 4} ${maxZ} minecraft:air`)

    activateCanonicalPortal(server, dim, axis, ox, oy, oz, portalId + '_return')

    registerGeneratedFrameBlocks(dim, ox, oy, oz, axis)
    registerKnownFrame(dim, ox, oy, oz, axis)
    registerGeneratedPlatformBlocks(dim, minX, maxX, minZ, maxZ, oy)
}

function spawnNetherPortal(server, nx, ny, nz, axis, portalId) {
    let dim = 'minecraft:the_nether'

    server.runCommandSilent(`execute in ${dim} positioned ${nx} ${ny} ${nz} run kill @e[type=block_display,tag=elyrium_progression_portal,distance=..8]`)
    server.runCommandSilent(`execute in ${dim} positioned ${nx} ${ny} ${nz} run kill @e[type=interaction,tag=elyrium_progression_portal,distance=..8]`)

    let minX = nx - 1
    let maxX = nx + 2
    let minZ = (axis === 'z' ? nz - 1 : nz - 1)
    let maxZ = (axis === 'z' ? nz + 2 : nz + 1)

    server.runCommandSilent(`execute in ${dim} run fill ${minX} ${ny - 1} ${minZ} ${maxX} ${ny - 1} ${maxZ} minecraft:polished_blackstone_bricks replace minecraft:air`)
    server.runCommandSilent(`execute in ${dim} run fill ${minX} ${ny - 1} ${minZ} ${maxX} ${ny - 1} ${maxZ} minecraft:polished_blackstone_bricks replace minecraft:cave_air`)
    server.runCommandSilent(`execute in ${dim} run fill ${minX} ${ny - 1} ${minZ} ${maxX} ${ny - 1} ${maxZ} minecraft:polished_blackstone_bricks replace minecraft:void_air`)
    server.runCommandSilent(`execute in ${dim} run fill ${minX} ${ny - 1} ${minZ} ${maxX} ${ny - 1} ${maxZ} minecraft:polished_blackstone_bricks replace minecraft:lava`)
    server.runCommandSilent(`execute in ${dim} run fill ${minX} ${ny - 1} ${minZ} ${maxX} ${ny - 1} ${maxZ} minecraft:polished_blackstone_bricks replace minecraft:fire`)
    server.runCommandSilent(`execute in ${dim} run fill ${minX} ${ny} ${minZ} ${maxX} ${ny + 4} ${maxZ} minecraft:air`)

    activateCanonicalPortal(server, dim, axis, nx, ny, nz, portalId + '_return')

    registerGeneratedFrameBlocks(dim, nx, ny, nz, axis)
    registerKnownFrame(dim, nx, ny, nz, axis)
    registerGeneratedPlatformBlocks(dim, minX, maxX, minZ, maxZ, ny)
}

ServerEvents.loaded(event => {
    let server = event.server
    loadPortals(server)
    loadGeneratedFrames()
    loadGeneratedPlatforms()
    loadKnownFrames()
    for (let p of activeProgressionPortals) {
        spawnExpandedActiveBastion(server, p.dim, p.axis, p.x0, p.y0, p.z0, p.id)
    }
})

// Unified Portal Ignition Handler (Bidirectional: Overworld <-> Nether)
function tryIgnitePortal(player, targetX, targetY, targetZ) {
    let server = player.server
    let level = player.level
    let currentDim = getDimId(level)

    let isOverworld = currentDim.includes('overworld')
    let isNether = currentDim.includes('nether')

    if (!isOverworld && !isNether) {
        server.runCommandSilent(`title ${player.username} actionbar {"text":"§eПортал Инфернального Прорыва действует только между Верхним Миром и Незером!","color":"gold"}`)
        return false
    }

    // 1. Check knownPortalFrames first (fast, reliable, covers all 14 frame blocks and 6 aperture blocks)
    let frame = knownPortalFrames.find(kf => {
        if (kf.dim !== currentDim) return false
        if (kf.axis === 'x') {
            return Math.abs(targetZ - kf.z0) <= 2 && targetX >= kf.x0 - 2 && targetX <= kf.x0 + 3 && targetY >= kf.y0 - 2 && targetY <= kf.y0 + 5
        } else {
            return Math.abs(targetX - kf.x0) <= 2 && targetZ >= kf.z0 - 2 && targetZ <= kf.z0 + 3 && targetY >= kf.y0 - 2 && targetY <= kf.y0 + 5
        }
    })

    // If frame found in known frames, verify structural integrity (at least 10 blocks)
    if (frame) {
        let intact = countIntactFrameBlocks(level, frame)
        if (intact < 10) {
            frame = null
        }
    }

    // 2. If not found in known frames, try detecting frame around target coordinate
    if (!frame) {
        frame = detectFrame(level, targetX, targetY, targetZ)
    }
    if (!frame) {
        for (let ox of [-2, -1, 0, 1, 2]) {
            for (let oy of [-2, -1, 0, 1, 2]) {
                for (let oz of [-2, -1, 0, 1, 2]) {
                    frame = detectFrame(level, targetX + ox, targetY + oy, targetZ + oz)
                    if (frame) break
                }
                if (frame) break
            }
            if (frame) break
        }
    }

    if (!frame) {
        server.runCommandSilent(`title ${player.username} actionbar {"text":"§cРамка не собрана! Требуется прямоугольник 4х5 (проём 2х3) исключительно из Инфернального Обсидиана.","color":"red"}`)
        server.runCommandSilent(`playsound minecraft:block.fire.extinguish player @a[name=${player.username}] ~ ~ ~ 1.0 1.0`)
        return false
    }

    let axis = frame.axis
    let x0 = frame.x0
    let y0 = frame.y0
    let z0 = frame.z0

    // Igniter acts as KEY: if already active, clicking with key LOCKS and EXTINGUISHES the portal!
    let existing = activeProgressionPortals.find(p => p.dim === currentDim && p.x0 === x0 && p.y0 === y0 && p.z0 === z0)
    if (existing) {
        extinguishPortalAndLinked(server, existing, { x: x0, y: y0, z: z0 })
        server.runCommandSilent(`playsound minecraft:block.fire.extinguish block @a ${x0} ${y0} ${z0} 1.2 1.0`)
        server.runCommandSilent(`playsound minecraft:block.beacon.deactivate block @a ${x0} ${y0} ${z0} 1.0 0.8`)
        server.runCommandSilent(`playsound minecraft:block.iron_door.close block @a ${x0} ${y0} ${z0} 1.2 0.7`)
        server.runCommandSilent(`title ${player.username} actionbar {"text":"§e[Разлом] Врата заперты Инфернальным Ключом.","color":"gold"}`)
        return true
    }

    let portalId = 'infernal_' + Date.now()

    // 1. Play Epic Single-Phase Activation Audio & VFX (Direct Awakening from Sleeping State)
    let soundX = (axis === 'x' ? x0 + 0.5 : x0)
    let soundY = y0 + 1.5
    let soundZ = (axis === 'z' ? z0 + 0.5 : z0)

    server.runCommandSilent(`playsound minecraft:item.flintandsteel.use block @a ${soundX} ${soundY} ${soundZ} 1.5 1.0`)
    server.runCommandSilent(`playsound minecraft:block.end_portal.spawn block @a ${soundX} ${soundY} ${soundZ} 1.4 0.8`)
    server.runCommandSilent(`playsound minecraft:item.totem.use player @a[name=${player.username}] ${soundX} ${soundY} ${soundZ} 1.0 1.3`)
    server.runCommandSilent(`playsound minecraft:block.heavy_core.break block @a ${soundX} ${soundY} ${soundZ} 1.5 0.7`)
    server.runCommandSilent(`playsound minecraft:block.anvil.land block @a ${soundX} ${soundY} ${soundZ} 1.3 0.6`)
    server.runCommandSilent(`playsound minecraft:entity.ender_dragon.growl ambient @a ${soundX} ${soundY} ${soundZ} 0.8 1.1`)
    server.runCommandSilent(`playsound minecraft:ambient.crimson_forest.mood ambient @a[name=${player.username}] ~ ~ ~ 1.5 0.9`)

    // Single grand burst VFX
    server.runCommandSilent(`particle minecraft:flame ${soundX} ${soundY} ${soundZ} 1.2 1.5 1.2 0.1 80`)
    server.runCommandSilent(`particle minecraft:lava ${soundX} ${soundY} ${soundZ} 1.0 1.2 1.0 0.1 40`)
    server.runCommandSilent(`particle minecraft:smoke ${soundX} ${soundY} ${soundZ} 1.2 1.5 1.2 0.05 50`)
    server.runCommandSilent(`particle minecraft:explosion_emitter ${soundX} ${soundY} ${soundZ} 0.5 0.5 0.5 0.0 3`)

    // 2. Cinematic Expansion: Columns slide outward, lintel and eye rise, snapping into 4x5 physical bastion
    triggerExpansionAnimation(server, currentDim, axis, x0, y0, z0, portalId)

    // Return position right in front of ignited portal (2.5 blocks offset so player lands safely outside selector)
    let myReturnX = (axis === 'x' ? x0 + 1.0 : (player.x >= x0 ? x0 + 2.5 : x0 - 2.5))
    let myReturnY = y0
    let myReturnZ = (axis === 'z' ? z0 + 1.0 : (player.z >= z0 ? z0 + 2.5 : z0 - 2.5))
    let myYaw = (axis === 'x' ? (player.z >= z0 ? 0.0 : 180.0) : (player.x >= x0 ? 90.0 : -90.0))

    let targetDim = isOverworld ? 'minecraft:the_nether' : 'minecraft:overworld'
    let approxTargetX = isOverworld ? Math.floor(x0 / 8) : (x0 * 8)
    let approxTargetZ = isOverworld ? Math.floor(z0 / 8) : (z0 * 8)
    // Standard Vanilla Search Radius: 128 in Nether, 1024 in Overworld (1:8 coordinate ratio)
    let searchRadius = isOverworld ? 128 : 1024

    // 3. Search for existing active portal in target dimension (closest by distance)
    let existingTargetPortal = null
    let bestActiveDist = 999999
    for (let p of activeProgressionPortals) {
        if (p.dim === targetDim) {
            let dx = p.x0 - approxTargetX
            let dz = p.z0 - approxTargetZ
            let dist = Math.sqrt(dx * dx + dz * dz)
            if (dist <= searchRadius && dist < bestActiveDist) {
                bestActiveDist = dist
                existingTargetPortal = p
            }
        }
    }

    // Fast in-memory check: does an intact frame already exist in target dimension near approx target?
    let targetLevel = server.getLevel(targetDim)
    let existingFrame = null
    if (!existingTargetPortal && targetLevel) {
        // 1. Check knownPortalFrames (closest by distance, validating blocks exist)
        let bestDist = 999999
        let bestFrame = null
        for (let i = knownPortalFrames.length - 1; i >= 0; i--) {
            let kf = knownPortalFrames[i]
            if (kf.dim === targetDim) {
                server.runCommandSilent(`execute in ${targetDim} positioned ${kf.x0} ${kf.y0} ${kf.z0} run forceload add ~ ~ ~ ~`)
                let intact = countIntactFrameBlocks(targetLevel, kf)
                server.runCommandSilent(`execute in ${targetDim} positioned ${kf.x0} ${kf.y0} ${kf.z0} run forceload remove ~ ~ ~ ~`)
                if (intact < 4) {
                    knownPortalFrames.splice(i, 1)
                    saveKnownFrames()
                    continue
                }
                let dx = kf.x0 - approxTargetX
                let dz = kf.z0 - approxTargetZ
                let dist = Math.sqrt(dx * dx + dz * dz)
                if (dist <= searchRadius && dist < bestDist) {
                    bestDist = dist
                    bestFrame = kf
                }
            }
        }
        if (bestFrame) {
            existingFrame = { axis: bestFrame.axis, x0: bestFrame.x0, y0: bestFrame.y0, z0: bestFrame.z0 }
        }

        // 2. Check generatedFrameBlocks as fallback
        if (!existingFrame) {
            for (let entry of generatedFrameBlocks) {
                let parts = entry.split(':')
                if (parts.length === 4 && parts[0] === targetDim) {
                    let gx = parseInt(parts[1])
                    let gy = parseInt(parts[2])
                    let gz = parseInt(parts[3])
                    if (Math.abs(gx - approxTargetX) <= searchRadius && Math.abs(gz - approxTargetZ) <= searchRadius) {
                        let candidate = detectFrame(targetLevel, gx, gy, gz)
                        if (candidate) {
                            existingFrame = candidate
                            break
                        }
                    }
                }
            }
        }
    }

    let tx, ty, tz, targetArrivalX, targetArrivalY, targetArrivalZ, targetYaw

    if (existingTargetPortal) {
        // Re-use and link to existing portal
        tx = existingTargetPortal.x0
        ty = existingTargetPortal.y0
        tz = existingTargetPortal.z0
        targetArrivalX = existingTargetPortal.returnPos ? existingTargetPortal.returnPos[0] : (existingTargetPortal.axis === 'x' ? tx + 1.0 : tx + 2.5)
        targetArrivalY = existingTargetPortal.returnPos ? existingTargetPortal.returnPos[1] : ty
        targetArrivalZ = existingTargetPortal.returnPos ? existingTargetPortal.returnPos[2] : (existingTargetPortal.axis === 'z' ? tz + 1.0 : tz + 2.5)
        targetYaw = existingTargetPortal.returnPos ? existingTargetPortal.returnPos[3] : 90.0

        // Link existing portal back to this portal
        existingTargetPortal.targetPos = [myReturnX, myReturnY, myReturnZ, myYaw]
        let destName = isOverworld ? 'Вратами Незера' : 'Вратами Верхнего Мира'
        player.tell(`§6[Разлом] §aОбнаружен пространственный резонанс! Портал связан с существующими ${destName} на (${tx}, ${ty}, ${tz}).`)
    } else if (existingFrame) {
        // Re-ignite existing frame in target dimension!
        tx = existingFrame.x0
        ty = existingFrame.y0
        tz = existingFrame.z0
        let frameAxis = existingFrame.axis

        // Clean up any stray displays or interactions in aperture
        server.runCommandSilent(`execute in ${targetDim} positioned ${tx} ${ty} ${tz} run kill @e[type=block_display,tag=elyrium_progression_portal,distance=..8]`)
        server.runCommandSilent(`execute in ${targetDim} positioned ${tx} ${ty} ${tz} run kill @e[type=interaction,tag=elyrium_progression_portal,distance=..8]`)

        // Spawn expanded active bastion
        spawnExpandedActiveBastion(server, targetDim, frameAxis, tx, ty, tz, portalId + '_return')

        targetArrivalX = (frameAxis === 'x' ? tx + 1.0 : tx + 2.5)
        targetArrivalY = ty
        targetArrivalZ = (frameAxis === 'z' ? tz + 1.0 : tz + 2.5)
        targetYaw = (frameAxis === 'x' ? 0.0 : 90.0)

        let remotePortal = {
            id: portalId + '_return',
            dim: targetDim,
            axis: frameAxis,
            x0: tx,
            y0: ty,
            z0: tz,
            targetDim: currentDim,
            targetPos: [myReturnX, myReturnY, myReturnZ, myYaw],
            returnPos: [targetArrivalX, targetArrivalY, targetArrivalZ, targetYaw]
        }
        activeProgressionPortals.push(remotePortal)
        registerKnownFrame(targetDim, tx, ty, tz, frameAxis)
        let destName = isOverworld ? 'Вратами Незера' : 'Вратами Верхнего Мира'
        player.tell(`§6[Разлом] §aВрата открыты! Пространственный мост соединен с существующими ${destName} на (${tx}, ${ty}, ${tz})!`)
    } else {
        if (isOverworld) {
            // Spawn Nether outpost with safety platform
            let safePos = findSafeNetherSurface(server, approxTargetX, approxTargetZ, y0)
            tx = safePos.x
            ty = safePos.y
            tz = safePos.z
            spawnNetherPortal(server, tx, ty, tz, axis, portalId)
            targetArrivalX = (axis === 'x' ? tx + 1.0 : tx + 2.5)
            targetArrivalY = ty
            targetArrivalZ = (axis === 'z' ? tz + 1.0 : tz + 2.5)
            targetYaw = (axis === 'x' ? 0.0 : 90.0)

            let remotePortal = {
                id: portalId + '_return',
                dim: targetDim,
                axis: axis,
                x0: tx,
                y0: ty,
                z0: tz,
                targetDim: currentDim,
                targetPos: [myReturnX, myReturnY, myReturnZ, myYaw],
                returnPos: [targetArrivalX, targetArrivalY, targetArrivalZ, targetYaw]
            }
            activeProgressionPortals.push(remotePortal)
            player.tell(`§6[Разлом] §aВрата открыты! В Незере на координатах (${tx}, ${ty}, ${tz}) возведен портал перехода.`)
        } else {
            // Spawn Overworld return portal
            let safePos = findSafeOverworldSurface(server, approxTargetX, approxTargetZ)
            tx = safePos.x
            ty = safePos.y
            tz = safePos.z
            spawnOverworldPortal(server, tx, ty, tz, axis, portalId)
            targetArrivalX = (axis === 'x' ? tx + 1.0 : tx + 2.5)
            targetArrivalY = ty
            targetArrivalZ = (axis === 'z' ? tz + 1.0 : tz + 2.5)
            targetYaw = (axis === 'x' ? 0.0 : 90.0)

            let remotePortal = {
                id: portalId + '_return',
                dim: targetDim,
                axis: axis,
                x0: tx,
                y0: ty,
                z0: tz,
                targetDim: currentDim,
                targetPos: [myReturnX, myReturnY, myReturnZ, myYaw],
                returnPos: [targetArrivalX, targetArrivalY, targetArrivalZ, targetYaw]
            }
            activeProgressionPortals.push(remotePortal)
            player.tell(`§6[Разлом] §aВрата открыты! В Верхнем Мире на координатах (${tx}, ${ty}, ${tz}) материализован портал возвращения.`)
        }
    }

    // 4. Register This Portal
    let thisPortal = {
        id: portalId,
        dim: currentDim,
        axis: axis,
        x0: x0,
        y0: y0,
        z0: z0,
        targetDim: targetDim,
        targetPos: [targetArrivalX, targetArrivalY, targetArrivalZ, targetYaw],
        returnPos: [myReturnX, myReturnY, myReturnZ, myYaw]
    }
    activeProgressionPortals.push(thisPortal)
    registerKnownFrame(currentDim, x0, y0, z0, axis)
    savePortals()

    // 5. Player Notification
    server.runCommandSilent(`title ${player.username} times 10 60 20`)
    if (isOverworld) {
        server.runCommandSilent(`title ${player.username} title {"text":"⚔ ВРАТА ПРЕИСПОДНЕЙ ⚔","color":"dark_red","bold":true}`)
        server.runCommandSilent(`title ${player.username} subtitle {"text":"Разлом в Ад материализован!","color":"gold"}`)
    } else {
        server.runCommandSilent(`title ${player.username} title {"text":"✨ ВОЗВРАЩЕНИЕ В ЭЛИРИУМ ✨","color":"aqua","bold":true}`)
        server.runCommandSilent(`title ${player.username} subtitle {"text":"Проход в Верхний Мир стабилизирован!","color":"gold"}`)
    }
    return true
}

// Helper to damage the infernal igniter - now an unbreakable key!
function damageKeyItem(player, item, itemId) {
    // Unbreakable key: permanent, no durability loss
}

// Block Interaction: Right Click directly on ANY block (frame or ground)
BlockEvents.rightClicked(event => {
    let player = event.player
    let block = event.block
    if (!player || !block) return
    let hand = String(event.hand)
    if (hand !== 'MAIN_HAND') return

    let item = event.item || player.mainHandItem
    let itemId = item ? String(item.id) : ''
    let dim = getDimId(player.level)
    let isOverworld = (dim === 'minecraft:overworld')
    let pName = String(player.username)

    let isCatalyst = (itemId === 'kubejs:infernal_igniter') ||
                     (itemId === 'kubejs:world_heart') ||
                     (itemId === 'cataclysm:burning_ashes') ||
                     (!isOverworld && itemId === 'minecraft:flint_and_steel') ||
                     (item && item.components && item.components['minecraft:custom_data'] && item.components['minecraft:custom_data'].infernal_catalyst) ||
                     (item && item.nbt && item.nbt.infernal_catalyst)

    let isExtinguish = (itemId === 'minecraft:water_bucket') ||
                       ((itemId === '' || itemId === 'minecraft:air') && (player.crouching || player.isCrouching() || player.shiftKeyDown))

    if (!isCatalyst && !isExtinguish) return

    // Debounce to prevent rapid double-clicks
    let now = Date.now()
    if (now - (lastExtinguishTime[pName] || 0) < 500) { event.cancel(); return; }
    if (now - (lastIgniteTime[pName] || 0) < 500) { event.cancel(); return; }

    // 1. Check if clicked block is part of or near an ACTIVE progression portal
    let matchedActive = activeProgressionPortals.find(p => {
        if (p.dim !== dim) return false
        if (p.axis === 'x') {
            return Math.abs(block.z - p.z0) <= 2 && block.x >= p.x0 - 3 && block.x <= p.x0 + 4 && block.y >= p.y0 - 2 && block.y <= p.y0 + 7
        } else {
            return Math.abs(block.x - p.x0) <= 2 && block.z >= p.z0 - 3 && block.z <= p.z0 + 4 && block.y >= p.y0 - 2 && block.y <= p.y0 + 7
        }
    })

    if (matchedActive) {
        if (isCatalyst) {
            lastExtinguishTime[pName] = now
            extinguishPortalAndLinked(player.server, matchedActive, { x: block.x, y: block.y, z: block.z })
            player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish block @a ${block.x} ${block.y} ${block.z} 1.2 1.0`)
            player.server.runCommandSilent(`playsound minecraft:block.beacon.deactivate block @a ${block.x} ${block.y} ${block.z} 1.0 0.8`)
            player.server.runCommandSilent(`playsound minecraft:block.iron_door.close block @a ${block.x} ${block.y} ${block.z} 1.2 0.7`)
            player.server.runCommandSilent(`title ${player.username} actionbar {"text":"§e[Разлом] Врата заперты Инфернальным Ключом.","color":"gold"}`)
            damageKeyItem(player, item, itemId)
            event.cancel()
            return
        }

        if (isExtinguish) {
            lastExtinguishTime[pName] = now
            extinguishPortalAndLinked(player.server, matchedActive, { x: block.x, y: block.y, z: block.z })
            if (itemId === 'minecraft:water_bucket' && !player.isCreative()) {
                player.setMainHandItem('minecraft:bucket')
            }
            player.server.runCommandSilent(`playsound minecraft:entity.generic.extinguish_fire block @a ${block.x} ${block.y} ${block.z} 1.2 1.0`)
            player.server.runCommandSilent(`playsound minecraft:item.bucket.empty block @a ${block.x} ${block.y} ${block.z} 1.0 1.0`)
            player.server.runCommandSilent(`title ${player.username} actionbar {"text":"§e[Разлом] Портал деактивирован.","color":"gold"}`)
            event.cancel()
            return
        }
    }

    // Intercept vanilla obsidian portal ignition
    if (block && block.id === 'minecraft:obsidian' && itemId === 'minecraft:flint_and_steel') {
        player.server.runCommandSilent(`title ${player.username} actionbar {"text":"§c⚠ Обычный обсидиан разрушается под давлением Бездны! Нужна Инфернальная Рамка.","color":"red"}`)
        player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player @a[name=${player.username}] ~ ~ ~ 1.0 1.2`)
        event.cancel()
        return
    }

    if (isOverworld && block && VALID_NETHER_FRAME_BLOCKS.includes(String(block.id)) && itemId === 'minecraft:flint_and_steel') {
        player.server.runCommandSilent(`title ${player.username} actionbar {"text":"§c⚠ Обычная искра бессильна перед Инфернальным Обсидианом! Нужно Инфернальное Огниво.","color":"red"}`)
        player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player @a[name=${player.username}] ~ ~ ~ 1.0 1.2`)
        event.cancel()
        return
    }

    if (!isCatalyst) return

    // 2. Clicked a dormant frame block or block nearby: find the canonical frame and IGNITE
    let targetFrame = findFrameForBlock(player.level, dim, block.x, block.y, block.z)
    let igniteX = targetFrame ? targetFrame.x0 : block.x
    let igniteY = targetFrame ? targetFrame.y0 : block.y
    let igniteZ = targetFrame ? targetFrame.z0 : block.z

    event.cancel()
    let ignited = tryIgnitePortal(player, igniteX, igniteY, igniteZ)
    if (ignited) {
        lastIgniteTime[pName] = Date.now()
        damageKeyItem(player, item, itemId)
    }
})

// Item Interaction: Right Click in Air or with crosshair on Aperture / Frame
ItemEvents.rightClicked(event => {
    let player = event.player
    if (!player) return
    let item = event.item || player.mainHandItem
    let itemId = item ? String(item.id) : ''
    let dim = getDimId(player.level)
    let isOverworld = (dim === 'minecraft:overworld')
    let pName = String(player.username)

    let isCatalyst = (itemId === 'kubejs:infernal_igniter') ||
                     (itemId === 'kubejs:world_heart') ||
                     (itemId === 'cataclysm:burning_ashes') ||
                     (!isOverworld && itemId === 'minecraft:flint_and_steel') ||
                     (item && item.components && item.components['minecraft:custom_data'] && item.components['minecraft:custom_data'].infernal_catalyst) ||
                     (item && item.nbt && item.nbt.infernal_catalyst)

    let isExtinguish = (itemId === 'minecraft:water_bucket')

    if (!isCatalyst && !isExtinguish) return

    // Debounce
    let now = Date.now()
    if (now - (lastExtinguishTime[pName] || 0) < 500) { event.cancel(); return; }
    if (now - (lastIgniteTime[pName] || 0) < 500) { event.cancel(); return; }

    let eyeY = player.y + (player.eyeHeight || 1.62)
    let yawRad = -player.yaw * (Math.PI / 180.0)
    let pitchRad = -player.pitch * (Math.PI / 180.0)
    let vx = -Math.sin(yawRad) * Math.cos(pitchRad)
    let vy = Math.sin(pitchRad)
    let vz = Math.cos(yawRad) * Math.cos(pitchRad)

    let ray = player.rayTrace(6.0)
    let rx = ray && ray.block ? ray.block.x : Math.floor(player.x)
    let ry = ray && ray.block ? ray.block.y : Math.floor(player.y)
    let rz = ray && ray.block ? ray.block.z : Math.floor(player.z)

    // 1. Ray-plane intersection with ACTIVE portals
    let matchedActivePortal = null
    for (let p of activeProgressionPortals) {
        if (p.dim !== dim) continue
        if (p.axis === 'x') {
            if (Math.abs(vz) > 0.001) {
                let t = (p.z0 + 0.5 - player.z) / vz
                if (t > 0 && t <= 7.0) {
                    let ix = player.x + vx * t
                    let iy = eyeY + vy * t
                    if (ix >= p.x0 - 1.5 && ix <= p.x0 + 2.5 && iy >= p.y0 - 1.5 && iy <= p.y0 + 4.0) {
                        matchedActivePortal = p
                        rx = Math.floor(ix); ry = Math.floor(iy); rz = p.z0;
                        break
                    }
                }
            }
        } else {
            if (Math.abs(vx) > 0.001) {
                let t = (p.x0 + 0.5 - player.x) / vx
                if (t > 0 && t <= 7.0) {
                    let iz = player.z + vz * t
                    let iy = eyeY + vy * t
                    if (iz >= p.z0 - 1.5 && iz <= p.z0 + 2.5 && iy >= p.y0 - 1.5 && iy <= p.y0 + 4.0) {
                        matchedActivePortal = p
                        rx = p.x0; ry = Math.floor(iy); rz = Math.floor(iz);
                        break
                    }
                }
            }
        }
    }

    if (matchedActivePortal) {
        if (isCatalyst) {
            lastExtinguishTime[pName] = now
            extinguishPortalAndLinked(player.server, matchedActivePortal, { x: rx, y: ry, z: rz })
            player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish block @a ${rx} ${ry} ${rz} 1.2 1.0`)
            player.server.runCommandSilent(`playsound minecraft:block.beacon.deactivate block @a ${rx} ${ry} ${rz} 1.0 0.8`)
            player.server.runCommandSilent(`playsound minecraft:block.iron_door.close block @a ${rx} ${ry} ${rz} 1.2 0.7`)
            player.server.runCommandSilent(`title ${player.username} actionbar {"text":"§e[Разлом] Врата заперты Инфернальным Ключом.","color":"gold"}`)
            damageKeyItem(player, item, itemId)
            event.cancel()
            return
        }
        if (isExtinguish) {
            lastExtinguishTime[pName] = now
            extinguishPortalAndLinked(player.server, matchedActivePortal, { x: rx, y: ry, z: rz })
            if (itemId === 'minecraft:water_bucket' && !player.isCreative()) {
                player.setMainHandItem('minecraft:bucket')
            }
            player.server.runCommandSilent(`playsound minecraft:entity.generic.extinguish_fire block @a ${rx} ${ry} ${rz} 1.2 1.0`)
            player.server.runCommandSilent(`playsound minecraft:item.bucket.empty block @a ${rx} ${ry} ${rz} 1.0 1.0`)
            player.server.runCommandSilent(`title ${player.username} actionbar {"text":"§e[Разлом] Портал деактивирован.","color":"gold"}`)
            event.cancel()
            return
        }
    }

    if (!isCatalyst) return

    // 2. Ray-plane intersection with DORMANT frames
    let targetFrame = null
    for (let kf of knownPortalFrames) {
        if (kf.dim !== dim) continue
        if (kf.axis === 'x') {
            if (Math.abs(vz) > 0.001) {
                let t = (kf.z0 + 0.5 - player.z) / vz
                if (t > 0 && t <= 7.0) {
                    let ix = player.x + vx * t
                    let iy = eyeY + vy * t
                    if (ix >= kf.x0 - 1.8 && ix <= kf.x0 + 2.8 && iy >= kf.y0 - 1.8 && iy <= kf.y0 + 4.5) {
                        targetFrame = kf
                        break
                    }
                }
            }
        } else {
            if (Math.abs(vx) > 0.001) {
                let t = (kf.x0 + 0.5 - player.x) / vx
                if (t > 0 && t <= 7.0) {
                    let iz = player.z + vz * t
                    let iy = eyeY + vy * t
                    if (iz >= kf.z0 - 1.8 && iz <= kf.z0 + 2.8 && iy >= kf.y0 - 1.8 && iy <= kf.y0 + 4.5) {
                        targetFrame = kf
                        break
                    }
                }
            }
        }
    }

    // 3. If not found by ray plane, search around ray hit or player
    if (!targetFrame) {
        targetFrame = findFrameForBlock(player.level, dim, rx, ry, rz)
    }

    let igniteX = targetFrame ? targetFrame.x0 : rx
    let igniteY = targetFrame ? targetFrame.y0 : ry
    let igniteZ = targetFrame ? targetFrame.z0 : rz

    let ignited = tryIgnitePortal(player, igniteX, igniteY, igniteZ)
    if (ignited) {
        lastIgniteTime[pName] = Date.now()
        damageKeyItem(player, item, itemId)
        event.cancel()
    }
})

// Hitbox Interaction: Right-clicking portal interaction entity// Hitbox Interaction: Right-clicking portal interaction entity// Hitbox Interaction: Right-clicking portal interaction entity with Key or Extinguisher
ItemEvents.entityInteracted(event => {
    let player = event.player
    let entity = event.target
    if (!player || !entity) return
    let entityType = String(entity.type)
    if (entityType !== 'minecraft:interaction') return

    let tags = entity.tags
    let isPortalHitbox = false
    if (tags) {
        try {
            isPortalHitbox = tags.contains('portal_hitbox') || tags.contains('elyrium_progression_portal')
        } catch(e) {
            try { isPortalHitbox = tags.indexOf('portal_hitbox') !== -1 } catch(e2) {}
        }
    }
    if (!isPortalHitbox) return

    if (isActionCooldown(player, 600)) {
        event.cancel()
        return
    }

    let dim = getDimId(player.level)
    let item = event.item || player.mainHandItem
    let itemId = item ? String(item.id) : ''
    let isOverworld = (dim === 'minecraft:overworld')

    let isCatalyst = (itemId === 'kubejs:infernal_igniter') ||
                     (itemId === 'kubejs:world_heart') ||
                     (itemId === 'cataclysm:burning_ashes') ||
                     (!isOverworld && itemId === 'minecraft:flint_and_steel') ||
                     (item && item.components && item.components['minecraft:custom_data'] && item.components['minecraft:custom_data'].infernal_catalyst) ||
                     (item && item.nbt && item.nbt.infernal_catalyst)

    let isExtinguish = (itemId === 'minecraft:water_bucket') ||
                       ((itemId === '' || itemId === 'minecraft:air') && (player.crouching || player.isCrouching() || player.shiftKeyDown))

    // Find portal associated with this hitbox
    let matchedPortal = activeProgressionPortals.find(p => {
        if (p.dim !== dim) return false
        try {
            return tags.contains(`hitbox_${p.id}`)
        } catch(e) {
            return tags.indexOf(`hitbox_${p.id}`) !== -1
        }
    })

    if (!matchedPortal) {
        matchedPortal = activeProgressionPortals.find(p => {
            if (p.dim !== dim) return false
            let midX = (p.axis === 'x' ? p.x0 + 0.5 : p.x0)
            let midZ = (p.axis === 'z' ? p.z0 + 0.5 : p.z0)
            return Math.abs(entity.x - midX) <= 3.5 && Math.abs(entity.z - midZ) <= 3.5 && Math.abs(entity.y - (p.y0 + 1.5)) <= 4.0
        })
    }

    if (matchedPortal) {
        if (isCatalyst) {
            extinguishPortalAndLinked(player.server, matchedPortal, { x: entity.x, y: entity.y, z: entity.z })
            player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish block @a ${entity.x} ${entity.y} ${entity.z} 1.2 1.0`)
            player.server.runCommandSilent(`playsound minecraft:block.beacon.deactivate block @a ${entity.x} ${entity.y} ${entity.z} 1.0 0.8`)
            player.server.runCommandSilent(`playsound minecraft:block.iron_door.close block @a ${entity.x} ${entity.y} ${entity.z} 1.2 0.7`)
            player.server.runCommandSilent(`title ${player.username} actionbar {"text":"§e[Разлом] Врата заперты Инфернальным Ключом.","color":"gold"}`)
            damageKeyItem(player, item, itemId)
            event.cancel()
            return
        }

        if (isExtinguish) {
            extinguishPortalAndLinked(player.server, matchedPortal, { x: entity.x, y: entity.y, z: entity.z })
            player.server.runCommandSilent(`title ${player.username} actionbar {"text":"§e[Разлом] Портал деактивирован.","color":"gold"}`)
            event.cancel()
            return
        }
    }

    // Cancel interaction so entity does not accumulate unhandled click states
    event.cancel()
})

// Purge stray portal displays that do not belong to ANY active portal
function purgeStrayPortalDisplays(server) {
    if (!server) return
    let activeTagPrefixes = activeProgressionPortals.map(p => `tag_${p.id}`)
    for (let dim of ['minecraft:the_nether', 'minecraft:overworld']) {
        let level = server.getLevel(dim)
        if (!level) continue

        let entities = level.getEntities()
        for (let e of entities) {
            if (String(e.type) !== 'minecraft:block_display') continue

            let tags = e.tags
            let isPortal = false
            if (tags) {
                try {
                    isPortal = tags.contains('elyrium_progression_portal')
                } catch(err) {
                    try { isPortal = tags.indexOf('elyrium_progression_portal') !== -1 } catch(err2) {}
                }
            }
            if (!isPortal) continue

            // Check if entity has tag of ANY active portal
            let belongsToActive = false
            for (let tagP of activeTagPrefixes) {
                try {
                    if (tags.contains(tagP)) { belongsToActive = true; break; }
                } catch(err) {
                    try { if (tags.indexOf(tagP) !== -1) { belongsToActive = true; break; } } catch(err2) {}
                }
            }

            if (!belongsToActive) {
                try { e.discard() } catch(err) { try { e.kill() } catch(err2) {} }
            }
        }
    }
}

function extinguishPortalAndLinked(server, destroyedPortal, soundPos) {
    if (!destroyedPortal) return

    let midX = (destroyedPortal.axis === 'x' ? destroyedPortal.x0 + 0.5 : destroyedPortal.x0)
    let midY = destroyedPortal.y0 + 1.5
    let midZ = (destroyedPortal.axis === 'z' ? destroyedPortal.z0 + 0.5 : destroyedPortal.z0)

    // 1. Kill displays of the destroyed portal & restore dormant bone bastion
    server.runCommandSilent(`execute in ${destroyedPortal.dim} run kill @e[type=block_display,tag=tag_${destroyedPortal.id}]`)
    server.runCommandSilent(`execute in ${destroyedPortal.dim} run kill @e[type=block_display,tag=elyrium_progression_portal]`)
    server.runCommandSilent(`execute in ${destroyedPortal.dim} positioned ${midX} ${midY} ${midZ} run kill @e[type=block_display,distance=..6]`)
    server.runCommandSilent(`execute in ${destroyedPortal.dim} positioned ${midX} ${midY} ${midZ} run kill @e[type=interaction,distance=..6]`)
    purgePortalDisplaysDirect(server, destroyedPortal.dim, destroyedPortal.id)
    clearActiveBastionBlocks(server, destroyedPortal.dim, destroyedPortal.axis, destroyedPortal.x0, destroyedPortal.y0, destroyedPortal.z0)
    setFrameBlocksState(server, destroyedPortal.dim, destroyedPortal.axis, destroyedPortal.x0, destroyedPortal.y0, destroyedPortal.z0, 'dormant', destroyedPortal.id)

    if (soundPos) {
        server.runCommandSilent(`execute in ${destroyedPortal.dim} run playsound minecraft:block.glass.break block @a ${soundPos.x} ${soundPos.y} ${soundPos.z} 1.5 0.8`)
        server.runCommandSilent(`execute in ${destroyedPortal.dim} run playsound minecraft:block.beacon.deactivate block @a ${soundPos.x} ${soundPos.y} ${soundPos.z} 1.2 0.7`)
        server.runCommandSilent(`execute in ${destroyedPortal.dim} run particle minecraft:smoke ${soundPos.x + 0.5} ${soundPos.y + 0.5} ${soundPos.z + 0.5} 0.5 0.5 0.5 0.05 20`)
    }

    // 2. Find and extinguish the linked twin portal on the other side
    let targetDim = destroyedPortal.targetDim
    let targetPos = destroyedPortal.targetPos
    let toRemoveIds = [destroyedPortal.id]

    if (targetDim && targetPos) {
        for (let other of activeProgressionPortals) {
            if (other.id !== destroyedPortal.id && other.dim === targetDim) {
                let dist = Math.abs(other.x0 - targetPos[0]) + Math.abs(other.z0 - targetPos[2])
                if (dist <= 16) {
                    toRemoveIds.push(other.id)
                    let otherMidX = (other.axis === 'x' ? other.x0 + 0.5 : other.x0)
                    let otherMidY = other.y0 + 1.5
                    let otherMidZ = (other.axis === 'z' ? other.z0 + 0.5 : other.z0)
                    server.runCommandSilent(`execute in ${other.dim} run kill @e[type=block_display,tag=tag_${other.id}]`)
                    server.runCommandSilent(`execute in ${other.dim} run kill @e[type=block_display,tag=elyrium_progression_portal]`)
                    server.runCommandSilent(`execute in ${other.dim} positioned ${otherMidX} ${otherMidY} ${otherMidZ} run kill @e[type=block_display,distance=..6]`)
                    server.runCommandSilent(`execute in ${other.dim} positioned ${otherMidX} ${otherMidY} ${otherMidZ} run kill @e[type=interaction,distance=..6]`)
                    purgePortalDisplaysDirect(server, other.dim, other.id)
                    clearActiveBastionBlocks(server, other.dim, other.axis, other.x0, other.y0, other.z0)
                    setFrameBlocksState(server, other.dim, other.axis, other.x0, other.y0, other.z0, 'dormant', other.id)
                    server.runCommandSilent(`execute in ${other.dim} run playsound minecraft:block.beacon.deactivate block @a ${other.x0} ${other.y0} ${other.z0} 1.5 0.7`)
                    server.runCommandSilent(`execute in ${other.dim} run particle minecraft:smoke ${other.x0 + 0.5} ${other.y0 + 1.0} ${other.z0 + 0.5} 0.5 0.5 0.5 0.05 25`)
                }
            }
        }
    }

    activeProgressionPortals = activeProgressionPortals.filter(p => !toRemoveIds.includes(p.id))
    savePortals()
    purgeStrayPortalDisplays(server)

    server.tell('§c[Разлом] §4Пространственный мост оборван! Портал деактивирован.')
}

let suppressedDropCoords = {}

const ANTI_FARM_ITEM_IDS = [
    'kubejs:infernal_portal_frame',
    'kubejs:infernal_portal_frame_active',
    'kubejs:infernal_portal_frame_eye_left',
    'kubejs:infernal_portal_frame_eye_right',
    'minecraft:polished_blackstone_bricks',
    'minecraft:polished_blackstone_brick_wall',
    'minecraft:soul_lantern',
    'minecraft:stone_bricks'
]

// Intercept and handle items dropped from portal blocks (convert technical parts to base frame, discard anti-farm)
EntityEvents.spawned(event => {
    let entity = event.entity
    if (!entity) return
    let type = String(entity.type)
    if (type !== 'minecraft:item') return

    let item = entity.item
    if (!item) return
    let itemId = String(item.id)

    let level = entity.level
    if (!level) return
    let server = entity.server || level.server
    let dim = getDimId(level)
    let ex = entity.x
    let ey = entity.y
    let ez = entity.z

    let matchedKey = null
    for (let key in suppressedDropCoords) {
        if (server && server.tickCount > suppressedDropCoords[key]) {
            delete suppressedDropCoords[key]
            continue
        }
        let parts = key.split(':')
        if (parts.length === 4 && parts[0] === dim) {
            let kx = parseInt(parts[1])
            let ky = parseInt(parts[2])
            let kz = parseInt(parts[3])
            let distSq = (ex - (kx + 0.5)) * (ex - (kx + 0.5)) +
                         (ey - (ky + 0.5)) * (ey - (ky + 0.5)) +
                         (ez - (kz + 0.5)) * (ez - (kz + 0.5))
            if (distSq <= 2.25) {
                matchedKey = key
                break
            }
        }
    }

    if (matchedKey) {
        try { entity.discard() } catch(e) {}
        event.cancel()
        delete suppressedDropCoords[matchedKey]
        return
    }

    // Convert ANY technical portal block drop into the canonical infernal_portal_frame item!
    if (VALID_NETHER_FRAME_BLOCKS.includes(itemId) && itemId !== 'kubejs:infernal_portal_frame') {
        try {
            entity.setItem(Item.of('kubejs:infernal_portal_frame', item.count))
        } catch(e) {
            try { entity.item = Item.of('kubejs:infernal_portal_frame', item.count) } catch(e2) {}
        }
    }
})

// Frame Break Listener: Destroy Portal if Frame is broken & Prevent farming generated blocks
BlockEvents.broken(event => {
    let block = event.block
    let level = event.level
    let server = event.server || level.server
    if (!server) return
    let bx = block.x
    let by = block.y
    let bz = block.z
    let dim = getDimId(level)

    let blockKey = `${dim}:${bx}:${by}:${bz}`

    // 1. Anti-farm check: Generated platform blocks (floor, walls, lanterns, pillars)
    // Drops NOTHING, crumbles to dust, NO fatigue, NO warning, does NOT break portal!
    if (generatedPlatformBlocks.has(blockKey)) {
        generatedPlatformBlocks.delete(blockKey)
        saveGeneratedPlatforms()

        suppressedDropCoords[blockKey] = server.tickCount + 10
        try { event.setExpToDrop(0) } catch(e) {}

        server.runCommandSilent(`execute in ${dim} run playsound minecraft:block.stone.break block @a ${bx} ${by} ${bz} 1.0 0.9`)
        server.runCommandSilent(`execute in ${dim} run particle minecraft:smoke ${bx + 0.5} ${by + 0.5} ${bz + 0.5} 0.2 0.2 0.2 0.05 10`)
        server.runCommandSilent(`execute in ${dim} run particle minecraft:ash ${bx + 0.5} ${by + 0.5} ${bz + 0.5} 0.3 0.3 0.3 0.05 15`)
        return
    }

    // 2. Anti-farm check: Generated frame blocks drop NOTHING and crumble to ash
    let isGenerated = generatedFrameBlocks.has(blockKey)

    if (isGenerated) {
        generatedFrameBlocks.delete(blockKey)
        saveGeneratedFrames()

        suppressedDropCoords[blockKey] = server.tickCount + 10
        try { event.setExpToDrop(0) } catch(e) {}

        server.runCommandSilent(`execute in ${dim} run playsound minecraft:block.glass.break block @a ${bx} ${by} ${bz} 1.2 0.8`)
        server.runCommandSilent(`execute in ${dim} run playsound minecraft:entity.iron_golem.damage block @a ${bx} ${by} ${bz} 1.0 0.5`)
        server.runCommandSilent(`execute in ${dim} run particle minecraft:smoke ${bx + 0.5} ${by + 0.5} ${bz + 0.5} 0.3 0.3 0.3 0.05 15`)
        server.runCommandSilent(`execute in ${dim} run particle minecraft:ash ${bx + 0.5} ${by + 0.5} ${bz + 0.5} 0.5 0.5 0.5 0.1 25`)

        let player = event.player
        if (player) {
            player.tell('§c[Разлом] §eПроекция Разлома рассеялась в пепел! Сгенерированные блоки нельзя зафармить (0 дропа).')
            server.runCommandSilent(`title ${player.username} actionbar {"text":"§c⚠ Проекция Разлома рассеялась в пепел! Сгенерированные блоки нельзя зафармить.","color":"red"}`)
        }
    }

    // 1. Breaking any block of an active portal destroys the portal and reverts frame to standard!
    for (let portal of activeProgressionPortals) {
        if (portal.dim !== dim) continue

        let isPart = false
        if (portal.axis === 'x') {
            // Canonical 14-block frame: X in [x0 - 1, x0 + 2], Y in [y0 - 1, y0 + 3], Z == z0
            if (bz === portal.z0 && bx >= portal.x0 - 1 && bx <= portal.x0 + 2 && by >= portal.y0 - 1 && by <= portal.y0 + 3) {
                let isInner = (bx >= portal.x0 && bx <= portal.x0 + 1 && by >= portal.y0 && by <= portal.y0 + 2)
                if (!isInner) isPart = true
            }
        } else {
            // Axis Z: Z in [z0 - 1, z0 + 2], Y in [y0 - 1, y0 + 3], X == x0
            if (bx === portal.x0 && bz >= portal.z0 - 1 && bz <= portal.z0 + 2 && by >= portal.y0 - 1 && by <= portal.y0 + 3) {
                let isInner = (bz >= portal.z0 && bz <= portal.z0 + 1 && by >= portal.y0 && by <= portal.y0 + 2)
                if (!isInner) isPart = true
            }
        }

        if (isPart) {
            // Extinguish active portal immediately & clean displays
            extinguishPortalAndLinked(server, portal, { x: bx, y: by, z: bz })
            // Revert the remaining 13 frame blocks back to basic building block
            revertDormantFrameToStandard(server, dim, portal.axis, portal.x0, portal.y0, portal.z0, bx, by, bz)
            // Remove from known frames
            let kfIdx = knownPortalFrames.findIndex(kf => kf.dim === dim && kf.x0 === portal.x0 && kf.y0 === portal.y0 && kf.z0 === portal.z0)
            if (kfIdx !== -1) {
                knownPortalFrames.splice(kfIdx, 1)
                saveKnownFrames()
            }
            if (event.player) {
                server.runCommandSilent(`title ${event.player.username} actionbar {"text":"§c[Разлом] Врата разрушены! Портал погас.","color":"red"}`)
            }
            break
        }
    }

    // 2. Revert dormant bastion if damaged
    let isFrameActive = activeProgressionPortals.some(p => p.dim === dim && ((p.axis === 'x' && Math.abs(p.z0 - bz) <= 1 && Math.abs(p.x0 - bx) <= 4) || (p.axis === 'z' && Math.abs(p.x0 - bx) <= 1 && Math.abs(p.z0 - bz) <= 4)))
    if (!isFrameActive) {
        for (let i = knownPortalFrames.length - 1; i >= 0; i--) {
            let kf = knownPortalFrames[i]
            if (kf.dim === dim) {
                let isPart = false
                if (kf.axis === 'x') {
                    if (bz === kf.z0 && bx >= kf.x0 - 1 && bx <= kf.x0 + 2 && by >= kf.y0 - 1 && by <= kf.y0 + 3) {
                        let isInner = (bx >= kf.x0 && bx <= kf.x0 + 1 && by >= kf.y0 && by <= kf.y0 + 2)
                        if (!isInner) isPart = true
                    }
                } else {
                    if (bx === kf.x0 && bz >= kf.z0 - 1 && bz <= kf.z0 + 2 && by >= kf.y0 - 1 && by <= kf.y0 + 3) {
                        let isInner = (bz >= kf.z0 && bz <= kf.z0 + 1 && by >= kf.y0 && by <= kf.y0 + 2)
                        if (!isInner) isPart = true
                    }
                }
                if (isPart) {
                    revertDormantFrameToStandard(server, dim, kf.axis, kf.x0, kf.y0, kf.z0, bx, by, bz)
                    knownPortalFrames.splice(i, 1)
                    saveKnownFrames()
                    if (event.player) {
                        server.runCommandSilent(`title ${event.player.username} actionbar {"text":"§e[Костяной Бастион] Конструкция нарушена! Бастион распался на блоки рамки.","color":"gold"}`)
                    }
                    break
                }
            }
        }
    }
})

// Creative mode instant destruction of active portal frame on left click
BlockEvents.leftClicked(event => {
    let player = event.player
    if (!player || !player.isCreative()) return
    let block = event.block
    if (!block) return
    let dim = getDimId(event.level)

    for (let portal of activeProgressionPortals) {
        if (portal.dim !== dim) continue
        let isPart = false
        if (portal.axis === 'x') {
            if (block.z === portal.z0 && block.x >= portal.x0 - 1 && block.x <= portal.x0 + 2 && block.y >= portal.y0 - 1 && block.y <= portal.y0 + 3) {
                let isInner = (block.x >= portal.x0 && block.x <= portal.x0 + 1 && block.y >= portal.y0 && block.y <= portal.y0 + 2)
                if (!isInner) isPart = true
            }
        } else {
            if (block.x === portal.x0 && block.z >= portal.z0 - 1 && block.z <= portal.z0 + 2 && block.y >= portal.y0 - 1 && block.y <= portal.y0 + 3) {
                let isInner = (block.z >= portal.z0 && block.z <= portal.z0 + 1 && block.y >= portal.y0 && block.y <= portal.y0 + 2)
                if (!isInner) isPart = true
            }
        }
        if (isPart) {
            let srv = player.server || event.level.server
            extinguishPortalAndLinked(srv, portal, { x: block.x, y: block.y, z: block.z })
            revertDormantFrameToStandard(srv, dim, portal.axis, portal.x0, portal.y0, portal.z0, block.x, block.y, block.z)
            let kfIdx = knownPortalFrames.findIndex(kf => kf.dim === dim && kf.x0 === portal.x0 && kf.y0 === portal.y0 && kf.z0 === portal.z0)
            if (kfIdx !== -1) {
                knownPortalFrames.splice(kfIdx, 1)
                saveKnownFrames()
            }
            srv.runCommandSilent(`execute in ${dim} run setblock ${block.x} ${block.y} ${block.z} minecraft:air destroy`)
            srv.runCommandSilent(`title ${player.username} actionbar {"text":"§c[Разлом] Врата разрушены! Портал погас.","color":"red"}`)
            break
        }
    }
})

// Player placing blocks clears generated marker if player manually builds there
BlockEvents.placed(event => {
    let block = event.block
    if (!block) return
    let dim = getDimId(event.level)

    // Extinguish active portal immediately if a block is placed inside its aperture
    for (let portal of activeProgressionPortals) {
        if (portal.dim !== dim) continue
        let isInside = false
        if (portal.axis === 'x') {
            if (block.z === portal.z0 && block.x >= portal.x0 && block.x <= portal.x0 + 1 && block.y >= portal.y0 && block.y <= portal.y0 + 2) {
                isInside = true
            }
        } else {
            if (block.x === portal.x0 && block.z >= portal.z0 && block.z <= portal.z0 + 1 && block.y >= portal.y0 && block.y <= portal.y0 + 2) {
                isInside = true
            }
        }
        if (isInside) {
            let srv = event.server || event.level.server
            extinguishPortalAndLinked(srv, portal, { x: block.x, y: block.y, z: block.z })
            srv.runCommandSilent(`execute in ${dim} run playsound minecraft:entity.generic.extinguish_fire block @a ${block.x} ${block.y} ${block.z} 1.2 1.0`)
            srv.runCommandSilent(`execute in ${dim} run particle minecraft:smoke ${block.x + 0.5} ${block.y + 0.5} ${block.z + 0.5} 0.5 0.5 0.5 0.05 25`)
            break
        }
    }

    let blockKey = `${dim}:${block.x}:${block.y}:${block.z}`
    if (generatedFrameBlocks.has(blockKey)) {
        generatedFrameBlocks.delete(blockKey)
        saveGeneratedFrames()
    }
    if (generatedPlatformBlocks.has(blockKey)) {
        generatedPlatformBlocks.delete(blockKey)
        saveGeneratedPlatforms()
    }

    // If player places obsidian bricks, automatically register frame once completed
    if (VALID_NETHER_FRAME_BLOCKS.includes(String(block.id))) {
        // NEVER disturb an existing active portal or frame within 6 blocks!
        let nearActive = activeProgressionPortals.some(p => p.dim === dim && Math.abs(p.x0 - block.x) <= 6 && Math.abs(p.y0 - block.y) <= 6 && Math.abs(p.z0 - block.z) <= 6)
        if (nearActive) return

        let nearKnown = knownPortalFrames.some(kf => kf.dim === dim && Math.abs(kf.x0 - block.x) <= 5 && Math.abs(kf.y0 - block.y) <= 5 && Math.abs(kf.z0 - block.z) <= 5)
        if (nearKnown) return
        let frame = detectFrame(event.level, block.x, block.y, block.z)
        if (!frame) {
            for (let ox of [-1, 0, 1]) {
                for (let oy of [-1, 0, 1]) {
                    for (let oz of [-1, 0, 1]) {
                        frame = detectFrame(event.level, block.x + ox, block.y + oy, block.z + oz)
                        if (frame) break
                    }
                    if (frame) break
                }
                if (frame) break
            }
        }
        if (frame) {
            // CRITICAL: If frame is already active, NEVER reset or touch it!
            let isAlreadyActive = activeProgressionPortals.some(p => p.dim === dim && p.x0 === frame.x0 && p.y0 === frame.y0 && p.z0 === frame.z0)
            if (isAlreadyActive) return

            // If frame is already registered and in dormant state, do nothing
            let isAlreadyDormant = knownPortalFrames.some(kf => kf.dim === dim && kf.x0 === frame.x0 && kf.y0 === frame.y0 && kf.z0 === frame.z0)
            if (isAlreadyDormant) return

            registerKnownFrame(dim, frame.x0, frame.y0, frame.z0, frame.axis)
            // Auto-transform 10 core blocks into the complete Dormant Bone Bastion monument!
            setFrameBlocksState(event.server || event.level.server, dim, frame.axis, frame.x0, frame.y0, frame.z0, 'dormant')
            event.server.runCommandSilent(`execute in ${dim} run particle minecraft:smoke ${frame.x0 + 0.5} ${frame.y0 + 1} ${frame.z0 + 0.5} 1.5 1.5 1.5 0.05 30`)
            event.server.runCommandSilent(`execute in ${dim} run particle minecraft:ash ${frame.x0 + 0.5} ${frame.y0 + 1} ${frame.z0 + 0.5} 1.0 1.5 1.0 0.05 25`)
            if (event.player) {
                event.player.server.runCommandSilent(`title ${event.player.username} actionbar {"text":"§6§l[Алтарь Бездны] §fДревний Костяной Бастион собран! Зажгите Оком Прорыва.","color":"gold"}`)
            }
        }
    }
})

let playerPortalCooldown = {}

// Teleportation Tick Loop (Every 2 ticks)
ServerEvents.tick(event => {
    let server = event.server
    if (activeProgressionPortals.length === 0 && server.tickCount % 40 === 0) {
        loadPortals(server)
    }
    if (server.tickCount % 2 !== 0) return

    // Clean up expired drop suppression coordinates
    if (server.tickCount % 20 === 0) {
        for (let k in suppressedDropCoords) {
            if (server.tickCount > suppressedDropCoords[k]) {
                delete suppressedDropCoords[k]
            }
        }
    }

    for (let player of server.players) {
        let name = player.username
        if (playerPortalCooldown[name] && server.tickCount < playerPortalCooldown[name]) {
            continue
        }

        let pdim = getDimId(player.level)
        let px = player.x
        let py = player.y
        let pz = player.z

        for (let portal of activeProgressionPortals) {
            if (portal.dim !== pdim) continue

            let inPortal = false
            if (portal.axis === 'x') {
                // Canonical 2-wide aperture: from x0 to x0 + 1 (span x0 - 0.2 to x0 + 2.2), height 3 blocks: y0 to y0 + 2.9
                if (px >= portal.x0 - 0.2 && px <= portal.x0 + 2.2 &&
                    py >= portal.y0 && py <= portal.y0 + 2.9 &&
                    Math.abs(pz - (portal.z0 + 0.5)) <= 0.7) {
                    inPortal = true
                }
            } else {
                // Canonical 2-wide aperture: from z0 to z0 + 1 (span z0 - 0.2 to z0 + 2.2), height 3 blocks: y0 to y0 + 2.9
                if (Math.abs(px - (portal.x0 + 0.5)) <= 0.7 &&
                    py >= portal.y0 && py <= portal.y0 + 2.9 &&
                    pz >= portal.z0 - 0.2 && pz <= portal.z0 + 2.2) {
                    inPortal = true
                }
            }

            if (inPortal) {
                let target = portal.targetPos || [0.5, 75.0, 0.5, 0.0]
                let targetDim = portal.targetDim || 'minecraft:the_nether'
                let targetYaw = target.length >= 4 ? target[3] : 0.0

                // Destination portal check: does a valid target portal exist on the other side?
                let destPortal = activeProgressionPortals.find(p =>
                    p.dim === targetDim &&
                    Math.abs(p.x0 - target[0]) <= 16 &&
                    Math.abs(p.z0 - target[2]) <= 16
                )

                if (!destPortal) {
                    // Target portal was destroyed or missing!
                    // Extinguish this entrance portal, DO NOT teleport player into empty air!
                    playerPortalCooldown[name] = server.tickCount + 60
                    extinguishPortalAndLinked(server, portal, { x: portal.x0, y: portal.y0, z: portal.z0 })

                    server.runCommandSilent(`title ${name} times 5 50 15`)
                    server.runCommandSilent(`title ${name} title {"text":"⚠ ВРАТА ЗАКРЫТЫ ⚠","color":"red","bold":true}`)
                    server.runCommandSilent(`title ${name} subtitle {"text":"Врата на другой стороне разрушены! Зажгите портал заново.","color":"gold"}`)
                    player.tell('§c[Разлом] §4Врата назначения не существуют! Портал дестабилизирован и погас. Активируйте рамку заново.')
                    break
                }

                playerPortalCooldown[name] = server.tickCount + 100 // 5 sec cooldown

                let titleText = targetDim.includes('nether') ? '☠ ПРЕИСПОДНЯЯ ⚔' : '✨ ВЕРХНИЙ МИР ✨'
                let subText = targetDim.includes('nether') ? 'Сектор II • Инфернальный Рубеж' : 'Возвращение домой'

                server.runCommandSilent(`playsound minecraft:entity.enderman.teleport player ${name} ~ ~ ~ 1.2 0.8`)
                server.runCommandSilent(`playsound minecraft:ambient.crimson_forest.mood ambient ${name} ~ ~ ~ 1.0 1.0`)
                server.runCommandSilent(`title ${name} times 5 45 15`)
                server.runCommandSilent(`title ${name} title {"text":"${titleText}","color":"dark_red","bold":true}`)
                server.runCommandSilent(`title ${name} subtitle {"text":"${subText}","color":"gold"}`)
                server.runCommandSilent(`execute in ${targetDim} run tp ${name} ${target[0]} ${target[1]} ${target[2]} ${targetYaw} 0.0`)
                purgeStrayPortalDisplays(server)
                break
            }
        }
    }

    // Ambient horn breathing & organic muscular twitch for active portals
    if (activeProgressionPortals.length > 0) {
        // Continuous soft breathing (every 10 ticks = 0.5s)
        if (server.tickCount % 10 === 0) {
            for (let portal of activeProgressionPortals) {
                let hx1 = (portal.axis === 'x' ? portal.x0 - 0.6 : portal.x0 + 0.5)
                let hz1 = (portal.axis === 'x' ? portal.z0 + 0.5 : portal.z0 - 0.6)
                let hx2 = (portal.axis === 'x' ? portal.x0 + 2.6 : portal.x0 + 0.5)
                let hz2 = (portal.axis === 'x' ? portal.z0 + 0.5 : portal.z0 + 2.6)
                let hy = portal.y0 + 3.8
                server.runCommandSilent(`execute in ${portal.dim} run particle minecraft:smoke ${hx1} ${hy} ${hz1} 0.02 0.05 0.02 0.005 1`)
                server.runCommandSilent(`execute in ${portal.dim} run particle minecraft:smoke ${hx2} ${hy} ${hz2} 0.02 0.05 0.02 0.005 1`)
            }
        }
        // Rare organic living twitch (every 90 ticks = ~4.5s): subtle draconic pulse
        if (server.tickCount % 90 === 0) {
            for (let portal of activeProgressionPortals) {
                let hx1 = (portal.axis === 'x' ? portal.x0 - 0.6 : portal.x0 + 0.5)
                let hz1 = (portal.axis === 'x' ? portal.z0 + 0.5 : portal.z0 - 0.6)
                let hx2 = (portal.axis === 'x' ? portal.x0 + 2.6 : portal.x0 + 0.5)
                let hz2 = (portal.axis === 'x' ? portal.z0 + 0.5 : portal.z0 + 2.6)
                let hy = portal.y0 + 3.9
                server.runCommandSilent(`execute in ${portal.dim} run particle minecraft:flame ${hx1} ${hy} ${hz1} 0.03 0.08 0.03 0.01 2`)
                server.runCommandSilent(`execute in ${portal.dim} run particle minecraft:flame ${hx2} ${hy} ${hz2} 0.03 0.08 0.03 0.01 2`)
                server.runCommandSilent(`execute in ${portal.dim} run playsound minecraft:entity.ender_dragon.growl ambient @a ${portal.x0} ${portal.y0 + 3} ${portal.z0} 0.15 1.8`)
            }
        }
    }

    // Continuous Aperture Obstruction Check (Every 10 ticks = 0.5s)
    if (server.tickCount % 10 === 0 && activeProgressionPortals.length > 0) {
        for (let portal of activeProgressionPortals) {
            let level = server.getLevel(portal.dim)
            if (!level) continue

            let isObstructed = false
            let obstructPos = null
            let hadFluid = false

            let xMin = portal.x0
            let xMax = (portal.axis === 'x' ? portal.x0 + 1 : portal.x0)
            let zMin = portal.z0
            let zMax = (portal.axis === 'z' ? portal.z0 + 1 : portal.z0)

            for (let cx = xMin; cx <= xMax; cx++) {
                for (let cy = portal.y0; cy <= portal.y0 + 2; cy++) {
                    for (let cz = zMin; cz <= zMax; cz++) {
                        let b = level.getBlock(cx, cy, cz)
                        if (b) {
                            let bid = String(b.id)
                            if (bid.includes('water') || bid.includes('lava')) {
                                isObstructed = true
                                hadFluid = true
                                obstructPos = { x: cx, y: cy, z: cz }
                                break
                            } else if (!isAirBlock(level, cx, cy, cz) && bid !== 'divinerpg:mortum_portal') {
                                isObstructed = true
                                obstructPos = { x: cx, y: cy, z: cz }
                                break
                            }
                        }
                    }
                    if (isObstructed) break
                }
                if (isObstructed) break
            }

            if (isObstructed) {
                if (hadFluid && obstructPos) {
                    server.runCommandSilent(`execute in ${portal.dim} run setblock ${obstructPos.x} ${obstructPos.y} ${obstructPos.z} minecraft:air`)
                }
                extinguishPortalAndLinked(server, portal, obstructPos || { x: portal.x0, y: portal.y0, z: portal.z0 })
                server.runCommandSilent(`execute in ${portal.dim} run playsound minecraft:entity.generic.extinguish_fire block @a ${portal.x0} ${portal.y0 + 1} ${portal.z0} 1.2 1.0`)
                server.runCommandSilent(`execute in ${portal.dim} run particle minecraft:smoke ${portal.x0 + 0.5} ${portal.y0 + 1.5} ${portal.z0 + 0.5} 0.5 0.5 0.5 0.05 30`)
                break
            }
        }
    }

    // Automatic Display Maintenance (Disabled infinite block_display loop to prevent chunk bloat)
    /*
    if (server.tickCount % 40 === 0) {
        // Disabled loop
    }
    */

    // Ambient portal embers (every 10 ticks)
    if (server.tickCount % 10 === 0) {
        for (let portal of activeProgressionPortals) {
            let px = (portal.axis === 'x' ? portal.x0 + 0.5 : portal.x0)
            let py = portal.y0 + 1.0
            let pz = (portal.axis === 'z' ? portal.z0 + 0.5 : portal.z0)
            server.runCommandSilent(`execute in ${portal.dim} run particle minecraft:crimson_spore ${px} ${py} ${pz} 0.5 1.0 0.2 0.02 6`)
            server.runCommandSilent(`execute in ${portal.dim} run particle minecraft:flame ${px} ${py} ${pz} 0.4 0.6 0.2 0.01 3`)
        }
    }
})

// Command for admins to clear all portals
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event

    event.register(Commands.literal('portal_clear_all')
        .requires(s => s.hasPermission(2))
        .executes(ctx => {
            let server = ctx.source.server
            for (let portal of activeProgressionPortals) {
                server.runCommandSilent(`execute in ${portal.dim} run kill @e[type=block_display,tag=tag_${portal.id}]`)
            }
            activeProgressionPortals = []
            savePortals()
            ctx.source.sendSuccess(Component.literal('§aВсе активные порталы прогрессии сброшены.'), true)
            return 1
        })
    )

    event.register(Commands.literal('portal_rebuild_nether')
        .requires(s => s.hasPermission(2))
        .executes(ctx => {
            let server = ctx.source.server
            let player = null
            try { player = ctx.source.player } catch(e) {}

            loadPortals(server)

            let owPortal = activeProgressionPortals.find(p => p.dim === 'minecraft:overworld')
            let netherPortal = activeProgressionPortals.find(p => p.dim === 'minecraft:the_nether')

            if (!owPortal) {
                ctx.source.sendFailure(Component.literal('§cПортал в Верхнем Мире не найден в реестре.'))
                return 0
            }

            let approxNx = Math.floor(owPortal.x0 / 8)
            let approxNz = Math.floor(owPortal.z0 / 8)
            let safePos = findSafeNetherSurface(server, approxNx, approxNz, owPortal.y0)
            let nx = safePos.x
            let ny = safePos.y
            let nz = safePos.z
            let axis = owPortal.axis
            let portalId = owPortal.id

            // Clean old displays
            server.runCommandSilent(`execute in minecraft:the_nether run kill @e[type=block_display,tag=elyrium_progression_portal]`)

            // Spawn on safe terrain
            spawnNetherPortal(server, nx, ny, nz, axis, portalId)

            let netherArrivalX = (axis === 'x' ? nx + 1.0 : nx + 2.5)
            let netherArrivalY = ny
            let netherArrivalZ = (axis === 'z' ? nz + 1.0 : nz + 2.5)
            let netherYaw = (axis === 'x' ? 0.0 : 90.0)

            let owReturn = owPortal.returnPos

            owPortal.targetPos = [netherArrivalX, netherArrivalY, netherArrivalZ, netherYaw]

            if (netherPortal) {
                netherPortal.x0 = nx
                netherPortal.y0 = ny
                netherPortal.z0 = nz
                netherPortal.targetPos = owReturn
                netherPortal.returnPos = [netherArrivalX, netherArrivalY, netherArrivalZ, netherYaw]
            } else {
                activeProgressionPortals.push({
                    id: portalId + '_return',
                    dim: 'minecraft:the_nether',
                    axis: axis,
                    x0: nx,
                    y0: ny,
                    z0: nz,
                    targetDim: 'minecraft:overworld',
                    targetPos: owReturn,
                    returnPos: [netherArrivalX, netherArrivalY, netherArrivalZ, netherYaw]
                })
            }

            savePortals()

            // Teleport all players in the nether to the new safe platform
            for (let p of server.players) {
                if (getDimId(p.level).includes('nether')) {
                    server.runCommandSilent(`tp ${p.username} ${netherArrivalX} ${netherArrivalY} ${netherArrivalZ} ${netherYaw} 0.0`)
                }
            }

            ctx.source.sendSuccess(Component.literal(`§aИнфернальный портал в Незере успешно перемещен на надежную почву: (${nx}, ${ny}, ${nz})!`), true)
            return 1
        })
    )

    event.register(Commands.literal('portal_purge_strays')
        .requires(s => s.hasPermission(2))
        .executes(ctx => {
            let server = ctx.source.server
            loadPortals(server)

            let killed = 0
            for (let dim of ['minecraft:the_nether', 'minecraft:overworld']) {
                let level = server.getLevel(dim)
                if (!level) continue

                let activeInDim = activeProgressionPortals.filter(p => p.dim === dim)
                let entities = level.getEntities()

                for (let e of entities) {
                    if (e.type !== 'minecraft:block_display') continue

                    let ex = Math.floor(e.x)
                    let ey = Math.floor(e.y)
                    let ez = Math.floor(e.z)

                    // Check if entity is inside ANY valid active portal aperture
                    let isValid = false
                    for (let p of activeInDim) {
                        if (p.axis === 'x') {
                            if ((ex === p.x0 || ex === p.x0 + 1) &&
                                (ey >= p.y0 && ey <= p.y0 + 2) &&
                                ez === p.z0) {
                                isValid = true
                                break
                            }
                        } else {
                            if (ex === p.x0 &&
                                (ey >= p.y0 && ey <= p.y0 + 2) &&
                                (ez === p.z0 || ez === p.z0 + 1)) {
                                isValid = true
                                break
                            }
                        }
                    }

                    if (!isValid) {
                        e.kill()
                        killed++
                    }
                }
            }

            ctx.source.sendSuccess(Component.literal(`§aУспешно удалено фантомных завес/сущностей: ${killed}`), true)
            return 1
        })
    )
})
