// ==============================================================================
// 🛠️ ELYRIUM RPG: MODULAR MULTITOOL CLIENT TOOLTIPS
// Minecraft 1.21.1 NeoForge | KubeJS Client Script (v1.2)
// ==============================================================================

const MULTITOOL_NAMES = {
    'smelting': '§c🔥 «Инфернальный Горн» (Автоплавка руды в слитки)',
    'silk': '§b✨ «Шелковый Резонанс» (Шелковое касание)',
    'magnetic': '§e🧲 «Магнитный Захват» (Притягивание дропа и XP)',
    'prospector': '§a🔍 «Геологическая Линза» (ПКМ: Рудный радар на 12 блоков)',
    'haste': '§f⚡ «Пневматический Разгон» (Постоянная Спешка II)',
    'fortune': '§d💎 «Астральная Фортуна» (Бонусный выход самоцветов)',
    'silence': '§8🔇 «Акустическое Глушение» (Бесшумная добыча блоков)'
};

const MODULE_TOOLTIPS = {
    'kubejs:multitool_module_smelting': [
        '§c[Модуль Мультитула • Tier 4]§r',
        '§6🔥 «Инфернальный Горн»§r',
        '§7Автоматически переплавляет добытую руду в слитки.',
        '§8Установка: Адская Наковальня (Слот II) или ПКМ по наковальне'
    ],
    'kubejs:multitool_module_silk': [
        '§b[Модуль Мультитула • Tier 6]§r',
        '§b✨ «Шелковый Резонанс»§r',
        '§7Добывает блоки в их первозданном виде (Шелковое касание).',
        '§8Установка: Адская Наковальня (Слот II) или ПКМ по наковальне'
    ],
    'kubejs:multitool_module_magnetic': [
        '§e[Модуль Мультитула • Tier 5]§r',
        '§e🧲 «Магнитный Захват»§r',
        '§7Мгновенно притягивает выпавший дроп и опыт в инвентарь игрока.',
        '§8Установка: Адская Наковальня (Слот II) или ПКМ по наковальне'
    ],
    'kubejs:multitool_module_prospector': [
        '§a[Модуль Мультитула • Tier 4]§r',
        '§a🔍 «Геологическая Линза»§r',
        '§7ПКМ по воздуху: сканирует породу в радиусе 12 блоков на наличие ценных руд.',
        '§8Установка: Адская Наковальня (Слот II) или ПКМ по наковальне'
    ],
    'kubejs:multitool_module_haste': [
        '§f[Модуль Мультитула • Tier 4]§r',
        '§f⚡ «Пневматический Разгон»§r',
        '§7Дарует пассивный эффект Спешки II, пока инструмент находится в руке.',
        '§8Установка: Адская Наковальня (Слот II) или ПКМ по наковальне'
    ],
    'kubejs:multitool_module_fortune': [
        '§d[Модуль Мультитула • Tier 5]§r',
        '§d💎 «Астральная Фортуна»§r',
        '§7Увеличивает добычу алмазов, изумрудов и редких кристаллов (Удача III-IV).',
        '§8Установка: Адская Наковальня (Слот II) или ПКМ по наковальне'
    ],
    'kubejs:multitool_module_silence': [
        '§8[Модуль Мультитула • Tier 8]§r',
        '§8🔇 «Акустическое Глушение»§r',
        '§7Подавляет вибрации скалк-сенсоров и сбрасывает агрессию Вардена.',
        '§8Установка: Адская Наковальня (Слот II) или ПКМ по наковальне'
    ]
};

ItemEvents.modifyTooltips(event => {
    const CHASSIS_ITEMS = [
        'kubejs:modular_omni_chassis_mk1',
        'kubejs:modular_omni_chassis_mk2',
        'kubejs:modular_omni_chassis_mk3'
    ];

    CHASSIS_ITEMS.forEach(chassisId => {
        event.modify(chassisId, tooltip => {
            let item = tooltip.item;
            if (!item) return;

            let isMk3 = chassisId.includes('mk3');
            let isMk2 = chassisId.includes('mk2');
            let maxSlots = isMk3 ? 4 : (isMk2 ? 2 : 1);
            let tierName = isMk3 ? 'Tier 11 • Апогей Демиурга' : (isMk2 ? 'Tier 7 • Астрально-Пустотное' : 'Tier 4 • Инфернальное');

            tooltip.add(Text.of(`§6[Универсальный Мультитул • ${tierName}]`));
            tooltip.add(Text.of('§7Совмещает инструменты: §fКирка • Топор • Лопата • Мотыга'));

            if (isMk3) {
                tooltip.add(Text.of('§d⚔ Добыча области: §f3x3 (ЛКМ) / 3x3x3 (Shift+ЛКМ)'));
            } else if (isMk2) {
                tooltip.add(Text.of('§b⚔ Добыча области: §f3x3 на Shift+ЛКМ'));
            }

            // Installed modules from item CustomData or NBT
            let installed = [];
            try {
                if (item.customData && item.customData.contains('multitool_modules')) {
                    let str = String(item.customData.getString('multitool_modules')).trim();
                    if (str) installed = str.split(',').filter(m => m.length > 0);
                } else if (item.nbt && item.nbt.contains('multitool_modules')) {
                    let str = String(item.nbt.getString('multitool_modules')).trim();
                    if (str) installed = str.split(',').filter(m => m.length > 0);
                }
            } catch (e) {}

            tooltip.add(Text.of(`§eСлоты Модулей: §a${installed.length} / ${maxSlots}`));

            for (let i = 0; i < maxSlots; i++) {
                if (i < installed.length) {
                    let key = installed[i];
                    let label = MULTITOOL_NAMES[key] || `§fМодуль «${key}»`;
                    tooltip.add(Text.of(` §7• Слот ${i + 1}: ${label}`));
                } else {
                    tooltip.add(Text.of(` §8• Слот ${i + 1}: §8[Пустой Слот Модуля]`));
                }
            }

            tooltip.add(Text.of('§8----------------------------------------'));
            tooltip.add(Text.of('§8Установка: Адская Наковальня (Слот II) или ПКМ с модулем в левой руке'));
            tooltip.add(Text.of('§8Извлечение: Shift+ПКМ по Наковальне пустой рукой'));
            tooltip.add(Text.of('§8ПКМ по блокам: Обтесать бревно (Топор) / Вспахать (Мотыга)'));
            tooltip.add(Text.of('§8Shift+ПКМ по траве: Сделать тропинку (Лопата)'));
        });
    });

    // Tooltips for individual Module items
    for (let modId in MODULE_TOOLTIPS) {
        event.modify(modId, tooltip => {
            let lines = MODULE_TOOLTIPS[modId];
            if (lines) {
                lines.forEach(line => tooltip.add(Text.of(line)));
            }
        });
    }
});
