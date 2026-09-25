// ==============================================================================
// 👥 ELYRIUM RPG: PARTY XP SHARE & ANTI-TWINK BOOSTING SYSTEM
// Minecraft 1.21.1 NeoForge | KubeJS Server Script (Subphase 6.2)
// ==============================================================================
// - When a player slays a mob, detects nearby allies / party members within 36 blocks.
// - Party Bonus: Adds +20% total XP pool if >= 2 players are fighting together.
// - Equal distribution among all qualified players within 36 blocks.
// - Anti-twink / level differential check:
//   * Evaluates Player level (SimpleStats or player XP level).
//   * If level difference between highest and lowest party member > 8:
//     Low-level player receives only 20% XP (-80% penalty) with actionbar alert:
//     '§c⚠ Разница в ранге слишком велика! Опыт снижен.'
// - Awards XP via: `simplestats xp add <username> <amount>` and plays orb sound.
// ==============================================================================

const PARTY_XP_RADIUS = 36.0
const LEVEL_DIFF_THRESHOLD = 15 // Scaled for 100-level progression (~1.5 tiers)
const PENALTY_RATE = 0.20 // -80% penalty -> 20% received

// Helper: Calculate base RPG XP dynamically based on mob max HP and boss tags
function calculateBaseMobXp(entity) {
    let maxHp = entity.maxHealth || 20.0
    let typeId = String(entity.type).toLowerCase()

    let isBoss = maxHp >= 300.0 || typeId.includes('boss') ||
                 typeId.includes('cataclysm:') || typeId.includes('wither') ||
                 typeId.includes('dragon') || typeId.includes('warden')

    if (isBoss) {
        return Math.min(500, Math.max(100, Math.floor(maxHp * 0.25)))
    } else if (maxHp >= 100.0) {
        return Math.min(80, Math.floor(maxHp * 0.25))
    } else if (maxHp >= 30.0) {
        return Math.min(25, Math.floor(maxHp * 0.25))
    } else {
        return Math.max(3, Math.floor(maxHp * 0.25))
    }
}

// Helper: Get effective player level (SimpleStats or XP level)
function getPlayerLevel(player) {
    try {
        let pData = player.persistentData;
        let perks = pData.getCompound('simplestats_perks');
        if (perks) {
            let total = (perks.getInt('strength') || 0) +
                        (perks.getInt('vitality') || 0) +
                        (perks.getInt('defense') || 0) +
                        (perks.getInt('agility') || 0) +
                        (perks.getInt('crit') || 0) +
                        (perks.getInt('mana') || 0);
            if (total > 0) {
                return Math.max(1, Math.ceil(total / 2));
            }
        }
        if (typeof player.experienceLevel !== 'undefined') {
            return Number(player.experienceLevel) || 1
        }
    } catch (e) {}
    return 1
}

EntityEvents.death(event => {
    let entity = event.entity
    let source = event.source
    if (!entity || !source) return

    let killer = source.player || source.actual
    if (!killer || !killer.isPlayer()) return
    if (entity.isPlayer()) return // No XP for PvP kills

    let server = killer.server
    if (!server) return

    let baseXP = calculateBaseMobXp(entity)
    let isBoss = baseXP >= 100

    // 1. Gather all players in the same dimension within 36 blocks
    let nearbyPlayers = []
    let killerDim = killer.level.dimension.toString()

    server.players.forEach(p => {
        if (!p || !p.isAlive()) return
        if (p.level.dimension.toString() !== killerDim) return

        let dist = Math.hypot(p.x - entity.x, p.z - entity.z)
        let dy = Math.abs(p.y - entity.y)
        if (dist <= PARTY_XP_RADIUS && dy <= 24) {
            nearbyPlayers.push(p)
        }
    })

    if (nearbyPlayers.length === 0) {
        nearbyPlayers.push(killer)
    }

    let isParty = nearbyPlayers.length > 1
    let totalXP = baseXP

    if (isParty) {
        // +20% Party Bonus total XP
        totalXP = Math.floor(baseXP * 1.20)
    }

    // Determine highest and lowest level among party members
    let minLvl = 9999
    let maxLvl = 0
    let playerLevels = new Map()

    nearbyPlayers.forEach(p => {
        let lvl = getPlayerLevel(p)
        playerLevels.set(p.username, lvl)
        if (lvl < minLvl) minLvl = lvl
        if (lvl > maxLvl) maxLvl = lvl
    })

    let levelDiff = maxLvl - minLvl
    let hasTwinkPenalty = isParty && (levelDiff > LEVEL_DIFF_THRESHOLD)

    // Base split per player
    let splitXp = Math.max(1, Math.floor(totalXP / nearbyPlayers.length))

    nearbyPlayers.forEach(p => {
        let pLvl = playerLevels.get(p.username) || 1
        let awardXp = splitXp
        let penalized = false

        // Check if this specific player is significantly lower than highest
        if (hasTwinkPenalty && (maxLvl - pLvl > LEVEL_DIFF_THRESHOLD)) {
            awardXp = Math.max(1, Math.floor(splitXp * PENALTY_RATE))
            penalized = true
        }

        // Award XP via SimpleStats command
        server.runCommandSilent(`simplestats xp add ${p.username} ${awardXp}`)

        // Sound effect
        server.runCommandSilent(`playsound minecraft:entity.experience_orb.pickup player ${p.username} ${p.x} ${p.y} ${p.z} 0.7 1.0`)

        // Messaging
        if (penalized) {
            p.sendSystemMessage(Text.of('§c⚠ Разница в ранге слишком велика! Опыт снижен.'), true)
            p.tell(`§7[§6Группа§7] §eПолучено §c${awardXp} XP §8(Штраф разницы уровней: -80%)`)
        } else if (isParty) {
            if (isBoss) {
                p.tell(`§7[§6RPG Пати§7] §eПобеждён грозный противник! §a+${awardXp} XP §b(+20% Party Bonus)`)
            } else {
                p.sendSystemMessage(Text.of(`§7[§6Пати§7] §a+${awardXp} XP §8(+20% Бонус группы)`), true)
            }
        } else {
            if (isBoss) {
                p.tell(`§7[§6RPG Опыт§7] §eПобеждён грозный противник! §a+${awardXp} XP`)
            }
        }
    })
})
