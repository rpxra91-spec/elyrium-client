// Guard Combat Special Abilities (Simply Swords Integration)
// Triggered when a MineColonies Guard attacks with a Simply Swords weapon.
// Has a 100% Friendly Fire protection filter: Colonists and Players are NEVER damaged!

EntityEvents.beforeHurt(event => {
    const attacker = event.source.actual
    const target = event.entity
    const level = event.level

    if (!attacker || !target) return

    // Attacker must be a MineColonies citizen (Guard)
    if (attacker.type !== 'minecolonies:citizen') return

    // Target must NOT be a citizen and NOT a player
    if (target.type === 'minecolonies:citizen' || target.isPlayer()) return

    const weapon = attacker.mainHandItem
    if (!weapon || weapon.id === 'minecraft:air') return

    const weaponId = weapon.id
    if (!weaponId.includes('simplyswords')) return

    // 25% chance to trigger weapon special ability
    if (Math.random() > 0.25) return

    const pos = target.blockPosition()

    // --- 1. Claymore / Greataxe / Longsword: Sweeping Cleave ---
    if (weaponId.includes('claymore') || weaponId.includes('greataxe') || weaponId.includes('longsword') || weaponId.includes('greathammer')) {
        // Play swing sound and particle sweep
        level.spawnParticles('minecraft:sweep_attack', true, target.x, target.y + 1.0, target.z, 0, 0, 0, 1, 0)

        // Find surrounding enemies within 4 blocks
        const nearby = level.getEntitiesWithin(AABB.of(target.x - 3.5, target.y - 1, target.z - 3.5, target.x + 3.5, target.y + 2.5, target.z + 3.5))
        nearby.forEach(e => {
            // Strict Friendly Fire Check
            if (e.isLiving() && e !== attacker && e !== target) {
                if (e.type !== 'minecolonies:citizen' && !e.isPlayer()) {
                    // Deal 50% splash damage to enemy
                    e.attack(event.source, event.damage * 0.5)
                    e.potionEffects.add('minecraft:slowness', 40, 1)
                }
            }
        })
    }
    // --- 2. Katana / Cutlass: Rapid Bleed Slash ---
    else if (weaponId.includes('katana') || weaponId.includes('cutlass') || weaponId.includes('rapier')) {
        level.spawnParticles('minecraft:crit', true, target.x, target.y + 1.2, target.z, 0.2, 0.2, 0.2, 8, 0.1)
        // Apply bleed effect (Wither for 3 seconds)
        target.potionEffects.add('minecraft:wither', 60, 0)
        target.potionEffects.add('minecraft:weakness', 60, 0)
    }
    // --- 3. Glaive / Halberd / Spear: Piercing Knockback ---
    else if (weaponId.includes('glaive') || weaponId.includes('halberd') || weaponId.includes('spear')) {
        level.spawnParticles('minecraft:crit', true, target.x, target.y + 1.0, target.z, 0.1, 0.1, 0.1, 5, 0.05)
        // Knockback the enemy backward
        const dx = target.x - attacker.x
        const dz = target.z - attacker.z
        target.knockback(0.8, -dx, -dz)
    }
    // --- 4. Legendary Unique Blades: Elemental Burst ---
    else if (weaponId.includes('lichblade') || weaponId.includes('brimstone') || weaponId.includes('caelestis') || weaponId.includes('bramblethorn')) {
        level.spawnParticles('minecraft:flame', true, target.x, target.y + 1.0, target.z, 0.3, 0.3, 0.3, 12, 0.05)
        target.setRemainingFireTicks(80)

        // Splash fire to nearby enemies only
        const nearby = level.getEntitiesWithin(AABB.of(target.x - 3, target.y - 1, target.z - 3, target.x + 3, target.y + 2, target.z + 3))
        nearby.forEach(e => {
            if (e.isLiving() && e !== attacker && e !== target) {
                if (e.type !== 'minecolonies:citizen' && !e.isPlayer()) {
                    e.setRemainingFireTicks(60)
                }
            }
        })
    }
})
