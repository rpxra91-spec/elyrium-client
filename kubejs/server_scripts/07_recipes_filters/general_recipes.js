// Recipes: Flesh to Leather & General Pack Recipes
ServerEvents.recipes(event => {
    // 1. Smelt / Smoke Rotten Flesh to Leather (Replaces rotten_flesh__leather mod)
    event.smelting('minecraft:leather', 'minecraft:rotten_flesh').xp(0.1).cookingTime(200)
    event.smoking('minecraft:leather', 'minecraft:rotten_flesh').xp(0.1).cookingTime(100)
    event.campfireCooking('minecraft:leather', 'minecraft:rotten_flesh').xp(0.1).cookingTime(600)

    // 2. Трансмутация: Обычный обсидиан -> Плачущий обсидиан (1 к 1 с осколком)
    event.shapeless('minecraft:crying_obsidian', [
        'minecraft:obsidian',
        'kubejs:world_heart_shard'
    ])

    // 3. Сердце Мира (Сборка из 8 осколков + алмаз в центре)
    event.shaped('kubejs:world_heart', [
        'SSS',
        'SDS',
        'SSS'
    ], {
        S: 'kubejs:world_heart_shard',
        D: 'minecraft:diamond'
    })

    // 4. Обсидиан Преисподней (Крафт рамки Инфернального Портала)
    // 3 Плачущих Обсидиана + 1 Сердце Мира -> 3 блока рамки
    event.shapeless('3x kubejs:infernal_portal_frame', [
        'minecraft:crying_obsidian',
        'minecraft:crying_obsidian',
        'minecraft:crying_obsidian',
        'kubejs:world_heart'
    ])

    // Конвертация активных блоков обратно в обычный при подборе
    event.shapeless('kubejs:infernal_portal_frame', [
        'kubejs:infernal_portal_frame_active'
    ])
    event.shapeless('kubejs:infernal_portal_frame', [
        'kubejs:infernal_portal_frame_eye_left'
    ])
    event.shapeless('kubejs:infernal_portal_frame', [
        'kubejs:infernal_portal_frame_eye_right'
    ])

    // 5. Инфернальный Ключ Разлома (Ключ портала в Преисподнюю)
    // Рецепт: Золотой слиток + Осколок Сердца Мира + Блок магмы
    event.shapeless('kubejs:infernal_igniter', [
        'minecraft:gold_ingot',
        'kubejs:world_heart_shard',
        'minecraft:magma_block'
    ])
    // Альтернативный крафт из старого огнива
    event.shapeless('kubejs:infernal_igniter', [
        'minecraft:flint_and_steel',
        'kubejs:world_heart_shard',
        'minecraft:magma_block'
    ])

    // 6. Тировые Артефакты Сброса Характеристик (Tiered Respec Recipes)
    // 6.1. Медный Осколок Очищения (Tier 1-2, до 10 уровня)
    event.shaped('kubejs:respec_shard_copper', [
        ' A ',
        'CCC',
        ' L '
    ], {
        A: 'minecraft:amethyst_shard',
        C: 'minecraft:copper_ingot',
        L: 'minecraft:leather'
    })

    // 6.2. Стальной Осколок Очищения (Tier 3, до 20 уровня)
    event.shaped('kubejs:respec_shard_steel', [
        ' D ',
        'IAI',
        ' L '
    ], {
        D: 'minecraft:diamond',
        I: 'minecraft:iron_ingot',
        A: 'minecraft:amethyst_shard',
        L: 'minecraft:lapis_lazuli'
    })

    // 6.3. Пепельный Сосуд Очищения (Tier 4 Nether, до 30 уровня)
    event.shaped('kubejs:respec_vessel_cinder', [
        ' T ',
        'MGM',
        ' B '
    ], {
        T: 'minecraft:ghast_tear',
        M: 'minecraft:magma_cream',
        G: 'minecraft:golden_apple',
        B: 'minecraft:blaze_powder'
    })

    // 6.4. Небесная Сфера Забвения (Tier 5 Aether, до 40 уровня)
    event.shaped('kubejs:respec_orb_aether', [
        ' F ',
        'GEG',
        ' F '
    ], {
        F: 'minecraft:feather',
        G: 'minecraft:glowstone_dust',
        E: 'minecraft:ender_pearl'
    })

    // 6.5. Эхо Бездны Очищения (Tier 6 The End / Warden, до 50 уровня)
    event.shaped('kubejs:respec_echo_void', [
        ' E ',
        'DOD',
        ' E '
    ], {
        E: 'minecraft:echo_shard',
        D: 'minecraft:dragon_breath',
        O: 'minecraft:crying_obsidian'
    })

    // 6.6. Бовественный Фолиант Перерождения (Tier 7-11 Endgame, универсальный)
    event.shaped('kubejs:respec_tome_divine', [
        ' N ',
        'TBT',
        ' H '
    ], {
        N: 'minecraft:nether_star',
        T: 'minecraft:totem_of_undying',
        B: 'minecraft:book',
        H: 'minecraft:heart_of_the_sea'
    })
})
