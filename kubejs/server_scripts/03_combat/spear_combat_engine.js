// ==============================================================================
// 🔱 ELYRIUM RPG: SPEAR COMBAT ENGINE & VERSATILE DUAL-GRIP (v1.0)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// Canon 8-Tier Progression & Combat Arts Standard:
// 1. Identification:
//    - Identifies all spears (simplyswords:*_spear, *spear, *halberd, *lance,
//      *pike, *polearm, *glaive, and c:tools/spears / forge:tools/spears tags).
//
// 2. Versatile Dual-Grip Mechanics:
//    A. With Shield in Offhand (Hoplite / Legionnaire Guard Grip):
//       - [ПКМ]: Native Shield Block (cancels simplyswords trident-like charge,
//         instantly raises offhand shield unhindered).
//       - [ЛКМ]: Guard Thrust (attack from behind raised shield without dropping
//         defensive guard posture; -10% damage for impenetrable safety).
//       - [Shift + ЛКМ]: "Шквал 5 Уколов" (Spear Flurry) - 5 consecutive rapid
//         thrusts (30 stamina, 225% total damage, micro-staggers targets).
//
//    B. Without Shield (Two-Handed Power Grip):
//       - [ПКМ]: "Пронзающий Бросок Копья" (Piercing Ethereal Spear Throw):
//         - 35 Stamina cost.
//         - Cancels item consumption/loss! The spear in hand is NEVER consumed or dropped.
//         - High-velocity piercing projectile line (220% weapon damage, pierces all enemies).
//         - 100% Loyalty/Auto-return: vanishes in ethereal burst, sends return trail
//           and plays loyalty sound at player; weapon is 100% safe.
//       - [ЛКМ]: Two-handed heavy thrusts (+30% physical damage, +1.5m reach distance).
//       - [Shift + ЛКМ]: "Шквал 5 Уколов" (Two-handed boosted version).
//
// 3. "Шквал 5 Уколов" (Spear Flurry - 5 Consecutive Thrusts):
//    - Sequential animation phases:
//      1. simplyswords:halberd_stab_right (0.00s)
//      2. simplyswords:halberd_stab_top_right (0.15s)
//      3. simplyswords:halberd_stab_top_right_alt (0.30s)
//      4. simplyswords:halberd_stab_top_right_alt_02 (0.45s)
//      5. bettercombat:one_handed_stab (0.60s)
//    - 5 damage ticks over ~0.65s, dealing total 225% damage with white thrust lines,
//      micro-staggers enemies (canceling spellcast/attack windups).
// ==============================================================================

let J_InteractionHand_Spear = null;
try {
    J_InteractionHand_Spear = Java.loadClass('net.minecraft.world.InteractionHand');
} catch (eClass) {}

let J_AABB_Spear = null;
try {
    J_AABB_Spear = Java.loadClass('net.minecraft.world.phys.AABB');
} catch (eClass) {}

// ------------------------------------------------------------------------------
// 1. WEAPON & SHIELD CLASSIFICATION
// ------------------------------------------------------------------------------

function isSpearWeaponItem(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = String(item.id).toLowerCase();
    if (id.startsWith('simplyswords:') && id.endsWith('_spear')) return true;
    if (id.includes('spear') || id.includes('halberd') || id.includes('lance') ||
        id.includes('pike') || id.includes('polearm') || id.includes('glaive') ||
        id.includes('trident')) {
        return true;
    }
    if (item.hasTag('c:tools/spears') || item.hasTag('c:spears') ||
        item.hasTag('forge:tools/spears') || item.hasTag('forge:spears') ||
        item.hasTag('c:tools/polearms') || item.hasTag('c:polearms')) {
        return true;
    }
    return false;
}

function isShieldWeaponItem(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = String(item.id).toLowerCase();
    if (id.includes('shield')) return true;
    if (item.hasTag('c:tools/shields') || item.hasTag('c:shields') ||
        item.hasTag('forge:tools/shields') || item.hasTag('forge:shields') ||
        item.hasTag('minecraft:shields')) {
        return true;
    }
    return false;
}

// ------------------------------------------------------------------------------
// 2. STAMINA & COMBAT HELPERS
// ------------------------------------------------------------------------------

function getSpearEngineStamina(player) {
    if (!player) return 80;
    try {
        if (typeof getPlayerStamina === 'function') return getPlayerStamina(player);
    } catch (e) {}
    let pData = player.persistentData;
    if (!pData.contains('elyrium_stamina')) {
        pData.putInt('elyrium_stamina', 80);
        return 80;
    }
    return pData.getInt('elyrium_stamina');
}

function consumeSpearEngineStamina(player, amount) {
    if (!player) return false;
    try {
        if (typeof consumePlayerStamina === 'function') return consumePlayerStamina(player, amount);
    } catch (e) {}

    let cur = getSpearEngineStamina(player);
    if (cur < amount) return false;
    let nextStam = cur - amount;
    player.persistentData.putInt('elyrium_stamina', nextStam);
    try {
        if (typeof updateStaminaBossBar === 'function') {
            updateStaminaBossBar(player, nextStam, 100);
        }
    } catch (eSync) {}
    return true;
}

function broadcastSpearAnimation(player, animId, speed) {
    if (!player || !animId) return;
    let spd = speed || 1.0;
    try {
        if (typeof broadcastPlayerArtAnimation === 'function') {
            broadcastPlayerArtAnimation(player, animId, spd);
            return;
        }
    } catch (e) {}

    try { player.sendData('elyrium:play_art_anim', { anim: animId, speed: spd }); } catch (e1) {}
    try {
        let level = player.level;
        let box = J_AABB_Spear ? J_AABB_Spear.of(player.x - 64, player.y - 64, player.z - 64, player.x + 64, player.y + 64, player.z + 64)
                               : AABB.of(player.x - 64, player.y - 64, player.z - 64, player.x + 64, player.y + 64, player.z + 64);
        let nearby = level.getEntitiesWithin(box);
        nearby.forEach(ent => {
            if (ent && ent.isPlayer() && ent.id !== player.id) {
                ent.sendData('elyrium:play_player_art_anim', { playerId: player.id, anim: animId, speed: spd });
            }
        });
    } catch (e2) {}
}

function getSpearBaseDamage(player) {
    if (!player) return 6.0;
    try {
        if (typeof getWeaponBaseDamage === 'function') return getWeaponBaseDamage(player);
    } catch (e) {}

    let dmg = 6.0;
    try {
        let attr = player.attributes.getValue('minecraft:generic.attack_damage');
        if (attr && attr > 0) dmg = attr;
    } catch (eAttr) {}

    let main = player.mainHandItem;
    if (main && !main.isEmpty()) {
        let reinforce = 0;
        try {
            if (main.nbt && main.nbt.contains('skd_reinforce')) reinforce = main.nbt.getInt('skd_reinforce');
            else if (main.customData && main.customData.contains('skd_reinforce')) reinforce = main.customData.getInt('skd_reinforce');
        } catch (eR) {}
        if (reinforce > 0) {
            dmg *= (1.0 + reinforce * 0.05);
        }
    }
    return Math.max(3.0, dmg);
}

function dealSpearStrikeDamage(player, target, damage, bypassArmor) {
    if (!player || !target || !target.isAlive()) return;
    player.persistentData.putBoolean('skd_is_art_strike', true);
    try {
        if (typeof dealArtDamage === 'function') {
            dealArtDamage(player, target, damage, bypassArmor);
            return;
        }

        if (bypassArmor) {
            target.attack(player.damageSources().magic(), damage);
        } else {
            target.attack(player.damageSources().playerAttack(player), damage);
        }
    } catch (e1) {
        try { target.attack(player, damage); } catch (e2) {}
    } finally {
        player.persistentData.remove('skd_is_art_strike');
    }
}

function applySpearItemCooldown(player, item, ticks) {
    if (!player || !item) return;
    try {
        let rawItem = item.getItem ? item.getItem() : item;
        if (player.cooldowns && player.cooldowns.add) {
            player.cooldowns.add(rawItem, ticks);
        } else if (player.addItemCooldown) {
            player.addItemCooldown(rawItem, ticks);
        } else if (player.getCooldowns) {
            player.getCooldowns().addCooldown(rawItem, ticks);
        }
    } catch (eCd) {}
}

// ------------------------------------------------------------------------------
// 3. CORE SKILL 1: «ШКВАЛ 5 УКОЛОВ» (SPEAR FLURRY)
// ------------------------------------------------------------------------------

function executeSpearFlurry(player) {
    if (!player || !player.isAlive()) return;
    let mainHand = player.mainHandItem;
    if (!isSpearWeaponItem(mainHand)) return;

    let now = Date.now();
    let cdEnd = player.persistentData.getLong('skd_cd_spear_flurry') || 0;
    if (now < cdEnd) {
        let remainSec = Math.ceil((cdEnd - now) / 1000);
        player.sendSystemMessage(Text.of(`§7Боевое искусство «Шквал Уколов» восстанавливается (§e${remainSec}с§7)...`), true);
        return;
    }

    let curStam = getSpearEngineStamina(player);
    let stamCost = 30;
    if (curStam < stamCost) {
        player.sendSystemMessage(Text.of(`§c⚡ Недостаточно выносливости для Шквала Уколов! Требуется: §e${stamCost} §c(У вас: §7${curStam}§c)`), true);
        player.server.runCommandSilent(`playsound minecraft:entity.player.breath player ${player.username} ~ ~ ~ 0.8 1.4`);
        return;
    }

    // Set 10-second cooldown and consume stamina
    let cdMs = 10000;
    player.persistentData.putLong('skd_cd_spear_flurry', now + cdMs);
    player.persistentData.putString('skd_active_cd_art', 'spear_flurry');
    player.persistentData.putLong('skd_active_cd_end', now + cdMs);
    consumeSpearEngineStamina(player, stamCost);
    applySpearItemCooldown(player, mainHand, 14);

    let offHand = player.offHandItem;
    let isTwoHanded = (!offHand || offHand.isEmpty() || offHand.id === 'minecraft:air' || !isShieldWeaponItem(offHand));
    let baseDmg = getSpearBaseDamage(player);
    // 225% total damage across 5 strikes (two-handed bonus +30% if no shield)
    let totalDmgMult = 2.25 * (isTwoHanded ? 1.30 : 1.0);
    let singleStrikeDmg = (baseDmg * totalDmgMult) / 5.0;

    let u = player.username;
    let level = player.level;
    let reach = 5.5;

    // 5 consecutive rapid thrusts:
    // 1. simplyswords:halberd_stab_right (tick 0)
    // 2. simplyswords:halberd_stab_top_right (tick 3)
    // 3. simplyswords:halberd_stab_top_right_alt (tick 6)
    // 4. simplyswords:halberd_stab_top_right_alt_02 (tick 9)
    // 5. bettercombat:one_handed_stab (tick 12)
    const FLURRY_PHASES = [
        { tick: 0, anim: 'simplyswords:halberd_stab_right', pitch: 1.2, isFinisher: false },
        { tick: 3, anim: 'simplyswords:halberd_stab_top_right', pitch: 1.35, isFinisher: false },
        { tick: 6, anim: 'simplyswords:halberd_stab_top_right_alt', pitch: 1.5, isFinisher: false },
        { tick: 9, anim: 'simplyswords:halberd_stab_top_right_alt_02', pitch: 1.65, isFinisher: false },
        { tick: 12, anim: 'bettercombat:one_handed_stab', pitch: 1.8, isFinisher: true }
    ];

    FLURRY_PHASES.forEach((phase, idx) => {
        player.server.scheduleInTicks(phase.tick, () => {
            if (!player || !player.isAlive()) return;

            // Broadcast animation phase
            broadcastSpearAnimation(player, phase.anim, 1.8);

            // Re-evaluate aiming vector dynamically each strike
            let curLook = player.getLookAngle();
            let curHLen = Math.max(0.01, Math.sqrt(curLook.x * curLook.x + curLook.y * curLook.y + curLook.z * curLook.z));
            let cnx = curLook.x / curHLen;
            let cny = curLook.y / curHLen;
            let cnz = curLook.z / curHLen;

            // SFX & VFX per strike
            let fx = player.x + cnx * 2.5;
            let fy = player.y + player.eyeHeight - 0.1 + cny * 2.5;
            let fz = player.z + cnz * 2.5;

            player.server.runCommandSilent(`playsound minecraft:item.trident.throw player ${u} ${fx} ${fy} ${fz} 1.1 ${phase.pitch}`);
            player.server.runCommandSilent(`playsound minecraft:entity.player.attack.sweep player ${u} ${fx} ${fy} ${fz} 0.8 1.6`);

            // White thrust line VFX
            for (let d = 1.0; d <= reach; d += 0.9) {
                let lx = player.x + cnx * d;
                let ly = player.y + player.eyeHeight - 0.1 + cny * d;
                let lz = player.z + cnz * d;
                player.server.runCommandSilent(`particle minecraft:crit ${lx} ${ly} ${lz} 0.1 0.1 0.1 0.05 2 normal`);
                player.server.runCommandSilent(`particle minecraft:sweep_attack ${lx} ${ly} ${lz} 0.15 0.15 0.15 0.02 1 normal`);
            }

            if (phase.isFinisher) {
                // Finisher sparks, metal clink and flash
                player.server.runCommandSilent(`playsound minecraft:block.anvil.land player ${u} ${fx} ${fy} ${fz} 0.4 1.7`);
                player.server.runCommandSilent(`playsound minecraft:item.shield.break player ${u} ${fx} ${fy} ${fz} 0.3 1.6`);
                player.server.runCommandSilent(`particle minecraft:flash ${fx} ${fy} ${fz} 0 0 0 0 1 normal`);
                player.server.runCommandSilent(`particle minecraft:electric_spark ${fx} ${fy} ${fz} 0.4 0.4 0.4 0.1 15 normal`);
            }

            // Raycast hit detection with micro-stagger
            let hitSet = new Set();
            for (let d = 1.0; d <= reach; d += 0.8) {
                let px = player.x + cnx * d;
                let py = player.y + player.eyeHeight - 0.1 + cny * d;
                let pz = player.z + cnz * d;

                let b = J_AABB_Spear ? J_AABB_Spear.of(px - 0.85, py - 0.85, pz - 0.85, px + 0.85, py + 0.85, pz + 0.85)
                                     : AABB.of(px - 0.85, py - 0.85, pz - 0.85, px + 0.85, py + 0.85, pz + 0.85);
                let ents = level.getEntitiesWithin(b);
                ents.forEach(ent => {
                    if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive() && !hitSet.has(ent.id)) {
                        hitSet.add(ent.id);
                        // Strike 5 finisher ignores 30% armor
                        dealSpearStrikeDamage(player, ent, singleStrikeDmg, phase.isFinisher);

                        // Micro-stagger cancels mob attack/spell windups
                        if (!phase.isFinisher) {
                            ent.knockback(0.25, -cnx, -cnz);
                            try { ent.potionEffects.add('minecraft:slowness', 12, 1, false, false); } catch (eEff) {}
                        } else {
                            ent.knockback(0.65, -cnx, -cnz);
                            try { ent.potionEffects.add('minecraft:slowness', 30, 2, false, true); } catch (eEff) {}
                        }
                    }
                });
            }
        });
    });

    let stanceTag = isTwoHanded ? '§6[Двуручный хват +30%]' : '§7[Хват со щитом]';
    player.sendSystemMessage(Text.of(`§b🔱 ШКВАЛ ПЯТИ УКОЛОВ! §fПулеметная серия уколов с 5.5 блоков ${stanceTag} §e-30⚡`), true);
}

// ------------------------------------------------------------------------------
// 4. CORE SKILL 2: «ПРОНЗАЮЩИЙ БРОСОК КОПЬЯ» (PIERCING ETHEREAL SPEAR THROW)
// ------------------------------------------------------------------------------

function executeSpearThrow(player, spearItem) {
    if (!player || !player.isAlive()) return;
    if (!isSpearWeaponItem(spearItem)) return;

    let now = Date.now();
    let cdEnd = player.persistentData.getLong('elyrium_spear_throw_cd') || 0;
    if (now < cdEnd) {
        return; // Small safety cooldown between throws
    }

    let curStam = getSpearEngineStamina(player);
    let stamCost = 35;
    if (curStam < stamCost) {
        player.sendSystemMessage(Text.of(`§c⚡ Недостаточно выносливости для броска копья! Требуется: §e${stamCost} §c(У вас: §7${curStam}§c)`), true);
        player.server.runCommandSilent(`playsound minecraft:entity.player.breath player ${player.username} ~ ~ ~ 0.8 1.4`);
        return;
    }

    // Set 1.5s cooldown and consume stamina
    player.persistentData.putLong('elyrium_spear_throw_cd', now + 1500);
    player.persistentData.putInt('elyrium_last_spear_throw_tick', (typeof player.tickCount === 'number') ? player.tickCount : (player.age || 0));
    consumeSpearEngineStamina(player, stamCost);
    applySpearItemCooldown(player, spearItem, 30);

    let u = player.username;
    let level = player.level;
    let baseDmg = getSpearBaseDamage(player);
    let throwDmg = baseDmg * 2.20; // 220% weapon attack damage

    // Broadcast throw animation
    broadcastSpearAnimation(player, 'bettercombat:one_handed_stab', 1.6);
    player.server.runCommandSilent(`playsound minecraft:item.trident.throw player ${u} ${player.x} ${player.y} ${player.z} 1.3 1.0`);
    player.sendSystemMessage(Text.of('§b🔱 ПРОНЗАЮЩИЙ БРОСОК КОПЬЯ! §f(220% сквозного пробоя | Автовозврат) §e-35⚡'), true);

    // Initial trajectory math
    let look = player.getLookAngle();
    let len = Math.max(0.01, Math.sqrt(look.x * look.x + look.y * look.y + look.z * look.z));
    let dx = look.x / len;
    let dy = look.y / len;
    let dz = look.z / len;

    let startX = player.x;
    let startY = player.y + player.eyeHeight - 0.15;
    let startZ = player.z;

    let speedPerTick = 2.2;
    let maxTicks = 12; // ~26.4 blocks flight distance
    let hitSet = new Set();
    let hasTerminated = false;

    for (let t = 1; t <= maxTicks; t++) {
        player.server.scheduleInTicks(t, () => {
            if (hasTerminated || !player || !player.isAlive()) return;

            // Flat trajectory with gentle gravity drop
            let currentDist = speedPerTick * t;
            let gravityDrop = 0.5 * 0.02 * (t * t);
            let px = startX + dx * currentDist;
            let py = startY + dy * currentDist - gravityDrop;
            let pz = startZ + dz * currentDist;

            // 1. Solid block collision detection
            let bx = Math.floor(px);
            let by = Math.floor(py);
            let bz = Math.floor(pz);
            try {
                let blk = level.getBlock(bx, by, bz);
                if (blk && blk.blockState && blk.blockState.blocksMotion()) {
                    hasTerminated = true;
                    triggerSpearReturn(player, px, py, pz, u);
                    return;
                }
            } catch (eBlk) {}

            // 2. High-speed ethereal particle trail
            player.server.runCommandSilent(`particle minecraft:crit ${px} ${py} ${pz} 0.15 0.15 0.15 0.05 4 normal`);
            player.server.runCommandSilent(`particle minecraft:sweep_attack ${px} ${py} ${pz} 0.1 0.1 0.1 0.02 1 normal`);
            player.server.runCommandSilent(`particle minecraft:electric_spark ${px} ${py} ${pz} 0.1 0.1 0.1 0.05 2 normal`);

            // 3. Piercing entity damage along path
            let aabb = J_AABB_Spear ? J_AABB_Spear.of(px - 1.2, py - 1.0, pz - 1.2, px + 1.2, py + 1.0, pz + 1.2)
                                    : AABB.of(px - 1.2, py - 1.0, pz - 1.2, px + 1.2, py + 1.0, pz + 1.2);
            let ents = level.getEntitiesWithin(aabb);
            ents.forEach(ent => {
                if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive() && !hitSet.has(ent.id)) {
                    hitSet.add(ent.id);
                    dealSpearStrikeDamage(player, ent, throwDmg, false);
                    ent.knockback(0.8, -dx, -dz);

                    // Impact feedback
                    player.server.runCommandSilent(`playsound minecraft:item.trident.hit player ${u} ${ent.x} ${ent.y} ${ent.z} 1.2 1.2`);
                    player.server.runCommandSilent(`particle minecraft:crit ${ent.x} ${ent.y + 1.0} ${ent.z} 0.3 0.3 0.3 0.1 15 normal`);
                    player.server.runCommandSilent(`particle minecraft:electric_spark ${ent.x} ${ent.y + 1.0} ${ent.z} 0.3 0.3 0.3 0.1 8 normal`);
                }
            });

            // 4. Maximum range reached -> trigger auto-return
            if (t === maxTicks && !hasTerminated) {
                hasTerminated = true;
                triggerSpearReturn(player, px, py, pz, u);
            }
        });
    }
}

function triggerSpearReturn(player, endX, endY, endZ, username) {
    if (!player || !player.isAlive()) return;

    // Ether particle burst at impact / terminus
    player.server.runCommandSilent(`particle minecraft:reverse_portal ${endX} ${endY} ${endZ} 0.4 0.4 0.4 0.1 20 normal`);
    player.server.runCommandSilent(`particle minecraft:enchanted_hit ${endX} ${endY} ${endZ} 0.3 0.3 0.3 0.1 15 normal`);
    player.server.runCommandSilent(`playsound minecraft:item.trident.return player ${username} ${endX} ${endY} ${endZ} 1.1 1.4`);

    // Return particle trail back to player 2 ticks later
    player.server.scheduleInTicks(2, () => {
        if (!player || !player.isAlive()) return;

        let steps = 8;
        for (let s = 1; s <= steps; s++) {
            let t = s / steps;
            let rx = endX + (player.x - endX) * t;
            let ry = endY + (player.y + 1.0 - endY) * t;
            let rz = endZ + (player.z - endZ) * t;
            player.server.runCommandSilent(`particle minecraft:portal ${rx} ${ry} ${rz} 0.1 0.1 0.1 0.02 2 normal`);
            player.server.runCommandSilent(`particle minecraft:electric_spark ${rx} ${ry} ${rz} 0.05 0.05 0.05 0.01 1 normal`);
        }

        // Catch sound & chime at player
        player.server.runCommandSilent(`playsound minecraft:item.trident.return player ${username} ${player.x} ${player.y} ${player.z} 1.3 1.2`);
        player.server.runCommandSilent(`playsound minecraft:block.amethyst_block.resonate player ${username} ${player.x} ${player.y} ${player.z} 0.8 1.8`);
        player.sendSystemMessage(Text.of('§a✦ Копье вернулось в руку!'), true);
    });
}

// ------------------------------------------------------------------------------
// 5. EVENT HOOKS: RIGHT-CLICK INTERCEPTION (ПКМ & SHIELD GUARD)
// ------------------------------------------------------------------------------

ItemEvents.firstRightClicked(event => {
    let player = event.player;
    if (!player || !player.isAlive()) return;

    let item = event.item;
    if (!item || item.isEmpty() || !isSpearWeaponItem(item)) return;

    // Check hand
    let handStr = String(event.hand || '').toUpperCase();
    if (handStr.includes('OFF')) return; // Offhand shield handles itself

    let offHand = player.offHandItem;
    let hasShieldInOffhand = isShieldWeaponItem(offHand);

    // MODE A: Shield Equipped in Offhand (Hoplite Guard)
    if (hasShieldInOffhand) {
        // Cancel spear action so offhand shield raises unhindered
        event.cancel();
        let useItem = player.useItem;
        if (useItem && isSpearWeaponItem(useItem)) {
            try { player.stopUsingItem(); } catch (eStop) {}
        }
        try {
            if (J_InteractionHand_Spear) {
                player.startUsingItem(J_InteractionHand_Spear.OFF_HAND);
            }
        } catch (eShield) {}
        return;
    }

    // MODE B: No Shield (Two-Handed Grip -> Spear Throw Skill)
    event.cancel();
    let useItem = player.useItem;
    if (useItem && isSpearWeaponItem(useItem)) {
        try { player.stopUsingItem(); } catch (eStop) {}
    }
    executeSpearThrow(player, item);
});

ItemEvents.rightClicked(event => {
    let player = event.player;
    if (!player || !player.isAlive()) return;

    let item = event.item;
    if (!item || item.isEmpty() || !isSpearWeaponItem(item)) return;

    let handStr = String(event.hand || '').toUpperCase();
    if (handStr.includes('OFF')) return;

    let offHand = player.offHandItem;
    let hasShieldInOffhand = isShieldWeaponItem(offHand);

    if (hasShieldInOffhand) {
        event.cancel();
        // Crucial fix: Only stop using item if player is charging spear, NEVER stop active shield!
        let useItem = player.useItem;
        if (useItem && isSpearWeaponItem(useItem)) {
            try { player.stopUsingItem(); } catch (eStop) {}
        }
        return;
    }

    // Suppress sustained right-click charging from vanilla/simplyswords
    event.cancel();
    let useItem = player.useItem;
    if (useItem && isSpearWeaponItem(useItem)) {
        try { player.stopUsingItem(); } catch (eStop) {}
    }
});

// ------------------------------------------------------------------------------
// 6. EVENT HOOKS: NETWORK RECEIVER FOR SPEAR SKILLS
// ------------------------------------------------------------------------------

NetworkEvents.dataReceived('elyrium:trigger_weapon_art', event => {
    let player = event.player;
    if (!player || !player.isAlive()) return;

    let mainHand = player.mainHandItem;
    if (!isSpearWeaponItem(mainHand)) return;

    let action = '';
    try {
        if (event.data) {
            let d = event.data;
            if (typeof d.contains === 'function' && d.contains('action')) action = d.getString('action');
            else if (d.action !== undefined) action = String(d.action);
        }
    } catch (eData) {}

    // Shift + LMB triggers Spear Flurry
    if (action === 'spear_flurry' || action === 'innate_art' || action === 'shield_shift_lmb') {
        executeSpearFlurry(player);
    }
});

NetworkEvents.dataReceived('elyrium:spear_flurry', event => {
    let player = event.player;
    if (player && player.isAlive()) {
        executeSpearFlurry(player);
    }
});

NetworkEvents.dataReceived('elyrium:trigger_spear_throw', event => {
    let player = event.player;
    if (player && player.isAlive()) {
        let mainHand = player.mainHandItem;
        if (isSpearWeaponItem(mainHand)) {
            executeSpearThrow(player, mainHand);
        }
    }
});

// ------------------------------------------------------------------------------
// 7. EVENT HOOKS: COMBAT MELEE INTERACTION (GUARD THRUST & CROUCH ATTACK)
// ------------------------------------------------------------------------------

EntityEvents.beforeHurt(event => {
    let source = event.source;
    if (!source) return;

    let attacker = source.actual || source.player;
    let victim = event.entity;
    if (!attacker || !attacker.isPlayer() || !attacker.isAlive() || !victim || !victim.isAlive() || victim.isPlayer()) return;

    let mainHand = attacker.mainHandItem;
    if (!isSpearWeaponItem(mainHand)) return;

    // Ignore recursive art damage events from Spear Flurry / Spear Throw
    if (attacker.persistentData.getBoolean('skd_is_art_strike')) return;

    // Shift + LMB attack triggers Spear Flurry
    if (attacker.isCrouching()) {
        let now = Date.now();
        let cdEnd = attacker.persistentData.getLong('skd_cd_spear_flurry') || 0;
        if (now >= cdEnd) {
            executeSpearFlurry(attacker);
            event.cancel();
            return;
        } else {
            let remainSec = Math.ceil((cdEnd - now) / 1000);
            attacker.sendSystemMessage(Text.of(`§7Боевое искусство «Шквал Уколов» восстанавливается (§e${remainSec}с§7)...`), true);
        }
    }

    let offHand = attacker.offHandItem;
    let hasShield = isShieldWeaponItem(offHand);

    // Mode A: Guard Thrust with Shield
    if (hasShield) {
        // Only re-raise shield if player was actively blocking or using item (do not force idle attack into block)
        if (attacker.isBlocking() || attacker.isUsingItem()) {
            try {
                attacker.server.scheduleInTicks(1, () => {
                    if (attacker && attacker.isAlive() && J_InteractionHand_Spear) {
                        if (isShieldWeaponItem(attacker.offHandItem)) {
                            attacker.startUsingItem(J_InteractionHand_Spear.OFF_HAND);
                        }
                    }
                });
            } catch (eGuard) {}
        }
    }
});

// ------------------------------------------------------------------------------
// 8. ANTI-LOSS SAFETY HOOK (Cancels Physical Entity Drops on Thrown Spears)
// ------------------------------------------------------------------------------

EntityEvents.spawned(event => {
    let entity = event.entity;
    if (!entity) return;
    let type = String(entity.type).toLowerCase();

    // Catch any thrown spear or trident entities spawned by player
    if (type.includes('spear') || type.includes('trident')) {
        let owner = entity.owner;
        if (owner && owner.isPlayer && owner.isPlayer()) {
            // Cancel physical entity spawn so weapon is NEVER lost on ground
            event.cancel();

            // Safety recovery: If SimplySwords shrink(1) happened, restore the weapon stack!
            let thrownStack = null;
            try {
                if (entity.pickupItemStackOrigin) thrownStack = entity.pickupItemStackOrigin;
                else if (entity.item) thrownStack = entity.item;
                else if (typeof entity.getItem === 'function') thrownStack = entity.getItem();
            } catch (eStack) {}

            if (thrownStack && !thrownStack.isEmpty()) {
                let main = owner.mainHandItem;
                if (!main || main.isEmpty() || main.id === 'minecraft:air') {
                    owner.setMainHandItem(thrownStack);
                } else if (main.id === thrownStack.id && main.count < thrownStack.maxStackSize) {
                    main.count++;
                } else {
                    owner.give(thrownStack);
                }
            }
        }
    }
});
