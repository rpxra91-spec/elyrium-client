// ==============================================================================
// 🔮 ELYRIUM RPG: RUNIC GLYPHS EQUIPMENT TOOLTIPS (v2.0)
// Minecraft 1.21.1 NeoForge | KubeJS Client Script
// ==============================================================================
// Displays inscribed Ancient Runic Glyphs on Weapons, Armor, and Shields:
// - Shows Enchantment Capacity (e.g. 1/2 or 2/2)
// - Color-coded Rarity: Common ⚪, Uncommon 🟢, Rare 🔵, Epic 🟣, Legendary 🟠
// - Calculated exact stat bonuses based on Tier and Rarity.
// ==============================================================================

const CLIENT_GLYPH_DATA = {
    'sharpness': { name: 'Заточка', color: '§c', base: 3.0, unit: '% физ. урона' },
    'elemental': { name: 'Стихийный Раскол', color: '§6', base: 2.5, unit: '% стихийного урона' },
    'vampirism': { name: 'Похищение Жизни', color: '§5', base: 1.0, unit: '% вампиризма в HP' },
    'executioner': { name: 'Казнь Палача', color: '§4', base: 4.0, unit: '% урона по целям <30% HP' },
    'protection': { name: 'Оплот', color: '§b', base: 1.5, unit: '% защиты' },
    'unbreaking': { name: 'Несокрушимость', color: '§a', base: 12.0, unit: '% сохранения прочности' },
    'bastion': { name: 'Бастион', color: '§9', base: 5.0, unit: '% стойки блока' },
    'swiftness': { name: 'Скороход', color: '§e', base: 2.0, unit: '% скорости бега' },
    'mystic_flow': { name: 'Рунный Приток', color: '§3', base: 15.0, unit: ' маны / +5% стамины' }
};

const CLIENT_RARITY_INFO = [
    { name: 'Обычный', color: '§f', mult: 1.00 },
    { name: 'Необычный', color: '§a', mult: 1.15 },
    { name: 'Редкий', color: '§9', mult: 1.30 },
    { name: 'Эпический', color: '§5', mult: 1.50 },
    { name: 'Легендарный', color: '§6', mult: 1.75 }
];

function getClientGearGlyphs(item) {
    if (!item || item.isEmpty()) return [];
    let result = [];
    try {
        if (item.customData && item.customData.contains('elyrium_glyphs')) {
            let list = item.customData.get('elyrium_glyphs');
            if (list) {
                for (let i = 0; i < list.size(); i++) {
                    let entry = list.get(i);
                    if (entry.getAsCompound) {
                        let c = entry.getAsCompound();
                        let type = c.getString('type');
                        let tier = c.getInt('tier') || 1;
                        let rarity = c.getInt('rarity') || 0;
                        if (type && CLIENT_GLYPH_DATA[type]) {
                            result.push({ type: type, tier: tier, rarity: rarity });
                        }
                    }
                }
            }
        }
    } catch (e) {}
    return result;
}

ItemEvents.modifyTooltips(event => {
    event.modify('*', text => {
        text.dynamic('elyrium_runic_glyphs');
    });
});

ItemEvents.dynamicTooltips('elyrium_runic_glyphs', event => {
    let item = event.item;
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return;

    let glyphs = getClientGearGlyphs(item);
    if (!glyphs || glyphs.length === 0) return;

    let lines = event.lines;
    lines.add(Text.of(`§8─── Древние Глифы Начертания (${glyphs.length}/2) ───`));

    glyphs.forEach(g => {
        let def = CLIENT_GLYPH_DATA[g.type];
        if (!def) return;

        let rInfo = CLIENT_RARITY_INFO[g.rarity] || CLIENT_RARITY_INFO[0];
        let mult = rInfo.mult;

        let val = (def.base * (1 + (g.tier - 1) * 0.35) * mult).toFixed(1);
        if (g.type === 'vampirism') {
            val = ((1.0 + (g.tier - 2) * 0.5) * mult).toFixed(1);
        }

        lines.add(Text.of(`${rInfo.color}✦ [${rInfo.name}] ${def.color}${def.name} T${g.tier}: §f+${val}${def.unit}`));
    });
});
