// ==============================================================================
// 🏰 ELYRIUM RPG: PROCEDURAL GRAPH MEGA-DUNGEON ENGINE (v3.0)
// Dimension: elyrium:dungeons | Isolation Grid: X = ID * 1500, Z = 0
// ==============================================================================
// - Complete overhaul of dungeon topology: 4 randomized branching layouts.
// - Authentic architectural rooms: Pillared Crypts, Treasury Vaults with sarcophagi,
//   Chasm Bridges over lava/void, Mini-Boss Arenas, Spiral Descents, and Grand Boss Sanctums.
// - Organic textured floors and walls (stone bricks + cracked + mossy).
// - Tactical armored mobs with equipment, shields, bows, and custom combat roles.
// - Functional loot populator: Dungeon Essences, Epoch Ingots, Potions, and Defiled Gear!
// - Portcullis Progression Gate: unlocks with mechanical chains upon Mini-Boss defeat.
// - Triumph Portal & Golden Victory Chest upon Final Boss defeat.
// ==============================================================================

const DUNGEON_PALETTES = {
    1: { // Sector 1: Overworld
        floor: 'minecraft:stone_bricks',
        floor_cracked: 'minecraft:cracked_stone_bricks',
        floor_mossy: 'minecraft:mossy_stone_bricks',
        wall: 'minecraft:stone_bricks',
        wall_detail: 'minecraft:chiseled_stone_bricks',
        pillar: 'minecraft:polished_andesite',
        light: 'minecraft:lantern',
        gate: 'minecraft:iron_bars',
        ceiling: 'minecraft:cobblestone',
        accent: 'minecraft:gold_block',
        abyss_floor: 'minecraft:deepslate_bricks',
        abyss_wall: 'minecraft:polished_deepslate',
        liquid: 'minecraft:water',
        sarcophagus: 'minecraft:deepslate_bricks'
    },
    2: { // Sector 2: Nether
        floor: 'minecraft:polished_blackstone',
        floor_cracked: 'minecraft:cracked_polished_blackstone_bricks',
        floor_mossy: 'minecraft:nether_bricks',
        wall: 'minecraft:polished_blackstone_bricks',
        wall_detail: 'minecraft:chiseled_polished_blackstone',
        pillar: 'minecraft:gilded_blackstone',
        light: 'minecraft:soul_lantern',
        gate: 'minecraft:iron_bars',
        ceiling: 'minecraft:nether_bricks',
        accent: 'minecraft:crying_obsidian',
        abyss_floor: 'minecraft:polished_blackstone_bricks',
        abyss_wall: 'minecraft:crying_obsidian',
        liquid: 'minecraft:lava',
        sarcophagus: 'minecraft:polished_blackstone_bricks'
    },
    3: { // Sector 3: Aether
        floor: 'minecraft:smooth_sandstone',
        floor_cracked: 'minecraft:cut_sandstone',
        floor_mossy: 'aether:carved_stone',
        wall: 'minecraft:quartz_bricks',
        wall_detail: 'minecraft:chiseled_quartz_block',
        pillar: 'minecraft:polished_diorite',
        light: 'minecraft:sea_lantern',
        gate: 'minecraft:iron_bars',
        ceiling: 'minecraft:smooth_quartz',
        accent: 'minecraft:gold_block',
        abyss_floor: 'minecraft:quartz_bricks',
        abyss_wall: 'minecraft:smooth_quartz',
        liquid: 'minecraft:water',
        sarcophagus: 'minecraft:cut_sandstone'
    },
    4: { // Sector 4: The End
        floor: 'minecraft:end_stone_bricks',
        floor_cracked: 'minecraft:purpur_block',
        floor_mossy: 'minecraft:purpur_pillar',
        wall: 'minecraft:end_stone_bricks',
        wall_detail: 'minecraft:purpur_pillar',
        pillar: 'minecraft:obsidian',
        light: 'minecraft:end_rod',
        gate: 'minecraft:iron_bars',
        ceiling: 'minecraft:end_stone',
        accent: 'minecraft:crying_obsidian',
        abyss_floor: 'minecraft:purpur_block',
        abyss_wall: 'minecraft:obsidian',
        liquid: 'minecraft:air',
        sarcophagus: 'minecraft:purpur_pillar'
    },
    5: { // Sector 5: Eternal Starlight
        floor: 'minecraft:prismarine_bricks',
        floor_cracked: 'minecraft:dark_prismarine',
        floor_mossy: 'minecraft:amethyst_block',
        wall: 'minecraft:dark_prismarine',
        wall_detail: 'minecraft:chiseled_stone_bricks',
        pillar: 'minecraft:chiseled_stone_bricks',
        light: 'minecraft:sea_lantern',
        gate: 'minecraft:iron_bars',
        ceiling: 'minecraft:prismarine',
        accent: 'minecraft:amethyst_block',
        abyss_floor: 'minecraft:dark_prismarine',
        abyss_wall: 'minecraft:prismarine_bricks',
        liquid: 'minecraft:water',
        sarcophagus: 'minecraft:amethyst_block'
    },
    6: { // Sector 6: Deeper Darker
        floor: 'minecraft:deepslate_bricks',
        floor_cracked: 'minecraft:sculk',
        floor_mossy: 'minecraft:sculk_catalyst',
        wall: 'minecraft:polished_deepslate',
        wall_detail: 'minecraft:reinforced_deepslate',
        pillar: 'minecraft:reinforced_deepslate',
        light: 'minecraft:soul_lantern',
        gate: 'minecraft:iron_bars',
        ceiling: 'minecraft:cobbled_deepslate',
        accent: 'minecraft:sculk_shrieker',
        abyss_floor: 'minecraft:deepslate_bricks',
        abyss_wall: 'minecraft:reinforced_deepslate',
        liquid: 'minecraft:air',
        sarcophagus: 'minecraft:reinforced_deepslate'
    },
    7: { // Sector 7: DivineRPG Eden
        floor: 'minecraft:smooth_sandstone',
        floor_cracked: 'minecraft:cut_sandstone',
        floor_mossy: 'minecraft:sandstone',
        wall: 'minecraft:cut_sandstone',
        wall_detail: 'minecraft:chiseled_sandstone',
        pillar: 'minecraft:chiseled_sandstone',
        light: 'minecraft:glowstone',
        gate: 'minecraft:iron_bars',
        ceiling: 'minecraft:sandstone',
        accent: 'minecraft:gold_block',
        abyss_floor: 'minecraft:cut_sandstone',
        abyss_wall: 'minecraft:smooth_sandstone',
        liquid: 'minecraft:water',
        sarcophagus: 'minecraft:cut_sandstone'
    },
    8: { // Sector 8: DivineRPG Mortum
        floor: 'minecraft:polished_blackstone',
        floor_cracked: 'minecraft:crying_obsidian',
        floor_mossy: 'minecraft:bone_block',
        wall: 'minecraft:crying_obsidian',
        wall_detail: 'minecraft:netherite_block',
        pillar: 'minecraft:netherite_block',
        light: 'minecraft:soul_lantern',
        gate: 'minecraft:iron_bars',
        ceiling: 'minecraft:blackstone',
        accent: 'minecraft:respawn_anchor',
        abyss_floor: 'minecraft:crying_obsidian',
        abyss_wall: 'minecraft:polished_blackstone',
        liquid: 'minecraft:lava',
        sarcophagus: 'minecraft:crying_obsidian'
    }
};

// Safe recursive fill to prevent Vanilla 32,768 block volume overflow
function safeFill(server, x1, y1, z1, x2, y2, z2, block, extra) {
    let minX = Math.min(x1, x2);
    let maxX = Math.max(x1, x2);
    let minY = Math.min(y1, y2);
    let maxY = Math.max(y1, y2);
    let minZ = Math.min(z1, z2);
    let maxZ = Math.max(z1, z2);
    let extraStr = extra ? (' ' + extra) : '';

    let dx = maxX - minX + 1;
    let dy = maxY - minY + 1;
    let dz = maxZ - minZ + 1;
    let vol = dx * dy * dz;

    if (vol <= 30000) {
        server.runCommandSilent(`execute in elyrium:dungeons run fill ${minX} ${minY} ${minZ} ${maxX} ${maxY} ${maxZ} ${block}${extraStr}`);
        return;
    }

    if (dz >= dx && dz >= dy) {
        let midZ = Math.floor((minZ + maxZ) / 2);
        safeFill(server, minX, minY, minZ, maxX, maxY, midZ, block, extra);
        safeFill(server, minX, minY, midZ + 1, maxX, maxY, maxZ, block, extra);
    } else if (dy >= dx && dy >= dz) {
        let midY = Math.floor((minY + maxY) / 2);
        safeFill(server, minX, minY, minZ, maxX, midY, maxZ, block, extra);
        safeFill(server, minX, midY + 1, minZ, maxX, maxY, maxZ, block, extra);
    } else {
        let midX = Math.floor((minX + maxX) / 2);
        safeFill(server, minX, minY, minZ, midX, maxY, maxZ, block, extra);
        safeFill(server, midX + 1, minY, minZ, maxX, maxY, maxZ, block, extra);
    }
}

var ElyriumDungeonStitcher = {
    getPalette: function(sector) {
        return DUNGEON_PALETTES[sector] || DUNGEON_PALETTES[1];
    },

    // Sealed Subterranean Sarcophagus Hull (Guarantees zero void exposure)
    buildSarcophagus: function(server, originX, pal) {
        let floorBlock = pal.sarcophagus || pal.wall;
        let wallBlock = pal.wall;
        let ceilBlock = pal.ceiling || pal.wall;

        // Massive footprint encompassing all potential branching wings: X: -64..+64, Z: -26..156, Y: 28..78
        safeFill(server, originX - 64, 28, -26, originX + 64, 32, 156, floorBlock);
        safeFill(server, originX - 64, 28, -26, originX - 63, 78, 156, wallBlock); // West
        safeFill(server, originX + 63, 28, -26, originX + 64, 78, 156, wallBlock); // East
        safeFill(server, originX - 64, 28, -26, originX + 64, 78, -25, wallBlock); // North
        safeFill(server, originX - 64, 28, 155, originX + 64, 78, 156, wallBlock); // South
        safeFill(server, originX - 64, 77, -26, originX + 64, 78, 156, ceilBlock); // Ceiling
    },

    // 1. Entrance Pavilion
    buildEntranceHall: function(server, cx, cy, cz, pal, sector, instanceId) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let r = 5;

        // Subfloor & Floor
        safeFill(server, cx - r, cy - 3, cz - r, cx + r, cy - 1, cz + r, pal.wall);
        safeFill(server, cx - r, cy, cz - r, cx + r, cy, cz + r, pal.floor);

        // Walls & Ceiling
        safeFill(server, cx - r, cy + 1, cz - r, cx + r, cy + 5, cz - r, pal.wall);
        safeFill(server, cx - r, cy + 1, cz + r, cx + r, cy + 5, cz + r, pal.wall);
        safeFill(server, cx - r, cy + 1, cz - r, cx - r, cy + 5, cz + r, pal.wall);
        safeFill(server, cx + r, cy + 1, cz - r, cx + r, cy + 5, cz + r, pal.wall);
        safeFill(server, cx - r, cy + 6, cz - r, cx + r, cy + 6, cz + r, pal.ceiling);

        // Air inside
        safeFill(server, cx - (r - 1), cy + 1, cz - (r - 1), cx + (r - 1), cy + 5, cz + (r - 1), 'minecraft:air');

        // Central Preparation Dais & Runes
        cmd(`fill ${cx - 1} ${cy} ${cz - 1} ${cx + 1} ${cy} ${cz + 1} ${pal.wall_detail}`);
        cmd(`setblock ${cx} ${cy} ${cz} ${pal.accent}`);

        // Corner Light Pillars
        cmd(`setblock ${cx - 4} ${cy + 1} ${cz - 4} ${pal.pillar}`);
        cmd(`setblock ${cx - 4} ${cy + 2} ${cz - 4} ${pal.light}`);
        cmd(`setblock ${cx + 4} ${cy + 1} ${cz - 4} ${pal.pillar}`);
        cmd(`setblock ${cx + 4} ${cy + 2} ${cz - 4} ${pal.light}`);
        cmd(`setblock ${cx - 4} ${cy + 1} ${cz + 4} ${pal.pillar}`);
        cmd(`setblock ${cx - 4} ${cy + 2} ${cz + 4} ${pal.light}`);
        cmd(`setblock ${cx + 4} ${cy + 1} ${cz + 4} ${pal.pillar}`);
        cmd(`setblock ${cx + 4} ${cy + 2} ${cz + 4} ${pal.light}`);

        // Exit Arch on South face
        cmd(`fill ${cx - 2} ${cy + 1} ${cz + r} ${cx + 2} ${cy + 4} ${cz + r} minecraft:air`);
    },

    // 2. Pillared Crypt Hall with multi-block pillars and rich texturing
    buildPillaredHall: function(server, cx, cy, cz, radX, radZ, height, pal, isLower) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let floorB = isLower ? pal.abyss_floor : pal.floor;
        let wallB = isLower ? pal.abyss_wall : pal.wall;
        let ceilB = isLower ? pal.abyss_floor : pal.ceiling;

        // Subfloor & Floor
        safeFill(server, cx - radX, cy - 3, cz - radZ, cx + radX, cy - 1, cz + radZ, wallB);
        safeFill(server, cx - radX, cy, cz - radZ, cx + radX, cy, cz + radZ, floorB);

        // Organic cracked/mossy floor texture patches
        cmd(`fill ${cx - Math.floor(radX / 2)} ${cy} ${cz - Math.floor(radZ / 2)} ${cx} ${cy} ${cz} ${pal.floor_cracked} replace ${floorB}`);
        cmd(`fill ${cx + 1} ${cy} ${cz + 1} ${cx + Math.floor(radX / 2)} ${cy} ${cz + Math.floor(radZ / 2)} ${pal.floor_mossy} replace ${floorB}`);

        // Walls & Ceiling
        safeFill(server, cx - radX, cy + 1, cz - radZ, cx + radX, cy + height, cz - radZ, wallB);
        safeFill(server, cx - radX, cy + 1, cz + radZ, cx + radX, cy + height, cz + radZ, wallB);
        safeFill(server, cx - radX, cy + 1, cz - radZ, cx - radX, cy + height, cz + radZ, wallB);
        safeFill(server, cx + radX, cy + 1, cz - radZ, cx + radX, cy + height, cz + radZ, wallB);
        safeFill(server, cx - radX, cy + height + 1, cz - radZ, cx + radX, cy + height + 1, cz + radZ, ceilB);

        // Hollow interior
        safeFill(server, cx - (radX - 1), cy + 1, cz - (radZ - 1), cx + (radX - 1), cy + height, cz + (radZ - 1), 'minecraft:air');

        // 4 Monumental Pillars (2x2) with pedestal bases and capital lanterns
        let px = Math.max(3, Math.floor(radX * 0.55));
        let pz = Math.max(3, Math.floor(radZ * 0.55));
        let pillars = [
            [-px, -pz], [px, -pz], [-px, pz], [px, pz]
        ];

        pillars.forEach(p => {
            let colX = cx + p[0];
            let colZ = cz + p[1];
            // 2x2 Pillar
            safeFill(server, colX, cy + 1, colZ, colX + 1, cy + height - 1, colZ + 1, pal.pillar);
            // Pedestal base
            safeFill(server, colX - 1, cy + 1, colZ - 1, colX + 2, cy + 1, colZ + 2, pal.wall_detail);
            // Capital brackets with lanterns
            cmd(`setblock ${colX} ${cy + 3} ${colZ - 1} ${pal.light}`);
            cmd(`setblock ${colX + 1} ${cy + 3} ${colZ + 2} ${pal.light}`);
        });

        // Atmospheric props: corner cobwebs & decorated pots
        cmd(`setblock ${cx - radX + 1} ${cy + 1} ${cz - radZ + 1} minecraft:decorated_pot`);
        cmd(`setblock ${cx + radX - 1} ${cy + 1} ${cz + radZ - 1} minecraft:decorated_pot`);
        cmd(`setblock ${cx - radX + 1} ${cy + height} ${cz - radZ + 1} minecraft:cobweb`);
        cmd(`setblock ${cx + radX - 1} ${cy + height} ${cz + radZ - 1} minecraft:cobweb`);
    },

    // 3. Treasury Vault with Sarcophagi, Traps & Golden Chest
    buildTreasuryVault: function(server, cx, cy, cz, pal, sector, instanceId) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let r = 7;
        let h = 6;

        // Shell
        safeFill(server, cx - r, cy - 3, cz - r, cx + r, cy - 1, cz + r, pal.wall);
        safeFill(server, cx - r, cy, cz - r, cx + r, cy, cz + r, pal.floor);
        safeFill(server, cx - r, cy + 1, cz - r, cx + r, cy + h, cz - r, pal.wall);
        safeFill(server, cx - r, cy + 1, cz + r, cx + r, cy + h, cz + r, pal.wall);
        safeFill(server, cx - r, cy + 1, cz - r, cx - r, cy + h, cz + r, pal.wall);
        safeFill(server, cx + r, cy + 1, cz - r, cx + r, cy + h, cz + r, pal.wall);
        safeFill(server, cx - r, cy + h + 1, cz - r, cx + r, cy + h + 1, cz + r, pal.ceiling);
        safeFill(server, cx - (r - 1), cy + 1, cz - (r - 1), cx + (r - 1), cy + h, cz + (r - 1), 'minecraft:air');

        // Center Dais for the Treasury Chest
        cmd(`fill ${cx - 2} ${cy + 1} ${cz - 2} ${cx + 2} ${cy + 1} ${cz + 2} ${pal.wall_detail}`);
        cmd(`setblock ${cx} ${cy + 2} ${cz} minecraft:chest[facing=south]{CustomName:'{"text":"Сокровищница Подземелья","color":"gold"}'}`);

        // Populate Treasury Chest with authentic loot
        this.populateTreasuryChest(server, cx, cy + 2, cz, sector, instanceId);

        // 2 Ancient Sarcophagi along side walls
        // Left Sarcophagus
        cmd(`fill ${cx - 5} ${cy + 1} ${cz - 1} ${cx - 5} ${cy + 1} ${cz + 1} ${pal.sarcophagus}`);
        cmd(`setblock ${cx - 5} ${cy + 2} ${cz - 1} minecraft:soul_candle[lit=true]`);
        cmd(`setblock ${cx - 5} ${cy + 2} ${cz + 1} minecraft:skeleton_skull`);

        // Right Sarcophagus
        cmd(`fill ${cx + 5} ${cy + 1} ${cz - 1} ${cx + 5} ${cy + 1} ${cz + 1} ${pal.sarcophagus}`);
        cmd(`setblock ${cx + 5} ${cy + 2} ${cz - 1} minecraft:soul_candle[lit=true]`);
        cmd(`setblock ${cx + 5} ${cy + 2} ${cz + 1} minecraft:skeleton_skull`);

        // Atmospheric lighting
        cmd(`setblock ${cx - 4} ${cy + 4} ${cz - 4} ${pal.light}`);
        cmd(`setblock ${cx + 4} ${cy + 4} ${cz - 4} ${pal.light}`);
        cmd(`setblock ${cx - 4} ${cy + 4} ${cz + 4} ${pal.light}`);
        cmd(`setblock ${cx + 4} ${cy + 4} ${cz + 4} ${pal.light}`);

        // Spawn Elite Treasury Guardians
        this.spawnVanguardPack(server, cx, cy + 1, cz - 3, sector, instanceId, 'treasury_guard');
    },

    // 4. Chasm Bridge over Lava or Void
    buildChasmBridge: function(server, cx, cy, cz, pal, sector) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let rx = 7;
        let rz = 9;
        let h = 8;

        // Walls and Ceiling
        safeFill(server, cx - rx, cy - 6, cz - rz, cx + rx, cy - 5, cz + rz, pal.wall);
        safeFill(server, cx - rx, cy - 4, cz - rz, cx + rx, cy + h, cz - rz, pal.wall);
        safeFill(server, cx - rx, cy - 4, cz + rz, cx + rx, cy + h, cz + rz, pal.wall);
        safeFill(server, cx - rx, cy - 4, cz - rz, cx - rx, cy + h, cz + rz, pal.wall);
        safeFill(server, cx + rx, cy - 4, cz - rz, cx + rx, cy + h, cz + rz, pal.wall);
        safeFill(server, cx - rx, cy + h + 1, cz - rz, cx + rx, cy + h + 1, cz + rz, pal.ceiling);

        // Clear air for the chasm
        safeFill(server, cx - (rx - 1), cy - 4, cz - (rz - 1), cx + (rx - 1), cy + h, cz + (rz - 1), 'minecraft:air');

        // Liquid Pool at the bottom of the Chasm (Y - 4 to Y - 3)
        let liquid = pal.liquid || 'minecraft:lava';
        safeFill(server, cx - (rx - 1), cy - 4, cz - (rz - 1), cx + (rx - 1), cy - 3, cz + (rz - 1), liquid);

        // Central Stone Arch Bridge spanning Z (Width 3)
        safeFill(server, cx - 1, cy, cz - rz, cx + 1, cy, cz + rz, pal.floor);
        // Bridge Support Arches underneath
        cmd(`fill ${cx - 1} ${cy - 2} ${cz - 4} ${cx + 1} ${cy - 1} ${cz - 2} ${pal.pillar}`);
        cmd(`fill ${cx - 1} ${cy - 2} ${cz + 2} ${cx + 1} ${cy - 1} ${cz + 4} ${pal.pillar}`);

        // Broken Bridge Railings
        for (let bz = cz - rz + 2; bz <= cz + rz - 2; bz += 2) {
            cmd(`setblock ${cx - 2} ${cy + 1} ${bz} ${pal.gate}`);
            cmd(`setblock ${cx + 2} ${cy + 1} ${bz} ${pal.gate}`);
        }

        // Side Sniper Balconies with lights
        safeFill(server, cx - rx + 1, cy + 2, cz - 3, cx - rx + 3, cy + 2, cz + 3, pal.floor);
        cmd(`setblock ${cx - rx + 2} ${cy + 3} ${cz} ${pal.light}`);
        safeFill(server, cx + rx - 3, cy + 2, cz - 3, cx + rx - 1, cy + 2, cz + 3, pal.floor);
        cmd(`setblock ${cx + rx - 2} ${cy + 3} ${cz} ${pal.light}`);
    },

    // 5. Mini-Boss Arena with Portcullis Progression Gate
    buildMiniBossChamber: function(server, cx, cy, cz, pal, sector, instanceId, gateX, gateY, gateZ) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let r = 9;
        let h = 8;

        // Shell
        safeFill(server, cx - r, cy - 3, cz - r, cx + r, cy - 1, cz + r, pal.wall);
        safeFill(server, cx - r, cy, cz - r, cx + r, cy, cz + r, pal.floor);
        safeFill(server, cx - r, cy + 1, cz - r, cx + r, cy + h, cz - r, pal.wall);
        safeFill(server, cx - r, cy + 1, cz + r, cx + r, cy + h, cz + r, pal.wall);
        safeFill(server, cx - r, cy + 1, cz - r, cx - r, cy + h, cz + r, pal.wall);
        safeFill(server, cx + r, cy + 1, cz - r, cx + r, cy + h, cz + r, pal.wall);
        safeFill(server, cx - r, cy + h + 1, cz - r, cx + r, cy + h + 1, cz + r, pal.ceiling);
        safeFill(server, cx - (r - 1), cy + 1, cz - (r - 1), cx + (r - 1), cy + h, cz + (r - 1), 'minecraft:air');

        // Circular combat ring in center
        cmd(`fill ${cx - 4} ${cy} ${cz - 4} ${cx + 4} ${cy} ${cz + 4} ${pal.wall_detail}`);
        cmd(`setblock ${cx} ${cy} ${cz} ${pal.accent}`);

        // 4 Burning Fire Braziers at cardinal points
        let braziers = [
            [cx - 5, cz], [cx + 5, cz], [cx, cz - 5], [cx, cz + 5]
        ];
        braziers.forEach(b => {
            cmd(`setblock ${b[0]} ${cy + 1} ${b[1]} minecraft:netherrack`);
            cmd(`setblock ${b[0]} ${cy + 2} ${b[1]} minecraft:fire`);
            cmd(`setblock ${b[0]} ${cy + 1} ${b[1] - 1} ${pal.gate}`);
            cmd(`setblock ${b[0]} ${cy + 1} ${b[1] + 1} ${pal.gate}`);
        });

        // 4 Corner Observation Columns
        cmd(`fill ${cx - 7} ${cy + 1} ${cz - 7} ${cx - 7} ${cy + 4} ${cz - 7} ${pal.pillar}`);
        cmd(`setblock ${cx - 7} ${cy + 5} ${cz - 7} ${pal.light}`);
        cmd(`fill ${cx + 7} ${cy + 1} ${cz - 7} ${cx + 7} ${cy + 4} ${cz - 7} ${pal.pillar}`);
        cmd(`setblock ${cx + 7} ${cy + 5} ${cz - 7} ${pal.light}`);
        cmd(`fill ${cx - 7} ${cy + 1} ${cz + 7} ${cx - 7} ${cy + 4} ${cz + 7} ${pal.pillar}`);
        cmd(`setblock ${cx - 7} ${cy + 5} ${cz + 7} ${pal.light}`);
        cmd(`fill ${cx + 7} ${cy + 1} ${cz + 7} ${cx + 7} ${cy + 4} ${cz + 7} ${pal.pillar}`);
        cmd(`setblock ${cx + 7} ${cy + 5} ${cz + 7} ${pal.light}`);

        // Portcullis Exit Gate (Locked Iron Bars)
        safeFill(server, gateX - 2, gateY + 1, gateZ, gateX + 2, gateY + 4, gateZ, pal.gate);

        // Record Portcullis Gate Coordinates in persistentData
        let pData = server.persistentData;
        let instTag = `inst_${instanceId}`;
        let instInfo = pData.getCompound(instTag);
        instInfo.putDouble('gate_x', gateX);
        instInfo.putDouble('gate_y', gateY);
        instInfo.putDouble('gate_z', gateZ);
        pData.put(instTag, instInfo);

        // Spawn Mini-Boss Champion
        this.spawnMiniBoss(server, cx, cy + 1, cz, sector, instanceId);
    },

    // 6. Abyssal Vault on Tier 2
    buildAbyssalVault: function(server, cx, cy, cz, pal, sector, instanceId) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let r = 7;
        let h = 7;

        safeFill(server, cx - r, cy - 3, cz - r, cx + r, cy - 1, cz + r, pal.abyss_wall);
        safeFill(server, cx - r, cy, cz - r, cx + r, cy, cz + r, pal.abyss_floor);
        safeFill(server, cx - r, cy + 1, cz - r, cx + r, cy + h, cz - r, pal.abyss_wall);
        safeFill(server, cx - r, cy + 1, cz + r, cx + r, cy + h, cz + r, pal.abyss_wall);
        safeFill(server, cx - r, cy + 1, cz - r, cx - r, cy + h, cz + r, pal.abyss_wall);
        safeFill(server, cx + r, cy + 1, cz - r, cx + r, cy + h, cz + r, pal.abyss_wall);
        safeFill(server, cx - r, cy + h + 1, cz - r, cx + r, cy + h + 1, cz + r, pal.abyss_floor);
        safeFill(server, cx - (r - 1), cy + 1, cz - (r - 1), cx + (r - 1), cy + h, cz + (r - 1), 'minecraft:air');

        // Veins of crying obsidian
        cmd(`fill ${cx - 3} ${cy} ${cz - 3} ${cx + 3} ${cy} ${cz + 3} minecraft:crying_obsidian replace ${pal.abyss_floor}`);

        // Hanging chains from ceiling
        cmd(`fill ${cx - 3} ${cy + 3} ${cz - 3} ${cx - 3} ${cy + h} ${cz - 3} minecraft:chain`);
        cmd(`setblock ${cx - 3} ${cy + 2} ${cz - 3} ${pal.light}`);
        cmd(`fill ${cx + 3} ${cy + 3} ${cz + 3} ${cx + 3} ${cy + h} ${cz + 3} minecraft:chain`);
        cmd(`setblock ${cx + 3} ${cy + 2} ${cz + 3} ${pal.light}`);

        // Spawn Abyssal Guards
        this.spawnAbyssGuards(server, cx, cy + 1, cz, sector, instanceId);
    },

    // 7. Grand Boss Sanctum & Imperial Dais
    buildGrandBossSanctum: function(server, cx, cy, cz, pal, sector, instanceId) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let r = 12; // 25x25 arena!
        let h = 10;

        // Shell
        safeFill(server, cx - r, cy - 3, cz - r, cx + r, cy - 1, cz + r, pal.abyss_wall);
        safeFill(server, cx - r, cy, cz - r, cx + r, cy, cz + r, pal.abyss_floor);
        safeFill(server, cx - r, cy + 1, cz - r, cx + r, cy + h, cz - r, pal.abyss_wall);
        safeFill(server, cx - r, cy + 1, cz + r, cx + r, cy + h, cz + r, pal.abyss_wall);
        safeFill(server, cx - r, cy + 1, cz - r, cx - r, cy + h, cz + r, pal.abyss_wall);
        safeFill(server, cx + r, cy + 1, cz - r, cx + r, cy + h, cz + r, pal.abyss_wall);
        safeFill(server, cx - r, cy + h + 1, cz - r, cx + r, cy + h + 1, cz + r, pal.abyss_floor);
        safeFill(server, cx - (r - 1), cy + 1, cz - (r - 1), cx + (r - 1), cy + h, cz + (r - 1), 'minecraft:air');

        // 4 Colossal Corner Columns (3x3) for tactical cover & dodging
        let colCoords = [
            [cx - 7, cz - 7], [cx + 7, cz - 7], [cx - 7, cz + 7], [cx + 7, cz + 7]
        ];
        colCoords.forEach(pos => {
            safeFill(server, pos[0] - 1, cy + 1, pos[1] - 1, pos[0] + 1, cy + h - 1, pos[1] + 1, pal.pillar);
            cmd(`setblock ${pos[0]} ${cy + 4} ${pos[1]} ${pal.light}`);
        });

        // Raised Imperial Dais at the far end (Z + 8)
        let throneZ = cz + 8;
        safeFill(server, cx - 4, cy + 1, throneZ - 2, cx + 4, cy + 2, throneZ + 2, pal.wall_detail);
        // Steps leading up to throne
        safeFill(server, cx - 3, cy + 1, throneZ - 3, cx + 3, cy + 1, throneZ - 3, pal.wall_detail);

        // Ornate Throne Structure
        cmd(`setblock ${cx} ${cy + 3} ${throneZ} minecraft:chiseled_polished_blackstone`);
        cmd(`setblock ${cx} ${cy + 4} ${throneZ} ${pal.accent}`);
        cmd(`setblock ${cx - 1} ${cy + 3} ${throneZ} minecraft:polished_blackstone_stairs[facing=east]`);
        cmd(`setblock ${cx + 1} ${cy + 3} ${throneZ} minecraft:polished_blackstone_stairs[facing=west]`);

        // Flanking Burning Flame Bowls
        cmd(`setblock ${cx - 3} ${cy + 3} ${throneZ} minecraft:netherrack`);
        cmd(`setblock ${cx - 3} ${cy + 4} ${throneZ} minecraft:soul_fire`);
        cmd(`setblock ${cx + 3} ${cy + 3} ${throneZ} minecraft:netherrack`);
        cmd(`setblock ${cx + 3} ${cy + 4} ${throneZ} minecraft:soul_fire`);

        // Record Boss Throne Coordinates for persistentData victory spawning
        let pData = server.persistentData;
        let instTag = `inst_${instanceId}`;
        let instInfo = pData.getCompound(instTag);
        instInfo.putDouble('boss_throne_x', cx);
        instInfo.putDouble('boss_throne_y', cy + 1);
        instInfo.putDouble('boss_throne_z', throneZ - 4);
        pData.put(instTag, instInfo);

        // Spawn Sector Overlord Final Boss
        this.spawnFinalBoss(server, cx, cy + 1, cz, sector, instanceId);
    },

    // 8. Corridors & Stairways
    buildCorridorZ: function(server, x, y, z1, z2, width, pal, isLower) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let startZ = Math.min(z1, z2);
        let endZ = Math.max(z1, z2);
        let halfW = Math.floor(width / 2);
        let floorB = isLower ? pal.abyss_floor : pal.floor;
        let wallB = isLower ? pal.abyss_wall : pal.wall;
        let ceilB = isLower ? pal.abyss_floor : pal.ceiling;

        safeFill(server, x - halfW - 1, y - 3, startZ, x + halfW + 1, y - 1, endZ, wallB);
        safeFill(server, x - halfW, y, startZ, x + halfW, y, endZ, floorB);
        safeFill(server, x - halfW, y + 1, startZ, x + halfW, y + 4, endZ, 'minecraft:air');
        safeFill(server, x - halfW - 1, y + 1, startZ, x - halfW - 1, y + 4, endZ, wallB);
        safeFill(server, x + halfW + 1, y + 1, startZ, x + halfW + 1, y + 4, endZ, wallB);
        safeFill(server, x - halfW - 1, y + 5, startZ, x + halfW + 1, y + 5, endZ, ceilB);

        // Wall sconce lights every 5 blocks
        for (let cz = startZ; cz <= endZ; cz += 5) {
            cmd(`setblock ${x - halfW} ${y + 3} ${cz} ${pal.light}`);
            cmd(`setblock ${x + halfW} ${y + 3} ${cz} ${pal.light}`);
        }
    },

    buildCorridorX: function(server, z, y, x1, x2, width, pal, isLower) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let startX = Math.min(x1, x2);
        let endX = Math.max(x1, x2);
        let halfW = Math.floor(width / 2);
        let floorB = isLower ? pal.abyss_floor : pal.floor;
        let wallB = isLower ? pal.abyss_wall : pal.wall;
        let ceilB = isLower ? pal.abyss_floor : pal.ceiling;

        safeFill(server, startX, y - 3, z - halfW - 1, endX, y - 1, z + halfW + 1, wallB);
        safeFill(server, startX, y, z - halfW, endX, y, z + halfW, floorB);
        safeFill(server, startX, y + 1, z - halfW, endX, y + 4, z + halfW, 'minecraft:air');
        safeFill(server, startX, y + 1, z - halfW - 1, endX, y + 4, z - halfW - 1, wallB);
        safeFill(server, startX, y + 1, z + halfW + 1, endX, y + 4, z + halfW + 1, wallB);
        safeFill(server, startX, y + 5, z - halfW - 1, endX, y + 5, z + halfW + 1, ceilB);

        for (let cx = startX; cx <= endX; cx += 5) {
            cmd(`setblock ${cx} ${y + 3} ${z - halfW} ${pal.light}`);
            cmd(`setblock ${cx} ${y + 3} ${z + halfW} ${pal.light}`);
        }
    },

    // Grand Spiral Descent Staircase (from Y1=64 to Y2=46)
    buildDescendingStaircase: function(server, x, startY, endY, z1, z2, pal) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let startZ = Math.min(z1, z2);
        let endZ = Math.max(z1, z2);
        let totalSteps = endZ - startZ + 1;
        let yDrop = startY - endY;

        for (let cz = startZ; cz <= endZ; cz++) {
            let progress = (cz - startZ) / totalSteps;
            let currentY = Math.round(startY - (progress * yDrop));

            // Foundation
            cmd(`fill ${x - 3} ${currentY - 3} ${cz} ${x + 3} ${currentY} ${cz} ${pal.abyss_floor}`);
            // Air opening
            cmd(`fill ${x - 2} ${currentY + 1} ${cz} ${x + 2} ${currentY + 5} ${cz} minecraft:air`);
            // Side walls
            cmd(`fill ${x - 3} ${currentY + 1} ${cz} ${x - 3} ${currentY + 5} ${cz} ${pal.abyss_wall}`);
            cmd(`fill ${x + 3} ${currentY + 1} ${cz} ${x + 3} ${currentY + 5} ${cz} ${pal.abyss_wall}`);
            // Ceiling
            cmd(`fill ${x - 3} ${currentY + 6} ${cz} ${x + 3} ${currentY + 6} ${cz} ${pal.abyss_wall}`);

            // Lanterns every 3 steps
            if (cz % 3 === 0) {
                cmd(`setblock ${x - 2} ${currentY + 3} ${cz} ${pal.light}`);
                cmd(`setblock ${x + 2} ${currentY + 3} ${cz} ${pal.light}`);
            }
        }
    },

    // 9. Chest Loot Populators
    populateTreasuryChest: function(server, x, y, z, sector, instanceId) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let essenceItem = `kubejs:dungeon_essence_t${sector}`;

        // Guaranteed Essences
        cmd(`item replace block ${x} ${y} ${z} container.0 with ${essenceItem} 2`);
        // Sector Ingot
        let ingot = sector >= 4 ? 'minecraft:netherite_ingot' : (sector >= 2 ? 'minecraft:iron_ingot' : 'minecraft:copper_ingot');
        cmd(`item replace block ${x} ${y} ${z} container.4 with ${ingot} 4`);
        // Gems & Valuables
        cmd(`item replace block ${x} ${y} ${z} container.12 with minecraft:gold_ingot 6`);
        cmd(`item replace block ${x} ${y} ${z} container.14 with minecraft:lapis_lazuli 8`);
        // Potions & Consumables
        cmd(`item replace block ${x} ${y} ${z} container.22 with minecraft:potion[potion_contents={potion:"minecraft:healing"}] 1`);
    },

    populateVictoryChest: function(server, x, y, z, sector, instanceId) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let essenceItem = `kubejs:dungeon_essence_t${sector}`;

        // Guaranteed 2-3 Essences
        cmd(`item replace block ${x} ${y} ${z} container.4 with ${essenceItem} 3`);
        // Diamonds / High-tier Gems
        cmd(`item replace block ${x} ${y} ${z} container.0 with minecraft:diamond 2`);
        cmd(`item replace block ${x} ${y} ${z} container.8 with minecraft:emerald 4`);
        cmd(`item replace block ${x} ${y} ${z} container.20 with minecraft:gold_block 1`);
        cmd(`item replace block ${x} ${y} ${z} container.24 with minecraft:potion[potion_contents={potion:"minecraft:strong_healing"}] 2`);

        // 5% Jackpot: Defiled Equipment piece (increased to 20% for testing excitement)
        let roll = Math.random();
        if (roll <= 0.20) {
            let defiledItem = (roll <= 0.10) ? `kubejs:defiled_blade_t${sector}` : `kubejs:defiled_chestplate_t${sector}`;
            cmd(`item replace block ${x} ${y} ${z} container.13 with ${defiledItem} 1`);
        }
    },

    // 10. Armored Tactical Mobs
    spawnVanguardPack: function(server, x, y, z, sector, instanceId, packTag) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let baseMob = sector >= 4 ? 'minecraft:wither_skeleton' : (sector >= 2 ? 'minecraft:skeleton' : 'minecraft:zombie');

        // 3 Vanguard Swordsmen with armor & weapons
        for (let i = 0; i < 3; i++) {
            let ox = (i === 0 ? 0 : (i === 1 ? -2 : 2));
            let oz = (i === 0 ? 0 : 2);
            let nbt = `{Tags:["inst_${instanceId}","dungeon_elite","${packTag}"],CustomName:'{"text":"Страж Катакомб","color":"red"}',HandItems:[{id:"minecraft:iron_sword",count:1},{id:"minecraft:shield",count:1}],ArmorItems:[{id:"minecraft:chainmail_boots",count:1},{id:"minecraft:chainmail_leggings",count:1},{id:"minecraft:chainmail_chestplate",count:1},{id:"minecraft:iron_helmet",count:1}],HandDropChances:[0.0f,0.0f],ArmorDropChances:[0.0f,0.0f,0.0f,0.0f],Attributes:[{Name:"generic.max_health",Base:45.0f}],Health:45.0f}`;
            cmd(`summon ${baseMob} ${x + ox} ${y} ${z + oz} ${nbt}`);
        }

        // 2 Backline Archers
        let archerNbt = `{Tags:["inst_${instanceId}","dungeon_elite","${packTag}"],CustomName:'{"text":"Стрелок Катакомб","color":"dark_red"}',HandItems:[{id:"minecraft:bow",count:1},{}],ArmorItems:[{},{},{},{id:"minecraft:chainmail_helmet",count:1}],HandDropChances:[0.0f,0.0f],ArmorDropChances:[0.0f,0.0f,0.0f,0.0f],Attributes:[{Name:"generic.max_health",Base:30.0f}],Health:30.0f}`;
        cmd(`summon minecraft:skeleton ${x - 3} ${y} ${z + 3} ${archerNbt}`);
        cmd(`summon minecraft:skeleton ${x + 3} ${y} ${z + 3} ${archerNbt}`);
    },

    spawnArcherSnipers: function(server, x, y, z, sector, instanceId) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let nbt = `{Tags:["inst_${instanceId}","dungeon_elite","sniper"],CustomName:'{"text":"Снайпер Бездны","color":"dark_red"}',HandItems:[{id:"minecraft:bow",count:1},{}],ArmorItems:[{},{},{},{id:"minecraft:iron_helmet",count:1}],HandDropChances:[0.0f,0.0f]}`;
        cmd(`summon minecraft:skeleton ${x} ${y} ${z} ${nbt}`);
    },

    spawnMiniBoss: function(server, x, y, z, sector, instanceId) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let mobType = sector >= 4 ? 'minecraft:piglin_brute' : (sector >= 2 ? 'minecraft:wither_skeleton' : 'minecraft:vindicator');
        let nbt = `{Tags:["inst_${instanceId}","dungeon_miniboss"],CustomName:'{"text":"Хранитель Врат Катакомб [Мини-Босс]","color":"gold","bold":true}',HandItems:[{id:"minecraft:iron_axe",count:1},{}],ArmorItems:[{id:"minecraft:golden_boots",count:1},{id:"minecraft:golden_leggings",count:1},{id:"minecraft:golden_chestplate",count:1},{id:"minecraft:golden_helmet",count:1}],HandDropChances:[0.0f,0.0f],ArmorDropChances:[0.0f,0.0f,0.0f,0.0f],Attributes:[{Name:"generic.max_health",Base:180.0f},{Name:"generic.attack_damage",Base:8.0f},{Name:"generic.knockback_resistance",Base:0.6f}],Health:180.0f}`;
        cmd(`summon ${mobType} ${x} ${y} ${z} ${nbt}`);
    },

    spawnAbyssGuards: function(server, x, y, z, sector, instanceId) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let mobType = sector >= 6 ? 'minecraft:enderman' : (sector >= 3 ? 'minecraft:wither_skeleton' : 'minecraft:piglin_brute');
        let nbt = `{Tags:["inst_${instanceId}","dungeon_abyss_guard"],CustomName:'{"text":"Страж Недр","color":"dark_purple"}',HandItems:[{id:"minecraft:diamond_sword",count:1},{}],Attributes:[{Name:"generic.max_health",Base:70.0f}],Health:70.0f}`;
        cmd(`summon ${mobType} ${x - 3} ${y} ${z} ${nbt}`);
        cmd(`summon ${mobType} ${x + 3} ${y} ${z} ${nbt}`);
    },

    spawnFinalBoss: function(server, x, y, z, sector, instanceId) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let bossType = sector >= 6 ? 'minecraft:warden' : (sector >= 4 ? 'minecraft:elder_guardian' : (sector >= 2 ? 'minecraft:wither_skeleton' : 'minecraft:piglin_brute'));
        let nbt = `{Tags:["inst_${instanceId}","dungeon_boss"],CustomName:'{"text":"Владыка Недр Подземелья [Босс]","color":"dark_red","bold":true}',HandItems:[{id:"minecraft:netherite_axe",count:1},{}],ArmorItems:[{id:"minecraft:netherite_boots",count:1},{id:"minecraft:netherite_leggings",count:1},{id:"minecraft:netherite_chestplate",count:1},{id:"minecraft:golden_helmet",count:1}],HandDropChances:[0.0f,0.0f],ArmorDropChances:[0.0f,0.0f,0.0f,0.0f],Attributes:[{Name:"generic.max_health",Base:450.0f},{Name:"generic.attack_damage",Base:12.0f},{Name:"generic.knockback_resistance",Base:0.8f}],Health:450.0f}`;
        cmd(`summon ${bossType} ${x} ${y} ${z} ${nbt}`);
    },

    // 11. UNLOCK PORTCULLIS GATE UPON MINI-BOSS DEFEAT
    unlockPortcullis: function(server, instanceId) {
        let pData = server.persistentData;
        let instTag = `inst_${instanceId}`;
        if (!pData.contains(instTag)) return;

        let instInfo = pData.getCompound(instTag);
        let gx = instInfo.getDouble('gate_x');
        let gy = instInfo.getDouble('gate_y');
        let gz = instInfo.getDouble('gate_z');

        // Remove iron bars barrier
        server.runCommandSilent(`execute in elyrium:dungeons run fill ${gx - 2} ${gy + 1} ${gz} ${gx + 2} ${gy + 4} ${gz} minecraft:air`);

        // Sound & Notification
        let level = server.getLevel('elyrium:dungeons');
        if (level) {
            level.players.forEach(p => {
                if (p.persistentData.getInt('elyrium_active_instance') === instanceId) {
                    p.playNotifySound('minecraft:block.iron_door.open', 'players', 1.0, 0.8);
                    p.playNotifySound('minecraft:block.grindstone.use', 'players', 1.0, 0.6);
                    p.displayClientMessage(Component.literal('§a⚔ [ЯРУС I ЗАЧИЩЕН] §fХранитель повержен! Решетка в Недра распахнута!'), false);
                }
            });
        }
    },

    // ==========================================================================
    // 12. MASTER PROCEDURAL DUNGEON BUILDER (4 Branching Topologies)
    // ==========================================================================
    buildDungeon: function(server, instanceId, sector) {
        let pal = this.getPalette(sector);
        let originX = instanceId * 1500;
        let originY = 64;
        let originZ = 0;

        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);

        // Forceload chunk bounds
        cmd(`forceload add ${originX - 96} -96 ${originX + 96} 160`);

        // Procedural Layout Selection (0..3)
        let layout = (instanceId * 7 + sector * 13) % 4;
        console.log(`[ELYRIUM] Procedural Dungeon #${instanceId} (Sector ${sector}) Generating layout variant: ${layout} at X=${originX}`);

        // 1. Build Subterranean Sarcophagus Hull
        this.buildSarcophagus(server, originX, pal);

        // 2. Entrance Hall (Standardized origin at Z=0)
        this.buildEntranceHall(server, originX, originY, originZ, pal, sector, instanceId);

        // Connect Entrance (Z=5) to First Crossroads/Hall (Z=18)
        this.buildCorridorZ(server, originX, originY, 5, 18, 4, pal, false);

        // ======================================================================
        // LAYOUT 0: WEST BRANCHING CRYPT
        // ======================================================================
        if (layout === 0) {
            // Crossroads at (0, 64, 24)
            this.buildPillaredHall(server, originX, 64, 24, 6, 6, 6, pal, false);

            // West Wing: Corridor to Treasury Vault
            this.buildCorridorX(server, 24, 64, originX - 7, originX - 22, 4, pal, false);
            this.buildTreasuryVault(server, originX - 28, 64, 24, pal, sector, instanceId);

            // North Path: Corridor into Pillared Crypt Hall
            this.buildCorridorZ(server, originX, 64, 30, 44, 4, pal, false);
            this.buildPillaredHall(server, originX, 64, 50, 7, 7, 7, pal, false);
            this.spawnVanguardPack(server, originX, 65, 50, sector, instanceId, 'hall_combat');

            // Corridor to Mini-Boss Arena
            this.buildCorridorZ(server, originX, 64, 57, 70, 4, pal, false);
            let gateZ = 85;
            this.buildMiniBossChamber(server, originX, 64, 76, pal, sector, instanceId, originX, 64, gateZ);

            // Grand Descent Stairs from Y=64 to Y=46
            this.buildDescendingStaircase(server, originX, 64, 46, gateZ + 1, gateZ + 16, pal);

            // Abyssal Vault on lower floor (Y=46)
            let abyssZ = gateZ + 24;
            this.buildAbyssalVault(server, originX, 46, abyssZ, pal, sector, instanceId);

            // Corridor into Boss Sanctum
            this.buildCorridorZ(server, originX, 46, abyssZ + 7, abyssZ + 18, 4, pal, true);
            this.buildGrandBossSanctum(server, originX, 46, abyssZ + 30, pal, sector, instanceId);
        }
        // ======================================================================
        // LAYOUT 1: EAST WING & CHASM BRIDGE
        // ======================================================================
        else if (layout === 1) {
            // Crossroads at (0, 64, 24)
            this.buildPillaredHall(server, originX, 64, 24, 6, 6, 6, pal, false);

            // East Wing: Corridor to Treasury Vault
            this.buildCorridorX(server, 24, 64, originX + 7, originX + 22, 4, pal, false);
            this.buildTreasuryVault(server, originX + 28, 64, 24, pal, sector, instanceId);

            // North Path: Chasm Bridge over Lava/Void
            this.buildCorridorZ(server, originX, 64, 30, 40, 4, pal, false);
            this.buildChasmBridge(server, originX, 64, 49, pal, sector);
            this.spawnArcherSnipers(server, originX - 5, 66, 49, sector, instanceId);
            this.spawnArcherSnipers(server, originX + 5, 66, 49, sector, instanceId);

            // Corridor to Mini-Boss Arena
            this.buildCorridorZ(server, originX, 64, 58, 70, 4, pal, false);
            let gateZ = 85;
            this.buildMiniBossChamber(server, originX, 64, 76, pal, sector, instanceId, originX, 64, gateZ);

            // Descent Stairs to Y=46
            this.buildDescendingStaircase(server, originX, 64, 46, gateZ + 1, gateZ + 16, pal);

            // Abyssal Vault
            let abyssZ = gateZ + 24;
            this.buildAbyssalVault(server, originX, 46, abyssZ, pal, sector, instanceId);

            // Boss Sanctum
            this.buildCorridorZ(server, originX, 46, abyssZ + 7, abyssZ + 18, 4, pal, true);
            this.buildGrandBossSanctum(server, originX, 46, abyssZ + 30, pal, sector, instanceId);
        }
        // ======================================================================
        // LAYOUT 2: L-SHAPED FLANK GAUNTLET
        // ======================================================================
        else if (layout === 2) {
            // Hall 1 at (0, 64, 24)
            this.buildPillaredHall(server, originX, 64, 24, 7, 7, 6, pal, false);
            this.spawnVanguardPack(server, originX, 65, 24, sector, instanceId, 'combat_l');

            // Turn East: Corridor to Chasm Bridge
            this.buildCorridorX(server, 24, 64, originX + 7, originX + 22, 4, pal, false);
            this.buildChasmBridge(server, originX + 28, 64, 33, pal, sector);

            // Turn North: Corridor to Treasury Vault
            this.buildCorridorZ(server, originX + 28, 64, 42, 54, 4, pal, false);
            this.buildTreasuryVault(server, originX + 28, 64, 61, pal, sector, instanceId);

            // Turn West: Corridor to Mini-Boss Chamber
            this.buildCorridorX(server, 61, 64, originX + 21, originX + 7, 4, pal, false);
            let gateZ = 75;
            this.buildMiniBossChamber(server, originX, 64, 61, pal, sector, instanceId, originX, 64, gateZ);

            // Descent Stairs to Y=46
            this.buildDescendingStaircase(server, originX, 64, 46, gateZ + 1, gateZ + 16, pal);

            // Abyssal Vault
            let abyssZ = gateZ + 24;
            this.buildAbyssalVault(server, originX, 46, abyssZ, pal, sector, instanceId);

            // Boss Sanctum
            this.buildCorridorZ(server, originX, 46, abyssZ + 7, abyssZ + 18, 4, pal, true);
            this.buildGrandBossSanctum(server, originX, 46, abyssZ + 30, pal, sector, instanceId);
        }
        // ======================================================================
        // LAYOUT 3: DUAL FORK SANCTUM
        // ======================================================================
        else {
            // Grand Hall at (0, 64, 24)
            this.buildPillaredHall(server, originX, 64, 24, 7, 7, 7, pal, false);

            // Left Fork: Corridor to Treasury Crypt
            this.buildCorridorX(server, 24, 64, originX - 7, originX - 18, 4, pal, false);
            this.buildCorridorZ(server, originX - 18, 64, 24, 44, 4, pal, false);
            this.buildTreasuryVault(server, originX - 18, 64, 51, pal, sector, instanceId);

            // Right Fork: Corridor to Mini-Boss Arena
            this.buildCorridorX(server, 24, 64, originX + 7, originX + 18, 4, pal, false);
            this.buildCorridorZ(server, originX + 18, 64, 24, 44, 4, pal, false);
            let gateZ = 65;
            this.buildMiniBossChamber(server, originX + 18, 64, 51, pal, sector, instanceId, originX + 18, 64, gateZ);

            // Descent from Mini-Boss Gate down to Y=46
            this.buildDescendingStaircase(server, originX + 18, 64, 46, gateZ + 1, gateZ + 16, pal);

            // Turn back to Center axis at Y=46
            let lowerZ = gateZ + 22;
            this.buildCorridorX(server, lowerZ, 46, originX + 18, originX, 4, pal, true);

            // Abyssal Vault
            this.buildAbyssalVault(server, originX, 46, lowerZ, pal, sector, instanceId);

            // Boss Sanctum
            this.buildCorridorZ(server, originX, 46, lowerZ + 7, lowerZ + 18, 4, pal, true);
            this.buildGrandBossSanctum(server, originX, 46, lowerZ + 30, pal, sector, instanceId);
        }
    }
};

// ==============================================================================
// 13. ENTITY DEATH EVENT LISTENERS (PROGRESSION & VICTORY)
// ==============================================================================
EntityEvents.death(event => {
    let entity = event.entity;
    if (!entity) return;

    let tags = entity.tags;
    let instanceId = -1;

    tags.forEach(t => {
        if (t.startsWith('inst_')) {
            instanceId = parseInt(t.replace('inst_', ''));
        }
    });

    if (instanceId <= 0) return;
    let server = entity.server;

    // Mini-boss death: open portcullis gate
    if (tags.contains('dungeon_miniboss')) {
        ElyriumDungeonStitcher.unlockPortcullis(server, instanceId);
    }

    // Final boss death: spawn Triumph Portal and Victory Chest
    if (tags.contains('dungeon_boss')) {
        let pData = server.persistentData;
        let instTag = `inst_${instanceId}`;
        let instInfo = pData.getCompound(instTag);
        let bx = instInfo.getDouble('boss_throne_x');
        let by = instInfo.getDouble('boss_throne_y');
        let bz = instInfo.getDouble('boss_throne_z');
        let sector = instInfo.getInt('sector') || 1;

        // Spawn Victory Chest with authentic high-tier loot
        server.runCommandSilent(`execute in elyrium:dungeons run setblock ${bx} ${by} ${bz} minecraft:chest[facing=south]{CustomName:'{"text":"Сундук Победы Подземелья","color":"gold"}'}`);
        ElyriumDungeonStitcher.populateVictoryChest(server, bx, by, bz, sector, instanceId);

        // Spawn Golden Portal of Triumph
        server.runCommandSilent(`execute in elyrium:dungeons run summon interaction ${bx + 0.5} ${by} ${bz + 4.5} {width:2.0f,height:3.0f,Tags:["elyrium_triumph_portal","inst_${instanceId}"]}`);
        server.runCommandSilent(`execute in elyrium:dungeons run summon block_display ${bx + 0.5} ${by + 0.2} ${bz + 4.5} {block_state:{Name:"minecraft:gilded_blackstone"},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],scale:[1.8f,2.8f,0.2f],translation:[-0.9f,0.0f,-0.1f]},Tags:["elyrium_triumph_display","inst_${instanceId}"]}`);

        let level = server.getLevel('elyrium:dungeons');
        if (level) {
            level.players.forEach(p => {
                if (p.persistentData.getInt('elyrium_active_instance') === instanceId) {
                    p.playNotifySound('minecraft:ui.toast.challenge_complete', 'players', 1.0, 1.0);
                    p.displayClientMessage(Component.literal('§6👑 [ТРИУМФ] §fВладыка Недр повержен! Войдите в Золотой Портал для возвращения!'), false);
                }
            });
        }
    }
});

// ==============================================================================
// 14. ADMIN COMMANDS
// ==============================================================================
ServerEvents.commandRegistry(event => {
    let { commands: Commands, arguments: Arguments } = event;

    event.register(
        Commands.literal('dungeon_generate')
            .requires(s => s.hasPermission(2))
            .then(Commands.argument('sector', Arguments.INTEGER.create(event))
                .executes(ctx => {
                    let sector = Arguments.INTEGER.getResult(ctx, 'sector');
                    let player = ctx.source.player;
                    let server = ctx.source.server;

                    let pData = server.persistentData;
                    let nextId = (pData.getInt('elyrium_instance_counter') || 0) + 1;
                    pData.putInt('elyrium_instance_counter', nextId);

                    ElyriumDungeonStitcher.buildDungeon(server, nextId, sector);

                    if (player) {
                        player.displayClientMessage(Component.literal(`§a[DUNGEON] Мега-данж #${nextId} (Сектор ${sector}) сгенерирован! Вход: /dungeon_enter ${nextId}`), false);
                    }
                    return 1;
                })
            )
    );

    event.register(
        Commands.literal('dungeon_enter')
            .then(Commands.argument('id', Arguments.INTEGER.create(event))
                .executes(ctx => {
                    let id = Arguments.INTEGER.getResult(ctx, 'id');
                    let player = ctx.source.player;
                    if (!player) return 0;

                    let cellX = id * 1500;
                    player.persistentData.putDouble('elyrium_return_x', player.x);
                    player.persistentData.putDouble('elyrium_return_y', player.y);
                    player.persistentData.putDouble('elyrium_return_z', player.z);
                    player.persistentData.putString('elyrium_return_dim', String(player.level.dimension));
                    player.persistentData.putInt('elyrium_active_instance', id);

                    player.teleportTo('elyrium:dungeons', cellX + 0.5, 65.0, 0.5, 0, 0);
                    player.displayClientMessage(Component.literal(`§6⚔ [ПОДЗЕМЕЛЬЕ #${id}] §fВы вошли на стартовую площадку катакомб!`), true);
                    return 1;
                })
            )
    );
});
