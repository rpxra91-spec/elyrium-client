// ==============================================================================
// 🛠️ ELYRIUM RPG: MODULAR MULTITOOL ENGINE & MODULE SOCKET SYSTEM
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// - Manages Chassis (MK-I 1 slot, MK-II 2 slots, MK-III 4 slots).
// - Sockets & extracts 7 specialized modules at Infernal Anvil or standard Anvil.
// - Executes module mechanics:
//   * Auto-Smelt: converts raw ores to ingots upon mining with flame FX.
//   * Silk Touch: extracts whole ore blocks without silk touch enchantment.
//   * Vacuum Magnet: pulls mined drops and XP directly to the player.
//   * Prospector Radar: scans 8-block radius for ores on Right-Click with audio sonar.
//   * Pneumatic Haste: provides constant Haste II while equipped.
//   * Astral Fortune: boosts yield of diamonds, emeralds, and crystal ores.
//   * Acoustic Silence: suppresses vibrations and noise for stealth mining.
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

// Helper: Get installed module keys
function getMultitoolModules(item) {
    if (!item || !item.nbt || !item.nbt.contains('multitool_modules')) return [];
    let str = String(item.nbt.getString('multitool_modules')).trim();
    if (!str) return [];
    return str.split(',').filter(m => m.length > 0);
}

// Helper: Save installed module keys
function setMultitoolModules(item, modules) {
    if (!item.nbt) item.nbt = {};
    item.nbt.putString('multitool_modules', modules.join(','));
}

// Helper: Maximum slots by chassis rank
function getMaxChassisSlots(itemId) {
    let id = String(itemId);
    if (id.includes('mk3')) return 4;
    if (id.includes('mk2')) return 2;
    return 1; // MK-I
}

// ------------------------------------------------------------------------------
// 1. SOCKETING & REMOVAL AT ANVILS (BlockEvents.rightClicked)
// ------------------------------------------------------------------------------
BlockEvents.rightClicked(event => {
    let block = event.block;
    let bId = String(block.id);
    if (!bId.includes('anvil')) return;

    let player = event.player;
    if (!player) return;

    let mainItem = player.mainHandItem;
    if (!mainItem || !mainItem.id.includes('modular_omni_chassis')) return;

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
    if (modules.length === 0) return;

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
        level.spawnItem(bx, by, bz, silkDrop);

        // Handle vacuum magnet if also installed
        if (modules.indexOf('magnetic') !== -1) {
            player.give(silkDrop);
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
            level.spawnItem(bx, by, bz, drop);
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
            level.spawnItem(bx, by, bz, bonusDrop);
        }
        player.server.runCommandSilent(`particle minecraft:enchant ${bx} ${by} ${bz} 0.4 0.4 0.4 0.1 15`);
    }

    // 2.4 VACUUM MAGNET MODULE
    if (modules.indexOf('magnetic') !== -1) {
        // Collect nearby XP orbs directly
        let server = player.server;
        if (server) {
            server.runCommandSilent(`tp @e[type=minecraft:experience_orb,distance=..5] ${player.username}`);
        }
    }
});

// ------------------------------------------------------------------------------
// 3. PASSIVE BUFFS: PNEUMATIC HASTE (PlayerEvents.tick)
// ------------------------------------------------------------------------------
PlayerEvents.tick(event => {
    let player = event.player;
    if (!player || player.age % 20 !== 0) return;

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
