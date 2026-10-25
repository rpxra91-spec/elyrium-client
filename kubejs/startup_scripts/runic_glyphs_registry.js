// ==============================================================================
// 🔮 ELYRIUM RPG: RUNIC ENCHANTING GLYPHS & INK REGISTRY
// Minecraft 1.21.1 NeoForge | KubeJS Startup Script
// ==============================================================================
// Deterministic Enchanting Engine:
// Replaces vanilla random RNG enchanting table with physical Runic Glyphs.
// Maximum 2 Glyphs per equipment item (Enchantment Capacity).
// Preserved 100% on Ascension and Tempering!
// ==============================================================================

StartupEvents.registry('item', event => {

    // 1. РУННАЯ ТУШЬ НАЧЕРТАНИЯ
    event.create('runic_ink')
        .displayName('§dРунная Тушь Начертания')
        .tooltip('§8[Катализатор Начертания Чар]')
        .tooltip('§7Особая магическая суспензия из аметистовой пыли и слез спрута.')
        .tooltip('§eПрименение: §fНеобходима для впечатывания Древних Глифов в экипировку.')
        .glow(true)
        .rarity('uncommon')
        .maxStackSize(64)
        .tag('c:runic_materials');

    // 2. ДРЕВНИЙ ГЛИФ ОСТРОТЫ
    event.create('glyph_sharpness')
        .displayName('§c✦ Древний Глиф Остроты ✦')
        .tooltip('§8[Глиф Зачарования: Оружие Ближнего Боя]')
        .tooltip('§6Эффект: §fУвеличивает весь наносимый физический урон на §c+20%§f.')
        .tooltip('§b✦ Гарантированное начертание (Без ванильного рандома).')
        .tooltip('§8Лимит: максимум 2 глифа на один предмет.')
        .glow(true)
        .rarity('rare')
        .maxStackSize(16)
        .tag('c:glyphs')
        .tag('elyrium:enchanting_glyphs');

    // 3. ДРЕВНИЙ ГЛИФ ЗАЩИТЫ
    event.create('glyph_protection')
        .displayName('§b✦ Древний Глиф Защиты ✦')
        .tooltip('§8[Глиф Зачарования: Любая Броня]')
        .tooltip('§6Эффект: §fСнижает весь получаемый входящий урон на §b+12%§f.')
        .tooltip('§b✦ Гарантированное начертание (Без ванильного рандома).')
        .tooltip('§8Лимит: максимум 2 глифа на один предмет.')
        .glow(true)
        .rarity('rare')
        .maxStackSize(16)
        .tag('c:glyphs')
        .tag('elyrium:enchanting_glyphs');

    // 4. ДРЕВНИЙ ГЛИФ НЕСОКРУШИМОСТИ
    event.create('glyph_unbreaking')
        .displayName('§a✦ Древний Глиф Несокрушимости ✦')
        .tooltip('§8[Глиф Зачарования: Оружие / Броня / Щит]')
        .tooltip('§6Эффект: §a+50%§f шанс не потратить прочность при ударе или получении урона.')
        .tooltip('§b✦ Гарантированное начертание (Без ванильного рандома).')
        .tooltip('§8Лимит: максимум 2 глифа на один предмет.')
        .glow(true)
        .rarity('rare')
        .maxStackSize(16)
        .tag('c:glyphs')
        .tag('elyrium:enchanting_glyphs');

    // 5. ДРЕВНИЙ ГЛИФ ВАМПИРИЗМА
    event.create('glyph_vampirism')
        .displayName('§5✦ Древний Глиф Вампиризма ✦')
        .tooltip('§8[Глиф Зачарования: Любое Оружие]')
        .tooltip('§6Эффект: §d+6%§f от нанесенного урона конвертируется в здоровье владельца.')
        .tooltip('§b✦ Гарантированное начертание (Без ванильного рандома).')
        .tooltip('§8Лимит: максимум 2 глифа на один предмет.')
        .glow(true)
        .rarity('epic')
        .maxStackSize(16)
        .tag('c:glyphs')
        .tag('elyrium:enchanting_glyphs');

    // 6. ДРЕВНИЙ ГЛИФ ЛЕГКОНОГОСТИ
    event.create('glyph_swiftness')
        .displayName('§e✦ Древний Глиф Легконогости ✦')
        .tooltip('§8[Глиф Зачарования: Сапоги / Поножи]')
        .tooltip('§6Эффект: §e+10%§f к скорости передвижения и ускорение отката кувырка.')
        .tooltip('§b✦ Гарантированное начертание (Без ванильного рандома).')
        .tooltip('§8Лимит: максимум 2 глифа на один предмет.')
        .glow(true)
        .rarity('rare')
        .maxStackSize(16)
        .tag('c:glyphs')
        .tag('elyrium:enchanting_glyphs');

    // 7. ДРЕВНИЙ ГЛИФ СТИХИЙНОГО ГНЕВА
    event.create('glyph_elemental')
        .displayName('§6✦ Древний Глиф Стихийного Гнева ✦')
        .tooltip('§8[Глиф Зачарования: Оружие / Посохи]')
        .tooltip('§6Эффект: §6+15%§f дополнительного стихийного урона (Огонь, Молния, Холод).')
        .tooltip('§b✦ Гарантированное начертание (Без ванильного рандома).')
        .tooltip('§8Лимит: максимум 2 глифа на один предмет.')
        .glow(true)
        .rarity('rare')
        .maxStackSize(16)
        .tag('c:glyphs')
        .tag('elyrium:enchanting_glyphs');
});
