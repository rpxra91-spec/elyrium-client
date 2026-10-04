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
    // ⚔️ II. 15 SIMPLYSWORDS WEAPON ARCHETYPES FOR HIGHER TIERS (T4 - T8)
    // ==========================================================================
    const weaponArchetypes = [
        { suffix: 'rapier', name: 'Рапира', type: 'rapier', dmgMult: 1.0, spd: 2.4 },
        { suffix: 'sai', name: 'Саи', type: 'sai', dmgMult: 0.95, spd: 2.8 },
        { suffix: 'longdagger', name: 'Длинный Кинжал', type: 'longdagger', dmgMult: 0.9, spd: 3.0 },
        { suffix: 'sword', name: 'Меч', type: 'sword', dmgMult: 1.1, spd: 1.6 },
        { suffix: 'katana', name: 'Катана', type: 'katana', dmgMult: 1.15, spd: 1.8 },
        { suffix: 'cutlass', name: 'Палаш', type: 'cutlass', dmgMult: 1.15, spd: 1.5 },
        { suffix: 'longsword', name: 'Длинный Меч', type: 'longsword', dmgMult: 1.25, spd: 1.3 },
        { suffix: 'claymore', name: 'Клеймор', type: 'claymore', dmgMult: 1.5, spd: 1.0 },
        { suffix: 'greataxe', name: 'Секира', type: 'greataxe', dmgMult: 1.6, spd: 0.9 },
        { suffix: 'greathammer', name: 'Боевой Молот', type: 'greathammer', dmgMult: 1.65, spd: 0.8 },
        { suffix: 'scythe', name: 'Боевая Коса', type: 'scythe', dmgMult: 1.35, spd: 1.2 },
        { suffix: 'spear', name: 'Полуторное Копьё', type: 'spear', dmgMult: 1.2, spd: 1.4 },
        { suffix: 'halberd', name: 'Алебарда', type: 'halberd', dmgMult: 1.4, spd: 1.1 },
        { suffix: 'glaive', name: 'Глефа', type: 'glaive', dmgMult: 1.3, spd: 1.3 },
        { suffix: 'twinblade', name: 'Твинблейд', type: 'twinblade', dmgMult: 1.25, spd: 2.0 }
    ];

    const weaponTiers = [
        { prefix: 'void_', tierName: 'Пустотный', tierColor: '§5', baseDmg: 10.5, tierTag: 'skd:tier_4', rarity: 'rare' },
        { prefix: 'starlight_', tierName: 'Звездный', tierColor: '§b', baseDmg: 12.0, tierTag: 'skd:tier_5', rarity: 'rare' },
        { prefix: 'sculk_', tierName: 'Скалк-', tierColor: '§3', baseDmg: 13.5, tierTag: 'skd:tier_6', rarity: 'epic' },
        { prefix: 'eden_', tierName: 'Эдемский', tierColor: '§e', baseDmg: 15.5, tierTag: 'skd:tier_7', rarity: 'epic' },
        { prefix: 'halite_', tierName: 'Халитовый', tierColor: '§d', baseDmg: 18.0, tierTag: 'skd:tier_8', rarity: 'epic' }
    ];

    weaponTiers.forEach(wt => {
        weaponArchetypes.forEach(wa => {
            const itemId = wt.prefix + wa.suffix;
            const fullTitle = `${wt.tierColor}${wt.tierName} ${wa.name}§r`;
            const totalDmg = Math.round((wt.baseDmg * wa.dmgMult) * 10) / 10;

            event.create(itemId, 'sword')
                .displayName(fullTitle)
                .attackDamageBaseline(totalDmg)
                .speedBaseline(wa.spd)
                .rarity(wt.rarity)
                .unstackable()
                .tag('minecraft:swords')
                .tag('c:weapons')
                .tag('c:tools')
                .tag(`simplyswords:${wa.type}`)
                .tag(wt.tierTag);
        });
    });

    // ==========================================================================
    // 🛡️ III. CUSTOM CLASS ARMOR SETS (HELMET, CHESTPLATE, LEGGINGS, BOOTS)
    // ==========================================================================
    const armorSets = [
        // TIER 1
        { id: 'apprentice_mage', name: 'Мантия Ученика Разлома', color: '§d', rarity: 'uncommon', tier: 'skd:tier_1' },
        { id: 'astrologer', name: 'Одеяние Астролога', color: '§9', rarity: 'uncommon', tier: 'skd:tier_1' },
        { id: 'forest_hunter', name: 'Стек Лесного Охотника', color: '§a', rarity: 'uncommon', tier: 'skd:tier_1' },
        { id: 'copper_lamellar', name: 'Медный Чешуйчатый Ламелляр', color: '§6', rarity: 'uncommon', tier: 'skd:tier_1' },
        { id: 'infantry_paladin', name: 'Латный Доспех Пехотного Паладина', color: '§f', rarity: 'uncommon', tier: 'skd:tier_1' },

        // TIER 1.5 (UNDERGARDEN)
        { id: 'spore_shaman', name: 'Мантия Спорового Шамана', color: '§2', rarity: 'rare', tier: 'skd:tier_1_5' },
        { id: 'frost_mystic', name: 'Одеяние Морозного Мистика', color: '§b', rarity: 'rare', tier: 'skd:tier_1_5' },
        { id: 'cloggrum_scout', name: 'Клоггрумовый Стек Следопыта', color: '§8', rarity: 'rare', tier: 'skd:tier_1_5' },
        { id: 'catacomb_hunter', name: 'Доспех Охотника Катакомб', color: '§7', rarity: 'rare', tier: 'skd:tier_1_5' },
        { id: 'froststeel_plate', name: 'Тяжелые Латы Froststeel', color: '§b', rarity: 'rare', tier: 'skd:tier_1_5' },
        { id: 'cloggrum_monolith', name: 'Клоггрумовый Монолит', color: '§8', rarity: 'rare', tier: 'skd:tier_1_5' },
        { id: 'rot_queen', name: 'Доспех Гнилостной Королевы', color: '§5', rarity: 'epic', tier: 'skd:tier_1_5' },

        // TIER 2 (NETHER)
        { id: 'cinder_pyromancer', name: 'Пепельная Мантия Пироманта', color: '§c', rarity: 'rare', tier: 'skd:tier_2' },
        { id: 'infernal_warlock', name: 'Одеяние Инфернального Колдуна', color: '§4', rarity: 'rare', tier: 'skd:tier_2' },
        { id: 'basalt_ranger', name: 'Костюм Базальтового Стрелка', color: '§8', rarity: 'rare', tier: 'skd:tier_2' },
        { id: 'bastion_stalker', name: 'Доспех Охотника Бастиона', color: '§6', rarity: 'rare', tier: 'skd:tier_2' },
        { id: 'netherite_brigandine', name: 'Незеритовая Бригантина ДД', color: '§5', rarity: 'rare', tier: 'skd:tier_2' },
        { id: 'cinder_lamellar', name: 'Пепельный Ламелляр Брузера', color: '§c', rarity: 'rare', tier: 'skd:tier_2' },
        { id: 'magma_juggernaut', name: 'Латы Огнеупорного Джаггернаута', color: '§4', rarity: 'rare', tier: 'skd:tier_2' },

        // TIER 3 (AETHER)
        { id: 'aether_hierophant', name: 'Одеяние Иерофанта Небес', color: '§e', rarity: 'rare', tier: 'skd:tier_3' },
        { id: 'golden_cloud', name: 'Мантия Золотого Облака', color: '§6', rarity: 'rare', tier: 'skd:tier_3' },
        { id: 'falcon_eye', name: 'Доспех Соколиного Глаза', color: '§b', rarity: 'rare', tier: 'skd:tier_3' },
        { id: 'stormbird', name: 'Доспех Буревестника Эфира', color: '§9', rarity: 'rare', tier: 'skd:tier_3' },
        { id: 'crypt_guardian', name: 'Доспех Хранителя Склепа', color: '§8', rarity: 'rare', tier: 'skd:tier_3' },

        // TIER 4 (THE END)
        { id: 'void_walker', name: 'Мантия Тенеходца Бездны', color: '§5', rarity: 'rare', tier: 'skd:tier_4' },
        { id: 'astral_weaver', name: 'Одеяние Астрального Ткача', color: '§d', rarity: 'rare', tier: 'skd:tier_4' },
        { id: 'shulkerat', name: 'Панцирь Шулкерата', color: '§d', rarity: 'rare', tier: 'skd:tier_4' },
        { id: 'rift_hunter', name: 'Доспех Охотника Разлома', color: '§5', rarity: 'rare', tier: 'skd:tier_4' },
        { id: 'void_warrior', name: 'Доспех Пустотного Воителя', color: '§5', rarity: 'rare', tier: 'skd:tier_4' },
        { id: 'dragon_scale', name: 'Бригантина Драконьей Чешуи', color: '§8', rarity: 'rare', tier: 'skd:tier_4' },
        { id: 'ender_golem', name: 'Монолитные Латы Эндер-Голема', color: '§8', rarity: 'rare', tier: 'skd:tier_4' },
        { id: 'end_citadel', name: 'Латы Цитадели Края', color: '§5', rarity: 'rare', tier: 'skd:tier_4' },
        { id: 'ender_guardian', name: 'Регалии Стража Края', color: '§d', rarity: 'epic', tier: 'skd:tier_4' },
        { id: 'dragon_priest', name: 'Одеяние Жреца Дракона', color: '§5', rarity: 'epic', tier: 'skd:tier_4' },

        // TIER 5 (ETERNAL STARLIGHT)
        { id: 'starlight_alchemist', name: 'Одеяние Звездного Алхимика', color: '§b', rarity: 'rare', tier: 'skd:tier_5' },
        { id: 'nightglow_robes', name: 'Мантия Ночного Свечения', color: '§9', rarity: 'rare', tier: 'skd:tier_5' },
        { id: 'star_archer', name: 'Стек Звездного Лучника', color: '§e', rarity: 'rare', tier: 'skd:tier_5' },
        { id: 'luminar_lamellar', name: 'Ламелляр Люминарита', color: '§b', rarity: 'rare', tier: 'skd:tier_5' },
        { id: 'golem_titan_plate', name: 'Титанические Латы Голема Звезд', color: '§3', rarity: 'rare', tier: 'skd:tier_5' },

        // TIER 6 (DEEPER DARKER)
        { id: 'sculk_resonator', name: 'Эхо-Мантия Скалк-Резонатора', color: '§3', rarity: 'epic', tier: 'skd:tier_6' },
        { id: 'acoustic_priest', name: 'Одеяние Акустического Жреца', color: '§b', rarity: 'epic', tier: 'skd:tier_6' },
        { id: 'sculk_stalker', name: 'Костюм Скалк-Сталкера', color: '§8', rarity: 'epic', tier: 'skd:tier_6' },
        { id: 'silent_dark_hunter', name: 'Доспех Бесшумного Охотника Тьмы', color: '§8', rarity: 'epic', tier: 'skd:tier_6' },
        { id: 'resonarium_brigandine', name: 'Скалк-Бригантина Резонария', color: '§3', rarity: 'epic', tier: 'skd:tier_6' },
        { id: 'ancient_depth_warrior', name: 'Доспех Древнего Воина Глубин', color: '§8', rarity: 'epic', tier: 'skd:tier_6' },
        { id: 'abyssal_monolith', name: 'Монолит Истинной Тьмы', color: '§8', rarity: 'epic', tier: 'skd:tier_6' },
        { id: 'warden_heart', name: 'Регалии Сердца Вардена', color: '§3', rarity: 'epic', tier: 'skd:tier_6' },
        { id: 'ancient_stalker', name: 'Доспех Древнего Сталкера', color: '§8', rarity: 'epic', tier: 'skd:tier_6' },
        { id: 'sonic_weaver', name: 'Мантия Звукового Ткача Бездны', color: '§b', rarity: 'epic', tier: 'skd:tier_6' },

        // TIER 7 (DIVINERPG: EDEN & WILDWOOD)
        { id: 'wildwood_archdruid', name: 'Одеяние Архидруида Диколесья', color: '§2', rarity: 'epic', tier: 'skd:tier_7' },
        { id: 'eden_solar_mage', name: 'Мантия Солнечного Света Эдема', color: '§e', rarity: 'epic', tier: 'skd:tier_7' },
        { id: 'eden_archer', name: 'Золотой Стек Лучника Эдема', color: '§6', rarity: 'epic', tier: 'skd:tier_7' },
        { id: 'wildwood_brigandine', name: 'Живая Бригантина Диколесья', color: '§a', rarity: 'epic', tier: 'skd:tier_7' },
        { id: 'eden_lamellar', name: 'Солнечный Ламелляр Эдема', color: '§e', rarity: 'epic', tier: 'skd:tier_7' },
        { id: 'treant_colossus', name: 'Панцирь Исполина Древа', color: '§2', rarity: 'epic', tier: 'skd:tier_7' },
        { id: 'ancient_ent_lord', name: 'Регалии Древнего Энто-Владыки', color: '§2', rarity: 'epic', tier: 'skd:tier_7' },
        { id: 'eden_grove_guardian', name: 'Доспех Солнечного Стража Рощ', color: '§e', rarity: 'epic', tier: 'skd:tier_7' },
        { id: 'tree_of_life', name: 'Первородный Панцирь Древа Жизни', color: '§a', rarity: 'epic', tier: 'skd:tier_7' },

        // TIER 8 (DIVINERPG: MORTUM APEX)
        { id: 'mortum_reaper', name: 'Одеяние Жнеца Мортума', color: '§4', rarity: 'epic', tier: 'skd:tier_8' },
        { id: 'mortum_death_knight', name: 'Латы Вечной Смерти Мортума', color: '§4', rarity: 'epic', tier: 'skd:tier_8' },
        { id: 'skythern_storm_brigandine', name: 'Громовой Ламелляр Бури', color: '§9', rarity: 'epic', tier: 'skd:tier_8' },
        { id: 'abyssal_apex_monolith', name: 'Монолит Вечной Бездны', color: '§8', rarity: 'epic', tier: 'skd:tier_8' },
        { id: 'ancient_entity', name: 'Доспех Древней Сущности', color: '§d', rarity: 'epic', tier: 'skd:tier_8' },
        { id: 'skythern_storm_lord', name: 'Регалии Владыки Бурь Скайтерна', color: '§9', rarity: 'epic', tier: 'skd:tier_8' },
        { id: 'apex_halite_titan', name: 'Панцирь Абсолютного Халита', color: '§d', rarity: 'epic', tier: 'skd:tier_8' }
    ];

    const armorSlots = [
        { slot: 'helmet', tag: 'minecraft:head_armor', label: 'Шлем' },
        { slot: 'chestplate', tag: 'minecraft:chest_armor', label: 'Нагрудник' },
        { slot: 'leggings', tag: 'minecraft:leg_armor', label: 'Поножи' },
        { slot: 'boots', tag: 'minecraft:foot_armor', label: 'Сапоги' }
    ];

    armorSets.forEach(set => {
        armorSlots.forEach(s => {
            const pieceId = `${set.id}_${s.slot}`;
            const pieceTitle = `${set.color}${set.name} (${s.label})§r`;

            event.create(pieceId, s.slot)
                .displayName(pieceTitle)
                .rarity(set.rarity)
                .unstackable()
                .tag('minecraft:armors')
                .tag(s.tag)
                .tag('c:armors')
                .tag(set.tier);
        });
    });

    // ==========================================================================
    // 👑 IV. CUSTOM UNIQUE BOSS WEAPONS
    // ==========================================================================
    const bossWeapons = [
        // T1
        { id: 'ancient_remnant_sword', name: '§6Меч Древнего Остана', type: 'sword', dmg: 8.5, spd: 1.3, rarity: 'rare', tier: 'skd:tier_1' },
        // T1.5
        { id: 'undergarden_spore_bow', name: '§2Грибной Лук Катакомб', type: 'item', rarity: 'rare', tier: 'skd:tier_1_5' },
        // T6
        { id: 'soul_crystal_greatsword', name: '§3Soul Crystal Greatsword', type: 'sword', dmg: 20.0, spd: 0.95, rarity: 'epic', tier: 'skd:tier_6' },
        { id: 'echo_resonance_staff', name: '§bEcho Resonance Staff', type: 'item', rarity: 'epic', tier: 'skd:tier_6' },
        { id: 'warden_tendril_blade', name: '§3Warden Tendril Blade', type: 'sword', dmg: 16.5, spd: 1.7, rarity: 'epic', tier: 'skd:tier_6' },
        { id: 'sonic_pulverizer_bow', name: '§3Sonic Pulverizer Bow', type: 'item', rarity: 'epic', tier: 'skd:tier_6' },
        { id: 'sculk_whisper_dagger', name: '§8Скалковый Кинжал Шепота', type: 'sword', dmg: 14.0, spd: 3.0, rarity: 'epic', tier: 'skd:tier_6' },
        // T7
        { id: 'wildwood_elder_staff', name: '§2Staff of the Wildwood Elder', type: 'item', rarity: 'epic', tier: 'skd:tier_7' },
        { id: 'eden_solar_glaive', name: '§eEden Solar Glaive', type: 'sword', dmg: 19.5, spd: 1.3, rarity: 'epic', tier: 'skd:tier_7' },
        // T8
        { id: 'halite_greatblade', name: '§dHalite Greatblade', type: 'sword', dmg: 26.5, spd: 0.95, rarity: 'epic', tier: 'skd:tier_8' },
        { id: 'mortum_death_scythe', name: '§4Mortum Death Scythe', type: 'sword', dmg: 23.5, spd: 1.2, rarity: 'epic', tier: 'skd:tier_8' },
        { id: 'skythern_storm_bow', name: '§9Skythern Storm Bow', type: 'item', rarity: 'epic', tier: 'skd:tier_8' },
        { id: 'apalachia_crystal_staff', name: '§5Apalachia Crystal Staff', type: 'item', rarity: 'epic', tier: 'skd:tier_8' },
        { id: 'halite_demigod_spear', name: '§dHalite Demigod Spear', type: 'sword', dmg: 22.0, spd: 1.4, rarity: 'epic', tier: 'skd:tier_8' }
    ];

    bossWeapons.forEach(w => {
        if (w.type === 'sword') {
            event.create(w.id, 'sword')
                .displayName(w.name)
                .attackDamageBaseline(w.dmg)
                .speedBaseline(w.spd)
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
