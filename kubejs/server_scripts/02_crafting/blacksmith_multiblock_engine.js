// ==============================================================================
// ⚒️ ELYRIUM RPG: MODULAR BLACKSMITH MULTIBLOCK ENGINE
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// Manages the 3-level modular blacksmith workshop consisting of up to 4 blocks:
//   1 = kubejs:blacksmith_workbench (Верстак Оружейника, Т1)
//   2 = kubejs:blacksmith_hearth    (Кузнечный Очаг / Меха, Т1)
//   3 = kubejs:infernal_crucible    (Адский Горн, Т3 Nether)
//   4 = kubejs:void_anvil           (Пустотная Наковальня, Т5 The End)
//
// Rules & Architecture:
// - Standalone blocks incur penalties:
//   • Workbench alone: +1 ingot penalty to crafts.
//   • Hearth alone: repairs 25% durability instead of 50%.
// - Connected blocks form unified stations:
//   • Canonical sequence is ALWAYS: [ 3 - 1 - 2 - 4 ].
//   • Spatial Auto-Sorting: When blocks are placed in a row in any order (e.g. 2-1 or 4-2-1-3),
//     upon placement they physically and visually re-align into the canonical order.
//   • Exact drop on break: breaking pos 0 drops Crucible (3), pos 1 drops Workbench (1),
//     pos 2 drops Hearth (2), pos 3 drops Anvil (4). Breaking one block gracefully reverts
//     the remaining blocks to their corresponding station.
//   • 4x1 Grand Forge (3-1-2-4) triggers portal-like awakening effects.
// ==============================================================================

const BS_BLOCK_IDS = [
    'kubejs:infernal_crucible',    // Rank 0 (Module 3)
    'kubejs:blacksmith_workbench', // Rank 1 (Module 1)
    'kubejs:blacksmith_hearth',    // Rank 2 (Module 2)
    'kubejs:void_anvil'            // Rank 3 (Module 4)
];

const BS_CANONICAL_RANK = {
    'kubejs:infernal_crucible': 0,
    'kubejs:blacksmith_workbench': 1,
    'kubejs:blacksmith_hearth': 2,
    'kubejs:void_anvil': 3
};

const BS_DISPLAY_NAMES = {
    'kubejs:infernal_crucible': '§4🌋 Адский Горн (Т3)',
    'kubejs:blacksmith_workbench': '§6⚒ Верстак Оружейника (Т1)',
    'kubejs:blacksmith_hearth': '§c🔥 Кузнечный Очаг (Т1)',
    'kubejs:void_anvil': '§5🌌 Пустотная Наковальня (Т5)'
};

// Reentrancy guard to prevent recursive block updates
let bsIsAligning = false;

// ------------------------------------------------------------------------------
// SCAN CONTIGUOUS LINE OF BLACKSMITH BLOCKS (ALONG X OR Z)
// ------------------------------------------------------------------------------
function findBlacksmithLine(level, startPos) {
    if (!level || !startPos) return [];
    let startBlock = level.getBlock(startPos);
    if (!startBlock || !BS_BLOCK_IDS.includes(String(startBlock.id))) return [];

    let sy = startPos.y;

    // 1. Scan along X-axis
    let xMin = startPos.x;
    while (true) {
        let b = level.getBlock(xMin - 1, sy, startPos.z);
        if (b && BS_BLOCK_IDS.includes(String(b.id))) {
            xMin--;
        } else {
            break;
        }
    }
    let xMax = startPos.x;
    while (true) {
        let b = level.getBlock(xMax + 1, sy, startPos.z);
        if (b && BS_BLOCK_IDS.includes(String(b.id))) {
            xMax++;
        } else {
            break;
        }
    }
    let xLine = [];
    for (let x = xMin; x <= xMax; x++) {
        xLine.push(new BlockPos(x, sy, startPos.z));
    }

    // 2. Scan along Z-axis
    let zMin = startPos.z;
    while (true) {
        let b = level.getBlock(startPos.x, sy, zMin - 1);
        if (b && BS_BLOCK_IDS.includes(String(b.id))) {
            zMin--;
        } else {
            break;
        }
    }
    let zMax = startPos.z;
    while (true) {
        let b = level.getBlock(startPos.x, sy, zMax + 1);
        if (b && BS_BLOCK_IDS.includes(String(b.id))) {
            zMax++;
        } else {
            break;
        }
    }
    let zLine = [];
    for (let z = zMin; z <= zMax; z++) {
        zLine.push(new BlockPos(startPos.x, sy, z));
    }

    // Choose the dominant line
    if (xLine.length >= zLine.length && xLine.length > 1) {
        return xLine;
    } else if (zLine.length > 1) {
        return zLine;
    }
    return [startPos];
}

// ------------------------------------------------------------------------------
// GET STATION INFO HELPER (EXPORTED GLOBALLY)
// ------------------------------------------------------------------------------
function getBlacksmithStationInfo(level, pos) {
    let line = findBlacksmithLine(level, pos);
    let count = line.length;

    let hasWorkbench = false;
    let hasHearth = false;
    let hasCrucible = false;
    let hasAnvil = false;

    let workbenchPos = null;
    let hearthPos = null;
    let cruciblePos = null;
    let anvilPos = null;

    line.forEach(p => {
        let b = level.getBlock(p);
        if (!b) return;
        let id = String(b.id);
        if (id === 'kubejs:blacksmith_workbench') { hasWorkbench = true; workbenchPos = p; }
        if (id === 'kubejs:blacksmith_hearth')    { hasHearth = true; hearthPos = p; }
        if (id === 'kubejs:infernal_crucible')    { hasCrucible = true; cruciblePos = p; }
        if (id === 'kubejs:void_anvil')           { hasAnvil = true; anvilPos = p; }
    });

    let isGrandForge = (count === 4 && hasWorkbench && hasHearth && hasCrucible && hasAnvil);
    let isConnected = (count >= 2);

    return {
        isStation: isConnected,
        count: count,
        line: line,
        hasWorkbench: hasWorkbench,
        hasHearth: hasHearth,
        hasCrucible: hasCrucible,
        hasAnvil: hasAnvil,
        isGrandForge: isGrandForge,
        workbenchPos: workbenchPos,
        hearthPos: hearthPos,
        cruciblePos: cruciblePos,
        anvilPos: anvilPos
    };
}

// ------------------------------------------------------------------------------
// SPATIAL AUTO-ALIGNMENT ON PLACEMENT
// ------------------------------------------------------------------------------
BlockEvents.placed(event => {
    let block = event.block;
    let level = event.level;
    if (!level || level.isClientSide() || bsIsAligning) return;

    let placedId = String(block.id);
    if (!BS_BLOCK_IDS.includes(placedId)) return;

    let line = findBlacksmithLine(level, block.pos);
    if (line.length < 2) return; // Standalone block, no sorting needed

    // We only form stations up to 4 blocks
    if (line.length > 4) {
        if (event.player) {
            event.player.sendSystemMessage(Text.of('§c⚠ [Кузнечный Комплекс] §7Максимальная длина кузнечной станции — 4 блока!'));
        }
        return;
    }

    let currentIds = line.map(p => String(level.getBlock(p).id));

    // Desired canonical sorting based on canonical rank [3 -> 1 -> 2 -> 4]
    let sortedIds = [...currentIds].sort((a, b) => {
        let rA = (BS_CANONICAL_RANK[a] !== undefined) ? BS_CANONICAL_RANK[a] : 99;
        let rB = (BS_CANONICAL_RANK[b] !== undefined) ? BS_CANONICAL_RANK[b] : 99;
        return rA - rB;
    });

    // Check if re-alignment is needed
    let needsRearrange = false;
    for (let i = 0; i < line.length; i++) {
        if (currentIds[i] !== sortedIds[i]) {
            needsRearrange = true;
            break;
        }
    }

    // Determine facing direction from the placed block
    let facing = 'north';
    try {
        if (block.properties && block.properties.facing) {
            facing = String(block.properties.facing);
        }
    } catch (e) {}

    let isGrand = (line.length === 4 &&
        sortedIds.includes('kubejs:infernal_crucible') &&
        sortedIds.includes('kubejs:blacksmith_workbench') &&
        sortedIds.includes('kubejs:blacksmith_hearth') &&
        sortedIds.includes('kubejs:void_anvil'));

    if (needsRearrange) {
        bsIsAligning = true;
        try {
            for (let i = 0; i < line.length; i++) {
                let p = line[i];
                let targetId = sortedIds[i];
                let cur = level.getBlock(p);
                if (String(cur.id) !== targetId) {
                    cur.set(targetId, { facing: facing });
                }
            }
        } finally {
            bsIsAligning = false;
        }

        // Particle & sound feedback for auto-alignment
        let centerPos = line[Math.floor(line.length / 2)];
        let cx = centerPos.x + 0.5;
        let cy = centerPos.y + 0.5;
        let cz = centerPos.z + 0.5;

        level.server.runCommandSilent(`playsound minecraft:block.anvil.use block @a ${cx} ${cy} ${cz} 0.8 1.2`);
        level.server.runCommandSilent(`playsound minecraft:block.blastfurnace.fire_crackle block @a ${cx} ${cy} ${cz} 0.9 1.0`);
        level.server.runCommandSilent(`particle minecraft:flame ${cx} ${cy + 0.5} ${cz} 0.6 0.2 0.6 0.04 25`);
        level.server.runCommandSilent(`particle minecraft:crit ${cx} ${cy + 0.5} ${cz} 0.5 0.3 0.5 0.1 20`);

        if (event.player) {
            event.player.sendSystemMessage(Text.of('§6⚒ [Кузнечный Комплекс] §aМодули пространственно упорядочены в канонический строй!'));
        }
    }

    // GRAND FORGE (4x1: [3 - 1 - 2 - 4]) AWAKENING
    if (isGrand) {
        let centerPos = line[1]; // Position of workbench
        let cx = centerPos.x + 0.5;
        let cy = centerPos.y + 1.0;
        let cz = centerPos.z + 0.5;

        level.server.runCommandSilent(`playsound minecraft:block.end_portal.spawn block @a ${cx} ${cy} ${cz} 1.0 1.0`);
        level.server.runCommandSilent(`playsound minecraft:block.beacon.activate block @a ${cx} ${cy} ${cz} 1.0 1.2`);
        level.server.runCommandSilent(`playsound minecraft:block.portal.trigger block @a ${cx} ${cy} ${cz} 0.8 1.5`);

        level.server.runCommandSilent(`particle minecraft:portal ${cx} ${cy} ${cz} 1.5 0.5 1.5 0.5 60`);
        level.server.runCommandSilent(`particle minecraft:enchant ${cx} ${cy + 0.5} ${cz} 1.2 0.6 1.2 0.8 45`);
        level.server.runCommandSilent(`particle minecraft:soul_fire_flame ${cx} ${cy} ${cz} 1.0 0.2 1.0 0.05 30`);
        level.server.runCommandSilent(`particle minecraft:end_rod ${cx} ${cy + 0.8} ${cz} 0.6 0.6 0.6 0.05 20`);

        if (event.player) {
            event.player.sendSystemMessage(Text.of('§6👑 [ВЕЛИКАЯ КУЗНИЦА ЭЛИРИУМА] §dПустотно-Инфернальный Горн пробужден! (Канонический строй: [3-1-2-4])'));
            event.player.sendSystemMessage(Text.of('§a✓ Максимальная эффективность: 0 штрафов, 50% ремонт, ковка всех клинков и алтарь заточки!'));
        }
    } else if (!needsRearrange && event.player && line.length >= 2) {
        // Normal pair or trio placed already in order
        let cx = block.x + 0.5;
        let cy = block.y + 0.5;
        let cz = block.z + 0.5;
        level.server.runCommandSilent(`playsound minecraft:block.anvil.use block @a ${cx} ${cy} ${cz} 0.7 1.1`);
        level.server.runCommandSilent(`particle minecraft:flame ${cx} ${cy + 0.5} ${cz} 0.4 0.2 0.4 0.03 15`);
        event.player.sendSystemMessage(Text.of(`§6⚒ [Кузнечный Комплекс] §aМодуль подключен к станции (${line.length} блока).`));
    }
});

// ------------------------------------------------------------------------------
// EXACT DROP ON BREAK & GRACEFUL REVERSION
// ------------------------------------------------------------------------------
BlockEvents.broken(event => {
    let block = event.block;
    let level = event.level;
    if (!level || level.isClientSide()) return;

    let brokenId = String(block.id);
    if (!BS_BLOCK_IDS.includes(brokenId)) return;

    // Check remaining neighbor stations along X and Z
    let bx = block.x;
    let by = block.y;
    let bz = block.z;

    let neighbors = [
        new BlockPos(bx - 1, by, bz),
        new BlockPos(bx + 1, by, bz),
        new BlockPos(bx, by, bz - 1),
        new BlockPos(bx, by, bz + 1)
    ];

    let hadStationNeighbor = false;
    neighbors.forEach(np => {
        let nb = level.getBlock(np);
        if (nb && BS_BLOCK_IDS.includes(String(nb.id))) {
            hadStationNeighbor = true;
        }
    });

    if (hadStationNeighbor) {
        level.server.runCommandSilent(`playsound minecraft:block.fire.extinguish block @a ${bx + 0.5} ${by + 0.5} ${bz + 0.5} 0.7 1.2`);
        level.server.runCommandSilent(`particle minecraft:smoke ${bx + 0.5} ${by + 0.5} ${bz + 0.5} 0.4 0.3 0.4 0.05 20`);
        if (event.player) {
            event.player.sendSystemMessage(Text.of('§e⚒ [Кузнечный Комплекс] §7Модуль демонтирован. Станция перенастроена.'));
        }
    }
});
