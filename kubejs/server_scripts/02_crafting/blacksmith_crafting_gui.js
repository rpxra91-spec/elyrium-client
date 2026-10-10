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
    if (!level || !stationPos) return { steel: 0, iron: 0, copper: 0, cinder: 0, netherite: 0 };
    let station = (typeof getBlacksmithStationInfo === 'function') 
        ? getBlacksmithStationInfo(level, stationPos) 
        : null;
    let anchor = getStationAnchorKey(station, stationPos);

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

function deductBufferIngots(level, stationPos, ingotId, needed) {
    if (!level || !stationPos || needed <= 0) return 0;
    let buf = getWorkshopBuffer(level, stationPos);
    let id = String(ingotId).toLowerCase();
    let type = 'iron';
    if (id.includes('cinder')) type = 'cinder';
    else if (id.includes('netherite')) type = 'netherite';
    else if (id.includes('steel')) type = 'steel';
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
// ------------------------------------------------------------------------------
// OPEN BLACKSMITH WORKBENCH & MASTER WORKSHOP GUI (CHEST MENU 6 ROWS)
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

    // Tab accessibility fallback: if current tab is locked, fallback to Tab 0
    if (session.tab === 4 && !session.hasHearth) session.tab = 0;
    if (session.tab === 5 && !session.hasCrucible) session.tab = 0;
    if (session.tab === 6 && !session.hasAnvil) session.tab = 0;

    // Curator Canon: No standalone penalty on workbench
            let ingotPenalty = 0;

    let guiTitle = session.isGrandForge
        ? '👑 §6§lВЕЛИКАЯ КУЗНИЦА §c✦ §dЭЛИРИУМ'
        : (session.hasHearth
            ? '⚒ §6§lМАСТЕРСКАЯ КУЗНЕЦА §a✦ §fЭЛИРИУМ'
            : '⚒ §7Верстак Оружейника §c(Очаг не найден)');

    let fullTitle = '\uE001§r' + guiTitle;

    player.openChestGUI(Text.of(fullTitle), 6, gui => {
        gui.playerSlots = true;
        gui.closed = () => {
            clearBlacksmithSession(player);
        };

        let decoPane = Item.of('minecraft:gray_stained_glass_pane').withCustomName(Text.of('§8 '));
        let buf = getWorkshopBuffer(level, stationPos);
        let fuelCount = countPlayerFuelBS(player);

        // ======================================================================
        // ROW 0: ВЕРХНИЙ КАРНИЗ И ЕДИНАЯ НАВИГАЦИЯ ВКЛАДОК (TABS 0..6 + CLOSE)
        // ======================================================================

        // Tab 0: ⚔ [ Оружие ]
        gui.slot(0, 0, s => {
            let isSel = (session.tab === 0);
            s.setItem(Item.of(isSel ? 'minecraft:nether_star' : 'minecraft:iron_sword')
                .withCustomName(Text.of(isSel ? '§6▶ §c⚔ [ Оружие ] ◀' : '§c⚔ [ Оружие ]'))
                .withLore([
                    Text.of('§7Ковка клинков и древкового оружия SimplySwords.'),
                    Text.of('§8────────────────────────────────'),
                    Text.of(isSel ? '§a[Текущий раздел]' : '§e▶ Нажмите для перехода в каталог оружия')
                ]));
            s.leftClicked = () => {
                session.tab = 0;
                player.server.runCommandSilent(`playsound minecraft:ui.button.click player ${player.username} ~ ~ ~ 0.8 1.2`);
                openBlacksmithGUI(player, stationPos);
            };
        });

        // Tab 1: 🛡 [ Доспехи ]
        gui.slot(1, 0, s => {
            let isSel = (session.tab === 1);
            s.setItem(Item.of(isSel ? 'minecraft:nether_star' : 'minecraft:iron_chestplate')
                .withCustomName(Text.of(isSel ? '§6▶ §b🛡 [ Доспехи ] ◀' : '§b🛡 [ Доспехи ]'))
                .withLore([
                    Text.of('§7Ковка комплектов брони Рыцаря, Разведчика и Железа.'),
                    Text.of('§8────────────────────────────────'),
                    Text.of(isSel ? '§a[Текущий раздел]' : '§e▶ Нажмите для перехода в каталог брони')
                ]));
            s.leftClicked = () => {
                session.tab = 1;
                player.server.runCommandSilent(`playsound minecraft:ui.button.click player ${player.username} ~ ~ ~ 0.8 1.2`);
                openBlacksmithGUI(player, stationPos);
            };
        });

        // Tab 2: ⛏ [ Инструменты ]
        gui.slot(2, 0, s => {
            let isSel = (session.tab === 2);
            s.setItem(Item.of(isSel ? 'minecraft:nether_star' : 'kubejs:steel_pickaxe')
                .withCustomName(Text.of(isSel ? '§6▶ §e⛏ [ Инструменты ] ◀' : '§e⛏ [ Инструменты ]'))
                .withLore([
                    Text.of('§7Ковка Стальной Кирки (Т-алмаз), топоров, лопат и щита.'),
                    Text.of('§8────────────────────────────────'),
                    Text.of(isSel ? '§a[Текущий раздел]' : '§e▶ Нажмите для перехода к инструментам')
                ]));
            s.leftClicked = () => {
                session.tab = 2;
                player.server.runCommandSilent(`playsound minecraft:ui.button.click player ${player.username} ~ ~ ~ 0.8 1.2`);
                openBlacksmithGUI(player, stationPos);
            };
        });

        // Tab 3: 🔧 [ Ремонт ] (+25% соло, +50% если рядом Очаг)
        gui.slot(3, 0, s => {
            let isSel = (session.tab === 3);
            let repairDurText = session.hasHearth ? '§a+50% прочности за 1 слиток (Очаг)' : '§e+25% прочности за 1 слиток (соло)';
            s.setItem(Item.of(isSel ? 'minecraft:nether_star' : 'minecraft:anvil')
                .withCustomName(Text.of(isSel ? '§6▶ §a🔧 [ Ремонт ] ◀' : '§a🔧 [ Ремонт ]'))
                .withLore([
                    Text.of('§7Восстановление прочности поврежденного снаряжения.'),
                    Text.of(repairDurText),
                    Text.of('§8────────────────────────────────'),
                    Text.of(isSel ? '§a[Текущий раздел]' : '§e▶ Нажмите для перехода к ремонту')
                ]));
            s.leftClicked = () => {
                session.tab = 3;
                player.server.runCommandSilent(`playsound minecraft:ui.button.click player ${player.username} ~ ~ ~ 0.8 1.2`);
                openBlacksmithGUI(player, stationPos);
            };
        });

        // Tab 4: 🔥 [ Очаг ] (активна только если рядом есть Очаг)
        gui.slot(4, 0, s => {
            let isSel = (session.tab === 4);
            if (session.hasHearth) {
                s.setItem(Item.of(isSel ? 'minecraft:nether_star' : 'minecraft:blast_furnace')
                    .withCustomName(Text.of(isSel ? '§6▶ §c🔥 [ Очаг ] ◀' : '§c🔥 [ Очаг ]'))
                    .withLore([
                        Text.of('§7Высокотемпературная металлургия и буфер слитков.'),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§a✓ Кузнечный Очаг подключен в радиусе 4 блоков'),
                        Text.of(isSel ? '§a[Текущий раздел]' : '§e▶ Нажмите для перехода в Очаг')
                    ]));
                s.leftClicked = () => {
                    session.tab = 4;
                    player.server.runCommandSilent(`playsound minecraft:ui.button.click player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openBlacksmithGUI(player, stationPos);
                };
            } else {
                s.setItem(Item.of('minecraft:campfire')
                    .withCustomName(Text.of('§8🔒 [ Очаг: Недоступен ]'))
                    .withLore([
                        Text.of('§cТребуется Кузнечный Очаг поблизости (в пределах 4 блоков)!'),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§7Установите Кузнечный Очаг в мастерской для выплавки стали.')
                    ]));
                s.leftClicked = () => {
                    player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                    player.sendSystemMessage(Text.of('§c[Мастерская] §7Требуется Кузнечный Очаг поблизости!'));
                };
            }
        });

        // Tab 5: 🌋 [ Тигель ] (активна только если рядом есть Адский Тигель)
        gui.slot(5, 0, s => {
            let isSel = (session.tab === 5);
            if (session.hasCrucible) {
                s.setItem(Item.of(isSel ? 'minecraft:nether_star' : 'minecraft:lava_bucket')
                    .withCustomName(Text.of(isSel ? '§6▶ §4🌋 [ Тигель ] ◀' : '§4🌋 [ Тигель ]'))
                    .withLore([
                        Text.of('§7Инфернальный Тигель Незера (Т2/Т3).'),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§a✓ Адский Тигель подключен в радиусе 4 блоков'),
                        Text.of(isSel ? '§a[Текущий раздел]' : '§e▶ Нажмите для перехода к сплавам Незера')
                    ]));
                s.leftClicked = () => {
                    session.tab = 5;
                    player.server.runCommandSilent(`playsound minecraft:ui.button.click player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openBlacksmithGUI(player, stationPos);
                };
            } else {
                s.setItem(Item.of('minecraft:magma_block')
                    .withCustomName(Text.of('§8🔒 [ Тигель: Недоступен ]'))
                    .withLore([
                        Text.of('§cТребуется Адский Тигель поблизости (в пределах 4 блоков)!'),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§7Установите Адский Тигель для выплавки пепельных сплавов и незерита.')
                    ]));
                s.leftClicked = () => {
                    player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                    player.sendSystemMessage(Text.of('§c[Мастерская] §7Требуется Адский Тигель поблизости!'));
                };
            }
        });

        // Tab 6: 🌌 [ Наковальня ] (активна только если рядом есть Наковальня Бездны)
        gui.slot(6, 0, s => {
            let isSel = (session.tab === 6);
            if (session.hasAnvil) {
                s.setItem(Item.of(isSel ? 'minecraft:nether_star' : 'minecraft:crying_obsidian')
                    .withCustomName(Text.of(isSel ? '§6▶ §5🌌 [ Наковальня ] ◀' : '§5🌌 [ Наковальня ]'))
                    .withLore([
                        Text.of('§7Пустотная Наковальня Бездны (Т5).'),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§a✓ Наковальня Бездны подключена в радиусе 4 блоков'),
                        Text.of(isSel ? '§a[Текущий раздел]' : '§e▶ Нажмите для перехода к рунической закалке')
                    ]));
                s.leftClicked = () => {
                    session.tab = 6;
                    player.server.runCommandSilent(`playsound minecraft:ui.button.click player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openBlacksmithGUI(player, stationPos);
                };
            } else {
                s.setItem(Item.of('minecraft:obsidian')
                    .withCustomName(Text.of('§8🔒 [ Наковальня: Недоступна ]'))
                    .withLore([
                        Text.of('§cТребуется Наковальня Бездны поблизости (в пределах 4 блоков)!'),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§7Установите Наковальню Бездны для глубокой заточки +1..+15 в стиле Lineage 2.')
                    ]));
                s.leftClicked = () => {
                    player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                    player.sendSystemMessage(Text.of('§c[Мастерская] §7Требуется Наковальня Бездны поблизости!'));
                };
            }
        });

        // Slot 7: Разделитель
        gui.slot(7, 0, s => { s.setItem(decoPane); s.leftClicked = () => {}; });

        // Slot 8: ✖ [ Закрыть ]
        gui.slot(8, 0, s => {
            s.setItem(Item.of('minecraft:barrier').withCustomName(Text.of('§c✖ [ Закрыть ]')));
            s.leftClicked = () => {
                player.closeContainerMenu();
            };
        });

        // ======================================================================
        // ROWS 1..4: ОСНОВНАЯ РАБОЧАЯ ЗОНА В СООТВЕТСТВИИ С АКТИВНОЙ ВКЛАДКОЙ
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

                    // Curator Canon: No penalty lore

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
                            let curPenalty = 0;

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
        } else if (session.tab === 4) {
            // ------------------------------------------------------------------
            // TAB 4: 🔥 [ ОЧАГ ] (МЕТАЛЛУРГИЯ И ВЫПЛАВКА В ЕДИНОМ МАСТЕР-GUI)
            // ------------------------------------------------------------------
            let steelChargeCount = countPlayerItemsBS(player, 'kubejs:steel_charge');
            let rawIronCount = countPlayerItemsBS(player, 'minecraft:raw_iron') 
                + countPlayerItemsBS(player, 'minecraft:iron_ore') 
                + countPlayerItemsBS(player, 'minecraft:deepslate_iron_ore');
            let rawCopperCount = countPlayerItemsBS(player, 'minecraft:raw_copper') 
                + countPlayerItemsBS(player, 'minecraft:copper_ore') 
                + countPlayerItemsBS(player, 'minecraft:deepslate_copper_ore');

            // Заполнение рабочей зоны декорацией
            for (let y = 1; y <= 4; y++) {
                for (let x = 0; x < 9; x++) {
                    gui.slot(x, y, s => { s.setItem(decoPane); s.leftClicked = () => {}; });
                }
            }

            // Ряд 1: Индикаторы накопителя металлов (Буфер мастерской)
            // [2, 1] Буфер Стали
            gui.slot(2, 1, s => {
                let stCount = buf.steel || 0;
                s.setItem(Item.of('kubejs:steel_ingot')
                    .withCustomName(Text.of(`§9[ Буфер Стали: ${stCount} шт. ]`))
                    .withLore([
                        Text.of(`§7Текущий запас в мастерской: §f${stCount} §7шт.`),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§a▶ ЛКМ: Забрать 1 слиток в инвентарь')
                    ]));
                s.leftClicked = () => {
                    if (buf.steel > 0) {
                        buf.steel -= 1;
                        player.give(Item.of('kubejs:steel_ingot', 1));
                        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                        openBlacksmithGUI(player, stationPos);
                    }
                };
            });

            // [4, 1] Буфер Железа
            gui.slot(4, 1, s => {
                let irCount = buf.iron || 0;
                s.setItem(Item.of('minecraft:iron_ingot')
                    .withCustomName(Text.of(`§f[ Буфер Железа: ${irCount} шт. ]`))
                    .withLore([
                        Text.of(`§7Текущий запас в мастерской: §f${irCount} §7шт.`),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§a▶ ЛКМ: Забрать 1 слиток в инвентарь')
                    ]));
                s.leftClicked = () => {
                    if (buf.iron > 0) {
                        buf.iron -= 1;
                        player.give(Item.of('minecraft:iron_ingot', 1));
                        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                        openBlacksmithGUI(player, stationPos);
                    }
                };
            });

            // [6, 1] Буфер Меди
            gui.slot(6, 1, s => {
                let cuCount = buf.copper || 0;
                s.setItem(Item.of('minecraft:copper_ingot')
                    .withCustomName(Text.of(`§6[ Буфер Меди: ${cuCount} шт. ]`))
                    .withLore([
                        Text.of(`§7Текущий запас в мастерской: §f${cuCount} §7шт.`),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§a▶ ЛКМ: Забрать 1 слиток в инвентарь')
                    ]));
                s.leftClicked = () => {
                    if (buf.copper > 0) {
                        buf.copper -= 1;
                        player.give(Item.of('minecraft:copper_ingot', 1));
                        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                        openBlacksmithGUI(player, stationPos);
                    }
                };
            });

            // Ряд 2: Операции выплавки (Сталь, Железо, Медь)
            // [2, 2] Выплавка Стали
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
                        Text.of(canSmelt ? '§a▶ ЛКМ: Выплавить 1 слиток' : '§c🔒 Недостаточно шихты или топлива')
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
                        openBlacksmithGUI(player, stationPos);
                    } else {
                        player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                    }
                };
            });

            // [4, 2] Переплавка Железа
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
                        openBlacksmithGUI(player, stationPos);
                    } else {
                        player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                    }
                };
            });

            // [6, 2] Переплавка Меди
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
                        openBlacksmithGUI(player, stationPos);
                    } else {
                        player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                    }
                };
            });

            // Ряд 3: Загрузка слитков, Пакетная выплавка, Запас топлива
            // [2, 3] Загрузка слитков в буфер
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
                        openBlacksmithGUI(player, stationPos);
                    } else {
                        player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                    }
                };
            });

            // [4, 3] Пакетная Авто-Выплавка ВСЕХ материалов
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

                    let curCharges = countPlayerItemsBS(player, 'kubejs:steel_charge');
                    let batchSteel = Math.min(curCharges, curFuel);
                    if (batchSteel > 0) {
                        deductPlayerItemsBS(player, 'kubejs:steel_charge', batchSteel);
                        deductPlayerFuelBS(player, batchSteel);
                        addBufferIngots(level, stationPos, 'steel', batchSteel);
                        curFuel -= batchSteel;
                        smeltedSteel += batchSteel;
                    }

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
                        openBlacksmithGUI(player, stationPos);
                    } else {
                        player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                        player.sendSystemMessage(Text.of('§c[Очаг] §7Не найдено сырья для переплавки!'));
                    }
                };
            });

            // [6, 3] Индикатор топлива
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

        } else if (session.tab === 5) {
            // ------------------------------------------------------------------
            // TAB 5: 🌋 [ ТИГЕЛЬ ] (ИНФЕРНАЛЬНЫЕ СПЛАВЫ И МЕТАЛЛУРГИЯ Т2+)
            // ------------------------------------------------------------------
            for (let y = 1; y <= 4; y++) {
                for (let x = 0; x < 9; x++) {
                    gui.slot(x, y, s => { s.setItem(decoPane); s.leftClicked = () => {}; });
                }
            }

            // Ряд 1: Индикаторы буфера мастерской для Т2+ металлов
            // [2, 1] Буфер Пепельного Сплава (Cinder Alloy)
            gui.slot(2, 1, s => {
                let cinCount = buf.cinder || 0;
                s.setItem(Item.of('skd:cinder_alloy_ingot')
                    .withCustomName(Text.of(`§6[ Буфер Пепельного Сплава: ${cinCount} шт. ]`))
                    .withLore([
                        Text.of(`§7Текущий запас в мастерской: §f${cinCount} §7шт.`),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§a▶ ЛКМ: Забрать 1 слиток в инвентарь')
                    ]));
                s.leftClicked = () => {
                    if (buf.cinder > 0) {
                        buf.cinder -= 1;
                        player.give(Item.of('skd:cinder_alloy_ingot', 1));
                        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                        openBlacksmithGUI(player, stationPos);
                    }
                };
            });

            // [4, 1] Центральный статус Тигля
            gui.slot(4, 1, s => {
                s.setItem(Item.of('minecraft:lava_bucket')
                    .withCustomName(Text.of('§4🌋 [ АДСКИЙ ТИГЕЛЬ НЕЗЕРА (Т2/Т3) ]'))
                    .withLore([
                        Text.of('§7Древний очаг первородной магмы для высокотемпературных сплавов.'),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§a✓ Подключен к единому комплексу мастерской'),
                        Text.of('§e• Пепельный Сплав (Cinder Alloy, Т2)'),
                        Text.of('§e• Очищенный Незерит (Refined Netherite, Т2+)'),
                        Text.of('§e• Инфернальный обжиг руды Незера (х2 выход)'),
                        Text.of('§8────────────────────────────────'),
                        Text.of(`§7Доступно топлива в инвентаре: §e${fuelCount} §7ед.`)
                    ]));
                s.leftClicked = () => {};
            });

            // [6, 1] Буфер Очищенного Незерита (Refined Netherite)
            gui.slot(6, 1, s => {
                let nethCount = buf.netherite || 0;
                s.setItem(Item.of('kubejs:refined_netherite_ingot')
                    .withCustomName(Text.of(`§4[ Буфер Очищенного Незерита: ${nethCount} шт. ]`))
                    .withLore([
                        Text.of(`§7Текущий запас в мастерской: §f${nethCount} §7шт.`),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§a▶ ЛКМ: Забрать 1 слиток в инвентарь')
                    ]));
                s.leftClicked = () => {
                    if (buf.netherite > 0) {
                        buf.netherite -= 1;
                        player.give(Item.of('kubejs:refined_netherite_ingot', 1));
                        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_netherite player ${player.username} ~ ~ ~ 0.8 1.2`);
                        openBlacksmithGUI(player, stationPos);
                    }
                };
            });

            // Ряд 2: Операции плавки металлов Т2+
            // [2, 2] Сплавить Пепельный Сплав -> в Буфер мастерской
            gui.slot(2, 2, s => {
                let scrapCount = countPlayerItemsBS(player, 'minecraft:netherite_scrap');
                let magmaCount = countPlayerItemsBS(player, 'minecraft:magma_cream');
                let hasCrucible = session.hasCrucible;
                let canCinder = (hasCrucible && scrapCount >= 1 && magmaCount >= 1 && fuelCount >= 2);
                s.setItem(Item.of('skd:cinder_alloy_ingot')
                    .withCustomName(Text.of('§6🔥 [ Сплавить Пепельный Сплав ]'))
                    .withLore([
                        Text.of('§7Высокотемпературный сплав Незера (Тир 2).'),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§eРецепт: 1x Незеритовый обломок + 1x Сгусток магмы + 2x Топлива'),
                        Text.of('§fВыход: §6+1 Пепельный Сплав §7(направляется в буфер)'),
                        Text.of('§8────────────────────────────────'),
                        Text.of(scrapCount >= 1 ? `§a✓ Обломков незерита: ${scrapCount} шт.` : '§c✗ Нет обломков незерита'),
                        Text.of(magmaCount >= 1 ? `§a✓ Сгустков магмы: ${magmaCount} шт.` : '§c✗ Нет сгустков магмы'),
                        Text.of(fuelCount >= 2 ? `§a✓ Топлива: ${fuelCount} ед.` : '§c✗ Требуется 2 ед. топлива'),
                        Text.of(hasCrucible ? '§a✓ Адский Горн рядом: Жар достаточен' : '§c✗ ТРЕБУЕТСЯ АДСКИЙ ГОРН РЯДОМ!'),
                        Text.of('§8────────────────────────────────'),
                        Text.of(!hasCrucible ? '§c🔒 Требуется Адский Горн для инфернальных сплавов!' : (canCinder ? '§a▶ ЛКМ: Выплавить в буфер мастерской' : '§c🔒 Недостаточно компонентов'))
                    ]));
                s.leftClicked = () => {
                    if (!session.hasCrucible) {
                        player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                        player.sendSystemMessage(Text.of('§c[Кузница] §7Для выплавки инфернальных сплавов требуется Адский Горн рядом (в радиусе 4 блоков)!'));
                        return;
                    }
                    let curScrap = countPlayerItemsBS(player, 'minecraft:netherite_scrap');
                    let curMagma = countPlayerItemsBS(player, 'minecraft:magma_cream');
                    let curFuel = countPlayerFuelBS(player);
                    if (curScrap >= 1 && curMagma >= 1 && curFuel >= 2) {
                        deductPlayerItemsBS(player, 'minecraft:netherite_scrap', 1);
                        deductPlayerItemsBS(player, 'minecraft:magma_cream', 1);
                        deductPlayerFuelBS(player, 2);
                        addBufferIngots(level, stationPos, 'cinder', 1);

                        player.server.runCommandSilent(`playsound minecraft:block.lava.extinguish player ${player.username} ~ ~ ~ 1.0 0.9`);
                        player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.9 1.1`);
                        player.server.runCommandSilent(`particle minecraft:lava ~ ~1.2 ~ 0.4 0.3 0.4 0.05 25`);
                        player.sendSystemMessage(Text.of('§4🌋 [Тигель] §fВыплавлен §6+1 Пепельный Сплав§f в буфер мастерской!'));
                        openBlacksmithGUI(player, stationPos);
                    } else {
                        player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                    }
                };
            });

            // [4, 2] Отлить Очищенный Незерит -> в Буфер мастерской
            gui.slot(4, 2, s => {
                let netheriteIngots = countPlayerItemsBS(player, 'minecraft:netherite_ingot');
                let curCinder = countPlayerItemsBS(player, 'skd:cinder_alloy_ingot') + (buf.cinder || 0);
                let canRefined = (netheriteIngots >= 1 && curCinder >= 1 && fuelCount >= 4);
                s.setItem(Item.of('kubejs:refined_netherite_ingot')
                    .withCustomName(Text.of('§4✦ [ Отлить Очищенный Незерит ]'))
                    .withLore([
                        Text.of('§7Предельно очищенный сплав инфернального огня.'),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§eРецепт: 1x Незеритовый слиток + 1x Пепельный сплав + 4x Топлива'),
                        Text.of('§fВыход: §4+1 Очищенный Незерит §7(направляется в буфер)'),
                        Text.of('§8────────────────────────────────'),
                        Text.of(netheriteIngots >= 1 ? `§a✓ Незеритовых слитков: ${netheriteIngots} шт.` : '§c✗ Нет незеритовых слитков'),
                        Text.of(curCinder >= 1 ? `§a✓ Пепельного сплава (инв+буфер): ${curCinder} шт.` : '§c✗ Нет пепельного сплава'),
                        Text.of(fuelCount >= 4 ? `§a✓ Топлива: ${fuelCount}/4 ед.` : `§c✗ Топлива: ${fuelCount}/4 ед.`),
                        Text.of('§8────────────────────────────────'),
                        Text.of(canRefined ? '§a▶ ЛКМ: Отлить в буфер мастерской' : '§c🔒 Недостаточно компонентов')
                    ]));
                s.leftClicked = () => {
                    let curNeth = countPlayerItemsBS(player, 'minecraft:netherite_ingot');
                    let curCinInv = countPlayerItemsBS(player, 'skd:cinder_alloy_ingot');
                    let curCinBuf = buf.cinder || 0;
                    let curFuel = countPlayerFuelBS(player);

                    if (curNeth >= 1 && (curCinInv + curCinBuf >= 1) && curFuel >= 4) {
                        deductPlayerItemsBS(player, 'minecraft:netherite_ingot', 1);
                        if (curCinBuf >= 1) {
                            buf.cinder -= 1;
                        } else {
                            deductPlayerItemsBS(player, 'skd:cinder_alloy_ingot', 1);
                        }
                        deductPlayerFuelBS(player, 4);
                        addBufferIngots(level, stationPos, 'netherite', 1);

                        player.server.runCommandSilent(`playsound minecraft:block.blastfurnace.fire_crackle player ${player.username} ~ ~ ~ 1.0 0.8`);
                        player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 1.0 1.2`);
                        player.server.runCommandSilent(`particle minecraft:lava ~ ~1.2 ~ 0.5 0.3 0.5 0.08 30`);
                        player.sendSystemMessage(Text.of('§4🌋 [Тигель] §fОтлит §4+1 Очищенный Незеритовый Слиток§f в буфер мастерской!'));
                        openBlacksmithGUI(player, stationPos);
                    } else {
                        player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                    }
                };
            });

            // [6, 2] Инфернальный Обжиг Золотой Руды
            gui.slot(6, 2, s => {
                let goldOreCount = countPlayerItemsBS(player, 'minecraft:nether_gold_ore');
                let canGold = (goldOreCount >= 1 && fuelCount >= 1);
                s.setItem(Item.of('minecraft:nether_gold_ore')
                    .withCustomName(Text.of('§e⚡ [ Инфернальный Обжиг Золотой Руды ]'))
                    .withLore([
                        Text.of('§7Мгновенный высокотемпературный обжиг адской руды.'),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§eРецепт: 1x Адская золотая руда + 1x Топливо -> +2 Золотых слитка!'),
                        Text.of(goldOreCount >= 1 ? `§a✓ Адской руды: ${goldOreCount} шт.` : '§c✗ Нет адской золотой руды'),
                        Text.of(fuelCount >= 1 ? `§a✓ Топлива: ${fuelCount} ед.` : '§c✗ Нет топлива'),
                        Text.of('§8────────────────────────────────'),
                        Text.of(canGold ? '§a▶ ЛКМ: Обжечь (х2 выход!)' : '§c🔒 Недостаточно руды или топлива')
                    ]));
                s.leftClicked = () => {
                    let curOre = countPlayerItemsBS(player, 'minecraft:nether_gold_ore');
                    let curFuel = countPlayerFuelBS(player);
                    if (curOre >= 1 && curFuel >= 1) {
                        deductPlayerItemsBS(player, 'minecraft:nether_gold_ore', 1);
                        deductPlayerFuelBS(player, 1);
                        player.give(Item.of('minecraft:gold_ingot', 2));

                        player.server.runCommandSilent(`playsound minecraft:block.blastfurnace.fire_crackle player ${player.username} ~ ~ ~ 1.0 1.2`);
                        player.server.runCommandSilent(`particle minecraft:flame ~ ~1.2 ~ 0.3 0.3 0.3 0.05 20`);
                        player.sendSystemMessage(Text.of('§e⚡ [Тигель] §fВыплавлено §6+2 Золотых Слитка§f!'));
                        openBlacksmithGUI(player, stationPos);
                    } else {
                        player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                    }
                };
            });

            // Ряд 3: Загрузка слитков Т2+ в буфер и Пакетная плавка
            // [3, 3] Загрузить Cinder & Netherite в буфер
            gui.slot(3, 3, s => {
                let invCin = countPlayerItemsBS(player, 'skd:cinder_alloy_ingot');
                let invNeth = countPlayerItemsBS(player, 'kubejs:refined_netherite_ingot') + countPlayerItemsBS(player, 'minecraft:netherite_ingot');
                let totalT2 = invCin + invNeth;
                s.setItem(Item.of('minecraft:hopper')
                    .withCustomName(Text.of('§e📥 [ Загрузить Слитки Т2+ в Буфер ]'))
                    .withLore([
                        Text.of('§7Переместить пепельный сплав и незерит из сумки в буфер.'),
                        Text.of('§8────────────────────────────────'),
                        Text.of(`§7В инвентаре: Пепельный сплав: ${invCin}, Незерит: ${invNeth}`),
                        Text.of('§8────────────────────────────────'),
                        Text.of(totalT2 > 0 ? '§a▶ Нажмите ЛКМ для загрузки всех слитков Т2+' : '§c🔒 Нет слитков Т2+ в сумке')
                    ]));
                s.leftClicked = () => {
                    let curCin = countPlayerItemsBS(player, 'skd:cinder_alloy_ingot');
                    let curRef = countPlayerItemsBS(player, 'kubejs:refined_netherite_ingot');

                    if (curCin > 0) {
                        deductPlayerItemsBS(player, 'skd:cinder_alloy_ingot', curCin);
                        addBufferIngots(level, stationPos, 'cinder', curCin);
                    }
                    if (curRef > 0) {
                        deductPlayerItemsBS(player, 'kubejs:refined_netherite_ingot', curRef);
                        addBufferIngots(level, stationPos, 'netherite', curRef);
                    }

                    if (curCin > 0 || curRef > 0) {
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.9 1.1`);
                        player.sendSystemMessage(Text.of('§a📥 [Буфер Тигля] §fСлитки Т2+ перемещены в накопитель мастерской!'));
                        openBlacksmithGUI(player, stationPos);
                    } else {
                        player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                    }
                };
            });

            // [5, 3] Пакетная плавка Пепельного Сплава
            gui.slot(5, 3, s => {
                let hasCrucible = session.hasCrucible;
                let scrapCount = countPlayerItemsBS(player, 'minecraft:netherite_scrap');
                let magmaCount = countPlayerItemsBS(player, 'minecraft:magma_cream');
                let maxBatch = hasCrucible ? Math.min(scrapCount, magmaCount, Math.floor(fuelCount / 2)) : 0;
                s.setItem(Item.of('minecraft:blaze_powder')
                    .withCustomName(Text.of('§c🔥 [ Пакетная Плавка Пепельного Сплава ]'))
                    .withLore([
                        Text.of('§7Выплавить максимальное количество пепельного сплава в 1 клик.'),
                        Text.of('§8────────────────────────────────'),
                        Text.of(`§7Доступно для выплавки: §6${maxBatch} §7слитков`),
                        Text.of(`§7Обломков: ${scrapCount} | Сгустков магмы: ${magmaCount} | Топлива: ${fuelCount}`),
                        Text.of('§8────────────────────────────────'),
                        Text.of(maxBatch > 0 ? '§a▶ Нажмите ЛКМ для пакетной выплавки' : '§c🔒 Недостаточно ресурсов для плавки')
                    ]));
                s.leftClicked = () => {
                    let curScrap = countPlayerItemsBS(player, 'minecraft:netherite_scrap');
                    let curMagma = countPlayerItemsBS(player, 'minecraft:magma_cream');
                    let curFuel = countPlayerFuelBS(player);
                    let batch = Math.min(curScrap, curMagma, Math.floor(curFuel / 2));

                    if (batch > 0) {
                        deductPlayerItemsBS(player, 'minecraft:netherite_scrap', batch);
                        deductPlayerItemsBS(player, 'minecraft:magma_cream', batch);
                        deductPlayerFuelBS(player, batch * 2);
                        addBufferIngots(level, stationPos, 'cinder', batch);

                        player.server.runCommandSilent(`playsound minecraft:block.blastfurnace.fire_crackle player ${player.username} ~ ~ ~ 1.0 1.0`);
                        player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.9 1.2`);
                        player.server.runCommandSilent(`particle minecraft:lava ~ ~1.2 ~ 0.5 0.4 0.5 0.08 35`);
                        player.sendSystemMessage(Text.of(`§4🌋 [Тигель] §fПакетно выплавлено §6+${batch} Пепельного Сплава§f в буфер мастерской!`));
                        openBlacksmithGUI(player, stationPos);
                    } else {
                        player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                        player.sendSystemMessage(Text.of('§c[Тигель] §7Недостаточно ресурсов или топлива!'));
                    }
                };
            });

        } else if (session.tab === 6) {
            // ------------------------------------------------------------------
            // TAB 6: 🌌 [ НАКОВАЛЬНЯ ] (РУНИЧЕСКАЯ ЗАТОЧКА И СНЯТИЕ ШТРАФОВ)
            // ------------------------------------------------------------------
            for (let y = 1; y <= 4; y++) {
                for (let x = 0; x < 9; x++) {
                    gui.slot(x, y, s => { s.setItem(decoPane); s.leftClicked = () => {}; });
                }
            }

            // Центральный статус Наковальни
            gui.slot(4, 1, s => {
                s.setItem(Item.of('minecraft:crying_obsidian')
                    .withCustomName(Text.of('§5🌌 [ НАКОВАЛЬНЯ БЕЗДНЫ (Т5 THE END) ]'))
                    .withLore([
                        Text.of('§7Пустотный монолит рунической гармонизации и закалки.'),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§a✓ Подключена к единому комплексу мастерской'),
                        Text.of('§e• Снятие штрафов перековки экипировки'),
                        Text.of('§e• Доступ к Алтарю Глубокой Заточки (+1..+15 Lineage 2)'),
                        Text.of('§e• Руническая закалка и стабилизация Аур')
                    ]));
                s.leftClicked = () => {};
            });

            // Кнопка 1: Открыть Алтарь Глубокой Заточки (Infernal Forge UI)
            gui.slot(3, 2, s => {
                s.setItem(Item.of('kubejs:smithing_stone_1')
                    .withCustomName(Text.of('§d⚡ [ Алтарь Заточки +1..+15 (Lineage 2) ]'))
                    .withLore([
                        Text.of('§7Перейти к полноразмерному алтарю глубокой заточки снаряжения.'),
                        Text.of('§7Использует Оселки I..V, Печати Эгиды и пробуждает Ауры.'),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§a▶ Нажмите ЛКМ для открытия интерфейса заточки')
                    ]));
                s.leftClicked = () => {
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.9 1.1`);
                    if (typeof openInfernalAnvilGUI === 'function') {
                        openInfernalAnvilGUI(player);
                    } else {
                        player.server.runCommandSilent(`execute as ${player.username} run infernal_anvil`);
                    }
                };
            });

            // Кнопка 2: Руническое Снятие Штрафов / Очищение
            gui.slot(5, 2, s => {
                let tearCount = countPlayerItemsBS(player, 'minecraft:ghast_tear');
                let lapisCount = countPlayerItemsBS(player, 'minecraft:lapis_lazuli');
                let canPurify = (tearCount >= 1 && lapisCount >= 4);
                s.setItem(Item.of('minecraft:amethyst_shard')
                    .withCustomName(Text.of('§b✨ [ Руническое Снятие Штрафов ]'))
                    .withLore([
                        Text.of('§7Стабилизирует кристаллическую решетку поврежденного оружия.'),
                        Text.of('§7Снимает штраф перековки и восстанавливает резонанс.'),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§eТребуется: 1x Слеза гаста + 4x Лазурит'),
                        Text.of(tearCount >= 1 ? `§a✓ Слез гаста: ${tearCount} шт.` : '§c✗ Нет слезы гаста'),
                        Text.of(lapisCount >= 4 ? `§a✓ Лазурита: ${lapisCount}/4 шт.` : `§c✗ Лазурита: ${lapisCount}/4 шт.`),
                        Text.of('§8────────────────────────────────'),
                        Text.of(canPurify ? '§a▶ Нажмите ЛКМ для рунического очищения' : '§c🔒 Недостаточно реагентов')
                    ]));
                s.leftClicked = () => {
                    let curTear = countPlayerItemsBS(player, 'minecraft:ghast_tear');
                    let curLapis = countPlayerItemsBS(player, 'minecraft:lapis_lazuli');
                    if (curTear >= 1 && curLapis >= 4) {
                        deductPlayerItemsBS(player, 'minecraft:ghast_tear', 1);
                        deductPlayerItemsBS(player, 'minecraft:lapis_lazuli', 4);

                        player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 1.0 1.2`);
                        player.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${player.username} ~ ~ ~ 0.8 1.5`);
                        player.server.runCommandSilent(`particle minecraft:enchant ~ ~1.2 ~ 0.5 0.5 0.5 0.2 40`);
                        player.sendSystemMessage(Text.of('§5🌌 [Наковальня] §aРуническое очищение завершено! Штрафы перековки сняты.'));
                        openBlacksmithGUI(player, stationPos);
                    } else {
                        player.server.runCommandSilent(`playsound minecraft:block.stone.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                    }
                };
            });

            // Инфо-строка
            gui.slot(4, 3, s => {
                s.setItem(Item.of('minecraft:ender_eye')
                    .withCustomName(Text.of('§d👁 [ Резонанс Бездны: Активен ]'))
                    .withLore([
                        Text.of('§7Наковальня стабилизирует пространственные аномалии.'),
                        Text.of('§7Используйте для финальной доводки легендарных артефактов.'),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§a✓ Полная совместимость с каноном 8 Тиров Элириума.')
                    ]));
                s.leftClicked = () => {};
            });
        }

        // ======================================================================
        // ROW 5: НИЖНИЙ КАРНИЗ И РУКОВОДСТВО
        // ======================================================================
        for (let x = 0; x < 9; x++) {
            if (x === 4) {
                gui.slot(4, 5, s => {
                    s.setItem(Item.of('minecraft:compass')
                        .withCustomName(Text.of('§e[ Руководство Единой Мастерской ]'))
                        .withLore([
                            Text.of('§7Свободная Мастерская объединяет 4 станции в радиусе 4 блоков:'),
                            Text.of('§6• Верстак Оружейника §7(Оружие, Доспехи, Инструменты)'),
                            Text.of('§c• Кузнечный Очаг §7(Ремонт +50%, Металлургия и Буфер)'),
                            Text.of('§4• Адский Тигель §7(Высокотемпературные сплавы Незера)'),
                            Text.of('§5• Наковальня Бездны §7(Руническая заточка +1..+10)'),
                            Text.of('§8────────────────────────────────'),
                            Text.of('§a✓ Все 4 блока делят общий интерфейс и буфер материалов!')
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
// OPEN BLACKSMITH HEARTH SMELTER GUI (COMPATIBILITY REDIRECT TO MASTER GUI TAB 4)
// ------------------------------------------------------------------------------
function openHearthSmelterGUI(player, stationPos) {
    let session = getOrCreateBlacksmithSession(player);
    session.tab = 4;
    openBlacksmithGUI(player, stationPos);
}

// ------------------------------------------------------------------------------
// RIGHT CLICK EVENT HOOKS (ALL 4 BLOCKS OPEN UNIFIED MASTER WORKSHOP GUI)
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
    session.tab = 4; // Native Hearth tab in Unified Workshop GUI
    openBlacksmithGUI(player, event.block.pos);
    player.server.runCommandSilent(`playsound minecraft:block.blastfurnace.fire_crackle player ${player.username} ~ ~ ~ 0.8 1.0`);
});

// 3. Right click on Infernal Crucible
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

    let session = getOrCreateBlacksmithSession(player);
    session.tab = 5; // Native Crucible tab in Unified Workshop GUI
    openBlacksmithGUI(player, event.block.pos);
});

// 4. Right click on Void Anvil
BlockEvents.rightClicked('kubejs:void_anvil', event => {
    let player = event.player;
    if (!player || player.level.isClientSide()) return;
    let handStr = event.hand ? String(event.hand) : 'MAIN_HAND';
    if (!handStr.includes('MAIN')) return;

    event.cancel();
    player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.8 1.0`);

    let session = getOrCreateBlacksmithSession(player);
    session.tab = 6; // Native Anvil tab in Unified Workshop GUI
    openBlacksmithGUI(player, event.block.pos);
});

// Cleanup on logout
PlayerEvents.loggedOut(event => {
    if (event.player) clearBlacksmithSession(event.player);
});
