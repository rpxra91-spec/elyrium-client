// ==============================================================================
// 💎 ELYRIUM RPG: DIAMOND MINING BARRIER (STEEL PICKAXE REQUIREMENT)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// Progression Rule:
// - Diamond Ore & Deepslate Diamond Ore require Steel Pickaxe (kubejs:steel_pickaxe)
//   or higher tier (Diamond, Netherite, Astral, Halite, etc.).
// - Mining with wood, stone, gold, iron, copper yields NO drops and prevents break,
//   displaying warning message:
//   "Алмазная порода слишком крепка для железа! Требуется прочность Стальной кирки."
// ==============================================================================

const DIAMOND_ORES = new Set([
    'minecraft:diamond_ore',
    'minecraft:deepslate_diamond_ore'
]);

const DISALLOWED_PICKAXE_SUBSTRINGS = [
    'wood',
    'stone',
    'gold',
    'iron',
    'copper',
    'flint',
    'bone'
];

BlockEvents.broken(event => {
    let block = event.block;
    if (!block || !DIAMOND_ORES.has(String(block.id))) return;

    let player = event.player;
    if (!player || player.isCreative()) return;

    let mainHand = player.mainHandItem;
    let isPermittedTool = false;

    if (mainHand && !mainHand.isEmpty()) {
        let itemId = String(mainHand.id);

        // 1. Стальная кирка Элириума — прямой канонический ключ к алмазам
        if (itemId === 'kubejs:steel_pickaxe') {
            isPermittedTool = true;
        } else if (mainHand.hasTag('minecraft:pickaxes') || mainHand.hasTag('c:tools/pickaxes')) {
            // 2. Проверяем, не является ли кирка низкотировой (дерево, камень, золото, железо, медь)
            let isLowTier = false;
            for (let sub of DISALLOWED_PICKAXE_SUBSTRINGS) {
                if (itemId.includes(sub) && !itemId.includes('steel')) {
                    isLowTier = true;
                    break;
                }
            }

            if (!isLowTier) {
                // Разрешаем алмазные, незеритовые, скалк, астральные и божественные кирки
                if (itemId.includes('diamond') ||
                    itemId.includes('netherite') ||
                    itemId.includes('cinder') ||
                    itemId.includes('modular_omni') ||
                    itemId.includes('starlight') ||
                    itemId.includes('warden') ||
                    itemId.includes('eden') ||
                    itemId.includes('halite')) {
                    isPermittedTool = true;
                }
            }
        }
    }

    if (!isPermittedTool) {
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
