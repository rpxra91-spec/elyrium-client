// ==============================================================================
// 🗿 ELYRIUM RPG: WANDERING STELES ENGINE (Virtual Display Entities 1.21.1)
// ==============================================================================
// 1. Separate Visual Palettes per Sector (Overworld, Undergarden, Nether, Aether...)
// 2. Vertical Light Beacons shooting 40 blocks into the sky for spotters on mounts.
// 3. 3-Minute Open Portal Window for the whole party to enter the shared instance.
// ==============================================================================

const ElyriumStelePalettes = {
    1: { // Sector 1: Overworld
        dungeon: { block: 'minecraft:chiseled_deepslate', particle: 'minecraft:soul_fire_flame', name: 'Стела Древнего Склепа' },
        colosseum: { block: 'minecraft:chiseled_tuff_bricks', particle: 'minecraft:flame', name: 'Стела Колизея Элириума' }
    },
    2: { // Sector 1.5: Undergarden
        dungeon: { block: 'undergarden:chiseled_depthrock', particle: 'minecraft:spore_blossom_air', name: 'Стела Катакомб Подземья' },
        colosseum: { block: 'undergarden:depthrock_bricks', particle: 'minecraft:wax_on', name: 'Стела Арены Глубин' }
    },
    3: { // Sector 2: Nether
        dungeon: { block: 'minecraft:chiseled_nether_bricks', particle: 'minecraft:lava', name: 'Стела Пепельного Разлома' },
        colosseum: { block: 'minecraft:gilded_blackstone', particle: 'minecraft:flame', name: 'Стела Инфернального Колизея' }
    },
    4: { // Sector 3: Aether
        dungeon: { block: 'aether:carved_stone', particle: 'minecraft:end_rod', name: 'Стела Небесного Святилища' },
        colosseum: { block: 'aether:angelic_stone', particle: 'minecraft:totem_of_undying', name: 'Стела Солнечной Арены' }
    }
};

const ElyriumSteleEngine = {
    // Spawn a wandering stele at specified coordinates
    spawnStele: function(server, dim, x, y, z, type, sector, isTest) {
        let sec = sector || 1;
        let pConfig = (ElyriumStelePalettes[sec] && ElyriumStelePalettes[sec][type]) || ElyriumStelePalettes[1][type];

        let blockId = pConfig.block;
        let displayName = pConfig.name;
        let uid = `stele_uid_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        let testTag = isTest ? ',"test_stele"' : '';

        // 1. Interaction Hitbox (Width 1.6, Height 3.2)
        server.runCommandSilent(`execute in ${dim} run summon interaction ${x + 0.5} ${y} ${z + 0.5} {width:1.6f,height:3.2f,Tags:["elyrium_stele","type_${type}","sector_${sec}","state_closed","${uid}"${testTag}]}`);

        // 2. Floating Block Display
        server.runCommandSilent(`execute in ${dim} run summon block_display ${x + 0.5} ${y + 0.8} ${z + 0.5} {block_state:{Name:"${blockId}"},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],scale:[1.2f,2.0f,1.2f],translation:[-0.6f,0.0f,-0.6f]},Tags:["elyrium_stele_display","type_${type}","sector_${sec}","${uid}"${testTag}]}`);

        // Announce nearby
        let level = server.getLevel(dim);
        if (level) {
            level.sendParticles('minecraft:flash', x + 0.5, y + 1.5, z + 0.5, 1, 0, 0, 0, 0);
        }
    },

    // Handle Player Interaction with Stele
    handleInteract: function(player, steleEntity) {
        let tags = steleEntity.tags;
        let server = player.server;

        let type = tags.contains('type_colosseum') ? 'colosseum' : 'dungeon';
        let sector = 1;
        for (let i = 1; i <= 8; i++) {
            if (tags.contains(`sector_${i}`)) {
                sector = i;
                break;
            }
        }

        let isClosed = tags.contains('state_closed');

        if (isClosed) {
            // Require Item Key
            let handItem = player.mainHandItem;
            let canActivate = false;

            if (type === 'colosseum') {
                if (handItem.id === 'kubejs:gate_pearl_colosseum') {
                    canActivate = true;
                    handItem.count--;
                } else {
                    player.displayClientMessage(Component.literal('§c🔒 Нужен предмет [Око Испытаний Колизея] для активации Стелы!'), true);
                    player.playNotifySound('minecraft:block.chest.locked', 'players', 0.8, 1.0);
                    return;
                }
            } else {
                // Dungeon key requirement
                canActivate = true;
            }

            if (canActivate) {
                // Create Instance
                let instId = ElyriumInstanceManager.createInstance(server, type, sector, player);

                // Update stele tags
                tags.remove('state_closed');
                tags.add('state_open');
                tags.add(`inst_${instId}`);

                // 3-Minute Portal Window
                let now = Date.now();
                steleEntity.persistentData.putLong('elyrium_portal_closes_at', now + 180000);
                steleEntity.persistentData.putInt('elyrium_target_instance', instId);

                // Global sector alert
                player.playNotifySound('minecraft:block.bell.resonate', 'players', 1.0, 0.8);
                player.displayClientMessage(Component.literal('§6⚡ [РАЗЛОМ ПРОБУЖДЕН] §fВрата открыты на §e3 минуты§f! Члены группы могут войти!'), false);

                // Teleport leader
                ElyriumInstanceManager.enterInstance(player, instId);
            }
        } else {
            // Portal is OPEN: Allow any party member to enter
            let targetInst = steleEntity.persistentData.getInt('elyrium_target_instance');
            let closesAt = steleEntity.persistentData.getLong('elyrium_portal_closes_at') || 0;
            let now = Date.now();

            if (now > closesAt) {
                player.displayClientMessage(Component.literal('§c⏳ Время врат истекло! Портал закрылся.'), true);
                this.closeOrDiscardStele(steleEntity);
                return;
            }

            if (targetInst > 0) {
                ElyriumInstanceManager.enterInstance(player, targetInst);
            }
        }
    },

    // Safely close or discard stele
    closeOrDiscardStele: function(steleEntity) {
        if (!steleEntity) return;
        let tags = steleEntity.tags;
        let isPermanent = tags.contains('spawn_test_stele') || tags.contains('test_stele');

        if (isPermanent) {
            tags.remove('state_open');
            tags.add('state_closed');
            steleEntity.persistentData.remove('elyrium_portal_closes_at');
            steleEntity.persistentData.remove('elyrium_target_instance');
            let toRemove = [];
            tags.forEach(t => {
                if (t.startsWith('inst_')) toRemove.push(t);
            });
            toRemove.forEach(t => tags.remove(t));
        } else {
            let sLevel = steleEntity.level;
            let dim = sLevel ? String(sLevel.dimension) : 'minecraft:overworld';
            let server = steleEntity.server;

            // Find uid tag to kill corresponding block display
            let uid = null;
            tags.forEach(t => {
                if (t.startsWith('stele_uid_')) uid = t;
            });

            steleEntity.discard();

            if (server && uid) {
                server.runCommandSilent(`execute in ${dim} run kill @e[tag=${uid}]`);
            }
        }
    }
};

// Interaction Hook
ItemEvents.entityInteracted(event => {
    let target = event.target;
    let player = event.player;
    if (!target || !player) return;

    if (target.tags.contains('elyrium_stele')) {
        ElyriumSteleEngine.handleInteract(player, target);
        event.cancel();
    }
});

// Periodic Vertical Beacon FX & Open Portal Vortex
ServerEvents.tick(event => {
    if (event.server.tickCount % 10 !== 0) return;

    let server = event.server;
    let overworld = server.getLevel('minecraft:overworld');
    if (!overworld) return;

    let entities = overworld.getEntities();
    let now = Date.now();

    for (let i = 0; i < entities.size(); i++) {
        let ent = entities.get(i);
        if (!ent || !ent.tags || !ent.tags.contains('elyrium_stele')) continue;

        let tags = ent.tags;
        let type = tags.contains('type_colosseum') ? 'colosseum' : 'dungeon';
        let sector = 1;
        for (let s = 1; s <= 8; s++) {
            if (tags.contains(`sector_${s}`)) { sector = s; break; }
        }

        let pConfig = (ElyriumStelePalettes[sector] && ElyriumStelePalettes[sector][type]) || ElyriumStelePalettes[1][type];
        let particle = pConfig.particle;

        let x = ent.x;
        let y = ent.y;
        let z = ent.z;

        let isOpen = tags.contains('state_open');

        if (isOpen) {
            // Check expiry
            let closesAt = ent.persistentData.getLong('elyrium_portal_closes_at') || 0;
            if (now > closesAt) {
                ElyriumSteleEngine.closeOrDiscardStele(ent);
                continue;
            }
            // Swirling portal vortex
            try {
                overworld.sendParticles('minecraft:portal', x, y + 1.6, z, 30, 0.8, 1.2, 0.8, 0.1);
                overworld.sendParticles(particle, x, y + 1.6, z, 15, 0.5, 0.8, 0.5, 0.05);
            } catch (eP) {}
        } else {
            // Vertical beacon pillar shooting 40 blocks up
            try {
                for (let h = 0; h < 40; h += 4) {
                    overworld.sendParticles(particle, x, y + 2.0 + h, z, 2, 0.15, 0.5, 0.15, 0.01);
                }
            } catch (eP) {}
        }
    }
});

// Admin Command to spawn steles
ServerEvents.commandRegistry(event => {
    let { commands: Commands, arguments: Arguments } = event;
    event.register(
        Commands.literal('stele')
            .requires(s => s.hasPermission(2))
            .then(Commands.literal('spawn')
                .then(Commands.literal('colosseum')
                    .executes(ctx => {
                        let player = ctx.source.player;
                        if (player) {
                            let pos = player.blockPosition();
                            ElyriumSteleEngine.spawnStele(ctx.source.server, String(player.level.dimension), pos.x, pos.y, pos.z, 'colosseum', 1, true);
                            player.displayClientMessage(Component.literal('§a[STELE] Тестовая Стела Колизея установлена (перезаряжаемая)!'), true);
                        }
                        return 1;
                    })
                )
                .then(Commands.literal('dungeon')
                    .executes(ctx => {
                        let player = ctx.source.player;
                        if (player) {
                            let pos = player.blockPosition();
                            ElyriumSteleEngine.spawnStele(ctx.source.server, String(player.level.dimension), pos.x, pos.y, pos.z, 'dungeon', 1, true);
                            player.displayClientMessage(Component.literal('§a[STELE] Тестовая Стела Подземелья установлена (перезаряжаемая)!'), true);
                        }
                        return 1;
                    })
                )
            )
            .then(Commands.literal('cleanup')
                .executes(ctx => {
                    let server = ctx.source.server;
                    let player = ctx.source.player;
                    let dim = player ? String(player.level.dimension) : 'minecraft:overworld';
                    server.runCommandSilent(`execute in ${dim} run kill @e[tag=elyrium_stele]`);
                    server.runCommandSilent(`execute in ${dim} run kill @e[tag=elyrium_stele_display]`);
                    if (player) {
                        player.displayClientMessage(Component.literal('§e[STELE] Все стелы и дисплеи в текущем мире удалены!'), true);
                    }
                    return 1;
                })
            )
    );
});

// Export to global scope for cross-script access in KubeJS
global.ElyriumSteleEngine = ElyriumSteleEngine;

