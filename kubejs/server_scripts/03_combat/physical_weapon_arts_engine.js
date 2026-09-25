// ==============================================================================
// ⚔️ ELYRIUM RPG: PHYSICAL WEAPON ARTS & GUARD COUNTER ENGINE
// ==============================================================================
// Architecture & Mechanics Specification:
// 1. Triggering Controls:
//    - Two-Handed Weapons (offhand empty):
//      * Right-Click (ПКМ): Triggers Weapon Art 1 (or equipped art).
//      * Jump + ПКМ (airborne): Triggers Ground Slam / Sunder (Earth Sunder / Seismic Slam).
//    - One-Handed Weapons with Shield:
//      * Guard Counter: When blocking with shield (ПКМ) and taking a hit ->
//        Pressing Left Click within 1.5s window triggers instant Guard Counter (+150% dmg, stun).
//      * Dedicated hotkey / command: '.art' in chat or '/art' command, or Sneak + ПКМ.
//    - One-Handed Weapons (offhand empty):
//      * Right-Click (ПКМ): Triggers equipped Weapon Art.
// 2. 8 Martial Arts (AoE hitbox, damage, particles, sound, cooldown):
//    - Whirlwind Cleave: 360° sweep in 4.5 block radius, 180% weapon dmg, knockback, sweep/sparks (CD: 12s).
//    - Earth Sunder: 6-block linear shockwave forward, knocks mobs into air, 200% weapon dmg, dirt/explosion (CD: 15s).
//    - Juggernaut Rush: 7-block charge with Resistance 40% buff, knocks enemies aside, 150% dmg (CD: 16s).
//    - Lightning Thrust: Instant dash through targets 6 blocks, inflicts Bleed/Wither 3s, 190% dmg (CD: 10s).
//    - Blood Rend: Crescent slash with 10% lifesteal of damage dealt, blood particles (CD: 11s).
//    - Seismic Slam: Heavy leap & slam in 4-block radius, Slowness IV (stun) 2.5s, 220% dmg (CD: 14s).
//    - Shadow Step: Blinks behind target in 6 blocks, Invisibility 1.5s, next strike within 3s is 100% Crit (CD: 12s).
//    - Arrow Barrage: Shoots a spread of 5 spectral arrows forward in an arc (CD: 10s).
// 3. Cooldown tracking in player.persistentData with Actionbar display of readiness.
// ==============================================================================

const WEAPON_ARTS = {
    whirlwind_cleave: {
        id: 'whirlwind_cleave',
        num: 1,
        name: 'Вихревой Размах',
        enName: 'Whirlwind Cleave',
        cdMs: 12000,
        dmgMult: 1.8,
        desc: 'Круговой клив на 360° в радиусе 4.5 блоков с отбрасыванием врагов.'
    },
    earth_sunder: {
        id: 'earth_sunder',
        num: 2,
        name: 'Рассечение Земли',
        enName: 'Earth Sunder',
        cdMs: 15000,
        dmgMult: 2.0,
        desc: 'Линейная ударная волна на 6 блоков, подбрасывающая врагов в воздух.'
    },
    juggernaut_rush: {
        id: 'juggernaut_rush',
        num: 3,
        name: 'Неумолимый Натиск',
        enName: 'Juggernaut Rush',
        cdMs: 16000,
        dmgMult: 1.5,
        desc: 'Таранный рывок на 7 блоков с Сопротивлением 40%, раскидывающий врагов.'
    },
    lightning_thrust: {
        id: 'lightning_thrust',
        num: 4,
        name: 'Молниеносный Выпад',
        enName: 'Lightning Thrust',
        cdMs: 10000,
        dmgMult: 1.9,
        desc: 'Мгновенный выпад-рывок сквозь врагов на 6 блоков с кровотечением.'
    },
    blood_rend: {
        id: 'blood_rend',
        num: 5,
        name: 'Кровавый Росчерк',
        enName: 'Blood Rend',
        cdMs: 11000,
        dmgMult: 1.7,
        desc: 'Серповидный взмах клинком с исцелением на 10% от нанесенного урона.'
    },
    seismic_slam: {
        id: 'seismic_slam',
        num: 6,
        name: 'Сейсмический Удар',
        enName: 'Seismic Slam',
        cdMs: 14000,
        dmgMult: 2.2,
        desc: 'Сокрушительный прыжок-удар в радиусе 4 блоков с оглушением на 2.5с.'
    },
    shadow_step: {
        id: 'shadow_step',
        num: 7,
        name: 'Теневой Шаг',
        enName: 'Shadow Step',
        cdMs: 12000,
        dmgMult: 2.0,
        desc: 'Телепортация за спину цели на 6 блоков, Невидимость и 100% Крит.'
    },
    arrow_barrage: {
        id: 'arrow_barrage',
        num: 8,
        name: 'Залп Стрел',
        enName: 'Arrow Barrage',
        cdMs: 10000,
        dmgMult: 1.6,
        desc: 'Веерный выпуск 5 спектральных стрел по дуге перед собой.'
    }
};

// ------------------------------------------------------------------------------
// HELPER FUNCTIONS: WEAPON CLASSIFICATION
// ------------------------------------------------------------------------------

function isTwoHandedWeapon(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = String(item.id).toLowerCase();
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
        return true;
    }
    if (item.hasTag('c:two_handed') || item.hasTag('bettercombat:two_handed') || item.hasTag('skd:two_handed')) {
        return true;
    }
    return false;
}

function isOneHandedWeapon(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    if (isTwoHandedWeapon(item)) return false;
    let id = String(item.id).toLowerCase();
    return id.includes('sword') || id.includes('blade') || id.includes('dagger') ||
           id.includes('axe') || id.includes('katana') || id.includes('rapier') ||
           id.includes('mace') || id.includes('cutlass') || id.includes('saber') ||
           item.hasTag('minecraft:swords') || item.hasTag('minecraft:axes') ||
           item.hasTag('c:tools/swords') || item.hasTag('c:tools/axes');
}

function isAnyWeapon(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = String(item.id).toLowerCase();
    return isTwoHandedWeapon(item) || isOneHandedWeapon(item) ||
           id.includes('bow') || id.includes('crossbow') ||
           item.hasTag('c:tools/bows') || item.hasTag('c:tools/crossbows');
}

function isShield(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = String(item.id).toLowerCase();
    return item.hasTag('c:tools/shields') ||
           item.hasTag('c:shields') ||
           item.hasTag('forge:shields') ||
           item.hasTag('minecraft:shields') ||
           id.includes('shield');
}

function getWeaponBaseDamage(player) {
    let dmg = 6.0;
    try {
        let attr = player.attributes.getValue('minecraft:generic.attack_damage');
        if (attr && attr > 0) dmg = attr;
    } catch (e) {}

    let mainHand = player.mainHandItem;
    if (mainHand && !mainHand.isEmpty()) {
        let reinforce = 0;
        try {
            if (mainHand.nbt && mainHand.nbt.contains('skd_reinforce')) reinforce = mainHand.nbt.getInt('skd_reinforce');
            else if (mainHand.customData && mainHand.customData.contains('skd_reinforce')) reinforce = mainHand.customData.getInt('skd_reinforce');
        } catch (e) {}
        if (reinforce > 0) {
            dmg *= (1.0 + reinforce * 0.05);
        }
    }
    return Math.max(3.0, dmg);
}

function dealArtDamage(player, target, damage) {
    if (!target || !target.isLiving() || !target.isAlive() || target.isPlayer()) return false;
    try {
        target.attack(player, damage);
    } catch (e1) {
        try {
            target.attack(player.damageSources().playerAttack(player), damage);
        } catch (e2) {
            try {
                target.setHealth(Math.max(0, target.health - damage));
            } catch (e3) {}
        }
    }
    return true;
}

// ------------------------------------------------------------------------------
// RESOLVE ACTIVE WEAPON ART
// ------------------------------------------------------------------------------

function resolveWeaponArt(player, isAirborne) {
    let mainItem = player.mainHandItem;
    if (!mainItem || mainItem.isEmpty()) return null;

    let mainId = String(mainItem.id).toLowerCase();

    // 1. Explicitly stored art in weapon NBT / customData
    let explicitArt = null;
    try {
        if (mainItem.nbt && mainItem.nbt.contains('weapon_art')) {
            explicitArt = String(mainItem.nbt.getString('weapon_art')).toLowerCase();
        } else if (mainItem.customData && mainItem.customData.contains('weapon_art')) {
            explicitArt = String(mainItem.customData.getString('weapon_art')).toLowerCase();
        }
    } catch (e) {}

    // 2. Explicitly selected art in player profile
    if (!explicitArt) {
        let pSelected = player.persistentData.getString('skd_selected_weapon_art');
        if (pSelected && pSelected.length > 0) explicitArt = pSelected;
    }

    // 3. Jump + ПКМ: If jumping / airborne, trigger Ground Slam / Earth Sunder
    if (isAirborne) {
        if (explicitArt === 'seismic_slam' || mainId.includes('hammer') || mainId.includes('mace') || mainId.includes('club')) {
            return 'seismic_slam';
        }
        return 'earth_sunder';
    }

    // If explicit art was assigned and valid, return it
    if (explicitArt && WEAPON_ARTS[explicitArt]) {
        return explicitArt;
    }

    // 4. Smart Archetype Defaults based on weapon class
    if (mainId.includes('bow') || mainId.includes('crossbow')) {
        return 'arrow_barrage';
    }
    if (mainId.includes('hammer') || mainId.includes('mace') || mainId.includes('club')) {
        return 'seismic_slam';
    }
    if (mainId.includes('spear') || mainId.includes('lance') || mainId.includes('rapier') || mainId.includes('halberd') || mainId.includes('glaive')) {
        return 'lightning_thrust';
    }
    if (mainId.includes('dagger') || mainId.includes('knife') || mainId.includes('scythe') || mainId.includes('sickle')) {
        return player.isCrouching() ? 'blood_rend' : 'shadow_step';
    }
    if (isTwoHandedWeapon(mainItem)) {
        if (player.isCrouching()) return 'juggernaut_rush';
        return 'whirlwind_cleave';
    }
    if (player.isCrouching()) {
        return 'blood_rend';
    }

    return 'whirlwind_cleave';
}

// ------------------------------------------------------------------------------
// EXECUTION ENGINE FOR THE 8 MARTIAL ARTS
// ------------------------------------------------------------------------------

function executeWeaponArt(player, isAirborne) {
    if (!player || !player.isAlive()) return;

    let artId = resolveWeaponArt(player, isAirborne);
    if (!artId || !WEAPON_ARTS[artId]) {
        player.sendSystemMessage(Text.of('§7Возьмите в руку оружие для применения Боевого Искусства.'), true);
        return;
    }

    let art = WEAPON_ARTS[artId];
    let now = Date.now();
    let cdKey = 'skd_cd_' + artId;
    let cdEnd = player.persistentData.getLong(cdKey) || 0;

    // Check Cooldown
    if (now < cdEnd) {
        let leftSec = ((cdEnd - now) / 1000).toFixed(1);
        player.sendSystemMessage(Text.of(`§c⏳ Боевое искусство «${art.name}» перезаряжается: ${leftSec} сек`), true);
        player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ~ ~ ~ 0.6 1.8`);
        return;
    }

    // Set Cooldown
    player.persistentData.putLong(cdKey, now + art.cdMs);
    player.persistentData.putString('skd_active_cd_art', artId);
    player.persistentData.putLong('skd_active_cd_end', now + art.cdMs);

    let baseDmg = getWeaponBaseDamage(player);
    let level = player.level;
    let look = player.getLookAngle();
    let u = player.username;

    // --------------------------------------------------------------------------
    // 1. WHIRLWIND CLEAVE (360° sweep, 4.5b radius, 180% dmg, knockback)
    // --------------------------------------------------------------------------
    if (artId === 'whirlwind_cleave') {
        let radius = 4.5;
        let totalDmg = baseDmg * art.dmgMult;
        let aabb = AABB.of(player.x - radius, player.y - 1.5, player.z - radius, player.x + radius, player.y + 2.5, player.z + radius);
        let nearby = level.getEntitiesWithin(aabb);
        let hits = 0;

        nearby.forEach(ent => {
            if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive()) {
                let dx = ent.x - player.x;
                let dz = ent.z - player.z;
                let dist = Math.max(0.1, Math.sqrt(dx * dx + dz * dz));
                if (dist <= radius) {
                    dealArtDamage(player, ent, totalDmg);
                    ent.knockback(0.85, -dx / dist, -dz / dist);
                    hits++;
                }
            }
        });

        player.server.runCommandSilent(`playsound minecraft:entity.player.attack.sweep player ${u} ${player.x} ${player.y} ${player.z} 1.5 0.8`);
        player.server.runCommandSilent(`particle minecraft:sweep_attack ${player.x} ${player.y + 1} ${player.z} 1.6 0.2 1.6 0.1 22 normal`);
        player.server.runCommandSilent(`particle minecraft:crit ${player.x} ${player.y + 1} ${player.z} 1.2 0.4 1.2 0.15 25 normal`);
        player.server.runCommandSilent(`particle minecraft:wax_off ${player.x} ${player.y + 1} ${player.z} 1.4 0.3 1.4 0.08 16 normal`);
        player.sendSystemMessage(Text.of(`§6🌪 ВИХРЕВОЙ РАЗМАХ! §fУрон: §e${Math.round(totalDmg)} §7(×1.8) | Врагов: §a${hits}`), true);

    // --------------------------------------------------------------------------
    // 2. EARTH SUNDER (6-block linear shockwave, knocks mobs into air, 200% dmg)
    // --------------------------------------------------------------------------
    } else if (artId === 'earth_sunder') {
        let totalDmg = baseDmg * art.dmgMult;
        let hitEntities = new Set();
        let hits = 0;

        let hLen = Math.max(0.01, Math.sqrt(look.x * look.x + look.z * look.z));
        let normX = look.x / hLen;
        let normZ = look.z / hLen;

        for (let i = 1; i <= 6; i++) {
            let sx = player.x + normX * i;
            let sy = player.y;
            let sz = player.z + normZ * i;

            player.server.runCommandSilent(`particle minecraft:block minecraft:dirt ${sx} ${sy + 0.2} ${sz} 0.3 0.4 0.3 0.15 15 normal`);
            player.server.runCommandSilent(`particle minecraft:large_smoke ${sx} ${sy + 0.3} ${sz} 0.2 0.3 0.2 0.05 4 normal`);
            player.server.runCommandSilent(`particle minecraft:explosion ${sx} ${sy + 0.1} ${sz} 0.1 0.1 0.1 0 1 normal`);

            let stepBox = AABB.of(sx - 1.5, sy - 1.0, sz - 1.5, sx + 1.5, sy + 2.5, sz + 1.5);
            let ents = level.getEntitiesWithin(stepBox);
            ents.forEach(ent => {
                if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive() && !hitEntities.has(ent.id)) {
                    hitEntities.add(ent.id);
                    dealArtDamage(player, ent, totalDmg);
                    ent.knockback(0.4, -normX, -normZ);
                    ent.setDeltaMovement(normX * 0.15, 0.75, normZ * 0.15);
                    ent.hasImpulse = true;
                    hits++;
                }
            });
        }

        player.server.runCommandSilent(`playsound minecraft:entity.generic.explode player ${u} ${player.x} ${player.y} ${player.z} 1.0 1.2`);
        player.server.runCommandSilent(`playsound minecraft:block.stone.break player ${u} ${player.x} ${player.y} ${player.z} 1.2 0.7`);
        player.sendSystemMessage(Text.of(`§e⚡ РАССЕЧЕНИЕ ЗЕМЛИ! §fУрон: §e${Math.round(totalDmg)} §7(×2.0) | Подброшено: §a${hits}`), true);

    // --------------------------------------------------------------------------
    // 3. JUGGERNAUT RUSH (7-block forward charge, Resistance 40%, knocks aside)
    // --------------------------------------------------------------------------
    } else if (artId === 'juggernaut_rush') {
        let totalDmg = baseDmg * art.dmgMult;
        let hLen = Math.max(0.01, Math.sqrt(look.x * look.x + look.z * look.z));
        let normX = look.x / hLen;
        let normZ = look.z / hLen;

        // Buff: Resistance II (40% damage reduction) for 80 ticks (4 seconds)
        player.potionEffects.add('minecraft:resistance', 80, 1, false, true);
        player.potionEffects.add('minecraft:speed', 30, 2, false, false);

        // Impulse forward
        player.setDeltaMovement(normX * 1.55, 0.18, normZ * 1.55);
        player.hasImpulse = true;

        let hitEntities = new Set();
        let hits = 0;
        for (let i = 1; i <= 7; i++) {
            let cx = player.x + normX * i;
            let cy = player.y;
            let cz = player.z + normZ * i;

            let cBox = AABB.of(cx - 1.8, cy - 1.0, cz - 1.8, cx + 1.8, cy + 2.5, cz + 1.8);
            let ents = level.getEntitiesWithin(cBox);
            ents.forEach(ent => {
                if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive() && !hitEntities.has(ent.id)) {
                    hitEntities.add(ent.id);
                    dealArtDamage(player, ent, totalDmg);
                    // Knock enemies aside (perpendicular vector)
                    ent.knockback(0.9, normZ, -normX);
                    hits++;
                }
            });
        }

        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${u} ${player.x} ${player.y} ${player.z} 1.2 0.8`);
        player.server.runCommandSilent(`playsound minecraft:entity.ravager.roar player ${u} ${player.x} ${player.y} ${player.z} 1.0 1.2`);
        player.server.runCommandSilent(`particle minecraft:cloud ${player.x} ${player.y + 0.8} ${player.z} 1.0 0.4 1.0 0.1 25 normal`);
        player.server.runCommandSilent(`particle minecraft:explosion ${player.x} ${player.y + 0.5} ${player.z} 0.5 0.5 0.5 0 2 normal`);
        player.sendSystemMessage(Text.of(`§c🛡 НЕУМОЛИМЫЙ НАТИСК! §fСопротивление 40% | Раскинуто врагов: §a${hits}`), true);

    // --------------------------------------------------------------------------
    // 4. LIGHTNING THRUST (Instant dash 6 blocks through targets, Bleed, 190% dmg)
    // --------------------------------------------------------------------------
    } else if (artId === 'lightning_thrust') {
        let totalDmg = baseDmg * art.dmgMult;
        let hLen = Math.max(0.01, Math.sqrt(look.x * look.x + look.z * look.z));
        let normX = look.x / hLen;
        let normZ = look.z / hLen;

        let startX = player.x;
        let startY = player.y;
        let startZ = player.z;

        let targetX = startX + normX * 6.0;
        let targetY = startY;
        let targetZ = startZ + normZ * 6.0;

        // Teleport forward through enemies
        player.teleportTo(player.level.dimension, targetX, targetY, targetZ, player.yaw, player.pitch);

        let corridor = AABB.of(
            Math.min(startX, targetX) - 1.6, startY - 1.0, Math.min(startZ, targetZ) - 1.6,
            Math.max(startX, targetX) + 1.6, startY + 2.5, Math.max(startZ, targetZ) + 1.6
        );
        let ents = level.getEntitiesWithin(corridor);
        let hits = 0;

        ents.forEach(ent => {
            if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive()) {
                dealArtDamage(player, ent, totalDmg);
                // Bleed / Wither for 3 seconds (60 ticks)
                ent.potionEffects.add('minecraft:wither', 60, 1, false, true);
                try { ent.potionEffects.add('attributeslib:bleeding', 60, 1, false, true); } catch (e) {}
                hits++;
            }
        });

        player.server.runCommandSilent(`playsound minecraft:entity.lightning_bolt.thunder player ${u} ${targetX} ${targetY} ${targetZ} 1.0 1.8`);
        player.server.runCommandSilent(`playsound minecraft:entity.player.attack.crit player ${u} ${targetX} ${targetY} ${targetZ} 1.2 1.3`);
        player.server.runCommandSilent(`particle minecraft:electric_spark ${targetX} ${targetY + 1} ${targetZ} 1.2 0.8 1.2 0.2 35 normal`);
        player.server.runCommandSilent(`particle minecraft:sweep_attack ${targetX} ${targetY + 1} ${targetZ} 1.0 0.3 1.0 0.1 15 normal`);
        player.server.runCommandSilent(`particle minecraft:flash ${targetX} ${targetY + 1} ${targetZ} 0.1 0.1 0.1 0 1 normal`);
        player.sendSystemMessage(Text.of(`§b⚡ МОЛНИЕНОСНЫЙ ВЫПАД! §fУрон: §e${Math.round(totalDmg)} §7(×1.9) + Кровотечение | Поражено: §a${hits}`), true);

    // --------------------------------------------------------------------------
    // 5. BLOOD REND (Crescent slash, 10% lifesteal, 170% dmg)
    // --------------------------------------------------------------------------
    } else if (artId === 'blood_rend') {
        let totalDmg = baseDmg * art.dmgMult;
        let radius = 4.0;
        let aabb = AABB.of(player.x - radius, player.y - 1.5, player.z - radius, player.x + radius, player.y + 2.5, player.z + radius);
        let ents = level.getEntitiesWithin(aabb);
        let totalDealt = 0;
        let hits = 0;

        ents.forEach(ent => {
            if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive()) {
                let dx = ent.x - player.x;
                let dz = ent.z - player.z;
                let dist = Math.max(0.01, Math.sqrt(dx * dx + dz * dz));
                if (dist <= radius) {
                    let dot = (dx * look.x + dz * look.z) / dist;
                    if (dot > 0.25) { // ~150° frontal crescent arc
                        dealArtDamage(player, ent, totalDmg);
                        totalDealt += totalDmg;
                        hits++;
                    }
                }
            }
        });

        // 10% Lifesteal
        let healAmount = totalDealt * 0.10;
        if (healAmount > 0) {
            player.heal(healAmount);
        }

        player.server.runCommandSilent(`playsound minecraft:entity.wither.shoot player ${u} ${player.x} ${player.y} ${player.z} 1.0 1.6`);
        player.server.runCommandSilent(`playsound minecraft:entity.player.attack.strong player ${u} ${player.x} ${player.y} ${player.z} 1.2 0.9`);
        player.server.runCommandSilent(`particle minecraft:dust 0.85 0.05 0.05 1.5 ${player.x + look.x * 1.5} ${player.y + 1} ${player.z + look.z * 1.5} 0.8 0.4 0.8 0.1 30 normal`);
        player.server.runCommandSilent(`particle minecraft:crimson_spore ${player.x + look.x * 1.5} ${player.y + 1} ${player.z + look.z * 1.5} 0.6 0.3 0.6 0.1 20 normal`);
        player.server.runCommandSilent(`particle minecraft:soul_fire_flame ${player.x + look.x * 1.5} ${player.y + 1} ${player.z + look.z * 1.5} 0.5 0.2 0.5 0.05 10 normal`);
        player.sendSystemMessage(Text.of(`§4🩸 КРОВАВЫЙ РОСЧЕРК! §fУрон: §e${Math.round(totalDmg)} §7| Исцеление: §a+${healAmount.toFixed(1)} HP §7(10%) | Целей: §c${hits}`), true);

    // --------------------------------------------------------------------------
    // 6. SEISMIC SLAM (Heavy leap & slam in 4b radius, Slowness IV stun 2.5s, 220% dmg)
    // --------------------------------------------------------------------------
    } else if (artId === 'seismic_slam') {
        let totalDmg = baseDmg * art.dmgMult;
        let radius = 4.0;

        // Leap impulse if on ground
        let isAirborneCheck = (typeof player.onGround === 'function' ? !player.onGround() : !player.onGround);
        if (!isAirborneCheck) {
            player.setDeltaMovement(look.x * 0.2, 0.45, look.z * 0.2);
            player.hasImpulse = true;
        }

        let aabb = AABB.of(player.x - radius, player.y - 2.0, player.z - radius, player.x + radius, player.y + 2.5, player.z + radius);
        let ents = level.getEntitiesWithin(aabb);
        let hits = 0;

        ents.forEach(ent => {
            if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive()) {
                let dx = ent.x - player.x;
                let dz = ent.z - player.z;
                let dist = Math.max(0.1, Math.sqrt(dx * dx + dz * dz));
                if (dist <= radius) {
                    dealArtDamage(player, ent, totalDmg);
                    // Slowness IV (stun) for 2.5s (50 ticks)
                    ent.potionEffects.add('minecraft:slowness', 50, 3, false, true);
                    ent.knockback(0.7, -dx / dist, -dz / dist);
                    hits++;
                }
            }
        });

        player.server.runCommandSilent(`playsound minecraft:block.anvil.land player ${u} ${player.x} ${player.y} ${player.z} 1.5 0.8`);
        player.server.runCommandSilent(`playsound minecraft:entity.iron_golem.attack player ${u} ${player.x} ${player.y} ${player.z} 1.2 0.7`);
        player.server.runCommandSilent(`particle minecraft:explosion ${player.x} ${player.y + 0.3} ${player.z} 0.8 0.3 0.8 0 3 normal`);
        player.server.runCommandSilent(`particle minecraft:large_smoke ${player.x} ${player.y + 0.4} ${player.z} 1.2 0.3 1.2 0.08 25 normal`);
        player.server.runCommandSilent(`particle minecraft:block minecraft:stone ${player.x} ${player.y + 0.2} ${player.z} 1.5 0.5 1.5 0.2 30 normal`);
        player.sendSystemMessage(Text.of(`§8🔨 СЕЙСМИЧЕСКИЙ УДАР! §fУрон: §e${Math.round(totalDmg)} §7(×2.2) | Оглушено врагов (2.5с): §a${hits}`), true);

    // --------------------------------------------------------------------------
    // 7. SHADOW STEP (Blink behind target 6b, Invisibility 1.5s, 100% Crit next strike)
    // --------------------------------------------------------------------------
    } else if (artId === 'shadow_step') {
        let maxRange = 6.0;
        let searchBox = AABB.of(player.x - maxRange, player.y - 2, player.z - maxRange, player.x + maxRange, player.y + 3, player.z + maxRange);
        let nearby = level.getEntitiesWithin(searchBox);
        let bestTarget = null;
        let bestDot = 0.5;

        nearby.forEach(ent => {
            if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive()) {
                let dx = ent.x - player.x;
                let dz = ent.z - player.z;
                let dist = Math.max(0.1, Math.sqrt(dx * dx + dz * dz));
                if (dist <= maxRange) {
                    let dot = (dx * look.x + dz * look.z) / dist;
                    if (dot > bestDot) {
                        bestDot = dot;
                        bestTarget = ent;
                    }
                }
            }
        });

        let targetX, targetY, targetZ;
        if (bestTarget) {
            let tLook = bestTarget.getLookAngle();
            targetX = bestTarget.x - tLook.x * 1.5;
            targetY = bestTarget.y;
            targetZ = bestTarget.z - tLook.z * 1.5;
            player.teleportTo(player.level.dimension, targetX, targetY, targetZ, bestTarget.yaw, player.pitch);
        } else {
            targetX = player.x + look.x * maxRange;
            targetY = player.y;
            targetZ = player.z + look.z * maxRange;
            player.teleportTo(player.level.dimension, targetX, targetY, targetZ, player.yaw, player.pitch);
        }

        // Invisibility for 1.5s (30 ticks)
        player.potionEffects.add('minecraft:invisibility', 30, 0, false, false);
        player.potionEffects.add('minecraft:speed', 40, 1, false, false);

        // Next strike within 3s is 100% guaranteed Critical Hit
        player.persistentData.putLong('skd_shadow_step_crit_until', now + 3000);

        player.server.runCommandSilent(`playsound minecraft:entity.enderman.teleport player ${u} ${targetX} ${targetY} ${targetZ} 1.2 1.1`);
        player.server.runCommandSilent(`particle minecraft:portal ${targetX} ${targetY + 1} ${targetZ} 0.6 0.8 0.6 0.1 40 normal`);
        player.server.runCommandSilent(`particle minecraft:smoke ${targetX} ${targetY + 1} ${targetZ} 0.5 0.5 0.5 0.05 20 normal`);
        player.server.runCommandSilent(`particle minecraft:reverse_portal ${targetX} ${targetY + 1} ${targetZ} 0.4 0.6 0.4 0.1 25 normal`);
        player.sendSystemMessage(Text.of('§5🌑 ТЕНЕВОЙ ШАГ! §d(Невидимость 1.5с + 100% Крит на следующий удар в течение 3с)'), true);

    // --------------------------------------------------------------------------
    // 8. ARROW BARRAGE (Spread of 5 spectral arrows forward in an arc)
    // --------------------------------------------------------------------------
    } else if (artId === 'arrow_barrage') {
        let angles = [-20, -10, 0, 10, 20];
        let speed = 2.4;

        angles.forEach(deg => {
            let yawRad = (player.yaw + deg) * Math.PI / 180.0;
            let pitchRad = player.pitch * Math.PI / 180.0;
            let vx = -Math.sin(yawRad) * Math.cos(pitchRad) * speed;
            let vy = -Math.sin(pitchRad) * speed;
            let vz = Math.cos(yawRad) * Math.cos(pitchRad) * speed;

            let sx = player.x - Math.sin(yawRad) * 0.4;
            let sy = player.y + player.eyeHeight - 0.1;
            let sz = player.z + Math.cos(yawRad) * 0.4;

            try {
                let arrow = level.createEntity('minecraft:spectral_arrow');
                if (arrow) {
                    arrow.setPos(sx, sy, sz);
                    arrow.setDeltaMovement(vx, vy, vz);
                    try { arrow.setOwner(player); } catch (e) {}
                    try { arrow.pickup = 0; } catch (e) {}
                    arrow.spawn();
                    return;
                }
            } catch (e) {}

            player.server.runCommandSilent(`execute at ${u} run summon minecraft:spectral_arrow ${sx.toFixed(2)} ${sy.toFixed(2)} ${sz.toFixed(2)} {Motion:[${vx.toFixed(3)},${vy.toFixed(3)},${vz.toFixed(3)}],pickup:0b}`);
        });

        player.server.runCommandSilent(`playsound minecraft:entity.arrow.shoot player ${u} ${player.x} ${player.y} ${player.z} 1.2 0.8`);
        player.server.runCommandSilent(`particle minecraft:crit ${player.x + look.x} ${player.y + 1.2} ${player.z + look.z} 0.5 0.5 0.5 0.1 20 normal`);
        player.server.runCommandSilent(`particle minecraft:enchanted_hit ${player.x + look.x} ${player.y + 1.2} ${player.z + look.z} 0.4 0.4 0.4 0.1 15 normal`);
        player.sendSystemMessage(Text.of('§a🏹 ЗАЛП СТРЕЛ! §fВыпущено 5 спектральных стрел веером'), true);
    }
}

// ------------------------------------------------------------------------------
// EVENT 1: COMBAT INTERACTIONS (GUARD COUNTER & SHADOW CRIT)
// ------------------------------------------------------------------------------

EntityEvents.beforeHurt(event => {
    let source = event.source;
    if (!source) return;

    let victim = event.entity;
    let attacker = source.actual || source.player;

    // A. GUARD COUNTER SETUP: Player blocks incoming hit with shield
    if (victim && victim.isPlayer() && victim.isAlive() && victim.isBlocking()) {
        let offHand = victim.offHandItem;
        let mainHand = victim.mainHandItem;
        let hasShieldEquipped = (offHand && isShield(offHand)) || (mainHand && isShield(mainHand));

        if (hasShieldEquipped) {
            let now = Date.now();
            victim.persistentData.putLong('skd_guard_counter_window', now + 1500);
            if (attacker) {
                victim.persistentData.putInt('skd_guard_counter_target_id', attacker.id);
            }

            victim.server.runCommandSilent(`playsound minecraft:block.amethyst_block.hit player ${victim.username} ~ ~ ~ 1.2 1.6`);
            victim.server.runCommandSilent(`particle minecraft:electric_spark ${victim.x} ${victim.y + 1} ${victim.z} 0.4 0.4 0.4 0.1 12 normal`);
            victim.sendSystemMessage(Text.of('§e⚡ СТОЙКА КОНТРУДАРА! §f[Нажмите ЛКМ в течение 1.5с для контратаки +150%]'), true);
        }
    }

    // B. PLAYER ATTACKS AN ENEMY
    if (attacker && attacker.isPlayer() && attacker.isAlive() && victim && victim.isAlive() && !victim.isPlayer()) {
        let now = Date.now();

        // 1. Guard Counter Execution: Left click within 1.5s of blocking
        let counterUntil = attacker.persistentData.getLong('skd_guard_counter_window') || 0;
        if (counterUntil > 0 && now <= counterUntil) {
            attacker.persistentData.remove('skd_guard_counter_window');
            attacker.persistentData.remove('skd_guard_counter_target_id');

            // +150% damage bonus
            event.damage *= 2.5;

            // Stun & weaken attacker
            victim.potionEffects.add('minecraft:slowness', 60, 3, false, true);
            victim.potionEffects.add('minecraft:weakness', 60, 1, false, true);
            victim.potionEffects.add('minecraft:mining_fatigue', 60, 1, false, true);

            attacker.server.runCommandSilent(`playsound minecraft:entity.player.attack.crit player ${attacker.username} ~ ~ ~ 1.5 1.1`);
            attacker.server.runCommandSilent(`playsound minecraft:item.shield.block player ${attacker.username} ~ ~ ~ 1.4 1.6`);
            attacker.server.runCommandSilent(`particle minecraft:flash ${victim.x} ${victim.y + 1} ${victim.z} 0.1 0.1 0.1 0 1 normal`);
            attacker.server.runCommandSilent(`particle minecraft:crit ${victim.x} ${victim.y + 1} ${victim.z} 0.8 0.8 0.8 0.25 30 normal`);
            attacker.sendSystemMessage(Text.of('§6⚔ ГВАРДЕЙСКИЙ КОНТРУДАР! §f(+150% Урона, Оглушение врага на 3с)'), true);
        }

        // 2. Shadow Step Critical Strike: Next strike within 3s is 100% Crit
        let critUntil = attacker.persistentData.getLong('skd_shadow_step_crit_until') || 0;
        if (critUntil > 0 && now <= critUntil) {
            attacker.persistentData.remove('skd_shadow_step_crit_until');

            event.damage *= 2.0;

            attacker.server.runCommandSilent(`playsound minecraft:entity.player.attack.crit player ${attacker.username} ~ ~ ~ 1.5 1.2`);
            attacker.server.runCommandSilent(`particle minecraft:crit ${victim.x} ${victim.y + 1} ${victim.z} 0.6 0.6 0.6 0.2 25 normal`);
            attacker.server.runCommandSilent(`particle minecraft:enchanted_hit ${victim.x} ${victim.y + 1} ${victim.z} 0.5 0.5 0.5 0.1 20 normal`);
            attacker.sendSystemMessage(Text.of('§5🌑 УДАР ИЗ ТЕНИ! §d(100% Гарантированный Крит ×2.0)'), true);
        }
    }
});

// ------------------------------------------------------------------------------
// EVENT 2: RIGHT-CLICK TRIGGER CONTROLS (ПКМ)
// ------------------------------------------------------------------------------

ItemEvents.rightClicked(event => {
    let player = event.player;
    if (!player || !player.isAlive()) return;

    let item = event.item;
    if (!item || item.isEmpty()) return;

    if (event.hand && String(event.hand).toUpperCase().includes('OFF')) return;

    let mainHand = player.mainHandItem;
    if (!mainHand || mainHand.isEmpty()) return;

    // Check if player is aiming at Infernal Anvil: allow block interaction instead of weapon art
    let hit = event.target || (player.rayTrace ? player.rayTrace(5.0) : null);
    if (hit && hit.block && String(hit.block.id) === 'kubejs:infernal_anvil') {
        return;
    }

    let currentAge = (typeof player.age === 'number') ? player.age : (typeof player.tickCount === 'number' ? player.tickCount : 0);
    if (player.persistentData.getInt('skd_last_art_tick') === currentAge) return;

    let offHand = player.offHandItem;
    let offEmpty = (!offHand || offHand.isEmpty() || offHand.id === 'minecraft:air');

    let isAirborne = (typeof player.onGround === 'function' ? !player.onGround() : !player.onGround) || player.fallDistance > 0.05;

    // Case 1: Two-Handed Weapons (Offhand is empty) -> Right-Click triggers Art, Jump+ПКМ triggers Slam/Sunder
    if (isTwoHandedWeapon(mainHand)) {
        if (offEmpty) {
            player.persistentData.putInt('skd_last_art_tick', currentAge);
            executeWeaponArt(player, isAirborne);
        }
        return;
    }

    // Case 2: One-Handed Weapons (Offhand is empty) -> Right-Click triggers Art
    if (isOneHandedWeapon(mainHand) && offEmpty) {
        player.persistentData.putInt('skd_last_art_tick', currentAge);
        executeWeaponArt(player, isAirborne);
        return;
    }

    // Case 3: Sneak + Right-Click with shield or weapon (Alternative instant trigger for shield users)
    if (isAnyWeapon(mainHand) && player.isCrouching()) {
        player.persistentData.putInt('skd_last_art_tick', currentAge);
        executeWeaponArt(player, isAirborne);
        return;
    }
});

// ------------------------------------------------------------------------------
// EVENT 3: COOLDOWN READINESS ACTIONBAR MONITOR (Tick Check)
// ------------------------------------------------------------------------------

PlayerEvents.tick(event => {
    let player = event.player;
    if (!player) return;
    let pAge = (typeof player.age === 'number') ? player.age : (typeof player.tickCount === 'number' ? player.tickCount : 0);
    if (pAge % 10 !== 0) return;

    let cdEnd = player.persistentData.getLong('skd_active_cd_end') || 0;
    if (cdEnd > 0 && Date.now() >= cdEnd) {
        let artId = player.persistentData.getString('skd_active_cd_art');
        let art = WEAPON_ARTS[artId];
        let artName = art ? art.name : artId;

        player.persistentData.remove('skd_active_cd_end');
        player.persistentData.remove('skd_active_cd_art');

        player.server.runCommandSilent(`playsound minecraft:block.note_block.chime player ${player.username} ~ ~ ~ 1.0 1.6`);
        player.sendSystemMessage(Text.of(`§a⚔ Боевое искусство «${artName}»: ГОТОВО К БОЮ! §7[ПКМ]`), true);
    }
});

// ------------------------------------------------------------------------------
// EVENT 4: COMMANDS & CHAT SHORTCUTS (.art, /art)
// ------------------------------------------------------------------------------

function printArtsList(player) {
    player.tell('§6═══════════════════════════════════════════════════');
    player.tell('§e⚔ ТАКТИЧЕСКИЕ БОЕВЫЕ ИСКУССТВА ЭЛИРИУМА (8 ПРИЕМОВ)');
    player.tell('§6═══════════════════════════════════════════════════');
    Object.keys(WEAPON_ARTS).forEach(k => {
        let a = WEAPON_ARTS[k];
        player.tell(`§6[${a.num}] §e${a.name} §7(${a.enName}) §8| §fУрон: §c${Math.round(a.dmgMult * 100)}% §8| §7Откат: §b${a.cdMs / 1000}с`);
        player.tell(`    §8└─ §7${a.desc}`);
    });
    player.tell('§7• Выбор умения: §f.art <1-8> §7или §f/art select <имя>');
    player.tell('§7• Активация: §eПКМ §7(без щита), §eПрыжок + ПКМ §7(Удар о землю), §eЛКМ §7из блока (Контрудар).');
    player.tell('§6═══════════════════════════════════════════════════');
}

ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event;

    event.register(
        Commands.literal('art')
            .executes(ctx => {
                let p = ctx.source.player;
                if (p) executeWeaponArt(p, false);
                return 1;
            })
            .then(Commands.literal('list').executes(ctx => {
                let p = ctx.source.player;
                if (p) printArtsList(p);
                return 1;
            }))
            .then(Commands.literal('help').executes(ctx => {
                let p = ctx.source.player;
                if (p) printArtsList(p);
                return 1;
            }))
            .then(Commands.literal('select')
                .then(Commands.argument('name', Arguments.STRING.create(event))
                    .executes(ctx => {
                        let p = ctx.source.player;
                        let arg = ctx.getArgument('name', java('java.lang.String')).toLowerCase();
                        let targetArt = null;

                        Object.keys(WEAPON_ARTS).forEach(k => {
                            let a = WEAPON_ARTS[k];
                            if (k === arg || String(a.num) === arg || a.enName.toLowerCase().includes(arg) || a.name.toLowerCase().includes(arg)) {
                                targetArt = k;
                            }
                        });

                        if (targetArt) {
                            p.persistentData.putString('skd_selected_weapon_art', targetArt);
                            let a = WEAPON_ARTS[targetArt];
                            p.sendSystemMessage(Text.of(`§a⚔ Выбрано Боевое Искусство: §e«${a.name}» §7(${a.enName})`), true);
                            p.server.runCommandSilent(`playsound minecraft:block.smithing_table.use player ${p.username} ~ ~ ~ 1.0 1.2`);
                        } else {
                            p.tell(`§cНеизвестное боевое искусство: "${arg}". Напишите §f/art list §cдля списка.`);
                        }
                        return 1;
                    })
                )
            )
    );

    event.register(
        Commands.literal('weapon_art')
            .executes(ctx => {
                let p = ctx.source.player;
                if (p) executeWeaponArt(p, false);
                return 1;
            })
    );
});

// Chat commands (.art, !art)
PlayerEvents.chat(event => {
    let msg = event.message.trim().toLowerCase();
    let player = event.player;
    if (!player) return;

    if (msg === '.art' || msg === '!art') {
        executeWeaponArt(player, false);
        event.cancel();
    } else if (msg === '.art list' || msg === '!art list' || msg === '.art help') {
        printArtsList(player);
        event.cancel();
    } else if (msg.startsWith('.art ') || msg.startsWith('!art ')) {
        let param = msg.substring(5).trim();
        let targetArt = null;

        Object.keys(WEAPON_ARTS).forEach(k => {
            let a = WEAPON_ARTS[k];
            if (k === param || String(a.num) === param || a.enName.toLowerCase().includes(param) || a.name.toLowerCase().includes(param)) {
                targetArt = k;
            }
        });

        if (targetArt) {
            player.persistentData.putString('skd_selected_weapon_art', targetArt);
            let a = WEAPON_ARTS[targetArt];
            player.sendSystemMessage(Text.of(`§a⚔ Выбрано Боевое Искусство: §e«${a.name}» §7(${a.enName})`), true);
            player.server.runCommandSilent(`playsound minecraft:block.smithing_table.use player ${player.username} ~ ~ ~ 1.0 1.2`);
        } else {
            player.tell(`§cНеизвестное боевое искусство: "${param}". Напишите §f.art list §cдля просмотра.`);
        }
        event.cancel();
    }
});
