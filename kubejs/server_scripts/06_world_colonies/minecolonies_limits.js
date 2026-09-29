// ==============================================================================
// 🏛️ ELYRIUM: MINECOLONIES LIMITS & TOWN HALL HARDENING (SUBPHASE 7.4)
// ==============================================================================
// 1. Enforces strict limit: 1 Colony per Player.
// 2. Intercepts TownHall & Supply Camp placement if player already owns a colony.
// 3. Protects Colony & Town Hall boundaries against unauthorized visitors & griefers.
// ==============================================================================

function getPlayerOwnedColoniesCount(player) {
    if (!player) return 0;
    let count = 0;
    try {
        let ColonyManager = Java.loadClass('com.minecolonies.api.colony.IColonyManager').getInstance();
        if (!ColonyManager) return 0;

        let colonies = ColonyManager.getAllColonies();
        if (!colonies) return 0;

        for (let colony of colonies) {
            let perms = colony.getPermissions();
            if (perms) {
                let ownerUUID = perms.getOwnerUUID ? perms.getOwnerUUID() : null;
                if (ownerUUID && ownerUUID.equals(player.uuid)) {
                    count++;
                    continue;
                }
                let ownerName = perms.getOwnerName ? perms.getOwnerName() : '';
                if (ownerName && ownerName.toString().toLowerCase() === player.username.toLowerCase()) {
                    count++;
                }
            }
        }
    } catch (e) {}
    return count;
}

function canPlayerAlterColony(player, colony) {
    if (!player) return false;
    if (player.isCreative()) return true;

    try {
        let perms = colony.getPermissions();
        if (!perms) return false;

        let ownerUUID = perms.getOwnerUUID ? perms.getOwnerUUID() : null;
        if (ownerUUID && ownerUUID.equals(player.uuid)) return true;

        let ownerName = perms.getOwnerName ? perms.getOwnerName() : '';
        if (ownerName && ownerName.toString().toLowerCase() === player.username.toLowerCase()) return true;

        let rank = perms.getRank ? perms.getRank(player) : null;
        if (rank) {
            let rankStr = rank.toString().toLowerCase();
            if (rankStr.includes('owner') || rankStr.includes('officer') || rankStr.includes('friend')) {
                return true;
            }
        }
    } catch (e) {}
    return false;
}

// ------------------------------------------------------------------------------
// 1. ENFORCE 1 COLONY PER PLAYER (BLOCK PLACEMENT & ITEM USE)
// ------------------------------------------------------------------------------
BlockEvents.placed(event => {
    let player = event.player;
    if (!player || player.isCreative()) return;

    let block = event.block;
    let blockId = block.id.toString();

    // Check if placing a Town Hall or Supply Camp block
    if (blockId.includes('blockhuttownhall') || blockId.includes('supplycamp')) {
        let dim = String(event.level.dimension);
        if (!dim.includes('overworld')) {
            event.cancel();
            player.displayClientMessage(Text.of('§c⚠ Колонии разрешено основывать только в Верхнем Мире!'), true);
            return;
        }

        let distSq = block.x * block.x + block.z * block.z;
        if (distSq > 1500 * 1500) {
            event.cancel();
            player.displayClientMessage(Text.of('§c⚠ Колонии разрешено основывать только в Секторе I (R <= 1500 блоков от спавна)!'), true);
            player.server.runCommandSilent(`playsound minecraft:block.chest.locked player ${player.username} ${block.x} ${block.y} ${block.z} 1.0 0.8`);
            return;
        }

        let ownedCount = getPlayerOwnedColoniesCount(player);
        if (ownedCount >= 1) {
            event.cancel();
            player.displayClientMessage(Text.of('§c⚠ У вас уже есть основанная колония! Лимит: 1 колония на правителя.'), true);
            player.server.runCommandSilent(`playsound minecraft:block.chest.locked player ${player.username} ${block.x} ${block.y} ${block.z} 1.0 0.8`);
            return;
        }
    }

    // 2. PROTECT FOREIGN COLONY BOUNDARIES AGAINST PLACEMENT
    try {
        let ColonyManager = Java.loadClass('com.minecolonies.api.colony.IColonyManager').getInstance();
        if (ColonyManager) {
            let colony = ColonyManager.getIColony(event.level.minecraftLevel, block.pos);
            if (colony && !canPlayerAlterColony(player, colony)) {
                event.cancel();
                player.displayClientMessage(Text.of('§c🛡 Территория Ратуши находится под юрисдикцией другого правителя!'), true);
                player.server.runCommandSilent(`playsound minecraft:block.anvil.land player ${player.username} ${block.x} ${block.y} ${block.z} 0.5 1.5`);
            }
        }
    } catch (e) {}
});

// Intercept Supply Camp deployment items
ItemEvents.rightClicked(event => {
    let player = event.player;
    if (!player || player.isCreative()) return;

    let item = event.item;
    if (!item) return;

    let itemId = item.id.toString();
    if (itemId.includes('supplycampplacer') || itemId.includes('supplychestdeployer')) {
        let dim = String(player.level.dimension);
        let distSq = player.x * player.x + player.z * player.z;
        if (!dim.includes('overworld') || distSq > 1500 * 1500) {
            event.cancel();
            player.displayClientMessage(Text.of('§c⚠ Лагерь поселенцев разрешено разворачивать только в Секторе I (R <= 1500 блоков от спавна)!'), true);
            player.server.runCommandSilent(`playsound minecraft:block.chest.locked player ${player.username} ~ ~ ~ 1.0 0.8`);
            return;
        }

        let ownedCount = getPlayerOwnedColoniesCount(player);
        if (ownedCount >= 1) {
            event.cancel();
            player.displayClientMessage(Text.of('§c⚠ У вас уже есть основанная колония! Лимит: 1 колония на правителя.'), true);
            player.server.runCommandSilent(`playsound minecraft:block.chest.locked player ${player.username} ~ ~ ~ 1.0 0.8`);
        }
    }
});

// ------------------------------------------------------------------------------
// 2. PROTECT FOREIGN COLONY BOUNDARIES AGAINST BLOCK BREAKING
// ------------------------------------------------------------------------------
BlockEvents.broken(event => {
    let player = event.player;
    if (!player || player.isCreative()) return;

    let block = event.block;

    try {
        let ColonyManager = Java.loadClass('com.minecolonies.api.colony.IColonyManager').getInstance();
        if (ColonyManager) {
            let colony = ColonyManager.getIColony(event.level.minecraftLevel, block.pos);
            if (colony && !canPlayerAlterColony(player, colony)) {
                event.cancel();
                player.displayClientMessage(Text.of('§c🛡 Территория Ратуши находится под юрисдикцией другого правителя!'), true);
                player.server.runCommandSilent(`playsound minecraft:block.anvil.land player ${player.username} ${block.x} ${block.y} ${block.z} 0.5 1.5`);
            }
        }
    } catch (e) {}
});
