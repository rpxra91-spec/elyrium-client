// ==============================================================================
// ⚒️ ELYRIUM RPG: MASTER BLACKSMITH WORKBENCH GUI (v1.0)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 100% Non-Chest Custom Workstation Experience:
// - Full-screen custom dark oak & iron overlay (`\uF808\uE007`).
// - Dual-Mode Workstation:
//   1. [ КОВКА ]: 6 raw material slots, interactive blueprint catalog, crafting hammer.
//   2. [ ТОЧНЫЙ РЕМОНТ ]: Damaged gear + metal ingots (1 ingot = 1/3 max durability),
//      0 XP anvil cost, zero repair penalties, 100% stat & socket preservation!
// - Zero gray glass panes, zero dummy clutter.
// - 100% item safety: zero loss on close.
// ==============================================================================

let activeWorkbenchSessions = new Map();

function getOrCreateWorkbenchSession(player) {
    let uuid = player.uuid.toString();
    if (!activeWorkbenchSessions.has(uuid)) {
        activeWorkbenchSessions.set(uuid, {
            mode: 'FORGE', // 'FORGE' or 'REPAIR'
            recipeIdx: 0,
            forgeIngredients: [null, null, null, null, null, null],
            repairGear: null,
            repairIngots: null,
            stationPos: null
        });
    }
    return activeWorkbenchSessions.get(uuid);
}

function clearWorkbenchSession(player) {
    let uuid = player.uuid.toString();
    activeWorkbenchSessions.delete(uuid);
}

// Подсчет доступного сырья в 6 слотах ковки
function countWorkbenchIngredients(ingredients, targetIdOrTag) {
    let count = 0;
    for (let i = 0; i < ingredients.length; i++) {
        let st = ingredients[i];
        if (st && !st.isEmpty()) {
            if (typeof matchesItemOrTag === 'function') {
                if (matchesItemOrTag(st, targetIdOrTag)) count += st.count;
            } else {
                if (String(st.id) === targetIdOrTag) count += st.count;
            }
        }
    }
    return count;
}

// Списание сырья из 6 слотов ковки
function deductWorkbenchIngredients(ingredients, targetIdOrTag, needed) {
    let remain = needed;
    for (let i = 0; i < ingredients.length && remain > 0; i++) {
        let st = ingredients[i];
        if (st && !st.isEmpty()) {
            let matches = false;
            if (typeof matchesItemOrTag === 'function') {
                matches = matchesItemOrTag(st, targetIdOrTag);
            } else {
                matches = (String(st.id) === targetIdOrTag);
            }
            if (matches) {
                let take = Math.min(st.count, remain);
                st.shrink(take);
                remain -= take;
                if (st.isEmpty()) ingredients[i] = null;
            }
        }
    }
    return remain === 0;
}

function openBlacksmithWorkbenchGUI(player, stationPos) {
    if (!player || player.isFake()) return;

    let sess = getOrCreateWorkbenchSession(player);
    if (stationPos) sess.stationPos = stationPos;

    // \uF808 = -8px horizontal offset, \uE007 = 176x166 custom workbench overlay
    let title = '\uF808\uE007§r§8§lВЕРСТАК ОРУЖЕЙНИКА';

    player.openChestGUI(Text.of(title), 3, gui => {
        gui.playerSlots = true;

        gui.closed = () => {
            // Safe refund of all 6 forge slots
            for (let i = 0; i < sess.forgeIngredients.length; i++) {
                let st = sess.forgeIngredients[i];
                if (st && !st.isEmpty()) player.give(st);
                sess.forgeIngredients[i] = null;
            }
            // Safe refund of repair items
            if (sess.repairGear && !sess.repairGear.isEmpty()) player.give(sess.repairGear);
            if (sess.repairIngots && !sess.repairIngots.isEmpty()) player.give(sess.repairIngots);
            sess.repairGear = null;
            sess.repairIngots = null;

            clearWorkbenchSession(player);
        };

        // ----------------------------------------------------------------------
        // ПЕРЕКЛЮЧАТЕЛЬ РЕЖИМА (Col 4, Row 0 = Slot 4)
        // ----------------------------------------------------------------------
        gui.slot(4, 0, s => {
            let isForge = (sess.mode === 'FORGE');
            s.setItem(Item.of(isForge ? 'minecraft:anvil' : 'minecraft:grindstone')
                .withCustomName(Text.of(isForge ? '§a⚒ [ РЕЖИМ: КОВКА СНАРЯЖЕНИЯ ]' : '§6🔧 [ РЕЖИМ: ТОЧНЫЙ РЕМОНТ (0 XP) ]'))
                .withLore([
                    Text.of('§7Нажмите ЛКМ для смены режима работы:'),
                    Text.of(isForge ? '§8▶ Переключить на Ремонт поврежденной экипировки' : '§8▶ Переключить на Ковку экипировки по чертежам')
                ]));
            s.leftClicked = () => {
                sess.mode = (sess.mode === 'FORGE') ? 'REPAIR' : 'FORGE';
                player.server.runCommandSilent(`playsound minecraft:ui.button.click player ${player.username} ~ ~ ~ 0.8 1.2`);
                openBlacksmithWorkbenchGUI(player, sess.stationPos);
            };
        });

        // ======================================================================
        // РЕЖИМ 1: КОВКА СНАРЯЖЕНИЯ (FORGE)
        // ======================================================================
        if (sess.mode === 'FORGE') {
            let curRecipe = (typeof WORKSHOP_FORGE_RECIPES !== 'undefined' && WORKSHOP_FORGE_RECIPES.length > 0)
                ? WORKSHOP_FORGE_RECIPES[sess.recipeIdx % WORKSHOP_FORGE_RECIPES.length]
                : { id: 'simplyswords:iron_longsword', name: 'Стальной Длинный Меч', ingot: 'minecraft:iron_ingot', ingotName: 'Железный Слиток', ingotCount: 14 };

            let availIngot = countWorkbenchIngredients(sess.forgeIngredients, curRecipe.ingot);
            let availExtra = curRecipe.extra ? countWorkbenchIngredients(sess.forgeIngredients, curRecipe.extra) : 999;
            let canCraft = (availIngot >= curRecipe.ingotCount && availExtra >= (curRecipe.extraCount || 0));

            // 6 СЛОТОВ СЫРЬЯ СЛЕВА (Col 1 & Col 2, Rows 0, 1, 2)
            // Slot indices: [0, 1] in Row 0, [2, 3] in Row 1, [4, 5] in Row 2
            let slotCoords = [
                { x: 1, y: 0, idx: 0 }, { x: 2, y: 0, idx: 1 },
                { x: 1, y: 1, idx: 2 }, { x: 2, y: 1, idx: 3 },
                { x: 1, y: 2, idx: 4 }, { x: 2, y: 2, idx: 5 }
            ];

            slotCoords.forEach(pos => {
                gui.slot(pos.x, pos.y, s => {
                    let st = sess.forgeIngredients[pos.idx];
                    if (st && !st.isEmpty()) {
                        s.setItem(st.copy().withLore([
                            Text.of(`§7Количество: §f${st.count} шт.`),
                            Text.of('§e▶ Нажмите ЛКМ, чтобы вернуть в инвентарь')
                        ]));
                        s.leftClicked = () => {
                            let old = sess.forgeIngredients[pos.idx];
                            sess.forgeIngredients[pos.idx] = null;
                            player.give(old);
                            player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                            openBlacksmithWorkbenchGUI(player, sess.stationPos);
                        };
                    } else {
                        s.setItem(Item.of('minecraft:air'));
                        s.leftClicked = () => {
                            let cursor = player.cursorItem;
                            if (cursor && !cursor.isEmpty()) {
                                sess.forgeIngredients[pos.idx] = cursor.copy();
                                player.setCursorItem(Item.of('minecraft:air'));
                                player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                                openBlacksmithWorkbenchGUI(player, sess.stationPos);
                            }
                        };
                    }
                });
            });

            // КАТАЛОГ ЧЕРТЕЖЕЙ (Row 0: Col 5 Prev, Col 6 Display, Col 7 Next)
            gui.slot(5, 0, s => {
                s.setItem(Item.of('minecraft:arrow').withCustomName(Text.of('§e◀ Предыдущий Чертеж')));
                s.leftClicked = () => {
                    let len = (typeof WORKSHOP_FORGE_RECIPES !== 'undefined' && WORKSHOP_FORGE_RECIPES.length > 0) ? WORKSHOP_FORGE_RECIPES.length : 1;
                    sess.recipeIdx = (sess.recipeIdx - 1 + len) % len;
                    player.server.runCommandSilent(`playsound minecraft:ui.button.click player ${player.username} ~ ~ ~ 0.6 1.4`);
                    openBlacksmithWorkbenchGUI(player, sess.stationPos);
                };
            });

            gui.slot(6, 0, s => {
                let ghostLore = [
                    Text.of(`§6Чертеж: §f${curRecipe.name}`),
                    Text.of('§8────────────────────────────────'),
                    Text.of(`§7Требуемый металл: §e${curRecipe.ingotName} §f(${availIngot}/${curRecipe.ingotCount})`)
                ];
                if (curRecipe.extra) {
                    ghostLore.push(Text.of(`§7Дополнительно: §e${curRecipe.extraName} §f(${availExtra}/${curRecipe.extraCount})`));
                }
                ghostLore.push(Text.of('§8────────────────────────────────'));
                ghostLore.push(Text.of(canCraft ? '§a✓ Все сырье загружено в 6 ячеек слева!' : '§c✗ Загрузите сырье в ячейки слева.'));

                s.setItem(Item.of('minecraft:book').withCustomName(Text.of(`§e📖 [ Чертеж: ${curRecipe.name} ]`)).withLore(ghostLore));
                s.leftClicked = () => {};
            });

            gui.slot(7, 0, s => {
                s.setItem(Item.of('minecraft:arrow').withCustomName(Text.of('§eСледующий Чертеж ▶')));
                s.leftClicked = () => {
                    let len = (typeof WORKSHOP_FORGE_RECIPES !== 'undefined' && WORKSHOP_FORGE_RECIPES.length > 0) ? WORKSHOP_FORGE_RECIPES.length : 1;
                    sess.recipeIdx = (sess.recipeIdx + 1) % len;
                    player.server.runCommandSilent(`playsound minecraft:ui.button.click player ${player.username} ~ ~ ~ 0.6 1.4`);
                    openBlacksmithWorkbenchGUI(player, sess.stationPos);
                };
            });

            // ЦЕНТРАЛЬНЫЙ МОЛОТ КОВКИ (Col 4, Row 1 = Slot 13)
            gui.slot(4, 1, s => {
                let hammerItem = Item.of(canCraft ? 'minecraft:anvil' : 'minecraft:iron_bars');
                if (canCraft) hammerItem.enchant('minecraft:unbreaking', 1);

                s.setItem(hammerItem.withCustomName(Text.of(canCraft ? '§c🔥 [ ВЫКОВАТЬ ПРЕДМЕТ ]' : '§8[ 🔨 Недостаточно Сырья ]')).withLore([
                    Text.of(canCraft ? `§aГотов к ковке: §f${curRecipe.name}` : `§cТребуется: ${curRecipe.ingotCount}x ${curRecipe.ingotName}`),
                    Text.of('§8────────────────────────────────'),
                    Text.of(canCraft ? '§e▶ Нажмите ЛКМ, чтобы выковать!' : '§7Положите слитки в ячейки слева')
                ]));

                s.leftClicked = () => {
                    if (!canCraft) {
                        player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                        return;
                    }

                    // Deduct ingredients
                    deductWorkbenchIngredients(sess.forgeIngredients, curRecipe.ingot, curRecipe.ingotCount);
                    if (curRecipe.extra && curRecipe.extraCount > 0) {
                        deductWorkbenchIngredients(sess.forgeIngredients, curRecipe.extra, curRecipe.extraCount);
                    }

                    player.give(Item.of(curRecipe.id));

                    let cx = player.x, cy = player.y, cz = player.z;
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 1.0 1.2`);
                    player.server.runCommandSilent(`playsound minecraft:block.blastfurnace.fire_crackle player ${player.username} ~ ~ ~ 0.8 1.1`);
                    player.server.runCommandSilent(`particle minecraft:flame ${cx} ${cy + 1.2} ${cz} 0.4 0.3 0.4 0.05 25`);
                    player.server.runCommandSilent(`particle minecraft:lava ${cx} ${cy + 1.2} ${cz} 0.3 0.2 0.3 0.05 15`);
                    player.sendSystemMessage(Text.of(`§a⚒ [Ковка] §fВы успешно выковали: §6${curRecipe.name}§f!`));

                    openBlacksmithWorkbenchGUI(player, sess.stationPos);
                };
            });

            // СЛОТ ПРЕДПРОСМОТРА РЕЗУЛЬТАТА (Col 7, Row 1 = Slot 16)
            gui.slot(7, 1, s => {
                if (canCraft) {
                    s.setItem(Item.of(curRecipe.id).withLore([
                        Text.of('§a★ РЕЗУЛЬТАТ КОВКИ ★'),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§e▶ Нажмите на Молот по центру для создания!')
                    ]));
                } else {
                    s.setItem(Item.of('minecraft:air'));
                }
                s.leftClicked = () => {};
            });
        }

        // ======================================================================
        // РЕЖИМ 2: ТОЧНЫЙ РЕМОНТ (REPAIR)
        // ======================================================================
        else if (sess.mode === 'REPAIR') {
            let gear = sess.repairGear;
            let ingots = sess.repairIngots;

            let repMat = (gear && typeof getRepairMaterial === 'function') ? getRepairMaterial(gear) : { id: 'minecraft:iron_ingot', name: 'Железный Слиток' };
            let neededCost = (gear && typeof calculateRepairCost === 'function') ? calculateRepairCost(gear) : 0;
            let hasEnough = (ingots && ingots.count >= neededCost);
            let canRepair = (gear && neededCost > 0 && hasEnough);

            // СЛОТ 10: ПОВРЕЖДЕННАЯ ЭКИПИРОВКА (Col 1, Row 1)
            gui.slot(1, 1, s => {
                if (gear && !gear.isEmpty()) {
                    s.setItem(gear.copy().withLore([
                        Text.of('§8────────────────────────────────'),
                        Text.of(`§7Прочность: §c${gear.maxDamage - gear.damageValue} / ${gear.maxDamage}`),
                        Text.of(`§7Требуется для починки: §6${neededCost}x ${repMat.name}`),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§e▶ Нажмите ЛКМ для возврата в инвентарь')
                    ]));
                    s.leftClicked = () => {
                        let old = sess.repairGear;
                        sess.repairGear = null;
                        player.give(old);
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                        openBlacksmithWorkbenchGUI(player, sess.stationPos);
                    };
                } else {
                    s.setItem(Item.of('minecraft:air'));
                    s.leftClicked = () => {
                        let cursor = player.cursorItem;
                        if (cursor && !cursor.isEmpty() && cursor.isDamageableItem()) {
                            sess.repairGear = cursor.split(1);
                            player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                            openBlacksmithWorkbenchGUI(player, sess.stationPos);
                        }
                    };
                }
            });

            // СЛОТ 12: СЛИТКИ ДЛЯ РЕМОНТА (Col 3, Row 1)
            gui.slot(3, 1, s => {
                if (ingots && !ingots.isEmpty()) {
                    s.setItem(ingots.copy().withLore([
                        Text.of(`§7Количество: §f${ingots.count} шт.`),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§e▶ Нажмите ЛКМ для возврата в инвентарь')
                    ]));
                    s.leftClicked = () => {
                        let old = sess.repairIngots;
                        sess.repairIngots = null;
                        player.give(old);
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                        openBlacksmithWorkbenchGUI(player, sess.stationPos);
                    };
                } else {
                    s.setItem(Item.of('minecraft:air'));
                    s.leftClicked = () => {
                        let cursor = player.cursorItem;
                        if (cursor && !cursor.isEmpty()) {
                            sess.repairIngots = cursor.copy();
                            player.setCursorItem(Item.of('minecraft:air'));
                            player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                            openBlacksmithWorkbenchGUI(player, sess.stationPos);
                        }
                    };
                }
            });

            // ЦЕНТРАЛЬНЫЙ МОЛОТ РЕМОНТА (Col 4, Row 1)
            gui.slot(4, 1, s => {
                let hammerItem = Item.of(canRepair ? 'minecraft:anvil' : 'minecraft:iron_bars');
                if (canRepair) hammerItem.enchant('minecraft:unbreaking', 1);

                s.setItem(hammerItem.withCustomName(Text.of(canRepair ? '§a🔧 [ ВОССТАНОВИТЬ ПРОЧНОСТЬ ]' : '§8[ 🔧 Ремонт Недоступен ]')).withLore([
                    Text.of(gear ? (neededCost === 0 ? '§aПредмет полностью цел!' : `§eСтоимость: §6${neededCost}x ${repMat.name}`) : '§cВставьте поврежденный предмет'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§a✓ Без штрафа опыта (0 XP)!'),
                    Text.of('§a✓ Сохраняет 100% заточки (+N), сокетов и чар')
                ]));

                s.leftClicked = () => {
                    if (!canRepair) {
                        player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                        return;
                    }

                    ingots.shrink(neededCost);
                    if (ingots.isEmpty()) sess.repairIngots = null;

                    let repaired = gear.copy();
                    repaired.damageValue = 0; // 100% repaired!
                    sess.repairGear = null;
                    player.give(repaired);

                    let cx = player.x, cy = player.y, cz = player.z;
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 1.0 1.2`);
                    player.server.runCommandSilent(`playsound minecraft:block.lava.extinguish player ${player.username} ~ ~ ~ 0.8 1.0`);
                    player.server.runCommandSilent(`particle minecraft:wax_off ${cx} ${cy + 1.2} ${cz} 0.4 0.3 0.4 0.05 30`);
                    player.sendSystemMessage(Text.of(`§a🔧 [Ремонт] §fПредмет успешно восстановлен до 100% прочности без штрафов!`));

                    openBlacksmithWorkbenchGUI(player, sess.stationPos);
                };
            });

            // СЛОТ 16: ПРЕДПРОСМОТР РЕМОНТА (Col 7, Row 1)
            gui.slot(7, 1, s => {
                if (canRepair) {
                    let preview = gear.copy();
                    preview.damageValue = 0;
                    s.setItem(preview.withLore([
                        Text.of('§a★ 100% ВОССТАНОВЛЕННАЯ ЭКИПИРОВКА ★'),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§e▶ Нажмите на Молот по центру для починки!')
                    ]));
                } else {
                    s.setItem(Item.of('minecraft:air'));
                }
                s.leftClicked = () => {};
            });
        }

        // ----------------------------------------------------------------------
        // БЫСТРАЯ ЗАГРУЗКА ИЗ ИНВЕНТАРЯ ИГРОКА
        // ----------------------------------------------------------------------
        gui.inventoryClicked = (invSlot, itemStack) => {
            if (!itemStack || itemStack.isEmpty()) return;

            if (sess.mode === 'FORGE') {
                for (let i = 0; i < sess.forgeIngredients.length; i++) {
                    if (!sess.forgeIngredients[i] || sess.forgeIngredients[i].isEmpty()) {
                        sess.forgeIngredients[i] = itemStack.copy();
                        itemStack.setCount(0);
                        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                        openBlacksmithWorkbenchGUI(player, sess.stationPos);
                        return;
                    }
                }
            } else if (sess.mode === 'REPAIR') {
                if (itemStack.isDamageableItem()) {
                    if (sess.repairGear && !sess.repairGear.isEmpty()) player.give(sess.repairGear);
                    sess.repairGear = itemStack.split(1);
                    player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openBlacksmithWorkbenchGUI(player, sess.stationPos);
                    return;
                } else {
                    if (sess.repairIngots && !sess.repairIngots.isEmpty()) player.give(sess.repairIngots);
                    sess.repairIngots = itemStack.copy();
                    itemStack.setCount(0);
                    player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openBlacksmithWorkbenchGUI(player, sess.stationPos);
                    return;
                }
            }
        };
    });
}

// ------------------------------------------------------------------------------
// ПРЯМОЙ ОБРАБОТЧИК КЛИКА ПКМ ПО ВЕРСТАКУ ОРУЖЕЙНИКА
// ------------------------------------------------------------------------------
BlockEvents.rightClicked('kubejs:blacksmith_workbench', event => {
    let player = event.player;
    if (!player || player.isFake()) return;
    if (event.hand != 'MAIN_HAND') return;

    openBlacksmithWorkbenchGUI(player, event.block);
    player.server.runCommandSilent(`playsound minecraft:block.wood.hit player ${player.username} ~ ~ ~ 0.8 1.0`);
});

// Глобальная очистка при выходе
PlayerEvents.loggedOut(event => {
    if (event.player) {
        let sess = activeWorkbenchSessions.get(event.player.uuid.toString());
        if (sess) {
            for (let i = 0; i < sess.forgeIngredients.length; i++) {
                let st = sess.forgeIngredients[i];
                if (st && !st.isEmpty()) event.player.give(st);
            }
            if (sess.repairGear && !sess.repairGear.isEmpty()) event.player.give(sess.repairGear);
            if (sess.repairIngots && !sess.repairIngots.isEmpty()) event.player.give(sess.repairIngots);
            clearWorkbenchSession(event.player);
        }
    }
});
