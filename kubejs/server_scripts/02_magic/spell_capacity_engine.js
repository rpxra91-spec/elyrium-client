// ==============================================================================
// 🔮 ELYRIUM RPG: SPELL CAPACITY, WEIGHT & RESONANCE ENGINE (v0.4.33)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// Features:
// 1. Spell Weight Accounting per slot level.
// 2. Dimensional Tier Capacity Caps:
//    - Weapons: 0 -> 4 -> 8 -> 14 -> 20 -> 26 -> 32 -> 38 -> 45
//    - Wands:   0 -> 8 -> 15 -> 25 -> 36 -> 48 -> 60 -> 72 -> 85
//    - Staves:  0 -> 12 -> 22 -> 35 -> 52 -> 70 -> 88 -> 108 -> 130
//    - Grimoires: 0 -> 16 -> 32 -> 55 -> 80 -> 110 -> 140 -> 175 -> 210
// 3. Overload Penalty: 100% mana drained & 50% fizzle risk if over capacity.
// 4. Elemental Resonance: duplicate spells of same school grant +20%/+35% spell damage.
// 5. 4-Rank Elemental Attunement (+5%..+25% to matched element):
//    - Rank I:   +5% Spell Power
//    - Rank II:  +10% Spell Power
//    - Rank III: +18% Spell Power
//    - Rank IV:  +25% Spell Power (MAX)
// ==============================================================================

var J_ISpellContainer = Java.loadClass('io.redspace.ironsspellbooks.api.spells.ISpellContainer');

// ------------------------------------------------------------------------------
// 1. BASE SPELL WEIGHT TABLE
// ------------------------------------------------------------------------------
const BASE_SPELL_WEIGHTS = {
    // Utility / Cantrips (Weight 2)
    'irons_spellbooks:firebolt': 2,
    'irons_spellbooks:magic_missile': 2,
    'irons_spellbooks:poison_arrow': 2,
    'irons_spellbooks:gust': 2,
    'irons_spellbooks:glow': 2,

    // Low-Tier Spells (Weight 3-4)
    'irons_spellbooks:root': 3,
    'irons_spellbooks:icicle': 3,
    'irons_spellbooks:shield': 3,
    'irons_spellbooks:spider_aspect': 3,
    'irons_spellbooks:poison_breath': 3,
    'irons_spellbooks:heal': 4,
    'irons_spellbooks:oakskin': 4,

    // Mid-Tier Combat Spells (Weight 5-10)
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

    // High-Tier Spells (Weight 12-20)
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

    // Ultimate / Master Spells (Weight 25-40)
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

function getSpellWeight(spellId, level) {
    if (!spellId) return 2;
    let sId = String(spellId).toLowerCase();
    let base = BASE_SPELL_WEIGHTS[sId] !== undefined ? BASE_SPELL_WEIGHTS[sId] : 6;
    let lvl = Math.max(1, level || 1);

    let perLevel = 1.0;
    if (base >= 25) perLevel = 4.0;
    else if (base >= 12) perLevel = 2.0;
    else if (base >= 6) perLevel = 1.0;
    else perLevel = 0.5;

    return Math.round(base + (lvl - 1) * perLevel);
}

// ------------------------------------------------------------------------------
// 2. CAPACITY TABLE (BY DIMENSIONAL TIER 1..8)
// ------------------------------------------------------------------------------
const CAPACITY_TABLE = {
    weapon: [0, 4, 8, 14, 20, 26, 32, 38, 45],
    weaponSlots: [0, 1, 1, 2, 2, 2, 3, 3, 3],

    wand: [0, 8, 15, 25, 36, 48, 60, 72, 85],
    wandSlots: [0, 2, 2, 3, 3, 4, 4, 4, 5],

    staff: [0, 12, 22, 35, 52, 70, 88, 108, 130],
    staffSlots: [0, 2, 3, 4, 4, 5, 5, 6, 6],

    grimoire: [0, 16, 32, 55, 80, 110, 140, 175, 210],
    grimoireSlots: [0, 3, 4, 5, 6, 7, 8, 9, 10]
};

function getItemMagicProfile(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return null;
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
    if (id.includes('mortum') || id.includes('divinerpg:mortum') || id.includes('apalachia') || id.includes('skythern')) tier = 8;
    else if (id.includes('eden') || id.includes('wildwood') || id.includes('divinerpg:eden') || id.includes('divinerpg:wildwood')) tier = 7;
    else if (id.includes('sculk') || id.includes('echo') || id.includes('warden') || id.startsWith('deeperdarker:')) tier = 6;
    else if (id.includes('starlight') || id.includes('luminite') || id.includes('luminarite') || id.startsWith('eternal_starlight:')) tier = 5;
    else if (id.includes('ender') || id.includes('dragon') || id.includes('void') || id.includes('elytra')) tier = 4;
    else if (id.includes('aether') || id.includes('gravitite') || id.includes('zanite') || id.includes('valkyrie') || id.includes('skyjade')) tier = 3;
    else if (id.includes('netherite') || id.includes('cinder') || id.includes('ignitium') || id.includes('crimson') || id.includes('ignis')) tier = 2;
    else tier = 1;

    if (isBook) {
        return { 
            type: 'grimoire', 
            tier: tier, 
            maxSpells: CAPACITY_TABLE.grimoireSlots[tier], 
            capacity: CAPACITY_TABLE.grimoire[tier], 
            manaDiscount: 0.20 
        };
    }
    if (isStaff) {
        return { 
            type: 'staff', 
            tier: tier, 
            maxSpells: CAPACITY_TABLE.staffSlots[tier], 
            capacity: CAPACITY_TABLE.staff[tier], 
            spellMultiplier: 1.15 + (tier * 0.04) 
        };
    }
    if (isWand) {
        return { 
            type: 'wand', 
            tier: tier, 
            maxSpells: CAPACITY_TABLE.wandSlots[tier], 
            capacity: CAPACITY_TABLE.wand[tier], 
            spellMultiplier: 1.10 + (tier * 0.02) 
        };
    }
    return { 
        type: 'weapon', 
        tier: tier, 
        maxSpells: CAPACITY_TABLE.weaponSlots[tier], 
        capacity: CAPACITY_TABLE.weapon[tier], 
        spellMultiplier: 1.0 
    };
}

function getRawItemStack(item) {
    if (!item) return null;
    if (typeof item.getItemStack === 'function') {
        return item.getItemStack();
    }
    return item;
}

// ------------------------------------------------------------------------------
// 3. AUTO-SOCKET INITIALIZATION
// ------------------------------------------------------------------------------
function ensureItemSpellContainer(itemStack) {
    if (!itemStack || itemStack.isEmpty()) return;
    let raw = getRawItemStack(itemStack);
    if (!raw) return;

    let prof = getItemMagicProfile(itemStack);
    if (!prof) return;

    try {
        if (J_ISpellContainer.isSpellContainer(raw)) {
            return;
        }

        let container = J_ISpellContainer.create(prof.maxSpells, true, false);
        J_ISpellContainer.set(raw, container);
    } catch (e) {
        console.error(`[MagicCapacity] Failed to setup spell container for ${itemStack.id}: ${e}`);
    }
}

// ------------------------------------------------------------------------------
// 4. OVERLOAD & RESONANCE ANALYSIS
// ------------------------------------------------------------------------------
function analyzeItemSpells(itemStack) {
    let result = {
        totalWeight: 0,
        spellCounts: {}, // spellId -> count
        maxResonanceSpell: null,
        maxResonanceCount: 1
    };

    if (!itemStack || itemStack.isEmpty()) return result;
    let raw = getRawItemStack(itemStack);
    if (!raw) return result;

    try {
        if (!J_ISpellContainer.isSpellContainer(raw)) return result;

        let container = J_ISpellContainer.get(raw);
        if (!container) return result;

        let spells = container.getActiveSpells();
        if (!spells) return result;

        for (let i = 0; i < spells.size(); i++) {
            let slot = spells.get(i);
            if (slot && slot.getSpell) {
                let sId = String(slot.getSpell().getSpellResource()).toLowerCase();
                let lvl = slot.getLevel ? slot.getLevel() : 1;
                let w = getSpellWeight(sId, lvl);
                result.totalWeight += w;

                result.spellCounts[sId] = (result.spellCounts[sId] || 0) + 1;
                if (result.spellCounts[sId] > result.maxResonanceCount) {
                    result.maxResonanceCount = result.spellCounts[sId];
                    result.maxResonanceSpell = sId;
                }
            }
        }
    } catch (e) {
        console.error(`[MagicCapacity] Error analyzing spells for ${itemStack.id}: ${e}`);
    }

    return result;
}

// ------------------------------------------------------------------------------
// 5. EVENT HOOKS: CAST OVERLOAD & RESISTANCE
// ------------------------------------------------------------------------------
PlayerEvents.tick(event => {
    let player = event.player;
    if (!player || player.level.isClientSide()) return;
    if (player.age % 40 !== 0) return; // Check every 2s

    let mainHand = player.mainHandItem;
    if (mainHand && !mainHand.isEmpty()) {
        ensureItemSpellContainer(mainHand);
    }
});

// Intercept Spell Cast / Spell Damage
EntityEvents.beforeHurt(event => {
    let source = event.source;
    if (!source) return;

    let dmgType = source.getType ? source.getType() : (source.type ? String(source.type) : '');
    let isMagic = (source.isMagic && source.isMagic()) || dmgType.includes('magic') || dmgType.includes('spell');
    if (!isMagic) return;

    let attacker = source.actual || source.player;
    if (!attacker || !attacker.isPlayer()) return;
    let player = attacker;

    let mainHand = player.mainHandItem;
    if (!mainHand || mainHand.isEmpty()) return;

    let prof = getItemMagicProfile(mainHand);
    if (!prof) return;

    let analysis = analyzeItemSpells(mainHand);

    // 1. OVERLOAD CHECK:
    if (analysis.totalWeight > prof.capacity) {
        // 50% fizzle risk
        if (Math.random() < 0.5) {
            event.cancel();
            player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ~ ~ ~ 1.0 0.8`);
            player.server.runCommandSilent(`particle minecraft:smoke ${player.x} ${player.y + 1.5} ${player.z} 0.5 0.5 0.5 0.05 30 normal`);
            player.tell(Text.of(`§4⚠ МАГИЧЕСКАЯ ПЕРЕГРУЗКА! §cЗаклинание сорвалось из-за превышения веса (${analysis.totalWeight}/${prof.capacity})!`));
            return;
        }
    }

    // 2. ELEMENTAL RESONANCE BONUS:
    let totalMultiplier = 1.0;
    if (analysis.maxResonanceCount >= 3) {
        totalMultiplier += 0.35; // +35% for 3+ identical spells
    } else if (analysis.maxResonanceCount === 2) {
        totalMultiplier += 0.20; // +20% for 2 identical spells
    }

    // 3. 4-RANK ELEMENTAL STONE ATTUNEMENT (+5% / +10% / +18% / +25%):
    let attunedElem = null;
    let attunedRank = 1;
    try {
        if (mainHand.customData && mainHand.customData.contains('elyrium_attuned_element')) {
            attunedElem = String(mainHand.customData.getString('elyrium_attuned_element')).toLowerCase().trim();
            if (mainHand.customData.contains('elyrium_attuned_rank')) {
                attunedRank = Math.max(1, Math.min(4, mainHand.customData.getInt('elyrium_attuned_rank')));
            }
        } else if (mainHand.nbt && mainHand.nbt.contains('elyrium_attuned_element')) {
            attunedElem = String(mainHand.nbt.getString('elyrium_attuned_element')).toLowerCase().trim();
            if (mainHand.nbt.contains('elyrium_attuned_rank')) {
                attunedRank = Math.max(1, Math.min(4, mainHand.nbt.getInt('elyrium_attuned_rank')));
            }
        }
    } catch (eAtt) {}

    if (attunedElem) {
        let isMatched = false;
        let dType = dmgType.toLowerCase();

        switch (attunedElem) {
            case 'fire':
                isMatched = dType.includes('fire') || dType.includes('flame');
                break;
            case 'frost':
                isMatched = dType.includes('ice') || dType.includes('frost') || dType.includes('freeze');
                break;
            case 'lightning':
                isMatched = dType.includes('lightning') || dType.includes('shock') || dType.includes('thunder');
                break;
            case 'holy':
                isMatched = dType.includes('holy') || dType.includes('divine') || dType.includes('radiant');
                break;
            case 'shadow':
                isMatched = dType.includes('blood') || dType.includes('ender') || dType.includes('eldritch') || dType.includes('shadow');
                break;
            case 'nature':
                isMatched = dType.includes('nature') || dType.includes('poison') || dType.includes('acid');
                break;
        }

        if (isMatched) {
            let rankBonus = (attunedRank === 1) ? 0.05 : (attunedRank === 2) ? 0.10 : (attunedRank === 3) ? 0.18 : 0.25;
            totalMultiplier += rankBonus;
        }
    }

    if (totalMultiplier > 1.0) {
        event.damage = event.damage * totalMultiplier;
    }
});
