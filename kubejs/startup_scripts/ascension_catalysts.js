// ==============================================================================
// 🌟 ELYRIUM RPG: ASCENSION CATALYSTS (CANONICAL 8 TIERS)
// ==============================================================================
// Universal catalysts for weapon & gear evolution on the Infernal Anvil.
// Guarantees 100% preservation of reinforcement (+N), sockets, martial tablets,
// and elemental infusions.
//
// CANONICAL PROGRESSION:
//   T2: The Nether (Pre-requisite: Tier 1 Overworld Weapon)
//   T3: The Aether (Pre-requisite: Tier 2 Nether Weapon)
//   T4: The End (Pre-requisite: Tier 3 Aether Weapon)
//   T5: Eternal Starlight (Pre-requisite: Tier 4 End Weapon)
//   T6: Deeper Darker / Otherside (Pre-requisite: Tier 5 Starlight Weapon)
//   T7: DivineRPG Eden & Wildwood (Pre-requisite: Tier 6 Deeper Darker Weapon)
//   T8: DivineRPG Mortum Apex (Pre-requisite: Tier 7 Eden Weapon)
// ==============================================================================

StartupEvents.registry('item', event => {
    // Tier 2: The Nether (Pre-requisite: Tier 1 Weapon)
    event.create('ascension_catalyst_t2')
        .displayName('§cКатализатор Возвышения II (Инфернальный)§r')
        .tooltip('§8[Эпоха Преисподней: Тир II]')
        .tooltip('§eПрименение: §fАдская Наковальня')
        .tooltip('§6Назначение: §7Эволюция оружия Тира I в Тир II (Незер).')
        .tooltip('§a✓ Полное сохранение: §fЗаточка +N, сокеты, скрижали и стихии.')
        .glow(true)
        .rarity('rare')
        .maxStackSize(16);

    // Tier 3: The Aether & Deep Aether (Pre-requisite: Tier 2 Weapon)
    event.create('ascension_catalyst_t3')
        .displayName('§bКатализатор Возвышения III (Небесный)§r')
        .tooltip('§8[Эпоха Небесного Эфира: Тир III]')
        .tooltip('§eПрименение: §fАдская Наковальня')
        .tooltip('§6Назначение: §7Эволюция оружия Тира II в Тир III (Эфир).')
        .tooltip('§a✓ Полное сохранение: §fЗаточка +N, сокеты, скрижали и стихии.')
        .glow(true)
        .rarity('rare')
        .maxStackSize(16);

    // Tier 4: The End & Void Citadels (Pre-requisite: Tier 3 Weapon)
    event.create('ascension_catalyst_t4')
        .displayName('§5Катализатор Возвышения IV (Пустотный)§r')
        .tooltip('§8[Эпоха Цитаделей Края: Тир IV]')
        .tooltip('§eПрименение: §fАдская Наковальня')
        .tooltip('§6Назначение: §7Эволюция оружия Тира III в Тир IV (Край).')
        .tooltip('§a✓ Полное сохранение: §fЗаточка +N, сокеты, скрижали и стихии.')
        .glow(true)
        .rarity('epic')
        .maxStackSize(16);

    // Tier 5: Eternal Starlight (Pre-requisite: Tier 4 Weapon)
    event.create('ascension_catalyst_t5')
        .displayName('§dКатализатор Возвышения V (Астральный)§r')
        .tooltip('§8[Эпоха Вечного Сияния: Тир V]')
        .tooltip('§eПрименение: §fАдская Наковальня')
        .tooltip('§6Назначение: §7Эволюция оружия Тира IV в Тир V (Eternal Starlight).')
        .tooltip('§a✓ Полное сохранение: §fЗаточка +N, сокеты, скрижали и стихии.')
        .glow(true)
        .rarity('epic')
        .maxStackSize(16);

    // Tier 6: Deeper Darker (Otherside) (Pre-requisite: Tier 5 Weapon)
    event.create('ascension_catalyst_t6')
        .displayName('§1Катализатор Возвышения VI (Глубинный)§r')
        .tooltip('§8[Эпоха Скалк-Бездны: Тир VI]')
        .tooltip('§eПрименение: §fАдская Наковальня')
        .tooltip('§6Назначение: §7Эволюция оружия Тира V в Тир VI (Deeper Darker).')
        .tooltip('§a✓ Полное сохранение: §fЗаточка +N, сокеты, скрижали и стихии.')
        .glow(true)
        .rarity('epic')
        .maxStackSize(16);

    // Tier 7: DivineRPG Eden & Wildwood (Pre-requisite: Tier 6 Weapon)
    event.create('ascension_catalyst_t7')
        .displayName('§eКатализатор Возвышения VII (Эдемский)§r')
        .tooltip('§8[Эпоха Первородного Эдема: Тир VII]')
        .tooltip('§eПрименение: §fАдская Наковальня')
        .tooltip('§6Назначение: §7Эволюция оружия Тира VI в Тир VII (DivineRPG Eden).')
        .tooltip('§a✓ Полное сохранение: §fЗаточка +N, сокеты, скрижали и стихии.')
        .glow(true)
        .rarity('epic')
        .maxStackSize(16);

    // Tier 8: DivineRPG Mortum (Apex Finale) (Pre-requisite: Tier 7 Weapon)
    event.create('ascension_catalyst_t8')
        .displayName('§4✦ Катализатор Возвышения VIII (Апогей Мортума) ✦§r')
        .tooltip('§8[Эпоха Владык Смерти: Тир VIII]')
        .tooltip('§eПрименение: §fАдская Наковальня')
        .tooltip('§6Назначение: §7Эволюция оружия Тира VII в Тир VIII (Кульминация Элириума).')
        .tooltip('§a✓ Полное сохранение: §fЗаточка +N, сокеты, скрижали и стихии.')
        .tooltip('§c👑 Абсолютный Финал Прогрессии Вселенной.')
        .glow(true)
        .rarity('epic')
        .maxStackSize(16);

    // --------------------------------------------------------------------------
    // LEGACY COMPATIBILITY (T9-T11 aliases to avoid missing item errors)
    // --------------------------------------------------------------------------
    event.create('ascension_catalyst_t9')
        .displayName('§eКатализатор Возвышения (Архивный IX)§r')
        .tooltip('§7Совместимость со старыми сохранениями.')
        .maxStackSize(16);

    event.create('ascension_catalyst_t10')
        .displayName('§6Катализатор Возвышения (Архивный X)§r')
        .tooltip('§7Совместимость со старыми сохранениями.')
        .maxStackSize(16);

    event.create('ascension_catalyst_t11')
        .displayName('§4Катализатор Возвышения (Архивный XI)§r')
        .tooltip('§7Совместимость со старыми сохранениями.')
        .maxStackSize(16);
});
