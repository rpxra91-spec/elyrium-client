// ==============================================================================
// ☠️ ELYRIUM RPG: THE ENDLESS FRINGE (ЗОНА ИСКАЖЕНИЯ, R >= 35,000)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// - Beyond 35,000 blocks in Overworld: infinite difficulty & reward scaling.
// - Every 500m deeper = +1 Fringe Stack (+35% HP, +20% Damage).
// - Exponential drop scaling: Flawless Gems, Netherite, Spheres of Ascension.
// ==============================================================================

const FRINGE_START_RADIUS = 35000;
const FRINGE_STEP_METERS = 500;
const HP_BONUS_PER_STACK = 0.35;
const DMG_BONUS_PER_STACK = 0.20;

function calculateFringeStacks(r) {
    if (r < FRINGE_START_RADIUS) return 0;
    return Math.floor((r - FRINGE_START_RADIUS) / FRINGE_STEP_METERS) + 1;
}

// -----------------------------------------------------------------------------
// 1. MOB SPAWNING: SCALE HEALTH, DAMAGE AND VISUAL MARKING
// -----------------------------------------------------------------------------
EntityEvents.spawned(event => {
    let entity = event.entity;
    if (!entity || !entity.isMonster()) return;

    let level = event.level;
    if (!level || !String(level.dimension).includes('overworld')) return;

    let r = Math.sqrt(entity.x * entity.x + entity.z * entity.z);
    let stacks = calculateFringeStacks(r);
    if (stacks <= 0) return;

    let pData = entity.persistentData;
    if (pData.getInt('fringe_stacks') > 0) return;
    pData.putInt('fringe_stacks', stacks);

    try {
        // A. Scale Max Health (+35% per stack)
        let hpAttr = entity.getAttribute('minecraft:generic.max_health');
        if (hpAttr) {
            let baseHp = hpAttr.baseValue;
            let newHp = Math.round(baseHp * (1.0 + HP_BONUS_PER_STACK * stacks));
            hpAttr.setBaseValue(newHp);
            entity.health = newHp;
        }

        // B. Scale Attack Damage (+20% per stack)
        let dmgAttr = entity.getAttribute('minecraft:generic.attack_damage');
        if (dmgAttr) {
            let baseDmg = dmgAttr.baseValue;
            let newDmg = Math.round(baseDmg * (1.0 + DMG_BONUS_PER_STACK * stacks));
            dmgAttr.setBaseValue(newDmg);
        }

        // C. Visual Name & Atmosphere
        let rawName = entity.type.description.getString ? entity.type.description.getString() : 'Монстр';
        entity.customName = Text.of(`§d☠ Искаженный ${rawName} §5[+${stacks}]`);
    } catch (e) {}
});

// -----------------------------------------------------------------------------
// 2. MOB DEATH: EXPONENTIAL REWARD SCALING (RISK VS REWARD)
// -----------------------------------------------------------------------------
EntityEvents.death(event => {
    let entity = event.entity;
    if (!entity || !entity.isMonster()) return;

    let level = event.level;
    if (!level || !String(level.dimension).includes('overworld')) return;

    let stacks = entity.persistentData.getInt('fringe_stacks');
    if (stacks <= 0) return;

    let x = entity.x;
    let y = entity.y;
    let z = entity.z;

    try {
        // Visual death burst of void energy
        level.runCommandSilent(`particle minecraft:portal ${x} ${y + 1} ${z} 0.8 0.8 0.8 0.2 25 normal`);
        level.runCommandSilent(`particle minecraft:witch ${x} ${y + 0.8} ${z} 0.5 0.5 0.5 0.1 15 normal`);

        // A. Apotheosis Gems (5% base + 1.5% per stack, cap 35%)
        let gemChance = Math.min(0.35, 0.05 + 0.015 * stacks);
        if (Math.random() < gemChance) {
            entity.block.popItem('apotheosis:gem');
        }

        // B. Netherite Scrap / Ingot (3% base + 1% per stack, cap 25%)
        let netheriteChance = Math.min(0.25, 0.03 + 0.01 * stacks);
        if (Math.random() < netheriteChance) {
            if (stacks >= 8 && Math.random() < 0.25) {
                entity.block.popItem('minecraft:netherite_ingot');
            } else {
                entity.block.popItem('minecraft:netherite_scrap');
            }
        }

        // C. Sphere of Ascension (2% base + 0.5% per stack, cap 15%)
        let sphereChance = Math.min(0.15, 0.02 + 0.005 * stacks);
        if (Math.random() < sphereChance) {
            entity.block.popItem('kubejs:sphere_of_ascension');
        }

        // D. Colosseum Gate Pearl (1% base + 0.5% per stack, cap 10%)
        let gateChance = Math.min(0.10, 0.01 + 0.005 * stacks);
        if (Math.random() < gateChance) {
            entity.block.popItem('kubejs:gate_pearl_colosseum');
        }
    } catch (e) {}
});
