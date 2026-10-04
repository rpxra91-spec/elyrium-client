// ==============================================================================
// ⚒️ ELYRIUM RPG: BLACKSMITH WORKBENCH CATALOG CRAFTING & REPAIR GUI
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// Premier 6-Row ChestMenu GUI for Blacksmith Station:
// - Standalone Workbench Penalty: +1 ingot to all crafts if Hearth is not connected.
// - Standalone Hearth Penalty: Repairs only 25% durability instead of 50%.
// - Connected Station (Workbench + Hearth): 0 ingot penalty, 50% durability per ingot.
// - 4 Tabs:
//   Tab 0: ⚔️ Клинки (15 видов оружия SimplySwords)
//   Tab 1: 🛡️ Доспехи Т1 (Железный сет, Бригантина ДД, Разведчик, Стальной Рыцарь)
//   Tab 2: ⛏ Инструменты (Стальная Кирка, Железные инструменты, Щит)
//   Tab 3: 🔧 Ремонт (Починка экипировки за слитки с проверкой износа)
// ==============================================================================

// Session tracking
let activeBlacksmithSessions = new Map();

function getOrCreateBlacksmithSession(player) {
    let uuid = player.uuid.toString();
    if (!activeBlacksmithSessions.has(uuid)) {
        activeBlacksmithSessions.set(uuid, {
            tab: 0,
            hasHearth: false,
            hasWorkbench: true,
            hasCrucible: false,
            hasAnvil: false,
            isGrandForge: false,
            stationPos: null
        });
    }
    return activeBlacksmithSessions.get(uuid);
}

function clearBlacksmithSession(player) {
    activeBlacksmithSessions.delete(player.uuid.toString());
}

// ------------------------------------------------------------------------------
// INVENTORY UTILITIES
// ------------------------------------------------------------------------------
function matchesBSItemOrTag(st, itemIdOrTag) {
    if (!st || st.isEmpty()) return false;
    let stId = String(st.id);
    if (itemIdOrTag.startsWith('#')) {
        let tag = itemIdOrTag.substring(1);
        return st.hasTag(tag);
    }
    if (stId === itemIdOrTag) return true;
    if (itemIdOrTag === 'minecraft:iron_ingot' && (st.hasTag('c:ingots/iron') || st.hasTag('forge:ingots/iron'))) return true;
    if (itemIdOrTag === 'kubejs:steel_ingot' && (st.hasTag('c:ingots/steel') || st.hasTag('forge:ingots/steel'))) return true;
    if (itemIdOrTag === 'minecraft:copper_ingot' && (st.hasTag('c:ingots/copper') || st.hasTag('forge:ingots/copper'))) return true;
    return false;
}

function countPlayerItemsBS(player, itemIdOrTag) {
    if (!player || !itemIdOrTag) return 0;
    let inv = player.inventory;
    let count = 0;

    for (let i = 0; i < inv.size; i++) {
        let st = inv.getItem(i);
        if (!st || st.isEmpty()) continue;
        if (matchesBSItemOrTag(st, itemIdOrTag)) {
            count += st.count;
        }
    }
    return count;
}

function deductPlayerItemsBS(player, itemIdOrTag, needed) {
    if (!player || needed <= 0) return true;
    let inv = player.inventory;
    let remain = needed;

    for (let i = 0; i < inv.size && remain > 0; i++) {
        let st = inv.getItem(i);
        if (!st || st.isEmpty()) continue;
        if (matchesBSItemOrTag(st, itemIdOrTag)) {
            let take = Math.min(st.count, remain);
            st.shrink(take);
            remain -= take;
            if (st.isEmpty() || st.count <= 0) {
                try { inv.setItem(i, Item.of('minecraft:air')); } catch (e) {}
            }
        }
    }
    return remain === 0;
}

// Determine repair material for an item
function getRepairMaterial(itemId) {
    let id = String(itemId).toLowerCase();
    if (id.includes('steel') || id.includes('knight')) {
        return { id: 'kubejs:steel_ingot', name: 'Стальной Слиток' };
    }
    if (id.includes('copper') || id.includes('scout')) {
        return { id: 'minecraft:copper_ingot', name: 'Медный Слиток' };
    }
    if (id.includes('diamond')) {
        return { id: 'minecraft:diamond', name: 'Алмаз' };
    }
    if (id.includes('netherite')) {
        return { id: 'minecraft:netherite_scrap', name: 'Незеритовый Обломок' };
    }
    if (id.includes('gold') || id.includes('golden')) {
        return { id: 'minecraft:gold_ingot', name: 'Золотой Слиток' };
    }
    if (id.includes('wood') || id.includes('bow')) {
        return { id: '#minecraft:planks', name: 'Доски' };
    }
    if (id.includes('leather')) {
        return { id: 'minecraft:leather', name: 'Кожа' };
    }
    if (id.includes('stone') || id.includes('cobble')) {
        return { id: 'minecraft:cobblestone', name: 'Булыжник' };
    }
    return { id: 'minecraft:iron_ingot', name: 'Железный Слиток' };
}

// ------------------------------------------------------------------------------
// CRAFTING CATALOG DEFINITIONS (TABS 0, 1, 2)
// ------------------------------------------------------------------------------
const BS_CATALOG = [
    // --------------------------------------------------------------------------
    // TAB 0: ⚔️ КЛИНКИ SIMPLYSWORDS (15 АРХЕТИПОВ ОРУЖИЯ Т1)
    // --------------------------------------------------------------------------
    [
        {
            id: 'simplyswords:iron_longsword',
            name: '§fЖелезный Длинный Меч',
            desc: 'Классический полуторный меч с балансом дальности и урона.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 2,
            extra: 'minecraft:stick', extraName: 'Рукоять', extraCount: 1
        },
        {
            id: 'simplyswords:iron_twinblade',
            name: '§fЖелезный Двусторонний Клинок',
            desc: 'Парный шестовой клинок для скоростных комбо-серий.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 3,
            extra: 'minecraft:stick', extraName: 'Рукоять', extraCount: 2
        },
        {
            id: 'simplyswords:iron_rapier',
            name: '§fЖелезная Рапира',
            desc: 'Колющее фехтовальное оружие с повышенной скоростью атаки.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 2,
            extra: 'minecraft:stick', extraName: 'Рукоять', extraCount: 1
        },
        {
            id: 'simplyswords:iron_katana',
            name: '§fЖелезная Катана',
            desc: 'Изогнутый восточный клинок для быстрых рубящих атак.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 2,
            extra: 'minecraft:stick', extraName: 'Рукоять', extraCount: 1
        },
        {
            id: 'simplyswords:iron_sai',
            name: '§fЖелезный Сай',
            desc: 'Парный кинжал-трезубец для парирования и молниеносных тычков.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 1,
            extra: 'minecraft:stick', extraName: 'Рукоять', extraCount: 1
        },
        {
            id: 'simplyswords:iron_spear',
            name: '§fЖелезное Копье',
            desc: 'Длиннодревковое оружие с дистанцией укола до 5 блоков.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 2,
            extra: 'minecraft:stick', extraName: 'Рукоять', extraCount: 2
        },
        {
            id: 'simplyswords:iron_glaive',
            name: '§fЖелезная Глефа',
            desc: 'Рубящее древковое оружие широкого размаха.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 3,
            extra: 'minecraft:stick', extraName: 'Рукоять', extraCount: 2
        },
        {
            id: 'simplyswords:iron_warglaive',
            name: '§fЖелезная Боевая Глефа',
            desc: 'Тяжелый изогнутый клинок на шесте для прорыва строя.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 3,
            extra: 'minecraft:stick', extraName: 'Рукоять', extraCount: 2
        },
        {
            id: 'simplyswords:iron_cutlass',
            name: '§fЖелезный Абордажный Клинок',
            desc: 'Маневренная сабля с гардой для защиты кисти.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 2,
            extra: 'minecraft:stick', extraName: 'Рукоять', extraCount: 1
        },
        {
            id: 'simplyswords:iron_claymore',
            name: '§fЖелезный Клеймор',
            desc: 'Массивный двуручный меч с сокрушительным кливом по толпе.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 4,
            extra: 'minecraft:stick', extraName: 'Рукоять', extraCount: 2
        },
        {
            id: 'simplyswords:iron_greataxe',
            name: '§fЖелезная Секира',
            desc: 'Двуручный тяжелый топор, проламывающий щиты врагов.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 4,
            extra: 'minecraft:stick', extraName: 'Рукоять', extraCount: 2
        },
        {
            id: 'simplyswords:iron_greathammer',
            name: '§fЖелезный Боевой Молот',
            desc: 'Огромный молот с максимальным ошеломлением и пробоем стойки.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 4,
            extra: 'minecraft:stick', extraName: 'Рукоять', extraCount: 2
        },
        {
            id: 'simplyswords:iron_chakram',
            name: '§fЖелезный Чакрам',
            desc: 'Метательный и контактный боевой кольцевой клинок.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 2,
            extra: 'minecraft:leather', extraName: 'Кожаная Обмотка', extraCount: 1
        },
        {
            id: 'simplyswords:iron_scythe',
            name: '§fЖелезная Коса',
            desc: 'Жнущее оружие с широким радиусом поражения.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 3,
            extra: 'minecraft:stick', extraName: 'Рукоять', extraCount: 2
        },
        {
            id: 'simplyswords:iron_halberd',
            name: '§fЖелезная Алебарда',
            desc: 'Комбинированный топор-копье для пронзания и стягивания.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 3,
            extra: 'minecraft:stick', extraName: 'Рукоять', extraCount: 2
        }
    ],

    // --------------------------------------------------------------------------
    // TAB 1: 🛡️ ДОСПЕХИ ТИРА 1 (ЖЕЛЕЗО, БРИГАНТИНА, РАЗВЕДЧИК, СТАЛЬНОЙ РЫЦАРЬ)
    // --------------------------------------------------------------------------
    [
        // Железный классический сет
        {
            id: 'minecraft:iron_helmet',
            name: '§fЖелезный Шлем',
            desc: 'Стандартный защитный шлем пехотинца Верхнего Мира.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 5,
            extra: null, extraName: null, extraCount: 0
        },
        {
            id: 'minecraft:iron_chestplate',
            name: '§fЖелезный Нагрудник',
            desc: 'Монолитная кованая кираса из чистого железа.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 8,
            extra: null, extraName: null, extraCount: 0
        },
        {
            id: 'minecraft:iron_leggings',
            name: '§fЖелезные Поножи',
            desc: 'Кованые набедренники и наколенники.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 7,
            extra: null, extraName: null, extraCount: 0
        },
        {
            id: 'minecraft:iron_boots',
            name: '§fЖелезные Ботинки',
            desc: 'Латные сапоги с усиленной подошвой.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 4,
            extra: null, extraName: null, extraCount: 0
        },

        // Железная Бригантина ДД
        {
            id: 'kubejs:iron_brigandine_helmet',
            name: '§fШлем Бригантины ДД',
            desc: 'Средний шлем брузера: +5% Физ. Урон, Medium Roll.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 5,
            extra: 'minecraft:leather', extraName: 'Кожаная Подкладка', extraCount: 1
        },
        {
            id: 'kubejs:iron_brigandine_chestplate',
            name: '§fЖелезная Бригантина ДД',
            desc: 'Средний доспех: +15% Базовый физ. урон, +10% Скорость атаки.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 8,
            extra: 'minecraft:leather', extraName: 'Кожаная Подкладка', extraCount: 2
        },
        {
            id: 'kubejs:iron_brigandine_leggings',
            name: '§fПоножи Бригантины ДД',
            desc: 'Средний доспех: -15% Расход стамины на боевые умения.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 7,
            extra: 'minecraft:leather', extraName: 'Кожаная Подкладка', extraCount: 2
        },
        {
            id: 'kubejs:iron_brigandine_boots',
            name: '§fСапоги Бригантины ДД',
            desc: 'Средний доспех: Баланс стойки, Medium Roll.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 4,
            extra: 'minecraft:leather', extraName: 'Кожаная Подкладка', extraCount: 1
        },

        // Кожаный Доспех Разведчика (Медь + Кожа)
        {
            id: 'kubejs:scout_leather_helmet',
            name: '§eКапюшон Разведчика',
            desc: 'Легкий доспех: +10% Дальность обзора, +5% Скорость.',
            ingot: 'minecraft:copper_ingot', ingotName: 'Медный Слиток', baseIngots: 5,
            extra: 'minecraft:leather', extraName: 'Закаленная Кожа', extraCount: 1
        },
        {
            id: 'kubejs:scout_leather_chestplate',
            name: '§eЖилет Разведчика',
            desc: 'Легкий доспех: +10% Скорость бега, +15% Крит.',
            ingot: 'minecraft:copper_ingot', ingotName: 'Медный Слиток', baseIngots: 8,
            extra: 'minecraft:leather', extraName: 'Закаленная Кожа', extraCount: 2
        },
        {
            id: 'kubejs:scout_leather_leggings',
            name: '§eШтаны Разведчика',
            desc: 'Легкий доспех: +5% Скорость, +10% Крит.',
            ingot: 'minecraft:copper_ingot', ingotName: 'Медный Слиток', baseIngots: 7,
            extra: 'minecraft:leather', extraName: 'Закаленная Кожа', extraCount: 2
        },
        {
            id: 'kubejs:scout_leather_boots',
            name: '§eСапоги Разведчика',
            desc: 'Легкий доспех: Fast Roll, бесшумная поступь.',
            ingot: 'minecraft:copper_ingot', ingotName: 'Медный Слиток', baseIngots: 4,
            extra: 'minecraft:leather', extraName: 'Закаленная Кожа', extraCount: 1
        },

        // Стальной Рыцарь Границы (Сталь + Алмаз)
        {
            id: 'kubejs:steel_knight_helmet',
            name: '§9Шлем Рыцаря Границы',
            desc: 'Тяжелый Танк: Броня 4, Твердость 1, Стойка Щита +25.',
            ingot: 'kubejs:steel_ingot', ingotName: 'Стальной Слиток', baseIngots: 5,
            extra: 'minecraft:diamond', extraName: 'Алмазное Усиление', extraCount: 1
        },
        {
            id: 'kubejs:steel_knight_chestplate',
            name: '§9Стальные Латы Рыцаря Границы',
            desc: 'Тяжелый Танк: Броня 9, Твердость 2, Стойка Щита +50, Гипер-броня.',
            ingot: 'kubejs:steel_ingot', ingotName: 'Стальной Слиток', baseIngots: 8,
            extra: 'minecraft:diamond', extraName: 'Алмазное Усиление', extraCount: 2
        },
        {
            id: 'kubejs:steel_knight_leggings',
            name: '§9Поножи Рыцаря Границы',
            desc: 'Тяжелый Танк: Броня 7, Твердость 1, Стойка Щита +25.',
            ingot: 'kubejs:steel_ingot', ingotName: 'Стальной Слиток', baseIngots: 7,
            extra: 'minecraft:diamond', extraName: 'Алмазное Усиление', extraCount: 2
        },
        {
            id: 'kubejs:steel_knight_boots',
            name: '§9Сапоги Рыцаря Границы',
            desc: 'Тяжелый Танк: Fat Roll, 100% Защита от падений до 5м.',
            ingot: 'kubejs:steel_ingot', ingotName: 'Стальной Слиток', baseIngots: 4,
            extra: 'minecraft:diamond', extraName: 'Алмазное Усиление', extraCount: 1
        }
    ],

    // --------------------------------------------------------------------------
    // TAB 2: ⛏ ИНСТРУМЕНТЫ И ОСНАЩЕНИЕ
    // --------------------------------------------------------------------------
    [
        {
            id: 'kubejs:steel_pickaxe',
            name: '§fСтальная Кирка',
            desc: '★ Алмазный уровень добычи (3)! Необходима для добычи алмазной руды.',
            ingot: 'kubejs:steel_ingot', ingotName: 'Стальной Слиток', baseIngots: 3,
            extra: 'minecraft:stick', extraName: 'Рукоять', extraCount: 2
        },
        {
            id: 'minecraft:iron_pickaxe',
            name: '§fЖелезная Кирка',
            desc: 'Базовый шахтерский инструмент. Добывает руды до железа/золота/редстоуна.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 3,
            extra: 'minecraft:stick', extraName: 'Рукоять', extraCount: 2
        },
        {
            id: 'minecraft:iron_axe',
            name: '§fЖелезный Топор',
            desc: 'Универсальный инструмент для рубки древесины и тяжелых ударов.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 3,
            extra: 'minecraft:stick', extraName: 'Рукоять', extraCount: 2
        },
        {
            id: 'minecraft:iron_shovel',
            name: '§fЖелезная Лопата',
            desc: 'Инструмент для скоростной выемки грунта, песка и гравия.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 1,
            extra: 'minecraft:stick', extraName: 'Рукоять', extraCount: 2
        },
        {
            id: 'minecraft:iron_hoe',
            name: '§fЖелезная Мотыга',
            desc: 'Инструмент землепашца для вспашки грядок и сбора урожая.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 2,
            extra: 'minecraft:stick', extraName: 'Рукоять', extraCount: 2
        },
        {
            id: 'minecraft:iron_sword',
            name: '§fЖелезный Меч',
            desc: 'Короткий кованый меч пехотинца.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 2,
            extra: 'minecraft:stick', extraName: 'Рукоять', extraCount: 1
        },
        {
            id: 'minecraft:shield',
            name: '§6Боевой Щит Защитника',
            desc: 'Щит с оковкой: 100% блок физического урона, запас стойки.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железная Оковка', baseIngots: 5,
            extra: '#minecraft:planks', extraName: 'Доски', extraCount: 2
        }
    ]
];

// ------------------------------------------------------------------------------
// OPEN BLACKSMITH WORKSHOP GUI (CHEST MENU 6 ROWS)
// ------------------------------------------------------------------------------
function openBlacksmithGUI(player, stationPos) {
    let level = player.level;
    let station = getBlacksmithStationInfo(level, stationPos);
    let session = getOrCreateBlacksmithSession(player);

    session.hasHearth = station.hasHearth;
    session.hasWorkbench = station.hasWorkbench;
    session.hasCrucible = station.hasCrucible;
    session.hasAnvil = station.hasAnvil;
    session.isGrandForge = station.isGrandForge;
    session.stationPos = stationPos;

    let ingotPenalty = session.hasHearth ? 0 : 1;

    let tabTitles = [
        '§c⚔ [ Клинки ]',
        '§b🛡 [ Доспехи ]',
        '§e⛏ [ Инструменты ]',
        '§a🔧 [ Ремонт ]'
    ];

    let guiTitle = session.isGrandForge
        ? '👑 §6§lВЕЛИКАЯ КУЗНИЦА §c✦ §dЭЛИРИУМ [3-1-2-4]'
        : (session.hasHearth
            ? '⚒ §6§lКУЗНЕЧНЫЙ КОМПЛЕКС §a✦ §fЭЛИРИУМ'
            : '⚒ §7Верстак Оружейника §c(Очаг не найден)');

    player.openChestGUI(Text.of(guiTitle), 6, gui => {
        gui.playerSlots = true;
        gui.closed = () => {
            clearBlacksmithSession(player);
        };

        // ======================================================================
        // ROW 0: ВЕРХНИЙ КАРНИЗ И НАВИГАЦИЯ ВКЛАДОК
        // ======================================================================

        // Slot 0: Монитор статуса станции
        gui.slot(0, 0, s => {
            let hearthText = session.hasHearth
                ? '§a✓ Кузнечный Очаг: Подключен (0 штрафа)'
                : '§c⚠ Кузнечный Очаг: Не найден (+1 слиток штрафа!)';
            let crucibleText = session.hasCrucible
                ? '§a✓ Адский Горн: Подключен (Т3 Возвышение)'
                : '§7🔒 Адский Горн: Не установлен (Т3 Незер)';
            let anvilText = session.hasAnvil
                ? '§a✓ Пустотная Наковальня: Подключена (+1..+10)'
                : '§7🔒 Пустотная Наковальня: Не установлена (Т5)';
            let stationStatus = session.isGrandForge
                ? '§6👑 ВЕЛИКАЯ КУЗНИЦА (4-в-1 Полный резонанс)'
                : (session.hasHearth ? '§a✓ Унифицированная Станция' : '§e⚠ Одиночный Верстак (Металл холоден)');

            s.setItem(Item.of(session.hasHearth ? 'minecraft:blast_furnace' : 'minecraft:campfire')
                .withCustomName(Text.of('§6⚒ [ СТАТУС МАСТЕРСКОЙ ]'))
                .withLore([
                    Text.of(stationStatus),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§a✓ Верстак Оружейника: Активен'),
                    Text.of(hearthText),
                    Text.of(crucibleText),
                    Text.of(anvilText),
                    Text.of('§8────────────────────────────────'),
                    Text.of(session.hasHearth
                        ? '§7Металл разогрет до предела! Ковка без штрафов.'
                        : '§cУстановите рядом Кузнечный Очаг в ряд для снятия штрафа!')
                ]));
            s.leftClicked = () => {};
        });

        // Slots 2, 3, 4: Вкладки ковки (Клинки, Доспехи, Инструменты)
        let tabIcons = ['minecraft:iron_sword', 'minecraft:iron_chestplate', 'minecraft:iron_pickaxe'];
        for (let t = 0; t < 3; t++) {
            let tabIdx = t;
            let isSel = (session.tab === tabIdx);
            let icon = isSel ? 'minecraft:nether_star' : tabIcons[tabIdx];

            gui.slot(2 + t, 0, s => {
                s.setItem(Item.of(icon)
                    .withCustomName(Text.of(isSel ? `§6▶ ${tabTitles[tabIdx]} ◀` : tabTitles[tabIdx]))
                    .withLore([
                        Text.of(isSel ? '§a[Текущий раздел]' : '§e▶ Нажмите для перехода в каталог')
                    ]));
                s.leftClicked = () => {
                    session.tab = tabIdx;
                    player.server.runCommandSilent(`playsound minecraft:ui.button.click player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openBlacksmithGUI(player, stationPos);
                };
            });
        }

        // Slot 6: Вкладка Ремонта (исправлена одиночная регистрация слота)
        let isRepairSel = (session.tab === 3);
        let repairDurText = session.hasHearth ? '§a+50% прочности за 1 слиток' : '§e+25% прочности за 1 слиток (соло)';
        gui.slot(6, 0, sR => {
            sR.setItem(Item.of(isRepairSel ? 'minecraft:nether_star' : 'minecraft:anvil')
                .withCustomName(Text.of(isRepairSel ? '§6▶ §a🔧 [ Ремонт Экипировки ] ◀' : '§a🔧 [ Ремонт Экипировки ]'))
                .withLore([
                    Text.of('§7Восстановление прочности поврежденного снаряжения.'),
                    Text.of(repairDurText),
                    Text.of('§8────────────────────────────────'),
                    Text.of(isRepairSel ? '§a[Текущий раздел]' : '§e▶ Нажмите для перехода к ремонту')
                ]));
            sR.leftClicked = () => {
                session.tab = 3;
                player.server.runCommandSilent(`playsound minecraft:ui.button.click player ${player.username} ~ ~ ~ 0.8 1.2`);
                openBlacksmithGUI(player, stationPos);
            };
        });

        // Slot 8: Выход
        gui.slot(8, 0, s => {
            s.setItem(Item.of('minecraft:barrier').withCustomName(Text.of('§c✖ [ Закрыть ]')));
            s.leftClicked = () => {
                player.closeContainerMenu();
            };
        });

        // Декоративные разделители ряда 0
        let decoPane = Item.of('minecraft:gray_stained_glass_pane').withCustomName(Text.of('§8 '));
        [1, 5, 7].forEach(slotX => {
            gui.slot(slotX, 0, s => { s.setItem(decoPane); s.leftClicked = () => {}; });
        });

        // ======================================================================
        // ROWS 1..4: ОСНОВНАЯ РАБОЧАЯ ЗОНА
        // ======================================================================

        if (session.tab >= 0 && session.tab <= 2) {
            // ------------------------------------------------------------------
            // КАТАЛОГ КОВКИ (TABS 0, 1, 2)
            // ------------------------------------------------------------------
            let catalogList = BS_CATALOG[session.tab] || [];

            for (let i = 0; i < 28; i++) {
                let slotX = 1 + (i % 7);
                let slotY = 1 + Math.floor(i / 7);

                if (i < catalogList.length) {
                    let recipe = catalogList[i];
                    let totalIngots = recipe.baseIngots + ingotPenalty;
                    let hasIngots = countPlayerItemsBS(player, recipe.ingot);
                    let hasExtra = recipe.extra ? countPlayerItemsBS(player, recipe.extra) : 999;

                    let canCraft = (hasIngots >= totalIngots && hasExtra >= recipe.extraCount);

                    let lore = [
                        Text.of(`§7${recipe.desc}`),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§eТребуемые материалы:')
                    ];

                    let ingotLine = (hasIngots >= totalIngots)
                        ? `§a✓ ${recipe.ingotName}: ${hasIngots}/${totalIngots} шт.`
                        : `§c✗ ${recipe.ingotName}: ${hasIngots}/${totalIngots} шт.`;
                    lore.push(Text.of(ingotLine));

                    if (ingotPenalty > 0) {
                        lore.push(Text.of('  §c⚠ Включает +1 слиток штрафа (нет Очага)'));
                    }

                    if (recipe.extra && recipe.extraCount > 0) {
                        let extraLine = (hasExtra >= recipe.extraCount)
                            ? `§a✓ ${recipe.extraName}: ${hasExtra}/${recipe.extraCount} шт.`
                            : `§c✗ ${recipe.extraName}: ${hasExtra}/${recipe.extraCount} шт.`;
                        lore.push(Text.of(extraLine));
                    }

                    lore.push(Text.of('§8────────────────────────────────'));
                    if (canCraft) {
                        lore.push(Text.of('§a▶ Нажмите ЛКМ для ковки предмета!'));
                    } else {
                        lore.push(Text.of('§c🔒 Недостаточно материалов для ковки'));
                    }

                    let displayItem = Item.of(recipe.id)
                        .withCustomName(Text.of(recipe.name))
                        .withLore(lore);

                    gui.slot(slotX, slotY, s => {
                        s.setItem(displayItem);
                        s.leftClicked = () => {
                            // Dynamic re-check of station status to prevent exploit if Hearth was broken
                            let currentStation = session.stationPos ? getBlacksmithStationInfo(player.level, session.stationPos) : null;
                            let activeHasHearth = currentStation ? currentStation.hasHearth : session.hasHearth;
                            let curPenalty = activeHasHearth ? 0 : 1;

                            let curIngots = countPlayerItemsBS(player, recipe.ingot);
                            let curExtra = recipe.extra ? countPlayerItemsBS(player, recipe.extra) : 999;
                            let curTotal = recipe.baseIngots + curPenalty;

                            if (curIngots < curTotal || curExtra < recipe.extraCount) {
                                player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                                player.sendSystemMessage(Text.of('§c[Кузница] §7Недостаточно материалов в инвентаре для ковки!'));
                                return;
                            }

                            // Списание ингредиентов с безопасной очисткой пустых слотов
                            deductPlayerItemsBS(player, recipe.ingot, curTotal);
                            if (recipe.extra && recipe.extraCount > 0) {
                                deductPlayerItemsBS(player, recipe.extra, recipe.extraCount);
                            }

                            // Выдача предмета
                            player.give(Item.of(recipe.id));

                            // Звук и частицы
                            player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.8 1.0`);
                            player.server.runCommandSilent(`playsound minecraft:block.blastfurnace.fire_crackle player ${player.username} ~ ~ ~ 0.8 1.2`);
                            player.server.runCommandSilent(`particle minecraft:flame ~ ~1 ~ 0.3 0.2 0.3 0.05 15`);

                            player.sendSystemMessage(Text.of(`§a⚒ [Ковка завершена] §fВы выковали: §6${recipe.name}§f!`));
                            if (!activeHasHearth) {
                                player.sendSystemMessage(Text.of('§e(Применен штраф +1 слиток из-за отсутствия Очага)'));
                            }

                            // Обновление интерфейса
                            openBlacksmithGUI(player, stationPos);
                        };
                    });
                } else {
                    // Пустые ячейки сетки
                    gui.slot(slotX, slotY, s => {
                        s.setItem(decoPane);
                        s.leftClicked = () => {};
                    });
                }
            }

            // Рамка по краям (X=0 и X=8)
            for (let y = 1; y <= 4; y++) {
                gui.slot(0, y, s => { s.setItem(decoPane); s.leftClicked = () => {}; });
                gui.slot(8, y, s => { s.setItem(decoPane); s.leftClicked = () => {}; });
            }

        } else if (session.tab === 3) {
            // ------------------------------------------------------------------
            // ВКЛАДКА РЕМОНТА (TAB 3: SCAN INVENTORY FOR DAMAGED ITEMS)
            // ------------------------------------------------------------------
            let damagedList = [];
            let inv = player.inventory;

            for (let i = 0; i < inv.size; i++) {
                let st = inv.getItem(i);
                if (!st || st.isEmpty()) continue;
                if (st.isDamageableItem() && st.damageValue > 0) {
                    damagedList.push({
                        slotIndex: i,
                        item: st,
                        id: String(st.id),
                        curDmg: st.damageValue,
                        maxDmg: st.maxDamage
                    });
                }
            }

            let repairPercent = session.hasHearth ? 0.50 : 0.25;
            let repairPercentStr = session.hasHearth ? '50%' : '25%';

            for (let i = 0; i < 28; i++) {
                let slotX = 1 + (i % 7);
                let slotY = 1 + Math.floor(i / 7);

                if (i < damagedList.length) {
                    let entry = damagedList[i];
                    let mat = getRepairMaterial(entry.id);
                    let hasMatCount = countPlayerItemsBS(player, mat.id);
                    let canRepair = (hasMatCount >= 1);

                    let restoreAmount = Math.max(1, Math.floor(entry.maxDmg * repairPercent));
                    let currentDur = entry.maxDmg - entry.curDmg;

                    let lore = [
                        Text.of(`§7Прочность: §f${currentDur} §7/ §f${entry.maxDmg}`),
                        Text.of(`§7Износ: §c${entry.curDmg} ед. урона`),
                        Text.of('§8────────────────────────────────'),
                        Text.of(`§eВосстановление: §a+${restoreAmount} ед. (+${repairPercentStr})`),
                        Text.of('§eСтоимость починки: 1x ' + mat.name),
                        Text.of(hasMatCount >= 1
                            ? `§a✓ В инвентаре: ${hasMatCount} шт.`
                            : `§c✗ Не хватает: ${mat.name}`),
                        Text.of('§8────────────────────────────────')
                    ];

                    if (!session.hasHearth) {
                        lore.push(Text.of('§e⚠ Очаг не подключен: ремонт лишь на 25%!'));
                    }

                    if (canRepair) {
                        lore.push(Text.of('§a▶ Нажмите ЛКМ для ремонта предмета'));
                    } else {
                        lore.push(Text.of('§c🔒 Требуется ' + mat.name + ' для починки'));
                    }

                    gui.slot(slotX, slotY, s => {
                        s.setItem(entry.item.copy().withLore(lore));
                        s.leftClicked = () => {
                            // Dynamic re-check of station status for repair percentage
                            let currentStation = session.stationPos ? getBlacksmithStationInfo(player.level, session.stationPos) : null;
                            let activeHasHearth = currentStation ? currentStation.hasHearth : session.hasHearth;
                            let activePercent = activeHasHearth ? 0.50 : 0.25;
                            let activePercentStr = activeHasHearth ? '50%' : '25%';
                            let activeRestore = Math.max(1, Math.floor(entry.maxDmg * activePercent));

                            let curMatCount = countPlayerItemsBS(player, mat.id);
                            if (curMatCount < 1) {
                                player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                                player.sendSystemMessage(Text.of(`§c[Ремонт] §7Для починки требуется 1x §f${mat.name}§7!`));
                                return;
                            }

                            // Списание материала
                            deductPlayerItemsBS(player, mat.id, 1);

                            // Поиск и восстановление прочности предмета (с защитой от смещения слотов)
                            let realItem = player.inventory.getItem(entry.slotIndex);
                            let targetStack = null;
                            if (realItem && !realItem.isEmpty() && String(realItem.id) === entry.id && realItem.isDamageableItem()) {
                                targetStack = realItem;
                            } else {
                                // Поиск в инвентаре по ID и износу
                                for (let si = 0; si < player.inventory.size; si++) {
                                    let testSt = player.inventory.getItem(si);
                                    if (testSt && !testSt.isEmpty() && String(testSt.id) === entry.id && testSt.isDamageableItem() && testSt.damageValue > 0) {
                                        targetStack = testSt;
                                        break;
                                    }
                                }
                            }

                            if (targetStack) {
                                targetStack.damageValue = Math.max(0, targetStack.damageValue - activeRestore);
                            }

                            // Звук наковальни
                            player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.8 1.1`);
                            player.server.runCommandSilent(`particle minecraft:crit ~ ~1 ~ 0.4 0.3 0.4 0.1 20`);
                            player.sendSystemMessage(Text.of(`§a🔧 [Ремонт] §fПредмет успешно отремонтирован на §e+${activePercentStr}§f!`));

                            openBlacksmithGUI(player, stationPos);
                        };
                    });
                } else if (i === 0 && damagedList.length === 0) {
                    gui.slot(4, 2, s => {
                        s.setItem(Item.of('minecraft:sunflower')
                            .withCustomName(Text.of('§a✓ Вся экипировка в идеальном состоянии!'))
                            .withLore([
                                Text.of('§7В вашем инвентаре нет поврежденного снаряжения.'),
                                Text.of('§8────────────────────────────────'),
                                Text.of('§7Поврежденные клинки и доспехи автоматически'),
                                Text.of('§7появятся здесь для починки за металл.')
                            ]));
                        s.leftClicked = () => {};
                    });
                } else {
                    gui.slot(slotX, slotY, s => {
                        s.setItem(decoPane);
                        s.leftClicked = () => {};
                    });
                }
            }

            for (let y = 1; y <= 4; y++) {
                gui.slot(0, y, s => { s.setItem(decoPane); s.leftClicked = () => {}; });
                gui.slot(8, y, s => { s.setItem(decoPane); s.leftClicked = () => {}; });
            }
        }

        // ======================================================================
        // ROW 5: НИЖНИЙ КАРНИЗ И РУКОВОДСТВО
        // ======================================================================
        for (let x = 0; x < 9; x++) {
            if (x === 4) {
                gui.slot(4, 5, s => {
                    s.setItem(Item.of('minecraft:compass')
                        .withCustomName(Text.of('§e[ Руководство Металлурга Элириума ]'))
                        .withLore([
                            Text.of('§7Верстак Оружейника кует 15 типов клинков SimplySwords.'),
                            Text.of('§7Кузнечный Очаг обеспечивает разогрев и ремонт.'),
                            Text.of('§7Связка [3-1-2-4] пробуждает Великую Кузницу!'),
                            Text.of('§8────────────────────────────────'),
                            Text.of('§a✓ 100% защита предметов: отсутствие потери ресурсов.')
                        ]));
                    s.leftClicked = () => {};
                });
            } else {
                gui.slot(x, 5, s => { s.setItem(decoPane); s.leftClicked = () => {}; });
            }
        }
    });
}

// ------------------------------------------------------------------------------
// RIGHT CLICK EVENT HOOKS
// ------------------------------------------------------------------------------

// 1. Right click on Blacksmith Workbench
BlockEvents.rightClicked('kubejs:blacksmith_workbench', event => {
    let player = event.player;
    if (!player || player.level.isClientSide()) return;

    let handStr = event.hand ? String(event.hand) : 'MAIN_HAND';
    if (!handStr.includes('MAIN')) return;

    event.cancel();
    openBlacksmithGUI(player, event.block.pos);
    player.server.runCommandSilent(`playsound minecraft:block.wood.hit player ${player.username} ~ ~ ~ 0.8 1.0`);
});

// 2. Right click on Blacksmith Hearth
BlockEvents.rightClicked('kubejs:blacksmith_hearth', event => {
    let player = event.player;
    if (!player || player.level.isClientSide()) return;

    let handStr = event.hand ? String(event.hand) : 'MAIN_HAND';
    if (!handStr.includes('MAIN')) return;

    event.cancel();
    let session = getOrCreateBlacksmithSession(player);
    session.tab = 3; // Direct to repair tab on hearth click!
    openBlacksmithGUI(player, event.block.pos);
    player.server.runCommandSilent(`playsound minecraft:block.blastfurnace.fire_crackle player ${player.username} ~ ~ ~ 0.8 1.0`);
});

// 3. Right click on Void Anvil (Trigger sharpening / reinforcement altar)
BlockEvents.rightClicked('kubejs:void_anvil', event => {
    let player = event.player;
    if (!player || player.level.isClientSide()) return;

    let handStr = event.hand ? String(event.hand) : 'MAIN_HAND';
    if (!handStr.includes('MAIN')) return;

    event.cancel();
    player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.8 1.0`);
    if (typeof openInfernalAnvilGUI === 'function') {
        openInfernalAnvilGUI(player);
    } else {
        player.server.runCommandSilent(`execute as ${player.username} run infernal_anvil`);
    }
});

// 4. Right click on Infernal Crucible
BlockEvents.rightClicked('kubejs:infernal_crucible', event => {
    let player = event.player;
    if (!player || player.level.isClientSide()) return;

    let handStr = event.hand ? String(event.hand) : 'MAIN_HAND';
    if (!handStr.includes('MAIN')) return;

    event.cancel();
    let cx = event.block.x + 0.5;
    let cy = event.block.y + 0.5;
    let cz = event.block.z + 0.5;
    player.server.runCommandSilent(`playsound minecraft:block.lava.ambient player ${player.username} ${cx} ${cy} ${cz} 0.8 1.0`);
    player.server.runCommandSilent(`particle minecraft:lava ${cx} ${cy + 0.6} ${cz} 0.2 0.2 0.2 0.05 10`);

    let station = getBlacksmithStationInfo(player.level, event.block.pos);
    if (station.hasWorkbench) {
        openBlacksmithGUI(player, station.workbenchPos || event.block.pos);
    } else {
        player.sendSystemMessage(Text.of('§4🌋 [Адский Горн] §7Высокотемпературный тигель Незера пылает. Подключите его к Верстаку Оружейника [3-1-2-4]!'));
    }
});

// Cleanup on logout
PlayerEvents.loggedOut(event => {
    if (event.player) clearBlacksmithSession(event.player);
});
