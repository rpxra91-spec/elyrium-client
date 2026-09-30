// ==============================================================================
// 🛠️ ELYRIUM RPG: WEAPONMASTER'S BENCH & CHISEL CRAFTING RECIPES
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// Tier 4 (Nether) Canonical Crafting Gating:
// - Weaponmaster's Bench is crafted using smithing apparatus & Netherite/Cinder alloy.
// - Weaponmaster's Chisel is crafted using diamond edge & Netherite/Cinder shank.
// ==============================================================================

ServerEvents.recipes(event => {
    // --------------------------------------------------------------------------
    // 1. WEAPONMASTER'S BENCH (kubejs:weapon_bench) - TIER 4 NETHER
    // --------------------------------------------------------------------------

    // 1.1 Recipe via Netherite Scrap
    event.shaped('kubejs:weapon_bench', [
        'SGB',
        'PNP',
        'B B'
    ], {
        S: 'minecraft:smithing_table',
        G: 'minecraft:grindstone',
        B: 'minecraft:iron_block',
        P: 'minecraft:polished_blackstone',
        N: 'minecraft:netherite_scrap'
    }).id('elyrium:crafting/weapon_bench_netherite');

    // 1.2 Recipe via Cinder Alloy Ingot
    event.shaped('kubejs:weapon_bench', [
        'SGB',
        'PCP',
        'B B'
    ], {
        S: 'minecraft:smithing_table',
        G: 'minecraft:grindstone',
        B: 'minecraft:iron_block',
        P: 'minecraft:polished_blackstone',
        C: 'skd:cinder_alloy_ingot'
    }).id('elyrium:crafting/weapon_bench_cinder');

    // --------------------------------------------------------------------------
    // 2. WEAPONMASTER'S CHISEL (kubejs:weapon_chisel) - TIER 4 NETHER
    // --------------------------------------------------------------------------

    // 2.1 Recipe via Netherite Scrap
    event.shaped('kubejs:weapon_chisel', [
        '  D',
        ' N ',
        'S  '
    ], {
        D: 'minecraft:diamond',
        N: 'minecraft:netherite_scrap',
        S: 'minecraft:stick'
    }).id('elyrium:crafting/weapon_chisel_netherite');

    // 2.2 Recipe via Cinder Alloy Ingot
    event.shaped('kubejs:weapon_chisel', [
        '  D',
        ' C ',
        'S  '
    ], {
        D: 'minecraft:diamond',
        C: 'skd:cinder_alloy_ingot',
        S: 'minecraft:stick'
    }).id('elyrium:crafting/weapon_chisel_cinder');

    // --------------------------------------------------------------------------
    // 3. MARTIAL TABLET RECIPES (HYBRID CRAFTING: ESSENCE + INGOT + SLAB)
    // --------------------------------------------------------------------------
    const TABLET_RECIPES = [
        // 10 Expanded Arts (Ashes of War)
        { id: 'kubejs:martial_tablet_iron_stance', essence: 'kubejs:dungeon_essence_t2', ingot: 'minecraft:iron_ingot', key: 'iron_stance' },
        { id: 'kubejs:martial_tablet_thousand_cuts', essence: 'kubejs:dungeon_essence_t3', ingot: 'minecraft:diamond', key: 'thousand_cuts' },
        { id: 'kubejs:martial_tablet_helm_splitter', essence: 'kubejs:dungeon_essence_t2', ingot: 'minecraft:iron_ingot', key: 'helm_splitter' },
        { id: 'kubejs:martial_tablet_unstoppable_charge', essence: 'kubejs:dungeon_essence_t3', ingot: 'minecraft:diamond', key: 'unstoppable_charge' },
        { id: 'kubejs:martial_tablet_earth_fracture', essence: 'kubejs:dungeon_essence_t4', ingot: 'skd:cinder_alloy_ingot', altIngot: 'minecraft:netherite_scrap', key: 'earth_fracture' },
        { id: 'kubejs:martial_tablet_bone_crusher', essence: 'kubejs:dungeon_essence_t3', ingot: 'minecraft:diamond', key: 'bone_crusher' },
        { id: 'kubejs:martial_tablet_spear_flurry', essence: 'kubejs:dungeon_essence_t2', ingot: 'minecraft:iron_ingot', key: 'spear_flurry' },
        { id: 'kubejs:martial_tablet_polearm_vault', essence: 'kubejs:dungeon_essence_t3', ingot: 'minecraft:diamond', key: 'polearm_vault' },
        { id: 'kubejs:martial_tablet_sweeping_sweep', essence: 'kubejs:dungeon_essence_t2', ingot: 'minecraft:iron_ingot', key: 'sweeping_sweep' },
        { id: 'kubejs:martial_tablet_explosive_shot', essence: 'kubejs:dungeon_essence_t4', ingot: 'skd:cinder_alloy_ingot', altIngot: 'minecraft:netherite_scrap', key: 'explosive_shot' },

        // 8 Legacy Arts
        { id: 'kubejs:martial_tablet_whirlwind', essence: 'kubejs:dungeon_essence_t1', ingot: 'minecraft:copper_ingot', key: 'whirlwind' },
        { id: 'kubejs:martial_tablet_earth_sunder', essence: 'kubejs:dungeon_essence_t2', ingot: 'minecraft:iron_ingot', key: 'earth_sunder' },
        { id: 'kubejs:martial_tablet_juggernaut', essence: 'kubejs:dungeon_essence_t3', ingot: 'minecraft:diamond', key: 'juggernaut' },
        { id: 'kubejs:martial_tablet_lightning_thrust', essence: 'kubejs:dungeon_essence_t1', ingot: 'minecraft:copper_ingot', key: 'lightning_thrust' },
        { id: 'kubejs:martial_tablet_blood_rend', essence: 'kubejs:dungeon_essence_t4', ingot: 'skd:cinder_alloy_ingot', altIngot: 'minecraft:netherite_scrap', key: 'blood_rend' },
        { id: 'kubejs:martial_tablet_seismic_slam', essence: 'kubejs:dungeon_essence_t2', ingot: 'minecraft:iron_ingot', key: 'seismic_slam' },
        { id: 'kubejs:martial_tablet_shadow_step', essence: 'kubejs:dungeon_essence_t3', ingot: 'minecraft:diamond', key: 'shadow_step' },
        { id: 'kubejs:martial_tablet_arrow_barrage', essence: 'kubejs:dungeon_essence_t1', ingot: 'minecraft:copper_ingot', key: 'arrow_barrage' },

        // 14 Additional Classic & Elemental Arts
        { id: 'kubejs:martial_tablet_reverse_sunder', essence: 'kubejs:dungeon_essence_t1', ingot: 'minecraft:copper_ingot', key: 'reverse_sunder' },
        { id: 'kubejs:martial_tablet_crushing_uppercut', essence: 'kubejs:dungeon_essence_t1', ingot: 'minecraft:copper_ingot', key: 'crushing_uppercut' },
        { id: 'kubejs:martial_tablet_severing_cleave', essence: 'kubejs:dungeon_essence_t2', ingot: 'minecraft:iron_ingot', key: 'severing_cleave' },
        { id: 'kubejs:martial_tablet_piercing_thrust', essence: 'kubejs:dungeon_essence_t2', ingot: 'minecraft:iron_ingot', key: 'piercing_thrust' },
        { id: 'kubejs:martial_tablet_scissor_cross', essence: 'kubejs:dungeon_essence_t2', ingot: 'minecraft:iron_ingot', key: 'scissor_cross' },
        { id: 'kubejs:martial_tablet_tactical_backstep', essence: 'kubejs:dungeon_essence_t2', ingot: 'minecraft:iron_ingot', key: 'tactical_backstep' },
        { id: 'kubejs:martial_tablet_triple_shot', essence: 'kubejs:dungeon_essence_t2', ingot: 'minecraft:iron_ingot', key: 'triple_shot' },
        { id: 'kubejs:martial_tablet_arrow_rain', essence: 'kubejs:dungeon_essence_t3', ingot: 'minecraft:diamond', key: 'arrow_rain' },
        { id: 'kubejs:martial_tablet_piercing_shot', essence: 'kubejs:dungeon_essence_t3', ingot: 'minecraft:diamond', key: 'piercing_shot' },
        { id: 'kubejs:martial_tablet_unwavering_bulwark', essence: 'kubejs:dungeon_essence_t3', ingot: 'minecraft:diamond', key: 'unwavering_bulwark' },
        { id: 'kubejs:martial_tablet_flame_vortex', essence: 'kubejs:dungeon_essence_t4', ingot: 'skd:cinder_alloy_ingot', altIngot: 'minecraft:netherite_scrap', key: 'flame_vortex' },
        { id: 'kubejs:martial_tablet_frost_stomp', essence: 'kubejs:dungeon_essence_t4', ingot: 'skd:cinder_alloy_ingot', altIngot: 'minecraft:netherite_scrap', key: 'frost_stomp' },
        { id: 'kubejs:martial_tablet_lightning_smite', essence: 'kubejs:dungeon_essence_t4', ingot: 'skd:cinder_alloy_ingot', altIngot: 'minecraft:netherite_scrap', key: 'lightning_smite' },
        { id: 'kubejs:martial_tablet_holy_blade', essence: 'kubejs:dungeon_essence_t4', ingot: 'skd:cinder_alloy_ingot', altIngot: 'minecraft:netherite_scrap', key: 'holy_blade' }
    ];

    TABLET_RECIPES.forEach(tab => {
        // Primary Recipe
        event.shaped(tab.id, [
            ' E ',
            'ISI',
            ' E '
        ], {
            E: tab.essence,
            I: tab.ingot,
            S: 'minecraft:smooth_stone_slab'
        }).id(`elyrium:crafting/tablet_${tab.key}`);

        // Alternative Recipe for T4 (Netherite Scrap)
        if (tab.altIngot) {
            event.shaped(tab.id, [
                ' E ',
                'ISI',
                ' E '
            ], {
                E: tab.essence,
                I: tab.altIngot,
                S: 'minecraft:smooth_stone_slab'
            }).id(`elyrium:crafting/tablet_${tab.key}_alt`);
        }
    });
});
