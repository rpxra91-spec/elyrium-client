// ==============================================================================
// ⚒️ ELYRIUM RPG: BLACKSMITH WORKBENCH CATALOG CRAFTING & METALLURGY GUI
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// Clean Separation of Metallurgy & Forging:
// 1. Blacksmith Hearth (Кузнечный Очаг / Меха):
//    - Metallurgy station: smelts raw steel charges and ores into Workshop Metal Buffer.
//    - Allows depositing / withdrawing steel, iron, and copper ingots.
//    - One-click batch smelting of charges & ores with fuel consumption.
// 2. Blacksmith Workbench (Верстак Оружейника):
//    - Forging catalog: 4 dedicated tabs:
//      Tab 0: ⚔ [ Клинки ] (15 видов оружия SimplySwords)
//      Tab 1: 🛡 [ Доспехи ] (Т1: Стальной Рыцарь, Разведчик, Бригантина, Железный)
//      Tab 2: ⛏ [ Инструменты ] (Стальная Кирка [Т алмаз], топоры, лопаты, щит)
//      Tab 3: 🔧 [ Ремонт ] (Починка экипировки за металл; 50% с Очагом, 25% соло)
//    - Dual-Source Materials: Crafting & Repair check BOTH player inventory
//      AND the Workshop Metal Storage Buffer!
// 3. Custom GUI Overlay:
//    - Window opens with '\uE001§r' + title, displaying the custom bog oak & bronze
//      RPG overlay screen.
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
// WORKSHOP METAL STORAGE BUFFER SYSTEM (level.persistentData)
// ------------------------------------------------------------------------------

function getStationAnchorKey(station, fallbackPos) {
    if (station && station.line && station.line.length > 0) {
        let minPos = station.line[0];
        for (let i = 1; i < station.line.length; i++) {
            let p = station.line[i];
            if (p.x < minPos.x || (p.x === minPos.x && (p.y < minPos.y || (p.y === minPos.y && p.z < minPos.z)))) {
                minPos = p;
            }
        }
        return minPos.x + '_' + minPos.y + '_' + minPos.z;
    }
    if (fallbackPos) {
        return fallbackPos.x + '_' + fallbackPos.y + '_' + fallbackPos.z;
    }
    return 'default_station';
}

function getWorkshopBuffer(level, stationPos) {
    if (!level || !stationPos) return { steel: 0, iron: 0, copper: 0 };
    let station = (typeof getBlacksmithStationInfo === 'function') 
        ? getBlacksmithStationInfo(level, stationPos) 
        : null;
    let anchor = getStationAnchorKey(station, stationPos);

    if (!level.persistentData.blacksmithBuffers) {
        level.persistentData.blacksmithBuffers = {};
    }
    if (!level.persistentData.blacksmithBuffers[anchor]) {
        level.persistentData.blacksmithBuffers[anchor] = { steel: 0, iron: 0, copper: 0 };
    }
    let b = level.persistentData.blacksmithBuffers[anchor];
    if (typeof b.steel !== 'number') b.steel = 0;
    if (typeof b.iron !== 'number') b.iron = 0;
    if (typeof b.copper !== 'number') b.copper = 0;
    return b;
}

function countBufferIngots(level, stationPos, ingotId) {
    if (!level || !stationPos) return 0;
    let buf = getWorkshopBuffer(level, stationPos);
    let id = String(ingotId).toLowerCase();
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

function deductBufferIngots(level, stationPos, ingotId, needed) {
    if (!level || !stationPos || needed <= 0) return 0;
    let buf = getWorkshopBuffer(level, stationPos);
    let id = String(ingotId).toLowerCase();
    let type = 'iron';
    if (id.includes('steel')) type = 'steel';
    else if (id.includes('copper')) type = 'copper';

    let cur = buf[type] || 0;
    let take = Math.min(cur, needed);
    buf[type] = Math.max(0, cur - take);
    return take;
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

// Dual-source material check: Player Inventory + Workshop Buffer
function getAvailableIngotsBS(player, stationPos, ingotId, hasHearth) {
    let invCount = countPlayerItemsBS(player, ingotId);
    let bufCount = hasHearth ? countBufferIngots(player.level, stationPos, ingotId) : 0;
    return {
        total: invCount + bufCount,
        inv: invCount,
        buffer: bufCount
    };
}

// Dual-source deduction: Deduct from Buffer first, then from Player Inventory
function deductCombinedIngotsBS(player, stationPos, ingotId, needed, hasHearth) {
    let remain = needed;
    if (hasHearth) {
        let takenFromBuf = deductBufferIngots(player.level, stationPos, ingotId, remain);
        remain -= takenFromBuf;
    }
    if (remain > 0) {
        deductPlayerItemsBS(player, ingotId, remain);
    }
}

// Fuel handling for Smelter
function countPlayerFuelBS(player) {
    if (!player) return 0;
    let inv = player.inventory;
    let total = 0;
    for (let i = 0; i < inv.size; i++) {
        let st = inv.getItem(i);
        if (!st || st.isEmpty()) continue;
        let id = String(st.id);
        if (id === 'minecraft:coal' || id === 'minecraft:charcoal') {
            total += st.count;
        } else if (id === 'minecraft:coal_block') {
            total += st.count * 9;
        } else if (id === 'minecraft:blaze_rod') {
            total += st.count * 3;
        }
    }
    return total;
}

function deductPlayerFuelBS(player, amount) {
    if (!player || amount <= 0) return true;
    let remain = amount;
    let inv = player.inventory;

    // 1. Consume coal & charcoal first
    for (let i = 0; i < inv.size && remain > 0; i++) {
        let st = inv.getItem(i);
        if (!st || st.isEmpty()) continue;
        let id = String(st.id);
        if (id === 'minecraft:coal' || id === 'minecraft:charcoal') {
            let take = Math.min(st.count, remain);
            st.shrink(take);
            remain -= take;
            if (st.isEmpty() || st.count <= 0) {
                try { inv.setItem(i, Item.of('minecraft:air')); } catch (e) {}
            }
        }
    }

    // 2. Consume coal blocks if needed (giving back change in coal)
    for (let i = 0; i < inv.size && remain > 0; i++) {
        let st = inv.getItem(i);
        if (!st || st.isEmpty()) continue;
        let id = String(st.id);
        if (id === 'minecraft:coal_block') {
            while (st.count > 0 && remain > 0) {
                st.shrink(1);
                if (remain <= 9) {
                    let refund = 9 - remain;
                    remain = 0;
                    if (refund > 0) player.give(Item.of('minecraft:coal', refund));
                } else {
                    remain -= 9;
                }
            }
            if (st.isEmpty() || st.count <= 0) {
                try { inv.setItem(i, Item.of('minecraft:air')); } catch (e) {}
            }
        }
    }

    // 3. Consume blaze rods if needed
    for (let i = 0; i < inv.size && remain > 0; i++) {
        let st = inv.getItem(i);
        if (!st || st.isEmpty()) continue;
        let id = String(st.id);
        if (id === 'minecraft:blaze_rod') {
            while (st.count > 0 && remain > 0) {
                st.shrink(1);
                remain = Math.max(0, remain - 3);
            }
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
            desc: 'Стандартная кираса пехотинца Верхнего Мира.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 8,
            extra: null, extraName: null, extraCount: 0
        },
        {
            id: 'minecraft:iron_leggings',
            name: '§fЖелезные Поножи',
            desc: 'Стандартные защитные поножи пехотинца Верхнего Мира.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 7,
            extra: null, extraName: null, extraCount: 0
        },
        {
            id: 'minecraft:iron_boots',
            name: '§fЖелезные Сапоги',
            desc: 'Стандартные кованые сапоги пехотинца Верхнего Мира.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 4,
            extra: null, extraName: null, extraCount: 0
        },

        // Бригантина Наемника (Damage Dealer)
        {
            id: 'kubejs:brigandine_helmet',
            name: '§6Шлем Наемника (Бригантина)',
            desc: 'ДД-Сет: +8% Силы атаки, +5% Шанса крита. Легкий перекат.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 4,
            extra: 'minecraft:leather', extraName: 'Кожаная Подкладка', extraCount: 2
        },
        {
            id: 'kubejs:brigandine_chestplate',
            name: '§6Бригантина Наемника',
            desc: 'ДД-Сет: +15% Силы атаки, +10% Шанса крита. Легкий перекат.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 7,
            extra: 'minecraft:leather', extraName: 'Кожаная Подкладка', extraCount: 4
        },
        {
            id: 'kubejs:brigandine_leggings',
            name: '§6Поножи Наемника (Бригантина)',
            desc: 'ДД-Сет: +10% Силы атаки, +5% Шанса крита. Легкий перекат.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 6,
            extra: 'minecraft:leather', extraName: 'Кожаная Подкладка', extraCount: 3
        },
        {
            id: 'kubejs:brigandine_boots',
            name: '§6Сапоги Наемника (Бригантина)',
            desc: 'ДД-Сет: +5% Скорости бега, +5% Шанса крита. Легкий перекат.',
            ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', baseIngots: 3,
            extra: 'minecraft:leather', extraName: 'Кожаная Подкладка', extraCount: 2
        },

        // Кожано-Медный Сет Разведчика (Agility / Speed)
        {
            id: 'kubejs:scout_hood',
            name: '§aКапюшон Разведчика',
            desc: 'Ловкость: +8% Скорости атаки, Fast Roll, бонус к скрытности.',
            ingot: 'minecraft:copper_ingot', ingotName: 'Медный Слиток', baseIngots: 3,
            extra: 'minecraft:leather', extraName: 'Дубленая Кожа', extraCount: 3
        },
        {
            id: 'kubejs:scout_tunic',
            name: '§aКуртка Разведчика',
            desc: 'Ловкость: +12% Скорости атаки, Fast Roll, бонус к выносливости.',
            ingot: 'minecraft:copper_ingot', ingotName: 'Медный Слиток', baseIngots: 6,
            extra: 'minecraft:leather', extraName: 'Дубленая Кожа', extraCount: 5
        },
        {
            id: 'kubejs:scout_pants',
            name: '§aШтаны Разведчика',
            desc: 'Ловкость: +10% Скорости бега, Fast Roll, снижение расхода сил.',
            ingot: 'minecraft:copper_ingot', ingotName: 'Медный Слиток', baseIngots: 5,
            extra: 'minecraft:leather', extraName: 'Дубленая Кожа', extraCount: 4
        },
        {
            id: 'kubejs:scout_boots',
            name: '§aСапоги Разведчика',
            desc: 'Ловкость: Бесшумный шаг, Fast Roll, +10% Дистанции уклонения.',
            ingot: 'minecraft:copper_ingot', ingotName: 'Медный Слиток', baseIngots: 3,
            extra: 'minecraft:leather', extraName: 'Дубленая Кожа', extraCount: 2
        },

        // Стальной Сет Рыцаря Границы (Heavy Tank)
        {
            id: 'kubejs:steel_knight_helmet',
            name: '§9Шлем Рыцаря Границы',
            desc: 'Тяжелый Танк: Fat Roll, +150 Стойкости, иммунитет к оглушению.',
            ingot: 'kubejs:steel_ingot', ingotName: 'Стальной Слиток', baseIngots: 5,
            extra: 'minecraft:diamond', extraName: 'Алмазное Усиление', extraCount: 1
        },
        {
            id: 'kubejs:steel_knight_chestplate',
            name: '§9Латы Рыцаря Границы',
            desc: 'Тяжелый Танк: Fat Roll, +300 Стойкости, 50% Отражения урона.',
            ingot: 'kubejs:steel_ingot', ingotName: 'Стальной Слиток', baseIngots: 8,
            extra: 'minecraft:diamond', extraName: 'Алмазное Усиление', extraCount: 2
        },
        {
            id: 'kubejs:steel_knight_leggings',
            name: '§9Поножи Рыцаря Границы',
            desc: 'Тяжелый Танк: Fat Roll, +200 Стойкости, сопротивление отбрасыванию.',
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
// OPEN BLACKSMITH WORKBENCH GUI (CHEST MENU 6 ROWS)
// ------------------------------------------------------------------------------
function openBlacksmithGUI(player, stationPos) {
    let level = player.level;
    let station = (typeof getBlacksmithStationInfo === 'function') 
        ? getBlacksmithStationInfo(level, stationPos) 
        : { hasHearth: false, hasWorkbench: true, hasCrucible: false, hasAnvil: false, isGrandForge: false, line: [] };
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

    let fullTitle = '\uE001§r' + guiTitle;

    player.openChestGUI(Text.of(fullTitle), 6, gui => {
        gui.playerSlots = true;
        gui.closed = () => {
            clearBlacksmithSession(player);
        };

        // ======================================================================
        // ROW 0: ВЕРХНИЙ КАРНИЗ И НАВИГАЦИЯ ВКЛАДОК
        // ======================================================================

        // Slot 0: Монитор статуса станции & накопителя металлов
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

            let lore = [
                Text.of(stationStatus),
                Text.of('§8────────────────────────────────'),
                Text.of('§a✓ Верстак Оружейника: Активен'),
                Text.of(hearthText),
                Text.of(crucibleText),
                Text.of(anvilText),
                Text.of('§8────────────────────────────────')
            ];

            if (session.hasHearth) {
                let buf = getWorkshopBuffer(level, stationPos);
                lore.push(Text.of('§6📦 Металлический Буфер Мастерской:'));
                lore.push(Text.of(`  §9• Сталь: §f${buf.steel || 0} §7шт.`));
                lore.push(Text.of(`  §f• Железо: §f${buf.iron || 0} §7шт.`));
                lore.push(Text.of(`  §6• Медь: §f${buf.copper || 0} §7шт.`));
                lore.push(Text.of('§8────────────────────────────────'));
                lore.push(Text.of('§7Крафт и ремонт расходуют металл из буфера!'));
            } else {
                lore.push(Text.of('§cУстановите рядом Кузнечный Очаг для доступа к буферу!'));
            }

            s.setItem(Item.of(session.hasHearth ? 'minecraft:blast_furnace' : 'minecraft:campfire')
                .withCustomName(Text.of('§6⚒ [ СТАТУС МАСТЕРСКОЙ ]'))
                .withLore(lore));
            s.leftClicked = () => {};
        });

        // Slot 1: Переход в Кузнечный Очаг (Выплавка металлов)
        gui.slot(1, 0, s => {
            if (session.hasHearth) {
                s.setItem(Item.of('minecraft:lava_bucket')
                    .withCustomName(Text.of('§c🔥 [ Выплавка Металлов ]'))
                    .withLore([
                        Text.of('§7Перейти к Кузнечному Очагу:'),
                        Text.of('§e• Выплавка шихты стали и руд'),
                        Text.of('§e• Загрузка и выгрузка слитков из буфера'),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§a▶ Нажмите ЛКМ для перехода в Очаг')
                    ]));
                s.leftClicked = () => {
                    player.server.runCommandSilent(`playsound minecraft:ui.button.click player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openHearthSmelterGUI(player, stationPos);
                };
            } else {
                s.setItem(Item.of('minecraft:gray_stained_glass_pane').withCustomName(Text.of('§8 ')));
                s.leftClicked = () => {};
            }
        });

        // Slots 2, 3, 4: Вкладки ковки (Клинки, Доспехи, Инструменты)
        let tabIcons = ['minecraft:iron_sword', 'minecraft:iron_chestplate', 'kubejs:steel_pickaxe'];
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

        // Slot 5: Разделитель
        let decoPane = Item.of('minecraft:gray_stained_glass_pane').withCustomName(Text.of('§8 '));
        gui.slot(5, 0, s => { s.setItem(decoPane); s.leftClicked = () => {}; });

        // Slot 6: Вкладка Ремонта
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

        // Slot 7: Разделитель
        gui.slot(7, 0, s => { s.setItem(decoPane); s.leftClicked = () => {}; });

        // Slot 8: Выход
        gui.slot(8, 0, s => {
            s.setItem(Item.of('minecraft:barrier').withCustomName(Text.of('§c✖ [ Закрыть ]')));
            s.leftClicked = () => {
                player.closeContainerMenu();
            };
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
                    let avail = getAvailableIngotsBS(player, stationPos, recipe.ingot, session.hasHearth);
                    let hasExtra = recipe.extra ? countPlayerItemsBS(player, recipe.extra) : 999;

                    let canCraft = (avail.total >= totalIngots && hasExtra >= recipe.extraCount);

                    let lore = [
                        Text.of(`§7${recipe.desc}`),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§eТребуемые материалы:')
                    ];

                    let ingotLine = '';
                    if (avail.total >= totalIngots) {
                        if (session.hasHearth && avail.buffer > 0) {
                            ingotLine = `§a✓ ${recipe.ingotName}: ${avail.total}/${totalIngots} шт. (Инв: ${avail.inv}, Буфер: ${avail.buffer})`;
                        } else {
                            ingotLine = `§a✓ ${recipe.ingotName}: ${avail.inv}/${totalIngots} шт.`;
                        }
                    } else {
                        if (session.hasHearth && avail.buffer > 0) {
                            ingotLine = `§c✗ ${recipe.ingotName}: ${avail.total}/${totalIngots} шт. (Инв: ${avail.inv}, Буфер: ${avail.buffer})`;
                        } else {
                            ingotLine = `§c✗ ${recipe.ingotName}: ${avail.inv}/${totalIngots} шт.`;
                        }
                    }
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

                            let curAvail = getAvailableIngotsBS(player, session.stationPos, recipe.ingot, activeHasHearth);
                            let curExtra = recipe.extra ? countPlayerItemsBS(player, recipe.extra) : 999;
                            let curTotal = recipe.baseIngots + curPenalty;

                            if (curAvail.total < curTotal || curExtra < recipe.extraCount) {
                                player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                                player.sendSystemMessage(Text.of('§c[Кузница] §7Недостаточно материалов для ковки!'));
                                return;
                            }

                            // Списание ингредиентов (буфер + инвентарь)
                            deductCombinedIngotsBS(player, session.stationPos, recipe.ingot, curTotal, activeHasHearth);
                            if (recipe.extra && recipe.extraCount > 0) {
                                deductPlayerItemsBS(player, recipe.extra, recipe.extraCount);
                            }

                            // Выдача предмета
                            player.give(Item.of(recipe.id));

                            // Звук и частицы: звон молота и снопы искр
                            player.server.runCommandSilent(`playsound minecraft:block.anvil.place player ${player.username} ~ ~ ~ 0.9 1.1`);
                            player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.9 1.25`);
                            player.server.runCommandSilent(`playsound minecraft:block.anvil.land player ${player.username} ~ ~ ~ 0.9 1.4`);
                            player.server.runCommandSilent(`playsound minecraft:block.blastfurnace.fire_crackle player ${player.username} ~ ~ ~ 0.8 1.2`);
                            player.server.runCommandSilent(`particle minecraft:crit ~ ~1.2 ~ 0.5 0.3 0.5 0.15 35`);
                            player.server.runCommandSilent(`particle minecraft:lava ~ ~1.2 ~ 0.3 0.2 0.3 0.05 12`);

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
                    let isIngot = mat.id.includes('ingot');
                    let availMat = isIngot
                        ? getAvailableIngotsBS(player, stationPos, mat.id, session.hasHearth)
                        : { total: countPlayerItemsBS(player, mat.id), inv: countPlayerItemsBS(player, mat.id), buffer: 0 };
                    let canRepair = (availMat.total >= 1);

                    let restoreAmount = Math.max(1, Math.floor(entry.maxDmg * repairPercent));
                    let currentDur = entry.maxDmg - entry.curDmg;

                    let lore = [
                        Text.of(`§7Прочность: §f${currentDur} §7/ §f${entry.maxDmg}`),
                        Text.of(`§7Износ: §c${entry.curDmg} ед. урона`),
                        Text.of('§8────────────────────────────────'),
                        Text.of(`§eВосстановление: §a+${restoreAmount} ед. (+${repairPercentStr})`),
                        Text.of('§eСтоимость починки: 1x ' + mat.name)
                    ];

                    if (availMat.total >= 1) {
                        if (session.hasHearth && availMat.buffer > 0) {
                            lore.push(Text.of(`§a✓ Доступно: ${availMat.total} шт. (Инв: ${availMat.inv}, Буфер: ${availMat.buffer})`));
                        } else {
                            lore.push(Text.of(`§a✓ В инвентаре: ${availMat.inv} шт.`));
                        }
                    } else {
                        lore.push(Text.of(`§c✗ Не хватает: ${mat.name}`));
                    }
                    lore.push(Text.of('§8────────────────────────────────'));

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
                            let currentStation = session.stationPos ? getBlacksmithStationInfo(player.level, session.stationPos) : null;
                            let activeHasHearth = currentStation ? currentStation.hasHearth : session.hasHearth;
                            let activePercent = activeHasHearth ? 0.50 : 0.25;
                            let activePercentStr = activeHasHearth ? '50%' : '25%';
                            let activeRestore = Math.max(1, Math.floor(entry.maxDmg * activePercent));

                            let curAvail = isIngot
                                ? getAvailableIngotsBS(player, session.stationPos, mat.id, activeHasHearth)
                                : { total: countPlayerItemsBS(player, mat.id), inv: countPlayerItemsBS(player, mat.id), buffer: 0 };

                            if (curAvail.total < 1) {
                                player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                                player.sendSystemMessage(Text.of(`§c[Ремонт] §7Для починки требуется 1x §f${mat.name}§7!`));
                                return;
                            }

                            // Списание материала (буфер + инвентарь)
                            if (isIngot) {
                                deductCombinedIngotsBS(player, session.stationPos, mat.id, 1, activeHasHearth);
                            } else {
                                deductPlayerItemsBS(player, mat.id, 1);
                            }

                            // Поиск и восстановление прочности предмета
                            let realItem = player.inventory.getItem(entry.slotIndex);
                            let targetStack = null;
                            if (realItem && !realItem.isEmpty() && String(realItem.id) === entry.id && realItem.isDamageableItem()) {
                                targetStack = realItem;
                            } else {
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

                            player.server.runCommandSilent(`playsound minecraft:block.lava.extinguish player ${player.username} ~ ~ ~ 1.0 1.1`);
                            player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.8 1.2`);
                            player.server.runCommandSilent(`particle minecraft:cloud ~ ~1.2 ~ 0.3 0.4 0.3 0.05 30`);
                            player.server.runCommandSilent(`particle minecraft:smoke ~ ~1.2 ~ 0.3 0.3 0.3 0.04 15`);
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
                            Text.of('§a✓ Авто-расход металлов из общего буфера мастерской.')
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
// OPEN BLACKSMITH HEARTH SMELTER GUI (CHEST MENU 6 ROWS)
// ------------------------------------------------------------------------------
function openHearthSmelterGUI(player, stationPos) {
    let level = player.level;
    let station = (typeof getBlacksmithStationInfo === 'function') 
        ? getBlacksmithStationInfo(level, stationPos) 
        : { hasHearth: true, hasWorkbench: false, line: [] };

    let fullTitle = '\uE001§r🔥 §6§lКУЗНЕЧНЫЙ ОЧАГ §c✦ §fВЫПЛАВКА МЕТАЛЛА';

    player.openChestGUI(Text.of(fullTitle), 6, gui => {
        gui.playerSlots = true;
        let decoPane = Item.of('minecraft:gray_stained_glass_pane').withCustomName(Text.of('§8 '));

        let buf = getWorkshopBuffer(level, stationPos);
        let fuelCount = countPlayerFuelBS(player);
        let steelChargeCount = countPlayerItemsBS(player, 'kubejs:steel_charge');
        let rawIronCount = countPlayerItemsBS(player, 'minecraft:raw_iron') 
            + countPlayerItemsBS(player, 'minecraft:iron_ore') 
            + countPlayerItemsBS(player, 'minecraft:deepslate_iron_ore');
        let rawCopperCount = countPlayerItemsBS(player, 'minecraft:raw_copper') 
            + countPlayerItemsBS(player, 'minecraft:copper_ore') 
            + countPlayerItemsBS(player, 'minecraft:deepslate_copper_ore');

        // ======================================================================
        // ROW 0: ВЕРХНЯЯ ПАНЕЛЬ СТАТУСА И НАКОПИТЕЛЯ
        // ======================================================================

        // Slot 0: Статус Очага
        gui.slot(0, 0, s => {
            s.setItem(Item.of('minecraft:blast_furnace')
                .withCustomName(Text.of('§6🔥 [ КУЗНЕЧНЫЙ ОЧАГ ]'))
                .withLore([
                    Text.of('§7Высокотемпературный металлургический очаг.'),
                    Text.of('§8────────────────────────────────'),
                    Text.of(station.hasWorkbench ? '§a✓ Верстак Оружейника: Подключен' : '§e⚠ Верстак Оружейника: Не найден'),
                    Text.of(`§e• Доступно топлива в инвентаре: §f${fuelCount} §7ед.`),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§7Выплавленный металл отправляется прямо в буфер!')
                ]));
            s.leftClicked = () => {};
        });

        // Slot 2: Буфер Стали (Нажмите чтобы забрать)
        gui.slot(2, 0, s => {
            let stCount = buf.steel || 0;
            s.setItem(Item.of('kubejs:steel_ingot')
                .withCustomName(Text.of(`§9[ Буфер Стали: ${stCount} шт. ]`))
                .withLore([
                    Text.of(`§7Текущий запас в мастерской: §f${stCount} §7шт.`),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§a▶ ЛКМ: Забрать 1 слиток в инвентарь'),
                    Text.of('§b▶ Shift+ЛКМ: Забрать пачку (до 64 шт.)')
                ]));
            s.leftClicked = () => {
                if (buf.steel > 0) {
                    let take = 1;
                    buf.steel -= take;
                    player.give(Item.of('kubejs:steel_ingot', take));
                    player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openHearthSmelterGUI(player, stationPos);
                }
            };
        });

        // Slot 3: Буфер Железа
        gui.slot(3, 0, s => {
            let irCount = buf.iron || 0;
            s.setItem(Item.of('minecraft:iron_ingot')
                .withCustomName(Text.of(`§f[ Буфер Железа: ${irCount} шт. ]`))
                .withLore([
                    Text.of(`§7Текущий запас в мастерской: §f${irCount} §7шт.`),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§a▶ ЛКМ: Забрать 1 слиток в инвентарь'),
                    Text.of('§b▶ Shift+ЛКМ: Забрать пачку (до 64 шт.)')
                ]));
            s.leftClicked = () => {
                if (buf.iron > 0) {
                    let take = 1;
                    buf.iron -= take;
                    player.give(Item.of('minecraft:iron_ingot', take));
                    player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openHearthSmelterGUI(player, stationPos);
                }
            };
        });

        // Slot 4: Буфер Меди
        gui.slot(4, 0, s => {
            let cuCount = buf.copper || 0;
            s.setItem(Item.of('minecraft:copper_ingot')
                .withCustomName(Text.of(`§6[ Буфер Меди: ${cuCount} шт. ]`))
                .withLore([
                    Text.of(`§7Текущий запас в мастерской: §f${cuCount} §7шт.`),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§a▶ ЛКМ: Забрать 1 слиток в инвентарь'),
                    Text.of('§b▶ Shift+ЛКМ: Забрать пачку (до 64 шт.)')
                ]));
            s.leftClicked = () => {
                if (buf.copper > 0) {
                    let take = 1;
                    buf.copper -= take;
                    player.give(Item.of('minecraft:copper_ingot', take));
                    player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openHearthSmelterGUI(player, stationPos);
                }
            };
        });

        // Slot 6: Переход к Верстаку Ковки
        gui.slot(6, 0, s => {
            if (station.hasWorkbench) {
                s.setItem(Item.of('kubejs:blacksmith_workbench')
                    .withCustomName(Text.of('§6⚒ [ Перейти к Верстаку Ковки ]'))
                    .withLore([
                        Text.of('§7Переход в каталог крафта клинков, доспехов и ремонта.'),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§a▶ Нажмите ЛКМ для перехода')
                    ]));
                s.leftClicked = () => {
                    player.server.runCommandSilent(`playsound minecraft:ui.button.click player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openBlacksmithGUI(player, station.workbenchPos || stationPos);
                };
            } else {
                s.setItem(Item.of('minecraft:gray_stained_glass_pane').withCustomName(Text.of('§8 ')));
                s.leftClicked = () => {};
            }
        });

        // Slot 8: Закрыть
        gui.slot(8, 0, s => {
            s.setItem(Item.of('minecraft:barrier').withCustomName(Text.of('§c✖ [ Закрыть ]')));
            s.leftClicked = () => {
                player.closeContainerMenu();
            };
        });

        // Разделители ряда 0
        [1, 5, 7].forEach(slotX => {
            gui.slot(slotX, 0, s => { s.setItem(decoPane); s.leftClicked = () => {}; });
        });

        // ======================================================================
        // ROWS 1..4: МЕТАЛЛУРГИЧЕСКИЕ ОПЕРАЦИИ ВЫПЛАВКИ
        // ======================================================================

        // Заполнение пустых клеток декорацией
        for (let y = 1; y <= 4; y++) {
            for (let x = 0; x < 9; x++) {
                gui.slot(x, y, s => { s.setItem(decoPane); s.leftClicked = () => {}; });
            }
        }

        // Кнопка 1: Выплавка Стали (Slot 2, Row 2)
        gui.slot(2, 2, s => {
            let canSmelt = (steelChargeCount >= 1 && fuelCount >= 1);
            s.setItem(Item.of('kubejs:steel_charge')
                .withCustomName(Text.of('§b⚡ [ Выплавить Сталь ]'))
                .withLore([
                    Text.of('§7Высокотемпературный обжиг шихты в сталь.'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§eРецепт: 1x Шихта стали + 1x Уголь -> +1 Сталь в буфер'),
                    Text.of(steelChargeCount >= 1 ? `§a✓ Шихты в инвентаре: ${steelChargeCount} шт.` : '§c✗ Нет шихты стали в инвентаре'),
                    Text.of(fuelCount >= 1 ? `§a✓ Топлива в инвентаре: ${fuelCount} ед.` : '§c✗ Нет топлива (уголь/древесный уголь)'),
                    Text.of('§8────────────────────────────────'),
                    Text.of(canSmelt ? '§a▶ ЛКМ: Выплавить 1 слиток' : '§c🔒 Недостаточно шихты или топлива'),
                    Text.of(canSmelt ? '§b▶ ПКМ: Выплавить ВСЮ шихту из инвентаря' : '')
                ]));
            s.leftClicked = () => {
                let curCharges = countPlayerItemsBS(player, 'kubejs:steel_charge');
                let curFuel = countPlayerFuelBS(player);
                if (curCharges >= 1 && curFuel >= 1) {
                    deductPlayerItemsBS(player, 'kubejs:steel_charge', 1);
                    deductPlayerFuelBS(player, 1);
                    addBufferIngots(level, stationPos, 'steel', 1);

                    player.server.runCommandSilent(`playsound minecraft:block.blastfurnace.fire_crackle player ${player.username} ~ ~ ~ 0.9 1.1`);
                    player.server.runCommandSilent(`playsound minecraft:block.lava.extinguish player ${player.username} ~ ~ ~ 0.8 1.4`);
                    player.server.runCommandSilent(`particle minecraft:flame ~ ~1.2 ~ 0.3 0.3 0.3 0.05 15`);
                    player.server.runCommandSilent(`particle minecraft:lava ~ ~1.2 ~ 0.2 0.2 0.2 0.05 8`);
                    player.sendSystemMessage(Text.of('§a⚡ [Очаг] §fВыплавлен §9+1 Стальной Слиток§f в буфер мастерской!'));
                    openHearthSmelterGUI(player, stationPos);
                } else {
                    player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                }
            };
        });

        // Кнопка 2: Переплавка Железа (Slot 4, Row 2)
        gui.slot(4, 2, s => {
            let canSmelt = (rawIronCount >= 1 && fuelCount >= 1);
            s.setItem(Item.of('minecraft:raw_iron')
                .withCustomName(Text.of('§f⚡ [ Переплавить Железо ]'))
                .withLore([
                    Text.of('§7Переплавка сырого железа или руды в слитки.'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§eРецепт: 1x Сырое железо/руда + 1x Уголь -> +1 Железо в буфер'),
                    Text.of(rawIronCount >= 1 ? `§a✓ Сырого железа/руды: ${rawIronCount} шт.` : '§c✗ Нет железной руды/сырца'),
                    Text.of(fuelCount >= 1 ? `§a✓ Топлива в инвентаре: ${fuelCount} ед.` : '§c✗ Нет топлива'),
                    Text.of('§8────────────────────────────────'),
                    Text.of(canSmelt ? '§a▶ ЛКМ: Выплавить 1 слиток' : '§c🔒 Недостаточно руды или топлива')
                ]));
            s.leftClicked = () => {
                let curFuel = countPlayerFuelBS(player);
                if (curFuel < 1) {
                    player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                    return;
                }
                let taken = false;
                ['minecraft:raw_iron', 'minecraft:iron_ore', 'minecraft:deepslate_iron_ore'].forEach(oreId => {
                    if (!taken && countPlayerItemsBS(player, oreId) >= 1) {
                        deductPlayerItemsBS(player, oreId, 1);
                        taken = true;
                    }
                });
                if (taken) {
                    deductPlayerFuelBS(player, 1);
                    addBufferIngots(level, stationPos, 'iron', 1);

                    player.server.runCommandSilent(`playsound minecraft:block.blastfurnace.fire_crackle player ${player.username} ~ ~ ~ 0.9 1.1`);
                    player.server.runCommandSilent(`particle minecraft:flame ~ ~1.2 ~ 0.3 0.3 0.3 0.05 15`);
                    player.sendSystemMessage(Text.of('§a⚡ [Очаг] §fВыплавлен §f+1 Железный Слиток§f в буфер мастерской!'));
                    openHearthSmelterGUI(player, stationPos);
                } else {
                    player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                }
            };
        });

        // Кнопка 3: Переплавка Меди (Slot 6, Row 2)
        gui.slot(6, 2, s => {
            let canSmelt = (rawCopperCount >= 1 && fuelCount >= 1);
            s.setItem(Item.of('minecraft:raw_copper')
                .withCustomName(Text.of('§6⚡ [ Переплавить Медь ]'))
                .withLore([
                    Text.of('§7Переплавка сырой меди или руды в слитки.'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§eРецепт: 1x Сырая медь/руда + 1x Уголь -> +1 Медь в буфер'),
                    Text.of(rawCopperCount >= 1 ? `§a✓ Сырой меди/руды: ${rawCopperCount} шт.` : '§c✗ Нет медной руды/сырца'),
                    Text.of(fuelCount >= 1 ? `§a✓ Топлива в инвентаре: ${fuelCount} ед.` : '§c✗ Нет топлива'),
                    Text.of('§8────────────────────────────────'),
                    Text.of(canSmelt ? '§a▶ ЛКМ: Выплавить 1 слиток' : '§c🔒 Недостаточно руды или топлива')
                ]));
            s.leftClicked = () => {
                let curFuel = countPlayerFuelBS(player);
                if (curFuel < 1) {
                    player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                    return;
                }
                let taken = false;
                ['minecraft:raw_copper', 'minecraft:copper_ore', 'minecraft:deepslate_copper_ore'].forEach(oreId => {
                    if (!taken && countPlayerItemsBS(player, oreId) >= 1) {
                        deductPlayerItemsBS(player, oreId, 1);
                        taken = true;
                    }
                });
                if (taken) {
                    deductPlayerFuelBS(player, 1);
                    addBufferIngots(level, stationPos, 'copper', 1);

                    player.server.runCommandSilent(`playsound minecraft:block.blastfurnace.fire_crackle player ${player.username} ~ ~ ~ 0.9 1.1`);
                    player.server.runCommandSilent(`particle minecraft:flame ~ ~1.2 ~ 0.3 0.3 0.3 0.05 15`);
                    player.sendSystemMessage(Text.of('§a⚡ [Очаг] §fВыплавлен §6+1 Медный Слиток§f в буфер мастерской!'));
                    openHearthSmelterGUI(player, stationPos);
                } else {
                    player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                }
            };
        });

        // Кнопка 4: Загрузить готовые слитки в буфер (Slot 2, Row 3)
        gui.slot(2, 3, s => {
            let invSteel = countPlayerItemsBS(player, 'kubejs:steel_ingot');
            let invIron = countPlayerItemsBS(player, 'minecraft:iron_ingot');
            let invCopper = countPlayerItemsBS(player, 'minecraft:copper_ingot');
            let totalIngots = invSteel + invIron + invCopper;

            s.setItem(Item.of('minecraft:hopper')
                .withCustomName(Text.of('§e📥 [ Загрузить Слитки в Буфер ]'))
                .withLore([
                    Text.of('§7Сложить слитки из инвентаря в общий буфер мастерской.'),
                    Text.of('§8────────────────────────────────'),
                    Text.of(`§7В инвентаре: Сталь: ${invSteel}, Железо: ${invIron}, Медь: ${invCopper}`),
                    Text.of('§8────────────────────────────────'),
                    Text.of(totalIngots > 0 ? '§a▶ Нажмите ЛКМ для загрузки всех слитков' : '§c🔒 Нет слитков в инвентаре для загрузки')
                ]));
            s.leftClicked = () => {
                let curSteel = countPlayerItemsBS(player, 'kubejs:steel_ingot');
                let curIron = countPlayerItemsBS(player, 'minecraft:iron_ingot');
                let curCopper = countPlayerItemsBS(player, 'minecraft:copper_ingot');

                if (curSteel > 0) {
                    deductPlayerItemsBS(player, 'kubejs:steel_ingot', curSteel);
                    addBufferIngots(level, stationPos, 'steel', curSteel);
                }
                if (curIron > 0) {
                    deductPlayerItemsBS(player, 'minecraft:iron_ingot', curIron);
                    addBufferIngots(level, stationPos, 'iron', curIron);
                }
                if (curCopper > 0) {
                    deductPlayerItemsBS(player, 'minecraft:copper_ingot', curCopper);
                    addBufferIngots(level, stationPos, 'copper', curCopper);
                }

                if (curSteel > 0 || curIron > 0 || curCopper > 0) {
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.9 1.1`);
                    player.sendSystemMessage(Text.of('§a📥 [Буфер] §fСлитки успешно перемещены в накопитель мастерской!'));
                    openHearthSmelterGUI(player, stationPos);
                } else {
                    player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                }
            };
        });

        // Кнопка 5: Пакетная Авто-Выплавка ВСЕХ материалов (Slot 4, Row 3)
        gui.slot(4, 3, s => {
            let totalMaterials = steelChargeCount + rawIronCount + rawCopperCount;
            let canBatch = (totalMaterials > 0 && fuelCount > 0);
            s.setItem(Item.of('minecraft:campfire')
                .withCustomName(Text.of('§c🔥 [ Выплавить ВСЕ Материалы ]'))
                .withLore([
                    Text.of('§7Автоматическая пакетная переплавка всей шихты и руд.'),
                    Text.of('§8────────────────────────────────'),
                    Text.of(`§7Шихта стали: §f${steelChargeCount} §7| Железо: §f${rawIronCount} §7| Медь: §f${rawCopperCount}`),
                    Text.of(`§7Доступно топлива: §e${fuelCount} §7ед.`),
                    Text.of('§8────────────────────────────────'),
                    Text.of(canBatch ? '§a▶ Нажмите ЛКМ для полной переплавки' : '§c🔒 Нет материалов или топлива для выплавки')
                ]));
            s.leftClicked = () => {
                let curFuel = countPlayerFuelBS(player);
                if (curFuel <= 0) {
                    player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                    player.sendSystemMessage(Text.of('§c[Очаг] §7Недостаточно топлива для выплавки!'));
                    return;
                }

                let smeltedSteel = 0;
                let smeltedIron = 0;
                let smeltedCopper = 0;

                // 1. Smelt Steel Charges
                let curCharges = countPlayerItemsBS(player, 'kubejs:steel_charge');
                let batchSteel = Math.min(curCharges, curFuel);
                if (batchSteel > 0) {
                    deductPlayerItemsBS(player, 'kubejs:steel_charge', batchSteel);
                    deductPlayerFuelBS(player, batchSteel);
                    addBufferIngots(level, stationPos, 'steel', batchSteel);
                    curFuel -= batchSteel;
                    smeltedSteel += batchSteel;
                }

                // 2. Smelt Raw Iron
                if (curFuel > 0) {
                    let curIron = countPlayerItemsBS(player, 'minecraft:raw_iron');
                    let batchIron = Math.min(curIron, curFuel);
                    if (batchIron > 0) {
                        deductPlayerItemsBS(player, 'minecraft:raw_iron', batchIron);
                        deductPlayerFuelBS(player, batchIron);
                        addBufferIngots(level, stationPos, 'iron', batchIron);
                        curFuel -= batchIron;
                        smeltedIron += batchIron;
                    }
                }

                // 3. Smelt Raw Copper
                if (curFuel > 0) {
                    let curCopper = countPlayerItemsBS(player, 'minecraft:raw_copper');
                    let batchCopper = Math.min(curCopper, curFuel);
                    if (batchCopper > 0) {
                        deductPlayerItemsBS(player, 'minecraft:raw_copper', batchCopper);
                        deductPlayerFuelBS(player, batchCopper);
                        addBufferIngots(level, stationPos, 'copper', batchCopper);
                        curFuel -= batchCopper;
                        smeltedCopper += batchCopper;
                    }
                }

                let totalSmelted = smeltedSteel + smeltedIron + smeltedCopper;
                if (totalSmelted > 0) {
                    player.server.runCommandSilent(`playsound minecraft:block.blastfurnace.fire_crackle player ${player.username} ~ ~ ~ 1.0 1.0`);
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.9 1.2`);
                    player.server.runCommandSilent(`particle minecraft:flame ~ ~1.2 ~ 0.5 0.4 0.5 0.08 40`);
                    player.server.runCommandSilent(`particle minecraft:lava ~ ~1.2 ~ 0.4 0.3 0.4 0.05 20`);
                    player.sendSystemMessage(Text.of(`§a🔥 [Пакетная выплавка] §fВыплавлено: §9${smeltedSteel} стали§f, §f${smeltedIron} железа§f, §6${smeltedCopper} меди§f в буфер!`));
                    openHearthSmelterGUI(player, stationPos);
                } else {
                    player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                    player.sendSystemMessage(Text.of('§c[Очаг] §7Не найдено сырья для переплавки!'));
                }
            };
        });

        // Кнопка 6: Индикатор топлива (Slot 6, Row 3)
        gui.slot(6, 3, s => {
            s.setItem(Item.of('minecraft:coal')
                .withCustomName(Text.of(`§7[ Запас Топлива: ${fuelCount} ед. ]`))
                .withLore([
                    Text.of('§7Подходит любое стандартное топливо:'),
                    Text.of('§e• Уголь / Древесный уголь (1 ед.)'),
                    Text.of('§e• Стержень ифрита (3 ед.)'),
                    Text.of('§e• Угольный блок (9 ед.)'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§7Держите топливо в инвентаре для работы Очага.')
                ]));
            s.leftClicked = () => {};
        });

        // ======================================================================
        // ROW 5: НИЖНЯЯ ПАНЕЛЬ И РУКОВОДСТВО
        // ======================================================================
        for (let x = 0; x < 9; x++) {
            if (x === 4) {
                gui.slot(4, 5, s => {
                    s.setItem(Item.of('minecraft:compass')
                        .withCustomName(Text.of('§e[ Руководство Металлурга: Очаг ]'))
                        .withLore([
                            Text.of('§71. Создайте шихту стали в крафте 2x2 (железо + уголь + глина/кальцит).'),
                            Text.of('§72. Загрузите шихту и топливо в Кузнечный Очаг.'),
                            Text.of('§73. Металл сохранится в буфере мастерской и доступен в Верстаке Ковки!'),
                            Text.of('§8────────────────────────────────'),
                            Text.of('§a✓ Металл не пропадет при закрытии интерфейса.')
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

// 1. Right click on Blacksmith Workbench -> Opens Forging & Repair Catalog
BlockEvents.rightClicked('kubejs:blacksmith_workbench', event => {
    let player = event.player;
    if (!player || player.level.isClientSide()) return;

    let handStr = event.hand ? String(event.hand) : 'MAIN_HAND';
    if (!handStr.includes('MAIN')) return;

    event.cancel();
    openBlacksmithGUI(player, event.block.pos);
    player.server.runCommandSilent(`playsound minecraft:block.wood.hit player ${player.username} ~ ~ ~ 0.8 1.0`);
});

// 2. Right click on Blacksmith Hearth -> Opens Metallurgy Smelter GUI
BlockEvents.rightClicked('kubejs:blacksmith_hearth', event => {
    let player = event.player;
    if (!player || player.level.isClientSide()) return;

    let handStr = event.hand ? String(event.hand) : 'MAIN_HAND';
    if (!handStr.includes('MAIN')) return;

    event.cancel();
    openHearthSmelterGUI(player, event.block.pos);
    player.server.runCommandSilent(`playsound minecraft:block.blastfurnace.fire_crackle player ${player.username} ~ ~ ~ 0.8 1.0`);
});

// 3. Right click on Void Anvil
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

    let station = (typeof getBlacksmithStationInfo === 'function') 
        ? getBlacksmithStationInfo(player.level, event.block.pos) 
        : null;
    if (station && station.hasWorkbench) {
        openBlacksmithGUI(player, station.workbenchPos || event.block.pos);
    } else {
        player.sendSystemMessage(Text.of('§4🌋 [Адский Горн] §7Высокотемпературный тигель Незера пылает. Подключите его к Верстаку Оружейника [3-1-2-4]!'));
    }
});

// Cleanup on logout
PlayerEvents.loggedOut(event => {
    if (event.player) clearBlacksmithSession(event.player);
});
