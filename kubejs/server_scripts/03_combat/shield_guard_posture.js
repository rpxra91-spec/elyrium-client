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

function getShieldClassification(item) {
    if (!item) return { stability: 0.5, weight: 1, type: 'light', minStr: 0, minDef: 0 };
    let id = item.id ? item.id.toLowerCase() : '';
    let reinforce = getReinforceLevel(item);

    if (id.includes('tower') || id.includes('heavy') || id.includes('great') || id.includes('bulwark') || id.includes('steel') || id.includes('netherite')) {
        // Heavy Tower Shield
        let baseStab = 0.80 + (reinforce * 0.012); // up to 92% at +10
        return { stability: Math.min(0.92, baseStab), weight: 5, type: 'tower', minStr: 20, minDef: 18 };
    } else if (id.includes('buckler') || id.includes('leather') || id.includes('wood') || id.includes('copper')) {
        // Light Buckler
        let baseStab = 0.45 + (reinforce * 0.02); // up to 65% at +10
        return { stability: Math.min(0.65, baseStab), weight: 1, type: 'buckler', minStr: 4, minDef: 4 };
    } else {
        // Medium Shield
        let baseStab = 0.65 + (reinforce * 0.015); // up to 80% at +10
        return { stability: Math.min(0.80, baseStab), weight: 2, type: 'medium', minStr: 10, minDef: 10 };
    }
}

// ------------------------------------------------------------------------------
// 1. DAMAGE & GUARD POSTURE / STAMINA ABSORPTION EVENT
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

    let pData = player.persistentData;
    let shieldClass = getShieldClassification(shieldItem);

    // 1. PERFECT PARRY (Light Buckler within 4 ticks / 0.20s of raising block)
    let blockTicks = player.level.time - (pData.getLong('skd_block_raised_time') || 0);
    if (shieldClass.type === 'buckler' && blockTicks <= 4 && blockTicks >= 0) {
        event.server.runCommandSilent(`playsound minecraft:block.anvil.land player ${player.username} ~ ~ ~ 1.5 1.5`);
        event.server.runCommandSilent(`particle minecraft:crit ${player.x} ${player.y + 1} ${player.z} 0.8 0.8 0.8 0.2 25`);
        let attacker = source.actual || source.direct;
        if (attacker && attacker.isLiving()) {
            attacker.potionEffects.add('minecraft:slowness', 40, 4, false, false);
        }
        pData.putLong('elyrium_riposte_ready_until', player.level.time + 50); // +150% damage on next hit!
        player.sendSystemMessage(Text.of('§e⚡ ИДЕАЛЬНОЕ ПАРИРОВАНИЕ! §6[Рипост готов: +150% урона!]'), true);
        event.damage = 0;
        event.cancel();
        return;
    }

    // 2. STAMINA DEDUCTION BASED ON SHIELD STABILITY
    let stamCost = Math.max(1, Math.round(incomingDmg * (1.0 - shieldClass.stability)));
    let currentStam = (typeof getPlayerStamina === 'function') ? getPlayerStamina(player) : (pData.getInt('elyrium_stamina') || 100);
    let maxStam = (typeof getPlayerMaxStamina === 'function') ? getPlayerMaxStamina(player) : 100;

    if (currentStam < stamCost) {
        // GUARD BREAK!
        pData.putInt('elyrium_stamina', 0);
        if (typeof updateStaminaBossBar === 'function') {
            updateStaminaBossBar(player, 0, maxStam);
        }
        triggerGuardBreak(player, shieldItem, event.server);
        event.damage = incomingDmg; // Full damage bleeds through
    } else {
        // Guard holds!
        let newStam = currentStam - stamCost;
        pData.putInt('elyrium_stamina', newStam);
        pData.putLong('elyrium_stamina_regen_delay_until', Date.now() + 1000); // 1.0s delay after block
        if (typeof updateStaminaBossBar === 'function') {
            updateStaminaBossBar(player, newStam, maxStam);
        }

        // Tower shield knockback immunity
        if (shieldClass.type === 'tower') {
            player.hurtMarked = false;
        }

        event.server.runCommandSilent(`playsound minecraft:item.shield.block player ${player.username} ~ ~ ~ 0.9 1.1`);
        player.sendSystemMessage(Text.of(`§6🛡 Блок: §e-${stamCost}⚡ §7[Остаток: §f${newStam}⚡§7]`), true);
        
        // Physical attacks are fully absorbed by vanilla block
        let isElemental = isElementalOrMagic(source);
        if (isElemental) {
            let throughRate = Math.max(0.0, 0.25 - (getReinforceLevel(shieldItem) * 0.025));
            let throughDmg = incomingDmg * throughRate;
            if (throughDmg <= 0.001) {
                event.damage = 0;
                event.cancel();
            } else {
                event.damage = throughDmg;
            }
        }
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

    let isBlocking = player.isBlocking();
    let wasBlocking = pData.getBoolean('skd_is_blocking_state');
    if (isBlocking && !wasBlocking) {
        pData.putLong('skd_block_raised_time', player.level.time);
        pData.putBoolean('skd_is_blocking_state', true);
    } else if (!isBlocking && wasBlocking) {
        pData.putBoolean('skd_is_blocking_state', false);
    }

    // Heavy Tower Shield stat gating
    if (hasShield) {
        let shieldClass = getShieldClassification(shieldItem);
        if (shieldClass.type === 'tower') {
            let perks = pData.getCompound('simplestats_perks');
            let str = perks ? perks.getInt('strength') : 0;
            let def = perks ? perks.getInt('defense') : 0;
            if (str < shieldClass.minStr || def < shieldClass.minDef) {
                player.potionEffects.add('minecraft:slowness', 10, 1, false, false);
            }
        }
    }

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
// 3. PARRY RIPOSTE DAMAGE MULTIPLIER (+150% damage)
// ------------------------------------------------------------------------------
EntityEvents.beforeHurt(event => {
    let attacker = event.source ? (event.source.actual || event.source.direct) : null;
    if (attacker && attacker.isPlayer()) {
        let pData = attacker.persistentData;
        let riposteUntil = pData.getLong('elyrium_riposte_ready_until') || 0;
        if (attacker.level.time <= riposteUntil) {
            pData.remove('elyrium_riposte_ready_until');
            event.damage = event.damage * 2.5; // +150% riposte critical!
            attacker.server.runCommandSilent(`playsound minecraft:entity.player.attack.crit player ${attacker.username} ~ ~ ~ 1.5 1.4`);
            attacker.server.runCommandSilent(`particle minecraft:crit ${event.entity.x} ${event.entity.y + 1} ${event.entity.z} 0.8 0.8 0.8 0.25 35`);
            attacker.sendSystemMessage(Text.of('§c💥 СОКРУШИТЕЛЬНЫЙ РИПОСТ! §e[+150% УРОНА]'), true);
        }
    }
});

// ------------------------------------------------------------------------------
// 4. CLEANUP ON DEATH
// ------------------------------------------------------------------------------
EntityEvents.death(event => {
    let entity = event.entity;
    if (entity && entity.isPlayer()) {
        if (entity.persistentData) {
            entity.persistentData.remove('skd_guard_absorbed');
            entity.persistentData.remove('elyrium_riposte_ready_until');
        }
        syncPlayerPosture(entity, 0, 100, false);
    }
});

