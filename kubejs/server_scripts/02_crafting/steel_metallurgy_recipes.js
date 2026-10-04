// ==============================================================================
// ⚒️ ELYRIUM RPG: STEEL METALLURGY & WORKSHOP RECIPES
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// Metallurgy Progression:
// 1. Шихта Сырой Стали (kubejs:steel_charge):
//    - 1x Железный слиток + 1x Уголь/Древесный уголь + 1x Кальцит или Глина.
// 2. Стальной Слиток (kubejs:steel_ingot):
//    - Обжиг Шихты в Доменной Печи (Blasting, 200 тиков).
// 3. Стальная Кирка (kubejs:steel_pickaxe):
//    - 3x Стальных слитка + 2x Палки (Алмазный уровень добычи).
// 4. Верстак Оружейника (kubejs:blacksmith_workbench):
//    - 2x Железных/Стальных слитка + 4x Доски.
// 5. Кузнечный Очаг / Меха (kubejs:blacksmith_hearth):
//    - Камень + Печь + Кожа (кузнечные меха).
// ==============================================================================

ServerEvents.recipes(event => {

    // --------------------------------------------------------------------------
    // 1. ШИХТА СЫРОЙ СТАЛИ (КРАФТ В ВЕРСТАКЕ)
    // --------------------------------------------------------------------------
    // Вариант 1: Железо + Уголь + Кальцит
    event.shapeless('kubejs:steel_charge', [
        'minecraft:iron_ingot',
        'minecraft:coal',
        'minecraft:calcite'
    ]).id('elyrium:metallurgy/steel_charge_calcite');

    // Вариант 2: Железо + Уголь + Глина
    event.shapeless('kubejs:steel_charge', [
        'minecraft:iron_ingot',
        'minecraft:coal',
        'minecraft:clay_ball'
    ]).id('elyrium:metallurgy/steel_charge_clay');

    // Вариант 3: Железо + Древесный уголь + Кальцит
    event.shapeless('kubejs:steel_charge', [
        'minecraft:iron_ingot',
        'minecraft:charcoal',
        'minecraft:calcite'
    ]).id('elyrium:metallurgy/steel_charge_charcoal_calcite');

    // Вариант 4: Железо + Древесный уголь + Глина
    event.shapeless('kubejs:steel_charge', [
        'minecraft:iron_ingot',
        'minecraft:charcoal',
        'minecraft:clay_ball'
    ]).id('elyrium:metallurgy/steel_charge_charcoal_clay');

    // --------------------------------------------------------------------------
    // 2. ПЕРЕПЛАВКА В СТАЛЬНОЙ СЛИТОК
    // --------------------------------------------------------------------------
    // Доменная печь (основной высокотемпературный процесс)
    event.blasting('kubejs:steel_ingot', 'kubejs:steel_charge')
        .xp(0.8)
        .cookingTime(200)
        .id('elyrium:metallurgy/steel_ingot_blasting');

    // Обычная печь (вдвое медленнее, штраф к температуре)
    event.smelting('kubejs:steel_ingot', 'kubejs:steel_charge')
        .xp(0.5)
        .cookingTime(400)
        .id('elyrium:metallurgy/steel_ingot_smelting');

    // --------------------------------------------------------------------------
    // 3. СТАЛЬНАЯ КИРКА (ПРОБИВАЕТ АЛМАЗНЫЙ БАРЬЕР)
    // --------------------------------------------------------------------------
    event.shaped('kubejs:steel_pickaxe', [
        'SSS',
        ' P ',
        ' P '
    ], {
        S: 'kubejs:steel_ingot',
        P: 'minecraft:stick'
    }).id('elyrium:tools/steel_pickaxe');

    // --------------------------------------------------------------------------
    // 4. ВЕРСТАК ОРУЖЕЙНИКА (BLACKSMITH WORKBENCH)
    // --------------------------------------------------------------------------
    event.shaped('kubejs:blacksmith_workbench', [
        'II ',
        'PP ',
        'PP '
    ], {
        I: 'minecraft:iron_ingot',
        P: '#minecraft:planks'
    }).id('elyrium:crafting/blacksmith_workbench_iron');

    event.shaped('kubejs:blacksmith_workbench', [
        'SS ',
        'PP ',
        'PP '
    ], {
        S: 'kubejs:steel_ingot',
        P: '#minecraft:planks'
    }).id('elyrium:crafting/blacksmith_workbench_steel');

    // --------------------------------------------------------------------------
    // 5. КУЗНЕЧНЫЙ ОЧАГ / МЕХА (BLACKSMITH HEARTH)
    // --------------------------------------------------------------------------
    event.shaped('kubejs:blacksmith_hearth', [
        'CCC',
        'LFL',
        'CCC'
    ], {
        C: '#minecraft:stone_tool_materials',
        F: 'minecraft:furnace',
        L: 'minecraft:leather'
    }).id('elyrium:crafting/blacksmith_hearth_leather');

    event.shaped('kubejs:blacksmith_hearth', [
        'CCC',
        'CFC',
        'CCC'
    ], {
        C: '#minecraft:stone_tool_materials',
        F: 'minecraft:blast_furnace'
    }).id('elyrium:crafting/blacksmith_hearth_blast_furnace');

    // --------------------------------------------------------------------------
    // 6. АДСКИЙ ГОРН & ПУСТОТНАЯ НАКОВАЛЬНЯ
    // --------------------------------------------------------------------------
    event.shaped('kubejs:infernal_crucible', [
        'NON',
        'BMB',
        'NNN'
    ], {
        N: 'minecraft:nether_bricks',
        O: 'minecraft:crying_obsidian',
        B: 'minecraft:blaze_rod',
        M: 'minecraft:magma_block'
    }).id('elyrium:crafting/infernal_crucible');

    event.shaped('kubejs:void_anvil', [
        'AAA',
        ' E ',
        'OOO'
    ], {
        A: 'minecraft:anvil',
        E: 'minecraft:ender_eye',
        O: 'minecraft:obsidian'
    }).id('elyrium:crafting/void_anvil');
});
