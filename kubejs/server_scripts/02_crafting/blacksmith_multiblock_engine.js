// ==============================================================================
// ⚒️ ELYRIUM RPG: FREE BLACKSMITH WORKSHOP & RADIUS ENGINE
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// File: server_scripts/02_crafting/blacksmith_multiblock_engine.js
// ==============================================================================
// Manages the Free Blacksmith Workshop components:
//   1 = kubejs:blacksmith_workbench («Верстак Оружейника», Т1)
//   2 = kubejs:blacksmith_hearth    («Кузнечный Очаг / Меха», Т1)
//   3 = kubejs:infernal_crucible    («Адский Горн / Тигель», Т3 Nether)
//   4 = kubejs:void_anvil           («Пустотная Наковальня», Т5 The End)
//
// Rules & Architecture:
// - Free Workshop Architecture:
//   • No forced linear rearrangement of blocks!
//   • No dynamic morphing into partial multi-blocks (pair/trio/quad).
//   • Each block maintains its monolithic individual 3D model and rotation.
//   • Radius Scanning (R = 4): Workstations detect each other freely within
//     a 4-block spherical/cubic radius of the accessed block.
//   • Standalone penalties apply only if corresponding modules are absent within R=4:
//     - Workbench alone: +1 ingot penalty to crafts (absent Hearth).
//     - Hearth alone: repairs 25% durability instead of 50%.
//   • Grand Forge is formed whenever all 4 modules are present within radius 4!
//   • Ambient tick loop: atmospheric glowing embers and enchant sparkles.
// ==============================================================================

const BS_BlockPos = Java.loadClass('net.minecraft.core.BlockPos');

const BS_BLOCK_IDS = [
    'kubejs:infernal_crucible',
    'kubejs:blacksmith_workbench',
    'kubejs:blacksmith_hearth',
    'kubejs:void_anvil'
];

const BS_CANONICAL_RANK = {
    'kubejs:infernal_crucible': 0,
    'kubejs:blacksmith_workbench': 1,
    'kubejs:blacksmith_hearth': 2,
    'kubejs:void_anvil': 3
};

const BS_DISPLAY_NAMES = {
    'kubejs:infernal_crucible': '§4🌋 Адский Тигель (Т3)',
    'kubejs:blacksmith_workbench': '§6⚒ Верстак Оружейника (Т1)',
    'kubejs:blacksmith_hearth': '§c🔥 Кузнечный Очаг (Т1)',
    'kubejs:void_anvil': '§5🌌 Наковальня Бездны (Т5)'
};

// ------------------------------------------------------------------------------
// SCAN WORKSHOP RADIUS (R = 4)
// ------------------------------------------------------------------------------
/**
 * Scans around centerPos up to specified radius for Blacksmith Workshop components.
 * Returns information about discovered components and their positions.
 */
function scanWorkshopRadius(level, centerPos, radius) {
    let r = (typeof radius === 'number' && radius > 0) ? radius : 4;
    let res = {
        hasWorkbench: false,
        workbenchPos: null,
        hasHearth: false,
        hearthPos: null,
        hasCrucible: false,
        cruciblePos: null,
        hasAnvil: false,
        anvilPos: null,
        count: 0,
        blocks: [],
        line: []
    };

    if (!level || !centerPos) return res;

    let cx = centerPos.x;
    let cy = centerPos.y;
    let cz = centerPos.z;

    for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
            for (let dz = -r; dz <= r; dz++) {
                let p = new BS_BlockPos(cx + dx, cy + dy, cz + dz);
                let b = level.getBlock(p);
                if (!b) continue;
                let id = String(b.id);

                if (id === 'kubejs:blacksmith_workbench') {
                    if (!res.hasWorkbench) {
                        res.hasWorkbench = true;
                        res.workbenchPos = p;
                        res.count++;
                    }
                    res.blocks.push({ id: id, pos: p });
                } else if (id === 'kubejs:blacksmith_hearth') {
                    if (!res.hasHearth) {
                        res.hasHearth = true;
                        res.hearthPos = p;
                        res.count++;
                    }
                    res.blocks.push({ id: id, pos: p });
                } else if (id === 'kubejs:infernal_crucible') {
                    if (!res.hasCrucible) {
                        res.hasCrucible = true;
                        res.cruciblePos = p;
                        res.count++;
                    }
                    res.blocks.push({ id: id, pos: p });
                } else if (id === 'kubejs:void_anvil') {
                    if (!res.hasAnvil) {
                        res.hasAnvil = true;
                        res.anvilPos = p;
                        res.count++;
                    }
                    res.blocks.push({ id: id, pos: p });
                }
            }
        }
    }

    res.isGrandForge = (res.hasWorkbench && res.hasHearth && res.hasCrucible && res.hasAnvil);
    res.isStation = (res.count >= 2);
    // Compatibility: populate line with unique positions found
    res.line = res.blocks.map(entry => entry.pos);

    return res;
}

// ------------------------------------------------------------------------------
// GET STATION INFO HELPER (EXPORTED GLOBALLY FOR GUI & SCRIPTS)
// ------------------------------------------------------------------------------
function getBlacksmithStationInfo(level, pos, radius) {
    if (!level || !pos) {
        return {
            isStation: false,
            count: 0,
            line: [],
            blocks: [],
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

    return scanWorkshopRadius(level, pos, radius || 4);
}

// ------------------------------------------------------------------------------
// BLOCK PLACEMENT & BREAK SOUND FEEDBACK (NO FORCED REARRANGEMENT)
// ------------------------------------------------------------------------------
BlockEvents.placed(event => {
    let block = event.block;
    let level = event.level;
    if (!level || level.isClientSide() || !block) return;

    let id = String(block.id);
    if (!BS_BLOCK_IDS.includes(id)) return;

    // Subtle audio feedback upon placing a workshop component
    let bx = block.x + 0.5;
    let by = block.y + 0.5;
    let bz = block.z + 0.5;

    level.server.runCommandSilent(`playsound minecraft:block.stone.place block @a ${bx} ${by} ${bz} 0.8 1.0`);

    // Check if placing this block completed the Grand Forge in radius 4
    let info = scanWorkshopRadius(level, block.pos, 4);
    if (info.isGrandForge) {
        level.server.runCommandSilent(`playsound minecraft:block.beacon.activate block @a ${bx} ${by} ${bz} 1.0 1.2`);
        level.server.runCommandSilent(`particle minecraft:end_rod ${bx} ${by + 1.0} ${bz} 0.5 0.5 0.5 0.04 20`);
        level.server.runCommandSilent(`particle minecraft:enchant ${bx} ${by + 1.2} ${bz} 0.6 0.3 0.6 0.4 30`);
    }
});

BlockEvents.broken(event => {
    let block = event.block;
    let level = event.level;
    if (!level || level.isClientSide() || !block) return;

    let brokenId = String(block.id);
    if (!BS_BLOCK_IDS.includes(brokenId)) return;

    let bx = block.x + 0.5;
    let by = block.y + 0.5;
    let bz = block.z + 0.5;

    level.server.runCommandSilent(`playsound minecraft:block.chain.break block @a ${bx} ${by} ${bz} 0.8 1.0`);
    level.server.runCommandSilent(`playsound minecraft:block.fire.extinguish block @a ${bx} ${by} ${bz} 0.7 1.2`);
});

// ------------------------------------------------------------------------------
// AMBIENT PARTICLES TICK LOOP (ATMOSPHERIC, CLEAN)
// ------------------------------------------------------------------------------
ServerEvents.tick(event => {
    if (event.server.tickCount % 20 !== 0) return;

    let players = event.server.players;
    if (!players || players.isEmpty()) return;

    let processedBlocks = new Set();

    for (let player of players) {
        let level = player.level;
        let px = Math.floor(player.x);
        let py = Math.floor(player.y);
        let pz = Math.floor(player.z);

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
                        level.server.runCommandSilent(`particle minecraft:flame ${bx} ${by + 0.7} ${bz} 0.15 0.05 0.15 0.01 1`);
                    } else if (id === 'kubejs:void_anvil') {
                        level.server.runCommandSilent(`particle minecraft:enchant ${bx} ${by + 1.2} ${bz} 0.15 0.15 0.15 0.2 1`);
                    } else if (id === 'kubejs:infernal_crucible') {
                        level.server.runCommandSilent(`particle minecraft:lava ${bx} ${by + 0.9} ${bz} 0.15 0.05 0.15 0.01 1`);
                    }
                }
            }
        }
    }
});
