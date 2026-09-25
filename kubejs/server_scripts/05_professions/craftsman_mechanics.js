// ==============================================================================
// 🛠️ ELYRIUM RPG: CRAFTSMAN, BLACKSMITH & ENCHANTER MECHANICS ENGINE
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 1. Durability bonus & Masterwork creation on crafted armor, weapons, tools, shields.
// 2. Anvil repair cost reduction & free repair chance for Blacksmiths.
// 3. Free enchanting chance & XP cost refund for Enchanters.
// ==============================================================================

// ------------------------------------------------------------------------------
// 1. DURABILITY & MASTERWORK CRAFTING
// ------------------------------------------------------------------------------
ItemEvents.crafted(event => {
    let player = event.player
    let item = event.item
    if (!player || !item) return

    let tags = player.tags
    if (!tags) return

    // Equipment with durability: Weapons, Armor, Tools, Shields
    if (item.maxDamage > 0) {
        let durabilityBonusPct = 0
        let isMasterworkEligible = false

        // Base gateway bonuses
        if (tags.contains('skill_blacksmith_durability_1')) durabilityBonusPct += 4
        if (tags.contains('skill_craftsman_durability_bonus')) {
            durabilityBonusPct += 8
            isMasterworkEligible = true
        }

        // Arcansmith branch bonuses
        if (tags.contains('skill_arcansmith_general_durability_1')) durabilityBonusPct += 3
        if (tags.contains('skill_arcansmith_subclass')) {
            durabilityBonusPct += 8
            isMasterworkEligible = true
        }
        if (tags.contains('skill_arcansmith_final')) {
            durabilityBonusPct += 15
            isMasterworkEligible = true
        }

        // Blacksmith subclass bonuses
        if (tags.contains('skill_blacksmith_subclass')) {
            durabilityBonusPct += 12
            isMasterworkEligible = true
        }
        if (tags.contains('skill_blacksmith_durability_basics_1')) durabilityBonusPct += 3
        if (tags.contains('skill_blacksmith_durability_basics_2')) durabilityBonusPct += 3
        if (tags.contains('skill_blacksmith_mastery')) {
            durabilityBonusPct += 25
            isMasterworkEligible = true
        }

        if (durabilityBonusPct > 0) {
            let isMasterwork = isMasterworkEligible && (Math.random() < 0.15)
            if (isMasterwork) durabilityBonusPct += 20

            let currentMax = item.maxDamage
            let newMax = Math.round(currentMax * (1.0 + durabilityBonusPct / 100.0))
            item.setMaxDamage(newMax)

            // Crafting Lore
            let loreLines = []
            if (isMasterwork) {
                loreLines.push(Text.of('§6⭐ ШЕДЕВР КУЗНЕЧНОГО ИСКУССТВА'))
                loreLines.push(Text.of(`§7Прочность: §a+${durabilityBonusPct}% (§f${newMax} макс.§7)`))
                loreLines.push(Text.of('§e🔨 Идеальная ковка высшего мастера'))

                // Grant bonus Unbreaking I if not already present
                let curUnb = item.getEnchantmentLevel('minecraft:unbreaking') || 0
                if (curUnb < 1) {
                    item.enchant('minecraft:unbreaking', 1)
                }

                let itemName = (item.displayName ? item.displayName.string : item.id)
                player.sendSystemMessage(Text.of(`§6🌟 ВЕЛИКОЛЕПНО! Создан редкий ШЕДЕВР: §e${itemName} (Прочность: ${newMax})!`), true)
            } else {
                loreLines.push(Text.of('§7🔨 Выковано Ремесленником'))
                loreLines.push(Text.of(`§7Прочность: §a+${durabilityBonusPct}% (§f${newMax} макс.§7)`))

                player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.7 1.3`)
                player.sendSystemMessage(Text.of(`§7🔨 Создана укреплённая экипировка (Прочность: ${newMax})`), true)
            }

            item.setLore(loreLines)
        }
    }
})

// ------------------------------------------------------------------------------
// 2. ANVIL REPAIR COST REDUCTION & FREE REPAIR CHANCE
// ------------------------------------------------------------------------------
PlayerEvents.inventoryChanged(event => {
    let player = event.player
    if (!player || !player.isAlive()) return

    let menu = player.containerMenu
    if (!menu) return

    let menuClass = String(menu)
    if (!menuClass.includes('Anvil')) return

    // Slot 2 in AnvilMenu is the result slot
    if (event.slot !== 2) return

    let item = event.item
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return

    let tags = player.tags
    if (!tags) return

    let hasMastery = tags.contains('skill_blacksmith_mastery')
    let hasRepairMaster = tags.contains('skill_blacksmith_repair_master')
    let hasRepair2 = tags.contains('skill_blacksmith_repair_2')
    let hasRepair1 = tags.contains('skill_blacksmith_repair_1')

    if (!hasMastery && !hasRepairMaster && !hasRepair2 && !hasRepair1) return

    // Free repair chance check
    let freeRepairChance = 0.0
    if (hasMastery) freeRepairChance += 0.20
    if (hasRepairMaster) freeRepairChance += 0.10

    let isFree = Math.random() < freeRepairChance

    if (isFree) {
        // Refund full XP: give 3-5 levels back
        let refundLevels = 3 + Math.floor(Math.random() * 3)
        player.giveExperienceLevels(refundLevels)

        player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.9 1.2`)
        player.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${player.username} ~ ~ ~ 0.8 1.4`)
        player.sendSystemMessage(Text.of(`§6🔨 [Мастер-Кузнец] Высшее мастерство: Починка выполнена БЕСПЛАТНО! (+${refundLevels} ур. опыта возвращено)`), true)
    } else {
        // Efficiency discount: refund 1-2 levels
        let discountLevels = hasMastery ? 2 : 1
        player.giveExperienceLevels(discountLevels)

        player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.7 1.1`)
        player.sendSystemMessage(Text.of(`§e🔨 [Кузнец] Экономия починки: возвращено ${discountLevels} ур. опыта`), true)
    }
})

// ------------------------------------------------------------------------------
// 3. FREE ENCHANTING CHANCE & XP COST REFUND ON ENCHANTING TABLE
// ------------------------------------------------------------------------------
PlayerEvents.inventoryChanged(event => {
    let player = event.player
    if (!player || !player.isAlive()) return

    let menu = player.containerMenu
    if (!menu) return

    let menuClass = String(menu)
    if (!menuClass.includes('Enchant')) return

    // In EnchantmentMenu, slot 0 is the item to enchant
    if (event.slot !== 0) return

    let item = event.item
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return

    // Check if item has enchantments
    let enchantments = item.enchantments
    if (!enchantments || enchantments.isEmpty()) return

    let tags = player.tags
    if (!tags) return

    let hasFinalEnchant = tags.contains('skill_enchanter_final_1')
    let hasLuck = tags.contains('skill_enchanter_luck')
    let hasSubclass = tags.contains('skill_enchanter_subclass')
    let hasEconomyNotable1 = tags.contains('skill_enchanter_economy_notable_1')
    let hasEconomyNotable2 = tags.contains('skill_enchanter_economy_notable_2')
    let hasArcansmithFree = tags.contains('skill_arcansmith_free_enchant_1') || tags.contains('skill_arcansmith_free_enchant_2')

    if (!hasFinalEnchant && !hasLuck && !hasSubclass && !hasEconomyNotable1 && !hasEconomyNotable2 && !hasArcansmithFree) return

    // Free Enchantment chance roll
    let freeChance = 0.0
    if (hasFinalEnchant) freeChance += 0.10
    if (hasLuck) freeChance += 0.05
    if (hasSubclass) freeChance += 0.025
    if (hasArcansmithFree) freeChance += 0.025

    let isFreeEnchant = Math.random() < freeChance

    if (isFreeEnchant) {
        // Refund 3 levels of XP and 3 Lapis Lazuli
        player.giveExperienceLevels(3)
        player.give(Item.of('minecraft:lapis_lazuli', 3))

        player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 1.0 1.4`)
        player.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${player.username} ~ ~ ~ 0.8 1.3`)
        player.sendSystemMessage(Text.of('§d✨ [Зачарователь] ВЕЛИКОЕ ЧАРОВАНИЕ: Зачарование получено БЕСПЛАТНО! (+3 ур. опыта и 3 лазурита возвращены)'), true)
    } else if (hasFinalEnchant || hasSubclass || hasEconomyNotable1 || hasEconomyNotable2) {
        // XP Cost Discount: Refund 1-2 levels
        let refundLevels = hasFinalEnchant ? 2 : 1
        player.giveExperienceLevels(refundLevels)

        player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 0.7 1.2`)
        player.sendSystemMessage(Text.of(`§b✨ [Зачарователь] Экономия чар: возвращено ${refundLevels} ур. опыта`), true)
    }
})
