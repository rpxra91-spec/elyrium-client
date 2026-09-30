// ==============================================================================
// 🏰 ELYRIUM RPG: MEGA-DUNGEON STRUCTURE INSTANCE ENGINE (v2.0)
// Dimension: elyrium:dungeons | Isolation Grid: X = ID * 1500, Z = 0
// ==============================================================================
// Generates full-scale native mod structures instead of manual block boxes:
// - Tier 1: 'betterdungeons:small_dungeon' / 'betterdungeons:zombie_dungeon'
// - Tier 2+: 'dungeons_arise:abandoned_temple' / 'cataclysm:abandoned_temple'
// - Safe Starter Entrance Pavilion at [X, 64, 0] with clear connecting hallways.
// - All mob packs, mini-bosses, and final bosses spawn in dedicated, wide-open
//   chambers with guaranteed solid flooring and cleared air space (no wall suffocation!).
// - Portcullis progression gate unlocks upon Mini-Boss defeat.
// - Victory Altar & Golden Triumph Rift spawn upon Final Boss defeat.
// ==============================================================================

const DUNGEON_PALETTES = {
    1: { // Overworld
        floor: 'minecraft:stone_bricks',
        wall: 'minecraft:stone_bricks',
        accent: 'minecraft:cracked_stone_bricks',
        pillar: 'minecraft:polished_andesite',
        light: 'minecraft:lantern',
        gate: 'minecraft:iron_bars',
        ceiling: 'minecraft:cobblestone'
    },
    2: { // Nether
        floor: 'minecraft:polished_blackstone',
        wall: 'minecraft:polished_blackstone_bricks',
        accent: 'minecraft:cracked_polished_blackstone_bricks',
        pillar: 'minecraft:gilded_blackstone',
        light: 'minecraft:soul_lantern',
        gate: 'minecraft:iron_bars',
        ceiling: 'minecraft:nether_bricks'
    },
    3: { // Aether
        floor: 'minecraft:smooth_sandstone',
        wall: 'minecraft:quartz_bricks',
        accent: 'minecraft:chiseled_quartz_block',
        pillar: 'minecraft:polished_diorite',
        light: 'minecraft:sea_lantern',
        gate: 'minecraft:iron_bars',
        ceiling: 'minecraft:smooth_quartz'
    },
    4: { // The End
        floor: 'minecraft:end_stone_bricks',
        wall: 'minecraft:purpur_block',
        accent: 'minecraft:purpur_pillar',
        pillar: 'minecraft:obsidian',
        light: 'minecraft:end_rod',
        gate: 'minecraft:iron_bars',
        ceiling: 'minecraft:end_stone'
    },
    5: { // Eternal Starlight
        floor: 'minecraft:prismarine_bricks',
        wall: 'minecraft:dark_prismarine',
        accent: 'minecraft:amethyst_block',
        pillar: 'minecraft:chiseled_stone_bricks',
        light: 'minecraft:sea_lantern',
        gate: 'minecraft:iron_bars',
        ceiling: 'minecraft:prismarine'
    },
    6: { // Deeper Darker
        floor: 'minecraft:deepslate_bricks',
        wall: 'minecraft:polished_deepslate',
        accent: 'minecraft:sculk',
        pillar: 'minecraft:reinforced_deepslate',
        light: 'minecraft:soul_lantern',
        gate: 'minecraft:iron_bars',
        ceiling: 'minecraft:cobbled_deepslate'
    },
    7: { // DivineRPG Eden
        floor: 'minecraft:smooth_sandstone',
        wall: 'minecraft:cut_sandstone',
        accent: 'minecraft:gold_block',
        pillar: 'minecraft:chiseled_sandstone',
        light: 'minecraft:glowstone',
        gate: 'minecraft:iron_bars',
        ceiling: 'minecraft:sandstone'
    },
    8: { // DivineRPG Mortum
        floor: 'minecraft:polished_blackstone',
        wall: 'minecraft:crying_obsidian',
        accent: 'minecraft:bone_block',
        pillar: 'minecraft:netherite_block',
        light: 'minecraft:soul_lantern',
        gate: 'minecraft:iron_bars',
        ceiling: 'minecraft:blackstone'
    }
};

const ElyriumDungeonStitcher = {
    getPalette: function(sector) {
        return DUNGEON_PALETTES[sector] || DUNGEON_PALETTES[1];
    },

    getStructureForSector: function(sector) {
        if (sector <= 1) {
            return { id: 'betterdungeons:small_dungeon', y: 56, zOffset: 12 };
        } else if (sector === 2) {
            return { id: 'betterdungeons:zombie_dungeon', y: 54, zOffset: 12 };
        } else if (sector === 3) {
            return { id: 'cataclysm:abandoned_temple', y: 60, zOffset: 16 };
        } else {
            return { id: 'dungeons_arise:abandoned_temple', y: 60, zOffset: 20 };
        }
    },

    // Ensures wide open space with solid multi-layer floor, 4 sealed walls, solid ceiling and lights (no void exposure)
    prepareOpenHall: function(server, cx, cy, cz, radiusXZ, heightY, pal) {
        let cmd = (commandStr) => {
            server.runCommandSilent(`execute in elyrium:dungeons run ${commandStr}`);
        };

        // 1. Deep solid subfloor foundation (so no void is ever visible under broken blocks)
        cmd(`fill ${cx - radiusXZ} ${cy - 3} ${cz - radiusXZ} ${cx + radiusXZ} ${cy - 1} ${cz + radiusXZ} ${pal.wall}`);

        // 2. Room floor
        cmd(`fill ${cx - radiusXZ} ${cy} ${cz - radiusXZ} ${cx + radiusXZ} ${cy} ${cz + radiusXZ} ${pal.floor}`);

        // 3. Sealed perimeter walls (North, South, West, East)
        cmd(`fill ${cx - radiusXZ} ${cy + 1} ${cz - radiusXZ} ${cx + radiusXZ} ${cy + heightY} ${cz - radiusXZ} ${pal.wall}`);
        cmd(`fill ${cx - radiusXZ} ${cy + 1} ${cz + radiusXZ} ${cx + radiusXZ} ${cy + heightY} ${cz + radiusXZ} ${pal.wall}`);
        cmd(`fill ${cx - radiusXZ} ${cy + 1} ${cz - radiusXZ} ${cx - radiusXZ} ${cy + heightY} ${cz + radiusXZ} ${pal.wall}`);
        cmd(`fill ${cx + radiusXZ} ${cy + 1} ${cz - radiusXZ} ${cx + radiusXZ} ${cy + heightY} ${cz + radiusXZ} ${pal.wall}`);

        // 4. Solid ceiling enclosing the room from above
        cmd(`fill ${cx - radiusXZ} ${cy + heightY} ${cz - radiusXZ} ${cx + radiusXZ} ${cy + heightY} ${cz + radiusXZ} ${pal.ceiling}`);

        // 5. Clear interior room air volume
        let innerR = Math.max(1, radiusXZ - 1);
        cmd(`fill ${cx - innerR} ${cy + 1} ${cz - innerR} ${cx + innerR} ${cy + heightY - 1} ${cz + innerR} minecraft:air`);

        // 6. Carve North and South connecting arch doorways (aligned with 5-wide corridors)
        cmd(`fill ${cx - 2} ${cy + 1} ${cz - radiusXZ} ${cx + 2} ${cy + 4} ${cz - radiusXZ} minecraft:air`);
        cmd(`fill ${cx - 2} ${cy + 1} ${cz + radiusXZ} ${cx + 2} ${cy + 4} ${cz + radiusXZ} minecraft:air`);

        // 7. Corner Light Pillars & Wall Torches
        cmd(`setblock ${cx - radiusXZ + 1} ${cy + 1} ${cz - radiusXZ + 1} ${pal.pillar}`);
        cmd(`setblock ${cx - radiusXZ + 1} ${cy + 2} ${cz - radiusXZ + 1} ${pal.light}`);
        cmd(`setblock ${cx + radiusXZ - 1} ${cy + 1} ${cz - radiusXZ + 1} ${pal.pillar}`);
        cmd(`setblock ${cx + radiusXZ - 1} ${cy + 2} ${cz - radiusXZ + 1} ${pal.light}`);
        cmd(`setblock ${cx - radiusXZ + 1} ${cy + 1} ${cz + radiusXZ - 1} ${pal.pillar}`);
        cmd(`setblock ${cx - radiusXZ + 1} ${cy + 2} ${cz + radiusXZ - 1} ${pal.light}`);
        cmd(`setblock ${cx + radiusXZ - 1} ${cy + 1} ${cz + radiusXZ - 1} ${pal.pillar}`);
        cmd(`setblock ${cx + radiusXZ - 1} ${cy + 2} ${cz + radiusXZ - 1} ${pal.light}`);

        // 8. Remove stray jigsaw / structure blocks
        cmd(`fill ${cx - radiusXZ - 2} ${cy} ${cz - radiusXZ - 2} ${cx + radiusXZ + 2} ${cy + heightY + 2} ${cz + radiusXZ + 2} minecraft:air replace minecraft:jigsaw`);
        cmd(`fill ${cx - radiusXZ - 2} ${cy} ${cz - radiusXZ - 2} ${cx + radiusXZ + 2} ${cy + heightY + 2} ${cz + radiusXZ + 2} minecraft:air replace minecraft:structure_block`);
    },

    // Build the Dungeon instance using native mod structures and robust protective hull
    buildDungeon: function(server, instanceId, sector) {
        let pal = this.getPalette(sector);
        let structInfo = this.getStructureForSector(sector);
        let originX = instanceId * 1500;
        let originY = 64;
        let originZ = 0;

        let cmd = (commandStr) => {
            server.runCommandSilent(`execute in elyrium:dungeons run ${commandStr}`);
        };

        // 1. Force load dungeon chunk area (safe radius under 256 chunk limit)
        cmd(`forceload add ${originX - 96} -96 ${originX + 96} 96`);

        console.log(`[ELYRIUM] Mega-Dungeon Structure #${instanceId} (${structInfo.id}) generating at ${originX}, ${originY}, ${originZ}`);

        // 2. MONOLITHIC PROTECTIVE SUB-FOUNDATION SLAB (Enclosing entire dungeon from below)
        cmd(`fill ${originX - 16} 38 -8 ${originX + 16} 47 124 ${pal.wall}`);

        // 3. Build Safe Starter Entrance Pavilion at [originX, 64, 0]
        cmd(`fill ${originX - 4} 61 -4 ${originX + 4} 63 4 ${pal.wall}`); // Subfloor
        cmd(`fill ${originX - 4} 64 -4 ${originX + 4} 64 4 ${pal.floor}`);
        cmd(`fill ${originX - 4} 65 -4 ${originX + 4} 69 4 minecraft:air`);
        cmd(`fill ${originX - 4} 70 -4 ${originX + 4} 70 4 ${pal.ceiling}`);

        // Side walls and decorative pillars
        cmd(`fill ${originX - 4} 65 -4 ${originX - 4} 69 4 ${pal.wall}`);
        cmd(`fill ${originX + 4} 65 -4 ${originX + 4} 69 4 ${pal.wall}`);
        cmd(`fill ${originX - 4} 65 -4 ${originX + 4} 69 -4 ${pal.wall}`); // Back wall

        // Corner Light Pillars
        cmd(`setblock ${originX - 3} 65 -3 ${pal.pillar}`);
        cmd(`setblock ${originX - 3} 66 -3 ${pal.light}`);
        cmd(`setblock ${originX + 3} 65 -3 ${pal.pillar}`);
        cmd(`setblock ${originX + 3} 66 -3 ${pal.light}`);
        cmd(`setblock ${originX - 3} 65 3 ${pal.pillar}`);
        cmd(`setblock ${originX - 3} 66 3 ${pal.light}`);
        cmd(`setblock ${originX + 3} 65 3 ${pal.pillar}`);
        cmd(`setblock ${originX + 3} 66 3 ${pal.light}`);

        // 4. Monolithic Base Platform for Structures (Prevents placement failure in void)
        cmd(`fill ${originX - 16} ${structInfo.y - 2} ${originZ + structInfo.zOffset - 4} ${originX + 16} ${structInfo.y} ${originZ + structInfo.zOffset + 36} ${pal.floor}`);

        // 5. Invoke Native Mod Structure Generation via /place structure
        cmd(`place structure ${structInfo.id} ${originX} ${structInfo.y} ${originZ + structInfo.zOffset}`);

        // 6. Robust Native Dungeon Props / Templates for authentic decoration
        if (sector <= 1) {
            cmd(`place template betterdungeons:small_dungeon/shells/small_shell_7x7 ${originX - 3} ${structInfo.y + 1} ${originZ + structInfo.zOffset + 6} none none 1.0`);
            cmd(`place template betterdungeons:zombie_dungeon/tombstone/tombstone_chest_open_0 ${originX - 4} 65 24 none none 1.0`);
            cmd(`place template betterdungeons:zombie_dungeon/tombstone/tombstone_spawner_open_0 ${originX + 3} 65 24 none none 1.0`);
        }

        // Clean any stray jigsaw / structure blocks in proximity
        cmd(`fill ${originX - 64} 30 -32 ${originX + 64} 90 128 minecraft:air replace minecraft:jigsaw`);
        cmd(`fill ${originX - 64} 30 -32 ${originX + 64} 90 128 minecraft:air replace minecraft:structure_block`);

        // 7. Open Hall 1: Elite Combat Pack (Upper Catacombs, radius 5, Z=28)
        let hall1Z = originZ + 28;
        this.prepareOpenHall(server, originX, 64, hall1Z, 5, 5, pal);
        this.spawnElitePack(server, originX, 65, hall1Z, sector, instanceId, 'combat_1');

        // Corridor 1: Starter Pavilion (Z=4) into Hall 1 (Z=23)
        cmd(`fill ${originX - 3} 61 4 ${originX + 3} 63 ${hall1Z - 5} ${pal.wall}`); // Subfloor
        cmd(`fill ${originX - 2} 64 4 ${originX + 2} 64 ${hall1Z - 5} ${pal.floor}`);
        cmd(`fill ${originX - 2} 65 4 ${originX + 2} 68 ${hall1Z - 5} minecraft:air`);
        cmd(`fill ${originX - 3} 65 4 ${originX - 3} 68 ${hall1Z - 5} ${pal.wall}`);
        cmd(`fill ${originX + 3} 65 4 ${originX + 3} 68 ${hall1Z - 5} ${pal.wall}`);
        cmd(`fill ${originX - 3} 69 4 ${originX + 3} 69 ${hall1Z - 5} ${pal.ceiling}`);
        cmd(`setblock ${originX - 2} 67 10 ${pal.light}`);
        cmd(`setblock ${originX + 2} 67 10 ${pal.light}`);
        cmd(`setblock ${originX - 2} 67 18 ${pal.light}`);
        cmd(`setblock ${originX + 2} 67 18 ${pal.light}`);

        // 8. Open Hall 2: Mini-Boss Chamber & Treasury (radius 6, Z=54, Y=60)
        let miniBossZ = originZ + 54;
        let miniBossY = 60;
        this.prepareOpenHall(server, originX, miniBossY, miniBossZ, 6, 6, pal);
        this.spawnMiniBoss(server, originX, miniBossY + 1, miniBossZ, sector, instanceId);

        // Native props in Hall 2
        if (sector <= 1) {
            cmd(`place template betterdungeons:zombie_dungeon/cubby/cubby_double_0 ${originX - 5} ${miniBossY + 1} ${miniBossZ - 3} none none 1.0`);
            cmd(`place template betterdungeons:zombie_dungeon/cubby/cubby_double_0 ${originX + 2} ${miniBossY + 1} ${miniBossZ - 3} 180_clockwise none 1.0`);
        }

        // Treasury Chest in Mini-Boss chamber
        cmd(`setblock ${originX + 4} ${miniBossY + 1} ${miniBossZ} minecraft:chest[facing=west]{CustomName:'{"text":"Сокровищница Подземелья","color":"gold"}'}`);

        // Corridor 2: Hall 1 (Z=33, Y=64) to Hall 2 (Z=48, Y=60) descending ramp
        for (let cz = 34; cz <= 48; cz++) {
            let cy = 64 - Math.floor((cz - 33) * 4 / 15);
            cmd(`fill ${originX - 3} ${cy - 3} ${cz} ${originX + 3} ${cy} ${cz} ${pal.floor}`);
            cmd(`fill ${originX - 2} ${cy + 1} ${cz} ${originX + 2} ${cy + 4} ${cz} minecraft:air`);
            cmd(`fill ${originX - 3} ${cy + 1} ${cz} ${originX - 3} ${cy + 4} ${cz} ${pal.wall}`);
            cmd(`fill ${originX + 3} ${cy + 1} ${cz} ${originX + 3} ${cy + 4} ${cz} ${pal.wall}`);
            cmd(`fill ${originX - 3} ${cy + 5} ${cz} ${originX + 3} ${cy + 5} ${cz} ${pal.ceiling}`);
            if (cz % 4 === 0) {
                cmd(`setblock ${originX - 2} ${cy + 3} ${cz} ${pal.light}`);
                cmd(`setblock ${originX + 2} ${cy + 3} ${cz} ${pal.light}`);
            }
        }

        // 9. Gated Portcullis (Locked until Mini-Boss killed) at Z = miniBossZ + 8
        let gateZ = miniBossZ + 8;
        cmd(`fill ${originX - 2} ${miniBossY + 1} ${gateZ} ${originX + 2} ${miniBossY + 4} ${gateZ} ${pal.gate}`);

        // 10. Open Hall 3: Deep Abyss Guards (Lower Floor, radius 6, Z=80, Y=50)
        let abyssZ = gateZ + 18;
        let abyssY = 50;
        this.prepareOpenHall(server, originX, abyssY, abyssZ, 6, 6, pal);
        this.spawnAbyssGuards(server, originX, abyssY + 1, abyssZ, sector, instanceId);

        // Corridor 3: Gate (Z=63, Y=60) to Hall 3 (Z=74, Y=50) grand descending stairs
        for (let cz = 63; cz <= 74; cz++) {
            let cy = 60 - Math.min(10, cz - 62);
            cmd(`fill ${originX - 3} ${cy - 3} ${cz} ${originX + 3} ${cy} ${cz} ${pal.floor}`);
            cmd(`fill ${originX - 2} ${cy + 1} ${cz} ${originX + 2} ${cy + 4} ${cz} minecraft:air`);
            cmd(`fill ${originX - 3} ${cy + 1} ${cz} ${originX - 3} ${cy + 4} ${cz} ${pal.wall}`);
            cmd(`fill ${originX + 3} ${cy + 1} ${cz} ${originX + 3} ${cy + 4} ${cz} ${pal.wall}`);
            cmd(`fill ${originX - 3} ${cy + 5} ${cz} ${originX + 3} ${cy + 5} ${cz} ${pal.ceiling}`);
            if (cz % 3 === 0) {
                cmd(`setblock ${originX - 2} ${cy + 3} ${cz} ${pal.light}`);
                cmd(`setblock ${originX + 2} ${cy + 3} ${cz} ${pal.light}`);
            }
        }

        // 11. Open Hall 4: Grand Boss Throne Dais (radius 8, Z=104, Y=48)
        let bossZ = abyssZ + 24;
        let bossY = 48;
        this.prepareOpenHall(server, originX, bossY, bossZ, 8, 8, pal);
        this.spawnFinalBoss(server, originX, bossY + 1, bossZ, sector, instanceId);

        // Corridor 4: Hall 3 (Z=86, Y=50) to Hall 4 (Z=96, Y=48)
        for (let cz = 87; cz <= 96; cz++) {
            let cy = (cz <= 91) ? 49 : 48;
            cmd(`fill ${originX - 3} ${cy - 3} ${cz} ${originX + 3} ${cy} ${cz} ${pal.floor}`);
            cmd(`fill ${originX - 2} ${cy + 1} ${cz} ${originX + 2} ${cy + 4} ${cz} minecraft:air`);
            cmd(`fill ${originX - 3} ${cy + 1} ${cz} ${originX - 3} ${cy + 4} ${cz} ${pal.wall}`);
            cmd(`fill ${originX + 3} ${cy + 1} ${cz} ${originX + 3} ${cy + 4} ${cz} ${pal.wall}`);
            cmd(`fill ${originX - 3} ${cy + 5} ${cz} ${originX + 3} ${cy + 5} ${cz} ${pal.ceiling}`);
            if (cz % 3 === 0) {
                cmd(`setblock ${originX - 2} ${cy + 3} ${cz} ${pal.light}`);
                cmd(`setblock ${originX + 2} ${cy + 3} ${cz} ${pal.light}`);
            }
        }

        // Register Portcullis & Boss Coordinates in persistentData
        let pData = server.persistentData;
        let instTag = `inst_${instanceId}`;
        let instInfo = pData.getCompound(instTag);
        instInfo.putDouble('gate_x', originX);
        instInfo.putDouble('gate_y', miniBossY);
        instInfo.putDouble('gate_z', gateZ);
        instInfo.putDouble('boss_throne_x', originX);
        instInfo.putDouble('boss_throne_y', bossY);
        instInfo.putDouble('boss_throne_z', bossZ);
        pData.put(instTag, instInfo);
    },

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

    spawnElitePack: function(server, x, y, z, sector, instanceId, packName) {
        let mobType = sector >= 4 ? 'minecraft:wither_skeleton' : (sector >= 2 ? 'minecraft:stray' : 'minecraft:zombie');
        for (let i = 0; i < 4; i++) {
            let ox = (i % 2 === 0 ? 2 : -2);
            let oz = (i < 2 ? 2 : -2);
            server.runCommandSilent(`execute in elyrium:dungeons run summon ${mobType} ${x + ox} ${y} ${z + oz} {Tags:["inst_${instanceId}","dungeon_elite","${packName}"],CustomName:'{"text":"Элитный Страж Зала","color":"red"}'}`);
        }
    },

    spawnMiniBoss: function(server, x, y, z, sector, instanceId) {
        let bossType = sector >= 4 ? 'minecraft:piglin_brute' : (sector >= 2 ? 'minecraft:wither_skeleton' : 'minecraft:vindicator');
        server.runCommandSilent(`execute in elyrium:dungeons run summon ${bossType} ${x} ${y} ${z} {Tags:["inst_${instanceId}","dungeon_miniboss"],CustomName:'{"text":"Хранитель Катакомб [Мини-Босс]","color":"gold","bold":true}'}`);
    },

    spawnAbyssGuards: function(server, x, y, z, sector, instanceId) {
        let mobType = sector >= 6 ? 'minecraft:enderman' : (sector >= 3 ? 'minecraft:wither_skeleton' : 'minecraft:piglin_brute');
        server.runCommandSilent(`execute in elyrium:dungeons run summon ${mobType} ${x - 3} ${y} ${z} {Tags:["inst_${instanceId}","dungeon_abyss_guard"],CustomName:'{"text":"Страж Бездны","color":"dark_purple"}'}`);
        server.runCommandSilent(`execute in elyrium:dungeons run summon ${mobType} ${x + 3} ${y} ${z} {Tags:["inst_${instanceId}","dungeon_abyss_guard"],CustomName:'{"text":"Страж Бездны","color":"dark_purple"}'}`);
    },

    spawnFinalBoss: function(server, x, y, z, sector, instanceId) {
        let bossType = sector >= 6 ? 'minecraft:warden' : (sector >= 4 ? 'minecraft:elder_guardian' : (sector >= 2 ? 'minecraft:wither_skeleton' : 'minecraft:piglin_brute'));
        server.runCommandSilent(`execute in elyrium:dungeons run summon ${bossType} ${x} ${y} ${z} {Tags:["inst_${instanceId}","dungeon_boss"],CustomName:'{"text":"Владыка Недр Подземелья","color":"dark_red","bold":true}'}`);
    }
};

// Listen for Mini-Boss & Final Boss death
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

        // Spawn Victory Chest with loot
        server.runCommandSilent(`execute in elyrium:dungeons run setblock ${bx} ${by + 1} ${bz} minecraft:chest[facing=south]{CustomName:'{"text":"Сундук Победы Подземелья","color":"gold"}'}`);

        // Spawn Golden Portal of Triumph
        server.runCommandSilent(`execute in elyrium:dungeons run summon interaction ${bx + 0.5} ${by + 1} ${bz + 4.5} {width:2.0f,height:3.0f,Tags:["elyrium_triumph_portal","inst_${instanceId}"]}`);
        server.runCommandSilent(`execute in elyrium:dungeons run summon block_display ${bx + 0.5} ${by + 1.2} ${bz + 4.5} {block_state:{Name:"minecraft:gilded_blackstone"},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],scale:[1.8f,2.8f,0.2f],translation:[-0.9f,0.0f,-0.1f]},Tags:["elyrium_triumph_display","inst_${instanceId}"]}`);

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

// Admin command: /dungeon_generate <sectorId>
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

// Export to global scope for cross-script access in KubeJS
global.ElyriumDungeonStitcher = ElyriumDungeonStitcher;
