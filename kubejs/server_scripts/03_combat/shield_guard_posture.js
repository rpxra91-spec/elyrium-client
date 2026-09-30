// ==============================================================================
// 🛡️ ELYRIUM RPG: SHIELD GUARD POSTURE & ANTI-CHEESE SYSTEM
// ==============================================================================
// 1. Prevents infinite blocking cheese!
//    - Tracks absorbed damage in a Guard Posture pool.
//    - Max posture capacity = 100 + (skd_reinforce * 50).
//      (+0 = 100, +5 = 350, +10 = 600).
//    - Posture slowly recovers over time when not blocking (20 posture / second).
// 2. GUARD BREAK (when absorbed damage exceeds posture capacity):
//    - Shield disabled for 70 ticks (3.5s) via player.cooldowns.add(shieldItem, 70).
//    - Loud metal shatter sounds: item.shield.break & block.anvil.destroy.
//    - Particle effects: large_smoke & crit at player pos.
//    - Stun penalty: Slowness II and Mining Fatigue II for 60 ticks (3s).
//    - Actionbar warning: '§4⚠ БЛОК ПРОБИТ! (Guard Break) §cЩит выбит из рук!'
// 3. Elemental / Through-Block Mitigation:
//    - +0 shield lets through 25% magic/fire damage (blocks 75%).
//    - Each reinforcement level (+1..+10) reduces through-damage by 2.5%.
//      At +10: blocks 100% physical and 100% elemental/magic (0% through).
// ==============================================================================

function isShield(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = item.id.toLowerCase();
    return item.hasTag('c:tools/shields') ||
           item.hasTag('c:shields') ||
           item.hasTag('forge:shields') ||
           item.hasTag('minecraft:shields') ||
           id.includes('shield');
}

function getReinforceLevel(item) {
    if (!item || item.isEmpty()) return 0;
    try {
        if (item.nbt && item.nbt.contains('skd_reinforce')) {
            return item.nbt.getInt('skd_reinforce') || 0;
        }
        if (item.customData && item.customData.contains('skd_reinforce')) {
            return item.customData.getInt('skd_reinforce') || 0;
        }
    } catch (e) {}
    return 0;
}

function getActiveShield(player) {
    if (!player) return null;
    let isOffLocked = player.persistentData ? player.persistentData.getBoolean('skd_offhand_locked') : false;
    try {
        if (player.useItem && !player.useItem.isEmpty() && isShield(player.useItem)) {
            if (isOffLocked && player.useItem === player.offHandItem) return null;
            return player.useItem;
        }
    } catch (e) {}

    let off = player.offHandItem;
    if (off && !off.isEmpty() && isShield(off) && !isOffLocked) return off;

    let main = player.mainHandItem;
    if (main && !main.isEmpty() && isShield(main)) return main;

    return null;
}

function applyShieldCooldown(player, shieldItem, ticks) {
    if (!player) return;

    if (shieldItem) {
        try {
            player.cooldowns.add(shieldItem, ticks);
        } catch (e1) {
            try {
                player.cooldowns.add(shieldItem.item, ticks);
            } catch (e2) {
                try {
                    player.cooldowns.addCooldown(shieldItem.item, ticks);
                } catch (e3) {
                    try {
                        player.cooldowns.add(shieldItem.id, ticks);
                    } catch (e4) {}
                }
            }
        }
    }

    // Secondary hand shield cooldown to avoid instant swap cheese
    let off = player.offHandItem;
    if (off && !off.isEmpty() && isShield(off) && off !== shieldItem) {
        try { player.cooldowns.add(off, ticks); } catch (e) {}
    }
    let main = player.mainHandItem;
    if (main && !main.isEmpty() && isShield(main) && main !== shieldItem) {
        try { player.cooldowns.add(main, ticks); } catch (e) {}
    }
}

function isElementalOrMagic(source) {
    if (!source) return false;

    try {
        if (source.isMagic && source.isMagic()) return true;
        if (source.isFire && source.isFire()) return true;
        if (source.isLightning && source.isLightning()) return true;
    } catch (e) {}


    let typeStr = '';
    try {
        if (source.getType) typeStr += String(source.getType()).toLowerCase();
        if (source.type && source.type().id) typeStr += ' ' + String(source.type().id()).toLowerCase();
    } catch (e) {}

    if (typeStr.includes('magic') || 
        typeStr.includes('spell') || 
        typeStr.includes('fire') || 
        typeStr.includes('flame') || 
        typeStr.includes('lava') || 
        typeStr.includes('burn') || 
        typeStr.includes('lightning') || 
        typeStr.includes('freeze') || 
        typeStr.includes('frost') || 
        typeStr.includes('poison') || 
        typeStr.includes('wither') || 
        typeStr.includes('dragon_breath')) {
        return true;
    }

    let direct = source.direct;
    if (direct) {
        let dType = String(direct.type).toLowerCase();
        if (dType.includes('fireball') || 
            dType.includes('potion') || 
            dType.includes('spell') || 
            dType.includes('magic') || 
            dType.includes('dragon_fireball') || 
            dType.includes('shulker_bullet') ||
            dType.includes('wither_skull')) {
            return true;
        }
    }

    return false;
}

function isUnblockable(source) {
    if (!source) return true;

    let typeStr = '';
    try {
        if (source.getType) typeStr += String(source.getType()).toLowerCase();
        if (source.type && source.type().id) typeStr += ' ' + String(source.type().id()).toLowerCase();
    } catch (e) {}

    if (typeStr.includes('starve') || 
        typeStr.includes('void') || 
        typeStr.includes('out_of_world') || 
        typeStr.includes('drown') || 
        typeStr.includes('fall') || 
        typeStr.includes('in_wall') || 
        typeStr.includes('suffocate') || 
        typeStr.includes('cramming') ||
        typeStr.includes('generic_kill')) {
        return true;
    }


    return false;
}

function isFacingAttacker(player, source) {
    let attacker = source.actual || source.direct;
    if (!attacker) return true;

    let dx = attacker.x - player.x;
    let dz = attacker.z - player.z;
    let distSq = dx * dx + dz * dz;
    if (distSq < 0.01) return true;

    let look = null;
    try {
        look = player.getLookAngle ? player.getLookAngle() : null;
    } catch (e) {}

    if (!look) return true;

    let dot = dx * look.x + dz * look.z;
    return dot >= 0; // Front 180 degrees field
}

function triggerGuardBreak(player, shieldItem, server) {
    let pData = player.persistentData;
    pData.remove('skd_guard_absorbed');
    pData.putLong('skd_last_guard_break', player.level.time);

    // 1. Force shield cooldown / disable for 70 ticks (3.5s)
    applyShieldCooldown(player, shieldItem, 70);

    // Drop shield usage immediately
    try {
        player.stopUsingItem();
    } catch (e) {}

    // 2. Play loud metal shatter sounds
    let u = player.username;
    server.runCommandSilent(`playsound minecraft:item.shield.break player ${u} ~ ~ ~ 1.5 0.8`);
    server.runCommandSilent(`playsound minecraft:block.anvil.destroy player ${u} ~ ~ ~ 1.2 0.9`);

    // 3. Spawn particle effects: minecraft:large_smoke and minecraft:crit at player pos
    server.runCommandSilent(`particle minecraft:large_smoke ${player.x} ${player.y + 1} ${player.z} 0.5 0.5 0.5 0.08 30`);
    server.runCommandSilent(`particle minecraft:crit ${player.x} ${player.y + 1} ${player.z} 0.6 0.6 0.6 0.2 35`);

    // 4. Apply Stun penalty: Slowness II and Mining Fatigue II for 60 ticks (3s)
    player.potionEffects.add('minecraft:slowness', 60, 1, false, true);
    player.potionEffects.add('minecraft:mining_fatigue', 60, 1, false, true);

    // 5. Knockback backwards on guard break
    try {
        let look = player.lookAngle;
        player.knockback(0.8, -look.x, -look.z);
        player.hurtMarked = true;
    } catch (eKb) {}

    // 6. Actionbar notification
    player.sendSystemMessage(Text.of('§4⚠ БЛОК ПРОБИТ! (Guard Break) §cЩит выбит из рук!'), true);

    // 7. Sync broken posture to client HUD
    let maxPost = 100 + (getReinforceLevel(shieldItem) * 50);
    syncPlayerPosture(player, maxPost, maxPost, true);
}

function syncPlayerPosture(player, curAbsorbed, maxPosture, hasShield) {
    if (!player) return;
    try {
        let cur = Math.max(0, Math.round(maxPosture - (curAbsorbed || 0)));
        let max = Math.round(maxPosture);
        player.sendData('elyrium:sync_posture', {
            posture: cur,
            maxPosture: max,
            hasShield: !!hasShield
        });
    } catch (e) {}
}

// ------------------------------------------------------------------------------
// 1. DAMAGE & GUARD POSTURE ABSORPTION EVENT
// ------------------------------------------------------------------------------
EntityEvents.beforeHurt(event => {
    let victim = event.entity;
    if (!victim || !victim.isPlayer() || !victim.isAlive()) return;
    let player = victim;

    if (!player.isBlocking()) return;
    if (player.persistentData.getBoolean('skd_offhand_locked')) return;

    let source = event.source;
    if (!source) return;

    if (isUnblockable(source)) return;
    if (!isFacingAttacker(player, source)) return;

    let shieldItem = getActiveShield(player);
    if (!shieldItem) return;

    let incomingDmg = event.damage;
    if (incomingDmg <= 0) return;

    let reinforceLvl = getReinforceLevel(shieldItem);
    // Max posture capacity = 100 + (skd_reinforce * 50)
    let maxPosture = 100 + (reinforceLvl * 50);

    let isElemental = isElementalOrMagic(source);
    let pData = player.persistentData;
    let currentAbsorbed = pData.getFloat('skd_guard_absorbed') || 0;

    let throughRate = 0.0;
    let absorbedThisHit = incomingDmg;

    if (isElemental) {
        // Elemental through-block mitigation:
        // +0 shield lets through 25% magic/fire damage.
        // Each reinforcement level reduces through-damage by 2.5% (at +10: 0% through).
        throughRate = Math.max(0.0, 0.25 - (reinforceLvl * 0.025));
        let throughDmg = incomingDmg * throughRate;
        absorbedThisHit = incomingDmg - throughDmg;
    }

    let newAbsorbed = currentAbsorbed + absorbedThisHit;

    if (newAbsorbed >= maxPosture) {
        // GUARD BREAK!
        triggerGuardBreak(player, shieldItem, event.server);
        // Guard is shattered, full damage passes through
        event.damage = incomingDmg;
    } else {
        // Guard holds!
        pData.putFloat('skd_guard_absorbed', newAbsorbed);

        if (isElemental) {
            let throughDmg = incomingDmg * throughRate;
            if (throughDmg <= 0.001) {
                event.damage = 0;
                event.cancel();
            } else {
                event.damage = throughDmg;
            }
            event.server.runCommandSilent(`playsound minecraft:item.shield.block player ${player.username} ~ ~ ~ 0.9 1.1`);
            event.server.runCommandSilent(`particle minecraft:enchanted_hit ${player.x} ${player.y + 1} ${player.z} 0.3 0.3 0.3 0.1 12`);
        }
        // Physical attacks are blocked 100% by vanilla shield handling

        // Visual / Actionbar Posture Feedback
        let remaining = Math.max(0, maxPosture - newAbsorbed);
        let pct = Math.round((remaining / maxPosture) * 100);
        let color = pct > 50 ? '§a' : (pct > 25 ? '§e' : '§c');
        let blocksText = isElemental && throughRate > 0 ? ` §7(Пробито: §c${Math.round(throughRate * 100)}%§7)` : '';
        player.sendSystemMessage(Text.of(`§6🛡 Блок: ${color}${Math.round(remaining)}§7/§f${maxPosture} §7(Стойка ${color}${pct}%§7)${blocksText}`), true);

        // Zero-Latency Posture HUD Sync
        syncPlayerPosture(player, newAbsorbed, maxPosture, true);
    }
});

// ------------------------------------------------------------------------------
// 2. POSTURE RECOVERY & HUD SYNC ENGINE (20 posture per second when not blocking)
// ------------------------------------------------------------------------------
PlayerEvents.tick(event => {
    let player = event.player;
    if (!player) return;
    let tick = (typeof player.tickCount === 'number') ? player.tickCount : (player.age || 0);
    if (tick % 5 !== 0) return;

    let pData = player.persistentData;
    let absorbed = pData.getFloat('skd_guard_absorbed') || 0;

    let shieldItem = getActiveShield(player);
    let hasShield = shieldItem != null;
    let maxPosture = hasShield ? (100 + (getReinforceLevel(shieldItem) * 50)) : 100;

    if (absorbed > 0) {
        // Posture does not recover while actively holding block
        if (!player.isBlocking()) {
            // 20 posture/sec = 5 posture per 5 ticks (0.25s)
            let newAbsorbed = Math.max(0, absorbed - 5.0);
            if (newAbsorbed <= 0.01) {
                pData.remove('skd_guard_absorbed');
                newAbsorbed = 0;
            } else {
                pData.putFloat('skd_guard_absorbed', newAbsorbed);
            }
            syncPlayerPosture(player, newAbsorbed, maxPosture, hasShield);
        } else {
            // Actively blocking with absorbed posture - sync status
            syncPlayerPosture(player, absorbed, maxPosture, hasShield);
        }
    } else if (tick % 20 === 0) {
        // Heartbeat sync every 1 second when fully recovered
        syncPlayerPosture(player, 0, maxPosture, hasShield);
    }
});

// ------------------------------------------------------------------------------
// 3. CLEANUP ON DEATH
// ------------------------------------------------------------------------------
EntityEvents.death(event => {
    let entity = event.entity;
    if (entity && entity.isPlayer()) {
        if (entity.persistentData) {
            entity.persistentData.remove('skd_guard_absorbed');
        }
        syncPlayerPosture(entity, 0, 100, false);
    }
});
