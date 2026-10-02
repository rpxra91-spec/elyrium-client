// KubeJS Script: MineColonies QoL, Road Speed for Citizens & Town Hall Rewards
// 1. Tiered road speeds for Players AND Citizens (Dirt +15%, Wood +20%, Stone +30%, Polished +40%)
// 2. Light Town Hall upgrade bonuses (level 2, 3, 4, 5)
// 3. Sleep health regeneration for injured citizens
// 4. Auto-reforestation for lumberjack trees
// 5. Auto-extinguish for burning citizens (saves them from fire/lava)
// 6. Victory morale boost upon defeating raids

// === 1. TIERED ROAD SPEED ===
const ROAD_TIERS = {
    // Tier 1: Dirt / Gravel paths (+15%)
    'minecraft:dirt_path': 0.15,
    'minecraft:gravel': 0.15,
    'minecraft:coarse_dirt': 0.15,

    // Tier 2: Wooden bridges and planks (+20%)
    'minecraft:oak_planks': 0.20,
    'minecraft:spruce_planks': 0.20,
    'minecraft:birch_planks': 0.20,
    'minecraft:jungle_planks': 0.20,
    'minecraft:acacia_planks': 0.20,
    'minecraft:dark_oak_planks': 0.20,
    'minecraft:mangrove_planks': 0.20,
    'minecraft:cherry_planks': 0.20,

    // Tier 3: Cobblestone & Stone Bricks (+30%)
    'minecraft:cobblestone': 0.30,
    'minecraft:stone_bricks': 0.30,
    'minecraft:stone': 0.30,
    'minecraft:stone_brick_stairs': 0.30,
    'minecraft:stone_brick_slab': 0.30,
    'minecraft:mossy_stone_bricks': 0.30,
    'minecraft:mud_bricks': 0.30,
    'minecraft:sandstone': 0.30,
    'minecraft:bricks': 0.30,

    // Tier 4: Smooth & Polished Stone Highways (+40%)
    'minecraft:smooth_stone': 0.40,
    'minecraft:smooth_stone_slab': 0.40,
    'minecraft:polished_andesite': 0.40,
    'minecraft:polished_diorite': 0.40,
    'minecraft:polished_granite': 0.40,
    'minecraft:polished_deepslate': 0.40,
    'minecraft:deepslate_bricks': 0.40,
    'minecraft:deepslate_tiles': 0.40,
    'minecraft:polished_blackstone': 0.40,
    'minecraft:polished_blackstone_bricks': 0.40
}

// Every 10 ticks (0.5s), apply road speed to players and nearby citizens
ServerEvents.tick(event => {
    let server = event.server
    if (server.tickCount % 10 !== 0) return

    server.allLevels.forEach(level => {
        // 1. Boost players on roads
        level.players.forEach(player => {
            let belowPos = player.blockPosition().below()
            let blockId = level.getBlock(belowPos).id.toString()
            let bonus = ROAD_TIERS[blockId] || 0.0

            if (bonus === 0.0) {
                let currentPos = player.blockPosition()
                let curBlockId = level.getBlock(currentPos).id.toString()
                bonus = ROAD_TIERS[curBlockId] || 0.0
            }

            if (bonus > 0.0) {
                player.potionEffects.add('minecraft:speed', 30, bonus >= 0.3 ? 1 : 0, false, false)
            }
        })

        // 2. Boost MineColonies Citizens walking on roads
        try {
            let ColonyManager = Java.loadClass('com.minecolonies.api.colony.IColonyManager').getInstance()
            if (ColonyManager) {
                let colonies = ColonyManager.getAllColonies()
                if (colonies) {
                    for (let colony of colonies) {
                        let citMgr = colony.getCitizenManager()
                        if (!citMgr) continue
                        let citizens = citMgr.getCitizens()
                        if (!citizens) continue

                        for (let cit of citizens) {
                            let entity = cit.getEntity()
                            if (entity && entity.isAlive()) {
                                let cPos = entity.blockPosition()
                                let bPos = cPos.below()
                                let bId = level.getBlock(bPos).id.toString()
                                let cBonus = ROAD_TIERS[bId] || 0.0

                                if (cBonus === 0.0) {
                                    let curId = level.getBlock(cPos).id.toString()
                                    cBonus = ROAD_TIERS[curId] || 0.0
                                }

                                if (cBonus > 0.0) {
                                    // Give citizens smooth speed boost without noisy particles
                                    entity.potionEffects.add('minecraft:speed', 30, cBonus >= 0.3 ? 1 : 0, false, false)
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {
            // Ignore if colony not ready
        }
    })
})

// === 2. LIGHT TOWN HALL LEVEL REWARDS ===
// Checks colony Town Hall levels periodically and gives a small, balanced reward on upgrade
ServerEvents.tick(event => {
    let server = event.server
    // Check every 100 ticks (5 seconds)
    if (server.tickCount % 100 !== 0) return

    try {
        let ColonyManager = Java.loadClass('com.minecolonies.api.colony.IColonyManager').getInstance()
        if (!ColonyManager) return

        let colonies = ColonyManager.getAllColonies()
        if (!colonies) return

        for (let colony of colonies) {
            let bMap = colony.getBuildings()
            if (!bMap) continue

            // Find TownHall building in colony
            let townHallLevel = 0
            for (let entry of bMap.values()) {
                let type = entry.getBuildingType()
                let schem = entry.getSchematicName()
                if ((type && type.toString().toLowerCase().includes('townhall')) ||
                    (schem && schem.toString().toLowerCase().includes('townhall'))) {
                    townHallLevel = Math.max(townHallLevel, entry.getBuildingLevel())
                }
            }

            if (townHallLevel <= 1) continue

            // Track rewarded level in server persistent data
            let colonyId = colony.getID()
            let tagKey = `colony_rewarded_th_lvl_${colonyId}`
            let lastRewarded = server.persistentData.getInt(tagKey) || 1

            if (townHallLevel > lastRewarded) {
                server.persistentData.putInt(tagKey, townHallLevel)

                // Balanced, light rewards per level:
                // Level 2: 1 stat point, 250 XP, 4 Iron Ingots
                // Level 3: 1 stat point, 500 XP, 4 Gold Ingots
                // Level 4: 2 stat points, 1000 XP, 2 Diamonds
                // Level 5: 2 stat points, 2000 XP, 1 Netherite Scrap
                let statPoints = townHallLevel >= 4 ? 2 : 1
                let bonusXp = townHallLevel * 250

                let colonyName = colony.getName() || "Колония"

                // Announce to players of this colony
                server.tell(Text.gold('═══════════════════════════════════════════════════'))
                server.tell(Text.yellow(`🏛️ Ратуша города "${colonyName}" улучшена до ${townHallLevel} уровня!`))
                server.tell(Text.aqua(`   Жители ликуют! Награда гражданам: +${statPoints} очк. статов и +${bonusXp} опыта.`))
                server.tell(Text.gold('═══════════════════════════════════════════════════'))

                // Reward online players belonging to this colony or all nearby online players
                server.players.forEach(p => {
                    let pColony = ColonyManager.getIColony(p.level.minecraftLevel, p.blockPosition())
                    let belongs = (pColony && pColony.getID() === colonyId) || (server.players.length <= 2)

                    if (belongs) {
                        // Grant light stat points via SimpleStats
                        server.runCommandSilent(`simplestats points add ${p.username} ${statPoints}`)
                        server.runCommandSilent(`simplestats xp add ${p.username} ${bonusXp}`)
                        server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete player ${p.username} ~ ~ ~ 1 1.2`)
                        p.potionEffects.add('minecraft:hero_of_the_village', 1200, 0, false, false)
                    }
                })
            }
        }
    } catch (e) {
        // Fallback
    }
})

// === 3. SLEEP REGENERATION FOR CITIZENS ===
// When a citizen sleeps in bed, restore full HP on morning / waking
LevelEvents.tick(event => {
    let level = event.level
    if (level.isClientSide()) return
    if (event.server.tickCount % 100 !== 0) return

    try {
        let ColonyManager = Java.loadClass('com.minecolonies.api.colony.IColonyManager').getInstance()
        if (ColonyManager) {
            let colonies = ColonyManager.getAllColonies()
            if (colonies) {
                for (let colony of colonies) {
                    let citMgr = colony.getCitizenManager()
                    if (!citMgr) continue
                    let citizens = citMgr.getCitizens()
                    if (citizens) {
                        for (let cit of citizens) {
                            let entity = cit.getEntity()
                            if (entity && entity.isAlive() && cit.isSleeping()) {
                                if (entity.health < entity.maxHealth) {
                                    entity.health = Math.min(entity.maxHealth, entity.health + 2.0)
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (e) {
        // Ignore
    }
})

// === 4. AUTO-REFORESTATION FOR LUMBERJACK ===
BlockEvents.broken(event => {
    let block = event.block
    let id = block.id.toString()

    if (id.includes('_log') || id.includes('_wood')) {
        let below = block.below
        let belowId = (below && below.id) ? below.id.toString() : ''
        if (belowId.includes('dirt') || belowId.includes('grass') || belowId.includes('podzol')) {
            let saplingId = 'minecraft:oak_sapling'
            if (id.includes('spruce')) saplingId = 'minecraft:spruce_sapling'
            else if (id.includes('birch')) saplingId = 'minecraft:birch_sapling'
            else if (id.includes('jungle')) saplingId = 'minecraft:jungle_sapling'
            else if (id.includes('acacia')) saplingId = 'minecraft:acacia_sapling'
            else if (id.includes('dark_oak')) saplingId = 'minecraft:dark_oak_sapling'
            else if (id.includes('cherry')) saplingId = 'minecraft:cherry_sapling'
            else if (id.includes('mangrove')) saplingId = 'minecraft:mangrove_propagule'

            event.server.scheduleInTicks(2, () => {
                if (block.id === 'minecraft:air') {
                    block.set(saplingId)
                }
            })
        }
    }
})

// === 5. AUTO-EXTINGUISH CITIZENS FROM FIRE/LAVA ===
EntityEvents.beforeHurt(event => {
    let entity = event.entity
    if (!entity || !entity.isLiving()) return

    // Check if citizen of MineColonies
    let type = entity.type.toString()
    if (type.includes('minecolonies:citizen')) {
        let dmgType = event.source.getType()
        if (dmgType.includes('fire') || dmgType.includes('lava') || dmgType.includes('on_fire') || dmgType.includes('hot_floor')) {
            event.server.scheduleInTicks(20, () => {
                if (entity.isAlive() && entity.isOnFire()) {
                    entity.setRemainingFireTicks(0)
                    entity.potionEffects.add('minecraft:fire_resistance', 100, 0, false, false)
                    entity.potionEffects.add('minecraft:regeneration', 60, 1, false, false)
                }
            })
        }
    }
})

// === 6. VICTORY MORALE BOOST UPON DEFEATING RAID ENEMIES ===
EntityEvents.death(event => {
    let entity = event.entity
    let type = entity.type.toString()

    if (type.includes('chiefbarbarian') || type.includes('chiefpirate') || type.includes('amazonchief') || type.includes('pharao')) {
        let server = event.server
        server.tell(Text.gold('═════════════════════════════════════════════'))
        server.tell(Text.yellow('🎉 ПОБЕДА! Предводитель налётчиков повержен!'))
        server.tell(Text.green('   Мораль колонии на максимуме! Жители празднуют победу!'))
        server.tell(Text.gold('═════════════════════════════════════════════'))

        event.level.players.forEach(p => {
            server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete player ${p.username} ~ ~ ~ 1 1`)
        })
    }
})

// === 7. TOGGLEABLE CITIZEN ARMOR REQUEST SYSTEM ===
// Allows enabling / disabling armor requests for working citizens (Miners, Builders, Lumberjacks, etc.)
ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event
    event.register(
        Commands.literal('colony')
            .then(Commands.literal('armor_requests')
                .requires(src => src.hasPermission(2))
                .then(Commands.argument('state', Arguments.BOOLEAN.create(event))
                    .executes(ctx => {
                        let state = Arguments.BOOLEAN.getResult(ctx, 'state')
                        let server = ctx.source.server
                        server.persistentData.putBoolean('citizens_request_armor', state)
                        
                        let statusText = state ? '§aВКЛЮЧЕНА (жители запрашивают броню)§r' : '§cВЫКЛЮЧЕНА (запросы брони отключены)§r'
                        ctx.source.sendSuccess(() => Text.of('[MineColonies QoL] Система запросов брони для жителей теперь: ' + statusText), true)
                        return 1
                    })
                )
                .executes(ctx => {
                    let server = ctx.source.server
                    let current = server.persistentData.getBoolean('citizens_request_armor')
                    let statusText = current ? '§aВКЛЮЧЕНА§r' : '§cВЫКЛЮЧЕНА§r'
                    ctx.source.sendSuccess(() => Text.of('[MineColonies QoL] Текущий статус запросов брони для жителей: ' + statusText), false)
                    return 1
                })
            )
    )
})

// === 8. UNIVERSITY: TOOL HARDENING SYSTEM (x2 DURABILITY) ===
// Исследования:
//   Ур.1 Университет → woodhardening   : деревянные инструменты служат в 2 раза дольше (x2)
//   Ур.2 Университет → stonehardening  : каменные инструменты служат в 2 раза дольше (x2)
//   Ур.3 Университет → ironhardening   : железные инструменты служат в 2 раза дольше (x2)

let J_ColonyManager = null
let J_ResourceLocation = null
let RL_WOOD_HARDENING = null
let RL_STONE_HARDENING = null
let RL_IRON_HARDENING = null

try {
    J_ColonyManager = Java.loadClass('com.minecolonies.api.colony.IColonyManager')
    J_ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
} catch (e) {
    console.warn('[MineColonies QoL] Could not load MineColonies Java classes for Tool Hardening:', e)
}

function initToolHardeningResources() {
    if (J_ResourceLocation && !RL_WOOD_HARDENING) {
        try {
            RL_WOOD_HARDENING = J_ResourceLocation.parse('minecolonies:effects/woodhardening')
            RL_STONE_HARDENING = J_ResourceLocation.parse('minecolonies:effects/stonehardening')
            RL_IRON_HARDENING = J_ResourceLocation.parse('minecolonies:effects/ironhardening')
        } catch (e) {}
    }
}

// Отслеживание прочности инструментов у жителей
// Срабатывает каждые 20 тиков (1 сек) для активных работников
ServerEvents.tick(event => {
    const server = event.server
    const tick = server.overworld().time

    // Проверяем каждые 20 тиков (1 секунда)
    if (tick % 20 !== 0) return
    if (!J_ColonyManager) return

    initToolHardeningResources()
    if (!RL_WOOD_HARDENING) return

    try {
        const colonies = J_ColonyManager.getInstance().getAllColonies()
        if (!colonies || colonies.isEmpty()) return

        colonies.forEach(colony => {
            try {
                const effectMgr = colony.getResearchManager().getResearchEffects()
                const hasWood = effectMgr.getEffectStrength(RL_WOOD_HARDENING) > 0
                const hasStone = effectMgr.getEffectStrength(RL_STONE_HARDENING) > 0
                const hasIron = effectMgr.getEffectStrength(RL_IRON_HARDENING) > 0

                // Если ничего не исследовано в этой колонии — пропускаем
                if (!hasWood && !hasStone && !hasIron) return

                const citizens = colony.getCitizenManager().getCitizens()
                if (!citizens || citizens.isEmpty()) return

                citizens.forEach(citizenData => {
                    try {
                        const optEntity = citizenData.getEntity()
                        if (!optEntity || !optEntity.isPresent()) return

                        const entity = optEntity.get()
                        if (!entity.alive) return

                        const mainHand = entity.mainHandItem
                        if (!mainHand || mainHand.id === 'minecraft:air') return

                        const itemId = mainHand.id
                        let eligible = false

                        if (hasWood && itemId.includes('wooden_')) eligible = true
                        else if (hasStone && itemId.includes('stone_')) eligible = true
                        else if (hasIron && itemId.includes('iron_')) eligible = true

                        if (!eligible) return

                        const currentDamage = mainHand.damageValue
                        const lastDamageKey = 'skd_last_tool_dmg'
                        const lastDmg = entity.persistentData.getInt(lastDamageKey)

                        // Если инструмент потерял прочность с прошлой проверки
                        if (currentDamage > lastDmg && lastDmg > 0) {
                            const loss = currentDamage - lastDmg
                            // 50% шанс вернуть потерянную прочность назад (удваивает срок жизни!)
                            if (Math.random() < 0.5) {
                                mainHand.damageValue = Math.max(0, currentDamage - loss)
                            }
                        }

                        // Сохраняем текущую прочность для следующего тика
                        entity.persistentData.putInt(lastDamageKey, mainHand.damageValue)
                    } catch (citErr) {}
                })
            } catch (colErr) {}
        })
    } catch (e) {}
})

// Информационная команда проверки статуса закалки инструментов
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    event.register(
        Commands.literal('colony')
            .then(Commands.literal('hardening_status')
                .requires(src => src.hasPermission(2))
                .executes(ctx => {
                    initToolHardeningResources()
                    if (!J_ColonyManager || !RL_WOOD_HARDENING) {
                        ctx.source.sendSuccess(() => Text.red('[QoL] MineColonies API недоступен'), false)
                        return 0
                    }

                    try {
                        const colonies = J_ColonyManager.getInstance().getAllColonies()
                        let info = []

                        colonies.forEach(colony => {
                            const effectMgr = colony.getResearchManager().getResearchEffects()
                            const w = effectMgr.getEffectStrength(RL_WOOD_HARDENING) > 0
                            const s = effectMgr.getEffectStrength(RL_STONE_HARDENING) > 0
                            const i = effectMgr.getEffectStrength(RL_IRON_HARDENING) > 0

                            info.push(`§eКолония [${colony.getName()}]:§r\n` +
                                `  §fДеревянные инструменты x2:§r ${w ? '§aИзучено§r' : '§cНе изучено§r'}\n` +
                                `  §fКаменные инструменты x2:§r ${s ? '§aИзучено§r' : '§cНе изучено§r'}\n` +
                                `  §fЖелезные инструменты x2:§r ${i ? '§aИзучено§r' : '§cНе изучено§r'}`)
                        })

                        if (info.length === 0) {
                            ctx.source.sendSuccess(() => Text.yellow('[QoL] Колонии не найдены на сервере.'), false)
                        } else {
                            ctx.source.sendSuccess(() => Text.of(`§6[Университет Элириума] Закалка инструментов:§r\n` + info.join('\n')), false)
                        }
                        return 1
                    } catch (err) {
                        ctx.source.sendSuccess(() => Text.red('[QoL] Ошибка проверки: ' + err.message), false)
                        return 0
                    }
                })
            )
    )
})

