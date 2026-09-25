// ==============================================================================
// 🛠 ELYRIUM RPG: REAL DATA COMPONENTS CRAFTING & COOKING ENGINE
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================

// ------------------------------------------------------------------------------
// 1. CRAFTING: BLACKSMITH & CHEF MARKS
// ------------------------------------------------------------------------------
ItemEvents.crafted(event => {
    let player = event.player
    let item = event.item
    if (!player || !item) return

    let tags = player.tags
    if (!tags) return

    let itemId = String(item.id).toLowerCase()

    // Note: Equipment durability & Masterwork crafting are handled by craftsman_mechanics.js

    // --- B. COOKING & PREPARED MEALS (Excludes plain smelted meats/potatoes) ---
    const PLAIN_SMELTED = new Set([
        'minecraft:cooked_beef', 'minecraft:cooked_porkchop', 'minecraft:cooked_mutton',
        'minecraft:cooked_chicken', 'minecraft:cooked_rabbit', 'minecraft:cooked_salmon',
        'minecraft:cooked_cod', 'minecraft:baked_potato', 'minecraft:dried_kelp'
    ])

    let isComplexDish = (itemId.includes('stew') || itemId.includes('soup') || itemId.includes('pie') ||
                         itemId.includes('salad') || itemId.includes('feast') || itemId.includes('roast') ||
                         itemId.includes('sandwich') || itemId.includes('burger')) && !PLAIN_SMELTED.has(itemId)

    if (isComplexDish) {
        let hasBasicCook = tags.contains('skill_cook_saturation_1')
        let hasMasterChef = tags.contains('skill_alchemist_food_saturation')

        if (hasBasicCook || hasMasterChef) {
            let satBonus = hasMasterChef ? 2 : 1
            let newLore = [
                Text.of('§6🍲 Приготовлено Поваром-Кулинаром'),
                Text.of(`§eПитательность: §a+${satBonus * 15}% Сытности`)
            ]
            item.setLore(newLore)
        }
    }
})

// ------------------------------------------------------------------------------
// 2. FOOD EATEN: SCALED NUTRITION BY DISH TIER
// ------------------------------------------------------------------------------
ItemEvents.foodEaten(event => {
    let player = event.player
    let item = event.item
    if (!player || !item) return

    let tags = player.tags
    let bonusSat = 0

    if (tags) {
        if (tags.contains('skill_alchemist_food_saturation')) bonusSat += 2
        else if (tags.contains('skill_cook_saturation_1')) bonusSat += 1
    }

    if (bonusSat > 0) {
        let itemId = String(item.id).toLowerCase()
        let durationTicks = 30

        // Scale by dish complexity so simple cookies don't outclass stews
        if (itemId.includes('stew') || itemId.includes('soup') || itemId.includes('feast') || itemId.includes('pie')) {
            durationTicks = 20 * (bonusSat * 2) // Hearty meals give substantial saturation
            player.sendSystemMessage(Text.of('§6🍲 Горячее сытное блюдо насыщает на долгое время!'), true)
        } else {
            durationTicks = 20 * bonusSat // Simple food gives slight boost
        }

        player.potionEffects.add('minecraft:saturation', durationTicks, 0, false, false)
    }
})
