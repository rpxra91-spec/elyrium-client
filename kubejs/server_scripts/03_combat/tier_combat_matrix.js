// ==============================================================================
// ⚔️ ELYRIUM: MASTER 8-TIER COMBAT MATRIX (KUBEJS 1.21.1 NEOFORGE)
// ==============================================================================
// Full 8-Tier Progression Universe (+ Tier 1.5 Undergarden):
// - Tier 1: Overworld (Единый Верхний Мир) - Wood, Leather, Copper, Iron, Steel, Diamond
// - Tier 1.5: The Undergarden (Опциональный мост) - Cloggrum, Froststeel
// - Tier 2: The Nether - Cinder Alloy, Netherite, Ignitium, Ignis
// - Tier 3: The Aether & Deep Aether - Zanite, Gravitite, Valkyrie, Skyjade
// - Tier 4: The End & Void Citadels - Dragonscale, Void Alloys, Shulker, Cataclysm Ender
// - Tier 5: Eternal Starlight - Starlight Metal, Luminite, Glacite
// - Tier 6: Deeper Darker (Otherside) - Sculk Alloys, Echo Resonators, Warden Relics
// - Tier 7: DivineRPG: Eden & Wildwood - Eden Fragments, Wildwood Essence
// - Tier 8: DivineRPG: Mortum (Кульминация, включая Apalachia & Skythern) - Halite, Mortum Ancient Regalia
// ==============================================================================

function getWeaponTier(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return 1

    // 1. Tag-based overrides
    for (let t = 8; t >= 1; t--) {
        if (item.hasTag(`skd:tier_${t}`) || item.hasTag(`c:tools/tier_${t}`)) return t
    }

    let id = item.id.toLowerCase()

    // Tier 8: DivineRPG Mortum, Apalachia & Skythern
    if (id.includes('mortum') || id.includes('divinerpg:mortum') || id.includes('the_incinerator') || id.includes('aquatooth') ||
        id.includes('apalachia') || id.includes('skythern') || id.includes('divinerpg:apalachia') || id.includes('divinerpg:skythern') || id.includes('halite')) return 8

    // Tier 7: DivineRPG Eden & Wildwood
    if (id.includes('eden') || id.includes('wildwood') || id.includes('divinerpg:eden') || id.includes('divinerpg:wildwood')) return 7

    // Tier 6: Deeper Darker (Otherside) / Warden
    if (id.includes('sculk') || id.includes('echo') || id.includes('warden') || id.startsWith('deeperdarker:')) return 6

    // Tier 5: Eternal Starlight
    if (id.includes('starlight') || id.includes('luminite') || id.includes('luminarite') || id.startsWith('eternal_starlight:') || id.includes('thermal_springstone')) return 5

    // Tier 4: The End / Void / Ender Guardian
    if (id.includes('dragon') || id.includes('void') || id.includes('ender_guardian') || id.includes('ender_golem') || id.includes('elytra') || id.includes('enderite')) return 4

    // Tier 3: The Aether & Deep Aether
    if (id.includes('gravitite') || id.includes('zanite') || id.includes('valkyrie') || id.includes('skyjade') || id.startsWith('aether:') || id.startsWith('deep_aether:')) return 3

    // Tier 2: The Nether (Cinder Alloy, Netherite, Ignitium)
    if (id.includes('cinder') || id.includes('netherite') || id.includes('ignitium') || id.includes('monstrosity') || id.includes('witherite') || id.includes('wither') || id.includes('ignis')) return 2

    // Tier 1.5: The Undergarden
    if (id.includes('cloggrum') || id.includes('froststeel') || id.startsWith('undergarden:')) return 1

    // Tier 1: Overworld
    return 1
}

function getArmorPieceTier(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return 0

    for (let t = 8; t >= 1; t--) {
        if (item.hasTag(`skd:tier_${t}`)) return t
    }

    let id = item.id.toLowerCase()

    if (id.includes('mortum') || id.includes('divinerpg:mortum') || id.includes('aquatooth') ||
        id.includes('apalachia') || id.includes('skythern') || id.includes('halite')) return 8
    if (id.includes('eden') || id.includes('wildwood')) return 7
    if (id.includes('sculk') || id.includes('echo') || id.includes('warden') || id.startsWith('deeperdarker:')) return 6
    if (id.includes('starlight') || id.includes('luminite') || id.startsWith('eternal_starlight:')) return 5
    if (id.includes('dragon') || id.includes('void') || id.includes('ender_guardian') || id.includes('ascended') || id.includes('enderite')) return 4
    if (id.includes('gravitite') || id.includes('zanite') || id.includes('valkyrie') || id.includes('skyjade') || id.startsWith('aether:')) return 3
    if (id.includes('cinder') || id.includes('netherite') || id.includes('ignitium') || id.includes('monstrosity') || id.includes('witherite')) return 2
    if (id.includes('cloggrum') || id.includes('froststeel') || id.startsWith('undergarden:')) return 1

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
        for (let t = 8; t >= 1; t--) {
            if (entity.tags.contains(`tier_${t}`) || entity.tags.contains(`t${t}_mob`) || entity.tags.contains(`skd:tier_${t}`)) {
                return t
            }
        }
    }

    // Tier 8: DivineRPG Mortum Bosses, Apalachia & Skythern
    if (id.includes('ancient_entity') || id.includes('reyvor') || id.includes('twilight_demon') || id.includes('the_eye') || id.includes('mortum') ||
        id.includes('vamacheron') || id.includes('karot') || id.includes('soul_stealer') || id.includes('apalachia') || id.includes('skythern')) {
        return 8
    }

    // Tier 7: DivineRPG Eden & Wildwood
    if (id.includes('parasect') || id.includes('wildwood_golem') || id.includes('eden') || id.includes('wildwood')) {
        return 7
    }

    // Tier 6: Deeper Darker (Otherside) / Warden
    if (id === 'minecraft:warden' || id.includes('stalker') || id.includes('sculk_snapper') || id.startsWith('deeperdarker:')) {
        return 6
    }

    // Tier 5: Eternal Starlight Bosses & Mobs
    if (id.includes('starlight_golem') || id.includes('lunar_monstrosity') || id.includes('tangled_hatred') || id.startsWith('eternal_starlight:')) {
        return 5
    }

    // Tier 4: The End & Void Cataclysm Bosses
    if (id === 'minecraft:ender_dragon' || id === 'cataclysm:ender_guardian' || id === 'cataclysm:ender_golem' || id === 'minecraft:shulker') {
        return 4
    }

    // Tier 3: The Aether Bosses & Mobs
    if (id.includes('sun_spirit') || id.includes('valkyrie_queen') || id.includes('slider') || id.startsWith('aether:') || id.startsWith('deep_aether:')) {
        return 3
    }

    // Tier 2: The Nether Bosses & Netherite Monstrosity
    if (id === 'cataclysm:netherite_monstrosity' || id === 'cataclysm:ignis' || id === 'minecraft:wither' ||
        id === 'minecraft:piglin_brute' || id === 'minecraft:wither_skeleton') {
        return 2
    }

    // Tier 1.5: The Undergarden
    if (id.startsWith('undergarden:')) {
        return 1
    }

    // Tier 1: Overworld Mobs & Mini-bosses
    return 1
}

// -----------------------------------------------------------------------------
// CENTRAL COMBAT HOOK (ORGANIC ARPG BALANCING)
// -----------------------------------------------------------------------------
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

        player.tell(Text.gold('═══════════════ [📊 ТИРЫ ЭКИПИРОВКИ (8 РАНГОВ)] ═══════════════'))
        player.tell(Text.yellow('⚔️ Оружие в руке: ').append(Text.aqua(`${wName}`)).append(Text.white(` ➔ `)).append(Text.green(`Ранг Т${wTier} / 8`)))
        player.tell(Text.yellow('🛡️ Средняя броня: ').append(Text.white(`➔ `)).append(Text.green(`Ранг Т${aTier} / 8`)))
        player.tell(Text.gray('  T1: Верхний Мир [T1.5: Undergarden] | T2: Незер | T3: Эфир | T4: Край'))
        player.tell(Text.gray('  T5: Starlight | T6: Otherside | T7: Eden/Wildwood | T8: Mortum'))
        player.tell(Text.gold('═══════════════════════════════════════════════════════════════'))
        event.cancel()
    }
})
