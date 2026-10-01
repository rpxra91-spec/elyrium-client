// ==============================================================================
// 🏛️ ELYRIUM RPG: FORGE WORKSHOP GUI & MULTIBLOCK CRAFTING ENGINE
// Minecraft 1.21.1 NeoForge | KubeJS Server Script (v2.0)
// ==============================================================================
// Modular Workstation Logic:
// 1. Smithing Bench + Forge Hearth within 1 block = Activates Forge Crafting.
// 2. Smithing Bench + Anvil within 1 block = Unlocks Reinforcement & Ascension.
// 3. 6-Row Unified ChestMenu GUI:
//    - Tabs:
//      [🔮 Мантии], [🏹 Легкая], [⚔️ Средняя ДД], [🛡️ Тяжелая], [🗡️ Оружие],
//      [👑 Босс-Сеты], [🌋 Возвышение], [🔨 Заточка]
//    - Ingot Matrix: Helm 5, Chest 8, Legs 7, Boots 4, 1H 4, 2H/Bow/Staff 6, Shield 5.
//    - Ascension: 1 old gear + ingots (4-8) + 1 Catalyst. Transfers +N & attributes!
//    - Craft from scratch: ingots (4-8) + 2 Catalysts (or 1 Boss Core).
//    - 100% item safety: zero loss on close/disconnect.
// ==============================================================================

// Session tracking
let activeWorkshopSessions = new Map();

function getOrCreateWorkshopSession(player) {
    let uuid = player.uuid.toString();
    if (!activeWorkshopSessions.has(uuid)) {
        activeWorkshopSessions.set(uuid, {
            tab: 0,              // 0..7
            selectedIdx: 0,      // Index within current tab
            bossAspect: 'medium',// 'mage' | 'scout' | 'medium' | 'tank'
            hasAnvil: false,
            benchPos: null,
            refreshingTime: 0
        });
    }
    return activeWorkshopSessions.get(uuid);
}

function clearWorkshopSession(player) {
    let uuid = player.uuid.toString();
    activeWorkshopSessions.delete(uuid);
}

// ------------------------------------------------------------------------------
// CRAFTING CATALOG & INGREDIENT DEFINITIONS (8 TABS)
// ------------------------------------------------------------------------------
const FORGE_CATALOG = [
    // --------------------------------------------------------------------------
    // TAB 0: 🔮 МАНТИИ МАГА
    // --------------------------------------------------------------------------
    [
        {
            id: 'kubejs:rift_apprentice_robe_helmet',
            name: '§dКапюшон Ученика Разлома',
            tier: 'Tier 0 (Верхний Мир)',
            role: 'Магический Капюшон: +15% Спеллпауэр, +10 Маны',
            ingot: 'minecraft:amethyst_shard', ingotName: 'Осколок Аметиста', ingotCount: 5,
            extra: 'minecraft:string', extraName: 'Рунная Нить', extraCount: 1,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:rift_apprentice_robe_chestplate',
            name: '§dМантия Ученика Разлома',
            tier: 'Tier 0 (Верхний Мир)',
            role: 'Магическая Мантия: +25% Спеллпауэр, +20 Маны',
            ingot: 'minecraft:amethyst_shard', ingotName: 'Осколок Аметиста', ingotCount: 8,
            extra: 'minecraft:white_wool', extraName: 'Рунная Ткань', extraCount: 2,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:rift_apprentice_robe_leggings',
            name: '§dШтаны Ученика Разлома',
            tier: 'Tier 0 (Верхний Мир)',
            role: 'Магические Штаны: +15% Спеллпауэр, +10 Маны',
            ingot: 'minecraft:amethyst_shard', ingotName: 'Осколок Аметиста', ingotCount: 7,
            extra: 'minecraft:white_wool', extraName: 'Рунная Ткань', extraCount: 2,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:rift_apprentice_robe_boots',
            name: '§dСапоги Ученика Разлома',
            tier: 'Tier 0 (Верхний Мир)',
            role: 'Магические Сапоги: +10% Спеллпауэр, Fast Roll',
            ingot: 'minecraft:amethyst_shard', ingotName: 'Осколок Аметиста', ingotCount: 4,
            extra: 'minecraft:string', extraName: 'Рунная Нить', extraCount: 1,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:rift_apprentice_staff',
            name: '§dПосох Ученика Разлома',
            tier: 'Tier 0 (Верхний Мир)',
            role: 'Универсальный Посох: 12 Емкости, Магическая Стрела I, +10% Ко Всем Школам',
            ingot: 'minecraft:amethyst_shard', ingotName: 'Осколок Аметиста', ingotCount: 6,
            extra: 'minecraft:stick', extraName: 'Древесная Основа', extraCount: 2,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:cinder_pyro_robe_helmet',
            name: '§cПепельный Капюшон Пироманта',
            tier: 'Tier 1 (Незер)',
            role: 'Инфернальный Капюшон: +20% Огненный Урон, +15 Маны',
            ingot: 'minecraft:quartz', ingotName: 'Кварц Незера', ingotCount: 5,
            extra: 'minecraft:blaze_powder', extraName: 'Огненная Пыль', extraCount: 1,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 2
        },
        {
            id: 'kubejs:cinder_pyro_robe_chestplate',
            name: '§cПепельная Мантия Пироманта',
            tier: 'Tier 1 (Незер)',
            role: 'Инфернальная Мантия: +30% Огненный Урон, +35 Маны',
            ingot: 'minecraft:quartz', ingotName: 'Кварц Незера', ingotCount: 8,
            extra: 'minecraft:blaze_powder', extraName: 'Огненная Пыль', extraCount: 2,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 2
        },
        {
            id: 'kubejs:cinder_pyro_robe_leggings',
            name: '§cПепельные Штаны Пироманта',
            tier: 'Tier 1 (Незер)',
            role: 'Инфернальные Штаны: +20% Огненный Урон, +20 Маны',
            ingot: 'minecraft:quartz', ingotName: 'Кварц Незера', ingotCount: 7,
            extra: 'minecraft:blaze_powder', extraName: 'Огненная Пыль', extraCount: 2,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 2
        },
        {
            id: 'kubejs:cinder_pyro_robe_boots',
            name: '§cПепельные Сапоги Пироманта',
            tier: 'Tier 1 (Незер)',
            role: 'Инфернальные Сапоги: +15% Огненный Урон, Иммунитет к Лаве 15%',
            ingot: 'minecraft:quartz', ingotName: 'Кварц Незера', ingotCount: 4,
            extra: 'minecraft:blaze_powder', extraName: 'Огненная Пыль', extraCount: 1,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 2
        }
    ],

    // --------------------------------------------------------------------------
    // TAB 1: 🏹 ЛЕГКИЙ ДОСПЕХ (СЛЕДОПЫТ)
    // --------------------------------------------------------------------------
    [
        {
            id: 'kubejs:scout_leather_helmet',
            name: '§eКапюшон Разведчика',
            tier: 'Tier 0 (Верхний Мир)',
            role: 'Легкий Доспех: +5% Скорость, +5% Крит',
            ingot: 'minecraft:copper_ingot', ingotName: 'Медный Слиток', ingotCount: 5,
            extra: 'minecraft:leather', extraName: 'Закаленная Кожа', extraCount: 1,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:scout_leather_chestplate',
            name: '§eКожаный Доспех Разведчика',
            tier: 'Tier 0 (Верхний Мир)',
            role: 'Легкий Доспех: +10% Скорость, +25% Урон со спины',
            ingot: 'minecraft:copper_ingot', ingotName: 'Медный Слиток', ingotCount: 8,
            extra: 'minecraft:leather', extraName: 'Закаленная Кожа', extraCount: 2,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:scout_leather_leggings',
            name: '§eШтаны Разведчика',
            tier: 'Tier 0 (Верхний Мир)',
            role: 'Легкий Доспех: +5% Скорость, +10% Крит',
            ingot: 'minecraft:copper_ingot', ingotName: 'Медный Слиток', ingotCount: 7,
            extra: 'minecraft:leather', extraName: 'Закаленная Кожа', extraCount: 2,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:scout_leather_boots',
            name: '§eСапоги Разведчика',
            tier: 'Tier 0 (Верхний Мир)',
            role: 'Легкий Доспех: Fast Roll, Бесшумные шаги',
            ingot: 'minecraft:copper_ingot', ingotName: 'Медный Слиток', ingotCount: 4,
            extra: 'minecraft:leather', extraName: 'Закаленная Кожа', extraCount: 1,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:bastion_hunter_helmet',
            name: '§6Маска Охотника Бастионов',
            tier: 'Tier 1 (Незер)',
            role: 'Следопыт Незера: +10% Крит, Нейтральность Пиглинов',
            ingot: 'minecraft:gold_ingot', ingotName: 'Золотой Слиток', ingotCount: 5,
            extra: 'minecraft:leather', extraName: 'Кожа Хоглина', extraCount: 1,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 2
        },
        {
            id: 'kubejs:bastion_hunter_chestplate',
            name: '§6Доспех Охотника Бастионов',
            tier: 'Tier 1 (Незер)',
            role: 'Следопыт Незера: +15% Скорость бега, +20% Крит',
            ingot: 'minecraft:gold_ingot', ingotName: 'Золотой Слиток', ingotCount: 8,
            extra: 'minecraft:leather', extraName: 'Кожа Хоглина', extraCount: 2,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 2
        },
        {
            id: 'kubejs:bastion_hunter_leggings',
            name: '§6Штаны Охотника Бастионов',
            tier: 'Tier 1 (Незер)',
            role: 'Следопыт Незера: +10% Скорость, +40% Урон со спины',
            ingot: 'minecraft:gold_ingot', ingotName: 'Золотой Слиток', ingotCount: 7,
            extra: 'minecraft:leather', extraName: 'Кожа Хоглина', extraCount: 2,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 2
        },
        {
            id: 'kubejs:bastion_hunter_boots',
            name: '§6Сапоги Охотника Бастионов',
            tier: 'Tier 1 (Незер)',
            role: 'Следопыт Незера: Fast Roll, Сопротивление Лаве 20%',
            ingot: 'minecraft:gold_ingot', ingotName: 'Золотой Слиток', ingotCount: 4,
            extra: 'minecraft:leather', extraName: 'Кожа Хоглина', extraCount: 1,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 2
        }
    ],

    // --------------------------------------------------------------------------
    // TAB 2: ⚔️ СРЕДНИЙ ДОСПЕХ (МИЛИ ДД / БРУЗЕР)
    // --------------------------------------------------------------------------
    [
        {
            id: 'kubejs:iron_brigandine_helmet',
            name: '§fШлем Бригантины ДД',
            tier: 'Tier 0 (Верхний Мир)',
            role: 'Средний Доспех: +5% Физ. Урон, Medium Roll',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', ingotCount: 5,
            extra: 'minecraft:leather', extraName: 'Кожаная Подкладка', extraCount: 1,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:iron_brigandine_chestplate',
            name: '§fЖелезная Бригантина ДД',
            tier: 'Tier 0 (Верхний Мир)',
            role: 'Средний Доспех: +15% Базовый физ. урон, +10% Скорость атаки',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', ingotCount: 8,
            extra: 'minecraft:leather', extraName: 'Кожаная Подкладка', extraCount: 2,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:iron_brigandine_leggings',
            name: '§fПоножи Бригантины ДД',
            tier: 'Tier 0 (Верхний Мир)',
            role: 'Средний Доспех: -15% Расход стамины на умения',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', ingotCount: 7,
            extra: 'minecraft:leather', extraName: 'Кожаная Подкладка', extraCount: 2,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:iron_brigandine_boots',
            name: '§fСапоги Бригантины ДД',
            tier: 'Tier 0 (Верхний Мир)',
            role: 'Средний Доспех: Medium Roll, Баланс стойки',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', ingotCount: 4,
            extra: 'minecraft:leather', extraName: 'Кожаная Подкладка', extraCount: 1,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:cinder_brigandine_helmet',
            name: '§cПепельный Шлем ДД',
            tier: 'Tier 1 (Незер)',
            role: 'Брузер ДД: +10% Физ. Урон, Пробой Брони 10%',
            ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 5,
            extra: 'minecraft:blaze_powder', extraName: 'Огненная Эссенция', extraCount: 1,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 2
        },
        {
            id: 'kubejs:cinder_brigandine_chestplate',
            name: '§cПепельная Бригантина ДД',
            tier: 'Tier 1 (Незер)',
            role: 'Брузер ДД: +20% Физ. Урон, -25% Расход стамины, Жажда Битвы',
            ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 8,
            extra: 'minecraft:blaze_powder', extraName: 'Огненная Эссенция', extraCount: 2,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 2
        },
        {
            id: 'kubejs:cinder_brigandine_leggings',
            name: '§cПепельные Поножи ДД',
            tier: 'Tier 1 (Незер)',
            role: 'Брузер ДД: Пробой брони 25%, Скорость комбо +15%',
            ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 7,
            extra: 'minecraft:blaze_powder', extraName: 'Огненная Эссенция', extraCount: 2,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 2
        },
        {
            id: 'kubejs:cinder_brigandine_boots',
            name: '§cПепельные Сапоги ДД',
            tier: 'Tier 1 (Незер)',
            role: 'Брузер ДД: Medium Roll, Сопротивление лаве 25%',
            ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 4,
            extra: 'minecraft:blaze_powder', extraName: 'Огненная Эссенция', extraCount: 1,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 2
        }
    ],

    // --------------------------------------------------------------------------
    // TAB 3: 🛡️ ТЯЖЕЛЫЕ ЛАТЫ (ТАНК / СТРАЖ)
    // --------------------------------------------------------------------------
    [
        {
            id: 'kubejs:steel_knight_helmet',
            name: '§9Шлем Рыцаря Границы',
            tier: 'Tier 0 (Верхний Мир)',
            role: 'Тяжелый Танк: Броня 4, Твердость 1, Стойка Щита +25',
            ingot: 'minecraft:iron_ingot', ingotName: 'Закаленная Сталь', ingotCount: 5,
            extra: 'minecraft:diamond', extraName: 'Алмазное Усиление', extraCount: 1,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:steel_knight_chestplate',
            name: '§9Стальные Латы Рыцаря Границы',
            tier: 'Tier 0 (Верхний Мир)',
            role: 'Тяжелый Танк: Броня 9, Твердость 2, Стойка Щита +50, Гипер-броня',
            ingot: 'minecraft:iron_ingot', ingotName: 'Закаленная Сталь', ingotCount: 8,
            extra: 'minecraft:diamond', extraName: 'Алмазное Усиление', extraCount: 2,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:steel_knight_leggings',
            name: '§9Поножи Рыцаря Границы',
            tier: 'Tier 0 (Верхний Мир)',
            role: 'Тяжелый Танк: Броня 7, Твердость 1, Стойка Щита +25',
            ingot: 'minecraft:iron_ingot', ingotName: 'Закаленная Сталь', ingotCount: 7,
            extra: 'minecraft:diamond', extraName: 'Алмазное Усиление', extraCount: 2,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:steel_knight_boots',
            name: '§9Сапоги Рыцаря Границы',
            tier: 'Tier 0 (Верхний Мир)',
            role: 'Тяжелый Танк: Fat Roll, 100% Защита от падений до 5м',
            ingot: 'minecraft:iron_ingot', ingotName: 'Закаленная Сталь', ingotCount: 4,
            extra: 'minecraft:diamond', extraName: 'Алмазное Усиление', extraCount: 1,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:infernal_plate_helmet',
            name: '§4Инфернальный Шлем Танка',
            tier: 'Tier 1 (Незер)',
            role: 'Незеритовый Танк: Броня 6, Твердость 3, Стойка Щита +50',
            ingot: 'minecraft:netherite_ingot', ingotName: 'Незеритовый Слиток', ingotCount: 5,
            extra: 'minecraft:crying_obsidian', extraName: 'Плачущий Обсидиан', extraCount: 1,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 2
        },
        {
            id: 'kubejs:infernal_plate_chestplate',
            name: '§4Инфернальные Латы Танка',
            tier: 'Tier 1 (Незер)',
            role: 'Незеритовый Танк: Броня 12, Твердость 4, Стойка Щита +100, 100% Огнеупорность',
            ingot: 'minecraft:netherite_ingot', ingotName: 'Незеритовый Слиток', ingotCount: 8,
            extra: 'minecraft:crying_obsidian', extraName: 'Плачущий Обсидиан', extraCount: 2,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 2
        },
        {
            id: 'kubejs:infernal_plate_leggings',
            name: '§4Инфернальные Поножи Танка',
            tier: 'Tier 1 (Незер)',
            role: 'Незеритовый Танк: Броня 8, Твердость 3, Стойка Щита +50',
            ingot: 'minecraft:netherite_ingot', ingotName: 'Незеритовый Слиток', ingotCount: 7,
            extra: 'minecraft:crying_obsidian', extraName: 'Плачущий Обсидиан', extraCount: 2,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 2
        },
        {
            id: 'kubejs:infernal_plate_boots',
            name: '§4Инфернальные Сапоги Танка',
            tier: 'Tier 1 (Незер)',
            role: 'Незеритовый Танк: 100% Иммунитет к Отбрасыванию, Хождение по Лаве',
            ingot: 'minecraft:netherite_ingot', ingotName: 'Незеритовый Слиток', ingotCount: 4,
            extra: 'minecraft:crying_obsidian', extraName: 'Плачущий Обсидиан', extraCount: 1,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 2
        }
    ],

    // --------------------------------------------------------------------------
    // TAB 4: 🗡️ ОРУЖИЕ, ЩИТЫ И ПОСОХИ
    // --------------------------------------------------------------------------
    [
        {
            id: 'minecraft:iron_sword',
            name: '§fЖелезный Меч',
            tier: 'Tier 0 (Верхний Мир)',
            role: 'Одноручный Клинок: Базовый физ. урон 6.0, скорость 1.6',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', ingotCount: 4,
            extra: 'minecraft:stick', extraName: 'Рукоять', extraCount: 1,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'minecraft:shield',
            name: '§6Боевой Щит',
            tier: 'Tier 0 (Верхний Мир)',
            role: 'Щит Защитника: Пул Стойки 100 ед., Блок 100% Физ. Урона',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железная Оковка', ingotCount: 5,
            extra: '#minecraft:planks', extraName: 'Дубовый Сердечник', extraCount: 2,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'minecraft:bow',
            name: '§aОхотничий Лук',
            tier: 'Tier 0 (Верхний Мир)',
            role: 'Стрелковое Оружие: Дальность 30м, баллистический выстрел',
            ingot: 'minecraft:copper_ingot', ingotName: 'Медные Наконечники', ingotCount: 6,
            extra: 'minecraft:string', extraName: 'Тетива', extraCount: 3,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:cinder_staff',
            name: '§cИнфернальный Посох Пепла',
            tier: 'Tier 1 (Незер)',
            role: 'Посох Огня: 20 Емкости, Огненная Стрела II, +25% Огненный Урон',
            ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 6,
            extra: 'minecraft:blaze_powder', extraName: 'Огненная Эссенция', extraCount: 4,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 2
        },
        {
            id: 'skd:cinder_katana',
            name: '§cПепельная Катана',
            tier: 'Tier 1 (Незер)',
            role: 'Быстрый Клинок: Урон 8.0, Скорость 1.6, Фантомный Выпад (Иай)',
            ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 4,
            extra: 'minecraft:blaze_rod', extraName: 'Огненный Стержень', extraCount: 1,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 2
        },
        {
            id: 'skd:cinder_claymore',
            name: '§cПепельный Клеймор',
            tier: 'Tier 1 (Незер)',
            role: 'Двуручный Меч: Урон 11.0, Скорость 1.0, Вихревой Размах на 360°',
            ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 6,
            extra: 'minecraft:blaze_rod', extraName: 'Огненный Стержень', extraCount: 2,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 2
        },
        {
            id: 'skd:cinder_scythe',
            name: '§cПепельная Коса',
            tier: 'Tier 1 (Незер)',
            role: 'Боевая Коса: Урон 10.0, Скорость 1.1, Кровавая Жатва с вампиризмом',
            ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 6,
            extra: 'minecraft:blaze_rod', extraName: 'Огненный Стержень', extraCount: 2,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 2
        },
        {
            id: 'skd:cinder_bow',
            name: '§cПепельный Составной Лук',
            tier: 'Tier 1 (Незер)',
            role: 'Составной Лук: Пробитие 25% брони, поджог стрел',
            ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 6,
            extra: 'minecraft:blaze_rod', extraName: 'Огненный Стержень', extraCount: 2,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 2
        }
    ],

    // --------------------------------------------------------------------------
    // TAB 5: 👑 БОСС-СЕТ ИСПЕПЕЛИТЕЛЯ (IGNIS CORE ARMOR)
    // --------------------------------------------------------------------------
    [
        {
            id: 'kubejs:ignis_core_helmet',
            name: '§4👑 Шлем Испепелителя (Ядро Игниса)',
            tier: 'Boss Set (Кульминация Незера)',
            role: 'Эпохальный Доспех Босса: Адаптируется под выбранный Классовый Аспект!',
            ingot: 'minecraft:netherite_ingot', ingotName: 'Незеритовый Слиток', ingotCount: 5,
            extra: 'minecraft:netherite_ingot', extraName: 'Незеритовый Каркас', extraCount: 0,
            cat: 'cataclysm:burning_ashes', catName: 'Пепел Игниса / Ядро Босса', catCount: 1
        },
        {
            id: 'kubejs:ignis_core_chestplate',
            name: '§4👑 Доспех Испепелителя (Ядро Игниса)',
            tier: 'Boss Set (Кульминация Незера)',
            role: 'Эпохальный Доспех Босса: Адаптируется под выбранный Классовый Аспект!',
            ingot: 'minecraft:netherite_ingot', ingotName: 'Незеритовый Слиток', ingotCount: 8,
            extra: 'minecraft:netherite_ingot', extraName: 'Незеритовый Каркас', extraCount: 0,
            cat: 'cataclysm:burning_ashes', catName: 'Пепел Игниса / Ядро Босса', catCount: 1
        },
        {
            id: 'kubejs:ignis_core_leggings',
            name: '§4👑 Поножи Испепелителя (Ядро Игниса)',
            tier: 'Boss Set (Кульминация Незера)',
            role: 'Эпохальный Доспех Босса: Адаптируется под выбранный Классовый Аспект!',
            ingot: 'minecraft:netherite_ingot', ingotName: 'Незеритовый Слиток', ingotCount: 7,
            extra: 'minecraft:netherite_ingot', extraName: 'Незеритовый Каркас', extraCount: 0,
            cat: 'cataclysm:burning_ashes', catName: 'Пепел Игниса / Ядро Босса', catCount: 1
        },
        {
            id: 'kubejs:ignis_core_boots',
            name: '§4👑 Сапоги Испепелителя (Ядро Игниса)',
            tier: 'Boss Set (Кульминация Незера)',
            role: 'Эпохальный Доспех Босса: Адаптируется под выбранный Классовый Аспект!',
            ingot: 'minecraft:netherite_ingot', ingotName: 'Незеритовый Слиток', ingotCount: 4,
            extra: 'minecraft:netherite_ingot', extraName: 'Незеритовый Каркас', extraCount: 0,
            cat: 'cataclysm:burning_ashes', catName: 'Пепел Игниса / Ядро Босса', catCount: 1
        }
    ],

    // --------------------------------------------------------------------------
    // TAB 6: 🌋 ВОЗВЫШЕНИЕ («НАСЛЕДИЕ» - ТИР 0 ➔ ТИР 1)
    // --------------------------------------------------------------------------
    [
        // Mage Robe Ascension (T0 Amethyst -> T1 Quartz)
        {
            isAscension: true,
            baseGear: 'kubejs:rift_apprentice_robe_helmet', baseGearName: 'Капюшон Ученика Разлома',
            id: 'kubejs:cinder_pyro_robe_helmet', name: '§cПепельный Капюшон Пироманта',
            tier: 'Возвышение: Тир 0 ➔ Тир 1',
            role: 'Перенос в Тир 1 (Незер) с полным сохранением заточки +N и сокетов!',
            ingot: 'minecraft:quartz', ingotName: 'Кварц Незера', ingotCount: 5,
            extra: null, extraName: null, extraCount: 0,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 1
        },
        {
            isAscension: true,
            baseGear: 'kubejs:rift_apprentice_robe_chestplate', baseGearName: 'Мантия Ученика Разлома',
            id: 'kubejs:cinder_pyro_robe_chestplate', name: '§cПепельная Мантия Пироманта',
            tier: 'Возвышение: Тир 0 ➔ Тир 1',
            role: 'Перенос в Тир 1 (Незер) с полным сохранением заточки +N и сокетов!',
            ingot: 'minecraft:quartz', ingotName: 'Кварц Незера', ingotCount: 8,
            extra: null, extraName: null, extraCount: 0,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 1
        },
        {
            isAscension: true,
            baseGear: 'kubejs:rift_apprentice_robe_leggings', baseGearName: 'Штаны Ученика Разлома',
            id: 'kubejs:cinder_pyro_robe_leggings', name: '§cПепельные Штаны Пироманта',
            tier: 'Возвышение: Тир 0 ➔ Тир 1',
            role: 'Перенос в Тир 1 (Незер) с полным сохранением заточки +N и сокетов!',
            ingot: 'minecraft:quartz', ingotName: 'Кварц Незера', ingotCount: 7,
            extra: null, extraName: null, extraCount: 0,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 1
        },
        {
            isAscension: true,
            baseGear: 'kubejs:rift_apprentice_robe_boots', baseGearName: 'Сапоги Ученика Разлома',
            id: 'kubejs:cinder_pyro_robe_boots', name: '§cПепельные Сапоги Пироманта',
            tier: 'Возвышение: Тир 0 ➔ Тир 1',
            role: 'Перенос в Тир 1 (Незер) с полным сохранением заточки +N и сокетов!',
            ingot: 'minecraft:quartz', ingotName: 'Кварц Незера', ingotCount: 4,
            extra: null, extraName: null, extraCount: 0,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 1
        },
        {
            isAscension: true,
            baseGear: 'kubejs:rift_apprentice_staff', baseGearName: 'Посох Ученика Разлома',
            id: 'kubejs:cinder_staff', name: '§cИнфернальный Посох Пепла',
            tier: 'Возвышение: Тир 0 ➔ Тир 1',
            role: 'Эволюция Посоха: 12 ➔ 20 Емкости, Магическая Стрела I ➔ Огненная Стрела II!',
            ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 6,
            extra: null, extraName: null, extraCount: 0,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 1
        },

        // Scout Leather Ascension (T0 Copper -> T1 Gold)
        {
            isAscension: true,
            baseGear: 'kubejs:scout_leather_helmet', baseGearName: 'Капюшон Разведчика',
            id: 'kubejs:bastion_hunter_helmet', name: '§6Маска Охотника Бастионов',
            tier: 'Возвышение: Тир 0 ➔ Тир 1',
            role: 'Перенос в Тир 1 (Незер) с полным сохранением заточки +N и сокетов!',
            ingot: 'minecraft:gold_ingot', ingotName: 'Золотой Слиток', ingotCount: 5,
            extra: null, extraName: null, extraCount: 0,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 1
        },
        {
            isAscension: true,
            baseGear: 'kubejs:scout_leather_chestplate', baseGearName: 'Кожаный Доспех Разведчика',
            id: 'kubejs:bastion_hunter_chestplate', name: '§6Доспех Охотника Бастионов',
            tier: 'Возвышение: Тир 0 ➔ Тир 1',
            role: 'Перенос в Тир 1 (Незер) с полным сохранением заточки +N и сокетов!',
            ingot: 'minecraft:gold_ingot', ingotName: 'Золотой Слиток', ingotCount: 8,
            extra: null, extraName: null, extraCount: 0,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 1
        },
        {
            isAscension: true,
            baseGear: 'kubejs:scout_leather_leggings', baseGearName: 'Штаны Разведчика',
            id: 'kubejs:bastion_hunter_leggings', name: '§6Штаны Охотника Бастионов',
            tier: 'Возвышение: Тир 0 ➔ Тир 1',
            role: 'Перенос в Тир 1 (Незер) с полным сохранением заточки +N и сокетов!',
            ingot: 'minecraft:gold_ingot', ingotName: 'Золотой Слиток', ingotCount: 7,
            extra: null, extraName: null, extraCount: 0,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 1
        },
        {
            isAscension: true,
            baseGear: 'kubejs:scout_leather_boots', baseGearName: 'Сапоги Разведчика',
            id: 'kubejs:bastion_hunter_boots', name: '§6Сапоги Охотника Бастионов',
            tier: 'Возвышение: Тир 0 ➔ Тир 1',
            role: 'Перенос в Тир 1 (Незер) с полным сохранением заточки +N и сокетов!',
            ingot: 'minecraft:gold_ingot', ingotName: 'Золотой Слиток', ingotCount: 4,
            extra: null, extraName: null, extraCount: 0,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 1
        },

        // Medium DD Ascension (T0 Iron -> T1 Cinder Alloy)
        {
            isAscension: true,
            baseGear: 'kubejs:iron_brigandine_helmet', baseGearName: 'Шлем Бригантины ДД',
            id: 'kubejs:cinder_brigandine_helmet', name: '§cПепельный Шлем ДД',
            tier: 'Возвышение: Тир 0 ➔ Тир 1',
            role: 'Перенос в Тир 1 (Незер) с полным сохранением заточки +N и сокетов!',
            ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 5,
            extra: null, extraName: null, extraCount: 0,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 1
        },
        {
            isAscension: true,
            baseGear: 'kubejs:iron_brigandine_chestplate', baseGearName: 'Железная Бригантина ДД',
            id: 'kubejs:cinder_brigandine_chestplate', name: '§cПепельная Бригантина ДД',
            tier: 'Возвышение: Тир 0 ➔ Тир 1',
            role: 'Перенос в Тир 1 (Незер) с полным сохранением заточки +N и сокетов!',
            ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 8,
            extra: null, extraName: null, extraCount: 0,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 1
        },
        {
            isAscension: true,
            baseGear: 'kubejs:iron_brigandine_leggings', baseGearName: 'Поножи Бригантины ДД',
            id: 'kubejs:cinder_brigandine_leggings', name: '§cПепельные Поножи ДД',
            tier: 'Возвышение: Тир 0 ➔ Тир 1',
            role: 'Перенос в Тир 1 (Незер) с полным сохранением заточки +N и сокетов!',
            ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 7,
            extra: null, extraName: null, extraCount: 0,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 1
        },
        {
            isAscension: true,
            baseGear: 'kubejs:iron_brigandine_boots', baseGearName: 'Сапоги Бригантины ДД',
            id: 'kubejs:cinder_brigandine_boots', name: '§cПепельные Сапоги ДД',
            tier: 'Возвышение: Тир 0 ➔ Тир 1',
            role: 'Перенос в Тир 1 (Незер) с полным сохранением заточки +N и сокетов!',
            ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 4,
            extra: null, extraName: null, extraCount: 0,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 1
        },

        // Heavy Tank Ascension (T0 Steel -> T1 Netherite)
        {
            isAscension: true,
            baseGear: 'kubejs:steel_knight_helmet', baseGearName: 'Шлем Рыцаря Границы',
            id: 'kubejs:infernal_plate_helmet', name: '§4Инфернальный Шлем Танка',
            tier: 'Возвышение: Тир 0 ➔ Тир 1',
            role: 'Перенос в Тир 1 (Незер) с полным сохранением заточки +N и сокетов!',
            ingot: 'minecraft:netherite_ingot', ingotName: 'Незеритовый Слиток', ingotCount: 5,
            extra: null, extraName: null, extraCount: 0,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 1
        },
        {
            isAscension: true,
            baseGear: 'kubejs:steel_knight_chestplate', baseGearName: 'Стальные Латы Рыцаря Границы',
            id: 'kubejs:infernal_plate_chestplate', name: '§4Инфернальные Латы Танка',
            tier: 'Возвышение: Тир 0 ➔ Тир 1',
            role: 'Перенос в Тир 1 (Незер) с полным сохранением заточки +N и сокетов!',
            ingot: 'minecraft:netherite_ingot', ingotName: 'Незеритовый Слиток', ingotCount: 8,
            extra: null, extraName: null, extraCount: 0,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 1
        },
        {
            isAscension: true,
            baseGear: 'kubejs:steel_knight_leggings', baseGearName: 'Поножи Рыцаря Границы',
            id: 'kubejs:infernal_plate_leggings', name: '§4Инфернальные Поножи Танка',
            tier: 'Возвышение: Тир 0 ➔ Тир 1',
            role: 'Перенос в Тир 1 (Незер) с полным сохранением заточки +N и сокетов!',
            ingot: 'minecraft:netherite_ingot', ingotName: 'Незеритовый Слиток', ingotCount: 7,
            extra: null, extraName: null, extraCount: 0,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 1
        },
        {
            isAscension: true,
            baseGear: 'kubejs:steel_knight_boots', baseGearName: 'Сапоги Рыцаря Границы',
            id: 'kubejs:infernal_plate_boots', name: '§4Инфернальные Сапоги Танка',
            tier: 'Возвышение: Тир 0 ➔ Тир 1',
            role: 'Перенос в Тир 1 (Незер) с полным сохранением заточки +N и сокетов!',
            ingot: 'minecraft:netherite_ingot', ingotName: 'Незеритовый Слиток', ingotCount: 4,
            extra: null, extraName: null, extraCount: 0,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 1
        },

        // Weapons Ascension
        {
            isAscension: true,
            baseGear: 'minecraft:iron_sword', baseGearName: 'Железный Меч',
            id: 'skd:cinder_katana', name: '§cПепельная Катана',
            tier: 'Возвышение: Тир 0 ➔ Тир 1',
            role: 'Эволюция Клинка: Урон 6.0 ➔ 8.0, Скорость 1.6, Фантомный Выпад!',
            ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 4,
            extra: null, extraName: null, extraCount: 0,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 1
        },
        {
            isAscension: true,
            baseGear: 'minecraft:bow', baseGearName: 'Охотничий Лук',
            id: 'skd:cinder_bow', name: '§cПепельный Составной Лук',
            tier: 'Возвышение: Тир 0 ➔ Тир 1',
            role: 'Эволюция Лука: Пробитие 25% брони, авто-поджог стрел пламенем!',
            ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 6,
            extra: null, extraName: null, extraCount: 0,
            cat: 'kubejs:ascension_catalyst_t4', catName: 'Катализатор Возвышения IV', catCount: 1
        }
    ],

    // --------------------------------------------------------------------------
    // TAB 7: 🔨 ЗАТОЧКА (+1..+10 НА АЛТАРЕ НАКОВАЛЬНИ)
    // --------------------------------------------------------------------------
    []
];

// Helper: Count items in player inventory
function countPlayerItems(player, itemIdOrTag) {
    if (!player || !itemIdOrTag) return 0;
    let inv = player.inventory;
    let count = 0;
    let isTag = itemIdOrTag.startsWith('#');
    let tagName = isTag ? itemIdOrTag.substring(1) : null;

    for (let i = 0; i < inv.size; i++) {
        let st = inv.getItem(i);
        if (!st || st.isEmpty()) continue;
        if (isTag) {
            if (st.hasTag(tagName)) count += st.count;
        } else {
            if (String(st.id) === itemIdOrTag) count += st.count;
        }
    }
    return count;
}

// Helper: Find item stack matching id or tag
function findPlayerItem(player, itemIdOrTag) {
    if (!player || !itemIdOrTag) return null;
    let inv = player.inventory;
    let isTag = itemIdOrTag.startsWith('#');
    let tagName = isTag ? itemIdOrTag.substring(1) : null;

    for (let i = 0; i < inv.size; i++) {
        let st = inv.getItem(i);
        if (!st || st.isEmpty()) continue;
        let match = isTag ? st.hasTag(tagName) : (String(st.id) === itemIdOrTag);
        if (match) return st;
    }
    return null;
}

// Helper: Deduct items from player inventory
function deductPlayerItems(player, itemIdOrTag, needed) {
    if (!player || needed <= 0) return true;
    let inv = player.inventory;
    let remain = needed;
    let isTag = itemIdOrTag.startsWith('#');
    let tagName = isTag ? itemIdOrTag.substring(1) : null;

    for (let i = 0; i < inv.size && remain > 0; i++) {
        let st = inv.getItem(i);
        if (!st || st.isEmpty()) continue;
        let match = isTag ? st.hasTag(tagName) : (String(st.id) === itemIdOrTag);
        if (match) {
            let take = Math.min(st.count, remain);
            st.shrink(take);
            remain -= take;
        }
    }
    return remain === 0;
}

// ------------------------------------------------------------------------------
// OPEN WORKSHOP GUI (CHEST MENU 6 ROWS / 54 SLOTS)
// ------------------------------------------------------------------------------
function openForgeWorkshopGUI(player, hasAnvil, benchPos) {
    let session = getOrCreateWorkshopSession(player);
    session.hasAnvil = !!hasAnvil;
    if (benchPos) session.benchPos = benchPos;

    let tabNames = [
        '§d🔮 [Мантии]',
        '§e🏹 [Легкая]',
        '§f⚔️ [Средняя ДД]',
        '§9🛡️ [Тяжелая]',
        '§c🗡️ [Оружие]',
        '§4👑 [Босс-Сеты]',
        '§6🌋 [Возвышение]',
        '§a🔨 [Заточка]'
    ];

    let currentCatalog = FORGE_CATALOG[session.tab] || FORGE_CATALOG[0];
    if (session.selectedIdx >= currentCatalog.length) session.selectedIdx = 0;
    let currentRecipe = currentCatalog[session.selectedIdx] || null;

    player.openChestGUI(Text.of('⚒ §8§lКУЗНЕЧНЫЙ КОМПЛЕКС §c✦ §6ЭЛИРИУМ'), 6, gui => {
        gui.playerSlots = true;
        gui.closed = () => {
            clearWorkshopSession(player);
        };

        // ======================================================================
        // ROW 0: ВЕРХНИЙ КАРНИЗ И 8 ВКЛАДОК КУЗНЕЧНОГО ДЕЛА
        // ======================================================================

        // 1. Статус Кузнечного Комплекса (Slot 0)
        gui.slot(0, 0, s => {
            let anvilLine = session.hasAnvil
                ? '§a✓ Наковальня: Подключена (+1..+10, Наследие)'
                : '§7🔒 Наковальня: Не найдена (установите рядом)';
            s.setItem(Item.of('minecraft:campfire').withCustomName(Text.of('§6⚒ [ СТАТУС КУЗНИЦЫ ]')).withLore([
                Text.of('§a✓ Горн: Пылает (Жар 100%)'),
                Text.of(anvilLine),
                Text.of('§8────────────────────────────────'),
                Text.of('§7Центр высокотемпературной металлургии.')
            ]));
            s.leftClicked = () => {};
        });

        // 2. Вкладки 0..5: Базовая ковка (Slots 1..6)
        for (let t = 0; t < 6; t++) {
            let tabIdx = t;
            let isSelected = (session.tab === tabIdx);
            let tabIcon = 'minecraft:iron_nugget';
            if (t === 0) tabIcon = 'minecraft:amethyst_shard';
            else if (t === 1) tabIcon = 'minecraft:leather';
            else if (t === 2) tabIcon = 'minecraft:iron_sword';
            else if (t === 3) tabIcon = 'minecraft:shield';
            else if (t === 4) tabIcon = 'minecraft:bow';
            else if (t === 5) tabIcon = 'minecraft:nether_star';

            let tabItem = Item.of(isSelected ? 'minecraft:nether_star' : tabIcon)
                .withCustomName(Text.of(isSelected ? `§6▶ ${tabNames[tabIdx]} ◀` : tabNames[tabIdx]))
                .withLore([
                    Text.of(isSelected ? '§a[Выбранная вкладка]' : '§e▶ Нажмите для перехода в раздел')
                ]);

            gui.slot(1 + t, 0, s => {
                s.setItem(tabItem);
                s.leftClicked = () => {
                    session.tab = tabIdx;
                    session.selectedIdx = 0;
                    player.server.runCommandSilent(`playsound minecraft:ui.button.click player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openForgeWorkshopGUI(player, session.hasAnvil, session.benchPos);
                };
            });
        }

        // 3. Вкладка 6: Возвышение («Наследие») (Slot 7)
        gui.slot(7, 0, s => {
            if (session.hasAnvil) {
                let isSel = (session.tab === 6);
                let ascItem = Item.of(isSel ? 'minecraft:netherite_upgrade_smithing_template' : 'minecraft:netherite_scrap')
                    .withCustomName(Text.of(isSel ? '§6▶ §6🌋 [Возвышение] ◀' : '§6🌋 [Возвышение]'))
                    .withLore([
                        Text.of('§7Перенос экипировки в старшие миры (Наследие).'),
                        Text.of('§a✓ Сохраняет заточку +N, камни и сокеты!'),
                        Text.of('§e▶ Нажмите для открытия каталога Возвышения')
                    ]);
                s.setItem(ascItem);
                s.leftClicked = () => {
                    session.tab = 6;
                    session.selectedIdx = 0;
                    player.server.runCommandSilent(`playsound minecraft:block.blastfurnace.fire_crackle player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openForgeWorkshopGUI(player, session.hasAnvil, session.benchPos);
                };
            } else {
                s.setItem(Item.of('minecraft:barrier')
                    .withCustomName(Text.of('§8🔒 [Возвышение: Закрыто]'))
                    .withLore([
                        Text.of('§cТребуется Наковальня рядом со Столом!'),
                        Text.of('§7Поставьте наковальню для разблокировки Наследия.')
                    ]));
                s.leftClicked = () => {
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                    player.tell(Text.of('§c[Кузница] §7Для доступа к Возвышению («Наследию») установите Наковальню рядом со Столом Кузнеца!'));
                };
            }
        });

        // 4. Вкладка 7: Заточка (+1..+10) (Slot 8)
        gui.slot(8, 0, s => {
            if (session.hasAnvil) {
                s.setItem(Item.of('minecraft:anvil')
                    .withCustomName(Text.of('§a🔨 [Алтарь Заточки (+1..+10)]'))
                    .withLore([
                        Text.of('§7Глубокая закалка Кузнечными Камнями I..V.'),
                        Text.of('§7Защита от сброса Печатями Эгиды.'),
                        Text.of('§a▶ Нажмите для перехода к Алтарю Заточки!')
                    ]));
                s.leftClicked = () => {
                    clearWorkshopSession(player);
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.8 1.0`);
                    if (typeof openInfernalAnvilGUI === 'function') {
                        openInfernalAnvilGUI(player);
                    } else {
                        player.server.runCommandSilent(`execute as ${player.username} run infernal_anvil`);
                    }
                };
            } else {
                s.setItem(Item.of('minecraft:structure_void')
                    .withCustomName(Text.of('§8🔒 [Заточка: Закрыта]'))
                    .withLore([
                        Text.of('§cТребуется подключить Наковальню!'),
                        Text.of('§7Поставьте Наковальню рядом со Столом для заточки.')
                    ]));
                s.leftClicked = () => {
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                    player.tell(Text.of('§c[Кузница] §7Для доступа к Заточке (+1..+10) установите Наковальню рядом со Столом Кузнеца!'));
                };
            }
        });

        // ======================================================================
        // ROW 1: КАТАЛОГ ПРЕДМЕТОВ ВЫБРАННОЙ ВКЛАДКИ (SLOTS 9..17)
        // ======================================================================
        for (let i = 0; i < 9; i++) {
            let itemIdx = i;
            if (itemIdx < currentCatalog.length) {
                let rec = currentCatalog[itemIdx];
                let isSel = (session.selectedIdx === itemIdx);
                let previewItem = Item.of(rec.id)
                    .withCustomName(Text.of(isSel ? `§a★ ${rec.name} ★` : rec.name));

                let lore = [
                    Text.of(`§7Эпоха: §f${rec.tier}`),
                    Text.of(`§eРоль: §7${rec.role}`),
                    Text.of('§8────────────────────────────────')
                ];

                if (rec.isAscension) {
                    lore.push(Text.of(`§e• Базовая вещь: §f${rec.baseGearName} x1`));
                    lore.push(Text.of(`§6• Слитки: §f${rec.ingotName} x${rec.ingotCount}`));
                    lore.push(Text.of(`§d• Катализатор: §f${rec.catName} x1`));
                    lore.push(Text.of('§a✓ 100% перенос уровня заточки +N!'));
                } else {
                    lore.push(Text.of(`§6• Слитки: §f${rec.ingotName} x${rec.ingotCount}`));
                    if (rec.extraName && rec.extraCount > 0) {
                        lore.push(Text.of(`§b• Материал: §f${rec.extraName} x${rec.extraCount}`));
                    }
                    if (rec.catName && rec.catCount > 0) {
                        lore.push(Text.of(`§d• Катализатор/Ядро: §f${rec.catName} x${rec.catCount}`));
                    }
                }

                lore.push(Text.of(isSel ? '§a✓ Сейчас выбран для ковки' : '§e▶ Кликните для выбора'));
                previewItem.withLore(lore);

                gui.slot(i, 1, s => {
                    s.setItem(previewItem);
                    s.leftClicked = () => {
                        session.selectedIdx = itemIdx;
                        player.server.runCommandSilent(`playsound minecraft:block.stone.step player ${player.username} ~ ~ ~ 0.8 1.4`);
                        openForgeWorkshopGUI(player, session.hasAnvil, session.benchPos);
                    };
                });
            } else {
                gui.slot(i, 1, s => {
                    s.setItem(Item.of('minecraft:gray_stained_glass_pane').withCustomName(Text.of('§8Пустая ячейка каталога')));
                    s.leftClicked = () => {};
                });
            }
        }

        // ======================================================================
        // ROW 2: РАБОЧИЙ ВЕРСТАК И СЕЛЕКТОР АСПЕКТОВ БОСС-СЕТА
        // ======================================================================
        let ironPlate = Item.of('minecraft:black_stained_glass_pane').withCustomName(Text.of('§8✦ Плита Кузни ✦'));
        for (let x = 0; x < 9; x++) {
            if (x >= 2 && x <= 6) continue;
            gui.slot(x, 2, s => { s.setItem(ironPlate); s.leftClicked = () => {}; });
        }

        if (session.tab === 5) {
            // ДЛЯ БОСС-СЕТА: 4 КНОПКИ ВЫБОРА КЛАССОВОГО АСПЕКТА
            let aspects = [
                { id: 'mage', name: '§d🔮 Магический Аспект', lore: '+Spell Power, +Mana Pool, Адский Огонь Игниса' },
                { id: 'scout', name: '§e🏹 Аспект Следопыта', lore: '+25% Крит, +15% Скорость бега, Скрытность' },
                { id: 'medium', name: '§c⚔️ Аспект Брузера ДД', lore: '+20% Физ. Урон, -25% Расход стамины, Жажда Битвы' },
                { id: 'tank', name: '§9🛡️ Аспект Стража Танка', lore: '+Броня, +300 Пул Стойки Щита, 100% Гипер-Броня' }
            ];

            for (let a = 0; a < 4; a++) {
                let asp = aspects[a];
                let isChosen = (session.bossAspect === asp.id);
                let btnItem = Item.of(isChosen ? 'minecraft:blaze_powder' : 'minecraft:nether_brick')
                    .withCustomName(Text.of(isChosen ? `§6▶ ${asp.name} [ВЫБРАН] ◀` : asp.name))
                    .withLore([
                        Text.of(`§7${asp.lore}`),
                        Text.of(isChosen ? '§a✓ Будет применен при ковке' : '§e▶ Кликните для выбора аспекта!')
                    ]);

                gui.slot(2 + a, 2, s => {
                    s.setItem(btnItem);
                    s.leftClicked = () => {
                        session.bossAspect = asp.id;
                        player.server.runCommandSilent(`playsound minecraft:item.firecharge.use player ${player.username} ~ ~ ~ 0.8 1.2`);
                        openForgeWorkshopGUI(player, session.hasAnvil, session.benchPos);
                    };
                });
            }
        } else if (session.tab === 6) {
            // Для Возвышения («Наследие»): информационный баннер
            gui.slot(4, 2, s => {
                s.setItem(Item.of('minecraft:netherite_upgrade_smithing_template').withCustomName(Text.of('§6✦ [ АЛТАРЬ ВОЗВЫШЕНИЯ («НАСЛЕДИЕ») ] ✦')).withLore([
                    Text.of('§7Преобразует старую экипировку в следующий Тир.'),
                    Text.of('§a✓ Полное сохранение заточки +N, камней и сокетов!'),
                    Text.of('§eЭкономия: 1 Катализатор вместо 2 при ковке с нуля!')
                ]));
                s.leftClicked = () => {};
            });
        } else {
            // Для обычных сетов: информационный баннер
            gui.slot(4, 2, s => {
                s.setItem(Item.of('minecraft:iron_bars').withCustomName(Text.of('§6✦ [ ТИГЕЛЬ ВЫСОКОТЕМПЕРАТУРНОЙ КОВКИ ] ✦')).withLore([
                    Text.of('§7Кузнечный комплекс расплавляет руды и минералы.'),
                    Text.of('§8Проверьте наличие слитков и материалов в сумке!')
                ]));
                s.leftClicked = () => {};
            });
        }

        // ======================================================================
        // ROW 3: СЛОТЫ ТРЕБУЕМЫХ МАТЕРИАЛОВ И ГОТОВОГО РЕЗУЛЬТАТА
        // ======================================================================
        if (!currentRecipe) {
            for (let x = 0; x < 9; x++) {
                gui.slot(x, 3, s => { s.setItem(ironPlate); s.leftClicked = () => {}; });
            }
            return;
        }

        let isAsc = !!currentRecipe.isAscension;
        let curBaseGear = isAsc ? countPlayerItems(player, currentRecipe.baseGear) : 1;
        let hasEnoughBaseGear = isAsc ? (curBaseGear >= 1) : true;

        let curIngots = countPlayerItems(player, currentRecipe.ingot);
        let hasEnoughIngots = (curIngots >= currentRecipe.ingotCount);

        let curExtra = currentRecipe.extraCount > 0 ? countPlayerItems(player, currentRecipe.extra) : 0;
        let hasEnoughExtra = (currentRecipe.extraCount <= 0 || curExtra >= currentRecipe.extraCount);

        let curCat = currentRecipe.catCount > 0 ? countPlayerItems(player, currentRecipe.cat) : 0;
        let hasEnoughCat = (currentRecipe.catCount <= 0 || curCat >= currentRecipe.catCount);

        let canCraft = hasEnoughBaseGear && hasEnoughIngots && hasEnoughExtra && hasEnoughCat;

        // Очистка пустых слотов по краям
        gui.slot(0, 3, s => { s.setItem(ironPlate); s.leftClicked = () => {}; });
        gui.slot(8, 3, s => { s.setItem(ironPlate); s.leftClicked = () => {}; });

        if (isAsc) {
            // РАСКЛАДКА ВОЗВЫШЕНИЯ: [Старая Вещь] -> [Слитки] -> [Катализатор] -> [Результат]

            // СЛОТ 1: СТАРАЯ ЭКИПИРОВКА (X=1, Y=3)
            gui.slot(1, 3, s => {
                let baseIcon = Item.of(currentRecipe.baseGear)
                    .withCustomName(Text.of(`§e${currentRecipe.baseGearName} (Требуется: 1)`))
                    .withLore([
                        Text.of(`§7В наличии в сумке: §f${curBaseGear} шт.`),
                        Text.of(hasEnoughBaseGear ? '§a✓ Экипировка обнаружена' : '§c❌ Требуется базовая вещь!'),
                        Text.of('§8(Заточка +N перейдет на новую вещь)')
                    ]);
                s.setItem(baseIcon);
                s.leftClicked = () => {};
            });

            // СТРЕЛКА (X=2, Y=3)
            gui.slot(2, 3, s => {
                s.setItem(Item.of('minecraft:chain').withCustomName(Text.of('§8»»» НАГРЕВ »»»')));
                s.leftClicked = () => {};
            });

            // СЛОТ 2: СЛИТКИ СТАРШЕГО ТИРА (X=3, Y=3)
            gui.slot(3, 3, s => {
                let ingotIcon = Item.of(currentRecipe.ingot.startsWith('#') ? 'minecraft:oak_planks' : currentRecipe.ingot)
                    .withCustomName(Text.of(`§6${currentRecipe.ingotName} (Требуется: ${currentRecipe.ingotCount})`))
                    .withLore([
                        Text.of(`§7В наличии в сумке: §f${curIngots} шт.`),
                        Text.of(hasEnoughIngots ? '§a✓ Достаточно слитков' : '§c❌ Не хватает слитков!')
                    ]);
                s.setItem(ingotIcon);
                s.leftClicked = () => {};
            });

            // СТРЕЛКА (X=4, Y=3)
            gui.slot(4, 3, s => {
                s.setItem(Item.of('minecraft:chain').withCustomName(Text.of('§8»»» КАТАЛИЗ »»»')));
                s.leftClicked = () => {};
            });

            // СЛОТ 3: КАТАЛИЗАТОР ВОЗВЫШЕНИЯ (X=5, Y=3)
            gui.slot(5, 3, s => {
                let catIcon = Item.of(currentRecipe.cat)
                    .withCustomName(Text.of(`§d${currentRecipe.catName} (Требуется: 1)`))
                    .withLore([
                        Text.of(`§7В наличии в сумке: §f${curCat} шт.`),
                        Text.of(hasEnoughCat ? '§a✓ Катализатор в наличии' : '§c❌ Не хватает Катализатора!')
                    ]);
                s.setItem(catIcon);
                s.leftClicked = () => {};
            });

            // СТРЕЛКА (X=6, Y=3)
            gui.slot(6, 3, s => {
                s.setItem(Item.of('minecraft:chain').withCustomName(Text.of('§8»»» ЭВОЛЮЦИЯ »»»')));
                s.leftClicked = () => {};
            });

            // СЛОТ 4: ГОТОВЫЙ РЕЗУЛЬТАТ (X=7, Y=3)
            gui.slot(7, 3, s => {
                s.setItem(Item.of(currentRecipe.id));
                s.leftClicked = () => {};
            });

        } else {
            // РАСКЛАДКА КОВКИ С НУЛЯ: [Слитки] -> [Материал] -> [Катализатор] -> [Результат]

            // СЛОТ СЛИТКОВ (Slot 1 / X=1, Y=3)
            gui.slot(1, 3, s => {
                let ingotIcon = Item.of(currentRecipe.ingot.startsWith('#') ? 'minecraft:oak_planks' : currentRecipe.ingot)
                    .withCustomName(Text.of(`§6${currentRecipe.ingotName} (Требуется: ${currentRecipe.ingotCount})`))
                    .withLore([
                        Text.of(`§7В наличии в сумке: §f${curIngots} шт.`),
                        Text.of(hasEnoughIngots ? '§a✓ Достаточно слитков' : '§c❌ Не хватает слитков!')
                    ]);
                s.setItem(ingotIcon);
                s.leftClicked = () => {};
            });

            // СТРЕЛКА (X=2, Y=3)
            gui.slot(2, 3, s => {
                s.setItem(Item.of('minecraft:chain').withCustomName(Text.of('§8»»» СПЛАВЛЕНИЕ »»»')));
                s.leftClicked = () => {};
            });

            // СЛОТ ДОП. РЕСУРСА (Slot 3 / X=3, Y=3)
            gui.slot(3, 3, s => {
                if (currentRecipe.extraCount > 0 && currentRecipe.extra) {
                    let extraIcon = Item.of(currentRecipe.extra.startsWith('#') ? 'minecraft:oak_planks' : currentRecipe.extra)
                        .withCustomName(Text.of(`§b${currentRecipe.extraName} (Требуется: ${currentRecipe.extraCount})`))
                        .withLore([
                            Text.of(`§7В наличии в сумке: §f${curExtra} шт.`),
                            Text.of(hasEnoughExtra ? '§a✓ Достаточно материала' : '§c❌ Не хватает материала!')
                        ]);
                    s.setItem(extraIcon);
                } else {
                    s.setItem(Item.of('minecraft:iron_bars').withCustomName(Text.of('§8[Доп. ресурс не требуется]')));
                }
                s.leftClicked = () => {};
            });

            // СТРЕЛКА (X=4, Y=3)
            gui.slot(4, 3, s => {
                s.setItem(Item.of('minecraft:chain').withCustomName(Text.of('§8»»» ИНФУЗИЯ »»»')));
                s.leftClicked = () => {};
            });

            // СЛОТ КАТАЛИЗАТОРА (Slot 5 / X=5, Y=3)
            gui.slot(5, 3, s => {
                if (currentRecipe.catCount > 0 && currentRecipe.cat) {
                    let catIcon = Item.of(currentRecipe.cat)
                        .withCustomName(Text.of(`§d${currentRecipe.catName} (Требуется: ${currentRecipe.catCount})`))
                        .withLore([
                            Text.of(`§7В наличии в сумке: §f${curCat} шт.`),
                            Text.of(hasEnoughCat ? '§a✓ Достаточно катализаторов' : '§c❌ Не хватает катализаторов!')
                        ]);
                    s.setItem(catIcon);
                } else {
                    s.setItem(Item.of('minecraft:iron_bars').withCustomName(Text.of('§8[Катализатор не требуется в Т0]')));
                }
                s.leftClicked = () => {};
            });

            // СТРЕЛКА (X=6, Y=3)
            gui.slot(6, 3, s => {
                s.setItem(Item.of('minecraft:chain').withCustomName(Text.of('§8»»» КОВКА »»»')));
                s.leftClicked = () => {};
            });

            // РЕЗУЛЬТИРУЮЩИЙ ПРЕДМЕТ (Slot 7 / X=7, Y=3)
            let craftResultItem = Item.of(currentRecipe.id);
            if (session.tab === 5 && ElyriumForgeAPI && typeof ElyriumForgeAPI.setClassAspect === 'function') {
                ElyriumForgeAPI.setClassAspect(craftResultItem, session.bossAspect);
            }

            gui.slot(7, 3, s => {
                s.setItem(craftResultItem);
                s.leftClicked = () => {};
            });
        }

        // ======================================================================
        // ROW 4: КНОПКА КОВКИ И ВОЗВЫШЕНИЯ
        // ======================================================================
        for (let x = 0; x < 9; x++) {
            if (x === 4) continue;
            gui.slot(x, 4, s => { s.setItem(ironPlate); s.leftClicked = () => {}; });
        }

        // КНОПКА КОВКИ / ВОЗВЫШЕНИЯ (Slot 31 / X=4, Y=4)
        gui.slot(4, 4, s => {
            if (isAsc) {
                // КНОПКА ВОЗВЫШЕНИЯ
                if (canCraft) {
                    s.setItem(Item.of('minecraft:netherite_upgrade_smithing_template')
                        .withCustomName(Text.of('§6§l[ 🌋 СОВЕРШИТЬ ВОЗВЫШЕНИЕ ]'))
                        .withLore([
                            Text.of(`§eЭволюция: §f${currentRecipe.baseGearName} §6➔ §a${currentRecipe.name}`),
                            Text.of('§8────────────────────────────────'),
                            Text.of('§a✓ Все необходимые материалы в наличии!'),
                            Text.of('§a✓ Уровень заточки (+N) будет сохранен на новом предмете!'),
                            Text.of('§6▶ Нажмите для проведения ритуала Возвышения!')
                        ]));

                    s.leftClicked = () => {
                        let baseStack = findPlayerItem(player, currentRecipe.baseGear);
                        if (!baseStack) {
                            player.tell(Text.of('§c[Возвышение] Базовый предмет не найден в инвентаре!'));
                            return;
                        }

                        let okIngot = deductPlayerItems(player, currentRecipe.ingot, currentRecipe.ingotCount);
                        let okCat = deductPlayerItems(player, currentRecipe.cat, currentRecipe.catCount);

                        if (okIngot && okCat) {
                            let finalItem = Item.of(currentRecipe.id);

                            // Перенос заточки и атрибутов со старой вещи
                            if (ElyriumForgeAPI && typeof ElyriumForgeAPI.transferGearAttributes === 'function') {
                                ElyriumForgeAPI.transferGearAttributes(baseStack, finalItem);
                            }

                            // Списание старой вещи
                            baseStack.shrink(1);

                            player.give(finalItem);

                            let u = player.username;
                            player.server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete player ${u} ~ ~ ~ 1.0 1.2`);
                            player.server.runCommandSilent(`particle minecraft:totem_of_undying ${player.x} ${player.y + 1} ${player.z} 0.5 0.5 0.5 0.2 60`);
                            player.server.runCommandSilent(`particle minecraft:flame ${player.x} ${player.y + 1} ${player.z} 0.5 0.5 0.5 0.1 30`);

                            player.tell(Text.of(`§6[Возвышение] §fЭкипировка успешно возвышена до: ${finalItem.hoverName.getString()}! Заточка сохранена.`));
                            openForgeWorkshopGUI(player, session.hasAnvil, session.benchPos);
                        } else {
                            player.tell(Text.of('§c[Возвышение] Ошибка: недостаточно слитков или катализаторов!'));
                        }
                    };
                } else {
                    s.setItem(Item.of('minecraft:barrier')
                        .withCustomName(Text.of('§c§l[ ❌ НЕ ХВАТАЕТ КОМПОНЕНТОВ ДЛЯ ВОЗВЫШЕНИЯ ]'))
                        .withLore([
                            Text.of(`§7Цель: §f${currentRecipe.name}`),
                            Text.of('§8────────────────────────────────'),
                            Text.of(`§e• Базовая вещь: §f${curBaseGear}/1`),
                            Text.of(`§6• Слитки: §f${curIngots}/${currentRecipe.ingotCount}`),
                            Text.of(`§d• Катализатор: §f${curCat}/1`),
                            Text.of('§cСоберите все компоненты в инвентаре!')
                        ]));
                    s.leftClicked = () => {
                        player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                    };
                }
            } else {
                // КНОПКА СТАНДАРТНОЙ КОВКИ
                if (canCraft) {
                    s.setItem(Item.of('minecraft:anvil')
                        .withCustomName(Text.of('§a§l[ 🔨 ВЫКОВАТЬ ЭКИПИРОВКУ ]'))
                        .withLore([
                            Text.of(`§eПредмет: §f${currentRecipe.name}`),
                            Text.of('§8────────────────────────────────'),
                            Text.of('§a✓ Все необходимые материалы в наличии!'),
                            Text.of('§6▶ Нажмите для запуска ковки!')
                        ]));

                    s.leftClicked = () => {
                        let ok1 = deductPlayerItems(player, currentRecipe.ingot, currentRecipe.ingotCount);
                        let ok2 = currentRecipe.extraCount > 0 ? deductPlayerItems(player, currentRecipe.extra, currentRecipe.extraCount) : true;
                        let ok3 = currentRecipe.catCount > 0 ? deductPlayerItems(player, currentRecipe.cat, currentRecipe.catCount) : true;

                        if (ok1 && ok2 && ok3) {
                            let finalItem = Item.of(currentRecipe.id);
                            if (session.tab === 5 && ElyriumForgeAPI && typeof ElyriumForgeAPI.setClassAspect === 'function') {
                                ElyriumForgeAPI.setClassAspect(finalItem, session.bossAspect);
                            }

                            player.give(finalItem);

                            let u = player.username;
                            player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${u} ~ ~ ~ 1.0 1.2`);
                            player.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${u} ~ ~ ~ 0.8 1.4`);
                            player.server.runCommandSilent(`particle minecraft:flame ${player.x} ${player.y + 1} ${player.z} 0.5 0.5 0.5 0.1 20`);
                            player.server.runCommandSilent(`particle minecraft:electric_spark ${player.x} ${player.y + 1} ${player.z} 0.5 0.5 0.5 0.15 25`);

                            player.tell(Text.of(`§a[Кузница] §fВы успешно выковали: ${finalItem.hoverName.getString()}!`));
                            openForgeWorkshopGUI(player, session.hasAnvil, session.benchPos);
                        } else {
                            player.tell(Text.of('§c[Кузница] Ошибка: недостаточно материалов в инвентаре!'));
                        }
                    };
                } else {
                    s.setItem(Item.of('minecraft:barrier')
                        .withCustomName(Text.of('§c§l[ ❌ НЕ ХВАТАЕТ МАТЕРИАЛОВ ]'))
                        .withLore([
                            Text.of(`§7Предмет: §f${currentRecipe.name}`),
                            Text.of('§8────────────────────────────────'),
                            Text.of(`§6• Слитки: §f${curIngots}/${currentRecipe.ingotCount}`),
                            Text.of(currentRecipe.extraCount > 0 ? `§b• Материал: §f${curExtra}/${currentRecipe.extraCount}` : '§7• Материал: не требуется'),
                            Text.of(currentRecipe.catCount > 0 ? `§d• Катализатор/Ядро: §f${curCat}/${currentRecipe.catCount}` : '§7• Катализатор: не требуется'),
                            Text.of('§cСоберите недостающие ресурсы для ковки!')
                        ]));
                    s.leftClicked = () => {
                        player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                    };
                }
            }
        });

        // ======================================================================
        // ROW 5: НИЖНИЙ КАРНИЗ И СЕРВИС
        // ======================================================================
        for (let x = 0; x < 9; x++) {
            if (x === 4) {
                gui.slot(4, 5, s => {
                    s.setItem(Item.of('minecraft:compass').withCustomName(Text.of('§e[ Руководство Кузнеца ]')).withLore([
                        Text.of('§7Вся экипировка Элириума куется по 11 Тирам.'),
                        Text.of('§7Горн плавит металл. Наковальня открывает Заточку и Возвышение!'),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§a✓ 100% сохранение предметов при закрытии.')
                    ]));
                    s.leftClicked = () => {};
                });
            } else {
                gui.slot(x, 5, s => { s.setItem(ironPlate); s.leftClicked = () => {}; });
            }
        }
    });
}

// ------------------------------------------------------------------------------
// MULTIBLOCK ADJACENCY DETECTION & INTERACTION HOOKS
// ------------------------------------------------------------------------------

function checkForgeAdjacency(level, pos, clickedBlockId) {
    let hasHearth = (clickedBlockId === 'kubejs:forge_hearth');
    let hasBench = (clickedBlockId === 'kubejs:smithing_bench');
    let hasAnvil = false;

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dz = -1; dz <= 1; dz++) {
                if (dx === 0 && dy === 0 && dz === 0) continue;
                let checkPos = pos.offset(dx, dy, dz);
                let b = level.getBlock(checkPos);
                if (!b) continue;
                let bId = String(b.id);
                if (bId === 'kubejs:forge_hearth') hasHearth = true;
                if (bId === 'kubejs:smithing_bench') hasBench = true;
                if (bId === 'minecraft:anvil' || bId === 'minecraft:chipped_anvil' || 
                    bId === 'minecraft:damaged_anvil' || bId === 'kubejs:infernal_anvil') {
                    hasAnvil = true;
                }
            }
        }
    }

    return { hasHearth: hasHearth, hasBench: hasBench, hasAnvil: hasAnvil };
}

// 1. Right click on Smithing Bench
BlockEvents.rightClicked('kubejs:smithing_bench', event => {
    let player = event.player;
    if (!player || player.level.isClientSide()) return;

    let handStr = event.hand ? String(event.hand) : 'MAIN_HAND';
    if (!handStr.includes('MAIN')) return;

    let adj = checkForgeAdjacency(event.level, event.block.pos, 'kubejs:smithing_bench');
    if (!adj.hasHearth) {
        event.cancel();
        player.tell(Text.of('§c[Стол Кузнеца] §7Металл холоден! Установите рядом §cКузнечный Горн (Forge Hearth)§7 в пределах 1 блока для разогрева заготовок.'));
        player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
        return;
    }

    event.cancel();
    openForgeWorkshopGUI(player, adj.hasAnvil, event.block.pos);
    player.server.runCommandSilent(`playsound minecraft:block.blastfurnace.fire_crackle player ${player.username} ~ ~ ~ 0.8 1.0`);
});

// 2. Right click on Forge Hearth
BlockEvents.rightClicked('kubejs:forge_hearth', event => {
    let player = event.player;
    if (!player || player.level.isClientSide()) return;

    let handStr = event.hand ? String(event.hand) : 'MAIN_HAND';
    if (!handStr.includes('MAIN')) return;

    let adj = checkForgeAdjacency(event.level, event.block.pos, 'kubejs:forge_hearth');
    if (!adj.hasBench) {
        event.cancel();
        player.tell(Text.of('§c🔥 [Кузнечный Горн] §7Горн жарко пылает. Установите рядом §6Стол Кузнеца (Smithing Bench)§7 для начала ковки!'));
        player.server.runCommandSilent(`playsound minecraft:block.furnace.fire_crackle player ${player.username} ~ ~ ~ 0.8 1.0`);
        return;
    }

    event.cancel();
    openForgeWorkshopGUI(player, adj.hasAnvil, event.block.pos);
    player.server.runCommandSilent(`playsound minecraft:block.blastfurnace.fire_crackle player ${player.username} ~ ~ ~ 0.8 1.0`);
});

// Guaranteed cleanup on disconnect
PlayerEvents.loggedOut(event => {
    let p = event.player;
    if (p) clearWorkshopSession(p);
});

// Dev test command
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;
    event.register(
        Commands.literal('forge_workshop')
            .executes(ctx => {
                let p = ctx.source.player;
                if (p) openForgeWorkshopGUI(p, true, null);
                return 1;
            })
    );
});
