// KubeJS Startup Script: Register Tier 4 (Nether/Cinder) Items & Cores
StartupEvents.registry('item', event => {

    // === 1. INGOTS & ALLOY MATERIALS ===
    event.create('skd:cinder_alloy_ingot')
        .displayName('Слиток Пепельного Сплава')
        .rarity('uncommon')
        .glow(true)

    // === 2. SMITHING CORES (ХРАНИТЕЛИ ЧАР И СОКЕТОВ) ===
    event.create('skd:weapon_core_t4')
        .displayName('Пепельное Ядро Клинков (Т4-1)')
        .rarity('rare')
        .unstackable()
        .glow(true)

    event.create('skd:ranged_core_t4')
        .displayName('Пепельное Ядро Стрелка (Т4-1)')
        .rarity('rare')
        .unstackable()
        .glow(true)

    event.create('skd:tool_core_t4')
        .displayName('Пепельное Ядро Дробителя (Т4-1)')
        .rarity('rare')
        .unstackable()
        .glow(true)

    // === 3. TIER 4-1 CINDER ARSENAL (WEAPONS) ===
    // 1. Катана (Быстрый клинок: урон 8.0, скорость 1.6)
    event.create('skd:cinder_katana', 'sword')
        .displayName('Пепельная Катана')
        .tier('netherite')
        .attackDamageBaseline(8.0)
        .speedBaseline(1.6)
        .rarity('rare')

    // 2. Длинный меч (Классика: урон 9.5, скорость 1.4)
    event.create('skd:cinder_longsword', 'sword')
        .displayName('Пепельный Длинный Меч')
        .tier('netherite')
        .attackDamageBaseline(9.5)
        .speedBaseline(1.4)
        .rarity('rare')

    // 3. Клеймор (Тяжелый двуручник: урон 11.0, скорость 1.0)
    event.create('skd:cinder_claymore', 'sword')
        .displayName('Пепельный Клеймор')
        .tier('netherite')
        .attackDamageBaseline(11.0)
        .speedBaseline(1.0)
        .rarity('rare')

    // 4. Коса (Жатва / Сплеш: урон 10.0, скорость 1.1)
    event.create('skd:cinder_scythe', 'sword')
        .displayName('Пепельная Коса')
        .tier('netherite')
        .attackDamageBaseline(10.0)
        .speedBaseline(1.1)
        .rarity('rare')

    // === 4. TIER 4-1 RANGED (BOW) ===
    event.create('skd:cinder_bow')
        .displayName('Пепельный Составной Лук')
        .maxDamage(1200)
        .rarity('rare')

    // === 5. TIER 4-1 MULTI-TOOL (3-IN-1: PICKAXE + AXE + SHOVEL, NO HOE) ===
    // Базовая скорость 9.5, прочность 2400, уровень добычи Netherite
    event.create('skd:cinder_breaker', 'pickaxe')
        .displayName('Пепельный Дробитель (3-в-1)')
        .tier('netherite')
        .speed(9.5)
        .attackDamageBaseline(6.0)
        .speedBaseline(1.1)
        .maxDamage(2400)
        .rarity('rare')
        .tag('minecraft:mineable/pickaxe')
        .tag('minecraft:mineable/axe')
        .tag('minecraft:mineable/shovel')
        .tag('c:tools/pickaxes')
        .tag('c:tools/axes')
        .tag('c:tools/shovels')
})
