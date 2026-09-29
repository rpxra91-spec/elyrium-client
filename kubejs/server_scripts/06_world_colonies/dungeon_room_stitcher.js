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

const ElyriumDungeonStitcher = {
    getPalette: function(sector) {
        return DUNGEON_PALETTES[sector] || DUNGEON_PALETTES[1];
    },

    // Build hollow box (room)
    buildRoom: function(server, minX, minY, minZ, maxX, maxY, maxZ, pal) {
        let cmd = (commandStr) => {
            server.runCommandSilent(`execute in elyrium:dungeons run ${commandStr}`);
        };
        // Floor
        cmd(`fill ${minX} ${minY} ${minZ} ${maxX} ${minY} ${maxZ} ${pal.floor}`);
        // Ceiling
        cmd(`fill ${minX} ${maxY} ${minZ} ${maxX} ${maxY} ${maxZ} ${pal.ceiling}`);
        // Walls
        cmd(`fill ${minX} ${minY + 1} ${minZ} ${maxX} ${maxY - 1} ${minZ} ${pal.wall}`);
        cmd(`fill ${minX} ${minY + 1} ${maxZ} ${maxX} ${maxY - 1} ${maxZ} ${pal.wall}`);
        cmd(`fill ${minX} ${minY + 1} ${minZ} ${minX} ${maxY - 1} ${maxZ} ${pal.wall}`);
        cmd(`fill ${maxX} ${minY + 1} ${minZ} ${maxX} ${maxY - 1} ${maxZ} ${pal.wall}`);
        // Clear Interior
        cmd(`fill ${minX + 1} ${minY + 1} ${minZ + 1} ${maxX - 1} ${maxY - 1} ${maxZ - 1} minecraft:air`);
    },

    // Build straight corridor
    buildCorridorZ: function(server, x, y, minZ, maxZ, width, height, pal) {
        let cmd = (commandStr) => {
            server.runCommandSilent(`execute in elyrium:dungeons run ${commandStr}`);
        };
        let halfW = Math.floor(width / 2);
        // Floor & Ceiling
        cmd(`fill ${x - halfW} ${y} ${minZ} ${x + halfW} ${y} ${maxZ} ${pal.floor}`);
        cmd(`fill ${x - halfW} ${y + height} ${minZ} ${x + halfW} ${y + height} ${maxZ} ${pal.ceiling}`);
        // Walls
        cmd(`fill ${x - halfW} ${y + 1} ${minZ} ${x - halfW} ${y + height - 1} ${maxZ} ${pal.wall}`);
        cmd(`fill ${x + halfW} ${y + 1} ${minZ} ${x + halfW} ${y + height - 1} ${maxZ} ${pal.wall}`);
        // Interior Air
        cmd(`fill ${x - halfW + 1} ${y + 1} ${minZ} ${x + halfW - 1} ${y + height - 1} ${maxZ} minecraft:air`);
    },

    buildCorridorX: function(server, minX, maxX, y, z, width, height, pal) {
        let cmd = (commandStr) => {
            server.runCommandSilent(`execute in elyrium:dungeons run ${commandStr}`);
        };
        let halfW = Math.floor(width / 2);
        // Floor & Ceiling
        cmd(`fill ${minX} ${y} ${z - halfW} ${maxX} ${y} ${z + halfW} ${pal.floor}`);
        cmd(`fill ${minX} ${y + height} ${z - halfW} ${maxX} ${y + height} ${z + halfW} ${pal.ceiling}`);
        // Walls
        cmd(`fill ${minX} ${y + 1} ${z - halfW} ${maxX} ${y + height - 1} ${z - halfW} ${pal.wall}`);
        cmd(`fill ${minX} ${y + 1} ${z + halfW} ${maxX} ${y + height - 1} ${z + halfW} ${pal.wall}`);
        // Interior Air
        cmd(`fill ${minX} ${y + 1} ${z - halfW + 1} ${maxX} ${y + height - 1} ${z + halfW - 1} minecraft:air`);
    },

    // Main 2-tier Dungeon Generator
    buildDungeon: function(server, instanceId, sector) {
        let pal = this.getPalette(sector);
        let originX = instanceId * 1500;
        let originY = 64;
        let originZ = 0;
        let cmd = (commandStr) => {
            server.runCommandSilent(`execute in elyrium:dungeons run ${commandStr}`);
        };

        // Solid safety foundation at spawn cell (originX - 5 .. originX + 5, Z: -5 .. +5)
        cmd(`fill ${originX - 5} ${originY} ${originZ - 5} ${originX + 5} ${originY} ${originZ + 5} ${pal.floor}`);

        // =========================================================================
        // TIER I: UPPER HALLS (Y = 64)
        // =========================================================================

        // 1. Entry Hall (X - 5 .. X + 5, Z - 5 .. Z + 5, Height 6)
        this.buildRoom(server, originX - 5, originY, originZ - 5, originX + 5, originY + 6, originZ + 5, pal);
        // Light in Entry Hall
        cmd(`setblock ${originX} ${originY + 5} ${originZ} ${pal.light}`);

        // 2. Corridor 1 (Z: +5 to +18)
        this.buildCorridorZ(server, originX, originY, originZ + 5, originZ + 18, 5, 5, pal);

        // 3. Combat Chamber 1 (Z: +18 to +34, X: -8 to +8, Height 7)
        this.buildRoom(server, originX - 8, originY, originZ + 18, originX + 8, originY + 7, originZ + 34, pal);
        // Open entrances
        cmd(`fill ${originX - 1} ${originY + 1} ${originZ + 18} ${originX + 1} ${originY + 3} ${originZ + 18} minecraft:air`);
        cmd(`fill ${originX - 1} ${originY + 1} ${originZ + 34} ${originX + 1} ${originY + 3} ${originZ + 34} minecraft:air`);
        // Torches & Pillars
        cmd(`setblock ${originX - 5} ${originY + 1} ${originZ + 22} ${pal.pillar}`);
        cmd(`setblock ${originX + 5} ${originY + 1} ${originZ + 22} ${pal.pillar}`);
        cmd(`setblock ${originX - 5} ${originY + 1} ${originZ + 30} ${pal.pillar}`);
        cmd(`setblock ${originX + 5} ${originY + 1} ${originZ + 30} ${pal.pillar}`);
        // Spawners / Elite Mobs
        this.spawnElitePack(server, originX, originY + 1, originZ + 26, sector, instanceId, 'combat_1');

        // 4. T-Junction Corridor (Z: +34 to +45) with East Branch to Treasury
        this.buildCorridorZ(server, originX, originY, originZ + 34, originZ + 45, 5, 5, pal);

        // Side Treasury Wing (East: X +2 to +18, Z: +35 to +45)
        this.buildCorridorX(server, originX + 2, originX + 10, originY, originZ + 40, 5, 5, pal);
        this.buildRoom(server, originX + 10, originY, originZ + 35, originX + 20, originY + 6, originZ + 45, pal);
        cmd(`fill ${originX + 10} ${originY + 1} ${originZ + 39} ${originX + 10} ${originY + 3} ${originZ + 41} minecraft:air`);
        // Treasury Chest
        cmd(`setblock ${originX + 18} ${originY + 1} ${originZ + 40} minecraft:chest[facing=west]{CustomName:'{"text":"Сокровищница Подземелья","color":"gold"}'}`);

        // 5. Mini-Boss Chamber (Z: +45 to +65, X: -10 to +10, Height 8)
        this.buildRoom(server, originX - 10, originY, originZ + 45, originX + 10, originY + 8, originZ + 65, pal);
        cmd(`fill ${originX - 1} ${originY + 1} ${originZ + 45} ${originX + 1} ${originY + 3} ${originZ + 45} minecraft:air`);
        // Mini-Boss Spawn
        this.spawnMiniBoss(server, originX, originY + 1, originZ + 55, sector, instanceId);

        // 6. Gated Portcullis (Locked until Mini-Boss killed) at Z = +65
        cmd(`fill ${originX - 2} ${originY + 1} ${originZ + 65} ${originX + 2} ${originY + 4} ${originZ + 65} ${pal.gate}`);

        // =========================================================================
        // VERTICAL DESCENT SHAFT (Y = 64 down to Y = 32)
        // =========================================================================
        let shaftZ = originZ + 75;
        this.buildCorridorZ(server, originX, originY, originZ + 65, shaftZ, 5, 5, pal);
        // Vertical well 7x7 from Y=64 down to Y=32
        cmd(`fill ${originX - 3} 32 ${shaftZ - 3} ${originX + 3} 70 ${shaftZ + 3} ${pal.wall}`);
        cmd(`fill ${originX - 2} 33 ${shaftZ - 2} ${originX + 2} 69 ${shaftZ + 2} minecraft:air`);
        // Spiral staircase steps
        for (let dy = 0; dy <= 32; dy++) {
            let sy = 64 - dy;
            let angle = (dy * 45) * (Math.PI / 180.0);
            let sx = originX + Math.round(Math.cos(angle) * 1.5);
            let sz = shaftZ + Math.round(Math.sin(angle) * 1.5);
            cmd(`setblock ${sx} ${sy} ${sz} ${pal.floor}`);
        }

        // =========================================================================
        // TIER II: THE DEPTHS & BOSS THRONE ROOM (Y = 32)
        // =========================================================================
        let lowerY = 32;

        // 7. Abyss Guardian Hall (Z: +80 to +98, X: -8 to +8, Height 7)
        this.buildRoom(server, originX - 8, lowerY, originZ + 80, originX + 8, lowerY + 7, originZ + 98, pal);
        this.buildCorridorZ(server, originX, lowerY, shaftZ + 2, originZ + 80, 5, 5, pal);
        cmd(`fill ${originX - 1} ${lowerY + 1} ${originZ + 80} ${originX + 1} ${lowerY + 3} ${originZ + 80} minecraft:air`);
        cmd(`fill ${originX - 1} ${lowerY + 1} ${originZ + 98} ${originX + 1} ${lowerY + 3} ${originZ + 98} minecraft:air`);
        // Spawn Abyss Guards
        this.spawnAbyssGuards(server, originX, lowerY + 1, originZ + 89, sector, instanceId);

        // 8. Corridor to Throne Room (Z: +98 to +110)
        this.buildCorridorZ(server, originX, lowerY, originZ + 98, originZ + 110, 5, 5, pal);

        // 9. Grand Boss Throne Room (Z: +110 to +136, X: -13 to +13, Height 10)
        this.buildRoom(server, originX - 13, lowerY, originZ + 110, originX + 13, lowerY + 10, originZ + 136, pal);
        cmd(`fill ${originX - 2} ${lowerY + 1} ${originZ + 110} ${originX + 2} ${lowerY + 4} ${originZ + 110} minecraft:air`);

        // Grand Pillars at 4 corners
        let pillars = [
            [-8, 116], [8, 116], [-8, 130], [8, 130]
        ];
        pillars.forEach(p => {
            cmd(`fill ${originX + p[0]} ${lowerY + 1} ${originZ + p[1]} ${originX + p[0]} ${lowerY + 8} ${originZ + p[1]} ${pal.pillar}`);
            cmd(`setblock ${originX + p[0]} ${lowerY + 4} ${originZ + p[1]} ${pal.light}`);
        });

        // Boss Throne Dais
        cmd(`fill ${originX - 3} ${lowerY + 1} ${originZ + 128} ${originX + 3} ${lowerY + 1} ${originZ + 133} ${pal.accent}`);

        // Spawn Final Boss
        this.spawnFinalBoss(server, originX, lowerY + 2, originZ + 126, sector, instanceId);

        // Register Portcullis Coordinates in persistentData
        let pData = server.persistentData;
        let instTag = `inst_${instanceId}`;
        let instInfo = pData.getCompound(instTag);
        instInfo.putDouble('gate_x', originX);
        instInfo.putDouble('gate_y', originY);
        instInfo.putDouble('gate_z', originZ + 65);
        instInfo.putDouble('boss_throne_x', originX);
        instInfo.putDouble('boss_throne_y', lowerY);
        instInfo.putDouble('boss_throne_z', originZ + 126);
        pData.put(instTag, instInfo);
    },

    // Unlock Portcullis Gate when Mini-Boss dies
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

                    player.teleportTo('elyrium:dungeons', cellX + 0.5, 65.0, 0.5, 180, 0);
                    player.displayClientMessage(Component.literal(`§6⚔ [ПОДЗЕМЕЛЬЕ #${id}] §fВы вошли в верхний чертог!`), true);
                    return 1;
                })
            )
    );
});
