// ==============================================================================
// 🛠️ ELYRIUM RPG: MODULAR MULTITOOL CHASSIS & UPGRADE MODULES
// Minecraft 1.21.1 NeoForge | KubeJS Startup Script (v1.1)
// ==============================================================================
// - Registers Tier 4 (Nether) MK-I Omni-Chassis (Pickaxe, Axe, Shovel, Hoe in one).
// - Registers Tier 7 MK-II and Tier 11 MK-III Chassis for progression evolution.
// - Registers 7 Specialized Upgrade Modules (Smelting, Silk, Magnet, Radar, Haste,
//   Fortune, Silence).
// ==============================================================================

StartupEvents.registry('item', event => {

    // --------------------------------------------------------------------------
    // 1. MODULAR OMNI-CHASSIS (3 TIER GENERATIONS)
    // --------------------------------------------------------------------------

    // 1.1 MK-I: Инфернальное Шасси Мультитула (Tier 4 Nether) - 1 Слот Модулей
    event.create('modular_omni_chassis_mk1', 'pickaxe')
        .displayName('§c🔥 Инфернальное Шасси Мультитула MK-I')
        .tier('netherite')
        .speed(9.5)
        .attackDamageBaseline(6.5)
        .speedBaseline(1.1)
        .maxDamage(2500)
        .rarity('rare')
        .tag('minecraft:pickaxes')
        .tag('minecraft:axes')
        .tag('minecraft:shovels')
        .tag('minecraft:hoes')
        .tag('c:tools/pickaxes')
        .tag('c:tools/axes')
        .tag('c:tools/shovels')
        .tag('c:tools/hoes')
        .tag('c:tools')
        .tag('elyrium:modular_multitools');

    // 1.2 MK-II: Астрально-Пустотное Шасси Мультитула (Tier 7) - 2 Слота Модулей
    event.create('modular_omni_chassis_mk2', 'pickaxe')
        .displayName('§b⭐ Астрально-Пустотное Шасси MK-II')
        .tier('netherite')
        .speed(14.0)
        .attackDamageBaseline(9.0)
        .speedBaseline(1.2)
        .maxDamage(4500)
        .rarity('epic')
        .glow(true)
        .tag('minecraft:pickaxes')
        .tag('minecraft:axes')
        .tag('minecraft:shovels')
        .tag('minecraft:hoes')
        .tag('c:tools/pickaxes')
        .tag('c:tools/axes')
        .tag('c:tools/shovels')
        .tag('c:tools/hoes')
        .tag('c:tools')
        .tag('elyrium:modular_multitools');

    // 1.3 MK-III: Шасси Апогея Демиурга (Tier 11) - 4 Слота Модулей
    event.create('modular_omni_chassis_mk3', 'pickaxe')
        .displayName('§d👑 Шасси Апогея Демиурга MK-III')
        .tier('netherite')
        .speed(20.0)
        .attackDamageBaseline(12.0)
        .speedBaseline(1.3)
        .maxDamage(9000)
        .rarity('epic')
        .glow(true)
        .tag('minecraft:pickaxes')
        .tag('minecraft:axes')
        .tag('minecraft:shovels')
        .tag('minecraft:hoes')
        .tag('c:tools/pickaxes')
        .tag('c:tools/axes')
        .tag('c:tools/shovels')
        .tag('c:tools/hoes')
        .tag('c:tools')
        .tag('elyrium:modular_multitools');

    // --------------------------------------------------------------------------
    // 2. UPGRADE MODULES (7 SPECIALIZED CORES)
    // --------------------------------------------------------------------------

    // 2.1 Инфернальный Горн (Auto-Smelt)
    event.create('multitool_module_smelting')
        .displayName('§c🔥 Модуль «Инфернальный Горн»§r')
        .tooltip('§7[Модуль Мультитула: Автоплавка]')
        .tooltip('§eЭффект: §fМгновенно выплавляет слитки из сырой руды при добыче.')
        .tooltip('§6Совместимость: §fУстанавливается на Адской Наковальне в любое шасси.')
        .rarity('rare')
        .maxStackSize(16);

    // 2.2 Шелковый Резонанс (Silk Touch)
    event.create('multitool_module_silk')
        .displayName('§b✨ Модуль «Шелковый Резонанс»§r')
        .tooltip('§7[Модуль Мультитула: Шелковое Касание]')
        .tooltip('§eЭффект: §fДобывает блоки в их первозданном виде без чар.')
        .tooltip('§6Совместимость: §fУстанавливается на Адской Наковальне в любое шасси.')
        .rarity('rare')
        .maxStackSize(16);

    // 2.3 Магнитный Захват (Vacuum Drops)
    event.create('multitool_module_magnetic')
        .displayName('§e🧲 Модуль «Магнитный Захват»§r')
        .tooltip('§7[Модуль Мультитула: Вакуум]')
        .tooltip('§eЭффект: §fМгновенно притягивает добытые блоки и сферы опыта к игроку.')
        .tooltip('§6Совместимость: §fУстанавливается на Адской Наковальне в любое шасси.')
        .rarity('rare')
        .maxStackSize(16);

    // 2.4 Геологическая Линза (Prospector Radar)
    event.create('multitool_module_prospector')
        .displayName('§a🔍 Модуль «Геологическая Линза»§r')
        .tooltip('§7[Модуль Мультитула: Рудный Локатор]')
        .tooltip('§eЭффект: §fПКМ сканирует породу в радиусе 8 блоков и определяет ценные жилы.')
        .tooltip('§6Совместимость: §fУстанавливается на Адской Наковальне в любое шасси.')
        .rarity('rare')
        .maxStackSize(16);

    // 2.5 Пневматический Разгон (Haste Core)
    event.create('multitool_module_haste')
        .displayName('§f⚡ Модуль «Пневматический Разгон»§r')
        .tooltip('§7[Модуль Мультитула: Спешка]')
        .tooltip('§eЭффект: §fДарует постоянный эффект Спешки II (+30% скорость копания).')
        .tooltip('§6Совместимость: §fУстанавливается на Адской Наковальне в любое шасси.')
        .rarity('rare')
        .maxStackSize(16);

    // 2.6 Астральная Фортуна (Fortune Core)
    event.create('multitool_module_fortune')
        .displayName('§d💎 Модуль «Астральная Фортуна»§r')
        .tooltip('§7[Модуль Мультитула: Удача]')
        .tooltip('§eЭффект: §fУвеличивает выход кристаллов, алмазов и самоцветов при добыче.')
        .tooltip('§6Совместимость: §fУстанавливается на Адской Наковальне в любое шасси.')
        .rarity('rare')
        .maxStackSize(16);

    // 2.7 Акустическое Глушение (Silent Sculk)
    event.create('multitool_module_silence')
        .displayName('§8🔇 Модуль «Акустическое Глушение»§r')
        .tooltip('§7[Модуль Мультитула: Бесшумность]')
        .tooltip('§eЭффект: §fПолностью подавляет шум и вибрации добычи (Варден не реагирует).')
        .tooltip('§6Совместимость: §fУстанавливается на Адской Наковальне в любое шасси.')
        .rarity('rare')
        .maxStackSize(16);
});
