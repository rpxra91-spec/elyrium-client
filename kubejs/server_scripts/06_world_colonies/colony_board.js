// KubeJS Server Script: Monolithic Construction Board (Millenaire-style Architecture Board)
// Focused EXCLUSIVELY on active building projects and required construction materials
// Activation: Shift + Right Click with Resource Scroll (minecolonies:resourcescroll) or Paper on a wall
// Resize: Shift + Right Click with empty hand on board to cycle scale (1x1 -> 2x1.5 -> 3x2)
// Remove: Shift + Left Click (hit) with empty hand to take down board and retrieve item

const SCALES = [
    { name: '§aКомпактный (1x1)', scale: 0.7 },
    { name: '§eСтандартный (2x1.5)', scale: 1.0 },
    { name: '§6Монументальный (3x2)', scale: 1.35 }
]

// Shift + Right Click on block to place construction board
BlockEvents.rightClicked(event => {
    let player = event.player
    let hand = event.hand
    let item = event.item
    let level = event.level

    if (level.isClientSide() || hand != 'MAIN_HAND' || !player.isCrouching()) return

    let itemId = item.id.toString()
    let isScroll = itemId === 'minecolonies:resourcescroll' || itemId === 'minecraft:paper'

    if (!isScroll) return

    let hit = event.target
    if (!hit || hit.type !== 'BLOCK') return

    let face = hit.direction
    if (face.name === 'UP' || face.name === 'DOWN') {
        player.tell(Text.red('Строительный стенд можно вешать только на вертикальную стену!'))
        return
    }

    let blockPos = hit.blockPos
    let offsetX = 0.5 + face.stepX * 0.51
    let offsetY = 0.5
    let offsetZ = 0.5 + face.stepZ * 0.51

    let posX = blockPos.x + offsetX
    let posY = blockPos.y + offsetY
    let posZ = blockPos.z + offsetZ

    let yaw = 0.0
    if (face.name === 'NORTH') yaw = 180.0
    else if (face.name === 'SOUTH') yaw = 0.0
    else if (face.name === 'WEST') yaw = 90.0
    else if (face.name === 'EAST') yaw = 270.0

    // Summon Text Display
    let cmd = `summon minecraft:text_display ${posX} ${posY} ${posZ} {Tags:["colony_builder_board","scale_1"],Rotation:[${yaw}f,0.0f],billboard:"fixed",text_opacity:255,background:1073741824,line_width:280,transformation:{scale:[1.0f,1.0f,1.0f],translation:[0.0f,0.0f,0.0f]}}`
    
    let server = event.server
    server.runCommandSilent(cmd)

    player.tell(Text.gold('═════════════════════════════════════════════'))
    player.tell(Text.yellow('🔨 СТРОИТЕЛЬНЫЙ СТЕНД ПРОЕКТА ЗАКРЕПЛЕН НА СТЕНЕ!'))
    player.tell(Text.gray('Отображает: текущий строительный проект и дефицит материалов'))
    player.tell(Text.aqua('• Shift + ПКМ пустой рукой: изменить размер (1x1 / 2x1.5 / 3x2)'))
    player.tell(Text.aqua('• Shift + ЛКМ пустой рукой: снять со стены'))
    player.tell(Text.gold('═════════════════════════════════════════════'))

    server.runCommandSilent(`playsound minecraft:block.wood.place block ${player.username} ${posX} ${posY} ${posZ} 1 1`)
    event.cancel()
})

// Interaction with board (Cycle scale)
ItemEvents.entityInteracted(event => {
    let player = event.player
    let entity = event.target
    let level = event.level

    if (level.isClientSide() || !player.isCrouching()) return
    if (!entity || entity.type !== 'minecraft:text_display') return
    if (!entity.tags.contains('colony_builder_board')) return

    let held = player.mainHandItem
    if (held.isEmpty()) {
        let currentScaleIdx = 1
        if (entity.tags.contains('scale_0')) currentScaleIdx = 0
        else if (entity.tags.contains('scale_1')) currentScaleIdx = 1
        else if (entity.tags.contains('scale_2')) currentScaleIdx = 2

        let nextIdx = (currentScaleIdx + 1) % SCALES.length
        entity.tags.remove(`scale_${currentScaleIdx}`)
        entity.tags.add(`scale_${nextIdx}`)

        let s = SCALES[nextIdx].scale
        entity.mergeNbt({
            transformation: {
                scale: [s, s, s],
                translation: [0.0, 0.0, 0.0]
            }
        })

        player.tell(Text.yellow(`[Стенд]: Размер изменён на: ${SCALES[nextIdx].name}`))
        event.server.runCommandSilent(`playsound minecraft:ui.button.click player ${player.username} ~ ~ ~ 0.8 1.2`)
        event.cancel()
    }
})

// Remove board on attack with crouching empty hand
EntityEvents.beforeHurt(event => {
    let entity = event.entity
    let source = event.source
    if (!entity || entity.type !== 'minecraft:text_display') return
    if (!entity.tags.contains('colony_builder_board')) return

    let attacker = source.player
    if (attacker && attacker.isCrouching() && attacker.mainHandItem.isEmpty()) {
        attacker.give('minecolonies:resourcescroll')
        attacker.tell(Text.green('Строительный стенд снят со стены!'))
        event.server.runCommandSilent(`playsound minecraft:block.wood.break player ${attacker.username} ~ ~ ~ 1 1`)
        entity.discard()
        event.cancel()
    }
})

// Auto-updater: Every 3 seconds (60 ticks) refresh active building status
ServerEvents.tick(event => {
    let server = event.server
    if (server.tickCount % 60 !== 0) return

    let ColonyManager = null
    try {
        ColonyManager = Java.loadClass('com.minecolonies.api.colony.IColonyManager').getInstance()
    } catch (e) {}
    if (!ColonyManager) return

    let colonies = ColonyManager.getAllColonies()
    if (!colonies || colonies.isEmpty()) return
    let colony = colonies.get(0)
    if (!colony) return

    server.allLevels.forEach(level => {
        let displays = level.getEntities().filter(e => e.type === 'minecraft:text_display' && e.tags.contains('colony_builder_board'))
        if (displays.isEmpty()) return

        displays.forEach(display => {
            let lines = []
            lines.push(`§6╔═════ [ СТРОИТЕЛЬНЫЙ СТЕНД ПРОЕКТА ] ═════╗`)

            let foundActiveProject = false
            let buildings = colony.getServerBuildingManager() ? colony.getServerBuildingManager().getBuildings() : null
            
            if (buildings) {
                for (let b of buildings.values()) {
                    let type = b.getBuildingType ? b.getBuildingType().toString() : ''
                    if (type.includes('builder') || b.getClass().getSimpleName().includes('Builder')) {
                        try {
                            if (b.hasWorkOrder && b.hasWorkOrder()) {
                                let wo = b.getWorkOrder()
                                if (wo) {
                                    foundActiveProject = true
                                    let targetName = wo.getTargetName ? wo.getTargetName().getString() : 'Стройка'
                                    lines.push(`§e  Проект: §f${targetName}`)
                                    lines.push(`§8───────────────────────────────────────────`)

                                    let needed = b.getNeededResources()
                                    if (needed && !needed.isEmpty()) {
                                        lines.push(`§c  ТРЕБУЮТСЯ МАТЕРИАЛЫ ДЛЯ СТРОЙКИ:`)
                                        let count = 0
                                        for (let entry of needed.values()) {
                                            if (count >= 8) {
                                                lines.push(`§7  • ... и другие ресурсы`)
                                                break
                                            }
                                            let resName = entry.getName ? entry.getName() : 'Ресурс'
                                            let amount = entry.getAmount ? entry.getAmount() : 1
                                            lines.push(`  §c• §f${resName}: §e${amount} шт.`)
                                            count++
                                        }
                                    } else {
                                        lines.push(`§a  ✔ Все материалы на текущий этап на месте!`)
                                        lines.push(`§2  Строитель активно возводит конструкцию...`)
                                    }
                                    break // Focus on current primary active builder project
                                }
                            }
                        } catch (err) {}
                    }
                }
            }

            if (!foundActiveProject) {
                lines.push(`§a  ✔ Все строительные заказы выполнены!`)
                lines.push(`§7  Назначьте новый проект в хижине Строителя.`)
            }

            lines.push(`§8───────────────────────────────────────────`)
            lines.push(`§7  * Синхронизировано с ратушей колонии`)
            lines.push(`§6╚═══════════════════════════════════════════╝`)

            let fullText = lines.join('\\n')
            display.mergeNbt({
                text: JSON.stringify({ text: fullText.replace(/\\n/g, '\n') })
            })
        })
    })
})
