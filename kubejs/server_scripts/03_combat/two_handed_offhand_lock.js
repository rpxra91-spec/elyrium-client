// ==============================================================================
// ⚔️ ELYRIUM RPG: TWO-HANDED WEAPON OFFHAND LOCKDOWN (v2.0)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// Functionally disables the offhand slot without dropping or removing items:
// 1. When wielding heavy two-handed weaponry (claymore, greatsword, greathammer,
//    spears/lances, bows, crossbows, or items configured with two_handed = true):
//    - Sets player flag 'skd_offhand_locked' = true.
//    - Blocks shield blocking and offhand item usage (event.cancel()).
//    - Displays: '§c✋ Двуручный хват: использование второй руки заблокировано!'
//    - The shield / item stays safely in the offhand inventory slot!
// 2. Integrates with shield_guard_posture.js (no guard posture/defense benefits).
// 3. Network syncs 'elyrium:offhand_lock_state' to client for first-person hiding.
// ==============================================================================

let J_WeaponRegistry_2H = null;
try {
    J_WeaponRegistry_2H = Java.loadClass('net.bettercombat.logic.WeaponRegistry');
} catch (eClass) {}

function isTwoHandedWeapon(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;

    // 1. Better Combat WeaponRegistry check
    if (J_WeaponRegistry_2H) {
        try {
            let rawStack = item.getItemStack ? item.getItemStack() : (item.minecraftItemStack || item);
            let attrs = J_WeaponRegistry_2H.getAttributes(rawStack);
            if (attrs) {
                if (typeof attrs.two_handed === 'function' && attrs.two_handed()) return true;
                if (attrs.two_handed === true) return true;
                if (typeof attrs.isTwoHanded === 'function' && attrs.isTwoHanded()) return true;
            }
        } catch (eBc) {}
    }

    let id = String(item.id).toLowerCase();

    // 2. Bows and Crossbows (Two-Handed)
    if (((id.includes('bow') && !id.includes('bowl')) || id.includes('crossbow')) ||
        item.hasTag('c:tools/bows') || item.hasTag('c:tools/crossbows') ||
        item.hasTag('minecraft:enchantable/bow') || item.hasTag('minecraft:enchantable/crossbow')) {
        return true;
    }

    // 3. Spears, Lances, Polearms, Staves, Glaives
    if (id.includes('spear') || id.includes('lance') || id.includes('glaive') ||
        id.includes('halberd') || id.includes('polearm') || id.includes('staff') ||
        id.includes('quarterstaff') || id.includes('pike') ||
        item.hasTag('c:tools/spears') || item.hasTag('c:spears')) {
        return true;
    }

    // 4. Heavy Melee & Two-Handed Swords / Hammers / Scythes
    if (id.includes('claymore') ||
        id.includes('greathammer') ||
        id.includes('greatsword') ||
        id.includes('scythe') ||
        id.includes('breaker') ||
        id.includes('hammer') ||
        id.includes('greataxe') ||
        id.includes('warhammer') ||
        id.includes('maul') ||
        id.includes('twinblade') ||
        id.includes('warglaive') ||
        id.includes('zweihander') ||
        id.includes('colossal')) {
        return true;
    }

    // 5. Data Tags
    if (item.hasTag('c:two_handed') || item.hasTag('bettercombat:two_handed') || item.hasTag('skd:two_handed')) {
        return true;
    }

    return false;
}

function isOffhandRestricted(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;

    let id = String(item.id).toLowerCase();

    // 1. Shields
    if (id.includes('shield') ||
        item.hasTag('c:tools/shields') ||
        item.hasTag('c:shields') ||
        item.hasTag('forge:shields') ||
        item.hasTag('minecraft:shields')) {
        return true;
    }

    // 2. Weapons & Combat Tools
    if (id.includes('sword') || id.includes('blade') || id.includes('dagger') ||
        id.includes('axe') || id.includes('katana') || id.includes('rapier') ||
        id.includes('mace') || id.includes('spear') || id.includes('staff') ||
        (id.includes('bow') && !id.includes('bowl')) || id.includes('crossbow') || id.includes('trident') ||
        id.includes('scythe') || id.includes('hammer') || id.includes('glaive') ||
        item.hasTag('minecraft:swords') || item.hasTag('minecraft:axes') ||
        item.hasTag('c:tools/swords') || item.hasTag('c:tools/axes') ||
        item.hasTag('c:tools/bows') || item.hasTag('c:tools/crossbows')) {
        return true;
    }

    // 3. Heavy Harvesting Tools
    if (id.includes('pickaxe') || id.includes('shovel') || id.includes('hoe') ||
        item.hasTag('minecraft:pickaxes') || item.hasTag('minecraft:shovels') ||
        item.hasTag('minecraft:hoes') || item.hasTag('c:tools/pickaxes') ||
        item.hasTag('c:tools/shovels') || item.hasTag('c:tools/hoes')) {
        return true;
    }

    return false;
}

function isSpearItem(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = String(item.id).toLowerCase();
    return id.includes('spear') || id.includes('lance') || id.includes('glaive') ||
           id.includes('halberd') || id.includes('polearm') || id.includes('pike') ||
           item.hasTag('c:tools/spears') || item.hasTag('c:spears') || item.hasTag('forge:tools/spears');
}

function isShieldItem(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = String(item.id).toLowerCase();
    return id.includes('shield') ||
           item.hasTag('c:tools/shields') ||
           item.hasTag('c:shields') ||
           item.hasTag('forge:shields') ||
           item.hasTag('minecraft:shields');
}

function enforceTwoHandedRestriction(player) {
    if (!player || !player.isAlive()) return;
    if (player.isCreative() || player.isSpectator()) return;

    let mainHand = player.mainHandItem;
    let offHand = player.offHandItem;

    let is2H = isTwoHandedWeapon(mainHand);
    let isOffRestricted = isOffhandRestricted(offHand);

    // Versatile Dual-Grip Exception: Spears allow shields in offhand (Hoplite / Legionnaire style)
    if (isSpearItem(mainHand) && isShieldItem(offHand)) {
        is2H = false;
    }

    let shouldLock = is2H && isOffRestricted;

    let prevLocked = player.persistentData.getBoolean('skd_offhand_locked');

    if (shouldLock) {
        if (!prevLocked) {
            player.persistentData.putBoolean('skd_offhand_locked', true);
            try { player.sendData('elyrium:offhand_lock_state', { locked: true }); } catch (eNet) {}
        }

        // If player was actively using/blocking with offhand, drop usage immediately
        if (player.isUsingItem && player.isUsingItem()) {
            let useItem = player.useItem;
            if (useItem && (useItem === offHand || String(useItem.id).includes('shield'))) {
                try { player.stopUsingItem(); } catch (eStop) {}
            }
        }
    } else {
        if (prevLocked) {
            player.persistentData.putBoolean('skd_offhand_locked', false);
            try { player.sendData('elyrium:offhand_lock_state', { locked: false }); } catch (eNet) {}
        }
    }
}

// 1. Periodic tick check (every 4 ticks / 0.2s for responsive state)
PlayerEvents.tick(event => {
    let player = event.player;
    if (!player) return;
    let tick = (typeof player.tickCount === 'number') ? player.tickCount : (player.age || 0);
    if (tick % 4 !== 0) return;
    enforceTwoHandedRestriction(player);
});

// 2. Inventory change / hotbar slot swap
PlayerEvents.inventoryChanged(event => {
    let player = event.player;
    if (player) {
        enforceTwoHandedRestriction(player);
    }
});

// 3. Player connection sync
PlayerEvents.loggedIn(event => {
    let player = event.player;
    if (player) {
        enforceTwoHandedRestriction(player);
        let locked = player.persistentData.getBoolean('skd_offhand_locked');
        try { player.sendData('elyrium:offhand_lock_state', { locked: locked }); } catch (eNet) {}
    }
});

// 4. Intercept Right-Clicks when offhand is locked:
ItemEvents.firstRightClicked(event => {
    let player = event.player;
    if (!player) return;
    if (!player.persistentData.getBoolean('skd_offhand_locked')) return;

    let hand = String(event.hand || '');
    let isOffhandInteraction = hand.toLowerCase().includes('off');
    let item = event.item;
    let offHand = player.offHandItem;

    if (isOffhandInteraction || (item && offHand && item === offHand && isOffhandRestricted(offHand))) {
        let now = Date.now();
        let lastArtTick = player.persistentData.getInt('skd_last_art_tick') || 0;
        let currentAge = (typeof player.age === 'number') ? player.age : (typeof player.tickCount === 'number' ? player.tickCount : 0);
        let justUsedArt = (Math.abs(currentAge - lastArtTick) <= 2);
        let lastMsg = player.persistentData.getLong('skd_last_2h_warn_time') || 0;

        if (!justUsedArt && (now - lastMsg > 1000)) {
            player.persistentData.putLong('skd_last_2h_warn_time', now);
            player.sendSystemMessage(Text.of('§c✋ Двуручный хват: использование второй руки заблокировано!'), true);
            player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ~ ~ ~ 0.4 1.5`);
        }
    }
});

ItemEvents.rightClicked(event => {
    let player = event.player;
    if (!player) return;
    if (!player.persistentData.getBoolean('skd_offhand_locked')) return;

    let hand = String(event.hand || '');
    let isOffhandInteraction = hand.toLowerCase().includes('off');
    let item = event.item;
    let offHand = player.offHandItem;

    if (isOffhandInteraction || (item && offHand && item === offHand && isOffhandRestricted(offHand))) {
        event.cancel();
        try { player.stopUsingItem(); } catch (eStop) {}
    }
});
