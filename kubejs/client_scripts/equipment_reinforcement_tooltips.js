// ==============================================================================
// ⚔️ ELYRIUM RPG: EQUIPMENT REINFORCEMENT & ELDEN RING SCALING TOOLTIPS
// ==============================================================================
// Displays Elden Ring style stats for Weapons, Armor, and Shields:
// 1. Weapons:
//    - Reinforcement stars/badge (+X*5% damage)
//    - Elden Ring Scaling grades: [S], [A], [B], [C], [D], [E] with (+XX% damage)
// 2. Armor:
//    - Reinforcement hardening (+X*4% defense, +HP)
//    - Set resonance aura at +7 and above (-15% damage taken)
// 3. Shields:
//    - Block stability [Current / Max] (matching shield_guard_posture engine)
//    - Pass-through damage reduction (-XX%)
// Zero crashes if NBT or tags are missing.
// ==============================================================================

// ------------------------------------------------------------------------------
// 1. STAT SCALING CALCULATION HELPERS
// ------------------------------------------------------------------------------

const SCALING_GRADES = ['E', 'D', 'C', 'B', 'A', 'S'];

const GRADE_SCALING_PER_POINT = {
    'S': 2.0,  // +2.0% per point
    'A': 1.5,  // +1.5% per point
    'B': 1.1,  // +1.1% per point
    'C': 0.8,  // +0.8% per point
    'D': 0.5,  // +0.5% per point
    'E': 0.2   // +0.2% per point
};

function getPlayerPerkStat(statKey) {
    if (!statKey) return 0;
    try {
        let p = (typeof Client !== 'undefined' && Client.player) ? Client.player : null;
        if (!p || !p.persistentData) return 0;
        let perks = p.persistentData.getCompound('simplestats_perks');
        if (!perks) return 0;
        return perks.getInt(statKey) || 0;
    } catch (e) {
        return 0;
    }
}

function calculateDynamicStatBonus(grade, statKey) {
    if (!statKey) return 0;
    let statVal = getPlayerPerkStat(statKey);
    if (statVal <= 0) return 0;
    let mult = GRADE_SCALING_PER_POINT[grade] || 0.5;
    return Math.round(statVal * mult);
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

function getWeaponProgressionTier(item, id) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return 1;

    for (let t = 11; t >= 1; t--) {
        if (item.hasTag(`skd:tier_${t}`) || item.hasTag(`c:tools/tier_${t}`)) return t;
    }

    if (id.includes('mortum') || id.includes('divinerpg:mortum') || id.includes('aquatooth') || id.includes('halite')) return 11;
    if (id.includes('apalachia') || id.includes('skythern') || id.includes('divinerpg:apalachia') || id.includes('divinerpg:skythern')) return 10;
    if (id.includes('eden') || id.includes('wildwood') || id.includes('divinerpg:eden') || id.includes('divinerpg:wildwood')) return 9;
    if (id.includes('sculk') || id.includes('echo') || id.includes('warden') || id.startsWith('deeperdarker:')) return 8;
    if (id.includes('starlight') || id.includes('luminite') || id.startsWith('eternal_starlight:') || id.includes('thermal_springstone')) return 7;
    if (id.includes('dragon') || id.includes('void') || id.includes('ender_guardian') || id.includes('ender_golem') || id.includes('elytra') || id.includes('ascended')) return 6;
    if (id.includes('gravitite') || id.includes('zanite') || id.includes('valkyrie') || id.includes('skyjade') || id.startsWith('aether:') || id.startsWith('deep_aether:')) return 5;
    if (id.includes('cinder') || id.includes('netherite') || id.startsWith('cataclysm:') || id.includes('ignitium') || id.includes('witherite') || id.includes('monstrosity') || id.includes('wither')) return 4;
    if (id.includes('diamond') || id.includes('cobalt') || id.includes('rune') || id.includes('runic') || id.startsWith('runes:') || id.includes('amethyst') ||
        (id.includes('iron') && !id.includes('early_iron') && !id.includes('crude_iron') && !id.includes('rusted_iron'))) {
        return 3;
    }
    if (id.includes('copper') || id.includes('chain') || id.includes('early_iron') || 
        id.includes('crude_iron') || id.includes('rusted_iron') || id.includes('gold') || 
        id.includes('golden') || id.includes('bronze') || id.includes('brass') || id.includes('silver') || id.includes('flint')) {
        return 2;
    }
    return 1;
}

function adjustGrade(baseGrade, tier, reinforce, statKey) {
    let idx = SCALING_GRADES.indexOf(baseGrade);
    if (idx === -1) idx = 1; // Default 'D'

    // High tiers increase grade index
    if (tier >= 9) idx += 2;
    else if (tier >= 5) idx += 1;

    // High reinforcement increases grade index
    if (reinforce >= 8) idx += 1;

    idx = Math.max(0, Math.min(SCALING_GRADES.length - 1, idx));
    let grade = SCALING_GRADES[idx];

    let bonus = calculateDynamicStatBonus(grade, statKey);
    return { grade: grade, bonus: bonus };
}

// ------------------------------------------------------------------------------
// 2. MAIN TOOLTIP RENDERING ENGINE
// ------------------------------------------------------------------------------

function renderReinforcementTooltips(tooltip, item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return;

    let id = String(item.id).toLowerCase();
    let reinforceLvl = getReinforceLevel(item);

    // Categorization
    let isShield = item.hasTag('c:tools/shields') || item.hasTag('c:shields') || 
                   item.hasTag('forge:shields') || item.hasTag('minecraft:shields') || 
                   id.includes('shield');

    let isArmor = !isShield && (
        item.hasTag('minecraft:armors') || item.hasTag('c:armors') ||
        item.hasTag('minecraft:head_armor') || item.hasTag('minecraft:chest_armor') ||
        item.hasTag('minecraft:leg_armor') || item.hasTag('minecraft:foot_armor') ||
        id.includes('helmet') || id.includes('chestplate') || id.includes('leggings') ||
        id.includes('boots') || id.includes('hood') || id.includes('robe') ||
        id.includes('crown') || id.includes('cap')
    );

    let isWeapon = !isShield && !isArmor && (
        item.hasTag('c:tools/melee_weapon') || item.hasTag('minecraft:swords') ||
        item.hasTag('minecraft:axes') || item.hasTag('c:tools/bows') ||
        item.hasTag('c:tools/crossbows') || item.hasTag('c:weapons') ||
        id.includes('sword') || id.includes('blade') || id.includes('claymore') ||
        id.includes('katana') || id.includes('dagger') || id.includes('scythe') ||
        id.includes('rapier') || id.includes('glaive') || id.includes('spear') ||
        id.includes('halberd') || id.includes('axe') || id.includes('bow') ||
        id.includes('crossbow') || id.includes('hammer') || id.includes('mace') ||
        id.includes('staff') || id.includes('wand') || id.includes('scepter')
    );

    let tier = getWeaponProgressionTier(item, id);

    // ==========================================================================
    // A. WEAPONS
    // ==========================================================================
    if (isWeapon) {
        // 1. Reinforcement badge if reinforced
        if (reinforceLvl > 0) {
            let dmgBonus = reinforceLvl * 5;
            tooltip.add(Text.of(`§6★ Заточка: §e+${reinforceLvl} §7(+${dmgBonus}% урона)`));
        }

        // 2. Elden Ring Scaling grades
        let primaryStat = 'Сила:     ';
        let secondaryStat = 'Ловкость: ';
        let primaryKey = 'strength';
        let secondaryKey = 'agility';
        let baseG1 = 'B';
        let baseG2 = 'D';

        if (id.includes('hammer') || id.includes('claymore') || id.includes('greataxe') || 
            id.includes('greatsword') || id.includes('halberd') || id.includes('broadsword') || id.includes('mace')) {
            // Colossal & Heavy: STR (B->A->S), AGI (D->C)
            primaryStat = 'Сила:     ';
            secondaryStat = 'Ловкость: ';
            primaryKey = 'strength';
            secondaryKey = 'agility';
            baseG1 = 'B';
            baseG2 = 'D';
        } else if (id.includes('katana') || id.includes('scythe') || id.includes('rapier') || id.includes('glaive')) {
            // Finesse: AGI (B->A->S), STR (C->B)
            primaryStat = 'Ловкость: ';
            secondaryStat = 'Сила:     ';
            primaryKey = 'agility';
            secondaryKey = 'strength';
            baseG1 = 'B';
            baseG2 = 'C';
        } else if (id.includes('dagger') || id.includes('sai') || id.includes('bow') || id.includes('crossbow')) {
            // Agility & Ranged: AGI (B->A->S), CRIT (D->C)
            primaryStat = 'Ловкость: ';
            secondaryStat = 'Точность: ';
            primaryKey = 'agility';
            secondaryKey = 'crit';
            baseG1 = 'B';
            baseG2 = 'D';
        } else if (id.includes('staff') || id.includes('wand') || id.includes('spellbook') || 
                   id.includes('scepter') || id.startsWith('irons_spellbooks:')) {
            // Magic Focus: INT (A->S), VIT (D->C)
            primaryStat = 'Интеллект:';
            secondaryStat = 'Ловкость: ';
            primaryKey = 'mana';
            secondaryKey = 'agility';
            baseG1 = 'A';
            baseG2 = 'D';
        } else {
            // Balanced Swords & Spears: STR (C->B->A), AGI (C->B->A)
            primaryStat = 'Сила:     ';
            secondaryStat = 'Ловкость: ';
            primaryKey = 'strength';
            secondaryKey = 'agility';
            baseG1 = 'C';
            baseG2 = 'D';
        }

        let sc1 = adjustGrade(baseG1, tier, reinforceLvl, primaryKey);
        let sc2 = adjustGrade(baseG2, tier, reinforceLvl, secondaryKey);

        tooltip.add(Text.of('§7Масштабирование:'));
        tooltip.add(Text.of(`  §b• ${primaryStat} §e[${sc1.grade}] §a(+${sc1.bonus}% урона)`));
        tooltip.add(Text.of(`  §b• ${secondaryStat} §e[${sc2.grade}] §a(+${sc2.bonus}% урона)`));

        // Reinforcement scaling display complete
    }

    // ==========================================================================
    // B. ARMOR
    // ==========================================================================
    else if (isArmor) {
        if (reinforceLvl > 0) {
            let defBonus = reinforceLvl * 4;
            let hpBonus = reinforceLvl * 2;
            tooltip.add(Text.of(`§6★ Закалка: §e+${reinforceLvl} §7(+${defBonus}% защиты, +${hpBonus} HP)`));
        }

        if (reinforceLvl >= 7) {
            tooltip.add(Text.of('§d✦ Резонанс комплекта: §fСоберите все 4 части +7 для ауры -15% урона'));
        }
    }

    // ==========================================================================
    // C. SHIELDS
    // ==========================================================================
    else if (isShield) {
        if (reinforceLvl > 0) {
            let shieldBonus = reinforceLvl * 50;
            tooltip.add(Text.of(`§6★ Закалка: §e+${reinforceLvl} §7(+${shieldBonus} к стойкости блока)`));
        }

        // Posture pool calculation synchronized with shield_guard_posture engine: 100 + (reinforce * 50)
        let maxPosture = 100 + (reinforceLvl * 50);

        // Through-damage mitigation: 75% base + (2.5% * reinforce), reaching 100% at +10
        let chipReduction = Math.min(100, Math.round(75 + (reinforceLvl * 2.5)));

        tooltip.add(Text.of(`§b🛡 Стойкость блока: §f[${maxPosture} / ${maxPosture}]`));
        tooltip.add(Text.of(`§7Сквозной урон: §a-${chipReduction}%`));
    }
}

// ------------------------------------------------------------------------------
// 3. EVENT REGISTRATION (KubeJS 21 NeoForge Dynamic Tooltips)
// ------------------------------------------------------------------------------

ItemEvents.modifyTooltips(event => {
    event.modify('*', text => {
        text.dynamic('elyrium_reinforcement');
    });
});

ItemEvents.dynamicTooltips('elyrium_reinforcement', event => {
    let item = event.item;
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return;
    renderReinforcementTooltips(event.lines, item);
});

