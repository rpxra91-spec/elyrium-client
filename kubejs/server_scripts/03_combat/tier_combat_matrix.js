// ==============================================================================
// ⚔️ ELYRIUM: MASTER 11-TIER COMBAT MATRIX (KUBEJS 1.21.1 NEOFORGE)
// ==============================================================================
// Full 11-Tier Progression Universe:
// - Tier 1: Overworld Sector I (0..1500) - Wood, Leather, Copper, Flint
// - Tier 2: Overworld Sector II (1500..3500) - Bronze, Chain, Early Iron, Silver, Brass
// - Tier 3: Overworld Sector III & Citadel (3500..5000) - Refined Steel, Cobalt, Runic, Diamond
// - Tier 4: The Nether - Cinder Alloy, Netherite, Ignitium
// - Tier 5: The Aether & Deep Aether - Zanite, Gravitite, Valkyrie, Skyjade
// - Tier 6: The End & Void Citadels - Dragonscale, Void Alloys, Shulker, Cataclysm Ender
// - Tier 7: Eternal Starlight - Starlight Metal, Luminite, Glacite
// - Tier 8: Deeper Darker (Otherside) - Sculk Alloys, Echo Resonators, Warden Relics
// - Tier 9: DivineRPG: Eden & Wildwood - Eden Fragments, Wildwood Essence
// - Tier 10: DivineRPG: Apalachia & Skythern - Apalachian Crystals, Skythern Alloys
// - Tier 11: DivineRPG: Mortum & Apex Cataclysm - Mortum Ancient Regalia, Incinerator
// ==============================================================================

function getWeaponTier(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return 1

    // 1. Tag-based overrides
    for (let t = 11; t >= 1; t--) {
        if (item.hasTag(`skd:tier_${t}`) || item.hasTag(`c:tools/tier_${t}`)) return t
    }

    let id = item.id.toLowerCase()

    // Tier 11: DivineRPG Mortum, Apex Void Cataclysm
    if (id.includes('mortum') || id.includes('divinerpg:mortum') || id.includes('the_incinerator') || id.includes('aquatooth')) return 11

    // Tier 10: DivineRPG Apalachia & Skythern
    if (id.includes('apalachia') || id.includes('skythern') || id.includes('divinerpg:apalachia') || id.includes('divinerpg:skythern')) return 10

    // Tier 9: DivineRPG Eden & Wildwood
    if (id.includes('eden') || id.includes('wildwood') || id.includes('divinerpg:eden') || id.includes('divinerpg:wildwood')) return 9

    // Tier 8: Deeper Darker (Otherside) / Warden
    if (id.includes('sculk') || id.includes('echo') || id.includes('warden') || id.startsWith('deeperdarker:')) return 8

    // Tier 7: Eternal Starlight
    if (id.includes('starlight') || id.includes('luminite') || id.startsWith('eternal_starlight:') || id.includes('thermal_springstone')) return 7

    // Tier 6: The End / Void / Ender Guardian
    if (id.includes('dragon') || id.includes('void') || id.includes('ender_guardian') || id.includes('ender_golem') || id.includes('elytra') || id.includes('ascended')) return 6

    // Tier 5: The Aether & Deep Aether
    if (id.includes('gravitite') || id.includes('zanite') || id.includes('valkyrie') || id.includes('skyjade') || id.startsWith('aether:') || id.startsWith('deep_aether:')) return 5

    // Tier 4: The Nether (Cinder Alloy, Netherite, Ignitium)
    if (id.includes('cinder') || id.includes('netherite') || id.includes('ignitium') || id.includes('monstrosity') || id.includes('witherite') || id.includes('wither')) return 4

    // Tier 3: Diamond, Cobalt, Rune / Runes, Iron (standard/advanced)
    if (id.includes('diamond') || id.includes('cobalt') || id.includes('rune') || id.includes('runic') || id.startsWith('runes:') || id.includes('amethyst') ||
        (id.includes('iron') && !id.includes('early_iron') && !id.includes('crude_iron') && !id.includes('rusted_iron'))) {
        return 3
    }

    // Tier 2: Copper, Chain, Iron early, Gold, Bronze, Brass, Flint, Silver
    if (id.includes('copper') || id.includes('chain') || id.includes('early_iron') || id.includes('crude_iron') || 
        id.includes('rusted_iron') || id.includes('gold') || id.includes('golden') || id.includes('bronze') || 
        id.includes('brass') || id.includes('silver') || id.includes('flint')) {
        return 2
    }

    // Tier 1: Wood, Leather, Stone, Starter items
    return 1
}

function getArmorPieceTier(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return 0

    for (let t = 11; t >= 1; t--) {
        if (item.hasTag(`skd:tier_${t}`)) return t
    }

    let id = item.id.toLowerCase()

    if (id.includes('mortum') || id.includes('divinerpg:mortum') || id.includes('aquatooth')) return 11
    if (id.includes('apalachia') || id.includes('skythern')) return 10
    if (id.includes('eden') || id.includes('wildwood')) return 9
    if (id.includes('sculk') || id.includes('echo') || id.includes('warden') || id.startsWith('deeperdarker:')) return 8
    if (id.includes('starlight') || id.includes('luminite') || id.startsWith('eternal_starlight:')) return 7
    if (id.includes('dragon') || id.includes('void') || id.includes('ender_guardian') || id.includes('ascended')) return 6
    if (id.includes('gravitite') || id.includes('zanite') || id.includes('valkyrie') || id.includes('skyjade') || id.startsWith('aether:')) return 5
    if (id.includes('cinder') || id.includes('netherite') || id.includes('ignitium') || id.includes('monstrosity') || id.includes('witherite')) return 4

    if (id.includes('diamond') || id.includes('cobalt') || id.includes('rune') || id.includes('runic') || 
        id.startsWith('runes:') || id.includes('o_yoroi') || id.includes('first_flamebearer') ||
        (id.includes('iron') && !id.includes('early') && !id.includes('crude') && !id.includes('rusted'))) {
        return 3
    }

    if (id.includes('copper') || id.includes('chain') || id.includes('gold') || id.includes('golden') || 
        id.includes('bronze') || id.includes('brass') || id.includes('silver') || id.includes('early_iron') || id.includes('crude_iron')) {
        return 2
    }

    if (id.includes('leather') || id.includes('wood') || id.includes('stone') || id.includes('cloth')) {
        return 1
    }

    return 1
}

function getPlayerArmorTier(player) {
    if (!player) return 0
    let slots = [
        player.getHeadArmorItem(),
        player.getChestArmorItem(),
        player.getLegsArmorItem(),
        player.getFeetArmorItem()
    ]
    let sum = 0
    let equippedCount = 0
    for (let item of slots) {
        if (item && !item.isEmpty() && item.id !== 'minecraft:air') {
            sum += getArmorPieceTier(item)
            equippedCount++
        }
    }
    if (equippedCount === 0) return 0
    return Math.round(sum / 4)
}

function getMobTier(entity) {
    if (!entity) return 1

    let id = entity.type ? entity.type.toString().toLowerCase() : ''

    // Explicit tag overrides
    if (entity.tags) {
        for (let t = 11; t >= 1; t--) {
            if (entity.tags.contains(`tier_${t}`) || entity.tags.contains(`t${t}_mob`) || entity.tags.contains(`skd:tier_${t}`)) {
                return t
            }
        }
    }

    // Tier 11: DivineRPG Mortum Bosses & Ancient Entity
    if (id.includes('ancient_entity') || id.includes('reyvor') || id.includes('twilight_demon') || id.includes('the_eye') || id.includes('mortum')) {
        return 11
    }

    // Tier 10: DivineRPG Apalachia & Skythern
    if (id.includes('vamacheron') || id.includes('karot') || id.includes('soul_stealer') || id.includes('apalachia') || id.includes('skythern')) {
        return 10
    }

    // Tier 9: DivineRPG Eden & Wildwood
    if (id.includes('parasect') || id.includes('wildwood_golem') || id.includes('eden') || id.includes('wildwood')) {
        return 9
    }

    // Tier 8: Deeper Darker (Otherside) / Warden
    if (id === 'minecraft:warden' || id.includes('stalker') || id.includes('sculk_snapper') || id.startsWith('deeperdarker:')) {
        return 8
    }

    // Tier 7: Eternal Starlight Bosses & Mobs
    if (id.includes('starlight_golem') || id.includes('lunar_monstrosity') || id.includes('tangled_hatred') || id.startsWith('eternal_starlight:')) {
        return 7
    }

    // Tier 6: The End & Void Cataclysm Bosses
    if (id === 'minecraft:ender_dragon' || id === 'cataclysm:ender_guardian' || id === 'cataclysm:ender_golem' || id === 'cataclysm:the_leviathan' || id === 'minecraft:shulker') {
        return 6
    }

    // Tier 5: The Aether Bosses & Mobs
    if (id.includes('sun_spirit') || id.includes('valkyrie_queen') || id.includes('slider') || id.startsWith('aether:') || id.startsWith('deep_aether:')) {
        return 5
    }

    // Tier 4: The Nether Bosses & Netherite Monstrosity
    if (id === 'cataclysm:netherite_monstrosity' || id === 'cataclysm:ignis' || id === 'cataclysm:the_harbinger' || id === 'minecraft:wither' ||
        id === 'minecraft:piglin_brute' || id === 'minecraft:wither_skeleton') {
        return 4
    }

    // Tier 3: Ancient Remnant, Kobolediator, Deeplings, Draugrs, Citadel Bosses
    if (id === 'cataclysm:kobolediator' || id === 'cataclysm:ancient_remnant' || id.includes('deepling') || 
        id.includes('draugr') || id.includes('koboleton') || id === 'cataclysm:wadjet' || id === 'cataclysm:amethyst_crab' || id.includes('apothic_boss')) {
        return 3
    }

    // Tier 2: Raiders, Pillagers, Vindicators, Warbands
    if (id === 'minecraft:pillager' || id === 'minecraft:vindicator' || id === 'minecraft:evoker' || 
        id === 'minecraft:ravager' || id === 'minecraft:witch' || id === 'minecraft:illusioner' || 
        id.includes('barbarian') || id.includes('pirate') || id.includes('warband') || id.includes('amazon') ||
        (entity.tags && entity.tags.contains('minecraft:raiders'))) {
        return 2
    }

    // Tier 1: Vanilla common monsters
    return 1
}

// -----------------------------------------------------------------------------
// CENTRAL COMBAT EVENT: TIER COMBAT MATRIX
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// CENTRAL COMBAT HOOK (ORGANIC ARPG BALANCING)
// -----------------------------------------------------------------------------
// Примечание: Искусственные штрафы урона (-50%/-85%), пробои (x2.0/x3.5) и рикошет
// по наковальне упразднены по решению Куратора. Сложность и баланс боя определяются
// органичными атрибутами мобов (HP/Armor/Attack), статами оружия и прокачкой SimpleStats.
EntityEvents.beforeHurt(event => {
    // Organically handled by entity attributes, armor, and SimpleStats
})

// -----------------------------------------------------------------------------
// CHAT COMMAND: .tier / .тир
// -----------------------------------------------------------------------------
PlayerEvents.chat(event => {
    let msg = event.message.trim().toLowerCase()
    let player = event.player
    if (!player) return

    if (msg === '.tier' || msg === '!tier' || msg === '.тир' || msg === 'тир') {
        let weapon = player.mainHandItem
        let wTier = getWeaponTier(weapon)
        let aTier = getPlayerArmorTier(player)
        let wName = weapon && !weapon.isEmpty() ? weapon.id : 'Пустые руки'

        player.tell(Text.gold('═══════════════ [📊 ТИРЫ ЭКИПИРОВКИ (11 РАНГОВ)] ═══════════════'))
        player.tell(Text.yellow('⚔️ Оружие в руке: ').append(Text.aqua(`${wName}`)).append(Text.white(` ➔ `)).append(Text.green(`Ранг Т${wTier} / 11`)))
        player.tell(Text.yellow('🛡️ Средняя броня: ').append(Text.white(`➔ `)).append(Text.green(`Ранг Т${aTier} / 11`)))
        player.tell(Text.gray('  T1-T3: Верхний Мир | T4: Незер | T5: Эфир | T6: Край | T7: Starlight'))
        player.tell(Text.gray('  T8: Otherside | T9: Eden/Wildwood | T10: Apalachia/Skythern | T11: Mortum'))
        player.tell(Text.gold('═══════════════════════════════════════════════════════════════'))
        event.cancel()
    }
})
