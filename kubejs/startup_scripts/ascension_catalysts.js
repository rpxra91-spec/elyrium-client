// ==============================================================================
// 🌟 ELYRIUM RPG: ASCENSION CATALYSTS (TIERS 4-11)
// ==============================================================================
// Universal catalysts for weapon & gear evolution on the Infernal Anvil.
// Guarantees 100% preservation of reinforcement (+N), sockets, martial tablets,
// and elemental infusions.
// ==============================================================================

StartupEvents.registry('item', event => {
    // Tier 4: The Nether (Pre-requisite: Tier 3 Weapon)
    event.create('ascension_catalyst_t4')
        .displayName('§cКатализатор Возвышения IV (Инфернальный)§r')
        .tooltip('§8[Эпоха Преисподней: Тир IV]')
        .tooltip('§eПрименение: §fАдская Наковальня')
        .tooltip('§6Назначение: §7Эволюция оружия Тира III в Тир IV (Незер).')
        .tooltip('§a✓ Полное сохранение: §fЗаточка +N, сокеты, скрижали и стихии.')
        .glow(true)
        .rarity('rare')
        .maxStackSize(16);

    // Tier 5: The Aether & Deep Aether (Pre-requisite: Tier 4 Weapon)
    event.create('ascension_catalyst_t5')
        .displayName('§bКатализатор Возвышения V (Небесный)§r')
        .tooltip('§8[Эпоха Небесного Эфира: Тир V]')
        .tooltip('§eПрименение: §fАдская Наковальня')
        .tooltip('§6Назначение: §7Эволюция оружия Тира IV в Тир V (Эфир).')
        .tooltip('§a✓ Полное сохранение: §fЗаточка +N, сокеты, скрижали и стихии.')
        .glow(true)
        .rarity('rare')
        .maxStackSize(16);

    // Tier 6: The End & Void Citadels (Pre-requisite: Tier 5 Weapon)
    event.create('ascension_catalyst_t6')
        .displayName('§5Катализатор Возвышения VI (Пустотный)§r')
        .tooltip('§8[Эпоха Цитаделей Края: Тир VI]')
        .tooltip('§eПрименение: §fАдская Наковальня')
        .tooltip('§6Назначение: §7Эволюция оружия Тира V в Тир VI (Край).')
        .tooltip('§a✓ Полное сохранение: §fЗаточка +N, сокеты, скрижали и стихии.')
        .glow(true)
        .rarity('epic')
        .maxStackSize(16);

    // Tier 7: Eternal Starlight (Pre-requisite: Tier 6 Weapon)
    event.create('ascension_catalyst_t7')
        .displayName('§dКатализатор Возвышения VII (Астральный)§r')
        .tooltip('§8[Эпоха Вечного Сияния: Тир VII]')
        .tooltip('§eПрименение: §fАдская Наковальня')
        .tooltip('§6Назначение: §7Эволюция оружия Тира VI в Тир VII (Eternal Starlight).')
        .tooltip('§a✓ Полное сохранение: §fЗаточка +N, сокеты, скрижали и стихии.')
        .glow(true)
        .rarity('epic')
        .maxStackSize(16);

    // Tier 8: Deeper Darker (Otherside) (Pre-requisite: Tier 7 Weapon)
    event.create('ascension_catalyst_t8')
        .displayName('§1Катализатор Возвышения VIII (Глубинный)§r')
        .tooltip('§8[Эпоха Скалк-Бездны: Тир VIII]')
        .tooltip('§eПрименение: §fАдская Наковальня')
        .tooltip('§6Назначение: §7Эволюция оружия Тира VII в Тир VIII (Deeper Darker).')
        .tooltip('§a✓ Полное сохранение: §fЗаточка +N, сокеты, скрижали и стихии.')
        .glow(true)
        .rarity('epic')
        .maxStackSize(16);

    // Tier 9: DivineRPG Eden & Wildwood (Pre-requisite: Tier 8 Weapon)
    event.create('ascension_catalyst_t9')
        .displayName('§eКатализатор Возвышения IX (Эдемский)§r')
        .tooltip('§8[Эпоха Первородного Эдема: Тир IX]')
        .tooltip('§eПрименение: §fАдская Наковальня')
        .tooltip('§6Назначение: §7Эволюция оружия Тира VIII в Тир IX (DivineRPG Eden).')
        .tooltip('§a✓ Полное сохранение: §fЗаточка +N, сокеты, скрижали и стихии.')
        .glow(true)
        .rarity('epic')
        .maxStackSize(16);

    // Tier 10: DivineRPG Apalachia & Skythern (Pre-requisite: Tier 9 Weapon)
    event.create('ascension_catalyst_t10')
        .displayName('§6Катализатор Возвышения X (Штормовой)§r')
        .tooltip('§8[Эпоха Штормов Апалачии: Тир X]')
        .tooltip('§eПрименение: §fАдская Наковальня')
        .tooltip('§6Назначение: §7Эволюция оружия Тира IX в Тир X (DivineRPG Apalachia).')
        .tooltip('§a✓ Полное сохранение: §fЗаточка +N, сокеты, скрижали и стихии.')
        .glow(true)
        .rarity('epic')
        .maxStackSize(16);

    // Tier 11: DivineRPG Mortum (Apex Finale) (Pre-requisite: Tier 10 Weapon)
    event.create('ascension_catalyst_t11')
        .displayName('§4✦ Катализатор Возвышения XI (Апогей Мортума) ✦§r')
        .tooltip('§8[Эпоха Владык Смерти: Тир XI]')
        .tooltip('§eПрименение: §fАдская Наковальня')
        .tooltip('§6Назначение: §7Эволюция оружия Тира X в Тир XI (Кульминация Элириума).')
        .tooltip('§a✓ Полное сохранение: §fЗаточка +N, сокеты, скрижали и стихии.')
        .tooltip('§c👑 Абсолютный Финал Прогрессии Вселенной.')
        .glow(true)
        .rarity('epic')
        .maxStackSize(16);
});
