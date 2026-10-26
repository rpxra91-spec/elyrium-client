// ==============================================================================
// 🔮 ELYRIUM RPG: RUNIC GLYPHS LOOT INJECTION & RECIPES ENGINE
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// Philosophy:
// - Dungeon exploration is the PRIMARY and most lucrative source of Glyphs.
// - Crafting is a DELIBERATE, high-cost fallback (requiring 4x tier ingots + ink + trophies).
// ==============================================================================

ServerEvents.recipes(event => {

    // --------------------------------------------------------------------------
    // 1. БАЗОВЫЕ МАТЕРИАЛЫ

    // Стол Рунного Начертания (Физический станок начертания)
    event.shaped('kubejs:runic_table', [
        ' I ',
        'ASA',
        'DDD'
    ], {
        I: 'kubejs:runic_ink',
        A: 'minecraft:amethyst_shard',
        S: 'kubejs:blank_runic_slate',
        D: 'minecraft:polished_deepslate'
    });
    // --------------------------------------------------------------------------

    // Пустая Рунная Плита (2 шт)
    event.shaped('2x kubejs:blank_runic_slate', [
        ' S ',
        'SAS',
        ' S '
    ], {
        S: 'minecraft:smooth_stone',
        A: 'minecraft:amethyst_shard'
    });

    // Рунная Тушь Начертания (1 шт)
    event.shaped('kubejs:runic_ink', [
        ' A ',
        'IBI',
        ' A '
    ], {
        A: 'minecraft:amethyst_shard',
        I: 'minecraft:ink_sac',
        B: 'minecraft:glass_bottle'
    });

    // --------------------------------------------------------------------------
    // 2. КУЗНЕЧНЫЙ КРАФТ GLYPHS TIER 1 (ВЕРХНИЙ МИР)
    // Дорогостоящий рецепт: 4x Слитка Железа + Плита + Тушь + Катализатор типа
    // --------------------------------------------------------------------------

    // Заточка T1 (Физ. урон)
    event.shaped('kubejs:glyph_sharpness_t1', [
        ' I ',
        'MPM',
        ' K '
    ], {
        I: 'kubejs:runic_ink',
        M: 'minecraft:iron_ingot',
        P: 'kubejs:blank_runic_slate',
        K: 'minecraft:flint'
    });

    // Оплот T1 (Защита)
    event.shaped('kubejs:glyph_protection_t1', [
        ' I ',
        'MPM',
        ' L '
    ], {
        I: 'kubejs:runic_ink',
        M: 'minecraft:iron_ingot',
        P: 'kubejs:blank_runic_slate',
        L: 'minecraft:lapis_lazuli'
    });

    // Несокрушимость T1
    event.shaped('kubejs:glyph_unbreaking_t1', [
        ' I ',
        'MPM',
        ' O '
    ], {
        I: 'kubejs:runic_ink',
        M: 'minecraft:iron_ingot',
        P: 'kubejs:blank_runic_slate',
        O: 'minecraft:obsidian'
    });

    // Стихийный Раскол T1
    event.shaped('kubejs:glyph_elemental_t1', [
        ' I ',
        'MPM',
        ' F '
    ], {
        I: 'kubejs:runic_ink',
        M: 'minecraft:iron_ingot',
        P: 'kubejs:blank_runic_slate',
        F: 'minecraft:fire_charge'
    });

    // Казнь Палача T1
    event.shaped('kubejs:glyph_executioner_t1', [
        ' I ',
        'MPM',
        ' B '
    ], {
        I: 'kubejs:runic_ink',
        M: 'minecraft:iron_ingot',
        P: 'kubejs:blank_runic_slate',
        B: 'minecraft:bone'
    });

    // Скороход T1
    event.shaped('kubejs:glyph_swiftness_t1', [
        ' I ',
        'MPM',
        ' F '
    ], {
        I: 'kubejs:runic_ink',
        M: 'minecraft:copper_ingot',
        P: 'kubejs:blank_runic_slate',
        F: 'minecraft:feather'
    });

    // Рунный Приток T1
    event.shaped('kubejs:glyph_mystic_flow_t1', [
        ' I ',
        'MPM',
        ' R '
    ], {
        I: 'kubejs:runic_ink',
        M: 'minecraft:gold_ingot',
        P: 'kubejs:blank_runic_slate',
        R: 'minecraft:redstone'
    });

    // --------------------------------------------------------------------------
    // 3. ПОВЫШЕНИЕ ТИРА: КУЗНЕЧНЫЙ СИНТЕЗ TIER 2 (ПРЕИСПОДНЯЯ)
    // Требует: Глиф T1 + 4x Слитка Cinder / Незерита + Тушь + Огненный стержень
    // --------------------------------------------------------------------------

    // Вампиризм T2 (Дебютирует в Незере!)
    event.shaped('kubejs:glyph_vampirism_t2', [
        ' I ',
        'NPN',
        ' G '
    ], {
        I: 'kubejs:runic_ink',
        N: 'minecraft:netherite_scrap',
        P: 'kubejs:blank_runic_slate',
        G: 'minecraft:ghast_tear'
    });

    // Бастион T2 (Дебютирует в Незере!)
    event.shaped('kubejs:glyph_bastion_t2', [
        ' I ',
        'NPN',
        ' M '
    ], {
        I: 'kubejs:runic_ink',
        N: 'minecraft:netherite_scrap',
        P: 'kubejs:blank_runic_slate',
        M: 'minecraft:magma_block'
    });

    // Заточка T2
    event.shaped('kubejs:glyph_sharpness_t2', [
        ' I ',
        'NPN',
        ' B '
    ], {
        I: 'kubejs:runic_ink',
        N: 'minecraft:netherite_scrap',
        P: 'kubejs:glyph_sharpness_t1',
        B: 'minecraft:blaze_rod'
    });

    // Оплот T2
    event.shaped('kubejs:glyph_protection_t2', [
        ' I ',
        'NPN',
        ' B '
    ], {
        I: 'kubejs:runic_ink',
        N: 'minecraft:netherite_scrap',
        P: 'kubejs:glyph_protection_t1',
        B: 'minecraft:blaze_rod'
    });
});

// ------------------------------------------------------------------------------
// 4. ДАНЖЕВЫЙ ЛУТИНГ ПО МИРАМ (PRIMARY SOURCE)
// ------------------------------------------------------------------------------
if (typeof LootEvents !== 'undefined') {
    LootEvents.modify(event => {

        // Tier 1: Верхний Мир (Простые данжи, заброшенные шахты, Better Dungeons)
        event.modify([
            'minecraft:chests/simple_dungeon',
            'minecraft:chests/abandoned_mineshaft',
            'minecraft:chests/stronghold_corridor',
            'minecraft:chests/desert_pyramid',
            'minecraft:chests/jungle_temple'
        ], table => {
            table.addPool(pool => {
                pool.rolls = 1;
                pool.survivesExplosion();
                pool.addItem('kubejs:runic_ink').weight(15);
                pool.addItem('kubejs:blank_runic_slate').weight(12);
                pool.addItem('kubejs:glyph_sharpness_t1').weight(8);
                pool.addItem('kubejs:glyph_protection_t1').weight(8);
                pool.addItem('kubejs:glyph_unbreaking_t1').weight(8);
                pool.addItem('kubejs:glyph_elemental_t1').weight(6);
                pool.addItem('kubejs:glyph_executioner_t1').weight(6);
                pool.addItem('kubejs:glyph_swiftness_t1').weight(6);
                pool.addItem('kubejs:glyph_mystic_flow_t1').weight(6);
                pool.addEmpty(25); // 25% шанс пустого пула глифов
            });
        });

        // Tier 2: Преисподняя (Крепости Незера, Бастионы пиглинов)
        event.modify([
            'minecraft:chests/nether_bridge',
            'minecraft:chests/bastion_treasure',
            'minecraft:chests/bastion_other',
            'minecraft:chests/bastion_bridge'
        ], table => {
            table.addPool(pool => {
                pool.rolls = 1;
                pool.survivesExplosion();
                pool.addItem('kubejs:runic_ink').weight(15);
                pool.addItem('kubejs:glyph_sharpness_t2').weight(10);
                pool.addItem('kubejs:glyph_protection_t2').weight(10);
                pool.addItem('kubejs:glyph_unbreaking_t2').weight(8);
                pool.addItem('kubejs:glyph_elemental_t2').weight(8);
                pool.addItem('kubejs:glyph_vampirism_t2').weight(7);
                pool.addItem('kubejs:glyph_bastion_t2').weight(7);
                pool.addEmpty(35);
            });
        });

        // Tier 3: Небесный Эфир (Бронзовые, Серебряные и Золотые подземелья)
        event.modify([
            'aether:chests/dungeon/bronze/reward',
            'aether:chests/dungeon/silver/reward',
            'aether:chests/dungeon/gold/reward'
        ], table => {
            table.addPool(pool => {
                pool.rolls = 1;
                pool.survivesExplosion();
                pool.addItem('kubejs:runic_ink').weight(12);
                pool.addItem('kubejs:glyph_sharpness_t3').weight(10);
                pool.addItem('kubejs:glyph_protection_t3').weight(10);
                pool.addItem('kubejs:glyph_unbreaking_t3').weight(8);
                pool.addItem('kubejs:glyph_elemental_t3').weight(8);
                pool.addItem('kubejs:glyph_executioner_t3').weight(7);
                pool.addItem('kubejs:glyph_swiftness_t3').weight(7);
                pool.addItem('kubejs:glyph_mystic_flow_t3').weight(7);
                pool.addEmpty(30);
            });
        });

        // Tier 4: Цитадели Края (Сундуки Городов Края)
        event.modify([
            'minecraft:chests/end_city_treasure'
        ], table => {
            table.addPool(pool => {
                pool.rolls = 1;
                pool.survivesExplosion();
                pool.addItem('kubejs:runic_ink').weight(10);
                pool.addItem('kubejs:glyph_sharpness_t4').weight(10);
                pool.addItem('kubejs:glyph_protection_t4').weight(10);
                pool.addItem('kubejs:glyph_vampirism_t4').weight(8);
                pool.addItem('kubejs:glyph_bastion_t4').weight(8);
                pool.addItem('kubejs:glyph_elemental_t4').weight(8);
                pool.addEmpty(40);
            });
        });

        // Tier 6: Древние Города Скалка (Ancient City)
        event.modify([
            'minecraft:chests/ancient_city'
        ], table => {
            table.addPool(pool => {
                pool.rolls = 1;
                pool.survivesExplosion();
                pool.addItem('kubejs:runic_ink').weight(12);
                pool.addItem('kubejs:glyph_sharpness_t6').weight(8);
                pool.addItem('kubejs:glyph_protection_t6').weight(8);
                pool.addItem('kubejs:glyph_unbreaking_t6').weight(8);
                pool.addItem('kubejs:glyph_vampirism_t6').weight(6);
                pool.addItem('kubejs:glyph_bastion_t6').weight(6);
                pool.addItem('kubejs:glyph_elemental_t6').weight(6);
                pool.addEmpty(45);
            });
        });
    });
}
