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
//     pos 2 drops Hearth (2), pos 3 drops Anvil (4).
//   • Graceful reversion: breaking one block gracefully reverts the remaining blocks
//     to their corresponding station status with instant feedback and audio-visual cues.
//   • 4x1 Grand Forge (3-1-2-4) triggers portal-like awakening effects across all 4 modules:
//     lava trough, forging sparks, blast heat, void runes and hovering crystal flash.
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
function findBlacksmithLine(level, startPos, facingHint) {
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

    let xLen = xMax - xMin + 1;
    let zLen = zMax - zMin + 1;

    let facing = facingHint || 'north';
    if (!facingHint && startBlock.properties && startBlock.properties.facing) {
        facing = String(startBlock.properties.facing).toLowerCase();
    }

    // Choose the dominant line
    if (xLen >= zLen && xLen > 1) {
        let line = [];
        // Facing South: player looks +Z, left is East (+X), right is West (-X)
        if (facing === 'south') {
            for (let x = xMax; x >= xMin; x--) {
                line.push(new BlockPos(x, sy, startPos.z));
            }
        } else {
            // Facing North / East / West default: West (-X) to East (+X)
            for (let x = xMin; x <= xMax; x++) {
                line.push(new BlockPos(x, sy, startPos.z));
            }
        }
        return line;
    } else if (zLen > 1) {
        let line = [];
        // Facing West: player looks -X, left is South (+Z), right is North (-Z)
        if (facing === 'west') {
            for (let z = zMax; z >= zMin; z--) {
                line.push(new BlockPos(startPos.x, sy, z));
            }
        } else {
            // Facing East / North / South default: North (-Z) to South (+Z)
            for (let z = zMin; z <= zMax; z++) {
                line.push(new BlockPos(startPos.x, sy, z));
            }
        }
        return line;
    }
    return [startPos];
}

// ------------------------------------------------------------------------------
// GET STATION INFO HELPER (EXPORTED GLOBALLY)
// ------------------------------------------------------------------------------
function getBlacksmithStationInfo(level, pos) {
    if (!level || !pos) {
        return {
            isStation: false,
            count: 0,
            line: [],
            hasWorkbench: false,
            hasHearth: false,
            hasCrucible: false,
            hasAnvil: false,
            isGrandForge: false,
            workbenchPos: null,
            hearthPos: null,
            cruciblePos: null,
            anvilPos: null
        };
    }

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

    // Determine facing direction from the placed block
    let facing = 'north';
    try {
        if (block.properties && block.properties.facing) {
            facing = String(block.properties.facing).toLowerCase();
        }
    } catch (e) {}

    let line = findBlacksmithLine(level, block.pos, facing);
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
            event.player.sendSystemMessage(Text.of('§6⚒ [Кузнечный Комплекс] §aМодули пространственно упорядочены в канонический строй [3-1-2-4]!'));
        }
    }

    // GRAND FORGE (4x1: [3 - 1 - 2 - 4]) AWAKENING
    if (isGrand) {
        let pCrucible = line[0];
        let pWorkbench = line[1];
        let pHearth = line[2];
        let pAnvil = line[3];

        let cx = pWorkbench.x + 0.5;
        let cy = pWorkbench.y + 1.0;
        let cz = pWorkbench.z + 0.5;

        // Sounds: Portal spawn, beacon resonant hum, anvil resonance
        level.server.runCommandSilent(`playsound minecraft:block.end_portal.spawn block @a ${cx} ${cy} ${cz} 1.0 1.0`);
        level.server.runCommandSilent(`playsound minecraft:block.beacon.activate block @a ${cx} ${cy} ${cz} 1.0 1.2`);
        level.server.runCommandSilent(`playsound minecraft:block.portal.trigger block @a ${cx} ${cy} ${cz} 0.8 1.5`);

        // 1. Lava Trough at Crucible (pos 0)
        level.server.runCommandSilent(`particle minecraft:lava ${pCrucible.x + 0.5} ${pCrucible.y + 1.0} ${pCrucible.z + 0.5} 0.3 0.2 0.3 0.05 12`);
        level.server.runCommandSilent(`particle minecraft:flame ${pCrucible.x + 0.5} ${pCrucible.y + 1.0} ${pCrucible.z + 0.5} 0.2 0.1 0.2 0.02 15`);

        // 2. Forging Sparks at Workbench (pos 1)
        level.server.runCommandSilent(`particle minecraft:crit ${pWorkbench.x + 0.5} ${pWorkbench.y + 1.0} ${pWorkbench.z + 0.5} 0.4 0.2 0.4 0.1 25`);
        level.server.runCommandSilent(`particle minecraft:enchant ${pWorkbench.x + 0.5} ${pWorkbench.y + 1.2} ${pWorkbench.z + 0.5} 0.8 0.4 0.8 0.6 30`);

        // 3. Blast Furnace Flames at Hearth (pos 2)
        level.server.runCommandSilent(`particle minecraft:flame ${pHearth.x + 0.5} ${pHearth.y + 1.0} ${pHearth.z + 0.5} 0.3 0.2 0.3 0.03 20`);
        level.server.runCommandSilent(`particle minecraft:smoke ${pHearth.x + 0.5} ${pHearth.y + 1.2} ${pHearth.z + 0.5} 0.2 0.3 0.2 0.04 15`);

        // 4. Void Runes & Portal Vortex at Void Anvil (pos 3)
        level.server.runCommandSilent(`particle minecraft:portal ${pAnvil.x + 0.5} ${pAnvil.y + 1.0} ${pAnvil.z + 0.5} 0.8 0.5 0.8 0.4 40`);
        level.server.runCommandSilent(`particle minecraft:witch ${pAnvil.x + 0.5} ${pAnvil.y + 1.0} ${pAnvil.z + 0.5} 0.3 0.3 0.3 0.05 15`);

        // 5. Hovering Crystal Apex Flash above workbench/anvil
        level.server.runCommandSilent(`particle minecraft:end_rod ${cx} ${cy + 0.8} ${cz} 0.5 0.5 0.5 0.04 20`);
        level.server.runCommandSilent(`particle minecraft:soul_fire_flame ${cx} ${cy + 0.2} ${cz} 0.8 0.2 0.8 0.03 25`);

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

    let bx = block.x;
    let by = block.y;
    let bz = block.z;
    let player = event.player;

    // 1. EXACT DROP GUARANTEE
    // Breaking pos 0 drops Crucible (3), pos 1 drops Workbench (1),
    // pos 2 drops Hearth (2), pos 3 drops Anvil (4).
    // Because modules are physically auto-sorted in the world, block.id matches the exact position!
    if (!player || !player.isCreative()) {
        block.popItem(Item.of(brokenId, 1));
    }

    // 2. Audio-visual dismantling feedback
    level.server.runCommandSilent(`playsound minecraft:block.fire.extinguish block @a ${bx + 0.5} ${by + 0.5} ${bz + 0.5} 0.7 1.2`);
    level.server.runCommandSilent(`particle minecraft:smoke ${bx + 0.5} ${by + 0.5} ${bz + 0.5} 0.4 0.3 0.4 0.05 20`);

    // 3. GRACEFUL REVERSION OF REMAINING CONNECTED SEGMENTS
    let neighborPositions = [
        new BlockPos(bx - 1, by, bz),
        new BlockPos(bx + 1, by, bz),
        new BlockPos(bx, by, bz - 1),
        new BlockPos(bx, by, bz + 1)
    ];

    let checkedPositions = new Set();

    neighborPositions.forEach(np => {
        let key = `${np.x},${np.y},${np.z}`;
        if (checkedPositions.has(key)) return;

        let nb = level.getBlock(np);
        if (!nb || !BS_BLOCK_IDS.includes(String(nb.id))) return;

        // Scan the remaining contiguous line attached to this neighbor
        let remLine = findBlacksmithLine(level, np);
        remLine.forEach(p => checkedPositions.add(`${p.x},${p.y},${p.z}`));

        let remInfo = getBlacksmithStationInfo(level, np);

        if (remInfo.count === 1) {
            // Reverted to single standalone module
            let soloBlock = level.getBlock(np);
            let soloId = soloBlock ? String(soloBlock.id) : '';

            if (soloId === 'kubejs:blacksmith_workbench') {
                if (player) {
                    player.sendSystemMessage(Text.of('§e⚒ [Кузнечный Комплекс] §7Очаг демонтирован. Верстак перешел в автономный режим (§c+1 слиток штрафа к ковке§7).'));
                }
            } else if (soloId === 'kubejs:blacksmith_hearth') {
                if (player) {
                    player.sendSystemMessage(Text.of('§e🔥 [Кузнечный Комплекс] §7Верстак демонтирован. Очаг перешел в автономный режим (§eремонт снижен до 25%§7).'));
                }
            } else if (soloId === 'kubejs:infernal_crucible') {
                if (player) {
                    player.sendSystemMessage(Text.of('§4🌋 [Кузнечный Комплекс] §7Адский Горн отключен от верстака.'));
                }
            } else if (soloId === 'kubejs:void_anvil') {
                if (player) {
                    player.sendSystemMessage(Text.of('§5🌌 [Кузнечный Комплекс] §7Пустотная Наковальня отключена от мастерской.'));
                }
            }
        } else if (remInfo.count >= 2) {
            // Reverted to smaller multi-block station
            let desc = '';
            if (remInfo.hasWorkbench && remInfo.hasHearth && remInfo.hasCrucible) {
                desc = 'Горновой Комплекс [3-1-2] (0 штрафов, 50% ремонт, тигель)';
            } else if (remInfo.hasWorkbench && remInfo.hasHearth && remInfo.hasAnvil) {
                desc = 'Тройной Комплекс [1-2-4] (0 штрафов, 50% ремонт, наковальня)';
            } else if (remInfo.hasWorkbench && remInfo.hasHearth) {
                desc = 'Мастерская Оружейника [1-2] (0 штрафов, 50% ремонт)';
            } else if (remInfo.hasWorkbench) {
                desc = `Станция с Верстаком (${remInfo.count} бл., нет Очага: +1 слиток штрафа)`;
            } else {
                desc = `Вспомогательная станция (${remInfo.count} бл., верстак отсутствует)`;
            }

            level.server.runCommandSilent(`playsound minecraft:block.anvil.hit block @a ${np.x + 0.5} ${np.y + 0.5} ${np.z + 0.5} 0.6 1.0`);
            if (player) {
                player.sendSystemMessage(Text.of(`§e⚒ [Кузнечный Комплекс] §7Станция перенастроена: активен §a${desc}§7.`));
            }
        }
    });
});
