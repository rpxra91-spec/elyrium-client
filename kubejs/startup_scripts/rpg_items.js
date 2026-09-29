// Startup script to register unique RPG transition items & scrolls
StartupEvents.registry('item', event => {
    // 1. Сфера Возвышения (Апгрейд ранга / переход на следующий уровень)
    event.create('sphere_of_ascension')
        .displayName('§6Сфера Возвышения§r')
        .tooltip('§7Используется на Кузнечном столе для перековки экипировки на следующий тир.')
        .glow(true)
        .maxStackSize(16)

    // 2. Печать Перерождения (Смена подтипа брони внутри одного ранга: Рыцарь <-> Маг <-> Самурай)
    event.create('sigil_of_transmutation')
        .displayName('§bПечать Перерождения§r')
        .tooltip('§7Позволяет перековать броню в другой классовый сет того же ранга.')
        .glow(false)
        .maxStackSize(16)

    // 3. Эссенция Очищения (Откат брони до базового состояния / возврат в исходный алмаз)
    event.create('essence_of_purification')
        .displayName('§dЭссенция Очищения§r')
        .tooltip('§7Смывает специализированную форму и откатывает сет до чистой базовой основы.')
        .glow(true)
        .maxStackSize(16)

    // 4. Свиток Возвращения в Столицу (Subphase 6.4)
    event.create('town_scroll')
        .displayName('§aСвиток Возвращения§r')
        .tooltip('§7ПКМ для начала 5-секундного ритуала телепортации в Столицу.')
        .tooltip('§cПолучение урона или движение прерывает чтение заклинания.')
        .glow(true)
        .maxStackSize(16)

    // 5. Свиток Экстренного Побега (Subphase 6.4)
    event.create('escape_scroll')
        .displayName('§dСвиток Экстренного Побега§r')
        .tooltip('§7Мгновенный разрыв дистанции на 50 блоков назад.')
        .tooltip('§bДарует Невидимость и Скорость III на 6 секунд.')
        .glow(true)
        .maxStackSize(16)

    // 6. Тировые Артефакты Сброса Характеристик (Tiered Respec Items)
    event.create('respec_shard_copper')
        .displayName('§6Медный Осколок Очищения§r')
        .tooltip('§7Сбрасывает характеристики SimpleStats.')
        .tooltip('§eОграничение: §fУровни героя 1 – 10 (Tier 1–2).')
        .food(f => { f.nutrition(0); f.saturation(0); f.alwaysEdible(); })
        .glow(false)
        .maxStackSize(16)

    event.create('respec_shard_steel')
        .displayName('§bСтальной Осколок Очищения§r')
        .tooltip('§7Сбрасывает характеристики SimpleStats.')
        .tooltip('§eОграничение: §fУровни героя 1 – 20 (Tier 3).')
        .food(f => { f.nutrition(0); f.saturation(0); f.alwaysEdible(); })
        .glow(false)
        .maxStackSize(16)

    event.create('respec_vessel_cinder')
        .displayName('§cПепельный Сосуд Очищения§r')
        .tooltip('§7Сбрасывает характеристики SimpleStats.')
        .tooltip('§eОграничение: §fУровни героя 1 – 30 (Tier 4 Nether).')
        .food(f => { f.nutrition(0); f.saturation(0); f.alwaysEdible(); })
        .glow(true)
        .maxStackSize(16)

    event.create('respec_orb_aether')
        .displayName('§eНебесная Сфера Забвения§r')
        .tooltip('§7Сбрасывает характеристики SimpleStats.')
        .tooltip('§eОграничение: §fУровни героя 1 – 40 (Tier 5 Aether).')
        .food(f => { f.nutrition(0); f.saturation(0); f.alwaysEdible(); })
        .glow(true)
        .maxStackSize(16)

    event.create('respec_echo_void')
        .displayName('§5Эхо Бездны Очищения§r')
        .tooltip('§7Сбрасывает характеристики SimpleStats.')
        .tooltip('§eОграничение: §fУровни героя 1 – 50 (Tier 6 The End).')
        .food(f => { f.nutrition(0); f.saturation(0); f.alwaysEdible(); })
        .glow(true)
        .maxStackSize(16)

    event.create('respec_tome_divine')
        .displayName('§d⭐ Божественный Фолиант Перерождения§r')
        .tooltip('§7Сбрасывает характеристики SimpleStats.')
        .tooltip('§aУниверсальный: §fОчищает душу любого уровня (Tier 7–11).')
        .food(f => { f.nutrition(0); f.saturation(0); f.alwaysEdible(); })
        .glow(true)
        .maxStackSize(16)

    // 7. Походные Бинты Экстренной Помощи (Healing Support)
    event.create('combat_bandage')
        .displayName('§aПоходные Бинты§r')
        .tooltip('§7ПКМ для быстрой перевязки ран в бою.')
        .tooltip('§aВосстанавливает 25% максимального здоровья.')
        .tooltip('§cКулдаун: 45 секунд. Получение урона прерывает наложение.')
        .glow(false)
        .maxStackSize(16)

    // 8. Боевой Рог Провокации (WoW Tank Taunt Engine)
    event.create('war_horn_taunt')
        .displayName('§6Боевой Рог Провокации§r')
        .tooltip('§7Инструмент Танка: ПКМ для устрашающего клича.')
        .tooltip('§eПровоцирует всех врагов в радиусе 14 блоков на 4.0 сек.')
        .tooltip('§bУравнивает вашу угрозу с максимальной в группе +20%.')
        .tooltip('§cКулдаун: 20 секунд. Расходует 25 выносливости.')
        .glow(true)
        .maxStackSize(1)

    // 9. Око Испытаний Колизея (Wave Defense Gate)
    event.create('gate_pearl_colosseum')
        .displayName('§5Око Испытаний Колизея§r')
        .tooltip('§7Используется для открытия Врат Волн на Арене.')
        .tooltip('§eПризывает волны чудовищ ради сундуков с сокровищами.')
        .glow(true)
        .maxStackSize(16);

    // ==============================================================================
    // 🏛️ DUNGEON PROGRESSION & GEAR FORGING LOOP (PHASE 17)
    // ==============================================================================

    // 10. Данжевые Эссенции 8 Тиров (Dungeon Essences T1–T8)
    event.create('dungeon_essence_t1')
        .displayName('§aЭссенция Катакомб Первопроходцев I§r')
        .tooltip('§7Первичный сгусток магической силы из подземелий Оверворлда.')
        .tooltip('§e[Tier 1: Сектор I — Медный Век]')
        .tooltip('§bОбъедините 9 эссенций в верстаке 3x3 для создания Рунического Ядра I.')
        .rarity('common')
        .maxStackSize(64);

    event.create('dungeon_essence_t2')
        .displayName('§bЭссенция Рубежных Подземелий II§r')
        .tooltip('§7Закаленный сгусток энергии из аванпостов и крепостей рубежей.')
        .tooltip('§e[Tier 2: Сектор II — Железный Век]')
        .tooltip('§bОбъедините 9 эссенций в верстаке 3x3 для создания Рунического Ядра II.')
        .rarity('uncommon')
        .maxStackSize(64);

    event.create('dungeon_essence_t3')
        .displayName('§9Эссенция Черной Цитадели III§r')
        .tooltip('§7Кристаллизованная сущность древних бастионов Цитадели Малгароса.')
        .tooltip('§e[Tier 3: Сектор III — Алмазный Век]')
        .tooltip('§bОбъедините 9 эссенций в верстаке 3x3 для создания Рунического Ядра III.')
        .rarity('rare')
        .maxStackSize(64);

    event.create('dungeon_essence_t4')
        .displayName('§cПепельная Эссенция Преисподней IV§r')
        .tooltip('§7Инфернальный сгусток пламени из базальтовых недр Незера.')
        .tooltip('§e[Tier 4: Преисподняя — Пепельный Сплав]')
        .tooltip('§bОбъедините 9 эссенций в верстаке 3x3 для создания Рунического Ядра IV.')
        .glow(true)
        .rarity('rare')
        .maxStackSize(64);

    event.create('dungeon_essence_t5')
        .displayName('§eНебесная Эссенция Эфира V§r')
        .tooltip('§7Парящая эссенция света из парящих святилищ Валькирий.')
        .tooltip('§e[Tier 5: Эфир — Занорит / Небесный Нефрит]')
        .tooltip('§bОбъедините 9 эссенций в верстаке 3x3 для создания Рунического Ядра V.')
        .glow(true)
        .rarity('rare')
        .maxStackSize(64);

    event.create('dungeon_essence_t6')
        .displayName('§5Астральная Эссенция Края VI§r')
        .tooltip('§7Мерцающая ткань Бездны из залов Стражей Края.')
        .tooltip('§e[Tier 6: Край — Дыхание Дракона / Драконья Чешуя]')
        .tooltip('§bОбъедините 9 эссенций в верстаке 3x3 для создания Рунического Ядра VI.')
        .glow(true)
        .rarity('epic')
        .maxStackSize(64);

    event.create('dungeon_essence_t7')
        .displayName('§dЗвездная Эссенция Сталлайта VII§r')
        .tooltip('§7Сияющий осколок вечной ночи из хранилищ Титана Звезд.')
        .tooltip('§e[Tier 7: Вечный Сталлайт — Сплав Aethersent]')
        .tooltip('§bОбъедините 9 эссенций в верстаке 3x3 для создания Рунического Ядра VII.')
        .glow(true)
        .rarity('epic')
        .maxStackSize(64);

    event.create('dungeon_essence_t8')
        .displayName('§1Глубинная Эссенция Скалка VIII§r')
        .tooltip('§7Вибрирующий резонатор тьмы из безмолвных глубин Otherside.')
        .tooltip('§e[Tier 8: Deeper Darker — Эхо-Резонаторы / Скалк]')
        .tooltip('§bОбъедините 9 эссенций в верстаке 3x3 для создания Рунического Ядра VIII.')
        .glow(true)
        .rarity('epic')
        .maxStackSize(64);

    // 11. Рунические Ядра Подземелий 8 Тиров (Dungeon Runic Cores T1–T8)
    event.create('dungeon_core_t1')
        .displayName('§6Руническое Ядро Катакомб I§r')
        .tooltip('§7Кузнечный концентрат подземелий эпохи [Tier 1: Оверворлд].')
        .tooltip('§eНазначение: §fШаблон перековки экипировки на Столе Кузнеца.')
        .tooltip('§aПерековка: §fБазовая вещь T1 + Ядро T1 + Медный слиток = Эпик T1.')
        .rarity('epic')
        .glow(true)
        .unstackable();

    event.create('dungeon_core_t2')
        .displayName('§6Руническое Ядро Рубежей II§r')
        .tooltip('§7Кузнечный концентрат подземелий эпохи [Tier 2: Рубежи].')
        .tooltip('§eНазначение: §fШаблон перековки экипировки на Столе Кузнеца.')
        .tooltip('§aПерековка: §fБазовая вещь T2 + Ядро T2 + Железный слиток = Эпик T2.')
        .rarity('epic')
        .glow(true)
        .unstackable();

    event.create('dungeon_core_t3')
        .displayName('§6Руническое Ядро Цитадели III§r')
        .tooltip('§7Кузнечный концентрат подземелий эпохи [Tier 3: Цитадель].')
        .tooltip('§eНазначение: §fШаблон перековки экипировки на Столе Кузнеца.')
        .tooltip('§aПерековка: §fБазовая вещь T3 + Ядро T3 + Алмаз = Эпик T3.')
        .rarity('epic')
        .glow(true)
        .unstackable();

    event.create('dungeon_core_t4')
        .displayName('§6Пепельное Руническое Ядро IV§r')
        .tooltip('§7Кузнечный концентрат подземелий эпохи [Tier 4: Преисподняя].')
        .tooltip('§eНазначение: §fШаблон перековки экипировки на Столе Кузнеца.')
        .tooltip('§aПерековка: §fБазовая вещь T4 + Ядро T4 + Пепельный слиток = Эпик T4.')
        .rarity('epic')
        .glow(true)
        .unstackable();

    event.create('dungeon_core_t5')
        .displayName('§6Небесное Руническое Ядро V§r')
        .tooltip('§7Кузнечный концентрат подземелий эпохи [Tier 5: Эфир].')
        .tooltip('§eНазначение: §fШаблон перековки экипировки на Столе Кузнеца.')
        .tooltip('§aПерековка: §fБазовая вещь T5 + Ядро T5 + Занорит = Эпик T5.')
        .rarity('epic')
        .glow(true)
        .unstackable();

    event.create('dungeon_core_t6')
        .displayName('§6Астральное Руническое Ядро VI§r')
        .tooltip('§7Кузнечный концентрат подземелий эпохи [Tier 6: Край].')
        .tooltip('§eНазначение: §fШаблон перековки экипировки на Столе Кузнеца.')
        .tooltip('§aПерековка: §fБазовая вещь T6 + Ядро T6 + Дыхание дракона = Эпик T6.')
        .rarity('epic')
        .glow(true)
        .unstackable();

    event.create('dungeon_core_t7')
        .displayName('§6Звездное Руническое Ядро VII§r')
        .tooltip('§7Кузнечный концентрат подземелий эпохи [Tier 7: Сталлайт].')
        .tooltip('§eНазначение: §fШаблон перековки экипировки на Столе Кузнеца.')
        .tooltip('§aПерековка: §fБазовая вещь T7 + Ядро T7 + Слиток Aethersent = Эпик T7.')
        .rarity('epic')
        .glow(true)
        .unstackable();

    event.create('dungeon_core_t8')
        .displayName('§6Глубинное Скалковое Ядро VIII§r')
        .tooltip('§7Кузнечный концентрат подземелий эпохи [Tier 8: Глубины].')
        .tooltip('§eНазначение: §fШаблон перековки экипировки на Столе Кузнеца.')
        .tooltip('§aПерековка: §fБазовая вещь T8 + Ядро T8 + Осколок эха = Эпик T8.')
        .rarity('epic')
        .glow(true)
        .unstackable();

    // 12. Оскверненные Заготовки Экипировки (Defiled Equipment Blanks T1–T8)
    // Клинки T1–T8:
    event.create('defiled_blade_t1')
        .displayName('§cОскверненный Клинок Катакомб I§r')
        .tooltip('§c☠ Осквернено Бездной подземелья.')
        .tooltip('§6Редчайший трофей финального босса подземелья (Джекпот 5%).')
        .tooltip('§aОчищение (Верстак): §fОскверненный Клинок + Медный слиток.')
        .tooltip('§2Экономит 9 данжевых эссенций (3–4 полных похода в подземелье).')
        .rarity('rare')
        .unstackable();

    event.create('defiled_blade_t2')
        .displayName('§cОскверненный Клинок Рубежей II§r')
        .tooltip('§c☠ Осквернено Бездной подземелья.')
        .tooltip('§6Редчайший трофей финального босса подземелья (Джекпот 5%).')
        .tooltip('§aОчищение (Верстак): §fОскверненный Клинок + Железный слиток.')
        .tooltip('§2Экономит 9 данжевых эссенций (3–4 полных похода в подземелье).')
        .rarity('rare')
        .unstackable();

    event.create('defiled_blade_t3')
        .displayName('§cОскверненный Клинок Цитадели III§r')
        .tooltip('§c☠ Осквернено Бездной подземелья.')
        .tooltip('§6Редчайший трофей финального босса подземелья (Джекпот 5%).')
        .tooltip('§aОчищение (Верстак): §fОскверненный Клинок + Алмаз.')
        .tooltip('§2Экономит 9 данжевых эссенций (3–4 полных похода в подземелье).')
        .rarity('rare')
        .unstackable();

    event.create('defiled_blade_t4')
        .displayName('§cОскверненный Пепельный Клинок IV§r')
        .tooltip('§c☠ Осквернено Бездной подземелья.')
        .tooltip('§6Редчайший трофей финального босса подземелья (Джекпот 5%).')
        .tooltip('§aОчищение (Верстак): §fОскверненный Клинок + Пепельный сплав.')
        .tooltip('§2Экономит 9 данжевых эссенций (3–4 полных похода в подземелье).')
        .rarity('rare')
        .unstackable();

    event.create('defiled_blade_t5')
        .displayName('§cОскверненный Небесный Клинок V§r')
        .tooltip('§c☠ Осквернено Бездной подземелья.')
        .tooltip('§6Редчайший трофей финального босса подземелья (Джекпот 5%).')
        .tooltip('§aОчищение (Верстак): §fОскверненный Клинок + Занорит.')
        .tooltip('§2Экономит 9 данжевых эссенций (3–4 полных похода в подземелье).')
        .rarity('rare')
        .unstackable();

    event.create('defiled_blade_t6')
        .displayName('§cОскверненный Клинок Бездны VI§r')
        .tooltip('§c☠ Осквернено Бездной подземелья.')
        .tooltip('§6Редчайший трофей финального босса подземелья (Джекпот 5%).')
        .tooltip('§aОчищение (Верстак): §fОскверненный Клинок + Дыхание дракона.')
        .tooltip('§2Экономит 9 данжевых эссенций (3–4 полных похода в подземелье).')
        .rarity('rare')
        .unstackable();

    event.create('defiled_blade_t7')
        .displayName('§cОскверненный Звездный Клинок VII§r')
        .tooltip('§c☠ Осквернено Бездной подземелья.')
        .tooltip('§6Редчайший трофей финального босса подземелья (Джекпот 5%).')
        .tooltip('§aОчищение (Верстак): §fОскверненный Клинок + Слиток Aethersent.')
        .tooltip('§2Экономит 9 данжевых эссенций (3–4 полных похода в подземелье).')
        .rarity('rare')
        .unstackable();

    event.create('defiled_blade_t8')
        .displayName('§cОскверненный Скалковый Клинок VIII§r')
        .tooltip('§c☠ Осквернено Бездной подземелья.')
        .tooltip('§6Редчайший трофей финального босса подземелья (Джекпот 5%).')
        .tooltip('§aОчищение (Верстак): §fОскверненный Клинок + Осколок эха.')
        .tooltip('§2Экономит 9 данжевых эссенций (3–4 полных похода в подземелье).')
        .rarity('rare')
        .unstackable();

    // Панцири T1–T8:
    event.create('defiled_chestplate_t1')
        .displayName('§cОскверненный Панцирь Катакомб I§r')
        .tooltip('§c☠ Осквернено Бездной подземелья.')
        .tooltip('§6Редчайший трофей финального босса подземелья (Джекпот 5%).')
        .tooltip('§aОчищение (Верстак): §fОскверненный Панцирь + Медный слиток.')
        .tooltip('§2Экономит 9 данжевых эссенций (3–4 полных похода в подземелье).')
        .rarity('rare')
        .unstackable();

    event.create('defiled_chestplate_t2')
        .displayName('§cОскверненный Панцирь Рубежей II§r')
        .tooltip('§c☠ Осквернено Бездной подземелья.')
        .tooltip('§6Редчайший трофей финального босса подземелья (Джекпот 5%).')
        .tooltip('§aОчищение (Верстак): §fОскверненный Панцирь + Железный слиток.')
        .tooltip('§2Экономит 9 данжевых эссенций (3–4 полных похода в подземелье).')
        .rarity('rare')
        .unstackable();

    event.create('defiled_chestplate_t3')
        .displayName('§cОскверненный Панцирь Цитадели III§r')
        .tooltip('§c☠ Осквернено Бездной подземелья.')
        .tooltip('§6Редчайший трофей финального босса подземелья (Джекпот 5%).')
        .tooltip('§aОчищение (Верстак): §fОскверненный Панцирь + Алмаз.')
        .tooltip('§2Экономит 9 данжевых эссенций (3–4 полных похода в подземелье).')
        .rarity('rare')
        .unstackable();

    event.create('defiled_chestplate_t4')
        .displayName('§cОскверненный Пепельный Панцирь IV§r')
        .tooltip('§c☠ Осквернено Бездной подземелья.')
        .tooltip('§6Редчайший трофей финального босса подземелья (Джекпот 5%).')
        .tooltip('§aОчищение (Верстак): §fОскверненный Панцирь + Пепельный сплав.')
        .tooltip('§2Экономит 9 данжевых эссенций (3–4 полных похода в подземелье).')
        .rarity('rare')
        .unstackable();

    event.create('defiled_chestplate_t5')
        .displayName('§cОскверненный Небесный Панцирь V§r')
        .tooltip('§c☠ Осквернено Бездной подземелья.')
        .tooltip('§6Редчайший трофей финального босса подземелья (Джекпот 5%).')
        .tooltip('§aОчищение (Верстак): §fОскверненный Панцирь + Занорит.')
        .tooltip('§2Экономит 9 данжевых эссенций (3–4 полных похода в подземелье).')
        .rarity('rare')
        .unstackable();

    event.create('defiled_chestplate_t6')
        .displayName('§cОскверненный Панцирь Бездны VI§r')
        .tooltip('§c☠ Осквернено Бездной подземелья.')
        .tooltip('§6Редчайший трофей финального босса подземелья (Джекпот 5%).')
        .tooltip('§aОчищение (Верстак): §fОскверненный Панцирь + Дыхание дракона.')
        .tooltip('§2Экономит 9 данжевых эссенций (3–4 полных похода в подземелье).')
        .rarity('rare')
        .unstackable();

    event.create('defiled_chestplate_t7')
        .displayName('§cОскверненный Звездный Панцирь VII§r')
        .tooltip('§c☠ Осквернено Бездной подземелья.')
        .tooltip('§6Редчайший трофей финального босса подземелья (Джекпот 5%).')
        .tooltip('§aОчищение (Верстак): §fОскверненный Панцирь + Слиток Aethersent.')
        .tooltip('§2Экономит 9 данжевых эссенций (3–4 полных похода в подземелье).')
        .rarity('rare')
        .unstackable();

    event.create('defiled_chestplate_t8')
        .displayName('§cОскверненный Скалковый Панцирь VIII§r')
        .tooltip('§c☠ Осквернено Бездной подземелья.')
        .tooltip('§6Редчайший трофей финального босса подземелья (Джекпот 5%).')
        .tooltip('§aОчищение (Верстак): §fОскверненный Панцирь + Осколок эха.')
        .tooltip('§2Экономит 9 данжевых эссенций (3–4 полных похода в подземелье).')
        .rarity('rare')
        .unstackable();

    // 13. Очищенные Реликвии Экипировки (Purified Relic Equipment T1–T8)
    // Клинки T1–T8:
    event.create('purified_blade_t1')
        .displayName('§6⭐ Очищенный Клинок Катакомб I§r')
        .tooltip('§eДревняя реликвия подземелий, очищенная силой Медного Века.')
        .tooltip('§bПробужденная мощь эпохи [Tier 1: Оверворлд].')
        .tooltip('§dВысший кузнечный триумф подземелий Элириума.')
        .rarity('epic')
        .glow(true)
        .unstackable();

    event.create('purified_blade_t2')
        .displayName('§6⭐ Очищенный Клинок Рубежей II§r')
        .tooltip('§eДревняя реликвия подземелий, очищенная силой Железного Века.')
        .tooltip('§bПробужденная мощь эпохи [Tier 2: Рубежи].')
        .tooltip('§dВысший кузнечный триумф подземелий Элириума.')
        .rarity('epic')
        .glow(true)
        .unstackable();

    event.create('purified_blade_t3')
        .displayName('§6⭐ Очищенный Клинок Цитадели III§r')
        .tooltip('§eДревняя реликвия подземелий, очищенная силой Алмазного Века.')
        .tooltip('§bПробужденная мощь эпохи [Tier 3: Цитадель].')
        .tooltip('§dВысший кузнечный триумф подземелий Элириума.')
        .rarity('epic')
        .glow(true)
        .unstackable();

    event.create('purified_blade_t4')
        .displayName('§6⭐ Очищенный Пепельный Клинок IV§r')
        .tooltip('§eДревняя реликвия подземелий, очищенная силой Пепельного Сплава.')
        .tooltip('§bПробужденная мощь эпохи [Tier 4: Преисподняя].')
        .tooltip('§dВысший кузнечный триумф подземелий Элириума.')
        .rarity('epic')
        .glow(true)
        .unstackable();

    event.create('purified_blade_t5')
        .displayName('§6⭐ Очищенный Небесный Клинок V§r')
        .tooltip('§eДревняя реликвия подземелий, очищенная силой Занорита.')
        .tooltip('§bПробужденная мощь эпохи [Tier 5: Эфир].')
        .tooltip('§dВысший кузнечный триумф подземелий Элириума.')
        .rarity('epic')
        .glow(true)
        .unstackable();

    event.create('purified_blade_t6')
        .displayName('§6⭐ Очищенный Клинок Бездны VI§r')
        .tooltip('§eДревняя реликвия подземелий, очищенная силой Дыхания Дракона.')
        .tooltip('§bПробужденная мощь эпохи [Tier 6: Край].')
        .tooltip('§dВысший кузнечный триумф подземелий Элириума.')
        .rarity('epic')
        .glow(true)
        .unstackable();

    event.create('purified_blade_t7')
        .displayName('§6⭐ Очищенный Звездный Клинок VII§r')
        .tooltip('§eДревняя реликвия подземелий, очищенная силой Сплава Aethersent.')
        .tooltip('§bПробужденная мощь эпохи [Tier 7: Сталлайт].')
        .tooltip('§dВысший кузнечный триумф подземелий Элириума.')
        .rarity('epic')
        .glow(true)
        .unstackable();

    event.create('purified_blade_t8')
        .displayName('§6⭐ Очищенный Скалковый Клинок VIII§r')
        .tooltip('§eДревняя реликвия подземелий, очищенная силой Осколка Эха.')
        .tooltip('§bПробужденная мощь эпохи [Tier 8: Глубины].')
        .tooltip('§dВысший кузнечный триумф подземелий Элириума.')
        .rarity('epic')
        .glow(true)
        .unstackable();

    // Панцири T1–T8:
    event.create('purified_chestplate_t1')
        .displayName('§6⭐ Очищенный Панцирь Катакомб I§r')
        .tooltip('§eДревняя реликвия подземелий, очищенная силой Медного Века.')
        .tooltip('§bПробужденная мощь эпохи [Tier 1: Оверворлд].')
        .tooltip('§dВысший кузнечный триумф подземелий Элириума.')
        .rarity('epic')
        .glow(true)
        .unstackable();

    event.create('purified_chestplate_t2')
        .displayName('§6⭐ Очищенный Панцирь Рубежей II§r')
        .tooltip('§eДревняя реликвия подземелий, очищенная силой Железного Века.')
        .tooltip('§bПробужденная мощь эпохи [Tier 2: Рубежи].')
        .tooltip('§dВысший кузнечный триумф подземелий Элириума.')
        .rarity('epic')
        .glow(true)
        .unstackable();

    event.create('purified_chestplate_t3')
        .displayName('§6⭐ Очищенный Панцирь Цитадели III§r')
        .tooltip('§eДревняя реликвия подземелий, очищенная силой Алмазного Века.')
        .tooltip('§bПробужденная мощь эпохи [Tier 3: Цитадель].')
        .tooltip('§dВысший кузнечный триумф подземелий Элириума.')
        .rarity('epic')
        .glow(true)
        .unstackable();

    event.create('purified_chestplate_t4')
        .displayName('§6⭐ Очищенный Пепельный Панцирь IV§r')
        .tooltip('§eДревняя реликвия подземелий, очищенная силой Пепельного Сплава.')
        .tooltip('§bПробужденная мощь эпохи [Tier 4: Преисподняя].')
        .tooltip('§dВысший кузнечный триумф подземелий Элириума.')
        .rarity('epic')
        .glow(true)
        .unstackable();

    event.create('purified_chestplate_t5')
        .displayName('§6⭐ Очищенный Небесный Панцирь V§r')
        .tooltip('§eДревняя реликвия подземелий, очищенная силой Занорита.')
        .tooltip('§bПробужденная мощь эпохи [Tier 5: Эфир].')
        .tooltip('§dВысший кузнечный триумф подземелий Элириума.')
        .rarity('epic')
        .glow(true)
        .unstackable();

    event.create('purified_chestplate_t6')
        .displayName('§6⭐ Очищенный Панцирь Бездны VI§r')
        .tooltip('§eДревняя реликвия подземелий, очищенная силой Дыхания Дракона.')
        .tooltip('§bПробужденная мощь эпохи [Tier 6: Край].')
        .tooltip('§dВысший кузнечный триумф подземелий Элириума.')
        .rarity('epic')
        .glow(true)
        .unstackable();

    event.create('purified_chestplate_t7')
        .displayName('§6⭐ Очищенный Звездный Панцирь VII§r')
        .tooltip('§eДревняя реликвия подземелий, очищенная силой Сплава Aethersent.')
        .tooltip('§bПробужденная мощь эпохи [Tier 7: Сталлайт].')
        .tooltip('§dВысший кузнечный триумф подземелий Элириума.')
        .rarity('epic')
        .glow(true)
        .unstackable();

    event.create('purified_chestplate_t8')
        .displayName('§6⭐ Очищенный Скалковый Панцирь VIII§r')
        .tooltip('§eДревняя реликвия подземелий, очищенная силой Осколка Эха.')
        .tooltip('§bПробужденная мощь эпохи [Tier 8: Глубины].')
        .tooltip('§dВысший кузнечный триумф подземелий Элириума.')
        .rarity('epic')
        .glow(true)
        .unstackable();
})
