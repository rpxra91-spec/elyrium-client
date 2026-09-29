// ==============================================================================
// 🌌 ELYRIUM RPG: DIMENSIONAL PROGRESSION & BOSS GATING ENGINE (PHASE 8)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// Strict 11 Tiers progression hierarchy:
// - Tier 1: Overworld Sector I (0..1500) -> Sector I Guardian kill unlocks Sector II.
// - Tier 2: Overworld Sector II (1500..3500) -> Sector II Boss kill unlocks Sector III & Citadel.
// - Tier 3: Overworld Sector III & Citadel (3500..5000) -> Mal'Garos / Leviathan kill unlocks Nether.
// - Tier 4: The Nether (minecraft:the_nether) -> Monstrosity / Ignis kill unlocks Aether.
// - Tier 5: The Aether (aether:the_aether) -> Sun Spirit / Valkyrie Queen kill unlocks The End.
// - Tier 6: The End (minecraft:the_end) -> Ender Dragon / Ender Guardian kill unlocks Eternal Starlight.
// - Tier 7: Eternal Starlight (eternal_starlight:starlight_dimension) -> Starlight Titan kill unlocks Otherside.
// - Tier 8: Otherside (deeperdarker:otherside) -> Warden / Stalker kill unlocks DivineRPG Eden & Wildwood.
// - Tier 9: DivineRPG Eden & Wildwood (divinerpg:eden, wildwood) -> Eden Titans kill unlock Apalachia & Skythern.
// - Tier 10: DivineRPG Apalachia & Skythern (divinerpg:apalachia, skythern) -> Sky-lords kill unlock Mortum.
// - Tier 11: DivineRPG Mortum (divinerpg:mortum) -> Ancient Entity / Apex Climax.
// ==============================================================================

const SECTOR_1_RADIUS = 1500;
const SECTOR_1_RADIUS_SQ = 1500 * 1500;

const TIER_DIMENSION_REQUIREMENTS = {
    'minecraft:the_nether': {
        tier: 4,
        prereqTier: 3,
        bossName: 'Хранителя Черной Цитадели (Титан Малгарос / Левиафан)',
        prereqKey: 'skd_tier3_completed'
    },
    'aether:the_aether': {
        tier: 5,
        prereqTier: 4,
        bossName: 'Владыку Нижнего Мира (Netherite Monstrosity / Игнис)',
        prereqKey: 'skd_tier4_completed'
    },
    'deep_aether:deep_aether': {
        tier: 5,
        prereqTier: 4,
        bossName: 'Владыку Нижнего Мира (Netherite Monstrosity / Игнис)',
        prereqKey: 'skd_tier4_completed'
    },
    'minecraft:the_end': {
        tier: 6,
        prereqTier: 5,
        bossName: 'Духа Солнца Аэзера (Sun Spirit / Valkyrie Queen)',
        prereqKey: 'skd_tier5_completed'
    },
    'eternal_starlight:starlight_dimension': {
        tier: 7,
        prereqTier: 6,
        bossName: 'Дракона Края (Ender Dragon / Ender Guardian)',
        prereqKey: 'skd_tier6_completed'
    },
    'deeperdarker:otherside': {
        tier: 8,
        prereqTier: 7,
        bossName: 'Титана Звездного Света (Starlight Golem / Lunar Beast)',
        prereqKey: 'skd_tier7_completed'
    },
    'divinerpg:eden': {
        tier: 9,
        prereqTier: 8,
        bossName: 'Хранителя Глубинной Тьмы (Warden / Древний Сталкер)',
        prereqKey: 'skd_tier8_completed'
    },
    'divinerpg:wildwood': {
        tier: 9,
        prereqTier: 8,
        bossName: 'Хранителя Глубинной Тьмы (Warden / Древний Сталкер)',
        prereqKey: 'skd_tier8_completed'
    },
    'divinerpg:apalachia': {
        tier: 10,
        prereqTier: 9,
        bossName: 'Исполинов Эдема и Диколесья (Eden / Wildwood Titans)',
        prereqKey: 'skd_tier9_completed'
    },
    'divinerpg:skythern': {
        tier: 10,
        prereqTier: 9,
        bossName: 'Исполинов Эдема и Диколесья (Eden / Wildwood Titans)',
        prereqKey: 'skd_tier9_completed'
    },
    'divinerpg:mortum': {
        tier: 11,
        prereqTier: 10,
        bossName: 'Повелителей Бурь Апалачии (Vamacheron / Karot)',
        prereqKey: 'skd_tier10_completed'
    }
}

function getPlayerTier(player) {
    if (!player) return 1
    if (player.isCreative && player.isCreative()) return 11
    if (player.isSpectator && player.isSpectator()) return 11
    if (player.tags && (player.tags.contains('tier_bypass') || player.tags.contains('admin_bypass'))) return 11

    let data = player.persistentData
    if (data.getBoolean('skd_tier10_completed')) return 11
    if (data.getBoolean('skd_tier9_completed')) return 10
    if (data.getBoolean('skd_tier8_completed')) return 9
    if (data.getBoolean('skd_tier7_completed')) return 8
    if (data.getBoolean('skd_tier6_completed')) return 7
    if (data.getBoolean('skd_tier5_completed')) return 6
    if (data.getBoolean('skd_tier4_completed')) return 5
    if (data.getBoolean('skd_tier3_completed')) return 4
    if (data.getBoolean('skd_tier2_completed')) return 3
    if (data.getBoolean('skd_sector1_completed') || data.getBoolean('skd_tier1_completed')) return 2
    return 1
}

function checkDimensionAccess(player) {
    if (!player || !player.isAlive()) return
    if (player.isCreative && player.isCreative()) return
    if (player.isSpectator && player.isSpectator()) return
    if (player.tags && (player.tags.contains('tier_bypass') || player.tags.contains('admin_bypass'))) return

    let dimId = String(player.level.dimension)
    let req = TIER_DIMENSION_REQUIREMENTS[dimId]
    if (!req) return

    let data = player.persistentData
    let hasAccess = data.getBoolean(req.prereqKey)

    if (!hasAccess) {
        // Intercept illegal entry: Teleport safely back to Capital spawn
        player.server.runCommandSilent(`tp ${player.username} 0 75 0 0 0`)
        player.potionEffects.add('minecraft:resistance', 100, 4, false, false)
        player.potionEffects.add('minecraft:slow_falling', 100, 0, false, false)

        // Majestic warning in Russian
        player.tell(Text.red('════════════════════════════════════════════════════════'))
        player.tell(Text.gold('⚡ ДРЕВНИЕ ВРАТА МИРА ОТВЕРГАЮТ ВАС! ⚡'))
        player.tell(Text.yellow(`Для перехода в этот мир необходимо повергнуть: `).append(Text.aqua(req.bossName)))
        player.tell(Text.gray(`Требуемый ранг прогрессии: Тир ${req.tier} | Ваш текущий ранг: Тир ${getPlayerTier(player)} / 11`))
        player.tell(Text.red('════════════════════════════════════════════════════════'))

        player.sendSystemMessage(Text.of(`§c⚡ Врата отвергают вас! Сначала сокрушите: ${req.bossName}`), true)

        player.server.runCommandSilent(`playsound minecraft:block.respawn_anchor.deplete player ${player.username} 0 75 0 1.2 0.8`)
        player.server.runCommandSilent(`particle minecraft:electric_spark 0 76 0 1 1 1 0.2 25 normal`)
    }
}

// Sector 1 Overworld boundary enforcement is now fully handled by
// 06_world_colonies/sector_progression_engine.js with soft-gating miasma and 8 progressive sectors.
function checkOverworldSectorAccess(player) {
    // Handled by sector_progression_engine.js
}

// -----------------------------------------------------------------------------
// 1. DIMENSION CHANGE / LOGIN / SECTOR VERIFICATION
// -----------------------------------------------------------------------------
ServerEvents.tick(event => {
    let server = event.server
    if (server.tickCount % 20 !== 0) return

    server.players.forEach(player => {
        if (!player || !player.isAlive()) return
        checkDimensionAccess(player)
    })
})

PlayerEvents.loggedIn(event => {
    let player = event.player
    checkDimensionAccess(player)
})

// -----------------------------------------------------------------------------
// 2. BOSS KILL PROGRESSION UNLOCK HANDLER (11 TIERS)
// -----------------------------------------------------------------------------
function grantTierProgress(player, server, tier, titleText, subtitleText) {
    if (!player) return
    let key = `skd_tier${tier}_completed`
    if (player.persistentData.getBoolean(key)) return

    player.persistentData.putBoolean(key, true)
    if (tier === 1) player.persistentData.putBoolean('skd_sector1_completed', true)

    server.runCommandSilent(`title ${player.username} times 10 70 20`)
    server.runCommandSilent(`title ${player.username} title {\"text\":\"${titleText}\",\"color\":\"gold\",\"bold\":true}`)
    server.runCommandSilent(`title ${player.username} subtitle {\"text\":\"${subtitleText}\",\"color\":\"aqua\"}`)

    server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete player ${player.username} ~ ~ ~ 1.2 1.0`)
    server.runCommandSilent(`playsound minecraft:block.bell.use player ${player.username} ~ ~ ~ 1.5 0.7`)

    player.tell(Text.gold('════════════════════════════════════════════════════════'))
    player.tell(Text.yellow(`🏆 ПОКОРЁН НОВЫЙ РАНГ ПРОГРЕССИИ: ТИР ${tier} / 11!`))
    player.tell(Text.white(`   ${subtitleText}`))
    player.tell(Text.gold('════════════════════════════════════════════════════════'))
}

EntityEvents.death(event => {
    let entity = event.entity
    if (!entity) return

    let entityId = entity.type ? entity.type.toString().toLowerCase() : ''
    let server = event.server
    let killer = event.source ? event.source.player : null

    let awardNearby = (tier, title, subtitle) => {
        let ex = entity.x
        let ey = entity.y
        let ez = entity.z
        server.players.forEach(p => {
            if (!p || !p.isAlive()) return
            let dist = Math.hypot(p.x - ex, p.z - ez)
            if (p === killer || dist <= 96.0) {
                grantTierProgress(p, server, tier, title, subtitle)
            }
        })
    }

    // Tier 1 -> Tier 2: Sector I Boss
    if (entityId === 'cataclysm:ancient_remnant' || entityId === 'cataclysm:kobolediator') {
        awardNearby(1, '⚡ СЕКТОР I ПОКОРЕН! ⚡', 'Рубежный Вал рассеян. Открыт Сектор II.')
    }

    // Tier 2 -> Tier 3: Sector II Boss
    if (entityId === 'cataclysm:the_harbinger') {
        awardNearby(2, '⚡ СЕКТОР II ПОКОРЕН! ⚡', 'Открыт доступ к Дальнему Кольцу Шпилей и Черной Цитадели (Tier 3).')
    }

    // Tier 3 -> Tier 4: Overworld Citadel Boss unlocks Nether
    if (entityId === 'cataclysm:the_leviathan' || entityId.includes('malgaros')) {
        awardNearby(3, '🔥 ВРАТА ПРЕИСПОДНЕЙ РАСПЕЧАТАНЫ! 🔥', 'Вам открыто создание Инфернального Портала (Tier 4: Nether).')
    }

    // Tier 4 -> Tier 5: Nether Bosses unlock Aether
    if (entityId === 'cataclysm:netherite_monstrosity' || entityId === 'cataclysm:ignis') {
        awardNearby(4, '🌤 НЕБЕСНЫЙ ЭФИР ЗОВЕТ! 🌤', 'Владыка Незера пал. Открыты Небеса Аэзера (Tier 5: Aether).')
    }

    // Tier 5 -> Tier 6: Aether Bosses unlock The End
    if (entityId.includes('sun_spirit') || entityId.includes('slider') || entityId.includes('valkyrie_queen')) {
        awardNearby(5, '👁 РАЗЛОМ КРАЯ ПРОБУЖДЕН! 👁', 'Хранители Аэзера повержены. Открыто измерение Края (Tier 6: The End).')
    }

    // Tier 6 -> Tier 7: Ender Dragon / Ender Guardian unlocks Eternal Starlight
    if (entityId === 'minecraft:ender_dragon' || entityId === 'cataclysm:ender_guardian') {
        awardNearby(6, '⭐ СИЯНИЕ ЗВЕЗД ПРОНЗАЕТ МРАК! ⭐', 'Владыка Края пал. Открыт мир Вечного Звездного Света (Tier 7).')
    }

    // Tier 7 -> Tier 8: Starlight Titan unlocks Otherside (Deeper Darker)
    if (entityId.includes('starlight_golem') || entityId.includes('lunar_monstrosity') || entityId.includes('tangled_hatred')) {
        awardNearby(7, '🌑 БЕЗДНА ТЬМЫ ОТКРЫТА! 🌑', 'Титан Звезд повержен. Доступ в Глубинную Тьму открыт (Tier 8: Otherside).')
    }

    // Tier 8 -> Tier 9: Warden / Stalker unlocks DivineRPG Eden & Wildwood
    if (entityId === 'minecraft:warden' || entityId.includes('stalker')) {
        awardNearby(8, '🌿 ВРАТА ЭДЕМА И ДИКОЛЕСЬЯ ОТВОРЕНЫ! 🌿', 'Хранитель Тьмы пал. Открыты священные миры DivineRPG (Tier 9: Eden).')
    }

    // Tier 9 -> Tier 10: Eden / Wildwood Bosses unlock Apalachia & Skythern
    if (entityId.includes('parasect') || entityId.includes('wildwood_golem')) {
        awardNearby(9, '⚡ БУРИ АПАЛАЧИИ И НЕБЕСА СКАЙТЕРНА! ⚡', 'Древесные Титаны повержены. Открыт Tier 10.')
    }

    // Tier 10 -> Tier 11: Apalachia / Skythern Bosses unlock Mortum
    if (entityId.includes('vamacheron') || entityId.includes('karot') || entityId.includes('soul_stealer')) {
        awardNearby(10, '💀 ВЕЛИКАЯ ПЕЧАТЬ МОРТУМА РАЗБИТА! 💀', 'Открыт доступ к Кульминации Элириума: Мир Смерти (Tier 11: Mortum).')
    }
})

// -----------------------------------------------------------------------------
// 3. CHAT COMMANDS: .progression / .тиры / .unlocktier
// -----------------------------------------------------------------------------
PlayerEvents.chat(event => {
    let msg = event.message.trim().toLowerCase()
    let player = event.player
    if (!player) return

    if (msg === '.progression' || msg === '.тиры' || msg === '!progression') {
        let currentTier = getPlayerTier(player)
        let data = player.persistentData

        player.tell(Text.gold('══════════════ [🌌 МЕЖМИРОВАЯ ПРОГРЕССИЯ: 11 РАНГОВ] ══════════════'))
        player.tell(Text.yellow(`✦ Ваш текущий ранг: `).append(Text.aqua(`Тир ${currentTier} / 11`)))
        player.tell(Text.white(`  • Тир 1 (Сектор I): `).append(data.getBoolean('skd_sector1_completed') ? Text.green('✔ Покорен') : Text.red('✖ Не пройден')))
        player.tell(Text.white(`  • Тир 2 (Сектор II): `).append(data.getBoolean('skd_tier2_completed') ? Text.green('✔ Покорен') : Text.red('✖ Заблокирован')))
        player.tell(Text.white(`  • Тир 3 (Цитадель / Шпили): `).append(data.getBoolean('skd_tier3_completed') ? Text.green('✔ Покорен') : Text.red('✖ Заблокирован')))
        player.tell(Text.white(`  • Тир 4 (Преисподняя / Nether): `).append(data.getBoolean('skd_tier4_completed') ? Text.green('✔ Покорен') : Text.red('✖ Заблокирован')))
        player.tell(Text.white(`  • Тир 5 (Эфир / The Aether): `).append(data.getBoolean('skd_tier5_completed') ? Text.green('✔ Покорен') : Text.red('✖ Заблокирован')))
        player.tell(Text.white(`  • Тир 6 (Край / The End): `).append(data.getBoolean('skd_tier6_completed') ? Text.green('✔ Покорен') : Text.red('✖ Заблокирован')))
        player.tell(Text.white(`  • Тир 7 (Звездный Свет / Starlight): `).append(data.getBoolean('skd_tier7_completed') ? Text.green('✔ Покорен') : Text.red('✖ Заблокирован')))
        player.tell(Text.white(`  • Тир 8 (Глубинная Тьма / Otherside): `).append(data.getBoolean('skd_tier8_completed') ? Text.green('✔ Покорен') : Text.red('✖ Заблокирован')))
        player.tell(Text.white(`  • Тир 9 (Эдем и Диколесье / DivineRPG): `).append(data.getBoolean('skd_tier9_completed') ? Text.green('✔ Покорен') : Text.red('✖ Заблокирован')))
        player.tell(Text.white(`  • Тир 10 (Апалачия и Скайтерн): `).append(data.getBoolean('skd_tier10_completed') ? Text.green('✔ Покорен') : Text.red('✖ Заблокирован')))
        player.tell(Text.white(`  • Тир 11 (Мортум / Апогей Смерти): `).append(data.getBoolean('skd_tier10_completed') ? Text.green('✔ Открыт Финал') : Text.red('✖ Заблокирован')))
        player.tell(Text.gold('═════════════════════════════════════════════════════════════════'))
        event.cancel()
    } else if (msg.startsWith('.unlocktier ') || msg.startsWith('!unlocktier ')) {
        let parts = msg.split(' ')
        let tierNum = parseInt(parts[1])
        if (!isNaN(tierNum) && tierNum >= 1 && tierNum <= 11) {
            for (let i = 1; i <= tierNum; i++) {
                player.persistentData.putBoolean(`skd_tier${i}_completed`, true)
            }
            player.persistentData.putBoolean('skd_sector1_completed', true)
            player.tell(Text.green(`✦ [Прогрессия]: Успешно открыты все миры вплоть до Тира ${Math.min(11, tierNum + 1)} / 11!`))
        } else {
            player.tell(Text.red(`✦ [Ошибка]: Укажите номер тира от 1 до 11 (пример: .unlocktier 5)`))
        }
        event.cancel()
    }
})
