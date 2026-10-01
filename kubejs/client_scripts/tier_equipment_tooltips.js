// ==============================================================================
// 🏛️ ELYRIUM RPG: TIER EQUIPMENT & BOSS SET TOOLTIPS (CLIENT SCRIPT)
// Minecraft 1.21.1 NeoForge | KubeJS Client Script
// ==============================================================================

ItemEvents.modifyTooltips(event => {

    // Helper function for aspect reading
    function getAspect(item) {
        if (!item) return null;
        try {
            if (item.customData && item.customData.contains('skd_class_aspect')) {
                return item.customData.getString('skd_class_aspect');
            }
            if (item.nbt && item.nbt.contains('skd_class_aspect')) {
                return item.nbt.getString('skd_class_aspect');
            }
        } catch (e) {}
        return null;
    }

    // ==========================================================================
    // 🔹 TIER 0: OVERWORLD SETS & STAFF
    // ==========================================================================

    // 1. Mage: Rift Apprentice Robe
    ['helmet', 'chestplate', 'leggings', 'boots'].forEach(slot => {
        event.modify(`kubejs:rift_apprentice_robe_${slot}`, tooltip => {
            tooltip.add(Text.of('§d✦ [Тир 0 • Мантия Ученика Разлома] ✦'));
            tooltip.add(Text.of('§7Соткана из рунной нити и кристаллов аметиста.'));
            tooltip.add(Text.of('§b• Магия: §f+15% Сила Заклинаний, +40 Мана, +15% Реген'));
            tooltip.add(Text.of('§8Вес: 1 балл (Быстрый перекат Fast Roll)'));
        });
    });

    // 2. Light: Scout Leather
    ['helmet', 'chestplate', 'leggings', 'boots'].forEach(slot => {
        event.modify(`kubejs:scout_leather_${slot}`, tooltip => {
            tooltip.add(Text.of('§e✦ [Тир 0 • Доспех Разведчика] ✦'));
            tooltip.add(Text.of('§7Закаленная медь и дубленая кожа диких рубежей.'));
            tooltip.add(Text.of('§a• Следопыт: §f+10% Скорость бега, +10% Крит, +25% Урон со спины'));
            tooltip.add(Text.of('§8Вес: 3 балла (Быстрый перекат Fast Roll)'));
        });
    });

    // 3. Medium DD: Iron Brigandine
    ['helmet', 'chestplate', 'leggings', 'boots'].forEach(slot => {
        event.modify(`kubejs:iron_brigandine_${slot}`, tooltip => {
            tooltip.add(Text.of('§f✦ [Тир 0 • Бригантина Мили ДД] ✦'));
            tooltip.add(Text.of('§7Кованые железные пластины на кожаной основе.'));
            tooltip.add(Text.of('§c• Брузер: §f+15% Физ. урон, +10% Скорость атаки, -15% Расход стамины'));
            tooltip.add(Text.of('§8Вес: 6 баллов (Средний перекат Medium Roll)'));
        });
    });

    // 4. Heavy Tank: Steel Knight
    ['helmet', 'chestplate', 'leggings', 'boots'].forEach(slot => {
        event.modify(`kubejs:steel_knight_${slot}`, tooltip => {
            tooltip.add(Text.of('§9✦ [Тир 0 • Латы Рыцаря Границы] ✦'));
            tooltip.add(Text.of('§7Закаленная дамасская сталь с алмазной гранью.'));
            tooltip.add(Text.of('§9• Танк: §fБроня 20, Твердость 4, Стойка Щита +100, 100% Гипер-броня'));
            tooltip.add(Text.of('§8Вес: 10 баллов (Тяжелый перекат Fat Roll)'));
        });
    });

    // 5. Staff T0: Rift Apprentice Staff
    event.modify('kubejs:rift_apprentice_staff', tooltip => {
        tooltip.add(Text.of('§d✦ [Тир 0 • Посох Ученика Разлома] ✦'));
        tooltip.add(Text.of('§7Древко из зачарованной древесины с аметистовым фокусом.'));
        tooltip.add(Text.of('§b• Емкость: §f12 очков заклинаний (3 ячейки)'));
        tooltip.add(Text.of('§e• Врожденное заклинание: §fМагическая Стрела I'));
        tooltip.add(Text.of('§a✓ +10% к урону всех школ магии'));
    });


    // ==========================================================================
    // 🔥 TIER 1: THE NETHER SETS & STAFF
    // ==========================================================================

    // 1. Mage: Cinder Pyro Robe
    ['helmet', 'chestplate', 'leggings', 'boots'].forEach(slot => {
        event.modify(`kubejs:cinder_pyro_robe_${slot}`, tooltip => {
            tooltip.add(Text.of('§c✦ [Тир 1 • Пепельная Мантия Пироманта] ✦'));
            tooltip.add(Text.of('§7Кварц Незера и пылающая инфернальная шерсть.'));
            tooltip.add(Text.of('§c• Пиромантия: §f+30% Урон Огнем, +70 Мана, +15 Вместимость спеллов'));
            tooltip.add(Text.of('§8Вес: 2 балла (Быстрый перекат Fast Roll)'));
        });
    });

    // 2. Light: Bastion Hunter
    ['helmet', 'chestplate', 'leggings', 'boots'].forEach(slot => {
        event.modify(`kubejs:bastion_hunter_${slot}`, tooltip => {
            tooltip.add(Text.of('§6✦ [Тир 1 • Доспех Охотника Бастионов] ✦'));
            tooltip.add(Text.of('§7Золото разрушенных бастионов и толстая шкура хоглина.'));
            tooltip.add(Text.of('§6• Следопыт Незера: §f+15% Скорость бега, +20% Крит, Пиглины нейтральны'));
            tooltip.add(Text.of('§8Вес: 3 балла (Быстрый перекат Fast Roll)'));
        });
    });

    // 3. Medium DD: Cinder Brigandine
    ['helmet', 'chestplate', 'leggings', 'boots'].forEach(slot => {
        event.modify(`kubejs:cinder_brigandine_${slot}`, tooltip => {
            tooltip.add(Text.of('§c✦ [Тир 1 • Пепельная Бригантина ДД] ✦'));
            tooltip.add(Text.of('§7Закаленный сплав базальта и адского пламени Cinder Alloy.'));
            tooltip.add(Text.of('§c• Брузер ДД: §f+20% Физ. урон, Пробой брони 25%, -25% Расход стамины'));
            tooltip.add(Text.of('§8Вес: 6 баллов (Средний перекат Medium Roll)'));
        });
    });

    // 4. Heavy Tank: Infernal Plate
    ['helmet', 'chestplate', 'leggings', 'boots'].forEach(slot => {
        event.modify(`kubejs:infernal_plate_${slot}`, tooltip => {
            tooltip.add(Text.of('§4✦ [Тир 1 • Инфернальные Латы Танка] ✦'));
            tooltip.add(Text.of('§7Монолитные плиты древнего незерита.'));
            tooltip.add(Text.of('§4• Страж Танк: §fБроня 28, Твердость 8, Стойка Щита +200, 100% Огнеупорность'));
            tooltip.add(Text.of('§8Вес: 11 баллов (Тяжелый перекат Fat Roll)'));
        });
    });

    // 5. Staff T1: Cinder Staff
    event.modify('kubejs:cinder_staff', tooltip => {
        tooltip.add(Text.of('§c✦ [Тир 1 • Инфернальный Посох Пепла] ✦'));
        tooltip.add(Text.of('§7Стержень из пепельного сплава с пламенным кристаллом.'));
        tooltip.add(Text.of('§b• Емкость: §f20 очков заклинаний (4 ячейки)'));
        tooltip.add(Text.of('§e• Врожденное заклинание: §fОгненная Стрела II'));
        tooltip.add(Text.of('§c✓ +25% к урону Школы Огня'));
    });


    // ==========================================================================
    // 👑 FIRST EPOCHAL BOSS SET: IGNIS CORE ARMOR (4 CLASS ASPECTS)
    // ==========================================================================
    ['helmet', 'chestplate', 'leggings', 'boots'].forEach(slot => {
        event.modify(`kubejs:ignis_core_${slot}`, tooltip => {
            tooltip.add(Text.of('§4👑 [ЭПОХАЛЬНЫЙ ДОСПЕХ: ЯДРО ИГНИСА] 👑'));
            tooltip.add(Text.of('§7Выкован из останков владыки адского пламени Игниса.'));
            tooltip.add(Text.of('§8────────────────────────────────'));

            let aspect = getAspect(tooltip.item);
            if (aspect === 'mage') {
                tooltip.add(Text.of('§d🔮 [Классовый Аспект: Архимаг Игниса]'));
                tooltip.add(Text.of('§b• +45% Сила Заклинаний Огня, +100 Мана, +25% Регенерация'));
                tooltip.add(Text.of('§c• Адское Пламя: Заклинания поджигают цели вечным огнем на 8с.'));
            } else if (aspect === 'scout') {
                tooltip.add(Text.of('§e🏹 [Классовый Аспект: Следопыт Игниса]'));
                tooltip.add(Text.of('§e• +25% Шанс Крита, +15% Скорость Бега, Скрытность'));
                tooltip.add(Text.of('§6• Урон из скрытности увеличен на 60%'));
            } else if (aspect === 'tank') {
                tooltip.add(Text.of('§9🛡️ [Классовый Аспект: Страж Танк]'));
                tooltip.add(Text.of('§9• Броня +32, Твердость 10, Пул Стойки Щита +300'));
                tooltip.add(Text.of('§a• 100% Гипер-броня: Полный иммунитет к сбиванию с ног'));
            } else {
                // Default: medium DD
                tooltip.add(Text.of('§c⚔️ [Классовый Аспект: Брузер ДД]'));
                tooltip.add(Text.of('§c• +20% Физический Урон, -25% Расход стамины'));
                tooltip.add(Text.of('§6• Пассивный перк «Жажда Битвы»: Серии ударов накапливают +15% урона'));
            }

            tooltip.add(Text.of('§8────────────────────────────────'));
            tooltip.add(Text.of('§7Аспект можно перековать в Кузнечном Комплексе.'));
        });
    });
});
