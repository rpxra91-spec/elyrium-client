// ==============================================================================
// ⚔️ ELYRIUM: GEAR STAT REQUIREMENTS & HYBRID WEAPON/ARMOR GATING
// ==============================================================================
// 1. Effective Stats = Base (SimpleStats perks) + Buffs (Potions) + Curios/Rings
// 2. Hybrid Requirements: STR, AGI, DEF, VIT, CRIT, MANA
// 3. Penalty: "Непосильная ноша" (Overburdened) - 85% damage penalty, slowness, fatigue
// ==============================================================================

const STAT_LABELS = {
    str: 'Сила',
    vit: 'Живучесть',
    def: 'Стойкость',
    agi: 'Ловкость',
    crit: 'Точность',
    mana: 'Интеллект'
};

// Calculate effective stats for a player (Base + Potions + Curios / Gear)
function getEffectiveStats(player) {
    if (!player) return { str: 1, vit: 1, def: 1, agi: 1, crit: 1, mana: 1 };

    let perks = player.persistentData.getCompound('simplestats_perks');
    let str = 1 + (perks ? perks.getInt('strength') : 0);
    let vit = 1 + (perks ? perks.getInt('vitality') : 0);
    let def = 1 + (perks ? perks.getInt('defense') : 0);
    let agi = 1 + (perks ? perks.getInt('agility') : 0);
    let crit = 1 + (perks ? perks.getInt('crit') : 0);
    let mana = 1 + (perks ? perks.getInt('mana') : 0);

    // 1. Active Potion Effect Modifiers
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
                        
                        // Common jewelry items
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
        // Fallback safely if Curios reflection is not present
    }

    return { str: str, vit: vit, def: def, agi: agi, crit: crit, mana: mana };
}

// Determine weapon tier (8 Tiers Canon + 1.5 Undergarden)
function getWeaponProgressionTier(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return 1;

    for (let t = 8; t >= 1; t--) {
        if (item.hasTag(`skd:tier_${t}`) || item.hasTag(`c:tools/tier_${t}`)) return t;
    }

    let id = item.id.toLowerCase();

    // Tier 8: DivineRPG Mortum, Apalachia & Skythern (Финал)
    if (id.includes('mortum') || id.includes('divinerpg:mortum') || id.includes('aquatooth') || id.includes('halite') ||
        id.includes('apalachia') || id.includes('skythern') || id.includes('divinerpg:apalachia') || id.includes('divinerpg:skythern')) return 8;

    // Tier 7: DivineRPG Eden & Wildwood
    if (id.includes('eden') || id.includes('wildwood') || id.includes('divinerpg:eden') || id.includes('divinerpg:wildwood')) return 7;

    // Tier 6: Deeper Darker (Otherside) / Warden
    if (id.includes('sculk') || id.includes('echo') || id.includes('warden') || id.startsWith('deeperdarker:')) return 6;

    // Tier 5: Eternal Starlight
    if (id.includes('starlight') || id.includes('luminite') || id.includes('luminarite') || id.startsWith('eternal_starlight:') || id.includes('thermal_springstone')) return 5;

    // Tier 4: The End / Void / Ender Guardian / Dragon
    if (id.includes('dragon') || id.includes('void') || id.includes('ender_guardian') || id.includes('ender_golem') || id.includes('elytra') || id.includes('enderite')) return 4;

    // Tier 3: The Aether & Deep Aether
    if (id.includes('gravitite') || id.includes('zanite') || id.includes('valkyrie') || id.includes('skyjade') || id.startsWith('aether:') || id.startsWith('deep_aether:')) return 3;

    // Tier 2: The Nether (Cinder Alloy, Netherite, Ignitium, Cataclysm)
    if (id.includes('cinder') || id.includes('netherite') || id.startsWith('cataclysm:') || id.includes('ignitium') || id.includes('witherite') || id.includes('monstrosity') || id.includes('wither') || id.includes('ignis')) return 2;

    // Tier 1.5: The Undergarden
    if (id.includes('cloggrum') || id.includes('froststeel') || id.startsWith('undergarden:')) return 1.5;

    // Tier 1: Overworld
    return 1;
}

// 8-Tier Soft Entry Requirements Table [Primary Stat, Secondary Stat]
const TIER_STAT_REQS = {
    1.5: { weapon: [4, 2],   armor: [1, 1] },
    2:   { weapon: [8, 4],   armor: [2, 2] },
    3:   { weapon: [13, 6],  armor: [3, 2] },
    4:   { weapon: [18, 9],  armor: [4, 3] },
    5:   { weapon: [22, 11], armor: [5, 4] },
    6:   { weapon: [25, 12], armor: [6, 5] },
    7:   { weapon: [28, 13], armor: [7, 6] },
    8:   { weapon: [30, 15], armor: [8, 7] }
};

// Get Hybrid Stat Requirements for an Item (11 Tiers)
function getItemRequirements(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return null;

    let id = item.id.toLowerCase();
    let tier = getWeaponProgressionTier(item);

    // Tier 1 items have no stat requirements (accessible to all new players)
    if (tier <= 1) return null;

    let table = TIER_STAT_REQS[tier];
    if (!table) return null;

    let reqs = [];

    // 1. WEAPONS: Heavy 2H (Claymore, Warhammer, Greatsword, Greataxe, Halberd) -> STR + DEF
    if (id.includes('hammer') || id.includes('claymore') || id.includes('greataxe') || 
        id.includes('greatsword') || id.includes('halberd') || id.includes('broadsword')) {
        reqs.push({ stat: 'str', val: table.weapon[0] }, { stat: 'def', val: table.weapon[1] });
        return reqs;
    }

    // 2. WEAPONS: Finesse & Hybrid (Katana, Scythe, Rapier, Glaive) -> AGI + STR
    if (id.includes('katana') || id.includes('scythe') || id.includes('rapier') || id.includes('glaive')) {
        reqs.push({ stat: 'agi', val: table.weapon[0] }, { stat: 'str', val: table.weapon[1] });
        return reqs;
    }

    // 3. WEAPONS: Agility & Ranged (Daggers, Sai, Bows, Crossbows) -> AGI + CRIT
    if (id.includes('dagger') || id.includes('sai') || id.includes('bow') || id.includes('crossbow')) {
        reqs.push({ stat: 'agi', val: table.weapon[0] }, { stat: 'crit', val: table.weapon[1] });
        return reqs;
    }

    // 4. WEAPONS: Magic & Focuses (Staff, Wand, Spellbook, Scepter) -> MANA + VIT
    if (id.includes('staff') || id.includes('wand') || id.includes('spellbook') || 
        id.includes('scepter') || id.startsWith('irons_spellbooks:')) {
        reqs.push({ stat: 'mana', val: table.weapon[0] }, { stat: 'vit', val: table.weapon[1] });
        return reqs;
    }

    // 5. WEAPONS: Standard Balanced (Sword, Spear, Pike) -> STR + AGI
    if (id.includes('sword') || id.includes('spear') || id.includes('blade')) {
        reqs.push({ stat: 'str', val: table.weapon[0] }, { stat: 'agi', val: table.weapon[1] });
        return reqs;
    }

    // 6. ARMOR: Heavy Plate Pieces (Requires STR & DEF per piece)
    if (id.includes('chestplate') || id.includes('leggings') || id.includes('boots') || id.includes('helmet') || id.includes('shield')) {
        reqs.push({ stat: 'str', val: table.armor[0] }, { stat: 'def', val: table.armor[1] });
        return reqs;
    }

    return null;
}

// ------------------------------------------------------------------------------
// COMBAT HOOK: Check weapon requirements on attack
// ------------------------------------------------------------------------------
EntityEvents.beforeHurt(event => {
    let source = event.source;
    if (!source) return;
    let attacker = source.actual;

    if (!attacker || !attacker.isPlayer()) return;
    if (attacker.isCreative() || attacker.isSpectator()) return;

    let weapon = attacker.mainHandItem;
    let reqs = getItemRequirements(weapon);
    if (!reqs || reqs.length === 0) return;

    let stats = getEffectiveStats(attacker);
    let missing = [];

    for (let r of reqs) {
        let cur = stats[r.stat] || 0;
        if (cur < r.val) {
            missing.push(`${STAT_LABELS[r.stat]} ${r.val} (у вас ${cur})`);
        }
    }

    if (missing.length > 0) {
        // Drastically reduce damage (down to weak stick damage)
        event.damage = Math.min(event.damage * 0.15, 2.0);

        // Weakness & fatigue penalty
        attacker.potionEffects.add('minecraft:weakness', 60, 2, false, false);
        attacker.potionEffects.add('minecraft:mining_fatigue', 60, 1, false, false);

        // Sound effect
        attacker.server.runCommandSilent(`playsound minecraft:block.anvil.land player ${attacker.username} ~ ~ ~ 0.8 1.5`);

        // Actionbar message
        attacker.displayClientMessage(
            Text.of(`§4⚠ Непосильная ноша! §cТребуется: §e${missing.join(' §c+ §e')}`),
            true
        );
    }
});

// ------------------------------------------------------------------------------
// TICK HOOK: Check armor requirements every 20 ticks (1 sec)
// ------------------------------------------------------------------------------
PlayerEvents.tick(event => {
    let player = event.player;
    let tick = (typeof player.tickCount === 'number') ? player.tickCount : (player.age || 0);
    if (tick % 20 !== 0) return;
    if (player.isCreative() || player.isSpectator()) return;

    let stats = getEffectiveStats(player);
    let armorSlots = [
        player.getHeadArmorItem(),
        player.getChestArmorItem(),
        player.getLegsArmorItem(),
        player.getFeetArmorItem()
    ];

    let totalArmorMissing = 0;

    for (let item of armorSlots) {
        let reqs = getItemRequirements(item);
        if (reqs) {
            for (let r of reqs) {
                let cur = stats[r.stat] || 0;
                if (cur < r.val) {
                    totalArmorMissing += (r.val - cur);
                }
            }
        }
    }

    if (totalArmorMissing > 0) {
        let slownessAmp = totalArmorMissing >= 8 ? 2 : 1;
        player.potionEffects.add('minecraft:slowness', 40, slownessAmp, false, false);

        if (tick % 100 === 0) { // Every 5 seconds
            player.displayClientMessage(
                Text.of(`§c🛡 Тяжёлые доспехи сковывают движения! Не хватает Силы/Стойкости.`),
                true
            );
        }
    }
});
