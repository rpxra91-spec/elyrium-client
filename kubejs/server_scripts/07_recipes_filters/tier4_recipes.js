// KubeJS Server Script: Tier 4 Recipes (Alloy Crafting, Smithing & Stonecutter Respec)
ServerEvents.recipes(event => {

    // === 1. СЛИВАНИЕ РУД НЕЗЕРА -> СЛИТОК ПЕПЕЛЬНОГО СПЛАВА ===
    // 4 Базальта + 2 Кварца + 2 Золота + 1 Незеритовый обломок = Слиток Пепельного Сплава
    event.shaped('skd:cinder_alloy_ingot', [
        'BKB',
        'ZNZ',
        'BKB'
    ], {
        B: 'minecraft:basalt',
        K: 'minecraft:quartz',
        Z: 'minecraft:gold_ingot',
        N: 'minecraft:netherite_scrap'
    })

    // === 2. SMITHING TABLE: АЛМАЗ (Т3) + СПЛАВ -> ЯДРО Т4-1 ===
    // Рецепт Smithing Transform (копирует NBT через событие или рецепт)
    // 1. Для оружия:
    event.smithing(
        'skd:weapon_core_t4',
        'minecraft:netherite_upgrade_smithing_template',
        '#c:tools/swords',
        'skd:cinder_alloy_ingot'
    )

    // 2. Для луков:
    event.smithing(
        'skd:ranged_core_t4',
        'minecraft:netherite_upgrade_smithing_template',
        '#c:tools/bows',
        'skd:cinder_alloy_ingot'
    )

    // 3. Для инструментов:
    event.smithing(
        'skd:tool_core_t4',
        'minecraft:netherite_upgrade_smithing_template',
        '#c:tools/pickaxes',
        'skd:cinder_alloy_ingot'
    )

    // === 3. STONECUTTER: БЕСПЛАТНЫЙ РЕСПЕК В ЛЮБОЙ АРХЕТИП Т4-1 ===
    // Из Ядра Клинков -> выбор любого оружия
    event.stonecutting('skd:cinder_katana', 'skd:weapon_core_t4')
    event.stonecutting('skd:cinder_longsword', 'skd:weapon_core_t4')
    event.stonecutting('skd:cinder_claymore', 'skd:weapon_core_t4')
    event.stonecutting('skd:cinder_scythe', 'skd:weapon_core_t4')

    // Обратная конвертация любого оружия Т4-1 обратно в Ядро (для смены стиля)
    event.stonecutting('skd:weapon_core_t4', 'skd:cinder_katana')
    event.stonecutting('skd:weapon_core_t4', 'skd:cinder_longsword')
    event.stonecutting('skd:weapon_core_t4', 'skd:cinder_claymore')
    event.stonecutting('skd:weapon_core_t4', 'skd:cinder_scythe')

    // Для лука (поддерживаем и нативный боевой лонгбоу archers:netherite_longbow)
    event.stonecutting('archers:netherite_longbow', 'skd:ranged_core_t4')
    event.stonecutting('skd:ranged_core_t4', 'archers:netherite_longbow')
    event.stonecutting('skd:cinder_bow', 'skd:ranged_core_t4')
    event.stonecutting('skd:ranged_core_t4', 'skd:cinder_bow')

    // Для мульти-инструмента
    event.stonecutting('skd:cinder_breaker', 'skd:tool_core_t4')
    event.stonecutting('skd:tool_core_t4', 'skd:cinder_breaker')
})
