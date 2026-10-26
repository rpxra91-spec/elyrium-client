// ==============================================================================
// ⚒️ ELYRIUM RPG: UNIFIED MASTER WORKSHOP GUI & 6-TAB SMITHING ENGINE (v2.2)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// Единый Графический Интерфейс (Unified GUI) для всех 5 кузнечных станций Элириума:
// 1. `kubejs:blacksmith_workbench` -> Таб 0: ⚒ [ Ковка ] (Сырье 6 слотов, каталог, ghost-индикаторы)
// 2. Ремонт снаряжения            -> Таб 1: 🔧 [ Ремонт ] (1 слиток = 1/3 прочности, 1..3 слитка)
// 3. `kubejs:blacksmith_hearth`    -> Таб 2: 🔥 [ Очаг ] (Ванильная плавка на угле, буфер, порог Горна)
// 4. `kubejs:infernal_crucible`    -> Таб 3: 🌋 [ Горн ] (Возвышение Тиров Экипировки со 100% сохранением)
// 5. `kubejs:void_anvil`           -> Таб 4: 🌌 [ Наковальня ] (Заточка +1..+15, Оселки, Эгида, Молот)
// 6. `kubejs:weapon_bench`         -> Таб 5: 🛠 [ Оружейный Стол ] (Боевые искусства [Z]/[X], резцы, сокеты)
//
// Любой из 5 блоков при клике ПКМ открывает Unified GUI на своей дефолтной вкладке.
// Игрок может свободно переключаться между вкладками прямо из окна интерфейса!
// 100% безопасность: возврат всех предметов из рабочих слотов при закрытии/переключении.
// ==============================================================================

// Session tracking: сохраняет активные предметы для каждого игрока
let activeBlacksmithSessions = new Map();

function getOrCreateBlacksmithSession(player) {
    let uuid = player.uuid.toString();
    if (!activeBlacksmithSessions.has(uuid)) {
        activeBlacksmithSessions.set(uuid, {
            tab: 0,
            stationPos: null,
            // Tab 0 (Ковка на Верстаке): 6 слотов сырья
            forgeIngredients: [null, null, null, null, null, null],
            selectedRecipeIdx: 0,
            // Tab 1 (Ремонт): экипировка, слитки, результат
            repairGear: null,
            repairIngots: null,
            repairResult: null,
            // Tab 2 (Очаг)
            hearthSmeltInput: null,
            hearthFuelInput: null,
            hearthOutput: null,
            // Tab 3 (Горн - Возвышение)
            ascendGear: null,
            ascendCatalyst: null,
            ascendResult: null,
            // Tab 4 (Наковальня - Заточка)
            anvilGear: null,
            anvilReagent: null,
            anvilAegis: null,
            anvilResult: null,
            // Tab 5 (Оружейный Стол)
            benchWeapon: null,
            benchChisel: null,
            benchMaterial: null,
            benchPos: null,
            refreshingTime: 0
        });
    }
    return activeBlacksmithSessions.get(uuid);
}

// Гарантированный возврат ВСЕХ предметов игроку при закрытии GUI
function clearAndRefundBlacksmithSession(player, force) {
    let uuid = player.uuid.toString();
    let sess = activeBlacksmithSessions.get(uuid);
    if (!sess) return;

    if (!force && sess.refreshingTime && (Date.now() - sess.refreshingTime < 450)) {
        return;
    }

    // Tab 0
    if (sess.forgeIngredients) {
        for (let i = 0; i < sess.forgeIngredients.length; i++) {
            let st = sess.forgeIngredients[i];
            if (st && !st.isEmpty()) player.give(st);
            sess.forgeIngredients[i] = null;
        }
    }
    // Tab 1
    if (sess.repairGear && !sess.repairGear.isEmpty()) player.give(sess.repairGear);
    if (sess.repairIngots && !sess.repairIngots.isEmpty()) player.give(sess.repairIngots);
    if (sess.repairResult && !sess.repairResult.isEmpty()) player.give(sess.repairResult);
    sess.repairGear = null;
    sess.repairIngots = null;
    sess.repairResult = null;

    // Tab 2 (Очаг возвращает загруженное сырье/топливо/выход)
    if (sess.hearthSmeltInput && !sess.hearthSmeltInput.isEmpty()) player.give(sess.hearthSmeltInput);
    if (sess.hearthFuelInput && !sess.hearthFuelInput.isEmpty()) player.give(sess.hearthFuelInput);
    if (sess.hearthOutput && !sess.hearthOutput.isEmpty()) player.give(sess.hearthOutput);
    sess.hearthSmeltInput = null;
    sess.hearthFuelInput = null;
    sess.hearthOutput = null;

    // Tab 3 (Горн)
    if (sess.ascendGear && !sess.ascendGear.isEmpty()) player.give(sess.ascendGear);
    if (sess.ascendCatalyst && !sess.ascendCatalyst.isEmpty()) player.give(sess.ascendCatalyst);
    if (sess.ascendResult && !sess.ascendResult.isEmpty()) player.give(sess.ascendResult);
    sess.ascendGear = null;
    sess.ascendCatalyst = null;
    sess.ascendResult = null;

    // Tab 4 (Наковальня)
    if (sess.anvilGear && !sess.anvilGear.isEmpty()) player.give(sess.anvilGear);
    if (sess.anvilReagent && !sess.anvilReagent.isEmpty()) player.give(sess.anvilReagent);
    if (sess.anvilAegis && !sess.anvilAegis.isEmpty()) player.give(sess.anvilAegis);
    if (sess.anvilResult && !sess.anvilResult.isEmpty()) player.give(sess.anvilResult);
    sess.anvilGear = null;
    sess.anvilReagent = null;
    sess.anvilAegis = null;
    sess.anvilResult = null;

    // Tab 5 (Оружейный Стол)
    if (sess.benchWeapon && !sess.benchWeapon.isEmpty()) player.give(sess.benchWeapon);
    if (sess.benchChisel && !sess.benchChisel.isEmpty()) player.give(sess.benchChisel);
    if (sess.benchMaterial && !sess.benchMaterial.isEmpty()) player.give(sess.benchMaterial);
    sess.benchWeapon = null;
    sess.benchChisel = null;
    sess.benchMaterial = null;

    activeBlacksmithSessions.delete(uuid);
}

// ------------------------------------------------------------------------------
// WORKSHOP METAL STORAGE BUFFER SYSTEM (level.persistentData)
// ------------------------------------------------------------------------------
function getWorkshopBuffer(level, stationPos) {
    if (!level || !stationPos) return { steel: 0, iron: 0, copper: 0, cinder: 0, netherite: 0 };
    let anchor = stationPos.x + '_' + stationPos.y + '_' + stationPos.z;

    if (!level.persistentData.blacksmithBuffers) {
        level.persistentData.blacksmithBuffers = {};
    }
    if (!level.persistentData.blacksmithBuffers[anchor]) {
        level.persistentData.blacksmithBuffers[anchor] = { steel: 0, iron: 0, copper: 0, cinder: 0, netherite: 0 };
    }
    let b = level.persistentData.blacksmithBuffers[anchor];
    if (typeof b.steel !== 'number') b.steel = 0;
    if (typeof b.iron !== 'number') b.iron = 0;
    if (typeof b.copper !== 'number') b.copper = 0;
    if (typeof b.cinder !== 'number') b.cinder = 0;
    if (typeof b.netherite !== 'number') b.netherite = 0;
    return b;
}

function countBufferIngots(level, stationPos, ingotId) {
    if (!level || !stationPos) return 0;
    let buf = getWorkshopBuffer(level, stationPos);
    let id = String(ingotId).toLowerCase();
    if (id.includes('cinder')) return buf.cinder || 0;
    if (id.includes('netherite')) return buf.netherite || 0;
    if (id.includes('steel')) return buf.steel || 0;
    if (id.includes('copper')) return buf.copper || 0;
    if (id.includes('iron')) return buf.iron || 0;
    return 0;
}

function addBufferIngots(level, stationPos, metalType, count) {
    if (!level || !stationPos || count <= 0) return;
    let buf = getWorkshopBuffer(level, stationPos);
    if (buf[metalType] !== undefined) {
        buf[metalType] += count;
    }
}

// Проверка наличия Адского Горна поблизости (в радиусе 4 блоков)
function hasCrucibleNear(level, pos) {
    if (!level || !pos) return false;
    let r = 4;
    for (let x = -r; x <= r; x++) {
        for (let y = -r; y <= r; y++) {
            for (let z = -r; z <= r; z++) {
                let b = level.getBlock(pos.x + x, pos.y + y, pos.z + z);
                if (b && (b.id === 'kubejs:infernal_crucible' || b.id === 'kubejs:crucible')) return true;
            }
        }
    }
    return false;
}

// ------------------------------------------------------------------------------
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ИНВЕНТАРЯ И ПРЕДМЕТОВ
// ------------------------------------------------------------------------------
// Note: matchesItemOrTag, countPlayerItems, and deductPlayerItems are canonically provided by 00_core/elyrium_core_lib.js

// Расчет материала ремонта: 1 слиток = 1/3 прочности (1..3 слитка)
function getRepairMaterial(item) {
    if (!item || item.isEmpty()) return { id: 'minecraft:iron_ingot', name: 'Железный Слиток' };
    let id = String(item.id).toLowerCase();
    if (id.includes('steel') || id.includes('knight')) return { id: 'kubejs:steel_ingot', name: 'Стальной Слиток' };
    if (id.includes('copper') || id.includes('scout')) return { id: 'minecraft:copper_ingot', name: 'Медный Слиток' };
    if (id.includes('diamond')) return { id: 'minecraft:diamond', name: 'Алмаз' };
    if (id.includes('netherite')) return { id: 'minecraft:netherite_ingot', name: 'Незеритовый Слиток' };
    if (id.includes('gold') || id.includes('golden')) return { id: 'minecraft:gold_ingot', name: 'Золотой Слиток' };
    if (id.includes('cinder')) return { id: 'skd:cinder_alloy_ingot', name: 'Пепельный Сплав' };
    if (id.includes('leather')) return { id: 'minecraft:leather', name: 'Кожа' };
    return { id: 'minecraft:iron_ingot', name: 'Железный Слиток' };
}

function calculateRepairCost(item) {
    if (!item || item.isEmpty() || !item.isDamageableItem()) return 0;
    let dmg = item.damageValue;
    let max = item.maxDamage;
    if (dmg <= 0 || max <= 0) return 0;
    let ratio = dmg / max;
    if (ratio <= 0.334) return 1;
    if (ratio <= 0.667) return 2;
    return 3;
}

// Определение топлива
function isFuelItem(item) {
    if (!item || item.isEmpty()) return false;
    let id = String(item.id);
    return id === 'minecraft:coal' || id === 'minecraft:charcoal' || id === 'minecraft:coal_block' || id === 'minecraft:blaze_rod';
}

function getFuelValue(item) {
    if (!item || item.isEmpty()) return 0;
    let id = String(item.id);
    if (id === 'minecraft:coal_block') return 9;
    if (id === 'minecraft:blaze_rod') return 3;
    if (id === 'minecraft:coal' || id === 'minecraft:charcoal') return 1;
    return 0;
}

// Проверка возможности плавки в Очаге
function getHearthSmeltRecipe(item) {
    if (!item || item.isEmpty()) return null;
    let id = String(item.id);
    if (id === 'kubejs:steel_charge') return { result: 'kubejs:steel_ingot', name: 'Стальной Слиток', fuelReq: 1, needsCrucible: false };
    if (id === 'minecraft:raw_iron' || id.includes('iron_ore')) return { result: 'minecraft:iron_ingot', name: 'Железный Слиток', fuelReq: 1, needsCrucible: false };
    if (id === 'minecraft:raw_copper' || id.includes('copper_ore')) return { result: 'minecraft:copper_ingot', name: 'Медный Слиток', fuelReq: 1, needsCrucible: false };
    if (id === 'minecraft:raw_gold' || id.includes('gold_ore')) return { result: 'minecraft:gold_ingot', name: 'Золотой Слиток', fuelReq: 1, needsCrucible: false };
    if (id === 'minecraft:netherite_scrap') return { result: 'skd:cinder_alloy_ingot', name: 'Пепельный Сплав (Т2)', fuelReq: 2, needsCrucible: true };
    if (id === 'minecraft:netherite_ingot') return { result: 'kubejs:refined_netherite_ingot', name: 'Очищенный Незерит (Т2+)', fuelReq: 4, needsCrucible: true };
    if (id === 'aether:enchanted_gravitite') return { result: 'kubejs:celestial_astralyte_ingot', name: 'Небесный Астралит (Т3)', fuelReq: 3, needsCrucible: true };
    return null;
}

// ------------------------------------------------------------------------------
// КАТАЛОГ РЕЦЕПТОВ КОВКИ (ТАБ 0)
// ------------------------------------------------------------------------------
const WORKSHOP_FORGE_RECIPES = [
    // ⚔️ Оружие Т1 (Верхний Мир: Сталь / Железо)
    { id: 'simplyswords:iron_longsword', name: 'Стальной Длинный Меч Границы', ingot: 'minecraft:iron_ingot', ingotName: 'Железный / Стальной Слиток', ingotCount: 14, extra: 'minecraft:stick', extraName: 'Рукоять', extraCount: 2 },
    { id: 'simplyswords:iron_claymore', name: 'Стальной Клеймор Наемника', ingot: 'minecraft:iron_ingot', ingotName: 'Железный / Стальной Слиток', ingotCount: 18, extra: 'minecraft:stick', extraName: 'Рукоять', extraCount: 2 },
    { id: 'simplyswords:bramblethorn', name: 'Шипованный Терновник Древнего Леса', ingot: 'minecraft:iron_ingot', ingotName: 'Железный / Стальной Слиток', ingotCount: 16, extra: 'minecraft:vine', extraName: 'Лоза Терновника', extraCount: 4 },
    { id: 'cataclysm:black_steel_sword', name: 'Палаш Черной Стали Цитадели', ingot: 'minecraft:iron_ingot', ingotName: 'Черная Сталь', ingotCount: 16, extra: 'minecraft:obsidian', extraName: 'Обсидиановый Скол', extraCount: 2 },

    // ⚔️ Оружие Т1.5 (Подземный Сад: Клоггрум / Морозная Сталь / Утериум)
    { id: 'undergarden:cloggrum_battleaxe', name: 'Клоггрумовая Секира Глубин', ingot: 'undergarden:cloggrum_ingot', ingotName: 'Клоггрумовый Слиток', ingotCount: 18, extra: 'undergarden:twistytwig', extraName: 'Ветвь Катакомб', extraCount: 2 },
    { id: 'undergarden:froststeel_sword', name: 'Клинок Вечной Мерзлоты Froststeel', ingot: 'undergarden:froststeel_ingot', ingotName: 'Слиток Морозной Стали', ingotCount: 16, extra: 'undergarden:twistytwig', extraName: 'Ветвь Катакомб', extraCount: 2 },
    { id: 'undergarden:utherium_sword', name: 'Утеритовый Рапирный Клинок', ingot: 'undergarden:utherium_crystal', ingotName: 'Кристалл Утериума', ingotCount: 16, extra: 'undergarden:twistytwig', extraName: 'Ветвь Катакомб', extraCount: 2 },

    // ⚔️ Оружие Т2 (Преисподняя: Пепельный Сплав / Незерит)
    { id: 'simplyswords:emberblade', name: 'Клинок Тлеющего Угля Преисподней', ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 16, extra: 'minecraft:blaze_rod', extraName: 'Огненный Стержень', extraCount: 2 },
    { id: 'simplyswords:molten_edge', name: 'Раскаленная Грань Лавового Озера', ingot: 'skd:cinder_alloy_ingot', ingotName: 'Пепельный Сплав', ingotCount: 18, extra: 'minecraft:magma_block', extraName: 'Магма', extraCount: 2 },
    { id: 'cataclysm:the_incinerator', name: 'Испепелитель Падшего Короля Игниса', ingot: 'minecraft:netherite_ingot', ingotName: 'Незеритовый Слиток', ingotCount: 20, extra: 'minecraft:nether_star', extraName: 'Звезда Незера', extraCount: 1 },

    // ⚔️ Оружие Т3 (Небесный Эфир: Небесный Астралит)
    { id: 'aether:lightning_sword', name: 'Громовой Клинок Бури Эфира', ingot: 'kubejs:celestial_astralyte_ingot', ingotName: 'Небесный Астралит', ingotCount: 16, extra: 'aether:golden_amber', extraName: 'Золотой Янтарь', extraCount: 2 },
    { id: 'aether:holy_sword', name: 'Священный Паладинский Меч Небес', ingot: 'kubejs:celestial_astralyte_ingot', ingotName: 'Небесный Астралит', ingotCount: 16, extra: 'aether:aechor_petal', extraName: 'Лепесток Эйхора', extraCount: 2 },
    { id: 'simplyswords:sunfire', name: 'Солнечное Пламя Золотого Облака', ingot: 'kubejs:celestial_astralyte_ingot', ingotName: 'Небесный Астралит', ingotCount: 18, extra: 'aether:sun_altar', extraName: 'Солнечная Эссенция', extraCount: 1 },

    // ⚔️ Оружие Т4 (Цитадели Края: Незерит / Руническая Сталь)
    { id: 'cataclysm:zweiender', name: 'Цвайэндер Раскола Пространства', ingot: 'minecraft:netherite_ingot', ingotName: 'Незеритовый Слиток', ingotCount: 18, extra: 'minecraft:ender_eye', extraName: 'Око Края', extraCount: 2 },
    { id: 'simplyswords:shadowsting', name: 'Теневое Жало Пожирателя Края', ingot: 'minecraft:netherite_ingot', ingotName: 'Незеритовый Слиток', ingotCount: 16, extra: 'minecraft:popped_chorus_fruit', extraName: 'Плод Хоруса', extraCount: 4 },
    { id: 'cataclysm:final_fractal', name: 'Финальный Фрактал Бездны', ingot: 'minecraft:netherite_ingot', ingotName: 'Незеритовый Слиток', ingotCount: 20, extra: 'minecraft:dragon_breath', extraName: 'Дыхание Дракона', extraCount: 2 },

    // ⚔️ Оружие Т5 (Вечное Сияние: Эфирсент)
    { id: 'eternal_starlight:moonring_sword', name: 'Клинок Лунного Кольца Сияния', ingot: 'eternal_starlight:aethersent_ingot', ingotName: 'Слиток Эфирсента', ingotCount: 16, extra: 'eternal_starlight:blue_starlight_crystal_shard', extraName: 'Осколок Кристалла', extraCount: 2 },
    { id: 'simplyswords:stormbringer', name: 'Призыватель Звездной Бури', ingot: 'eternal_starlight:aethersent_ingot', ingotName: 'Слиток Эфирсента', ingotCount: 18, extra: 'eternal_starlight:starlight_flower', extraName: 'Звездный Цветок', extraCount: 2 },

    // ⚔️ Оружие Т6 (Скалк-Бездна: Резонарий)
    { id: 'deeperdarker:warden_sword', name: 'Резонирующий Меч Эхо-Удара Sonic Boom', ingot: 'deeperdarker:resonarium', ingotName: 'Резонарий', ingotCount: 18, extra: 'deeperdarker:reinforced_echo_shard', extraName: 'Усиленный Осколок Эха', extraCount: 2 },
    { id: 'simplyswords:whisperwind', name: 'Кинжал Шепота Скалк-Бездны', ingot: 'deeperdarker:resonarium', ingotName: 'Резонарий', ingotCount: 16, extra: 'minecraft:echo_shard', extraName: 'Осколок Эха', extraCount: 3 },

    // ⚔️ Оружие Т7 (Первородный Эдем: Золото Святости / Душа Эдема)
    { id: 'simplyswords:righteous_relic', name: 'Праведная Реликвия Высшего Света', ingot: 'minecraft:gold_block', ingotName: 'Золотой Блок Святости', ingotCount: 18, extra: 'aether:enchanted_gravitite', extraName: 'Гравитит', extraCount: 3 },
    { id: 'simplyswords:caelestis', name: 'Селестис — Небесный Меч', ingot: 'minecraft:gold_block', ingotName: 'Золотой Блок Святости', ingotCount: 20, extra: 'aether:sun_altar', extraName: 'Солнечный Алтарь', extraCount: 1 },

    // ⚔️ Оружие Т8 (Апогей Мортума: Незеритовый Блок Бездны / Артефакты)
    { id: 'cataclysm:final_fractal', name: 'Финальный Фрактал Реальности', ingot: 'minecraft:netherite_block', ingotName: 'Незеритовый Блок Бездны', ingotCount: 20, extra: 'cataclysm:void_core', extraName: 'Ядро Бездны', extraCount: 2 },
    { id: 'simplyswords:livyatan', name: 'Ливиафан — Повелитель Океана', ingot: 'minecraft:netherite_block', ingotName: 'Незеритовый Блок Бездны', ingotCount: 20, extra: 'cataclysm:abyssal_egg', extraName: 'Яйцо Бездны', extraCount: 1 },

    // 🛡 Доспехи Т1 (Базовая Защита)
    { id: 'minecraft:iron_helmet', name: 'Железный Шлем', ingot: 'minecraft:iron_ingot', ingotName: 'Железный / Стальной Слиток', ingotCount: 16, extra: null, extraName: null, extraCount: 0 },
    { id: 'minecraft:iron_chestplate', name: 'Железный Нагрудник', ingot: 'minecraft:iron_ingot', ingotName: 'Железный / Стальной Слиток', ingotCount: 20, extra: null, extraName: null, extraCount: 0 },
    { id: 'minecraft:iron_leggings', name: 'Железные Поножи', ingot: 'minecraft:iron_ingot', ingotName: 'Железный / Стальной Слиток', ingotCount: 16, extra: null, extraName: null, extraCount: 0 },
    { id: 'minecraft:iron_boots', name: 'Железные Сапоги', ingot: 'minecraft:iron_ingot', ingotName: 'Железный / Стальной Слиток', ingotCount: 12, extra: null, extraName: null, extraCount: 0 },
    { id: 'minecraft:shield', name: 'Боевой Щит Защитника', ingot: 'minecraft:iron_ingot', ingotName: 'Железная Оковка', ingotCount: 12, extra: '#minecraft:planks', extraName: 'Доски', extraCount: 4 }
];

// Подсчет доступного сырья в 6 слотах ковки (Таб 0)
function countForgeSlotItems(ingredients, targetIdOrTag) {
    let count = 0;
    for (let i = 0; i < ingredients.length; i++) {
        let st = ingredients[i];
        if (matchesItemOrTag(st, targetIdOrTag)) {
            count += st.count;
        }
    }
    return count;
}

function deductForgeSlotItems(ingredients, targetIdOrTag, needed) {
    let remain = needed;
    for (let i = 0; i < ingredients.length && remain > 0; i++) {
        let st = ingredients[i];
        if (matchesItemOrTag(st, targetIdOrTag)) {
            let take = Math.min(st.count, remain);
            st.shrink(take);
            remain -= take;
            if (st.isEmpty() || st.count <= 0) {
                ingredients[i] = null;
            }
        }
    }
    return remain === 0;
}

// ------------------------------------------------------------------------------
// ЕДИНЫЙ ГРАФИЧЕСКИЙ ИНТЕРФЕЙС (UNIFIED WORKSHOP GUI - 6 ROWS / CHEST MENU)
// ------------------------------------------------------------------------------
function openUnifiedWorkshopGUI(player, defaultTab, blockPos) {
    let level = player.level;
    let sess = getOrCreateBlacksmithSession(player);
    if (defaultTab !== undefined && defaultTab !== null) {
        sess.tab = defaultTab;
    }
    if (blockPos) {
        sess.stationPos = blockPos;
    }

    let tabNames = [
        '⚒ [ Ковка ]',
        '🔧 [ Ремонт ]',
        '🔥 [ Очаг ]',
        '🌋 [ Горн ]',
        '🌌 [ Наковальня Бездны ]',
        '🛠 [ Оружейное Дело ]'
    ];

    let fullTitle = '\uE001§r§6§lМАСТЕРСКАЯ ЭЛИРИУМА §7✦ ' + tabNames[sess.tab];

    player.openChestGUI(Text.of(fullTitle), 6, gui => {
        gui.playerSlots = true;
        gui.closed = () => {
            clearAndRefundBlacksmithSession(player, false);
        };

        let darkPane = Item.of('minecraft:gray_stained_glass_pane').withCustomName(Text.of('§8 '));
        let borderPane = Item.of('minecraft:black_stained_glass_pane').withCustomName(Text.of('§8 '));

        // ======================================================================
        // ROW 0 (Y=0): ЕДИНАЯ ВЕРХНЯЯ ПАНЕЛЬ НАВИГАЦИИ ВКЛАДОК (TAB BAR 0..5)
        // ======================================================================
        let tabIcons = [
            'minecraft:iron_sword',       // 0: Ковка
            'minecraft:anvil',            // 1: Ремонт
            'minecraft:blast_furnace',    // 2: Очаг
            'minecraft:lava_bucket',      // 3: Горн
            'minecraft:crying_obsidian',  // 4: Наковальня
            'minecraft:smithing_table'    // 5: Оружейный Стол
        ];

        for (let t = 0; t < 6; t++) {
            let isCurrent = (sess.tab === t);
            let iconItem = Item.of(isCurrent ? 'minecraft:nether_star' : tabIcons[t]);
            let tName = isCurrent ? `§6▶ §e${tabNames[t]} §6◀` : `§7${tabNames[t]}`;

            gui.slot(t, 0, s => {
                s.setItem(iconItem.withCustomName(Text.of(tName)).withLore([
                    Text.of(isCurrent ? '§a[Текущая активная станция]' : '§e▶ Нажмите для мгновенного перехода'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§7Все предметы в рабочих слотах остаются в безопасности.')
                ]));
                s.leftClicked = () => {
                    sess.tab = t;
                    player.server.runCommandSilent(`playsound minecraft:ui.button.click player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openUnifiedWorkshopGUI(player, t, sess.stationPos);
                };
            });
        }

        // Разделители и выход в ряду 0
        gui.slot(6, 0, s => { s.setItem(darkPane); s.leftClicked = () => {}; });
        gui.slot(7, 0, s => { s.setItem(darkPane); s.leftClicked = () => {}; });
        gui.slot(8, 0, s => {
            s.setItem(Item.of('minecraft:barrier').withCustomName(Text.of('§c✖ [ Закрыть Мастерскую ]')));
            s.leftClicked = () => {
                player.closeChestGUI();
            };
        });

        // ======================================================================
        // ЗАПОЛНЕНИЕ РАБОЧИХ ЗОН В ЗАВИСИМОСТИ ОТ ВЫБРАННОЙ ВКЛАДКИ
        // ======================================================================

        // ----------------------------------------------------------------------
        // ТАБ 0: ⚒ [ КОВКА НА ВЕРСТАКЕ ]
        // ----------------------------------------------------------------------
        if (sess.tab === 0) {
            // Очищаем фон рядов 1..5
            for (let y = 1; y < 6; y++) {
                for (let x = 0; x < 9; x++) {
                    gui.slot(x, y, s => { s.setItem(darkPane); s.leftClicked = () => {}; });
                }
            }

            // Инфо-шапка слева (X=2, Y=1)
            gui.slot(2, 1, s => {
                s.setItem(Item.of('minecraft:chest').withCustomName(Text.of('§6📥 [ 6 Слотов Сырья для Ковки ]')).withLore([
                    Text.of('§7Поместите сюда металлы, рукояти и компоненты.'),
                    Text.of('§a▶ Клик по вещи в сумке снизу моментально кладет ее сюда!'),
                    Text.of('§e▶ Клик по слоту возвращает предмет обратно в сумку.')
                ]));
                s.leftClicked = () => {};
            });

            // 6 СЛОТОВ СЫРЬЯ (X=1..3, Y=2..3)
            let slotCoords = [
                {x: 1, y: 2}, {x: 2, y: 2}, {x: 3, y: 2},
                {x: 1, y: 3}, {x: 2, y: 3}, {x: 3, y: 3}
            ];

            for (let idx = 0; idx < 6; idx++) {
                let pos = slotCoords[idx];
                let itemInSlot = sess.forgeIngredients[idx];
                gui.slot(pos.x, pos.y, s => {
                    if (itemInSlot && !itemInSlot.isEmpty()) {
                        s.setItem(itemInSlot.copy().withLore([
                            Text.of('§8────────────────────────────────'),
                            Text.of('§e▶ Нажмите ЛКМ/ПКМ, чтобы вернуть в инвентарь')
                        ]));
                        s.leftClicked = () => {
                            player.give(itemInSlot);
                            sess.forgeIngredients[idx] = null;
                            player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                            openUnifiedWorkshopGUI(player, 0, sess.stationPos);
                        };
                    } else {
                        s.setItem(Item.of('minecraft:light_gray_stained_glass_pane')
                            .withCustomName(Text.of(`§7[ Слот Сырья #${idx + 1} ]`))
                            .withLore([Text.of('§8Пусто. Кликните предмет в сумке для загрузки.')]));
                        s.leftClicked = () => {};
                    }
                });
            }

            // ТЕКУЩИЙ ВЫБРАННЫЙ РЕЦЕПТ
            let curRecipe = WORKSHOP_FORGE_RECIPES[sess.selectedRecipeIdx] || WORKSHOP_FORGE_RECIPES[0];
            let availIngot = countForgeSlotItems(sess.forgeIngredients, curRecipe.ingot);
            let availExtra = curRecipe.extra ? countForgeSlotItems(sess.forgeIngredients, curRecipe.extra) : 999;
            let canCraft = (availIngot >= curRecipe.ingotCount && availExtra >= curRecipe.extraCount);

            // КАТАЛОГ ДОСТУПНОГО КРАФТА СПРАВА (X=5..8, Y=1) - Выбор рецептов
            gui.slot(5, 1, s => {
                s.setItem(Item.of('minecraft:book').withCustomName(Text.of('§e📖 [ Каталог Чертежей ]')).withLore([
                    Text.of('§7Выберите желаемый предмет для ковки:'),
                    Text.of(`§6Текущий чертеж: §f${curRecipe.name}`)
                ]));
                s.leftClicked = () => {};
            });

            // Навигация по каталогу (влево / вправо)
            gui.slot(6, 1, s => {
                s.setItem(Item.of('minecraft:arrow').withCustomName(Text.of('§e◀ Предыдущий Чертеж')));
                s.leftClicked = () => {
                    sess.selectedRecipeIdx = (sess.selectedRecipeIdx - 1 + WORKSHOP_FORGE_RECIPES.length) % WORKSHOP_FORGE_RECIPES.length;
                    player.server.runCommandSilent(`playsound minecraft:ui.button.click player ${player.username} ~ ~ ~ 0.6 1.4`);
                    openUnifiedWorkshopGUI(player, 0, sess.stationPos);
                };
            });

            gui.slot(7, 1, s => {
                s.setItem(Item.of('minecraft:arrow').withCustomName(Text.of('§eСледующий Чертеж ▶')));
                s.leftClicked = () => {
                    sess.selectedRecipeIdx = (sess.selectedRecipeIdx + 1) % WORKSHOP_FORGE_RECIPES.length;
                    player.server.runCommandSilent(`playsound minecraft:ui.button.click player ${player.username} ~ ~ ~ 0.6 1.4`);
                    openUnifiedWorkshopGUI(player, 0, sess.stationPos);
                };
            });

            // ПРИЗРАЧНОЕ ТРЕБОВАНИЕ (GHOST REQUIREMENT) СЛОТ X=5, Y=2
            gui.slot(5, 2, s => {
                let ghostLore = [
                    Text.of(`§7Чертеж: §f${curRecipe.name}`),
                    Text.of('§8────────────────────────────────'),
                    Text.of(`§7Требуемый металл: §e${curRecipe.ingotName} §f(${availIngot}/${curRecipe.ingotCount})`)
                ];
                if (curRecipe.extra) {
                    ghostLore.push(Text.of(`§7Дополнительно: §e${curRecipe.extraName} §f(${availExtra}/${curRecipe.extraCount})`));
                }
                ghostLore.push(Text.of('§8────────────────────────────────'));
                if (canCraft) {
                    ghostLore.push(Text.of('§a✓ Все ингредиенты загружены в 6 слотов сырья!'));
                } else {
                    ghostLore.push(Text.of('§c✗ Не хватает ресурсов в 6 слотах сырья слева.'));
                }

                let ghostIcon = Item.of(curRecipe.ingot.startsWith('#') ? 'minecraft:oak_planks' : curRecipe.ingot);
                s.setItem(ghostIcon.withCustomName(Text.of(canCraft ? '§a✓ [ Ресурсы готовы ]' : '§c⚠ [ Требуемые Ресурсы ]')).withLore(ghostLore));
                s.leftClicked = () => {};
            });

            // СЛОТ СТРЕЛКИ (X=6, Y=2)
            gui.slot(6, 2, s => {
                s.setItem(Item.of(canCraft ? 'minecraft:spectral_arrow' : 'minecraft:arrow')
                    .withCustomName(Text.of(canCraft ? '§a»»» ГОТОВО К КОВКЕ »»»' : '§8»»» ОЖИДАНИЕ СЫРЬЯ »»»')));
                s.leftClicked = () => {};
            });

            // СЛОТ РЕЗУЛЬТАТА КОВКИ (X=7, Y=2)
            gui.slot(7, 2, s => {
                if (canCraft) {
                    s.setItem(Item.of(curRecipe.id).withLore([
                        Text.of('§a★ КОВКА ДОСТУПНА! ★'),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§e▶ Нажмите ЛКМ, чтобы выковать предмет!'),
                        Text.of('§7Сырье будет списано из 6 слотов слева.')
                    ]));
                    s.leftClicked = () => {
                        // Списание ингредиентов
                        deductForgeSlotItems(sess.forgeIngredients, curRecipe.ingot, curRecipe.ingotCount);
                        if (curRecipe.extra && curRecipe.extraCount > 0) {
                            deductForgeSlotItems(sess.forgeIngredients, curRecipe.extra, curRecipe.extraCount);
                        }
                        player.give(Item.of(curRecipe.id));

                        player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.9 1.2`);
                        player.server.runCommandSilent(`playsound minecraft:block.blastfurnace.fire_crackle player ${player.username} ~ ~ ~ 0.8 1.1`);
                        player.server.runCommandSilent(`particle minecraft:flame ~ ~1.2 ~ 0.4 0.3 0.4 0.05 25`);
                        player.server.runCommandSilent(`particle minecraft:lava ~ ~1.2 ~ 0.3 0.2 0.3 0.05 15`);
                        player.sendSystemMessage(Text.of(`§a⚒ [Ковка] §fВы успешно выковали: §6${curRecipe.name}§f!`));

                        openUnifiedWorkshopGUI(player, 0, sess.stationPos);
                    };
                } else {
                    // Полупрозрачный призрачный результат
                    s.setItem(Item.of('minecraft:barrier')
                        .withCustomName(Text.of(`§8🔒 [ ${curRecipe.name} ]`))
                        .withLore([
                            Text.of('§cНедостаточно сырья в слотах слева!'),
                            Text.of('§7Положите недостающие материалы в 6 ячеек.')
                        ]));
                    s.leftClicked = () => {
                        player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                    };
                }
            });
        }

        // ----------------------------------------------------------------------
        // ТАБ 1: 🔧 [ РЕМОНТ (1 СЛИТОК = 1/3 ПРОЧНОСТИ) ]
        // ----------------------------------------------------------------------
        else if (sess.tab === 1) {
            for (let y = 1; y < 6; y++) {
                for (let x = 0; x < 9; x++) {
                    gui.slot(x, y, s => { s.setItem(darkPane); s.leftClicked = () => {}; });
                }
            }

            // Инфо-шапка (X=4, Y=1)
            gui.slot(4, 1, s => {
                s.setItem(Item.of('minecraft:anvil').withCustomName(Text.of('§a🔧 [ СТОЛ РЕМОНТА ЭКИПИРОВКИ ]')).withLore([
                    Text.of('§7Формула ремонта Элириума:'),
                    Text.of('§e• Износ ≤ 33.3% ➔ 1 слиток'),
                    Text.of('§e• Износ 33.4%..66.6% ➔ 2 слитка'),
                    Text.of('§e• Износ > 66.6% ➔ 3 слитка (100% восстановление)'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§a▶ Кликните поврежденную вещь в сумке снизу.')
                ]));
                s.leftClicked = () => {};
            });

            let gear = sess.repairGear;
            let ingots = sess.repairIngots;
            let neededCost = (gear && gear.isDamageableItem()) ? calculateRepairCost(gear) : 0;
            let repMat = gear ? getRepairMaterial(gear) : { id: 'minecraft:iron_ingot', name: 'Слиток' };

            // СЛОТ 1: ПОВРЕЖДЕННАЯ ЭКИПИРОВКА (X=2, Y=2)
            gui.slot(2, 2, s => {
                if (gear && !gear.isEmpty()) {
                    let curDur = gear.maxDamage - gear.damageValue;
                    s.setItem(gear.copy().withLore([
                        Text.of(`§7Прочность: §f${curDur} / ${gear.maxDamage}`),
                        Text.of(`§cИзнос: ${gear.damageValue} ед. урона`),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§e▶ Кликните ЛКМ для возврата в инвентарь')
                    ]));
                    s.leftClicked = () => {
                        player.give(gear);
                        sess.repairGear = null;
                        sess.repairResult = null;
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                        openUnifiedWorkshopGUI(player, 1, sess.stationPos);
                    };
                } else {
                    s.setItem(Item.of('minecraft:shield')
                        .withCustomName(Text.of('§b✦ [ Слот Поврежденной Экипировки ] ✦'))
                        .withLore([
                            Text.of('§7Поместите поврежденное оружие, броню или щит.'),
                            Text.of('§a▶ Кликните по предмету в сумке снизу!')
                        ]));
                    s.leftClicked = () => {};
                }
            });

            // СЛОТ 2: СЛИТКИ ДЛЯ РЕМОНТА (X=4, Y=2)
            gui.slot(4, 2, s => {
                if (ingots && !ingots.isEmpty()) {
                    s.setItem(ingots.copy().withLore([
                        Text.of(`§7Вложено слитков: §f${ingots.count} шт.`),
                        Text.of(`§eТребуется для ремонта: §f${neededCost} шт.`),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§e▶ Кликните ЛКМ для возврата слитков в сумку')
                    ]));
                    s.leftClicked = () => {
                        player.give(ingots);
                        sess.repairIngots = null;
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                        openUnifiedWorkshopGUI(player, 1, sess.stationPos);
                    };
                } else {
                    if (gear && neededCost > 0) {
                        // Призрачная иконка нужного слитка!
                        let ghostMatIcon = Item.of(repMat.id.startsWith('#') ? 'minecraft:oak_planks' : repMat.id);
                        s.setItem(ghostMatIcon.withCustomName(Text.of(`§eТребуется: ${neededCost}x ${repMat.name}`)).withLore([
                            Text.of(`§cДля 100% починки требуется положить: §6${neededCost}x ${repMat.name}`),
                            Text.of('§a▶ Кликните по слиткам в инвентаре снизу!')
                        ]));
                    } else {
                        s.setItem(Item.of('minecraft:iron_ingot')
                            .withCustomName(Text.of('§e🧱 [ Слот Слитков для Ремонта ]'))
                            .withLore([Text.of('§7Сюда помещаются слитки подходящего металла.')]));
                    }
                    s.leftClicked = () => {};
                }
            });

            // СЛОТ СТРЕЛКИ (X=6, Y=2)
            gui.slot(6, 2, s => {
                let hasEnoughIngots = (ingots && ingots.count >= neededCost && matchesItemOrTag(ingots, repMat.id));
                s.setItem(Item.of(hasEnoughIngots ? 'minecraft:spectral_arrow' : 'minecraft:arrow')
                    .withCustomName(Text.of(hasEnoughIngots ? '§a»»» ПОЧИНКА ГОТОВА »»»' : '§8»»» ОЖИДАНИЕ СЛИТКОВ »»»')));
                s.leftClicked = () => {};
            });

            // СЛОТ 3: РЕЗУЛЬТАТ РЕМОНТА (X=7, Y=2)
            gui.slot(7, 2, s => {
                let hasEnoughIngots = (ingots && ingots.count >= neededCost && matchesItemOrTag(ingots, repMat.id));
                if (gear && neededCost > 0 && hasEnoughIngots) {
                    let repairedItem = gear.copy();
                    repairedItem.damageValue = 0; // 100% починка

                    s.setItem(repairedItem.withLore([
                        Text.of('§a★ 100% ВОССТАНОВЛЕНИЕ ПРОЧНОСТИ ★'),
                        Text.of(`§7Стоимость списания: §6${neededCost}x ${repMat.name}`),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§e▶ Нажмите ЛКМ, чтобы забрать восстановленный предмет!')
                    ]));
                    s.leftClicked = () => {
                        ingots.shrink(neededCost);
                        if (ingots.count <= 0) sess.repairIngots = null;

                        let finalItem = gear.copy();
                        finalItem.damageValue = 0;
                        sess.repairGear = null;
                        sess.repairResult = null;
                        player.give(finalItem);

                        player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.9 1.2`);
                        player.server.runCommandSilent(`playsound minecraft:block.lava.extinguish player ${player.username} ~ ~ ~ 0.8 1.0`);
                        player.server.runCommandSilent(`particle minecraft:wax_off ~ ~1.2 ~ 0.4 0.3 0.4 0.05 30`);
                        player.sendSystemMessage(Text.of(`§a🔧 [Ремонт] §fПредмет успешно отремонтирован до 100% прочности!`));

                        openUnifiedWorkshopGUI(player, 1, sess.stationPos);
                    };
                } else {
                    s.setItem(Item.of('minecraft:barrier')
                        .withCustomName(Text.of('§8🔒 [ Результат Ремонта ]'))
                        .withLore([
                            Text.of(gear ? `§cТребуется: ${neededCost} слитков ${repMat.name}` : '§7Вставьте поврежденный предмет в Слот 1')
                        ]));
                    s.leftClicked = () => {};
                }
            });
        }

        // ----------------------------------------------------------------------
        // ТАБ 2: 🔥 [ КУЗНЕЧНЫЙ ОЧАГ - SMELTER ]
        // ----------------------------------------------------------------------
        else if (sess.tab === 2) {
            for (let y = 1; y < 6; y++) {
                for (let x = 0; x < 9; x++) {
                    gui.slot(x, y, s => { s.setItem(darkPane); s.leftClicked = () => {}; });
                }
            }

            let hearthPos = sess.stationPos || { x: Math.floor(player.x), y: Math.floor(player.y), z: Math.floor(player.z) };
            let hasCrucible = hasCrucibleNear(level, hearthPos);

            // СЛОТ СЫРЬЯ СВЕРХУ (X=3, Y=1)
            gui.slot(3, 1, s => {
                let smeltIn = sess.hearthSmeltInput;
                if (smeltIn && !smeltIn.isEmpty()) {
                    s.setItem(smeltIn.copy().withLore([
                        Text.of(`§7Количество: §f${smeltIn.count} шт.`),
                        Text.of('§e▶ Нажмите ЛКМ для возврата сырья в сумку')
                    ]));
                    s.leftClicked = () => {
                        player.give(smeltIn);
                        sess.hearthSmeltInput = null;
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                        openUnifiedWorkshopGUI(player, 2, sess.stationPos);
                    };
                } else {
                    s.setItem(Item.of('minecraft:raw_iron')
                        .withCustomName(Text.of('§6📥 [ Слот Сырья для Плавения ]'))
                        .withLore([
                            Text.of('§7Шихта стали, сырое железо, медь, золото, незерит.'),
                            Text.of('§a▶ Кликните сырье в сумке снизу для загрузки!')
                        ]));
                    s.leftClicked = () => {};
                }
            });

            // СЛОТ ТОПЛИВА СНИЗУ (X=3, Y=3)
            gui.slot(3, 3, s => {
                let fuelIn = sess.hearthFuelInput;
                if (fuelIn && !fuelIn.isEmpty()) {
                    s.setItem(fuelIn.copy().withLore([
                        Text.of(`§7Запас топлива: §f${fuelIn.count} шт.`),
                        Text.of('§e▶ Нажмите ЛКМ для возврата топлива в сумку')
                    ]));
                    s.leftClicked = () => {
                        player.give(fuelIn);
                        sess.hearthFuelInput = null;
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                        openUnifiedWorkshopGUI(player, 2, sess.stationPos);
                    };
                } else {
                    s.setItem(Item.of('minecraft:coal')
                        .withCustomName(Text.of('§8🔥 [ Слот Топлива ]'))
                        .withLore([
                            Text.of('§7Уголь, древесный уголь, угольные блоки, стержни ифрита.'),
                            Text.of('§a▶ Кликните топливо в сумке снизу для загрузки!')
                        ]));
                    s.leftClicked = () => {};
                }
            });

            // ЦЕНТР (X=4, Y=2): ИНДИКАТОР ПЛАМЕНИ И КНОПКА ПЛАВКИ
            let smeltIn = sess.hearthSmeltInput;
            let fuelIn = sess.hearthFuelInput;
            let recipe = smeltIn ? getHearthSmeltRecipe(smeltIn) : null;
            let canSmelt = false;
            let failReason = '';

            if (!smeltIn || smeltIn.isEmpty()) {
                failReason = 'Загрузите сырье в верхний слот';
            } else if (!recipe) {
                failReason = 'Данный материал не переплавляется в Очаге';
            } else if (!fuelIn || fuelIn.isEmpty()) {
                failReason = 'Загрузите уголь/топливо в нижний слот';
            } else if (fuelIn.count < recipe.fuelReq) {
                failReason = `Требуется минимум ${recipe.fuelReq} ед. топлива`;
            } else if (recipe.needsCrucible && !hasCrucible) {
                failReason = 'Инфернальный жар! Требуется Адский Горн в радиусе 4 блоков!';
            } else {
                canSmelt = true;
            }

            gui.slot(4, 2, s => {
                s.setItem(Item.of(canSmelt ? 'minecraft:campfire' : 'minecraft:flint_and_steel')
                    .withCustomName(Text.of(canSmelt ? '§c🔥 [ ПЛАМЯ ОЧАГА: НАЖМИТЕ ДЛЯ ВЫПЛАВКИ ]' : '§8🔒 [ Очаг: Ожидание Загрузки ]'))
                    .withLore([
                        Text.of(canSmelt ? `§aГотово к плавке: ${recipe.name}` : `§c${failReason}`),
                        Text.of('§8────────────────────────────────'),
                        Text.of(hasCrucible ? '§a✓ Адский Горн рядом: Инфернальные сплавы активны' : '§7• Адский Горн рядом: Не обнаружен (R=4)'),
                        Text.of(canSmelt ? '§e▶ Нажмите ЛКМ для выплавки слитков!' : '§7Загрузите ресурсы в слоты слева.')
                    ]));
                s.leftClicked = () => {
                    if (!canSmelt) {
                        player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                        player.sendSystemMessage(Text.of(`§c[Очаг] §7${failReason}`));
                        return;
                    }

                    // Выплавка 1 слитка
                    smeltIn.shrink(1);
                    if (smeltIn.count <= 0) sess.hearthSmeltInput = null;

                    fuelIn.shrink(recipe.fuelReq);
                    if (fuelIn.count <= 0) sess.hearthFuelInput = null;

                    // Направление в слот выхода или в буфер
                    if (!sess.hearthOutput || sess.hearthOutput.isEmpty()) {
                        sess.hearthOutput = Item.of(recipe.result, 1);
                    } else if (sess.hearthOutput.id === recipe.result && sess.hearthOutput.count < 64) {
                        sess.hearthOutput.grow(1);
                    } else {
                        player.give(Item.of(recipe.result, 1));
                    }

                    player.server.runCommandSilent(`playsound minecraft:block.blastfurnace.fire_crackle player ${player.username} ~ ~ ~ 1.0 1.1`);
                    player.server.runCommandSilent(`particle minecraft:flame ~ ~1.2 ~ 0.4 0.3 0.4 0.05 30`);
                    player.server.runCommandSilent(`particle minecraft:lava ~ ~1.2 ~ 0.3 0.2 0.3 0.05 15`);
                    player.sendSystemMessage(Text.of(`§a🔥 [Очаг] §fУспешно выплавлен: §6+1 ${recipe.name}§f!`));

                    openUnifiedWorkshopGUI(player, 2, sess.stationPos);
                };
            });

            // СЛОТ ВЫХОДА (X=6, Y=2)
            gui.slot(6, 2, s => {
                let outSt = sess.hearthOutput;
                if (outSt && !outSt.isEmpty()) {
                    s.setItem(outSt.copy().withLore([
                        Text.of(`§aВыплавлено: ${outSt.count} шт.`),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§e▶ Нажмите ЛКМ, чтобы забрать готовые слитки в сумку!')
                    ]));
                    s.leftClicked = () => {
                        player.give(outSt);
                        sess.hearthOutput = null;
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.9 1.1`);
                        openUnifiedWorkshopGUI(player, 2, sess.stationPos);
                    };
                } else {
                    s.setItem(Item.of('minecraft:hopper')
                        .withCustomName(Text.of('§e📥 [ Слот Выхода Слитков ]'))
                        .withLore([Text.of('§7Здесь накапливаются готовые слитки после плавки.')]));
                    s.leftClicked = () => {};
                }
            });
        }

        // ----------------------------------------------------------------------
        // ТАБ 3: 🌋 [ АДСКИЙ ГОРН - ВОЗВЫШЕНИЕ ТИРОВ ]
        // ----------------------------------------------------------------------
        else if (sess.tab === 3) {
            for (let y = 1; y < 6; y++) {
                for (let x = 0; x < 9; x++) {
                    gui.slot(x, y, s => { s.setItem(darkPane); s.leftClicked = () => {}; });
                }
            }

            // Инфо-шапка (X=4, Y=1)
            gui.slot(4, 1, s => {
                s.setItem(Item.of('minecraft:lava_bucket').withCustomName(Text.of('§4🌋 [ АДСКИЙ ГОРН: АЛТАРЬ ВОЗВЫШЕНИЯ ]')).withLore([
                    Text.of('§7Перевод снаряжения в следующую эпоху Канона 8 Тиров:'),
                    Text.of('§e• Слот 1: Экипировка текущего тира'),
                    Text.of('§e• Слот 2: Катализатор эпохи (kubejs:ascension_catalyst_t2..t8)'),
                    Text.of('§e• В инвентаре: 8x Слитков металла целевой эпохи'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§a✓ 100% сохранение: Уровень заточки (+N), сокеты и скрижали!'),
                    Text.of('§6✦ Классическое оружие трансформируется, редкое/босс — усиливается!')
                ]));
                s.leftClicked = () => {};
            });

            let aGear = sess.ascendGear;
            let aCat = sess.ascendCatalyst;

            // Вызов ElyriumForgeAPI для проверки возвышения
            let evalAsc = null;
            if (ElyriumForgeAPI && aGear && aCat) {
                try {
                    evalAsc = ElyriumForgeAPI.evaluate(player, aGear, aCat, null);
                } catch (e) {}
            }

            // СЛОТ 1: ЭКИПИРОВКА ТЕКУЩЕГО ТИРА (X=2, Y=2)
            gui.slot(2, 2, s => {
                if (aGear && !aGear.isEmpty()) {
                    s.setItem(aGear.copy().withLore([
                        Text.of('§8────────────────────────────────'),
                        Text.of('§e▶ Нажмите ЛКМ для возврата предмета в сумку')
                    ]));
                    s.leftClicked = () => {
                        player.give(aGear);
                        sess.ascendGear = null;
                        sess.ascendResult = null;
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                        openUnifiedWorkshopGUI(player, 3, sess.stationPos);
                    };
                } else {
                    s.setItem(Item.of('minecraft:netherite_chestplate')
                        .withCustomName(Text.of('§b✦ [ Слот 1: Экипировка Текущего Тира ] ✦'))
                        .withLore([
                            Text.of('§7Установите оружие или броню для возвышения.'),
                            Text.of('§a▶ Кликните по предмету в сумке снизу!')
                        ]));
                    s.leftClicked = () => {};
                }
            });

            // СЛОТ 2: КАТАЛИЗАТОР ЭПОХИ / ШАБЛОН (X=4, Y=2)
            gui.slot(4, 2, s => {
                if (aCat && !aCat.isEmpty()) {
                    s.setItem(aCat.copy().withLore([
                        Text.of('§8────────────────────────────────'),
                        Text.of('§e▶ Нажмите ЛКМ для возврата катализатора в сумку')
                    ]));
                    s.leftClicked = () => {
                        player.give(aCat);
                        sess.ascendCatalyst = null;
                        sess.ascendResult = null;
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                        openUnifiedWorkshopGUI(player, 3, sess.stationPos);
                    };
                } else {
                    s.setItem(Item.of('minecraft:netherite_upgrade_smithing_template')
                        .withCustomName(Text.of('§6✦ [ Слот 2: Катализатор Возвышения ] ✦'))
                        .withLore([
                            Text.of('§7Катализатор Тира (kubejs:ascension_catalyst_t2..t8)'),
                            Text.of('§7или Шаблон Преемственности (kubejs:tier_upgrade_template).'),
                            Text.of('§a▶ Кликните по катализатору в сумке снизу!')
                        ]));
                    s.leftClicked = () => {};
                }
            });

            // СЛОТ СТРЕЛКИ (X=6, Y=2)
            let canAscend = (evalAsc && evalAsc.canExecute && evalAsc.actionType === 'ASCENSION');
            gui.slot(6, 2, s => {
                s.setItem(Item.of(canAscend ? 'minecraft:spectral_arrow' : 'minecraft:arrow')
                    .withCustomName(Text.of(canAscend ? '§6»»» РИТУАЛ ГОТОВ »»»' : '§8»»» ОЖИДАНИЕ КОМПОНЕНТОВ »»»')));
                s.leftClicked = () => {};
            });

            // СЛОТ 3: ВОЗВЫШЕННЫЙ АРТЕФАКТ (X=7, Y=2)
            gui.slot(7, 2, s => {
                if (canAscend && evalAsc) {
                    let preview = evalAsc.targetItem ? evalAsc.targetItem.copy() : aGear.copy();
                    s.setItem(preview.withLore([
                        Text.of('§6★ РИТУАЛ ВОЗВЫШЕНИЯ ДОСТУПЕН ★'),
                        Text.of(`§eЭволюция: §bТир ${evalAsc.currentTier} §7➔ §6Тир ${evalAsc.targetTier}`),
                        Text.of(`§6✦ Расход металла: §f${evalAsc.requiredIngotCount || 8}x слитков эпохи (из сумки)`),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§a✓ Заточка (+N), сокеты и боевые искусства сохраняются 100%!'),
                        Text.of('§e▶ Нажмите ЛКМ для совершения Возвышения!')
                    ]));
                    s.leftClicked = () => {
                        let res = ElyriumForgeAPI.executeAscension(player, aGear, aCat);
                        if (res && res.status === 'SUCCESS') {
                            aCat.shrink(1);
                            if (aCat.count <= 0) sess.ascendCatalyst = null;
                            sess.ascendGear = null;
                            player.give(res.resultGear);

                            player.server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete player ${player.username} ~ ~ ~ 1.0 1.2`);
                            player.server.runCommandSilent(`particle minecraft:totem_of_undying ~ ~1.5 ~ 0.5 0.5 0.5 0.2 60`);
                            player.server.runCommandSilent(`particle minecraft:flame ~ ~1.2 ~ 0.5 0.5 0.5 0.1 40`);
                            player.sendSystemMessage(Text.of(`§6🌋 [Горн] §fЭкипировка успешно возвышена до Тира ${res.targetTier || evalAsc.targetTier}!`));

                            openUnifiedWorkshopGUI(player, 3, sess.stationPos);
                        } else {
                            player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                            player.sendSystemMessage(Text.of(`§c[Горн] ${res ? res.message : 'Ошибка ритуала возвышения!'}`));
                        }
                    };
                } else {
                    s.setItem(Item.of('minecraft:barrier')
                        .withCustomName(Text.of('§8🔒 [ Слот Возвышенного Артефакта ]'))
                        .withLore([
                            Text.of(evalAsc ? `§c${evalAsc.statusMessage}` : '§7Установите предмет и катализатор для ритуала')
                        ]));
                    s.leftClicked = () => {};
                }
            });
        }

        // ----------------------------------------------------------------------
        // ТАБ 4: 🌌 [ НАКОВАЛЬНЯ - ЗАТОЧКА +1..+15 ]
        // ----------------------------------------------------------------------
        else if (sess.tab === 4) {
            for (let y = 1; y < 6; y++) {
                for (let x = 0; x < 9; x++) {
                    gui.slot(x, y, s => { s.setItem(darkPane); s.leftClicked = () => {}; });
                }
            }

            // Инфо-шапка (X=4, Y=1)
            gui.slot(4, 1, s => {
                s.setItem(Item.of('minecraft:crying_obsidian').withCustomName(Text.of('§5🌌 [ АЛТАРЬ ЗАТОЧКИ НАКОВАЛЬНИ +1..+15 ]')).withLore([
                    Text.of('§7Закалка экипировки по правилам Lineage 2:'),
                    Text.of('§a• +1..+3: Безопасная черта (100%..25%, откат невозможен)'),
                    Text.of('§c• +4..+15: Зона риска (откат -1 при неудаче)'),
                    Text.of('§6• Камень Безопасности (Эгида): 100% спасение от отката!'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§e▶ Кликните экипировку, оселки или эгиду в сумке снизу.')
                ]));
                s.leftClicked = () => {};
            });

            let gear = sess.anvilGear;
            let reagent = sess.anvilReagent;
            let aegis = sess.anvilAegis;
            let result = sess.anvilResult;

            let evalData = null;
            if (ElyriumForgeAPI && gear) {
                try {
                    evalData = ElyriumForgeAPI.evaluate(gear, reagent, aegis);
                } catch (e) {}
            }

            // СЛОТ 1: ЭКИПИРОВКА (X=1, Y=2)
            gui.slot(1, 2, s => {
                if (gear && !gear.isEmpty()) {
                    s.setItem(gear.copy().withLore([
                        Text.of('§8────────────────────────────────'),
                        Text.of('§e▶ Нажмите ЛКМ для возврата в инвентарь')
                    ]));
                    s.leftClicked = () => {
                        player.give(gear);
                        sess.anvilGear = null;
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                        openUnifiedWorkshopGUI(player, 4, sess.stationPos);
                    };
                } else {
                    s.setItem(Item.of('minecraft:iron_sword')
                        .withCustomName(Text.of('§b✦ [ Слот 1: Экипировка ] ✦'))
                        .withLore([Text.of('§7Оружие, броня или боевой щит.'), Text.of('§a▶ Кликните предмет в сумке снизу!')]));
                    s.leftClicked = () => {};
                }
            });

            // СЛОТ 2: ТОЧИЛЬНЫЙ КАМЕНЬ (X=3, Y=2)
            gui.slot(3, 2, s => {
                if (reagent && !reagent.isEmpty()) {
                    s.setItem(reagent.copy().withLore([
                        Text.of('§8────────────────────────────────'),
                        Text.of('§e▶ Нажмите ЛКМ для возврата оселка в сумку')
                    ]));
                    s.leftClicked = () => {
                        player.give(reagent);
                        sess.anvilReagent = null;
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                        openUnifiedWorkshopGUI(player, 4, sess.stationPos);
                    };
                } else {
                    let reqReagentName = (evalData && evalData.requiredReagentId) ? evalData.requiredReagentId : 'Точильный Камень I..V';
                    s.setItem(Item.of('minecraft:blaze_powder')
                        .withCustomName(Text.of('§6✦ [ Слот 2: Точильный Камень ] ✦'))
                        .withLore([
                            Text.of(`§7Оселки I..V (kubejs:smithing_stone_1..5).`),
                            Text.of(`§eТребуется: §f${reqReagentName}`),
                            Text.of('§a▶ Кликните камень в сумке снизу!')
                        ]));
                    s.leftClicked = () => {};
                }
            });

            // СЛОТ 3: КАМЕНЬ БЕЗОПАСНОСТИ / ЭГИДА (X=5, Y=2)
            gui.slot(5, 2, s => {
                if (aegis && !aegis.isEmpty()) {
                    s.setItem(aegis.copy().withLore([
                        Text.of('§6🛡 ЗАЩИТА АКТИВНА: Откат уровня предотвращен!'),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§e▶ Нажмите ЛКМ для возврата Эгиды в сумку')
                    ]));
                    s.leftClicked = () => {
                        player.give(aegis);
                        sess.anvilAegis = null;
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                        openUnifiedWorkshopGUI(player, 4, sess.stationPos);
                    };
                } else {
                    s.setItem(Item.of('minecraft:shield')
                        .withCustomName(Text.of('§d✦ [ Слот 3: Камень Безопасности (Эгида) ] ✦'))
                        .withLore([
                            Text.of('§7Печать Кузнечной Эгиды (kubejs:smithing_aegis).'),
                            Text.of('§6• Предотвращает сброс/откат уровня заточки при неудаче.'),
                            Text.of('§a▶ Кликните Эгиду в сумке для активации защиты.')
                        ]));
                    s.leftClicked = () => {};
                }
            });

            // СЛОТ 4: РЕЗУЛЬТАТ ЗАТОЧКИ (X=7, Y=2)
            gui.slot(7, 2, s => {
                if (result && !result.isEmpty()) {
                    s.setItem(result.copy().withLore([
                        Text.of('§a★ ЗАТОЧКА ЗАВЕРШЕНА! ★'),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§e▶ Нажмите ЛКМ, чтобы забрать артефакт в сумку!'),
                        Text.of('§b▶ Нажмите ПКМ, чтобы вернуть в Слот 1 для следующей заточки!')
                    ]));
                    let takeAction = () => {
                        let resItem = sess.anvilResult;
                        sess.anvilResult = null;
                        player.give(resItem);
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.9 1.1`);
                        openUnifiedWorkshopGUI(player, 4, sess.stationPos);
                    };
                    s.leftClicked = takeAction;
                    s.rightClicked = () => {
                        if (!sess.anvilGear || sess.anvilGear.isEmpty()) {
                            sess.anvilGear = sess.anvilResult;
                            sess.anvilResult = null;
                            player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                            openUnifiedWorkshopGUI(player, 4, sess.stationPos);
                        } else {
                            takeAction();
                        }
                    };
                } else {
                    s.setItem(Item.of('minecraft:gold_nugget')
                        .withCustomName(Text.of('§e✦ [ Слот 4: Результат Заточки ] ✦'))
                        .withLore([Text.of('§7Здесь появится артефакт после удара молотом.')]));
                    s.leftClicked = () => {};
                }
            });

            // КНОПКА МОЛОТА ПО ЦЕНТРУ (X=4, Y=3)
            let canForge = (evalData && evalData.canExecute && evalData.actionType === 'REINFORCE');
            gui.slot(4, 3, s => {
                let hammerItem = Item.of(canForge ? 'minecraft:anvil' : 'minecraft:iron_bars');
                if (canForge) hammerItem.enchant('minecraft:unbreaking', 1);

                let hammerLore = [
                    Text.of(canForge ? `§eПрогресс: §b+${evalData.currentLevel} §7➔ §a+${evalData.targetLevel}` : `§c${evalData ? evalData.statusMessage : 'Установите экипировку и оселок'}`),
                    Text.of('§8────────────────────────────────')
                ];
                if (canForge) {
                    hammerLore.push(Text.of(`§eШанс успеха: §a${evalData.chancePercent}%`));
                    if (evalData.isSafeZone) {
                        hammerLore.push(Text.of('§a✓ Безопасная зона (+0..+2): откат невозможен!'));
                    } else if (evalData.hasAegis) {
                        hammerLore.push(Text.of('§6🛡 ЗАЩИТА: Печать Эгиды спасет от отката!'));
                    } else {
                        hammerLore.push(Text.of(`§4⚠ ОПАСНОСТЬ: При неудаче откат до +${evalData.currentLevel - 1}!`));
                    }
                    hammerLore.push(Text.of('§8────────────────────────────────'));
                    hammerLore.push(Text.of('§e▶ Нажмите ЛКМ, чтобы опустить Кузнечный Молот!'));
                }

                s.setItem(hammerItem.withCustomName(Text.of(canForge ? '§c🔥 [ УДАРИТЬ КУЗНЕЧНЫМ МОЛОТОМ ]' : '§8[ 🔨 Кузнечный Молот Остыл ]')).withLore(hammerLore));
                s.leftClicked = () => {
                    if (!canForge || !ElyriumForgeAPI) {
                        player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                        return;
                    }

                    let forgeRes = ElyriumForgeAPI.executeForge(player, gear, reagent, aegis);
                    if (forgeRes && forgeRes.status !== 'INVALID') {
                        // Списание оселка
                        if (forgeRes.consumeReagentCount > 0 && sess.anvilReagent) {
                            sess.anvilReagent.shrink(forgeRes.consumeReagentCount);
                            if (sess.anvilReagent.isEmpty()) sess.anvilReagent = null;
                        }
                        // Списание эгиды при поглощении
                        if (forgeRes.consumeAegis && sess.anvilAegis) {
                            sess.anvilAegis.shrink(1);
                            if (sess.anvilAegis.isEmpty()) sess.anvilAegis = null;
                        }

                        sess.anvilResult = forgeRes.resultGear;
                        sess.anvilGear = null;

                        let bx = player.x, by = player.y, bz = player.z;
                        if (forgeRes.status === 'SUCCESS') {
                            player.server.runCommandSilent(`particle minecraft:wax_off ${bx} ${by + 1.2} ${bz} 0.4 0.4 0.4 0.05 30`);
                            player.sendSystemMessage(Text.of(`§a${forgeRes.message}`));
                        } else if (forgeRes.status === 'FAIL_SAVED_BY_AEGIS') {
                            player.server.runCommandSilent(`particle minecraft:enchanted_hit ${bx} ${by + 1.2} ${bz} 0.4 0.4 0.4 0.1 35`);
                            player.sendSystemMessage(Text.of(`§6${forgeRes.message}`));
                        } else {
                            player.server.runCommandSilent(`particle minecraft:smoke ${bx} ${by + 1.1} ${bz} 0.3 0.3 0.3 0.02 20`);
                            player.sendSystemMessage(Text.of(`§c${forgeRes.message}`));
                        }

                        openUnifiedWorkshopGUI(player, 4, sess.stationPos);
                    } else {
                        player.sendSystemMessage(Text.of('§cОшибка выполнения операции в ElyriumForgeAPI.'));
                    }
                };
            });
        }

        // ----------------------------------------------------------------------
        // ТАБ 5: 🛠 [ ОРУЖЕЙНЫЙ СТОЛ - БОЕВЫЕ ИСКУССТВА & СОКЕТЫ ]
        // ----------------------------------------------------------------------
        else if (sess.tab === 5) {
            for (let y = 1; y < 6; y++) {
                for (let x = 0; x < 9; x++) {
                    gui.slot(x, y, s => { s.setItem(darkPane); s.leftClicked = () => {}; });
                }
            }

            // Инфо-шапка (X=4, Y=1)
            gui.slot(4, 1, s => {
                s.setItem(Item.of('minecraft:smithing_table').withCustomName(Text.of('§6🛠 [ ОРУЖЕЙНЫЙ СТОЛ: БОЕВЫЕ ИСКУССТВА & СОКЕТЫ ]')).withLore([
                    Text.of('§7Гравировка боевых приемов и инкрустация сокетов:'),
                    Text.of('§e• Слот I: Оружие (X=1, Y=2)'),
                    Text.of('§a• Слот 1: Врожденное искусство (ПКМ)'),
                    Text.of('§6• Слот 2: Второе искусство (клавиша [Z], Т2+)'),
                    Text.of('§5• Слот 3: Третье искусство (клавиша [X], Т5+)'),
                    Text.of('§b• Слот 4: Стихийная Инфузия (Камни Рангов I..IV)'),
                    Text.of('§d• Слот 5: Самоцветы Апофеоза'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§a▶ Кликните оружие в инвентаре снизу для установки.')
                ]));
                s.leftClicked = () => {};
            });

            let weapon = sess.benchWeapon;

            // СЛОТ I: ОРУЖИЕ (X=1, Y=2)
            gui.slot(1, 2, s => {
                if (weapon && !weapon.isEmpty()) {
                    s.setItem(weapon.copy().withLore([
                        Text.of('§8────────────────────────────────'),
                        Text.of('§e▶ Нажмите ЛКМ для возврата оружия в сумку')
                    ]));
                    s.leftClicked = () => {
                        player.give(weapon);
                        sess.benchWeapon = null;
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                        openUnifiedWorkshopGUI(player, 5, sess.stationPos);
                    };
                } else {
                    s.setItem(Item.of('minecraft:netherite_upgrade_smithing_template')
                        .withCustomName(Text.of('§6✦ [ СЛОТ I: ОРУЖИЕ ] ✦'))
                        .withLore([
                            Text.of('§7Установите боевое оружие для гравировки.'),
                            Text.of('§a▶ Кликните по оружию в сумке снизу!')
                        ]));
                    s.leftClicked = () => {};
                }
            });

            // СЛОТ 1: Врожденное Боевое Искусство (X=3, Y=2)
            gui.slot(3, 2, s => {
                if (weapon && !weapon.isEmpty()) {
                    let art1 = (typeof getWeaponArtInSlot === 'function') ? getWeaponArtInSlot(weapon, 1) : null;
                    let info = (art1 && typeof WB_ART_INFO !== 'undefined') ? WB_ART_INFO[art1] : null;
                    s.setItem(Item.of('minecraft:iron_sword')
                        .withCustomName(Text.of(info ? `§a⚔ Слот 1: ${info.name}` : '§a⚔ Слот 1: Врожденное Искусство'))
                        .withLore([
                            Text.of(info ? `§7• Эффект: §f${info.desc}` : '§7Базовый прием класса оружия.'),
                            Text.of('§8────────────────────────────────'),
                            Text.of('§e▶ Активация: клавиша §b[ПКМ] §7(или [Shift+ПКМ] со щитом)'),
                            Text.of('§a✓ Встроено нативно во все оружие Элириума')
                        ]));
                } else {
                    s.setItem(Item.of('minecraft:gray_stained_glass_pane').withCustomName(Text.of('§8[Слот 1: Установите оружие]')));
                }
                s.leftClicked = () => {};
            });

            // СЛОТ 2: Второе Боевое Искусство [Z] (X=4, Y=2)
            gui.slot(4, 2, s => {
                if (weapon && !weapon.isEmpty()) {
                    let tier = (typeof getWeaponProgressionTier === 'function') ? getWeaponProgressionTier(weapon) : 1;
                    let hasS2 = (typeof hasSocket2 === 'function') ? hasSocket2(weapon) : true;
                    let art2 = (typeof getWeaponArtInSlot === 'function') ? getWeaponArtInSlot(weapon, 2) : null;
                    let info = (art2 && typeof WB_ART_INFO !== 'undefined') ? WB_ART_INFO[art2] : null;

                    if (tier < 2) {
                        s.setItem(Item.of('minecraft:barrier').withCustomName(Text.of('§c🔒 Слот 2: Требует Тир 2+ (Незерит)')).withLore([Text.of('§7Возвысьте оружие на вкладке [Горн]!')]));
                    } else if (!hasS2) {
                        s.setItem(Item.of('minecraft:chain').withCustomName(Text.of('§e🔒 Слот 2: Сокет закрыт')).withLore([Text.of('§7Пробейте сокет Резцом Оружейника!')]));
                    } else if (info) {
                        s.setItem(Item.of('kubejs:martial_tablet_lightning_thrust').withCustomName(Text.of(`§d💎 Слот 2: §e${info.name}`)).withLore([
                            Text.of(`§7• Эффект: §f${info.desc}`),
                            Text.of('§8────────────────────────────────'),
                            Text.of('§e▶ Активация: клавиша §b[Z]'),
                            Text.of('§a▶ Нажмите сюда для извлечения скрижали в сумку')
                        ]));
                        s.leftClicked = () => {
                            if (typeof getTabletIdForArt === 'function') {
                                let tabId = getTabletIdForArt(art2);
                                player.give(Item.of(tabId));
                                let gTag = (typeof getSafeItemCustomData === 'function') ? getSafeItemCustomData(weapon) : null;
                                if (gTag) {
                                    gTag.remove('skd_art_2');
                                    gTag.remove('skd_art_2_rank');
                                    gTag.remove('elyrium_inscribed_art');
                                    if (typeof saveSafeItemCustomData === 'function') saveSafeItemCustomData(weapon, gTag);
                                }
                                player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                                player.sendSystemMessage(Text.of('§a✓ Скрижаль Слота 2 возвращена в сумку!'));
                                openUnifiedWorkshopGUI(player, 5, sess.stationPos);
                            }
                        };
                        return;
                    } else {
                        s.setItem(Item.of('minecraft:amethyst_shard').withCustomName(Text.of('§a✦ Слот 2: [ОТКРЫТЫЙ СОКЕТ] ✦')).withLore([
                            Text.of('§7Сокет готов к инкрустации скрижали.'),
                            Text.of('§e▶ Активация приема в бою: клавиша §b[Z]'),
                            Text.of('§a▶ Кликните Скрижаль в сумке снизу для установки!')
                        ]));
                    }
                } else {
                    s.setItem(Item.of('minecraft:gray_stained_glass_pane').withCustomName(Text.of('§8[Слот 2: Установите оружие]')));
                }
                s.leftClicked = () => {};
            });

            // СЛОТ 3: Третье Боевое Искусство [X] (X=5, Y=2)
            gui.slot(5, 2, s => {
                if (weapon && !weapon.isEmpty()) {
                    let tier = (typeof getWeaponProgressionTier === 'function') ? getWeaponProgressionTier(weapon) : 1;
                    let hasS3 = (typeof hasSocket3 === 'function') ? hasSocket3(weapon) : false;
                    let art3 = (typeof getWeaponArtInSlot === 'function') ? getWeaponArtInSlot(weapon, 3) : null;
                    let info = (art3 && typeof WB_ART_INFO !== 'undefined') ? WB_ART_INFO[art3] : null;

                    if (tier < 5) {
                        s.setItem(Item.of('minecraft:barrier').withCustomName(Text.of('§c🔒 Слот 3: Требует Тир 5+ (Eternal Starlight)')).withLore([Text.of('§7Возвысьте оружие до Тира 5!')]));
                    } else if (!hasS3) {
                        s.setItem(Item.of('minecraft:chain').withCustomName(Text.of('§e🔒 Слот 3: Сокет закрыт')).withLore([Text.of('§7Пробейте сокет Резцом Оружейника!')]));
                    } else if (info) {
                        s.setItem(Item.of('kubejs:martial_tablet_holy_blade').withCustomName(Text.of(`§5🌟 Слот 3: §e${info.name}`)).withLore([
                            Text.of(`§7• Эффект: §f${info.desc}`),
                            Text.of('§8────────────────────────────────'),
                            Text.of('§e▶ Активация: клавиша §b[X]'),
                            Text.of('§a▶ Нажмите сюда для извлечения скрижали в сумку')
                        ]));
                        s.leftClicked = () => {
                            if (typeof getTabletIdForArt === 'function') {
                                let tabId = getTabletIdForArt(art3);
                                player.give(Item.of(tabId));
                                let gTag = (typeof getSafeItemCustomData === 'function') ? getSafeItemCustomData(weapon) : null;
                                if (gTag) {
                                    gTag.remove('skd_art_3');
                                    gTag.remove('skd_art_3_rank');
                                    if (typeof saveSafeItemCustomData === 'function') saveSafeItemCustomData(weapon, gTag);
                                }
                                player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                                player.sendSystemMessage(Text.of('§a✓ Скрижаль Слота 3 возвращена в сумку!'));
                                openUnifiedWorkshopGUI(player, 5, sess.stationPos);
                            }
                        };
                        return;
                    } else {
                        s.setItem(Item.of('minecraft:amethyst_shard').withCustomName(Text.of('§a✦ Слот 3: [ОТКРЫТЫЙ СОКЕТ] ✦')).withLore([
                            Text.of('§7Сокет готов к инкрустации скрижали.'),
                            Text.of('§e▶ Активация приема в бою: клавиша §b[X]'),
                            Text.of('§a▶ Кликните Скрижаль в сумке снизу для установки!')
                        ]));
                    }
                } else {
                    s.setItem(Item.of('minecraft:gray_stained_glass_pane').withCustomName(Text.of('§8[Слот 3: Установите оружие]')));
                }
                s.leftClicked = () => {};
            });

            // СЛОТ 4: Стихийная Инфузия (X=6, Y=2)
            gui.slot(6, 2, s => {
                if (weapon && !weapon.isEmpty()) {
                    let elem = (typeof getElementalInfusion === 'function') ? getElementalInfusion(weapon) : null;
                    if (elem) {
                        let stoneId = (typeof getElementalStoneId === 'function') ? getElementalStoneId(weapon) : ('kubejs:elemental_stone_' + elem);
                        s.setItem(Item.of(stoneId).withCustomName(Text.of(`§e🔮 Слот 4: Стихия [${elem}]`)).withLore([
                            Text.of('§7• Конверсия урона в чистую магию стихии.'),
                            Text.of('§8────────────────────────────────'),
                            Text.of('§a▶ Нажмите ЛКМ для извлечения камня в сумку!')
                        ]));
                        s.leftClicked = () => {
                            player.give(Item.of(stoneId));
                            let gTag = (typeof getSafeItemCustomData === 'function') ? getSafeItemCustomData(weapon) : null;
                            if (gTag) {
                                gTag.remove('skd_elemental_infusion');
                                gTag.remove('skd_elemental_stone');
                                gTag.remove('skd_elemental_rank');
                                if (typeof saveSafeItemCustomData === 'function') saveSafeItemCustomData(weapon, gTag);
                            }
                            player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                            player.sendSystemMessage(Text.of('§a✓ Камень Стихии возвращен в сумку!'));
                            openUnifiedWorkshopGUI(player, 5, sess.stationPos);
                        };
                        return;
                    } else {
                        s.setItem(Item.of('minecraft:echo_shard').withCustomName(Text.of('§b🔮 Слот 4: [Стихийный Сокет: Пусто]')).withLore([
                            Text.of('§7Инкрустируйте Камень Стихии (Ранги I..IV).'),
                            Text.of('§a▶ Кликните Камень Стихии в сумке снизу!')
                        ]));
                    }
                } else {
                    s.setItem(Item.of('minecraft:gray_stained_glass_pane').withCustomName(Text.of('§8[Слот 4: Установите оружие]')));
                }
                s.leftClicked = () => {};
            });

            // СЛОТ 5: Самоцветы Апофеоза (X=7, Y=2)
            gui.slot(7, 2, s => {
                if (weapon && !weapon.isEmpty()) {
                    let apothSockets = 0;
                    try {
                        let rawGear = weapon.getItemStack ? weapon.getItemStack() : weapon;
                        if (typeof WB_SocketHelper !== 'undefined' && WB_SocketHelper) {
                            apothSockets = WB_SocketHelper.getSockets(rawGear);
                        }
                    } catch (e) {}

                    s.setItem(Item.of('minecraft:amethyst_cluster')
                        .withCustomName(Text.of(`§d💎 Слот 5: Самоцветы [Гнезд: ${apothSockets}]`))
                        .withLore([
                            Text.of(`§7Открыто гнезд под самоцветы Апофеоза: §a${apothSockets}`),
                            Text.of('§8────────────────────────────────'),
                            Text.of('§7Инкрустируйте самоцветы через меню инвентаря Apotheosis.')
                        ]));
                } else {
                    s.setItem(Item.of('minecraft:gray_stained_glass_pane').withCustomName(Text.of('§8[Слот 5: Установите оружие]')));
                }
                s.leftClicked = () => {};
            });

            // КНОПКА «ПРОБИТЬ СОКЕТ РЕЗЦОМ» (X=4, Y=3)
            gui.slot(4, 3, s => {
                s.setItem(Item.of('minecraft:chiseled_stone_bricks')
                    .withCustomName(Text.of('§6⚒ [ Пробить Сокет Резцом Оружейника ]'))
                    .withLore([
                        Text.of('§7100% гарантия мастера без риска поломки оружия!'),
                        Text.of('§e• Слот 2: Резец + Незеритовый/Пепельный слиток (Т2+)'),
                        Text.of('§b• Слот 3: Резец + Звездный/Люминаритовый слиток (Т5+)'),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§a▶ Нажмите ЛКМ для попытки пробития следующего сокета.')
                    ]));
                s.leftClicked = () => {
                    if (!weapon || weapon.isEmpty()) {
                        player.sendSystemMessage(Text.of('§c[Верстак] Сначала установите оружие в Слот I!'));
                        player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                        return;
                    }
                    let tier = (typeof getWeaponProgressionTier === 'function') ? getWeaponProgressionTier(weapon) : 1;
                    let hasS2 = (typeof hasSocket2 === 'function') ? hasSocket2(weapon) : false;
                    let hasS3 = (typeof hasSocket3 === 'function') ? hasSocket3(weapon) : false;

                    let targetSlot = null;
                    if (tier >= 2 && !hasS2) targetSlot = 2;
                    else if (tier >= 5 && !hasS3) targetSlot = 3;

                    if (!targetSlot) {
                        player.sendSystemMessage(Text.of('§e[Верстак] Для данного оружия все сокеты текущей эпохи уже открыты!'));
                        return;
                    }

                    // Проверяем наличие Резца и слитков в сумке игрока
                    let chiselCount = countPlayerItems(player, 'kubejs:weapon_chisel');
                    if (chiselCount < 1) {
                        player.sendSystemMessage(Text.of('§c[Верстак] В сумке не найден Резец Оружейника (kubejs:weapon_chisel)!'));
                        player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                        return;
                    }

                    let requiredMat = (targetSlot === 2) ? 'minecraft:netherite_ingot' : 'eternal_starlight:aethersent_ingot';
                    let matName = (targetSlot === 2) ? 'Незеритовый / Пепельный слиток' : 'Звездный / Люминаритовый слиток';
                    let hasMat = (targetSlot === 2) 
                        ? (countPlayerItems(player, 'minecraft:netherite_ingot') > 0 || countPlayerItems(player, 'skd:cinder_alloy_ingot') > 0)
                        : (countPlayerItems(player, 'eternal_starlight:aethersent_ingot') > 0 || countPlayerItems(player, 'kubejs:ascension_catalyst_t5') > 0);

                    if (!hasMat) {
                        player.sendSystemMessage(Text.of(`§c[Верстак] Для Слота ${targetSlot} требуется ${matName} в инвентаре!`));
                        player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                        return;
                    }

                    // Списание 1 слитка
                    if (targetSlot === 2) {
                        if (countPlayerItems(player, 'minecraft:netherite_ingot') > 0) deductPlayerItems(player, 'minecraft:netherite_ingot', 1);
                        else deductPlayerItems(player, 'skd:cinder_alloy_ingot', 1);
                    } else {
                        if (countPlayerItems(player, 'eternal_starlight:aethersent_ingot') > 0) deductPlayerItems(player, 'eternal_starlight:aethersent_ingot', 1);
                        else deductPlayerItems(player, 'kubejs:ascension_catalyst_t5', 1);
                    }

                    // Запись сокета в оружие
                    let gTag = (typeof getOrCreateSafeCustomData === 'function') ? getOrCreateSafeCustomData(weapon) : null;
                    if (gTag) {
                        gTag.putBoolean('skd_socket_' + targetSlot, true);
                        gTag.putInt('skd_socket_' + targetSlot, 1);
                        let curSockets = gTag.getInt('skd_sockets') || 0;
                        gTag.putInt('skd_sockets', Math.max(curSockets, targetSlot - 1));
                        if (typeof saveSafeItemCustomData === 'function') saveSafeItemCustomData(weapon, gTag);
                    }

                    // Апофеоз гнездо
                    try {
                        let rawGear = weapon.getItemStack ? weapon.getItemStack() : weapon;
                        if (typeof WB_SocketHelper !== 'undefined' && WB_SocketHelper) {
                            let oldSockets = WB_SocketHelper.getSockets(rawGear);
                            WB_SocketHelper.setSockets(rawGear, oldSockets + 1);
                        }
                    } catch (eApoth) {}

                    player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 1.0 1.2`);
                    player.server.runCommandSilent(`particle minecraft:wax_off ~ ~1.2 ~ 0.4 0.4 0.4 0.05 35`);
                    player.sendSystemMessage(Text.of(`§a✦ [Верстак] Боевой Слот ${targetSlot} успешно пробит со 100% гарантией мастера! ✦`));

                    openUnifiedWorkshopGUI(player, 5, sess.stationPos);
                };
            });
        }

        // ======================================================================
        // ИНТЕЛЛЕКТУАЛЬНЫЙ 1-КЛИК РОУТИНГ ИЗ ИНВЕНТАРЯ ИГРОКА (gui.inventoryClicked)
        // ======================================================================
        gui.inventoryClicked = event => {
            let clickedItem = event.item;
            if (!clickedItem || clickedItem.isEmpty() || clickedItem.id === 'minecraft:air') return;

            // ------------------------------------------------------------------
            // ТАБ 0: КОВКА НА ВЕРСТАКЕ -> ПОМЕЩЕНИЕ В ПЕРВЫЙ СВОБОДНЫЙ ИЗ 6 СЛОТОВ
            // ------------------------------------------------------------------
            if (sess.tab === 0) {
                let emptyIdx = -1;
                for (let i = 0; i < 6; i++) {
                    if (!sess.forgeIngredients[i] || sess.forgeIngredients[i].isEmpty()) {
                        emptyIdx = i;
                        break;
                    }
                }

                if (emptyIdx !== -1) {
                    let toPut = clickedItem.copy();
                    sess.forgeIngredients[emptyIdx] = toPut;
                    event.setItem(Item.of('minecraft:air'));
                    player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openUnifiedWorkshopGUI(player, 0, sess.stationPos);
                } else {
                    player.sendSystemMessage(Text.of('§e[Ковка] Все 6 слотов сырья заняты! Извлеките лишнее.'));
                }
                return;
            }

            // ------------------------------------------------------------------
            // ТАБ 1: РЕМОНТ
            // ------------------------------------------------------------------
            if (sess.tab === 1) {
                // Если кликнули поврежденную вещь -> Слот экипировки
                if (clickedItem.isDamageableItem() && clickedItem.damageValue > 0) {
                    if (sess.repairGear && !sess.repairGear.isEmpty()) player.give(sess.repairGear);
                    sess.repairGear = clickedItem.split(1);
                    player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openUnifiedWorkshopGUI(player, 1, sess.stationPos);
                    return;
                }
                // Если кликнули слиток -> Слот слитков
                let id = String(clickedItem.id).toLowerCase();
                if (id.includes('ingot') || id.includes('diamond') || id.includes('leather')) {
                    if (sess.repairIngots && !sess.repairIngots.isEmpty()) player.give(sess.repairIngots);
                    sess.repairIngots = clickedItem.copy();
                    event.setItem(Item.of('minecraft:air'));
                    player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openUnifiedWorkshopGUI(player, 1, sess.stationPos);
                    return;
                }
            }

            // ------------------------------------------------------------------
            // ТАБ 2: ОЧАГ
            // ------------------------------------------------------------------
            if (sess.tab === 2) {
                // Топливо -> Слот топлива (X=3, Y=3)
                if (isFuelItem(clickedItem)) {
                    if (sess.hearthFuelInput && !sess.hearthFuelInput.isEmpty()) player.give(sess.hearthFuelInput);
                    sess.hearthFuelInput = clickedItem.copy();
                    event.setItem(Item.of('minecraft:air'));
                    player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openUnifiedWorkshopGUI(player, 2, sess.stationPos);
                    return;
                }
                // Сырье плавки -> Слот сырья (X=3, Y=1)
                if (getHearthSmeltRecipe(clickedItem)) {
                    if (sess.hearthSmeltInput && !sess.hearthSmeltInput.isEmpty()) player.give(sess.hearthSmeltInput);
                    sess.hearthSmeltInput = clickedItem.copy();
                    event.setItem(Item.of('minecraft:air'));
                    player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openUnifiedWorkshopGUI(player, 2, sess.stationPos);
                    return;
                }
            }

            // ------------------------------------------------------------------
            // ТАБ 3: ГОРН (ВОЗВЫШЕНИЕ)
            // ------------------------------------------------------------------
            if (sess.tab === 3) {
                let id = String(clickedItem.id);
                if (id.startsWith('kubejs:ascension_catalyst_t') || id === 'kubejs:tier_upgrade_template') {
                    if (sess.ascendCatalyst && !sess.ascendCatalyst.isEmpty()) player.give(sess.ascendCatalyst);
                    sess.ascendCatalyst = clickedItem.copy();
                    event.setItem(Item.of('minecraft:air'));
                    player.server.runCommandSilent(`playsound minecraft:item.firecharge.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                    openUnifiedWorkshopGUI(player, 3, sess.stationPos);
                    return;
                }
                // Экипировка
                if (clickedItem.isDamageableItem() || (typeof isAnvilGear === 'function' && isAnvilGear(clickedItem))) {
                    if (sess.ascendGear && !sess.ascendGear.isEmpty()) player.give(sess.ascendGear);
                    sess.ascendGear = clickedItem.split(1);
                    player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openUnifiedWorkshopGUI(player, 3, sess.stationPos);
                    return;
                }
            }

            // ------------------------------------------------------------------
            // ТАБ 4: НАКОВАЛЬНЯ (ЗАТОЧКА)
            // ------------------------------------------------------------------
            if (sess.tab === 4) {
                let id = String(clickedItem.id);
                if (id === 'kubejs:smithing_aegis') {
                    if (sess.anvilAegis && !sess.anvilAegis.isEmpty()) player.give(sess.anvilAegis);
                    sess.anvilAegis = clickedItem.copy();
                    event.setItem(Item.of('minecraft:air'));
                    player.server.runCommandSilent(`playsound minecraft:item.shield.block player ${player.username} ~ ~ ~ 0.8 1.4`);
                    openUnifiedWorkshopGUI(player, 4, sess.stationPos);
                    return;
                }
                if (id.startsWith('kubejs:smithing_stone_')) {
                    if (sess.anvilReagent && !sess.anvilReagent.isEmpty()) player.give(sess.anvilReagent);
                    sess.anvilReagent = clickedItem.copy();
                    event.setItem(Item.of('minecraft:air'));
                    player.server.runCommandSilent(`playsound minecraft:item.firecharge.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                    openUnifiedWorkshopGUI(player, 4, sess.stationPos);
                    return;
                }
                if (clickedItem.isDamageableItem()) {
                    if (sess.anvilGear && !sess.anvilGear.isEmpty()) player.give(sess.anvilGear);
                    sess.anvilGear = clickedItem.split(1);
                    player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openUnifiedWorkshopGUI(player, 4, sess.stationPos);
                    return;
                }
            }

            // ------------------------------------------------------------------
            // ТАБ 5: ОРУЖЕЙНЫЙ СТОЛ
            // ------------------------------------------------------------------
            if (sess.tab === 5) {
                let id = String(clickedItem.id);
                // Скрижаль
                if (id.startsWith('kubejs:martial_tablet_')) {
                    let gear = sess.benchWeapon;
                    if (gear && !gear.isEmpty()) {
                        let artId = (typeof extractTabletArtId === 'function') ? extractTabletArtId(clickedItem) : null;
                        let rank = (typeof extractTabletRank === 'function') ? extractTabletRank(clickedItem) : 1;
                        let hasS2 = (typeof hasSocket2 === 'function') ? hasSocket2(gear) : true;
                        let hasS3 = (typeof hasSocket3 === 'function') ? hasSocket3(gear) : false;
                        let art2 = (typeof getWeaponArtInSlot === 'function') ? getWeaponArtInSlot(gear, 2) : null;
                        let art3 = (typeof getWeaponArtInSlot === 'function') ? getWeaponArtInSlot(gear, 3) : null;

                        let targetSlot = null;
                        if (hasS2 && !art2) targetSlot = 2;
                        else if (hasS3 && !art3) targetSlot = 3;

                        if (targetSlot && artId) {
                            clickedItem.shrink(1);
                            let gTag = (typeof getOrCreateSafeCustomData === 'function') ? getOrCreateSafeCustomData(gear) : null;
                            if (gTag) {
                                gTag.putString('skd_art_' + targetSlot, artId);
                                gTag.putInt('skd_art_' + targetSlot + '_rank', rank);
                                if (targetSlot === 2) gTag.putString('elyrium_inscribed_art', artId);
                                if (typeof saveSafeItemCustomData === 'function') saveSafeItemCustomData(gear, gTag);
                            }
                            player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                            player.sendSystemMessage(Text.of(`§a✓ Скрижаль инкрустирована в Слот ${targetSlot}!`));
                            openUnifiedWorkshopGUI(player, 5, sess.stationPos);
                            return;
                        }
                    }
                }
                // Стихийный камень
                if (id.startsWith('kubejs:elemental_stone_')) {
                    let gear = sess.benchWeapon;
                    if (gear && !gear.isEmpty()) {
                        let info = (typeof WB_ELEMENTAL_STONES !== 'undefined') ? WB_ELEMENTAL_STONES[id] : null;
                        if (info) {
                            clickedItem.shrink(1);
                            let gTag = (typeof getOrCreateSafeCustomData === 'function') ? getOrCreateSafeCustomData(gear) : null;
                            if (gTag) {
                                gTag.putString('skd_elemental_infusion', info.elem);
                                gTag.putString('skd_elemental_stone', id);
                                gTag.putInt('skd_elemental_rank', info.rank || 1);
                                if (typeof saveSafeItemCustomData === 'function') saveSafeItemCustomData(gear, gTag);
                            }
                            player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                            player.sendSystemMessage(Text.of(`§a✓ Инфузия Стихии ${info.name} успешно инкрустирована!`));
                            openUnifiedWorkshopGUI(player, 5, sess.stationPos);
                            return;
                        }
                    }
                }
                // Оружие
                if (typeof isWeaponItem === 'function' ? isWeaponItem(clickedItem) : clickedItem.hasTag('minecraft:swords')) {
                    if (sess.benchWeapon && !sess.benchWeapon.isEmpty()) player.give(sess.benchWeapon);
                    sess.benchWeapon = clickedItem.split(1);
                    player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openUnifiedWorkshopGUI(player, 5, sess.stationPos);
                    return;
                }
            }
        };
    });
}

// ------------------------------------------------------------------------------
// ОБРАБОТЧИКИ КЛИКОВ ПКМ ДЛЯ ВСЕХ 5 БЛОКОВ КУЗНИЦЫ
// ------------------------------------------------------------------------------

// 1. Верстак Оружейника -> Таб 0 (Ковка)
BlockEvents.rightClicked('kubejs:blacksmith_workbench', event => {
    let player = event.player;
    if (!player || player.level.isClientSide()) return;
    let handStr = event.hand ? String(event.hand) : 'MAIN_HAND';
    if (!handStr.includes('MAIN')) return;

    event.cancel();
    openUnifiedWorkshopGUI(player, 0, event.block.pos);
    player.server.runCommandSilent(`playsound minecraft:block.wood.hit player ${player.username} ~ ~ ~ 0.8 1.0`);
});

// 2. Кузнечный Очаг -> Вынесен в отдельный не-сундучный станок hearth_smeltery_gui.js (v1.0)
// BlockEvents.rightClicked handled autonomously in hearth_smeltery_gui.js

// 3. Адский Горн -> Таб 3 (Горн - Возвышение)
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
    openUnifiedWorkshopGUI(player, 3, event.block.pos);
});

// 4. Наковальня Бездны -> Таб 4 (Наковальня - Заточка)
BlockEvents.rightClicked('kubejs:void_anvil', event => {
    let player = event.player;
    if (!player || player.level.isClientSide()) return;
    let handStr = event.hand ? String(event.hand) : 'MAIN_HAND';
    if (!handStr.includes('MAIN')) return;

    event.cancel();
    openUnifiedWorkshopGUI(player, 4, event.block.pos);
    player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.8 1.0`);
});

// 5. Оружейный Стол -> Таб 5 (Оружейный Стол - Боевые Искусства)
BlockEvents.rightClicked('kubejs:weapon_bench', event => {
    let player = event.player;
    if (!player || player.level.isClientSide()) return;
    let handStr = event.hand ? String(event.hand) : 'MAIN_HAND';
    if (!handStr.includes('MAIN')) return;

    event.cancel();
    openUnifiedWorkshopGUI(player, 5, event.block.pos);
    player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.8 1.0`);
});

// Совместимость с вызовами legacy GUI
function openBlacksmithGUI(player, stationPos) {
    openUnifiedWorkshopGUI(player, 0, stationPos);
}

function openHearthSmelterGUI(player, stationPos) {
    openUnifiedWorkshopGUI(player, 2, stationPos);
}

// Очистка при выходе из мира
PlayerEvents.loggedOut(event => {
    if (event.player) clearAndRefundBlacksmithSession(event.player, true);
});

PlayerEvents.inventoryClosed(event => {
    if (event.player) clearAndRefundBlacksmithSession(event.player, false);
});
