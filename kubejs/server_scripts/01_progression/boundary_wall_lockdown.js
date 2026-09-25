// ==============================================================================
// ⚡ ELYRIUM: BOUNDARY WALL LOCKDOWN & BOSS LOCK (PHASE 3.1 & 3.2)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 1. Boundary Protection at R ~ 1500 (distance between 1485 and 1515):
//    - Block breaking and placement cancelled on the wall structure (No-Build / No-Grief).
//    - Creative / Spectator / OP bypass enabled.
// 2. Anti-Elytra / Anti-Enderpearl skip:
//    - If player has NOT defeated Sector 1 Guardian ('skd_sector1_completed' != true):
//      * Flying with Elytra above Y=90 at R ~ 1500: cancel gliding, apply gentle downward momentum,
//        action bar: '§c⚡ Древний Барьер Рубежа не пропускает вас! Одолейте Хранителя Сектора I.'
//      * Throwing Ender Pearl across boundary: cancel throw / teleport, apply downward momentum,
//        display the same warning.
// 3. Boss Defeat Handler:
//    - When Sector 1 Guardian is defeated:
//      * Set player.persistentData.putBoolean('skd_sector1_completed', true) for nearby participants/killer.
//      * Unlock passage, display glorious title & play bell sound.
// ==============================================================================

const BOUNDARY_R_MIN = 1485
const BOUNDARY_R_MAX = 1515
const BOUNDARY_WARN_MSG = '§c⚡ Древний Барьер Рубежа не пропускает вас! Одолейте Хранителя Сектора I.'

function isInsideBoundaryWall(x, z) {
    let dist = Math.hypot(x, z)
    return dist >= BOUNDARY_R_MIN && dist <= BOUNDARY_R_MAX
}

function hasUnlockedSector1(player) {
    if (!player) return false
    if (player.isCreative && player.isCreative()) return true
    if (player.isSpectator && player.isSpectator()) return true
    if (player.tags && (player.tags.contains('boundary_bypass') || player.tags.contains('elytra_bypass'))) return true
    return player.persistentData.getBoolean('skd_sector1_completed')
}

// -----------------------------------------------------------------------------
// 1. NO-BUILD / NO-GRIEF ON BOUNDARY WALL (R = 1485 .. 1515)
// -----------------------------------------------------------------------------
BlockEvents.broken(event => {
    let player = event.player
    if (player && (player.isCreative() || player.isSpectator())) return

    let block = event.block
    if (isInsideBoundaryWall(block.x, block.z)) {
        event.cancel()
        if (player) {
            player.sendSystemMessage(Text.of('§c🛡 Рубежный Вал защищен древними чарами нерушимости!'), true)
            player.server.runCommandSilent(`playsound minecraft:block.anvil.land player ${player.username} ${block.x} ${block.y} ${block.z} 0.5 1.5`)
        }
    }
})

BlockEvents.placed(event => {
    let player = event.player
    if (player && (player.isCreative() || player.isSpectator())) return

    let block = event.block
    if (isInsideBoundaryWall(block.x, block.z)) {
        event.cancel()
        if (player) {
            player.sendSystemMessage(Text.of('§c⚠ Магия Рубежного Вала отторгает установку чужеродных блоков!'), true)
            player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ${block.x} ${block.y} ${block.z} 0.6 1.2`)
        }
    }
})

// -----------------------------------------------------------------------------
// 2. ANTI-ELYTRA SKIP AT R ~ 1500 (Above Y=90 without Boss Defeat)
// -----------------------------------------------------------------------------
ServerEvents.tick(event => {
    let server = event.server
    if (server.tickCount % 4 !== 0) return // Every 0.2s

    server.players.forEach(player => {
        if (!player || !player.isAlive()) return
        if (hasUnlockedSector1(player)) return

        let dist = Math.hypot(player.x, player.z)
        if (dist < BOUNDARY_R_MIN || dist > BOUNDARY_R_MAX) return

        let isGliding = false
        try {
            isGliding = (typeof player.isFallFlying === 'function' ? player.isFallFlying() : player.fallFlying) || false
        } catch (e) {
            isGliding = false
        }

        let chestItem = player.getChestArmorItem()
        let wearingElytra = chestItem && !chestItem.isEmpty() && chestItem.id.includes('elytra')

        if ((isGliding || wearingElytra) && player.y >= 90) {
            // Cancel gliding / stop fall flying
            try {
                if (typeof player.stopFallFlying === 'function') {
                    player.stopFallFlying()
                }
            } catch (e) {}

            // Apply gentle downward momentum and cut horizontal thrust
            let delta = player.getDeltaMovement()
            if (delta) {
                let newVx = delta.x * 0.2
                let newVz = delta.z * 0.2
                let newVy = Math.max(delta.y * 0.4 - 0.25, -0.4) // Gentle downward momentum
                player.setDeltaMovement(newVx, newVy, newVz)
            }

            // Safe descent with slow falling
            player.potionEffects.add('minecraft:slow_falling', 60, 0, false, false)

            // Visual shockwave particles
            try {
                player.level.spawnParticles('minecraft:electric_spark', true, player.x, player.y + 1.0, player.z, 0.5, 0.5, 0.5, 8, 0.1)
            } catch (e) {}

            // Actionbar warning & barrier sound (throttled to 1.5s)
            let now = player.level.gameTime
            let lastWarn = player.persistentData.getLong('skd_last_barrier_warn') || 0
            if (now - lastWarn >= 30) {
                player.persistentData.putLong('skd_last_barrier_warn', now)
                player.sendSystemMessage(Text.of(BOUNDARY_WARN_MSG), true)
                server.runCommandSilent(`playsound minecraft:block.beacon.deactivate player ${player.username} ~ ~ ~ 0.9 1.1`)
            }
        }
    })
})

// -----------------------------------------------------------------------------
// 3. ANTI-ENDERPEARL SKIP ACROSS BOUNDARY WALL
// -----------------------------------------------------------------------------
// A) Intercept pearl right-click if thrown near or facing boundary without boss defeat
ItemEvents.rightClicked(event => {
    let player = event.player
    if (!player || hasUnlockedSector1(player)) return

    let item = event.item
    if (!item || item.id !== 'minecraft:ender_pearl') return

    let dist = Math.hypot(player.x, player.z)
    // If player is already within the boundary zone (1480 .. 1520)
    if (dist >= (BOUNDARY_R_MIN - 5) && dist <= (BOUNDARY_R_MAX + 5)) {
        event.cancel()
        player.sendSystemMessage(Text.of(BOUNDARY_WARN_MSG), true)
        event.server.runCommandSilent(`playsound minecraft:block.glass.break player ${player.username} ~ ~ ~ 0.8 1.4`)
        
        let delta = player.getDeltaMovement()
        if (delta) {
            player.setDeltaMovement(delta.x * 0.1, -0.2, delta.z * 0.1)
        }
    }
})

// B) Intercept pearl projectile impact / teleportation
EntityEvents.checkSpawn(event => {
    let entity = event.entity
    if (!entity || entity.type !== 'minecraft:ender_pearl') return

    let owner = entity.owner
    if (!owner || !owner.isPlayer()) return

    let player = owner
    if (hasUnlockedSector1(player)) return

    let dist = Math.hypot(entity.x, entity.z)
    if (dist >= BOUNDARY_R_MIN && dist <= BOUNDARY_R_MAX) {
        event.cancel()
        player.sendSystemMessage(Text.of(BOUNDARY_WARN_MSG), true)
        player.server.runCommandSilent(`playsound minecraft:block.beacon.deactivate player ${player.username} ~ ~ ~ 0.8 1.2`)
    }
})

// -----------------------------------------------------------------------------
// 4. SECTOR 1 GUARDIAN DEFEAT HANDLER
// -----------------------------------------------------------------------------
function grantSector1Completion(player, server) {
    if (!player || player.persistentData.getBoolean('skd_sector1_completed')) return

    player.persistentData.putBoolean('skd_sector1_completed', true)

    // Glorious title & sound celebration
    server.runCommandSilent(`title ${player.username} times 10 70 20`)
    server.runCommandSilent(`title ${player.username} title {\"text\":\"⚡ РУБЕЖ ПОКОРЕН! ⚡\",\"color\":\"gold\",\"bold\":true}`)
    server.runCommandSilent(`title ${player.username} subtitle {\"text\":\"Хранитель Сектора I пал. Барьер рассеян!\",\"color\":\"aqua\"}`)

    // Bell & Level-up sounds
    server.runCommandSilent(`playsound minecraft:block.bell.use player ${player.username} ~ ~ ~ 1.5 0.8`)
    server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete player ${player.username} ~ ~ ~ 1.0 1.0`)

    player.tell(Text.gold('════════════════════════════════════════════════════════'))
    player.tell(Text.yellow('🏆 Древние чары Рубежного Вала (R ~ 1500) растворились перед вашей силой!'))
    player.tell(Text.aqua('   Вам открыт свободный доступ к Парящему Архипелагу и Сектору II.'))
    player.tell(Text.gold('════════════════════════════════════════════════════════'))
}

EntityEvents.death(event => {
    let entity = event.entity
    if (!entity) return

    let entityId = entity.type ? entity.type.toString().toLowerCase() : ''
    let customName = ''
    try {
        if (entity.customName) {
            customName = entity.customName.string || entity.customName.toString()
        }
    } catch (e) {}

    // Sector 1 Guardian Identification:
    // Netherite Monstrosity / Malgaros, Ancient Remnant, Kobolediator or tagged sector 1 boss
    let isSector1Guardian = false
    if (entityId === 'cataclysm:netherite_monstrosity' ||
        entityId === 'cataclysm:ancient_remnant' ||
        entityId === 'cataclysm:kobolediator' ||
        customName.includes('Малгарос') ||
        customName.includes('Хранитель') ||
        customName.includes('Guardian') ||
        (entity.tags && (entity.tags.contains('sector1_guardian') || entity.tags.contains('boss_sector1')))) {
        isSector1Guardian = true
    }

    if (!isSector1Guardian) return

    let server = event.server
    let killer = event.source ? event.source.player : null

    // If killer is player, award killer and nearby raid participants within 64 blocks
    let ex = entity.x
    let ey = entity.y
    let ez = entity.z

    server.players.forEach(p => {
        if (!p || !p.isAlive()) return
        let dist = Math.hypot(p.x - ex, p.z - ez)
        if (p === killer || dist <= 64.0) {
            grantSector1Completion(p, server)
        }
    })
})

// -----------------------------------------------------------------------------
// 5. CHAT & TESTING COMMANDS (.boundary / .unlocksector1)
// -----------------------------------------------------------------------------
PlayerEvents.chat(event => {
    let msg = event.message.trim().toLowerCase()
    let player = event.player
    if (!player) return

    if (msg === '.sector1' || msg === '!sector1' || msg === '.рубеж') {
        let unlocked = player.persistentData.getBoolean('skd_sector1_completed')
        let dist = Math.round(Math.hypot(player.x, player.z))
        player.tell(Text.gold('══════════════ [🛡️ СТАТУС РУБЕЖА СЕКТОРА I] ══════════════'))
        player.tell(Text.yellow(`📍 Ваша дистанция от центра (R): `).append(Text.white(`${dist} блоков`)))
        player.tell(Text.yellow(`⚡ Доступ через Вал (R ~ 1500): `).append(unlocked ? Text.green('РАЗРЕШЁН (Хранитель повержен)') : Text.red('ЗАБЛОКИРОВАН (Хранитель жив)')))
        player.tell(Text.gray('  Для проверки используйте команду .unlocksector1 (или победите босса).'))
        player.tell(Text.gold('════════════════════════════════════════════════════════'))
        event.cancel()
    } else if (msg === '.unlocksector1' || msg === '!unlocksector1') {
        let current = player.persistentData.getBoolean('skd_sector1_completed')
        if (!current) {
            grantSector1Completion(player, event.server)
        } else {
            player.persistentData.putBoolean('skd_sector1_completed', false)
            player.tell(Text.red('✦ [Рубеж]: Доступ через Рубежный Вал СБРОШЕН (Барьер вновь активен).'))
        }
        event.cancel()
    }
})
