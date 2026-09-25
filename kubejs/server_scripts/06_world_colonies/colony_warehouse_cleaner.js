// KubeJS Script: MineColonies Warehouse Limits & Automatic Cleaner
// Allows players to configure warehouse limits for items directly in game via chest GUI or commands
// Web Dashboard exporter for real-time visualization

const CONFIG_PATH = 'config/colony_warehouse_limits.json'

function loadLimits() {
    let map = {}
    try {
        let f = new java.io.File(CONFIG_PATH)
        if (f.exists()) {
            let str = java.nio.file.Files.readString(f.toPath())
            map = JSON.parse(str)
        }
    } catch (e) {}

    if (Object.keys(map).length === 0) {
        // Sensible defaults in STACKS
        map = {
            'minecraft:poisonous_potato': 0, // 0 = trash, discard immediately
            'minecraft:wheat_seeds': 2,
            'minecraft:beetroot_seeds': 1,
            'minecraft:melon_seeds': 1,
            'minecraft:pumpkin_seeds': 1,
            'minecraft:rotten_flesh': 1,
            'minecraft:gravel': 4,
            'minecraft:flint': 2,
            'minecraft:cobblestone': 12,
            'minecraft:dirt': 12,
            'minecraft:diorite': 3,
            'minecraft:andesite': 3,
            'minecraft:granite': 3,
            'minecraft:tuff': 3
        }
    }
    return map
}

function saveLimits(limits) {
    try {
        let f = new java.io.File(CONFIG_PATH)
        let str = JSON.stringify(limits, null, 2)
        java.nio.file.Files.writeString(f.toPath(), str)
    } catch (e) {}
}

function purgeWarehouse(level, colony, limits) {
    let buildings = colony.getServerBuildingManager() ? colony.getServerBuildingManager().getBuildings() : null
    if (!buildings) return 0

    let totalRemoved = 0

    for (let b of buildings.values()) {
        let type = b.getBuildingType ? String(b.getBuildingType()) : ''
        let className = b.class ? String(b.class.simpleName) : ''
        if (type.includes('warehouse') || className.includes('WareHouse')) {
            let tile = b.getTileEntity ? b.getTileEntity() : null
            if (!tile) continue

            for (let itemId in limits) {
                let maxStacks = limits[itemId]
                let maxItems = maxStacks * 64

                try {
                    let matching = tile.getMatchingItemStacksInWarehouse(stack => stack.id.toString() === itemId)
                    if (matching && !matching.isEmpty()) {
                        let currentCount = 0
                        for (let tuple of matching) {
                            let itemStack = tuple.getFirst()
                            if (itemStack) currentCount += itemStack.getCount()
                        }

                        if (currentCount > maxItems) {
                            let needToRemove = currentCount - maxItems
                            for (let tuple of matching) {
                                if (needToRemove <= 0) break
                                let itemStack = tuple.getFirst()
                                if (itemStack && itemStack.getCount() > 0) {
                                    let take = Math.min(needToRemove, itemStack.getCount())
                                    itemStack.shrink(take)
                                    needToRemove -= take
                                    totalRemoved += take
                                }
                            }
                        }
                    }
                } catch (ex) {}
            }
        }
    }
    return totalRemoved
}

// Interactive In-game GUI Menu
function openWarehouseControlPanel(player) {
    let limits = loadLimits()
    let itemKeys = Object.keys(limits)

    // Open a 4-row (36 slots) chest GUI
    player.openChestGUI(Text.darkAqua('⚙ Склад: Панель лимитов'), 4, gui => {
        // Render item slots (up to 27 items)
        for (let i = 0; i < Math.min(itemKeys.length, 27); i++) {
            let itemId = itemKeys[i]
            let stacks = limits[itemId]

            let baseStack = Item.of(itemId)
            if (baseStack.isEmpty()) baseStack = Item.of('minecraft:barrier')

            let statusName = stacks === 0 ? '§c[ЗАПРЕЩЕНО: 0 стаков]' : `§a[Лимит: ${stacks} стак. (${stacks * 64} шт)]`

            let displayStack = baseStack.copy()
                .withCustomName(Text.yellow(baseStack.hoverName.getString()))
                .withLore([
                    Text.gold(`Текущий статус: ${statusName}`),
                    Text.gray('──────────────────────────'),
                    Text.green('• ЛКМ: +1 стак к лимиту'),
                    Text.yellow('• ПКМ: -1 стак к лимиту'),
                    Text.red('• Shift + ПКМ: удалить из правил')
                ])

            gui.slot(i % 9, Math.floor(i / 9), slot => {
                slot.item = displayStack
                slot.leftClicked = () => {
                    limits[itemId] = (limits[itemId] || 0) + 1
                    saveLimits(limits)
                    player.server.runCommandSilent(`playsound minecraft:ui.button.click player ${player.username} ~ ~ ~ 0.5 1.5`)
                    openWarehouseControlPanel(player)
                }
                slot.rightClicked = () => {
                    if (player.isCrouching()) {
                        // Remove from limits
                        delete limits[itemId]
                        saveLimits(limits)
                        player.server.runCommandSilent(`playsound minecraft:entity.item.break player ${player.username} ~ ~ ~ 0.8 1.0`)
                        openWarehouseControlPanel(player)
                    } else {
                        // Decrease stack count
                        let cur = limits[itemId] || 0
                        if (cur > 0) {
                            limits[itemId] = cur - 1
                            saveLimits(limits)
                            player.server.runCommandSilent(`playsound minecraft:ui.button.click player ${player.username} ~ ~ ~ 0.5 0.8`)
                            openWarehouseControlPanel(player)
                        }
                    }
                }
            })
        }

        // Bottom utility row (row index 3)
        // Slot 27: Info book
        let bookStack = Item.of('minecraft:book')
            .withCustomName(Text.aqua('ℹ Справка по складу'))
            .withLore([
                Text.gray('Лимиты действуют только на предметы выше.'),
                Text.gray('Излишки свыше лимита удаляются автоматически.'),
                Text.yellow('Чтобы добавить новый предмет:'),
                Text.white('Возьмите его в руку и введите:'),
                Text.green('/colony limit set <стаки>')
            ])

        gui.slot(0, 3, slot => {
            slot.item = bookStack
        })

        // Slot 31: Emergency Purge Emerald
        let emeraldStack = Item.of('minecraft:emerald')
            .withCustomName(Text.green('🧹 ОЧИСТИТЬ СКЛАД ПРЯМО СЕЙЧАС'))
            .withLore([
                Text.gray('Мгновенно утилизирует все излишки'),
                Text.gray('на складе колонии по текущим правилам.')
            ])

        gui.slot(4, 3, slot => {
            slot.item = emeraldStack
            slot.leftClicked = () => {
                let ColonyManager = null
                try {
                    ColonyManager = Java.loadClass('com.minecolonies.api.colony.IColonyManager').getInstance()
                } catch (e) {}
                if (ColonyManager) {
                    let colonies = ColonyManager.getIColonies(player.level.minecraftLevel)
                    if (colonies && !colonies.isEmpty()) {
                        let removed = purgeWarehouse(player.level, colonies.get(0), limits)
                        player.tell(Text.gold('═══════════════════════════════════════════'))
                        player.tell(Text.green(`🧹 Склад очищен! Утилизировано излишков: §e${removed} шт.`))
                        player.tell(Text.gold('═══════════════════════════════════════════'))
                        player.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${player.username} ~ ~ ~ 0.8 1.5`)
                    }
                }
                player.closeMenu()
            }
        })

        // Slot 35: Close Barrier
        let barrierStack = Item.of('minecraft:barrier')
            .withCustomName(Text.red('✖ Закрыть меню'))

        gui.slot(8, 3, slot => {
            slot.item = barrierStack
            slot.leftClicked = () => {
                player.closeMenu()
            }
        })
    })
}

// Command Registry: /colony panel and /colony limit
ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event

    event.register(
        Commands.literal('colony')
            .then(Commands.literal('panel')
                .executes(ctx => {
                    let player = ctx.source.player
                    if (player) openWarehouseControlPanel(player)
                    return 1
                })
            )
            .then(Commands.literal('limit')
                .then(Commands.literal('set')
                    .then(Commands.argument('stacks', Arguments.INTEGER.create(event))
                        .executes(ctx => {
                            let player = ctx.source.player
                            if (!player) return 0
                            let item = player.mainHandItem
                            if (!item || item.isEmpty()) {
                                player.tell(Text.red('❌ Возьмите предмет в основную руку!'))
                                return 0
                            }
                            let stacks = Arguments.INTEGER.getResult(ctx, 'stacks')
                            let limits = loadLimits()
                            limits[item.id.toString()] = Math.max(0, stacks)
                            saveLimits(limits)

                            let status = stacks === 0 ? '§cзапрещён (0 стаков)' : `§aограничен до ${stacks} стаков`
                            player.tell(Text.gold(`✔ Предмет §e${item.hoverName.getString()} §fтеперь ${status}.`))
                            player.server.runCommandSilent(`playsound minecraft:block.note_block.chime player ${player.username} ~ ~ ~ 1 1.5`)
                            return 1
                        })
                    )
                )
                .then(Commands.literal('remove')
                    .executes(ctx => {
                        let player = ctx.source.player
                        if (!player) return 0
                        let item = player.mainHandItem
                        if (!item || item.isEmpty()) {
                            player.tell(Text.red('❌ Возьмите предмет в основную руку!'))
                            return 0
                        }
                        let limits = loadLimits()
                        let itemId = item.id.toString()
                        if (limits[itemId] !== undefined) {
                            delete limits[itemId]
                            saveLimits(limits)
                            player.tell(Text.green(`✔ Ограничение для §e${item.hoverName.getString()} §aудалено.`))
                        } else {
                            player.tell(Text.gray(`ℹ Для §e${item.hoverName.getString()} §7нет активных ограничений.`))
                        }
                        return 1
                    })
                )
                .then(Commands.literal('clear_now')
                    .executes(ctx => {
                        let player = ctx.source.player
                        if (!player) return 0
                        let ColonyManager = null
                        try {
                            ColonyManager = Java.loadClass('com.minecolonies.api.colony.IColonyManager').getInstance()
                        } catch (e) {}
                        if (ColonyManager) {
                            let colonies = ColonyManager.getIColonies(player.level.minecraftLevel)
                            if (colonies && !colonies.isEmpty()) {
                                let limits = loadLimits()
                                let removed = purgeWarehouse(player.level, colonies.get(0), limits)
                                player.tell(Text.green(`🧹 Утилизировано излишков: §e${removed} шт.`))
                                return 1
                            }
                        }
                        player.tell(Text.red('❌ Колония не найдена в этом мире.'))
                        return 0
                    })
                )
            )
    )
})

// Auto-cleaner: Runs every 2 minutes (2400 ticks) in background
ServerEvents.tick(event => {
    let server = event.server
    if (server.tickCount % 2400 !== 0) return

    let ColonyManager = null
    try {
        ColonyManager = Java.loadClass('com.minecolonies.api.colony.IColonyManager').getInstance()
    } catch (e) {}
    if (!ColonyManager) return

    let colonies = ColonyManager.getAllColonies()
    if (!colonies || colonies.isEmpty()) return

    let limits = loadLimits()
    colonies.forEach(colony => {
        let world = colony.getWorld ? colony.getWorld() : null
        purgeWarehouse(world, colony, limits)
    })
})
