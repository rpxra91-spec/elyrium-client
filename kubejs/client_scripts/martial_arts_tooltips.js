// ==============================================================================
// ⚔️ ELYRIUM RPG: MARTIAL ARTS & WEAPON ARTS TOOLTIPS (CLIENT SCRIPT v2.2)
// Minecraft 1.21.1 NeoForge | KubeJS Client Script
// ==============================================================================
// Displays Physical Weapon Arts information on weapons and tablets:
// 1. Weapons:
//    - §6⚔ Врожденный прием: §e[Прием] §8[ПКМ / Shift+ПКМ со щитом]
//      §7• Эффект: §fОписание
//      §7• Затраты: §bX Выносливости §7| Откат: §aY сек.
//    - §d💎 Рунический навык: §e[Навык Ранг] §8[Shift+ПКМ] (или пустой слот)
// 2. Martial Tablets:
//    - Archetype, suitable weapons, effect, stamina cost, cooldown, rank.
// ==============================================================================

const ROMAN_RANKS = ['0', 'I', 'II', 'III', 'IV', 'V'];

const WEAPON_ARTS = {
    // --------------------------------------------------------------------------
    // INNATE ARCHETYPE ARTS
    // --------------------------------------------------------------------------
    'parry_counter': {
        name: 'Парирующий Клинок',
        desc: 'Стойка парирования на 0.8с: блокирует 100% урона, оглушает врага и проводит контрудар x2.0.',
        weapons: 'Одноручные мечи, палаши, сабли',
        baseCd: 8,
        stamina: 25,
        archetype: 'Парирование и Контрудар'
    },
    'seismic_cleave': {
        name: 'Сейсмический Клив',
        desc: 'Круговой замах на 360° в радиусе 4.5б с каменной волной (180% урона и отбрасывание).',
        weapons: 'Двуручные мечи, клейморы, боевые косы',
        baseCd: 12,
        stamina: 40,
        archetype: 'Рассекающий Удар'
    },
    'iai_slash': {
        name: 'Фантомный Выпад (Иайдзюцу)',
        desc: 'Мгновенный рывок сквозь строй врагов на 6 блоков (190% урона и кровотечение на 5с).',
        weapons: 'Катаны, нодати, утигатаны',
        baseCd: 10,
        stamina: 30,
        archetype: 'Стремительное Иай'
    },
    'shield_breaker': {
        name: 'Сокрушитель Защиты',
        desc: 'Тяжелый нисходящий удар: сбивает щиты, игнорирует 50% брони и оглушает на 1.5с.',
        weapons: 'Боевые топоры, секиры',
        baseCd: 11,
        stamina: 35,
        archetype: 'Раскалывание Защиты'
    },
    'tectonic_rupture': {
        name: 'Разлом Тектоники',
        desc: 'Удар о землю с 5-метровой радиальной волной: подбрасывает в воздух и накладывает Замедление IV.',
        weapons: 'Боевые молоты, булавы, палицы',
        baseCd: 14,
        stamina: 45,
        archetype: 'Сейсмический Разлом'
    },
    'piercing_thrust': {
        name: 'Бронебойный Прокол',
        desc: 'Колющий выпад на 5.5 блоков со 100% игнорированием плотной брони и отталкиванием.',
        weapons: 'Копья, алебарды, трезубцы, пики',
        baseCd: 9,
        stamina: 25,
        archetype: 'Пронзающий Выпад'
    },
    'shadow_step': {
        name: 'Теневой Шаг',
        desc: 'Мгновенное смещение за спину цели (до 5б), скрытность на 1с и гарантированный 100% крит.',
        weapons: 'Кинжалы, рапиры, саи, когти',
        baseCd: 8,
        stamina: 20,
        archetype: 'Теневое Убийство'
    },
    'fan_barrage': {
        name: 'Веерный Залп',
        desc: 'Веерный выстрел конусом из 5 спектральных стрел перед собой.',
        weapons: 'Луки, арбалеты',
        baseCd: 10,
        stamina: 30,
        archetype: 'Стрелковый Веер'
    },

    // --------------------------------------------------------------------------
    // EXTRA RUNIC SLOT ARTS (Inscribed via Ancient / Infernal Anvil)
    // --------------------------------------------------------------------------
    'flame_vortex': {
        name: 'Пламенный Вихрь',
        desc: 'Огненный шторм вокруг игрока на 4.5 блока: поджигает на 6с и наносит 180% огненного урона.',
        weapons: 'Любое боевое оружие',
        baseCd: 12,
        stamina: 35,
        archetype: 'Инферно'
    },
    'frost_stomp': {
        name: 'Ледяная Поступь',
        desc: 'Ледяной удар по земле: шипы льда в радиусе 5б, глубокая заморозка и Замедление IV.',
        weapons: 'Любое боевое оружие',
        baseCd: 11,
        stamina: 30,
        archetype: 'Абсолютный Холод'
    },
    'lightning_smite': {
        name: 'Громовой Раскат',
        desc: 'Низвержение небесной молнии в точку удара: 220% урона молнией и оглушающий шок.',
        weapons: 'Любое боевое оружие',
        baseCd: 14,
        stamina: 40,
        archetype: 'Гнев Бури'
    },
    'blood_harvest': {
        name: 'Кровавая Жатва',
        desc: 'Серповидный удар с вампиризмом: исцеляет заклинателя на 15% от нанесенного урона.',
        weapons: 'Любое боевое оружие',
        baseCd: 12,
        stamina: 35,
        archetype: 'Алый Вампиризм'
    },
    'holy_blade': {
        name: 'Священный Клинок',
        desc: 'Луч святой энергии: 200% урона (+50% по нежити) и Регенерация II на 4с.',
        weapons: 'Любое боевое оружие',
        baseCd: 13,
        stamina: 35,
        archetype: 'Божественная Кара'
    },

    // Legacy Tablet Aliases
    'whirlwind': { name: 'Сейсмический Клив', desc: 'Круговой замах на 360° в радиусе 4.5б.', weapons: 'Двуручные мечи, клейморы, секиры', baseCd: 12, stamina: 40, archetype: 'Рассечение' },
    'earth_sunder': { name: 'Разлом Тектоники', desc: 'Мощный удар в землю с трещиной на 6 блоков.', weapons: 'Тяжелые двуручники, молоты', baseCd: 14, stamina: 45, archetype: 'Дробящее Рассечение' },
    'juggernaut': { name: 'Неумолимый Натиск', desc: 'Стремительный таран со щитом (+40% защиты).', weapons: 'Двуручные мечи, алебарды', baseCd: 16, stamina: 35, archetype: 'Натиск и Оборона' },
    'lightning_thrust': { name: 'Фантомный Выпад', desc: 'Молниеносный рывок сквозь строй врагов на 6 блоков.', weapons: 'Катаны, рапиры, кинжалы', baseCd: 10, stamina: 30, archetype: 'Стремительный Выпад' },
    'blood_rend': { name: 'Кровавая Жатва', desc: 'Рассекающий полумесяц алой энергии с исцелением.', weapons: 'Катаны, косы, сабли', baseCd: 12, stamina: 35, archetype: 'Жажда Крови' },
    'seismic_slam': { name: 'Разлом Тектоники', desc: 'Удар оземь с радиальной волной и оглушением.', weapons: 'Молоты, дубины, булавы', baseCd: 14, stamina: 45, archetype: 'Землетрясение' },
    'arrow_barrage': { name: 'Веерный Залп', desc: 'Веерный выстрел конусом из 5 спектральных стрел.', weapons: 'Луки, арбалеты', baseCd: 10, stamina: 30, archetype: 'Стрелковое Мастерство' }
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
        if (idx >= 1) r = idx;
        else {
            let num = parseInt(rank, 10);
            if (!isNaN(num)) r = Math.max(1, Math.min(5, num));
        }
    }
    let cd = baseCd * (1.0 - (r - 1) * 0.08);
    return Math.round(cd * 10) / 10;
}

function isTwoHandedWeapon(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = String(item.id).toLowerCase();
    return id.includes('claymore') || id.includes('greatsword') || id.includes('greathammer') ||
           id.includes('greataxe') || id.includes('spear') || id.includes('halberd') ||
           id.includes('glaive') || id.includes('lance') || id.includes('scythe') ||
           id.includes('polearm') || id.includes('colossal') || id.includes('zweihander') ||
           item.hasTag('c:tools/two_handed') || item.hasTag('c:two_handed_weapons');
}

function isAnyWeapon(item) {
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

function resolveInnateWeaponArt(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return null;
    let id = String(item.id).toLowerCase();

    // 1. Bows & Crossbows: Fan Barrage
    if (id.includes('bow') || id.includes('crossbow') ||
        item.hasTag('c:tools/bows') || item.hasTag('c:tools/crossbows')) {
        return 'fan_barrage';
    }

    // 2. Katanas: Phantom Thrust / Iai Slash
    if (id.includes('katana') || id.includes('nodachi') || id.includes('uchigatana')) {
        return 'iai_slash';
    }

    // 3. Warhammers & Maces: Tectonic Rupture
    if (id.includes('hammer') || id.includes('mace') || id.includes('club') ||
        id.includes('maul') || id.includes('greathammer')) {
        return 'tectonic_rupture';
    }

    // 4. Battleaxes & Greataxes: Shield Breaker / Sunder
    if (id.includes('battleaxe') || id.includes('greataxe') || id.includes('waraxe') ||
        (id.includes('axe') && !id.includes('pickaxe'))) {
        return 'shield_breaker';
    }

    // 5. Polearms & Spears: Armor-Piercing Thrust
    if (id.includes('spear') || id.includes('halberd') || id.includes('lance') ||
        id.includes('glaive') || id.includes('polearm') || id.includes('trident') || id.includes('pike')) {
        return 'piercing_thrust';
    }

    // 6. Daggers & Rapiers: Shadow Step
    if (id.includes('dagger') || id.includes('rapier') || id.includes('knife') ||
        id.includes('sickle') || id.includes('sai') || id.includes('stiletto') || id.includes('tanto')) {
        return 'shadow_step';
    }

    // 7. Greatswords & Claymores: Seismic Cleave
    if (id.includes('claymore') || id.includes('greatsword') || id.includes('zweihander') ||
        id.includes('colossal') || id.includes('scythe') || isTwoHandedWeapon(item)) {
        return 'seismic_cleave';
    }

    // 8. Swords & Broadswords: Parry & Counter
    return 'parry_counter';
}

function extractInscribedWeaponArt(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return null;
    let tag = null;
    try {
        if (item.customData) tag = item.customData;
        else if (item.getCustomData) tag = item.getCustomData();
        else if (item.nbt) tag = item.nbt;
    } catch (e) {}

    if (!tag) return null;

    let artKey = null;
    try {
        if (tag.contains('elyrium_inscribed_art')) {
            artKey = String(tag.getString('elyrium_inscribed_art'));
        } else if (tag.contains('skd_weapon_art')) {
            let rawArt = tag.get('skd_weapon_art');
            if (typeof rawArt === 'string' || (rawArt && rawArt.asString)) {
                artKey = String(tag.getString('skd_weapon_art'));
            } else if (rawArt && tag.getCompound) {
                let comp = tag.getCompound('skd_weapon_art');
                artKey = String(comp.getString('id') || comp.getString('name') || '');
            }
        }
    } catch (e) {}

    if (artKey && artKey.length > 0) {
        return artKey.toLowerCase().replace('kubejs:', '').trim();
    }
    return null;
}

function extractWeaponArtRank(item) {
    if (!item || item.isEmpty()) return 1;
    let tag = null;
    try {
        if (item.customData) tag = item.customData;
        else if (item.getCustomData) tag = item.getCustomData();
        else if (item.nbt) tag = item.nbt;
    } catch (e) {}

    if (!tag) return 1;
    try {
        if (tag.contains('skd_art_rank')) return tag.getInt('skd_art_rank') || 1;
        if (tag.contains('skd_weapon_art_rank')) return tag.getInt('skd_weapon_art_rank') || 1;
        if (tag.contains('elyrium_art_rank')) return tag.getInt('elyrium_art_rank') || 1;
    } catch (e) {}
    return 1;
}

function renderMartialTooltips(lines, item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return;
    let id = String(item.id).toLowerCase();

    // --------------------------------------------------------------------------
    // 1. TOOLTIP FOR MARTIAL TABLETS
    // --------------------------------------------------------------------------
    if (id.startsWith('kubejs:martial_tablet_')) {
        let cleanId = id.replace('kubejs:martial_tablet_', '').replace('kubejs:', '');
        let art = WEAPON_ARTS[cleanId];
        if (art) {
            let rank = extractWeaponArtRank(item);
            let rankStr = getArtRankRoman(rank);
            let cd = calculateScaledCooldown(art.baseCd, rank);

            lines.add(Text.of('§6★ Ранг Трактата: §eРанг ' + rankStr + ' §7(I–V ранги)'));
            lines.add(Text.of('§e⚔ Подходящее оружие: §f' + art.weapons));
            lines.add(Text.of('§6✦ Боевой прием: §f' + art.desc));
            lines.add(Text.of('  §7• Базовый откат: §a' + cd + ' сек. §8(Активация: Shift+ПКМ)'));
            lines.add(Text.of('  §b• Расход выносливости: §f' + art.stamina + ' очков'));
            lines.add(Text.of('  §d• Стиль боя: §b' + art.archetype));
            lines.add(Text.of('§8💡 Вставляется в рунический слот на Адской Наковальне'));
        }
        return;
    }

    // --------------------------------------------------------------------------
    // 2. TOOLTIP FOR WEAPONS
    // --------------------------------------------------------------------------
    if (!isAnyWeapon(item)) return;

    // A. Innate Archetype Skill
    let innateKey = resolveInnateWeaponArt(item);
    let innateArt = innateKey ? WEAPON_ARTS[innateKey] : null;
    if (innateArt) {
        lines.add(Text.of('§6⚔ Врожденный прием: §e[' + innateArt.name + '] §8[ПКМ / Shift+ПКМ со щитом]'));
        lines.add(Text.of('  §7• Эффект: §f' + innateArt.desc));
        lines.add(Text.of('  §7• Расход: §b' + innateArt.stamina + ' Выносливости §7| Откат: §a' + innateArt.baseCd + 'с'));
    }

    // B. Extra Runic Slot
    let runicKey = extractInscribedWeaponArt(item);
    if (runicKey && WEAPON_ARTS[runicKey]) {
        let rArt = WEAPON_ARTS[runicKey];
        let rRank = extractWeaponArtRank(item);
        let rankStr = getArtRankRoman(rRank);
        let cd = calculateScaledCooldown(rArt.baseCd, rRank);

        lines.add(Text.of('§d💎 Рунический навык: §e[' + rArt.name + ' §6' + rankStr + '§e] §8[Shift+ПКМ]'));
        lines.add(Text.of('  §7• Эффект: §f' + rArt.desc));
        lines.add(Text.of('  §7• Расход: §b' + rArt.stamina + ' Выносливости §7| Откат: §a' + cd + 'с'));
    } else {
        lines.add(Text.of('§8💎 Рунический слот: [Пусто — инкрустируйте скрижаль на Наковальне] §8[Shift+ПКМ]'));
    }
}

// ------------------------------------------------------------------------------
// 3. EVENT REGISTRATION (KubeJS 21 NeoForge Dynamic Tooltips)
// ------------------------------------------------------------------------------

ItemEvents.modifyTooltips(event => {
    event.modify('*', text => {
        text.dynamic('elyrium_martial_arts');
    });
});

ItemEvents.dynamicTooltips('elyrium_martial_arts', event => {
    let item = event.item;
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return;
    renderMartialTooltips(event.lines, item);
});
