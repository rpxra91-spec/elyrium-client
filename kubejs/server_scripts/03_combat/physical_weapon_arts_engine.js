// ==============================================================================
// ⚔️ ELYRIUM RPG: PHYSICAL WEAPON ARTS & GUARD COUNTER ENGINE (v2.2)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// Canon 11-Tier Progression Standard:
// 1. 9 Melee Weapon Arts:
//    - whirlwind_cleave (Вихревой Размах) - 360° sweep 4.5b, 180% dmg, knockback.
//    - iai_slash (Фантомный Выпад / Иай) - 6b forward dash through enemies, 190% dmg, bleed.
//    - severing_cleave (Рассекающий Клив) - 120° frontal arc 4m, 210% dmg, ignores 40% armor.
//    - earth_sunder (Сотрясение Земли) - 5m ground slam, 200% dmg, knocks up, Slowness IV.
//    - crushing_uppercut (Сокрушительный Апперкот) - rising uppercut, 220% dmg, launches 4b, stuns 2s.
//    - piercing_thrust (Бронебойный Прокол) - 5.5b spear thrust, 100% true armor bypass, 175% dmg.
//    - scissor_cross (Ножницы) - dual blade cross-slash, 2x 110% (220%) dmg, Deep Wounds.
//    - shadow_step (Теневой Шаг) - instant blink behind enemy 5.5b, stealth 1.2s, 100% crit.
//    - reverse_sunder (Реверсивный Раскол) - rising vertical slash, 195% dmg, guard crush, Weakness II.
//
// 2. 5 Ranged Bow Arts:
//    - fan_barrage (Веерный Залп) - 5 spectral arrows in a wide frontal cone.
//    - piercing_shot (Бронебойный Выстрел) - high-speed piercing shot line (25b, 100% armor bypass, 220% dmg).
//    - arrow_rain (Град Стрел) - skyward shot, 12-arrow rain strikes 6m area after 1.2s.
//    - tactical_backstep (Тактический Отскок) - 5b backward evasion leap + concussive slowing arrow.
//    - triple_shot (Беглая Тройка) - 3-arrow high-velocity rapid burst.
//
// 3. 2 Shield Arts & Guard Counter:
//    - shield_bash (Таранный Натиск) - 5b forward shield charge, bludgeoning dmg, stuns 2s.
//    - unwavering_bulwark (Непоколебимый Оплот) - 3.5s bastion stance, 80% res, knockback immune, 30% reflect.
//    - guard_counter (Гвардейский Контрудар) - Left-Click within 1.5s after blocking -> +150% dmg, stun.
//
// 4. Spear Universal Grip (Универсальный хват):
//    - With Shield: Guard Thrust (attack from behind raised shield without dropping guard).
//    - Without Shield (Empty Offhand): Two-Handed Power Grip (+30% physical damage, reach +1.5 blocks).
//
// 5. High-Tier Elemental Runes (T4+):
//    - flame_vortex, frost_stomp, lightning_smite, blood_harvest, holy_blade.
//
// 6. Real Skeletal PlayerAnimator Integration:
//    - Network sync: broadcasts real PlayerAnimator / spell_engine skeletal animations.
// ==============================================================================

const WEAPON_ARTS = {
    // --------------------------------------------------------------------------
    // 9 MELEE WEAPON ARTS
    // --------------------------------------------------------------------------
    whirlwind_cleave: {
        id: 'whirlwind_cleave',
        name: 'Вихревой Размах',
        enName: 'Whirlwind Cleave',
        cdMs: 12000,
        stamina: 40,
        dmgMult: 1.8,
        anim: 'spell_engine:two_handed_spinning',
        animSpeed: 1.1,
        desc: 'Размашистый круговой клив на 360° в радиусе 4.5б: 180% урона и круговое отбрасывание врагов.'
    },
    iai_slash: {
        id: 'iai_slash',
        name: 'Фантомный Выпад (Иай)',
        enName: 'Phantom Thrust / Iai Slash',
        cdMs: 10000,
        stamina: 30,
        dmgMult: 1.9,
        anim: 'spell_engine:weapon_thrust_full',
        animSpeed: 1.2,
        desc: 'Мгновенный рывок вперед на 6 блоков сквозь строй врагов: 190% урона и кровотечение на 5с.'
    },
    severing_cleave: {
        id: 'severing_cleave',
        name: 'Рассекающий Клив',
        enName: 'Severing Cleave',
        cdMs: 11000,
        stamina: 35,
        dmgMult: 2.1,
        anim: 'spell_engine:weapon_cleave',
        animSpeed: 1.0,
        desc: 'Мощный фронтальный дуговой удар (120°, 4м): 210% урона, игнорирует 40% брони цели.'
    },
    earth_sunder: {
        id: 'earth_sunder',
        name: 'Сотрясение Земли',
        enName: 'Earth Sunder',
        cdMs: 14000,
        stamina: 45,
        dmgMult: 2.0,
        anim: 'spell_engine:weapon_one_handed_slam',
        animSpeed: 0.95,
        desc: 'Удар в землю с 5-метровой радиальной волной: 200% урона, подбрасывает в воздух и накладывает Замедление IV.'
    },
    crushing_uppercut: {
        id: 'crushing_uppercut',
        name: 'Сокрушительный Апперкот',
        enName: 'Crushing Uppercut',
        cdMs: 11000,
        stamina: 30,
        dmgMult: 2.2,
        anim: 'spell_engine:weapon_mace_uppercut_start',
        animSpeed: 1.1,
        desc: 'Восходящий удар снизу-вверх: 220% урона, подбрасывает одиночную цель на 4 блока с оглушением на 2с.'
    },
    piercing_thrust: {
        id: 'piercing_thrust',
        name: 'Бронебойный Прокол',
        enName: 'Armor-Piercing Thrust',
        cdMs: 9000,
        stamina: 25,
        dmgMult: 1.75,
        anim: 'spell_engine:weapon_thrust_charge',
        animSpeed: 1.25,
        desc: 'Линейный выпад на 5.5 блоков со 100% игнорированием брони цели и сильным отталкиванием.'
    },
    scissor_cross: {
        id: 'scissor_cross',
        name: 'Ножницы',
        enName: 'Scissor Cross-Slash',
        cdMs: 8000,
        stamina: 25,
        dmgMult: 2.2,
        anim: 'spell_engine:weapon_dual_slash_cross',
        animSpeed: 1.2,
        desc: 'Скрещенный рассекающий удар двумя клинками: 2x 110% урона и наложение Глубоких Ран (-30% регенерации).'
    },
    shadow_step: {
        id: 'shadow_step',
        name: 'Теневой Шаг',
        enName: 'Shadow Step',
        cdMs: 8000,
        stamina: 20,
        dmgMult: 2.0,
        anim: 'spell_engine:dodge',
        animSpeed: 1.3,
        desc: 'Мгновенное смещение за спину цели (до 5.5б), невидимость на 1.2с и 100% гарантированный крит на следующий удар.'
    },
    reverse_sunder: {
        id: 'reverse_sunder',
        name: 'Реверсивный Раскол',
        enName: 'Reverse Sunder',
        cdMs: 10000,
        stamina: 30,
        dmgMult: 1.95,
        anim: 'spell_engine:two_handed_slash_vertical_slash',
        animSpeed: 1.0,
        desc: 'Возвратный вертикальный взмах снизу-вверх: 195% урона, сбивает блок врагов и накладывает Слабость II на 4с.'
    },

    // --------------------------------------------------------------------------
    // 5 RANGED BOW ARTS
    // --------------------------------------------------------------------------
    fan_barrage: {
        id: 'fan_barrage',
        name: 'Веерный Залп',
        enName: 'Fan Barrage',
        cdMs: 10000,
        stamina: 30,
        dmgMult: 1.6,
        anim: 'spell_engine:archery_release',
        animSpeed: 1.2,
        desc: 'Выпуск веера из 5 спектральных стрел по широкому конусу перед собой.'
    },
    piercing_shot: {
        id: 'piercing_shot',
        name: 'Бронебойный Выстрел',
        enName: 'Piercing Shot',
        cdMs: 12000,
        stamina: 35,
        dmgMult: 2.2,
        anim: 'spell_engine:archery_pull',
        animSpeed: 1.0,
        desc: 'Мощный бронебойный выстрел: стрела прошивает строй врагов насквозь по прямой до 25 блоков со 100% пробитием брони.'
    },
    arrow_rain: {
        id: 'arrow_rain',
        name: 'Град Стрел',
        enName: 'Arrow Rain',
        cdMs: 16000,
        stamina: 45,
        dmgMult: 1.7,
        anim: 'spell_engine:archery_upwards_release',
        animSpeed: 1.0,
        desc: 'Выстрел в зенит: через 1.2с на выбранную зону 6м обрушивается шквал из 12 стрел с замедлением.'
    },
    tactical_backstep: {
        id: 'tactical_backstep',
        name: 'Тактический Отскок',
        enName: 'Tactical Backstep',
        cdMs: 9000,
        stamina: 25,
        dmgMult: 1.5,
        anim: 'spell_engine:dodge',
        animSpeed: 1.3,
        desc: 'Отскок назад на 5 блоков с одновременным выстрелом контузящей стрелы (Замедление III на 3с).'
    },
    triple_shot: {
        id: 'triple_shot',
        name: 'Беглая Тройка',
        enName: 'Triple Rapid Shot',
        cdMs: 11000,
        stamina: 30,
        dmgMult: 1.8,
        anim: 'spell_engine:archery_release',
        animSpeed: 1.4,
        desc: 'Скорострельная очередь из 3 стрел подряд в одну точку с высокой кучностью.'
    },

    // --------------------------------------------------------------------------
    // 2 SHIELD ARTS & GUARD COUNTER
    // --------------------------------------------------------------------------
    shield_bash: {
        id: 'shield_bash',
        name: 'Таранный Натиск',
        enName: 'Shield Bash / Bull Rush',
        cdMs: 12000,
        stamina: 35,
        dmgMult: 1.6,
        anim: 'spell_engine:weapon_slam_jump',
        animSpeed: 1.1,
        desc: 'Рывок вперед со щитом на 5 блоков: сбивает врагов с ног, наносит урон от стойкости и оглушает на 2с.'
    },
    unwavering_bulwark: {
        id: 'unwavering_bulwark',
        name: 'Непоколебимый Оплот',
        enName: 'Unwavering Bulwark',
        cdMs: 20000,
        stamina: 40,
        dmgMult: 1.0,
        anim: 'spell_engine:dual_handed_weapon_cross',
        animSpeed: 1.0,
        desc: 'Защитная стойка на 3.5с: Сопротивление 80%, иммунитет к опрокидыванию, отражает 30% входящего урона.'
    },

    // --------------------------------------------------------------------------
    // HIGH-TIER ELEMENTAL RUNES (T4+)
    // --------------------------------------------------------------------------
    flame_vortex: {
        id: 'flame_vortex',
        name: 'Пламенный Вихрь',
        enName: 'Flame Vortex',
        cdMs: 12000,
        stamina: 35,
        dmgMult: 1.8,
        anim: 'spell_engine:one_handed_charge_weapon_spin',
        animSpeed: 1.1,
        desc: 'Огненный шторм вокруг игрока на 4.5 блока: поджигает врагов на 6с и наносит огненный урон.'
    },
    frost_stomp: {
        id: 'frost_stomp',
        name: 'Ледяная Поступь',
        enName: 'Frost Stomp',
        cdMs: 11000,
        stamina: 30,
        dmgMult: 1.7,
        anim: 'spell_engine:dual_handed_ground_release',
        animSpeed: 1.0,
        desc: 'Ледяной удар по земле: шипы льда в радиусе 5б, глубокая заморозка и замедление IV.'
    },
    lightning_smite: {
        id: 'lightning_smite',
        name: 'Громовой Раскат',
        enName: 'Lightning Smite',
        cdMs: 14000,
        stamina: 40,
        dmgMult: 2.2,
        anim: 'spell_engine:one_handed_sky_charge',
        animSpeed: 1.0,
        desc: 'Низвержение молнии в точку удара: 220% урона молнией и оглушающий шок.'
    },
    blood_harvest: {
        id: 'blood_harvest',
        name: 'Кровавая Жатва',
        enName: 'Blood Harvest',
        cdMs: 12000,
        stamina: 35,
        dmgMult: 1.6,
        anim: 'spell_engine:two_handed_slash_vertical_slash',
        animSpeed: 1.1,
        desc: 'Серповидный удар с вампиризмом: исцеляет заклинателя на 15% от нанесенного урона.'
    },
    holy_blade: {
        id: 'holy_blade',
        name: 'Священный Клинок',
        enName: 'Holy Blade',
        cdMs: 13000,
        stamina: 35,
        dmgMult: 2.0,
        anim: 'spell_engine:one_handed_area_release',
        animSpeed: 1.0,
        desc: 'Луч святой энергии: 200% урона (+50% по нежити/демонам) и Регенерация II на 4с.'
    },

    // --------------------------------------------------------------------------
    // COMPATIBILITY ALIASES
    // --------------------------------------------------------------------------
    seismic_cleave: { id: 'whirlwind_cleave', name: 'Вихревой Размах', enName: 'Whirlwind Cleave', cdMs: 12000, stamina: 40, dmgMult: 1.8, anim: 'spell_engine:two_handed_spinning', desc: 'Размашистый круговой клив.' },
    tectonic_rupture: { id: 'earth_sunder', name: 'Сотрясение Земли', enName: 'Earth Sunder', cdMs: 14000, stamina: 45, dmgMult: 2.0, anim: 'spell_engine:weapon_one_handed_slam', desc: 'Удар в землю с радиальной волной.' },
    shield_breaker: { id: 'severing_cleave', name: 'Рассекающий Клив', enName: 'Severing Cleave', cdMs: 11000, stamina: 35, dmgMult: 2.1, anim: 'spell_engine:weapon_cleave', desc: 'Мощный фронтальный дуговой удар.' },
    parry_counter: { id: 'reverse_sunder', name: 'Реверсивный Раскол', enName: 'Reverse Sunder', cdMs: 10000, stamina: 30, dmgMult: 1.95, anim: 'spell_engine:two_handed_slash_vertical_slash', desc: 'Возвратный вертикальный взмах.' },
    juggernaut_rush: { id: 'shield_bash', name: 'Таранный Натиск', enName: 'Shield Bash', cdMs: 12000, stamina: 35, dmgMult: 1.6, anim: 'spell_engine:weapon_slam_jump', desc: 'Таранный рывок со щитом.' }
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
    let maxStam = getPlayerMaxStamina(player);
    let newStam = current - amount;
    player.persistentData.putInt('elyrium_stamina', newStam);
    try {
        if (typeof player.causeFoodExhaustion === 'function') {
            player.causeFoodExhaustion(amount * 0.05);
        }
    } catch (e) {}
    updateStaminaBossBar(player, newStam, maxStam);
    return true;
}

// ------------------------------------------------------------------------------
// STAMINA POP-UP SERVER BOSSBAR
// ------------------------------------------------------------------------------

let J_ServerBossEvent = null;
let J_BossBarColor = null;
let J_BossBarOverlay = null;
let J_Component = null;
let isBossBarApiInitialized = false;

function initBossBarApi() {
    if (isBossBarApiInitialized) return;
    try {
        J_ServerBossEvent = Java.loadClass('net.minecraft.server.level.ServerBossEvent');
        J_BossBarColor = Java.loadClass('net.minecraft.world.BossEvent$BossBarColor');
        J_BossBarOverlay = Java.loadClass('net.minecraft.world.BossEvent$BossBarOverlay');
        J_Component = Java.loadClass('net.minecraft.network.chat.Component');
    } catch (e) {}
    isBossBarApiInitialized = true;
}

const PLAYER_STAMINA_BARS = new Map();

function updateStaminaBossBar(player, curStam, maxStam) {
    if (!player) return;
    try {
        player.sendData('elyrium:sync_stamina', { stamina: curStam, maxStamina: maxStam });
    } catch (eSync) {}
    initBossBarApi();
    if (!J_ServerBossEvent) return;

    let pUuid = String(player.uuid);
    let bar = PLAYER_STAMINA_BARS.get(pUuid);

    if (!bar) {
        try {
            let label = J_Component ? J_Component.literal(`⚡ Выносливость [${curStam} / ${maxStam}]`) : Text.of(`⚡ Выносливость [${curStam} / ${maxStam}]`);
            bar = new J_ServerBossEvent(label, J_BossBarColor.YELLOW, J_BossBarOverlay.PROGRESS);
            bar.setVisible(false);
            let rawPlayer = player.minecraftEntity || player;
            bar.addPlayer(rawPlayer);
            PLAYER_STAMINA_BARS.set(pUuid, bar);
        } catch (eInit) {
            return;
        }
    }

    let pData = player.persistentData;
    let progress = Math.max(0.0, Math.min(1.0, curStam / maxStam));

    if (curStam < maxStam) {
        pData.remove('elyrium_stamina_full_timestamp');
        let text = J_Component ? J_Component.literal(`⚡ Выносливость [${curStam} / ${maxStam}]`) : Text.of(`⚡ Выносливость [${curStam} / ${maxStam}]`);
        bar.setName(text);
        bar.setProgress(progress);
        if (!bar.isVisible()) {
            bar.setVisible(true);
        }
    } else {
        // 100% full: disappears after 2.5 seconds (2500ms)
        let fullTime = pData.getLong('elyrium_stamina_full_timestamp') || 0;
        let now = Date.now();
        if (fullTime === 0) {
            fullTime = now;
            pData.putLong('elyrium_stamina_full_timestamp', fullTime);
        }

        if (now - fullTime >= 2500) {
            if (bar.isVisible()) {
                bar.setVisible(false);
            }
        } else {
            let text = J_Component ? J_Component.literal(`⚡ Выносливость [${maxStam} / ${maxStam}]`) : Text.of(`⚡ Выносливость [${maxStam} / ${maxStam}]`);
            bar.setName(text);
            bar.setProgress(1.0);
            if (!bar.isVisible()) {
                bar.setVisible(true);
            }
        }
    }
}

// ------------------------------------------------------------------------------
// SKELETAL ANIMATION BROADCASTER (Network Sync)
// ------------------------------------------------------------------------------

function broadcastPlayerArtAnimation(player, animId, speed) {
    if (!player || !animId) return;
    let spd = speed || 1.0;

    // Local player animation
    try {
        player.sendData('elyrium:play_art_anim', { anim: animId, speed: spd });
    } catch (e1) {}

    // Broadcast to tracking players in 64 blocks
    try {
        let level = player.level;
        let box = AABB.of(player.x - 64, player.y - 64, player.z - 64, player.x + 64, player.y + 64, player.z + 64);
        let nearby = level.getEntitiesWithin(box);
        nearby.forEach(ent => {
            if (ent && ent.isPlayer() && ent.id !== player.id) {
                ent.sendData('elyrium:play_player_art_anim', { playerId: player.id, anim: animId, speed: spd });
            }
        });
    } catch (e2) {}
}

const Vec3 = Java.loadClass('net.minecraft.world.phys.Vec3');

function applyEntityMotion(entity, vx, vy, vz) {
    if (!entity) return;
    try {
        entity.setDeltaMovement(new Vec3(vx, vy, vz));
        entity.hasImpulse = true;
    } catch (e) {
        try {
            entity.setDeltaMovement(vx, vy, vz);
            entity.hasImpulse = true;
        } catch (e2) {}
    }
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

function isSpear(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = String(item.id).toLowerCase();
    return id.includes('spear') || id.includes('halberd') || id.includes('lance') ||
           id.includes('glaive') || id.includes('polearm') || id.includes('trident') ||
           id.includes('pike') || item.hasTag('c:tools/spears') || item.hasTag('c:spears');
}

function isBow(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = String(item.id).toLowerCase();
    return ((id.includes('bow') && !id.includes('bowl')) || id.includes('crossbow') ||
            item.hasTag('c:tools/bows') || item.hasTag('c:tools/crossbows') ||
            item.hasTag('minecraft:enchantable/bow') || item.hasTag('minecraft:enchantable/crossbow'));
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
    return isTwoHandedWeapon(item) || isOneHandedWeapon(item) || isBow(item) || isShield(item);
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

function getSafeStepDistance(level, startX, startY, startZ, normX, normZ, maxDist) {
    let safeDist = maxDist;
    for (let d = 1.0; d <= maxDist; d += 0.5) {
        let cx = Math.floor(startX + normX * d);
        let cy = Math.floor(startY);
        let cz = Math.floor(startZ + normZ * d);
        try {
            let bFeet = level.getBlock(cx, cy, cz);
            let bHead = level.getBlock(cx, cy + 1, cz);
            let feetBlocks = bFeet && bFeet.blockState && bFeet.blockState.blocksMotion();
            let headBlocks = bHead && bHead.blockState && bHead.blockState.blocksMotion();
            if (feetBlocks || headBlocks) {
                safeDist = Math.max(0.5, d - 0.9);
                break;
            }
        } catch (e) {}
    }
    return safeDist;
}

// ------------------------------------------------------------------------------
// RESOLVE INNATE ARCHETYPE WEAPON ART (Right-Click)
// ------------------------------------------------------------------------------

function resolveInnateWeaponArt(player, isAirborne) {
    let mainItem = player.mainHandItem;
    if (!mainItem || mainItem.isEmpty()) return null;

    let mainId = String(mainItem.id).toLowerCase();

    // 1. Bows & Crossbows: Piercing Shot (Силовой / Бронебойный Выстрел)
    if (isBow(mainItem)) {
        return 'piercing_shot';
    }

    // 2. Katanas: Phantom Thrust / Iai Slash (Фантомный Выпад)
    if (mainId.includes('katana') || mainId.includes('nodachi') || mainId.includes('uchigatana')) {
        return 'iai_slash';
    }

    // 3. Warhammers & Heavy Hammers: Earth Sunder / Ground Slam (Сотрясение Земли)
    if (mainId.includes('greathammer') || mainId.includes('warhammer') || mainId.includes('hammer') ||
        mainId.includes('maul') || mainId.includes('club')) {
        return 'earth_sunder';
    }

    // 3.1 Maces & Bludgeons: Crushing Uppercut (Сокрушительный Апперкот)
    if (mainId.includes('mace') || mainId.includes('fist') || mainId.includes('knuckle') || mainId.includes('flail')) {
        return 'crushing_uppercut';
    }

    // 4. Battleaxes & Greataxes: Severing Cleave (Рассекающий Клив)
    if (mainId.includes('battleaxe') || mainId.includes('greataxe') || mainId.includes('waraxe') ||
        (mainId.includes('axe') && !mainId.includes('pickaxe'))) {
        return 'severing_cleave';
    }

    // 5. Polearms & Spears: Armor-Piercing Thrust (Бронебойный Прокол)
    if (isSpear(mainItem)) {
        return 'piercing_thrust';
    }

    // 6. Daggers & Dual Blades: Scissor Cross-Slash (Ножницы) or Shadow Step
    if (mainId.includes('dagger') || mainId.includes('knife') || mainId.includes('sai') ||
        mainId.includes('stiletto') || mainId.includes('tanto') || mainId.includes('twinblade')) {
        return 'scissor_cross';
    }

    // 7. Rapiers & Finesse Blades: Shadow Step (Теневой Шаг)
    if (mainId.includes('rapier') || mainId.includes('saber') || mainId.includes('cutlass')) {
        return 'shadow_step';
    }

    // 8. Greatswords & Claymores: Whirlwind Cleave (Вихревой Размах)
    if (mainId.includes('claymore') || mainId.includes('greatsword') || mainId.includes('zweihander') ||
        mainId.includes('colossal') || mainId.includes('scythe') || isTwoHandedWeapon(mainItem)) {
        return 'whirlwind_cleave';
    }

    // 9. Standard Swords: Reverse Sunder (Реверсивный Раскол)
    return 'reverse_sunder';
}

// ------------------------------------------------------------------------------
// RESOLVE EXTRA RUNIC SLOT ART (Shift + Right-Click)
// ------------------------------------------------------------------------------

function getSlotWeaponArt(item, slotNum) {
    if (!item || item.isEmpty()) return null;
    let s = slotNum || 2;
    try {
        let tag = null;
        if (item.customData) tag = item.customData;
        else if (item.nbt) tag = item.nbt;
        if (!tag) {
            try {
                let DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents');
                let cd = item.get(DataComponents.CUSTOM_DATA);
                if (cd) tag = cd.copyTag();
            } catch (eCd) {}
        }
        if (tag) {
            let key = 'skd_art_' + s;
            if (tag.contains(key)) return String(tag.getString(key)).toLowerCase();
            if (s === 2) {
                if (tag.contains('elyrium_inscribed_art')) return String(tag.getString('elyrium_inscribed_art')).toLowerCase();
                if (tag.contains('skd_weapon_art')) return String(tag.getString('skd_weapon_art')).toLowerCase();
                if (tag.contains('weapon_art')) return String(tag.getString('weapon_art')).toLowerCase();
            }
        }
    } catch (e) {}
    return null;
}

function getInscribedWeaponArt(item) {
    return getSlotWeaponArt(item, 2);
}


// ------------------------------------------------------------------------------
// SPELL ENGINE COOLDOWN INTEGRATION
// ------------------------------------------------------------------------------

let J_SpellRegistry = null;
let J_ResourceLocation = null;
let J_SpellCooldownPacket = null;
let J_Platform = null;
try {
    J_SpellRegistry = Java.loadClass('net.spell_engine.api.spell.registry.SpellRegistry');
    J_ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation');
    J_SpellCooldownPacket = Java.loadClass('net.spell_engine.network.Packets$SpellCooldown');
    J_Platform = Java.loadClass('net.spell_engine.Platform');
} catch (eClass) {}

function syncSpellEngineCooldown(player, artId, cdMs) {
    if (!player || !artId || !cdMs) return;
    try {
        let rawPlayer = player.minecraftPlayer || player;
        let mcLevel = player.level ? (player.level.minecraftLevel || player.level) : (rawPlayer.level ? (rawPlayer.level.minecraftLevel || rawPlayer.level) : null);
        if (!rawPlayer || !mcLevel || !J_ResourceLocation) return;

        let cm = (typeof rawPlayer.getCooldownManager === 'function') ? rawPlayer.getCooldownManager() : ((typeof player.getCooldownManager === 'function') ? player.getCooldownManager() : null);
        let durTicks = Math.round(cdMs / 50);

        let spellList = ['elyrium:' + artId];
        if (artId === 'piercing_shot') {
            spellList.push('archers:power_shot');
            spellList.push('elyrium:fan_barrage');
        }

        spellList.forEach(spellStr => {
            let spellRl = J_ResourceLocation.parse(spellStr);
            if (cm) {
                if (J_SpellRegistry) {
                    try {
                        let registry = J_SpellRegistry.from(mcLevel);
                        if (registry) {
                            let opt = registry.getHolder(spellRl);
                            if (opt && opt.isPresent()) {
                                cm.set(opt.get(), durTicks, true);
                            }
                        }
                    } catch (eReg) {}
                }
                try {
                    cm.set(spellRl, durTicks, true);
                } catch (eRl) {}
            }

            if (J_SpellCooldownPacket && J_Platform) {
                try {
                    let pkt = new J_SpellCooldownPacket(spellRl, durTicks);
                    J_Platform.util().networkS2C_Send(rawPlayer, pkt);
                } catch (ePkt) {}
            }
        });
    } catch (eSync) {}
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

    // Sync Cooldown to Spell Engine Cooldown Manager (updates HUD spell icon & client)
    syncSpellEngineCooldown(player, resolvedId, art.cdMs);

    // Broadcast Real Skeletal Animation
    broadcastPlayerArtAnimation(player, art.anim, art.animSpeed || 1.0);

    let baseDmg = getWeaponBaseDamage(player);
    let level = player.level;
    let look = player.getLookAngle();
    let u = player.username;
    let curStam = getPlayerStamina(player);
    let maxStam = getPlayerMaxStamina(player);
    let stamTag = `§8[⚡ ${curStam}/${maxStam}]`;

    // ==========================================================================
    // 1. WHIRLWIND CLEAVE (Вихревой Размах: 360° sweep 4.5b, 180% dmg, knockback)
    // ==========================================================================
    if (resolvedId === 'whirlwind_cleave') {
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
        player.sendSystemMessage(Text.of(`§6🌪 ВИХРЕВОЙ РАЗМАХ! §fУрон: §e${Math.round(totalDmg)} §7(×1.8) | Врагов: §a${hits} ${stamTag}`), true);

    // ==========================================================================
    // 2. IAI SLASH / PHANTOM THRUST (Фантомный Выпад: 6b dash, 190% dmg, bleed)
    // ==========================================================================
    } else if (resolvedId === 'iai_slash') {
        let totalDmg = baseDmg * art.dmgMult;
        let hLen = Math.max(0.01, Math.sqrt(look.x * look.x + look.z * look.z));
        let normX = look.x / hLen;
        let normZ = look.z / hLen;

        let startX = player.x;
        let startY = player.y;
        let startZ = player.z;

        let stepDist = getSafeStepDistance(level, startX, startY, startZ, normX, normZ, 6.0);
        let targetX = startX + normX * stepDist;
        let targetY = startY;
        let targetZ = startZ + normZ * stepDist;

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
                try {
                    ent.potionEffects.add('apothic_attributes:bleeding', 100, 1, false, true);
                } catch (e) {
                    ent.potionEffects.add('minecraft:wither', 100, 1, false, true);
                }
                hits++;
            }
        });

        player.server.runCommandSilent(`playsound minecraft:entity.player.attack.crit player ${u} ${targetX} ${targetY} ${targetZ} 1.5 1.5`);
        player.server.runCommandSilent(`playsound minecraft:item.trident.throw player ${u} ${targetX} ${targetY} ${targetZ} 1.2 1.3`);
        player.server.runCommandSilent(`particle minecraft:sweep_attack ${targetX} ${targetY + 1} ${targetZ} 1.2 0.3 1.2 0.1 20 normal`);
        player.server.runCommandSilent(`particle minecraft:flash ${targetX} ${targetY + 1} ${targetZ} 0.1 0.1 0.1 0 1 normal`);
        player.server.runCommandSilent(`particle minecraft:crimson_spore ${targetX} ${targetY + 1} ${targetZ} 0.8 0.5 0.8 0.1 25 normal`);
        player.sendSystemMessage(Text.of(`§b⚡ ФАНТОМНЫЙ ВЫПАД! §fУрон: §e${Math.round(totalDmg)} §7(×1.9) + Кровотечение | Задето: §a${hits} ${stamTag}`), true);

    // ==========================================================================
    // 3. SEVERING CLEAVE (Рассекающий Клив: 120° frontal arc 4m, 210% dmg, 40% armor bypass)
    // ==========================================================================
    } else if (resolvedId === 'severing_cleave') {
        let totalDmg = baseDmg * art.dmgMult;
        let radius = 4.0;
        let aabb = AABB.of(player.x - radius, player.y - 1.5, player.z - radius, player.x + radius, player.y + 2.5, player.z + radius);
        let ents = level.getEntitiesWithin(aabb);
        let hits = 0;

        ents.forEach(ent => {
            if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive()) {
                let dx = ent.x - player.x;
                let dz = ent.z - player.z;
                let dist = Math.max(0.1, Math.sqrt(dx * dx + dz * dz));
                if (dist <= radius) {
                    let dot = (dx * look.x + dz * look.z) / dist;
                    if (dot > -0.2) { // 120+ degree cone
                        dealArtDamage(player, ent, totalDmg * 0.40, true);  // 40% true dmg
                        dealArtDamage(player, ent, totalDmg * 0.60, false); // 60% phys dmg
                        ent.potionEffects.add('minecraft:slowness', 40, 2, false, true);
                        hits++;
                    }
                }
            }
        });

        player.server.runCommandSilent(`playsound minecraft:item.shield.break player ${u} ${player.x} ${player.y} ${player.z} 1.4 0.9`);
        player.server.runCommandSilent(`playsound minecraft:entity.generic.explode player ${u} ${player.x} ${player.y} ${player.z} 0.9 1.4`);
        player.server.runCommandSilent(`particle minecraft:sweep_attack ${player.x + look.x * 2} ${player.y + 1} ${player.z + look.z * 2} 1.2 0.2 1.2 0.1 20 normal`);
        player.server.runCommandSilent(`particle minecraft:crit ${player.x + look.x * 2} ${player.y + 1} ${player.z + look.z * 2} 1.0 0.5 1.0 0.2 30 normal`);
        player.sendSystemMessage(Text.of(`§c🪓 РАССЕКАЮЩИЙ КЛИВ! §fУрон: §e${Math.round(totalDmg)} §7(Игнор 40% брони) | Поражено: §a${hits} ${stamTag}`), true);

    // ==========================================================================
    // 4. EARTH SUNDER (Сотрясение Земли: 5m radial wave, 200% dmg, knocks up, Slowness IV)
    // ==========================================================================
    } else if (resolvedId === 'earth_sunder') {
        let radius = 5.0;
        let totalDmg = baseDmg * art.dmgMult;
        let aabb = AABB.of(player.x - radius, player.y - 2.0, player.z - radius, player.x + radius, player.y + 2.5, player.z + radius);
        let ents = level.getEntitiesWithin(aabb);
        let hits = 0;

        ents.forEach(ent => {
            if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive()) {
                dealArtDamage(player, ent, totalDmg, false);
                applyEntityMotion(ent, 0, 0.85, 0);
                ent.potionEffects.add('minecraft:slowness', 60, 3, false, true);
                hits++;
            }
        });

        player.server.runCommandSilent(`playsound minecraft:entity.generic.explode player ${u} ${player.x} ${player.y} ${player.z} 1.4 0.8`);
        player.server.runCommandSilent(`playsound minecraft:block.stone.break player ${u} ${player.x} ${player.y} ${player.z} 1.5 0.6`);
        player.server.runCommandSilent(`particle minecraft:explosion ${player.x} ${player.y + 0.2} ${player.z} 1.2 0.3 1.2 0 4 normal`);
        player.server.runCommandSilent(`particle minecraft:block minecraft:dirt ${player.x} ${player.y + 0.4} ${player.z} 2.0 0.6 2.0 0.25 40 normal`);
        player.server.runCommandSilent(`particle minecraft:large_smoke ${player.x} ${player.y + 0.4} ${player.z} 1.5 0.3 1.5 0.1 20 normal`);
        player.sendSystemMessage(Text.of(`§8🌋 СОТРЯСЕНИЕ ЗЕМЛИ! §fУрон: §e${Math.round(totalDmg)} §7(×2.0) | В воздухе: §a${hits} ${stamTag}`), true);

    // ==========================================================================
    // 5. CRUSHING UPPERCUT (Сокрушительный Апперкот: 220% dmg, launches 4b, stuns 2s)
    // ==========================================================================
    } else if (resolvedId === 'crushing_uppercut') {
        let totalDmg = baseDmg * art.dmgMult;
        let reach = 3.5;
        let cx = player.x + look.x * 2.0;
        let cy = player.y;
        let cz = player.z + look.z * 2.0;
        let box = AABB.of(cx - 1.5, cy - 1.0, cz - 1.5, cx + 1.5, cy + 2.5, cz + 1.5);
        let ents = level.getEntitiesWithin(box);
        let hits = 0;

        ents.forEach(ent => {
            if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive() && hits === 0) {
                dealArtDamage(player, ent, totalDmg, false);
                applyEntityMotion(ent, look.x * 0.3, 1.15, look.z * 0.3);
                ent.potionEffects.add('minecraft:slowness', 40, 4, false, true);
                ent.potionEffects.add('minecraft:weakness', 40, 2, false, true);
                hits++;
            }
        });

        player.server.runCommandSilent(`playsound minecraft:entity.player.attack.knockback player ${u} ${player.x} ${player.y} ${player.z} 1.5 0.9`);
        player.server.runCommandSilent(`playsound minecraft:block.anvil.land player ${u} ${player.x} ${player.y} ${player.z} 1.2 1.4`);
        player.server.runCommandSilent(`particle minecraft:explosion ${cx} ${cy + 1} ${cz} 0.5 0.5 0.5 0 2 normal`);
        player.server.runCommandSilent(`particle minecraft:crit ${cx} ${cy + 1} ${cz} 0.8 0.8 0.8 0.2 25 normal`);
        player.sendSystemMessage(Text.of(`§e💥 СОКРУШИТЕЛЬНЫЙ АППЕРКОТ! §fУрон: §e${Math.round(totalDmg)} §7(×2.2, Стан 2с) | Цель запущена ввысь ${stamTag}`), true);

    // ==========================================================================
    // 6. PIERCING THRUST (Бронебойный Прокол: 5.5b thrust, 100% armor bypass)
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
                    dealArtDamage(player, ent, totalDmg, true); // 100% Armor Bypass
                    ent.knockback(0.8, -normX, -normZ);
                    hits++;
                }
            });
        }

        player.server.runCommandSilent(`playsound minecraft:item.trident.pierce player ${u} ${player.x} ${player.y} ${player.z} 1.4 1.4`);
        player.server.runCommandSilent(`playsound minecraft:entity.arrow.hit_player player ${u} ${player.x} ${player.y} ${player.z} 1.2 1.6`);
        player.sendSystemMessage(Text.of(`§e🔱 БРОНЕБОЙНЫЙ ПРОКОЛ! §fЧистый урон (100% пробитие): §e${Math.round(totalDmg)} §7| Поражено: §a${hits} ${stamTag}`), true);

    // ==========================================================================
    // 7. SCISSOR CROSS (Ножницы: 2x 110% = 220% dmg + Deep Wounds)
    // ==========================================================================
    } else if (resolvedId === 'scissor_cross') {
        let totalDmg = baseDmg * art.dmgMult;
        let radius = 3.5;
        let aabb = AABB.of(player.x - radius, player.y - 1.2, player.z - radius, player.x + radius, player.y + 2.2, player.z + radius);
        let ents = level.getEntitiesWithin(aabb);
        let hits = 0;

        ents.forEach(ent => {
            if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive()) {
                let dx = ent.x - player.x;
                let dz = ent.z - player.z;
                let dist = Math.max(0.1, Math.sqrt(dx * dx + dz * dz));
                if (dist <= radius) {
                    let dot = (dx * look.x + dz * look.z) / dist;
                    if (dot > 0.25) {
                        dealArtDamage(player, ent, totalDmg * 0.5, false); // strike 1
                        dealArtDamage(player, ent, totalDmg * 0.5, false); // strike 2
                        ent.potionEffects.add('minecraft:wither', 80, 1, false, true);
                        ent.potionEffects.add('minecraft:weakness', 80, 1, false, true);
                        hits++;
                    }
                }
            }
        });

        player.server.runCommandSilent(`playsound minecraft:item.trident.throw player ${u} ${player.x} ${player.y} ${player.z} 1.4 1.6`);
        player.server.runCommandSilent(`particle minecraft:sweep_attack ${player.x + look.x * 1.5} ${player.y + 1} ${player.z + look.z * 1.5} 0.8 0.4 0.8 0.1 20 normal`);
        player.server.runCommandSilent(`particle minecraft:flash ${player.x + look.x * 1.5} ${player.y + 1} ${player.z + look.z * 1.5} 0.1 0.1 0.1 0 1 normal`);
        player.sendSystemMessage(Text.of(`§c⚔ НОЖНИЦЫ! §fПерекрестный удар: §e${Math.round(totalDmg)} §7(2×110%) + Глубокие раны | Задето: §a${hits} ${stamTag}`), true);

    // ==========================================================================
    // 8. SHADOW STEP (Теневой Шаг: blink 5.5b behind target, 1.2s stealth, 100% crit)
    // ==========================================================================
    } else if (resolvedId === 'shadow_step') {
        let maxRange = 5.5;
        let searchBox = AABB.of(player.x - maxRange, player.y - 2, player.z - maxRange, player.x + maxRange, player.y + 3, player.z + maxRange);
        let nearby = level.getEntitiesWithin(searchBox);
        let bestTarget = null;
        let bestDot = 0.25;

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
            let tLook = bestTarget.getLookAngle ? bestTarget.getLookAngle() : { x: 0, y: 0, z: 1 };
            targetX = bestTarget.x - tLook.x * 1.3;
            targetY = bestTarget.y;
            targetZ = bestTarget.z - tLook.z * 1.3;
            player.teleportTo(player.level.dimension, targetX, targetY, targetZ, bestTarget.yaw, player.pitch);
        } else {
            let stepDist = getSafeStepDistance(level, player.x, player.y, player.z, look.x, look.z, maxRange);
            targetX = player.x + look.x * stepDist;
            targetY = player.y;
            targetZ = player.z + look.z * stepDist;
            player.teleportTo(player.level.dimension, targetX, targetY, targetZ, player.yaw, player.pitch);
        }

        player.potionEffects.add('minecraft:invisibility', 25, 0, false, false);
        player.potionEffects.add('minecraft:speed', 40, 1, false, false);
        player.persistentData.putLong('skd_shadow_step_crit_until', now + 3000);

        player.server.runCommandSilent(`playsound minecraft:entity.enderman.teleport player ${u} ${targetX} ${targetY} ${targetZ} 1.2 1.2`);
        player.server.runCommandSilent(`particle minecraft:portal ${targetX} ${targetY + 1} ${targetZ} 0.6 0.8 0.6 0.1 30 normal`);
        player.server.runCommandSilent(`particle minecraft:smoke ${targetX} ${targetY + 1} ${targetZ} 0.5 0.5 0.5 0.05 15 normal`);
        player.sendSystemMessage(Text.of(`§5🌑 ТЕНЕВОЙ ШАГ! §d(Смещение за спину + Невидимость 1.2с + 100% Крит) ${stamTag}`), true);

    // ==========================================================================
    // 9. REVERSE SUNDER (Реверсивный Раскол: rising vertical slash, 195% dmg, Weakness II)
    // ==========================================================================
    } else if (resolvedId === 'reverse_sunder') {
        let totalDmg = baseDmg * art.dmgMult;
        let reach = 3.8;
        let cx = player.x + look.x * 2.0;
        let cy = player.y;
        let cz = player.z + look.z * 2.0;
        let box = AABB.of(cx - 1.6, cy - 1.2, cz - 1.6, cx + 1.6, cy + 2.5, cz + 1.6);
        let ents = level.getEntitiesWithin(box);
        let hits = 0;

        ents.forEach(ent => {
            if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive()) {
                dealArtDamage(player, ent, totalDmg, false);
                ent.potionEffects.add('minecraft:weakness', 80, 1, false, true);
                ent.potionEffects.add('minecraft:mining_fatigue', 60, 2, false, true);
                applyEntityMotion(ent, 0, 0.45, 0);
                hits++;
            }
        });

        player.server.runCommandSilent(`playsound minecraft:entity.player.attack.sweep player ${u} ${player.x} ${player.y} ${player.z} 1.4 1.2`);
        player.server.runCommandSilent(`particle minecraft:sweep_attack ${cx} ${cy + 1} ${cz} 0.8 0.5 0.8 0.1 20 normal`);
        player.server.runCommandSilent(`particle minecraft:crit ${cx} ${cy + 1} ${cz} 0.6 0.4 0.6 0.15 25 normal`);
        player.sendSystemMessage(Text.of(`§6⚔ РЕВЕРСИВНЫЙ РАСКОЛ! §fУрон: §e${Math.round(totalDmg)} §7(Сбив защиты + Слабость II) | Задето: §a${hits} ${stamTag}`), true);

    // ==========================================================================
    // 10. FAN BARRAGE (Веерный Залп: 5 spectral arrows in a cone)
    // ==========================================================================
    } else if (resolvedId === 'fan_barrage') {
        let angles = [-18, -9, 0, 9, 18];
        let speed = 2.5;
        let arrowDmg = baseDmg * 0.8;

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
                    applyEntityMotion(arrow, vx, vy, vz);
                    try { arrow.setOwner(player); } catch (e) {}
                    try { arrow.setBaseDamage(arrowDmg); } catch (e) {}
                    try { arrow.pickup = 0; } catch (e) {}
                    arrow.spawn();
                    return;
                }
            } catch (e) {}

            player.server.runCommandSilent(`execute at ${u} run summon minecraft:spectral_arrow ${sx.toFixed(2)} ${sy.toFixed(2)} ${sz.toFixed(2)} {damage:${arrowDmg.toFixed(1)}d,pickup:0b,Motion:[${vx.toFixed(3)},${vy.toFixed(3)},${vz.toFixed(3)}]}`);
        });

        player.server.runCommandSilent(`playsound minecraft:entity.arrow.shoot player ${u} ${player.x} ${player.y} ${player.z} 1.2 0.8`);
        player.server.runCommandSilent(`particle minecraft:crit ${player.x + look.x} ${player.y + 1.2} ${player.z + look.z} 0.5 0.5 0.5 0.1 20 normal`);
        player.sendSystemMessage(Text.of(`§a🏹 ВЕЕРНЫЙ ЗАЛП! §f5 спектральных стрел веером ${stamTag}`), true);

    // ==========================================================================
    // 11. PIERCING SHOT (Бронебойный / Силовой Выстрел: 25b piercing beam, 100% armor bypass, 220% dmg)
    // ==========================================================================
    } else if (resolvedId === 'piercing_shot') {
        let totalDmg = baseDmg * art.dmgMult;
        let maxDist = 25.0;
        let hLen = Math.max(0.01, Math.sqrt(look.x * look.x + look.y * look.y + look.z * look.z));
        let nx = look.x / hLen;
        let ny = look.y / hLen;
        let nz = look.z / hLen;

        player.server.runCommandSilent(`playsound minecraft:item.crossbow.loading_middle player ${u} ~ ~ ~ 1.1 1.2`);
        player.server.runCommandSilent(`particle minecraft:crit ${player.x + nx * 0.8} ${player.y + player.eyeHeight - 0.1} ${player.z + nz * 0.8} 0.2 0.2 0.2 0.1 8 normal`);

        player.server.scheduleInTicks(7, () => {
            if (!player || !player.isAlive()) return;

            // Broadcast arrow release animation
            broadcastPlayerArtAnimation(player, 'spell_engine:archery_release', 1.2);

            // Re-evaluate aim at release tick for perfect crosshair accuracy
            let curLook = player.getLookAngle();
            let curHLen = Math.max(0.01, Math.sqrt(curLook.x * curLook.x + curLook.y * curLook.y + curLook.z * curLook.z));
            let rnx = curLook.x / curHLen;
            let rny = curLook.y / curHLen;
            let rnz = curLook.z / curHLen;

            let hitEntities = new Set();
            let hits = 0;

            for (let d = 1.0; d <= maxDist; d += 1.0) {
                let px = player.x + rnx * d;
                let py = player.y + player.eyeHeight - 0.1 + rny * d;
                let pz = player.z + rnz * d;

                player.server.runCommandSilent(`particle minecraft:sonic_boom ${px} ${py} ${pz} 0 0 0 0 1 normal`);
                player.server.runCommandSilent(`particle minecraft:crit ${px} ${py} ${pz} 0.15 0.15 0.15 0.05 3 normal`);

                let b = AABB.of(px - 1.2, py - 1.2, pz - 1.2, px + 1.2, py + 1.2, pz + 1.2);
                let ents = level.getEntitiesWithin(b);
                ents.forEach(ent => {
                    if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive() && !hitEntities.has(ent.id)) {
                        hitEntities.add(ent.id);
                        dealArtDamage(player, ent, totalDmg, true); // 100% Armor Bypass
                        ent.knockback(0.9, -rnx, -rnz);
                        hits++;
                    }
                });
            }

            player.server.runCommandSilent(`playsound minecraft:entity.warden.sonic_boom player ${u} ${player.x} ${player.y} ${player.z} 1.2 1.4`);
            player.server.runCommandSilent(`playsound minecraft:entity.arrow.shoot player ${u} ${player.x} ${player.y} ${player.z} 1.5 0.6`);
            player.sendSystemMessage(Text.of(`§a🎯 СИЛОВОЙ ВЫСТРЕЛ! §fЧистый урон: §e${Math.round(totalDmg)} §7(25 блоков пробоя) | Поражено: §a${hits} ${stamTag}`), true);
        });

    // ==========================================================================
    // 12. ARROW RAIN (Град Стрел: skyward shot, 12-arrow rain strikes 6m area after 1.2s)
    // ==========================================================================
    } else if (resolvedId === 'arrow_rain') {
        let totalDmg = baseDmg * art.dmgMult;
        let targetX = player.x + look.x * 12.0;
        let targetY = player.y;
        let targetZ = player.z + look.z * 12.0;

        player.server.runCommandSilent(`playsound minecraft:entity.arrow.shoot player ${u} ${player.x} ${player.y} ${player.z} 1.5 1.5`);
        player.server.runCommandSilent(`particle minecraft:cloud ${player.x} ${player.y + 2.5} ${player.z} 0.3 0.8 0.3 0.1 20 normal`);

        // Delayed strike at target coordinates
        player.server.scheduleInTicks(24, () => {
            if (!level) return;
            let radius = 6.0;
            let rainBox = AABB.of(targetX - radius, targetY - 2.0, targetZ - radius, targetX + radius, targetY + 3.0, targetZ + radius);
            let ents = level.getEntitiesWithin(rainBox);
            let hits = 0;

            ents.forEach(ent => {
                if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive()) {
                    dealArtDamage(player, ent, totalDmg, false);
                    ent.potionEffects.add('minecraft:slowness', 80, 2, false, true);
                    hits++;
                }
            });

            level.server.runCommandSilent(`playsound minecraft:entity.arrow.hit_player ambient @a ${targetX} ${targetY} ${targetZ} 1.5 1.2`);
            for (let i = 0; i < 12; i++) {
                let rx = targetX + (Math.random() - 0.5) * 8.0;
                let rz = targetZ + (Math.random() - 0.5) * 8.0;
                level.server.runCommandSilent(`particle minecraft:crit ${rx} ${targetY + 1} ${rz} 0.2 1.2 0.2 0.2 10 normal`);
            }
            player.sendSystemMessage(Text.of(`§a🌧 ГРАД СТРЕЛ ОБРУШИЛСЯ! §fПоражено целей: §e${hits}`), true);
        });

        player.sendSystemMessage(Text.of(`§a🏹 ГРАД СТРЕЛ ВЫПУЩЕН В ЗЕНИТ! §7(Удар через 1.2с в зону прицела) ${stamTag}`), true);

    // ==========================================================================
    // 13. TACTICAL BACKSTEP (Тактический Отскок: 5b backward evasion + concussive arrow)
    // ==========================================================================
    } else if (resolvedId === 'tactical_backstep') {
        let totalDmg = baseDmg * art.dmgMult;
        let hLen = Math.max(0.01, Math.sqrt(look.x * look.x + look.z * look.z));
        let normX = look.x / hLen;
        let normZ = look.z / hLen;

        // Backward leap
        applyEntityMotion(player, -normX * 1.35, 0.38, -normZ * 1.35);

        // Shoot concussive slowing spectral arrow forward
        let sx = player.x + look.x * 0.5;
        let sy = player.y + player.eyeHeight - 0.1;
        let sz = player.z + look.z * 0.5;
        let vx = look.x * 2.8;
        let vy = look.y * 2.8;
        let vz = look.z * 2.8;

        player.server.runCommandSilent(`execute at ${u} run summon minecraft:spectral_arrow ${sx.toFixed(2)} ${sy.toFixed(2)} ${sz.toFixed(2)} {damage:${totalDmg.toFixed(1)}d,pickup:0b,Motion:[${vx.toFixed(3)},${vy.toFixed(3)},${vz.toFixed(3)}]}`);
        player.server.runCommandSilent(`playsound minecraft:entity.arrow.shoot player ${u} ${player.x} ${player.y} ${player.z} 1.2 1.2`);
        player.server.runCommandSilent(`particle minecraft:poof ${player.x} ${player.y + 0.5} ${player.z} 0.5 0.2 0.5 0.05 15 normal`);
        player.sendSystemMessage(Text.of(`§a💨 ТАКТИЧЕСКИЙ ОТСКОК! §fОтскок назад + Контузящая стрела ${stamTag}`), true);

    // ==========================================================================
    // 14. TRIPLE RAPID SHOT (Беглая Тройка: 3-arrow burst)
    // ==========================================================================
    } else if (resolvedId === 'triple_shot') {
        let arrowDmg = baseDmg * 0.75;
        for (let t = 0; t < 3; t++) {
            player.server.scheduleInTicks(t * 3, () => {
                if (!player || !player.isAlive()) return;
                let curLook = player.getLookAngle();
                let sx = player.x + curLook.x * 0.4;
                let sy = player.y + player.eyeHeight - 0.1;
                let sz = player.z + curLook.z * 0.4;
                let speed = 3.2;
                let vx = curLook.x * speed;
                let vy = curLook.y * speed;
                let vz = curLook.z * speed;

                player.server.runCommandSilent(`execute at ${u} run summon minecraft:spectral_arrow ${sx.toFixed(2)} ${sy.toFixed(2)} ${sz.toFixed(2)} {damage:${arrowDmg.toFixed(1)}d,pickup:0b,Motion:[${vx.toFixed(3)},${vy.toFixed(3)},${vz.toFixed(3)}]}`);
                player.server.runCommandSilent(`playsound minecraft:entity.arrow.shoot player ${u} ${player.x} ${player.y} ${player.z} 1.2 ${1.0 + t * 0.2}`);
                player.server.runCommandSilent(`particle minecraft:crit ${sx} ${sy} ${sz} 0.2 0.2 0.2 0.05 6 normal`);
            });
        }
        player.sendSystemMessage(Text.of(`§a🏹 БЕГЛАЯ ТРОЙКА! §fОчередь из 3 скорострельных стрел ${stamTag}`), true);

    // ==========================================================================
    // 15. SHIELD BASH (Таранный Натиск: 5b forward shield charge, stuns 2s)
    // ==========================================================================
    } else if (resolvedId === 'shield_bash') {
        let totalDmg = baseDmg * art.dmgMult;
        let hLen = Math.max(0.01, Math.sqrt(look.x * look.x + look.z * look.z));
        let normX = look.x / hLen;
        let normZ = look.z / hLen;

        player.potionEffects.add('minecraft:resistance', 60, 1, false, true);
        applyEntityMotion(player, normX * 1.6, 0.15, normZ * 1.6);

        let hitEntities = new Set();
        let hits = 0;
        for (let i = 1; i <= 6; i++) {
            let cx = player.x + normX * i;
            let cy = player.y;
            let cz = player.z + normZ * i;

            let cBox = AABB.of(cx - 1.8, cy - 1.0, cz - 1.8, cx + 1.8, cy + 2.5, cz + 1.8);
            let ents = level.getEntitiesWithin(cBox);
            ents.forEach(ent => {
                if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive() && !hitEntities.has(ent.id)) {
                    hitEntities.add(ent.id);
                    dealArtDamage(player, ent, totalDmg, false);
                    ent.knockback(1.1, normX, normZ);
                    ent.potionEffects.add('minecraft:slowness', 40, 4, false, true);
                    hits++;
                }
            });
        }

        player.server.runCommandSilent(`playsound minecraft:item.shield.block player ${u} ${player.x} ${player.y} ${player.z} 1.5 0.8`);
        player.server.runCommandSilent(`playsound minecraft:entity.generic.explode player ${u} ${player.x} ${player.y} ${player.z} 0.9 1.2`);
        player.server.runCommandSilent(`particle minecraft:cloud ${player.x} ${player.y + 0.8} ${player.z} 1.0 0.4 1.0 0.1 25 normal`);
        player.sendSystemMessage(Text.of(`§c🛡 ТАРАННЫЙ НАТИСК! §fУрон: §e${Math.round(totalDmg)} §7(Стан 2с) | Раскинуто: §a${hits} ${stamTag}`), true);

    // ==========================================================================
    // 16. UNWAVERING BULWARK (Непоколебимый Оплот: 3.5s bastion stance, 80% res, 30% reflect)
    // ==========================================================================
    } else if (resolvedId === 'unwavering_bulwark') {
        player.potionEffects.add('minecraft:resistance', 70, 3, false, true); // Resistance IV = 80% damage reduction
        player.potionEffects.add('minecraft:slowness', 70, 4, false, true);

        player.persistentData.putLong('skd_unwavering_bulwark_until', now + 3500);

        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_netherite player ${u} ${player.x} ${player.y} ${player.z} 1.5 0.8`);
        player.server.runCommandSilent(`playsound minecraft:block.bell.use player ${u} ${player.x} ${player.y} ${player.z} 1.2 0.7`);
        player.server.runCommandSilent(`particle minecraft:enchanted_hit ${player.x} ${player.y + 1} ${player.z} 1.0 1.0 1.0 0.2 40 normal`);
        player.server.runCommandSilent(`particle minecraft:totem_of_undying ${player.x} ${player.y + 1} ${player.z} 0.8 0.8 0.8 0.1 25 normal`);
        player.sendSystemMessage(Text.of(`§6🏰 НЕПОКОЛЕБИМЫЙ ОПЛОТ! §f[Защита 80% + Отражение 30% входящего урона на 3.5с] ${stamTag}`), true);

    // ==========================================================================
    // 17. FLAME VORTEX (Пламенный Вихрь: 4.5b fire cyclone, ignites for 6s)
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
    // 18. FROST STOMP (Ледяная Поступь: 5m freeze shockwave, Slowness IV)
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
                hits++;
            }
        });

        player.server.runCommandSilent(`playsound minecraft:block.glass.break player ${u} ${player.x} ${player.y} ${player.z} 1.3 1.2`);
        player.server.runCommandSilent(`playsound minecraft:block.powder_snow.step player ${u} ${player.x} ${player.y} ${player.z} 1.5 0.7`);
        player.server.runCommandSilent(`particle minecraft:snowflake ${player.x} ${player.y + 0.5} ${player.z} 1.8 0.4 1.8 0.15 40 normal`);
        player.sendSystemMessage(Text.of(`§b❄ ЛЕДЯНАЯ ПОСТУПЬ! §fУрон: §e${Math.round(totalDmg)} §7+ Глубокая Заморозка | Врагов: §a${hits} ${stamTag}`), true);

    // ==========================================================================
    // 19. LIGHTNING SMITE (Громовой Раскат: lightning bolt strike, 220% dmg)
    // ==========================================================================
    } else if (resolvedId === 'lightning_smite') {
        let totalDmg = baseDmg * art.dmgMult;
        let targetX = player.x + look.x * 5.0;
        let targetY = player.y;
        let targetZ = player.z + look.z * 5.0;

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
    // 20. BLOOD HARVEST (Кровавая Жатва: crescent slash, 15% vampirism)
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
                    dealArtDamage(player, ent, totalDmg, false);
                    totalDealt += totalDmg;
                    hits++;
                }
            }
        });

        let healAmount = totalDealt * 0.15;
        if (healAmount > 0) {
            player.heal(healAmount);
        }

        player.server.runCommandSilent(`playsound minecraft:entity.wither.shoot player ${u} ${player.x} ${player.y} ${player.z} 1.0 1.5`);
        player.server.runCommandSilent(`particle minecraft:crimson_spore ${player.x + look.x * 1.5} ${player.y + 1} ${player.z + look.z * 1.5} 0.8 0.4 0.8 0.1 30 normal`);
        player.sendSystemMessage(Text.of(`§4🩸 КРОВАВАЯ ЖАТВА! §fУрон: §e${Math.round(totalDmg)} §7| Вампиризм: §a+${healAmount.toFixed(1)} HP | Целей: §c${hits} ${stamTag}`), true);

    // ==========================================================================
    // 21. HOLY BLADE (Священный Клинок: 200% sacred burst, +50% vs undead, Regen II)
    // ==========================================================================
    } else if (resolvedId === 'holy_blade') {
        let totalDmg = baseDmg * art.dmgMult;
        let radius = 5.0;
        let aabb = AABB.of(player.x - radius, player.y - 1.5, player.z - radius, player.x + radius, player.y + 2.5, player.z + radius);
        let ents = level.getEntitiesWithin(aabb);
        let hits = 0;

        ents.forEach(ent => {
            if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive()) {
                let finalDmg = totalDmg;
                let isUndeadOrDemon = false;
                try {
                    let typeStr = String(ent.type).toLowerCase();
                    isUndeadOrDemon = ent.isUndead() || typeStr.includes('zombie') || typeStr.includes('skeleton') || typeStr.includes('wither') || typeStr.includes('demon');
                } catch (e) {}

                if (isUndeadOrDemon) finalDmg *= 1.50;
                dealArtDamage(player, ent, finalDmg, true);
                hits++;
            }
        });

        player.potionEffects.add('minecraft:regeneration', 80, 1, false, true);
        player.server.runCommandSilent(`playsound minecraft:block.amethyst_block.chime player ${u} ${player.x} ${player.y} ${player.z} 1.4 1.2`);
        player.server.runCommandSilent(`particle minecraft:totem_of_undying ${player.x} ${player.y + 1} ${player.z} 0.8 0.5 0.8 0.2 30 normal`);
        player.sendSystemMessage(Text.of(`§e✨ СВЯЩЕННЫЙ КЛИНОК! §fСвятой урон: §e${Math.round(totalDmg)} §7+ Регенерация II | Задето: §a${hits} ${stamTag}`), true);
    }
}

// ------------------------------------------------------------------------------
// EVENT 1: COMBAT INTERACTIONS (GUARD COUNTER, SPEAR GRIP, BULWARK REFLECT)
// ------------------------------------------------------------------------------

EntityEvents.beforeHurt(event => {
    let source = event.source;
    if (!source) return;

    let victim = event.entity;
    let attacker = source.actual || source.player;
    let now = Date.now();

    // ==========================================================================
    // A. INCOMING DAMAGE TO PLAYER: SHIELD BLOCK & BULWARK REFLECT
    // ==========================================================================
    if (victim && victim.isPlayer() && victim.isAlive()) {
        // 1. Unwavering Bulwark Reflect (30% reflected damage)
        let bulwarkUntil = victim.persistentData.getLong('skd_unwavering_bulwark_until') || 0;
        if (bulwarkUntil > 0 && now <= bulwarkUntil && attacker && attacker.isLiving() && attacker !== victim) {
            let reflectedDmg = event.damage * 0.30;
            dealArtDamage(victim, attacker, Math.max(1.0, reflectedDmg), true);
            victim.server.runCommandSilent(`playsound minecraft:block.anvil.place player ${victim.username} ~ ~ ~ 1.2 1.4`);
            victim.server.runCommandSilent(`particle minecraft:crit ${attacker.x} ${attacker.y + 1} ${attacker.z} 0.5 0.5 0.5 0.1 15 normal`);
        }

        // 2. Shield Guard Counter Setup (Player successfully blocks incoming attack)
        if (victim.isBlocking() && attacker && attacker.isLiving() && attacker !== victim) {
            let offHand = victim.offHandItem;
            let mainHand = victim.mainHandItem;
            let hasShield = (offHand && isShield(offHand)) || (mainHand && isShield(mainHand));

            if (hasShield) {
                victim.persistentData.putLong('skd_guard_counter_window', now + 1500);
                victim.persistentData.putInt('skd_guard_counter_target_id', attacker.id);

                victim.server.runCommandSilent(`playsound minecraft:block.amethyst_block.hit player ${victim.username} ~ ~ ~ 1.2 1.6`);
                victim.server.runCommandSilent(`particle minecraft:electric_spark ${victim.x} ${victim.y + 1} ${victim.z} 0.4 0.4 0.4 0.1 12 normal`);
                victim.sendSystemMessage(Text.of('§e⚡ СТОЙКА КОНТРУДАРА! §f[Нажмите ЛКМ в течение 1.5с для контратаки +150%]'), true);
            }
        }
    }

    // ==========================================================================
    // B. OUTGOING DAMAGE FROM PLAYER: GUARD COUNTER, SPEAR GRIP, SHADOW CRIT
    // ==========================================================================
    if (attacker && attacker.isPlayer() && attacker.isAlive() && victim && victim.isAlive() && !victim.isPlayer()) {
        let mainHand = attacker.mainHandItem;
        let offHand = attacker.offHandItem;
        let hasShield = (offHand && isShield(offHand)) || (mainHand && isShield(mainHand));

        // Shield-equipped melee intercepts:
        if (hasShield) {
            // A. Shield raised with RMB -> Left-click triggers Shield Bash!
            if (attacker.isBlocking()) {
                executeWeaponArt(attacker, 'shield_bash', false, false);
                event.cancel();
                return;
            }
            // B. Shift + Left-click with shield -> Main hand innate weapon art!
            if (attacker.isCrouching()) {
                let innate = resolveInnateWeaponArt(attacker, false);
                if (innate && WEAPON_ARTS[innate]) {
                    executeWeaponArt(attacker, innate, false, false);
                    event.cancel();
                    return;
                }
            }
        }

        // 1. Guard Counter Execution: Left-click within 1.5s window after blocking
        let counterUntil = attacker.persistentData.getLong('skd_guard_counter_window') || 0;
        if (counterUntil > 0 && now <= counterUntil) {
            attacker.persistentData.remove('skd_guard_counter_window');
            attacker.persistentData.remove('skd_guard_counter_target_id');

            event.damage *= 2.5; // +150% damage bonus

            victim.potionEffects.add('minecraft:slowness', 60, 3, false, true);
            victim.potionEffects.add('minecraft:weakness', 60, 1, false, true);
            victim.potionEffects.add('minecraft:mining_fatigue', 60, 1, false, true);

            // Broadcast counter-attack animation
            broadcastPlayerArtAnimation(attacker, 'spell_engine:weapon_twinstrike_slash_1', 1.3);

            attacker.server.runCommandSilent(`playsound minecraft:entity.player.attack.crit player ${attacker.username} ~ ~ ~ 1.5 1.1`);
            attacker.server.runCommandSilent(`playsound minecraft:item.shield.block player ${attacker.username} ~ ~ ~ 1.4 1.6`);
            attacker.server.runCommandSilent(`particle minecraft:flash ${victim.x} ${victim.y + 1} ${victim.z} 0.1 0.1 0.1 0 1 normal`);
            attacker.server.runCommandSilent(`particle minecraft:crit ${victim.x} ${victim.y + 1} ${victim.z} 0.8 0.8 0.8 0.25 30 normal`);
            attacker.sendSystemMessage(Text.of('§6⚔ ГВАРДЕЙСКИЙ КОНТРУДАР! §f(+150% Урона, Оглушение врага на 3с)'), true);
        }

        // 2. Spear Mechanics (Universal Grip / Универсальный хват)
        if (mainHand && isSpear(mainHand)) {
            let hasShieldInOffhand = offHand && isShield(offHand);
            if (!hasShieldInOffhand) {
                // Two-Handed Power Grip (+15% physical damage, +1.0m reach)
                event.damage *= 1.15;
                attacker.server.runCommandSilent(`particle minecraft:enchanted_hit ${victim.x} ${victim.y + 1} ${victim.z} 0.3 0.3 0.3 0.1 10 normal`);
            } else {
                // Guard Thrust with Shield (-10% damage for impenetrable safety)
                event.damage *= 0.90;
                broadcastPlayerArtAnimation(attacker, 'spell_engine:weapon_thrust_charge', 1.3);
                attacker.server.runCommandSilent(`playsound minecraft:item.shield.block player ${attacker.username} ~ ~ ~ 0.8 1.4`);
                attacker.server.runCommandSilent(`particle minecraft:crit ${victim.x} ${victim.y + 1} ${victim.z} 0.3 0.3 0.3 0.05 8 normal`);
            }
        }

        // 3. Shadow Step Critical Strike: Next strike within 3s is guaranteed Crit
        let critUntil = attacker.persistentData.getLong('skd_shadow_step_crit_until') || 0;
        if (critUntil > 0 && now <= critUntil) {
            attacker.persistentData.remove('skd_shadow_step_crit_until');
            event.damage *= 2.0;

            attacker.server.runCommandSilent(`playsound minecraft:entity.player.attack.crit player ${attacker.username} ~ ~ ~ 1.5 1.2`);
            attacker.server.runCommandSilent(`particle minecraft:crit ${victim.x} ${victim.y + 1} ${victim.z} 0.6 0.6 0.6 0.2 25 normal`);
            attacker.sendSystemMessage(Text.of('§5🌑 УДАР ИЗ ТЕНИ! §d(100% Гарантированный Крит ×2.0)'), true);
        }

        // 4. Weaponmaster's Bench Reinforcement Scaling (+5% per rank)
        if (mainHand && !mainHand.isEmpty()) {
            let reinforce = 0;
            try {
                if (mainHand.nbt && mainHand.nbt.contains('skd_reinforce')) reinforce = mainHand.nbt.getInt('skd_reinforce');
                else if (mainHand.customData && mainHand.customData.contains('skd_reinforce')) reinforce = mainHand.customData.getInt('skd_reinforce');
            } catch (eR) {}
            if (reinforce > 0) {
                event.damage *= (1.0 + reinforce * 0.05);
            }
        }
    }
});

// ------------------------------------------------------------------------------
// EVENT 1.8: SPELL ENGINE CAST HOOK (Stamina & Physical Arts Sync)
// ------------------------------------------------------------------------------
try {
    let J_SpellEvents = Java.loadClass('net.spell_engine.api.spell.event.SpellEvents');
    if (J_SpellEvents && J_SpellEvents.SPELL_CAST) {
        J_SpellEvents.SPELL_CAST.register(args => {
            try {
                let p = null;
                if (args) {
                    if (args.caster) p = typeof args.caster === 'function' ? args.caster() : args.caster;
                    else if (args.player) p = typeof args.player === 'function' ? args.player() : args.player;
                }
                if (!p || !p.isAlive()) return;
                let spellHolder = null;
                if (args.spell) spellHolder = typeof args.spell === 'function' ? args.spell() : args.spell;
                let spellId = '';
                if (spellHolder) {
                    try {
                        let key = spellHolder.unwrapKey();
                        if (key && key.isPresent()) {
                            spellId = String(key.get().location());
                        } else if (spellHolder.value) {
                            let val = spellHolder.value();
                            if (val && val.id) spellId = String(val.id);
                        }
                    } catch (eKey) {
                        spellId = String(spellHolder);
                    }
                }

                if (spellId.startsWith('elyrium:') || spellId.startsWith('archers:')) {
                    let now = Date.now();
                    let lastDrain = p.persistentData.getLong('skd_last_stam_drain_time') || 0;
                    if (now - lastDrain < 350) {
                        // Already consumed by ItemEvents.rightClicked within debounce window
                        return;
                    }

                    let stamCost = 30;
                    if (spellId.includes('cleave') || spellId.includes('sunder')) stamCost = 35;
                    else if (spellId.includes('scissor') || spellId.includes('dagger')) stamCost = 25;
                    else if (spellId.includes('barrage')) stamCost = 30;

                    p.persistentData.putLong('skd_last_stam_drain_time', now);
                    if (!consumePlayerStamina(p, stamCost)) {
                        p.sendSystemMessage(Text.of('§c⚡ Недостаточно выносливости для боевого искусства!'), true);
                        p.server.runCommandSilent(`playsound minecraft:entity.player.breath player ${p.username} ~ ~ ~ 0.8 1.4`);
                    }
                }
            } catch (eInner) {}
        });
    }
} catch (eHook) {}

function applyItemCooldown(player, item, ticks) {
    try {
        if (!player || !item) return;
        let rawItem = item.getItem ? item.getItem() : item;
        if (player.addItemCooldown) {
            player.addItemCooldown(rawItem, ticks);
        } else if (player.cooldowns && player.cooldowns.add) {
            player.cooldowns.add(rawItem, ticks);
        } else if (player.getCooldowns) {
            player.getCooldowns().addCooldown(rawItem, ticks);
        }
    } catch (eCd) {}
}

// ------------------------------------------------------------------------------
// EVENT 2: RIGHT-CLICK TRIGGER CONTROLS (ПКМ & SHIFT+ПКМ)
// ------------------------------------------------------------------------------

ItemEvents.rightClicked(event => {
    let player = event.player;
    if (!player || !player.isAlive()) return;

    let item = event.item;
    if (!item || item.isEmpty()) return;

    if (event.hand && String(event.hand).toUpperCase().includes('OFF')) return;

    let mainHand = player.mainHandItem;
    if (!mainHand || mainHand.isEmpty() || !isAnyWeapon(mainHand)) return;

    let hit = event.target || (player.rayTrace ? player.rayTrace(5.0) : null);
    if (hit && hit.block && String(hit.block.id) === 'kubejs:infernal_anvil') {
        return;
    }

    let currentAge = (typeof player.age === 'number') ? player.age : (typeof player.tickCount === 'number' ? player.tickCount : 0);
    if (player.persistentData.getInt('skd_last_art_tick') === currentAge) return;

    let offHand = player.offHandItem;
    let isOffhandLocked = player.persistentData.getBoolean('skd_offhand_locked');
    let hasShieldInOffhand = offHand && isShield(offHand) && !isOffhandLocked;
    let isAirborne = (typeof player.onGround === 'function' ? !player.onGround() : !player.onGround) || player.fallDistance > 0.05;

    // --------------------------------------------------------------------------
    // Special Handling for Ranged Weapons (Bows & Crossbows):
    //   - [ПКМ] (without Shift): Pure vanilla bow drawing & shooting.
    //   - [Shift + ПКМ]: Innate Ranged Martial Art ('triple_shot' / Slot 2).
    //   - Cooldown & cancel prevents unwanted vanilla zero-velocity stray arrow!
    // --------------------------------------------------------------------------
    if (isBow(mainHand)) {
        if (player.isCrouching()) {
            player.persistentData.putInt('skd_last_art_tick', currentAge);
            player.persistentData.putLong('elyrium_last_bow_art_time', Date.now());
            applyItemCooldown(player, mainHand, 14);

            let art = getSlotWeaponArt(mainHand, 2) || resolveInnateWeaponArt(player, isAirborne);
            if (art && WEAPON_ARTS[art]) {
                executeWeaponArt(player, art, isAirborne, false);
            }
            event.cancel();
            return;
        } else {
            // Normal vanilla shooting: do not intercept
            return;
        }
    }

    // Control scheme for Melee:
    // With shield in offhand:
    //   - [ПКМ]: Standard vanilla shield block unhindered
    //   - [Shift + ПКМ]: Unhindered (no shield bash here!)
    //   - Shield Bash: Shield raised (RMB) + Left-Click (ЛКМ)
    //   - Innate Art: Shift + Left-Click (Shift + ЛКМ)
    // Without shield:
    //   - [ПКМ]: Innate weapon art (Slot 1)
    //   - [Shift + ПКМ]: Inlaid runic art (Slot 2)
    if (hasShieldInOffhand) {
        // Holding shield -> vanilla shield block unhindered (whether standing or crouching)
        return;
    } else {
        if (player.isCrouching()) {
            player.persistentData.putInt('skd_last_art_tick', currentAge);
            let inscribedArt = getSlotWeaponArt(mainHand, 2);
            if (inscribedArt && WEAPON_ARTS[inscribedArt]) {
                executeWeaponArt(player, inscribedArt, false, true);
            } else {
                player.sendSystemMessage(Text.of('§7В слоте 2 оружия нет боевого искусства §8[Shift+ПКМ / Z] §7(Инкрустируйте скрижаль на Оружейном Столе).'), true);
                player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ~ ~ ~ 0.5 1.8`);
            }
            return;
        } else {
            // [ПКМ] without crouch: Handled natively by Spell Engine (Slot 1 Innate Art).
            // Check weapon cooldown before consuming stamina or allowing action
            let rawItem = mainHand.getItem ? mainHand.getItem() : mainHand.item;
            let isOnCooldown = false;
            try {
                if (player.cooldowns && typeof player.cooldowns.isOnCooldown === 'function') {
                    isOnCooldown = player.cooldowns.isOnCooldown(rawItem) || player.cooldowns.isOnCooldown(mainHand);
                } else if (player.getCooldowns && typeof player.getCooldowns === 'function') {
                    isOnCooldown = player.getCooldowns().isOnCooldown(rawItem);
                }
            } catch (eCd) {}

            let innateArt = resolveInnateWeaponArt(player, isAirborne);
            let artData = innateArt ? WEAPON_ARTS[innateArt] : null;
            let resolvedId = (artData && artData.id) ? artData.id : innateArt;
            let now = Date.now();
            let cdEnd = player.persistentData.getLong('skd_cd_' + resolvedId) || 0;

            if (isOnCooldown || now < cdEnd) {
                return;
            }

            let stamCost = (artData && artData.stamina) ? artData.stamina : 30;
            let currentStam = getPlayerStamina(player);

            if (currentStam < stamCost) {
                event.cancel();
                player.sendSystemMessage(Text.of(`§c⚡ Недостаточно выносливости! Требуется: §e${stamCost} §c(У вас: §7${currentStam}§c)`), true);
                player.server.runCommandSilent(`playsound minecraft:entity.player.breath player ${player.username} ~ ~ ~ 0.8 1.4`);
                return;
            }

            player.persistentData.putInt('skd_last_art_tick', currentAge);
            player.persistentData.putLong('skd_last_stam_drain_time', now);
            if (artData) {
                player.persistentData.putLong('skd_cd_' + resolvedId, now + artData.cdMs);
                player.persistentData.putString('skd_active_cd_art', resolvedId);
                player.persistentData.putLong('skd_active_cd_end', now + artData.cdMs);
                syncSpellEngineCooldown(player, resolvedId, artData.cdMs);
            }
            consumePlayerStamina(player, stamCost);
            return;
        }
    }
});

// ------------------------------------------------------------------------------
// EVENT 2.5: NETWORK RECEIVER FOR [Z], [X] & SHIELD COMBAT PACKETS
// ------------------------------------------------------------------------------

NetworkEvents.dataReceived('elyrium:trigger_weapon_art', event => {
    let player = event.player;
    if (!player || !player.isAlive()) return;

    let mainHand = player.mainHandItem;
    let offHand = player.offHandItem;
    let hasShield = (offHand && !offHand.isEmpty() && isShield(offHand)) || (mainHand && !mainHand.isEmpty() && isShield(mainHand));

    let action = '';
    let slot = 0;
    try {
        if (event.data) {
            let d = event.data;
            let rawAction = null;
            if (typeof d.contains === 'function' && d.contains('action')) {
                rawAction = d.getString('action');
            } else if (d.action !== undefined && d.action !== null) {
                rawAction = d.action;
            } else if (typeof d.getString === 'function') {
                rawAction = d.getString('action');
            }
            if (rawAction != null) {
                action = String(rawAction).trim();
            }

            let rawSlot = null;
            if (typeof d.contains === 'function' && d.contains('slot')) {
                rawSlot = d.getInt('slot');
            } else if (d.slot !== undefined && d.slot !== null) {
                rawSlot = d.slot;
            } else if (typeof d.getInt === 'function') {
                rawSlot = d.getInt('slot');
            }
            if (rawSlot != null) {
                slot = Number(rawSlot);
            }
        }
    } catch (eData) {}

    // Action A: Shield Bash (Triggered by RMB Shield + LMB)
    if (action === 'shield_bash') {
        if (hasShield) {
            executeWeaponArt(player, 'shield_bash', false, false);
        } else {
            player.sendSystemMessage(Text.of('§7Экипируйте щит для выполнения удара щитом.'), true);
        }
        return;
    }

    // Action B: Shield + Shift + LMB -> Main hand innate weapon art
    if (action === 'innate_art' || action === 'shield_shift_lmb') {
        if (!mainHand || mainHand.isEmpty() || !isAnyWeapon(mainHand)) {
            player.sendSystemMessage(Text.of('§7Возьмите оружие в основную руку для боевого искусства.'), true);
            return;
        }
        let innateArt = resolveInnateWeaponArt(player, false);
        if (innateArt && WEAPON_ARTS[innateArt]) {
            executeWeaponArt(player, innateArt, false, false);
        }
        return;
    }

    // Guard: If action was specified but didn't match, do NOT fall through to Slot 2 [Z]!
    if (action && action.length > 0) {
        return;
    }

    // Default: Slot 2 [Z] or Slot 3 [X]
    if (!mainHand || mainHand.isEmpty() || !isAnyWeapon(mainHand)) {
        player.sendSystemMessage(Text.of('§7Возьмите в руку оружие для использования боевого искусства.'), true);
        return;
    }

    let targetSlot = slot || 2;
    let artId = getSlotWeaponArt(mainHand, targetSlot);
    if (artId && WEAPON_ARTS[artId]) {
        executeWeaponArt(player, artId, false, true);
    } else {
        let keyHint = targetSlot === 2 ? '§e[Z] Слот 2' : '§6[X] Слот 3';
        player.sendSystemMessage(Text.of(`§7В ${keyHint} нет боевого искусства (Инкрустируйте скрижаль на Оружейном Столе).`), true);
        player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ~ ~ ~ 0.5 1.8`);
    }
});

// Stray uncharged arrow suppressor: cancels zero-velocity arrows right after bow arts
EntityEvents.spawned(event => {
    let entity = event.entity;
    if (!entity) return;
    let type = String(entity.type);
    if (!type.includes('arrow')) return;

    let owner = entity.owner;
    if (owner && owner.isPlayer && owner.isPlayer()) {
        let lastBowArt = owner.persistentData.getLong('elyrium_last_bow_art_time') || 0;
        let now = Date.now();
        if (now - lastBowArt < 1200) {
            let m = entity.deltaMovement;
            let speed = m ? Math.sqrt(m.x * m.x + m.y * m.y + m.z * m.z) : 0;
            if (speed < 0.9) {
                event.cancel();
            }
        }
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

    // 1. Stamina Regeneration (+5 to +8 every 10 ticks based on food & sprint, -70% if blocking)
    let curStam = getPlayerStamina(player);
    let maxStam = getPlayerMaxStamina(player);
    if (curStam < maxStam) {
        let regen = 5;
        if (player.foodLevel > 14) regen += 3;
        if (player.isSprinting()) regen = Math.max(1, regen - 3);
        if (player.isBlocking()) {
            regen = Math.max(1, Math.round(regen * 0.3)); // 70% reduction when blocking
        }
        curStam = Math.min(maxStam, curStam + regen);
        player.persistentData.putInt('elyrium_stamina', curStam);
    }
    updateStaminaBossBar(player, curStam, maxStam);

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

    // 3. Spear Universal Grip Reach (+1.5m Entity Interaction Range when two-handed)
    let mainHand = player.mainHandItem;
    let offHand = player.offHandItem;
    let isTwoHandedSpear = mainHand && !mainHand.isEmpty() && isSpear(mainHand) && (!offHand || offHand.isEmpty() || offHand.id === 'minecraft:air');
    let hadSpearReach = player.persistentData.getBoolean('skd_spear_reach_active');

    if (isTwoHandedSpear && !hadSpearReach) {
        player.persistentData.putBoolean('skd_spear_reach_active', true);
        player.server.runCommandSilent(`attribute ${player.username} minecraft:player.entity_interaction_range modifier add elyrium:spear_reach 1.0 add_value`);
    } else if (!isTwoHandedSpear && hadSpearReach) {
        player.persistentData.putBoolean('skd_spear_reach_active', false);
        player.server.runCommandSilent(`attribute ${player.username} minecraft:player.entity_interaction_range modifier remove elyrium:spear_reach`);
    }
});

// ------------------------------------------------------------------------------
// EVENT 4: COMMAND REGISTRY & CHAT SHORTCUTS
// ------------------------------------------------------------------------------

function printArtsList(player) {
    player.tell('§6═══════════════════════════════════════════════════');
    player.tell('§e⚔ БОЕВЫЕ ИСКУССТВА ЭЛИРИУМА: КАТАЛОГ СИСТЕМЫ');
    player.tell('§6═══════════════════════════════════════════════════');
    player.tell('§b1. 9 Чисто Боевых Мили-Умений:');
    player.tell('  §6• Вихревой Размах §7(360° клив 4.5б, 180% урон, 40⚡)');
    player.tell('  §6• Фантомный Выпад §7(рывок 6б сквозь врагов, 190% урон, кровотечение, 30⚡)');
    player.tell('  §6• Рассекающий Клив §7(дуговой удар 4м, 210% урон, 40% пробой брони, 35⚡)');
    player.tell('  §6• Сотрясение Земли §7(удар в землю 5м, подброс, Замедление IV, 45⚡)');
    player.tell('  §6• Сокрушительный Апперкот §7(восходящий удар, 220% урон, стан 2с, 30⚡)');
    player.tell('  §6• Бронебойный Прокол §7(выпад 5.5б, 100% чистый пробой брони, 25⚡)');
    player.tell('  §6• Ножницы §7(перекрестный удар клинками, 2x110% урон, глубокие раны, 25⚡)');
    player.tell('  §6• Теневой Шаг §7(блинк за спину 5.5б, невидимость 1.2с, 100% крит, 20⚡)');
    player.tell('  §6• Реверсивный Раскол §7(вертикальный взмах, 195% урон, сбив блока, 30⚡)');
    player.tell('§b2. 5 Боевых Умений Луков:');
    player.tell('  §6• Веерный Залп §7(5 спектральных стрел веером, 30⚡)');
    player.tell('  §6• Бронебойный Выстрел §7(пробивающий луч 25б, 100% пробой брони, 220% урон, 35⚡)');
    player.tell('  §6• Град Стрел §7(выстрел в зенит, шквал 12 стрел в зону 6м, 45⚡)');
    player.tell('  §6• Тактический Отскок §7(отскок назад 5б + замедляющая стрела, 25⚡)');
    player.tell('  §6• Беглая Тройка §7(очередь из 3 скорострельных стрел, 30⚡)');
    player.tell('§b3. 2 Умения Щита + Контрудар:');
    player.tell('  §6• Таранный Натиск §7(рывок 5б, отталкивание, стан 2с, 35⚡)');
    player.tell('  §6• Непоколебимый Оплот §7(бастион 3.5с: 80% защита, 30% отражение урона, 40⚡)');
    player.tell('  §e★ Гвардейский Контрудар §7(ЛКМ в течение 1.5с после блока -> +150% урона, стан)');
    player.tell('§b4. Механика Копья:');
    player.tell('  §a• Со щитом: §fУкол из-за блока (атака без прерывания защиты щита)');
    player.tell('  §a• Без щита: §fДвуручный силовой хват (+30% физ. урона, дальность атаки +1.5м)');
    player.tell('§6═══════════════════════════════════════════════════');
}

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;

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

// ------------------------------------------------------------------------------
// EVENT 5: ATTRIBUTE MODIFIER CLEANUP (LOGOUT / RESPAWN)
// ------------------------------------------------------------------------------

PlayerEvents.loggedOut(event => {
    let player = event.player;
    if (player) {
        let pUuid = String(player.uuid);
        if (PLAYER_STAMINA_BARS.has(pUuid)) {
            try {
                let bar = PLAYER_STAMINA_BARS.get(pUuid);
                bar.removeAllPlayers();
            } catch (eBar) {}
            PLAYER_STAMINA_BARS.delete(pUuid);
        }
        if (player.persistentData && player.persistentData.getBoolean('skd_spear_reach_active')) {
            player.persistentData.putBoolean('skd_spear_reach_active', false);
            player.server.runCommandSilent(`attribute ${player.username} minecraft:player.entity_interaction_range modifier remove elyrium:spear_reach`);
        }
    }
});

PlayerEvents.loggedIn(event => {
    let player = event.player;
    if (!player) return;
    let curStam = getPlayerStamina(player);
    let maxStam = getPlayerMaxStamina(player);
    updateStaminaBossBar(player, curStam, maxStam);
});

PlayerEvents.respawned(event => {
    let player = event.player;
    if (player && player.persistentData) {
        player.persistentData.putBoolean('skd_spear_reach_active', false);
        player.server.runCommandSilent(`attribute ${player.username} minecraft:player.entity_interaction_range modifier remove elyrium:spear_reach`);
        let curStam = getPlayerStamina(player);
        let maxStam = getPlayerMaxStamina(player);
        updateStaminaBossBar(player, curStam, maxStam);
    }
});
