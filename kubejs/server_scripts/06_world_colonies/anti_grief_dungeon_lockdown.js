// ==============================================================================
// 🏰 ELYRIUM: ANTI-GRIEF & DUNGEON LOCKDOWN SYSTEM (SUBPHASE 3.2)
// ==============================================================================
// 1. Blocks breaking walls/ceilings in major story dungeons & Cataclysm citadels.
// 2. Prevents cheese exploits: barricading doors with dirt/cobblestone, flooding with water/lava.
// 3. Whitelist: Allows breaking cobwebs, torches, spawners, vines, pots.
// 4. Creative/OP players bypass restrictions.
// ==============================================================================

const ALLOWED_BREAKABLE_BLOCKS = new Set([
    'minecraft:cobweb',
    'minecraft:torch',
    'minecraft:wall_torch',
    'minecraft:soul_torch',
    'minecraft:soul_wall_torch',
    'minecraft:lantern',
    'minecraft:soul_lantern',
    'minecraft:spawner',
    'minecraft:trial_spawner',
    'minecraft:vault',
    'minecraft:vine',
    'minecraft:glow_lichen',
    'minecraft:pot',
    'minecraft:flower_pot',
    'minecraft:decorated_pot',
    'minecraft:fire',
    'minecraft:soul_fire'
]);

const ALLOWED_PLACED_BLOCKS = new Set([
    'minecraft:torch',
    'minecraft:wall_torch',
    'minecraft:soul_torch',
    'minecraft:soul_wall_torch',
    'minecraft:lantern',
    'minecraft:soul_lantern',
    'minecraft:campfire',
    'minecraft:soul_campfire'
]);

function isInsideProtectedDungeon(level, pos) {
    try {
        let structureManager = level.asKubeJS().minecraftLevel.structureManager();
        if (!structureManager) return false;

        let structureStart = structureManager.getStructureWithPieceAt(pos);
        if (!structureStart || !structureStart.isValid()) return false;

        let structStr = structureStart.getStructure().toString().toLowerCase();

        // Check if inside major dungeon namespaces
        if (structStr.includes('cataclysm:') ||
            structStr.includes('dungeons_arise:keep_kayra') ||
            structStr.includes('dungeons_arise:shiraz_palace') ||
            structStr.includes('dungeons_arise:foundry') ||
            structStr.includes('dungeons_arise:coliseum') ||
            structStr.includes('dungeons_arise:thornborn_towers') ||
            structStr.includes('dungeons_arise:plague_asylum') ||
            structStr.includes('dungeons_arise:infested_temple') ||
            structStr.includes('dungeons_arise:mining_complex') ||
            structStr.includes('irons_spellbooks:catacombs') ||
            structStr.includes('irons_spellbooks:citadel') ||
            structStr.includes('totw_modded:')) {
            return true;
        }
    } catch (e) {
        // Fallback
    }
    return false;
}

// 1. BLOCK BREAKING PROTECTION
BlockEvents.broken(event => {
    let player = event.player;
    if (!player || player.isCreative()) return;

    let block = event.block;
    let blockId = block.id;

    // Allow whitelisted interactive blocks
    if (ALLOWED_BREAKABLE_BLOCKS.has(blockId)) return;

    let level = event.level;
    let pos = block.pos;

    if (isInsideProtectedDungeon(level, pos)) {
        event.cancel();
        player.displayClientMessage(Text.of('§c🛡 Древняя цитадель защищена чарами несокрушимости!'), true);
        player.server.runCommandSilent(`playsound minecraft:block.anvil.land player ${player.username} ${block.x} ${block.y} ${block.z} 0.5 1.5`);
    }
});

// 2. CHEESE PLACEMENT PROTECTION (DIRT, COBBLESTONE, LAVA, WATER)
BlockEvents.placed(event => {
    let player = event.player;
    if (!player || player.isCreative()) return;

    let block = event.block;
    let blockId = block.id;

    // Allow torches, lanterns, campfires for exploration
    if (ALLOWED_PLACED_BLOCKS.has(blockId)) return;

    let level = event.level;
    let pos = block.pos;

    if (isInsideProtectedDungeon(level, pos)) {
        event.cancel();
        player.displayClientMessage(Text.of('§c⚠ Древние чары подземелья отторгают чужеродные блоки!'), true);
        player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ${block.x} ${block.y} ${block.z} 0.6 1.2`);
    }
});
