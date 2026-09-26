// ==============================================================================
// ⚔️ SKD AINCRAD: TWO-HANDED WEAPON OFFHAND LOCKDOWN
// ==============================================================================
// Prevents players from holding shields, secondary weapons, or tools in offhand
// when wielding heavy two-handed weaponry (claymore, greathammer, greatsword,
// halberd, scythe, breaker, or items explicitly configured with two_handed = true).
// ==============================================================================

function isTwoHandedWeapon(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false

    let id = String(item.id).toLowerCase()

    // 1. Explicit 2H weapon types & keywords
    if (id.includes('claymore') ||
        id.includes('greathammer') ||
        id.includes('greatsword') ||
        id.includes('halberd') ||
        id.includes('scythe') ||
        id.includes('breaker') ||
        id.includes('hammer') ||
        id.includes('greataxe') ||
        id.includes('twinblade') ||
        id.includes('warglaive') ||
        id.includes('spear') ||
        id.includes('lance')) {
        return true
    }

    // 2. Data/Tag checks
    if (item.hasTag('c:two_handed') || item.hasTag('bettercombat:two_handed') || item.hasTag('skd:two_handed')) {
        return true
    }

    return false
}

function isOffhandRestricted(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false

    let id = String(item.id).toLowerCase()

    // 1. Shields
    if (id.includes('shield') || item.hasTag('c:tools/shields') || item.hasTag('c:shields')) {
        return true
    }

    // 2. Weapons
    if (id.includes('sword') || id.includes('blade') || id.includes('dagger') ||
        id.includes('axe') || id.includes('katana') || id.includes('rapier') ||
        id.includes('mace') || id.includes('spear') || id.includes('staff') ||
        id.includes('bow') || id.includes('crossbow') || id.includes('trident') ||
        id.includes('scythe') || id.includes('hammer') || id.includes('glaive') ||
        item.hasTag('minecraft:swords') || item.hasTag('minecraft:axes') ||
        item.hasTag('c:tools/swords') || item.hasTag('c:tools/axes') ||
        item.hasTag('c:tools/bows') || item.hasTag('c:tools/crossbows')) {
        return true
    }

    // 3. Heavy Tools
    if (id.includes('pickaxe') || id.includes('shovel') || id.includes('hoe') ||
        item.hasTag('minecraft:pickaxes') || item.hasTag('minecraft:shovels') ||
        item.hasTag('minecraft:hoes') || item.hasTag('c:tools/pickaxes') ||
        item.hasTag('c:tools/shovels') || item.hasTag('c:tools/hoes')) {
        return true
    }

    return false
}

function enforceTwoHandedRestriction(player) {
    if (!player || !player.isAlive()) return
    if (player.isCreative() || player.isSpectator()) return

    let mainHand = player.mainHandItem
    if (!isTwoHandedWeapon(mainHand)) return

    let offHand = player.offHandItem
    if (!isOffhandRestricted(offHand)) return

    // Move offhand item to inventory or drop
    let offhandCopy = offHand.copy()
    player.setOffHandItem(Item.empty)

    // Give back to player inventory (spawns dropped entity if full)
    player.give(offhandCopy)

    // Audio-visual feedback
    player.playSound('minecraft:item.armor.equip_iron', 1.0, 0.9)
    player.sendSystemMessage(Text.of('§c✋ Двуручное оружие требует хвата обеими руками! Вторая рука заблокирована.'), true)
}

// 1. Tick check (every 4 ticks / 0.2s for responsive check)
PlayerEvents.tick(event => {
    let player = event.player
    let tick = (typeof player.tickCount === 'number') ? player.tickCount : (player.age || 0)
    if (tick % 4 !== 0) return
    enforceTwoHandedRestriction(player)
})

// 2. Inventory change / slot swap trigger
PlayerEvents.inventoryChanged(event => {
    let player = event.player
    if (player) {
        enforceTwoHandedRestriction(player)
    }
})
