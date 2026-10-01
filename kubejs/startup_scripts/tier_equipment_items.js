// ==============================================================================
// ⚔️ ELYRIUM RPG: TIER 0 & TIER 1 EQUIPMENT SETS & BOSS SET REGISTRATION
// Minecraft 1.21.1 NeoForge | KubeJS Startup Script
// ==============================================================================
// Registers the canonical 4 Class Sets for Tier 0 (Overworld) & Tier 1 (Nether),
// Universal Staves for both eras, and the Epochal Ignis Boss Set with 4 Class Aspects.
// ==============================================================================

StartupEvents.registry('item', event => {

    // ==========================================================================
    // 🔹 TIER 0 (OVERWORLD - SECTOR I & II): 4 CLASS SETS + UNIVERSAL STAFF
    // ==========================================================================

    // 1. MAGE: МАНТИЯ УЧЕНИКА РАЗЛОМА (Аметист + Рунная ткань)
    event.create('rift_apprentice_robe_helmet', 'helmet')
        .displayName('§dКапюшон Ученика Разлома')
        .rarity('uncommon')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:head_armor')
        .tag('c:armors')
        .tag('skd:tier_1');

    event.create('rift_apprentice_robe_chestplate', 'chestplate')
        .displayName('§dМантия Ученика Разлома')
        .rarity('uncommon')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:chest_armor')
        .tag('c:armors')
        .tag('skd:tier_1');

    event.create('rift_apprentice_robe_leggings', 'leggings')
        .displayName('§dШтаны Ученика Разлома')
        .rarity('uncommon')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:leg_armor')
        .tag('c:armors')
        .tag('skd:tier_1');

    event.create('rift_apprentice_robe_boots', 'boots')
        .displayName('§dСапоги Ученика Разлома')
        .rarity('uncommon')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:foot_armor')
        .tag('c:armors')
        .tag('skd:tier_1');

    // 2. LIGHT: КОЖАНЫЙ ДОСПЕХ РАЗВЕДЧИКА (Медь + Закаленная кожа)
    event.create('scout_leather_helmet', 'helmet')
        .displayName('§eКапюшон Разведчика')
        .rarity('common')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:head_armor')
        .tag('c:armors')
        .tag('skd:tier_1');

    event.create('scout_leather_chestplate', 'chestplate')
        .displayName('§eКожаный Доспех Разведчика')
        .rarity('common')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:chest_armor')
        .tag('c:armors')
        .tag('skd:tier_1');

    event.create('scout_leather_leggings', 'leggings')
        .displayName('§eШтаны Разведчика')
        .rarity('common')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:leg_armor')
        .tag('c:armors')
        .tag('skd:tier_1');

    event.create('scout_leather_boots', 'boots')
        .displayName('§eСапоги Разведчика')
        .rarity('common')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:foot_armor')
        .tag('c:armors')
        .tag('skd:tier_1');

    // 3. MEDIUM DD: ЖЕЛЕЗНАЯ БРИГАНТИНА ДД (Закаленное железо)
    event.create('iron_brigandine_helmet', 'helmet')
        .displayName('§fШлем Бригантины ДД')
        .rarity('common')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:head_armor')
        .tag('c:armors')
        .tag('skd:tier_2');

    event.create('iron_brigandine_chestplate', 'chestplate')
        .displayName('§fЖелезная Бригантина ДД')
        .rarity('common')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:chest_armor')
        .tag('c:armors')
        .tag('skd:tier_2');

    event.create('iron_brigandine_leggings', 'leggings')
        .displayName('§fПоножи Бригантины ДД')
        .rarity('common')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:leg_armor')
        .tag('c:armors')
        .tag('skd:tier_2');

    event.create('iron_brigandine_boots', 'boots')
        .displayName('§fСапоги Бригантины ДД')
        .rarity('common')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:foot_armor')
        .tag('c:armors')
        .tag('skd:tier_2');

    // 4. HEAVY TANK: СТАЛЬНЫЕ ЛАТЫ РЫЦАРЯ ГРАНИЦЫ (Сталь / Алмазы)
    event.create('steel_knight_helmet', 'helmet')
        .displayName('§9Шлем Рыцаря Границы')
        .rarity('uncommon')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:head_armor')
        .tag('c:armors')
        .tag('skd:tier_3');

    event.create('steel_knight_chestplate', 'chestplate')
        .displayName('§9Стальные Латы Рыцаря Границы')
        .rarity('uncommon')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:chest_armor')
        .tag('c:armors')
        .tag('skd:tier_3');

    event.create('steel_knight_leggings', 'leggings')
        .displayName('§9Поножи Рыцаря Границы')
        .rarity('uncommon')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:leg_armor')
        .tag('c:armors')
        .tag('skd:tier_3');

    event.create('steel_knight_boots', 'boots')
        .displayName('§9Сапоги Рыцаря Границы')
        .rarity('uncommon')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:foot_armor')
        .tag('c:armors')
        .tag('skd:tier_3');

    // 5. UNIVERSAL CASTER STAFF T0: ПОСОХ УЧЕНИКА РАЗЛОМА
    event.create('rift_apprentice_staff')
        .displayName('§dПосох Ученика Разлома')
        .rarity('uncommon')
        .maxDamage(600)
        .unstackable()
        .tag('c:tools')
        .tag('c:weapons')
        .tag('skd:tier_1');


    // ==========================================================================
    // 🔥 TIER 1 (THE NETHER - PREISPOДNYAYA): 4 CLASS SETS + UNIVERSAL STAFF
    // ==========================================================================

    // 1. MAGE: ПЕПЕЛЬНАЯ МАНТИЯ ПИРОМАНТА (Кварц + Пылающая шерсть)
    event.create('cinder_pyro_robe_helmet', 'helmet')
        .displayName('§cПепельный Капюшон Пироманта')
        .rarity('rare')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:head_armor')
        .tag('c:armors')
        .tag('skd:tier_4');

    event.create('cinder_pyro_robe_chestplate', 'chestplate')
        .displayName('§cПепельная Мантия Пироманта')
        .rarity('rare')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:chest_armor')
        .tag('c:armors')
        .tag('skd:tier_4');

    event.create('cinder_pyro_robe_leggings', 'leggings')
        .displayName('§cПепельные Штаны Пироманта')
        .rarity('rare')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:leg_armor')
        .tag('c:armors')
        .tag('skd:tier_4');

    event.create('cinder_pyro_robe_boots', 'boots')
        .displayName('§cПепельные Сапоги Пироманта')
        .rarity('rare')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:foot_armor')
        .tag('c:armors')
        .tag('skd:tier_4');

    // 2. LIGHT: ДОСПЕХ ОХОТНИКА БАСТИОНОВ (Золото Незера + Хоглин)
    event.create('bastion_hunter_helmet', 'helmet')
        .displayName('§6Маска Охотника Бастионов')
        .rarity('rare')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:head_armor')
        .tag('c:armors')
        .tag('skd:tier_4');

    event.create('bastion_hunter_chestplate', 'chestplate')
        .displayName('§6Доспех Охотника Бастионов')
        .rarity('rare')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:chest_armor')
        .tag('c:armors')
        .tag('skd:tier_4');

    event.create('bastion_hunter_leggings', 'leggings')
        .displayName('§6Штаны Охотника Бастионов')
        .rarity('rare')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:leg_armor')
        .tag('c:armors')
        .tag('skd:tier_4');

    event.create('bastion_hunter_boots', 'boots')
        .displayName('§6Сапоги Охотника Бастионов')
        .rarity('rare')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:foot_armor')
        .tag('c:armors')
        .tag('skd:tier_4');

    // 3. MEDIUM DD: ПЕПЕЛЬНАЯ БРИГАНТИНА ДД (Пепельный сплав Cinder Alloy)
    event.create('cinder_brigandine_helmet', 'helmet')
        .displayName('§cПепельный Шлем ДД')
        .rarity('rare')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:head_armor')
        .tag('c:armors')
        .tag('skd:tier_4');

    event.create('cinder_brigandine_chestplate', 'chestplate')
        .displayName('§cПепельная Бригантина ДД')
        .rarity('rare')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:chest_armor')
        .tag('c:armors')
        .tag('skd:tier_4');

    event.create('cinder_brigandine_leggings', 'leggings')
        .displayName('§cПепельные Поножи ДД')
        .rarity('rare')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:leg_armor')
        .tag('c:armors')
        .tag('skd:tier_4');

    event.create('cinder_brigandine_boots', 'boots')
        .displayName('§cПепельные Сапоги ДД')
        .rarity('rare')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:foot_armor')
        .tag('c:armors')
        .tag('skd:tier_4');

    // 4. HEAVY TANK: ИНФЕРНАЛЬНЫЕ ЛАТЫ ТАНКА (Незерит)
    event.create('infernal_plate_helmet', 'helmet')
        .displayName('§4Инфернальный Шлем Танка')
        .rarity('rare')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:head_armor')
        .tag('c:armors')
        .tag('skd:tier_4');

    event.create('infernal_plate_chestplate', 'chestplate')
        .displayName('§4Инфернальные Латы Танка')
        .rarity('rare')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:chest_armor')
        .tag('c:armors')
        .tag('skd:tier_4');

    event.create('infernal_plate_leggings', 'leggings')
        .displayName('§4Инфернальные Поножи Танка')
        .rarity('rare')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:leg_armor')
        .tag('c:armors')
        .tag('skd:tier_4');

    event.create('infernal_plate_boots', 'boots')
        .displayName('§4Инфернальные Сапоги Танка')
        .rarity('rare')
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:foot_armor')
        .tag('c:armors')
        .tag('skd:tier_4');

    // 5. UNIVERSAL CASTER STAFF T1: ИНФЕРНАЛЬНЫЙ ПОСОХ ПЕПЛА
    event.create('cinder_staff')
        .displayName('§cИнфернальный Посох Пепла')
        .rarity('rare')
        .maxDamage(1500)
        .unstackable()
        .tag('c:tools')
        .tag('c:weapons')
        .tag('skd:tier_4');


    // ==========================================================================
    // 👑 FIRST EPOCHAL BOSS SET: ДОСПЕХ ИСПЕПЕЛИТЕЛЯ (IGNIS CORE ARMOR)
    // 4 Craftable Class Aspects: 'mage' | 'scout' | 'medium' | 'tank'
    // ==========================================================================
    event.create('ignis_core_helmet', 'helmet')
        .displayName('§4👑 Шлем Испепелителя (Ядро Игниса)')
        .rarity('epic')
        .glow(true)
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:head_armor')
        .tag('c:armors')
        .tag('skd:tier_4');

    event.create('ignis_core_chestplate', 'chestplate')
        .displayName('§4👑 Доспех Испепелителя (Ядро Игниса)')
        .rarity('epic')
        .glow(true)
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:chest_armor')
        .tag('c:armors')
        .tag('skd:tier_4');

    event.create('ignis_core_leggings', 'leggings')
        .displayName('§4👑 Поножи Испепелителя (Ядро Игниса)')
        .rarity('epic')
        .glow(true)
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:leg_armor')
        .tag('c:armors')
        .tag('skd:tier_4');

    event.create('ignis_core_boots', 'boots')
        .displayName('§4👑 Сапоги Испепелителя (Ядро Игниса)')
        .rarity('epic')
        .glow(true)
        .unstackable()
        .tag('minecraft:armors')
        .tag('minecraft:foot_armor')
        .tag('c:armors')
        .tag('skd:tier_4');
});
