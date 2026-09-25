// ==============================================================================
// 🍺 ELYRIUM: ROADSIDE TAVERNS & WAYFARER INNS SAFE PEACE ZONES (SUBPHASE 7.2)
// ==============================================================================
// 1. Detects tavern structures, roadside inns and MineColonies taverns.
// 2. Absolute Peace: Cancels PvP and hostile monster spawns.
// 3. Actionbar notice on entry: "§6🍺 Вы вошли под кров придорожной таверны. Оружие в ножны!"
// 4. Provides rest & nourishment aura: Saturation and gentle Regeneration.
// ==============================================================================

function isInsideTavernStructure(level, pos) {
    try {
        let sm = level.asKubeJS().minecraftLevel.structureManager();
        if (!sm) return false;
        let start = sm.getStructureWithPieceAt(pos);
        if (start && start.isValid()) {
            let str = start.getStructure().toString().toLowerCase();
            if (str.includes('tavern') || str.includes('pub') || str.includes('inn') || str.includes('bathhouse') ||
                str.includes('outpost_sector1_wayfarer') || str.includes('outpost_sector2_nordic') ||
                str.includes('wayfarer') || str.includes('nordic')) {
                return true;
            }
        }
    } catch (e) {}
    return false;
}

function isInsideColonyTavern(level, pos) {
    try {
        let ColonyManager = Java.loadClass('com.minecolonies.api.colony.IColonyManager').getInstance();
        if (!ColonyManager) return false;
        let colony = ColonyManager.getIColony(level.minecraftLevel, pos);
        if (colony) {
            let buildings = colony.getServerBuildingManager() ? colony.getServerBuildingManager().getBuildings() : colony.getBuildings();
            if (buildings) {
                for (let b of buildings.values()) {
                    let type = b.getBuildingType ? b.getBuildingType().toString().toLowerCase() : '';
                    let schem = b.getSchematicName ? b.getSchematicName().toString().toLowerCase() : '';
                    if (type.includes('tavern') || schem.includes('tavern')) {
                        let loc = b.getLocation();
                        if (loc) {
                            let dx = loc.getX() - pos.getX();
                            let dy = loc.getY() - pos.getY();
                            let dz = loc.getZ() - pos.getZ();
                            if ((dx * dx + dz * dz <= 24 * 24) && Math.abs(dy) <= 12) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
    } catch (e) {}
    return false;
}

function isInsideTavern(level, pos) {
    if (!level || !pos) return false;
    return isInsideTavernStructure(level, pos) || isInsideColonyTavern(level, pos);
}

function getTavernNotice(level, pos) {
    try {
        let sm = level.asKubeJS().minecraftLevel.structureManager();
        if (sm) {
            let start = sm.getStructureWithPieceAt(pos);
            if (start && start.isValid()) {
                let str = start.getStructure().toString().toLowerCase();
                if (str.includes('outpost_sector2_nordic') || str.includes('nordic')) {
                    return '§b🛡 Вы вошли в укрепленный форпост Сектора II. Мирная зона отдыха!';
                }
                if (str.includes('outpost_sector1_wayfarer') || str.includes('wayfarer')) {
                    return '§6🍺 Вы вошли под кров путевой заставы Сектора I. Оружие в ножны!';
                }
            }
        }
    } catch (e) {}
    return '§6🍺 Вы вошли под кров придорожной таверны. Оружие в ножны!';
}

// ------------------------------------------------------------------------------
// 1. TAVERN ENTRY NOTIFICATION & NOURISHMENT AURA
// ------------------------------------------------------------------------------
PlayerEvents.tick(event => {
    let player = event.player;
    if (player.age % 20 !== 0) return;

    let level = player.level;
    let pos = player.blockPosition();

    let inTavern = isInsideTavern(level, pos);
    let wasInTavern = player.persistentData.getBoolean('skd_in_tavern_zone');

    if (inTavern && !wasInTavern) {
        player.displayClientMessage(Text.of(getTavernNotice(level, pos)), true);
        player.server.runCommandSilent(`playsound minecraft:block.wooden_door.open player ${player.username} ~ ~ ~ 0.7 1.0`);
    }

    if (inTavern) {
        // Nourishment & rest aura: keeps satiety full and soothes wounds
        player.potionEffects.add('minecraft:saturation', 60, 0, false, false);
        player.potionEffects.add('minecraft:regeneration', 60, 0, false, false);
    }

    player.persistentData.putBoolean('skd_in_tavern_zone', inTavern);
});

// ------------------------------------------------------------------------------
// 2. ABSOLUTE PEACE: CANCEL PVP IN TAVERNS
// ------------------------------------------------------------------------------
EntityEvents.beforeHurt(event => {
    let target = event.entity;
    if (!target || !target.isPlayer()) return;

    let source = event.source;
    if (!source) return;

    let attacker = source.actual || source.player;
    if (!attacker || !attacker.isPlayer()) return;

    if (isInsideTavern(target.level, target.blockPosition()) || isInsideTavern(attacker.level, attacker.blockPosition())) {
        event.cancel();
        attacker.displayClientMessage(Text.of('§6🍺 В таверне действует закон перемирия! Оружие в ножны!'), true);
        attacker.server.runCommandSilent(`playsound minecraft:block.shield.block player ${attacker.username} ~ ~ ~ 0.8 1.1`);
    }
});

// ------------------------------------------------------------------------------
// 3. MONSTER SUPPRESSION IN TAVERNS
// ------------------------------------------------------------------------------
EntityEvents.checkSpawn(event => {
    let entity = event.entity;
    if (!entity || !entity.isLiving() || entity.isPlayer()) return;

    let type = entity.type.toString().toLowerCase();
    let isHostile = (entity.isMonster && entity.isMonster()) ||
                    type.includes('zombie') || type.includes('skeleton') ||
                    type.includes('creeper') || type.includes('spider') ||
                    type.includes('witch') || type.includes('enderman') ||
                    type.includes('phantom');

    if (isHostile && isInsideTavern(event.level, entity.blockPosition())) {
        event.cancel();
    }
});

EntityEvents.spawned(event => {
    let entity = event.entity;
    if (!entity || !entity.isLiving() || entity.isPlayer()) return;

    let type = entity.type.toString().toLowerCase();
    let isHostile = (entity.isMonster && entity.isMonster()) ||
                    type.includes('zombie') || type.includes('skeleton') ||
                    type.includes('creeper') || type.includes('spider') ||
                    type.includes('witch') || type.includes('enderman') ||
                    type.includes('phantom');

    if (isHostile && isInsideTavern(event.level, entity.blockPosition())) {
        entity.discard();
    }
});
