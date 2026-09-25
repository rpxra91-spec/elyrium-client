// KubeJS Script: Dynamic Server Idle & Slow-Motion System
// 1. When all players leave: sets tick rate to 5 (4x slow motion) and freezes raids
// 2. When any player joins: restores tick rate to 20 (normal) and restores raids

ServerEvents.loaded(event => {
    let server = event.server
    let playerCount = server.playerCount
    if (playerCount === 0) {
        server.runCommandSilent('tick rate 5')
        setRaidsEnabled(server, false)
    } else {
        server.runCommandSilent('tick rate 20')
        setRaidsEnabled(server, true)
    }
})

PlayerEvents.loggedIn(event => {
    let server = event.server
    let player = event.player

    // Restore normal tick rate
    server.runCommandSilent('tick rate 20')
    setRaidsEnabled(server, true)

    player.tell(Text.gold('═══════════════════════════════════════════════════════'))
    player.tell(Text.yellow('🌅 Добро пожаловать! Колония просыпается!'))
    player.tell(Text.green('   Нормальное течение времени (20 tps) и события активны.'))
    player.tell(Text.gold('═══════════════════════════════════════════════════════'))
})

PlayerEvents.loggedOut(event => {
    let server = event.server
    
    // We schedule check in 10 ticks (0.5s) to allow disconnect count update
    server.scheduleInTicks(10, () => {
        if (server.playerCount === 0) {
            server.runCommandSilent('tick rate 5')
            setRaidsEnabled(server, false)
            console.log('[Colony-Sleep]: Все игроки вышли. Сервер переведен в режим замедления (тикрейт 5, рейды заморожены).')
        }
    })
})

function setRaidsEnabled(server, enabled) {
    try {
        let ColonyManager = Java.loadClass('com.minecolonies.api.colony.IColonyManager').getInstance()
        if (ColonyManager) {
            server.allLevels.forEach(level => {
                let colonies = ColonyManager.getIColonies(level.minecraftLevel)
                if (colonies) {
                    colonies.forEach(colony => {
                        let raiderMgr = colony.getRaiderManager()
                        if (raiderMgr) {
                            raiderMgr.setCanHaveRaiderEvents(enabled)
                        }
                    })
                }
            })
        }
    } catch (e) {}
}
