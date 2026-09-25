// KubeJS Script: Complete Weapon & Magic Mastery System (Performance & Zero-Leak Edition)
// Tracks usage for: Swords/Daggers, Heavy Weapons/Axes, Bows/Crossbows, Magic/Spells
// 20 Ranks each, +1.5% bonus damage per rank (up to +30%)
// Uses clean, flat primitive NBT tags to guarantee zero memory overhead

const MAX_MASTERY_LVL = 20
const BASE_XP_REQ = 120 // Base XP needed for rank 1
const SCALING = 1.35     // XP multiplier per level
const BONUS_PER_LVL = 0.015 // +1.5% damage per rank

function getXpForLvl(lvl) {
    let req = BASE_XP_REQ
    for (let i = 1; i < lvl; i++) {
        req = Math.floor(req * SCALING)
    }
    return req
}

// Clean up any corrupt legacy objects from persistentData
function sanitizeMastery(player) {
    if (!player || !player.persistentData) return
    let pdata = player.persistentData
    if (pdata.contains('mastery')) {
        pdata.remove('mastery')
    }
}

function getMasteryLvl(player, type) {
    sanitizeMastery(player)
    return player.persistentData.getInt(`skd_m_${type}_lvl`) || 0
}

function getMasteryXp(player, type) {
    sanitizeMastery(player)
    return player.persistentData.getInt(`skd_m_${type}_xp`) || 0
}

function setMasteryData(player, type, lvl, xp) {
    sanitizeMastery(player)
    player.persistentData.putInt(`skd_m_${type}_lvl`, Math.floor(lvl))
    player.persistentData.putInt(`skd_m_${type}_xp`, Math.floor(xp))
}

function addMasteryXp(player, type, xpGained, typeName) {
    if (!player || !player.isPlayer()) return
    let curLvl = getMasteryLvl(player, type)
    if (curLvl >= MAX_MASTERY_LVL) return

    let curXp = getMasteryXp(player, type) + Math.round(Number(xpGained) || 0)
    let reqXp = getXpForLvl(curLvl + 1)

    if (curXp >= reqXp) {
        curXp -= reqXp
        curLvl += 1

        let pct = (curLvl * BONUS_PER_LVL * 100).toFixed(1)
        player.tell(Text.gold(`★ Мастерство: `).append(Text.aqua(`${typeName}`)).append(Text.white(` повышено до `)).append(Text.yellow(`ур. ${curLvl}!`)).append(Text.green(` (+${pct}% урона)`)))
        player.sendSystemMessage(Text.gold(`[Мастерство] `).append(Text.yellow(`${typeName} ➔ Ур. ${curLvl}`)), true)
        player.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${player.username} ~ ~ ~ 1 1.2`)
    }

    setMasteryData(player, type, curLvl, curXp)
}

// Auto-clean on player login
PlayerEvents.loggedIn(event => {
    sanitizeMastery(event.player)
})

// Periodic auto-clean for all online players (runs once every 200 ticks / 10s)
ServerEvents.tick(event => {
    if (event.server.tickCount % 200 !== 0) return
    event.server.players.forEach(p => sanitizeMastery(p))
})

// 1. Hook damage dealt to mobs (Swords, Axes, Bows, Magic)
EntityEvents.beforeHurt(event => {
    let source = event.source
    if (!source || !source.player) return
    let player = source.player
    if (!player.isPlayer()) return

    let target = event.entity
    if (!target || !target.isLiving() || target.isPlayer()) return

    let mainHand = player.mainHandItem
    let currentDmg = Number(event.damage) || 0

    // A) Projectile / Arrows (Archery)
    if (source.isDirect() === false && (source.getType() === 'arrow' || source.getType() === 'spectral_arrow' || source.getType() === 'trident')) {
        let lvl = getMasteryLvl(player, 'bows')
        if (lvl > 0) {
            event.damage = currentDmg * (1.0 + lvl * BONUS_PER_LVL)
        }
        addMasteryXp(player, 'bows', Math.min(currentDmg * 0.8, 40), 'Стрельба')
        return
    }

    // B) Magic / Spells (Iron's Spells or magic damage)
    let dmgType = source.getType()
    if (dmgType.includes('magic') || dmgType.includes('spell') || dmgType.includes('fire') || dmgType.includes('lightning') || dmgType.includes('freeze')) {
        let lvl = getMasteryLvl(player, 'magic')
        if (lvl > 0) {
            event.damage = currentDmg * (1.0 + lvl * BONUS_PER_LVL)
        }
        addMasteryXp(player, 'magic', Math.min(currentDmg * 0.8, 40), 'Магия')
        return
    }

    // C) Melee Weapons: Swords vs Heavy Weapons
    if (!mainHand || mainHand.isEmpty()) return

    let id = mainHand.id || ''
    // Swords / Daggers / Rapiers / Scythes
    if (mainHand.hasTag('c:swords') || mainHand.hasTag('minecraft:swords') || 
        mainHand.hasTag('c:tools/melee_weapon') || mainHand.hasTag('c:tools/dagger') ||
        id.includes('sword') || id.includes('rapier') || id.includes('dagger') || 
        id.includes('katana') || id.includes('scythe') || id.includes('cutlass')) {
        
        let lvl = getMasteryLvl(player, 'swords')
        if (lvl > 0) {
            event.damage = currentDmg * (1.0 + lvl * BONUS_PER_LVL)
        }
        addMasteryXp(player, 'swords', Math.min(currentDmg * 0.8, 40), 'Клинки')
    }
    // Heavy Weapons / Axes / Hammers / Claymores / Halberds
    else if (mainHand.hasTag('c:axes') || mainHand.hasTag('minecraft:axes') || 
             id.includes('axe') || id.includes('hammer') || 
             id.includes('claymore') || id.includes('halberd') || id.includes('mace')) {
        
        let lvl = getMasteryLvl(player, 'axes')
        if (lvl > 0) {
            event.damage = currentDmg * (1.0 + lvl * BONUS_PER_LVL)
        }
        addMasteryXp(player, 'axes', Math.min(currentDmg * 0.8, 40), 'Тяжёлое оружие')
    }
})

// 2. Extra bonus XP when killing mobs
EntityEvents.death(event => {
    let source = event.source
    if (!source || !source.player) return
    let player = source.player
    if (!player.isPlayer()) return

    let target = event.entity
    if (!target || !target.isLiving() || target.isPlayer()) return

    let targetHp = Number(target.maxHealth) || 20.0
    let killXpBonus = Math.min(targetHp * 0.25, 50)

    let mainHand = player.mainHandItem
    if (!mainHand || mainHand.isEmpty()) return

    let id = mainHand.id || ''
    if (mainHand.hasTag('c:swords') || mainHand.hasTag('minecraft:swords') || id.includes('sword') || id.includes('dagger')) {
        addMasteryXp(player, 'swords', killXpBonus, 'Клинки')
    } else if (mainHand.hasTag('c:axes') || mainHand.hasTag('minecraft:axes') || id.includes('axe') || id.includes('hammer')) {
        addMasteryXp(player, 'axes', killXpBonus, 'Тяжёлое оружие')
    } else if (id.includes('bow') || id.includes('crossbow')) {
        addMasteryXp(player, 'bows', killXpBonus, 'Стрельба')
    } else if (id.includes('staff') || id.includes('spellbook') || id.includes('scroll')) {
        addMasteryXp(player, 'magic', killXpBonus, 'Магия')
    }
})

// 3. Command /mastery to display full mastery card
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    event.register(
        Commands.literal('mastery')
            .executes(ctx => {
                let player = ctx.source.player
                if (!player) return 0

                function formatClass(type, name, color) {
                    let lvl = getMasteryLvl(player, type)
                    let xp = getMasteryXp(player, type)
                    let req = getXpForLvl(lvl + 1)
                    let pctBonus = (lvl * BONUS_PER_LVL * 100).toFixed(1)

                    if (lvl >= MAX_MASTERY_LVL) {
                        return Text.of(`  ${color}● ${name}: §eУр. ${lvl} (МАКС) §a[+${pctBonus}% урона]`)
                    }
                    let barLen = 10
                    let filled = Math.min(barLen, Math.floor((xp / Math.max(1, req)) * barLen))
                    let bar = '§a' + '■'.repeat(filled) + '§7' + '□'.repeat(barLen - filled)
                    return Text.of(`  ${color}● ${name}: §eУр. ${lvl} §7[${bar}§7] §f${xp}/${req} §a(+${pctBonus}%)`)
                }

                player.tell(Text.gold('══════════ §l[ ВЛАДЕНИЕ ОРУЖИЕМ ] §6══════════'))
                player.tell(formatClass('swords', 'Клинки (Мечи, Кинжалы)', '§b'))
                player.tell(formatClass('axes', 'Тяжёлое (Топоры, Молоты)', '§c'))
                player.tell(formatClass('bows', 'Стрельба (Луки, Арбалеты)', '§e'))
                player.tell(formatClass('magic', 'Магия (Заклинания, Свитки)', '§d'))
                player.tell(Text.darkGray('  * Урон увеличивается на +1.5% за каждый уровень (до +30%)'))
                player.tell(Text.gold('═════════════════════════════════════════'))
                return 1
            })
    )
})
