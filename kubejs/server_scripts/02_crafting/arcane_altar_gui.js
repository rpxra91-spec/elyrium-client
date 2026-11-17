// ==============================================================================
// 🔮 ELYRIUM RPG: ARCANE ALTAR OF THE ARCHMAGE (WORKSTATION GUI v1.0)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 3rd Workstation of the Nether Triad:
// - Custom non-chest visual header (`\uF808\uE008\uF80A§r§d§lМАГИЧЕСКИЙ АЛТАРЬ`).
// - Dynamic Spell Capacity & Weight monitoring (spell_capacity_engine.js).
// - Innate spell protection & elemental resonance calculation.
// - 1-Click scroll inscription & safe extraction (individual or bulk).
// - In-place slot updating (renderArcaneAltarSlots): zero screen flicker, zero cursor recentering.
// - 100% item safety on close.
// ==============================================================================

var Arcane_ISpellContainer = Java.loadClass('io.redspace.ironsspellbooks.api.spells.ISpellContainer');
var Arcane_SpellRegistry = Java.loadClass('io.redspace.ironsspellbooks.api.registry.SpellRegistry');

let activeArcaneAltarSessions = new Map();

function getOrCreateArcaneSession(player) {
    let uuid = player.uuid.toString();
    if (!activeArcaneAltarSessions.has(uuid)) {
        activeArcaneAltarSessions.set(uuid, {
            implement: null,
            scroll: null,
            stationPos: null
        });
    }
    return activeArcaneAltarSessions.get(uuid);
}

function clearArcaneSession(player) {
    let uuid = player.uuid.toString();
    activeArcaneAltarSessions.delete(uuid);
}

function isEligibleMagicImplement(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = String(item.id).toLowerCase();
    return id.includes('staff') || id.includes('wand') || id.includes('rod') || id.includes('cane') ||
           id.includes('spell_book') || id.includes('grimoire') || id.includes('tome') ||
           item.hasTag('minecraft:swords') || item.hasTag('c:weapons') || id.includes('sword') || id.includes('blade');
}

function isIronScrollItem(item) {
    if (!item || item.isEmpty()) return false;
    return String(item.id) === 'irons_spellbooks:scroll';
}

function getScrollSpellData(item) {
    if (!item || item.isEmpty()) return null;
    let raw = getRawItemStack(item);
    if (!raw) return null;

    try {
        if (!Arcane_ISpellContainer.isSpellContainer(raw)) return null;
        let c = Arcane_ISpellContainer.get(raw);
        let spells = c.getActiveSpells();
        if (spells && !spells.isEmpty()) {
            let slot = spells.get(0);
            let sp = slot.getSpell();
            return {
                spell: sp,
                spellId: String(sp.getSpellResource()).toLowerCase(),
                name: sp.getSpellName(),
                level: slot.getLevel(),
                school: sp.getSchoolType() ? sp.getSchoolType().getDisplayName().getString() : 'Универсальная'
            };
        }
    } catch (e) {
        console.error(`[ArcaneAltar] Error reading scroll: ${e}`);
    }
    return null;
}

function openArcaneAltarGUI(player, stationPos) {
    if (!player || player.isFake()) return;

    let sess = getOrCreateArcaneSession(player);
    if (stationPos) sess.stationPos = stationPos;

    let title = '§f\uF808\uE008\uF80A§r§d§lМАГИЧЕСКИЙ АЛТАРЬ';

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

            let refundList = [sess.implement, sess.scroll];
            sess.implement = null;
            sess.scroll = null;

            refundList.forEach(st => {
                if (st && !st.isEmpty()) player.give(st);
            });
            clearArcaneSession(player);
        };

        // Lock all background / unused slots to prevent item loss
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 9; col++) {
                if (row === 0 && col === 4) continue; // Monitor
                if (row === 1 && (col === 1 || col === 3 || col === 5 || col === 7)) continue; // Workstation slots
                if (row === 2 && col < 8) continue; // Spell slots 0..7
                gui.slot(col, row, st => {
                    st.setItem(Item.of('minecraft:air'));
                    st.leftClicked = () => {};
                    st.rightClicked = () => {};
                    st.shiftLeftClicked = () => {};
                });
            }
        }

        function renderArcaneAltarSlots() {
            let rawImplement = sess.implement ? getRawItemStack(sess.implement) : null;
            let container = null;
            let magicProfile = null;
            let activeSpells = [];
            let maxSpellCount = 0;
            let totalWeight = 0;
            let capacityLimit = 20;

            if (sess.implement && rawImplement) {
                magicProfile = getItemMagicProfile(sess.implement);
                if (magicProfile && typeof ensureItemSpellContainer === 'function') {
                    ensureItemSpellContainer(sess.implement);
                }
                try {
                    if (Arcane_ISpellContainer.isSpellContainer(rawImplement)) {
                        container = Arcane_ISpellContainer.get(rawImplement);
                        if (container) {
                            maxSpellCount = container.getMaxSpellCount();
                            let spList = container.getActiveSpells();
                            if (spList) {
                                for (let i = 0; i < spList.size(); i++) {
                                    activeSpells.push(spList.get(i));
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error(`[ArcaneAltar] Error reading implement spells: ${e}`);
                }

                if (magicProfile && typeof CAPACITY_TABLE !== 'undefined') {
                    let capArr = CAPACITY_TABLE[magicProfile.type] || CAPACITY_TABLE.weapons;
                    let tIdx = Math.max(0, Math.min(8, (magicProfile.tier || 1)));
                    capacityLimit = capArr[tIdx] || 25;
                }

                if (typeof analyzeItemSpells === 'function') {
                    let a = analyzeItemSpells(sess.implement);
                    totalWeight = a.totalWeight;
                }
            }

            let scrollData = sess.scroll ? getScrollSpellData(sess.scroll) : null;
            let scrollWeight = scrollData && typeof getSpellWeight === 'function' ? getSpellWeight(scrollData.spellId, scrollData.level) : 4;

            // ------------------------------------------------------------------
            // СЛОТ (4, 0): МОНИТОР ПРОГРЕССИИ И ВМЕСТИМОСТИ
            // ------------------------------------------------------------------
            gui.slot(4, 0, s => {
                if (sess.implement && !sess.implement.isEmpty()) {
                    let isOverloaded = totalWeight > capacityLimit;
                    let monitorItem = Item.of(isOverloaded ? 'minecraft:crying_obsidian' : 'minecraft:amethyst_shard');
                    monitorItem.enchant('minecraft:unbreaking', 1);

                    let lore = [
                        Text.of(`§7• Класс: §e${magicProfile ? magicProfile.type.toUpperCase() : 'МАГИЧЕСКИЙ АРТЕФАКТ'}`),
                        Text.of(`§7• Свободно слотов: §b${activeSpells.length} §7/ §a${maxSpellCount}`),
                        Text.of(`§7• Вес Заклинаний: ${isOverloaded ? '§c⚠ ' : '§a✓ '}§e${totalWeight} §7/ §6${capacityLimit} Вместимости`),
                        Text.of('§8────────────────────────────────')
                    ];

                    if (isOverloaded) {
                        lore.push(Text.of('§4⚠ ПЕРЕГРУЗКА ВМЕСТИМОСТИ!'));
                        lore.push(Text.of('§cРасход маны 100% + риск срыва заклинания 50%!'));
                    } else {
                        lore.push(Text.of('§a✓ Вместимость стабильна: чистый каст без штрафов.'));
                    }

                    s.setItem(monitorItem.withCustomName(Text.of('§d🔮 [ ПАСПОРТ МАГИЧЕСКОЙ СТАНЦИИ ]')).withLore(lore));
                } else {
                    s.setItem(Item.of('minecraft:compass')
                        .withCustomName(Text.of('§8🔮 [ МАГИЧЕСКИЙ АЛТАРЬ ]'))
                        .withLore([Text.of('§7Установите посох, гримуар или оружие в Слот I.')]));
                }
                s.leftClicked = () => {}; s.rightClicked = () => {};
            });

            // ------------------------------------------------------------------
            // СЛОТ (1, 1): [МАГИЧЕСКИЙ АРТЕФАКТ / ПОСОХ / ОРУЖИЕ]
            // ------------------------------------------------------------------
            gui.slot(1, 1, s => {
                if (sess.implement && !sess.implement.isEmpty()) {
                    s.setItem(sess.implement.copy().withLore([
                        Text.of('§8────────────────────────────────'),
                        Text.of('§e▶ Нажмите ЛКМ: §fЗабрать в руку / поменять'),
                        Text.of('§e▶ Нажмите Shift+ЛКМ: §fЗабрать в инвентарь')
                    ]));
                } else {
                    s.setItem(Item.of('minecraft:air'));
                }

                s.leftClicked = () => {
                    let carried = player.containerMenu.getCarried();
                    let current = sess.implement;

                    if (carried && !carried.isEmpty() && isEligibleMagicImplement(carried)) {
                        if (!current || current.isEmpty()) {
                            sess.implement = carried.split(1);
                            player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                        } else {
                            let temp = current.copy();
                            sess.implement = carried.split(1);
                            player.give(temp);
                            player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                        }
                        renderArcaneAltarSlots();
                    } else if (current && !current.isEmpty()) {
                        player.containerMenu.setCarried(current.copy());
                        sess.implement = null;
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                        renderArcaneAltarSlots();
                    }
                };

                s.shiftLeftClicked = () => {
                    if (sess.implement && !sess.implement.isEmpty()) {
                        let out = sess.implement;
                        sess.implement = null;
                        player.give(out);
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                        renderArcaneAltarSlots();
                    }
                };
                s.rightClicked = s.leftClicked;
            });

            // ------------------------------------------------------------------
            // СЛОТ (3, 1): [СВИТОК ЗАКЛИНАНИЯ IRON'S SPELLS]
            // ------------------------------------------------------------------
            gui.slot(3, 1, s => {
                if (sess.scroll && !sess.scroll.isEmpty()) {
                    let lore = [
                        Text.of('§8────────────────────────────────'),
                        Text.of('§e▶ Нажмите ЛКМ: §fЗабрать в руку / поменять'),
                        Text.of('§e▶ Нажмите Shift+ЛКМ: §fЗабрать в инвентарь')
                    ];
                    if (scrollData) {
                        lore.unshift(Text.of(`§7• Школа: §d${scrollData.school} §7| Вес: §e${scrollWeight}`));
                        lore.unshift(Text.of(`§a✦ Заклинание: §f${scrollData.name} [Ур. ${scrollData.level}]`));
                    }
                    s.setItem(sess.scroll.copy().withLore(lore));
                } else {
                    s.setItem(Item.of('minecraft:air'));
                }

                s.leftClicked = () => {
                    let carried = player.containerMenu.getCarried();
                    let current = sess.scroll;

                    if (carried && !carried.isEmpty() && isIronScrollItem(carried)) {
                        if (!current || current.isEmpty()) {
                            sess.scroll = carried.copy();
                            player.containerMenu.setCarried(Item.of('minecraft:air'));
                            player.server.runCommandSilent(`playsound minecraft:item.book.page_turn player ${player.username} ~ ~ ~ 0.9 1.2`);
                        } else if (current.id === carried.id) {
                            let space = current.maxStackSize - current.count;
                            let move = Math.min(space, carried.count);
                            current.grow(move);
                            carried.shrink(move);
                            if (carried.count <= 0) player.containerMenu.setCarried(Item.of('minecraft:air'));
                            player.server.runCommandSilent(`playsound minecraft:item.book.page_turn player ${player.username} ~ ~ ~ 0.9 1.2`);
                        } else {
                            let temp = current.copy();
                            sess.scroll = carried.copy();
                            player.containerMenu.setCarried(temp);
                            player.server.runCommandSilent(`playsound minecraft:item.book.page_turn player ${player.username} ~ ~ ~ 0.9 1.2`);
                        }
                        renderArcaneAltarSlots();
                    } else if (current && !current.isEmpty()) {
                        player.containerMenu.setCarried(current.copy());
                        sess.scroll = null;
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                        renderArcaneAltarSlots();
                    }
                };

                s.shiftLeftClicked = () => {
                    if (sess.scroll && !sess.scroll.isEmpty()) {
                        let out = sess.scroll;
                        sess.scroll = null;
                        player.give(out);
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                        renderArcaneAltarSlots();
                    }
                };
                s.rightClicked = s.leftClicked;
            });

            // ------------------------------------------------------------------
            // СЛОТ (5, 1): [ВПЕЧАТАТЬ ЗАКЛИНАНИЕ] (Интерактивная кнопка инкрустации)
            // ------------------------------------------------------------------
            let canInscribe = false;
            let inscribeReason = 'Установите посох и свиток';

            if (sess.implement && sess.scroll) {
                if (!scrollData) {
                    inscribeReason = 'Свиток не содержит активного заклинания';
                } else if (activeSpells.length >= maxSpellCount) {
                    inscribeReason = `Все слоты артефакта заняты (${maxSpellCount}/${maxSpellCount})`;
                } else if (totalWeight + scrollWeight > capacityLimit) {
                    inscribeReason = `Превышение вместимости (+${scrollWeight} вес > макс ${capacityLimit})`;
                } else {
                    canInscribe = true;
                }
            }

            gui.slot(5, 1, s => {
                let btnItem = Item.of(canInscribe ? 'minecraft:enchanted_book' : 'minecraft:book');
                if (canInscribe) btnItem.enchant('minecraft:unbreaking', 1);

                let btnLore = [
                    Text.of(canInscribe ? `§a✓ Готово к впечатыванию в Слот ${activeSpells.length + 1}` : `§c✖ ${inscribeReason}`),
                    Text.of('§8────────────────────────────────')
                ];

                if (canInscribe) {
                    btnLore.push(Text.of(`§7• Заклинание: §f${scrollData.name} [Ур. ${scrollData.level}]`));
                    btnLore.push(Text.of(`§7• Расход вместимости: §e+${scrollWeight} §7(Итого: §b${totalWeight + scrollWeight} §7/ §6${capacityLimit}§7)`));
                    btnLore.push(Text.of('§8────────────────────────────────'));
                    btnLore.push(Text.of('§e▶ Нажмите ЛКМ, чтобы навечно начертать заклинание!'));
                }

                s.setItem(btnItem.withCustomName(Text.of(canInscribe ? '§d✨ [ НАЧЕРТАТЬ ЗАКЛИНАНИЕ ]' : '§8[ 📖 Начертание Недоступно ]')).withLore(btnLore));

                s.leftClicked = () => {
                    if (!canInscribe || !container || !scrollData) {
                        player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                        return;
                    }

                    try {
                        let mutable = container.mutableCopy();
                        let nextIdx = mutable.getNextAvailableIndex();
                        if (nextIdx < 0 || nextIdx >= maxSpellCount) {
                            nextIdx = activeSpells.length;
                        }

                        let success = mutable.addSpellAtIndex(scrollData.spell, scrollData.level, nextIdx, false);
                        if (success) {
                            Arcane_ISpellContainer.set(rawImplement, mutable.toImmutable());

                            // Consume 1 scroll
                            sess.scroll.shrink(1);
                            if (sess.scroll.isEmpty()) sess.scroll = null;

                            // Audio & Particles
                            let px = player.x, py = player.y, pz = player.z;
                            player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 1.0 1.2`);
                            player.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${player.username} ~ ~ ~ 0.9 1.4`);
                            player.server.runCommandSilent(`particle minecraft:portal ${px} ${py + 1.2} ${pz} 0.5 0.5 0.5 0.1 35`);
                            player.server.runCommandSilent(`particle minecraft:enchant ${px} ${py + 1.0} ${pz} 0.4 0.4 0.4 0.1 40`);

                            player.sendSystemMessage(Text.of(`§a✦ Заклинание «${scrollData.name}» успешно впечатано в Слот ${nextIdx + 1}! ✦`));
                            renderArcaneAltarSlots();
                        } else {
                            player.sendSystemMessage(Text.of('§cОшибка при добавлении заклинания в контейнер артефакта.'));
                        }
                    } catch (e) {
                        console.error(`[ArcaneAltar] Error inscribing spell: ${e}`);
                        player.sendSystemMessage(Text.of(`§cОшибка: ${e}`));
                    }
                };
                s.rightClicked = s.leftClicked;
            });

            // ------------------------------------------------------------------
            // СЛОТ (7, 1): [ИЗВЛЕЧЬ ЗАКЛИНАНИЯ] (Массовый ребилд арсенала)
            // ------------------------------------------------------------------
            let extractableSpells = activeSpells.filter(sp => !sp.isLocked());
            let canExtract = extractableSpells.length > 0;

            gui.slot(7, 1, s => {
                let extItem = Item.of(canExtract ? 'minecraft:shears' : 'minecraft:barrier');
                if (canExtract) extItem.enchant('minecraft:unbreaking', 1);

                let extLore = [
                    Text.of(canExtract ? `§aДоступно для извлечения: §e${extractableSpells.length} §aсвитков` : '§7Нет начертанных свитков для извлечения'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§6✓ Врожденные заклинания (Слот 0) защищены от извлечения!')
                ];
                if (canExtract) {
                    extLore.push(Text.of('§8────────────────────────────────'));
                    extLore.push(Text.of('§e▶ Нажмите ЛКМ, чтобы вернуть ВСЕ свитки в инвентарь!'));
                }

                s.setItem(extItem.withCustomName(Text.of(canExtract ? '§6📜 [ ИЗВЛЕЧЬ ВСЕ СВИТКИ ]' : '§8[ ✖ Извлечение Недоступно ]')).withLore(extLore));

                s.leftClicked = () => {
                    if (!canExtract || !container) {
                        player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                        return;
                    }

                    try {
                        let mutable = container.mutableCopy();
                        let countExtracted = 0;

                        // Iterate through slots in reverse to safely remove
                        for (let i = maxSpellCount - 1; i >= 0; i--) {
                            let spData = mutable.getSpellAtIndex(i);
                            if (spData && spData.getSpell) {
                                let sp = spData.getSpell();
                                let spId = String(sp.getSpellResource()).toLowerCase();
                                let lvl = spData.getLevel ? spData.getLevel() : 1;
                                let isLocked = spData.isLocked ? spData.isLocked() : false;

                                if (!isLocked) {
                                    mutable.removeSpellAtIndex(i);
                                    player.server.runCommandSilent(`execute as ${player.username} at ${player.username} run createScroll ${spId} ${lvl}`);
                                    countExtracted++;
                                }
                            }
                        }

                        Arcane_ISpellContainer.set(rawImplement, mutable.toImmutable());

                        player.server.runCommandSilent(`playsound minecraft:item.book.page_turn player ${player.username} ~ ~ ~ 1.0 1.2`);
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.9 1.1`);
                        player.sendSystemMessage(Text.of(`§6✦ Извлечено ${countExtracted} свитков обратно в инвентарь без потерь! ✦`));
                        renderArcaneAltarSlots();
                    } catch (e) {
                        console.error(`[ArcaneAltar] Error extracting spells: ${e}`);
                        player.sendSystemMessage(Text.of(`§cОшибка: ${e}`));
                    }
                };
                s.rightClicked = s.leftClicked;
            });

            // ------------------------------------------------------------------
            // РЯД 2 (Y=2): СЛОТЫ ЗАКЛИНАНИЙ 1..8 (Визуализация и точечное извлечение)
            // ------------------------------------------------------------------
            for (let col = 0; col < 8; col++) {
                let slotIdx = col;
                gui.slot(col, 2, s => {
                    if (!sess.implement || sess.implement.isEmpty() || slotIdx >= maxSpellCount) {
                        s.setItem(Item.of('minecraft:air'));
                        s.leftClicked = () => {};
                        return;
                    }

                    let spSlot = (slotIdx < activeSpells.length) ? activeSpells[slotIdx] : null;
                    if (spSlot && spSlot.getSpell) {
                        let sp = spSlot.getSpell();
                        let spId = String(sp.getSpellResource()).toLowerCase();
                        let lvl = spSlot.getLevel();
                        let isLocked = spSlot.isLocked();
                        let w = typeof getSpellWeight === 'function' ? getSpellWeight(spId, lvl) : 3;

                        let iconItem = Item.of(isLocked ? 'minecraft:enchanted_golden_apple' : 'minecraft:paper');
                        iconItem.enchant('minecraft:unbreaking', 1);

                        let lore = [
                            Text.of(`§7• Школа: §d${sp.getSchoolType() ? sp.getSchoolType().getDisplayName().getString() : 'Магия'}`),
                            Text.of(`§7• Уровень: §a${lvl} §7| Вес: §e${w} вместимости`),
                            Text.of('§8────────────────────────────────')
                        ];

                        if (isLocked) {
                            lore.push(Text.of('§6🔒 [ВРОЖДЕННОЕ ЗАКЛИНАНИЕ]'));
                            lore.push(Text.of('§7Является духовной частью посоха (защищено).'));
                        } else {
                            lore.push(Text.of('§a✓ Начертанное заклинание'));
                            lore.push(Text.of('§e▶ Нажмите ЛКМ, чтобы извлечь этот свиток в сумку!'));
                        }

                        s.setItem(iconItem.withCustomName(Text.of(`§d✨ Слот ${slotIdx + 1}: §f${sp.getSpellName()}`)).withLore(lore));

                        s.leftClicked = () => {
                            if (isLocked) {
                                player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                                player.tell(Text.of('§eℹ Врожденные заклинания артефакта невозможно извлечь.'));
                                return;
                            }

                            try {
                                let mutable = container.mutableCopy();
                                mutable.removeSpellAtIndex(slotIdx);
                                Arcane_ISpellContainer.set(rawImplement, mutable.toImmutable());

                                player.server.runCommandSilent(`execute as ${player.username} at ${player.username} run createScroll ${spId} ${lvl}`);
                                player.server.runCommandSilent(`playsound minecraft:item.book.page_turn player ${player.username} ~ ~ ~ 1.0 1.2`);
                                player.sendSystemMessage(Text.of(`§6✓ Свиток «${sp.getSpellName()}» извлечен из Слота ${slotIdx + 1}! ✦`));
                                renderArcaneAltarSlots();
                            } catch (e) {
                                console.error(`[ArcaneAltar] Error extracting single spell: ${e}`);
                            }
                        };
                        s.rightClicked = s.leftClicked;
                    } else {
                        s.setItem(Item.of('minecraft:structure_void')
                            .withCustomName(Text.of(`§8[ ✧ Слот ${slotIdx + 1}: Свободен ]`))
                            .withLore([Text.of('§7Вставьте свиток в Слот II и нажмите «Начертать».')]));
                        s.leftClicked = () => {};
                        s.rightClicked = () => {};
                    }
                });
            }
        }

        renderArcaneAltarSlots();

        // ----------------------------------------------------------------------
        // ОБРАБОТКА КЛИКОВ ПО ИНВЕНТАРЮ ИГРОКА (Быстрый Shift-Click и Drag & Drop)
        // ----------------------------------------------------------------------
        gui.inventoryClicked = (event) => {
            if (!event) return;
            let invItem = event.getItem();
            let carried = player.containerMenu.getCarried();
            let clickTypeStr = event.type ? String(event.type) : 'PICKUP';

            // Quick Move (Shift + Click)
            if (clickTypeStr === 'QUICK_MOVE') {
                if (!invItem || invItem.isEmpty()) return;

                // 1. Свиток Iron's Spells
                if (isIronScrollItem(invItem)) {
                    if (sess.scroll && !sess.scroll.isEmpty()) {
                        player.give(sess.scroll);
                    }
                    sess.scroll = invItem.copy();
                    event.setItem(Item.of('minecraft:air'));
                    player.server.runCommandSilent(`playsound minecraft:item.book.page_turn player ${player.username} ~ ~ ~ 0.9 1.2`);
                    renderArcaneAltarSlots();
                    return;
                }

                // 2. Магический артефакт (Посох / Гримуар / Оружие)
                if (isEligibleMagicImplement(invItem)) {
                    if (sess.implement && !sess.implement.isEmpty()) {
                        player.give(sess.implement);
                    }
                    sess.implement = invItem.split(1);
                    event.setItem(invItem.count <= 0 ? Item.of('minecraft:air') : invItem);
                    player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                    renderArcaneAltarSlots();
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
// БЛОКОВЫЙ ОБРАБОТЧИК КЛИКА ПКМ ПО МАГИЧЕСКОМУ АЛТАРЮ
// ------------------------------------------------------------------------------
BlockEvents.rightClicked('kubejs:arcane_altar', event => {
    let player = event.player;
    if (!player || player.isFake()) return;
    if (event.hand != 'MAIN_HAND') return;

    openArcaneAltarGUI(player, event.block);
    player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 0.8 1.2`);
});
