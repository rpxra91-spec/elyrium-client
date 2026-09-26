// ==============================================================================
// 🛠️ ELYRIUM RPG: MODULAR MULTITOOL RECIPES (TIER 4 & MODULES)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================

ServerEvents.recipes(event => {

    // 1. MK-I OMNI-CHASSIS (Tier 4 Netherite + Cinder Alloy)
    event.shaped('kubejs:modular_omni_chassis_mk1', [
        'CAC',
        'BTB',
        ' B '
    ], {
        C: 'skd:cinder_alloy_ingot',
        A: 'minecraft:netherite_ingot',
        B: 'minecraft:blaze_rod',
        T: 'skd:tool_core_t4'
    }).id('elyrium:crafting/modular_omni_chassis_mk1');

    // 2. MODULE: SMELTING (Инфернальный Горн)
    event.shaped('kubejs:multitool_module_smelting', [
        'FMF',
        'BSB',
        'MVM'
    ], {
        F: 'minecraft:fire_charge',
        M: 'skd:cinder_alloy_ingot',
        B: 'minecraft:blaze_powder',
        S: 'minecraft:netherite_scrap',
        V: 'minecraft:magma_block'
    }).id('elyrium:crafting/multitool_module_smelting');

    // 3. MODULE: SILK (Шелковый Резонанс)
    event.shaped('kubejs:multitool_module_silk', [
        'AEA',
        'FGF',
        'STS'
    ], {
        A: 'minecraft:amethyst_shard',
        E: 'minecraft:echo_shard',
        F: 'minecraft:feather',
        G: 'minecraft:ghast_tear',
        S: 'minecraft:string',
        T: 'minecraft:slime_ball'
    }).id('elyrium:crafting/multitool_module_silk');

    // 4. MODULE: MAGNETIC (Магнитный Захват)
    event.shaped('kubejs:multitool_module_magnetic', [
        'IRI',
        'PCP',
        'IBI'
    ], {
        I: 'minecraft:iron_block',
        R: 'minecraft:redstone_block',
        P: 'minecraft:ender_pearl',
        C: 'minecraft:compass',
        B: 'minecraft:copper_block'
    }).id('elyrium:crafting/multitool_module_magnetic');

    // 5. MODULE: PROSPECTOR (Геологическая Линза)
    event.shaped('kubejs:multitool_module_prospector', [
        'CSC',
        'GEG',
        'CAC'
    ], {
        C: 'minecraft:copper_ingot',
        S: 'minecraft:spyglass',
        G: 'minecraft:gold_ingot',
        E: 'minecraft:echo_shard',
        A: 'minecraft:amethyst_cluster'
    }).id('elyrium:crafting/multitool_module_prospector');

    // 6. MODULE: HASTE (Пневматический Разгон)
    event.shaped('kubejs:multitool_module_haste', [
        'SWS',
        'PAP',
        'FRF'
    ], {
        S: 'minecraft:sugar',
        W: 'minecraft:wind_charge',
        P: 'minecraft:piston',
        A: 'minecraft:golden_apple',
        F: 'minecraft:feather',
        R: 'minecraft:redstone'
    }).id('elyrium:crafting/multitool_module_haste');

    // 7. MODULE: FORTUNE (Астральная Фортуна)
    event.shaped('kubejs:multitool_module_fortune', [
        'LDL',
        'EGE',
        'LDL'
    ], {
        L: 'minecraft:lapis_block',
        D: 'minecraft:diamond',
        E: 'minecraft:emerald',
        G: 'minecraft:gold_block'
    }).id('elyrium:crafting/multitool_module_fortune');

    // 8. MODULE: SILENCE (Акустическое Глушение)
    event.shaped('kubejs:multitool_module_silence', [
        'WSW',
        'MEM',
        'WSW'
    ], {
        W: 'minecraft:black_wool',
        S: 'minecraft:sculk',
        M: 'minecraft:phantom_membrane',
        E: 'minecraft:echo_shard'
    }).id('elyrium:crafting/multitool_module_silence');
});
