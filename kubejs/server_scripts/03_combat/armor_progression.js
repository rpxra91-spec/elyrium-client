// Server script for recipes: Crafting progression items, Upgrading and Downgrading armor
ServerEvents.recipes(event => {
    // -------------------------------------------------------------
    // КРАФТ УНИКАЛЬНЫХ АРТЕФАКТОВ ПРОГРЕССИИ
    // -------------------------------------------------------------

    // 1. Крафт Сферы Возвышения (Требует побед и редких ресурсов: незеритовый лом, алмазный блок, эссенция опыта)
    event.shaped('kubejs:sphere_of_ascension', [
        ' E ',
        'NDN',
        ' E '
    ], {
        E: 'minecraft:ender_eye',
        N: 'minecraft:netherite_scrap',
        D: 'minecraft:diamond_block'
    })

    // 2. Крафт Печати Перерождения (Для смены класса внутри ранга: аметист, золото, слеза гаста)
    event.shaped('kubejs:sigil_of_transmutation', [
        ' A ',
        'GTG',
        ' A '
    ], {
        A: 'minecraft:amethyst_shard',
        G: 'minecraft:gold_ingot',
        T: 'minecraft:ghast_tear'
    })

    // 3. Крафт Эссенции Очищения (Для отката брони обратно в алмаз: лазурит, стекло, призмарин)
    event.shaped('kubejs:essence_of_purification', [
        ' L ',
        'PBP',
        ' L '
    ], {
        L: 'minecraft:lapis_lazuli',
        P: 'minecraft:prismarine_crystals',
        B: 'minecraft:glass_bottle'
    })

    // -------------------------------------------------------------
    // СМЕНА БРОНИ ВНУТРИ РАНГА (Кузнечный стол: Базовый Алмаз + Печать + Ресурс Класса)
    // -------------------------------------------------------------

    // Пример: Алмазный Нагрудник + Печать Перерождения + Железный Блок -> Тяжелый Доспех Рыцаря (Armor of the Ages)
    event.smithing(
        'armoroftheages:o_yoroi_armor_chest',      // Результат
        'kubejs:sigil_of_transmutation',           // Шаблон
        'minecraft:diamond_chestplate',            // Базовая броня
        'minecraft:iron_block'                     // Классовый катализатор
    )

    // Пример: Алмазный Нагрудник + Печать Перерождения + Огненный стержень -> Одеяние Огненосца / Мага (Hazen / Tyros)
    event.smithing(
        'hazennstuff:garments_of_the_first_flamebearer_chestplate',
        'kubejs:sigil_of_transmutation',
        'minecraft:diamond_chestplate',
        'minecraft:blaze_rod'
    )

    // -------------------------------------------------------------
    // ОТКАТ БРОНИ НАЗАД (Очищение до чистого Алмаза)
    // -------------------------------------------------------------
    // Одеяние Мага + Эссенция Очищения -> Возврат в Алмазный Нагрудник!
    event.shapeless('minecraft:diamond_chestplate', [
        'hazennstuff:garments_of_the_first_flamebearer_chestplate',
        'kubejs:essence_of_purification'
    ])

    // Доспех Самурая + Эссенция Очищения -> Возврат в Алмазный Нагрудник!
    event.shapeless('minecraft:diamond_chestplate', [
        'armoroftheages:o_yoroi_armor_chest',
        'kubejs:essence_of_purification'
    ])
})
