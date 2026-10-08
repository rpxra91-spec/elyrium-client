// ==============================================================================
// 🔨 ELYRIUM RPG: SMITHING STONES & ANCIENT REINFORCEMENT ITEMS
// ==============================================================================
// Unified smithing resources across 11 Tiers for Weapons, Armor, and Shields.
// 0 Minecraft XP Levels required. Forged in Infernal Anvil (Tier 4+ Nether).
// ==============================================================================

StartupEvents.registry('item', event => {
    // 1. Tier 1-2 (+1..+3): 100%, 50%, 25% (Безопасная черта)
    event.create('smithing_stone_1')
        .displayName('§fКузнечный Оселок I§r')
        .tooltip('§7Инфернальный оселок из пепельного сплава и базальта.')
        .tooltip('§eПрименение: §fЗаточка оружия и брони §a+1..+3§f.')
        .tooltip('§a✓ Безопасная зона: §7Уровень не сбрасывается при неудаче!')
        .tooltip('§6🔥 Место ковки: §cАдская Наковальня (Tier 2+)')
        .glow(false)
        .maxStackSize(64);

    // 2. Tier 3 (+4..+6): 15%, 10%, 6%
    event.create('smithing_stone_2')
        .displayName('§bЗакалочный Камень II§r')
        .tooltip('§7Заноритовый кристалл Небесного Эфира.')
        .tooltip('§eПрименение: §fЗаточка экипировки §b+4..+6§f.')
        .tooltip('§c⚠️ Зона риска: §7Откат на -1 при неудаче (без Печати).')
        .tooltip('§6🔥 Место ковки: §cАдская Наковальня (Tier 2+)')
        .glow(false)
        .maxStackSize(64);

    // 3. Tier 4 (+7..+9): 3.5%, 2.0%, 1.0%
    event.create('smithing_stone_3')
        .displayName('§dНебесный Камень III§r')
        .tooltip('§7Кристалл Края, закаленный первородной пустотой.')
        .tooltip('§eПрименение: §fЗаточка экипировки §d+7..+9§f.')
        .tooltip('§c⚠️ Высокий риск: §7Откат на -1 при неудаче.')
        .tooltip('§6🔥 Место ковки: §cАдская Наковальня (Tier 2+)')
        .glow(true)
        .maxStackSize(64);

    // 4. Tier 5-6 (+10..+12): 0.5%, 0.25%, 0.10%
    event.create('smithing_stone_4')
        .displayName('§cАстральный Камень IV§r')
        .tooltip('§7Слиток звездного металла с резонирующим эхом скалка.')
        .tooltip('§eПрименение: §fЗаточка экипировки §c+10..+12§f.')
        .tooltip('§4⚠️ Критический риск: §7Откат на -1 при неудаче.')
        .tooltip('§6🔥 Место ковки: §cАдская Наковальня (Tier 2+)')
        .glow(true)
        .maxStackSize(64);

    // 5. Tier 7-8 (+13..+15): 0.05%, 0.02%, 0.01%
    event.create('smithing_stone_5')
        .displayName('§5⭐ Божественный Камень Мортума V§r')
        .tooltip('§7Осколок первородной регалии Владык Смерти.')
        .tooltip('§eПрименение: §fЗаточка экипировки §5+13..+15 (Апогей Бездны)§f.')
        .tooltip('§4Суровое испытание: §7Шанс на +15 равен 0.01%!')
        .tooltip('§6🔥 Место ковки: §cАдская Наковальня (Tier 2+)')
        .glow(true)
        .maxStackSize(64);

    // 6. The Single Anti-Downgrade Catalyst: Ancient Smith's Aegis
    event.create('smithing_aegis')
        .displayName('§6🛡 Печать Древнего Кузнеца§r')
        .tooltip('§7Редчайший артефакт древних мастеров-кузнецов.')
        .tooltip('§aСвойство: §fПредотвращает откат уровня (-1) при неудаче.')
        .tooltip('§eПрименение: §bУстанавливается в Слот Защиты§7 в Наковальне')
        .tooltip('§7(либо расходуется из инвентаря при быстрой ковке).')
        .tooltip('§cРасход: §7Сгорает 1 шт. только при неудачной попытке (начиная с +4).')
        .glow(true)
        .maxStackSize(64);

    // 7. Refined Netherite (Очищенный Незерит для Металлургии Т2+)
    event.create('refined_netherite_ingot')
        .displayName('§4Очищенный Незеритовый Слиток§r')
        .tooltip('§7Предельно очищенный в адском тигле незерит.')
        .tooltip('§eПрименение: §fВысокоранговая ковка брони и оружия Тира 2+.')
        .glow(true)
        .maxStackSize(64);
});
