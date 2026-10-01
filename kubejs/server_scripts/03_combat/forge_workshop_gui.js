// ==============================================================================
// 🏛️ ELYRIUM RPG: FORGE WORKSHOP GUI & MULTIBLOCK CRAFTING ENGINE
// Minecraft 1.21.1 NeoForge | KubeJS Server Script (v1.0)
// ==============================================================================
// Modular Workstation Logic:
// 1. Smithing Bench + Forge Hearth within 1 block = Activates Forge Crafting.
// 2. Smithing Bench + Anvil within 1 block = Unlocks Reinforcement & Ascension.
// 3. 6-Row Unified ChestMenu GUI:
//    - Tabs: [🔮 Мантии], [🏹 Легкая], [⚔️ Средняя ДД], [🛡️ Тяжелая], [🗡️ Оружие и Щиты], [👑 Босс-Сеты]
//    - Ingot Matrix: Helm 5, Chest 8, Legs 7, Boots 4, 1H 4, 2H/Bow/Staff 6, Shield 5.
//    - Boss Set: 4 Craftable Class Aspects ('mage', 'scout', 'medium', 'tank').
//    - 100% item safety: zero loss on close/disconnect.
// ==============================================================================

// Session tracking
let activeWorkshopSessions = new Map();

function getOrCreateWorkshopSession(player) {
    let uuid = player.uuid.toString();
    if (!activeWorkshopSessions.has(uuid)) {
        activeWorkshopSessions.set(uuid, {
            tab: 0,              // 0: Mage, 1: Light, 2: Medium, 3: Heavy, 4: Weapons, 5: Boss
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
// CRAFTING CATALOG & INGREDIENT DEFINITIONS
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
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:cinder_pyro_robe_chestplate',
            name: '§cПепельная Мантия Пироманта',
            tier: 'Tier 1 (Незер)',
            role: 'Инфернальная Мантия: +30% Огненный Урон, +35 Маны',
            ingot: 'minecraft:quartz', ingotName: 'Кварц Незера', ingotCount: 8,
            extra: 'minecraft:blaze_powder', extraName: 'Огненная Пыль', extraCount: 2,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:cinder_pyro_robe_leggings',
            name: '§cПепельные Штаны Пироманта',
            tier: 'Tier 1 (Незер)',
            role: 'Инфернальные Штаны: +20% Огненный Урон, +20 Маны',
            ingot: 'minecraft:quartz', ingotName: 'Кварц Незера', ingotCount: 7,
            extra: 'minecraft:blaze_powder', extraName: 'Огненная Пыль', extraCount: 2,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:cinder_pyro_robe_boots',
            name: '§cПепельные Сапоги Пироманта',
            tier: 'Tier 1 (Незер)',
            role: 'Инфернальные Сапоги: +15% Огненный Урон, Иммунитет к Лаве 15%',
            ingot: 'minecraft:quartz', ingotName: 'Кварц Незера', ingotCount: 4,
            extra: 'minecraft:blaze_powder', extraName: 'Огненная Пыль', extraCount: 1,
            cat: null, catName: null, catCount: 0
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
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:bastion_hunter_chestplate',
            name: '§6Доспех Охотника Бастионов',
            tier: 'Tier 1 (Незер)',
            role: 'Следопыт Незера: +15% Скорость бега, +20% Крит',
            ingot: 'minecraft:gold_ingot', ingotName: 'Золотой Слиток', ingotCount: 8,
            extra: 'minecraft:leather', extraName: 'Кожа Хоглина', extraCount: 2,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:bastion_hunter_leggings',
            name: '§6Штаны Охотника Бастионов',
            tier: 'Tier 1 (Незер)',
            role: 'Следопыт Незера: +10% Скорость, +40% Урон со спины',
            ingot: 'minecraft:gold_ingot', ingotName: 'Золотой Слиток', ingotCount: 7,
            extra: 'minecraft:leather', extraName: 'Кожа Хоглина', extraCount: 2,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:bastion_hunter_boots',
            name: '§6Сапоги Охотника Бастионов',
            tier: 'Tier 1 (Незер)',
            role: 'Следопыт Незера: Fast Roll, Сопротивление Лаве 20%',
            ingot: 'minecraft:gold_ingot', ingotName: 'Золотой Слиток', ingotCount: 4,
            extra: 'minecraft:leather', extraName: 'Кожа Хоглина', extraCount: 1,
            cat: null, catName: null, catCount: 0
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
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:cinder_brigandine_chestplate',
            name: '§cПепельная Бригантина ДД',
            tier: 'Tier 1 (Незер)',
            role: 'Брузер ДД: +20% Физ. Урон, -25% Расход стамины, Жажда Битвы',
            ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 8,
            extra: 'minecraft:blaze_powder', extraName: 'Огненная Эссенция', extraCount: 2,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:cinder_brigandine_leggings',
            name: '§cПепельные Поножи ДД',
            tier: 'Tier 1 (Незер)',
            role: 'Брузер ДД: Пробой брони 25%, Скорость комбо +15%',
            ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 7,
            extra: 'minecraft:blaze_powder', extraName: 'Огненная Эссенция', extraCount: 2,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:cinder_brigandine_boots',
            name: '§cПепельные Сапоги ДД',
            tier: 'Tier 1 (Незер)',
            role: 'Брузер ДД: Medium Roll, Сопротивление лаве 25%',
            ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 4,
            extra: 'minecraft:blaze_powder', extraName: 'Огненная Эссенция', extraCount: 1,
            cat: null, catName: null, catCount: 0
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
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:infernal_plate_chestplate',
            name: '§4Инфернальные Латы Танка',
            tier: 'Tier 1 (Незер)',
            role: 'Незеритовый Танк: Броня 12, Твердость 4, Стойка Щита +100, 100% Огнеупорность',
            ingot: 'minecraft:netherite_ingot', ingotName: 'Незеритовый Слиток', ingotCount: 8,
            extra: 'minecraft:crying_obsidian', extraName: 'Плачущий Обсидиан', extraCount: 2,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:infernal_plate_leggings',
            name: '§4Инфернальные Поножи Танка',
            tier: 'Tier 1 (Незер)',
            role: 'Незеритовый Танк: Броня 8, Твердость 3, Стойка Щита +50',
            ingot: 'minecraft:netherite_ingot', ingotName: 'Незеритовый Слиток', ingotCount: 7,
            extra: 'minecraft:crying_obsidian', extraName: 'Плачущий Обсидиан', extraCount: 2,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:infernal_plate_boots',
            name: '§4Инфернальные Сапоги Танка',
            tier: 'Tier 1 (Незер)',
            role: 'Незеритовый Танк: 100% Иммунитет к Отбрасыванию, Хождение по Лаве',
            ingot: 'minecraft:netherite_ingot', ingotName: 'Незеритовый Слиток', ingotCount: 4,
            extra: 'minecraft:crying_obsidian', extraName: 'Плачущий Обсидиан', extraCount: 1,
            cat: null, catName: null, catCount: 0
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
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'skd:cinder_katana',
            name: '§cПепельная Катана',
            tier: 'Tier 1 (Незер)',
            role: 'Быстрый Клинок: Урон 8.0, Скорость 1.6, Фантомный Выпад (Иай)',
            ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 4,
            extra: 'minecraft:blaze_rod', extraName: 'Огненный Стержень', extraCount: 1,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'skd:cinder_claymore',
            name: '§cПепельный Клеймор',
            tier: 'Tier 1 (Незер)',
            role: 'Двуручный Меч: Урон 11.0, Скорость 1.0, Вихревой Размах на 360°',
            ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 6,
            extra: 'minecraft:blaze_rod', extraName: 'Огненный Стержень', extraCount: 2,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'skd:cinder_scythe',
            name: '§cПепельная Коса',
            tier: 'Tier 1 (Незер)',
            role: 'Боевая Коса: Урон 10.0, Скорость 1.1, Кровавая Жатва с вампиризмом',
            ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 6,
            extra: 'minecraft:blaze_rod', extraName: 'Огненный Стержень', extraCount: 2,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'skd:cinder_bow',
            name: '§cПепельный Составной Лук',
            tier: 'Tier 1 (Незер)',
            role: 'Составной Лук: Пробитие 25% брони, поджог стрел',
            ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 6,
            extra: 'minecraft:blaze_rod', extraName: 'Огненный Стержень', extraCount: 2,
            cat: null, catName: null, catCount: 0
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
            extra: 'cataclysm:burning_ashes', extraName: 'Пепел Игниса / Ядро Босса', extraCount: 1,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:ignis_core_chestplate',
            name: '§4👑 Доспех Испепелителя (Ядро Игниса)',
            tier: 'Boss Set (Кульминация Незера)',
            role: 'Эпохальный Доспех Босса: Адаптируется под выбранный Классовый Аспект!',
            ingot: 'minecraft:netherite_ingot', ingotName: 'Незеритовый Слиток', ingotCount: 8,
            extra: 'cataclysm:burning_ashes', extraName: 'Пепел Игниса / Ядро Босса', extraCount: 1,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:ignis_core_leggings',
            name: '§4👑 Поножи Испепелителя (Ядро Игниса)',
            tier: 'Boss Set (Кульминация Незера)',
            role: 'Эпохальный Доспех Босса: Адаптируется под выбранный Классовый Аспект!',
            ingot: 'minecraft:netherite_ingot', ingotName: 'Незеритовый Слиток', ingotCount: 7,
            extra: 'cataclysm:burning_ashes', extraName: 'Пепел Игниса / Ядро Босса', extraCount: 1,
            cat: null, catName: null, catCount: 0
        },
        {
            id: 'kubejs:ignis_core_boots',
            name: '§4👑 Сапоги Испепелителя (Ядро Игниса)',
            tier: 'Boss Set (Кульминация Незера)',
            role: 'Эпохальный Доспех Босса: Адаптируется под выбранный Классовый Аспект!',
            ingot: 'minecraft:netherite_ingot', ingotName: 'Незеритовый Слиток', ingotCount: 4,
            extra: 'cataclysm:burning_ashes', extraName: 'Пепел Игниса / Ядро Босса', extraCount: 1,
            cat: null, catName: null, catCount: 0
        }
    ]
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
        '§4👑 [Босс-Сет]'
    ];

    let currentCatalog = FORGE_CATALOG[session.tab] || FORGE_CATALOG[0];
    if (session.selectedIdx >= currentCatalog.length) session.selectedIdx = 0;
    let currentRecipe = currentCatalog[session.selectedIdx];

    player.openChestGUI(Text.of('⚒ §8§lКУЗНЕЧНЫЙ КОМПЛЕКС §c✦ §6ЭЛИРИУМ'), 6, gui => {
        gui.playerSlots = true;
        gui.closed = () => {
            clearWorkshopSession(player);
        };

        // ======================================================================
        // ROW 0: ВЕРХНИЙ КАРНИЗ И ВКЛАДКИ
        // ======================================================================

        // 1. Статус Горна (Slot 0)
        gui.slot(0, 0, s => {
            s.setItem(Item.of('minecraft:campfire').withCustomName(Text.of('§c🔥 [Горн: Активен]')).withLore([
                Text.of('§7Жар кузнечного горна поддерживает температуру плавления.'),
                Text.of('§a✓ Металлургическая ковка доступна!')
            ]));
            s.leftClicked = () => {};
        });

        // 2. Статус Наковальни (Slot 1)
        gui.slot(1, 0, s => {
            if (session.hasAnvil) {
                s.setItem(Item.of('minecraft:anvil').withCustomName(Text.of('§a🔨 [Наковальня: Подключена]')).withLore([
                    Text.of('§7Наковальня обнаружена рядом со столом кузнеца.'),
                    Text.of('§a✓ Разблокированы Заточка (+1..+10) и Возвышение!')
                ]));
            } else {
                s.setItem(Item.of('minecraft:barrier').withCustomName(Text.of('§7🔒 [Наковальня: Не найдена]')).withLore([
                    Text.of('§cДля заточки и возвышения установите Наковальню'),
                    Text.of('§cвплотную к Столу Кузнеца!')
                ]));
            }
            s.leftClicked = () => {};
        });

        // 3. Вкладки (Slots 2..7)
        for (let t = 0; t < 6; t++) {
            let tabIdx = t;
            let isSelected = (session.tab === tabIdx);
            let tabItem = Item.of(isSelected ? 'minecraft:nether_star' : 'minecraft:iron_nugget')
                .withCustomName(Text.of(isSelected ? `§6▶ ${tabNames[tabIdx]} ◀` : tabNames[tabIdx]))
                .withLore([
                    Text.of(isSelected ? '§a[Выбранная вкладка]' : '§e▶ Нажмите для переключения раздела')
                ]);

            gui.slot(2 + t, 0, s => {
                s.setItem(tabItem);
                s.leftClicked = () => {
                    session.tab = tabIdx;
                    session.selectedIdx = 0;
                    player.server.runCommandSilent(`playsound minecraft:ui.button.click player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openForgeWorkshopGUI(player, session.hasAnvil, session.benchPos);
                };
            });
        }

        // 4. Слот 8: Переход в Наковальню (Заточка/Возвышение)
        gui.slot(8, 0, s => {
            if (session.hasAnvil) {
                s.setItem(Item.of('minecraft:netherite_upgrade_smithing_template')
                    .withCustomName(Text.of('§6🌋 [Алтарь Заточки и Возвышения]'))
                    .withLore([
                        Text.of('§7Перейти к глубокой закалке (+1..+10)'),
                        Text.of('§7и переносу тиров через Наследие.'),
                        Text.of('§a▶ Нажмите для открытия интерфейса наковальни!')
                    ]));
                s.leftClicked = () => {
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.8 1.0`);
                    let AnvilGui = Java.loadClass('net.minecraft.world.inventory.AnvilMenu'); // fallback
                    player.server.runCommandSilent(`infernal_anvil`);
                };
            } else {
                s.setItem(Item.of('minecraft:structure_void')
                    .withCustomName(Text.of('§8🔒 [Заточка и Возвышение]'))
                    .withLore([
                        Text.of('§cТребуется подключить Наковальню!'),
                        Text.of('§7Поставьте Наковальню рядом со Столом.')
                    ]));
                s.leftClicked = () => {};
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
                    .withCustomName(Text.of(isSel ? `§a★ ${rec.name} ★` : rec.name))
                    .withLore([
                        Text.of(`§7Эпоха: §f${rec.tier}`),
                        Text.of(`§eРоль: §7${rec.role}`),
                        Text.of('§8────────────────────────────────'),
                        Text.of(`§6• Слитки: §f${rec.ingotName} x${rec.ingotCount}`),
                        Text.of(`§b• Материал: §f${rec.extraName} x${rec.extraCount}`),
                        Text.of(isSel ? '§a✓ Сейчас выбран для ковки' : '§e▶ Кликните для выбора')
                    ]);

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
        // Декоративные панели по краям
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
        } else {
            // Для обычных сетов: информационный баннер
            gui.slot(4, 2, s => {
                s.setItem(Item.of('minecraft:iron_bars').withCustomName(Text.of('§6✦ [ ТИГЕЛЬ ВЫСОКОТЕМПЕРАТУРНОЙ КОВКИ ] ✦')).withLore([
                    Text.of('§7Кузнечный комплекс расплавляет руды и минералы.'),
                    Text.of('§8Проверьте наличие слитков в сумке ниже!')
                ]));
                s.leftClicked = () => {};
            });
        }

        // ======================================================================
        // ROW 3: СЛОТЫ ТРЕБУЕМЫХ МАТЕРИАЛОВ И ГОТОВОГО РЕЗУЛЬТАТА
        // ======================================================================
        let curIngots = countPlayerItems(player, currentRecipe.ingot);
        let hasEnoughIngots = (curIngots >= currentRecipe.ingotCount);

        let curExtra = countPlayerItems(player, currentRecipe.extra);
        let hasEnoughExtra = (curExtra >= currentRecipe.extraCount);

        let canCraft = hasEnoughIngots && hasEnoughExtra;

        // СЛОТ СЛИТКОВ (Slot 20 / X=2, Y=3)
        gui.slot(2, 3, s => {
            let ingotIcon = Item.of(currentRecipe.ingot.startsWith('#') ? 'minecraft:oak_planks' : currentRecipe.ingot)
                .withCustomName(Text.of(`§6${currentRecipe.ingotName} (Требуется: ${currentRecipe.ingotCount})`))
                .withLore([
                    Text.of(`§7В наличии в сумке: §f${curIngots} шт.`),
                    Text.of(hasEnoughIngots ? '§a✓ Достаточно слитков' : '§c❌ Не хватает слитков!')
                ]);
            s.setItem(ingotIcon);
            s.leftClicked = () => {};
        });

        // СТРЕЛКА СИНТЕЗА (Slot 21 / X=3, Y=3)
        gui.slot(3, 3, s => {
            s.setItem(Item.of('minecraft:chain').withCustomName(Text.of('§8»»» СПЛАВЛЕНИЕ »»»')));
            s.leftClicked = () => {};
        });

        // СЛОТ ДОП. РЕСУРСА (Slot 22 / X=4, Y=3)
        gui.slot(4, 3, s => {
            let extraIcon = Item.of(currentRecipe.extra.startsWith('#') ? 'minecraft:oak_planks' : currentRecipe.extra)
                .withCustomName(Text.of(`§b${currentRecipe.extraName} (Требуется: ${currentRecipe.extraCount})`))
                .withLore([
                    Text.of(`§7В наличии в сумке: §f${curExtra} шт.`),
                    Text.of(hasEnoughExtra ? '§a✓ Достаточно материала' : '§c❌ Не хватает материала!')
                ]);
            s.setItem(extraIcon);
            s.leftClicked = () => {};
        });

        // СТРЕЛКА ВЫХОДА (Slot 23 / X=5, Y=3)
        gui.slot(5, 3, s => {
            s.setItem(Item.of('minecraft:chain').withCustomName(Text.of('§8»»» КОВКА »»»')));
            s.leftClicked = () => {};
        });

        // РЕЗУЛЬТИРУЮЩИЙ ПРЕДМЕТ (Slot 24 / X=6, Y=3)
        let craftResultItem = Item.of(currentRecipe.id);
        if (session.tab === 5) {
            ElyriumForgeAPI.setClassAspect(craftResultItem, session.bossAspect);
        }

        gui.slot(6, 3, s => {
            s.setItem(craftResultItem);
            s.leftClicked = () => {};
        });

        // ======================================================================
        // ROW 4: КНОПКА КОВКИ И ОЧИСТКИ
        // ======================================================================
        for (let x = 0; x < 9; x++) {
            if (x === 4) continue;
            gui.slot(x, 4, s => { s.setItem(ironPlate); s.leftClicked = () => {}; });
        }

        // КНОПКА [🔨 ВЫКОВАТЬ] (Slot 31 / X=4, Y=4)
        gui.slot(4, 4, s => {
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
                    // Deduct ingredients
                    let ok1 = deductPlayerItems(player, currentRecipe.ingot, currentRecipe.ingotCount);
                    let ok2 = deductPlayerItems(player, currentRecipe.extra, currentRecipe.extraCount);

                    if (ok1 && ok2) {
                        let finalItem = Item.of(currentRecipe.id);
                        if (session.tab === 5) {
                            ElyriumForgeAPI.setClassAspect(finalItem, session.bossAspect);
                        }

                        player.give(finalItem);

                        // Sound & particle celebration
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
                        Text.of(`§b• Материал: §f${curExtra}/${currentRecipe.extraCount}`),
                        Text.of('§cСоберите недостающие ресурсы для ковки!')
                    ]));
                s.leftClicked = () => {
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                };
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
                        Text.of('§7Используйте Наковальню для заточки и возвышения!'),
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
