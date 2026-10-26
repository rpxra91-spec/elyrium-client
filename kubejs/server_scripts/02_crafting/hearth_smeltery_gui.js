// ==============================================================================
// 🔥 ELYRIUM RPG: ADVANCED HEARTH SMELTERY GUI ENGINE (v1.0)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
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
            stationPos: null
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
        'kelp', 'beetroot', 'berries', 'melon'
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
    return 1;
}

// ------------------------------------------------------------------------------
// BLOCK RIGHT-CLICK INTERACTION
// ------------------------------------------------------------------------------
BlockEvents.rightClicked('kubejs:blacksmith_hearth', event => {
    let player = event.player;
    if (!player || player.isFake()) return;

    openHearthSmelteryGUI(player, event.block);
});

// ------------------------------------------------------------------------------
// ADVANCED SMELTERY GUI (3-ROW CONTAINER WITH FONT OVERLAY \uF808\uE003)
// ------------------------------------------------------------------------------
function openHearthSmelteryGUI(player, block) {
    let session = getOrCreateHearthSession(player);
    if (block) session.stationPos = { x: block.x, y: block.y, z: block.z };

    let fullTitle = '\uF808\uE003§r§6§lКУЗНЕЧНЫЙ ОЧАГ §7✦ §cПЛАВИЛЬНЯ';

    player.openChestGUI(Text.of(fullTitle), 3, gui => {
        gui.playerSlots = true;

        gui.closed = () => {
            // Return all items from input, fuel, and output slots safely
            let toRefund = [];
            for (let i = 0; i < 3; i++) {
                if (session.inputs[i]) toRefund.push(session.inputs[i]);
                if (session.fuels[i]) toRefund.push(session.fuels[i]);
                session.inputs[i] = null;
                session.fuels[i] = null;
            }
            for (let i = 0; i < 6; i++) {
                if (session.outputs[i]) toRefund.push(session.outputs[i]);
                session.outputs[i] = null;
            }

            toRefund.forEach(st => {
                if (st && !st.isEmpty()) player.give(st);
            });

            clearHearthSession(player);
        };

        // ----------------------------------------------------------------------
        // HELPER: PROCESS A SMELTING BATCH (UP TO 3 PARALLEL SLOTS)
        // ----------------------------------------------------------------------
        function processSmeltingBatch() {
            let anySmelted = false;

            for (let i = 0; i < 3; i++) {
                let raw = session.inputs[i];
                if (!raw || raw.isEmpty()) continue;

                let result = getSmelteryResult(raw);
                if (!result) continue;

                // Check fuel availability
                if (session.fuelCharges <= 0) {
                    // Try to consume from fuel slots
                    for (let f = 0; f < 3; f++) {
                        let fuelSt = session.fuels[f];
                        if (fuelSt && !fuelSt.isEmpty()) {
                            let units = getFuelBurnUnits(fuelSt);
                            session.fuelCharges += units;

                            if (fuelSt.id === 'minecraft:lava_bucket') {
                                session.fuels[f] = Item.of('minecraft:bucket');
                            } else {
                                fuelSt.shrink(1);
                                if (fuelSt.count <= 0) session.fuels[f] = null;
                            }
                            gui.slot(f, 2, s => s.setItem(session.fuels[f] ? session.fuels[f] : Item.of('minecraft:air')));
                            break;
                        }
                    }
                }

                if (session.fuelCharges <= 0) break; // Out of fuel!

                // Find destination in 6 output slots
                let placed = false;
                // Try stacking first
                for (let o = 0; o < 6; o++) {
                    let outSt = session.outputs[o];
                    if (outSt && outSt.id === result.id && outSt.count < outSt.maxStackSize) {
                        outSt.grow(1);
                        placed = true;
                        updateOutputSlotVisual(o);
                        break;
                    }
                }
                // Try empty slot
                if (!placed) {
                    for (let o = 0; o < 6; o++) {
                        if (!session.outputs[o] || session.outputs[o].isEmpty()) {
                            session.outputs[o] = result.copy();
                            placed = true;
                            updateOutputSlotVisual(o);
                            break;
                        }
                    }
                }

                if (placed) {
                    session.fuelCharges = Math.max(0, session.fuelCharges - 1);
                    raw.shrink(1);
                    if (raw.count <= 0) session.inputs[i] = null;
                    gui.slot(i, 0, s => s.setItem(session.inputs[i] ? session.inputs[i] : Item.of('minecraft:air')));
                    anySmelted = true;
                }
            }

            if (anySmelted) {
                let server = player.server;
                server.runCommandSilent(`playsound minecraft:block.furnace.fire_crackle player ${player.username} ~ ~ ~ 1.0 1.2`);
                server.runCommandSilent(`particle minecraft:flame ~ ~1.0 ~ 0.3 0.2 0.3 0.05 15`);
                server.runCommandSilent(`particle minecraft:smoke ~ ~1.2 ~ 0.2 0.4 0.2 0.02 10`);
            }
            updateCenterFlameVisual();
        }

        function updateOutputSlotVisual(idx) {
            let col = 6 + (idx % 3);
            let row = Math.floor(idx / 3);
            gui.slot(col, row, s => {
                s.setItem(session.outputs[idx] ? session.outputs[idx] : Item.of('minecraft:air'));
            });
        }

        function updateCenterFlameVisual() {
            gui.slot(4, 1, s => {
                let fireIcon = session.fuelCharges > 0 ? 'minecraft:campfire' : 'minecraft:coal';
                s.setItem(Item.of(fireIcon).withCustomName(Text.of('§6🔥 [ ГОРН ПЛАВИЛЬНИ ]')).withLore([
                    Text.of(`§eЖар очага: §f${session.fuelCharges} ед. плавки`),
                    Text.of('§7ЛКМ: Раздуть мехи (Ускорить плавку)'),
                    Text.of('§8Параллельная переплавка 3 слотов сырья!')
                ]));
            });
        }

        // ----------------------------------------------------------------------
        // 1. LEFT TOP: 3 RAW INPUT SLOTS (Cols 0, 1, 2; Row 0)
        // ----------------------------------------------------------------------
        for (let i = 0; i < 3; i++) {
            let slotIdx = i;
            gui.slot(slotIdx, 0, s => {
                if (session.inputs[slotIdx]) s.setItem(session.inputs[slotIdx]);
                s.leftClicked = () => {
                    let cursor = player.cursorItem;
                    if (!cursor || cursor.isEmpty()) {
                        if (session.inputs[slotIdx]) {
                            player.setCursorItem(session.inputs[slotIdx]);
                            session.inputs[slotIdx] = null;
                            s.setItem(Item.of('minecraft:air'));
                        }
                    } else {
                        // STRICT FOOD BAN CHECK
                        if (isFoodItem(cursor)) {
                            player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ~ ~ ~ 1.0 1.5`);
                            player.server.runCommandSilent(`particle minecraft:smoke ~ ~1.2 ~ 0.3 0.3 0.3 0.05 20`);
                            player.tell(Text.of('§c⛔ [Очаг] Кузнечный Очаг предназначен только для металлургии и минералов! Пища сгорит в пепел.'));
                            return;
                        }

                        if (!getSmelteryResult(cursor)) {
                            player.tell(Text.of('§e[Очаг] Этот материал нельзя переплавить в кузнечном очаге.'));
                            return;
                        }

                        let old = session.inputs[slotIdx];
                        session.inputs[slotIdx] = cursor.copy();
                        player.setCursorItem(old ? old : Item.of('minecraft:air'));
                        s.setItem(session.inputs[slotIdx]);
                        processSmeltingBatch();
                    }
                };
            });
        }

        // ----------------------------------------------------------------------
        // 2. LEFT BOTTOM: 3 FUEL SLOTS (Cols 0, 1, 2; Row 2)
        // ----------------------------------------------------------------------
        for (let f = 0; f < 3; f++) {
            let fuelIdx = f;
            gui.slot(fuelIdx, 2, s => {
                if (session.fuels[fuelIdx]) s.setItem(session.fuels[fuelIdx]);
                s.leftClicked = () => {
                    let cursor = player.cursorItem;
                    if (!cursor || cursor.isEmpty()) {
                        if (session.fuels[fuelIdx]) {
                            player.setCursorItem(session.fuels[fuelIdx]);
                            session.fuels[fuelIdx] = null;
                            s.setItem(Item.of('minecraft:air'));
                        }
                    } else {
                        let units = getFuelBurnUnits(cursor);
                        if (units <= 0) {
                            player.tell(Text.of('§c[Очаг] Предмет не является топливом для горна!'));
                            return;
                        }

                        let old = session.fuels[fuelIdx];
                        session.fuels[fuelIdx] = cursor.copy();
                        player.setCursorItem(old ? old : Item.of('minecraft:air'));
                        s.setItem(session.fuels[fuelIdx]);
                        processSmeltingBatch();
                    }
                };
            });
        }

        // ----------------------------------------------------------------------
        // 3. CENTER: SMELTERY BELLOWS & FLAME STATUS BUTTON (Col 4, Row 1)
        // ----------------------------------------------------------------------
        updateCenterFlameVisual();
        gui.slot(4, 1, s => {
            s.leftClicked = () => {
                // Blow bellows to accelerate smelting
                player.server.runCommandSilent(`playsound minecraft:entity.blaze.shoot player ${player.username} ~ ~ ~ 0.7 1.4`);
                processSmeltingBatch();
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

            gui.slot(col, row, s => {
                if (session.outputs[outIdx]) s.setItem(session.outputs[outIdx]);
                s.leftClicked = () => {
                    let outSt = session.outputs[outIdx];
                    if (outSt && !outSt.isEmpty()) {
                        let cursor = player.cursorItem;
                        if (!cursor || cursor.isEmpty()) {
                            player.setCursorItem(outSt);
                            session.outputs[outIdx] = null;
                            s.setItem(Item.of('minecraft:air'));
                        } else if (cursor.id === outSt.id && cursor.count + outSt.count <= cursor.maxStackSize) {
                            cursor.grow(outSt.count);
                            session.outputs[outIdx] = null;
                            s.setItem(Item.of('minecraft:air'));
                        }
                    }
                };
            });
        }
    });
}
