// ==============================================================================
// ⚡ CLIENT TOOLTIPS: GEAR SCORE DISPLAY (KUBEJS 1.21.1)
// ==============================================================================

ItemEvents.modifyTooltips(event => {
    event.modify('*', tooltip => {
        let item = tooltip.item
        if (!item || item.isEmpty() || item.id === 'minecraft:air') return

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

        if (!isWeapon && !isArmor && !isShield && !isCurio) return

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

        // 3. Enchantment Bonus
        let enchantBonus = 0
        try {
            let enchants = item.getEnchantments()
            if (enchants) {
                enchants.forEach((level, enchant) => {
                    enchantBonus += (Number(level) || 1) * 15
                })
            }
        } catch (e) {}

        // 4. Apotheosis Affix Bonus
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
        } catch (e) {}

        let total = Math.round(baseScore + enchantBonus + affixBonus)
        let tierColor = '§7'
        let tierName = 'T1'
        if (tier === 2) { tierColor = '§a'; tierName = 'T2' }
        else if (tier === 3) { tierColor = '§b'; tierName = 'T3' }
        else if (tier === 4) { tierColor = '§6'; tierName = 'T4' }

        tooltip.add(Text.of('§6⚡ Gear Score: ' + tierColor + '+' + total + ' §8[' + tierColor + tierName + '§8]'))
    })
})
