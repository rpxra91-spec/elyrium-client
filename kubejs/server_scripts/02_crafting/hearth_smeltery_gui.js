// ==============================================================================
// 🔥 ELYRIUM RPG: ADVANCED HEARTH SMELTERY GUI ENGINE (v2.0)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// File: server_scripts/02_crafting/hearth_smeltery_gui.js
// ==============================================================================
// Industrial Smeltery & Advanced Metallurgy:
// - Non-chest custom Cast-Iron Smeltery overlay (`\uF808\uE003`).
// - Layout:
//   * Left: 3 horizontal Raw Input Slots (ores, metals, stone, sand, clay, steel charge).
//   * Bottom Left: 3 horizontal Fuel Slots (coal, charcoal, blaze rods, lava, coal blocks).
//   * Right: 6 horizontal Output Slots (2 rows of 3 slots).
//   * Center: Smeltery Fire Chamber & Bellows Action Button.
// - Strict Rule: NO FOOD ALLOWED (strictly prohibited, extinguishes with smoke).
// - Multi-Smelting: smelts in parallel across the 3 raw input slots!
// - Full Inventory Routing: 1-click loading from player inventory into fuels/inputs!
// - 100% item safety on close.
// ==============================================================================

let activeHearthSessions = new Map();

function getOrCreateHearthSession(player) {
    let uuid = player.uuid.toString();
    if (!activeHearthSessions.has(uuid)) {
        activeHearthSessions.set(uuid, {
            inputs: [null, null, null],
            fuels: [null, null, null],
            outputs: [null, null, null, null, null, null],
            fuelCharges: 0,
            stationBlock: null
        });
    }
    return activeHearthSessions.get(uuid);
}

function clearHearthSession(player) {
    let uuid = player.uuid.toString();
    activeHearthSessions.delete(uuid);
}

// ------------------------------------------------------------------------------
// FOOD CHECK (STRICT PROHIBITION)
// ------------------------------------------------------------------------------
function isFoodItem(item) {
    if (!item || item.isEmpty()) return false;
    if (item.hasTag('minecraft:food') || item.hasTag('c:foods')) return true;

    let id = String(item.id).toLowerCase();
    let foodWords = [
        'beef', 'pork', 'chicken', 'mutton', 'potato', 'carrot', 'apple', 'bread',
        'fish', 'salmon', 'cod', 'stew', 'soup', 'pie', 'cookie', 'meat', 'rabbit',
        'kelp', 'beetroot', 'berries', 'melon', 'sweet_berries', 'glow_berries'
    ];
    for (let i = 0; i < foodWords.length; i++) {
        if (id.includes(foodWords[i])) return true;
    }

    try {
        let DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents');
        if (item.has(DataComponents.FOOD)) return true;
    } catch (e) {}

    return false;
}

// ------------------------------------------------------------------------------
// SMELTING RECIPES RESOLUTION
// ------------------------------------------------------------------------------
function getSmelteryResult(item) {
    if (!item || item.isEmpty()) return null;
    let id = String(item.id);

    // Elyrium Metallurgy
    if (id === 'kubejs:steel_charge') return Item.of('kubejs:steel_ingot');

    // Standard Ores & Raw Metals
    if (id === 'minecraft:raw_iron' || id.includes('iron_ore')) return Item.of('minecraft:iron_ingot');
    if (id === 'minecraft:raw_copper' || id.includes('copper_ore')) return Item.of('minecraft:copper_ingot');
    if (id === 'minecraft:raw_gold' || id.includes('gold_ore')) return Item.of('minecraft:gold_ingot');
    if (id === 'minecraft:ancient_debris') return Item.of('minecraft:netherite_scrap');

    // Stone & Building Materials
    if (id === 'minecraft:sand' || id === 'minecraft:red_sand') return Item.of('minecraft:glass');
    if (id === 'minecraft:cobblestone') return Item.of('minecraft:stone');
    if (id === 'minecraft:stone') return Item.of('minecraft:smooth_stone');
    if (id === 'minecraft:cobbled_deepslate') return Item.of('minecraft:deepslate');
    if (id === 'minecraft:clay_ball') return Item.of('minecraft:brick');
    if (id === 'minecraft:clay') return Item.of('minecraft:terracotta');

    // Modded Ores (Undergarden, Aether)
    if (id === 'undergarden:raw_cloggrum') return Item.of('undergarden:cloggrum_ingot');
    if (id === 'undergarden:raw_froststeel') return Item.of('undergarden:froststeel_ingot');
    if (id === 'aether:zanite_ore') return Item.of('aether:zanite_gemstone');
    if (id === 'aether:ambrosium_ore') return Item.of('aether:ambrosium_shard');

    // Tag based checks
    if (item.hasTag('c:raw_materials/iron') || item.hasTag('forge:raw_materials/iron')) return Item.of('minecraft:iron_ingot');
    if (item.hasTag('c:raw_materials/copper') || item.hasTag('forge:raw_materials/copper')) return Item.of('minecraft:copper_ingot');
    if (item.hasTag('c:raw_materials/gold') || item.hasTag('forge:raw_materials/gold')) return Item.of('minecraft:gold_ingot');

    // Dynamic fallback for modded raw ores
    if (id.includes('raw_')) {
        let candidate = id.replace('raw_', '') + '_ingot';
        if (Item.exists(candidate)) return Item.of(candidate);
    }

    return null;
}

function getFuelBurnUnits(fuelItem) {
    if (!fuelItem || fuelItem.isEmpty()) return 0;
    let id = String(fuelItem.id);

    if (id === 'minecraft:lava_bucket') return 100;
    if (id === 'minecraft:coal_block') return 80;
    if (id === 'minecraft:blaze_rod') return 12;
    if (id === 'minecraft:coal' || id === 'minecraft:charcoal') return 8;
    if (fuelItem.hasTag('minecraft:logs') || fuelItem.hasTag('minecraft:planks')) return 2;
    if (id === 'minecraft:stick') return 1;
    return 0;
}

// ------------------------------------------------------------------------------
// HELPER: PROCESS SMELTING CYCLE (UP TO 3 PARALLEL INPUT SLOTS)
// ------------------------------------------------------------------------------
function processSmelteryCycle(player, session, manualBoost) {
    let anySmelted = false;

    for (let i = 0; i < 3; i++) {
        let raw = session.inputs[i];
        if (!raw || raw.isEmpty()) continue;

        let result = getSmelteryResult(raw);
        if (!result) continue;

        // Ensure fuel availability
        if (session.fuelCharges <= 0) {
            for (let f = 0; f < 3; f++) {
                let fuelSt = session.fuels[f];
                if (fuelSt && !fuelSt.isEmpty()) {
                    let units = getFuelBurnUnits(fuelSt);
                    if (units > 0) {
                        session.fuelCharges += units;
                        if (fuelSt.id === 'minecraft:lava_bucket') {
                            session.fuels[f] = Item.of('minecraft:bucket');
                        } else {
                            fuelSt.shrink(1);
                            if (fuelSt.count <= 0) session.fuels[f] = null;
                        }
                        break;
                    }
                }
            }
        }

        if (session.fuelCharges <= 0) break; // Out of fuel charges

        // Find destination in 6 output slots
        let placed = false;
        // 1. Try stacking into matching item
        for (let o = 0; o < 6; o++) {
            let outSt = session.outputs[o];
            if (outSt && outSt.id === result.id && outSt.count < outSt.maxStackSize) {
                outSt.grow(1);
                placed = true;
                break;
            }
        }
        // 2. Try empty slot
        if (!placed) {
            for (let o = 0; o < 6; o++) {
                if (!session.outputs[o] || session.outputs[o].isEmpty()) {
                    session.outputs[o] = result.copy();
                    placed = true;
                    break;
                }
            }
        }

        if (placed) {
            session.fuelCharges = Math.max(0, session.fuelCharges - 1);
            raw.shrink(1);
            if (raw.count <= 0) session.inputs[i] = null;
            anySmelted = true;
        }
    }

    if (anySmelted) {
        let server = player.server;
        server.runCommandSilent(`playsound minecraft:block.furnace.fire_crackle player ${player.username} ~ ~ ~ 0.9 1.2`);
        server.runCommandSilent(`particle minecraft:flame ~ ~1.0 ~ 0.3 0.2 0.3 0.05 15`);
        server.runCommandSilent(`particle minecraft:smoke ~ ~1.2 ~ 0.2 0.4 0.2 0.02 10`);
    } else if (manualBoost) {
        player.server.runCommandSilent(`playsound minecraft:entity.blaze.shoot player ${player.username} ~ ~ ~ 0.7 1.4`);
    }

    return anySmelted;
}

// ------------------------------------------------------------------------------
// BLOCK RIGHT-CLICK INTERACTION
// ------------------------------------------------------------------------------
BlockEvents.rightClicked('kubejs:blacksmith_hearth', event => {
    let player = event.player;
    if (!player || player.isFake()) return;
    if (event.hand != 'MAIN_HAND') return;

    openHearthSmelteryGUI(player, event.block);
});

// ------------------------------------------------------------------------------
// ADVANCED SMELTERY GUI (3-ROW CONTAINER WITH FONT OVERLAY \uF808\uE003)
// ------------------------------------------------------------------------------
function openHearthSmelteryGUI(player, block) {
    if (!player || player.isFake()) return;

    let session = getOrCreateHearthSession(player);
    if (block) session.stationBlock = block;

    let fullTitle = '\uF808\uE003§r§6§lКУЗНЕЧНЫЙ ОЧАГ §7✦ §cПЛАВИЛЬНЯ';

    player.openChestGUI(Text.of(fullTitle), 3, gui => {
        gui.playerSlots = true;

        gui.closed = () => {
            // Return all items from input, fuel, and output slots safely
            let toRefund = [];
            for (let i = 0; i < 3; i++) {
                if (session.inputs[i] && !session.inputs[i].isEmpty()) toRefund.push(session.inputs[i]);
                if (session.fuels[i] && !session.fuels[i].isEmpty()) toRefund.push(session.fuels[i]);
                session.inputs[i] = null;
                session.fuels[i] = null;
            }
            for (let i = 0; i < 6; i++) {
                if (session.outputs[i] && !session.outputs[i].isEmpty()) toRefund.push(session.outputs[i]);
                session.outputs[i] = null;
            }

            toRefund.forEach(st => {
                if (st && !st.isEmpty()) player.give(st);
            });

            clearHearthSession(player);
        };

        // ----------------------------------------------------------------------
        // 1. LEFT TOP: 3 RAW INPUT SLOTS (Cols 0, 1, 2; Row 0)
        // ----------------------------------------------------------------------
        for (let i = 0; i < 3; i++) {
            let slotIdx = i;
            let currentItem = session.inputs[slotIdx];

            gui.slot(slotIdx, 0, s => {
                if (currentItem && !currentItem.isEmpty()) {
                    s.setItem(currentItem.copy().withLore([
                        Text.of('§8────────────────────────────────'),
                        Text.of('§e▶ Нажмите ЛКМ: §fЗабрать сырье в инвентарь'),
                        Text.of('§7Параллельная переплавка в горне')
                    ]));
                    s.leftClicked = () => {
                        player.give(currentItem);
                        session.inputs[slotIdx] = null;
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                        openHearthSmelteryGUI(player, session.stationBlock);
                    };
                } else {
                    s.setItem(Item.of('minecraft:light_gray_stained_glass_pane')
                        .withCustomName(Text.of(`§e[ Слот Сырья #${slotIdx + 1} ]`))
                        .withLore([
                            Text.of('§7Пусто. Кликните руду/слитки в инвентаре для загрузки.'),
                            Text.of('§8Поддерживает параллельную плавку до 3 слотов!')
                        ]));
                    s.leftClicked = () => {};
                }
            });
        }

        // ----------------------------------------------------------------------
        // 2. LEFT BOTTOM: 3 FUEL SLOTS (Cols 0, 1, 2; Row 2)
        // ----------------------------------------------------------------------
        for (let f = 0; f < 3; f++) {
            let fuelIdx = f;
            let currentFuel = session.fuels[fuelIdx];

            gui.slot(fuelIdx, 2, s => {
                if (currentFuel && !currentFuel.isEmpty()) {
                    s.setItem(currentFuel.copy().withLore([
                        Text.of('§8────────────────────────────────'),
                        Text.of('§e▶ Нажмите ЛКМ: §fЗабрать топливо в инвентарь'),
                        Text.of(`§7Текущий запас жара: §e${session.fuelCharges} ед.`)
                    ]));
                    s.leftClicked = () => {
                        player.give(currentFuel);
                        session.fuels[fuelIdx] = null;
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                        openHearthSmelteryGUI(player, session.stationBlock);
                    };
                } else {
                    s.setItem(Item.of('minecraft:orange_stained_glass_pane')
                        .withCustomName(Text.of(`§6[ Слот Топлива #${fuelIdx + 1} ]`))
                        .withLore([
                            Text.of('§7Пусто. Кликните уголь/лаву в инвентаре для загрузки.'),
                            Text.of('§8Уголь, древесный уголь, лава, блоки угля, огненные стержни')
                        ]));
                    s.leftClicked = () => {};
                }
            });
        }

        // ----------------------------------------------------------------------
        // 3. CENTER: SMELTERY BELLOWS & FLAME STATUS BUTTON (Col 4, Row 1 = Slot 13)
        // ----------------------------------------------------------------------
        gui.slot(4, 1, s => {
            let fireIcon = session.fuelCharges > 0 ? 'minecraft:campfire' : 'minecraft:coal';
            s.setItem(Item.of(fireIcon).withCustomName(Text.of('§6🔥 [ ГОРН ПЛАВИЛЬНИ ]')).withLore([
                Text.of(`§eЖар очага: §f${session.fuelCharges} ед. плавки`),
                Text.of('§8────────────────────────────────'),
                Text.of('§e▶ Нажмите ЛКМ: §fРаздуть мехи (Ускорить цикл переплавки)'),
                Text.of('§7Параллельная переплавка всех 3 слотов сырья!')
            ]));
            s.leftClicked = () => {
                processSmelteryCycle(player, session, true);
                openHearthSmelteryGUI(player, session.stationBlock);
            };
        });

        // ----------------------------------------------------------------------
        // 4. RIGHT: 6 FINISHED OUTPUT SLOTS (2 rows of 3 horizontal slots)
        // Row 0: Cols 6, 7, 8 | Row 1: Cols 6, 7, 8
        // ----------------------------------------------------------------------
        for (let o = 0; o < 6; o++) {
            let outIdx = o;
            let col = 6 + (outIdx % 3);
            let row = Math.floor(outIdx / 3);
            let outSt = session.outputs[outIdx];

            gui.slot(col, row, s => {
                if (outSt && !outSt.isEmpty()) {
                    s.setItem(outSt.copy().withLore([
                        Text.of('§8────────────────────────────────'),
                        Text.of('§a★ ГОТОВАЯ ПРОДУКЦИЯ ★'),
                        Text.of('§e▶ Нажмите ЛКМ: §fЗабрать в инвентарь!')
                    ]));
                    s.leftClicked = () => {
                        player.give(outSt);
                        session.outputs[outIdx] = null;
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                        openHearthSmelteryGUI(player, session.stationBlock);
                    };
                } else {
                    s.setItem(Item.of('minecraft:gray_stained_glass_pane')
                        .withCustomName(Text.of(`§8[ Лоток Продукции #${outIdx + 1} ]`))
                        .withLore([
                            Text.of('§7Пусто. Сюда поступают выплавленные слитки и материалы.')
                        ]));
                    s.leftClicked = () => {};
                }
            });
        }

        // ----------------------------------------------------------------------
        // 5. FILLER / DECORATIVE SLOTS (LOCK OUT EMPTY CONTAINER SLOTS)
        // ----------------------------------------------------------------------
        let fillerSlots = [
            { col: 3, row: 0 }, { col: 4, row: 0 }, { col: 5, row: 0 },
            { col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }, { col: 5, row: 1 },
            { col: 3, row: 2 }, { col: 4, row: 2 }, { col: 5, row: 2 }, { col: 6, row: 2 }, { col: 7, row: 2 }, { col: 8, row: 2 }
        ];

        fillerSlots.forEach(pos => {
            gui.slot(pos.col, pos.row, s => {
                s.setItem(Item.of('minecraft:air'));
                s.leftClicked = () => {};
            });
        });

        // ======================================================================
        // 6. INTELLIGENT INVENTORY ROUTING (gui.inventoryClicked)
        // ======================================================================
        gui.inventoryClicked = (invSlot, itemStack) => {
            if (!itemStack || itemStack.isEmpty()) return;

            // STRICT FOOD BAN
            if (isFoodItem(itemStack)) {
                player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ~ ~ ~ 1.0 1.5`);
                player.server.runCommandSilent(`particle minecraft:smoke ~ ~1.2 ~ 0.3 0.3 0.3 0.05 20`);
                player.tell(Text.of('§c⛔ [Очаг] Кузнечный Очаг предназначен только для металлургии! Пища сгорит в пепел.'));
                return;
            }

            // ROUTE 1: FUEL ITEM
            let fuelUnits = getFuelBurnUnits(itemStack);
            if (fuelUnits > 0) {
                // Try to stack into existing fuel slot
                for (let f = 0; f < 3; f++) {
                    let curF = session.fuels[f];
                    if (curF && curF.id === itemStack.id && curF.count < curF.maxStackSize) {
                        let space = curF.maxStackSize - curF.count;
                        let move = Math.min(space, itemStack.count);
                        curF.grow(move);
                        itemStack.shrink(move);
                        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                        processSmelteryCycle(player, session, false);
                        openHearthSmelteryGUI(player, session.stationBlock);
                        return;
                    }
                }
                // Try to place in empty fuel slot
                for (let f = 0; f < 3; f++) {
                    if (!session.fuels[f] || session.fuels[f].isEmpty()) {
                        session.fuels[f] = itemStack.copy();
                        itemStack.setCount(0);
                        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                        processSmelteryCycle(player, session, false);
                        openHearthSmelteryGUI(player, session.stationBlock);
                        return;
                    }
                }
                player.tell(Text.of('§e[Очаг] Все 3 слота топлива заняты! Извлеките лишнее.'));
                return;
            }

            // ROUTE 2: SMELTABLE RAW MATERIAL
            let smeltResult = getSmelteryResult(itemStack);
            if (smeltResult) {
                // Try to stack into existing raw input slot
                for (let i = 0; i < 3; i++) {
                    let curIn = session.inputs[i];
                    if (curIn && curIn.id === itemStack.id && curIn.count < curIn.maxStackSize) {
                        let space = curIn.maxStackSize - curIn.count;
                        let move = Math.min(space, itemStack.count);
                        curIn.grow(move);
                        itemStack.shrink(move);
                        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                        processSmelteryCycle(player, session, false);
                        openHearthSmelteryGUI(player, session.stationBlock);
                        return;
                    }
                }
                // Try to place in empty raw input slot
                for (let i = 0; i < 3; i++) {
                    if (!session.inputs[i] || session.inputs[i].isEmpty()) {
                        session.inputs[i] = itemStack.copy();
                        itemStack.setCount(0);
                        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                        processSmelteryCycle(player, session, false);
                        openHearthSmelteryGUI(player, session.stationBlock);
                        return;
                    }
                }
                player.tell(Text.of('§e[Очаг] Все 3 слота сырья заняты! Дождитесь окончания плавки.'));
                return;
            }

            player.tell(Text.of('§e[Очаг] Этот предмет не подходит для переплавки в кузнечном очаге.'));
        };
    });
}
