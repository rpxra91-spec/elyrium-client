// ==============================================================================
// 🔥 ELYRIUM RPG: AUTONOMOUS WORLD HEARTH SMELTERY & METALLURGY ENGINE (v3.0)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// File: server_scripts/02_crafting/hearth_smeltery_gui.js
// ==============================================================================
// 100% Autonomous In-World Industrial Smeltery:
// - Non-chest custom Cast-Iron Smeltery overlay (`\uF808\uE003`).
// - Zero Title Collision: Uses clean bitmap glyph, preserving hand-drawn overlay title.
// - Real World Persistence: Items stay stored inside the physical block!
// - Autonomous Background Smelting: Continues smelting in the world even when closed!
// - Visual Cooking Animation: Dynamic progress bar, animated flame phases & smoke.
// - Full 2-Way Resource Movement: Free pickup, placement & Shift-click for inputs/fuels/outputs.
// - Multi-Smelting: Smelts up to 3 raw ore inputs simultaneously!
// - Bellows Action: Left-clicking bellows provides +30% instant cooking boost!
// - Drops all contents if broken in the world.
// - Strict Rule: NO FOOD ALLOWED (strictly industrial metallurgy).
// ==============================================================================

global.ElyriumHearthData = global.ElyriumHearthData || {};
let openHearthViewers = new Map(); // uuid -> { blockKey, gui }

function getHearthKey(level, x, y, z) {
    let dim = String(level.dimension);
    return `${dim}_${x}_${y}_${z}`;
}

function makeDefaultHearthState() {
    return {
        inputs: [null, null, null],
        fuels: [null, null, null],
        outputs: [null, null, null, null, null, null],
        fuelUnits: 0,
        cookProgress: 0,
        lastActiveTick: 0
    };
}

function getHearthState(level, x, y, z) {
    let key = getHearthKey(level, x, y, z);
    if (!global.ElyriumHearthData[key]) {
        let server = level.server;
        let pData = server.persistentData;
        let hearthCompound = pData.getCompound('elyrium_hearth_data');
        if (hearthCompound && hearthCompound.contains(key)) {
            try {
                let jsonStr = hearthCompound.getString(key);
                let parsed = JSON.parse(jsonStr);
                let state = makeDefaultHearthState();
                state.fuelUnits = parsed.fuelUnits || 0;
                state.cookProgress = parsed.cookProgress || 0;
                for (let i = 0; i < 3; i++) {
                    if (parsed.inputs && parsed.inputs[i]) state.inputs[i] = Item.of(parsed.inputs[i].id, parsed.inputs[i].count);
                    if (parsed.fuels && parsed.fuels[i]) state.fuels[i] = Item.of(parsed.fuels[i].id, parsed.fuels[i].count);
                }
                for (let o = 0; o < 6; o++) {
                    if (parsed.outputs && parsed.outputs[o]) state.outputs[o] = Item.of(parsed.outputs[o].id, parsed.outputs[o].count);
                }
                global.ElyriumHearthData[key] = state;
            } catch (e) {
                global.ElyriumHearthData[key] = makeDefaultHearthState();
            }
        } else {
            global.ElyriumHearthData[key] = makeDefaultHearthState();
        }
    }
    return global.ElyriumHearthData[key];
}

function saveHearthState(server, key, state) {
    try {
        let pData = server.persistentData;
        let hearthCompound = pData.getCompound('elyrium_hearth_data');
        let toSave = {
            fuelUnits: state.fuelUnits || 0,
            cookProgress: state.cookProgress || 0,
            inputs: state.inputs.map(it => (it && !it.isEmpty()) ? { id: String(it.id), count: it.count } : null),
            fuels: state.fuels.map(it => (it && !it.isEmpty()) ? { id: String(it.id), count: it.count } : null),
            outputs: state.outputs.map(it => (it && !it.isEmpty()) ? { id: String(it.id), count: it.count } : null)
        };
        hearthCompound.putString(key, JSON.stringify(toSave));
        pData.put('elyrium_hearth_data', hearthCompound);
    } catch (e) {}
}

// ------------------------------------------------------------------------------
// RECIPES & FUEL SPECIFICATION
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
    return false;
}

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
    if (id === 'minecraft:blaze_rod') return 16;
    if (id === 'minecraft:coal' || id === 'minecraft:charcoal') return 8;
    if (fuelItem.hasTag('minecraft:logs') || fuelItem.hasTag('minecraft:planks')) return 2;
    if (id === 'minecraft:stick') return 1;
    return 0;
}

function makeProgressBar(percent) {
    let total = 10;
    let filled = Math.min(total, Math.max(0, Math.floor(percent / 10)));
    let bar = '';
    for (let i = 0; i < filled; i++) bar += '█';
    for (let i = filled; i < total; i++) bar += '░';
    return bar;
}

// ------------------------------------------------------------------------------
// AUTONOMOUS BACKGROUND TICK ENGINE (ServerEvents.tick)
// ------------------------------------------------------------------------------
ServerEvents.tick(event => {
    let server = event.server;
    // Тикаем каждые 10 тиков (0.5 сек)
    if (server.tickCount % 10 !== 0) return;

    for (let key in global.ElyriumHearthData) {
        let state = global.ElyriumHearthData[key];
        if (!state) continue;

        let parts = key.split('_');
        if (parts.length < 4) continue;
        let dim = parts[0];
        let bx = parseInt(parts[1]);
        let by = parseInt(parts[2]);
        let bz = parseInt(parts[3]);

        let level = server.getLevel(dim);
        if (!level || !level.isLoaded(new BlockPos(bx, by, bz))) continue;

        // 1. Проверяем, есть ли что плавить
        let canSmeltAny = false;
        for (let i = 0; i < 3; i++) {
            let inSt = state.inputs[i];
            if (inSt && !inSt.isEmpty()) {
                let res = getSmelteryResult(inSt);
                if (res) {
                    // Проверяем, есть ли место в лотках
                    for (let o = 0; o < 6; o++) {
                        let outSt = state.outputs[o];
                        if (!outSt || outSt.isEmpty() || (outSt.id === res.id && outSt.count < outSt.maxStackSize)) {
                            canSmeltAny = true;
                            break;
                        }
                    }
                }
            }
            if (canSmeltAny) break;
        }

        // 2. Если нечего плавить, сбрасываем прогресс
        if (!canSmeltAny) {
            if (state.cookProgress > 0) state.cookProgress = Math.max(0, state.cookProgress - 10);
            continue;
        }

        // 3. Если есть что плавить, но кончилось топливо — пытаемся подбросить
        if (state.fuelUnits <= 0) {
            for (let f = 0; f < 3; f++) {
                let fSt = state.fuels[f];
                if (fSt && !fSt.isEmpty()) {
                    let units = getFuelBurnUnits(fSt);
                    if (units > 0) {
                        state.fuelUnits += units;
                        if (fSt.id === 'minecraft:lava_bucket') {
                            state.fuels[f] = Item.of('minecraft:bucket');
                        } else {
                            fSt.shrink(1);
                            if (fSt.count <= 0) state.fuels[f] = null;
                        }
                        server.runCommandSilent(`execute in ${dim} run playsound minecraft:item.firecharge.use block @a[distance=..10] ${bx} ${by} ${bz} 0.6 1.2`);
                        break;
                    }
                }
            }
        }

        // 4. Если есть топливо — плавим!
        if (state.fuelUnits > 0) {
            // За 10 тиков прибавляем 12.5% (полный цикл 80 тиков = 4 секунды)
            state.cookProgress += 12.5;

            // Частицы пламени и дыма в мире
            if (server.tickCount % 20 === 0) {
                server.runCommandSilent(`execute in ${dim} run particle minecraft:flame ${bx + 0.5} ${by + 0.9} ${bz + 0.5} 0.2 0.1 0.2 0.02 4`);
                server.runCommandSilent(`execute in ${dim} run particle minecraft:smoke ${bx + 0.5} ${by + 1.2} ${bz + 0.5} 0.1 0.2 0.1 0.01 3`);
            }

            // Завершение цикла плавки
            if (state.cookProgress >= 100) {
                state.cookProgress = 0;
                let smeltedCount = 0;

                // Параллельная плавка всех 3 слотов сырья
                for (let i = 0; i < 3; i++) {
                    let inSt = state.inputs[i];
                    if (!inSt || inSt.isEmpty()) continue;

                    let res = getSmelteryResult(inSt);
                    if (!res) continue;

                    let placed = false;
                    for (let o = 0; o < 6; o++) {
                        let outSt = state.outputs[o];
                        if (outSt && outSt.id === res.id && outSt.count < outSt.maxStackSize) {
                            outSt.grow(1);
                            placed = true;
                            break;
                        }
                    }
                    if (!placed) {
                        for (let o = 0; o < 6; o++) {
                            if (!state.outputs[o] || state.outputs[o].isEmpty()) {
                                state.outputs[o] = res.copy();
                                placed = true;
                                break;
                            }
                        }
                    }

                    if (placed) {
                        inSt.shrink(1);
                        if (inSt.count <= 0) state.inputs[i] = null;
                        smeltedCount++;
                    }
                }

                if (smeltedCount > 0) {
                    state.fuelUnits = Math.max(0, state.fuelUnits - 1);
                    server.runCommandSilent(`execute in ${dim} run playsound minecraft:block.furnace.fire_crackle block @a[distance=..12] ${bx} ${by} ${bz} 0.8 1.1`);
                }
            }

            // Синхронизация в persistentData раз в 100 тиков (5 сек)
            if (server.tickCount % 100 === 0) {
                saveHearthState(server, key, state);
            }
        }
    }

    // Обновление GUI для всех смотрящих игроков
    openHearthViewers.forEach((vInfo, uuid) => {
        let player = server.getPlayerByUUID(uuid);
        if (player && vInfo && vInfo.gui) {
            let state = global.ElyriumHearthData[vInfo.blockKey];
            if (state) {
                renderHearthSlots(vInfo.gui, state, player);
            }
        }
    });
});

// ------------------------------------------------------------------------------
// RENDER SLOTS IN CHEST CONTAINER
// ------------------------------------------------------------------------------
function renderHearthSlots(gui, state, player) {
    // 1. Raw Input Slots (Cols 0, 1, 2; Row 0)
    for (let i = 0; i < 3; i++) {
        let slot = gui.getSlot(i, 0);
        let item = state.inputs[i];
        if (item && !item.isEmpty()) {
            slot.setItem(item.copy().withLore([
                Text.of('§8────────────────────────────────'),
                Text.of('§7Количество сырья: §f' + item.count + ' шт.'),
                Text.of('§e▶ ЛКМ: §fЗабрать весь стак в руку'),
                Text.of('§e▶ ПКМ: §fЗабрать половину стака'),
                Text.of('§a⚡ Автоматическая плавка в мире!')
            ]));
        } else {
            slot.setItem(Item.of('minecraft:air'));
        }
    }

    // 2. Fuel Slots (Cols 0, 1, 2; Row 2)
    for (let f = 0; f < 3; f++) {
        let slot = gui.getSlot(f, 2);
        let fuel = state.fuels[f];
        if (fuel && !fuel.isEmpty()) {
            slot.setItem(fuel.copy().withLore([
                Text.of('§8────────────────────────────────'),
                Text.of('§7Запас топлива: §f' + fuel.count + ' шт.'),
                Text.of('§e▶ ЛКМ: §fЗабрать всё топливо в руку'),
                Text.of('§e▶ ПКМ: §fЗабрать половину топлива'),
                Text.of('§6🔥 Автоматически сгорает по мере плавки')
            ]));
        } else {
            slot.setItem(Item.of('minecraft:air'));
        }
    }

    // 3. Central Flame & Bellows (Col 4, Row 1)
    let centerSlot = gui.getSlot(4, 1);
    let isBurning = state.fuelUnits > 0;
    let prog = state.cookProgress || 0;

    // Анимация иконки огня
    let fireIcon = 'minecraft:coal';
    if (isBurning) {
        if (prog < 33) fireIcon = 'minecraft:campfire';
        else if (prog < 66) fireIcon = 'minecraft:fire_charge';
        else fireIcon = 'minecraft:blaze_powder';
    }

    let flameItem = Item.of(fireIcon);
    if (isBurning) flameItem.enchant('minecraft:fire_aspect', 1);

    let lore = [
        Text.of(isBurning ? '§6🔥 [ КУЗНЕЧНЫЙ ГОРН: АКТИВЕН ]' : '§8[ ❄ Горн остыл. Загрузите топливо ]'),
        Text.of('§8────────────────────────────────'),
        Text.of(`§7Прогресс плавки: §f[${makeProgressBar(prog)}] §e${Math.floor(prog)}%`),
        Text.of(`§eЖар очага: §6${state.fuelUnits} ед. горения`),
        Text.of('§a⚡ Параллельная плавка всех 3 лотков сырья!'),
        Text.of('§8────────────────────────────────'),
        Text.of('§e▶ Нажмите ЛКМ: §fРаздуть мехи (+30% ускорение цикла)'),
        Text.of('§7Плавление продолжается автономно даже при закрытии!')
    ];
    centerSlot.setItem(flameItem.withCustomName(Text.of(isBurning ? '§c🔥 РАЗДУТЬ МЕХИ ОЧАГА 🔥' : '§8[ Очаг без топлива ]')).withLore(lore));

    // 4. Output Slots (Cols 6, 7, 8; Rows 0 and 1)
    for (let o = 0; o < 6; o++) {
        let col = 6 + (o % 3);
        let row = Math.floor(o / 3);
        let slot = gui.getSlot(col, row);
        let out = state.outputs[o];
        if (out && !out.isEmpty()) {
            slot.setItem(out.copy().withLore([
                Text.of('§8────────────────────────────────'),
                Text.of('§a★ ГОТОВЫЙ МЕТАЛЛ ★'),
                Text.of('§e▶ Нажмите ЛКМ: §fЗабрать слитки в инвентарь')
            ]));
        } else {
            slot.setItem(Item.of('minecraft:air'));
        }
    }
}

// ------------------------------------------------------------------------------
// OPEN HEARTH SMELTERY GUI
// ------------------------------------------------------------------------------
function openHearthSmelteryGUI(player, block) {
    if (!player || player.isFake()) return;

    let bx = block.x;
    let by = block.y;
    let bz = block.z;
    let level = player.level;
    let key = getHearthKey(level, bx, by, bz);
    let state = getHearthState(level, bx, by, bz);

    // \uF808 = -8px horizontal offset, \uE003 = custom overlay. No text collision!
    let title = '§f\uF808\uE003\uF80A';

    player.openChestGUI(Text.of(title), 3, gui => {
        gui.playerSlots = true;
        let uuid = player.uuid.toString();
        openHearthViewers.set(uuid, { blockKey: key, gui: gui });

        // On Closed: Return carried item to player, keep internal items in block!
        gui.closed = () => {
            try {
                let carried = player.containerMenu.getCarried();
                if (carried && !carried.isEmpty()) {
                    player.give(carried);
                    player.containerMenu.setCarried(Item.of('minecraft:air'));
                }
            } catch (e) {}

            openHearthViewers.delete(uuid);
            saveHearthState(player.server, key, state);
        };

        // ----------------------------------------------------------------------
        // 1. INPUT SLOTS CLICK HANDLERS (Cols 0, 1, 2; Row 0)
        // ----------------------------------------------------------------------
        for (let i = 0; i < 3; i++) {
            let slotIdx = i;
            gui.slot(slotIdx, 0, s => {
                s.leftClicked = () => {
                    let carried = player.containerMenu.getCarried();
                    let current = state.inputs[slotIdx];

                    if (carried && !carried.isEmpty()) {
                        if (isFoodItem(carried)) {
                            player.tell(Text.of('§c⛔ [Очаг] Кузнечный Очаг предназначен только для металлургии! Пища сгорит в пепел.'));
                            player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ~ ~ ~ 1.0 1.5`);
                            return;
                        }
                        if (!getSmelteryResult(carried)) {
                            player.tell(Text.of('§e[Очаг] Этот предмет не подходит для переплавки в кузнечном очаге.'));
                            return;
                        }

                        if (!current || current.isEmpty()) {
                            state.inputs[slotIdx] = carried.copy();
                            player.containerMenu.setCarried(Item.of('minecraft:air'));
                            player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                        } else if (current.id === carried.id) {
                            let space = current.maxStackSize - current.count;
                            let move = Math.min(space, carried.count);
                            current.grow(move);
                            carried.shrink(move);
                            if (carried.count <= 0) player.containerMenu.setCarried(Item.of('minecraft:air'));
                            player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                        } else {
                            let temp = current.copy();
                            state.inputs[slotIdx] = carried.copy();
                            player.containerMenu.setCarried(temp);
                            player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                        }
                        renderHearthSlots(gui, state, player);
                        saveHearthState(player.server, key, state);
                    } else if (current && !current.isEmpty()) {
                        // Pick up entire stack
                        player.containerMenu.setCarried(current.copy());
                        state.inputs[slotIdx] = null;
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                        renderHearthSlots(gui, state, player);
                        saveHearthState(player.server, key, state);
                    }
                };

                s.rightClicked = () => {
                    let carried = player.containerMenu.getCarried();
                    let current = state.inputs[slotIdx];

                    if (carried && !carried.isEmpty()) {
                        if (isFoodItem(carried) || !getSmelteryResult(carried)) return;
                        if (!current || current.isEmpty()) {
                            let one = carried.copy();
                            one.setCount(1);
                            carried.shrink(1);
                            state.inputs[slotIdx] = one;
                            if (carried.count <= 0) player.containerMenu.setCarried(Item.of('minecraft:air'));
                        } else if (current.id === carried.id && current.count < current.maxStackSize) {
                            current.grow(1);
                            carried.shrink(1);
                            if (carried.count <= 0) player.containerMenu.setCarried(Item.of('minecraft:air'));
                        }
                        renderHearthSlots(gui, state, player);
                        saveHearthState(player.server, key, state);
                    } else if (current && !current.isEmpty()) {
                        // Pick up half stack
                        let half = Math.ceil(current.count / 2);
                        let picked = current.copy();
                        picked.setCount(half);
                        current.shrink(half);
                        if (current.count <= 0) state.inputs[slotIdx] = null;
                        player.containerMenu.setCarried(picked);
                        renderHearthSlots(gui, state, player);
                        saveHearthState(player.server, key, state);
                    }
                };
            });
        }

        // ----------------------------------------------------------------------
        // 2. FUEL SLOTS CLICK HANDLERS (Cols 0, 1, 2; Row 2)
        // ----------------------------------------------------------------------
        for (let f = 0; f < 3; f++) {
            let fuelIdx = f;
            gui.slot(fuelIdx, 2, s => {
                s.leftClicked = () => {
                    let carried = player.containerMenu.getCarried();
                    let current = state.fuels[fuelIdx];

                    if (carried && !carried.isEmpty()) {
                        let burn = getFuelBurnUnits(carried);
                        if (burn <= 0) {
                            player.tell(Text.of('§e[Очаг] Этот предмет не является горючим топливом для горна!'));
                            return;
                        }

                        if (!current || current.isEmpty()) {
                            state.fuels[fuelIdx] = carried.copy();
                            player.containerMenu.setCarried(Item.of('minecraft:air'));
                            player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                        } else if (current.id === carried.id) {
                            let space = current.maxStackSize - current.count;
                            let move = Math.min(space, carried.count);
                            current.grow(move);
                            carried.shrink(move);
                            if (carried.count <= 0) player.containerMenu.setCarried(Item.of('minecraft:air'));
                            player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                        } else {
                            let temp = current.copy();
                            state.fuels[fuelIdx] = carried.copy();
                            player.containerMenu.setCarried(temp);
                            player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                        }
                        renderHearthSlots(gui, state, player);
                        saveHearthState(player.server, key, state);
                    } else if (current && !current.isEmpty()) {
                        player.containerMenu.setCarried(current.copy());
                        state.fuels[fuelIdx] = null;
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                        renderHearthSlots(gui, state, player);
                        saveHearthState(player.server, key, state);
                    }
                };

                s.rightClicked = () => {
                    let carried = player.containerMenu.getCarried();
                    let current = state.fuels[fuelIdx];

                    if (carried && !carried.isEmpty()) {
                        let burn = getFuelBurnUnits(carried);
                        if (burn <= 0) return;

                        if (!current || current.isEmpty()) {
                            let one = carried.copy();
                            one.setCount(1);
                            carried.shrink(1);
                            state.fuels[fuelIdx] = one;
                            if (carried.count <= 0) player.containerMenu.setCarried(Item.of('minecraft:air'));
                        } else if (current.id === carried.id && current.count < current.maxStackSize) {
                            current.grow(1);
                            carried.shrink(1);
                            if (carried.count <= 0) player.containerMenu.setCarried(Item.of('minecraft:air'));
                        }
                        renderHearthSlots(gui, state, player);
                        saveHearthState(player.server, key, state);
                    } else if (current && !current.isEmpty()) {
                        let half = Math.ceil(current.count / 2);
                        let picked = current.copy();
                        picked.setCount(half);
                        current.shrink(half);
                        if (current.count <= 0) state.fuels[fuelIdx] = null;
                        player.containerMenu.setCarried(picked);
                        renderHearthSlots(gui, state, player);
                        saveHearthState(player.server, key, state);
                    }
                };
            });
        }

        // ----------------------------------------------------------------------
        // 3. BELLOWS FLAME BOOST (Col 4, Row 1)
        // ----------------------------------------------------------------------
        gui.slot(4, 1, s => {
            s.leftClicked = () => {
                if (state.fuelUnits > 0) {
                    state.cookProgress = Math.min(100, state.cookProgress + 30);
                    player.server.runCommandSilent(`playsound minecraft:entity.blaze.shoot player ${player.username} ~ ~ ~ 0.8 1.4`);
                    player.server.runCommandSilent(`particle minecraft:flame ${bx + 0.5} ${by + 0.9} ${bz + 0.5} 0.3 0.1 0.3 0.05 10`);
                    renderHearthSlots(gui, state, player);
                    saveHearthState(player.server, key, state);
                } else {
                    player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ~ ~ ~ 0.6 1.0`);
                    player.tell(Text.of('§e[Очаг] Горн остыл! Загрузите топливо снизу, чтобы раздуть огонь.'));
                }
            };
        });

        // ----------------------------------------------------------------------
        // 4. OUTPUT TRAYS CLICK HANDLERS (Cols 6, 7, 8; Rows 0 and 1)
        // ----------------------------------------------------------------------
        for (let o = 0; o < 6; o++) {
            let outIdx = o;
            let col = 6 + (o % 3);
            let row = Math.floor(o / 3);
            gui.slot(col, row, s => {
                s.leftClicked = () => {
                    let out = state.outputs[outIdx];
                    if (!out || out.isEmpty()) return;

                    let carried = player.containerMenu.getCarried();
                    if (!carried || carried.isEmpty()) {
                        player.containerMenu.setCarried(out.copy());
                        state.outputs[outIdx] = null;
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.9 1.1`);
                    } else if (carried.id === out.id) {
                        let space = carried.maxStackSize - carried.count;
                        let move = Math.min(space, out.count);
                        carried.grow(move);
                        out.shrink(move);
                        if (out.count <= 0) state.outputs[outIdx] = null;
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.9 1.1`);
                    }
                    renderHearthSlots(gui, state, player);
                    saveHearthState(player.server, key, state);
                };

                s.rightClicked = () => {
                    let out = state.outputs[outIdx];
                    if (!out || out.isEmpty()) return;

                    let carried = player.containerMenu.getCarried();
                    if (!carried || carried.isEmpty()) {
                        let half = Math.ceil(out.count / 2);
                        let picked = out.copy();
                        picked.setCount(half);
                        out.shrink(half);
                        if (out.count <= 0) state.outputs[outIdx] = null;
                        player.containerMenu.setCarried(picked);
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.9 1.1`);
                    } else if (carried.id === out.id && carried.count < carried.maxStackSize) {
                        carried.grow(1);
                        out.shrink(1);
                        if (out.count <= 0) state.outputs[outIdx] = null;
                        player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.9 1.1`);
                    }
                    renderHearthSlots(gui, state, player);
                    saveHearthState(player.server, key, state);
                };
            });
        }

        // ----------------------------------------------------------------------
        // 5. INVENTORY ROUTING (Shift + Click & Direct Clicks)
        // ----------------------------------------------------------------------
        gui.inventoryClicked = (event) => {
            if (!event) return;
            let invItem = event.getItem();
            let carried = player.containerMenu.getCarried();
            let clickTypeStr = event.type ? String(event.type) : 'PICKUP';

            // QUICK MOVE (Shift + Click from player inventory into hearth)
            if (clickTypeStr === 'QUICK_MOVE') {
                if (!invItem || invItem.isEmpty()) return;

                if (isFoodItem(invItem)) {
                    player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ~ ~ ~ 1.0 1.5`);
                    player.tell(Text.of('§c⛔ [Очаг] Кузнечный Очаг предназначен только для металлургии!'));
                    return;
                }

                // Try Fuel
                let fuelUnits = getFuelBurnUnits(invItem);
                if (fuelUnits > 0) {
                    for (let f = 0; f < 3; f++) {
                        let curF = state.fuels[f];
                        if (curF && curF.id === invItem.id && curF.count < curF.maxStackSize) {
                            let space = curF.maxStackSize - curF.count;
                            let move = Math.min(space, invItem.count);
                            curF.grow(move);
                            invItem.shrink(move);
                            event.setItem(invItem.count <= 0 ? Item.of('minecraft:air') : invItem);
                            player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                            renderHearthSlots(gui, state, player);
                            saveHearthState(player.server, key, state);
                            return;
                        }
                    }
                    for (let f = 0; f < 3; f++) {
                        if (!state.fuels[f] || state.fuels[f].isEmpty()) {
                            state.fuels[f] = invItem.copy();
                            event.setItem(Item.of('minecraft:air'));
                            player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                            renderHearthSlots(gui, state, player);
                            saveHearthState(player.server, key, state);
                            return;
                        }
                    }
                }

                // Try Ore Input
                let smeltResult = getSmelteryResult(invItem);
                if (smeltResult) {
                    for (let i = 0; i < 3; i++) {
                        let curIn = state.inputs[i];
                        if (curIn && curIn.id === invItem.id && curIn.count < curIn.maxStackSize) {
                            let space = curIn.maxStackSize - curIn.count;
                            let move = Math.min(space, invItem.count);
                            curIn.grow(move);
                            invItem.shrink(move);
                            event.setItem(invItem.count <= 0 ? Item.of('minecraft:air') : invItem);
                            player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                            renderHearthSlots(gui, state, player);
                            saveHearthState(player.server, key, state);
                            return;
                        }
                    }
                    for (let i = 0; i < 3; i++) {
                        if (!state.inputs[i] || state.inputs[i].isEmpty()) {
                            state.inputs[i] = invItem.copy();
                            event.setItem(Item.of('minecraft:air'));
                            player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                            renderHearthSlots(gui, state, player);
                            saveHearthState(player.server, key, state);
                            return;
                        }
                    }
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

        // Начальная отрисовка слотов
        renderHearthSlots(gui, state, player);
    });
}

// ------------------------------------------------------------------------------
// BLOCK INTERACTION & BREAKING HANDLERS
// ------------------------------------------------------------------------------
BlockEvents.rightClicked('kubejs:blacksmith_hearth', event => {
    let player = event.player;
    if (!player || player.isFake()) return;
    if (event.hand != 'MAIN_HAND') return;

    openHearthSmelteryGUI(player, event.block);
});

// Выпадение предметов при разрушении блока
BlockEvents.broken('kubejs:blacksmith_hearth', event => {
    let block = event.block;
    let level = block.level;
    let key = getHearthKey(level, block.x, block.y, block.z);
    let state = global.ElyriumHearthData[key];

    if (state) {
        let toDrop = [];
        for (let i = 0; i < 3; i++) {
            if (state.inputs[i] && !state.inputs[i].isEmpty()) toDrop.push(state.inputs[i]);
            if (state.fuels[i] && !state.fuels[i].isEmpty()) toDrop.push(state.fuels[i]);
        }
        for (let o = 0; o < 6; o++) {
            if (state.outputs[o] && !state.outputs[o].isEmpty()) toDrop.push(state.outputs[o]);
        }

        toDrop.forEach(st => {
            block.popItem(st);
        });

        delete global.ElyriumHearthData[key];
        try {
            let pData = level.server.persistentData;
            let hearthCompound = pData.getCompound('elyrium_hearth_data');
            if (hearthCompound) {
                hearthCompound.remove(key);
                pData.put('elyrium_hearth_data', hearthCompound);
            }
        } catch (e) {}
    }
});
