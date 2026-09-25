// ==============================================================================
// 🔥 ELYRIUM RPG: INFERNAL ANVIL INTERACTIVE GUI ENGINE (v1.3: EXPANDED 4-ROW RPG GUI)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// Расширенная кузнечная станция (4 ряда / 36 слотов) + Реальный инвентарь игрока:
//
// Row 0 (Y=0): ДЕКОРАТИВНЫЙ АРХИТЕКТУРНЫЙ КАРНИЗ ИНФЕРНО
//   [0,0] Древний Обсидиан | [1..3,0] Огненные Руны | [4,0] 🔥 АЛТАРЬ ПЛАМЕНИ ЭЛИРИУМА | [5..7,0] Огненные Руны | [8,0] Древний Обсидиан
//
// Row 1 (Y=1): РАБОЧАЯ ЛИНИЯ АЛТАРЯ КОВКИ
//   [0,1] Базальтовая Колонна
//   [1,1] СЛОТ 1: ЭКИПИРОВКА (Оружие, Броня, Щит)
//   [2,1] Индикатор Горна [➔]
//   [3,1] СЛОТ 2: РЕАГЕНТ (Кузнечные Камни I..V, Скрижали, Шаблоны)
//   [4,1] Индикатор Синтеза [+]
//   [5,1] СЛОТ 3: ПЕЧАТЬ ЭГИДЫ (kubejs:smithing_aegis - защита от отката)
//   [6,1] Индикатор Горнила [➔]
//   [7,1] СЛОТ 4: ГОТОВЫЙ РЕЗУЛЬТАТ (0 XP, чистый забор)
//   [8,1] Базальтовая Колонна
//
// Row 2 (Y=2): ПАНЕЛЬ УПРАВЛЕНИЯ, ИНДИКАТОРЫ И КУЗНЕЧНЫЙ МОЛОТ
//   [0,2] 📖 Кодекс и Шансы  | [1,2] 📊 Статус Предмета | [2..3,2] Лавовые Руны
//   [4,2] 🔨 ГЛАВНЫЙ КУЗНЕЧНЫЙ МОЛОТ КОВКИ (Живой расчет и запуск)
//   [5..6,2] Лавовые Руны   | [7,2] 🛡 Индикатор Эгиды  | [8,2] ⚡ Авто-поиск камня
//
// Row 3 (Y=3): НИЖНИЙ ПЬЕДЕСТАЛ И ВЫХОД
//   [0..3,3] Теневой Базальт | [4,3] ✖ Безопасный Выход | [5..8,3] Теневой Базальт
//
// + ИНТЕЛЛЕКТУАЛЬНЫЙ 1-КЛИК РОУТИНГ (gui.inventoryClicked):
//   Клик по предмету в инвентаре снизу мгновенно маршрутизирует его в нужный слот!
// ==============================================================================

const INFERNAL_CHANCES = {
    1: 100.0,
    2: 50.0,
    3: 30.0,
    4: 15.0,
    5: 10.0,
    6: 6.0,
    7: 3.5,
    8: 1.8,
    9: 0.8,
    10: 0.3
};

const INFERNAL_REQUIRED_STONES = {
    1: 'kubejs:smithing_stone_1',
    2: 'kubejs:smithing_stone_1',
    3: 'kubejs:smithing_stone_2',
    4: 'kubejs:smithing_stone_2',
    5: 'kubejs:smithing_stone_3',
    6: 'kubejs:smithing_stone_3',
    7: 'kubejs:smithing_stone_4',
    8: 'kubejs:smithing_stone_4',
    9: 'kubejs:smithing_stone_5',
    10: 'kubejs:smithing_stone_5'
};

const INFERNAL_STONE_NAMES = {
    'kubejs:smithing_stone_1': '§7Кузнечный Камень I (+1..+2)',
    'kubejs:smithing_stone_2': '§aКузнечный Камень II (+3..+4)',
    'kubejs:smithing_stone_3': '§9Кузнечный Камень III (+5..+6)',
    'kubejs:smithing_stone_4': '§5Кузнечный Камень IV (+7..+8)',
    'kubejs:smithing_stone_5': '§6Кузнечный Камень V (+9..+10)'
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

function clearAndRefundSession(player, force) {
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
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ПРОВЕРКИ И ТЕГОВ
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
           id.startsWith('kubejs:martial_tablet_') ||
           id === 'kubejs:tier_upgrade_template';
}

function getGearReinforce(item) {
    if (!item || item.isEmpty()) return 0;
    try {
        if (item.customData && item.customData.contains('skd_reinforce')) return item.customData.getInt('skd_reinforce');
        if (item.nbt && item.nbt.contains('skd_reinforce')) return item.nbt.getInt('skd_reinforce');
    } catch (e) {}
    try {
        let DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents');
        let cd = item.get(DataComponents.CUSTOM_DATA);
        if (cd) {
            let tag = cd.copyTag();
            if (tag && tag.contains('skd_reinforce')) {
                return tag.getInt('skd_reinforce');
            }
        }
    } catch (e2) {}
    return 0;
}

function setGearReinforce(item, lvl) {
    if (!item || item.isEmpty()) return;
    let clamped = Math.max(0, Math.min(10, Math.floor(lvl || 0)));

    // 1. Попытка прямой записи в существующий customData
    try {
        if (item.customData && typeof item.customData.putInt === 'function') {
            item.customData.putInt('skd_reinforce', clamped);
            return;
        }
    } catch (e1) {}

    // 2. Гарантированная запись через DataComponents.CUSTOM_DATA (NeoForge 1.21.1)
    try {
        let CompoundTag = Java.loadClass('net.minecraft.nbt.CompoundTag');
        let CustomData = Java.loadClass('net.minecraft.world.item.component.CustomData');
        let DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents');
        let tag = null;
        try {
            let cd = item.get(DataComponents.CUSTOM_DATA);
            if (cd) tag = cd.copyTag();
        } catch (e2) {}
        if (!tag) tag = new CompoundTag();
        tag.putInt('skd_reinforce', clamped);
        item.set(DataComponents.CUSTOM_DATA, CustomData.of(tag));
    } catch (err) {
        console.error('[InfernalAnvil] Error setting reinforce tag: ' + err);
    }
}

function updateGearNameBadge(item, lvl) {
    if (!item || item.isEmpty()) return;
    try {
        let currentName = '';
        try {
            if (item.hoverName) currentName = '' + item.hoverName.getString();
            else if (item.displayName) currentName = '' + item.displayName.getString();
        } catch (eName) {}

        let baseName = currentName
            .replace(/\[\+\d+\]/g, '')
            .replace(/★/g, '')
            .replace(/👑/g, '')
            .replace(/✦/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        let finalComp;
        if (lvl <= 0) {
            finalComp = Text.of(baseName);
        } else {
            let badge = '';
            if (lvl <= 3) badge = `§b[+${lvl}]`;
            else if (lvl <= 6) badge = `§d[+${lvl}]`;
            else if (lvl <= 8) badge = `§6★ [+${lvl}] ★`;
            else badge = `§c✦ §6👑 [+${lvl}] §c✦`;

            finalComp = Text.of(`${baseName} ${badge}`);
        }

        // 1. Установка через DataComponents.CUSTOM_NAME (нативный 1.21.1)
        try {
            let DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents');
            item.set(DataComponents.CUSTOM_NAME, finalComp);
            return;
        } catch (e1) {}

        // 2. KubeJS fallback
        try {
            item.customName = finalComp;
        } catch (e2) {}
    } catch (e) {
        console.error('[InfernalAnvil] Error updating gear badge: ' + e);
    }
}

function getSlot1Item(session) {
    if (session.equipment && !session.equipment.isEmpty()) {
        return session.equipment;
    }
    return Item.of('minecraft:light_blue_stained_glass_pane')
        .withCustomName(Text.aqua('✦ [ СЛОТ I: ЭКИПИРОВКА ]'))
        .withLore([
            Text.gray('Оружие, элемент брони или щит для ковки.'),
            Text.darkGray('──────────────────────────'),
            Text.green('▶ Нажмите на предмет в вашем инвентаре снизу,'),
            Text.green('   чтобы мгновенно перенести его сюда!'),
            Text.yellow('▶ Или кликните сюда для авто-подбора из руки.')
        ]);
}

function getSlot2Item(session) {
    if (session.reagent && !session.reagent.isEmpty()) {
        return session.reagent;
    }
    return Item.of('minecraft:orange_stained_glass_pane')
        .withCustomName(Text.gold('✦ [ СЛОТ II: КУЗНЕЧНЫЙ КАМЕНЬ ]'))
        .withLore([
            Text.gray('Кузнечный Камень (I..V), Скрижаль или Шаблон.'),
            Text.darkGray('──────────────────────────'),
            Text.green('▶ Нажмите на камень в инвентаре снизу,'),
            Text.green('   чтобы мгновенно зарядить наковальню!'),
            Text.yellow('▶ Или кликните сюда для авто-поиска камня.')
        ]);
}

function getSlot3Item(session) {
    if (session.aegis && !session.aegis.isEmpty()) {
        return session.aegis;
    }
    return Item.of('minecraft:purple_stained_glass_pane')
        .withCustomName(Text.darkPurple('✦ [ СЛОТ III: ПЕЧАТЬ ЭГИДЫ ]'))
        .withLore([
            Text.gray('Печать Кузнечной Эгиды (kubejs:smithing_aegis).'),
            Text.darkGray('──────────────────────────'),
            Text.gold('• Полностью защищает предмет от отката при неудаче!'),
            Text.green('▶ Кликните Печать в инвентаре снизу для установки.'),
            Text.darkGray('(Не требуется для безопасных уровней +0..+2)')
        ]);
}

function getSlot4Item(session) {
    if (session.result && !session.result.isEmpty()) {
        return session.result;
    }
    return Item.of('minecraft:lime_stained_glass_pane')
        .withCustomName(Text.green('✦ [ СЛОТ IV: ГОТОВЫЙ РЕЗУЛЬТАТ ]'))
        .withLore([
            Text.gray('Здесь появится готовый предмет после удара молотом.'),
            Text.darkGray('──────────────────────────'),
            Text.green('✓ 0 XP / 100% безопасный забор предмета в 1 клик.')
        ]);
}

function getHammerData(session) {
    let buttonItem = Item.of('minecraft:anvil');
    let buttonName = '§7[ 🔨 КУЗНЕЧНЫЙ МОЛОТ НЕ АКТИВЕН ]';
    let buttonLore = [];
    let canForge = false;
    let forgeActionType = null;
    let calcChance = 0;
    let nextLvl = 0;
    let hasAegisInstalled = (session.aegis && !session.aegis.isEmpty() && session.aegis.id === 'kubejs:smithing_aegis');

    if (!session.equipment || session.equipment.isEmpty()) {
        buttonItem = Item.of('minecraft:iron_bars');
        buttonLore.push(Text.red('❌ Установите экипировку в Слот I!'));
        buttonLore.push(Text.gray('Оружие, броня или щит.'));
        buttonLore.push(Text.yellow('Кликните предмет в сумке снизу для быстрой установки.'));
    } else if (!session.reagent || session.reagent.isEmpty()) {
        buttonItem = Item.of('minecraft:iron_bars');
        buttonName = '§e[ 🔨 ТРЕБУЕТСЯ РЕАГЕНТ ДЛЯ КОВКИ ]';
        buttonLore.push(Text.gold(`Предмет: §f${session.equipment.hoverName.getString()}`));
        buttonLore.push(Text.red('❌ Поместите реагент в Слот II!'));
        let curLvl = getGearReinforce(session.equipment);
        if (curLvl < 10) {
            let reqStone = INFERNAL_REQUIRED_STONES[curLvl + 1];
            buttonLore.push(Text.yellow(`Требуется: §f${INFERNAL_STONE_NAMES[reqStone] || reqStone}`));
            buttonLore.push(Text.gray('Кликните камень в сумке или нажмите авто-поиск.'));
        }
    } else {
        let rId = session.reagent.id;
        let curLvl = getGearReinforce(session.equipment);

        if (rId.startsWith('kubejs:smithing_stone_')) {
            if (curLvl >= 10) {
                buttonItem = Item.of('minecraft:nether_star');
                buttonName = '§6👑 [ АПОГЕЙ БОГОВ ДОСТИГНУТ ]';
                buttonLore.push(Text.green('Этот предмет уже имеет максимальную заточку (+10)!'));
            } else {
                nextLvl = curLvl + 1;
                let reqStone = INFERNAL_REQUIRED_STONES[nextLvl];
                if (rId !== reqStone) {
                    buttonItem = Item.of('minecraft:barrier');
                    buttonName = '§c✖ НЕПОДХОДЯЩИЙ КАМЕНЬ ЗАТОЧКИ';
                    buttonLore.push(Text.red(`Для заточки с +${curLvl} на +${nextLvl} требуется:`));
                    buttonLore.push(Text.yellow(`➔ ${INFERNAL_STONE_NAMES[reqStone] || reqStone}`));
                    buttonLore.push(Text.gray(`В слоте установлен: ${session.reagent.hoverName.getString()}`));
                    buttonLore.push(Text.yellow('Замените камень в Слоте II.'));
                } else {
                    canForge = true;
                    forgeActionType = 'REINFORCE';
                    calcChance = INFERNAL_CHANCES[nextLvl] || 0.3;
                    buttonItem = Item.of('minecraft:anvil').enchant('minecraft:unbreaking', 1);
                    buttonName = '§a[ 🔨 ВЫКОВАТЬ В АДСКОМ ПЛАМЕНИ ]';
                    buttonLore.push(Text.gold(`Предмет: §f${session.equipment.hoverName.getString()}`));
                    buttonLore.push(Text.gold(`Заточка: §b+${curLvl} §7➔ §a+${nextLvl}`));
                    buttonLore.push(Text.white(`Шанс успеха: §e${calcChance}%`));
                    if (curLvl < 3) {
                        buttonLore.push(Text.green('✓ Безопасная зона (+0..+2): откат невозможен'));
                    } else if (hasAegisInstalled) {
                        buttonLore.push(Text.gold('🛡 Защита: Печать установлена! (Откат будет поглощен)'));
                    } else {
                        buttonLore.push(Text.red(`⚠ Внимание: риск отката до +${curLvl - 1} при неудаче!`));
                        buttonLore.push(Text.gray('(Установите Печать в Слот III для защиты)'));
                    }
                    buttonLore.push(Text.darkGray('──────────────────────────'));
                    buttonLore.push(Text.yellow('▶ Нажмите ЛКМ, чтобы ударить молотом!'));
                }
            }
        } else if (rId.startsWith('kubejs:martial_tablet_')) {
            canForge = true;
            forgeActionType = 'MARTIAL_TABLET';
            buttonItem = Item.of('minecraft:enchanted_book');
            buttonName = '§6[ ⚔ ИНКРУСТИРОВАТЬ БОЕВОЕ ИСКУССТВО ]';
            buttonLore.push(Text.gold(`Скрижаль: §f${session.reagent.hoverName.getString()}`));
            buttonLore.push(Text.green('Шанс инкрустации: 100%'));
            buttonLore.push(Text.yellow('▶ Нажмите ЛКМ для гравировки!'));
        } else if (rId === 'kubejs:tier_upgrade_template') {
            canForge = true;
            forgeActionType = 'TIER_TEMPLATE';
            buttonItem = Item.of('minecraft:smithing_table');
            buttonName = '§d[ 🌟 ПРЕЕМСТВЕННОСТЬ ТИРОВ ]';
            buttonLore.push(Text.lightPurple('Перенос заточки на оружие старшего тира'));
            buttonLore.push(Text.green('Шанс: 100%'));
            buttonLore.push(Text.yellow('▶ Нажмите ЛКМ для улучшения!'));
        }
    }

    return {
        item: buttonItem.withCustomName(Text.of(buttonName)).withLore(buttonLore),
        canForge: canForge,
        forgeActionType: forgeActionType,
        calcChance: calcChance,
        nextLvl: nextLvl,
        hasAegisInstalled: hasAegisInstalled
    };
}

function refreshInfernalAnvilGUI(player) {
    let session = getOrCreateAnvilSession(player);
    let menu = player.containerMenu;

    // ВАЖНО: Если меню уже открыто, обновляем слоты НА МЕСТЕ без переоткрытия экрана!
    // Отправка нативных сетевых пакетов исключает сброс мыши в центр экрана,
    // устраняет лаги синхронизации и исключает необходимость кликать книгу!
    if (menu && menu.data && typeof menu.data.getSlot === 'function') {
        try {
            let data = menu.data;
            let item1 = getSlot1Item(session);
            let item2 = getSlot2Item(session);
            let item3 = getSlot3Item(session);
            let item4 = getSlot4Item(session);
            let itemHammer = getHammerData(session).item;

            let s1 = data.getSlot(1, 1);
            if (s1) s1.setItem(item1);

            let s2 = data.getSlot(3, 1);
            if (s2) s2.setItem(item2);

            let s3 = data.getSlot(5, 1);
            if (s3) s3.setItem(item3);

            let s4 = data.getSlot(7, 1);
            if (s4) s4.setItem(item4);

            let sH = data.getSlot(4, 2);
            if (sH) sH.setItem(itemHammer);

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

            try {
                menu.broadcastFullState();
            } catch (eB) {}
            try {
                if (typeof data.sync === 'function') data.sync();
            } catch (eS) {}
            return;
        } catch (e) {
            console.error('[InfernalAnvil] In-place refresh error: ' + e);
        }
    }

    session.refreshingTime = Date.now();
    openInfernalAnvilGUI(player);
}

// ------------------------------------------------------------------------------
// ГЛАВНЫЙ ИНТЕРФЕЙС GUI АДСКОЙ НАКОВАЛЬНИ (РАСШИРЕННЫЙ 4-РЯДНЫЙ ФОРМАТ)
// ------------------------------------------------------------------------------
function openInfernalAnvilGUI(player) {
    let session = getOrCreateAnvilSession(player);

    // 4 ряда (36 слотов верхнего алтаря + 36 слотов инвентаря игрока)
    player.openChestGUI(Text.darkRed('🔥 Адская Наковальня Элириума'), 4, gui => {
        gui.playerSlots = true;

        // Базовый фон: Теневой базальт (пропускаем интерактивные слоты, чтобы не блокировать их хэндлеры!)
        let darkBorder = Item.of('minecraft:black_stained_glass_pane').withCustomName(Text.darkGray(' '));
        for (let x = 0; x < 9; x++) {
            for (let y = 0; y < 4; y++) {
                if ((x === 1 && y === 1) || (x === 3 && y === 1) || (x === 5 && y === 1) || (x === 7 && y === 1) ||
                    (x === 0 && y === 2) || (x === 4 && y === 2) || (x === 8 && y === 2)) {
                    continue;
                }
                gui.slot(x, y, s => {
                    s.setItem(darkBorder);
                    s.leftClicked = () => {};
                    s.rightClicked = () => {};
                });
            }
        }

        // ======================================================================
        // ROW 1 (Y=1): РАБОЧАЯ ЛИНИЯ КОВКИ (ПОДКРАШЕННЫЕ СЛОТЫ 1..4)
        // ======================================================================

        // ----------------------------------------------------------------------
        // СЛОТ 1 (X=1, Y=1): ЭКИПИРОВКА (Оружие, Броня, Щит) - СВЕТЛО-ГОЛУБОЙ СЛОТ
        // ----------------------------------------------------------------------
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
                    // Авто-подбор: сначала главная рука, затем инвентарь
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
                            player.tell(Text.yellow('ℹ В инвентаре не найдено экипировки (оружие, броня, щит).'));
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

        // ----------------------------------------------------------------------
        // СЛОТ 2 (X=3, Y=1): РЕАГЕНТ (Камни I..V, Скрижали) - ОРАНЖЕВЫЙ СЛОТ
        // ----------------------------------------------------------------------
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
                    if (sess.equipment && !sess.equipment.isEmpty()) {
                        let curLvl = getGearReinforce(sess.equipment);
                        if (curLvl < 10) neededStoneId = INFERNAL_REQUIRED_STONES[curLvl + 1];
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
                            let stoneName = INFERNAL_STONE_NAMES[neededStoneId] || neededStoneId;
                            player.tell(Text.yellow(`ℹ В сумке не найден требуемый ${stoneName}.`));
                        } else {
                            player.tell(Text.yellow('ℹ В сумке не найдено подходящих кузнечных камней.'));
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

        // ----------------------------------------------------------------------
        // СЛОТ 3 (X=5, Y=1): ПЕЧАТЬ ЭГИДЫ - ФИОЛЕТОВЫЙ СЛОТ
        // ----------------------------------------------------------------------
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
                        player.tell(Text.yellow('ℹ В инвентаре не найдено Печатей Кузнечной Эгиды.'));
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

        // ----------------------------------------------------------------------
        // СЛОТ 4 (X=7, Y=1): ГОТОВЫЙ РЕЗУЛЬТАТ - ЛАЙМОВЫЙ/ЗЕЛЕНЫЙ СЛОТ
        // ----------------------------------------------------------------------
        gui.slot(7, 1, s => {
            if (typeof s.resetClickHandlers === 'function') s.resetClickHandlers();
            s.setItem(getSlot4Item(session));
            let clickHandler = () => {
                let sess = getOrCreateAnvilSession(player);
                if (sess.result && !sess.result.isEmpty()) {
                    let res = sess.result;
                    sess.result = null;
                    player.give(res);
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 1.0 1.2`);
                    refreshInfernalAnvilGUI(player);
                }
            };
            s.leftClicked = clickHandler;
            s.rightClicked = clickHandler;
            s.shiftLeftClicked = clickHandler;
            s.shiftRightClicked = clickHandler;
        });

        // ======================================================================
        // ROW 2 (Y=2): ПАНЕЛЬ УПРАВЛЕНИЯ, ИНДИКАТОРЫ И КУЗНЕЧНЫЙ МОЛОТ
        // ======================================================================

        // ----------------------------------------------------------------------
        // СПРАВКА / КОДЕКС КОВКИ (X=0, Y=2)
        // ----------------------------------------------------------------------
        gui.slot(0, 2, s => {
            if (typeof s.resetClickHandlers === 'function') s.resetClickHandlers();
            s.setItem(Item.of('minecraft:book')
                .withCustomName(Text.aqua('📖 Кодекс Адской Наковальни'))
                .withLore([
                    Text.gold('✦ ТАБЛИЦА ШАНСОВ ЗАТОЧКИ ✦'),
                    Text.green('+1: 100% | +2: 50% | +3: 30%'),
                    Text.yellow('+4: 15% | +5: 10% | +6: 6%'),
                    Text.gold('+7: 3.5% | +8: 1.8%'),
                    Text.red('+9: 0.8% | +10: 0.3% (Апогей Богов)'),
                    Text.darkGray('──────────────────────────'),
                    Text.green('• +0..+2: Безопасная зона (откат невозможен)'),
                    Text.red('• С +4: Риск отката на -1 уровень при неудаче'),
                    Text.gold('• Слот 3: Печать Эгиды полностью спасает от отката!'),
                    Text.darkGray('──────────────────────────'),
                    Text.aqua('✦ УМНОЕ УПРАВЛЕНИЕ ✦'),
                    Text.yellow('• Клик по вещи в сумке ➔ сразу встает в нужный слот!'),
                    Text.yellow('• Клик по верхнему слоту ➔ возврат в сумку.')
                ]));
            s.leftClicked = () => {};
            s.rightClicked = () => {};
            s.shiftLeftClicked = () => {};
            s.shiftRightClicked = () => {};
        });

        // ----------------------------------------------------------------------
        // ЦЕНТРАЛЬНЫЙ КУЗНЕЧНЫЙ МОЛОТ (X=4, Y=2): ДИНАМИЧЕСКИЙ РАСЧЕТ И КОВКА
        // ----------------------------------------------------------------------
        gui.slot(4, 2, s => {
            if (typeof s.resetClickHandlers === 'function') s.resetClickHandlers();
            s.setItem(getHammerData(session).item);
            let forgeClick = () => {
                let sess = getOrCreateAnvilSession(player);
                let hData = getHammerData(sess);
                if (!hData.canForge) {
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.7`);
                    return;
                }

                let bx = player.x, by = player.y, bz = player.z;

                if (hData.forgeActionType === 'REINFORCE') {
                    sess.reagent.shrink(1);
                    if (sess.reagent.isEmpty()) sess.reagent = null;

                    let roll = Math.random() * 100.0;
                    let isSuccess = (roll < hData.calcChance);
                    let targetItem = sess.equipment.copy();
                    let curLvl = getGearReinforce(targetItem);
                    let nextLvl = hData.nextLvl;

                    if (isSuccess) {
                        setGearReinforce(targetItem, nextLvl);
                        updateGearNameBadge(targetItem, nextLvl);
                        sess.result = targetItem;
                        sess.equipment = null;

                        player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 1.0 1.2`);
                        player.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${player.username} ~ ~ ~ 0.9 1.4`);
                        player.server.runCommandSilent(`particle minecraft:wax_off ${bx} ${by + 1.2} ${bz} 0.4 0.4 0.4 0.05 30`);

                        if (nextLvl >= 7) {
                            player.server.runCommandSilent(`playsound minecraft:entity.lightning_bolt.thunder player ${player.username} ~ ~ ~ 1.2 1.0`);
                            player.server.runCommandSilent(`particle minecraft:totem_of_undying ${bx} ${by + 1.5} ${bz} 0.5 0.5 0.5 0.2 50`);
                        }

                        if (nextLvl === 10) {
                            let rawName = targetItem.hoverName.getString();
                            player.server.runCommandSilent(
                                `tellraw @a ["",{"text":"👑 [АДСКАЯ КУЗНИЦА] ","color":"gold","bold":true},{"text":"Герой ","color":"yellow"},{"text":"${player.username}","color":"white","bold":true},{"text":" закалил ","color":"yellow"},{"text":"${rawName}","color":"light_purple","bold":true},{"text":" до ","color":"yellow"},{"text":"АПОГЕЯ БОГОВ (+10)","color":"red","bold":true},{"text":"!","color":"gray"}]`
                            );
                        }

                        player.tell(Text.green(`★ УСПЕХ ЗАТОЧКИ! ${targetItem.hoverName.getString()} (Шанс: ${hData.calcChance}%)`));
                    } else {
                        if (curLvl < 3) {
                            sess.result = targetItem;
                            sess.equipment = null;
                            player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.8 0.7`);
                            player.server.runCommandSilent(`particle minecraft:smoke ${bx} ${by + 1.1} ${bz} 0.3 0.3 0.3 0.02 20`);
                            player.tell(Text.red(`✖ Неудача! Камень сгорел. Уровень сохранен (+${curLvl}).`));
                        } else {
                            if (hData.hasAegisInstalled) {
                                sess.aegis.shrink(1);
                                if (sess.aegis.isEmpty()) sess.aegis = null;

                                sess.result = targetItem;
                                sess.equipment = null;

                                player.server.runCommandSilent(`playsound minecraft:item.shield.block player ${player.username} ~ ~ ~ 1.0 1.1`);
                                player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                                player.server.runCommandSilent(`particle minecraft:enchanted_hit ${bx} ${by + 1.2} ${bz} 0.4 0.4 0.4 0.1 35`);
                                player.tell(Text.gold(`🛡 Печать Эгиды спасла от отката! Уровень сохранен (+${curLvl}). Печать сгорела.`));
                            } else {
                                let downLvl = curLvl - 1;
                                setGearReinforce(targetItem, downLvl);
                                updateGearNameBadge(targetItem, downLvl);
                                sess.result = targetItem;
                                sess.equipment = null;

                                player.server.runCommandSilent(`playsound minecraft:block.anvil.destroy player ${player.username} ~ ~ ~ 1.0 0.8`);
                                player.server.runCommandSilent(`particle minecraft:large_smoke ${bx} ${by + 1.2} ${bz} 0.4 0.4 0.4 0.05 30`);
                                player.tell(Text.darkRed(`✖ ПРОВАЛ КОВКИ! Откат: +${curLvl} ➔ +${downLvl}! (Камень сгорел)`));
                            }
                        }
                    }
                } else if (hData.forgeActionType === 'MARTIAL_TABLET') {
                    let tablet = sess.reagent;
                    let targetItem = sess.equipment.copy();
                    sess.reagent.shrink(1);
                    if (sess.reagent.isEmpty()) sess.reagent = null;

                    let rank = 1;
                    if (tablet.id.endsWith('_2')) rank = 2;
                    else if (tablet.id.endsWith('_3')) rank = 3;

                    try {
                        if (!targetItem.customData) targetItem.customData = {};
                        targetItem.customData.putInt('skd_art_rank', rank);
                    } catch (e) {
                        try {
                            if (!targetItem.nbt) targetItem.nbt = {};
                            targetItem.nbt.putInt('skd_art_rank', rank);
                        } catch (e2) {}
                    }

                    sess.result = targetItem;
                    sess.equipment = null;

                    player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 1.0 1.2`);
                    player.server.runCommandSilent(`particle minecraft:portal ${bx} ${by + 1.2} ${bz} 0.4 0.4 0.4 0.1 40`);
                    player.tell(Text.gold(`⚔ Боевое Искусство Ранга ${rank} успешно инкрустировано в предмет!`));
                } else if (hData.forgeActionType === 'TIER_TEMPLATE') {
                    sess.reagent.shrink(1);
                    if (sess.reagent.isEmpty()) sess.reagent = null;

                    let targetItem = sess.equipment.copy();
                    sess.result = targetItem;
                    sess.equipment = null;

                    player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 1.0 1.2`);
                    player.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${player.username} ~ ~ ~ 0.9 1.4`);
                    player.tell(Text.green(`🌟 Шаблон Преемственности успешно применен!`));
                }

                refreshInfernalAnvilGUI(player);
            };
            s.leftClicked = forgeClick;
            s.rightClicked = forgeClick;
            s.shiftLeftClicked = forgeClick;
            s.shiftRightClicked = forgeClick;
        });

        // ----------------------------------------------------------------------
        // КНОПКА ЗАКРЫТЬ И ВЕРНУТЬ РЕСУРСЫ (X=8, Y=2) - КРАСНЫЙ СЛОТ ВЫХОДА
        // ----------------------------------------------------------------------
        gui.slot(8, 2, s => {
            if (typeof s.resetClickHandlers === 'function') s.resetClickHandlers();
            s.setItem(Item.of('minecraft:red_stained_glass_pane')
                .withCustomName(Text.red('✖ Закрыть наковальню'))
                .withLore([
                    Text.gray('Все установленные ресурсы немедленно вернутся в инвентарь.'),
                    Text.yellow('Нажмите для безопасного выхода.')
                ]));
            let closeHandler = () => {
                clearAndRefundSession(player, true);
                player.closeMenu();
            };
            s.leftClicked = closeHandler;
            s.rightClicked = closeHandler;
            s.shiftLeftClicked = closeHandler;
            s.shiftRightClicked = closeHandler;
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

            // 1. Оружие / Броня / Щит ➔ Слот 1 (Экипировка)
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

            // 2. Кузнечные Камни / Скрижали / Шаблоны ➔ Слот 2 (Реагент)
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

            // 3. Печать Эгиды ➔ Слот 3 (Эгида)
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

// 1. Таргетированный клик по блоку Адской Наковальни (Чистое открытие)
BlockEvents.rightClicked('kubejs:infernal_anvil', event => {
    let player = event.player;
    if (!player || player.level.isClientSide()) return;

    let handStr = event.hand ? String(event.hand) : 'MAIN_HAND';
    if (!handStr.includes('MAIN')) return;

    event.cancel();
    openInfernalAnvilGUI(player);
    player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.8 1.0`);
});

// 2. Перехват клика ПКМ с предметом в руке или в приседе (ItemEvents.rightClicked)
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
        clearAndRefundSession(player, false);
    }
});

PlayerEvents.loggedOut(event => {
    let player = event.player;
    if (player) {
        clearAndRefundSession(player, true);
    }
});

// Команда прямого вызова для тестирования и шорткатов
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
