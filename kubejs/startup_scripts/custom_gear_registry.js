// ==============================================================================
// 🏛️ ELYRIUM RPG: MASTER CUSTOM GEAR & WEAPON ARSENAL REGISTRY
// Minecraft 1.21.1 NeoForge | KubeJS Startup Script
// ==============================================================================
// Registers missing items, armor sets, 15 SimplySwords archetypes (T4-T8),
// quivers, and boss curios accessories per 03_TIER_EQUIPMENT_AND_LOOT_CATALOG.md
// ==============================================================================

StartupEvents.registry('item', event => {

    // ==========================================================================
    // 🏹 I. CUSTOM QUIVERS (CURIOS: QUIVER)
    // ==========================================================================
    const quivers = [
        { id: 'cloggrum_quiver', name: '§2Клоггрумовый Колчан Катакомб', rarity: 'uncommon', tier: 'skd:tier_1_5' },
        { id: 'aether_feather_quiver', name: '§bНебесный Колчан Невесомости Эфира', rarity: 'rare', tier: 'skd:tier_3' },
        { id: 'void_quiver', name: '§5Пустотный Колчан Бездны', rarity: 'epic', tier: 'skd:tier_4' },
        { id: 'sculk_quiver', name: '§3Скалк-Колчан Звукового Резонанса', rarity: 'epic', tier: 'skd:tier_6' },
        { id: 'nature_quiver', name: '§aПриродный Колчан Диколесья', rarity: 'epic', tier: 'skd:tier_7' },
        { id: 'mortum_quiver', name: '§4Колчан Вечной Смерти Мортума', rarity: 'epic', tier: 'skd:tier_8' }
    ];

    quivers.forEach(q => {
        event.create(q.id)
            .displayName(q.name)
            .rarity(q.rarity)
            .unstackable()
            .tag('curios:quiver')
            .tag('c:quivers')
            .tag(q.tier);
    });

    // ==========================================================================
    // ⚔️ II. CANONICAL ARMOR & WEAPON PROGRESSION (NATIVE INTEGRATION)
    // ==========================================================================
    // Вся экипировка и оружие 8 Тиров строятся на НАСТОЯЩИХ моделях и механиках
    // SimplySwords, Armor of the Ages, Cataclysm, Aether, Undergarden, Starlight,
    // Deeper Darker и DivineRPG без создания пустых суррогатных дубликатов.


    // ==========================================================================
    // 👑 IV. CUSTOM UNIQUE BOSS WEAPONS
    // ==========================================================================
    const bossWeapons = [
        // T1
        { id: 'ancient_remnant_sword', name: '§6Меч Древнего Остана', type: 'sword', dmg: 8.5, spd: 1.3, rarity: 'rare', tier: 'skd:tier_1', durability: 1200 },
        // T1.5
        { id: 'undergarden_spore_bow', name: '§2Грибной Лук Катакомб', type: 'item', rarity: 'rare', tier: 'skd:tier_1_5', durability: 1500 },
        // T6
        { id: 'soul_crystal_greatsword', name: '§3Soul Crystal Greatsword', type: 'sword', dmg: 20.0, spd: 0.95, rarity: 'epic', tier: 'skd:tier_6', durability: 4000 },
        { id: 'echo_resonance_staff', name: '§bEcho Resonance Staff', type: 'item', rarity: 'epic', tier: 'skd:tier_6', durability: 4000 },
        { id: 'warden_tendril_blade', name: '§3Warden Tendril Blade', type: 'sword', dmg: 16.5, spd: 1.7, rarity: 'epic', tier: 'skd:tier_6', durability: 4000 },
        { id: 'sonic_pulverizer_bow', name: '§3Sonic Pulverizer Bow', type: 'item', rarity: 'epic', tier: 'skd:tier_6', durability: 4000 },
        { id: 'sculk_whisper_dagger', name: '§8Скалковый Кинжал Шепота', type: 'sword', dmg: 14.0, spd: 3.0, rarity: 'epic', tier: 'skd:tier_6', durability: 3500 },
        // T7
        { id: 'wildwood_elder_staff', name: '§2Staff of the Wildwood Elder', type: 'item', rarity: 'epic', tier: 'skd:tier_7', durability: 5000 },
        { id: 'eden_solar_glaive', name: '§eEden Solar Glaive', type: 'sword', dmg: 19.5, spd: 1.3, rarity: 'epic', tier: 'skd:tier_7', durability: 5000 },
        // T8
        { id: 'halite_greatblade', name: '§dHalite Greatblade', type: 'sword', dmg: 26.5, spd: 0.95, rarity: 'epic', tier: 'skd:tier_8', durability: 6500 },
        { id: 'mortum_death_scythe', name: '§4Mortum Death Scythe', type: 'sword', dmg: 23.5, spd: 1.2, rarity: 'epic', tier: 'skd:tier_8', durability: 6500 },
        { id: 'skythern_storm_bow', name: '§9Skythern Storm Bow', type: 'item', rarity: 'epic', tier: 'skd:tier_8', durability: 6500 },
        { id: 'apalachia_crystal_staff', name: '§5Apalachia Crystal Staff', type: 'item', rarity: 'epic', tier: 'skd:tier_8', durability: 6500 },
        { id: 'halite_demigod_spear', name: '§dHalite Demigod Spear', type: 'sword', dmg: 22.0, spd: 1.4, rarity: 'epic', tier: 'skd:tier_8', durability: 6500 }
    ];

    bossWeapons.forEach(w => {
        if (w.type === 'sword') {
            event.create(w.id, 'sword')
                .displayName(w.name)
                .tier('netherite')
                .attackDamageBaseline(w.dmg)
                .speedBaseline(w.spd)
                .maxDamage(w.durability)
                .rarity(w.rarity)
                .glow(true)
                .unstackable()
                .tag('minecraft:swords')
                .tag('c:weapons')
                .tag('c:tools')
                .tag(w.tier);
        } else {
            event.create(w.id)
                .displayName(w.name)
                .maxDamage(w.durability)
                .rarity(w.rarity)
                .glow(true)
                .unstackable()
                .tag('c:weapons')
                .tag('c:tools')
                .tag(w.tier);
        }
    });

    // ==========================================================================
    // 📿 V. CUSTOM CURIOS & ACCESSORIES
    // ==========================================================================
    const curiosAccessories = [
        // T1.5
        { id: 'froststeel_ring', name: '§bКольцо Морозной Стали', slot: 'ring', rarity: 'rare', tier: 'skd:tier_1_5' },
        { id: 'forgotten_guardian_heart', name: '§8Сердце Забытого Стража', slot: 'necklace', rarity: 'rare', tier: 'skd:tier_1_5' },
        { id: 'root_belt', name: '§2Пояс Корней Катакомб', slot: 'belt', rarity: 'rare', tier: 'skd:tier_1_5' },
        { id: 'spore_charm', name: '§aСпоровый Талисман', slot: 'charm', rarity: 'rare', tier: 'skd:tier_1_5' },

        // T3
        { id: 'storm_ring', name: '§9Громовое Кольцо Эфира', slot: 'ring', rarity: 'rare', tier: 'skd:tier_3' },

        // T4
        { id: 'void_shift_ring', name: '§5Кольцо Пространственного Сдвига', slot: 'ring', rarity: 'rare', tier: 'skd:tier_4' },
        { id: 'cursium_amulet', name: '§dАмулет Пустоты Cursium', slot: 'necklace', rarity: 'rare', tier: 'skd:tier_4' },

        // T6
        { id: 'warden_heart_curio', name: '§3Сердце Вардена', slot: 'necklace', rarity: 'epic', tier: 'skd:tier_6' },
        { id: 'true_darkness_ring', name: '§8Кольцо Истинной Тьмы', slot: 'ring', rarity: 'epic', tier: 'skd:tier_6' },
        { id: 'depth_echo_resonator', name: '§3Эхо-Резонатор Глубин', slot: 'charm', rarity: 'epic', tier: 'skd:tier_6' },
        { id: 'sculk_tendril_belt', name: '§3Пояс Скалк-Усиков', slot: 'belt', rarity: 'epic', tier: 'skd:tier_6' },
        { id: 'silent_stalker_boots', name: '§8Бесшумные Сапоги Сталкера', slot: 'feet', rarity: 'epic', tier: 'skd:tier_6' },
        { id: 'abyssal_shroud_cloak', name: '§8Плащ Глубинного Мрака', slot: 'back', rarity: 'epic', tier: 'skd:tier_6' },

        // T7
        { id: 'eden_sun_ring', name: '§eКольцо Солнечного Эдема', slot: 'ring', rarity: 'epic', tier: 'skd:tier_7' },
        { id: 'primordial_tree_heart', name: '§2Сердце Первородного Древа', slot: 'charm', rarity: 'epic', tier: 'skd:tier_7' },
        { id: 'eden_blossom_pendant', name: '§eКулон Цветущих Небес', slot: 'necklace', rarity: 'epic', tier: 'skd:tier_7' },
        { id: 'wildwood_giant_belt', name: '§aПояс Древесного Исполина', slot: 'belt', rarity: 'epic', tier: 'skd:tier_7' },
        { id: 'eden_petal_cloak', name: '§eПлащ Солнечных Лепестков', slot: 'back', rarity: 'epic', tier: 'skd:tier_7' },
        { id: 'forest_strider_boots', name: '§aСапоги Лесного Скитальца', slot: 'feet', rarity: 'epic', tier: 'skd:tier_7' },

        // T8
        { id: 'halite_ring_of_power', name: '§dКольцо Всевластия Халита', slot: 'ring', rarity: 'epic', tier: 'skd:tier_8' },
        { id: 'eye_of_ancient_entity', name: '§dОко Древней Сущности', slot: 'charm', rarity: 'epic', tier: 'skd:tier_8' },
        { id: 'skythern_storm_heart', name: '§9Сердце Бури Скайтерна', slot: 'necklace', rarity: 'epic', tier: 'skd:tier_8' },
        { id: 'apalachia_mind_crystal', name: '§5Кристалл Апалачии Высшего Разума', slot: 'charm', rarity: 'epic', tier: 'skd:tier_8' },
        { id: 'mortum_death_shroud', name: '§4Саван Мортума', slot: 'back', rarity: 'epic', tier: 'skd:tier_8' },
        { id: 'apex_titan_belt', name: '§dПояс Абсолютного Титана', slot: 'belt', rarity: 'epic', tier: 'skd:tier_8' }
    ];

    curiosAccessories.forEach(c => {
        event.create(c.id)
            .displayName(c.name)
            .rarity(c.rarity)
            .glow(true)
            .unstackable()
            .tag(`curios:${c.slot}`)
            .tag(c.tier);
    });

});
