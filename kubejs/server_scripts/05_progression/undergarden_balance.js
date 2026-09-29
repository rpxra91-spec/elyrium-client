// ==============================================================================
// 🍄 ELYRIUM RPG: THE UNDERGARDEN (TIER 1.5) CALIBRATION & PROGRESSION ENGINE
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 1. Mob Scaling: Re-tunes Undergarden inhabitants for Elyrium RPG combat (+60-120% HP).
// 2. Boss Scaling: Forgotten Guardian and Rotbeasts get high-tier RPG boss attributes.
// 3. Custom Gated Catalyst Recipe: Requires Deepslate + Iron + Amethyst/Ruby.
// 4. Elite Drops: 5% chance to drop Gate Pearl for the Colosseum Wave Arena!
// ==============================================================================

const UNDERGARDEN_SCALED_MOBS = new Set([
    'undergarden:dweller',
    'undergarden:greater_dweller',
    'undergarden:brute',
    'undergarden:rotbeast',
    'undergarden:rotbelcher',
    'undergarden:rotwalker',
    'undergarden:rotling',
    'undergarden:forgotten',
    'undergarden:forgotten_guardian',
    'undergarden:muncher',
    'undergarden:nargoyle',
    'undergarden:sploogie'
]);

EntityEvents.spawned(event => {
    let entity = event.entity;
    if (!entity || !entity.type) return;

    let typeId = String(entity.type);
    if (!UNDERGARDEN_SCALED_MOBS.has(typeId)) return;

    let pData = entity.persistentData;
    if (pData.getBoolean('elyrium_scaled')) return;
    pData.putBoolean('elyrium_scaled', true);

    try {
        let maxHpAttr = entity.getAttribute('minecraft:generic.max_health');
        if (maxHpAttr) {
            let baseHp = maxHpAttr.baseValue;
            let mult = 1.6; // +60% baseline

            if (typeId === 'undergarden:brute' || typeId === 'undergarden:greater_dweller' || typeId === 'undergarden:rotbeast') {
                mult = 2.0; // +100% for heavy tanks
            } else if (typeId === 'undergarden:forgotten_guardian') {
                mult = 2.5; // +150% for dungeon boss
                pData.putBoolean('is_boss', true);
            }

            maxHpAttr.setBaseValue(baseHp * mult);
            entity.health = entity.maxHealth;
        }

        // Damage adjustment
        let attackAttr = entity.getAttribute('minecraft:generic.attack_damage');
        if (attackAttr) {
            attackAttr.setBaseValue(attackAttr.baseValue * 1.3);
        }
    } catch (eScale) {}
});

// Drop rewards on elite/boss defeat
EntityEvents.death(event => {
    let entity = event.entity;
    let source = event.source;
    if (!entity || !source) return;

    let typeId = String(entity.type);
    if (!UNDERGARDEN_SCALED_MOBS.has(typeId)) return;

    let killer = source.player || source.actual;
    if (!killer || !killer.isPlayer()) return;

    let level = entity.level;
    let x = entity.x;
    let y = entity.y;
    let z = entity.z;

    // Boss guarantee: Forgotten Guardian drops Colosseum Pearl
    if (typeId === 'undergarden:forgotten_guardian') {
        entity.block.popItem(Item.of('kubejs:gate_pearl_colosseum', 1));
        entity.block.popItem(Item.of('minecraft:diamond', 2));
    } else {
        // 5% chance from common Undergarden mobs
        if (Math.random() < 0.05) {
            entity.block.popItem(Item.of('kubejs:gate_pearl_colosseum', 1));
        }
    }
});

// ------------------------------------------------------------------------------
// RECIPES
// ------------------------------------------------------------------------------

ServerEvents.recipes(event => {
    // Remove the trivial vanilla catalyst recipe
    event.remove({ id: 'undergarden:catalyst' });

    // Elyrium Tier 1.5 Catalyst: Deepslate + Iron + Amethyst/Ruby + Ender Pearl
    event.shaped('undergarden:catalyst', [
        'DED',
        'IRI',
        'DSD'
    ], {
        D: 'minecraft:polished_deepslate',
        E: 'minecraft:ender_pearl',
        I: '#c:ingots/iron',
        R: '#c:gems/amethyst',
        S: 'minecraft:deepslate_bricks'
    });
});
