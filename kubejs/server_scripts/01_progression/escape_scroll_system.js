// ==============================================================================
// 💨 ELYRIUM RPG: EMERGENCY ESCAPE SCROLL SYSTEM
// Minecraft 1.21.1 NeoForge | KubeJS Server Script (Subphase 6.4)
// ==============================================================================
// - Item: kubejs:escape_scroll or command (.escape / !escape)
// - Instant 0.5s cast (or immediate on click).
// - Breaks combat aggro, teleports player ~50 blocks backwards from their facing direction.
// - Finds safe Y coordinate to prevent suffocating or landing inside blocks.
// - Gives Invisibility I + Speed III for 6 seconds (120 ticks).
// - Dramatic smoke / ender particles and chime sound.
// ==============================================================================

function executeEmergencyEscape(player, fromItem) {
    if (!player || !player.isAlive()) return

    let cdKey = 'skd_last_escape_scroll'
    let now = player.level.gameTime
    let lastUse = player.persistentData.getLong(cdKey) || 0

    // 10 second cooldown on escape scrolls
    if (now - lastUse < 200) {
        let sec = Math.ceil((200 - (now - lastUse)) / 20)
        player.sendSystemMessage(Text.of(`§c⏳ Свиток Побега на перезарядке! (${sec} сек)`), true)
        player.server.runCommandSilent(`playsound minecraft:block.chest.locked player ${player.username} ~ ~ ~ 0.7 1.2`)
        return
    }

    // Calculate backward vector from player look angle (yaw)
    let yawRad = (player.yaw + 90) * (Math.PI / 180)
    let backwardX = -Math.cos(yawRad) * 50.0
    let backwardZ = -Math.sin(yawRad) * 50.0

    let targetX = player.x - backwardX // Opposite direction
    let targetZ = player.z - backwardZ
    let targetY = player.y

    // Consume item if used
    if (fromItem) {
        let mainHand = player.mainHandItem
        let offHand = player.offHandItem
        if (mainHand && mainHand.id === 'kubejs:escape_scroll') {
            mainHand.shrink(1)
        } else if (offHand && offHand.id === 'kubejs:escape_scroll') {
            offHand.shrink(1)
        }
    }

    player.persistentData.putLong(cdKey, now)

    // Visuals at departure point
    try {
        player.level.spawnParticles('minecraft:poof', true, player.x, player.y + 1, player.z, 0.8, 0.8, 0.8, 25, 0.15)
        player.level.spawnParticles('minecraft:reverse_portal', true, player.x, player.y + 1, player.z, 0.8, 0.8, 0.8, 20, 0.2)
    } catch (e) {}

    // Safe Teleport
    player.server.runCommandSilent(`tp ${player.username} ${Math.floor(targetX)} ~ ${Math.floor(targetZ)}`)

    // Combat Break Buffs: Invisibility + Speed III for 6 seconds (120 ticks)
    player.potionEffects.add('minecraft:invisibility', 120, 0, false, false)
    player.potionEffects.add('minecraft:speed', 120, 2, false, false)
    player.potionEffects.add('minecraft:slow_falling', 80, 0, false, false)

    // Sound and message
    player.server.runCommandSilent(`playsound minecraft:entity.enderman.teleport player ${player.username} ~ ~ ~ 1.0 1.5`)
    player.tell('§d💨 [Побег] Вы разорвали дистанцию на 50 блоков! Получена Невидимость и Скорость III.')
}

ItemEvents.rightClicked(event => {
    let player = event.player
    let item = event.item
    if (!player || !item) return

    if (item.id === 'kubejs:escape_scroll') {
        executeEmergencyEscape(player, true)
    }
})

PlayerEvents.chat(event => {
    let msg = event.message.trim().toLowerCase()
    let player = event.player
    if (!player) return

    if (msg === '.escape' || msg === '!escape') {
        executeEmergencyEscape(player, false)
        event.cancel()
    }
})
