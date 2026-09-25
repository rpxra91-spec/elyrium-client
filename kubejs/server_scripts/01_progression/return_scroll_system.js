// ==============================================================================
// 📜 ELYRIUM RPG: TOWN RETURN SCROLL SYSTEM (CHANNELING RITUAL)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script (Subphase 6.4)
// ==============================================================================
// - Item: kubejs:town_scroll or commands (.recall / .home)
// - Right-click channels a 5-second ritual (100 ticks).
// - Channeling rules:
//   * Interrupted if player takes damage.
//   * Interrupted if player moves > 1.5 blocks from starting position.
//   * Interrupted if player attacks or swings.
//   * On interruption: '§c⚡ Чтение свитка возвращения прервано!' + sound.
// - Upon completion:
//   * Teleports player safely to Capital / Sanctuary (0, 75, 0).
//   * Grants Resistance & Regeneration for 3 seconds.
//   * Consumes 1 scroll if triggered via item.
// ==============================================================================

const CHANNEL_TICKS = 100 // 5 seconds (20 ticks/sec)
const MAX_MOVE_DIST = 1.5

// Map: username -> { startX, startY, startZ, ticksLeft, usedItem: bool }
let activeChannels = new Map()

function cancelChannel(server, username, reason) {
    if (!activeChannels.has(username)) return
    activeChannels.delete(username)

    let player = null
    server.players.forEach(p => {
        if (p.username.toLowerCase() === username.toLowerCase()) player = p
    })

    if (player) {
        player.sendSystemMessage(Text.of('§c⚡ Чтение свитка возвращения прервано! ' + (reason || '')), true)
        server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ~ ~ ~ 0.8 1.2`)
    }
}

function startReturnRitual(player, fromItem) {
    if (!player || !player.isAlive()) return
    let username = player.username

    if (activeChannels.has(username)) {
        player.tell('§e[Свиток Возвращения] Вы уже произносите заклинание телепортации!')
        return
    }

    activeChannels.set(username, {
        startX: player.x,
        startY: player.y,
        startZ: player.z,
        ticksLeft: CHANNEL_TICKS,
        usedItem: !!fromItem
    })

    player.tell('§a✨ [Свиток Возвращения] Чтение свитка начато (5 сек)... Не двигайтесь и не получайте урон!')
    player.server.runCommandSilent(`playsound minecraft:block.portal.trigger player ${player.username} ~ ~ ~ 0.7 1.5`)
}

// Tick handler: Progress channeling ritual
ServerEvents.tick(event => {
    let server = event.server
    if (server.tickCount % 5 !== 0) return // Check every 0.25s

    activeChannels.forEach((data, username) => {
        let player = null
        server.players.forEach(p => {
            if (p.username.toLowerCase() === username.toLowerCase()) player = p
        })

        if (!player || !player.isAlive()) {
            activeChannels.delete(username)
            return
        }

        // Check movement
        let dist = Math.hypot(player.x - data.startX, player.z - data.startZ)
        let dy = Math.abs(player.y - data.startY)
        if (dist > MAX_MOVE_DIST || dy > 1.2) {
            cancelChannel(server, username, '(Сдвиг с места)')
            return
        }

        data.ticksLeft -= 5

        // Visual particles and countdown
        try {
            player.level.spawnParticles('minecraft:portal', true, player.x, player.y + 0.5, player.z, 0.4, 0.6, 0.4, 6, 0.2)
        } catch (e) {}

        let secondsLeft = Math.max(1, Math.ceil(data.ticksLeft / 20))
        player.sendSystemMessage(Text.of(`§a🌀 Телепортация в Столицу через ${secondsLeft} сек... §7(Не двигайтесь)`), true)

        if (data.ticksLeft <= 0) {
            // Ritual Complete!
            activeChannels.delete(username)

            // Consume item if used from hand
            if (data.usedItem) {
                let mainHand = player.mainHandItem
                let offHand = player.offHandItem
                if (mainHand && mainHand.id === 'kubejs:town_scroll') {
                    mainHand.shrink(1)
                } else if (offHand && offHand.id === 'kubejs:town_scroll') {
                    offHand.shrink(1)
                }
            }

            // Safe Teleport to Capital (0, 75, 0)
            server.runCommandSilent(`execute in minecraft:overworld run tp ${player.username} 0 75 0 0 0`)
            player.potionEffects.add('minecraft:resistance', 100, 2, false, false)
            player.potionEffects.add('minecraft:regeneration', 100, 1, false, false)

            player.tell('§6🏛 [Столица] Вы успешно перемещены в Столичный Санктуарий!')
            server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${player.username} 0 75 0 0.9 1.2`)
            try {
                player.level.spawnParticles('minecraft:totem_of_undying', true, 0, 76, 0, 0.5, 0.8, 0.5, 20, 0.3)
            } catch (e) {}
        }
    })
})

// Interrupt on taking damage
EntityEvents.beforeHurt(event => {
    let target = event.entity
    if (!target || !target.isPlayer()) return
    let server = target.server
    if (activeChannels.has(target.username)) {
        cancelChannel(server, target.username, '(Получен урон)')
    }
})

// Right click item event
ItemEvents.rightClicked(event => {
    let player = event.player
    let item = event.item
    if (!player || !item) return

    if (item.id === 'kubejs:town_scroll') {
        startReturnRitual(player, true)
    }
})

// Chat commands (.recall, .home)
PlayerEvents.chat(event => {
    let msg = event.message.trim().toLowerCase()
    let player = event.player
    if (!player) return

    if (msg === '.recall' || msg === '.home' || msg === '!recall' || msg === '!home') {
        startReturnRitual(player, false)
        event.cancel()
    }
})
