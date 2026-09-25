// ==============================================================================
// 🧪 ELYRIUM RPG: ALCHEMIST & COOK MECHANICS ENGINE
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 1. COOK MECHANICS:
//    - ItemEvents.foodEaten: +20% to +50% extra saturation and hunger restored.
//    - Cook master talent: eating food grants instant Absorption I/II or Regeneration I for 5s.
//    - ItemEvents.crafted: 15% Masterchef roll on food crafting -> golden lore («⭐ КУЛИНАРНЫЙ ШЕДЕВР») + 1 extra food.
// 2. ALCHEMIST MECHANICS:
//    - Drinking potions extends duration (+30-50%) and amplifies effect level.
//    - Brewing stand: 20% chance to brew duplicate potion or refund ingredient.
//    - Splash potions: deal +35% to +50% extra damage or grant stronger healing.
// ==============================================================================

// ------------------------------------------------------------------------------
// 1. COOK: MASTERCHEF CRAFTING ROLL (ItemEvents.crafted)
// ------------------------------------------------------------------------------
ItemEvents.crafted(event => {
    let player = event.player
    let item = event.item
    if (!player || !item) return

    let tags = player.tags
    if (!tags) return

    // Check if player has any cook crafting talents
    let hasMasterChef = tags.contains('skill_cook_masterchef_crafting') ||
                        tags.contains('skill_cook_subclass') ||
                        tags.contains('skill_cook_final_1') ||
                        tags.contains('skill_cook_final_2') ||
                        tags.contains('skill_cook_master_1')

    if (!hasMasterChef) return

    let itemId = String(item.id).toLowerCase()

    // Identify food items (excluding raw items and non-food)
    const EXCLUDED_ITEMS = new Set([
        'minecraft:rotten_flesh', 'minecraft:poisonous_potato', 'minecraft:spider_eye',
        'minecraft:pufferfish', 'minecraft:glass_bottle', 'minecraft:bowl'
    ])
    if (EXCLUDED_ITEMS.has(itemId)) return

    let isFood = false
    try {
        if (item.edible || (item.foodProperties != null)) {
            isFood = true
        }
    } catch (e) {
        // Fallback id check
    }

    if (!isFood) {
        let isFoodId = itemId.includes('stew') || itemId.includes('soup') || itemId.includes('pie') ||
                       itemId.includes('bread') || itemId.includes('cake') || itemId.includes('cookie') ||
                       itemId.includes('feast') || itemId.includes('roast') || itemId.includes('salad') ||
                       itemId.includes('sandwich') || itemId.includes('burger') || itemId.includes('cooked')
        if (isFoodId) isFood = true
    }

    if (!isFood) return

    // 15% Masterchef roll on food crafting
    let isMasterpiece = Math.random() < 0.15

    if (isMasterpiece) {
        // Add golden lore: «⭐ КУЛИНАРНЫЙ ШЕДЕВР»
        let loreLines = [
            Text.of('§6⭐ КУЛИНАРНЫЙ ШЕДЕВР'),
            Text.of('§eПриготовлено шеф-поваром высшего ранга'),
            Text.of('§a+50% к Сытности и Питательности блюда')
        ]
        item.setLore(loreLines)

        // Give +1 extra duplicate food item
        let bonusItem = Item.of(item.id, 1)
        bonusItem.setLore(loreLines)
        player.give(bonusItem)

        player.server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete player ${player.username} ~ ~ ~ 1.0 1.2`)
        player.sendSystemMessage(Text.of(`§6🌟 ВЕЛИКОЛЕПНО! Создан «⭐ КУЛИНАРНЫЙ ШЕДЕВР»: §e${item.name.string} §6(+1 бонусное блюдо)!`), true)
    }
})

// ------------------------------------------------------------------------------
// 2. COOK & ALCHEMIST: CONSUMPTION ENGINE (ItemEvents.foodEaten)
// ------------------------------------------------------------------------------
ItemEvents.foodEaten(event => {
    let player = event.player
    let item = event.item
    if (!player || !item) return

    let tags = player.tags
    if (!tags) return

    let itemId = String(item.id).toLowerCase()

    // ==========================================================================
    // A. ALCHEMIST: DRINKING POTIONS
    // ==========================================================================
    if (itemId === 'minecraft:potion' || itemId.endsWith(':potion') || itemId.includes('potion')) {
        let hasAlchDrink = tags.contains('skill_alchemist_drink_mastery') ||
                            tags.contains('skill_alchemist_subclass') ||
                            tags.contains('skill_alchemist_final_1') ||
                            tags.contains('skill_alchemist_final_2') ||
                            tags.contains('skill_alchemist_elixir_eternity') ||
                            tags.contains('skill_deli_subclass') ||
                            tags.contains('skill_alchemist_potion_amplification')

        if (hasAlchDrink) {
            // Schedule 1 tick so potion effects are populated in player's active effects
            player.server.scheduleInTicks(1, () => {
                if (!player || !player.isAlive()) return

                let beneficialEffects = [
                    'minecraft:speed', 'minecraft:strength', 'minecraft:regeneration',
                    'minecraft:resistance', 'minecraft:fire_resistance', 'minecraft:water_breathing',
                    'minecraft:invisibility', 'minecraft:night_vision', 'minecraft:jump_boost',
                    'minecraft:absorption', 'minecraft:haste', 'minecraft:slow_falling',
                    'minecraft:health_boost', 'irons_spellbooks:instant_mana', 'irons_spellbooks:mana_regeneration'
                ]

                let amplified = false
                let extended = false

                beneficialEffects.forEach(effId => {
                    let eff = player.potionEffects.get(effId)
                    if (eff) {
                        let curDuration = eff.duration
                        let curAmp = eff.amplifier

                        // Extend duration by 30% to 50%
                        let durMultiplier = 1.35
                        if (tags.contains('skill_alchemist_final_2') || tags.contains('skill_alchemist_elixir_eternity')) {
                            durMultiplier = 1.50
                        }
                        let newDuration = Math.round(curDuration * durMultiplier)

                        // 30% chance to amplify effect level (e.g. Speed I -> Speed II)
                        let newAmp = curAmp
                        if ((tags.contains('skill_alchemist_final_2') || tags.contains('skill_alchemist_subclass')) && curAmp === 0) {
                            if (Math.random() < 0.35) {
                                newAmp = 1
                                amplified = true
                            }
                        }

                        player.potionEffects.add(effId, newDuration, newAmp, false, true)
                        extended = true
                    }
                })

                if (extended || amplified) {
                    player.server.runCommandSilent(`playsound minecraft:block.brewing_stand.brew player ${player.username} ~ ~ ~ 0.8 1.4`)
                    if (amplified) {
                        player.sendSystemMessage(Text.of('§d⚗ [Мастерство Зельевара] Эффект зелья усилен до следующего уровня и продлён!'), true)
                    } else {
                        player.sendSystemMessage(Text.of('§d⚗ [Мастерство Зельевара] Длительность эффекта зелья значительно увеличена!'), true)
                    }
                }
            })
        }
        return
    }

    // ==========================================================================
    // B. COOK: EATING FOOD (+20% to +50% SATURATION & HUNGER, MASTER NUTRITION)
    // ==========================================================================
    let bonusPct = 0.0

    if (tags.contains('skill_cook_food_saturation_3') || tags.contains('skill_cook_final_1')) {
        bonusPct = 0.50
    } else if (tags.contains('skill_cook_food_saturation_2') || tags.contains('skill_cook_subclass')) {
        bonusPct = 0.35
    } else if (tags.contains('skill_cook_food_saturation_1')) {
        bonusPct = 0.20
    } else if (tags.contains('skill_alchemist_food_saturation')) {
        bonusPct = 0.15
    }

    if (bonusPct > 0) {
        // 1. Extra hunger and saturation restored
        try {
            if (player.foodData) {
                let curFood = player.foodData.foodLevel
                let addFood = Math.max(1, Math.round(5 * bonusPct))
                player.foodData.foodLevel = Math.min(20, curFood + addFood)
            }
        } catch (e) {
            // FoodData access fallback
        }

        let satTicks = Math.round(20 * 4 * bonusPct) // 16 - 40 ticks
        player.potionEffects.add('minecraft:saturation', satTicks, 0, false, false)
        player.sendSystemMessage(Text.of(`§6🍲 [Кулинария] Пища восстановила +${Math.round(bonusPct * 100)}% дополнительной сытности!`), true)
    }

    // 2. Cook Master talent: eating food grants instant Absorption I/II or Regeneration I for 5s (100 ticks)
    let hasMasterNutrition = tags.contains('skill_cook_final_2') ||
                             tags.contains('skill_cook_master_nutrition') ||
                             tags.contains('skill_cook_life_elixir') ||
                             tags.contains('skill_cook_warrior_chef')

    if (hasMasterNutrition) {
        if (tags.contains('skill_cook_final_2') || tags.contains('skill_cook_master_nutrition')) {
            player.potionEffects.add('minecraft:absorption', 600, 1, false, true) // Absorption II (30s)
            player.potionEffects.add('minecraft:regeneration', 100, 0, false, true) // Regeneration I (5s)
            player.sendSystemMessage(Text.of('§6⭐ Изысканная трапеза мастера восстанавливает жизненные силы! (§aРегенерация §f(5с) + §6Поглощение II§f)'), true)
            player.server.runCommandSilent(`playsound minecraft:entity.player.burp player ${player.username} ~ ~ ~ 0.8 1.2`)
        } else {
            player.potionEffects.add('minecraft:absorption', 400, 0, false, true) // Absorption I (20s)
            player.potionEffects.add('minecraft:regeneration', 100, 0, false, true) // Regeneration I (5s)
            player.sendSystemMessage(Text.of('§6⭐ Питательная трапеза: §aРегенерация §f(5с) + §6Поглощение I§f!'), true)
        }
    }
})

// ------------------------------------------------------------------------------
// 3. ALCHEMIST: BREWING STAND DUPLICATE & REFUND (PlayerEvents.inventoryChanged)
// ------------------------------------------------------------------------------
PlayerEvents.inventoryChanged(event => {
    let player = event.player
    if (!player || !player.isAlive()) return

    let menu = player.containerMenu
    if (!menu) return

    let menuClass = String(menu)
    if (!menuClass.includes('BrewingStand')) return

    // Slots 0, 1, 2 in BrewingStandMenu are the 3 potion bottle slots
    if (event.slot < 0 || event.slot > 2) return

    let item = event.item
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return

    let itemId = String(item.id).toLowerCase()
    if (!itemId.includes('potion')) return

    let tags = player.tags
    if (!tags) return

    let hasBrewBonus = tags.contains('skill_alchemist_brew_duplicate') ||
                       tags.contains('skill_alchemist_final_2') ||
                       tags.contains('skill_alchemist_subclass')

    if (!hasBrewBonus) return

    // 20% chance to brew duplicate potion or refund ingredient
    let roll = Math.random()
    if (roll < 0.20) {
        if (Math.random() < 0.50) {
            // A. Duplicate brewed potion (+1)
            let duplicate = item.copy()
            duplicate.count = 1
            player.give(duplicate)

            player.server.runCommandSilent(`playsound minecraft:block.brewing_stand.brew player ${player.username} ~ ~ ~ 1.0 1.5`)
            player.sendSystemMessage(Text.of(`§d⚗ [Мастер-Зельевар] Совершенная дистилляция: Получено дополнительное зелье (§e${item.name.string} §a+1§d)!`), true)
        } else {
            // B. Refund brewing ingredient
            const REFUND_INGREDIENTS = [
                'minecraft:nether_wart',
                'minecraft:redstone',
                'minecraft:glowstone_dust',
                'minecraft:blaze_powder',
                'minecraft:golden_carrot',
                'minecraft:glistering_melon_slice',
                'minecraft:sugar',
                'minecraft:fermented_spider_eye'
            ]
            let refund = REFUND_INGREDIENTS[Math.floor(Math.random() * REFUND_INGREDIENTS.length)]
            player.give(Item.of(refund, 1))

            player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.9 1.3`)
            player.sendSystemMessage(Text.of(`§e⚗ [Экономия Реагентов] Ценный алхимический ингредиент успешно спасён и сохранён!`), true)
        }
    }
})

// ------------------------------------------------------------------------------
// 4. ALCHEMIST: SPLASH POTION DAMAGE & HEALING (EntityEvents.beforeHurt & ItemEvents.rightClicked)
// ------------------------------------------------------------------------------
// A. Splash potion extra damage
EntityEvents.beforeHurt(event => {
    let source = event.source
    if (!source) return

    let attacker = source.actual || source.player
    let victim = event.entity

    if (!attacker || !attacker.isPlayer() || !victim || !victim.isAlive()) return

    let tags = attacker.tags
    if (!tags) return

    let hasSplashMastery = tags.contains('skill_alchemist_splash_mastery') ||
                           tags.contains('skill_alchemist_final_1') ||
                           tags.contains('skill_alchemist_subclass')

    if (!hasSplashMastery) return

    // Check if damage is from potion or indirect magic
    let typeName = String(source.type).toLowerCase()
    let isMagicDamage = typeName.includes('magic')
    let isPotionEntity = (source.immediate && String(source.immediate.type).includes('potion'))

    if (isMagicDamage || isPotionEntity) {
        let splashDmgMultiplier = 1.35 // +35% damage
        if (tags.contains('skill_alchemist_final_1')) {
            splashDmgMultiplier = 1.50 // +50% damage for Final Master
        }

        event.damage *= splashDmgMultiplier

        attacker.server.runCommandSilent(`playsound minecraft:entity.splash_potion.break player ${attacker.username} ~ ~ ~ 0.8 1.4`)
        attacker.sendSystemMessage(Text.of(`§d💥 [Зельевар] Взрывное зелье нанесло +${Math.round((splashDmgMultiplier - 1) * 100)}% сокрушительного урона!`), true)
    }
})

// B. Splash potion stronger healing / buffs on throw
ItemEvents.rightClicked(event => {
    let player = event.player
    let item = event.item
    if (!player || !item) return

    let tags = player.tags
    if (!tags) return

    let hasSplashHealing = tags.contains('skill_alchemist_splash_mastery') ||
                           tags.contains('skill_alchemist_final_2') ||
                           tags.contains('skill_alchemist_subclass')

    if (!hasSplashHealing) return

    let itemId = String(item.id).toLowerCase()
    if (itemId === 'minecraft:splash_potion' || itemId === 'minecraft:lingering_potion') {
        // Scheduled pulse for stronger healing to thrower and allies
        player.server.scheduleInTicks(15, () => {
            if (!player || !player.isAlive()) return

            let level = player.level
            let nearby = level.getEntitiesWithin(AABB.of(player.x - 5, player.y - 2, player.z - 5, player.x + 5, player.y + 3, player.z + 5))

            nearby.forEach(ent => {
                if (ent && ent.isLiving() && (ent.isPlayer() || (ent.isAnimal && !ent.isMonster()))) {
                    ent.potionEffects.add('minecraft:regeneration', 100, 1, false, false) // Regeneration II for 5s
                    ent.potionEffects.add('minecraft:absorption', 200, 0, false, false) // Absorption I for 10s
                }
            })
            player.sendSystemMessage(Text.of('§a💖 [Алхимия Исцеления] Взрывное зелье восстанавливает силы союзников в радиусе поражения!'), true)
        })
    }
})
