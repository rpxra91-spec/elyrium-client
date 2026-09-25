// ==============================================================================
// ⚡ ELYRIUM RPG: GEAR SCORE SYSTEM (KUBEJS 1.21.1 NEOFORGE)
// ==============================================================================
// Calculates individual item and total player Gear Score based on:
// - Item Tier (T1 - T4)
// - Equipment slot (Weapon, Armor, Shield, Curios)
// - Enchantment levels (Protection, Sharpness, etc.)
// - Apotheosis Affix Rarities (common -> ancient)
// ==============================================================================

function calculateItemGearScore(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return 0

    let id = String(item.id).toLowerCase()
    let isWeapon = item.hasTag('c:tools') || item.hasTag('minecraft:swords') || 
                   item.hasTag('minecraft:axes') || item.hasTag('c:weapons') || 
                   id.includes('sword') || id.includes('claymore') || id.includes('katana') || 
                   id.includes('scythe') || id.includes('axe') || id.includes('bow') || 
                   id.includes('staff') || id.includes('hammer') || id.includes('daggers') ||
                   id.includes('glaive') || id.includes('spear')

    let isArmor = item.hasTag('minecraft:head_armor') || item.hasTag('minecraft:chest_armor') || 
                  item.hasTag('minecraft:leg_armor') || item.hasTag('minecraft:foot_armor') ||
                  id.includes('helmet') || id.includes('chestplate') || id.includes('leggings') || 
                  id.includes('boots') || id.includes('hood') || id.includes('robe')

    let isShield = id.includes('shield')
    let isCurio = id.includes('ring') || id.includes('amulet') || id.includes('necklace') || 
                  id.includes('charm') || id.includes('belt') || id.startsWith('relics:') || 
                  id.startsWith('artifacts:')

    if (!isWeapon && !isArmor && !isShield && !isCurio) return 0

    // 1. Determine Tier
    let tier = 1
    if (item.hasTag('skd:tier_4') || item.hasTag('c:tools/tier_4')) tier = 4
    else if (item.hasTag('skd:tier_3') || item.hasTag('c:tools/tier_3')) tier = 3
    else if (item.hasTag('skd:tier_2') || item.hasTag('c:tools/tier_2')) tier = 2
    else if (id.includes('cinder') || id.includes('netherite') || id.startsWith('cataclysm:') || id.includes('ignitium') || id.includes('witherite') || id.includes('monstrosity')) tier = 4
    else if (id.includes('diamond') || id.includes('cobalt') || id.includes('rune') || id.includes('runic') || id.includes('amethyst') || (id.includes('iron') && !id.includes('early_iron') && !id.includes('crude_iron') && !id.includes('rusted_iron'))) tier = 3
    else if (id.includes('copper') || id.includes('chain') || id.includes('gold') || id.includes('golden') || id.includes('bronze') || id.includes('brass') || id.includes('flint')) tier = 2

    // 2. Base Gear Score by Tier & Category
    let baseScore = 0
    if (isWeapon) {
        if (tier === 1) baseScore = 35
        else if (tier === 2) baseScore = 85
        else if (tier === 3) baseScore = 190
        else if (tier === 4) baseScore = 360
    } else if (isArmor) {
        let slotMultiplier = 1.0
        if (id.includes('chestplate') || id.includes('robe')) slotMultiplier = 1.25
        else if (id.includes('boots')) slotMultiplier = 0.85

        if (tier === 1) baseScore = 25 * slotMultiplier
        else if (tier === 2) baseScore = 65 * slotMultiplier
        else if (tier === 3) baseScore = 150 * slotMultiplier
        else if (tier === 4) baseScore = 280 * slotMultiplier
    } else if (isShield) {
        if (tier === 1) baseScore = 20
        else if (tier === 2) baseScore = 55
        else if (tier === 3) baseScore = 120
        else if (tier === 4) baseScore = 220
    } else if (isCurio) {
        if (tier === 1) baseScore = 30
        else if (tier === 2) baseScore = 70
        else if (tier === 3) baseScore = 140
        else if (tier === 4) baseScore = 250
    }

    // 3. Enchantment Bonus (+15 GS per enchant level)
    let enchantBonus = 0
    try {
        let enchants = item.getEnchantments()
        if (enchants) {
            enchants.forEach((level, enchant) => {
                enchantBonus += (Number(level) || 1) * 15
            })
        }
    } catch (e) {
        // Safe fallback
    }

    // 4. Apotheosis / Affix Rarity Bonus
    let affixBonus = 0
    try {
        let tag = item.nbt
        if (tag && tag.contains('apoth.rarity')) {
            let rarity = String(tag.getString('apoth.rarity')).toLowerCase()
            if (rarity.includes('uncommon')) affixBonus += 40
            else if (rarity.includes('rare')) affixBonus += 80
            else if (rarity.includes('epic')) affixBonus += 150
            else if (rarity.includes('mythic')) affixBonus += 250
            else if (rarity.includes('ancient')) affixBonus += 380
            else affixBonus += 20
        }
    } catch (e) {
        // Safe fallback
    }

    return Math.round(baseScore + enchantBonus + affixBonus)
}

function getPlayerGearScore(player) {
    if (!player) return 0

    let total = 0

    let head = player.getHeadArmorItem()
    let chest = player.getChestArmorItem()
    let legs = player.getLegsArmorItem()
    let feet = player.getFeetArmorItem()

    total += calculateItemGearScore(head)
    total += calculateItemGearScore(chest)
    total += calculateItemGearScore(legs)
    total += calculateItemGearScore(feet)

    let main = player.getMainHandItem()
    let off = player.getOffHandItem()

    total += calculateItemGearScore(main)
    total += calculateItemGearScore(off)

    return total
}

function getGearScoreRank(score) {
    if (score < 150) return { title: '§7Новичок (Tier 1)', color: '§7', tier: 1 }
    if (score < 400) return { title: '§aАвантюрист (Tier 2)', color: '§a', tier: 2 }
    if (score < 750) return { title: '§bВетеран Элириума (Tier 3)', color: '§b', tier: 3 }
    if (score < 1200) return { title: '§6Легендарный Герой (Tier 4)', color: '§6', tier: 4 }
    return { title: '§dАбсолютный Чемпион (Apex)', color: '§d', tier: 4 }
}

// Command: /gs or /gearscore
ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event

    event.register(
        Commands.literal('gearscore')
            .executes(ctx => {
                let player = ctx.source.player
                if (!player) return 0

                let head = player.getHeadArmorItem()
                let chest = player.getChestArmorItem()
                let legs = player.getLegsArmorItem()
                let feet = player.getFeetArmorItem()
                let main = player.getMainHandItem()
                let off = player.getOffHandItem()

                let headGS = calculateItemGearScore(head)
                let chestGS = calculateItemGearScore(chest)
                let legsGS = calculateItemGearScore(legs)
                let feetGS = calculateItemGearScore(feet)
                let mainGS = calculateItemGearScore(main)
                let offGS = calculateItemGearScore(off)

                let total = headGS + chestGS + legsGS + feetGS + mainGS + offGS
                let rank = getGearScoreRank(total)

                player.tell('§6=================[ ⚡ GEAR SCORE ⚡ ]=================')
                player.tell('§eШлем: §f' + (head.isEmpty() ? '§8Пусто' : head.displayName.string) + ' §7(+' + headGS + ' GS)')
                player.tell('§eНагрудник: §f' + (chest.isEmpty() ? '§8Пусто' : chest.displayName.string) + ' §7(+' + chestGS + ' GS)')
                player.tell('§eПоножи: §f' + (legs.isEmpty() ? '§8Пусто' : legs.displayName.string) + ' §7(+' + legsGS + ' GS)')
                player.tell('§eБотинки: §f' + (feet.isEmpty() ? '§8Пусто' : feet.displayName.string) + ' §7(+' + feetGS + ' GS)')
                player.tell('§cОружие: §f' + (main.isEmpty() ? '§8Пусто' : main.displayName.string) + ' §7(+' + mainGS + ' GS)')
                if (!off.isEmpty()) {
                    player.tell('§9Вторая рука: §f' + off.displayName.string + ' §7(+' + offGS + ' GS)')
                }
                player.tell('§8--------------------------------------------------')
                player.tell('§6⚡ Общий Gear Score: §e' + total + ' §8| Ранг: ' + rank.title)
                player.tell('§7Рекомендации зон:')
                player.tell('  §7• Равнины Элириума: §a50 - 250 GS')
                player.tell('  §7• Заставы Налетчиков: §e250 - 450 GS')
                player.tell('  §7• Зона Прорыва (Ад 4k): §c500 - 850 GS')
                player.tell('  §7• Арены Cataclysm: §6850+ GS')
                player.tell('§6==================================================')
                return 1
            })
    )

    event.register(
        Commands.literal('gs')
            .executes(ctx => {
                let player = ctx.source.player
                if (player) {
                    player.server.runCommandSilent('gearscore')
                }
                return 1
            })
    )
})

// Periodic Sync to persistentData
PlayerEvents.tick(event => {
    let player = event.player
    if (player.age % 40 !== 0) return

    let gs = getPlayerGearScore(player)
    player.persistentData.gearScore = gs
})
