// ==============================================================================
// 🔮 ELYRIUM RPG: SPELL CAPACITY, WEIGHT & RESONANCE TOOLTIPS (CLIENT SCRIPT)
// ==============================================================================

var C_ISpellContainer = Java.loadClass('io.redspace.ironsspellbooks.api.spells.ISpellContainer');

const CLIENT_BASE_WEIGHTS = {
    'irons_spellbooks:firebolt': 2,
    'irons_spellbooks:magic_missile': 2,
    'irons_spellbooks:poison_arrow': 2,
    'irons_spellbooks:gust': 2,
    'irons_spellbooks:glow': 2,
    'irons_spellbooks:root': 3,
    'irons_spellbooks:icicle': 3,
    'irons_spellbooks:shield': 3,
    'irons_spellbooks:spider_aspect': 3,
    'irons_spellbooks:poison_breath': 3,
    'irons_spellbooks:heal': 4,
    'irons_spellbooks:oakskin': 4,

    'irons_spellbooks:fireball': 6,
    'irons_spellbooks:blood_slash': 6,
    'irons_spellbooks:frostwave': 6,
    'irons_spellbooks:acid_orb': 6,
    'irons_spellbooks:blinding_flash': 5,
    'irons_spellbooks:slow': 5,
    'irons_spellbooks:blood_needles': 7,
    'irons_spellbooks:fortify': 7,
    'irons_spellbooks:lightning_bolt': 8,
    'irons_spellbooks:ice_spike': 8,
    'irons_spellbooks:teleport': 8,
    'irons_spellbooks:haste': 8,
    'irons_spellbooks:invisibility': 8,
    'irons_spellbooks:shockwave': 8,
    'irons_spellbooks:fang_ward': 9,
    'irons_spellbooks:charge': 9,
    'irons_spellbooks:cone_of_cold': 10,

    'irons_spellbooks:summon_skeleton': 12,
    'irons_spellbooks:guiding_bolt': 12,
    'irons_spellbooks:chain_lightning': 14,
    'irons_spellbooks:blaze_storm': 14,
    'irons_spellbooks:fire_breath': 14,
    'irons_spellbooks:wall_of_fire': 15,
    'irons_spellbooks:counterspell': 15,
    'irons_spellbooks:blight': 16,
    'irons_spellbooks:abyssal_shroud': 16,
    'irons_spellbooks:summon_vex': 16,
    'irons_spellbooks:black_hole': 18,
    'irons_spellbooks:summon_polar_bear': 18,
    'irons_spellbooks:sunbeam': 18,
    'irons_spellbooks:divine_smite': 18,

    'irons_spellbooks:fire_bomb': 25,
    'irons_spellbooks:evasion': 25,
    'irons_spellbooks:telekinesis': 25,
    'irons_spellbooks:planar_sight': 25,
    'irons_spellbooks:sculk_tentacles': 28,
    'irons_spellbooks:meteor': 30,
    'irons_spellbooks:eldritch_blast': 30,
    'irons_spellbooks:ray_of_frost': 30,
    'irons_spellbooks:heartstop': 35,
    'irons_spellbooks:wither_skull': 35,
    'irons_spellbooks:ascension': 35,
    'irons_spellbooks:sonic_boom': 40
};

function getClientSpellWeight(spellId, level) {
    if (!spellId) return 2;
    let sId = String(spellId).toLowerCase();
    let base = CLIENT_BASE_WEIGHTS[sId] !== undefined ? CLIENT_BASE_WEIGHTS[sId] : 6;
    let lvl = Math.max(1, level || 1);

    let perLevel = 1.0;
    if (base >= 25) perLevel = 4.0;
    else if (base >= 12) perLevel = 2.0;
    else if (base >= 6) perLevel = 1.0;
    else perLevel = 0.5;

    return Math.round(base + (lvl - 1) * perLevel);
}

const CLIENT_CAPACITY_TABLE = {
    weapon: [0, 3, 5, 8, 12, 16, 20, 24, 28, 32, 36, 42],
    wand: [0, 6, 10, 15, 22, 30, 38, 46, 54, 62, 70, 80],
    staff: [0, 8, 14, 20, 28, 38, 50, 62, 75, 90, 105, 120],
    grimoire: [0, 12, 20, 30, 45, 60, 80, 100, 120, 145, 170, 200]
};

function getClientItemProfile(item) {
    if (!item) return null;
    let id = String(item.id).toLowerCase();

    let isStaff = id.includes('staff') || id.includes('rod') || id.includes('cane');
    let isWand = id.includes('wand') && !isStaff;
    let isBook = id.includes('spell_book') || id.includes('grimoire') || id.includes('tome');
    let isWeapon = item.hasTag('c:tools') || item.hasTag('minecraft:swords') || 
                   item.hasTag('minecraft:axes') || id.includes('sword') || 
                   id.includes('blade') || id.includes('axe') || id.includes('bow') || 
                   id.includes('dagger') || id.includes('scythe') || id.includes('claymore') || 
                   id.includes('katana') || id.includes('spear');

    if (!isStaff && !isWand && !isBook && !isWeapon) return null;

    let tier = 1;
    if (id.includes('mortum') || id.includes('divinerpg:mortum')) tier = 11;
    else if (id.includes('apalachia') || id.includes('skythern')) tier = 10;
    else if (id.includes('eden') || id.includes('wildwood')) tier = 9;
    else if (id.includes('sculk') || id.includes('echo') || id.includes('warden')) tier = 8;
    else if (id.includes('starlight') || id.includes('luminite') || id.includes('astral')) tier = 7;
    else if (id.includes('ender') || id.includes('dragon') || id.includes('void')) tier = 6;
    else if (id.includes('aether') || id.includes('gravitite') || id.includes('zanite') || id.includes('valkyrie')) tier = 5;
    else if (id.includes('netherite') || id.includes('cinder') || id.includes('ignitium') || id.includes('crimson')) tier = 4;
    else if (id.includes('diamond') || id.includes('cobalt') || id.includes('rune') || id.includes('amethyst')) tier = 3;
    else if (id.includes('iron') || id.includes('bronze') || id.includes('copper') || id.includes('silver')) tier = 2;
    else tier = 1;

    if (isBook) {
        let cap = CLIENT_CAPACITY_TABLE.grimoire[tier];
        return { type: 'Гримуар', tier: tier, capacity: cap, bonus: '+Снижение маны (-20%)' };
    }
    if (isStaff) {
        let cap = CLIENT_CAPACITY_TABLE.staff[tier];
        let bonus = Math.round(15 + tier * 4);
        return { type: 'Посох', tier: tier, capacity: cap, bonus: `+${bonus}% к урону заклинаний` };
    }
    if (isWand) {
        let cap = CLIENT_CAPACITY_TABLE.wand[tier];
        let bonus = Math.round(10 + tier * 2);
        return { type: 'Жезл', tier: tier, capacity: cap, bonus: `+${bonus}% к силе чар (Быстрый каст)` };
    }
    let cap = CLIENT_CAPACITY_TABLE.weapon[tier];
    return { type: 'Оружие-Проводник', tier: tier, capacity: cap, bonus: 'Гибридный каст с руки' };
}

function renderProgressBar(current, max) {
    let totalBars = 8;
    let filled = Math.min(totalBars, Math.round((current / max) * totalBars));
    let barStr = '';
    for (let i = 0; i < totalBars; i++) {
        if (i < filled) {
            barStr += (current > max) ? '§4■' : '§b■';
        } else {
            barStr += '§8□';
        }
    }
    return `§7[${barStr}§7]`;
}

ItemEvents.modifyTooltips(event => {
    event.modify('*', tooltip => {
        let item = tooltip.item;
        if (!item) return;

        let id = String(item.id).toLowerCase();

        // 1. Tooltip for Scrolls
        if (id.includes('scroll')) {
            for (let sId in CLIENT_BASE_WEIGHTS) {
                let shortName = sId.replace('irons_spellbooks:', '');
                if (id.includes(shortName)) {
                    let w = CLIENT_BASE_WEIGHTS[sId];
                    tooltip.add(Text.of(`§d✦ Базовый вес: §e${w} §7оч. (+вес за каждый ранг уровня)`));
                    break;
                }
            }
            return;
        }

        // 2. Tooltip for Magic Implements & Hybrid Weapons
        let prof = getClientItemProfile(item);
        if (!prof) return;

        let curWeight = 0;
        let spellCounts = {};
        try {
            if (C_ISpellContainer.isSpellContainer(item)) {
                let container = C_ISpellContainer.get(item);
                if (container) {
                    let spells = container.getActiveSpells();
                    if (spells) {
                        for (let i = 0; i < spells.size(); i++) {
                            let slot = spells.get(i);
                            if (slot && slot.getSpell) {
                                let sId = String(slot.getSpell().getSpellResource()).toLowerCase();
                                let lvl = slot.getLevel ? slot.getLevel() : 1;
                                curWeight += getClientSpellWeight(sId, lvl);
                                spellCounts[sId] = (spellCounts[sId] || 0) + 1;
                            }
                        }
                    }
                }
            }
        } catch (e) {}

        let bar = renderProgressBar(curWeight, prof.capacity);
        tooltip.add(Text.of(`§d✦ [${prof.type} • Т${prof.tier}] §7Вместимость: §b${curWeight} §7/ §e${prof.capacity} §7оч. ${bar}`));
        if (prof.bonus) {
            tooltip.add(Text.of(`  §6⚡ Свойство: §a${prof.bonus}`));
        }

        // Display Elemental Resonance if duplicate spells detected
        for (let sId in spellCounts) {
            if (spellCounts[sId] >= 2) {
                let bonusPct = (spellCounts[sId] === 2) ? '+20%' : '+35%';
                let cleanName = sId.replace('irons_spellbooks:', '');
                tooltip.add(Text.of(`  §6✦ Стихийный Резонанс (${cleanName} x${spellCounts[sId]}): §e${bonusPct} к урону!`));
            }
        }

        if (curWeight > prof.capacity) {
            tooltip.add(Text.of(`§4⚠ МАГИЧЕСКАЯ ПЕРЕГРУЗКА! Спеллы сорвутся при касте! (-50% маны)`));
        }
    });
});
