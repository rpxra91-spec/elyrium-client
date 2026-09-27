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

    // 1. Determine Tier (1 to 11)
    let tier = 1;
    for (let t = 11; t >= 1; t--) {
        if (item.hasTag(`skd:tier_${t}`) || item.hasTag(`c:tools/tier_${t}`)) {
            tier = t;
            break;
        }
    }

    if (tier === 1) {
        if (id.includes('mortum') || id.includes('divinerpg:mortum')) tier = 11;
        else if (id.includes('apalachia') || id.includes('skythern')) tier = 10;
        else if (id.includes('eden') || id.includes('wildwood')) tier = 9;
        else if (id.includes('sculk') || id.includes('echo') || id.startsWith('deeperdarker:')) tier = 8;
        else if (id.includes('starlight') || id.startsWith('eternal_starlight:')) tier = 7;
        else if (id.includes('dragon') || id.includes('ender_guardian') || id.includes('elytra')) tier = 6;
        else if (id.includes('gravitite') || id.includes('zanite') || id.startsWith('aether:')) tier = 5;
        else if (id.includes('cinder') || id.includes('netherite') || id.startsWith('cataclysm:')) tier = 4;
        else if (id.includes('diamond') || id.includes('cobalt') || id.includes('rune')) tier = 3;
        else if (id.includes('copper') || id.includes('chain') || id.includes('gold') || id.includes('bronze')) tier = 2;
    }

    // 2. Base Gear Score by Tier & Category
    let tierBase = [0, 35, 85, 190, 360, 520, 700, 920, 1180, 1480, 1850, 2300][tier] || 35;
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
    let tierColors = ['', '§7', '§a', '§b', '§6', '§e', '§d', '§3', '§1', '§2', '§5', '§4'];
    let tierColor = tierColors[tier] || '§f';

    event.lines.add(Text.of(`§6⚡ Gear Score: ${tierColor}+${total} §8[${tierColor}T${tier}§8]`));
});
