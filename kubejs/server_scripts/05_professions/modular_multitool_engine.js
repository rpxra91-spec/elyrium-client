// ==============================================================================
// 🛠️ ELYRIUM RPG: MODULAR MULTITOOL ENGINE & MODULE SOCKET SYSTEM
// Minecraft 1.21.1 NeoForge | KubeJS Server Script (v1.1)
// ==============================================================================
// - Manages Chassis (MK-I 1 slot, MK-II 2 slots, MK-III 4 slots).
// - True 4-in-1 Omni Functionality:
//   * Pickaxe: all ores and stone.
//   * Axe: right-click strips logs.
//   * Shovel: sneak + right-click makes dirt paths.
//   * Hoe: right-click tills dirt/grass into farmland.
// - Area Mining (AOE):
//   * MK-II: 3x3 excavation on Sneak.
//   * MK-III: 3x3 standard excavation, 3x3x3 excavation on Sneak.
// - Sockets & extracts 7 specialized modules at Infernal Anvil or standard Anvil:
//   * Auto-Smelt: converts raw ores to ingots upon mining with flame FX.
//   * Silk Touch: extracts whole blocks cleanly without silk touch enchantment.
//   * Vacuum Magnet: pulls mined drops and XP directly to the player.
//   * Prospector Radar: scans 8-block radius for ores on Right-Click with audio sonar.
//   * Pneumatic Haste: provides constant Haste II while equipped.
//   * Astral Fortune: boosts yield of diamonds, emeralds, and crystal ores.
//   * Acoustic Silence: suppresses vibrations and pacifies nearby Wardens.
// ==============================================================================

const MULTITOOL_MODULE_DATA = {
    'smelting': {
        name: 'Инфернальный Горн',
        itemId: 'kubejs:multitool_module_smelting',
        color: '§c'
    },
    'silk': {
        name: 'Шелковый Резонанс',
        itemId: 'kubejs:multitool_module_silk',
        color: '§b'
    },
    'magnetic': {
        name: 'Магнитный Захват',
        itemId: 'kubejs:multitool_module_magnetic',
        color: '§e'
    },
    'prospector': {
        name: 'Геологическая Линза',
        itemId: 'kubejs:multitool_module_prospector',
        color: '§a'
    },
    'haste': {
        name: 'Пневматический Разгон',
        itemId: 'kubejs:multitool_module_haste',
        color: '§f'
    },
    'fortune': {
        name: 'Астральная Фортуна',
        itemId: 'kubejs:multitool_module_fortune',
        color: '§d'
    },
    'silence': {
        name: 'Акустическое Глушение',
        itemId: 'kubejs:multitool_module_silence',
        color: '§8'
    }
};

// Raw ore smelting conversion map
const AUTO_SMELT_TABLE = {
    'minecraft:iron_ore': { result: 'minecraft:iron_ingot', count: 1 },
    'minecraft:deepslate_iron_ore': { result: 'minecraft:iron_ingot', count: 1 },
    'minecraft:raw_iron_block': { result: 'minecraft:iron_block', count: 1 },
    'minecraft:copper_ore': { result: 'minecraft:copper_ingot', count: 3 },
    'minecraft:deepslate_copper_ore': { result: 'minecraft:copper_ingot', count: 3 },
    'minecraft:gold_ore': { result: 'minecraft:gold_ingot', count: 1 },
    'minecraft:deepslate_gold_ore': { result: 'minecraft:gold_ingot', count: 1 },
    'minecraft:nether_gold_ore': { result: 'minecraft:gold_nugget', count: 6 },
    'minecraft:ancient_debris': { result: 'minecraft:netherite_scrap', count: 1 },
    'minecraft:sand': { result: 'minecraft:glass', count: 1 },
    'minecraft:red_sand': { result: 'minecraft:glass', count: 1 },
    'minecraft:cobblestone': { result: 'minecraft:stone', count: 1 },
    'minecraft:cobbled_deepslate': { result: 'minecraft:deepslate', count: 1 },
    'minecraft:clay': { result: 'minecraft:terracotta', count: 1 }
};

// Fortune gem bonus ores
const FORTUNE_ORE_TABLE = {
    'minecraft:diamond_ore': 'minecraft:diamond',
    'minecraft:deepslate_diamond_ore': 'minecraft:diamond',
    'minecraft:emerald_ore': 'minecraft:emerald',
    'minecraft:deepslate_emerald_ore': 'minecraft:emerald',
    'minecraft:lapis_ore': 'minecraft:lapis_lazuli',
    'minecraft:deepslate_lapis_ore': 'minecraft:lapis_lazuli',
    'minecraft:redstone_ore': 'minecraft:redstone',
    'minecraft:deepslate_redstone_ore': 'minecraft:redstone',
    'minecraft:nether_quartz_ore': 'minecraft:quartz',
    'minecraft:coal_ore': 'minecraft:coal',
    'minecraft:deepslate_coal_ore': 'minecraft:coal'
};

// Helper: Get installed module keys safely across 1.21.1 components & NBT
function getMultitoolModules(item) {
    if (!item) return [];
    try {
        if (item.customData && item.customData.contains('multitool_modules')) {
            let str = String(item.customData.getString('multitool_modules')).trim();
            if (str) return str.split(',').filter(m => m.length > 0);
        }
        if (item.nbt && item.nbt.contains('multitool_modules')) {
            let str = String(item.nbt.getString('multitool_modules')).trim();
            if (str) return str.split(',').filter(m => m.length > 0);
        }
    } catch (e) {}
    return [];
}

// Helper: Save installed module keys safely
function setMultitoolModules(item, modules) {
    if (!item) return;
    let str = modules.join(',');
    try {
        if (item.customData && typeof item.customData.putString === 'function') {
            item.customData.putString('multitool_modules', str);
            return;
        }
    } catch (e1) {}
    try {
        if (item.nbt && typeof item.nbt.putString === 'function') {
            item.nbt.putString('multitool_modules', str);
            return;
        }
    } catch (e2) {}
    try {
        let CompoundTag = Java.loadClass('net.minecraft.nbt.CompoundTag');
        let CustomData = Java.loadClass('net.minecraft.world.item.component.CustomData');
        let DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents');
        let tag = null;
        try {
            let cd = item.get(DataComponents.CUSTOM_DATA);
            if (cd) tag = cd.copyTag();
        } catch (e3) {}
        if (!tag) tag = new CompoundTag();
        tag.putString('multitool_modules', str);
        item.set(DataComponents.CUSTOM_DATA, CustomData.of(tag));
    } catch (err) {
        console.error('[Multitool] Error setting modules tag: ' + err);
    }
}

// Helper: Maximum slots by chassis rank
function getMaxChassisSlots(itemId) {
    let id = String(itemId);
    if (id.includes('mk3')) return 4;
    if (id.includes('mk2')) return 2;
    return 1; // MK-I
}

// ------------------------------------------------------------------------------
// 1. SOCKETING & REMOVAL AT ANVILS + TOOL RIGHT-CLICK ACTIONS
// ------------------------------------------------------------------------------
BlockEvents.rightClicked(event => {
    let block = event.block;
    let bId = String(block.id);
    let player = event.player;
    if (!player) return;

    let mainItem = player.mainHandItem;
    if (!mainItem || !mainItem.id.includes('modular_omni_chassis')) return;

    // === CASE 1: SOCKETING / REMOVING ON ANVIL ===
    if (bId.includes('anvil')) {
        let offItem = player.offHandItem;
        let installed = getMultitoolModules(mainItem);
        let maxSlots = getMaxChassisSlots(mainItem.id);

        // Case A: Socketing a Module from Offhand
        if (offItem && offItem.id.startsWith('kubejs:multitool_module_')) {
            event.cancel();
            let moduleKey = offItem.id.replace('kubejs:multitool_module_', '');
            let meta = MULTITOOL_MODULE_DATA[moduleKey];
            if (!meta) return;

            if (installed.length >= maxSlots) {
                player.tell(Text.of(`§c[Мультитул] Все слоты шасси заняты! (${installed.length}/${maxSlots}).`));
                player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.8 0.6`);
                return;
            }

            if (installed.indexOf(moduleKey) !== -1) {
                player.tell(Text.of(`§c[Мультитул] Модуль «${meta.name}» уже установлен в это шасси!`));
                player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.8 0.6`);
                return;
            }

            // Install module
            installed.push(moduleKey);
            setMultitoolModules(mainItem, installed);
            offItem.count--;

            // Visual and Sound effects
            player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 1.0 1.2`);
            player.server.runCommandSilent(`particle minecraft:wax_off ${block.x + 0.5} ${block.y + 1.0} ${block.z + 0.5} 0.5 0.5 0.5 0.1 20`);
            player.server.runCommandSilent(`particle minecraft:flame ${block.x + 0.5} ${block.y + 0.8} ${block.z + 0.5} 0.3 0.3 0.3 0.05 15`);

            player.tell(Text.of(`§6🔨 [Мультитул] Модуль ${meta.color}«${meta.name}»§6 успешно установлен в шасси! (Слоты: §a${installed.length}/${maxSlots}§6)`));
            return;
        }

        // Case B: Removing last installed module (Sneak + Right-Click with empty offhand)
        if (player.isShiftKeyDown() && (!offItem || offItem.isEmpty() || offItem.id === 'minecraft:air')) {
            if (installed.length === 0) return;

            event.cancel();
            let removedKey = installed.pop();
            setMultitoolModules(mainItem, installed);

            let meta = MULTITOOL_MODULE_DATA[removedKey];
            let returnItem = meta ? meta.itemId : ('kubejs:multitool_module_' + removedKey);
            player.give(Item.of(returnItem, 1));

            player.server.runCommandSilent(`playsound minecraft:block.grindstone.use player ${player.username} ~ ~ ~ 0.9 1.1`);
            player.tell(Text.of(`§e🔨 [Мультитул] Модуль «${meta ? meta.name : removedKey}» извлечен из шасси. (Осталось модулей: ${installed.length}/${maxSlots})`));
            return;
        }
    }

    // === CASE 2: AUTHENTIC MULTI-TOOL RIGHT CLICK ACTIONS ===
    // 1. Hoe Action: Till Dirt / Grass into Farmland (Normal Right-Click)
    if ((bId === 'minecraft:dirt' || bId === 'minecraft:grass_block' || bId === 'minecraft:dirt_path') && !player.isShiftKeyDown()) {
        let above = event.level.getBlock(block.x, block.y + 1, block.z);
        if (above && above.id === 'minecraft:air') {
            event.cancel();
            block.set('minecraft:farmland');
            player.server.runCommandSilent(`playsound minecraft:item.hoe.till player ${player.username} ~ ~ ~ 0.8 1.0`);
            player.swing();
            return;
        }
    }

    // 2. Shovel Action: Flatten Grass into Dirt Path (Sneak + Right-Click)
    if (bId === 'minecraft:grass_block' && player.isShiftKeyDown()) {
        let above = event.level.getBlock(block.x, block.y + 1, block.z);
        if (above && above.id === 'minecraft:air') {
            event.cancel();
            block.set('minecraft:dirt_path');
            player.server.runCommandSilent(`playsound minecraft:item.shovel.flatten player ${player.username} ~ ~ ~ 0.8 1.0`);
            player.swing();
            return;
        }
    }

    // 3. Axe Action: Strip Logs and Wood
    if (bId.includes('_log') || bId.includes('_wood')) {
        if (!bId.includes('stripped_')) {
            let strippedId = bId.replace('minecraft:', 'minecraft:stripped_');
            if (Item.exists(strippedId)) {
                event.cancel();
                block.set(strippedId);
                player.server.runCommandSilent(`playsound minecraft:item.axe.strip player ${player.username} ~ ~ ~ 0.8 1.0`);
                player.swing();
                return;
            }
        }
    }
});

// ------------------------------------------------------------------------------
// 2. MINING ACTIONS & MODULE MECHANICS (BlockEvents.broken)
// ------------------------------------------------------------------------------
BlockEvents.broken(event => {
    let player = event.player;
    if (!player) return;

    let tool = player.mainHandItem;
    if (!tool || !tool.id.includes('modular_omni_chassis')) return;

    let modules = getMultitoolModules(tool);
    let block = event.block;
    let bId = String(block.id);
    let level = event.level;
    let bx = block.x + 0.5;
    let by = block.y + 0.5;
    let bz = block.z + 0.5;

    // 2.1 SILK TOUCH MODULE
    if (modules.indexOf('silk') !== -1) {
        event.cancel();
        block.set('minecraft:air');
        let silkDrop = Item.of(bId, 1);
        if (modules.indexOf('magnetic') !== -1) {
            player.give(silkDrop);
        } else {
            block.popItem(silkDrop);
        }
        return;
    }

    // 2.2 AUTO-SMELTING MODULE
    if (modules.indexOf('smelting') !== -1 && AUTO_SMELT_TABLE[bId]) {
        event.cancel();
        block.set('minecraft:air');
        let smelt = AUTO_SMELT_TABLE[bId];
        let drop = Item.of(smelt.result, smelt.count);

        if (modules.indexOf('magnetic') !== -1) {
            player.give(drop);
        } else {
            block.popItem(drop);
        }

        // Fire particle and audio sizzle
        player.server.runCommandSilent(`particle minecraft:flame ${bx} ${by} ${bz} 0.3 0.3 0.3 0.05 10`);
        player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ${bx} ${by} ${bz} 0.4 1.6`);
        return;
    }

    // 2.3 ASTRAL FORTUNE MODULE
    if (modules.indexOf('fortune') !== -1 && FORTUNE_ORE_TABLE[bId]) {
        let bonusGem = FORTUNE_ORE_TABLE[bId];
        let bonusCount = 1 + Math.floor(Math.random() * 2); // +1 to +2 extra
        let bonusDrop = Item.of(bonusGem, bonusCount);

        if (modules.indexOf('magnetic') !== -1) {
            player.give(bonusDrop);
        } else {
            block.popItem(bonusDrop);
        }
        player.server.runCommandSilent(`particle minecraft:enchant ${bx} ${by} ${bz} 0.4 0.4 0.4 0.1 15`);
    }

    // 2.4 ACOUSTIC SILENCE MODULE
    if (modules.indexOf('silence') !== -1) {
        // Reset nearby Warden anger and suppress vibration
        player.server.runCommandSilent(`execute as @e[type=minecraft:warden,distance=..32] run data modify entity @s anger.suspects[0].anger set value 0`);
        player.server.runCommandSilent(`particle minecraft:sculk_soul ${bx} ${by} ${bz} 0.3 0.3 0.3 0.02 8`);
    }

    // 2.5 VACUUM MAGNET MODULE
    if (modules.indexOf('magnetic') !== -1) {
        // Collect nearby XP orbs directly
        let server = player.server;
        if (server) {
            server.runCommandSilent(`tp @e[type=minecraft:experience_orb,distance=..6] ${player.username}`);
        }
    }

    // 2.6 AREA MINING (AOE): MK-II (3x3 on Sneak) and MK-III (3x3 default, 3x3x3 on Sneak)
    let isMk2 = tool.id.includes('mk2');
    let isMk3 = tool.id.includes('mk3');

    let shouldAoe = false;
    let is3D = false;

    if (isMk3) {
        shouldAoe = true;
        is3D = player.isShiftKeyDown();
    } else if (isMk2 && player.isShiftKeyDown()) {
        shouldAoe = true;
        is3D = false;
    }

    if (shouldAoe && !player.persistentData.getBoolean('elyrium_multitool_aoe')) {
        player.persistentData.putBoolean('elyrium_multitool_aoe', true);
        try {
            let px = block.x;
            let py = block.y;
            let pz = block.z;

            let pitch = player.pitch;
            let yRange = [-1, 0, 1];
            let xRange = [-1, 0, 1];
            let zRange = [-1, 0, 1];

            if (!is3D) {
                if (pitch > 45 || pitch < -45) {
                    // Looking up or down -> horizontal slice
                    yRange = [0];
                } else {
                    let yaw = (player.yaw % 360 + 360) % 360;
                    if ((yaw >= 45 && yaw < 135) || (yaw >= 225 && yaw < 315)) {
                        // Looking East or West -> Y and Z plane
                        xRange = [0];
                    } else {
                        // Looking North or South -> X and Y plane
                        zRange = [0];
                    }
                }
            }

            for (let ox of xRange) {
                for (let oy of yRange) {
                    for (let oz of zRange) {
                        if (ox === 0 && oy === 0 && oz === 0) continue;
                        let targetBlock = level.getBlock(px + ox, py + oy, pz + oz);
                        if (!targetBlock || targetBlock.id === 'minecraft:air' || targetBlock.id === 'minecraft:bedrock') continue;
                        let state = targetBlock.blockState;
                        let hardness = state ? state.getDestroySpeed(level, targetBlock.pos) : 1.0;
                        if (hardness < 0 || hardness > 50) continue; // Skip bedrock and indestructible

                        try {
                            player.gameMode.destroyBlock(targetBlock.pos);
                        } catch (e1) {
                            targetBlock.set('minecraft:air');
                        }
                    }
                }
            }
        } catch (aoeErr) {
            console.error('[Multitool AOE Error] ' + aoeErr);
        } finally {
            player.persistentData.putBoolean('elyrium_multitool_aoe', false);
        }
    }
});

// ------------------------------------------------------------------------------
// 3. PASSIVE BUFFS: PNEUMATIC HASTE (PlayerEvents.tick)
// ------------------------------------------------------------------------------
PlayerEvents.tick(event => {
    let player = event.player;
    if (!player) return;
    let tick = (typeof player.tickCount === 'number') ? player.tickCount : (player.age || 0);
    if (tick % 20 !== 0) return;

    let mainItem = player.mainHandItem;
    if (!mainItem || !mainItem.id.includes('modular_omni_chassis')) return;

    let modules = getMultitoolModules(mainItem);
    if (modules.indexOf('haste') !== -1) {
        player.potionEffects.add('minecraft:haste', 40, 1, false, false);
    }
});

// ------------------------------------------------------------------------------
// 4. ACTIVE SCANNER: PROSPECTOR RADAR (ItemEvents.rightClicked)
// ------------------------------------------------------------------------------
ItemEvents.rightClicked(event => {
    let item = event.item;
    if (!item || !item.id.includes('modular_omni_chassis')) return;

    let modules = getMultitoolModules(item);
    if (modules.indexOf('prospector') === -1) return;

    let player = event.player;
    if (!player) return;

    // 3-second scanner cooldown
    player.addItemCooldown(item.id, 60);

    let level = player.level;
    let px = Math.floor(player.x);
    let py = Math.floor(player.y);
    let pz = Math.floor(player.z);
    let radius = 8;

    let foundOres = {};
    let totalOres = 0;

    for (let dx = -radius; dx <= radius; dx += 2) {
        for (let dy = -radius; dy <= radius; dy += 2) {
            for (let dz = -radius; dz <= radius; dz += 2) {
                let block = level.getBlock(px + dx, py + dy, pz + dz);
                if (!block) continue;
                let id = String(block.id);
                if (id.includes('_ore') || id.includes('ancient_debris')) {
                    let cleanName = id.replace('minecraft:', '').replace('deepslate_', '').replace('_ore', '');
                    cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
                    foundOres[cleanName] = (foundOres[cleanName] || 0) + 1;
                    totalOres++;
                }
            }
        }
    }

    if (totalOres > 0) {
        let oreReport = [];
        for (let name in foundOres) {
            oreReport.push(`§e${name}§7: §a${foundOres[name]}`);
        }
        player.server.runCommandSilent(`playsound minecraft:block.sculk_sensor.clicking player ${player.username} ~ ~ ~ 1.0 1.5`);
        player.server.runCommandSilent(`playsound minecraft:block.amethyst_block.resonate player ${player.username} ~ ~ ~ 0.8 1.2`);
        player.sendSystemMessage(Text.of(`§a🔍 [Геолог] В радиусе 8 блоков найдено жил (${totalOres}): ${oreReport.join('§7, ')}`), true);
        player.server.runCommandSilent(`particle minecraft:glow ${player.x} ${player.y + 1} ${player.z} 0.5 0.5 0.5 0.05 25`);
    } else {
        player.server.runCommandSilent(`playsound minecraft:block.note_block.bass player ${player.username} ~ ~ ~ 0.6 0.8`);
        player.sendSystemMessage(Text.of('§7🔍 [Геолог] Ценных рудных жил в радиусе 8 блоков не обнаружено.'), true);
    }
});
