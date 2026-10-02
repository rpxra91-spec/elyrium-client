// ==============================================================================
// ⚡ CLIENT TOOLTIPS: GEAR SCORE DISPLAY (KUBEJS 1.21.1)
// ==============================================================================

ItemEvents.modifyTooltips(event => {
    event.modify('*', text => {
        text.dynamic('elyrium_gear_score');
    });
});

ItemEvents.dynamicTooltips('elyrium_gear_score', event => {
    let item = event.item;
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return;

    let id = String(item.id).toLowerCase();
    let isWeapon = item.hasTag('c:tools') || item.hasTag('minecraft:swords') || 
                   item.hasTag('minecraft:axes') || item.hasTag('c:weapons') || 
                   id.includes('sword') || id.includes('claymore') || id.includes('katana') || 
                   id.includes('scythe') || id.includes('axe') || id.includes('bow') || 
                   id.includes('staff') || id.includes('hammer') || id.includes('daggers') ||
                   id.includes('glaive') || id.includes('spear');

    let isArmor = item.hasTag('minecraft:head_armor') || item.hasTag('minecraft:chest_armor') || 
                  item.hasTag('minecraft:leg_armor') || item.hasTag('minecraft:foot_armor') ||
                  id.includes('helmet') || id.includes('chestplate') || id.includes('leggings') || 
                  id.includes('boots') || id.includes('hood') || id.includes('robe');

    let isShield = id.includes('shield');
    let isCurio = id.includes('ring') || id.includes('amulet') || id.includes('necklace') || 
                  id.includes('charm') || id.includes('belt') || id.startsWith('relics:') || 
                  id.startsWith('artifacts:');

    if (!isWeapon && !isArmor && !isShield && !isCurio) return;

    // 1. Determine Tier (1 to 8 + 1.5 Undergarden)
    let tier = 1;
    for (let t = 8; t >= 1; t--) {
        if (item.hasTag(`skd:tier_${t}`) || item.hasTag(`c:tools/tier_${t}`)) {
            tier = t;
            break;
        }
    }

    if (tier === 1) {
        if (id.includes('mortum') || id.includes('divinerpg:mortum') || id.includes('halite') || id.includes('apalachia') || id.includes('skythern')) tier = 8;
        else if (id.includes('eden') || id.includes('wildwood') || id.includes('divinerpg:eden') || id.includes('divinerpg:wildwood')) tier = 7;
        else if (id.includes('sculk') || id.includes('echo') || id.startsWith('deeperdarker:') || id.includes('warden')) tier = 6;
        else if (id.includes('starlight') || id.startsWith('eternal_starlight:') || id.includes('luminite') || id.includes('luminarite')) tier = 5;
        else if (id.includes('dragon') || id.includes('ender_guardian') || id.includes('elytra') || id.includes('void_alloy') || id.includes('enderite')) tier = 4;
        else if (id.includes('gravitite') || id.includes('zanite') || id.startsWith('aether:') || id.startsWith('deep_aether:') || id.includes('skyjade') || id.includes('valkyrie')) tier = 3;
        else if (id.includes('cinder') || id.includes('netherite') || id.startsWith('cataclysm:') || id.includes('ignis') || id.includes('ignitium') || id.includes('monstrosity')) tier = 2;
        else if (id.includes('cloggrum') || id.includes('froststeel') || id.startsWith('undergarden:')) tier = 1.5;
        else tier = 1;
    }

    // 2. Base Gear Score by Tier & Category
    let tierBaseTable = {
        1: 50,
        1.5: 90,
        2: 150,
        3: 350,
        4: 650,
        5: 1050,
        6: 1550,
        7: 2150,
        8: 2850
    };
    let tierBase = tierBaseTable[tier] || 50;
    let baseScore = tierBase;

    if (isArmor) {
        let slotMultiplier = 1.0;
        if (id.includes('chestplate') || id.includes('robe')) slotMultiplier = 1.25;
        else if (id.includes('boots')) slotMultiplier = 0.85;
        baseScore = Math.round(tierBase * 0.75 * slotMultiplier);
    } else if (isShield) {
        baseScore = Math.round(tierBase * 0.6);
    } else if (isCurio) {
        baseScore = Math.round(tierBase * 0.7);
    }

    // 3. Reinforcement Bonus
    let reinforceBonus = 0;
    try {
        let tag = item.customData || item.nbt;
        if (tag && tag.contains('skd_reinforce')) {
            reinforceBonus = tag.getInt('skd_reinforce') * 25;
        }
    } catch (e) {}

    // 4. Enchantment Bonus
    let enchantBonus = 0;
    try {
        let enchants = item.getEnchantments();
        if (enchants) {
            enchants.forEach((level, enchant) => {
                enchantBonus += (Number(level) || 1) * 15;
            });
        }
    } catch (e) {}

    // 5. Apotheosis Affix Bonus
    let affixBonus = 0;
    try {
        let tag = item.customData || item.nbt;
        if (tag && tag.contains('apoth.rarity')) {
            let rarity = String(tag.getString('apoth.rarity')).toLowerCase();
            if (rarity.includes('uncommon')) affixBonus += 40;
            else if (rarity.includes('rare')) affixBonus += 80;
            else if (rarity.includes('epic')) affixBonus += 150;
            else if (rarity.includes('mythic')) affixBonus += 250;
            else if (rarity.includes('ancient')) affixBonus += 380;
            else affixBonus += 20;
        }
    } catch (e) {}

    let total = Math.round(baseScore + reinforceBonus + enchantBonus + affixBonus);
    let tierColors = {
        1: '§7',
        1.5: '§2',
        2: '§c',
        3: '§b',
        4: '§d',
        5: '§9',
        6: '§3',
        7: '§a',
        8: '§6'
    };
    let tierColor = tierColors[tier] || '§f';
    let displayTier = (tier === 1.5) ? 'T1.5' : `T${tier}`;

    event.lines.add(Text.of(`§6⚡ Gear Score: ${tierColor}+${total} §8[${tierColor}${displayTier}§8]`));
});
