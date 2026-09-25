// ==============================================================================
// 🔮 ELYRIUM: POCKET REALM ANCHORED CHAMBERS SYSTEM (SUBPHASE 7.3)
// ==============================================================================
// 1. Dimension Access: elyrium:pocket_realm (fallback: irons_spellbooks:pocket_dimension).
// 2. Command / Item: ".pocket", "/pocket" or "kubejs:pocket_key".
// 3. Anti-Exploit Combat Anchor:
//    - ONLY activated inside Capital (0,0) or player's MineColonies TownHall / Tavern.
//    - INTERCEPTED if in combat (<10s) or inside dangerous dungeons:
//      "§c⚠ Карманное измерение недоступно во время боя или в глубинах подземелий!"
// 4. Exiting returns player precisely to their entry anchor.
// ==============================================================================

function isInsideCapitalZone(level, x, z) {
    if (!level) return false;
    let dimStr = level.dimension.toString();
    if (!dimStr.includes('overworld')) return false;
    return (x * x + z * z) <= (128 * 128);
}

function isInsideDangerousDungeon(level, pos) {
    try {
        let sm = level.asKubeJS().minecraftLevel.structureManager();
        if (!sm) return false;
        let start = sm.getStructureWithPieceAt(pos);
        if (start && start.isValid()) {
            let str = start.getStructure().toString().toLowerCase();
            if (str.includes('cataclysm:') ||
                str.includes('dungeons_arise:') ||
                str.includes('irons_spellbooks:') ||
                str.includes('totw_modded:') ||
                str.includes('dungeon') ||
                str.includes('fortress') ||
                str.includes('stronghold')) {
                return true;
            }
        }
    } catch (e) {}
    return false;
}

function isInsidePlayerColonyAnchor(player) {
    try {
        let ColonyManager = Java.loadClass('com.minecolonies.api.colony.IColonyManager').getInstance();
        if (!ColonyManager) return false;

        let colony = ColonyManager.getIColony(player.level.minecraftLevel, player.blockPosition());
        if (!colony) return false;

        // Check if player is owner, officer, or citizen
        let perms = colony.getPermissions();
        let isMember = false;
        if (perms) {
            let ownerUUID = perms.getOwnerUUID ? perms.getOwnerUUID() : null;
            if (ownerUUID && ownerUUID.equals(player.uuid)) isMember = true;
            let ownerName = perms.getOwnerName ? perms.getOwnerName() : '';
            if (ownerName && ownerName.toString().toLowerCase() === player.username.toLowerCase()) isMember = true;
            let rank = perms.getRank ? perms.getRank(player) : null;
            if (rank && rank.toString().toLowerCase() !== 'neutral' && rank.toString().toLowerCase() !== 'hostile') {
                isMember = true;
            }
        }
        if (!isMember) return false;

        // Check if within 24 blocks of TownHall or Tavern building
        let buildings = colony.getServerBuildingManager() ? colony.getServerBuildingManager().getBuildings() : colony.getBuildings();
        if (buildings) {
            let pPos = player.blockPosition();
            for (let b of buildings.values()) {
                let type = b.getBuildingType ? b.getBuildingType().toString().toLowerCase() : '';
                let schem = b.getSchematicName ? b.getSchematicName().toString().toLowerCase() : '';
                if (type.includes('townhall') || schem.includes('townhall') ||
                    type.includes('tavern') || schem.includes('tavern')) {
                    let loc = b.getLocation();
                    if (loc) {
                        let dx = loc.getX() - pPos.getX();
                        let dy = loc.getY() - pPos.getY();
                        let dz = loc.getZ() - pPos.getZ();
                        if ((dx * dx + dz * dz <= 24 * 24) && Math.abs(dy) <= 12) {
                            return true;
                        }
                    }
                }
            }
        }
    } catch (e) {}
    return false;
}

// Track combat timestamps for players
EntityEvents.beforeHurt(event => {
    let entity = event.entity;
    let source = event.source;
    let attacker = source ? (source.actual || source.player) : null;
    let time = event.level.time;

    if (entity && entity.isPlayer()) {
        entity.persistentData.putLong('skd_last_combat_time', time);
    }
    if (attacker && attacker.isPlayer()) {
        attacker.persistentData.putLong('skd_last_combat_time', time);
    }
});

// Central activation handler
function handlePocketRealmUse(player) {
    let server = player.server;
    let level = player.level;
    let currentDim = level.dimension.toString();
    let isInsidePocket = currentDim.includes('pocket_realm') || currentDim.includes('pocket_dimension');

    // 1. EXIT FROM POCKET REALM
    if (isInsidePocket) {
        let retDim = player.persistentData.getString('pocket_ret_dim') || 'minecraft:overworld';
        let retX = player.persistentData.getDouble('pocket_ret_x') || 0.5;
        let retY = player.persistentData.getDouble('pocket_ret_y') || 75.0;
        let retZ = player.persistentData.getDouble('pocket_ret_z') || 0.5;
        let retYaw = player.persistentData.getFloat('pocket_ret_yaw') || 0.0;
        let retPitch = player.persistentData.getFloat('pocket_ret_pitch') || 0.0;

        player.teleportTo(retDim, retX, retY, retZ, retYaw, retPitch);
        player.displayClientMessage(Text.of('§a🌀 Вы вернулись из карманного измерения обратно к якорю.'), true);
        server.runCommandSilent(`playsound minecraft:block.portal.travel player ${player.username} ~ ~ ~ 0.8 1.2`);
        return;
    }

    // 2. ANTI-EXPLOIT COMBAT & DUNGEON CHECK
    let lastCombat = player.persistentData.getLong('skd_last_combat_time');
    let inCombat = (level.time - lastCombat < 200) && (level.time >= lastCombat);
    let inDungeon = isInsideDangerousDungeon(level, player.blockPosition());

    if (inCombat || inDungeon) {
        player.displayClientMessage(Text.of('§c⚠ Карманное измерение недоступно во время боя или в глубинах подземелий!'), true);
        server.runCommandSilent(`playsound minecraft:block.chest.locked player ${player.username} ~ ~ ~ 1.0 0.8`);
        return;
    }

    // 3. ANCHOR VALIDATION (Capital OR Colony TownHall/Tavern)
    let inCapital = isInsideCapitalZone(level, player.x, player.z);
    let inColony = isInsidePlayerColonyAnchor(player);

    if (!inCapital && !inColony) {
        player.displayClientMessage(Text.of('§c⚠ Стационарный якорь не найден! Активация доступна только в Столице, Ратуше или Таверне.'), true);
        server.runCommandSilent(`playsound minecraft:block.beacon.deactivate player ${player.username} ~ ~ ~ 0.8 0.8`);
        return;
    }

    // 4. SAVE RETURN ANCHOR
    player.persistentData.putString('pocket_ret_dim', currentDim);
    player.persistentData.putDouble('pocket_ret_x', player.x);
    player.persistentData.putDouble('pocket_ret_y', player.y);
    player.persistentData.putDouble('pocket_ret_z', player.z);
    player.persistentData.putFloat('pocket_ret_yaw', player.yaw);
    player.persistentData.putFloat('pocket_ret_pitch', player.pitch);

    // 5. DETERMINE TARGET DIMENSION & COZY CHAMBER
    let targetDim = server.getLevel('elyrium:pocket_realm') ? 'elyrium:pocket_realm' : 'irons_spellbooks:pocket_dimension';
    let uHash = Math.abs(player.uuid.hashCode()) % 10000;
    let cx = uHash * 64 + 32;
    let cy = 64;
    let cz = 32;

    // Construct private chamber architecture silently
    server.runCommandSilent(`execute in ${targetDim} run fill ${cx-3} ${cy-1} ${cz-3} ${cx+3} ${cy-1} ${cz+3} minecraft:polished_deepslate`);
    server.runCommandSilent(`execute in ${targetDim} run fill ${cx-3} ${cy+4} ${cz-3} ${cx+3} ${cy+4} ${cz+3} minecraft:smooth_stone_slab[type=double]`);
    server.runCommandSilent(`execute in ${targetDim} run fill ${cx-3} ${cy} ${cz-3} ${cx+3} ${cy+3} ${cz+3} minecraft:air`);
    server.runCommandSilent(`execute in ${targetDim} run fill ${cx-3} ${cy} ${cz-3} ${cx+3} ${cy+3} ${cz-3} minecraft:polished_deepslate_bricks`);
    server.runCommandSilent(`execute in ${targetDim} run fill ${cx-3} ${cy} ${cz+3} ${cx+3} ${cy+3} ${cz+3} minecraft:polished_deepslate_bricks`);
    server.runCommandSilent(`execute in ${targetDim} run fill ${cx-3} ${cy} ${cz-3} ${cx-3} ${cy+3} ${cz+3} minecraft:polished_deepslate_bricks`);
    server.runCommandSilent(`execute in ${targetDim} run fill ${cx+3} ${cy} ${cz-3} ${cx+3} ${cy+3} ${cz+3} minecraft:polished_deepslate_bricks`);
    server.runCommandSilent(`execute in ${targetDim} run setblock ${cx} ${cy+3} ${cz} minecraft:lantern[hanging=true]`);
    server.runCommandSilent(`execute in ${targetDim} run setblock ${cx-2} ${cy} ${cz-2} minecraft:crafting_table`);
    server.runCommandSilent(`execute in ${targetDim} run setblock ${cx+2} ${cy} ${cz-2} minecraft:ender_chest`);
    server.runCommandSilent(`execute in ${targetDim} run setblock ${cx+2} ${cy} ${cz+2} minecraft:anvil`);

    // Teleport player inside personal chamber
    player.teleportTo(targetDim, cx + 0.5, cy, cz + 0.5, 0, 0);
    player.displayClientMessage(Text.of('§5🔮 Вы вошли в личные покои карманного измерения! (.pocket для возврата)'), true);
    server.runCommandSilent(`playsound minecraft:block.portal.travel player ${player.username} ~ ~ ~ 0.8 1.0`);
}

// ------------------------------------------------------------------------------
// COMMAND REGISTRATION & CHAT LISTENERS
// ------------------------------------------------------------------------------
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;
    event.register(
        Commands.literal('pocket')
            .executes(ctx => {
                let player = ctx.source.player;
                if (!player) return 0;
                handlePocketRealmUse(player);
                return 1;
            })
    );
});

// Chat shortcut: ".pocket"
PlayerEvents.chat(event => {
    let msg = event.message.trim().toLowerCase();
    if (msg === '.pocket' || msg === '.карман') {
        event.cancel();
        handlePocketRealmUse(event.player);
    }
});

// Right click item: "kubejs:pocket_key" or tagged pocket key
ItemEvents.rightClicked(event => {
    let item = event.item;
    if (!item) return;
    let id = item.id.toString();
    if (id === 'kubejs:pocket_key' || id.includes('pocket_key')) {
        event.cancel();
        handlePocketRealmUse(event.player);
    }
});
