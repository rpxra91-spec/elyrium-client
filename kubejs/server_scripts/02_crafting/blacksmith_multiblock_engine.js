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
//   • Dynamic 3D Model Transformation:
//     - 2 blocks: pair_left, pair_right
//     - 3 blocks: trio_left, trio_mid, trio_right
//     - 4 blocks: quad_0, quad_1, quad_2, quad_3
//   • Exact drop on break: breaking pos 0 drops Crucible (3), pos 1 drops Workbench (1),
//     pos 2 drops Hearth (2), pos 3 drops Anvil (4).
//   • Graceful reversion: breaking one block gracefully reverts the remaining blocks
//     to their corresponding station status and 3D models with instant feedback.
//   • 4x1 Grand Forge (3-1-2-4) triggers portal-like awakening effects across all 4 modules.
//   • Ambient tick loop: atmospheric chimney smoke, ember sparks, bubbling lava, void vortex.
// ==============================================================================

const BlockPos = Java.loadClass('net.minecraft.core.BlockPos');

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
    if (typeof level.getBlock !== 'function') return [startPos];
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
// DETERMINE 3D FORMATION PART ROLES FOR SORTED SEQUENCE OF BLOCKS
// ------------------------------------------------------------------------------
function determineFormationParts(sortedIds) {
    if (!sortedIds || sortedIds.length <= 1) {
        return sortedIds ? sortedIds.map(() => 'single') : [];
    }

    let len = sortedIds.length;

    // 1. Grand Forge (4 blocks: [3-1-2-4] -> Crucible, Workbench, Hearth, Anvil)
    if (len === 4) {
        let isGrand = (
            sortedIds[0] === 'kubejs:infernal_crucible' &&
            sortedIds[1] === 'kubejs:blacksmith_workbench' &&
            sortedIds[2] === 'kubejs:blacksmith_hearth' &&
            sortedIds[3] === 'kubejs:void_anvil'
        );
        if (isGrand) {
            return ['quad_0', 'quad_1', 'quad_2', 'quad_3'];
        }
        return ['single', 'single', 'single', 'single'];
    }

    // 2. Trio (3 blocks: [3-1-2] -> Crucible, Workbench, Hearth)
    if (len === 3) {
        let isCanonicalTrio = (
            sortedIds[0] === 'kubejs:infernal_crucible' &&
            sortedIds[1] === 'kubejs:blacksmith_workbench' &&
            sortedIds[2] === 'kubejs:blacksmith_hearth'
        );
        if (isCanonicalTrio) {
            return ['trio_left', 'trio_mid', 'trio_right'];
        }
        // If Workbench + Hearth + Anvil: Workbench & Hearth connect as pair, Anvil is single
        if (sortedIds[0] === 'kubejs:blacksmith_workbench' &&
            sortedIds[1] === 'kubejs:blacksmith_hearth' &&
            sortedIds[2] === 'kubejs:void_anvil') {
            return ['pair_left', 'pair_right', 'single'];
        }
        return ['single', 'single', 'single'];
    }

    // 3. Pair (2 blocks: [1-2] -> Workbench, Hearth)
    if (len === 2) {
        let isCanonicalPair = (
            sortedIds[0] === 'kubejs:blacksmith_workbench' &&
            sortedIds[1] === 'kubejs:blacksmith_hearth'
        );
        if (isCanonicalPair) {
            return ['pair_left', 'pair_right'];
        }
        return ['single', 'single'];
    }

    return sortedIds.map(() => 'single');
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
// ------------------------------------------------------------------------------
// SPATIAL AUTO-ALIGNMENT & 3D MODEL SYNCHRONIZATION FUNCTION
// ------------------------------------------------------------------------------
function alignBlacksmithStation(level, originPos, player, facingHint) {
    if (!level || level.isClientSide() || bsIsAligning) return null;
    let block = level.getBlock(originPos);
    if (!block) return null;

    let placedId = String(block.id);
    if (!BS_BLOCK_IDS.includes(placedId)) return null;

    // Determine facing direction from the block
    let facing = facingHint || 'north';
    try {
        if (block.properties && block.properties.facing) {
            facing = String(block.properties.facing).toLowerCase();
        }
    } catch (e) {}

    let line = findBlacksmithLine(level, originPos, facing);
    if (line.length < 2) {
        // Standalone block: ensure part is 'single'
        try {
            block.set(placedId, { facing: facing, part: 'single' });
        } catch (e) {}
        return line;
    }

    // We only form stations up to 4 blocks
    if (line.length > 4) {
        if (player) {
            player.sendSystemMessage(Text.of('§c⚠ [Кузнечный Комплекс] §7Максимальная длина кузнечной станции — 4 блока!'));
        }
        return line;
    }

    let currentIds = line.map(p => String(level.getBlock(p).id));

    // Desired canonical sorting based on canonical rank [3 -> 1 -> 2 -> 4]
    let sortedIds = currentIds.slice().sort((a, b) => {
        let rA = (BS_CANONICAL_RANK[a] !== undefined) ? BS_CANONICAL_RANK[a] : 99;
        let rB = (BS_CANONICAL_RANK[b] !== undefined) ? BS_CANONICAL_RANK[b] : 99;
        return rA - rB;
    });

    let isGrand = (line.length === 4 &&
        sortedIds[0] === 'kubejs:infernal_crucible' &&
        sortedIds[1] === 'kubejs:blacksmith_workbench' &&
        sortedIds[2] === 'kubejs:blacksmith_hearth' &&
        sortedIds[3] === 'kubejs:void_anvil');

    let parts = determineFormationParts(sortedIds);

    // Synchronize blocks and their 3D part properties
    bsIsAligning = true;
    try {
        for (let i = 0; i < line.length; i++) {
            let p = line[i];
            let targetId = sortedIds[i];
            let partName = parts[i] || 'single';

            let cur = level.getBlock(p);
            cur.set(targetId, { facing: facing, part: partName });
        }
    } finally {
        bsIsAligning = false;
    }

    // Assembly feedback: Heavy anvil hammer strike + burst of sparks
    let centerPos = line[Math.floor(line.length / 2)];
    let cx = centerPos.x + 0.5;
    let cy = centerPos.y + 0.5;
    let cz = centerPos.z + 0.5;

    level.server.runCommandSilent(`playsound minecraft:block.anvil.use block @a ${cx} ${cy} ${cz} 0.9 0.85`);
    level.server.runCommandSilent(`playsound minecraft:block.blastfurnace.fire_crackle block @a ${cx} ${cy} ${cz} 1.0 1.1`);
    level.server.runCommandSilent(`particle minecraft:lava ${cx} ${cy + 0.7} ${cz} 0.5 0.3 0.5 0.08 15`);
    level.server.runCommandSilent(`particle minecraft:crit ${cx} ${cy + 0.7} ${cz} 0.6 0.3 0.6 0.12 30`);
    level.server.runCommandSilent(`particle minecraft:campfire_cosy_smoke ${cx} ${cy + 0.8} ${cz} 0.3 0.4 0.3 0.03 10`);

    // GRAND FORGE (4x1: [3 - 1 - 2 - 4]) AWAKENING
    if (isGrand) {
        let pCrucible = line[0];
        let pWorkbench = line[1];
        let pHearth = line[2];
        let pAnvil = line[3];

        let gcx = pWorkbench.x + 0.5;
        let gcy = pWorkbench.y + 1.0;
        let gcz = pWorkbench.z + 0.5;

        // Sounds: Portal spawn, beacon resonant hum, anvil resonance
        level.server.runCommandSilent(`playsound minecraft:block.end_portal.spawn block @a ${gcx} ${gcy} ${gcz} 1.0 1.0`);
        level.server.runCommandSilent(`playsound minecraft:block.beacon.activate block @a ${gcx} ${gcy} ${gcz} 1.0 1.2`);
        level.server.runCommandSilent(`playsound minecraft:block.portal.trigger block @a ${gcx} ${gcy} ${gcz} 0.8 1.5`);

        // 1. Lava Trough at Crucible (pos 0)
        level.server.runCommandSilent(`particle minecraft:lava ${pCrucible.x + 0.5} ${pCrucible.y + 1.0} ${pCrucible.z + 0.5} 0.3 0.2 0.3 0.05 16`);
        level.server.runCommandSilent(`particle minecraft:flame ${pCrucible.x + 0.5} ${pCrucible.y + 1.0} ${pCrucible.z + 0.5} 0.2 0.1 0.2 0.02 20`);

        // 2. Forging Sparks at Workbench (pos 1)
        level.server.runCommandSilent(`particle minecraft:crit ${pWorkbench.x + 0.5} ${pWorkbench.y + 1.0} ${pWorkbench.z + 0.5} 0.4 0.2 0.4 0.1 35`);
        level.server.runCommandSilent(`particle minecraft:enchant ${pWorkbench.x + 0.5} ${pWorkbench.y + 1.2} ${pWorkbench.z + 0.5} 0.8 0.4 0.8 0.6 40`);

        // 3. Blast Furnace Flames & Chimney Smoke at Hearth (pos 2)
        level.server.runCommandSilent(`particle minecraft:flame ${pHearth.x + 0.5} ${pHearth.y + 1.0} ${pHearth.z + 0.5} 0.3 0.2 0.3 0.03 25`);
        level.server.runCommandSilent(`particle minecraft:campfire_cosy_smoke ${pHearth.x + 0.5} ${pHearth.y + 1.3} ${pHearth.z + 0.5} 0.2 0.5 0.2 0.04 20`);

        // 4. Void Runes & Portal Vortex at Void Anvil (pos 3)
        level.server.runCommandSilent(`particle minecraft:portal ${pAnvil.x + 0.5} ${pAnvil.y + 1.0} ${pAnvil.z + 0.5} 0.8 0.5 0.8 0.4 50`);
        level.server.runCommandSilent(`particle minecraft:witch ${pAnvil.x + 0.5} ${pAnvil.y + 1.0} ${pAnvil.z + 0.5} 0.3 0.3 0.3 0.05 20`);

        // 5. Hovering Crystal Apex Flash above workbench/anvil
        level.server.runCommandSilent(`particle minecraft:end_rod ${gcx} ${gcy + 0.8} ${gcz} 0.5 0.5 0.5 0.04 25`);
        level.server.runCommandSilent(`particle minecraft:soul_fire_flame ${gcx} ${gcy + 0.2} ${gcz} 0.8 0.2 0.8 0.03 30`);

        if (player) {
            player.sendSystemMessage(Text.of('§6👑 [ВЕЛИКАЯ КУЗНИЦА ЭЛИРИУМА] §dПустотно-Инфернальный Горн пробужден! (Канонический строй: [3-1-2-4])'));
            player.sendSystemMessage(Text.of('§a✓ Монолитная структура активирована: 0 штрафов, 50% ремонт, ковка арсенала и алтарь заточки!'));
        }
    } else if (player) {
        player.sendSystemMessage(Text.of(`§6⚒ [Кузнечный Комплекс] §aМодули объединены в строй (${line.length} бл.). 3D-модели трансформированы!`));
    }
    return line;
}

// 1. Generic Block Placement Handler
BlockEvents.placed(event => {
    let block = event.block;
    let level = event.level;
    if (!level || level.isClientSide() || bsIsAligning || !block) return;
    if (BS_BLOCK_IDS.includes(String(block.id))) {
        alignBlacksmithStation(level, block.pos, event.player);
    }
});

// 2. Targeted Placement Handlers for all 4 workstation blocks
BS_BLOCK_IDS.forEach(targetId => {
    BlockEvents.placed(targetId, event => {
        let block = event.block;
        let level = event.level;
        if (!level || level.isClientSide() || bsIsAligning || !block) return;
        alignBlacksmithStation(level, block.pos, event.player);
    });
});

// 3. Sneak + Right-Click with empty hand on ANY workstation block triggers manual calibration!
BlockEvents.rightClicked(event => {
    let player = event.player;
    if (!player || player.level.isClientSide() || !player.isCrouching()) return;
    let block = event.block;
    if (!block || !BS_BLOCK_IDS.includes(String(block.id))) return;
    let handStr = event.hand ? String(event.hand) : 'MAIN_HAND';
    if (!handStr.includes('MAIN')) return;

    if (player.mainHandItem.isEmpty()) {
        event.cancel();
        let res = alignBlacksmithStation(player.level, block.pos, player);
        if (res && res.length >= 2) {
            player.sendSystemMessage(Text.of(`§6⚒ [Кузница] §aКалибровка выполнена! Модули (${res.length} шт.) состыкованы в канонический строй!`));
        } else {
            player.sendSystemMessage(Text.of('§6⚒ [Кузница] §7Одиночный модуль. Установите рядом другие блоки кузницы [3-1-2-4]!'));
        }
    }
});

// ------------------------------------------------------------------------------
// EXACT DROP ON BREAK & GRACEFUL REVERSION WITH MODEL DOWNGRADE
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

    // 1. Audio-visual dismantling feedback
    level.server.runCommandSilent(`playsound minecraft:block.chain.break block @a ${bx + 0.5} ${by + 0.5} ${bz + 0.5} 0.8 1.0`);
    level.server.runCommandSilent(`playsound minecraft:block.fire.extinguish block @a ${bx + 0.5} ${by + 0.5} ${bz + 0.5} 0.7 1.2`);
    level.server.runCommandSilent(`particle minecraft:smoke ${bx + 0.5} ${by + 0.5} ${bz + 0.5} 0.4 0.3 0.4 0.05 20`);

    // 2. GRACEFUL REVERSION OF REMAINING CONNECTED SEGMENTS
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
            let soloFacing = 'north';
            try {
                if (soloBlock && soloBlock.properties && soloBlock.properties.facing) {
                    soloFacing = String(soloBlock.properties.facing).toLowerCase();
                }
            } catch (e) {}

            if (soloBlock) {
                soloBlock.set(soloId, { facing: soloFacing, part: 'single' });
            }

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
            // Reverted to smaller multi-block station: update 3D models of remaining blocks!
            let remFacing = 'north';
            try {
                let fb = level.getBlock(remLine[0]);
                if (fb && fb.properties && fb.properties.facing) {
                    remFacing = String(fb.properties.facing).toLowerCase();
                }
            } catch (e) {}

            let remIds = remLine.map(p => String(level.getBlock(p).id));
            let remParts = determineFormationParts(remIds);

            for (let ri = 0; ri < remLine.length; ri++) {
                let rp = remLine[ri];
                let rBlock = level.getBlock(rp);
                let rId = remIds[ri];
                let rPart = remParts[ri] || 'single';
                rBlock.set(rId, { facing: remFacing, part: rPart });
            }

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

// ------------------------------------------------------------------------------
// AMBIENT PARTICLES & AUDIO TICK LOOP
// ------------------------------------------------------------------------------
ServerEvents.tick(event => {
    // Run once every 20 ticks (1 second)
    if (event.server.tickCount % 20 !== 0) return;

    let players = event.server.players;
    if (!players || players.isEmpty()) return;

    let processedBlocks = new Set();

    for (let player of players) {
        let level = player.level;
        let px = Math.floor(player.x);
        let py = Math.floor(player.y);
        let pz = Math.floor(player.z);

        // Check a 13x6x13 radius around player without skipping any coordinates
        for (let dx = -6; dx <= 6; dx++) {
            for (let dz = -6; dz <= 6; dz++) {
                for (let dy = -2; dy <= 3; dy++) {
                    let bxPos = px + dx;
                    let byPos = py + dy;
                    let bzPos = pz + dz;
                    let posKey = `${bxPos},${byPos},${bzPos}`;
                    if (processedBlocks.has(posKey)) continue;

                    let b = level.getBlock(bxPos, byPos, bzPos);
                    if (!b) continue;
                    let id = String(b.id);
                    if (!BS_BLOCK_IDS.includes(id)) continue;

                    processedBlocks.add(posKey);

                    let bx = bxPos + 0.5;
                    let by = byPos;
                    let bz = bzPos + 0.5;

                    if (id === 'kubejs:blacksmith_hearth') {
                        // Hearth: Curling chimney smoke and glowing ember sparks
                        level.server.runCommandSilent(`particle minecraft:campfire_cosy_smoke ${bx} ${by + 1.1} ${bz} 0.15 0.3 0.15 0.02 2`);
                        level.server.runCommandSilent(`particle minecraft:flame ${bx} ${by + 0.7} ${bz} 0.2 0.1 0.2 0.01 2`);
                    } else if (id === 'kubejs:infernal_crucible') {
                        // Crucible: Bubbling Nether lava and magma sparks
                        level.server.runCommandSilent(`particle minecraft:lava ${bx} ${by + 0.9} ${bz} 0.25 0.1 0.25 0.02 1`);
                        level.server.runCommandSilent(`particle minecraft:smoke ${bx} ${by + 1.0} ${bz} 0.15 0.2 0.15 0.02 2`);
                    } else if (id === 'kubejs:void_anvil') {
                        // Void Anvil: Swirling violet void runes and amethyst crystal glimmer
                        level.server.runCommandSilent(`particle minecraft:portal ${bx} ${by + 1.4} ${bz} 0.3 0.3 0.3 0.1 3`);
                        level.server.runCommandSilent(`particle minecraft:witch ${bx} ${by + 1.2} ${bz} 0.2 0.2 0.2 0.02 1`);
                        level.server.runCommandSilent(`particle minecraft:enchant ${bx} ${by + 1.5} ${bz} 0.2 0.2 0.2 0.5 3`);
                    }
                }
            }
        }
    }
});
