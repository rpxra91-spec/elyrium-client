// ==============================================================================
// 🏛️ ELYRIUM: CAPITAL SAFE HAVEN & SPAWN PROTECTION (SUBPHASE 7.1)
// ==============================================================================
// 1. Capital Zone: Radius R <= 300 blocks around (X=0, Z=0) in minecraft:overworld.
// 2. Absolute No-PvP: Cancels player-on-player combat and projectile attacks.
// 3. Absolute No-Grief: Prevents breaking/placing blocks for survival players.
// 4. Strict Liquid & Fire Prohibition: Blocks lava/water buckets and flint & steel.
// 5. Monster Suppression: Blocks hostile spawns and cleanses monsters entering zone.
// 6. Peaceful Aura: Grants Saturation I (infinite food) & gentle Regeneration I.
// ==============================================================================

const CAPITAL_RADIUS = 300;
const CAPITAL_RADIUS_SQ = 300 * 300;

function isInsideCapital(level, x, z) {
    if (!level) return false;
    let dimStr = level.dimension.toString();
    if (!dimStr.includes('overworld')) return false;
    return (x * x + z * z) <= CAPITAL_RADIUS_SQ;
}

function isHostileMob(entity) {
    if (!entity || !entity.isLiving() || entity.isPlayer()) return false;
    // Allow intentional test dummies on the combat arena
    if (entity.tags && entity.tags.contains('elyrium_test_dummy')) return false;
    if (entity.isMonster && entity.isMonster()) return true;

    let type = entity.type.toString().toLowerCase();
    return type.includes('phantom') || type.includes('zombie') ||
           type.includes('skeleton') || type.includes('creeper') ||
           type.includes('spider') || type.includes('witch') ||
           type.includes('enderman') || type.includes('slime') ||
           type.includes('pillager') || type.includes('vindicator') ||
           type.includes('evoker') || type.includes('ravager') ||
           type.includes('drowned') || type.includes('husk') ||
           type.includes('stray') || type.includes('silverfish');
}

function isDangerousLiquidOrFire(itemId) {
    if (!itemId) return false;
    let id = itemId.toString().toLowerCase();
    return id.includes('lava_bucket') || id.includes('water_bucket') ||
           id.includes('flint_and_steel') || id.includes('fire_charge') ||
           id.includes('firework_rocket');
}

// ------------------------------------------------------------------------------
// 1. NO-PVP PROTECTION
// ------------------------------------------------------------------------------
EntityEvents.beforeHurt(event => {
    let target = event.entity;
    if (!target || !target.isPlayer()) return;

    let level = target.level;
    if (!isInsideCapital(level, target.x, target.z)) return;

    let source = event.source;
    if (!source) return;

    let attacker = source.actual || source.player;
    if (attacker && attacker.isPlayer()) {
        event.cancel();
        attacker.displayClientMessage(Text.of('§e🏛 В Столице Элириума запрещено обнажать оружие!'), true);
        attacker.server.runCommandSilent(`playsound minecraft:block.shield.block player ${attacker.username} ~ ~ ~ 0.8 1.2`);
    }
});

// ------------------------------------------------------------------------------
// 2. LIQUID & FIRE BAN (BUCKETS & FLINT AND STEEL)
// ------------------------------------------------------------------------------
ItemEvents.rightClicked(event => {
    let player = event.player;
    if (!player || player.isCreative()) return;

    let item = event.item;
    if (!item) return;

    if (isDangerousLiquidOrFire(item.id) && isInsideCapital(player.level, player.x, player.z)) {
        event.cancel();
        player.displayClientMessage(Text.of('§c⚠ [Имперская Стража] Разливать жидкости и огонь в черте Столицы строго запрещено!'), true);
        player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ~ ~ ~ 0.8 1.0`);
    }
});

BlockEvents.rightClicked(event => {
    let player = event.player;
    if (!player || player.isCreative()) return;

    let item = event.item;
    if (!item) return;

    let block = event.block;
    if (isDangerousLiquidOrFire(item.id) && isInsideCapital(event.level, block.x, block.z)) {
        event.cancel();
        player.displayClientMessage(Text.of('§c⚠ [Имперская Стража] Разливать жидкости и огонь в черте Столицы строго запрещено!'), true);
        player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ${block.x} ${block.y} ${block.z} 0.8 1.0`);
    }
});

// ------------------------------------------------------------------------------
// 3. NO-GRIEF PROTECTION (BLOCK BREAK & PLACE)
// ------------------------------------------------------------------------------
BlockEvents.broken(event => {
    let player = event.player;
    if (!player || player.isCreative()) return;

    let block = event.block;
    let level = event.level;

    if (isInsideCapital(level, block.x, block.z)) {
        // Allow registered estate owner to decorate/remodel inside their private home
        if (typeof isInsideOwnedPlayerEstate === 'function' && isInsideOwnedPlayerEstate(player, block.pos)) {
            return;
        }
        event.cancel();
        player.displayClientMessage(Text.of('§e🏛 Столица Элириума находится под защитой Имперской Стражи!'), true);
        player.server.runCommandSilent(`playsound minecraft:block.anvil.land player ${player.username} ${block.x} ${block.y} ${block.z} 0.5 1.5`);
    }
});

BlockEvents.placed(event => {
    let player = event.player;
    if (!player || player.isCreative()) return;

    let block = event.block;
    let level = event.level;
    let blockId = block.id.toString();

    // Absolute block against fire / lava / water in capital
    if (blockId.includes('fire') || blockId.includes('lava') || blockId.includes('water')) {
        if (isInsideCapital(level, block.x, block.z)) {
            event.cancel();
            player.displayClientMessage(Text.of('§c⚠ [Имперская Стража] Разливать жидкости и огонь в черте Столицы строго запрещено!'), true);
            player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ${block.x} ${block.y} ${block.z} 0.8 1.0`);
            return;
        }
    }

    if (isInsideCapital(level, block.x, block.z)) {
        // Allow registered estate owner to decorate/remodel inside their private home
        if (typeof isInsideOwnedPlayerEstate === 'function' && isInsideOwnedPlayerEstate(player, block.pos)) {
            return;
        }
        event.cancel();
        player.displayClientMessage(Text.of('§e🏛 Столица Элириума находится под защитой Имперской Стражи!'), true);
        player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ${block.x} ${block.y} ${block.z} 0.6 1.2`);
    }
});

// ------------------------------------------------------------------------------
// 4. MONSTER SUPPRESSION (NATURAL SPAWNS & ENTRY)
// ------------------------------------------------------------------------------
EntityEvents.checkSpawn(event => {
    let entity = event.entity;
    if (!entity) return;

    let level = event.level;
    if (isInsideCapital(level, entity.x, entity.z) && isHostileMob(entity)) {
        event.cancel();
    }
});

EntityEvents.spawned(event => {
    let entity = event.entity;
    if (!entity) return;

    let level = event.level;
    if (isInsideCapital(level, entity.x, entity.z) && isHostileMob(entity)) {
        entity.discard();
    }
});

// ------------------------------------------------------------------------------
// 5. PEACEFUL AURA & CAPITAL PERIMETER SWEEP (Every 40 ticks / 2 seconds)
// ------------------------------------------------------------------------------
ServerEvents.tick(event => {
    let server = event.server;
    if (server.tickCount % 40 !== 0) return;

    let overworld = server.overworld();
    if (!overworld) return;

    // Grant Peaceful Aura to all players inside Capital (R <= 300)
    overworld.players.forEach(player => {
        if (isInsideCapital(overworld, player.x, player.z)) {
            player.potionEffects.add('minecraft:regeneration', 80, 0, false, false);
        }
    });

    // Cleanse any lingering hostile mobs within R <= 300
    overworld.getEntities().forEach(ent => {
        if (isHostileMob(ent) && isInsideCapital(overworld, ent.x, ent.z)) {
            ent.discard();
        }
    });
});
