// ==============================================================================
// 🛠️ ELYRIUM RPG: MODULAR MULTITOOL CLIENT TOOLTIPS
// Minecraft 1.21.1 NeoForge | KubeJS Client Script (v1.1)
// ==============================================================================

const MULTITOOL_NAMES = {
    'smelting': '§c🔥 «Инфернальный Горн» (Автоплавка руды в слитки)',
    'silk': '§b✨ «Шелковый Резонанс» (Шелковое касание)',
    'magnetic': '§e🧲 «Магнитный Захват» (Притягивание дропа и XP)',
    'prospector': '§a🔍 «Геологическая Линза» (ПКМ: Рудный радар на 8 блоков)',
    'haste': '§f⚡ «Пневматический Разгон» (Постоянная Спешка II)',
    'fortune': '§d💎 «Астральная Фортуна» (Бонусный выход самоцветов)',
    'silence': '§8🔇 «Акустическое Глушение» (Бесшумная добыча блоков)'
};

ItemEvents.modifyTooltips(event => {
    const CHASSIS_ITEMS = [
        'kubejs:modular_omni_chassis_mk1',
        'kubejs:modular_omni_chassis_mk2',
        'kubejs:modular_omni_chassis_mk3'
    ];

    CHASSIS_ITEMS.forEach(chassisId => {
        event.modify(chassisId, (item, advanced, tooltip) => {
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
            tooltip.add(Text.of('§8Установка: ПКМ по Наковальне с модулем в левой руке'));
            tooltip.add(Text.of('§8Извлечение: Shift+ПКМ по Наковальне пустой рукой'));
            tooltip.add(Text.of('§8ПКМ по блокам: Обтесать бревно (Топор) / Вспахать (Мотыга)'));
            tooltip.add(Text.of('§8Shift+ПКМ по траве: Сделать тропинку (Лопата)'));
        });
    });
});
