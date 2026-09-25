// ==============================================================================
// 🌪 ELYRIUM: ANTI-ELYTRA & ANTI-SKIP SYSTEM (KUBEJS 1.21.1 NEOFORGE)
// ==============================================================================
// Prevents sequence breaking and flying over the infinite abyss between islands.
// If player glides with elytra over the void or speeds between uncompleted zones:
// - Gently cancels gliding / reduces velocity
// - Applies gentle slow-falling so player descends safely
// - Shows actionbar warning: '§6🌪 Нисходящие потоки ветра не позволяют планировать над бездной!'
// - Plays wind gust sound
// ==============================================================================

ServerEvents.tick(event => {
    let server = event.server

    // -------------------------------------------------------------------------
    // 1. RELOAD TRIGGER FILE WATCHER (For automated 0-error reload testing)
    // -------------------------------------------------------------------------
    if (server.tickCount % 20 === 0) {
        try {
            let trigger = new java.io.File('kubejs/reload.trigger')
            if (trigger.exists()) {
                trigger.delete()
                console.log('[KubeJS-AutoReload]: reload.trigger detected. Executing reload...')
                server.runCommandSilent('reload')
            }
        } catch (e) {}
    }

    // -------------------------------------------------------------------------
    // 2. ANTI-ELYTRA AIR CURRENT SIMULATION (Every 4 ticks / 0.2s)
    // -------------------------------------------------------------------------
    if (server.tickCount % 4 !== 0) return

    server.players.forEach(player => {
        if (!player || !player.isAlive()) return
        if (player.isCreative() || player.isSpectator()) return

        // Bypass for GMs or players with unlocked continent mastery
        if (player.tags.contains('elytra_bypass') || player.persistentData.getBoolean('elytra_unlocked')) return

        // Check if player is gliding with elytra
        let isGliding = false
        try {
            isGliding = (typeof player.isFallFlying === 'function' ? player.isFallFlying() : player.fallFlying) || false
        } catch (e) {
            isGliding = false
        }

        let chestItem = player.getChestArmorItem()
        let wearingElytra = chestItem && !chestItem.isEmpty() && chestItem.id.includes('elytra')

        if (!isGliding && !wearingElytra) return

        if (isGliding) {
            let level = player.level
            let px = Math.floor(player.x)
            let pz = Math.floor(player.z)
            let py = player.y

            let minBuildY = -64
            try {
                if (level.getMinBuildHeight) {
                    minBuildY = level.getMinBuildHeight()
                }
            } catch (e) {}

            let topBlockY = minBuildY
            try {
                topBlockY = level.getHeight('motion_blocking', px, pz)
            } catch (e) {
                topBlockY = minBuildY
            }

            let distFromCenter = Math.hypot(player.x, player.z)
            let delta = player.getDeltaMovement()
            let horizSpeed = delta ? Math.hypot(delta.x, delta.z) : 0

            // Conditions for Abyss Wind Downdraft:
            // 1. Direct void beneath the player (no blocks down to min build height)
            let isOverVoid = (topBlockY <= minBuildY) || (py > minBuildY + 10 && topBlockY <= minBuildY + 2)
            // 2. Flying at high speed across boundary zones (R > 1500)
            let isSkippingZone = (distFromCenter > 1500) && (isOverVoid || horizSpeed > 0.45)

            if (isOverVoid || isSkippingZone) {
                // Gently cancel gliding or reduce velocity
                if (delta) {
                    let newVx = delta.x * 0.25
                    let newVz = delta.z * 0.25
                    let newVy = Math.max(delta.y * 0.4, -0.15) // Gentle descent
                    player.setDeltaMovement(newVx, newVy, newVz)
                }

                // Stop fall flying if method is exposed
                try {
                    if (typeof player.stopFallFlying === 'function') {
                        player.stopFallFlying()
                    }
                } catch (e) {}

                // Gentle slow-falling to prevent sudden plunge damage
                player.potionEffects.add('minecraft:slow_falling', 50, 0, false, false)

                // Visual downdraft wind particles
                try {
                    level.spawnParticles('minecraft:cloud', true, player.x, player.y + 1.0, player.z, 0.4, 0.2, 0.4, 5, 0.05)
                } catch (e) {}

                // Sound & Actionbar notification (throttled to once every 2 seconds)
                let now = level.gameTime
                let lastWarn = player.persistentData.getLong('skd_last_elytra_warn') || 0
                if (now - lastWarn >= 40) {
                    player.persistentData.putLong('skd_last_elytra_warn', now)
                    player.sendSystemMessage(Text.of('§6🌪 Нисходящие потоки ветра не позволяют планировать над бездной!'), true)
                    server.runCommandSilent(`playsound minecraft:entity.breeze.inhale player ${player.username} ~ ~ ~ 0.8 0.7`)
                }
            }
        }
    })
})

// -----------------------------------------------------------------------------
// RESTRICT FIREWORK ROCKET BOOSTS OVER VOID
// -----------------------------------------------------------------------------
ItemEvents.rightClicked(event => {
    let player = event.player
    if (!player || player.isCreative() || player.isSpectator()) return
    if (player.tags.contains('elytra_bypass') || player.persistentData.getBoolean('elytra_unlocked')) return

    let item = event.item
    if (!item || item.id !== 'minecraft:firework_rocket') return

    let isGliding = false
    try {
        isGliding = (typeof player.isFallFlying === 'function' ? player.isFallFlying() : player.fallFlying) || false
    } catch (e) {}

    if (!isGliding) return

    let level = player.level
    let px = Math.floor(player.x)
    let pz = Math.floor(player.z)
    let minBuildY = -64
    try {
        if (level.getMinBuildHeight) minBuildY = level.getMinBuildHeight()
    } catch (e) {}

    let topBlockY = minBuildY
    try {
        topBlockY = level.getHeight('motion_blocking', px, pz)
    } catch (e) {}

    let distFromCenter = Math.hypot(player.x, player.z)
    if (topBlockY <= minBuildY || distFromCenter > 1500) {
        event.cancel()
        player.sendSystemMessage(Text.of('§6🌪 Нисходящие потоки ветра гасят тягу ракеты над бездной!'), true)
        event.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ~ ~ ~ 0.8 1.2`)
    }
})

// -----------------------------------------------------------------------------
// CHAT COMMAND (.elytra / !elytra) FOR ADMIN / TESTING TOGGLE
// -----------------------------------------------------------------------------
PlayerEvents.chat(event => {
    let msg = event.message.trim().toLowerCase()
    let player = event.player
    if (!player) return

    if (msg === '.elytra' || msg === '!elytra' || msg === 'элитра') {
        let current = player.persistentData.getBoolean('elytra_unlocked')
        player.persistentData.putBoolean('elytra_unlocked', !current)
        if (!current) {
            player.tell(Text.green('✦ [Anti-Elytra]: Свободный полёт над бездной РАЗРЕШЁН (Режим Исследователя).'))
        } else {
            player.tell(Text.gold('✦ [Anti-Elytra]: Свободный полёт над бездной ЗАБЛОКИРОВАН (Режим Прогрессии).'))
        }
        event.cancel()
    }
})
