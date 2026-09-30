// ==============================================================================
// ⚔️ ELYRIUM RPG: MARTIAL ARTS & WEAPON ARTS TOOLTIPS (CLIENT SCRIPT v2.3)
// Minecraft 1.21.1 NeoForge | KubeJS Client Script
// ==============================================================================
// Displays Physical Weapon Arts information on weapons, shields, and tablets:
// 1. Weapons:
//    - §6⚔ Врожденный прием: §e[Прием] §8[ПКМ / Shift+ПКМ со щитом]
//      §7• Эффект: §fОписание
//      §7• Затраты: §bX Выносливости §7| Откат: §aY сек.
//    - §d💎 Рунический навык: §e[Навык Ранг] §8[Shift+ПКМ] (или пустой слот)
// 2. Spear Mechanics:
//    - §6🔱 Универсальный хват (со щитом / двуручный силовой)
// 3. Shield Mechanics:
//    - §e★ Гвардейский Контрудар на ЛКМ после блока
// 4. Martial Tablets:
//    - Archetype, suitable weapons, effect, stamina cost, cooldown, rank.
// ==============================================================================

const ROMAN_RANKS = ['0', 'I', 'II', 'III', 'IV', 'V'];

const WEAPON_ARTS = {
    // --------------------------------------------------------------------------
    // 9 MELEE WEAPON ARTS
    // --------------------------------------------------------------------------
    'whirlwind_cleave': {
        name: 'Вихревой Размах',
        desc: 'Круговой замах на 360° в радиусе 4.5б (180% урона и круговое отбрасывание).',
        weapons: 'Двуручные мечи, клейморы, алебарды',
        baseCd: 12,
        stamina: 40,
        archetype: 'Размашистый Клив'
    },
    'iai_slash': {
        name: 'Фантомный Выпад (Иай)',
        desc: 'Мгновенный рывок сквозь строй врагов на 6 блоков (190% урона и кровотечение на 5с).',
        weapons: 'Катаны, нодати, рапиры, сабли',
        baseCd: 10,
        stamina: 30,
        archetype: 'Стремительное Иай'
    },
    'severing_cleave': {
        name: 'Рассекающий Клив',
        desc: 'Мощный фронтальный дуговой удар (конус 120°, 4м): 210% урона, игнорирует 40% брони.',
        weapons: 'Боевые топоры, секиры, клейморы',
        baseCd: 11,
        stamina: 35,
        archetype: 'Раскалывание Защиты'
    },
    'earth_sunder': {
        name: 'Сотрясение Земли',
        desc: 'Удар в землю с 5-метровой радиальной волной: 200% урона, подброс и Замедление IV.',
        weapons: 'Боевые молоты, булавы, палицы',
        baseCd: 14,
        stamina: 45,
        archetype: 'Сейсмический Разлом'
    },
    'crushing_uppercut': {
        name: 'Сокрушительный Апперкот',
        desc: 'Восходящий удар снизу-вверх: 220% урона, запуск врага на 4 блока в воздух, стан 2с.',
        weapons: 'Булавы, молоты, кастеты, кулачное оружие',
        baseCd: 11,
        stamina: 30,
        archetype: 'Оглушающий Апперкот'
    },
    'piercing_thrust': {
        name: 'Бронебойный Прокол',
        desc: 'Линейный выпад на 5.5 блоков со 100% игнорированием брони цели и отталкиванием.',
        weapons: 'Копья, алебарды, трезубцы, пики, рапиры',
        baseCd: 9,
        stamina: 25,
        archetype: 'Пронзающий Выпад'
    },
    'scissor_cross': {
        name: 'Ножницы',
        desc: 'Скрещенный рассекающий удар двумя клинками: 2x 110% урона + Глубокие Раны.',
        weapons: 'Парные клинки, кинжалы, парные мечи',
        baseCd: 8,
        stamina: 25,
        archetype: 'Парное Рассечение'
    },
    'shadow_step': {
        name: 'Теневой Шаг',
        desc: 'Мгновенное смещение за спину цели (до 5.5б), невидимость 1.2с и 100% крит.',
        weapons: 'Кинжалы, рапиры, саи, когти',
        baseCd: 8,
        stamina: 20,
        archetype: 'Теневое Убийство'
    },
    'reverse_sunder': {
        name: 'Реверсивный Раскол',
        desc: 'Возвратный вертикальный взмах: 195% урона, сбивает блок щита и дает Слабость II.',
        weapons: 'Одноручные и двуручные мечи, палаши',
        baseCd: 10,
        stamina: 30,
        archetype: 'Разрушение Стойки'
    },

    // --------------------------------------------------------------------------
    // 5 RANGED BOW ARTS
    // --------------------------------------------------------------------------
    'fan_barrage': {
        name: 'Веерный Залп',
        desc: 'Выпуск веера из 5 спектральных стрел по широкому конусу перед собой.',
        weapons: 'Луки, арбалеты',
        baseCd: 10,
        stamina: 30,
        archetype: 'Стрелковый Веер'
    },
    'piercing_shot': {
        name: 'Бронебойный Выстрел',
        desc: 'Стрела прошивает строй врагов насквозь по прямой до 25 блоков со 100% пробитием брони.',
        weapons: 'Луки, длинные луки',
        baseCd: 12,
        stamina: 35,
        archetype: 'Снайперский Пробой'
    },
    'arrow_rain': {
        name: 'Град Стрел',
        desc: 'Выстрел в зенит: через 1.2с в выбранную зону 6м обрушивается шквал из 12 стрел.',
        weapons: 'Луки, составные луки',
        baseCd: 16,
        stamina: 45,
        archetype: 'Артиллерийский Залп'
    },
    'tactical_backstep': {
        name: 'Тактический Отскок',
        desc: 'Отскок назад на 5 блоков с одновременным выстрелом контузящей стрелы.',
        weapons: 'Луки, арбалеты',
        baseCd: 9,
        stamina: 25,
        archetype: 'Тактическое Уклонение'
    },
    'triple_shot': {
        name: 'Беглая Тройка',
        desc: 'Скорострельная очередь из 3 стрел подряд в одну точку с повышенной кучностью.',
        weapons: 'Луки, арбалеты',
        baseCd: 11,
        stamina: 30,
        archetype: 'Беглая Стрельба'
    },

    // --------------------------------------------------------------------------
    // 2 SHIELD ARTS & GUARD COUNTER
    // --------------------------------------------------------------------------
    'shield_bash': {
        name: 'Таранный Натиск',
        desc: 'Рывок со щитом на 5 блоков: сбивает врагов, наносит урон от стойкости и оглушает на 2с.',
        weapons: 'Щиты (основная или вторая рука)',
        baseCd: 12,
        stamina: 35,
        archetype: 'Таранная Оборона'
    },
    'unwavering_bulwark': {
        name: 'Непоколебимый Оплот',
        desc: 'Защитная стойка на 3.5с: 80% защиты от урона, иммунитет к отбросу, 30% отражения урона.',
        weapons: 'Тяжелые и ростовые щиты',
        baseCd: 20,
        stamina: 40,
        archetype: 'Бастион'
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

    // Legacy Aliases
    'whirlwind': { name: 'Вихревой Размах', desc: 'Круговой замах на 360° в радиусе 4.5б.', weapons: 'Двуручные мечи, клейморы', baseCd: 12, stamina: 40, archetype: 'Размашистый Клив' },
    'seismic_cleave': { name: 'Вихревой Размах', desc: 'Круговой замах на 360° в радиусе 4.5б.', weapons: 'Двуручные мечи, клейморы', baseCd: 12, stamina: 40, archetype: 'Размашистый Клив' },
    'tectonic_rupture': { name: 'Сотрясение Земли', desc: 'Удар в землю с 5-метровой радиальной волной.', weapons: 'Молоты, булавы', baseCd: 14, stamina: 45, archetype: 'Сейсмический Разлом' },
    'shield_breaker': { name: 'Рассекающий Клив', desc: 'Фронтальный дуговой удар с пробитием брони.', weapons: 'Секиры, боевые топоры', baseCd: 11, stamina: 35, archetype: 'Раскалывание Защиты' },
    'parry_counter': { name: 'Реверсивный Раскол', desc: 'Возвратный вертикальный взмах со сбивом защиты.', weapons: 'Одноручные и двуручные мечи', baseCd: 10, stamina: 30, archetype: 'Разрушение Стойки' },
    'juggernaut': { name: 'Таранный Натиск', desc: 'Рывок вперед со щитом.', weapons: 'Щиты', baseCd: 12, stamina: 35, archetype: 'Таранная Оборона' },
    'arrow_barrage': { name: 'Веерный Залп', desc: 'Выпуск веера из 5 спектральных стрел.', weapons: 'Луки, арбалеты', baseCd: 10, stamina: 30, archetype: 'Стрелковый Веер' }
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

function isSpear(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = String(item.id).toLowerCase();
    return id.includes('spear') || id.includes('halberd') || id.includes('lance') ||
           id.includes('glaive') || id.includes('polearm') || id.includes('trident') ||
           id.includes('pike') || item.hasTag('c:tools/spears') || item.hasTag('c:spears');
}

function isShield(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = String(item.id).toLowerCase();
    return item.hasTag('c:tools/shields') ||
           item.hasTag('c:shields') ||
           item.hasTag('forge:shields') ||
           item.hasTag('minecraft:shields') ||
           id.includes('shield');
}

function isAnyWeapon(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = String(item.id).toLowerCase();
    return item.hasTag('c:tools/melee_weapon') ||
           item.hasTag('minecraft:swords') ||
           item.hasTag('minecraft:axes') ||
           item.hasTag('c:tools/bows') ||
           item.hasTag('c:tools/crossbows') ||
           item.hasTag('c:weapons') ||
           isShield(item) ||
           id.includes('sword') || id.includes('blade') || id.includes('claymore') ||
           id.includes('katana') || id.includes('dagger') || id.includes('scythe') ||
           id.includes('rapier') || id.includes('glaive') || id.includes('spear') ||
           id.includes('halberd') || id.includes('axe') || id.includes('bow') ||
           id.includes('crossbow') || id.includes('hammer') || id.includes('mace') ||
           id.includes('sai') || id.includes('trident');
}

function resolveInnateWeaponArt(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return null;
    let id = String(item.id).toLowerCase();

    // 1. Shields
    if (isShield(item)) {
        return 'shield_bash';
    }

    // 2. Bows & Crossbows: Piercing Shot (Силовой / Бронебойный Выстрел)
    if (((id.includes('bow') && !id.includes('bowl')) || id.includes('crossbow')) ||
        item.hasTag('c:tools/bows') || item.hasTag('c:tools/crossbows')) {
        return 'piercing_shot';
    }

    // 3. Katanas: Phantom Thrust / Iai Slash
    if (id.includes('katana') || id.includes('nodachi') || id.includes('uchigatana')) {
        return 'iai_slash';
    }

    // 4. Warhammers & Maces: Earth Sunder
    if (id.includes('hammer') || id.includes('club') || id.includes('maul') || id.includes('greathammer')) {
        return 'earth_sunder';
    }

    if (id.includes('mace') || id.includes('fist') || id.includes('knuckle')) {
        return 'crushing_uppercut';
    }

    // 5. Battleaxes & Greataxes: Severing Cleave
    if (id.includes('battleaxe') || id.includes('greataxe') || id.includes('waraxe') ||
        (id.includes('axe') && !id.includes('pickaxe'))) {
        return 'severing_cleave';
    }

    // 6. Polearms & Spears: Armor-Piercing Thrust
    if (isSpear(item)) {
        return 'piercing_thrust';
    }

    // 7. Daggers & Twinblades: Scissor Cross
    if (id.includes('dagger') || id.includes('knife') || id.includes('sai') ||
        id.includes('stiletto') || id.includes('tanto') || id.includes('twinblade')) {
        return 'scissor_cross';
    }

    // 8. Rapiers & Finesse: Shadow Step
    if (id.includes('rapier') || id.includes('saber') || id.includes('cutlass')) {
        return 'shadow_step';
    }

    // 9. Greatswords & Claymores: Whirlwind Cleave
    if (id.includes('claymore') || id.includes('greatsword') || id.includes('zweihander') ||
        id.includes('colossal') || id.includes('scythe') || isTwoHandedWeapon(item)) {
        return 'whirlwind_cleave';
    }

    // 10. Swords: Reverse Sunder
    return 'reverse_sunder';
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
    // 2. TOOLTIP FOR SHIELDS
    // --------------------------------------------------------------------------
    if (isShield(item)) {
        lines.add(Text.of('§6🛡 Боевое искусство щита: §e[Таранный Натиск] §8[ПКМ]'));
        lines.add(Text.of('  §7• Эффект: §fРывок на 5б со сбивом врагов и оглушением на 2с.'));
        lines.add(Text.of('§e★ Гвардейский Контрудар: §fЛКМ в окне 1.5с после блока (+150% урона, стан 1.5с)'));
        return;
    }

    // --------------------------------------------------------------------------
    // 3. TOOLTIP FOR WEAPONS
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

    // B. Spear Mechanics (Universal Grip)
    if (isSpear(item)) {
        lines.add(Text.of('§6🔱 Универсальный хват копья:'));
        lines.add(Text.of('  §a• Со щитом: §fУкол из-за блока (защита щита не сбрасывается)'));
        lines.add(Text.of('  §a• Без щита: §fДвуручный силовой хват (+30% урона, +1.5м дальность)'));
    }

    // C. Extra Runic Slot
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
// 4. EVENT REGISTRATION (KubeJS 21 NeoForge Dynamic Tooltips)
// ------------------------------------------------------------------------------

ItemEvents.modifyTooltips(event => {
    event.modify('*', text => {
        text.dynamic('elyrium_martial_arts');
    });
});

ItemEvents.dynamicTooltips('elyrium_martial_arts', event => {
    let item = event.item;
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return;

    // Filter out parasitic spellbook / imbued lines from weapon tooltips
    if (isAnyWeapon(item)) {
        try {
            for (let i = event.lines.size() - 1; i >= 0; i--) {
                let comp = event.lines.get(i);
                if (!comp) continue;
                let lineStr = (typeof comp.getString === 'function') ? comp.getString() : String(comp);
                if (lineStr) {
                    let lower = lineStr.toLowerCase();
                    if (lower.includes('высечено заклинаний') ||
                        lower.includes('inscribed spells') ||
                        lower.includes('экипированной книги') ||
                        lower.includes('книги заклинаний') ||
                        lower.includes('книга заклинаний') ||
                        lower.includes('книгу заклинаний') ||
                        lower.includes('spell book') ||
                        lower.includes('casts spells from equipped')) {
                        event.lines.remove(i);
                    }
                }
            }
        } catch (e) {}
    }

    renderMartialTooltips(event.lines, item);
});
