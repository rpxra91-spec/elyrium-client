// ==============================================================================
// 🤝 ELYRIUM RPG: SECURE PLAYER TRADE SYSTEM (ESCROW STATE MACHINE)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script (Subphase 6.3)
// ==============================================================================
// - Trigger: Shift + Right-Click on another player or `.trade <player>` / `/trade <player>`
// - Sends trade invitation with prompt:
//   '§6🤝 [Торговля]: Игрок <name> предлагает безопасную сделку. Введите .trade accept'
// - Interactive escrow state machine:
//   * Phase 1: Invitation & Acceptance (locks both players with slowness).
//   * Phase 2: Offering items via `.offer` (takes item in main hand into escrow).
//   * Phase 3: Summary display with item descriptions and counts.
//   * Phase 4: Confirmation via `.confirm` or `.trade accept`.
//   * Completion: Swaps items safely directly into inventories (`player.give()`).
//   * Cancellation: `.cancel` returns escrowed items safely to original owners.
// ==============================================================================

// Session structure:
// sessionId -> {
//   p1: username, p2: username,
//   p1Item: ItemStack or null, p2Item: ItemStack or null,
//   p1Ready: bool, p2Ready: bool,
//   state: 'OFFERING' | 'CONFIRMING'
// }
let activeTrades = new Map()
let tradeInvites = new Map() // targetUsername -> inviterUsername

function getPlayerByName(server, name) {
    if (!name) return null
    let found = null
    server.players.forEach(p => {
        if (p.username.toLowerCase() === name.toLowerCase()) {
            found = p
        }
    })
    return found
}

function cancelTrade(server, username, reason) {
    let sessionKey = null
    let session = null

    activeTrades.forEach((sess, key) => {
        if (sess.p1.toLowerCase() === username.toLowerCase() || sess.p2.toLowerCase() === username.toLowerCase()) {
            sessionKey = key
            session = sess
        }
    })

    if (!session) return

    let p1 = getPlayerByName(server, session.p1)
    let p2 = getPlayerByName(server, session.p2)

    // Return escrow items safely
    if (session.p1Item && p1) {
        p1.give(session.p1Item)
    }
    if (session.p2Item && p2) {
        p2.give(session.p2Item)
    }

    // Clear slowness
    if (p1) {
        p1.potionEffects.remove('minecraft:slowness')
        p1.tell(`§c[Торговля] Сделка отменена: ${reason || 'Игрок прервал обмен.'}`)
        server.runCommandSilent(`playsound minecraft:block.chest.close player ${p1.username} ~ ~ ~ 0.8 1.0`)
    }
    if (p2) {
        p2.potionEffects.remove('minecraft:slowness')
        p2.tell(`§c[Торговля] Сделка отменена: ${reason || 'Игрок прервал обмен.'}`)
        server.runCommandSilent(`playsound minecraft:block.chest.close player ${p2.username} ~ ~ ~ 0.8 1.0`)
    }

    activeTrades.delete(sessionKey)
}

function startTradeInvite(inviter, target) {
    if (!inviter || !target || inviter.username === target.username) {
        inviter.tell('§c[Торговля] Нельзя торговать с самим собой!')
        return
    }

    let dist = Math.hypot(inviter.x - target.x, inviter.z - target.z)
    if (dist > 6.0) {
        inviter.tell('§c[Торговля] Игрок находится слишком далеко (макс. 6 блоков)!')
        return
    }

    tradeInvites.set(target.username.toLowerCase(), inviter.username)

    inviter.tell(`§6🤝 [Торговля]: Предложение сделки отправлено игроку §e${target.username}§6.`)
    target.tell(`§6🤝 [Торговля]: Игрок §e${inviter.username} §6предлагает безопасную сделку.`)
    target.tell(`§aВведите §f.trade accept §aили §f.trade ${inviter.username} §aдля согласия, либо §c.cancel§a.`)

    target.server.runCommandSilent(`playsound minecraft:entity.experience_orb.pickup player ${target.username} ~ ~ ~ 0.9 1.2`)
}

function acceptTradeInvite(target) {
    let inviterName = tradeInvites.get(target.username.toLowerCase())
    if (!inviterName) {
        target.tell('§c[Торговля] У вас нет активных предложений обмена.')
        return
    }

    let inviter = getPlayerByName(target.server, inviterName)
    tradeInvites.delete(target.username.toLowerCase())

    if (!inviter || !inviter.isAlive()) {
        target.tell('§c[Торговля] Игрок не найден или не в сети.')
        return
    }

    let dist = Math.hypot(inviter.x - target.x, inviter.z - target.z)
    if (dist > 7.0) {
        target.tell('§c[Торговля] Игрок отошёл слишком далеко!')
        inviter.tell('§c[Торговля] Игрок отошёл слишком далеко!')
        return
    }

    let sessionKey = `${inviter.username.toLowerCase()}_${target.username.toLowerCase()}`
    let session = {
        p1: inviter.username,
        p2: target.username,
        p1Item: null,
        p2Item: null,
        p1Ready: false,
        p2Ready: false,
        state: 'OFFERING'
    }

    activeTrades.set(sessionKey, session)

    // Lock players in place
    inviter.potionEffects.add('minecraft:slowness', 1200, 4, false, false)
    target.potionEffects.add('minecraft:slowness', 1200, 4, false, false)

    let introMsg = '§6🤝 ==================== БЕЗОПАСНАЯ СДЕЛКА ====================\n' +
                   '§eСессия открыта! Вы зафиксированы на месте на время сделки.\n' +
                   '§f1. Возьмите предмет в руку и напишите §a.offer §f(или §a.offer 0 §fесли отдаете без предмета).\n' +
                   '§f2. После выставления предметов напишите §6.confirm §fдля подтверждения.\n' +
                   '§f3. Для отмены сделки в любой момент напишите §c.cancel§f.\n' +
                   '§6============================================================='

    inviter.tell(introMsg)
    target.tell(introMsg)

    inviter.server.runCommandSilent(`playsound minecraft:block.chest.open player ${inviter.username} ~ ~ ~ 0.8 1.0`)
    target.server.runCommandSilent(`playsound minecraft:block.chest.open player ${target.username} ~ ~ ~ 0.8 1.0`)
}

function offerTradeItem(player, session) {
    let isP1 = session.p1.toLowerCase() === player.username.toLowerCase()
    let mainHand = player.mainHandItem

    if (!mainHand || mainHand.isEmpty()) {
        player.tell('§e[Торговля] У вас в руке пусто. Вы подтвердили предложение без предметов.')
        if (isP1) {
            session.p1Item = null
            session.p1Ready = true
        } else {
            session.p2Item = null
            session.p2Ready = true
        }
    } else {
        let offered = mainHand.copy()
        mainHand.setCount(0) // Remove from hand into escrow
        if (isP1) {
            session.p1Item = offered
            session.p1Ready = true
        } else {
            session.p2Item = offered
            session.p2Ready = true
        }
        player.tell(`§a[Торговля] Предмет добавлен в сделку: §f${offered.count}x ${offered.displayName.string || offered.id}`)
    }

    let p1 = getPlayerByName(player.server, session.p1)
    let p2 = getPlayerByName(player.server, session.p2)

    // Check if both offered
    if (session.p1Ready && session.p2Ready) {
        session.state = 'CONFIRMING'
        session.p1Ready = false
        session.p2Ready = false

        let p1ItemName = session.p1Item ? `§e${session.p1Item.count}x ${session.p1Item.displayName.string || session.p1Item.id}` : '§7(Ничего)'
        let p2ItemName = session.p2Item ? `§e${session.p2Item.count}x ${session.p2Item.displayName.string || session.p2Item.id}` : '§7(Ничего)'

        let summary = `§6📜 [УСЛОВИЯ ОБМЕНА]:\n` +
                      `§b${session.p1} §fотдает: ${p1ItemName}\n` +
                      `§b${session.p2} §fотдает: ${p2ItemName}\n` +
                      `§eОба игрока должны написать §a.confirm §eдля завершения обмена.`

        if (p1) p1.tell(summary)
        if (p2) p2.tell(summary)

        player.server.runCommandSilent(`playsound minecraft:block.note_block.bell player ${session.p1} ~ ~ ~ 0.9 1.0`)
        player.server.runCommandSilent(`playsound minecraft:block.note_block.bell player ${session.p2} ~ ~ ~ 0.9 1.0`)
    } else {
        let otherName = isP1 ? session.p2 : session.p1
        let other = getPlayerByName(player.server, otherName)
        player.tell(`§7Ожидание предложения от партнера §e${otherName}§7...`)
        if (other) other.tell(`§bПартнер §e${player.username} §bвыставил предложение. Напишите §a.offer §bв чат!`)
    }
}

function confirmTradeItem(player, session) {
    let isP1 = session.p1.toLowerCase() === player.username.toLowerCase()
    if (isP1) {
        session.p1Ready = true
    } else {
        session.p2Ready = true
    }

    player.tell('§a[Торговля] Вы подтвердили сделку! Ожидание согласия партнера...')

    let p1 = getPlayerByName(player.server, session.p1)
    let p2 = getPlayerByName(player.server, session.p2)

    if (session.p1Ready && session.p2Ready) {
        // Execute safe exchange
        if (session.p1Item && p2) {
            p2.give(session.p1Item)
        }
        if (session.p2Item && p1) {
            p1.give(session.p2Item)
        }

        if (p1) {
            p1.potionEffects.remove('minecraft:slowness')
            p1.tell('§a✨ [Торговля] Сделка успешно завершена! Предметы перемещены в инвентарь.')
            player.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${p1.username} ~ ~ ~ 0.8 1.4`)
        }
        if (p2) {
            p2.potionEffects.remove('minecraft:slowness')
            p2.tell('§a✨ [Торговля] Сделка успешно завершена! Предметы перемещены в инвентарь.')
            player.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${p2.username} ~ ~ ~ 0.8 1.4`)
        }

        let sessionKey = `${session.p1.toLowerCase()}_${session.p2.toLowerCase()}`
        activeTrades.delete(sessionKey)
    }
}

// 1. Shift + Right Click on another player trigger
ItemEvents.entityInteracted(event => {
    let player = event.player
    let target = event.target
    if (!player || !target || !target.isPlayer()) return
    if (!player.isShiftKeyDown()) return

    startTradeInvite(player, target)
    event.cancel()
})

// 2. Chat command triggers (.trade, .offer, .confirm, .cancel)
PlayerEvents.chat(event => {
    let msg = event.message.trim()
    let lower = msg.toLowerCase()
    let player = event.player
    let server = player.server

    if (!lower.startsWith('.') && !lower.startsWith('/trade')) return

    // Cancel command
    if (lower === '.cancel' || lower === '.trade cancel') {
        cancelTrade(server, player.username, 'Игрок отменил сделку.')
        event.cancel()
        return
    }

    // Trade invite / accept command
    if (lower === '.trade accept' || lower === '.accept') {
        acceptTradeInvite(player)
        event.cancel()
        return
    }

    if (lower.startsWith('.trade ') || lower.startsWith('/trade ')) {
        let parts = msg.split(' ')
        if (parts.length >= 2) {
            let targetName = parts[1]
            if (targetName.toLowerCase() === 'accept') {
                acceptTradeInvite(player)
            } else if (targetName.toLowerCase() === 'cancel') {
                cancelTrade(server, player.username, 'Игрок отменил сделку.')
            } else {
                let target = getPlayerByName(server, targetName)
                if (target) {
                    startTradeInvite(player, target)
                } else {
                    player.tell(`§c[Торговля] Игрок ${targetName} не найден.`)
                }
            }
        }
        event.cancel()
        return
    }

    // Check if player is currently in an active trade
    let currentSession = null
    activeTrades.forEach(sess => {
        if (sess.p1.toLowerCase() === player.username.toLowerCase() || sess.p2.toLowerCase() === player.username.toLowerCase()) {
            currentSession = sess
        }
    })

    if (!currentSession) return

    if (lower.startsWith('.offer')) {
        if (currentSession.state !== 'OFFERING') {
            player.tell('§e[Торговля] Предметы уже выставлены. Для подтверждения напишите §a.confirm§e.')
        } else {
            offerTradeItem(player, currentSession)
        }
        event.cancel()
        return
    }

    if (lower === '.confirm' || lower === '.trade confirm') {
        if (currentSession.state !== 'CONFIRMING') {
            player.tell('§e[Торговля] Сначала выставьте предложение через §a.offer§e.')
        } else {
            confirmTradeItem(player, currentSession)
        }
        event.cancel()
        return
    }
})

// Safe clean up if player disconnects or dies during trade
PlayerEvents.loggedOut(event => {
    if (event.player) {
        cancelTrade(event.player.server, event.player.username, 'Партнер отключился от сервера.')
    }
})

EntityEvents.death(event => {
    let entity = event.entity
    if (entity && entity.isPlayer()) {
        cancelTrade(entity.server, entity.username, 'Партнер погиб.')
    }
})
