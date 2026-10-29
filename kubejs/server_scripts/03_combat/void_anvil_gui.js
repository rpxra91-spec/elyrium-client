// ==============================================================================
// 🌌 ELYRIUM RPG: VOID ANVIL REINFORCEMENT WORKSTATION GUI (v1.0)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 100% Non-Chest Custom Workstation Experience (ARPG / Lineage 2 Style):
// - Full-screen custom void aesthetic overlay (`\uF808\uE004`) hiding generic chest art.
// - Authentic 4-slot workstation workflow:
//   [Экипировка] + [Точильный Камень] + [Кузнечная Эгида] ➔ [Закаленный Артефакт]
// - Central interactive Forge Hammer button with live success %, safe zone indicator,
//   and Aegis protection status.
// - Zero gray glass panes, zero dummy clutter.
// - 100% item safety: zero loss on close.
// ==============================================================================

let activeVoidAnvilSessions = new Map();

function getOrCreateVoidAnvilSession(player) {
    let uuid = player.uuid.toString();
    if (!activeVoidAnvilSessions.has(uuid)) {
        activeVoidAnvilSessions.set(uuid, {
            gear: null,
            reagent: null,
            aegis: null,
            result: null,
            stationPos: null
        });
    }
    return activeVoidAnvilSessions.get(uuid);
}

function clearVoidAnvilSession(player) {
    let uuid = player.uuid.toString();
    activeVoidAnvilSessions.delete(uuid);
}

function isEligibleVoidGear(item) {
    if (!item || item.isEmpty()) return false;
    let id = String(item.id).toLowerCase();
    return item.isDamageableItem() ||
           item.hasTag('minecraft:swords') ||
           item.hasTag('c:weapons') ||
           item.hasTag('minecraft:armors') ||
           item.hasTag('c:armors') ||
           id.includes('sword') || id.includes('blade') || id.includes('axe') ||
           id.includes('bow') || id.includes('crossbow') || id.includes('shield') ||
           id.includes('helmet') || id.includes('chestplate') || id.includes('leggings') || id.includes('boots');
}

function openVoidAnvilGUI(player, stationPos) {
    if (!player || player.isFake()) return;

    let sess = getOrCreateVoidAnvilSession(player);
    if (stationPos) sess.stationPos = stationPos;

    // \uF808 = -8px horizontal offset, \uE004 = 176x166 custom void anvil overlay
    let title = '§f\uF808\uE004\uF80A§r§5§lНАКОВАЛЬНЯ БЕЗДНЫ';

    player.openChestGUI(Text.of(title), 3, gui => {
        gui.playerSlots = true;

        gui.closed = () => {
            // 100% Guaranteed safety: refund carried item if any
            try {
                let carried = player.containerMenu.getCarried();
                if (carried && !carried.isEmpty()) {
                    player.give(carried);
                    player.containerMenu.setCarried(Item.of('minecraft:air'));
                }
            } catch (e) {}

            // Refund all items left in workstation
            let refundList = [sess.gear, sess.reagent, sess.aegis, sess.result];
            sess.gear = null;
            sess.reagent = null;
            sess.aegis = null;
            sess.result = null;

            refundList.forEach(st => {
                if (st && !st.isEmpty()) player.give(st);
            });
            clearVoidAnvilSession(player);
        };

        // Evaluation
        let evalData = null;
        if (typeof ElyriumForgeAPI !== 'undefined' && sess.gear) {
            try {
                evalData = ElyriumForgeAPI.evaluate(sess.gear, sess.reagent, sess.aegis);
            } catch (e) {}
        }

        // ----------------------------------------------------------------------
        // СЛОТ 10: [ЭКИПИРОВКА] (Col 1, Row 1)
        // ----------------------------------------------------------------------
        gui.slot(1, 1, s => {
            if (sess.gear && !sess.gear.isEmpty()) {
                s.setItem(sess.gear.copy().withLore([
                    Text.of('§8────────────────────────────────'),
                    Text.of('§e▶ Нажмите ЛКМ: §fЗабрать в руку / поменять')
                ]));
            } else {
                s.setItem(Item.of('minecraft:air'));
            }

            s.leftClicked = () => {
                let carried = player.containerMenu.getCarried();
                let current = sess.gear;

                if (carried && !carried.isEmpty() && isEligibleVoidGear(carried)) {
                    if (!current || current.isEmpty()) {
                        sess.gear = carried.split(1);
                        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                    } else {
                        let temp = current.copy();
                        sess.gear = carried.split(1);
                        player.give(temp);
                        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                    }
                    openVoidAnvilGUI(player, sess.stationPos);
                } else if (current && !current.isEmpty()) {
                    player.containerMenu.setCarried(current.copy());
                    sess.gear = null;
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                    openVoidAnvilGUI(player, sess.stationPos);
                }
            };
        });

        // ----------------------------------------------------------------------
        // СЛОТ 12: [ТОЧИЛЬНЫЙ КАМЕНЬ / ОСЕЛОК] (Col 3, Row 1)
        // ----------------------------------------------------------------------
        gui.slot(3, 1, s => {
            if (sess.reagent && !sess.reagent.isEmpty()) {
                s.setItem(sess.reagent.copy().withLore([
                    Text.of('§8────────────────────────────────'),
                    Text.of('§e▶ ЛКМ: §fЗабрать в руку / поменять'),
                    Text.of('§e▶ ПКМ: §fЗабрать половину')
                ]));
            } else {
                s.setItem(Item.of('minecraft:air'));
            }

            s.leftClicked = () => {
                let carried = player.containerMenu.getCarried();
                let current = sess.reagent;

                if (carried && !carried.isEmpty() && String(carried.id).startsWith('kubejs:smithing_stone_')) {
                    if (!current || current.isEmpty()) {
                        sess.reagent = carried.copy();
                        player.containerMenu.setCarried(Item.of('minecraft:air'));
                        player.server.runCommandSilent(`playsound minecraft:item.firecharge.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                    } else if (current.id === carried.id) {
                        let space = current.maxStackSize - current.count;
                        let move = Math.min(space, carried.count);
                        current.grow(move);
                        carried.shrink(move);
                        if (carried.count <= 0) player.containerMenu.setCarried(Item.of('minecraft:air'));
                        player.server.runCommandSilent(`playsound minecraft:item.firecharge.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                    } else {
                        let temp = current.copy();
                        sess.reagent = carried.copy();
                        player.containerMenu.setCarried(temp);
                        player.server.runCommandSilent(`playsound minecraft:item.firecharge.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                    }
                    openVoidAnvilGUI(player, sess.stationPos);
                } else if (current && !current.isEmpty()) {
                    player.containerMenu.setCarried(current.copy());
                    sess.reagent = null;
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                    openVoidAnvilGUI(player, sess.stationPos);
                }
            };

            s.rightClicked = () => {
                let carried = player.containerMenu.getCarried();
                let current = sess.reagent;

                if (carried && !carried.isEmpty() && String(carried.id).startsWith('kubejs:smithing_stone_')) {
                    if (!current || current.isEmpty()) {
                        let one = carried.copy();
                        one.setCount(1);
                        carried.shrink(1);
                        sess.reagent = one;
                        if (carried.count <= 0) player.containerMenu.setCarried(Item.of('minecraft:air'));
                    } else if (current.id === carried.id && current.count < current.maxStackSize) {
                        current.grow(1);
                        carried.shrink(1);
                        if (carried.count <= 0) player.containerMenu.setCarried(Item.of('minecraft:air'));
                    }
                    openVoidAnvilGUI(player, sess.stationPos);
                } else if (current && !current.isEmpty()) {
                    let half = Math.ceil(current.count / 2);
                    let picked = current.copy();
                    picked.setCount(half);
                    current.shrink(half);
                    if (current.count <= 0) sess.reagent = null;
                    player.containerMenu.setCarried(picked);
                    openVoidAnvilGUI(player, sess.stationPos);
                }
            };
        });

        // ----------------------------------------------------------------------
        // СЛОТ 14: [КУЗНЕЧНАЯ ЭГИДА / ЗАЩИТА] (Col 5, Row 1)
        // ----------------------------------------------------------------------
        gui.slot(5, 1, s => {
            if (sess.aegis && !sess.aegis.isEmpty()) {
                s.setItem(sess.aegis.copy().withLore([
                    Text.of('§6🛡 ЗАЩИТА АКТИВНА: Откат уровня предотвращен!'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§e▶ ЛКМ: §fЗабрать в руку / поменять'),
                    Text.of('§e▶ ПКМ: §fЗабрать половину')
                ]));
            } else {
                s.setItem(Item.of('minecraft:air'));
            }

            s.leftClicked = () => {
                let carried = player.containerMenu.getCarried();
                let current = sess.aegis;

                if (carried && !carried.isEmpty() && String(carried.id) === 'kubejs:smithing_aegis') {
                    if (!current || current.isEmpty()) {
                        sess.aegis = carried.copy();
                        player.containerMenu.setCarried(Item.of('minecraft:air'));
                        player.server.runCommandSilent(`playsound minecraft:item.shield.block player ${player.username} ~ ~ ~ 0.8 1.4`);
                    } else if (current.id === carried.id) {
                        let space = current.maxStackSize - current.count;
                        let move = Math.min(space, carried.count);
                        current.grow(move);
                        carried.shrink(move);
                        if (carried.count <= 0) player.containerMenu.setCarried(Item.of('minecraft:air'));
                        player.server.runCommandSilent(`playsound minecraft:item.shield.block player ${player.username} ~ ~ ~ 0.8 1.4`);
                    } else {
                        let temp = current.copy();
                        sess.aegis = carried.copy();
                        player.containerMenu.setCarried(temp);
                        player.server.runCommandSilent(`playsound minecraft:item.shield.block player ${player.username} ~ ~ ~ 0.8 1.4`);
                    }
                    openVoidAnvilGUI(player, sess.stationPos);
                } else if (current && !current.isEmpty()) {
                    player.containerMenu.setCarried(current.copy());
                    sess.aegis = null;
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                    openVoidAnvilGUI(player, sess.stationPos);
                }
            };

            s.rightClicked = () => {
                let carried = player.containerMenu.getCarried();
                let current = sess.aegis;

                if (carried && !carried.isEmpty() && String(carried.id) === 'kubejs:smithing_aegis') {
                    if (!current || current.isEmpty()) {
                        let one = carried.copy();
                        one.setCount(1);
                        carried.shrink(1);
                        sess.aegis = one;
                        if (carried.count <= 0) player.containerMenu.setCarried(Item.of('minecraft:air'));
                    } else if (current.id === carried.id && current.count < current.maxStackSize) {
                        current.grow(1);
                        carried.shrink(1);
                        if (carried.count <= 0) player.containerMenu.setCarried(Item.of('minecraft:air'));
                    }
                    openVoidAnvilGUI(player, sess.stationPos);
                } else if (current && !current.isEmpty()) {
                    let half = Math.ceil(current.count / 2);
                    let picked = current.copy();
                    picked.setCount(half);
                    current.shrink(half);
                    if (current.count <= 0) sess.aegis = null;
                    player.containerMenu.setCarried(picked);
                    openVoidAnvilGUI(player, sess.stationPos);
                }
            };
        });

        // ----------------------------------------------------------------------
        // СЛОТ 16: [РЕЗУЛЬТАТ ЗАТОЧКИ] (Col 7, Row 1)
        // ----------------------------------------------------------------------
        gui.slot(7, 1, s => {
            if (sess.result && !sess.result.isEmpty()) {
                s.setItem(sess.result.copy().withLore([
                    Text.of('§a★ ЗАТОЧКА ЗАВЕРШЕНА! ★'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§e▶ Нажмите ЛКМ, чтобы забрать в инвентарь!'),
                    Text.of('§b▶ Нажмите ПКМ, чтобы вернуть в Слот 1 для следующей заточки!')
                ]));
                let takeAction = () => {
                    let resItem = sess.result;
                    sess.result = null;
                    let carried = player.containerMenu.getCarried();
                    if (!carried || carried.isEmpty()) {
                        player.containerMenu.setCarried(resItem);
                    } else {
                        player.give(resItem);
                    }
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.9 1.1`);
                    openVoidAnvilGUI(player, sess.stationPos);
                };
                s.leftClicked = takeAction;
                s.rightClicked = () => {
                    if (!sess.gear || sess.gear.isEmpty()) {
                        sess.gear = sess.result;
                        sess.result = null;
                        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                        openVoidAnvilGUI(player, sess.stationPos);
                    } else {
                        takeAction();
                    }
                };
            } else {
                s.setItem(Item.of('minecraft:air'));
                s.leftClicked = () => {};
            }
        });

        // ----------------------------------------------------------------------
        // СЛОТ 22: [КУЗНЕЧНЫЙ МОЛОТ БЕЗДНЫ] (Col 4, Row 2)
        // ----------------------------------------------------------------------
        let canForge = (evalData && evalData.canExecute && evalData.actionType === 'REINFORCE');
        gui.slot(4, 2, s => {
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

            s.setItem(hammerItem.withCustomName(Text.of(canForge ? '§d🔥 [ УДАРИТЬ КУЗНЕЧНЫМ МОЛОТОМ ]' : '§8[ 🔨 Кузнечный Молот Остыл ]')).withLore(hammerLore));

            s.leftClicked = () => {
                if (!canForge || typeof ElyriumForgeAPI === 'undefined') {
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                    return;
                }

                let forgeRes = ElyriumForgeAPI.executeForge(player, sess.gear, sess.reagent, sess.aegis);
                if (forgeRes && forgeRes.status !== 'INVALID') {
                    // Списание оселка
                    if (forgeRes.consumeReagentCount > 0 && sess.reagent) {
                        sess.reagent.shrink(forgeRes.consumeReagentCount);
                        if (sess.reagent.isEmpty()) sess.reagent = null;
                    }
                    // Списание эгиды
                    if (forgeRes.consumeAegis && sess.aegis) {
                        sess.aegis.shrink(1);
                        if (sess.aegis.isEmpty()) sess.aegis = null;
                    }

                    sess.result = forgeRes.resultGear;
                    sess.gear = null;

                    let bx = player.x, by = player.y, bz = player.z;
                    if (forgeRes.status === 'SUCCESS') {
                        player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 1.0 1.2`);
                        player.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${player.username} ~ ~ ~ 0.9 1.4`);
                        player.server.runCommandSilent(`particle minecraft:wax_off ${bx} ${by + 1.2} ${bz} 0.4 0.4 0.4 0.05 30`);
                        player.server.runCommandSilent(`particle minecraft:portal ${bx} ${by + 1.0} ${bz} 0.5 0.5 0.5 0.1 40`);
                        player.sendSystemMessage(Text.of(`§a${forgeRes.message}`));
                    } else if (forgeRes.status === 'FAIL_SAVED_BY_AEGIS') {
                        player.server.runCommandSilent(`playsound minecraft:item.shield.block player ${player.username} ~ ~ ~ 1.0 1.0`);
                        player.server.runCommandSilent(`particle minecraft:enchanted_hit ${bx} ${by + 1.2} ${bz} 0.4 0.4 0.4 0.1 35`);
                        player.sendSystemMessage(Text.of(`§6${forgeRes.message}`));
                    } else {
                        player.server.runCommandSilent(`playsound minecraft:block.anvil.destroy player ${player.username} ~ ~ ~ 0.8 0.7`);
                        player.server.runCommandSilent(`particle minecraft:smoke ${bx} ${by + 1.1} ${bz} 0.3 0.3 0.3 0.02 20`);
                        player.sendSystemMessage(Text.of(`§c${forgeRes.message}`));
                    }

                    openVoidAnvilGUI(player, sess.stationPos);
                } else {
                    player.sendSystemMessage(Text.of('§cОшибка выполнения операции в ElyriumForgeAPI.'));
                }
            };
        });

        // ----------------------------------------------------------------------
        // ОБРАБОТКА КЛИКОВ ПО ИНВЕНТАРЮ ИГРОКА (Быстрая загрузка)
        // ----------------------------------------------------------------------
        gui.inventoryClicked = (event) => {
            if (!event) return;
            let invItem = event.getItem();
            let carried = player.containerMenu.getCarried();
            let clickTypeStr = event.type ? String(event.type) : 'PICKUP';

            // Quick Move (Shift + Click)
            if (clickTypeStr === 'QUICK_MOVE') {
                if (!invItem || invItem.isEmpty()) return;
                let id = String(invItem.id);

                // Эгида
                if (id === 'kubejs:smithing_aegis') {
                    if (sess.aegis && !sess.aegis.isEmpty()) {
                        if (sess.aegis.id === invItem.id && sess.aegis.count < sess.aegis.maxStackSize) {
                            let space = sess.aegis.maxStackSize - sess.aegis.count;
                            let move = Math.min(space, invItem.count);
                            sess.aegis.grow(move);
                            invItem.shrink(move);
                            event.setItem(invItem.count <= 0 ? Item.of('minecraft:air') : invItem);
                        } else {
                            player.give(sess.aegis);
                            sess.aegis = invItem.copy();
                            event.setItem(Item.of('minecraft:air'));
                        }
                    } else {
                        sess.aegis = invItem.copy();
                        event.setItem(Item.of('minecraft:air'));
                    }
                    player.server.runCommandSilent(`playsound minecraft:item.shield.block player ${player.username} ~ ~ ~ 0.8 1.4`);
                    openVoidAnvilGUI(player, sess.stationPos);
                    return;
                }

                // Точильный камень
                if (id.startsWith('kubejs:smithing_stone_')) {
                    if (sess.reagent && !sess.reagent.isEmpty()) {
                        if (sess.reagent.id === invItem.id && sess.reagent.count < sess.reagent.maxStackSize) {
                            let space = sess.reagent.maxStackSize - sess.reagent.count;
                            let move = Math.min(space, invItem.count);
                            sess.reagent.grow(move);
                            invItem.shrink(move);
                            event.setItem(invItem.count <= 0 ? Item.of('minecraft:air') : invItem);
                        } else {
                            player.give(sess.reagent);
                            sess.reagent = invItem.copy();
                            event.setItem(Item.of('minecraft:air'));
                        }
                    } else {
                        sess.reagent = invItem.copy();
                        event.setItem(Item.of('minecraft:air'));
                    }
                    player.server.runCommandSilent(`playsound minecraft:item.firecharge.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                    openVoidAnvilGUI(player, sess.stationPos);
                    return;
                }

                // Экипировка
                if (isEligibleVoidGear(invItem)) {
                    if (sess.gear && !sess.gear.isEmpty()) player.give(sess.gear);
                    sess.gear = invItem.split(1);
                    event.setItem(invItem.count <= 0 ? Item.of('minecraft:air') : invItem);
                    player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openVoidAnvilGUI(player, sess.stationPos);
                    return;
                }
                return;
            }

            // Normal Left Click
            if (event.button === 0) {
                if (!carried || carried.isEmpty()) {
                    if (invItem && !invItem.isEmpty()) {
                        player.containerMenu.setCarried(invItem.copy());
                        event.setItem(Item.of('minecraft:air'));
                    }
                } else {
                    if (!invItem || invItem.isEmpty()) {
                        event.setItem(carried.copy());
                        player.containerMenu.setCarried(Item.of('minecraft:air'));
                    } else if (invItem.id === carried.id) {
                        let space = invItem.maxStackSize - invItem.count;
                        let move = Math.min(space, carried.count);
                        invItem.grow(move);
                        carried.shrink(move);
                        event.setItem(invItem);
                        if (carried.count <= 0) player.containerMenu.setCarried(Item.of('minecraft:air'));
                    } else {
                        let temp = invItem.copy();
                        event.setItem(carried.copy());
                        player.containerMenu.setCarried(temp);
                    }
                }
                return;
            }

            // Normal Right Click
            if (event.button === 1) {
                if (!carried || carried.isEmpty()) {
                    if (invItem && !invItem.isEmpty()) {
                        let half = Math.ceil(invItem.count / 2);
                        let picked = invItem.copy();
                        picked.setCount(half);
                        invItem.shrink(half);
                        event.setItem(invItem.count <= 0 ? Item.of('minecraft:air') : invItem);
                        player.containerMenu.setCarried(picked);
                    }
                } else {
                    if (!invItem || invItem.isEmpty()) {
                        let one = carried.copy();
                        one.setCount(1);
                        carried.shrink(1);
                        event.setItem(one);
                        if (carried.count <= 0) player.containerMenu.setCarried(Item.of('minecraft:air'));
                    } else if (invItem.id === carried.id && invItem.count < invItem.maxStackSize) {
                        invItem.grow(1);
                        carried.shrink(1);
                        event.setItem(invItem);
                        if (carried.count <= 0) player.containerMenu.setCarried(Item.of('minecraft:air'));
                    }
                }
                return;
            }
        };
    });
}

// ------------------------------------------------------------------------------
// ПРЯМОЙ ОБРАБОТЧИК КЛИКА ПКМ ПО НАКОВАЛЬНЕ БЕЗДНЫ
// ------------------------------------------------------------------------------
BlockEvents.rightClicked('kubejs:void_anvil', event => {
    let player = event.player;
    if (!player || player.isFake()) return;
    if (event.hand != 'MAIN_HAND') return;

    openVoidAnvilGUI(player, event.block);
    player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.8 1.0`);
});

// Глобальная очистка при выходе
PlayerEvents.loggedOut(event => {
    if (event.player) {
        let sess = activeVoidAnvilSessions.get(event.player.uuid.toString());
        if (sess) {
            [sess.gear, sess.reagent, sess.aegis, sess.result].forEach(st => {
                if (st && !st.isEmpty()) event.player.give(st);
            });
            clearVoidAnvilSession(event.player);
        }
    }
});
