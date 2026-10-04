// ==============================================================================
// 🏰 ELYRIUM: SECTOR WALL & GRAND GATEHOUSE PROCEDURAL ENGINE (PHASE 16)
// ==============================================================================

// ==============================================================================
// 🏛️ ELYRIUM: SECTOR WALL & GRAND GATEHOUSE PALETTES (11 TIERS CANON)
// Verified by Explorer M1-3 | 112/112 Block IDs strictly verified
// ==============================================================================

const SECTOR_PALETTES = {
    // --------------------------------------------------------------------------
    // R = 1500: Tier 1 — Оплот Первопроходцев (Overworld Camp)
    // --------------------------------------------------------------------------
    1500: {
        radius: 1500,
        tier: 1,
        title: "Оплот Первопроходцев (Tier 1: Overworld Camp)",
        foundation: "minecraft:cobblestone",
        foundation_alt: "minecraft:mossy_cobblestone",
        wall_primary: "minecraft:stone_bricks",
        wall_secondary: "minecraft:mossy_stone_bricks",
        wall_cracked: "minecraft:cracked_stone_bricks",
        battlement_wall: "minecraft:stone_brick_wall",
        battlement_stairs: "minecraft:stone_brick_stairs",
        battlement_slab: "minecraft:stone_brick_slab",
        accent_pillar: "minecraft:chiseled_stone_bricks",
        accent_detail: "minecraft:stripped_oak_log",
        gate_portcullis: "minecraft:iron_bars",
        gate_arch: "minecraft:stone_brick_stairs",
        lantern: "minecraft:lantern",
        lantern_post: "minecraft:stone_brick_wall"
    },

    // --------------------------------------------------------------------------
    // R = 4500: Tier 2 — Передовой Рубеж Предвестника (Frontier / Harbinger)
    // --------------------------------------------------------------------------
    4500: {
        radius: 4500,
        tier: 2,
        title: "Передовой Рубеж Предвестника (Tier 2: Frontier / Harbinger)",
        foundation: "minecraft:polished_deepslate",
        foundation_alt: "minecraft:deepslate_tiles",
        wall_primary: "minecraft:deepslate_bricks",
        wall_secondary: "minecraft:polished_andesite",
        wall_cracked: "minecraft:cracked_deepslate_bricks",
        battlement_wall: "cataclysm:black_steel_wall",
        battlement_stairs: "minecraft:deepslate_brick_stairs",
        battlement_slab: "minecraft:deepslate_brick_slab",
        accent_pillar: "cataclysm:black_steel_block",
        accent_detail: "minecraft:chiseled_deepslate",
        gate_portcullis: "cataclysm:black_steel_fence",
        gate_arch: "minecraft:deepslate_brick_stairs",
        lantern: "minecraft:copper_bulb",
        lantern_post: "cataclysm:black_steel_wall"
    },

    // --------------------------------------------------------------------------
    // R = 8500: Tier 3 — Черная Цитадель Левиафана (Black Citadel / Malgaros)
    // --------------------------------------------------------------------------
    8500: {
        radius: 8500,
        tier: 3,
        title: "Черная Цитадель Левиафана (Tier 3: Black Citadel)",
        foundation: "minecraft:crying_obsidian",
        foundation_alt: "minecraft:polished_blackstone",
        wall_primary: "minecraft:polished_blackstone_bricks",
        wall_secondary: "cataclysm:obsidian_bricks",
        wall_cracked: "minecraft:cracked_polished_blackstone_bricks",
        battlement_wall: "cataclysm:obsidian_brick_wall",
        battlement_stairs: "minecraft:polished_blackstone_brick_stairs",
        battlement_slab: "minecraft:polished_blackstone_brick_slab",
        accent_pillar: "cataclysm:blackstone_pillar",
        accent_detail: "cataclysm:chiseled_obsidian_bricks",
        gate_portcullis: "cataclysm:black_steel_wall",
        gate_arch: "minecraft:polished_blackstone_brick_stairs",
        lantern: "cataclysm:void_lantern_block",
        lantern_post: "cataclysm:obsidian_brick_wall"
    },

    // --------------------------------------------------------------------------
    // R = 13500: Tier 4 — Инфернальный Бастион Пепла (Nether Infernal / Ignis)
    // --------------------------------------------------------------------------
    13500: {
        radius: 13500,
        tier: 4,
        title: "Инфернальный Бастион Пепла (Tier 4: Nether Infernal)",
        foundation: "minecraft:polished_basalt",
        foundation_alt: "minecraft:smooth_basalt",
        wall_primary: "minecraft:nether_bricks",
        wall_secondary: "minecraft:red_nether_bricks",
        wall_cracked: "minecraft:cracked_nether_bricks",
        battlement_wall: "minecraft:red_nether_brick_wall",
        battlement_stairs: "minecraft:nether_brick_stairs",
        battlement_slab: "minecraft:nether_brick_slab",
        accent_pillar: "minecraft:chiseled_nether_bricks",
        accent_detail: "minecraft:magma_block",
        gate_portcullis: "minecraft:nether_brick_fence",
        gate_arch: "minecraft:nether_brick_stairs",
        lantern: "minecraft:soul_lantern",
        lantern_post: "minecraft:nether_brick_wall"
    },

    // --------------------------------------------------------------------------
    // R = 19500: Tier 5 — Небесные Врата Эфира (Aether Valkyrie Bulwark)
    // --------------------------------------------------------------------------
    19500: {
        radius: 19500,
        tier: 5,
        title: "Небесные Врата Эфира (Tier 5: Aether Divine)",
        foundation: "aether:carved_stone",
        foundation_alt: "deep_aether:aseterite_bricks",
        wall_primary: "aether:holystone_bricks",
        wall_secondary: "deep_aether:big_holystone_bricks",
        wall_cracked: "aether:carved_stone",
        battlement_wall: "aether:holystone_brick_wall",
        battlement_stairs: "aether:holystone_brick_stairs",
        battlement_slab: "aether:holystone_brick_slab",
        accent_pillar: "aether:pillar",
        accent_detail: "deep_aether:gilded_holystone_bricks",
        gate_portcullis: "aether:skyroot_fence",
        gate_arch: "aether:holystone_brick_stairs",
        lantern: "deep_aether:skyjade_lantern",
        lantern_post: "aether:holystone_brick_wall"
    },

    // --------------------------------------------------------------------------
    // R = 26000: Tier 6 — Космический Разлом Края (The End Void Bastion)
    // --------------------------------------------------------------------------
    26000: {
        radius: 26000,
        tier: 6,
        title: "Космический Разлом Края (Tier 6: The End Void)",
        foundation: "cataclysm:void_stone",
        foundation_alt: "minecraft:obsidian",
        wall_primary: "minecraft:end_stone_bricks",
        wall_secondary: "cataclysm:purpur_tiles",
        wall_cracked: "cataclysm:void_infused_end_stone_bricks",
        battlement_wall: "minecraft:end_stone_brick_wall",
        battlement_stairs: "minecraft:end_stone_brick_stairs",
        battlement_slab: "minecraft:end_stone_brick_slab",
        accent_pillar: "cataclysm:end_stone_pillar",
        accent_detail: "cataclysm:chiseled_end_stone_bricks",
        gate_portcullis: "minecraft:iron_bars",
        gate_arch: "minecraft:end_stone_brick_stairs",
        lantern: "cataclysm:void_lantern_block",
        lantern_post: "minecraft:end_stone_brick_wall"
    },

    // --------------------------------------------------------------------------
    // R = 31000: Tier 7 — Рубеж Вечного Звездного Сияния (Eternal Starlight)
    // --------------------------------------------------------------------------
    31000: {
        radius: 31000,
        tier: 7,
        title: "Рубеж Вечного Звездного Сияния (Tier 7: Eternal Starlight)",
        foundation: "eternal_starlight:voidstone",
        foundation_alt: "eternal_starlight:cobbled_grimstone",
        wall_primary: "eternal_starlight:grimstone_bricks",
        wall_secondary: "eternal_starlight:grimstone_tiles",
        wall_cracked: "eternal_starlight:cracked_grimstone_bricks",
        battlement_wall: "eternal_starlight:grimstone_brick_wall",
        battlement_stairs: "eternal_starlight:grimstone_brick_stairs",
        battlement_slab: "eternal_starlight:grimstone_brick_slab",
        accent_pillar: "eternal_starlight:golem_steel_pillar",
        accent_detail: "eternal_starlight:glowing_grimstone",
        gate_portcullis: "eternal_starlight:golem_steel_bars",
        gate_arch: "eternal_starlight:grimstone_brick_stairs",
        lantern: "eternal_starlight:blue_starlight_crystal_lantern",
        lantern_post: "eternal_starlight:grimstone_brick_wall"
    },

    // --------------------------------------------------------------------------
    // R = 35000: Tier 8 — Скалковый Кордон Иного Мира (Deeper Darker Sculk)
    // --------------------------------------------------------------------------
    35000: {
        radius: 35000,
        tier: 8,
        title: "Скалковый Кордон Иного Мира (Tier 8: Deeper Darker Sculk)",
        foundation: "minecraft:reinforced_deepslate",
        foundation_alt: "deeperdarker:cobbled_sculk_stone",
        wall_primary: "deeperdarker:sculk_stone_bricks",
        wall_secondary: "deeperdarker:gloomslate_bricks",
        wall_cracked: "deeperdarker:sculk_grime_bricks",
        battlement_wall: "deeperdarker:sculk_stone_brick_wall",
        battlement_stairs: "deeperdarker:sculk_stone_brick_stairs",
        battlement_slab: "deeperdarker:sculk_stone_brick_slab",
        accent_pillar: "deeperdarker:chiseled_sculk_stone",
        accent_detail: "deeperdarker:enriched_gloomslate_bricks",
        gate_portcullis: "deeperdarker:echo_fence",
        gate_arch: "deeperdarker:sculk_stone_brick_stairs",
        lantern: "deeperdarker:gloomslate_light",
        lantern_post: "deeperdarker:sculk_stone_brick_wall"
    }
};

function getSectorPalette(radius) {
    if (SECTOR_PALETTES[radius]) {
        return SECTOR_PALETTES[radius];
    }
    let keys = [1500, 4500, 8500, 13500, 19500, 26000, 31000, 35000];
    let closest = keys[0];
    let minDiff = Math.abs(radius - closest);
    for (let i = 1; i < keys.length; i++) {
        let diff = Math.abs(radius - keys[i]);
        if (diff < minDiff) {
            minDiff = diff;
            closest = keys[i];
        }
    }
    return SECTOR_PALETTES[closest];
}

// ==============================================================================
// 🛠️ PROCEDURAL UTILITIES & SURFACE ANCHORING
// ==============================================================================

function setBlockSafe(level, x, y, z, blockId) {
    if (!level || !blockId) return;
    try {
        let b = level.getBlock(x, y, z);
        if (b) {
            b.set(blockId);
        }
    } catch (e) {}
}

function getRobustSurfaceY(level, x, z) {
    let scanTop = 130;
    try {
        if (level.getHeight) {
            let h = level.getHeight('motion_blocking_no_leaves', x, z);
            if (h && h > -50 && h < 315) {
                scanTop = h + 2;
            }
        }
    } catch (e) {}

    if (scanTop > 260) scanTop = 260;
    if (scanTop < 60) scanTop = 60;

    for (let y = scanTop; y >= -55; y--) {
        try {
            let b = level.getBlock(x, y, z);
            if (!b) continue;
            let id = b.id ? b.id.toLowerCase() : '';
            if (id.includes('air') || id.includes('leaves') || id.includes('vine') ||
                id.includes('grass') || id.includes('flower') || id.includes('fern') ||
                id.includes('sapling') || id.includes('snow') || id.includes('lichen') ||
                id.includes('bramble') || id.includes('petal') || id.includes('carpet')) {
                continue;
            }
            return y;
        } catch (err) {}
    }
    return 64;
}

function sinkFoundation(level, x, z, startY, blockId, maxDepth) {
    let limit = maxDepth || 24;
    let anchorSteps = 0;

    for (let y = startY; y >= startY - limit && y >= -60; y--) {
        try {
            let b = level.getBlock(x, y, z);
            if (!b) continue;
            let id = b.id ? b.id.toLowerCase() : '';

            // Soft or permeable matter needing foundation reinforcement
            if (id.includes('air') || id.includes('water') || id.includes('lava') ||
                id.includes('leaves') || id.includes('vine') || id.includes('grass') ||
                id.includes('flower') || id.includes('fern') || id.includes('sapling') ||
                id.includes('sand') || id.includes('gravel') || id.includes('dirt') ||
                id.includes('mud') || id.includes('clay') || id.includes('snow')) {
                setBlockSafe(level, x, y, z, blockId);
            } else {
                // Hard rock bedrock/stone bedrock layer: anchor 2 blocks deep, then stop
                setBlockSafe(level, x, y, z, blockId);
                anchorSteps++;
                if (anchorSteps >= 2) {
                    break;
                }
            }
        } catch (e) {
            break;
        }
    }
}

// ==============================================================================
// 🏰 MODULAR ARCHITECTURAL PRESETS
// ==============================================================================

function buildWallSlice(level, x, z, groundY, isTower, palette, axis) {
    let wallHeight = 8;
    let topY = groundY + wallHeight;
    let longIndex = (axis === 'Z') ? z : x;

    for (let offset = -2; offset <= 2; offset++) {
        let px = (axis === 'Z') ? (x + offset) : x;
        let pz = (axis === 'Z') ? z : (z + offset);

        // 1. Deep foundation anchoring into solid ground/seabed
        sinkFoundation(level, px, pz, groundY, palette.foundation, 24);

        // 2. Monolithic wall body
        for (let y = groundY + 1; y < topY; y++) {
            let rnd = Math.random();
            let mat = palette.wall_primary;
            if (rnd < 0.22) {
                mat = palette.wall_cracked;
            } else if (rnd < 0.45) {
                mat = palette.wall_secondary;
            }
            setBlockSafe(level, px, y, pz, mat);
        }

        // 3. Walkway slab floor
        setBlockSafe(level, px, topY, pz, palette.battlement_slab);

        // 4. Parapet battlements & arrow slits on outer edges
        if (Math.abs(offset) === 2) {
            if (Math.abs(longIndex) % 2 === 0) {
                setBlockSafe(level, px, topY + 1, pz, palette.battlement_wall);
                if (Math.abs(longIndex) % 8 === 0) {
                    setBlockSafe(level, px, topY + 2, pz, palette.lantern_post);
                    setBlockSafe(level, px, topY + 3, pz, palette.lantern);
                }
            } else {
                setBlockSafe(level, px, topY + 1, pz, palette.gate_portcullis);
            }
        } else {
            // Clear walkway corridor
            setBlockSafe(level, px, topY + 1, pz, 'minecraft:air');
            setBlockSafe(level, px, topY + 2, pz, 'minecraft:air');
            setBlockSafe(level, px, topY + 3, pz, 'minecraft:air');
        }
    }
}

function buildBastionTower(level, centerX, centerZ, groundY, palette, axis) {
    let towerHeight = 15;
    let roofY = groundY + towerHeight;

    for (let dx = -3; dx <= 3; dx++) {
        for (let dz = -3; dz <= 3; dz++) {
            let px = centerX + dx;
            let pz = centerZ + dz;

            sinkFoundation(level, px, pz, groundY, palette.foundation, 24);

            let isCorner = (Math.abs(dx) === 3 && Math.abs(dz) === 3);
            let isOuter = (Math.abs(dx) === 3 || Math.abs(dz) === 3);

            for (let y = groundY + 1; y <= roofY; y++) {
                if (isCorner) {
                    setBlockSafe(level, px, y, pz, palette.accent_pillar);
                } else if (isOuter) {
                    // Mid-level arrow slits
                    if ((y === groundY + 4 || y === groundY + 10) && (dx === 0 || dz === 0)) {
                        setBlockSafe(level, px, y, pz, palette.gate_portcullis);
                    } else {
                        let rnd = Math.random();
                        let mat = palette.wall_primary;
                        if (rnd < 0.20) mat = palette.wall_cracked;
                        else if (rnd < 0.40) mat = palette.wall_secondary;
                        setBlockSafe(level, px, y, pz, mat);
                    }
                } else {
                    // Tower Interior
                    // Walkway pass-through portal at wall rampart height
                    let isWalkwayPortal = false;
                    if (y >= groundY + 8 && y <= groundY + 10) {
                        if (axis === 'X' && Math.abs(dz) <= 1) isWalkwayPortal = true;
                        if (axis === 'Z' && Math.abs(dx) <= 1) isWalkwayPortal = true;
                    }

                    if (y === groundY + 7 || y === roofY) {
                        setBlockSafe(level, px, y, pz, palette.battlement_slab);
                    } else if (isWalkwayPortal) {
                        setBlockSafe(level, px, y, pz, 'minecraft:air');
                    } else {
                        setBlockSafe(level, px, y, pz, 'minecraft:air');
                    }
                }
            }

            // Upper battlements on roof
            if (isOuter) {
                setBlockSafe(level, px, roofY + 1, pz, palette.battlement_wall);
                if (isCorner) {
                    setBlockSafe(level, px, roofY + 2, pz, palette.lantern_post);
                    setBlockSafe(level, px, roofY + 3, pz, palette.lantern);
                }
            } else {
                setBlockSafe(level, px, roofY + 1, pz, 'minecraft:air');
                setBlockSafe(level, px, roofY + 2, pz, 'minecraft:air');
            }
        }
    }
}

function buildGrandGatehouse(level, centerX, centerZ, palette, axis) {
    let groundY = getRobustSurfaceY(level, centerX, centerZ);

    // 21 wide (u: -10 to +10), 9 deep (v: -4 to +4)
    for (let u = -10; u <= 10; u++) {
        for (let v = -4; v <= 4; v++) {
            let px = (axis === 'Z') ? (centerX + v) : (centerX + u);
            let pz = (axis === 'Z') ? (centerZ + u) : (centerZ + v);

            sinkFoundation(level, px, pz, groundY, palette.foundation, 24);

            let isArch = (Math.abs(u) <= 2);
            let isTower = (Math.abs(u) >= 6);
            let height = isTower ? 19 : 15;

            // Road floor in archway
            setBlockSafe(level, px, groundY, pz, isArch ? palette.foundation_alt : palette.foundation);

            for (let y = groundY + 1; y <= groundY + height; y++) {
                if (isArch && y <= groundY + 7) {
                    // Archway clearance & portcullis
                    if (v === 0 && y >= groundY + 4) {
                        setBlockSafe(level, px, y, pz, palette.gate_portcullis);
                    } else if (Math.abs(u) === 2 && y === groundY + 7) {
                        setBlockSafe(level, px, y, pz, palette.gate_arch);
                    } else {
                        setBlockSafe(level, px, y, pz, 'minecraft:air');
                    }
                } else if (isArch && y >= groundY + 8 && y <= groundY + 14) {
                    // Lookout Gallery above archway
                    if (y === groundY + 8) {
                        setBlockSafe(level, px, y, pz, palette.battlement_slab);
                    } else if (Math.abs(v) === 4 && (y === groundY + 10 || y === groundY + 11)) {
                        setBlockSafe(level, px, y, pz, palette.gate_portcullis);
                    } else if (Math.abs(v) === 4) {
                        setBlockSafe(level, px, y, pz, palette.wall_primary);
                    } else {
                        setBlockSafe(level, px, y, pz, 'minecraft:air');
                    }
                } else {
                    // Solid Gatehouse Towers & Flanks
                    let isCorner = (Math.abs(u) === 10 || Math.abs(u) === 6) && Math.abs(v) === 4;
                    if (isCorner) {
                        setBlockSafe(level, px, y, pz, palette.accent_pillar);
                    } else if (y === groundY + 10 && Math.abs(u) === 8 && v === 0) {
                        setBlockSafe(level, px, y, pz, palette.accent_detail);
                    } else {
                        let rnd = Math.random();
                        let mat = palette.wall_primary;
                        if (rnd < 0.20) mat = palette.wall_cracked;
                        else if (rnd < 0.35) mat = palette.wall_secondary;
                        setBlockSafe(level, px, y, pz, mat);
                    }
                }
            }

            // Crown Roof Battlements
            let roofY = groundY + height + 1;
            let isOuterWall = (Math.abs(u) === 10 || (isTower && Math.abs(v) === 4) || (!isTower && Math.abs(v) === 4));
            if (isOuterWall) {
                setBlockSafe(level, px, roofY, pz, palette.battlement_wall);
                if (Math.abs(u) === 10 && Math.abs(v) === 4) {
                    setBlockSafe(level, px, roofY + 1, pz, palette.lantern_post);
                    setBlockSafe(level, px, roofY + 2, pz, palette.lantern);
                }
            } else {
                setBlockSafe(level, px, roofY, pz, palette.battlement_slab);
            }
        }
    }
}

function buildAncientBreach(level, centerX, centerZ, palette, axis) {
    let groundY = getRobustSurfaceY(level, centerX, centerZ);

    for (let u = -5; u <= 5; u++) {
        for (let v = -2; v <= 2; v++) {
            let px = (axis === 'Z') ? (centerX + v) : (centerX + u);
            let pz = (axis === 'Z') ? (centerZ + u) : (centerZ + v);

            sinkFoundation(level, px, pz, groundY, palette.foundation, 24);

            let brokenHeight = Math.max(1, Math.floor(Math.abs(u) * 1.3));
            for (let y = groundY + 1; y <= groundY + brokenHeight; y++) {
                let rnd = Math.random();
                let mat = (rnd < 0.5) ? palette.wall_cracked : palette.wall_secondary;
                setBlockSafe(level, px, y, pz, mat);
            }

            for (let y = groundY + brokenHeight + 1; y <= groundY + 12; y++) {
                setBlockSafe(level, px, y, pz, 'minecraft:air');
            }
        }
    }
}

// ==============================================================================
// ⚡ ASYNC BATCHED SECTOR WALL & GATEHOUSE GENERATOR
// ==============================================================================

function generateCardinalGate(server, level, radius, direction, feedbackTarget) {
    let dir = direction.toLowerCase();
    let centerX = 0;
    let centerZ = 0;
    let axis = 'X';

    if (dir === 'north') {
        centerX = 0;
        centerZ = -radius;
        axis = 'X';
    } else if (dir === 'south') {
        centerX = 0;
        centerZ = radius;
        axis = 'X';
    } else if (dir === 'east') {
        centerX = radius;
        centerZ = 0;
        axis = 'Z';
    } else if (dir === 'west') {
        centerX = -radius;
        centerZ = 0;
        axis = 'Z';
    } else {
        if (feedbackTarget) feedbackTarget.tell(Text.red('❌ Неизвестное направление: ' + direction + ' (используйте north, south, east, west)'));
        return;
    }

    let palette = getSectorPalette(radius);
    if (feedbackTarget) {
        feedbackTarget.tell(Text.gold('🔨 Начало возведения Великих Врат: ' + palette.title + ' [' + dir.toUpperCase() + '] на (' + centerX + ', ' + centerZ + ')...'));
    }
    console.log('[SectorWall] Starting Grand Gate generation at R=' + radius + ' ' + dir + ' (' + centerX + ', ' + centerZ + ')');

    // Forceload boundary area during construction
    let dim = level.dimension.toString();
    server.runCommandSilent('execute in ' + dim + ' positioned ' + centerX + ' 64 ' + centerZ + ' run forceload add ~-80 ~-20 ~80 ~20');

    let queue = [];
    for (let u = -80; u <= 80; u++) {
        queue.push(u);
    }

    let totalSlices = queue.length;
    let processed = 0;
    let batchSize = 8;

    function processBatch() {
        let count = 0;
        while (queue.length > 0 && count < batchSize) {
            let u = queue.shift();
            count++;
            processed++;

            if (u === 0) {
                // Grand Gatehouse in center
                buildGrandGatehouse(level, centerX, centerZ, palette, axis);
            } else if (u === -40) {
                let tx = (axis === 'Z') ? centerX : (centerX - 40);
                let tz = (axis === 'Z') ? (centerZ - 40) : centerZ;
                let ty = getRobustSurfaceY(level, tx, tz);
                buildBastionTower(level, tx, tz, ty, palette, axis);
            } else if (u === 40) {
                let tx = (axis === 'Z') ? centerX : (centerX + 40);
                let tz = (axis === 'Z') ? (centerZ + 40) : centerZ;
                let ty = getRobustSurfaceY(level, tx, tz);
                buildBastionTower(level, tx, tz, ty, palette, axis);
            } else if (Math.abs(u) <= 10) {
                // Covered by Grand Gatehouse (21 blocks wide)
                continue;
            } else if (Math.abs(Math.abs(u) - 40) <= 3) {
                // Covered by 7x7 Bastion Towers
                continue;
            } else {
                // Normal Wall Slice
                let wx = (axis === 'Z') ? centerX : (centerX + u);
                let wz = (axis === 'Z') ? (centerZ + u) : centerZ;
                let wy = getRobustSurfaceY(level, wx, wz);
                buildWallSlice(level, wx, wz, wy, false, palette, axis);
            }
        }

        if (queue.length > 0) {
            server.scheduleInTicks(1, () => {
                processBatch();
            });
        } else {
            // Unload forceload
            server.runCommandSilent('execute in ' + dim + ' positioned ' + centerX + ' 64 ' + centerZ + ' run forceload remove ~-80 ~-20 ~80 ~20');
            console.log('[SectorWall] Grand Gate at R=' + radius + ' ' + dir + ' successfully completed!');
            if (feedbackTarget) {
                feedbackTarget.tell(Text.green('✅ Великие Врата и бастионы рубежа R=' + radius + ' (' + dir.toUpperCase() + ') успешно возведены!'));
            }
        }
    }

    processBatch();
}

function generateWallSection(server, level, radius, direction, length, feedbackTarget) {
    let dir = direction.toLowerCase();
    let centerX = 0;
    let centerZ = 0;
    let axis = 'X';

    if (dir === 'north') {
        centerX = 0;
        centerZ = -radius;
        axis = 'X';
    } else if (dir === 'south') {
        centerX = 0;
        centerZ = radius;
        axis = 'X';
    } else if (dir === 'east') {
        centerX = radius;
        centerZ = 0;
        axis = 'Z';
    } else if (dir === 'west') {
        centerX = -radius;
        centerZ = 0;
        axis = 'Z';
    } else {
        if (feedbackTarget) feedbackTarget.tell(Text.red('❌ Неизвестное направление: ' + direction + ' (используйте north, south, east, west)'));
        return;
    }

    let palette = getSectorPalette(radius);
    let half = Math.floor(length / 2);
    let queue = [];
    for (let u = -half; u <= half; u++) {
        queue.push(u);
    }

    if (feedbackTarget) {
        feedbackTarget.tell(Text.gold('🔨 Возведение стены ' + palette.title + ' длиной ' + length + ' блоков [' + dir.toUpperCase() + ']...'));
    }

    let dim = level.dimension.toString();
    server.runCommandSilent('execute in ' + dim + ' positioned ' + centerX + ' 64 ' + centerZ + ' run forceload add ~-' + half + ' ~-20 ~' + half + ' ~20');

    let batchSize = 10;
    function processBatch() {
        let count = 0;
        while (queue.length > 0 && count < batchSize) {
            let u = queue.shift();
            count++;

            let isTower = (Math.abs(u) > 0 && Math.abs(u) % 40 === 0);
            let wx = (axis === 'Z') ? centerX : (centerX + u);
            let wz = (axis === 'Z') ? (centerZ + u) : centerZ;
            let wy = getRobustSurfaceY(level, wx, wz);

            if (isTower) {
                buildBastionTower(level, wx, wz, wy, palette, axis);
            } else if (Math.abs(u) % 40 > 3) {
                buildWallSlice(level, wx, wz, wy, false, palette, axis);
            }
        }

        if (queue.length > 0) {
            server.scheduleInTicks(1, () => {
                processBatch();
            });
        } else {
            server.runCommandSilent('execute in ' + dim + ' positioned ' + centerX + ' 64 ' + centerZ + ' run forceload remove ~-' + half + ' ~-20 ~' + half + ' ~20');
            if (feedbackTarget) {
                feedbackTarget.tell(Text.green('✅ Участок стены рубежа R=' + radius + ' длиной ' + length + ' успешно построен!'));
            }
        }
    }

    processBatch();
}

// ==============================================================================
// 📜 BRIGADIER COMMAND REGISTRATION
// ==============================================================================

ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event;

    // Command: /build_sector_gate <radius> <direction>
    event.register(
        Commands.literal('build_sector_gate')
            .requires(s => s.hasPermission(2))
            .then(Commands.argument('radius', Arguments.INTEGER.create(event))
                .then(Commands.argument('direction', Arguments.STRING.create(event))
                    .executes(ctx => {
                        let server = ctx.source.server;
                        let level = ctx.source.level || (ctx.source.player ? ctx.source.player.level : server.overworld());
                        let radius = Arguments.INTEGER.getResult(ctx, 'radius');
                        let dir = Arguments.STRING.getResult(ctx, 'direction');
                        let player = null;
                        try { player = ctx.source.player; } catch (e) {}

                        generateCardinalGate(server, level, radius, dir, player);
                        return 1;
                    })
                )
            )
    );

    // Command: /build_sector_wall <radius> <direction> <length>
    event.register(
        Commands.literal('build_sector_wall')
            .requires(s => s.hasPermission(2))
            .then(Commands.argument('radius', Arguments.INTEGER.create(event))
                .then(Commands.argument('direction', Arguments.STRING.create(event))
                    .then(Commands.argument('length', Arguments.INTEGER.create(event))
                        .executes(ctx => {
                            let server = ctx.source.server;
                            let level = ctx.source.level || (ctx.source.player ? ctx.source.player.level : server.overworld());
                            let radius = Arguments.INTEGER.getResult(ctx, 'radius');
                            let dir = Arguments.STRING.getResult(ctx, 'direction');
                            let length = Arguments.INTEGER.getResult(ctx, 'length');
                            let player = null;
                            try { player = ctx.source.player; } catch (e) {}

                            generateWallSection(server, level, radius, dir, length, player);
                            return 1;
                        })
                    )
                )
            )
    );
});

