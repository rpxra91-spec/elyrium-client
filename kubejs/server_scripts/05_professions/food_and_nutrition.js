// ==============================================================================
// 🍖 ELYRIUM RPG: FOOD & NUTRITION REBALANCE (SUBPHASE 6.5)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// - Eating raw meat (beef, porkchop, mutton, chicken, rabbit, rotten_flesh):
//   * Applies Nausea I (10s = 200 ticks) and Hunger II (15s = 300 ticks).
//   * Warning: '§c🤢 Сырое мясо вызывает сильное несварение! Приготовьте его на костре.'
// - High-tier cooked meals / soups / stews:
//   * Stews / Soups (mushroom_stew, rabbit_stew, beetroot_soup, etc.):
//     Grants Regeneration I (8s) or Absorption I (20s).
// ==============================================================================

const RAW_MEATS = new Set([
    'minecraft:beef',
    'minecraft:porkchop',
    'minecraft:mutton',
    'minecraft:chicken',
    'minecraft:rabbit',
    'minecraft:rotten_flesh'
])

ItemEvents.foodEaten(event => {
    let player = event.player
    let item = event.item
    if (!player || !item) return

    let id = item.id.toLowerCase()

    // 1. Raw Meat indigestion check
    if (RAW_MEATS.has(id)) {
        player.potionEffects.add('minecraft:nausea', 200, 0, false, true)
        player.potionEffects.add('minecraft:hunger', 300, 1, false, true)
        player.tell('§c🤢 Сырое мясо вызывает сильное несварение! Приготовьте его на костре.')
        player.server.runCommandSilent(`playsound minecraft:entity.player.burp player ${player.username} ~ ~ ~ 0.8 0.7`)
        return
    }

    // 2. High-tier meals / soups / stews rewards
    if (id.includes('stew') || id.includes('soup') || id.includes('pie') || id.includes('feast')) {
        player.potionEffects.add('minecraft:regeneration', 160, 0, false, false)
        player.potionEffects.add('minecraft:absorption', 400, 0, false, false)
        player.sendSystemMessage(Text.of('§a🍲 Сытная горячая пища восстанавливает жизненные силы! (+Regeneration)'), true)
    } else if (id === 'minecraft:golden_carrot') {
        player.potionEffects.add('minecraft:regeneration', 100, 0, false, false)
    }
})
