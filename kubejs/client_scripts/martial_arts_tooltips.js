// ==============================================================================
// ⚔️ ELYRIUM RPG: MARTIAL ARTS & WEAPON ARTS TOOLTIPS (CLIENT SCRIPT)
// ==============================================================================
// Displays Physical Weapon Arts information on weapons and tablets:
// 1. Weapons:
//    - If weapon has skd_weapon_art:
//      §6⚔ Боевое Искусство: §e[ArtName §6Rank§e]
//        §7• Эффект: §fDescription
//        §7• Кулдаун: §aCooldown сек. §8(Активация: ПКМ / Guard Counter)
//    - If weapon has NO art inscribed and is reinforceable:
//      §8⚔ Боевое Искусство: [Пустая ячейка для Трактата]
// 2. Martial Tablets (8 Archetypes):
//    - Weapon restrictions, description of skill, archetype and rank.
// ==============================================================================

const ROMAN_RANKS = ['0', 'I', 'II', 'III', 'IV', 'V'];

const MARTIAL_ARTS = {
    'whirlwind': {
        name: 'Вихревой Размах',
        description: 'Размашистый круговой клив на 360° в радиусе 4.5 блоков с мощным отбрасыванием',
        weapons: 'Двуручные мечи, клейморы, секиры',
        baseCd: 14,
        archetype: 'Рассечение'
    },
    'martial_tablet_whirlwind': {
        name: 'Вихревой Размах',
        description: 'Размашистый круговой клив на 360° в радиусе 4.5 блоков с мощным отбрасыванием',
        weapons: 'Двуручные мечи, клейморы, секиры',
        baseCd: 14,
        archetype: 'Рассечение'
    },
    'earth_sunder': {
        name: 'Рассечение Земли',
        description: 'Мощный удар в землю с трещиной на 6 блоков, подбрасывающий врагов в воздух',
        weapons: 'Тяжелые двуручники, боевые молоты',
        baseCd: 18,
        archetype: 'Дробящее Рассечение'
    },
    'martial_tablet_earth_sunder': {
        name: 'Рассечение Земли',
        description: 'Мощный удар в землю с трещиной на 6 блоков, подбрасывающий врагов в воздух',
        weapons: 'Тяжелые двуручники, боевые молоты',
        baseCd: 18,
        archetype: 'Дробящее Рассечение'
    },
    'juggernaut': {
        name: 'Неумолимый Натиск',
        description: 'Стремительный таран со щитом (+40% защиты) и расталкиванием толпы',
        weapons: 'Двуручные мечи, алебарды',
        baseCd: 20,
        archetype: 'Натиск и Оборона'
    },
    'martial_tablet_juggernaut': {
        name: 'Неумолимый Натиск',
        description: 'Стремительный таран со щитом (+40% защиты) и расталкиванием толпы',
        weapons: 'Двуручные мечи, алебарды',
        baseCd: 20,
        archetype: 'Натиск и Оборона'
    },
    'lightning_thrust': {
        name: 'Молниеносный Выпад',
        description: 'Молниеносный рывок сквозь строй врагов на 6 блоков с глубоким кровотечением',
        weapons: 'Катаны, рапиры, кинжалы',
        baseCd: 12,
        archetype: 'Стремительный Выпад'
    },
    'martial_tablet_lightning_thrust': {
        name: 'Молниеносный Выпад',
        description: 'Молниеносный рывок сквозь строй врагов на 6 блоков с глубоким кровотечением',
        weapons: 'Катаны, рапиры, кинжалы',
        baseCd: 12,
        archetype: 'Стремительный Выпад'
    },
    'blood_rend': {
        name: 'Кровавый Росчерк',
        description: 'Рассекающий полумесяц алой энергии перед собой, исцеляющий на 10% от урона',
        weapons: 'Катаны, косы, сабли',
        baseCd: 14,
        archetype: 'Жажда Крови'
    },
    'martial_tablet_blood_rend': {
        name: 'Кровавый Росчерк',
        description: 'Рассекающий полумесяц алой энергии перед собой, исцеляющий на 10% от урона',
        weapons: 'Катаны, косы, сабли',
        baseCd: 14,
        archetype: 'Жажда Крови'
    },
    'seismic_slam': {
        name: 'Сейсмический Молот',
        description: 'Удар оземь с радиальной волной, оглушающий врагов на 2 секунды',
        weapons: 'Молоты, дубины, булавы',
        baseCd: 20,
        archetype: 'Землетрясение'
    },
    'martial_tablet_seismic_slam': {
        name: 'Сейсмический Молот',
        description: 'Удар оземь с радиальной волной, оглушающий врагов на 2 секунды',
        weapons: 'Молоты, дубины, булавы',
        baseCd: 20,
        archetype: 'Землетрясение'
    },
    'shadow_step': {
        name: 'Теневой Шаг',
        description: 'Телепортация за спину цели на 5 блоков, невидимость и 100% критический удар',
        weapons: 'Кинжалы, саи, когти',
        baseCd: 14,
        archetype: 'Скрытность'
    },
    'martial_tablet_shadow_step': {
        name: 'Теневой Шаг',
        description: 'Телепортация за спину цели на 5 блоков, невидимость и 100% критический удар',
        weapons: 'Кинжалы, саи, когти',
        baseCd: 14,
        archetype: 'Скрытность'
    },
    'arrow_barrage': {
        name: 'Залп Стрел',
        description: 'Веерный выстрел конусом из 5 спектральных стрел по площади',
        weapons: 'Луки, арбалеты',
        baseCd: 14,
        archetype: 'Стрелковое Мастерство'
    },
    'martial_tablet_arrow_barrage': {
        name: 'Залп Стрел',
        description: 'Веерный выстрел конусом из 5 спектральных стрел по площади',
        weapons: 'Луки, арбалеты',
        baseCd: 14,
        archetype: 'Стрелковое Мастерство'
    }
};

function getArtRankRoman(rank) {
    if (typeof rank === 'string') {
        let trimmed = rank.trim().toUpperCase();
        if (ROMAN_RANKS.indexOf(trimmed) !== -1) return trimmed;
        let num = parseInt(trimmed, 10);
        if (!isNaN(num) && num >= 1 && num <= 5) return ROMAN_RANKS[num];
        return trimmed;
    }
    let r = Math.max(1, Math.min(5, Math.floor(rank || 1)));
    return ROMAN_RANKS[r];
}

function calculateScaledCooldown(baseCd, rank) {
    let r = 1;
    if (typeof rank === 'number') {
        r = Math.max(1, Math.min(5, Math.floor(rank)));
    } else if (typeof rank === 'string') {
        let idx = ROMAN_RANKS.indexOf(rank.trim().toUpperCase());
        if (idx >= 1) {
            r = idx;
        } else {
            let num = parseInt(rank, 10);
            if (!isNaN(num)) r = Math.max(1, Math.min(5, num));
        }
    }
    // Scaling formula: Cooldown = BaseCD * (1.0 - (Rank - 1) * 0.08)
    let cd = baseCd * (1.0 - (r - 1) * 0.08);
    return Math.round(cd * 10) / 10;
}

function extractWeaponArt(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return null;

    let artKey = null;
    let rankVal = 1;

    let tag = null;
    try {
        if (item.customData) tag = item.customData;
        else if (item.getCustomData) tag = item.getCustomData();
        else if (item.nbt) tag = item.nbt;
    } catch (e) {}

    if (tag) {
        try {
            if (tag.contains('skd_weapon_art')) {
                let rawArt = tag.get('skd_weapon_art');
                if (typeof rawArt === 'string' || (rawArt && rawArt.asString)) {
                    artKey = String(tag.getString('skd_weapon_art'));
                } else if (rawArt && tag.getCompound) {
                    let comp = tag.getCompound('skd_weapon_art');
                    artKey = String(comp.getString('id') || comp.getString('name') || '');
                    if (comp.contains('rank')) rankVal = comp.getInt('rank');
                    else if (comp.contains('level')) rankVal = comp.getInt('level');
                }
            }
            if (tag.contains('skd_art_rank')) {
                rankVal = tag.getInt('skd_art_rank') || rankVal;
            } else if (tag.contains('skd_weapon_art_rank')) {
                rankVal = tag.getInt('skd_weapon_art_rank') || rankVal;
            }
        } catch (e) {}
    }

    if (artKey && artKey.length > 0) {
        let cleanKey = artKey.toLowerCase().replace('kubejs:', '').trim();
        return {
            key: cleanKey,
            rank: rankVal
        };
    }
    return null;
}

function isReinforceableWeapon(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = String(item.id).toLowerCase();

    // Not tablets, not smithing stones, not templates
    if (id.startsWith('kubejs:martial_tablet_') || id.startsWith('kubejs:smithing_stone_') || id.includes('template')) {
        return false;
    }

    // Exclude shields
    if (item.hasTag('c:tools/shields') || item.hasTag('c:shields') || item.hasTag('forge:shields') || item.hasTag('minecraft:shields') || id.includes('shield')) {
        return false;
    }

    // Exclude armor
    if (item.hasTag('minecraft:armors') || item.hasTag('c:armors') || 
        item.hasTag('minecraft:head_armor') || item.hasTag('minecraft:chest_armor') ||
        item.hasTag('minecraft:leg_armor') || item.hasTag('minecraft:foot_armor') ||
        id.includes('helmet') || id.includes('chestplate') || id.includes('leggings') || 
        id.includes('boots') || id.includes('hood') || id.includes('robe') || id.includes('crown')) {
        return false;
    }

    // Must be a melee or ranged weapon
    return item.hasTag('c:tools/melee_weapon') ||
           item.hasTag('minecraft:swords') ||
           item.hasTag('minecraft:axes') ||
           item.hasTag('c:tools/bows') ||
           item.hasTag('c:tools/crossbows') ||
           item.hasTag('c:weapons') ||
           id.includes('sword') || id.includes('blade') || id.includes('claymore') ||
           id.includes('katana') || id.includes('dagger') || id.includes('scythe') ||
           id.includes('rapier') || id.includes('glaive') || id.includes('spear') ||
           id.includes('halberd') || id.includes('axe') || id.includes('bow') ||
           id.includes('crossbow') || id.includes('hammer') || id.includes('mace') ||
           id.includes('staff') || id.includes('wand') || id.includes('scepter') ||
           id.includes('sai') || id.includes('trident');
}

function renderMartialTooltips(tooltip, item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return;
    let id = String(item.id).toLowerCase();

    // --------------------------------------------------------------------------
    // 1. TOOLTIP FOR MARTIAL TABLETS THEMSELVES
    // --------------------------------------------------------------------------
    if (id.startsWith('kubejs:martial_tablet_')) {
        let cleanId = id.replace('kubejs:', '');
        let art = MARTIAL_ARTS[cleanId];
        if (art) {
            let rank = 1;
            let tag = null;
            try {
                if (item.customData) tag = item.customData;
                else if (item.getCustomData) tag = item.getCustomData();
                else if (item.nbt) tag = item.nbt;
            } catch (e) {}
            if (tag && tag.contains('skd_art_rank')) {
                rank = tag.getInt('skd_art_rank') || 1;
            }

            let rankStr = getArtRankRoman(rank);
            let cd = calculateScaledCooldown(art.baseCd, rank);

            tooltip.add(Text.of('§6★ Ранг Трактата: §eРанг ' + rankStr + ' §7(I–V ранги)'));
            tooltip.add(Text.of('§e⚔ Подходящее оружие: §f' + art.weapons));
            tooltip.add(Text.of('§6✦ Боевой прием: §f' + art.description));
            tooltip.add(Text.of('  §7• Базовый откат: §a' + cd + ' сек. §8(Активация: ПКМ / Guard Counter)'));
            tooltip.add(Text.of('  §d• Стиль боя: §b' + art.archetype));
            tooltip.add(Text.of('§8💡 Вставляется в наковальне в пустое боевое оружие'));
        }
        return;
    }

    // --------------------------------------------------------------------------
    // 2. TOOLTIP FOR WEAPONS
    // --------------------------------------------------------------------------
    let weaponArt = extractWeaponArt(item);
    if (weaponArt) {
        let art = MARTIAL_ARTS[weaponArt.key];
        let artName = art ? art.name : weaponArt.key;
        let rankStr = getArtRankRoman(weaponArt.rank);
        let description = art ? art.description : 'Уникальный боевой навык мастера оружия';
        let baseCd = art ? art.baseCd : 15;
        let cooldown = calculateScaledCooldown(baseCd, weaponArt.rank);

        tooltip.add(Text.of('§6⚔ Боевое Искусство: §e[' + artName + ' §6' + rankStr + '§e]'));
        tooltip.add(Text.of('  §7• Эффект: §f' + description));
        tooltip.add(Text.of('  §7• Кулдаун: §a' + cooldown + ' сек. §8(Активация: ПКМ / Guard Counter)'));
        return;
    }

    // If weapon has NO art inscribed and is reinforceable:
    if (isReinforceableWeapon(item)) {
        tooltip.add(Text.of('§8⚔ Боевое Искусство: [Пустая ячейка для Трактата]'));
    }
}

// ------------------------------------------------------------------------------
// 3. EVENT REGISTRATION (Compatible with KubeJS 6 and KubeJS 21)
// ------------------------------------------------------------------------------

if (typeof ItemEvents !== 'undefined') {
    if (typeof ItemEvents.modifyTooltips === 'function') {
        ItemEvents.modifyTooltips(event => {
            event.modify('*', tooltip => {
                let item = tooltip.item;
                if (!item || item.isEmpty() || item.id === 'minecraft:air') return;
                renderMartialTooltips(tooltip, item);
            });
        });
    } else if (typeof ItemEvents.tooltip === 'function') {
        ItemEvents.tooltip(event => {
            event.addAdvanced('*', (item, advanced, text) => {
                let tooltipWrapper = {
                    add: (component) => text.add(component)
                };
                renderMartialTooltips(tooltipWrapper, item);
            });
        });
    }
}
