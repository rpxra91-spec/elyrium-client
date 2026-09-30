// ==============================================================================
// 🌌 ELYRIUM RPG: DUNGEON & COLOSSEUM INSTANCE MANAGER
// Dimension: elyrium:dungeons | Grid Offset Architecture
// ==============================================================================
// 1. Grid Offset: Each active dungeon/arena gets an isolated cell at (ID * 1500, 64, 0).
// 2. Colosseum Arena Generator: Builds circular battle arena with gates and central rift.
// 3. Return & Triumph Portal: Spawns reward chest and Golden Portal of Triumph.
// 4. Return to Overworld: Restores player to the exact entry coordinates.
// ==============================================================================

var ElyriumInstanceManager = {
    // Generate circular Colosseum Arena at coordinates
    buildColosseumArena: function(server, originX, originY, originZ, sector) {
        let level = server.getLevel('elyrium:dungeons');
        if (!level) return;

        let radius = 14;
        let floorBlock = 'minecraft:polished_tuff';
        let rimBlock = 'minecraft:chiseled_tuff_bricks';
        let pillarBlock = 'minecraft:gilded_blackstone';

        if (sector >= 2) {
            floorBlock = 'minecraft:polished_blackstone';
            rimBlock = 'minecraft:gilded_blackstone';
            pillarBlock = 'minecraft:nether_brick_fence';
        }

        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);

        // 1. Clear bounding box and build floor
        for (let x = -radius - 2; x <= radius + 2; x++) {
            for (let z = -radius - 2; z <= radius + 2; z++) {
                let distSq = x * x + z * z;
                let bx = originX + x;
                let bz = originZ + z;

                if (distSq <= radius * radius) {
                    // Floor
                    cmd(`setblock ${bx} ${originY} ${bz} ${distSq >= (radius - 2) * (radius - 2) ? rimBlock : floorBlock}`);
                    // Air above
                    for (let y = 1; y <= 6; y++) {
                        cmd(`setblock ${bx} ${originY + y} ${bz} minecraft:air`);
                    }

                    // Outer perimeter fence
                    if (distSq >= (radius - 1) * (radius - 1) && distSq <= radius * radius) {
                        // 4 gates at cardinal directions
                        let isGate = (Math.abs(x) <= 1 && Math.abs(z) >= radius - 2) || (Math.abs(z) <= 1 && Math.abs(x) >= radius - 2);
                        if (!isGate) {
                            for (let y = 1; y <= 3; y++) {
                                cmd(`setblock ${bx} ${originY + y} ${bz} minecraft:iron_bars`);
                            }
                        }
                    }
                }
            }
        }

        // 2. Pillars and torches at 4 diagonal corners
        let pillarOffsets = [
            [-8, -8], [8, -8], [-8, 8], [8, 8]
        ];
        pillarOffsets.forEach(pos => {
            let px = originX + pos[0];
            let pz = originZ + pos[1];
            for (let y = 1; y <= 4; y++) {
                cmd(`setblock ${px} ${originY + y} ${pz} ${pillarBlock}`);
            }
            cmd(`setblock ${px} ${originY + 5} ${pz} minecraft:soul_lantern[hanging=false]`);
        });

        // 3. Central altar
        cmd(`setblock ${originX} ${originY + 1} ${originZ} minecraft:chiseled_tuff_bricks`);
    },

    // Create a new instance for party
    createInstance: function(server, type, sector, leader) {
        let pData = server.persistentData;
        let nextId = (pData.getInt('elyrium_instance_counter') || 0) + 1;
        pData.putInt('elyrium_instance_counter', nextId);

        let cellX = nextId * 1500;
        let cellY = 64;
        let cellZ = 0;

        let instanceTag = `inst_${nextId}`;
        let instInfo = pData.getCompound(instanceTag);
        instInfo.putString('type', type);
        instInfo.putInt('sector', sector);
        instInfo.putDouble('origin_x', cellX);
        instInfo.putDouble('origin_y', cellY);
        instInfo.putDouble('origin_z', cellZ);
        instInfo.putString('leader_uuid', String(leader.uuid));
        instInfo.putDouble('entry_x', leader.x);
        instInfo.putDouble('entry_y', leader.y);
        instInfo.putDouble('entry_z', leader.z);
        instInfo.putString('entry_dim', String(leader.level.dimension));
        instInfo.putString('state', 'active');
        instInfo.putLong('created_at', Date.now());
        pData.put(instanceTag, instInfo);

        if (type === 'colosseum') {
            this.buildColosseumArena(server, cellX, cellY, cellZ, sector);
        } else if (type === 'dungeon') {
            let stitcher = typeof ElyriumDungeonStitcher !== 'undefined' ? ElyriumDungeonStitcher : null;
            if (stitcher) {
                stitcher.buildDungeon(server, nextId, sector);
            } else {
                console.error(`[ELYRIUM CRITICAL] ElyriumDungeonStitcher not found when creating dungeon instance #${nextId}!`);
            }
            let livesEngine = typeof ElyriumLivesEngine !== 'undefined' ? ElyriumLivesEngine : null;
            if (livesEngine) {
                livesEngine.initInstanceLives(server, nextId, sector);
            }
        }

        return nextId;
    },

    // Teleport player into active instance
    enterInstance: function(player, instanceId) {
        let server = player.server;
        let pData = server.persistentData;
        let instanceTag = `inst_${instanceId}`;
        if (!pData.contains(instanceTag)) {
            player.displayClientMessage(Component.literal('§cПодземелье не найдено или закрылось!'), true);
            return;
        }

        let instInfo = pData.getCompound(instanceTag);
        let instType = instInfo.getString('type') || 'dungeon';
        let cellX = instInfo.getDouble('origin_x');
        let cellY = instInfo.getDouble('origin_y');
        let cellZ = instInfo.getDouble('origin_z');

        // Record player return point
        player.persistentData.putDouble('elyrium_return_x', player.x);
        player.persistentData.putDouble('elyrium_return_y', player.y);
        player.persistentData.putDouble('elyrium_return_z', player.z);
        player.persistentData.putString('elyrium_return_dim', String(player.level.dimension));
        player.persistentData.putInt('elyrium_active_instance', instanceId);

        if (instType === 'colosseum') {
            // Teleport into Colosseum Arena
            player.fallDistance = 0.0;
            player.teleportTo('elyrium:dungeons', cellX + 0.5, cellY + 2.0, cellZ + 5.5, 180, 0);
            player.playNotifySound('minecraft:entity.enderman.teleport', 'players', 1.0, 1.0);
            player.displayClientMessage(Component.literal('§6⚔ [КОЛИЗЕЙ ЭЛИРИУМА] §fВы вошли на Арену Испытаний!'), true);
        } else {
            // Safety starter pavilion check at Entry Hall
            server.runCommandSilent(`execute in elyrium:dungeons run fill ${cellX - 4} 64 -4 ${cellX + 4} 64 4 minecraft:stone_bricks`);
            server.runCommandSilent(`execute in elyrium:dungeons run fill ${cellX - 3} 65 -3 ${cellX + 3} 69 3 minecraft:air`);

            // Teleport into Floor 1 Entry Hall (safe starter platform)
            player.fallDistance = 0.0;
            player.teleportTo('elyrium:dungeons', cellX + 0.5, 65.0, 0.5, 0, 0);
            player.playNotifySound('minecraft:ambient.cave', 'players', 1.0, 0.8);
            player.displayClientMessage(Component.literal('§5💀 [ПОДЗЕМЕЛЬЕ ЭЛИРИУМА] §fВы ступили в катакомбы Разлома! Одолейте хранителя герсы.'), false);
        }
    },

    // Spawn Golden Portal of Triumph and Reward Chest
    spawnTriumphPortal: function(server, instanceId) {
        let pData = server.persistentData;
        let instanceTag = `inst_${instanceId}`;
        if (!pData.contains(instanceTag)) return;

        let instInfo = pData.getCompound(instanceTag);
        let cellX = instInfo.getDouble('origin_x');
        let cellY = instInfo.getDouble('origin_y');
        let cellZ = instInfo.getDouble('origin_z');

        let level = server.getLevel('elyrium:dungeons');
        if (!level) return;

        // 1. Reward Chest in center
        server.runCommandSilent(`execute in elyrium:dungeons run setblock ${cellX} ${cellY + 1} ${cellZ - 2} minecraft:chest[facing=south]{CustomName:'{"text":"Сундук Победителя Колизея","color":"gold"}'}`);

        // 2. Portal of Triumph (Golden floating rift)
        server.runCommandSilent(`execute in elyrium:dungeons run summon interaction ${cellX + 0.5} ${cellY + 1} ${cellZ + 0.5} {width:2.0f,height:3.0f,Tags:["elyrium_triumph_portal","inst_${instanceId}"]}`);

        // Visual frame of triumph portal
        server.runCommandSilent(`execute in elyrium:dungeons run summon block_display ${cellX + 0.5} ${cellY + 1.2} ${cellZ + 0.5} {block_state:{Name:"minecraft:gilded_blackstone"},transformation:{scale:[1.8f,2.8f,0.2f],translation:[-0.9f,0.0f,-0.1f]},Tags:["elyrium_triumph_display","inst_${instanceId}"]}`);

        // Sound & celebratory fireworks
        level.players.forEach(p => {
            if (p.persistentData.getInt('elyrium_active_instance') === instanceId) {
                p.playNotifySound('minecraft:ui.toast.challenge_complete', 'players', 1.0, 1.0);
                p.displayClientMessage(Component.literal('§6👑 [ТРИУМФ] §fАрена пройдена! Войдите в Золотой Портал для возвращения!'), false);
            }
        });
    },

    // Return player home to Overworld entry position
    returnPlayerHome: function(player) {
        let pData = player.persistentData;
        let retDim = pData.getString('elyrium_return_dim') || 'minecraft:overworld';
        let retX = pData.getDouble('elyrium_return_x') || 0;
        let retY = pData.getDouble('elyrium_return_y') || 64;
        let retZ = pData.getDouble('elyrium_return_z') || 0;

        let activeInst = pData.getInt('elyrium_active_instance');
        pData.remove('elyrium_active_instance');

        player.teleportTo(retDim, retX, retY, retZ, player.yaw, player.pitch);
        player.playNotifySound('minecraft:entity.player.levelup', 'players', 1.0, 1.2);
        player.displayClientMessage(Component.literal('§a🌟 [ВОЗВРАЩЕНИЕ] §fВы благополучно вернулись в Верхний мир!'), true);
    }
};

// Interaction with Portal of Triumph
ItemEvents.entityInteracted(event => {
    let target = event.target;
    let player = event.player;
    if (!target || !player) return;

    if (target.tags.contains('elyrium_triumph_portal')) {
        ElyriumInstanceManager.returnPlayerHome(player);
        event.cancel();
    }
});

// Periodic particles around Portal of Triumph
ServerEvents.tick(event => {
    if (event.server.tickCount % 20 !== 0) return;
    let level = event.server.getLevel('elyrium:dungeons');
    if (!level) return;

    let pData = event.server.persistentData;
    let count = pData.getInt('elyrium_instance_counter') || 0;

    for (let id = 1; id <= count; id++) {
        let tag = `inst_${id}`;
        if (!pData.contains(tag)) continue;
        let inst = pData.getCompound(tag);
        if (inst.getString('state') === 'active') {
            let cx = inst.getDouble('origin_x');
            let cy = inst.getDouble('origin_y');
            let cz = inst.getDouble('origin_z');

            try {
                // Golden triumph sparks in center
                level.sendParticles('minecraft:totem_of_undying', cx + 0.5, cy + 2.5, cz + 0.5, 10, 0.5, 0.8, 0.5, 0.05);
            } catch (eP) {}
        }
    }
});

ServerEvents.commandRegistry(event => {
    let { commands: Commands, arguments: Arguments } = event;
    event.register(
        Commands.literal('dungeon')
            .then(Commands.literal('triumph')
                .requires(s => s.hasPermission(2))
                .executes(ctx => {
                    let player = ctx.source.player;
                    if (player) {
                        let instId = player.persistentData.getInt('elyrium_active_instance');
                        if (instId > 0) {
                            ElyriumInstanceManager.spawnTriumphPortal(ctx.source.server, instId);
                        }
                    }
                    return 1;
                })
            )
            .then(Commands.literal('leave')
                .executes(ctx => {
                    let player = ctx.source.player;
                    if (player) {
                        ElyriumInstanceManager.returnPlayerHome(player);
                    }
                    return 1;
                })
            )
    );
});



