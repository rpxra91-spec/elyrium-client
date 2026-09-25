// ==============================================================================
// 🔨 ELYRIUM RPG: SMITHING STONES & ANCIENT REINFORCEMENT ITEMS
// ==============================================================================
// Unified smithing resources across 11 Tiers for Weapons, Armor, and Shields.
// 0 Minecraft XP Levels required. Forged in Infernal Anvil (Tier 4+ Nether).
// ==============================================================================

StartupEvents.registry('item', event => {
    // 1. Tier 4 (The Nether): Up to +2
    event.create('smithing_stone_1')
        .displayName('§fКузнечный Оселок I§r')
        .tooltip('§7Инфернальный оселок из пепельного сплава и базальта.')
        .tooltip('§eПрименение: §fЗаточка оружия, брони и щитов до §a+2§f.')
        .tooltip('§6🔥 Место ковки: §cАдская Наковальня (Tier 4+ Незер)')
        .tooltip('§8(На обычных наковальнях Верхнего Мира закалка невозможна)')
        .glow(false)
        .maxStackSize(32);

    // 2. Tier 5 (The Aether): Up to +4
    event.create('smithing_stone_2')
        .displayName('§bНебесный Камень II§r')
        .tooltip('§7Заноритовый кристалл Небесного Эфира.')
        .tooltip('§eПрименение: §fЗаточка экипировки от §a+2§f до §a+4§f.')
        .tooltip('§6🔥 Место ковки: §cАдская Наковальня (Tier 4+)')
        .glow(false)
        .maxStackSize(32);

    // 3. Tier 6 (The End): Up to +6
    event.create('smithing_stone_3')
        .displayName('§eПустотный Камень III§r')
        .tooltip('§7Кристалл Края, закаленный дыханием дракона.')
        .tooltip('§eПрименение: §fЗаточка экипировки от §a+4§f до §a+6§f.')
        .tooltip('§cВнимание: §7С ранга +4 возможен откат уровня при неудаче!')
        .tooltip('§6🔥 Место ковки: §cАдская Наковальня (Tier 4+)')
        .glow(true)
        .maxStackSize(32);

    // 4. Tier 7-8 (Eternal Starlight & Otherside): Up to +8
    event.create('smithing_stone_4')
        .displayName('§dАстральный Камень IV§r')
        .tooltip('§7Слиток звездного металла с резонирующим эхом скалка.')
        .tooltip('§eПрименение: §fЗаточка экипировки от §a+6§f до §a+8§f.')
        .tooltip('§cВнимание: §7Высокий риск отката уровня при неудаче!')
        .tooltip('§6🔥 Место ковки: §cАдская Наковальня (Tier 4+)')
        .glow(true)
        .maxStackSize(32);

    // 5. Tier 9-11 (DivineRPG: Eden -> Mortum): Up to +10
    event.create('smithing_stone_5')
        .displayName('§c⭐ Божественный Камень Мортума V§r')
        .tooltip('§7Осколок первородной регалии Владык Смерти.')
        .tooltip('§eПрименение: §fЗаточка экипировки от §a+8§f до §6+10 (Апогей)§f.')
        .tooltip('§4Суровое испытание: §7Шанс на +10 равен 0.3%!')
        .tooltip('§6🔥 Место ковки: §cАдская Наковальня (Tier 4+)')
        .glow(true)
        .maxStackSize(16);

    // 6. The Single Anti-Downgrade Catalyst: Ancient Smith's Aegis
    event.create('smithing_aegis')
        .displayName('§6🛡 Печать Древнего Кузнеца§r')
        .tooltip('§7Редчайший артефакт древних мастеров-кузнецов.')
        .tooltip('§aСвойство: §fПредотвращает понижение уровня заточки при неудаче.')
        .tooltip('§eПрименение: §bУстанавливается в Слот 3§7 в Адской Наковальне')
        .tooltip('§7(либо работает из инвентаря при быстрой ковке).')
        .tooltip('§cРасход: §7Сгорает 1 шт. при попытке отката (с +4).')
        .glow(true)
        .maxStackSize(16);
});
