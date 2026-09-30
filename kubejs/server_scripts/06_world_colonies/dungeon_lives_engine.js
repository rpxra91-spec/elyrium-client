// ==============================================================================
// 💀 ELYRIUM RPG: PARTY LIVES ENGINE & WIPEOUT RESOLUTION
// Dimension: elyrium:dungeons | Tier-based Scaling: T1-2 (Inf), T3-5 (8), T6-8 (4)
// ==============================================================================
// 1. Tracks party deaths per instance.
// 2. Real-time Action Bar HUD displaying remaining lives.
// 3. Expulsion back to overworld upon exhausting all group lives.
// ==============================================================================

var ElyriumLivesEngine = {
    getMaxLivesForSector: function(sector) {
        if (sector <= 2) return 5;  // 5 shared lives for early tiers
        if (sector <= 5) return 4;  // 4 shared lives for mid tiers
        return 3;                   // 3 shared lives for high tiers
    },

    initInstanceLives: function(server, instanceId, sector) {
        let pData = server.persistentData;
        let instTag = `inst_${instanceId}`;
        let instInfo = pData.getCompound(instTag);
        let maxL = this.getMaxLivesForSector(sector);
        instInfo.putInt('lives_max', maxL);
        instInfo.putInt('lives_left', maxL);
        pData.put(instTag, instInfo);
    },

    getLivesLeft: function(server, instanceId) {
        let pData = server.persistentData;
        let instTag = `inst_${instanceId}`;
        if (!pData.contains(instTag)) return -1;
        let instInfo = pData.getCompound(instTag);
        return instInfo.contains('lives_left') ? instInfo.getInt('lives_left') : -1;
    },

    handlePlayerDeath: function(player) {
        let pData = player.persistentData;
        let instId = pData.getInt('elyrium_active_instance');
        if (instId <= 0) return;

        let server = player.server;
        let sData = server.persistentData;
        let instTag = `inst_${instId}`;
        if (!sData.contains(instTag)) return;

        let instInfo = sData.getCompound(instTag);
        let maxL = instInfo.getInt('lives_max');
        if (maxL <= 0) {
            maxL = 5;
            instInfo.putInt('lives_max', maxL);
        }

        let curLeft = instInfo.contains('lives_left') ? instInfo.getInt('lives_left') : maxL;
        let left = Math.max(0, curLeft - 1);
        instInfo.putInt('lives_left', left);
        sData.put(instTag, instInfo);

        let level = server.getLevel('elyrium:dungeons');
        if (!level) return;

        if (left > 0) {
            // Warn party
            level.players.forEach(p => {
                if (p.persistentData.getInt('elyrium_active_instance') === instId) {
                    p.playNotifySound('minecraft:block.bell.use', 'players', 1.0, 0.6);
                    p.displayClientMessage(Component.literal(`§c☠ [ПОТЕРИ] §fИгрок §e${player.username}§f пал! Осталось жизней группы: §c${left}§8/§e${maxL}`), false);
                }
            });
        } else {
            // Wipeout / Expulsion
            level.players.forEach(p => {
                if (p.persistentData.getInt('elyrium_active_instance') === instId) {
                    p.playNotifySound('minecraft:entity.wither.death', 'players', 1.0, 0.8);
                    p.displayClientMessage(Component.literal('§4☠ [ПРОВАЛ ПОДЗЕМЕЛЬЯ] §cЖизни группы исчерпаны! Экспедиция провалена!'), false);

                    // Apply Soul Trauma and Gear Wear Penalty for Dungeon Failure
                    try {
                        let streak = (p.persistentData.getInt('elyrium_death_streak') || 0) + 1;
                        p.persistentData.putInt('elyrium_death_streak', Math.min(5, streak));
                        p.persistentData.putBoolean('elyrium_soul_trauma', true);
                        p.potionEffects.add('minecraft:weakness', 900, 0, false, true); // 45s
                        p.potionEffects.add('minecraft:slowness', 900, 0, false, true);
                        p.potionEffects.add('minecraft:mining_fatigue', 900, 0, false, true);

                        ['head', 'chest', 'legs', 'feet', 'mainhand', 'offhand'].forEach(slot => {
                            let item = p.getEquipment(slot);
                            if (item && !item.isEmpty() && item.isDamageableItem()) {
                                let maxDmg = item.maxDamage;
                                let wear = Math.max(1, Math.floor(maxDmg * 0.05));
                                item.damageValue = Math.min(maxDmg - 1, item.damageValue + wear);
                            }
                        });
                        p.displayClientMessage(Component.literal('§c☠ [ТРАВМА ДУШИ] §7Провал экспедиции сломил ваш дух. Оружие и броня повреждены (-5%).'), false);
                    } catch (ePen) {}

                    server.scheduleInTicks(40, () => {
                        let retDim = p.persistentData.getString('elyrium_return_dim') || 'minecraft:overworld';
                        let rx = p.persistentData.getDouble('elyrium_return_x') || 0;
                        let ry = p.persistentData.getDouble('elyrium_return_y') || 64;
                        let rz = p.persistentData.getDouble('elyrium_return_z') || 0;
                        p.persistentData.remove('elyrium_active_instance');
                        p.teleportTo(retDim, rx, ry, rz, p.yaw, p.pitch);
                        p.displayClientMessage(Component.literal('§cВы изгнаны к Странствующей Стеле Верхнего мира.'), true);
                    });
                }
            });
        }
    }
};

// Player death in dungeon
EntityEvents.death(event => {
    let entity = event.entity;
    if (!entity || !entity.isPlayer()) return;

    let dim = String(entity.level.dimension);
    if (!dim.includes('dungeons')) return;

    ElyriumLivesEngine.handlePlayerDeath(entity);
});

// Void rescue in dungeons: if player falls below Y < 10, teleport back to room 1 and deduct 1 life
PlayerEvents.tick(event => {
    let player = event.player;
    if (!player || !player.isAlive()) return;

    let dim = String(player.level.dimension);
    if (!dim.includes('dungeons')) return;

    let instId = player.persistentData.getInt('elyrium_active_instance');
    if (instId <= 0) return;

    if (player.y < 10) {
        let cellX = instId * 1500;
        let server = player.server;
        server.runCommandSilent(`execute in elyrium:dungeons run setblock ${cellX} 64 0 minecraft:stone_bricks`);
        player.fallDistance = 0.0;
        player.teleportTo('elyrium:dungeons', cellX + 0.5, 65.0, 0.5, player.yaw, 0);
        player.playNotifySound('minecraft:entity.enderman.teleport', 'players', 1.0, 0.8);
        player.displayClientMessage(Component.literal('§c⚠ [СПАСЕНИЕ ИЗ БЕЗДНЫ] Вы сорвались в бездну! Возвращение во Входной Зал (-1 жизнь).'), false);
        ElyriumLivesEngine.handlePlayerDeath(player);
    }
});

// Real-time Action Bar HUD
ServerEvents.tick(event => {
    let server = event.server;
    if (server.tickCount % 20 !== 0) return;

    let level = server.getLevel('elyrium:dungeons');
    if (!level) return;

    level.players.forEach(player => {
        let instId = player.persistentData.getInt('elyrium_active_instance');
        if (instId <= 0) return;

        let sData = server.persistentData;
        let instTag = `inst_${instId}`;
        if (!sData.contains(instTag)) return;

        let instInfo = sData.getCompound(instTag);
        let maxL = instInfo.getInt('lives_max');
        let leftL = instInfo.getInt('lives_left');
        let floorStr = player.y > 48 ? 'I (Верхний)' : 'II (Недра)';

        let livesDisplay = (maxL <= 0) ? '§a∞ (Безлимит)' : (leftL > 2 ? `§a${leftL}/${maxL}` : `§c${leftL}/${maxL}`);
        player.displayClientMessage(Component.literal(`§6⚔ Инстанс #${instId} §8| §fЯрус: §e${floorStr} §8| §fЖизни: ${livesDisplay}`), true);
    });
});



