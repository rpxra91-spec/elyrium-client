// ==============================================================================
// ⚔️ ELYRIUM RPG: PHYSICAL WEAPON ARTS & GUARD COUNTER ENGINE
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// Architecture & Mechanics Specification:
// 1. Two-Tier Weapon Arts System:
//    - Innate Archetype Skill (Right-Click / ПКМ):
//      * Swords / Broadswords: Parry & Counter (0.8s window, 100% block, stun, x2.0 counter).
//      * Greatswords / Claymores: Seismic Cleave (360° sweep, 4.5b radius, 180% dmg, knockback).
//      * Katanas: Phantom Thrust / Iai Slash (6-block forward dash through enemies, 190% dmg, bleed).
//      * Battleaxes: Shield Breaker / Sunder (crushes shields, ignores 50% armor, stuns 1.5s).
//      * Warhammers: Tectonic Rupture (ground slam, 5m radial shockwave, knocks into air, Slowness IV).
//      * Polearms / Spears: Armor-Piercing Thrust (5.5-block thrust, 100% armor bypass).
//      * Daggers / Rapiers: Shadow Step (instant blink behind nearest enemy within 5b, 1s stealth, 100% crit).
//      * Bows / Crossbows: Fan Barrage (5 spectral arrows in a cone forward).
//    - Extra Runic Slot (Shift + Right-Click / Shift+ПКМ):
//      * Reads 'elyrium_inscribed_art' NBT tag from weapon (e.g. Flame Vortex, Frost Stomp, Lightning Smite, Blood Harvest, Holy Blade).
// 2. Resource Engine: SimpleStats Stamina (Agility + Vitality scaling) + Cooldown tracking + Actionbar feedback.
// 3. One-Handed Shield Guard Counter: Blocking incoming hit + Left Click within 1.5s window -> Guard Counter (+150% dmg, stun).
// ==============================================================================

const WEAPON_ARTS = {
    // --------------------------------------------------------------------------
    // INNATE ARCHETYPE ARTS
    // --------------------------------------------------------------------------
    parry_counter: {
        id: 'parry_counter',
        num: 1,
        name: 'Парирующий Клинок',
        enName: 'Parry & Counter',
        cdMs: 8000,
        stamina: 25,
        dmgMult: 2.0,
        desc: 'Стойка парирования на 0.8с: блокирует 100% урона, оглушает врага и проводит контрудар x2.0.'
    },
    seismic_cleave: {
        id: 'seismic_cleave',
        num: 2,
        name: 'Сейсмический Клив',
        enName: 'Seismic Cleave',
        cdMs: 12000,
        stamina: 40,
        dmgMult: 1.8,
        desc: 'Круговой замах на 360° в радиусе 4.5б с каменной волной, наносит 180% урона и отбрасывает врагов.'
    },
    iai_slash: {
        id: 'iai_slash',
        num: 3,
        name: 'Фантомный Выпад (Иайдзюцу)',
        enName: 'Phantom Thrust / Iai Slash',
        cdMs: 10000,
        stamina: 30,
        dmgMult: 1.9,
        desc: 'Мгновенный рывок вперед на 6 блоков сквозь врагов: 190% урона и кровотечение на 5с.'
    },
    shield_breaker: {
        id: 'shield_breaker',
        num: 4,
        name: 'Сокрушитель Защиты',
        enName: 'Shield Breaker / Sunder',
        cdMs: 11000,
        stamina: 35,
        dmgMult: 1.85,
        desc: 'Тяжелый нисходящий удар: сбивает щиты, игнорирует 50% брони и оглушает на 1.5с.'
    },
    tectonic_rupture: {
        id: 'tectonic_rupture',
        num: 5,
        name: 'Разлом Тектоники',
        enName: 'Tectonic Rupture',
        cdMs: 14000,
        stamina: 45,
        dmgMult: 2.1,
        desc: 'Удар о землю с 5-метровой радиальной волной: подбрасывает врагов в воздух и накладывает Замедление IV.'
    },
    piercing_thrust: {
        id: 'piercing_thrust',
        num: 6,
        name: 'Бронебойный Прокол',
        enName: 'Armor-Piercing Thrust',
        cdMs: 9000,
        stamina: 25,
        dmgMult: 1.75,
        desc: 'Колющий выпад на 5.5 блоков со 100% пробитием плотной брони и отталкиванием.'
    },
    shadow_step: {
        id: 'shadow_step',
        num: 7,
        name: 'Теневой Шаг',
        enName: 'Shadow Step',
        cdMs: 8000,
        stamina: 20,
        dmgMult: 2.0,
        desc: 'Мгновенное смещение за спину цели (до 5б), скрытность на 1с и гарантированный 100% крит.'
    },
    fan_barrage: {
        id: 'fan_barrage',
        num: 8,
        name: 'Веерный Залп',
        enName: 'Fan Barrage',
        cdMs: 10000,
        stamina: 30,
        dmgMult: 1.6,
        desc: 'Выпуск веера из 5 спектральных стрел по конусу перед собой.'
    },

    // --------------------------------------------------------------------------
    // EXTRA RUNIC SLOT ARTS (Inscribed via Ancient / Infernal Anvil)
    // --------------------------------------------------------------------------
    flame_vortex: {
        id: 'flame_vortex',
        num: 9,
        name: 'Пламенный Вихрь',
        enName: 'Flame Vortex',
        cdMs: 12000,
        stamina: 35,
        dmgMult: 1.8,
        desc: 'Огненный шторм вокруг игрока на 4.5 блока: поджигает врагов на 6с и наносит огненный урон.'
    },
    frost_stomp: {
        id: 'frost_stomp',
        num: 10,
        name: 'Ледяная Поступь',
        enName: 'Frost Stomp',
        cdMs: 11000,
        stamina: 30,
        dmgMult: 1.7,
        desc: 'Ледяной удар по земле: шипы льда в радиусе 5б, глубокая заморозка и замедление IV.'
    },
    lightning_smite: {
        id: 'lightning_smite',
        num: 11,
        name: 'Громовой Раскат',
        enName: 'Lightning Smite',
        cdMs: 14000,
        stamina: 40,
        dmgMult: 2.2,
        desc: 'Низвержение молнии в точку удара: 220% урона молнией и оглушающий шок.'
    },
    blood_harvest: {
        id: 'blood_harvest',
        num: 12,
        name: 'Кровавая Жатва',
        enName: 'Blood Harvest',
        cdMs: 12000,
        stamina: 35,
        dmgMult: 1.6,
        desc: 'Серповидный удар с вампиризмом: исцеляет заклинателя на 15% от нанесенного урона.'
    },
    holy_blade: {
        id: 'holy_blade',
        num: 13,
        name: 'Священный Клинок',
        enName: 'Holy Blade',
        cdMs: 13000,
        stamina: 35,
        dmgMult: 2.0,
        desc: 'Луч святой энергии: 200% урона (+50% по нежити/демонам) и Регенерация II на 4с.'
    },

    // --------------------------------------------------------------------------
    // BACKWARDS COMPATIBILITY ALIASES
    // --------------------------------------------------------------------------
    whirlwind_cleave: { id: 'seismic_cleave', num: 2, name: 'Сейсмический Клив', enName: 'Seismic Cleave', cdMs: 12000, stamina: 40, dmgMult: 1.8, desc: 'Круговой замах на 360° в радиусе 4.5б.' },
    earth_sunder: { id: 'tectonic_rupture', num: 5, name: 'Разлом Тектоники', enName: 'Tectonic Rupture', cdMs: 14000, stamina: 45, dmgMult: 2.1, desc: 'Удар о землю с 5-метровой радиальной волной.' },
    juggernaut_rush: { id: 'juggernaut_rush', num: 14, name: 'Неумолимый Натиск', enName: 'Juggernaut Rush', cdMs: 16000, stamina: 35, dmgMult: 1.5, desc: 'Таранный рывок на 7 блоков с Сопротивлением 40%.' },
    lightning_thrust: { id: 'iai_slash', num: 3, name: 'Фантомный Выпад', enName: 'Phantom Thrust', cdMs: 10000, stamina: 30, dmgMult: 1.9, desc: 'Мгновенный выпад-рывок сквозь врагов на 6 блоков.' },
    blood_rend: { id: 'blood_harvest', num: 12, name: 'Кровавая Жатва', enName: 'Blood Harvest', cdMs: 12000, stamina: 35, dmgMult: 1.6, desc: 'Серповидный взмах с исцелением.' },
    seismic_slam: { id: 'tectonic_rupture', num: 5, name: 'Разлом Тектоники', enName: 'Tectonic Rupture', cdMs: 14000, stamina: 45, dmgMult: 2.1, desc: 'Сокрушительный удар в радиусе 5б с оглушением.' },
    arrow_barrage: { id: 'fan_barrage', num: 8, name: 'Веерный Залп', enName: 'Fan Barrage', cdMs: 10000, stamina: 30, dmgMult: 1.6, desc: 'Веерный выпуск 5 спектральных стрел по дуге.' },
    fire_vortex: { id: 'flame_vortex', num: 9, name: 'Пламенный Вихрь', enName: 'Flame Vortex', cdMs: 12000, stamina: 35, dmgMult: 1.8, desc: 'Огненный шторм вокруг игрока.' }
};

// ------------------------------------------------------------------------------
// STAMINA ENGINE (SimpleStats Agility & Vitality Scaling)
// ------------------------------------------------------------------------------

function getPlayerMaxStamina(player) {
    if (!player) return 100;
    let perks = player.persistentData ? player.persistentData.getCompound('simplestats_perks') : null;
    let agi = perks ? perks.getInt('agility') : 0;
    let vit = perks ? perks.getInt('vitality') : 0;
    return 100 + (agi * 5) + (vit * 5);
}

function getPlayerStamina(player) {
    if (!player) return 100;
    let pData = player.persistentData;
    if (!pData.contains('elyrium_stamina')) {
        let maxStam = getPlayerMaxStamina(player);
        pData.putInt('elyrium_stamina', maxStam);
        return maxStam;
    }
    return pData.getInt('elyrium_stamina');
}

function consumePlayerStamina(player, amount) {
    if (!player) return false;
    let current = getPlayerStamina(player);
    if (current < amount) return false;
    player.persistentData.putInt('elyrium_stamina', current - amount);
    try {
        if (typeof player.causeFoodExhaustion === 'function') {
            player.causeFoodExhaustion(amount * 0.05);
        }
    } catch (e) {}
    return true;
}

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
        id.includes('lance') ||
        id.includes('zweihander') ||
        id.includes('colossal')) {
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
           id.includes('broadsword') ||
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

function dealArtDamage(player, target, damage, bypassArmor) {
    if (!target || !target.isLiving() || !target.isAlive() || target.isPlayer()) return false;
    try {
        if (bypassArmor) {
            try {
                target.attack(player.damageSources().magic(), damage);
            } catch (em) {
                target.setHealth(Math.max(0, target.health - damage));
            }
        } else {
            target.attack(player.damageSources().playerAttack(player), damage);
        }
    } catch (e1) {
        try {
            target.attack(player, damage);
        } catch (e2) {
            try {
                target.setHealth(Math.max(0, target.health - damage));
            } catch (e3) {}
        }
    }
    return true;
}

// ------------------------------------------------------------------------------
// RESOLVE INNATE ARCHETYPE WEAPON ART (Right-Click)
// ------------------------------------------------------------------------------

function resolveInnateWeaponArt(player, isAirborne) {
    let mainItem = player.mainHandItem;
    if (!mainItem || mainItem.isEmpty()) return null;

    let mainId = String(mainItem.id).toLowerCase();

    // 1. Bows & Crossbows: Fan Barrage
    if (mainId.includes('bow') || mainId.includes('crossbow') ||
        mainItem.hasTag('c:tools/bows') || mainItem.hasTag('c:tools/crossbows')) {
        return 'fan_barrage';
    }

    // 2. Airborne Heavy Weapons: Tectonic Rupture
    if (isAirborne) {
        if (mainId.includes('hammer') || mainId.includes('mace') || mainId.includes('club') ||
            mainId.includes('axe') || mainId.includes('claymore') || mainId.includes('greatsword')) {
            return 'tectonic_rupture';
        }
    }

    // 3. Katanas: Phantom Thrust / Iai Slash
    if (mainId.includes('katana') || mainId.includes('nodachi') || mainId.includes('uchigatana')) {
        return 'iai_slash';
    }

    // 4. Warhammers & Maces: Tectonic Rupture
    if (mainId.includes('hammer') || mainId.includes('mace') || mainId.includes('club') ||
        mainId.includes('maul') || mainId.includes('greathammer')) {
        return 'tectonic_rupture';
    }

    // 5. Battleaxes & Greataxes: Shield Breaker / Sunder
    if (mainId.includes('battleaxe') || mainId.includes('greataxe') || mainId.includes('waraxe') ||
        (mainId.includes('axe') && !mainId.includes('pickaxe'))) {
        return 'shield_breaker';
    }

    // 6. Polearms & Spears: Armor-Piercing Thrust
    if (mainId.includes('spear') || mainId.includes('halberd') || mainId.includes('lance') ||
        mainId.includes('glaive') || mainId.includes('polearm') || mainId.includes('trident') || mainId.includes('pike')) {
        return 'piercing_thrust';
    }

    // 7. Daggers & Rapiers: Shadow Step
    if (mainId.includes('dagger') || mainId.includes('rapier') || mainId.includes('knife') ||
        mainId.includes('sickle') || mainId.includes('sai') || mainId.includes('stiletto') || mainId.includes('tanto')) {
        return 'shadow_step';
    }

    // 8. Greatswords & Claymores: Seismic Cleave
    if (mainId.includes('claymore') || mainId.includes('greatsword') || mainId.includes('zweihander') ||
        mainId.includes('colossal') || mainId.includes('scythe') || isTwoHandedWeapon(mainItem)) {
        return 'seismic_cleave';
    }

    // 9. Swords & Broadswords: Parry & Counter
    return 'parry_counter';
}

// ------------------------------------------------------------------------------
// RESOLVE EXTRA RUNIC SLOT ART (Shift + Right-Click)
// ------------------------------------------------------------------------------

function getInscribedWeaponArt(item) {
    if (!item || item.isEmpty()) return null;
    try {
        if (item.nbt && item.nbt.contains('elyrium_inscribed_art')) {
            return String(item.nbt.getString('elyrium_inscribed_art')).toLowerCase();
        }
        if (item.customData && item.customData.contains('elyrium_inscribed_art')) {
            return String(item.customData.getString('elyrium_inscribed_art')).toLowerCase();
        }
        if (item.nbt && item.nbt.contains('weapon_art')) {
            return String(item.nbt.getString('weapon_art')).toLowerCase();
        }
        if (item.customData && item.customData.contains('weapon_art')) {
            return String(item.customData.getString('weapon_art')).toLowerCase();
        }
    } catch (e) {}
    return null;
}

// ------------------------------------------------------------------------------
// EXECUTION ENGINE FOR ALL WEAPON ARTS
// ------------------------------------------------------------------------------

function executeWeaponArt(player, artId, isAirborne, isRunicSlot) {
    if (!player || !player.isAlive()) return;

    if (!artId || !WEAPON_ARTS[artId]) {
        player.sendSystemMessage(Text.of('§7Возьмите в руку оружие с боевым искусством.'), true);
        return;
    }

    let art = WEAPON_ARTS[artId];
    let resolvedId = art.id || artId;
    let now = Date.now();
    let cdKey = 'skd_cd_' + resolvedId;
    let cdEnd = player.persistentData.getLong(cdKey) || 0;

    // Check Cooldown
    if (now < cdEnd) {
        let leftSec = ((cdEnd - now) / 1000).toFixed(1);
        player.sendSystemMessage(Text.of(`§c⏳ «${art.name}» перезаряжается: ${leftSec} сек`), true);
        player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ~ ~ ~ 0.5 1.8`);
        return;
    }

    // Check & Consume Stamina
    let stamCost = art.stamina || 30;
    if (!consumePlayerStamina(player, stamCost)) {
        let cur = getPlayerStamina(player);
        player.sendSystemMessage(Text.of(`§c⚡ Недостаточно выносливости! Требуется: §e${stamCost} §c(У вас: §7${cur}§c)`), true);
        player.server.runCommandSilent(`playsound minecraft:entity.player.breath player ${player.username} ~ ~ ~ 0.8 1.4`);
        return;
    }

    // Set Cooldown
    player.persistentData.putLong(cdKey, now + art.cdMs);
    player.persistentData.putString('skd_active_cd_art', resolvedId);
    player.persistentData.putLong('skd_active_cd_end', now + art.cdMs);

    let baseDmg = getWeaponBaseDamage(player);
    let level = player.level;
    let look = player.getLookAngle();
    let u = player.username;
    let curStam = getPlayerStamina(player);
    let maxStam = getPlayerMaxStamina(player);
    let stamTag = `§8[⚡ ${curStam}/${maxStam}]`;

    // ==========================================================================
    // 1. PARRY & COUNTER (Swords/Broadswords: 0.8s parry window, 100% block, stun, x2.0 counter)
    // ==========================================================================
    if (resolvedId === 'parry_counter') {
        player.persistentData.putLong('skd_parry_window', now + 800);
        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_chain player ${u} ${player.x} ${player.y} ${player.z} 1.2 1.4`);
        player.server.runCommandSilent(`playsound minecraft:block.chain.step player ${u} ${player.x} ${player.y} ${player.z} 1.0 1.6`);
        player.server.runCommandSilent(`particle minecraft:enchanted_hit ${player.x} ${player.y + 1} ${player.z} 0.5 0.5 0.5 0.1 20 normal`);
        player.server.runCommandSilent(`particle minecraft:sweep_attack ${player.x} ${player.y + 0.8} ${player.z} 0.6 0.2 0.6 0.05 6 normal`);
        player.sendSystemMessage(Text.of(`§6⚔ СТОЙКА ПАРИРОВАНИЯ! §e(Окно 0.8с: Блок 100% + Контрудар ×2.0) ${stamTag}`), true);

    // ==========================================================================
    // 2. SEISMIC CLEAVE (Greatswords/Claymores: 360° sweep, 4.5b radius, 180% dmg, knockback)
    // ==========================================================================
    } else if (resolvedId === 'seismic_cleave') {
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
                    dealArtDamage(player, ent, totalDmg, false);
                    ent.knockback(0.95, -dx / dist, -dz / dist);
                    hits++;
                }
            }
        });

        player.server.runCommandSilent(`playsound minecraft:entity.player.attack.sweep player ${u} ${player.x} ${player.y} ${player.z} 1.5 0.8`);
        player.server.runCommandSilent(`playsound minecraft:block.stone.break player ${u} ${player.x} ${player.y} ${player.z} 1.2 0.8`);
        player.server.runCommandSilent(`particle minecraft:sweep_attack ${player.x} ${player.y + 1} ${player.z} 1.8 0.2 1.8 0.1 25 normal`);
        player.server.runCommandSilent(`particle minecraft:block minecraft:stone ${player.x} ${player.y + 0.3} ${player.z} 1.5 0.3 1.5 0.1 20 normal`);
        player.server.runCommandSilent(`particle minecraft:crit ${player.x} ${player.y + 1} ${player.z} 1.2 0.4 1.2 0.15 25 normal`);
        player.sendSystemMessage(Text.of(`§6🌪 СЕЙСМИЧЕСКИЙ КЛИВ! §fУрон: §e${Math.round(totalDmg)} §7(×1.8) | Врагов: §a${hits} ${stamTag}`), true);

    // ==========================================================================
    // 3. IAI SLASH / PHANTOM THRUST (Katanas: 6b forward dash through enemies, 190% dmg, bleed)
    // ==========================================================================
    } else if (resolvedId === 'iai_slash') {
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
                dealArtDamage(player, ent, totalDmg, false);
                // Bleed effect for 5 seconds (100 ticks)
                ent.potionEffects.add('minecraft:wither', 100, 1, false, true);
                try { ent.potionEffects.add('attributeslib:bleeding', 100, 1, false, true); } catch (e) {}
                hits++;
            }
        });

        player.server.runCommandSilent(`playsound minecraft:entity.player.attack.crit player ${u} ${targetX} ${targetY} ${targetZ} 1.5 1.5`);
        player.server.runCommandSilent(`playsound minecraft:item.trident.throw player ${u} ${targetX} ${targetY} ${targetZ} 1.2 1.3`);
        player.server.runCommandSilent(`particle minecraft:sweep_attack ${targetX} ${targetY + 1} ${targetZ} 1.2 0.3 1.2 0.1 20 normal`);
        player.server.runCommandSilent(`particle minecraft:flash ${targetX} ${targetY + 1} ${targetZ} 0.1 0.1 0.1 0 1 normal`);
        player.server.runCommandSilent(`particle minecraft:crimson_spore ${targetX} ${targetY + 1} ${targetZ} 0.8 0.5 0.8 0.1 25 normal`);
        player.sendSystemMessage(Text.of(`§b⚡ ФАНТОМНЫЙ ВЫПАД (ИАЙ)! §fУрон: §e${Math.round(totalDmg)} §7(×1.9) + Кровотечение | Задето: §a${hits} ${stamTag}`), true);

    // ==========================================================================
    // 4. SHIELD BREAKER / SUNDER (Battleaxes: crushes shields, ignores 50% armor, stuns 1.5s)
    // ==========================================================================
    } else if (resolvedId === 'shield_breaker') {
        let totalDmg = baseDmg * art.dmgMult;
        let forwardDist = 3.5;
        let cx = player.x + look.x * (forwardDist * 0.5);
        let cy = player.y;
        let cz = player.z + look.z * (forwardDist * 0.5);

        let chopBox = AABB.of(cx - 2.0, cy - 1.2, cz - 2.0, cx + 2.0, cy + 2.5, cz + 2.0);
        let ents = level.getEntitiesWithin(chopBox);
        let hits = 0;

        ents.forEach(ent => {
            if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive()) {
                // Deal heavy damage ignoring 50% armor (composite damage)
                dealArtDamage(player, ent, totalDmg * 0.5, true);  // 50% true damage
                dealArtDamage(player, ent, totalDmg * 0.5, false); // 50% physical damage

                // Stun 1.5s (30 ticks)
                ent.potionEffects.add('minecraft:slowness', 30, 4, false, true);
                ent.potionEffects.add('minecraft:mining_fatigue', 30, 3, false, true);
                ent.potionEffects.add('minecraft:weakness', 40, 1, false, true);
                hits++;
            }
        });

        player.server.runCommandSilent(`playsound minecraft:item.shield.break player ${u} ${player.x} ${player.y} ${player.z} 1.5 0.9`);
        player.server.runCommandSilent(`playsound minecraft:entity.generic.explode player ${u} ${player.x} ${player.y} ${player.z} 1.0 1.4`);
        player.server.runCommandSilent(`particle minecraft:block minecraft:iron_block ${player.x + look.x * 2} ${player.y + 0.5} ${player.z + look.z * 2} 0.8 0.4 0.8 0.2 25 normal`);
        player.server.runCommandSilent(`particle minecraft:crit ${player.x + look.x * 2} ${player.y + 1} ${player.z + look.z * 2} 1.0 0.5 1.0 0.2 30 normal`);
        player.sendSystemMessage(Text.of(`§c🔨 СОКРУШИТЕЛЬ ЗАЩИТЫ! §fУрон: §e${Math.round(totalDmg)} §7(Игнор 50% брони) | Оглушено: §a${hits} ${stamTag}`), true);

    // ==========================================================================
    // 5. TECTONIC RUPTURE (Warhammers: ground slam, 5m radial wave, knocks up, Slowness IV)
    // ==========================================================================
    } else if (resolvedId === 'tectonic_rupture') {
        let radius = 5.0;
        let totalDmg = baseDmg * art.dmgMult;
        let aabb = AABB.of(player.x - radius, player.y - 2.0, player.z - radius, player.x + radius, player.y + 2.5, player.z + radius);
        let ents = level.getEntitiesWithin(aabb);
        let hits = 0;

        ents.forEach(ent => {
            if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive()) {
                dealArtDamage(player, ent, totalDmg, false);
                // Knock high into air + Slowness IV for 50 ticks (2.5s)
                ent.setDeltaMovement(0, 0.82, 0);
                ent.hasImpulse = true;
                ent.potionEffects.add('minecraft:slowness', 50, 3, false, true);
                hits++;
            }
        });

        player.server.runCommandSilent(`playsound minecraft:entity.generic.explode player ${u} ${player.x} ${player.y} ${player.z} 1.4 0.8`);
        player.server.runCommandSilent(`playsound minecraft:block.stone.break player ${u} ${player.x} ${player.y} ${player.z} 1.5 0.6`);
        player.server.runCommandSilent(`particle minecraft:explosion ${player.x} ${player.y + 0.2} ${player.z} 1.2 0.3 1.2 0 4 normal`);
        player.server.runCommandSilent(`particle minecraft:block minecraft:dirt ${player.x} ${player.y + 0.4} ${player.z} 2.0 0.6 2.0 0.25 40 normal`);
        player.server.runCommandSilent(`particle minecraft:large_smoke ${player.x} ${player.y + 0.4} ${player.z} 1.5 0.3 1.5 0.1 20 normal`);
        player.sendSystemMessage(Text.of(`§8🌋 РАЗЛОМ ТЕКТОНИКИ! §fУрон: §e${Math.round(totalDmg)} §7(×2.1) | В воздухе: §a${hits} ${stamTag}`), true);

    // ==========================================================================
    // 6. ARMOR-PIERCING THRUST (Polearms/Spears: 5.5b thrust, 100% armor bypass)
    // ==========================================================================
    } else if (resolvedId === 'piercing_thrust') {
        let totalDmg = baseDmg * art.dmgMult;
        let hLen = Math.max(0.01, Math.sqrt(look.x * look.x + look.z * look.z));
        let normX = look.x / hLen;
        let normZ = look.z / hLen;
        let hitEntities = new Set();
        let hits = 0;

        for (let i = 1; i <= 5.5; i += 0.9) {
            let px = player.x + normX * i;
            let py = player.y + player.eyeHeight - 0.2;
            let pz = player.z + normZ * i;

            player.server.runCommandSilent(`particle minecraft:crit ${px} ${py} ${pz} 0.2 0.2 0.2 0.05 5 normal`);
            player.server.runCommandSilent(`particle minecraft:enchanted_hit ${px} ${py} ${pz} 0.15 0.15 0.15 0.05 4 normal`);

            let box = AABB.of(px - 1.2, py - 1.0, pz - 1.2, px + 1.2, py + 1.2, pz + 1.2);
            let ents = level.getEntitiesWithin(box);
            ents.forEach(ent => {
                if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive() && !hitEntities.has(ent.id)) {
                    hitEntities.add(ent.id);
                    // 100% Armor Bypass
                    dealArtDamage(player, ent, totalDmg, true);
                    ent.knockback(0.8, -normX, -normZ);
                    hits++;
                }
            });
        }

        player.server.runCommandSilent(`playsound minecraft:item.trident.pierce player ${u} ${player.x} ${player.y} ${player.z} 1.4 1.4`);
        player.server.runCommandSilent(`playsound minecraft:entity.arrow.hit_player player ${u} ${player.x} ${player.y} ${player.z} 1.2 1.6`);
        player.sendSystemMessage(Text.of(`§e🔱 БРОНЕБОЙНЫЙ ПРОКОЛ! §fЧистый урон (100% пробитие): §e${Math.round(totalDmg)} §7| Поражено: §a${hits} ${stamTag}`), true);

    // ==========================================================================
    // 7. SHADOW STEP (Daggers/Rapiers: instant blink behind nearest enemy 5b, 1s stealth, 100% crit)
    // ==========================================================================
    } else if (resolvedId === 'shadow_step') {
        let maxRange = 5.0;
        let searchBox = AABB.of(player.x - maxRange, player.y - 2, player.z - maxRange, player.x + maxRange, player.y + 3, player.z + maxRange);
        let nearby = level.getEntitiesWithin(searchBox);
        let bestTarget = null;
        let bestDot = 0.3;

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
            targetX = bestTarget.x - tLook.x * 1.4;
            targetY = bestTarget.y;
            targetZ = bestTarget.z - tLook.z * 1.4;
            player.teleportTo(player.level.dimension, targetX, targetY, targetZ, bestTarget.yaw, player.pitch);
        } else {
            targetX = player.x + look.x * maxRange;
            targetY = player.y;
            targetZ = player.z + look.z * maxRange;
            player.teleportTo(player.level.dimension, targetX, targetY, targetZ, player.yaw, player.pitch);
        }

        // Invisibility for 1.0s (20 ticks) + Speed II for 2.0s (40 ticks)
        player.potionEffects.add('minecraft:invisibility', 20, 0, false, false);
        player.potionEffects.add('minecraft:speed', 40, 1, false, false);

        // Next strike within 3s is 100% guaranteed Critical Hit
        player.persistentData.putLong('skd_shadow_step_crit_until', now + 3000);

        player.server.runCommandSilent(`playsound minecraft:entity.enderman.teleport player ${u} ${targetX} ${targetY} ${targetZ} 1.2 1.2`);
        player.server.runCommandSilent(`particle minecraft:portal ${targetX} ${targetY + 1} ${targetZ} 0.6 0.8 0.6 0.1 30 normal`);
        player.server.runCommandSilent(`particle minecraft:smoke ${targetX} ${targetY + 1} ${targetZ} 0.5 0.5 0.5 0.05 15 normal`);
        player.sendSystemMessage(Text.of(`§5🌑 ТЕНЕВОЙ ШАГ! §d(Смещение за спину + Невидимость 1с + 100% Крит) ${stamTag}`), true);

    // ==========================================================================
    // 8. FAN BARRAGE (Bows/Crossbows: 5 spectral arrows in a cone forward)
    // ==========================================================================
    } else if (resolvedId === 'fan_barrage') {
        let angles = [-18, -9, 0, 9, 18];
        let speed = 2.5;

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
        player.sendSystemMessage(Text.of(`§a🏹 ВЕЕРНЫЙ ЗАЛП! §f5 спектральных стрел веером ${stamTag}`), true);

    // ==========================================================================
    // 9. FLAME VORTEX (Secondary Runic: 4.5b fire cyclone, ignites for 6s)
    // ==========================================================================
    } else if (resolvedId === 'flame_vortex') {
        let radius = 4.5;
        let totalDmg = baseDmg * art.dmgMult;
        let aabb = AABB.of(player.x - radius, player.y - 1.5, player.z - radius, player.x + radius, player.y + 2.5, player.z + radius);
        let ents = level.getEntitiesWithin(aabb);
        let hits = 0;

        ents.forEach(ent => {
            if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive()) {
                dealArtDamage(player, ent, totalDmg, false);
                ent.setSecondsOnFire(6);
                hits++;
            }
        });

        player.server.runCommandSilent(`playsound minecraft:item.firecharge.use player ${u} ${player.x} ${player.y} ${player.z} 1.4 1.1`);
        player.server.runCommandSilent(`particle minecraft:flame ${player.x} ${player.y + 1} ${player.z} 1.6 0.4 1.6 0.1 35 normal`);
        player.server.runCommandSilent(`particle minecraft:lava ${player.x} ${player.y + 1} ${player.z} 1.2 0.4 1.2 0.1 15 normal`);
        player.sendSystemMessage(Text.of(`§6🔥 ПЛАМЕННЫЙ ВИХРЬ! §fУрон: §e${Math.round(totalDmg)} §7+ Поджог на 6с | Врагов: §a${hits} ${stamTag}`), true);

    // ==========================================================================
    // 10. FROST STOMP (Secondary Runic: 5m freeze shockwave, Slowness IV, marks freeze)
    // ==========================================================================
    } else if (resolvedId === 'frost_stomp') {
        let radius = 5.0;
        let totalDmg = baseDmg * art.dmgMult;
        let aabb = AABB.of(player.x - radius, player.y - 1.5, player.z - radius, player.x + radius, player.y + 2.5, player.z + radius);
        let ents = level.getEntitiesWithin(aabb);
        let hits = 0;

        ents.forEach(ent => {
            if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive()) {
                dealArtDamage(player, ent, totalDmg, false);
                ent.potionEffects.add('minecraft:slowness', 80, 3, false, true);
                try { ent.setTicksFrozen(200); } catch (e) {}
                ent.persistentData.putBoolean('elyrium_frozen', true);
                ent.persistentData.putLong('elyrium_frozen_until', now + 4000);
                hits++;
            }
        });

        player.server.runCommandSilent(`playsound minecraft:block.glass.break player ${u} ${player.x} ${player.y} ${player.z} 1.3 1.2`);
        player.server.runCommandSilent(`playsound minecraft:block.powder_snow.step player ${u} ${player.x} ${player.y} ${player.z} 1.5 0.7`);
        player.server.runCommandSilent(`particle minecraft:snowflake ${player.x} ${player.y + 0.5} ${player.z} 1.8 0.4 1.8 0.15 40 normal`);
        player.server.runCommandSilent(`particle minecraft:item_snowball ${player.x} ${player.y + 0.5} ${player.z} 1.4 0.3 1.4 0.1 25 normal`);
        player.sendSystemMessage(Text.of(`§b❄ ЛЕДЯНАЯ ПОСТУПЬ! §fУрон: §e${Math.round(totalDmg)} §7+ Глубокая Заморозка | Врагов: §a${hits} ${stamTag}`), true);

    // ==========================================================================
    // 11. LIGHTNING SMITE (Secondary Runic: lightning bolt strike, 220% dmg)
    // ==========================================================================
    } else if (resolvedId === 'lightning_smite') {
        let totalDmg = baseDmg * art.dmgMult;
        let targetX = player.x + look.x * 5.0;
        let targetY = player.y;
        let targetZ = player.z + look.z * 5.0;

        // Summon visual lightning
        player.server.runCommandSilent(`execute at ${u} run summon minecraft:lightning_bolt ${targetX.toFixed(2)} ${targetY.toFixed(2)} ${targetZ.toFixed(2)}`);

        let strikeBox = AABB.of(targetX - 3.5, targetY - 2.0, targetZ - 3.5, targetX + 3.5, targetY + 3.5, targetZ + 3.5);
        let ents = level.getEntitiesWithin(strikeBox);
        let hits = 0;

        ents.forEach(ent => {
            if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive()) {
                dealArtDamage(player, ent, totalDmg, false);
                ent.potionEffects.add('minecraft:slowness', 60, 2, false, true);
                hits++;
            }
        });

        player.server.runCommandSilent(`particle minecraft:electric_spark ${targetX} ${targetY + 1} ${targetZ} 1.2 1.0 1.2 0.2 40 normal`);
        player.server.runCommandSilent(`particle minecraft:flash ${targetX} ${targetY + 1} ${targetZ} 0.1 0.1 0.1 0 1 normal`);
        player.sendSystemMessage(Text.of(`§e⚡ ГРОМОВОЙ РАСКАТ! §fУрон молнией: §e${Math.round(totalDmg)} §7(×2.2) | Поражено: §a${hits} ${stamTag}`), true);

    // ==========================================================================
    // 12. BLOOD HARVEST (Secondary Runic: crescent slash, 15% vampirism)
    // ==========================================================================
    } else if (resolvedId === 'blood_harvest') {
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
                    if (dot > 0.20) {
                        dealArtDamage(player, ent, totalDmg, false);
                        totalDealt += totalDmg;
                        hits++;
                    }
                }
            }
        });

        let healAmount = totalDealt * 0.15;
        if (healAmount > 0) {
            player.heal(healAmount);
        }

        player.server.runCommandSilent(`playsound minecraft:entity.wither.shoot player ${u} ${player.x} ${player.y} ${player.z} 1.0 1.5`);
        player.server.runCommandSilent(`particle minecraft:crimson_spore ${player.x + look.x * 1.5} ${player.y + 1} ${player.z + look.z * 1.5} 0.8 0.4 0.8 0.1 30 normal`);
        player.server.runCommandSilent(`particle minecraft:soul_fire_flame ${player.x + look.x * 1.5} ${player.y + 1} ${player.z + look.z * 1.5} 0.5 0.2 0.5 0.05 15 normal`);
        player.sendSystemMessage(Text.of(`§4🩸 КРОВАВАЯ ЖАТВА! §fУрон: §e${Math.round(totalDmg)} §7| Вампиризм 15%: §a+${healAmount.toFixed(1)} HP §7| Целей: §c${hits} ${stamTag}`), true);

    // ==========================================================================
    // 13. HOLY BLADE (Secondary Runic: 200% sacred burst, +50% vs undead, Regen II 4s)
    // ==========================================================================
    } else if (resolvedId === 'holy_blade') {
        let totalDmg = baseDmg * art.dmgMult;
        let radius = 5.0;
        let aabb = AABB.of(player.x - radius, player.y - 1.5, player.z - radius, player.x + radius, player.y + 2.5, player.z + radius);
        let ents = level.getEntitiesWithin(aabb);
        let hits = 0;

        ents.forEach(ent => {
            if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive()) {
                let dx = ent.x - player.x;
                let dz = ent.z - player.z;
                let dist = Math.max(0.01, Math.sqrt(dx * dx + dz * dz));
                if (dist <= radius) {
                    let dot = (dx * look.x + dz * look.z) / dist;
                    if (dot > 0.15) {
                        let finalDmg = totalDmg;
                        let isUndeadOrDemon = false;
                        try {
                            let typeStr = String(ent.type).toLowerCase();
                            isUndeadOrDemon = ent.isUndead() || typeStr.includes('zombie') || typeStr.includes('skeleton') || typeStr.includes('wither') || typeStr.includes('demon');
                        } catch (e) {}

                        if (isUndeadOrDemon) {
                            finalDmg *= 1.50; // +50% extra sacred damage
                        }

                        dealArtDamage(player, ent, finalDmg, true);
                        hits++;
                    }
                }
            }
        });

        // Grant player Regeneration II for 4 seconds (80 ticks)
        player.potionEffects.add('minecraft:regeneration', 80, 1, false, true);

        player.server.runCommandSilent(`playsound minecraft:block.amethyst_block.chime player ${u} ${player.x} ${player.y} ${player.z} 1.4 1.2`);
        player.server.runCommandSilent(`particle minecraft:totem_of_undying ${player.x} ${player.y + 1} ${player.z} 0.8 0.5 0.8 0.2 30 normal`);
        player.server.runCommandSilent(`particle minecraft:electric_spark ${player.x} ${player.y + 1} ${player.z} 0.6 0.4 0.6 0.1 20 normal`);
        player.sendSystemMessage(Text.of(`§e✨ СВЯЩЕННЫЙ КЛИНОК! §fСвятой урон: §e${Math.round(totalDmg)} §7+ Регенерация II | Задето: §a${hits} ${stamTag}`), true);

    // ==========================================================================
    // 14. JUGGERNAUT RUSH (Legacy Tank Charge: Resistance 40% buff, knocks aside)
    // ==========================================================================
    } else if (resolvedId === 'juggernaut_rush') {
        let totalDmg = baseDmg * art.dmgMult;
        let hLen = Math.max(0.01, Math.sqrt(look.x * look.x + look.z * look.z));
        let normX = look.x / hLen;
        let normZ = look.z / hLen;

        player.potionEffects.add('minecraft:resistance', 80, 1, false, true);
        player.potionEffects.add('minecraft:speed', 30, 2, false, false);
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
                    dealArtDamage(player, ent, totalDmg, false);
                    ent.knockback(0.9, normZ, -normX);
                    hits++;
                }
            });
        }

        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${u} ${player.x} ${player.y} ${player.z} 1.2 0.8`);
        player.server.runCommandSilent(`particle minecraft:cloud ${player.x} ${player.y + 0.8} ${player.z} 1.0 0.4 1.0 0.1 25 normal`);
        player.sendSystemMessage(Text.of(`§c🛡 НЕУМОЛИМЫЙ НАТИСК! §fСопротивление 40% | Раскинуто: §a${hits} ${stamTag}`), true);
    }
}

// ------------------------------------------------------------------------------
// EVENT 1: COMBAT INTERACTIONS (PARRY & COUNTER, GUARD COUNTER, SHADOW CRIT)
// ------------------------------------------------------------------------------

EntityEvents.beforeHurt(event => {
    let source = event.source;
    if (!source) return;

    let victim = event.entity;
    let attacker = source.actual || source.player;
    let now = Date.now();

    // ==========================================================================
    // A. INCOMING DAMAGE TO PLAYER: PARRY OR SHIELD BLOCK
    // ==========================================================================
    if (victim && victim.isPlayer() && victim.isAlive()) {
        // 1. PARRY & COUNTER: 0.8s Parry Window (Swords/Broadswords)
        let parryUntil = victim.persistentData.getLong('skd_parry_window') || 0;
        if (parryUntil > 0 && now <= parryUntil) {
            victim.persistentData.remove('skd_parry_window');

            // 100% Damage Negated!
            event.damage = 0;
            event.cancel();

            // Attacker Stunned
            if (attacker && attacker.isLiving() && attacker !== victim) {
                attacker.potionEffects.add('minecraft:slowness', 60, 3, false, true);
                attacker.potionEffects.add('minecraft:weakness', 60, 2, false, true);

                // Counter strike x2.0 base damage back to attacker!
                let counterDmg = getWeaponBaseDamage(victim) * 2.0;
                dealArtDamage(victim, attacker, counterDmg, false);
            }

            victim.server.runCommandSilent(`playsound minecraft:block.anvil.land player ${victim.username} ~ ~ ~ 1.5 1.2`);
            victim.server.runCommandSilent(`playsound minecraft:item.shield.block player ${victim.username} ~ ~ ~ 1.5 1.5`);
            victim.server.runCommandSilent(`particle minecraft:flash ${victim.x} ${victim.y + 1} ${victim.z} 0.1 0.1 0.1 0 1 normal`);
            victim.server.runCommandSilent(`particle minecraft:sweep_attack ${victim.x} ${victim.y + 1} ${victim.z} 1.2 0.2 1.2 0.1 12 normal`);
            victim.server.runCommandSilent(`particle minecraft:crit ${victim.x} ${victim.y + 1} ${victim.z} 0.8 0.8 0.8 0.2 25 normal`);
            victim.sendSystemMessage(Text.of('§6⚔ ИДЕАЛЬНОЕ ПАРИРОВАНИЕ И КОНТРУДАР! §e[100% Блок + Контрудар ×2.0, Враг оглушен на 3с]'), true);
            return;
        }

        // 2. SHIELD GUARD COUNTER SETUP: Player blocks hit with shield
        if (victim.isBlocking()) {
            let offHand = victim.offHandItem;
            let mainHand = victim.mainHandItem;
            let hasShieldEquipped = (offHand && isShield(offHand)) || (mainHand && isShield(mainHand));

            if (hasShieldEquipped) {
                victim.persistentData.putLong('skd_guard_counter_window', now + 1500);
                if (attacker) {
                    victim.persistentData.putInt('skd_guard_counter_target_id', attacker.id);
                }

                victim.server.runCommandSilent(`playsound minecraft:block.amethyst_block.hit player ${victim.username} ~ ~ ~ 1.2 1.6`);
                victim.server.runCommandSilent(`particle minecraft:electric_spark ${victim.x} ${victim.y + 1} ${victim.z} 0.4 0.4 0.4 0.1 12 normal`);
                victim.sendSystemMessage(Text.of('§e⚡ СТОЙКА КОНТРУДАРА! §f[Нажмите ЛКМ в течение 1.5с для контратаки +150%]'), true);
            }
        }
    }

    // ==========================================================================
    // B. OUTGOING DAMAGE FROM PLAYER: GUARD COUNTER & SHADOW CRIT
    // ==========================================================================
    if (attacker && attacker.isPlayer() && attacker.isAlive() && victim && victim.isAlive() && !victim.isPlayer()) {
        // 1. Guard Counter Execution: Left click within 1.5s of blocking
        let counterUntil = attacker.persistentData.getLong('skd_guard_counter_window') || 0;
        if (counterUntil > 0 && now <= counterUntil) {
            attacker.persistentData.remove('skd_guard_counter_window');
            attacker.persistentData.remove('skd_guard_counter_target_id');

            // +150% damage bonus (2.5x multiplier)
            event.damage *= 2.5;

            // Stun & weaken target
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
// EVENT 2: RIGHT-CLICK TRIGGER CONTROLS (ПКМ & SHIFT+ПКМ)
// ------------------------------------------------------------------------------

ItemEvents.rightClicked(event => {
    let player = event.player;
    if (!player || !player.isAlive()) return;

    let item = event.item;
    if (!item || item.isEmpty()) return;

    // Ignore offhand right click events
    if (event.hand && String(event.hand).toUpperCase().includes('OFF')) return;

    let mainHand = player.mainHandItem;
    if (!mainHand || mainHand.isEmpty() || !isAnyWeapon(mainHand)) return;

    // Check if player is aiming at Infernal Anvil: allow block interaction without triggering art
    let hit = event.target || (player.rayTrace ? player.rayTrace(5.0) : null);
    if (hit && hit.block && String(hit.block.id) === 'kubejs:infernal_anvil') {
        return;
    }

    let currentAge = (typeof player.age === 'number') ? player.age : (typeof player.tickCount === 'number' ? player.tickCount : 0);
    if (player.persistentData.getInt('skd_last_art_tick') === currentAge) return;

    let offHand = player.offHandItem;
    let hasShieldInOffhand = offHand && isShield(offHand);
    let isAirborne = (typeof player.onGround === 'function' ? !player.onGround() : !player.onGround) || player.fallDistance > 0.05;

    // --------------------------------------------------------------------------
    // CASE A: Shift + Right-Click (Sneak + ПКМ) -> Extra Runic Slot
    // --------------------------------------------------------------------------
    if (player.isCrouching()) {
        player.persistentData.putInt('skd_last_art_tick', currentAge);

        let inscribedArt = getInscribedWeaponArt(mainHand);
        if (inscribedArt && WEAPON_ARTS[inscribedArt]) {
            executeWeaponArt(player, inscribedArt, false, true);
        } else {
            player.sendSystemMessage(Text.of('§7В руническом слоте оружия нет боевого искусства §8[Shift+ПКМ] §7(Инкрустируйте скрижаль на Адской Наковальне).'), true);
            player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ~ ~ ~ 0.5 1.8`);
        }
        return;
    }

    // --------------------------------------------------------------------------
    // CASE B: Standard Right-Click (ПКМ) -> Innate Archetype Skill
    // --------------------------------------------------------------------------
    // If holding shield in offhand and not crouching, allow vanilla shield blocking!
    if (hasShieldInOffhand) {
        return;
    }

    // Main weapon right click -> execute innate archetype art
    let innateArt = resolveInnateWeaponArt(player, isAirborne);
    if (innateArt) {
        player.persistentData.putInt('skd_last_art_tick', currentAge);
        executeWeaponArt(player, innateArt, isAirborne, false);
    }
});

// ------------------------------------------------------------------------------
// EVENT 3: STAMINA REGEN & COOLDOWN READINESS MONITOR (PlayerEvents.tick)
// ------------------------------------------------------------------------------

PlayerEvents.tick(event => {
    let player = event.player;
    if (!player || !player.isAlive()) return;
    let pAge = (typeof player.age === 'number') ? player.age : (typeof player.tickCount === 'number' ? player.tickCount : 0);
    if (pAge % 10 !== 0) return;

    // 1. Stamina Regeneration (+5 to +8 every 10 ticks based on food & movement)
    let curStam = getPlayerStamina(player);
    let maxStam = getPlayerMaxStamina(player);
    if (curStam < maxStam) {
        let regen = 5;
        if (player.foodLevel > 14) regen += 3;
        if (player.isSprinting()) regen = Math.max(1, regen - 3);
        player.persistentData.putInt('elyrium_stamina', Math.min(maxStam, curStam + regen));
    }

    // 2. Cooldown Readiness Notification
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
// EVENT 4: COMMANDS & SHORTCUTS (/art, .art)
// ------------------------------------------------------------------------------

function printArtsList(player) {
    player.tell('§6═══════════════════════════════════════════════════');
    player.tell('§e⚔ БОЕВЫЕ ИСКУССТВА ЭЛИРИУМА: АРХЕТИПЫ И РУНИЧЕСКИЙ СЛОТ');
    player.tell('§6═══════════════════════════════════════════════════');
    player.tell('§b1. Врожденные умения архетипов [ПКМ]:');
    player.tell('  §6• Мечи / Палаши: §eПарирующий Клинок §7(0.8с блок 100%, стан, контрудар x2.0, 25⚡)');
    player.tell('  §6• Двуручники / Клейморы: §eСейсмический Клив §7(360° клив 4.5б, 180% урон, 40⚡)');
    player.tell('  §6• Катаны: §eФантомный Выпад / Иай §7(рывок 6б сквозь врагов, 190% урон, кровотечение, 30⚡)');
    player.tell('  §6• Секиры / Топоры: §eСокрушитель Защиты §7(сбив щитов, 50% пробой брони, стан 1.5с, 35⚡)');
    player.tell('  §6• Молоты / Булавы: §eРазлом Тектоники §7(удар о землю 5м, подброс, Замедление IV, 45⚡)');
    player.tell('  §6• Копья / Алебарды: §eБронебойный Прокол §7(выпад 5.5б, 100% чистый пробой брони, 25⚡)');
    player.tell('  §6• Кинжалы / Рапиры: §eТеневой Шаг §7(блинк за спину 5б, невидимость 1с, 100% крит, 20⚡)');
    player.tell('  §6• Луки / Арбалеты: §eВеерный Залп §7(5 спектральных стрел веером, 30⚡)');
    player.tell('§b2. Дополнительный рунический слот [Shift + ПКМ]:');
    player.tell('  §6• Скрижали: §eПламенный Вихрь§7, §bЛедяная Поступь§7, §eГромовой Раскат§7, §4Кровавая Жатва§7, §aСвященный Клинок');
    player.tell('§6═══════════════════════════════════════════════════');
}

ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event;

    event.register(
        Commands.literal('art')
            .executes(ctx => {
                let p = ctx.source.player;
                if (p) executeWeaponArt(p, resolveInnateWeaponArt(p, false), false, false);
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
    );

    event.register(
        Commands.literal('weapon_art')
            .executes(ctx => {
                let p = ctx.source.player;
                if (p) executeWeaponArt(p, resolveInnateWeaponArt(p, false), false, false);
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
        executeWeaponArt(player, resolveInnateWeaponArt(player, false), false, false);
        event.cancel();
    } else if (msg === '.art list' || msg === '!art list' || msg === '.art help') {
        printArtsList(player);
        event.cancel();
    }
});
