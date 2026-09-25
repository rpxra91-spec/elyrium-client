// KubeJS Server Script: Elyrium Continent 01 Teleport & Commands
const CONTINENT_DIM = 'elyrium:continent_01'

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event

    // Телепорт на Континент I: /elyrium_tp_continent
    event.register(
        Commands.literal('elyrium_tp_continent')
            .requires(src => src.hasPermission(2))
            .executes(ctx => {
                let player = ctx.source.player
                let server = ctx.source.server
                if (!player) return 0

                let level = server.getLevel(CONTINENT_DIM)
                if (!level) {
                    ctx.source.sendFailure(Text.red('Измерение ' + CONTINENT_DIM + ' не найдено!'))
                    return 0
                }

                // Обеспечиваем безопасный спуск/приземление
                player.potionEffects.add('minecraft:resistance', 200, 4, false, false)
                player.potionEffects.add('minecraft:slow_falling', 200, 0, false, true)

                // Ищем высоту поверхности на X=0, Z=0
                let targetY = 140
                player.teleportTo(CONTINENT_DIM, 0, targetY, 0, 0, 0)
                player.tell(Text.gold('✨ Вы перенеслись на Парящий Континент I Вселенной Элириум!'))
                player.tell(Text.aqua('🌤 Добро пожаловать в Расколотые Небеса.'))
                return 1
            })
    )
})
