// ==============================================================================
// 🔮 ELYRIUM RPG: RUNIC ENCHANTING GLYPHS & INK REGISTRY (v2.0)
// Minecraft 1.21.1 NeoForge | KubeJS Startup Script
// ==============================================================================
// Full 8-Tier Progression Universe (+ Differentiated Ability Depths):
// - Sharpness: T1..T8 (Physical DMG)
// - Elemental: T1..T8 (Fire/Frost/Lightning DMG)
// - Vampirism: T2, T4, T6, T8 (Lifesteal)
// - Executioner: T1, T3, T5, T7 (Low HP Target Execution)
// - Protection: T1..T8 (Damage Reduction)
// - Unbreaking: T1, T2, T3, T5, T6, T8 (Durability Protection)
// - Bastion: T2, T4, T6, T8 (Shield Posture & Knockback Resist)
// - Swiftness: T1, T3, T5, T7 (Move Speed)
// - Mystic Flow: T1, T3, T5, T7 (Mana & Stamina Regen)
// ==============================================================================

StartupEvents.registry('item', event => {

    // --------------------------------------------------------------------------
    // 1. БАЗОВЫЕ МАТЕРИАЛЫ НАЧЕРТАНИЯ
    // --------------------------------------------------------------------------
    event.create('blank_runic_slate')
        .displayName('§7Пустая Рунная Плита')
        .tooltip('§8[Заготовка для Начертания]')
        .tooltip('§7Полированная каменная скрижаль с выгравированным контуром печати.')
        .tooltip('§eПрименение: §fСлужит материалом для высекания Древних Глифов в Кузнице.')
        .rarity('common')
        .maxStackSize(64)
        .tag('c:runic_materials');

    event.create('runic_ink')
        .displayName('§dРунная Тушь Начертания')
        .tooltip('§8[Катализатор Начертания Чар]')
        .tooltip('§7Магическая суспензия из аметистовой эссенции и чернил спрута.')
        .tooltip('§eПрименение: §fНеобходима для впечатывания Древних Глифов в экипировку.')
        .glow(true)
        .rarity('uncommon')
        .maxStackSize(64)
        .tag('c:runic_materials');

    // --------------------------------------------------------------------------
    // 2. РЕЕСТР ТИРОВ И ОПИСАНИЙ ДРЕВНИХ ГЛИФОВ
    // --------------------------------------------------------------------------
    const GLYPH_DEFS = [
        {
            type: 'sharpness',
            name: 'Заточка',
            color: '§c',
            slotDesc: 'Оружие Ближнего Боя',
            tiers: [1, 2, 3, 4, 5, 6, 7, 8],
            baseBonus: 3.0,
            unit: '% физ. урона'
        },
        {
            type: 'elemental',
            name: 'Стихийный Раскол',
            color: '§6',
            slotDesc: 'Оружие / Посохи',
            tiers: [1, 2, 3, 4, 5, 6, 7, 8],
            baseBonus: 2.5,
            unit: '% стихийного урона'
        },
        {
            type: 'vampirism',
            name: 'Похищение Жизни',
            color: '§5',
            slotDesc: 'Оружие Ближнего Боя',
            tiers: [2, 4, 6, 8],
            baseBonus: 1.0,
            unit: '% конверсии урона в HP'
        },
        {
            type: 'executioner',
            name: 'Казнь Палача',
            color: '§4',
            slotDesc: 'Оружие Ближнего Боя',
            tiers: [1, 3, 5, 7],
            baseBonus: 4.0,
            unit: '% урона по целям <30% HP'
        },
        {
            type: 'protection',
            name: 'Оплот',
            color: '§b',
            slotDesc: 'Любая Броня',
            tiers: [1, 2, 3, 4, 5, 6, 7, 8],
            baseBonus: 1.5,
            unit: '% снижения входящего урона'
        },
        {
            type: 'unbreaking',
            name: 'Несокрушимость',
            color: '§a',
            slotDesc: 'Оружие / Броня / Щит',
            tiers: [1, 2, 3, 5, 6, 8],
            baseBonus: 12.0,
            unit: '% сохранения прочности'
        },
        {
            type: 'bastion',
            name: 'Бастион',
            color: '§9',
            slotDesc: 'Тяжелая Броня / Щиты',
            tiers: [2, 4, 6, 8],
            baseBonus: 5.0,
            unit: '% стойки блока и анти-отбрасывания'
        },
        {
            type: 'swiftness',
            name: 'Скороход',
            color: '§e',
            slotDesc: 'Сапоги',
            tiers: [1, 3, 5, 7],
            baseBonus: 2.0,
            unit: '% скорости передвижения'
        },
        {
            type: 'mystic_flow',
            name: 'Рунный Приток',
            color: '§3',
            slotDesc: 'Шлемы / Посохи',
            tiers: [1, 3, 5, 7],
            baseBonus: 15.0,
            unit: ' маны и +5% регена стамины'
        }
    ];

    const TIER_NAMES = {
        1: 'Верхний Мир',
        2: 'Преисподняя',
        3: 'Небесный Эфир',
        4: 'Цитадели Края',
        5: 'Астральный Свод',
        6: 'Скалк-Бездна',
        7: 'Эдем',
        8: 'Мортум'
    };

    GLYPH_DEFS.forEach(g => {
        // Base / Legacy fallback item
        event.create(`glyph_${g.type}`)
            .displayName(`${g.color}✦ Древний Глиф: ${g.name} [Tier ${g.tiers[0]}] ✦`)
            .tooltip(`§8[Глиф Зачарования: ${g.slotDesc}]`)
            .tooltip(`§7Эпоха: §fTier ${g.tiers[0]} (${TIER_NAMES[g.tiers[0]]})`)
            .tooltip(`§6Базовый эффект: §f+${g.baseBonus}${g.unit}`)
            .tooltip('§b✦ Детерминированное начертание (Без ванильного рандома).')
            .tooltip('§8Лимит: максимум 2 глифа на один предмет.')
            .glow(true)
            .rarity('uncommon')
            .maxStackSize(16)
            .tag('c:glyphs')
            .tag('elyrium:enchanting_glyphs');

        // Tiered items
        g.tiers.forEach(t => {
            let itemRarity = t >= 7 ? 'epic' : (t >= 4 ? 'rare' : 'uncommon');
            let tierMult = t;
            let displayBonus = (g.baseBonus * (1 + (t - 1) * 0.35)).toFixed(1);
            if (g.type === 'vampirism') {
                displayBonus = (1.0 + (t - 2) * 0.5).toFixed(1);
            }

            event.create(`glyph_${g.type}_t${t}`)
                .displayName(`${g.color}✦ Древний Глиф: ${g.name} [Tier ${t}] ✦`)
                .tooltip(`§8[Глиф Зачарования: ${g.slotDesc}]`)
                .tooltip(`§7Эпоха: §fTier ${t} (${TIER_NAMES[t]})`)
                .tooltip(`§6Базовый эффект: §f+${displayBonus}${g.unit}`)
                .tooltip('§eСинтез: §7Повторное начертание повышает редкость (Common ➔ Legendary)!')
                .tooltip('§8Лимит: максимум 2 глифа на один предмет.')
                .glow(t >= 4)
                .rarity(itemRarity)
                .maxStackSize(16)
                .tag('c:glyphs')
                .tag('elyrium:enchanting_glyphs')
                .tag(`elyrium:glyphs_tier_${t}`);
        });
    });
});
