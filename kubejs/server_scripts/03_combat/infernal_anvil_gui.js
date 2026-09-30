// ==============================================================================
// 🔥 ELYRIUM RPG: INFERNAL ANVIL & FORGE UI/UX ENGINE (v2.2: PREMIER RPG GUI & QUICK-CYCLE)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// Премиальный эргономичный графический интерфейс древнего Алтаря Преисподней.
// Полностью отделен от логики расчетов и привязан к глобальному бэкенд-движку
// ElyriumForgeAPI (разработанному Серверным Архитектором).
//
// Архитектура экрана (4 ряда / 36 слотов верхнего алтаря + 36 слотов инвентаря игрока):
//
// Row 0 (Y=0): ИНФЕРНАЛЬНЫЙ КАРНИЗ И СТАТУСНЫЙ МОНИТОР
//   [0,0] Плачущий Обсидиан | [1..3,0] Лавовые Плиты | [4,0] 👑 АЛТАРЬ ПЕРВОРОДНОГО ПЛАМЕНИ | [5..7,0] Лавовые Плиты | [8,0] Плачущий Обсидиан
//
// Row 1 (Y=1): РАБОЧАЯ ЛИНИЯ АЛТАРЯ КОВКИ (СВЯЩЕННЫЕ ПЬЕДЕСТАЛЫ)
//   [0,1] Базальтовая Колонна
//   [1,1] СЛОТ I:   ГОРНИЛО АРТЕФАКТА (Оружие, Броня, Щит)
//   [2,1] КАНАЛ I:  ПОТОК МАГМЫ [»»»]
//   [3,1] СЛОТ II:  КАТАЛИЗАТОР ПЛАМЕНИ (Камни I..V, Скрижали, Шаблоны)
//   [4,1] ЦЕНТР:    ТИГЕЛЬ СИНТЕЗА [✦]
//   [5,1] СЛОТ III: СВЯТИЛИЩЕ ЭГИДЫ (kubejs:smithing_aegis - защита от отката)
//   [6,1] КАНАЛ II: СТОК АПОГЕЯ [»»»]
//   [7,1] СЛОТ IV:  ПЬЕДЕСТАЛ АПОГЕЯ (Готовый артефакт, 0 XP чистый забор)
//   [8,1] Базальтовая Колонна
//
// Row 2 (Y=2): КОМАНДНЫЙ МОСТ И КУЗНЕЧНЫЙ МОЛОТ
//   [0,2] 📖 Кодекс 11 Тиров  | [1,2] Руна Огня | [2,2] ⚡ Авто-камень | [3,2] Руна Огня
//   [4,2] 🔨 СЕРДЦЕ КУЗНИ: ВЕЛИКИЙ ИНФЕРНАЛЬНЫЙ МОЛОТ (Расчет шанса и запуск)
//   [5,2] Руна Огня          | [6,2] 🛡 Авто-Эгида | [7,2] Руна Огня | [8,2] ✖ Выход
//
// Row 3 (Y=3): НИЖНИЙ ПЬЕДЕСТАЛ И СЕРВИС
//   [0..3,3] Полированный Базальт | [4,3] 🔄 Очистить Алтарь | [5..8,3] Полированный Базальт
//
// + ИНТЕЛЛЕКТУАЛЬНЫЙ 1-КЛИК РОУТИНГ (gui.inventoryClicked):
//   Клик по предмету в инвентаре снизу моментально маршрутизирует его в нужный слот!
// ==============================================================================

// Таблица названий камней для интерфейсных подсказок
const STONE_DISPLAY_NAMES = {
    'kubejs:smithing_stone_1': '§bКузнечный Камень I (Пепельный / +1..+3)',
    'kubejs:smithing_stone_2': '§dКузнечный Камень II (Небесный / +4..+6)',
    'kubejs:smithing_stone_3': '§6Кузнечный Камень III (Драконий / +7..+8)',
    'kubejs:smithing_stone_4': '§5Кузнечный Камень IV (Звездный / +9)',
    'kubejs:smithing_stone_5': '§c✦ Кузнечный Камень V (Скалк-Бездны / +10)'
};

// Сессии игроков
let activeAnvilSessions = new Map();

function getOrCreateAnvilSession(player) {
    let uuid = player.uuid.toString();
    if (!activeAnvilSessions.has(uuid)) {
        activeAnvilSessions.set(uuid, {
            equipment: null,
            reagent: null,
            aegis: null,
            result: null,
            refreshingTime: 0
        });
    }
    return activeAnvilSessions.get(uuid);
}

function clearAndRefundAnvilSession(player, force) {
    let uuid = player.uuid.toString();
    let session = activeAnvilSessions.get(uuid);
    if (!session) return;

    // Защита от сброса при быстром обновлении меню (в пределах 350 мс)
    if (!force && session.refreshingTime && (Date.now() - session.refreshingTime < 350)) {
        return;
    }

    if (session.equipment && !session.equipment.isEmpty()) player.give(session.equipment);
    if (session.reagent && !session.reagent.isEmpty()) player.give(session.reagent);
    if (session.aegis && !session.aegis.isEmpty()) player.give(session.aegis);
    if (session.result && !session.result.isEmpty()) player.give(session.result);

    activeAnvilSessions.delete(uuid);
}

// ------------------------------------------------------------------------------
// ВСПОМОГАТЕЛЬНЫЕ ПРОВЕРКИ ИНВЕНТАРЯ И ФИЛЬТРЫ
// ------------------------------------------------------------------------------
function isAnvilGear(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = item.id.toLowerCase();
    return item.hasTag('c:tools/melee_weapon') || item.hasTag('minecraft:swords') ||
           item.hasTag('minecraft:axes') || item.hasTag('c:tools/bows') ||
           item.hasTag('c:tools/crossbows') || item.hasTag('c:weapons') ||
           item.hasTag('minecraft:armors') || item.hasTag('c:armors') ||
           item.hasTag('c:tools/shields') || item.hasTag('c:shields') ||
           id.includes('sword') || id.includes('blade') || id.includes('claymore') ||
           id.includes('katana') || id.includes('dagger') || id.includes('spear') ||
           id.includes('hammer') || id.includes('axe') || id.includes('bow') ||
           id.includes('shield') || id.includes('helmet') || id.includes('chestplate') ||
           id.includes('leggings') || id.includes('boots');
}

function isValidAnvilReagent(item) {
    if (!item || item.isEmpty()) return false;
    let id = item.id;
    return id.startsWith('kubejs:smithing_stone_') ||
           id.startsWith('kubejs:ascension_catalyst_t') ||
           id.startsWith('kubejs:martial_tablet_') ||
           id === 'kubejs:tier_upgrade_template';
}

// Генератор стилизованного прогресс-бара шанса
function createProgressBar(percent) {
    let totalBars = 10;
    let filled = Math.max(0, Math.min(totalBars, Math.round((percent / 100) * totalBars)));
    let barStr = '';
    for (let i = 0; i < totalBars; i++) {
        if (i < filled) barStr += '■';
        else barStr += '□';
    }
    return barStr;
}

// ------------------------------------------------------------------------------
// ВИЗУАЛИЗАЦИЯ СЛОТОВ АЛТАРЯ КОВКИ
// ------------------------------------------------------------------------------

// СЛОТ I: ЭКИПИРОВКА
function getSlot1Item(session) {
    if (session.equipment && !session.equipment.isEmpty()) {
        return session.equipment;
    }
    return Item.of('minecraft:netherite_upgrade_smithing_template')
        .withCustomName(Text.of('§b✦ [ ГОРНИЛО АРТЕФАКТА ] ✦'))
        .withLore([
            Text.of('§7Установите оружие, элемент брони или боевой щит.'),
            Text.of('§8────────────────────────────────'),
            Text.of('§a▶ Нажмите на предмет в сумке снизу,'),
            Text.of('   §aчтобы мгновенно перенести его в Горнило!'),
            Text.of('§e▶ Или кликните сюда для подбора из руки.')
        ]);
}

// СЛОТ II: РЕАГЕНТ (КАТАЛИЗАТОР)
function getSlot2Item(session) {
    if (session.reagent && !session.reagent.isEmpty()) {
        return session.reagent;
    }

    let evalData = null;
    if (ElyriumForgeAPI && session.equipment && !session.equipment.isEmpty()) {
        try {
            evalData = ElyriumForgeAPI.evaluate(session.equipment, null, session.aegis);
        } catch (e) {}
    }

    let lore = [
        Text.of('§7Кузнечный Камень (I..V), Скрижаль или Шаблон.'),
        Text.of('§8────────────────────────────────')
    ];

    if (evalData && evalData.requiredReagentId) {
        let reqName = STONE_DISPLAY_NAMES[evalData.requiredReagentId] || evalData.requiredReagentId;
        lore.push(Text.of('§eДля текущего предмета требуется:'));
        lore.push(Text.of(`§6➔ ${reqName}`));
        lore.push(Text.of('§8────────────────────────────────'));
    }

    lore.push(Text.of('§a▶ Кликните камень в сумке снизу для установки!'));
    lore.push(Text.of('§e▶ Или нажмите [⚡ Авто-камень] на панели управления.'));

    return Item.of('minecraft:blaze_powder')
        .withCustomName(Text.of('§6✦ [ КАТАЛИЗАТОР ПЛАМЕНИ ] ✦'))
        .withLore(lore);
}

// СЛОТ III: ПЕЧАТЬ ЭГИДЫ
function getSlot3Item(session) {
    if (session.aegis && !session.aegis.isEmpty()) {
        return session.aegis;
    }

    let curLvl = 0;
    if (ElyriumForgeAPI && session.equipment && !session.equipment.isEmpty()) {
        try {
            curLvl = ElyriumForgeAPI.getReinforceLevel(session.equipment);
        } catch (e) {}
    }

    let title = '§d✦ [ СВЯТИЛИЩЕ ЭГИДЫ ] ✦';
    let lore = [];

    if (!session.equipment || session.equipment.isEmpty()) {
        lore.push(Text.of('§7Печать Кузнечной Эгиды (§fkubejs:smithing_aegis§7).'));
        lore.push(Text.of('§8────────────────────────────────'));
        lore.push(Text.of('§6• Полностью защищает предмет от отката при неудаче!'));
        lore.push(Text.of('§8(Не требуется для безопасных уровней +0..+2)'));
        lore.push(Text.of('§a▶ Кликните Печать в сумке снизу для установки.'));
    } else if (curLvl < 3) {
        title = '§a🛡 [ БЕЗОПАСНАЯ ЗОНА: ЗАТЕМНЕНО ]';
        lore.push(Text.of(`§7Текущая закалка предмета: §b+${curLvl}`));
        lore.push(Text.of('§a✓ Закалка до +3 гарантированно безопасна!'));
        lore.push(Text.of('§7Откат уровня невозможен даже при неудаче.'));
        lore.push(Text.of('§8Печать Эгиды здесь не требуется и не будет потрачена.'));
    } else {
        title = '§c⚠️ [ ТРЕБУЕТСЯ ЗАЩИТА ЭГИДЫ! ]';
        lore.push(Text.of(`§7Текущая закалка предмета: §e+${curLvl} §c(ЗОНА РИСКА)`));
        lore.push(Text.of('§4✖ ВНИМАНИЕ! Неудача приведет к откату на -1 уровень!'));
        lore.push(Text.of('§8────────────────────────────────'));
        lore.push(Text.of('§6• Установите Печать Эгиды для 100% спасения от отката.'));
        lore.push(Text.of('§a▶ Кликните Печать в сумке или [🛡 Авто-Эгида].'));
    }

    return Item.of('minecraft:shield')
        .withCustomName(Text.of(title))
        .withLore(lore);
}

// СЛОТ IV: ГОТОВЫЙ РЕЗУЛЬТАТ
function getSlot4Item(session) {
    if (session.result && !session.result.isEmpty()) {
        return session.result;
    }
    return Item.of('minecraft:gold_nugget')
        .withCustomName(Text.of('§e✦ [ ПЬЕДЕСТАЛ АПОГЕЯ ] ✦'))
        .withLore([
            Text.of('§7Здесь появится готовый артефакт после удара молотом.'),
            Text.of('§8────────────────────────────────'),
            Text.of('§a✓ 0 XP / 100% безопасный забор предмета в 1 клик.')
        ]);
}

// ДИНАМИЧЕСКИЙ РАСЧЕТ И ВИЗУАЛИЗАЦИЯ КУЗНЕЧНОГО МОЛОТА
function getHammerDisplayData(session) {
    let buttonItem = Item.of('minecraft:iron_bars');
    let buttonName = '§7[ 🔨 КУЗНЕЧНЫЙ МОЛОТ ОСТЫЛ ]';
    let buttonLore = [];
    let evalData = null;

    if (ElyriumForgeAPI) {
        try {
            evalData = ElyriumForgeAPI.evaluate(session.equipment, session.reagent, session.aegis);
        } catch (e) {
            console.error('[InfernalAnvil] Error calling ElyriumForgeAPI.evaluate: ' + e);
        }
    }

    if (!session.equipment || session.equipment.isEmpty()) {
        buttonLore.push(Text.of('§c❌ Установите экипировку в Слот I!'));
        buttonLore.push(Text.of('§7Оружие, элемент доспеха или щит.'));
        buttonLore.push(Text.of('§e▶ Кликните вещь в сумке снизу для быстрой установки.'));
        return { item: buttonItem.withCustomName(Text.of(buttonName)).withLore(buttonLore), canForge: false, evalData: null };
    }

    if (!session.reagent || session.reagent.isEmpty()) {
        buttonName = '§e[ 🔨 ТРЕБУЕТСЯ КАТАЛИЗАТОР КОВКИ ]';
        buttonLore.push(Text.of(`§7Предмет: §f${session.equipment.hoverName.getString()}`));
        buttonLore.push(Text.of('§c❌ Поместите реагент в Слот II!'));
        if (evalData && evalData.requiredReagentId) {
            let reqName = STONE_DISPLAY_NAMES[evalData.requiredReagentId] || evalData.requiredReagentId;
            buttonLore.push(Text.of(`§eТребуется: §f${reqName}`));
            buttonLore.push(Text.of('§a▶ Кликните камень в сумке или нажмите [⚡ Авто-камень].'));
        }
        return { item: buttonItem.withCustomName(Text.of(buttonName)).withLore(buttonLore), canForge: false, evalData: evalData };
    }

    if (!evalData || !evalData.canExecute) {
        let msg = evalData ? evalData.statusMessage : 'Недопустимая операция';
        buttonItem = Item.of('minecraft:barrier');
        buttonName = '§c✖ КОВКА НЕВОЗМОЖНА';
        buttonLore.push(Text.of(`§7Причина: §e${msg}`));
        if (evalData && evalData.requiredReagentId) {
            let reqName = STONE_DISPLAY_NAMES[evalData.requiredReagentId] || evalData.requiredReagentId;
            buttonLore.push(Text.of(`§eНеобходим: §f${reqName}`));
        }
        return { item: buttonItem.withCustomName(Text.of(buttonName)).withLore(buttonLore), canForge: false, evalData: evalData };
    }

    // Операция готова к исполнению!
    if (evalData.actionType === 'REINFORCE') {
        buttonItem = Item.of('minecraft:anvil').enchant('minecraft:unbreaking', 1);
        buttonName = '§c🔥 [ УДАРИТЬ В АДСКОМ ПЛАМЕНИ ] 🔥';

        let pBar = createProgressBar(evalData.chancePercent);
        buttonLore.push(Text.of('§6✦ ══════════════════════════════ ✦'));
        buttonLore.push(Text.of(`§eПредмет: §f${session.equipment.hoverName.getString()}`));
        buttonLore.push(Text.of(`§eПрогресс закалки: §b+${evalData.currentLevel} §7➔ §a+${evalData.targetLevel}`));
        buttonLore.push(Text.of(`§eВероятность успеха: §a${evalData.chancePercent}%`));
        buttonLore.push(Text.of(`§7Шкала удачи: §6[§a${pBar}§6] §8(${evalData.chancePercent}%)`));
        buttonLore.push(Text.of('§6✦ ══════════════════════════════ ✦'));

        if (evalData.isSafeZone) {
            buttonLore.push(Text.of('§a✓ Безопасная зона (+0..+2): откат уровня невозможен!'));
        } else if (evalData.hasAegis) {
            buttonLore.push(Text.of('§6🛡 ЗАЩИТА АКТИВНА: Печать Эгиды защитит от отката!'));
        } else {
            buttonLore.push(Text.of(`§4⚠ ОПАСНОСТЬ: При неудаче откат до +${evalData.currentLevel - 1}!`));
            buttonLore.push(Text.of('§8(Установите Печать в Слот III для 100% защиты)'));
        }

        buttonLore.push(Text.of('§8────────────────────────────────'));
        buttonLore.push(Text.of('§e▶ Нажмите ЛКМ, чтобы опустить Кузнечный Молот!'));
    } else if (evalData.actionType === 'MARTIAL_TABLET') {
        buttonItem = Item.of('minecraft:enchanted_book');
        buttonName = '§6[ ⚔ ИНКРУСТИРОВАТЬ БОЕВОЕ ИСКУССТВО ]';
        buttonLore.push(Text.of(`§7Скрижаль: §f${session.reagent.hoverName.getString()}`));
        buttonLore.push(Text.of('§a✓ Шанс гравировки: 100% (Гарантированно)'));
        buttonLore.push(Text.of('§8────────────────────────────────'));
        buttonLore.push(Text.of('§e▶ Нажмите ЛКМ для сокетирования приема!'));
    } else if (evalData.actionType === 'ASCENSION') {
        buttonItem = Item.of('minecraft:nether_star').enchant('minecraft:unbreaking', 1);
        buttonName = '§6🔥 [ СОВЕРШИТЬ ВОЗВЫШЕНИЕ ЭПОХИ ] 🔥';

        buttonLore.push(Text.of('§6✦ ══════════════════════════════ ✦'));
        buttonLore.push(Text.of(`§eПредмет: §f${session.equipment.hoverName.getString()}`));
        buttonLore.push(Text.of(`§eЭволюция: §bТир ${evalData.currentTier} §7➔ §6Тир ${evalData.targetTier}`));
        buttonLore.push(Text.of(`§eВероятность успеха: §a100% (Гарантированно)`));
        buttonLore.push(Text.of('§6✦ ══════════════════════════════ ✦'));
        buttonLore.push(Text.of('§a✓ 100% сохранение: Заточка +N, сокеты, скрижали и стихии!'));
        buttonLore.push(Text.of('§a✓ Прочность артефакта полностью восстанавливается!'));
        buttonLore.push(Text.of('§8────────────────────────────────'));
        buttonLore.push(Text.of('§e▶ Нажмите ЛКМ для совершения Возвышения!'));
    } else if (evalData.actionType === 'TIER_TEMPLATE') {
        buttonItem = Item.of('minecraft:smithing_table');
        buttonName = '§d[ 🌟 ПРЕЕМСТВЕННОСТЬ ТИРОВ ]';
        buttonLore.push(Text.of('§7Перенос уровня закалки на экипировку старшего тира.'));
        buttonLore.push(Text.of('§8────────────────────────────────'));
        buttonLore.push(Text.of('§e⚠ Проводится в мире через Ритуал Двух Рук:'));
        buttonLore.push(Text.of('§f  • Новое оружие в правой руке, донор в левой.'));
        buttonLore.push(Text.of('§f  • Имея Шаблон в инвентаре ➔ нажать Shift + ПКМ.'));
        buttonLore.push(Text.of('§8────────────────────────────────'));
        buttonLore.push(Text.of('§7(В Алтаре Горнила доступна закалка одиночных предметов).'));
    }

    return {
        item: buttonItem.withCustomName(Text.of(buttonName)).withLore(buttonLore),
        canForge: true,
        evalData: evalData
    };
}

// ------------------------------------------------------------------------------
// IN-PLACE ОБНОВЛЕНИЕ СЛОТОВ БЕЗ ПЕРЕОТКРЫТИЯ ЭКРАНА (ZERO LAG / ZERO FLICKER)
// ------------------------------------------------------------------------------
function refreshInfernalAnvilGUI(player) {
    let session = getOrCreateAnvilSession(player);
    let menu = player.containerMenu;

    if (menu && menu.data && typeof menu.data.getSlot === 'function') {
        try {
            let data = menu.data;
            let item1 = getSlot1Item(session);
            let item2 = getSlot2Item(session);
            let item3 = getSlot3Item(session);
            let item4 = getSlot4Item(session);
            let itemHammer = getHammerDisplayData(session).item;

            // Обновляем виртуальные слоты в модели меню
            let s1 = data.getSlot(1, 1); if (s1) s1.setItem(item1);
            let s2 = data.getSlot(3, 1); if (s2) s2.setItem(item2);
            let s3 = data.getSlot(5, 1); if (s3) s3.setItem(item3);
            let s4 = data.getSlot(7, 1); if (s4) s4.setItem(item4);
            let sH = data.getSlot(4, 2); if (sH) sH.setItem(itemHammer);

            let slotEntries = [
                { idx: 10, item: item1 },
                { idx: 12, item: item2 },
                { idx: 14, item: item3 },
                { idx: 16, item: item4 },
                { idx: 22, item: itemHammer }
            ];

            let ClientboundContainerSetSlotPacket = null;
            try {
                ClientboundContainerSetSlotPacket = Java.loadClass('net.minecraft.network.protocol.game.ClientboundContainerSetSlotPacket');
            } catch (ePacketClass) {}

            for (let entry of slotEntries) {
                try {
                    if (menu.slots && menu.slots.get(entry.idx)) {
                        menu.slots.get(entry.idx).set(entry.item);
                    }
                } catch (errSlots) {}

                if (ClientboundContainerSetSlotPacket && player.connection) {
                    try {
                        let stateId = (typeof menu.incrementStateId === 'function') ? menu.incrementStateId() : 0;
                        player.connection.send(new ClientboundContainerSetSlotPacket(menu.containerId, stateId, entry.idx, entry.item));
                    } catch (errSend) {}
                }
            }

            try { menu.broadcastFullState(); } catch (eB) {}
            try { if (typeof data.sync === 'function') data.sync(); } catch (eS) {}
            return;
        } catch (e) {
            console.error('[InfernalAnvil] In-place refresh error: ' + e);
        }
    }

    session.refreshingTime = Date.now();
    openInfernalAnvilGUI(player);
}

// ------------------------------------------------------------------------------
// ГЛАВНЫЙ ИНТЕРФЕЙС АЛТАРЯ АДСКОЙ НАКОВАЛЬНИ (ПРЕМИАЛЬНЫЙ 4-РЯДНЫЙ RPG GUI)
// ------------------------------------------------------------------------------
function openInfernalAnvilGUI(player) {
    let session = getOrCreateAnvilSession(player);

    // Открываем экран с эпическим стилизованным заголовком
    player.openChestGUI(Text.of('🔥 §4§lАДСКИЙ АЛТАРЬ КОВКИ §c✦ §6ЭЛИРИУМ'), 4, gui => {
        gui.playerSlots = true;
        gui.closed = () => {
            clearAndRefundAnvilSession(player, false);
        };

        // ======================================================================
        // ДЕКОРАТИВНЫЙ ИНФЕРНАЛЬНЫЙ ФРЕЙМ (АРХИТЕКТУРА ЗАЛА ОГНЯ)
        // ======================================================================
        let darkBasalt = Item.of('minecraft:black_stained_glass_pane').withCustomName(Text.of('§8✦ Инфернальный Базальт ✦'));
        let lavaRune = Item.of('minecraft:orange_stained_glass_pane').withCustomName(Text.of('§6✦ Руна Неумолимого Пламени ✦'));
        let cryingObsidian = Item.of('minecraft:crying_obsidian').withCustomName(Text.of('§5✦ Плачущий Окоем Бездны ✦'));
        let polishedBasalt = Item.of('minecraft:polished_blackstone_brick_slab').withCustomName(Text.of('§7✦ Плита Алтаря Кузни ✦'));

        // Заполняем декоративные клетки, не перетирая интерактивные слоты
        for (let x = 0; x < 9; x++) {
            for (let y = 0; y < 4; y++) {
                // Пропускаем все рабочие и сервисные слоты
                if ((y === 1 && (x === 1 || x === 2 || x === 3 || x === 4 || x === 5 || x === 6 || x === 7)) ||
                    (y === 2 && (x === 0 || x === 2 || x === 4 || x === 6 || x === 8)) ||
                    (y === 0 && x === 4) ||
                    (y === 3 && x === 4)) {
                    continue;
                }

                let decoItem = darkBasalt;
                if (y === 0) {
                    if (x === 0 || x === 8) decoItem = cryingObsidian;
                    else decoItem = lavaRune;
                } else if (y === 3) {
                    decoItem = polishedBasalt;
                } else if (x === 0 || x === 8) {
                    decoItem = darkBasalt;
                } else if (y === 2) {
                    decoItem = lavaRune;
                }

                gui.slot(x, y, s => {
                    s.setItem(decoItem);
                    s.leftClicked = () => {};
                    s.rightClicked = () => {};
                });
            }
        }

        // ======================================================================
        // ROW 0 (Y=0): ЦЕНТРАЛЬНЫЙ АЛТАРНЫЙ МОНОЛИТ
        // ======================================================================
        gui.slot(4, 0, s => {
            if (typeof s.resetClickHandlers === 'function') s.resetClickHandlers();
            s.setItem(Item.of('minecraft:lodestone')
                .withCustomName(Text.of('§6👑 [ АЛТАРЬ ПЕРВОРОДНОГО ПЛАМЕНИ ] 👑'))
                .withLore([
                    Text.of('§7Священная наковальня древних титанов Элириума.'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§e• Закалка экипировки от +0 до +10 по 11 Тирам.'),
                    Text.of('§e• Инкрустация скрижалей Боевых Искусств.'),
                    Text.of('§e• Перенос заточки через Шаблон Преемственности.'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§a✓ Затраты опыта: 0 XP (Кузница берет лишь металл).')
                ]));
            s.leftClicked = () => {};
            s.rightClicked = () => {};
        });

        // ======================================================================
        // ROW 1 (Y=1): РАБОЧАЯ ЛИНИЯ АЛТАРЯ КОВКИ
        // ======================================================================

        // СЛОТ I: ЭКИПИРОВКА (X=1, Y=1)
        gui.slot(1, 1, s => {
            if (typeof s.resetClickHandlers === 'function') s.resetClickHandlers();
            s.setItem(getSlot1Item(session));
            let clickHandler = () => {
                let sess = getOrCreateAnvilSession(player);
                if (sess.equipment && !sess.equipment.isEmpty()) {
                    player.give(sess.equipment);
                    sess.equipment = null;
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                } else {
                    let main = player.mainHandItem;
                    if (main && !main.isEmpty() && isAnvilGear(main)) {
                        sess.equipment = main.split(1);
                        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                    } else {
                        let inv = player.inventory;
                        let found = false;
                        for (let i = 0; i < inv.size; i++) {
                            let st = inv.getItem(i);
                            if (st && !st.isEmpty() && isAnvilGear(st)) {
                                sess.equipment = st.split(1);
                                player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            player.tell(Text.of('§eℹ В инвентаре не найдено экипировки (оружие, броня, щит).'));
                            player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                        }
                    }
                }
                refreshInfernalAnvilGUI(player);
            };
            s.leftClicked = clickHandler;
            s.rightClicked = clickHandler;
            s.shiftLeftClicked = clickHandler;
            s.shiftRightClicked = clickHandler;
        });

        // МАГМАТИЧЕСКИЙ КАНАЛ I (X=2, Y=1)
        gui.slot(2, 1, s => {
            s.setItem(Item.of('minecraft:blaze_rod').withCustomName(Text.of('§6»»» ПОТОК МАГМЫ »»»')).withLore([Text.of('§7Передача жара Горнила к Катализатору.')]));
            s.leftClicked = () => {}; s.rightClicked = () => {};
        });

        // СЛОТ II: КАТАЛИЗАТОР (X=3, Y=1)
        gui.slot(3, 1, s => {
            if (typeof s.resetClickHandlers === 'function') s.resetClickHandlers();
            s.setItem(getSlot2Item(session));
            let clickHandler = () => {
                let sess = getOrCreateAnvilSession(player);
                if (sess.reagent && !sess.reagent.isEmpty()) {
                    player.give(sess.reagent);
                    sess.reagent = null;
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                } else {
                    let neededStoneId = null;
                    if (ElyriumForgeAPI && sess.equipment && !sess.equipment.isEmpty()) {
                        try {
                            let ev = ElyriumForgeAPI.evaluate(sess.equipment, null, sess.aegis);
                            if (ev && ev.requiredReagentId) neededStoneId = ev.requiredReagentId;
                        } catch (e) {}
                    }

                    let inv = player.inventory;
                    let found = null;
                    for (let i = 0; i < inv.size; i++) {
                        let st = inv.getItem(i);
                        if (st && !st.isEmpty()) {
                            if (neededStoneId && st.id === neededStoneId) { found = st; break; }
                            else if (!neededStoneId && isValidAnvilReagent(st)) { found = st; break; }
                        }
                    }
                    if (found) {
                        sess.reagent = found.split(found.count);
                        player.server.runCommandSilent(`playsound minecraft:item.firecharge.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                    } else {
                        if (neededStoneId) {
                            let stoneName = STONE_DISPLAY_NAMES[neededStoneId] || neededStoneId;
                            player.tell(Text.of(`§eℹ В сумке не найден требуемый ${stoneName}.`));
                        } else {
                            player.tell(Text.of('§eℹ В сумке не найдено подходящих кузнечных камней или скрижалей.'));
                        }
                        player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                    }
                }
                refreshInfernalAnvilGUI(player);
            };
            s.leftClicked = clickHandler;
            s.rightClicked = clickHandler;
            s.shiftLeftClicked = clickHandler;
            s.shiftRightClicked = clickHandler;
        });

        // ЦЕНТРАЛЬНЫЙ ТИГЕЛЬ СИНТЕЗА (X=4, Y=1)
        gui.slot(4, 1, s => {
            s.setItem(Item.of('minecraft:fire_charge').withCustomName(Text.of('§c✦ ЯДРО ИНФЕРНО ✦')).withLore([Text.of('§7Точка концентрации первородного огня.')]));
            s.leftClicked = () => {}; s.rightClicked = () => {};
        });

        // СЛОТ III: ПЕЧАТЬ ЭГИДЫ (X=5, Y=1)
        gui.slot(5, 1, s => {
            if (typeof s.resetClickHandlers === 'function') s.resetClickHandlers();
            s.setItem(getSlot3Item(session));
            let clickHandler = () => {
                let sess = getOrCreateAnvilSession(player);
                if (sess.aegis && !sess.aegis.isEmpty()) {
                    player.give(sess.aegis);
                    sess.aegis = null;
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                } else {
                    let inv = player.inventory;
                    let found = null;
                    for (let i = 0; i < inv.size; i++) {
                        let st = inv.getItem(i);
                        if (st && !st.isEmpty() && st.id === 'kubejs:smithing_aegis') {
                            found = st;
                            break;
                        }
                    }
                    if (found) {
                        sess.aegis = found.split(found.count);
                        player.server.runCommandSilent(`playsound minecraft:item.shield.block player ${player.username} ~ ~ ~ 0.8 1.2`);
                    } else {
                        player.tell(Text.of('§eℹ В инвентаре не найдено Печатей Кузнечной Эгиды.'));
                        player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                    }
                }
                refreshInfernalAnvilGUI(player);
            };
            s.leftClicked = clickHandler;
            s.rightClicked = clickHandler;
            s.shiftLeftClicked = clickHandler;
            s.shiftRightClicked = clickHandler;
        });

        // МАГМАТИЧЕСКИЙ КАНАЛ II (X=6, Y=1)
        gui.slot(6, 1, s => {
            s.setItem(Item.of('minecraft:blaze_rod').withCustomName(Text.of('§6»»» СТОК АПОГЕЯ »»»')).withLore([Text.of('§7Отвод закаленного сплава на пьедестал.')]));
            s.leftClicked = () => {}; s.rightClicked = () => {};
        });

        // СЛОТ IV: ГОТОВЫЙ РЕЗУЛЬТАТ (X=7, Y=1)
        gui.slot(7, 1, s => {
            if (typeof s.resetClickHandlers === 'function') s.resetClickHandlers();
            s.setItem(getSlot4Item(session));
            let takeHandler = () => {
                let sess = getOrCreateAnvilSession(player);
                if (sess.result && !sess.result.isEmpty()) {
                    let res = sess.result;
                    sess.result = null;
                    player.give(res);
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 1.0 1.2`);
                    refreshInfernalAnvilGUI(player);
                }
            };
            let rightClickHandler = () => {
                let sess = getOrCreateAnvilSession(player);
                if (sess.result && !sess.result.isEmpty()) {
                    if (!sess.equipment || sess.equipment.isEmpty()) {
                        sess.equipment = sess.result;
                        sess.result = null;
                        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                        player.tell(Text.of('§a✦ Предмет возвращен в Горнило для следующей закалки!'));
                        refreshInfernalAnvilGUI(player);
                        return;
                    }
                    takeHandler();
                }
            };
            s.leftClicked = takeHandler;
            s.rightClicked = rightClickHandler;
            s.shiftLeftClicked = takeHandler;
            s.shiftRightClicked = rightClickHandler;
        });

        // ======================================================================
        // ROW 2 (Y=2): КОМАНДНЫЙ МОСТ И КУЗНЕЧНЫЙ МОЛОТ
        // ======================================================================

        // 📖 КОДЕКС КУЗНИЦЫ 11 ТИРОВ (X=0, Y=2)
        gui.slot(0, 2, s => {
            if (typeof s.resetClickHandlers === 'function') s.resetClickHandlers();
            s.setItem(Item.of('minecraft:enchanted_book')
                .withCustomName(Text.of('§6📖 [ КОДЕКС КУЗНЕЧНОГО РЕМЕСЛА ]'))
                .withLore([
                    Text.of('§6✦ ТАБЛИЦА ШАНСОВ И 11 ТИРОВ ✦'),
                    Text.of('§b+1: 100% §7(Камень I: Пепельный)'),
                    Text.of('§b+2: 50%  §7(Камень I: Пепельный)'),
                    Text.of('§b+3: 30%  §7(Камень I: Пепельный)'),
                    Text.of('§d+4: 15%  §7(Камень II: Небесный)'),
                    Text.of('§d+5: 10%  §7(Камень II: Небесный)'),
                    Text.of('§d+6: 6%   §7(Камень II: Небесный)'),
                    Text.of('§6+7: 3.5% §7(Камень III: Драконий)'),
                    Text.of('§6+8: 1.8% §7(Камень III: Драконий)'),
                    Text.of('§5+9: 0.8% §7(Камень IV: Звездный)'),
                    Text.of('§c+10: 0.3% §7(Камень V: Скалк-Бездны)'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§a✓ +0..+2: Безопасная зона (откат невозможен).'),
                    Text.of('§4⚠ С +4: Риск падения на -1 ур. при неудаче!'),
                    Text.of('§6🛡 Слот III: Печать Эгиды полностью спасает от отката!'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§e▶ Клик по вещи в сумке ➔ сразу встает в Слот!')
                ]));
            s.leftClicked = () => {}; s.rightClicked = () => {};
        });

        // ⚡ АВТО-ПОИСК КАМНЯ (X=2, Y=2)
        gui.slot(2, 2, s => {
            if (typeof s.resetClickHandlers === 'function') s.resetClickHandlers();
            s.setItem(Item.of('minecraft:compass')
                .withCustomName(Text.of('§e⚡ [ МАГНИТ РЕАГЕНТОВ ]'))
                .withLore([
                    Text.of('§7Автоматически сканирует сумку и заряжает'),
                    Text.of('§7точный кузнечный камень под текущую вещь.'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§e▶ Нажмите ЛКМ для авто-зарядки!')
                ]));
            let autoLoadStone = () => {
                let sess = getOrCreateAnvilSession(player);
                let neededStoneId = null;
                if (ElyriumForgeAPI && sess.equipment && !sess.equipment.isEmpty()) {
                    try {
                        let ev = ElyriumForgeAPI.evaluate(sess.equipment, null, sess.aegis);
                        if (ev && ev.requiredReagentId) neededStoneId = ev.requiredReagentId;
                    } catch (e) {}
                }

                let inv = player.inventory;
                let found = null;
                for (let i = 0; i < inv.size; i++) {
                    let st = inv.getItem(i);
                    if (st && !st.isEmpty()) {
                        if (neededStoneId && st.id === neededStoneId) { found = st; break; }
                        else if (!neededStoneId && isValidAnvilReagent(st)) { found = st; break; }
                    }
                }

                if (found) {
                    if (sess.reagent && !sess.reagent.isEmpty()) player.give(sess.reagent);
                    sess.reagent = found.split(found.count);
                    player.server.runCommandSilent(`playsound minecraft:item.firecharge.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                    player.tell(Text.of(`§a✓ Заряжен: ${sess.reagent.hoverName.getString()}`));
                } else {
                    player.tell(Text.of('§eℹ В сумке не найдено подходящих кузнечных камней.'));
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                }
                refreshInfernalAnvilGUI(player);
            };
            s.leftClicked = autoLoadStone;
            s.rightClicked = autoLoadStone;
        });

        // 🔨 СЕРДЦЕ КУЗНИ: ВЕЛИКИЙ ИНФЕРНАЛЬНЫЙ МОЛОТ (X=4, Y=2)
        gui.slot(4, 2, s => {
            if (typeof s.resetClickHandlers === 'function') s.resetClickHandlers();
            let hammerData = getHammerDisplayData(session);
            s.setItem(hammerData.item);

            let forgeClick = () => {
                let sess = getOrCreateAnvilSession(player);
                let hData = getHammerDisplayData(sess);
                if (!hData.canForge || !hData.evalData || !ElyriumForgeAPI) {
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.7`);
                    return;
                }

                let action = hData.evalData.actionType;
                let bx = player.x, by = player.y, bz = player.z;

                if (action === 'REINFORCE') {
                    // Вызов бэкенда закалки
                    let result = ElyriumForgeAPI.executeForge(player, sess.equipment, sess.reagent, sess.aegis);

                    if (result && result.status !== 'INVALID') {
                        // Списание реагента
                        if (result.consumeReagentCount > 0 && sess.reagent) {
                            sess.reagent.shrink(result.consumeReagentCount);
                            if (sess.reagent.isEmpty()) sess.reagent = null;
                        }

                        // Списание эгиды, если она поглотила откат
                        if (result.consumeAegis && sess.aegis) {
                            sess.aegis.shrink(1);
                            if (sess.aegis.isEmpty()) sess.aegis = null;
                        }

                        // Перемещение готового предмета в Слот IV (Результат)
                        sess.result = result.resultGear;
                        sess.equipment = null;

                        // Визуальные частицы в зависимости от статуса
                        if (result.status === 'SUCCESS') {
                            player.server.runCommandSilent(`particle minecraft:wax_off ${bx} ${by + 1.2} ${bz} 0.4 0.4 0.4 0.05 30`);
                            if (result.newLevel >= 7) {
                                player.server.runCommandSilent(`particle minecraft:totem_of_undying ${bx} ${by + 1.5} ${bz} 0.5 0.5 0.5 0.2 50`);
                            }
                            player.tell(Text.of(`§a${result.message}`));
                        } else if (result.status === 'FAIL_SAVED_BY_AEGIS') {
                            player.server.runCommandSilent(`particle minecraft:enchanted_hit ${bx} ${by + 1.2} ${bz} 0.4 0.4 0.4 0.1 35`);
                            player.tell(Text.of(`§6${result.message}`));
                        } else if (result.status === 'FAIL_SAFE') {
                            player.server.runCommandSilent(`particle minecraft:smoke ${bx} ${by + 1.1} ${bz} 0.3 0.3 0.3 0.02 20`);
                            player.tell(Text.of(`§e${result.message}`));
                        } else if (result.status === 'FAIL_DOWNGRADE') {
                            player.server.runCommandSilent(`particle minecraft:large_smoke ${bx} ${by + 1.2} ${bz} 0.4 0.4 0.4 0.05 30`);
                            player.tell(Text.of(`§c${result.message}`));
                        }
                    } else {
                        player.tell(Text.of('§cОшибка выполнения операции в ElyriumForgeAPI.'));
                    }
                } else if (action === 'MARTIAL_TABLET') {
                    // Вызов бэкенда инкрустации
                    let result = ElyriumForgeAPI.executeMartialInscription(player, sess.equipment, sess.reagent);
                    if (result && result.status === 'SUCCESS') {
                        sess.reagent.shrink(1);
                        if (sess.reagent.isEmpty()) sess.reagent = null;
                        sess.result = result.resultGear;
                        sess.equipment = null;

                        player.server.runCommandSilent(`particle minecraft:portal ${bx} ${by + 1.2} ${bz} 0.4 0.4 0.4 0.1 40`);
                        player.tell(Text.of(`§6${result.message}`));
                    }
                } else if (action === 'ASCENSION') {
                    // Вызов бэкенда возвышения экипировки
                    let result = ElyriumForgeAPI.executeAscension(player, sess.equipment, sess.reagent);
                    if (result && result.status === 'SUCCESS') {
                        sess.reagent.shrink(1);
                        if (sess.reagent.isEmpty()) sess.reagent = null;
                        sess.result = result.resultGear;
                        sess.equipment = null;

                        player.server.runCommandSilent(`particle minecraft:totem_of_undying ${bx} ${by + 1.5} ${bz} 0.5 0.5 0.5 0.2 60`);
                        player.server.runCommandSilent(`particle minecraft:wax_off ${bx} ${by + 1.2} ${bz} 0.4 0.4 0.4 0.05 40`);
                        player.tell(Text.of(`§6${result.message}`));
                    } else if (result) {
                        player.tell(Text.of(`§c${result.message || 'Ошибка возвышения'}`));
                    }
                } else if (action === 'TIER_TEMPLATE') {
                    // Преемственность тиров проводится через ритуал двух рук в мире
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                    player.tell(Text.of('§d🌟 [ПРЕЕМСТВЕННОСТЬ ТИРОВ] §eДля переноса заточки на оружие старшего тира:'));
                    player.tell(Text.of('§f  1. Возьмите новое оружие в правую руку, а старое (закаленное) в левую.'));
                    player.tell(Text.of('§f  2. Имея Шаблон в инвентаре, нажмите §6Shift + ПКМ§f в мире.'));
                    player.tell(Text.of('§7(В Адском Горниле ковка производится над одиночными предметами).'));
                    return;
                }

                refreshInfernalAnvilGUI(player);
            };

            s.leftClicked = forgeClick;
            s.rightClicked = forgeClick;
            s.shiftLeftClicked = forgeClick;
            s.shiftRightClicked = forgeClick;
        });

        // 🛡 АВТО-ЭГИДА (X=6, Y=2)
        gui.slot(6, 2, s => {
            if (typeof s.resetClickHandlers === 'function') s.resetClickHandlers();
            s.setItem(Item.of('minecraft:golden_apple')
                .withCustomName(Text.of('§6🛡 [ АВТО-УСТАНОВКА ЭГИДЫ ]'))
                .withLore([
                    Text.of('§7Находит Печать Кузнечной Эгиды в сумке'),
                    Text.of('§7и мгновенно устанавливает ее в Слот III.'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§e▶ Нажмите ЛКМ для активации защиты!')
                ]));
            let autoLoadAegis = () => {
                let sess = getOrCreateAnvilSession(player);
                let inv = player.inventory;
                let found = null;
                for (let i = 0; i < inv.size; i++) {
                    let st = inv.getItem(i);
                    if (st && !st.isEmpty() && st.id === 'kubejs:smithing_aegis') {
                        found = st;
                        break;
                    }
                }
                if (found) {
                    if (sess.aegis && !sess.aegis.isEmpty()) player.give(sess.aegis);
                    sess.aegis = found.split(found.count);
                    player.server.runCommandSilent(`playsound minecraft:item.shield.block player ${player.username} ~ ~ ~ 0.8 1.4`);
                    player.tell(Text.of('§6✓ Печать Кузнечной Эгиды успешно установлена!'));
                } else {
                    player.tell(Text.of('§eℹ В инвентаре не найдено Печатей Кузнечной Эгиды.'));
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                }
                refreshInfernalAnvilGUI(player);
            };
            s.leftClicked = autoLoadAegis;
            s.rightClicked = autoLoadAegis;
        });

        // ✖ БЕЗОПАСНЫЙ ВЫХОД (X=8, Y=2)
        gui.slot(8, 2, s => {
            if (typeof s.resetClickHandlers === 'function') s.resetClickHandlers();
            s.setItem(Item.of('minecraft:crimson_door')
                .withCustomName(Text.of('§c✖ [ БЕЗОПАСНЫЙ ВЫХОД ]'))
                .withLore([
                    Text.of('§7Все установленные ресурсы немедленно вернутся в инвентарь.'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§e▶ Нажмите для закрытия Алтаря.')
                ]));
            let closeHandler = () => {
                clearAndRefundAnvilSession(player, true);
                player.closeMenu();
            };
            s.leftClicked = closeHandler;
            s.rightClicked = closeHandler;
            s.shiftLeftClicked = closeHandler;
            s.shiftRightClicked = closeHandler;
        });

        // ======================================================================
        // ROW 3 (Y=3): НИЖНЯЯ ПАНЕЛЬ СЕРВИСА
        // ======================================================================

        // 🔄 ОЧИСТИТЬ АЛТАРЬ (X=4, Y=3)
        gui.slot(4, 3, s => {
            if (typeof s.resetClickHandlers === 'function') s.resetClickHandlers();
            s.setItem(Item.of('minecraft:hopper')
                .withCustomName(Text.of('§e🔄 [ СБРОСИТЬ ВСЕ В СУМКУ ]'))
                .withLore([
                    Text.of('§7Возвращает установленную экипировку, реагент'),
                    Text.of('§7и печать обратно в сумку без закрытия меню.'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§e▶ Нажмите ЛКМ для очистки алтаря.')
                ]));
            let refundAll = () => {
                let sess = getOrCreateAnvilSession(player);
                let refunded = false;
                if (sess.equipment && !sess.equipment.isEmpty()) { player.give(sess.equipment); sess.equipment = null; refunded = true; }
                if (sess.reagent && !sess.reagent.isEmpty()) { player.give(sess.reagent); sess.reagent = null; refunded = true; }
                if (sess.aegis && !sess.aegis.isEmpty()) { player.give(sess.aegis); sess.aegis = null; refunded = true; }
                if (refunded) {
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.2`);
                    player.tell(Text.of('§a✓ Все компоненты возвращены в сумку.'));
                }
                refreshInfernalAnvilGUI(player);
            };
            s.leftClicked = refundAll;
            s.rightClicked = refundAll;
        });

        // ======================================================================
        // ИНТЕЛЛЕКТУАЛЬНЫЙ 1-КЛИК РОУТИНГ ИЗ ИНВЕНТАРЯ ИГРОКА (gui.inventoryClicked)
        // ======================================================================
        gui.inventoryClicked = event => {
            let clickedItem = event.item;
            if (!clickedItem || clickedItem.isEmpty() || clickedItem.id === 'minecraft:air') return;

            let ClientboundContainerSetSlotPacket = null;
            try {
                ClientboundContainerSetSlotPacket = Java.loadClass('net.minecraft.network.protocol.game.ClientboundContainerSetSlotPacket');
            } catch (ep) {}

            let syncClickedInventorySlot = () => {
                refreshInfernalAnvilGUI(player);
                if (ClientboundContainerSetSlotPacket && player.connection && event.slot) {
                    try {
                        let menu = player.containerMenu;
                        let stateId = (typeof menu.incrementStateId === 'function') ? menu.incrementStateId() : 0;
                        player.connection.send(new ClientboundContainerSetSlotPacket(menu.containerId, stateId, event.slot.index, event.slot.getItem()));
                    } catch (err) {}
                }
            };

            // 1. Оружие / Броня / Щит ➔ Слот 1 (Горнило Артефакта)
            if (isAnvilGear(clickedItem)) {
                let toEquip = clickedItem.copy();
                toEquip.setCount(1);
                clickedItem.shrink(1);
                event.setItem(clickedItem);

                if (session.equipment && !session.equipment.isEmpty()) {
                    player.give(session.equipment);
                }
                session.equipment = toEquip;

                player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                syncClickedInventorySlot();
                return;
            }

            // 2. Кузнечные Камни / Скрижали / Шаблоны ➔ Слот 2 (Катализатор)
            if (isValidAnvilReagent(clickedItem)) {
                let toReagent = clickedItem.copy();
                event.setItem(Item.empty);

                if (session.reagent && !session.reagent.isEmpty()) {
                    player.give(session.reagent);
                }
                session.reagent = toReagent;

                player.server.runCommandSilent(`playsound minecraft:item.firecharge.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                syncClickedInventorySlot();
                return;
            }

            // 3. Печать Эгиды ➔ Слот 3 (Святилище Эгиды)
            if (clickedItem.id === 'kubejs:smithing_aegis') {
                let toAegis = clickedItem.copy();
                event.setItem(Item.empty);

                if (session.aegis && !session.aegis.isEmpty()) {
                    player.give(session.aegis);
                }
                session.aegis = toAegis;

                player.server.runCommandSilent(`playsound minecraft:item.shield.block player ${player.username} ~ ~ ~ 0.8 1.4`);
                syncClickedInventorySlot();
                return;
            }
        };
    });
}

// ------------------------------------------------------------------------------
// ИНТЕГРАЦИЯ С МИРОМ: ОТКРЫТИЕ АДСКОЙ НАКОВАЛЬНИ
// ------------------------------------------------------------------------------

// 1. Таргетированный клик по блоку Адской Наковальни
BlockEvents.rightClicked('kubejs:infernal_anvil', event => {
    let player = event.player;
    if (!player || player.level.isClientSide()) return;

    let handStr = event.hand ? String(event.hand) : 'MAIN_HAND';
    if (!handStr.includes('MAIN')) return;

    event.cancel();
    openInfernalAnvilGUI(player);
    player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.8 1.0`);
});

// 2. Перехват клика ПКМ с предметом в руке или в приседе
ItemEvents.rightClicked(event => {
    let player = event.player;
    if (!player || player.level.isClientSide()) return;

    let handStr = event.hand ? String(event.hand) : 'MAIN_HAND';
    if (!handStr.includes('MAIN')) return;

    let target = event.target || (player.rayTrace ? player.rayTrace(5.0) : null);
    if (target && target.block && String(target.block.id) === 'kubejs:infernal_anvil') {
        event.cancel();
        openInfernalAnvilGUI(player);
        player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.8 1.0`);
    }
});

// Гарантированный возврат предметов при закрытии инвентаря
PlayerEvents.inventoryClosed(event => {
    let player = event.player;
    if (player) {
        clearAndRefundAnvilSession(player, false);
    }
});

PlayerEvents.loggedOut(event => {
    let player = event.player;
    if (player) {
        clearAndRefundAnvilSession(player, true);
    }
});

// Чат-команда для быстрого тестирования разработчиком
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;
    event.register(
        Commands.literal('infernal_anvil')
            .executes(ctx => {
                let p = ctx.source.player;
                if (p) openInfernalAnvilGUI(p);
                return 1;
            })
    );
});
