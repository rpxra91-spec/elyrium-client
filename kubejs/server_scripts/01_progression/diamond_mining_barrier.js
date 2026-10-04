// ==============================================================================
// 💎 ELYRIUM RPG: DIAMOND MINING BARRIER (STEEL PICKAXE REQUIREMENT)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// Progression Rule:
// - Diamond Ore & Deepslate Diamond Ore require Steel Pickaxe (kubejs:steel_pickaxe)
//   or higher tier (Diamond, Netherite, Undergarden, Aether, Starlight, DivineRPG, etc.).
// - Mining with wood, stone, gold, iron, copper, flint, bone, or non-pickaxe yields NO drops
//   and cancels break, displaying warning message:
//   "Алмазная порода слишком крепка для железа! Требуется прочность Стальной кирки."
// ==============================================================================

const DIAMOND_ORES = new Set([
    'minecraft:diamond_ore',
    'minecraft:deepslate_diamond_ore'
]);

const LOW_TIER_PICKAXE_SUBSTRINGS = [
    'wood',
    'stone',
    'gold',
    'golden',
    'iron',
    'copper',
    'flint',
    'bone',
    'leather'
];

function isDiamondOreBlock(block) {
    if (!block) return false;
    let bId = String(block.id);
    if (DIAMOND_ORES.has(bId)) return true;
    if (block.hasTag && (block.hasTag('c:ores/diamond') || block.hasTag('minecraft:diamond_ores'))) return true;
    return false;
}

function isPermittedDiamondMiningTool(mainHand) {
    if (!mainHand || mainHand.isEmpty()) return false;
    let itemId = String(mainHand.id).toLowerCase();

    // 1. Стальная Кирка Элириума — прямой канонический пропуск к алмазам
    if (itemId === 'kubejs:steel_pickaxe') return true;

    // 2. Инструмент обязан быть киркой
    let isPickaxe = false;
    if (mainHand.hasTag) {
        if (mainHand.hasTag('minecraft:pickaxes') ||
            mainHand.hasTag('c:tools/pickaxes') ||
            mainHand.hasTag('c:pickaxes') ||
            mainHand.hasTag('forge:tools/pickaxes')) {
            isPickaxe = true;
        }
    }
    if (!isPickaxe && itemId.includes('pickaxe')) {
        isPickaxe = true;
    }

    if (!isPickaxe) return false;

    // 3. Отсекаем низкотировые кирки (дерево, камень, золото, железо, медь и т.д.)
    let isLowTier = false;
    for (let sub of LOW_TIER_PICKAXE_SUBSTRINGS) {
        if (itemId.includes(sub) && !itemId.includes('steel')) {
            isLowTier = true;
            break;
        }
    }

    // Все кирки равного или более высокого тира (Diamond, Netherite, Cinder, Aether, Undergarden, DivineRPG...) разрешены
    return !isLowTier;
}

BlockEvents.broken(event => {
    let block = event.block;
    if (!isDiamondOreBlock(block)) return;

    let player = event.player;
    if (!player || player.isCreative()) return;

    let mainHand = player.mainHandItem;
    let isPermitted = isPermittedDiamondMiningTool(mainHand);

    if (!isPermitted) {
        event.cancel();

        let bx = block.x;
        let by = block.y;
        let bz = block.z;

        player.displayClientMessage(Text.of('§c⚠ [Твердость Породы] §7Алмазная порода слишком крепка для железа! Требуется прочность §fСтальной кирки§7.'), true);
        player.sendSystemMessage(Text.of('§c⚠ [Твердость Породы] §7Алмазная порода слишком крепка для железа! Требуется прочность §fСтальной кирки§7. Выплавьте сталь в Доменной Печи!'));

        player.server.runCommandSilent(`playsound minecraft:block.anvil.land player ${player.username} ${bx} ${by} ${bz} 0.6 1.6`);
        player.server.runCommandSilent(`particle minecraft:crit ${bx + 0.5} ${by + 0.5} ${bz + 0.5} 0.3 0.3 0.3 0.1 15`);
    }
});
