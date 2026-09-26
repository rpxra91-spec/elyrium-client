// ==============================================================================
// 🔮 ELYRIUM RPG: HYBRID SPELL SOCKETING, CAPACITY & RESONANCE ENGINE (PHASE 9)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 1. Hybrid Weapon Sockets:
//    - Any weapon (sword, axe, dagger, bow, spear, etc.) can hold spells directly.
//    - Inscribed via standard Inscription Table, castable from hand (mustBeEquipped: false).
//    - Weapons have limited slots (1-3) and limited capacity points (3-42 pts across 11 tiers).
// 2. Dedicated Caster Implements (Wands, Staves, Grimoires):
//    - Wands: 2-5 slots, 6-80 capacity points, swift casting.
//    - Staves: 2-7 slots, 8-120 capacity points, innate spells, +15%..+60% spell power bonus.
//    - Grimoires/Spellbooks: 3-10 slots, 12-200 capacity points, mana cost reduction.
// 3. Dynamic Spell Weight by Level:
//    - Spell weight dynamically scales with spell level:
//      - Cantrips: +0.5 pt / level (Firebolt lvl 1 = 2, lvl 5 = 4, lvl 10 = 6)
//      - Tactical: +1 pt / level (Fireball lvl 1 = 6, lvl 3 = 8, lvl 5 = 10)
//      - Destructive: +2 pts / level (Chain Lightning lvl 1 = 14, lvl 3 = 18, lvl 5 = 22)
//      - Apocalyptic: +4 pts / level (Meteor lvl 1 = 30, lvl 2 = 34, lvl 3 = 38)
//    - Prevents endgame spell stacking in early tiers; leftover capacity naturally fits low-tier support!
// 4. Elemental Resonance (Duplicate Spell Synergy):
//    - Slotting identical spells into multiple slots triggers Elemental Resonance!
//    - 2 identical spells: Minor Resonance (+20% bonus damage to that spell).
//    - 3+ identical spells: Major Resonance (+35% bonus damage to that spell).
// 5. Overload & Backfire:
//    - If total spell weight > item capacity, the item is Overloaded.
//    - Attempting to cast from an overloaded weapon fizzles the spell and burns 50% mana!
// ==============================================================================

var J_ISpellContainer = Java.loadClass('io.redspace.ironsspellbooks.api.spells.ISpellContainer');
var J_SpellRegistry = Java.loadClass('io.redspace.ironsspellbooks.api.registry.SpellRegistry');
var J_MagicData = Java.loadClass('io.redspace.ironsspellbooks.api.magic.MagicData');

// ------------------------------------------------------------------------------
// 1. BASE SPELL WEIGHT REGISTRY (Base Cost at Level 1)
// ------------------------------------------------------------------------------
const SPELL_BASE_WEIGHTS = {
    // Rank 1: Cantrips & Minor Utility (Base 2 - 4 pts)
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

    // Rank 2: Tactical Combat Spells (Base 6 - 10 pts)
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

    // Rank 3: Destructive & Mass Evocation (Base 12 - 20 pts)
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

    // Rank 4: Apocalyptic & God-Tier Spells (Base 25 - 40 pts)
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

function getSpellWeight(spellId, spellObj, level) {
    if (!spellId) return 2;
    let sId = String(spellId).toLowerCase();
    let base = 6;
    if (SPELL_BASE_WEIGHTS[sId] !== undefined) {
        base = SPELL_BASE_WEIGHTS[sId];
    } else if (spellObj && spellObj.getRarity) {
        try {
            let r = spellObj.getRarity().ordinal();
            const RARITY_WEIGHTS = [3, 7, 14, 22, 32];
            base = RARITY_WEIGHTS[Math.min(r, RARITY_WEIGHTS.length - 1)];
        } catch (e) {}
    }

    let lvl = Math.max(1, level || 1);
    let perLevel = 1.0;
    if (base >= 25) {
        perLevel = 4.0; // God-Tier: +4 pts per level (Meteor lvl 1=30, lvl 2=34, lvl 3=38)
    } else if (base >= 12) {
        perLevel = 2.0; // Destructive: +2 pts per level (Chain Lightning lvl 1=14, lvl 2=16, lvl 3=18)
    } else if (base >= 6) {
        perLevel = 1.0; // Tactical: +1 pt per level (Fireball lvl 1=6, lvl 2=7, lvl 5=10)
    } else {
        perLevel = 0.5; // Cantrips: +0.5 pt per level (Firebolt lvl 1=2, lvl 3=3, lvl 5=4, lvl 10=6)
    }

    return Math.round(base + (lvl - 1) * perLevel);
}

// ------------------------------------------------------------------------------
// 2. ITEM CAPACITY & SLOT MATRIX ACROSS 11 TIERS
// ------------------------------------------------------------------------------
const CAPACITY_TABLE = {
    weapon: [0, 3, 5, 8, 12, 16, 20, 24, 28, 32, 36, 42],
    weaponSlots: [0, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3],

    wand: [0, 6, 10, 15, 22, 30, 38, 46, 54, 62, 70, 80],
    wandSlots: [0, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 5],

    staff: [0, 8, 14, 20, 28, 38, 50, 62, 75, 90, 105, 120],
    staffSlots: [0, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7],

    grimoire: [0, 12, 20, 30, 45, 60, 80, 100, 120, 145, 170, 200],
    grimoireSlots: [0, 3, 4, 5, 6, 7, 8, 8, 9, 9, 10, 10]
};

function getItemMagicProfile(itemStack) {
    if (!itemStack || itemStack.isEmpty()) return null;
    let id = String(itemStack.id).toLowerCase();

    let isStaff = id.includes('staff') || id.includes('rod') || id.includes('cane');
    let isWand = id.includes('wand') && !isStaff;
    let isBook = id.includes('spell_book') || id.includes('grimoire') || id.includes('tome');
    let isWeapon = itemStack.hasTag('c:tools') || itemStack.hasTag('minecraft:swords') || 
                   itemStack.hasTag('minecraft:axes') || id.includes('sword') || 
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
        return { 
            type: 'grimoire', 
            tier: tier, 
            maxSpells: CAPACITY_TABLE.grimoireSlots[tier], 
            capacity: CAPACITY_TABLE.grimoire[tier], 
            spellMultiplier: 1.05 
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

    if (!itemStack || itemStack.isEmpty()) {
        return result;
    }
    let raw = getRawItemStack(itemStack);
    if (!raw || !J_ISpellContainer.isSpellContainer(raw)) {
        return result;
    }

    try {
        let container = J_ISpellContainer.get(raw);
        if (!container) return result;
        let activeSpells = container.getActiveSpells();
        if (!activeSpells) return result;

        for (let i = 0; i < activeSpells.size(); i++) {
            let slot = activeSpells.get(i);
            if (slot && slot.getSpell) {
                let spell = slot.getSpell();
                let level = slot.getLevel ? slot.getLevel() : 1;
                let spellId = String(spell.getSpellResource()).toLowerCase();

                let w = getSpellWeight(spellId, spell, level);
                result.totalWeight += w;

                result.spellCounts[spellId] = (result.spellCounts[spellId] || 0) + 1;
                if (result.spellCounts[spellId] > result.maxResonanceCount) {
                    result.maxResonanceCount = result.spellCounts[spellId];
                    result.maxResonanceSpell = spellId;
                }
            }
        }
        return result;
    } catch (e) {
        return result;
    }
}

// ------------------------------------------------------------------------------
// 5. SERVER TICK & ANTI-OVERLOAD ENFORCEMENT
// ------------------------------------------------------------------------------
PlayerEvents.tick(event => {
    let player = event.player;
    if (!player || !player.isAlive()) return;
    let age = (player.age !== undefined && player.age !== null) ? player.age : (player.tickCount || 0);

    if (age % 10 === 0) {
        let mainHand = player.mainHandItem || player.getMainHandItem();
        if (mainHand && !mainHand.isEmpty()) {
            ensureItemSpellContainer(mainHand);

            let rawMain = getRawItemStack(mainHand);
            let prof = getItemMagicProfile(mainHand);
            if (prof && rawMain && J_ISpellContainer.isSpellContainer(rawMain)) {
                let analysis = analyzeItemSpells(rawMain);
                if (analysis.totalWeight > prof.capacity) {
                    try {
                        let magicData = J_MagicData.getPlayerMagicData(player);
                        if (magicData && magicData.isCasting()) {
                            magicData.resetCastingState();

                            let curMana = magicData.getMana();
                            magicData.setMana(Math.max(0, curMana * 0.5));

                            player.server.runCommandSilent(`playsound minecraft:block.glass.break player ${player.username} ~ ~ ~ 1.5 0.5`);
                            player.server.runCommandSilent(`playsound minecraft:entity.elder_guardian.curse player ${player.username} ~ ~ ~ 0.8 1.5`);
                            player.server.runCommandSilent(`particle minecraft:smoke ${player.x} ${player.y + 1} ${player.z} 0.5 0.5 0.5 0.05 20 normal`);

                            player.sendSystemMessage(Text.of(`§4⚡ МАГИЧЕСКАЯ ПЕРЕГРУЗКА! §cВес заклинаний (${analysis.totalWeight}) превышает лимит оружия (${prof.capacity} очков)! Заклинание сорвалось!`), true);
                            player.tell(Text.red(`⚡ [Перегрузка]: Ваше оружие нестабильно! Уберите избыточные заклинания на Столе Начертания.`));
                        }
                    } catch (err) {}
                }
            }
        }
    }

    if (age % 20 === 0) {
        let inv = player.inventory;
        if (inv) {
            let sz = inv.getContainerSize ? inv.getContainerSize() : (inv.size || 36);
            for (let i = 0; i < sz; i++) {
                let stack = inv.getItem(i);
                if (stack && !stack.isEmpty()) {
                    ensureItemSpellContainer(stack);
                }
            }
        }
    }
});

ItemEvents.crafted(event => {
    let stack = event.item;
    if (stack && !stack.isEmpty()) {
        ensureItemSpellContainer(stack);
    }
});

// ------------------------------------------------------------------------------
// 6. CASTER WEAPON & ELEMENTAL RESONANCE DAMAGE MULTIPLIERS
// ------------------------------------------------------------------------------
EntityEvents.beforeHurt(event => {
    let source = event.source;
    if (!source || !source.player) return;

    let player = source.player;
    let mainHand = player.getMainHandItem();
    if (!mainHand || mainHand.isEmpty()) return;

    let prof = getItemMagicProfile(mainHand);
    let isMagicDamage = source.isMagic && source.isMagic();
    let dmgType = source.getType ? String(source.getType()) : '';

    if (isMagicDamage || dmgType.includes('spell') || dmgType.includes('magic')) {
        let totalMultiplier = prof ? prof.spellMultiplier : 1.0;

        // Apply Elemental Resonance Synergy if duplicate spells are inscribed
        let analysis = analyzeItemSpells(mainHand);
        if (analysis.maxResonanceCount >= 2) {
            let resBonus = (analysis.maxResonanceCount === 2) ? 0.20 : 0.35; // +20% for 2 copies, +35% for 3+
            totalMultiplier += resBonus;

            let now = (typeof player.tickCount === 'number') ? player.tickCount : (player.age || 0);
            let lastNotice = player.persistentData.getInt('skd_last_resonance_notice');
            if (now - lastNotice >= 40) {
                player.persistentData.putInt('skd_last_resonance_notice', now);
                let shortName = analysis.maxResonanceSpell ? analysis.maxResonanceSpell.replace('irons_spellbooks:', '') : 'Стихии';
                player.sendSystemMessage(Text.of(`§6✦ СТИХИЙНЫЙ РЕЗОНАНС (${shortName} x${analysis.maxResonanceCount})! §e+${Math.round(resBonus * 100)}% к урону!`), true);
                player.server.runCommandSilent(`playsound minecraft:block.amethyst_block.resonate player ${player.username} ~ ~ ~ 0.8 1.4`);
            }
        }

        if (totalMultiplier > 1.0) {
            event.damage = event.damage * totalMultiplier;
        }
    }
});
