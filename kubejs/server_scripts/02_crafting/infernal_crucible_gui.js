// ==============================================================================
// 🌋 ELYRIUM RPG: INFERNAL CRUCIBLE ASCENSION WORKSTATION GUI (v1.0)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 100% Non-Chest Custom Workstation Experience:
// - Full-screen custom Nether Basalt & Magma overlay (`\uF808\uE005`).
// - Dedicated 4-slot Ascension Workflow:
//   [Экипировка] + [Катализатор Эпохи] + [Слитки Металла] ➔ [Возвышенный Артефакт]
// - Central Crucible Ignition Button (Col 4, Row 2) with volcanic ignition.
// - 100% Stat & Gem Preservation: Sharpening (+N), Sockets, Gems, Glyphs, and
//   Martial Arts skills are completely preserved across tiers!
// - 100% item safety: zero loss on close.
// ==============================================================================

let activeCrucibleSessions = new Map();

function getOrCreateCrucibleSession(player) {
    let uuid = player.uuid.toString();
    if (!activeCrucibleSessions.has(uuid)) {
        activeCrucibleSessions.set(uuid, {
            gear: null,
            catalyst: null,
            result: null,
            stationPos: null
        });
    }
    return activeCrucibleSessions.get(uuid);
}

function clearCrucibleSession(player) {
    let uuid = player.uuid.toString();
    activeCrucibleSessions.delete(uuid);
}

function isEligibleAscensionGear(item) {
    if (!item || item.isEmpty()) return false;
    let id = String(item.id).toLowerCase();
    return item.isDamageableItem() ||
           item.hasTag('minecraft:swords') ||
           item.hasTag('c:weapons') ||
           item.hasTag('minecraft:armors') ||
           item.hasTag('c:armors') ||
           id.includes('sword') || id.includes('blade') || id.includes('axe') ||
           id.includes('helmet') || id.includes('chestplate') || id.includes('leggings') || id.includes('boots');
}

function openInfernalCrucibleGUI(player, stationPos) {
    if (!player || player.isFake()) return;

    let sess = getOrCreateCrucibleSession(player);
    if (stationPos) sess.stationPos = stationPos;

    // \uF808 = -8px horizontal offset, \uE005 = 176x166 custom crucible overlay
    let title = '§f\uF808\uE005\uF80A§r§4§lАДСКИЙ ГОРН ВОЗВЫШЕНИЯ';

    player.openChestGUI(Text.of(title), 3, gui => {
        gui.playerSlots = true;

        gui.closed = () => {
            try {
                let carried = player.containerMenu.getCarried();
                if (carried && !carried.isEmpty()) {
                    player.give(carried);
                    player.containerMenu.setCarried(Item.of('minecraft:air'));
                }
            } catch (e) {}

            let refundList = [sess.gear, sess.catalyst, sess.result];
            sess.gear = null;
            sess.catalyst = null;
            sess.result = null;

            refundList.forEach(st => {
                if (st && !st.isEmpty()) player.give(st);
            });
            clearCrucibleSession(player);
        };

        // Evaluation
        let evalAsc = null;
        if (typeof ElyriumForgeAPI !== 'undefined' && sess.gear && sess.catalyst) {
            try {
                evalAsc = ElyriumForgeAPI.evaluate(player, sess.gear, sess.catalyst, null);
            } catch (e) {}
        }

        // ----------------------------------------------------------------------
        // СЛОТ 10: [ЭКИПИРОВКА ТЕКУЩЕГО ТИРА] (Col 1, Row 1)
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

                if (carried && !carried.isEmpty() && isEligibleAscensionGear(carried)) {
                    if (!current || current.isEmpty()) {
                        sess.gear = carried.split(1);
                        sess.result = null;
                        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                    } else {
                        let temp = current.copy();
                        sess.gear = carried.split(1);
                        sess.result = null;
                        player.give(temp);
                        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                    }
                    openInfernalCrucibleGUI(player, sess.stationPos);
                } else if (current && !current.isEmpty()) {
                    player.containerMenu.setCarried(current.copy());
                    sess.gear = null;
                    sess.result = null;
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                    openInfernalCrucibleGUI(player, sess.stationPos);
                }
            };
        });

        // ----------------------------------------------------------------------
        // СЛОТ 12: [КАТАЛИЗАТОР ЭПОХИ / ШАБЛОН] (Col 3, Row 1)
        // ----------------------------------------------------------------------
        gui.slot(3, 1, s => {
            if (sess.catalyst && !sess.catalyst.isEmpty()) {
                s.setItem(sess.catalyst.copy().withLore([
                    Text.of('§8────────────────────────────────'),
                    Text.of('§e▶ ЛКМ: §fЗабрать в руку / поменять'),
                    Text.of('§e▶ ПКМ: §fЗабрать половину')
                ]));
            } else {
                s.setItem(Item.of('minecraft:air'));
            }

            s.leftClicked = () => {
                let carried = player.containerMenu.getCarried();
                let current = sess.catalyst;

                if (carried && !carried.isEmpty()) {
                    let id = String(carried.id);
                    if (id.startsWith('kubejs:ascension_catalyst_t') || id === 'kubejs:tier_upgrade_template') {
                        if (!current || current.isEmpty()) {
                            sess.catalyst = carried.copy();
                            player.containerMenu.setCarried(Item.of('minecraft:air'));
                            sess.result = null;
                            player.server.runCommandSilent(`playsound minecraft:item.firecharge.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                        } else if (current.id === carried.id) {
                            let space = current.maxStackSize - current.count;
                            let move = Math.min(space, carried.count);
                            current.grow(move);
                            carried.shrink(move);
                            if (carried.count <= 0) player.containerMenu.setCarried(Item.of('minecraft:air'));
                            sess.result = null;
                            player.server.runCommandSilent(`playsound minecraft:item.firecharge.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                        } else {
                            let temp = current.copy();
                            sess.catalyst = carried.copy();
                            player.containerMenu.setCarried(temp);
                            sess.result = null;
                            player.server.runCommandSilent(`playsound minecraft:item.firecharge.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                        }
                        openInfernalCrucibleGUI(player, sess.stationPos);
                    }
                } else if (current && !current.isEmpty()) {
                    player.containerMenu.setCarried(current.copy());
                    sess.catalyst = null;
                    sess.result = null;
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                    openInfernalCrucibleGUI(player, sess.stationPos);
                }
            };

            s.rightClicked = () => {
                let carried = player.containerMenu.getCarried();
                let current = sess.catalyst;

                if (carried && !carried.isEmpty()) {
                    let id = String(carried.id);
                    if (id.startsWith('kubejs:ascension_catalyst_t') || id === 'kubejs:tier_upgrade_template') {
                        if (!current || current.isEmpty()) {
                            let one = carried.copy();
                            one.setCount(1);
                            carried.shrink(1);
                            sess.catalyst = one;
                            if (carried.count <= 0) player.containerMenu.setCarried(Item.of('minecraft:air'));
                            sess.result = null;
                        } else if (current.id === carried.id && current.count < current.maxStackSize) {
                            current.grow(1);
                            carried.shrink(1);
                            if (carried.count <= 0) player.containerMenu.setCarried(Item.of('minecraft:air'));
                            sess.result = null;
                        }
                        openInfernalCrucibleGUI(player, sess.stationPos);
                    }
                } else if (current && !current.isEmpty()) {
                    let half = Math.ceil(current.count / 2);
                    let picked = current.copy();
                    picked.setCount(half);
                    current.shrink(half);
                    if (current.count <= 0) sess.catalyst = null;
                    player.containerMenu.setCarried(picked);
                    sess.result = null;
                    openInfernalCrucibleGUI(player, sess.stationPos);
                }
            };
        });

        // ----------------------------------------------------------------------
        // СЛОТ 14: [МАТЕРИАЛЫ / СЛИТКИ ЭПОХИ] (Col 5, Row 1) - Информационный слот
        // ----------------------------------------------------------------------
        gui.slot(5, 1, s => {
            if (evalAsc) {
                let ingotCount = evalAsc.requiredIngotCount || 8;
                let ingotName = evalAsc.requiredIngotName || 'Слитки Эпохи';
                let hasIngots = evalAsc.hasRequiredIngots !== false;
                let iconId = evalAsc.requiredIngotId || 'minecraft:iron_ingot';
                let iconItem = Item.of(iconId.startsWith('#') ? 'minecraft:netherite_ingot' : iconId);

                s.setItem(iconItem.withCustomName(Text.of(hasIngots ? `§a✦ [ Расход Металла: ${ingotName} ] ✦` : `§c⚠ [ Не хватает: ${ingotName} ] ✦`)).withLore([
                    Text.of(`§7Требуется для закалки: §f${ingotCount}x ${ingotName}`),
                    Text.of(hasIngots ? '§a✓ Слитки обнаружены в вашем инвентаре!' : '§c✗ Добавьте необходимые слитки в инвентарь.'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§7Металл спишется автоматически при ритуале.')
                ]));
            } else {
                s.setItem(Item.of('minecraft:raw_iron')
                    .withCustomName(Text.of('§6✦ [ Слот Металла Эпохи ] ✦'))
                    .withLore([
                        Text.of('§7Установите экипировку и катализатор слева,'),
                        Text.of('§7чтобы узнать требуемый металл для закалки.')
                    ]));
            }
            s.leftClicked = () => {};
        });

        // ----------------------------------------------------------------------
        // СЛОТ 16: [РЕЗУЛЬТАТ ВОЗВЫШЕНИЯ] (Col 7, Row 1)
        // ----------------------------------------------------------------------
        let canAscend = (evalAsc && evalAsc.canExecute && evalAsc.actionType === 'ASCENSION');
        gui.slot(7, 1, s => {
            if (sess.result && !sess.result.isEmpty()) {
                s.setItem(sess.result.copy().withLore([
                    Text.of('§6★ ВОЗВЫШЕНИЕ УСПЕШНО ЗАВЕРШЕНО! ★'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§e▶ Нажмите ЛКМ, чтобы забрать артефакт в инвентарь!')
                ]));
                s.leftClicked = () => {
                    let res = sess.result;
                    sess.result = null;
                    let carried = player.containerMenu.getCarried();
                    if (!carried || carried.isEmpty()) {
                        player.containerMenu.setCarried(res);
                    } else {
                        player.give(res);
                    }
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.9 1.1`);
                    openInfernalCrucibleGUI(player, sess.stationPos);
                };
            } else if (canAscend && evalAsc && evalAsc.targetItem) {
                let preview = evalAsc.targetItem.copy();
                s.setItem(preview.withLore([
                    Text.of('§6★ ПРЕДПРОСМОТР ВОЗВЫШЕНИЯ ★'),
                    Text.of(`§eЭволюция: §bТир ${evalAsc.currentTier} §7➔ §6Тир ${evalAsc.targetTier}`),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§a✓ Заточка (+N), сокеты и боевые искусства сохраняются 100%!'),
                    Text.of('§e▶ Нажмите на Горн снизу для активации ритуала!')
                ]));
                s.leftClicked = () => {};
            } else {
                s.setItem(Item.of('minecraft:air'));
                s.leftClicked = () => {};
            }
        });

        // ----------------------------------------------------------------------
        // СЛОТ 22: [ЗАЖИГАНИЕ АДСКОГО ГОРНА] (Col 4, Row 2)
        // ----------------------------------------------------------------------
        gui.slot(4, 2, s => {
            let ignitionItem = Item.of(canAscend ? 'minecraft:lava_bucket' : 'minecraft:magma_block');
            if (canAscend) ignitionItem.enchant('minecraft:fire_aspect', 1);

            let lore = [
                Text.of(canAscend ? `§6Готов к возвышению: §bТир ${evalAsc.currentTier} §7➔ §6Тир ${evalAsc.targetTier}` : `§c${evalAsc ? evalAsc.statusMessage : 'Установите экипировку и катализатор'}`),
                Text.of('§8────────────────────────────────')
            ];

            if (canAscend) {
                lore.push(Text.of(`§7Расход: §f${evalAsc.requiredIngotCount || 8}x ${evalAsc.requiredIngotName || 'слитков'}`));
                lore.push(Text.of('§a✓ 100% Сохранение всех параметров и инкрустаций'));
                lore.push(Text.of('§8────────────────────────────────'));
                lore.push(Text.of('§e▶ Нажмите ЛКМ, чтобы разжечь Адский Горн!'));
            }

            s.setItem(ignitionItem.withCustomName(Text.of(canAscend ? '§4🌋 [ РАЗЖЕЧЬ АДСКИЙ ГОРН ]' : '§8[ 🌋 Адский Горн Остыл ]')).withLore(lore));

            s.leftClicked = () => {
                if (!canAscend || typeof ElyriumForgeAPI === 'undefined') {
                    player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ~ ~ ~ 0.8 1.0`);
                    return;
                }

                let res = ElyriumForgeAPI.executeAscension(player, sess.gear, sess.catalyst);
                if (res && res.status === 'SUCCESS') {
                    if (sess.catalyst) {
                        sess.catalyst.shrink(1);
                        if (sess.catalyst.isEmpty()) sess.catalyst = null;
                    }
                    sess.gear = null;
                    sess.result = res.resultGear;

                    let cx = player.x, cy = player.y, cz = player.z;
                    player.server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete player ${player.username} ~ ~ ~ 1.0 1.2`);
                    player.server.runCommandSilent(`playsound minecraft:block.lava.ambient player ${player.username} ~ ~ ~ 1.0 0.8`);
                    player.server.runCommandSilent(`particle minecraft:totem_of_undying ${cx} ${cy + 1.2} ${cz} 0.5 0.5 0.5 0.2 60`);
                    player.server.runCommandSilent(`particle minecraft:flame ${cx} ${cy + 1.0} ${cz} 0.5 0.5 0.5 0.1 40`);
                    player.server.runCommandSilent(`particle minecraft:lava ${cx} ${cy + 1.0} ${cz} 0.4 0.4 0.4 0.05 25`);
                    player.sendSystemMessage(Text.of(`§6🌋 [Горн] §fЭкипировка успешно возвышена до §eТира ${res.targetTier || evalAsc.targetTier}§f!`));

                    openInfernalCrucibleGUI(player, sess.stationPos);
                } else {
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                    player.sendSystemMessage(Text.of(`§c[Горн] ${res ? res.message : 'Ошибка ритуала возвышения!'}`));
                }
            };
        });

        // ----------------------------------------------------------------------
        // БЫСТРАЯ ЗАГРУЗКА ИЗ ИНВЕНТАРЯ
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

                if (id.startsWith('kubejs:ascension_catalyst_t') || id === 'kubejs:tier_upgrade_template') {
                    if (sess.catalyst && !sess.catalyst.isEmpty()) {
                        if (sess.catalyst.id === invItem.id && sess.catalyst.count < sess.catalyst.maxStackSize) {
                            let space = sess.catalyst.maxStackSize - sess.catalyst.count;
                            let move = Math.min(space, invItem.count);
                            sess.catalyst.grow(move);
                            invItem.shrink(move);
                            event.setItem(invItem.count <= 0 ? Item.of('minecraft:air') : invItem);
                        } else {
                            player.give(sess.catalyst);
                            sess.catalyst = invItem.copy();
                            event.setItem(Item.of('minecraft:air'));
                        }
                    } else {
                        sess.catalyst = invItem.copy();
                        event.setItem(Item.of('minecraft:air'));
                    }
                    sess.result = null;
                    player.server.runCommandSilent(`playsound minecraft:item.firecharge.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                    openInfernalCrucibleGUI(player, sess.stationPos);
                    return;
                }

                if (isEligibleAscensionGear(invItem)) {
                    if (sess.gear && !sess.gear.isEmpty()) player.give(sess.gear);
                    sess.gear = invItem.split(1);
                    event.setItem(invItem.count <= 0 ? Item.of('minecraft:air') : invItem);
                    sess.result = null;
                    player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                    openInfernalCrucibleGUI(player, sess.stationPos);
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
// ПРЯМОЙ ОБРАБОТЧИК КЛИКА ПКМ ПО АДСКОМУ ГОРНУ
// ------------------------------------------------------------------------------
BlockEvents.rightClicked('kubejs:infernal_crucible', event => {
    let player = event.player;
    if (!player || player.isFake()) return;
    if (event.hand != 'MAIN_HAND') return;

    let cx = event.block.x + 0.5;
    let cy = event.block.y + 0.5;
    let cz = event.block.z + 0.5;
    player.server.runCommandSilent(`playsound minecraft:block.lava.ambient player ${player.username} ${cx} ${cy} ${cz} 0.8 1.0`);
    player.server.runCommandSilent(`particle minecraft:lava ${cx} ${cy + 0.6} ${cz} 0.2 0.2 0.2 0.05 10`);
    openInfernalCrucibleGUI(player, event.block);
});

// Глобальная очистка при выходе
PlayerEvents.loggedOut(event => {
    if (event.player) {
        let sess = activeCrucibleSessions.get(event.player.uuid.toString());
        if (sess) {
            [sess.gear, sess.catalyst, sess.result].forEach(st => {
                if (st && !st.isEmpty()) event.player.give(st);
            });
            clearCrucibleSession(event.player);
        }
    }
});
