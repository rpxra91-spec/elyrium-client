// ==============================================================================
// ⚡ ELYRIUM RPG: 4-RANK ELEMENTAL INFUSION & COMBAT ENGINE (v0.4.33)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 1. Weapon Damage Conversion Formula (Canonical Rule):
//    - Weapon Base Damage = Base Item Damage * (1.0 + Reinforce Bonus +1..+15)
//    - Converted Elemental Portion:
//      * Rank I   (Треснувший):   10% of Weapon Base Damage
//      * Rank II  (Ограненный):  18% of Weapon Base Damage
//      * Rank III (Совершенный): 24% of Weapon Base Damage
//      * Rank IV  (Первородный):  30% of Weapon Base Damage (MAX)
//    - The converted elemental portion is dealt as pure magic damage bypassing armor.
//    - Remaining weapon damage is dealt as physical damage (scaled by player STR, crits, potions).
//    - NO INT DEPENDENCY (as requested by Curator, deferred for future phases).
//
// 2. 6 Elements x Effects:
//    - Rank I: Clean elemental conversion, no special proc effects.
//    - Ranks II & III: Effect 1 (Passive Rhythm):
//      * Fire:      Ignites target for 3.0s (60 ticks).
//      * Frost:     Slowness I for 2.0s (40 ticks).
//      * Lightning: Static discharge — every 4th hit arcs a mini-spark to nearby foe (no stun-lock!).
//      * Nature:    Poison I for 3.0s (60 ticks).
//      * Holy:      +25% elemental damage strictly vs undead entities.
//      * Shadow:    Wither I for 2.5s (50 ticks).
//    - Rank IV: Effect 2 (Ultimates with Cooldowns tracked in player.persistentData):
//      * Fire      (CD 15s): «Огненная Волна» (Knockback 2 blocks + AoE burn).
//      * Frost     (CD 18s): «Оледенение» (Single-target freeze 1.5s + Brittle +25% phys dmg on next hit).
//      * Lightning (CD 15s): «Нисходящий Разряд» (Lightning strike from heaven on target).
//      * Nature    (CD 20s): «Оплетающие Споры» (Immobilize 2.0s + Life Leech +4 HP to player).
//      * Holy      (CD 15s): «Вспышка Очищения» (Blind enemies 2.0s + Cleanses 1 negative debuff from player).
//      * Shadow    (CD 20s): «Пожирание Тени» (-20% magic defense on target for 4.0s + 15 mana to player).
//
// 3. 100% Robust Recursion Guard:
//    - 'skd_elem_proc' flag in victim persistentData + magic source checks.
// ==============================================================================

// ------------------------------------------------------------------------------
// 1. CONSTANTS & METADATA
// ------------------------------------------------------------------------------

const ELEMENTAL_DATA = {
    fire: {
        name: 'Пламя',
        color: '§c',
        particle: 'minecraft:flame',
        procSound: 'minecraft:item.firecharge.use'
    },
    frost: {
        name: 'Лед',
        color: '§b',
        particle: 'minecraft:snowflake',
        procSound: 'minecraft:block.glass.break'
    },
    lightning: {
        name: 'Молния',
        color: '§e',
        particle: 'minecraft:electric_spark',
        procSound: 'minecraft:entity.lightning_bolt.impact'
    },
    shadow: {
        name: 'Бездна',
        color: '§5',
        particle: 'minecraft:sculk_charge_pop',
        procSound: 'minecraft:block.sculk_shrieker.shriek'
    },
    holy: {
        name: 'Свет',
        color: '§6',
        particle: 'minecraft:enchanted_hit',
        procSound: 'minecraft:block.amethyst_block.chime'
    },
    nature: {
        name: 'Природа',
        color: '§a',
        particle: 'minecraft:happy_villager',
        procSound: 'minecraft:block.grass.break'
    }
};

const ELEMENTAL_CONVERSION_RATIOS = {
    1: 0.10, // Rank I: 10%
    2: 0.18, // Rank II: 18%
    3: 0.24, // Rank III: 24%
    4: 0.30  // Rank IV: 30% (Max)
};

const WEAPON_REINFORCE_BONUS_TABLE = {
    0: 0.00,
    1: 0.03,
    2: 0.07,
    3: 0.12,
    4: 0.20,
    5: 0.28,
    6: 0.37,
    7: 0.47,
    8: 0.57,
    9: 0.69,
    10: 0.84,
    11: 1.02,
    12: 1.22,
    13: 1.44,
    14: 1.69,
    15: 2.00
};

// ------------------------------------------------------------------------------
// 2. HELPER FUNCTIONS
// ------------------------------------------------------------------------------

/**
 * Normalizes element string.
 */
function normalizeElement(elem) {
    if (!elem) return null;
    let s = String(elem).toLowerCase().trim();
    if (s.includes('fire') || s.includes('flame')) return 'fire';
    if (s.includes('frost') || s.includes('ice')) return 'frost';
    if (s.includes('lightning') || s.includes('shock') || s.includes('thunder')) return 'lightning';
    if (s.includes('shadow') || s.includes('void') || s.includes('dark')) return 'shadow';
    if (s.includes('holy') || s.includes('light') || s.includes('sacred')) return 'holy';
    if (s.includes('nature') || s.includes('life') || s.includes('flora')) return 'nature';
    return null;
}

/**
 * Extracts stone rank (1..4) from item ID or NBT.
 */
function parseStoneRank(stoneId, fallbackRank) {
    if (stoneId) {
        let s = String(stoneId).toLowerCase();
        if (s.endsWith('_4')) return 4;
        if (s.endsWith('_3')) return 3;
        if (s.endsWith('_2')) return 2;
        if (s.endsWith('_1')) return 1;
        if (s.includes('elemental_stone_')) return 1;
    }
    let r = Number(fallbackRank);
    if (!isNaN(r) && r >= 1 && r <= 4) return r;
    return 1;
}

/**
 * Reads elemental infusion details from weapon item stack.
 * Returns { elem: 'fire', rank: 1..4, stoneId: 'kubejs:elemental_stone_fire...' } or null.
 */
function getWeaponElementalInfusion(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return null;
    let elem = null;
    let rank = 1;
    let stoneId = null;

    try {
        let tag = null;
        if (item.customData) tag = item.customData;
        else if (item.nbt) tag = item.nbt;
        else {
            let DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents');
            let cd = item.get(DataComponents.CUSTOM_DATA);
            if (cd) tag = cd.copyTag();
        }

        if (tag) {
            if (tag.contains('skd_elemental_infusion')) elem = tag.getString('skd_elemental_infusion');
            else if (tag.contains('skd_element')) elem = tag.getString('skd_element');

            if (tag.contains('skd_elemental_stone')) {
                stoneId = tag.getString('skd_elemental_stone');
                rank = parseStoneRank(stoneId, 1);
            }
            if (tag.contains('skd_elemental_rank')) {
                rank = tag.getInt('skd_elemental_rank') || rank;
            }
        }
    } catch (e) {}

    let norm = normalizeElement(elem);
    if (!norm) return null;

    rank = Math.max(1, Math.min(4, rank));
    if (!stoneId) {
        stoneId = (rank > 1) ? `kubejs:elemental_stone_${norm}_${rank}` : `kubejs:elemental_stone_${norm}`;
    }

    return {
        elem: norm,
        rank: rank,
        stoneId: stoneId
    };
}

/**
 * Checks if target entity is undead for Holy element bonus.
 */
function isUndeadTarget(entity) {
    if (!entity) return false;
    try {
        if (typeof entity.isUndead === 'function' && entity.isUndead()) return true;
    } catch (e) {}

    let typeStr = entity.type ? String(entity.type).toLowerCase() : '';
    return typeStr.includes('zombie') || typeStr.includes('skeleton') ||
           typeStr.includes('phantom') || typeStr.includes('wither') ||
           typeStr.includes('drowned') || typeStr.includes('husk') ||
           typeStr.includes('stray') || typeStr.includes('zombified');
}

/**
 * Spawns elemental hit particles at target coordinates.
 */
function spawnElementalParticles(server, element, x, y, z) {
    if (!server) return;
    try {
        switch (element) {
            case 'fire':
                server.runCommandSilent(`particle minecraft:flame ${x} ${y + 1} ${z} 0.35 0.35 0.35 0.05 16 normal`);
                break;
            case 'frost':
                server.runCommandSilent(`particle minecraft:snowflake ${x} ${y + 1} ${z} 0.35 0.35 0.35 0.03 16 normal`);
                break;
            case 'lightning':
                server.runCommandSilent(`particle minecraft:electric_spark ${x} ${y + 1} ${z} 0.35 0.35 0.35 0.1 16 normal`);
                break;
            case 'shadow':
                server.runCommandSilent(`particle minecraft:sculk_charge_pop ${x} ${y + 1} ${z} 0.35 0.35 0.35 0.05 14 normal`);
                break;
            case 'holy':
                server.runCommandSilent(`particle minecraft:enchanted_hit ${x} ${y + 1} ${z} 0.35 0.35 0.35 0.1 20 normal`);
                break;
            case 'nature':
                server.runCommandSilent(`particle minecraft:happy_villager ${x} ${y + 1} ${z} 0.35 0.35 0.35 0.05 16 normal`);
                break;
        }
    } catch (e) {}
}

/**
 * Computes Weapon Base Damage with Reinforcement (+1..+15).
 * Formula: Base Item Damage * (1.0 + Reinforce Bonus)
 */
function computeWeaponBaseDamage(weapon, player, rawInitialDamage) {
    let reinforceLvl = 0;
    try {
        if (weapon.customData && weapon.customData.contains('skd_reinforce')) {
            reinforceLvl = weapon.customData.getInt('skd_reinforce');
        } else if (weapon.nbt && weapon.nbt.contains('skd_reinforce')) {
            reinforceLvl = weapon.nbt.getInt('skd_reinforce');
        }
    } catch (eR) {}
    reinforceLvl = Math.max(0, Math.min(15, reinforceLvl));

    let reinforceBonus = WEAPON_REINFORCE_BONUS_TABLE[reinforceLvl] !== undefined
        ? WEAPON_REINFORCE_BONUS_TABLE[reinforceLvl]
        : (reinforceLvl * 0.05);

    // Baseline weapon damage resolution
    let baseDmg = 6.0;
    try {
        let attr = player.attributes.getValue('minecraft:generic.attack_damage');
        if (attr && attr > 0) baseDmg = attr;
    } catch (eAttr) {}

    // If initial damage is available, cap or align reasonably
    if (rawInitialDamage && rawInitialDamage > 0) {
        // baseDmg is bounded by rawInitialDamage
        baseDmg = Math.min(baseDmg, rawInitialDamage);
    }

    let weaponBase = baseDmg * (1.0 + reinforceBonus);
    return Math.max(2.0, weaponBase);
}

// ------------------------------------------------------------------------------
// 3. COMBAT HOOK: EntityEvents.beforeHurt
// ------------------------------------------------------------------------------

EntityEvents.beforeHurt(event => {
    let source = event.source;
    if (!source) return;

    let victim = event.entity;
    if (!victim || !victim.isLiving() || !victim.isAlive() || victim.isPlayer()) return;

    // A. Recursion Guard: ignore secondary elemental procs or recursive calls
    if (victim.persistentData && victim.persistentData.getBoolean('skd_elem_proc')) return;

    // B. Ignore incoming pure magic attacks to prevent self-looping
    try {
        if (source.isMagic && source.isMagic()) return;
        let sType = source.type ? String(source.type).toLowerCase() : '';
        if (sType.includes('magic')) return;
    } catch (eGuard) {}

    let attacker = source.actual || source.player;
    if (!attacker || !attacker.isPlayer()) return;
    let player = attacker;

    // Ignore friendly MineColonies citizens
    if (victim.type && String(victim.type).includes('minecolonies:citizen')) return;

    // Resolve player's weapon (mainhand priority, offhand fallback)
    let weapon = player.mainHandItem;
    if (!weapon || weapon.isEmpty() || weapon.id === 'minecraft:air') {
        if (player.offHandItem && !player.offHandItem.isEmpty() && player.offHandItem.id !== 'minecraft:air') {
            weapon = player.offHandItem;
        }
    }
    if (!weapon || weapon.isEmpty()) return;

    // Check elemental infusion
    let infusion = getWeaponElementalInfusion(weapon);
    if (!infusion) return;

    let element = infusion.elem;
    let rank = infusion.rank;

    let initialDamage = event.damage;
    if (initialDamage <= 0.1) return;

    // ==========================================================================
    // ⚔️ 1. FORMULA: WEAPON BASE & CONVERSION RATIO
    // ==========================================================================
    // Weapon Base = Base Damage * (1.0 + Reinforce Bonus)
    // Conversion %: Rank I: 10%, Rank II: 18%, Rank III: 24%, Rank IV: 30%
    let weaponBase = computeWeaponBaseDamage(weapon, player, initialDamage);
    let convRatio = ELEMENTAL_CONVERSION_RATIOS[rank] || 0.10;

    let elementalDamage = weaponBase * convRatio;
    // Physical portion is reduced by the converted elemental slice
    let physicalDamageRemaining = Math.max(1.0, initialDamage - elementalDamage);
    event.damage = physicalDamageRemaining;

    // Check Frost Brittle bonus from previous Rank IV Ultimate (+25% phys damage)
    if (victim.persistentData && victim.persistentData.getBoolean('skd_brittle_ice')) {
        event.damage *= 1.25;
        victim.persistentData.remove('skd_brittle_ice');
        player.server.runCommandSilent(`playsound minecraft:block.glass.break player ${player.username} ${victim.x} ${victim.y} ${victim.z} 1.0 1.5`);
        try {
            player.sendSystemMessage(Text.of('§b§l❄ ХРУПКОСТЬ! §f+25% дополнительного физического урона по замороженной цели!'), true);
        } catch (eBrittleMsg) {}
    }

    let now = Date.now();
    let server = player.server;

    // ==========================================================================
    // 🌟 2. EFFECT 1 (PASSIVE RHYTHM): RANKS II & III (& IV)
    // ==========================================================================
    if (rank >= 2) {
        try {
            switch (element) {
                case 'fire':
                    // Поджог на 3 сек (60 тиков)
                    victim.setRemainingFireTicks(60);
                    break;
                case 'frost':
                    // Замедление I на 2 сек (40 тиков)
                    if (victim.potionEffects) {
                        victim.potionEffects.add('minecraft:slowness', 40, 0, false, true);
                    }
                    victim.setTicksFrozen(60);
                    break;
                case 'lightning':
                    // Статический заряд: каждый 4-й удар бьет цепной мини-искрой соседнего врага (без станлока!)
                    let hitCounter = player.persistentData.getInt('skd_static_hits') || 0;
                    hitCounter++;
                    if (hitCounter >= 4) {
                        player.persistentData.putInt('skd_static_hits', 0);
                        let level = victim.level || player.level;
                        if (level) {
                            let nearby = level.getEntitiesWithin(AABB.of(
                                victim.x - 4.0, victim.y - 2.0, victim.z - 4.0,
                                victim.x + 4.0, victim.y + 3.0, victim.z + 4.0
                            ));
                            let sparkTarget = null;
                            for (let ent of nearby) {
                                if (ent && ent.isAlive() && ent.isLiving() && ent !== player && ent !== victim && !ent.isPlayer()) {
                                    if (ent.type && String(ent.type).includes('minecolonies:citizen')) continue;
                                    sparkTarget = ent;
                                    break;
                                }
                            }
                            if (sparkTarget) {
                                let sparkDmg = Math.max(2.0, elementalDamage * 0.6);
                                sparkTarget.persistentData.putBoolean('skd_elem_proc', true);
                                try {
                                    sparkTarget.attack(player.damageSources().magic(), sparkDmg);
                                } catch (eSparkAtt) {
                                    sparkTarget.setHealth(Math.max(0, sparkTarget.health - sparkDmg));
                                } finally {
                                    sparkTarget.persistentData.remove('skd_elem_proc');
                                }
                                if (server) {
                                    server.runCommandSilent(`particle minecraft:electric_spark ${sparkTarget.x} ${sparkTarget.y + 1} ${sparkTarget.z} 0.3 0.3 0.3 0.1 12 normal`);
                                    server.runCommandSilent(`playsound minecraft:entity.lightning_bolt.impact player ${player.username} ${sparkTarget.x} ${sparkTarget.y} ${sparkTarget.z} 0.5 2.0`);
                                }
                            }
                        }
                    } else {
                        player.persistentData.putInt('skd_static_hits', hitCounter);
                    }
                    break;
                case 'nature':
                    // Отравление I на 3 сек (60 тиков)
                    if (victim.potionEffects) {
                        victim.potionEffects.add('minecraft:poison', 60, 0, false, true);
                    }
                    break;
                case 'holy':
                    // +25% урона строго по нежити
                    if (isUndeadTarget(victim)) {
                        elementalDamage *= 1.25;
                    }
                    break;
                case 'shadow':
                    // Иссушение I на 2.5 сек (50 тиков)
                    if (victim.potionEffects) {
                        victim.potionEffects.add('minecraft:wither', 50, 0, false, true);
                    }
                    break;
            }
        } catch (eRhythm) {}
    }

    // ==========================================================================
    // 👑 3. EFFECT 2 (ULTIMATE WITH CD): RANK IV
    // ==========================================================================
    if (rank === 4) {
        let cdKey = `skd_elem_ult_cd_${element}`;
        let lastUltTime = player.persistentData.getLong(cdKey) || 0;
        let cdDurationMs = 15000;
        if (element === 'frost') cdDurationMs = 18000;
        else if (element === 'nature' || element === 'shadow') cdDurationMs = 20000;

        if (now - lastUltTime >= cdDurationMs) {
            player.persistentData.putLong(cdKey, now);

            try {
                switch (element) {
                    case 'fire':
                        // Огненная Волна (КД 15с): отталкивание на 2 блока + АоЕ-ожог
                        if (server) {
                            server.runCommandSilent(`particle minecraft:flame ${victim.x} ${victim.y + 0.5} ${victim.z} 1.2 0.5 1.2 0.1 40 normal`);
                            server.runCommandSilent(`particle minecraft:lava ${victim.x} ${victim.y + 1} ${victim.z} 0.8 0.5 0.8 0.1 15 normal`);
                            server.runCommandSilent(`playsound minecraft:entity.blaze.shoot player ${player.username} ${victim.x} ${victim.y} ${victim.z} 1.2 0.8`);
                        }
                        let levelF = victim.level || player.level;
                        if (levelF) {
                            let nearbyF = levelF.getEntitiesWithin(AABB.of(
                                victim.x - 3.5, victim.y - 1.5, victim.z - 3.5,
                                victim.x + 3.5, victim.y + 2.5, victim.z + 3.5
                            ));
                            for (let ent of nearbyF) {
                                if (ent && ent.isAlive() && ent.isLiving() && ent !== player && !ent.isPlayer()) {
                                    if (ent.type && String(ent.type).includes('minecolonies:citizen')) continue;
                                    ent.setRemainingFireTicks(100);
                                    let dx = ent.x - player.x;
                                    let dz = ent.z - player.z;
                                    let dist = Math.sqrt(dx * dx + dz * dz) || 1.0;
                                    ent.push((dx / dist) * 0.8, 0.25, (dz / dist) * 0.8);
                                }
                            }
                        }
                        player.sendSystemMessage(Text.of('§c§l🔥 УЛЬТИМЕЙТ: «Огненная Волна»! §eВраги отброшены и охвачены яростным пламенем!'), true);
                        break;

                    case 'frost':
                        // Оледенение (КД 18с): заморозка соло-цели на 1.5 сек + хрупкость +25% урона от след. физ. удара
                        victim.setTicksFrozen(180);
                        if (victim.potionEffects) {
                            victim.potionEffects.add('minecraft:slowness', 30, 9, false, false); // Полное обездвиживание на 1.5с
                        }
                        victim.persistentData.putBoolean('skd_brittle_ice', true);
                        if (server) {
                            server.runCommandSilent(`particle minecraft:snowflake ${victim.x} ${victim.y + 1} ${victim.z} 0.8 0.8 0.8 0.05 40 normal`);
                            server.runCommandSilent(`playsound minecraft:block.glass.break player ${player.username} ${victim.x} ${victim.y} ${victim.z} 1.2 0.6`);
                            server.runCommandSilent(`playsound minecraft:entity.player.hurt_freeze player ${player.username} ${victim.x} ${victim.y} ${victim.z} 1.2 1.0`);
                        }
                        player.sendSystemMessage(Text.of('§b§l❄ УЛЬТИМЕЙТ: «Оледенение»! §fЦель скована льдом на 1.5с (+25% к следующему удару)!'), true);
                        break;

                    case 'lightning':
                        // Нисходящий Разряд (КД 15с): одиночный удар молнии с небес по цели
                        if (server) {
                            server.runCommandSilent(`summon minecraft:lightning_bolt ${victim.x} ${victim.y} ${victim.z}`);
                        }
                        let shockBonus = Math.max(8.0, elementalDamage * 1.5);
                        elementalDamage += shockBonus;
                        player.sendSystemMessage(Text.of('§e§l⚡ УЛЬТИМЕЙТ: «Нисходящий Разряд»! §fНебесная молния сокрушила цель!'), true);
                        break;

                    case 'nature':
                        // Оплетающие Споры (КД 20с): обездвиживание соло-цели на 2 сек + вампиризм 4 HP игроку
                        if (victim.potionEffects) {
                            victim.potionEffects.add('minecraft:slowness', 40, 9, false, false);
                        }
                        let curHealth = player.health;
                        let maxH = player.maxHealth;
                        player.setHealth(Math.min(maxH, curHealth + 4.0));
                        if (server) {
                            server.runCommandSilent(`particle minecraft:happy_villager ${player.x} ${player.y + 1} ${player.z} 0.5 0.5 0.5 0.05 25 normal`);
                            server.runCommandSilent(`particle minecraft:composter ${victim.x} ${victim.y + 0.5} ${victim.z} 0.6 0.6 0.6 0.05 30 normal`);
                            server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ${player.x} ${player.y} ${player.z} 1.0 1.6`);
                        }
                        player.sendSystemMessage(Text.of('§a§l🌿 УЛЬТИМЕЙТ: «Оплетающие Споры»! §fЦель скована на 2с, восстановлено +4 HP!'), true);
                        break;

                    case 'holy':
                        // Вспышка Очищения (КД 15с): ослепление врагов на 2 сек + снятие 1 дебаффа с игрока
                        let levelH = victim.level || player.level;
                        if (levelH) {
                            let nearbyH = levelH.getEntitiesWithin(AABB.of(
                                victim.x - 5.0, victim.y - 2.0, victim.z - 5.0,
                                victim.x + 5.0, victim.y + 3.0, victim.z + 5.0
                            ));
                            for (let ent of nearbyH) {
                                if (ent && ent.isAlive() && ent.isLiving() && ent !== player && !ent.isPlayer()) {
                                    if (ent.type && String(ent.type).includes('minecolonies:citizen')) continue;
                                    if (ent.potionEffects) {
                                        ent.potionEffects.add('minecraft:blindness', 40, 0, false, true);
                                    }
                                }
                            }
                        }
                        // Снятие 1 вредного дебаффа с игрока
                        try {
                            if (player.potionEffects) {
                                let debuffs = ['minecraft:poison', 'minecraft:wither', 'minecraft:slowness', 'minecraft:weakness', 'minecraft:blindness', 'minecraft:mining_fatigue'];
                                for (let deb of debuffs) {
                                    if (player.potionEffects.isActive(deb)) {
                                        player.potionEffects.clear(deb);
                                        break;
                                    }
                                }
                            }
                        } catch (eDebClear) {}
                        if (server) {
                            server.runCommandSilent(`particle minecraft:end_rod ${player.x} ${player.y + 1.2} ${player.z} 0.6 0.6 0.6 0.1 35 normal`);
                            server.runCommandSilent(`playsound minecraft:block.amethyst_block.chime player ${player.username} ${player.x} ${player.y} ${player.z} 1.4 1.2`);
                        }
                        player.sendSystemMessage(Text.of('§6§l✨ УЛЬТИМЕЙТ: «Вспышка Очищения»! §eВраги ослеплены, негативный эффект очищен!'), true);
                        break;

                    case 'shadow':
                        // Пожирание Тени (КД 20с): срез 20% маг. защиты соло-цели на 4 сек (Weakness II) + 15 маны игроку
                        if (victim.potionEffects) {
                            victim.potionEffects.add('minecraft:weakness', 80, 1, false, true);
                        }
                        try {
                            // Восстановление 15 маны в Irons Spellbooks
                            let MagicData = Java.loadClass('io.redspace.ironsspellbooks.api.magic.MagicData');
                            if (MagicData) {
                                let rawP = player.minecraftPlayer || player;
                                let mData = MagicData.getPlayerMagicData(rawP);
                                if (mData) {
                                    mData.addMana(15.0);
                                }
                            }
                        } catch (eManaAdd) {}
                        if (server) {
                            server.runCommandSilent(`particle minecraft:sculk_soul ${victim.x} ${victim.y + 1} ${victim.z} 0.5 0.5 0.5 0.05 25 normal`);
                            server.runCommandSilent(`playsound minecraft:block.sculk_shrieker.shriek player ${player.username} ${victim.x} ${victim.y} ${victim.z} 0.8 1.4`);
                        }
                        player.sendSystemMessage(Text.of('§5§l🌑 УЛЬТИМЕЙТ: «Пожирание Тени»! §dЗащита цели снижена, поглощено +15 маны!'), true);
                        break;
                }
            } catch (eUlt) {}
        }
    }

    // ==========================================================================
    // 💥 4. SPAWN PARTICLES & HIT SOUNDS
    // ==========================================================================
    spawnElementalParticles(server, element, victim.x, victim.y, victim.z);

    // ==========================================================================
    // 🛡️ 5. APPLY ARMOR-BYPASSING MAGIC DAMAGE WITH RECURSION GUARD
    // ==========================================================================
    victim.persistentData.putBoolean('skd_elem_proc', true);
    try {
        let magicSrc = null;
        try {
            if (victim.damageSources && typeof victim.damageSources().magic === 'function') {
                magicSrc = victim.damageSources().magic();
            } else if (player.damageSources && typeof player.damageSources().magic === 'function') {
                magicSrc = player.damageSources().magic();
            }
        } catch (eSrc) {}

        let hitSuccess = false;
        try {
            victim.invulnerableTime = 0;
            if (magicSrc) {
                hitSuccess = victim.attack(magicSrc, elementalDamage);
            }
        } catch (eAtt) {}

        if (!hitSuccess) {
            try {
                victim.setHealth(Math.max(0, victim.health - elementalDamage));
            } catch (eFb) {}
        }
    } finally {
        victim.persistentData.remove('skd_elem_proc');
    }
});

// ------------------------------------------------------------------------------
// 4. API EXPORTS
// ------------------------------------------------------------------------------

var ElyriumElementalInfusion = {
    getInfusion: getWeaponElementalInfusion,
    normalizeElement: normalizeElement,
    parseStoneRank: parseStoneRank,
    computeWeaponBaseDamage: computeWeaponBaseDamage,
    ELEMENTAL_DATA: ELEMENTAL_DATA,
    CONVERSION_RATIOS: ELEMENTAL_CONVERSION_RATIOS
};
