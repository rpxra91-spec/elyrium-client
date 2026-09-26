// ==============================================================================
// ⚔️ ELYRIUM RPG: WEAPON REINFORCEMENT & ELDEN RING SCALING ENGINE
// ==============================================================================
// 1. Base Damage Bonus: +5% base damage per skd_reinforce level (+50% at +10).
// 2. Elden Ring Attribute Scaling:
//    - S: +2.0%, A: +1.5%, B: +1.1%, C: +0.8%, D: +0.5%, E: +0.2% per stat point
//      from SimpleStats perks + Curios jewelry.
//    - Heavy 2H weapons: STR primary (B -> A at +7 -> S at +10), secondary DEF (D).
//    - Katanas/Rapiers: AGI primary (B -> A at +7 -> S at +10), secondary STR (D).
//    - Pure Hammers/Bows/Staves: pure STR/AGI/MANA with base grade A (S at +10).
//    - Spellblades/Paladins: hybrid stats (C + C).
//    - Quality/Standard weapons: balanced STR (C) + AGI (C).
// 3. Armor Bonus: +4% armor/toughness per piece per skd_reinforce level.
// 4. Armor Resonance: if ALL 4 equipped armor pieces have skd_reinforce >= 7:
//    - 15% passive incoming damage reduction.
//    - Periodic subtle golden/blue protective particles around player (every 20t).
// 5. Hit Visual FX:
//    - skd_reinforce >= 5: wax_off & crit sparks on target hit.
//    - skd_reinforce >= 8: shockwave burst (totem & electric sparks & blast wave).
// ==============================================================================

// ------------------------------------------------------------------------------
// CONSTANTS: ELDEN RING SCALING MULTIPLIERS (PER STAT POINT)
// ------------------------------------------------------------------------------
const SCALING_GRADES = {
    'S': 0.020,  // +2.0% per point
    'A': 0.015,  // +1.5% per point
    'B': 0.011,  // +1.1% per point
    'C': 0.008,  // +0.8% per point
    'D': 0.005,  // +0.5% per point
    'E': 0.002   // +0.2% per point
};

const GRADE_COLORS = {
    'S': '§6§lS',
    'A': '§e§lA',
    'B': '§b§lB',
    'C': '§a§lC',
    'D': '§7§lD',
    'E': '§8§lE'
};

const STAT_NAMES_RU = {
    'str': 'Сила',
    'agi': 'Ловкость',
    'def': 'Стойкость',
    'vit': 'Живучесть',
    'crit': 'Точность',
    'mana': 'Интеллект'
};

// ------------------------------------------------------------------------------
// HELPER: Get skd_reinforce Level (0..10) from item NBT
// ------------------------------------------------------------------------------
function getReinforceLevel(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return 0;
    if (item.nbt && item.nbt.contains('skd_reinforce')) {
        let lvl = item.nbt.getInt('skd_reinforce');
        return Math.max(0, Math.min(10, lvl));
    }
    return 0;
}

// ------------------------------------------------------------------------------
// HELPER: Get Effective Player Stats (SimpleStats Perks + Potions + Curios)
// ------------------------------------------------------------------------------
function getPlayerEffectiveStats(player) {
    if (!player) return { str: 0, vit: 0, def: 0, agi: 0, crit: 0, mana: 0 };

    let perks = player.persistentData ? player.persistentData.getCompound('simplestats_perks') : null;
    let str = (perks ? perks.getInt('strength') : 0);
    let vit = (perks ? perks.getInt('vitality') : 0);
    let def = (perks ? perks.getInt('defense') : 0);
    let agi = (perks ? perks.getInt('agility') : 0);
    let crit = (perks ? perks.getInt('crit') : 0);
    let mana = (perks ? perks.getInt('mana') : 0);

    // 1. Potion Buffs
    if (player.hasEffect('minecraft:strength')) {
        let amp = player.getEffect('minecraft:strength').amplifier;
        str += (amp + 1) * 3;
    }
    if (player.hasEffect('minecraft:speed')) {
        let amp = player.getEffect('minecraft:speed').amplifier;
        agi += (amp + 1) * 3;
    }
    if (player.hasEffect('minecraft:resistance')) {
        let amp = player.getEffect('minecraft:resistance').amplifier;
        def += (amp + 1) * 3;
    }

    // 2. Equipped Curios Items Bonus (Rings, Amulets, Belts, Charms)
    try {
        let curioClass = Java.loadClass('top.theillusivec4.curios.api.CuriosApi');
        if (curioClass) {
            let optInv = curioClass.getCuriosInventory(player);
            if (optInv && optInv.isPresent()) {
                let handler = optInv.get();
                let equipped = handler.getEquippedCurios();
                let count = equipped.getSlots();
                for (let i = 0; i < count; i++) {
                    let cItem = equipped.getStackInSlot(i);
                    if (cItem && !cItem.isEmpty()) {
                        let cId = cItem.id.toLowerCase();
                        let tag = cItem.nbt;
                        
                        // Tag/NBT based bonuses
                        if (tag) {
                            if (tag.contains('skd_str')) str += tag.getInt('skd_str');
                            if (tag.contains('skd_vit')) vit += tag.getInt('skd_vit');
                            if (tag.contains('skd_def')) def += tag.getInt('skd_def');
                            if (tag.contains('skd_agi')) agi += tag.getInt('skd_agi');
                            if (tag.contains('skd_crit')) crit += tag.getInt('skd_crit');
                            if (tag.contains('skd_mana')) mana += tag.getInt('skd_mana');
                        }
                        
                        // Recognised jewelry items
                        if (cId.includes('ring_of_strength') || cId.includes('strength_ring')) str += 5;
                        if (cId.includes('ring_of_speed') || cId.includes('agility_ring')) agi += 5;
                        if (cId.includes('ring_of_vitality') || cId.includes('health_ring')) vit += 5;
                        if (cId.includes('ring_of_defense') || cId.includes('shield_ring')) def += 5;
                        if (cId.includes('ring_of_mana') || cId.includes('arcane_ring')) mana += 8;
                        if (cId.includes('amulet_of_titans') || cId.includes('titan_amulet')) { str += 8; def += 5; }
                    }
                }
            }
        }
    } catch (e) {
        // Fallback safely if Curios reflection fails
    }

    return {
        str: Math.max(0, str),
        vit: Math.max(0, vit),
        def: Math.max(0, def),
        agi: Math.max(0, agi),
        crit: Math.max(0, crit),
        mana: Math.max(0, mana)
    };
}

// ------------------------------------------------------------------------------
// HELPER: Resolve Elden Ring Weapon Scaling Configuration
// ------------------------------------------------------------------------------
function getWeaponScalingData(weapon, wLvl, player) {
    if (!weapon || weapon.isEmpty() || weapon.id === 'minecraft:air') return null;

    let id = weapon.id.toLowerCase();

    // 1. Pure Hammers (Pure STR: Base Grade A -> S at +10)
    if (id.includes('hammer') || id.includes('warhammer') || id.includes('greathammer')) {
        let grade = (wLvl >= 10) ? 'S' : 'A';
        return {
            category: 'Тяжелый Молот',
            scalings: [{ stat: 'str', grade: grade }]
        };
    }

    // 2. Pure Bows / Crossbows (Pure AGI: Base Grade A -> S at +10)
    if (weapon.hasTag('c:tools/bows') || weapon.hasTag('c:tools/crossbows') || 
        weapon.hasTag('minecraft:bows') || id.includes('bow') || id.includes('crossbow')) {
        let grade = (wLvl >= 10) ? 'S' : 'A';
        return {
            category: 'Стрелковое Оружие',
            scalings: [{ stat: 'agi', grade: grade }]
        };
    }

    // 3. Pure Staves / Wands / Spellbooks (Pure MANA: Base Grade A -> S at +10)
    if (id.includes('staff') || id.includes('wand') || id.includes('scepter') || 
        id.includes('spellbook') || id.startsWith('irons_spellbooks:')) {
        let grade = (wLvl >= 10) ? 'S' : 'A';
        return {
            category: 'Магический Посох',
            scalings: [{ stat: 'mana', grade: grade }]
        };
    }

    // 4. Katanas / Rapiers / Finesse: AGI (B -> A at +7 -> S at +10), secondary STR (D)
    if (id.includes('katana') || id.includes('rapier') || id.includes('dagger') || 
        id.includes('sai') || id.includes('cutlass') || id.includes('falchion')) {
        let agiGrade = 'B';
        if (wLvl >= 10) agiGrade = 'S';
        else if (wLvl >= 7) agiGrade = 'A';
        return {
            category: 'Катана / Рапира (Ловкость)',
            scalings: [
                { stat: 'agi', grade: agiGrade },
                { stat: 'str', grade: 'D' }
            ]
        };
    }

    // 5. Heavy 2H Weapons: STR (B -> A at +7 -> S at +10), secondary DEF (D)
    if (id.includes('claymore') || id.includes('greatsword') || id.includes('greataxe') || 
        id.includes('halberd') || id.includes('scythe') || id.includes('breaker') || 
        id.includes('twinblade') || id.includes('warglaive') || id.includes('lance') ||
        weapon.hasTag('c:two_handed') || weapon.hasTag('bettercombat:two_handed') || weapon.hasTag('skd:two_handed')) {
        let strGrade = 'B';
        if (wLvl >= 10) strGrade = 'S';
        else if (wLvl >= 7) strGrade = 'A';
        return {
            category: 'Тяжелый Двуручник',
            scalings: [
                { stat: 'str', grade: strGrade },
                { stat: 'def', grade: 'D' }
            ]
        };
    }

    // Character dynamic class archetype checks
    let pClass = player && player.persistentData ? 
        (player.persistentData.getString('elyrium_class') || player.persistentData.getString('active_rpg_class') || '') : '';
    
    let isSpellblade = id.includes('spellblade') || id.includes('runic') || id.includes('arcane') || 
                       id.includes('flamebearer') || id.includes('tyros') || id.includes('frost') ||
                       pClass.includes('Spellblade') || pClass.includes('Клинок Бури') || pClass.includes('Архимаг');
    
    let isPaladin = id.includes('paladin') || id.includes('holy') || id.includes('mace') || 
                    id.includes('morningstar') || id.includes('flail') || id.includes('sanctified') || 
                    id.includes('blessed') || id.includes('sun') ||
                    pClass.includes('Paladin') || pClass.includes('Паладин');

    // 6. Spellblades: Hybrid MANA (C) + STR (C)
    if (isSpellblade) {
        return {
            category: 'Клинок Заклинателя (Интеллект + Сила)',
            scalings: [
                { stat: 'mana', grade: 'C' },
                { stat: 'str', grade: 'C' }
            ]
        };
    }

    // 7. Paladins: Hybrid STR (C) + DEF (C)
    if (isPaladin) {
        return {
            category: 'Оружие Паладина (Сила + Стойкость)',
            scalings: [
                { stat: 'str', grade: 'C' },
                { stat: 'def', grade: 'C' }
            ]
        };
    }

    // 8. Balanced Standard Swords / Axes: Quality STR (C) + AGI (C)
    if (weapon.hasTag('minecraft:swords') || weapon.hasTag('minecraft:axes') || 
        weapon.hasTag('c:tools/swords') || weapon.hasTag('c:tools/axes') || 
        weapon.hasTag('c:tools/melee_weapon') || id.includes('sword') || id.includes('blade') || 
        id.includes('axe') || id.includes('spear') || id.includes('pike')) {
        return {
            category: 'Универсальное Оружие (Сила + Ловкость)',
            scalings: [
                { stat: 'str', grade: 'C' },
                { stat: 'agi', grade: 'C' }
            ]
        };
    }

    return null;
}

// ------------------------------------------------------------------------------
// COMBAT HOOK: EntityEvents.beforeHurt
// Handles:
// 1. Weapon Base Damage Bonus (+5% per skd_reinforce level)
// 2. Elden Ring Attribute Scaling (S/A/B/C/D per stat point)
// 3. Hit Visual FX (>= +5 wax/crit sparks, >= +8 shockwave burst)
// 4. Armor Reinforce Bonus (+4% defense per piece per lvl)
// 5. Armor Resonance (15% damage reduction if all 4 pieces >= +7)
// ------------------------------------------------------------------------------
EntityEvents.beforeHurt(event => {
    let source = event.source;
    if (!source) return;

    let target = event.entity;
    if (!target || !target.isLiving()) return;

    let attacker = source.actual;

    // ==========================================================================
    // ⚔️ CASE A: PLAYER ATTACKS LIVING MOB (Weapon Scaling & Hit FX)
    // ==========================================================================
    if (attacker && attacker.isPlayer() && !target.isPlayer()) {
        let player = attacker;
        if (target.type && target.type.toString().includes('minecolonies:citizen')) return;

        let weapon = player.mainHandItem;
        if (!weapon || weapon.isEmpty() || weapon.id === 'minecraft:air') {
            if (player.offHandItem && !player.offHandItem.isEmpty() && player.offHandItem.id !== 'minecraft:air') {
                weapon = player.offHandItem;
            }
        }

        let wLvl = getReinforceLevel(weapon);

        // 1. Base Reinforcement Damage Bonus (+5% per level, +50% at +10)
        let baseMultiplier = 1.0 + (wLvl * 0.05);

        // 2. Elden Ring Attribute Scaling Bonus
        let statBonus = 0.0;
        let scalingData = getWeaponScalingData(weapon, wLvl, player);
        if (scalingData && scalingData.scalings) {
            let stats = getPlayerEffectiveStats(player);
            for (let s of scalingData.scalings) {
                let statVal = stats[s.stat] || 0;
                let gradeCoeff = SCALING_GRADES[s.grade] || 0.0;
                statBonus += statVal * gradeCoeff;
            }
        }

        // Apply combined multipliers
        let totalMultiplier = baseMultiplier * (1.0 + statBonus);
        if (totalMultiplier > 1.0) {
            event.damage = event.damage * totalMultiplier;
        }

        // 5. Hit Visual FX
        if (wLvl >= 5 && target.level) {
            let tLvl = target.level;
            let ty = target.y + Math.max(0.4, target.eyeHeight * 0.6);

            // Tier +5..+7: wax_off & crit sparks
            tLvl.spawnParticles('minecraft:wax_off', true, target.x, ty, target.z, 7, 0.25, 0.25, 0.25, 0.08);
            tLvl.spawnParticles('minecraft:crit', true, target.x, ty, target.z, 10, 0.3, 0.3, 0.3, 0.12);

            // Tier +8..+10: Shockwave burst (totem, electric sparks, burst)
            if (wLvl >= 8) {
                tLvl.spawnParticles('minecraft:totem_of_undying', true, target.x, ty, target.z, 18, 0.4, 0.4, 0.4, 0.18);
                tLvl.spawnParticles('minecraft:electric_spark', true, target.x, ty, target.z, 14, 0.45, 0.45, 0.45, 0.15);
                tLvl.spawnParticles('minecraft:poof', true, target.x, ty, target.z, 5, 0.2, 0.2, 0.2, 0.05);

                if (wLvl >= 10) {
                    tLvl.spawnParticles('minecraft:explosion', true, target.x, ty, target.z, 1, 0.0, 0.0, 0.0, 0.0);
                }
            }
        }
    }

    // ==========================================================================
    // 🛡️ CASE B: PLAYER RECEIVES DAMAGE (Armor Bonus & Armor Resonance)
    // ==========================================================================
    if (target.isPlayer()) {
        let player = target;

        let head = player.getHeadArmorItem();
        let chest = player.getChestArmorItem();
        let legs = player.getLegsArmorItem();
        let feet = player.getFeetArmorItem();

        let headLvl = getReinforceLevel(head);
        let chestLvl = getReinforceLevel(chest);
        let legsLvl = getReinforceLevel(legs);
        let feetLvl = getReinforceLevel(feet);

        // 3. Armor Bonus: +4% armor/toughness per piece per skd_reinforce level
        let totalArmorLevels = headLvl + chestLvl + legsLvl + feetLvl;
        if (totalArmorLevels > 0) {
            let armorBonusFactor = totalArmorLevels * 0.04;
            // Classic Elden Ring diminishing returns armor defense curve
            event.damage = event.damage / (1.0 + armorBonusFactor);
        }

        // 4. Armor Resonance: if ALL 4 equipped armor pieces have skd_reinforce >= 7
        if (headLvl >= 7 && chestLvl >= 7 && legsLvl >= 7 && feetLvl >= 7) {
            // Player receives 15% passive incoming damage reduction
            event.damage = event.damage * 0.85;

            // Occasional resonant deflection sound on heavy hits
            let now = (typeof player.tickCount === 'number') ? player.tickCount : (player.age || 0);
            let lastSound = player.persistentData.getInt('skd_last_resonance_sound') || 0;
            if (now - lastSound >= 10) {
                player.persistentData.putInt('skd_last_resonance_sound', now);
                event.server.runCommandSilent(`playsound minecraft:block.amethyst_block.hit player ${player.username} ~ ~ ~ 0.7 1.4`);
            }
        }
    }
});

// ------------------------------------------------------------------------------
// TICK HOOK: ARMOR RESONANCE PROTECTIVE AURA PARTICLES (EVERY 20 TICKS)
// ------------------------------------------------------------------------------
PlayerEvents.tick(event => {
    let player = event.player;
    if (!player) return;
    let tick = (typeof player.tickCount === 'number') ? player.tickCount : (player.age || 0);
    if (tick % 20 !== 0) return;

    let headLvl = getReinforceLevel(player.getHeadArmorItem());
    let chestLvl = getReinforceLevel(player.getChestArmorItem());
    let legsLvl = getReinforceLevel(player.getLegsArmorItem());
    let feetLvl = getReinforceLevel(player.getFeetArmorItem());

    let isResonant = (headLvl >= 7 && chestLvl >= 7 && legsLvl >= 7 && feetLvl >= 7);
    let pData = player.persistentData;
    let wasResonant = pData.getBoolean('skd_armor_resonance');

    // State transition notification
    if (isResonant !== wasResonant) {
        pData.putBoolean('skd_armor_resonance', isResonant);
        if (isResonant) {
            player.sendSystemMessage(
                Text.of('§6✦ §bРЕЗОНАНС ДОСПЕХОВ АКТИВИРОВАН! §6✦ §f(-15% входящего урона, аура абсолютной закалки)'),
                true
            );
            event.server.runCommandSilent(`playsound minecraft:block.beacon.activate player ${player.username} ~ ~ ~ 0.8 1.3`);
        } else {
            player.sendSystemMessage(
                Text.of('§7🛡 Резонанс доспехов рассеялся (снята закаленная часть сета).'),
                true
            );
        }
    }

    // Spawn subtle golden/blue protective particles around player while resonant
    if (isResonant && player.level) {
        let lvl = player.level;
        let px = player.x;
        let py = player.y + 0.6;
        let pz = player.z;

        // Subtle Golden shimmer (wax_off sparks)
        lvl.spawnParticles(
            'minecraft:wax_off',
            true,
            px + (Math.random() - 0.5) * 0.7,
            py + Math.random() * 0.9,
            pz + (Math.random() - 0.5) * 0.7,
            2,
            0.1, 0.1, 0.1, 0.02
        );

        // Subtle Blue/Cyan arcane ward (enchant runes)
        lvl.spawnParticles(
            'minecraft:enchant',
            true,
            px + (Math.random() - 0.5) * 0.7,
            py + Math.random() * 0.9,
            pz + (Math.random() - 0.5) * 0.7,
            3,
            0.15, 0.2, 0.15, 0.05
        );
    }
});

// ------------------------------------------------------------------------------
// CHAT COMMAND: .scaling / .закалка / .scale
// Allows player to inspect their current weapon scaling and armor resonance
// ------------------------------------------------------------------------------
PlayerEvents.chat(event => {
    let msg = event.message.trim().toLowerCase();
    let player = event.player;
    if (!player) return;

    if (msg === '.scaling' || msg === '!scaling' || msg === '.закалка' || msg === '!закалка' || msg === '.scale') {
        let weapon = player.mainHandItem;
        let wLvl = getReinforceLevel(weapon);
        let wName = (weapon && !weapon.isEmpty() && weapon.id !== 'minecraft:air') ? weapon.hoverName.getString() : 'Пустые руки';

        let headLvl = getReinforceLevel(player.getHeadArmorItem());
        let chestLvl = getReinforceLevel(player.getChestArmorItem());
        let legsLvl = getReinforceLevel(player.getLegsArmorItem());
        let feetLvl = getReinforceLevel(player.getFeetArmorItem());

        let totalArmorLevels = headLvl + chestLvl + legsLvl + feetLvl;
        let isResonant = (headLvl >= 7 && chestLvl >= 7 && legsLvl >= 7 && feetLvl >= 7);

        player.tell(Text.gold('══════════════ [⚔️ МАТРИЦА СКАЛИРОВАНИЯ И ЗАКАЛКИ] ══════════════'));
        player.tell(Text.yellow('🗡️ Оружие: ').append(Text.white(wName)).append(Text.aqua(` [+${wLvl}]`)));
        player.tell(Text.gray(`   Базовый бонус урона: §a+${wLvl * 5}% §7(при +10 кап: +50%)`));

        let scalingData = getWeaponScalingData(weapon, wLvl, player);
        if (scalingData && scalingData.scalings) {
            player.tell(Text.yellow(`   Классификация: §d${scalingData.category}`));
            let stats = getPlayerEffectiveStats(player);
            let totalStatBonus = 0.0;

            for (let s of scalingData.scalings) {
                let statName = STAT_NAMES_RU[s.stat] || s.stat.toUpperCase();
                let statVal = stats[s.stat] || 0;
                let gradeColor = GRADE_COLORS[s.grade] || s.grade;
                let gradeCoeff = SCALING_GRADES[s.grade] || 0.0;
                let bonus = statVal * gradeCoeff * 100.0;
                totalStatBonus += bonus;

                player.tell(Text.gray(`   • ${statName}: Грейд ${gradeColor} §7(+${(gradeCoeff * 100).toFixed(1)}%/pt × ${statVal} = §e+${bonus.toFixed(1)}%§7)`));
            }
            player.tell(Text.yellow(`   Итоговый прирост от статов: §6+${totalStatBonus.toFixed(1)}% урона`));
        } else {
            player.tell(Text.gray('   Оружие не требует статового скалирования.'));
        }

        player.tell(Text.gold('────────────────────────────────────────────────────────────────'));
        player.tell(Text.yellow('🛡️ Доспехи (Закалка): ').append(Text.gray(`Шлем: §b+${headLvl} §7| Нагрудник: §b+${chestLvl} §7| Поножи: §b+${legsLvl} §7| Ботинки: §b+${feetLvl}`)));
        player.tell(Text.gray(`   Суммарный бонус защиты: §a+${totalArmorLevels * 4}% §7(+4% за уровень каждой части)`));

        if (isResonant) {
            player.tell(Text.aqua('   ✦ РЕЗОНАНС ДОСПЕХОВ: §a§lАКТИВЕН §e(-15% входящего урона + Золотисто-Лазурная Аура)'));
        } else {
            player.tell(Text.gray('   ✦ РЕЗОНАНС ДОСПЕХОВ: §cНеактивен §7(Требуется +7 на всех 4 частях)'));
        }
        player.tell(Text.gold('════════════════════════════════════════════════════════════════'));

        event.cancel();
    }
});
