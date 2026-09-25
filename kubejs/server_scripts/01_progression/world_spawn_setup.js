// ==============================================================================
// 🌍 ELYRIUM: WORLD SPAWN & CAPITAL ENTRY COORDINATOR (KUBEJS 1.21.1)
// ==============================================================================
// - Sets default world spawn to Capital Center: X = 0, Y = 75, Z = 0.
// - Greets joining and new players with Grand Capital Welcome Title & Subtitle.
// - Grants slow falling and resistance to safely land on capital terrain.
// ==============================================================================

ServerEvents.loaded(event => {
    event.server.runCommandSilent('setworldspawn 0 75 0')
})

PlayerEvents.loggedIn(event => {
    let player = event.player
    let server = player.server

    // First login teleport to capital center
    if (!player.persistentData.getBoolean('skd_spawn_initialized')) {
        player.persistentData.putBoolean('skd_spawn_initialized', true)
        server.runCommandSilent('tp ' + player.username + ' 0 75 0 0 0')
        server.runCommandSilent('effect give ' + player.username + ' minecraft:slow_falling 5 1 true')
        server.runCommandSilent('effect give ' + player.username + ' minecraft:resistance 5 4 true')
    }

    // Grand welcome title and audio fanfare
    server.runCommandSilent('title ' + player.username + ' times 20 80 20')
    server.runCommandSilent('title ' + player.username + ' title {"text":"§6🏛 ВЕЛИКАЯ СТОЛИЦА ЭЛИРИУМА 🏛"}')
    server.runCommandSilent('title ' + player.username + ' subtitle {"text":"§aБезопасная гавань торговли и паломников"}')
    server.runCommandSilent('playsound minecraft:ui.toast.challenge_complete player ' + player.username + ' ~ ~ ~ 0.8 1.0')

    player.tell('§6========================================================')
    player.tell('§6🏛 ДОБРО ПОЖАЛОВАТЬ В ВЕЛИКУЮ СТОЛИЦУ ЭЛИРИУМА! 🏛')
    player.tell('§aБезопасная гавань торговли, ремесел и паломников.')
    player.tell('§eЗдесь запрещены сражения и разрушения под защитой Имперской Стражи.')
    player.tell('§b⭐ Нажмите §e[K]§b, чтобы открыть Созвездия Элириума (Древо Навыков).')
    player.tell('§6========================================================')
})
