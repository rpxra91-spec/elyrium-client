// ==============================================================================
// 🏰 ELYRIUM RPG: 2-TIER PROCEDURAL DUNGEON ROOM STITCHER
// Dimension: elyrium:dungeons | Isolation Grid: X = ID * 1500, Z = 0
// ==============================================================================
// - Tier I (Y = 64): Entry Hall -> Combat Chambers -> Treasury Wing -> Mini-Boss.
// - Locked Portcullis Gates opening on Mini-Boss death with chain SFX.
// - Descent Spiral Shaft connecting Y = 64 to Y = 32.
// - Tier II (Y = 32): Abyss Guardian Hall -> Grand Boss Throne Room -> Victory Altar.
// - 8 Dynamic Sector Palettes matching Overworld -> DivineRPG Mortum tiers.
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

const DUNGEON_PREFABS = {
    // Modular pre-built structure templates from YungsBetterStrongholds & YungsBetterDungeons
    1: { // Overworld Catacombs
        entry: 'betterstrongholds:starts/junction_lg',
        hallway: 'betterstrongholds:hallways/hallway_4',
        combat1: 'betterstrongholds:rooms/armoury_md',
        treasury: 'betterstrongholds:rooms/treasure_room_lg',
        miniboss: 'betterstrongholds:rooms/library_md',
        stairs: 'betterstrongholds:stairs/spiral_stairs_2floor_0',
        depths: 'betterstrongholds:rooms/prison_lg',
        boss_throne: 'betterstrongholds:portal_rooms/portal_room'
    }
};

const ElyriumDungeonStitcher = {
    getPalette: function(sector) {
        return DUNGEON_PALETTES[sector] || DUNGEON_PALETTES[1];
    },

    getPrefabs: function(sector) {
        return DUNGEON_PREFABS[sector] || DUNGEON_PREFABS[1];
    },

    // Place high-detail NBT structure template
    placeTemplate: function(server, templateId, x, y, z, rotation) {
        let rot = rotation || 'none';
        server.runCommandSilent(`execute in elyrium:dungeons run place template ${templateId} ${x} ${y} ${z} ${rot}`);
        // Clean up developer jigsaw blocks from placed templates so they don't spoil aesthetics
        server.runCommandSilent(`execute in elyrium:dungeons run fill ${x - 1} ${y} ${z - 1} ${x + 36} ${y + 26} ${z + 45} minecraft:air replace minecraft:jigsaw`);
    },

    // Build straight corridor
    buildCorridorZ: function(server, x, y, minZ, maxZ, width, height, pal) {
        let cmd = (commandStr) => {
            server.runCommandSilent(`execute in elyrium:dungeons run ${commandStr}`);
        };
        let halfW = Math.floor(width / 2);
        cmd(`fill ${x - halfW} ${y} ${minZ} ${x + halfW} ${y} ${maxZ} ${pal.floor}`);
        cmd(`fill ${x - halfW} ${y + height} ${minZ} ${x + halfW} ${y + height} ${maxZ} ${pal.ceiling}`);
        cmd(`fill ${x - halfW} ${y + 1} ${minZ} ${x - halfW} ${y + height - 1} ${maxZ} ${pal.wall}`);
        cmd(`fill ${x + halfW} ${y + 1} ${minZ} ${x + halfW} ${y + height - 1} ${maxZ} ${pal.wall}`);
        cmd(`fill ${x - halfW + 1} ${y + 1} ${minZ} ${x + halfW - 1} ${y + height - 1} ${maxZ} minecraft:air`);
    },

    buildCorridorX: function(server, minX, maxX, y, z, width, height, pal) {
        let cmd = (commandStr) => {
            server.runCommandSilent(`execute in elyrium:dungeons run ${commandStr}`);
        };
        let halfW = Math.floor(width / 2);
        cmd(`fill ${minX} ${y} ${z - halfW} ${maxX} ${y} ${z + halfW} ${pal.floor}`);
        cmd(`fill ${minX} ${y + height} ${z - halfW} ${maxX} ${y + height} ${z + halfW} ${pal.ceiling}`);
        cmd(`fill ${minX} ${y + 1} ${z - halfW} ${maxX} ${y + height - 1} ${z - halfW} ${pal.wall}`);
        cmd(`fill ${minX} ${y + 1} ${z + halfW} ${maxX} ${y + height - 1} ${z + halfW} ${pal.wall}`);
        cmd(`fill ${minX} ${y + 1} ${z - halfW + 1} ${maxX} ${y + height - 1} ${z + halfW - 1} minecraft:air`);
    },

    // Main 2-tier Dungeon Generator using pre-built structure templates
    buildDungeon: function(server, instanceId, sector) {
        let pal = this.getPalette(sector);
        let prefabs = this.getPrefabs(sector);
        let originX = instanceId * 1500;
        let originY = 64;
        let originZ = 0;
        let cmd = (commandStr) => {
            server.runCommandSilent(`execute in elyrium:dungeons run ${commandStr}`);
        };

        // 1. Force load dungeon chunks so /place template commands succeed reliably
        cmd(`forceload add ${originX - 32} -32 ${originX + 32} 160`);

        // 2. Solid safety foundation at spawn cell
        cmd(`fill ${originX - 4} ${originY} ${originZ - 12} ${originX + 4} ${originY} ${originZ - 6} ${pal.floor}`);

        console.log(`[ELYRIUM] Prefab Structure Dungeon #${instanceId} (Sector ${sector}) generating at ${originX}, ${originY}, ${originZ}`);

        // =========================================================================
        // TIER I: UPPER HALLS (Y = 64) - PREFAB STRUCTURES
        // =========================================================================

        // 1. Entry Hall: Grand Multi-Tier Junction (31x24x31)
        this.placeTemplate(server, prefabs.entry, originX - 15, originY, originZ - 15);
        this.placeTemplate(server, 'betterstrongholds:statues/statue_sword', originX - 4, originY + 1, originZ + 5);
        this.placeTemplate(server, 'betterstrongholds:statues/statue_sword', originX + 2, originY + 1, originZ + 5);

        // 2. Corridor 1 (Prefab Stronghold Hallways)
        this.placeTemplate(server, prefabs.hallway, originX - 2, originY, originZ + 16);
        this.placeTemplate(server, prefabs.hallway, originX - 2, originY, originZ + 21);
        cmd(`fill ${originX - 1} ${originY + 1} ${originZ + 15} ${originX + 1} ${originY + 3} ${originZ + 16} minecraft:air`);

        // 3. Combat Chamber 1: High-Detail Armoury Hall (13x8x13)
        // North door is at relative [10, 1, 0] -> aligns with originX
        this.placeTemplate(server, prefabs.combat1, originX - 10, originY, originZ + 26);
        cmd(`fill ${originX - 1} ${originY + 1} ${originZ + 25} ${originX + 1} ${originY + 3} ${originZ + 27} minecraft:air`);
        cmd(`fill ${originX - 1} ${originY + 1} ${originZ + 38} ${originX + 1} ${originY + 3} ${originZ + 39} minecraft:air`);
        // Spawners / Elite Mobs in Armoury
        this.spawnElitePack(server, originX, originY + 1, originZ + 32, sector, instanceId, 'combat_1');

        // 4. T-Junction Corridor with East Branch to Treasury
        this.placeTemplate(server, prefabs.hallway, originX - 2, originY, originZ + 39);

        // Side Treasury Wing: Grand Vaulted Treasure Room (19x16x19)
        this.buildCorridorX(server, originX + 2, originX + 12, originY, originZ + 41, 3, 3, pal);
        this.placeTemplate(server, prefabs.treasury, originX + 12, originY - 8, originZ + 31);
        cmd(`fill ${originX + 11} ${originY + 1} ${originZ + 40} ${originX + 13} ${originY + 3} ${originZ + 42} minecraft:air`);
        // Treasury Chest
        cmd(`setblock ${originX + 21} ${originY + 1} ${originZ + 41} minecraft:chest[facing=west]{CustomName:'{"text":"Сокровищница Подземелья","color":"gold"}'}`);

        // 5. Mini-Boss Chamber: Grand Library Hall (17x8x25)
        // North door is at relative [9, 1, 0] -> aligns with originX
        this.placeTemplate(server, prefabs.miniboss, originX - 9, originY, originZ + 44);
        cmd(`fill ${originX - 1} ${originY + 1} ${originZ + 43} ${originX + 1} ${originY + 3} ${originZ + 45} minecraft:air`);
        cmd(`fill ${originX - 1} ${originY + 1} ${originZ + 68} ${originX + 1} ${originY + 3} ${originZ + 71} minecraft:air`);
        // Mini-Boss Spawn
        this.spawnMiniBoss(server, originX, originY + 1, originZ + 56, sector, instanceId);

        // 6. Gated Portcullis (Locked until Mini-Boss killed) at Z = +71
        cmd(`fill ${originX - 2} ${originY + 1} ${originZ + 71} ${originX + 2} ${originY + 4} ${originZ + 71} ${pal.gate}`);

        // =========================================================================
        // VERTICAL DESCENT SHAFT (Y = 64 down to Y = 32)
        // =========================================================================
        let shaftZ = originZ + 73;
        // Corridor from gate to shaft
        this.buildCorridorZ(server, originX, originY, originZ + 71, shaftZ, 3, 3, pal);

        // Fortified descent shaft tower (Y=64 down to Y=32)
        cmd(`fill ${originX - 3} 32 ${shaftZ} ${originX + 3} 68 ${shaftZ + 8} ${pal.wall}`);
        cmd(`fill ${originX - 2} 33 ${shaftZ + 1} ${originX + 2} 67 ${shaftZ + 7} minecraft:air`);
        cmd(`fill ${originX - 2} 32 ${shaftZ + 1} ${originX + 2} 32 ${shaftZ + 7} ${pal.floor}`);
        cmd(`fill ${originX - 2} 68 ${shaftZ + 1} ${originX + 2} 68 ${shaftZ + 7} ${pal.ceiling}`);

        // Decorative stairs and landing platforms winding down
        for (let dy = 0; dy < 32; dy++) {
            let curY = 64 - dy;
            let stepPos = dy % 4;
            if (stepPos === 0) {
                cmd(`fill ${originX - 2} ${curY} ${shaftZ + 1} ${originX - 1} ${curY} ${shaftZ + 2} ${pal.pillar}`);
            } else if (stepPos === 1) {
                cmd(`fill ${originX + 1} ${curY} ${shaftZ + 1} ${originX + 2} ${curY} ${shaftZ + 2} ${pal.pillar}`);
            } else if (stepPos === 2) {
                cmd(`fill ${originX + 1} ${curY} ${shaftZ + 6} ${originX + 2} ${curY} ${shaftZ + 7} ${pal.pillar}`);
            } else {
                cmd(`fill ${originX - 2} ${curY} ${shaftZ + 6} ${originX - 1} ${curY} ${shaftZ + 7} ${pal.pillar}`);
            }
        }
        // Safe water drop cushion in the center and climb ladders
        cmd(`fill ${originX - 1} 33 ${shaftZ + 3} ${originX + 1} 33 ${shaftZ + 5} minecraft:water`);
        cmd(`fill ${originX} 33 ${shaftZ + 1} ${originX} 64 ${shaftZ + 1} minecraft:ladder[facing=south]`);
        cmd(`setblock ${originX} 35 ${shaftZ + 4} ${pal.light}`);
        cmd(`setblock ${originX} 50 ${shaftZ + 4} ${pal.light}`);

        // =========================================================================
        // TIER II: THE DEPTHS & BOSS THRONE ROOM (Y = 32) - PREFAB STRUCTURES
        // =========================================================================
        let lowerY = 32;
        let prisonZ = shaftZ + 9;
        // Corridor from shaft to Prison
        this.buildCorridorZ(server, originX, lowerY, shaftZ + 7, prisonZ, 3, 3, pal);

        // 7. Abyss Guardian Hall: Dungeon Prison Complex (19x8x19)
        // North door is at relative [10, 1, 0] -> aligns with originX
        // South door is at relative [8, 1, 18] -> at originX - 2
        this.placeTemplate(server, prefabs.depths, originX - 10, lowerY, prisonZ);
        cmd(`fill ${originX - 1} ${lowerY + 1} ${prisonZ} ${originX + 1} ${lowerY + 3} ${prisonZ + 1} minecraft:air`);

        // Spawn Abyss Guards
        this.spawnAbyssGuards(server, originX, lowerY + 1, prisonZ + 9, sector, instanceId);

        // Exit from Prison South door (at originX - 2) to Boss Throne Room
        let bossCorridorZ = prisonZ + 19;
        this.buildCorridorZ(server, originX - 2, lowerY, prisonZ + 18, bossCorridorZ + 4, 3, 3, pal);

        // 8. Grand Boss Throne Room: Portal Chamber (25x14x19)
        let bossZ = bossCorridorZ + 4;
        this.placeTemplate(server, prefabs.boss_throne, originX - 14, lowerY, bossZ);
        cmd(`fill ${originX - 3} ${lowerY + 1} ${bossZ - 1} ${originX - 1} ${lowerY + 4} ${bossZ + 2} minecraft:air`);

        // Spawn Final Boss on the Central Dais
        this.spawnFinalBoss(server, originX - 2, lowerY + 2, bossZ + 10, sector, instanceId);

        // Register Portcullis & Boss Coordinates in persistentData
        let pData = server.persistentData;
        let instTag = `inst_${instanceId}`;
        let instInfo = pData.getCompound(instTag);
        instInfo.putDouble('gate_x', originX);
        instInfo.putDouble('gate_y', originY);
        instInfo.putDouble('gate_z', originZ + 71);
        instInfo.putDouble('boss_throne_x', originX - 2);
        instInfo.putDouble('boss_throne_y', lowerY);
        instInfo.putDouble('boss_throne_z', bossZ + 10);
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
        let bossType = sector >= 4 ? 'minecraft:piglin_brute' : (sector >= 2 ? 'minecraft:wither_skeleton' : 'minecraft:iron_golem');
        server.runCommandSilent(`execute in elyrium:dungeons run summon ${bossType} ${x} ${y} ${z} {Tags:["inst_${instanceId}","dungeon_miniboss"],CustomName:'{"text":"Хранитель Катакомб [Мини-Босс]","color":"gold","bold":true}'}`);
    },

    spawnAbyssGuards: function(server, x, y, z, sector, instanceId) {
        let mobType = sector >= 6 ? 'minecraft:enderman' : (sector >= 3 ? 'minecraft:wither_skeleton' : 'minecraft:piglin_brute');
        server.runCommandSilent(`execute in elyrium:dungeons run summon ${mobType} ${x - 3} ${y} ${z} {Tags:["inst_${instanceId}","dungeon_abyss_guard"],CustomName:'{"text":"Страж Бездны","color":"dark_purple"}'}`);
        server.runCommandSilent(`execute in elyrium:dungeons run summon ${mobType} ${x + 3} ${y} ${z} {Tags:["inst_${instanceId}","dungeon_abyss_guard"],CustomName:'{"text":"Страж Бездны","color":"dark_purple"}'}`);
    },

    spawnFinalBoss: function(server, x, y, z, sector, instanceId) {
        let bossType = sector >= 6 ? 'minecraft:warden' : (sector >= 4 ? 'minecraft:elder_guardian' : (sector >= 2 ? 'minecraft:wither_skeleton' : 'minecraft:iron_golem'));
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
                        player.displayClientMessage(Component.literal(`§a[DUNGEON] Инстанс #${nextId} (Сектор ${sector}) сгенерирован! Вход: /dungeon_enter ${nextId}`), false);
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

                    player.teleportTo('elyrium:dungeons', cellX + 0.5, 65.0, -9.0, 0, 0);
                    player.displayClientMessage(Component.literal(`§6⚔ [ПОДЗЕМЕЛЬЕ #${id}] §fВы вошли в верхний чертог!`), true);
                    return 1;
                })
            )
    );
});

// Export to global scope for cross-script access in KubeJS
global.ElyriumDungeonStitcher = ElyriumDungeonStitcher;

