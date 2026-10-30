// ==============================================================================
// 🐺 ELYRIUM RPG: NOMADIC WARBANDS & DIMENSION OUTPOSTS ENGINE (v2.0)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 1. Dual-Mode Architecture:
//    - 🗺️ OVERWORLD NOMADS: True wandering warbands living in a dynamic patrol cycle:
//      [Encamped at Camp] -> [Packing Gear] -> [Marching in Formation] -> [New Camp].
//      Squad moves visibly across the terrain with formation leashing.
//    - 🏰 DIMENSION OUTPOSTS: Nether, Aether, and Undergarden field mini-bosses stationed
//      at fortified static redoubts (no suicidal pathing into lava or void).
// 2. Exponential Variety & Growing Bestiary:
//    - Sector I (R = 250..1450m): 4 Core Archetypes (Cap: 5 active squads).
//    - Sector II (R = 1500..4500m): 6 Nether-themed Archetypes (Cap: 12 active squads).
//    - Sector III (R = 4500..8500m): 5 Aether-themed Archetypes (Cap: 18 active squads).
//    - Native Dimensions: Nether (4 Outposts), Aether (4 Outposts), Undergarden (3 Outposts).
// 3. Rarity Weights & "Mythic Curiosities" (Диковинки):
//    - COMMON (weight 40), UNCOMMON (weight 25), RARE (weight 12), MYTHIC (weight 5).
//    - Mythics trigger golden notched bossbars, ancient war horn blasts, and chat announcements!
// 4. Anti-Clustering & Density Control:
//    - Min 250m spacing between any two active warbands.
//    - Max 1 active squad within 120m of a single player.
// 5. Zero-Trash Procedural Campsites:
//    - Camps cleanly restored when packing up or defeated.
// ==============================================================================

const NOMAD_CONFIG = {
    enabled: true,
    checkIntervalTicks: 400,          // Проверка спавна каждые 20 сек
    marchTickInterval: 40,            // Обновление шага марша каждые 2 сек
    antiClusteringDistance: 250,      // Мин. дистанция между любыми двумя бандами
    playerLocalRadius: 120,           // Радиус проверки плотности вокруг игрока
    playerLocalCap: 1,                // Не более 1 банды рядом с одним игроком
    playerSearchRadiusMin: 45,        // Мин. дистанция спавна от игрока
    playerSearchRadiusMax: 75,        // Макс. дистанция спавна от игрока
    combatRadius: 32,                 // Радиус входа в бой и активации боссбара
    campDurationSeconds: 210,         // Время стоянки в лагере (~3.5 мин) перед переходом в марш
    marchDurationMaxSeconds: 90,      // Макс. длительность одного марша перед разбивкой лагеря
    bossDespawnTimeoutMinutes: 35,    // Таймаут жизни босса (35 минут)
    campSpawnChance: 0.90,            // Шанс развертывания лагеря

    // --------------------------------------------------------------------------
    // 📊 ЛИМИТЫ ЧИСЛЕННОСТИ ПО СЕКТОРАМ И ИЗМЕРЕНИЯМ
    // --------------------------------------------------------------------------
    sectorCaps: {
        1: 5,   // Сектор I (R=250..1450)
        2: 12,  // Сектор II (R=1500..4500, площадь 56.5 км²)
        3: 18,  // Сектор III (R=4500..8500, площадь 163.4 км²)
        4: 24   // Сектор IV (R=8500..13500, площадь 345.6 км² — Край и Бездна)
    },
    dimensionCaps: {
        'minecraft:the_nether': 4,
        'aether:the_aether': 4,
        'undergarden:undergarden': 3,
        'minecraft:the_end': 4,
        'eternal_starlight:starlight': 4,
        'deeperdarker:otherside': 3,
        'divinerpg:eden': 3,
        'divinerpg:wildwood': 3,
        'divinerpg:mortum': 3
    },

    // --------------------------------------------------------------------------
    // ⚔️ БАЗА БОЕВЫХ АРХЕТИПОВ (СЕКТОРЫ I, II, III И ИЗМЕРЕНИЯ)
    // --------------------------------------------------------------------------
    bosses: {
        // ======================================================================
        // СЕКТОР I (OVERWORLD TIER 1)
        // ======================================================================
        bandit_warlord: {
            id: 'bandit_warlord',
            displayName: '§6[★ Вожак] Атаман Черной Дубравы§r',
            barTitle: 'Атаман Черной Дубравы (Королевский Драугр)',
            barColor: 'yellow',
            rarity: 'common',
            weight: 45,
            sector: 1,
            dimension: 'minecraft:overworld',
            behavior: 'nomadic',
            entityType: 'cataclysm:royal_draugr',
            maxHp: 140,
            speed: 0.28,
            attackDamage: 7,
            armor: 9,
            armorToughness: 3,
            mainHand: 'minecraft:iron_sword',
            offHand: 'minecraft:shield',
            campType: 'woodland_camp',
            minions: [
                { type: 'cataclysm:elite_draugr', count: 1, role: 'tank', name: '§eЭлитный Драугр-Щитовик§r', hp: 45, armor: 8, mainHand: 'minecraft:iron_axe', offHand: 'minecraft:shield' },
                { type: 'cataclysm:koboleton', count: 2, role: 'ranged', name: '§fКобольд-Снайпер§r', hp: 26, armor: 4, mainHand: 'minecraft:crossbow' },
                { type: 'cataclysm:amethyst_crab', count: 1, role: 'beast', name: '§dПещерный Краб-Гончая§r', hp: 38, armor: 6, dmg: 5 },
                { type: 'irons_spellbooks:apothecarist', count: 1, role: 'caster', name: '§aПолевой Травник Банды§r', hp: 32, armor: 4 }
            ],
            abilities: { warCryCooldown: 35, warCryHpThreshold: 0.55 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'minecraft:copper_ingot', min: 4, max: 8 },
                    { item: 'minecraft:iron_ingot', min: 3, max: 6 },
                    { item: 'minecraft:leather', min: 3, max: 6 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_whirlwind', chance: 0.25 },
                    { item: 'kubejs:martial_tablet_severing_cleave', chance: 0.25 },
                    { item: 'kubejs:elemental_stone_fire', chance: 0.20 },
                    { item: 'kubejs:elemental_stone_nature', chance: 0.20 }
                ]
            }
        },

        direwolf_alpha: {
            id: 'direwolf_alpha',
            displayName: '§c[★ Вожак] Седогривый Вожак Стаи§r',
            barTitle: 'Седогривый Вожак Стаи (Лютоволк-Альфа)',
            barColor: 'red',
            rarity: 'common',
            weight: 40,
            sector: 1,
            dimension: 'minecraft:overworld',
            behavior: 'nomadic',
            entityType: 'minecraft:wolf',
            scale: 1.35,
            maxHp: 120,
            speed: 0.35,
            attackDamage: 6,
            armor: 6,
            armorToughness: 2,
            campType: 'den_camp',
            minions: [
                { type: 'divinerpg:glacon', count: 1, role: 'tank', name: '§bМорозный Зверь-Авангард§r', hp: 55, armor: 6, dmg: 5 },
                { type: 'eternal_starlight:lonestar_skeleton', count: 1, role: 'ranged', name: '§bОхотник Звездных Пустошей§r', hp: 28, armor: 4, mainHand: 'minecraft:bow' },
                { type: 'minecraft:wolf', count: 3, role: 'beast', name: '§7Свирепый Волк Стаи§r', aggressive: true, hp: 24, dmg: 4 },
                { type: 'divinerpg:kobblin', count: 1, role: 'caster', name: '§6Шаман Стаи Кобблин§r', hp: 30, armor: 3, mainHand: 'minecraft:stick' }
            ],
            abilities: { fearHowlCooldown: 20 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'minecraft:bone', min: 6, max: 12 },
                    { item: 'minecraft:leather', min: 4, max: 8 },
                    { item: 'minecraft:copper_ingot', min: 3, max: 6 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_triple_shot', chance: 0.25 },
                    { item: 'kubejs:martial_tablet_bone_crusher', chance: 0.25 },
                    { item: 'kubejs:elemental_stone_frost', chance: 0.20 },
                    { item: 'kubejs:elemental_stone_lightning', chance: 0.20 }
                ]
            }
        },

        fallen_deserter_knight: {
            id: 'fallen_deserter_knight',
            displayName: '§b[★ Вожак] Отверженный Рыцарь-Дезертир§r',
            barTitle: 'Отверженный Рыцарь-Дезертир (Хранитель Цитадели)',
            barColor: 'blue',
            rarity: 'uncommon',
            weight: 25,
            sector: 1,
            dimension: 'minecraft:overworld',
            behavior: 'nomadic',
            entityType: 'irons_spellbooks:citadel_keeper',
            maxHp: 160,
            speed: 0.24,
            attackDamage: 8,
            armor: 12,
            armorToughness: 4,
            mainHand: 'minecraft:iron_sword',
            offHand: 'minecraft:shield',
            campType: 'knight_outpost',
            minions: [
                { type: 'divinerpg:enchanted_warrior', count: 1, role: 'tank', name: '§9Зачарованный Оруженосец§r', hp: 42, armor: 8, mainHand: 'minecraft:iron_sword', offHand: 'minecraft:shield' },
                { type: 'divinerpg:sun_archer', count: 1, role: 'ranged', name: '§6Мятежный Стрелок-Застрельщик§r', hp: 28, armor: 4, mainHand: 'minecraft:bow' },
                { type: 'minecraft:wolf', count: 1, role: 'beast', name: '§8Сторожевой Мастиф Конвоя§r', aggressive: true, hp: 30, dmg: 4 },
                { type: 'irons_spellbooks:cryomancer', count: 1, role: 'caster', name: '§bРенегат Ордена Криомантов§r', hp: 35, armor: 5 }
            ],
            abilities: { shieldGuardReduction: 0.50, slamCooldown: 16 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'minecraft:iron_ingot', min: 4, max: 7 },
                    { item: 'kubejs:steel_ingot', min: 1, max: 2 },
                    { item: 'minecraft:copper_ingot', min: 4, max: 8 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_crushing_uppercut', chance: 0.25 },
                    { item: 'kubejs:martial_tablet_iron_stance', chance: 0.25 },
                    { item: 'kubejs:elemental_stone_holy', chance: 0.20 },
                    { item: 'kubejs:elemental_stone_shadow', chance: 0.20 }
                ]
            }
        },

        mountain_brigand_gang: {
            id: 'mountain_brigand_gang',
            displayName: '§e[★ Вожак] Надзиратель Горных Грабителей§r',
            barTitle: 'Надзиратель Грабителей (Циклоп-Каторжник)',
            barColor: 'purple',
            rarity: 'rare',
            weight: 15,
            sector: 1,
            dimension: 'minecraft:overworld',
            behavior: 'nomadic',
            entityType: 'divinerpg:cyclops',
            maxHp: 150,
            speed: 0.25,
            attackDamage: 8,
            armor: 8,
            armorToughness: 2,
            campType: 'brigand_redoubt',
            minions: [
                { type: 'cataclysm:draugr', count: 1, role: 'tank', name: '§8Горный Громила-Драугр§r', hp: 40, armor: 6, mainHand: 'minecraft:iron_axe' },
                { type: 'cataclysm:koboleton', count: 2, role: 'ranged', name: '§6Кобольд-Застрельщик Пустошей§r', hp: 24, armor: 3, mainHand: 'minecraft:crossbow' },
                { type: 'eternal_starlight:ratlin', count: 1, role: 'beast', name: '§7Прирученный Пещерный Ратлин§r', hp: 28, armor: 3, dmg: 4 },
                { type: 'irons_spellbooks:pyromancer', count: 1, role: 'caster', name: '§cБеглый Пиромант-Поджигатель§r', hp: 32, armor: 4 }
            ],
            abilities: { cyclopsSmashCooldown: 18 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'minecraft:raw_iron', min: 4, max: 8 },
                    { item: 'minecraft:coal', min: 6, max: 12 },
                    { item: 'minecraft:copper_ingot', min: 4, max: 8 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_whirlwind', chance: 0.25 },
                    { item: 'kubejs:martial_tablet_bone_crusher', chance: 0.25 },
                    { item: 'kubejs:elemental_stone_fire', chance: 0.20 },
                    { item: 'kubejs:elemental_stone_shadow', chance: 0.20 }
                ]
            }
        },

        // ======================================================================
        // СЕКТОР II (ПЕПЕЛЬНЫЕ РУБЕЖИ R=1500..4500) & THE NETHER
        // ======================================================================
        cinder_piglin_caravan: {
            id: 'cinder_piglin_caravan',
            displayName: '§6[★ Вожак] Пепельный Барон Пиглинов§r',
            barTitle: 'Пепельный Барон Пиглинов (Вождь Гроглинов)',
            barColor: 'yellow',
            rarity: 'common',
            weight: 40,
            sector: 2,
            dimension: 'both', // Активен в Оверворлде (Сектор II) и в Незере
            behavior: 'nomadic',
            entityType: 'divinerpg:groglin_chieftain',
            maxHp: 175,
            speed: 0.28,
            attackDamage: 9,
            armor: 10,
            armorToughness: 4,
            mainHand: 'minecraft:golden_axe',
            campType: 'nether_outpost',
            minions: [
                { type: 'divinerpg:groglin_warrior', count: 2, role: 'tank', name: '§eПепельный Гвардеец-Берсерк§r', hp: 48, armor: 8, mainHand: 'minecraft:golden_axe' },
                { type: 'divinerpg:groglin_hunter', count: 2, role: 'ranged', name: '§6Стрелок Огненных Стрел§r', hp: 32, armor: 4, mainHand: 'minecraft:crossbow' },
                { type: 'divinerpg:hell_spider', count: 1, role: 'beast', name: '§cПепельный Лавовый Паук§r', hp: 38, dmg: 6 }
            ],
            abilities: { piglinRageCooldown: 22 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'minecraft:gold_ingot', min: 5, max: 10 },
                    { item: 'minecraft:quartz', min: 8, max: 16 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_whirlwind', chance: 0.30 },
                    { item: 'kubejs:martial_tablet_severing_cleave', chance: 0.30 },
                    { item: 'kubejs:elemental_stone_fire_2', chance: 0.20 }
                ]
            }
        },

        flame_cult_inquisition: {
            id: 'flame_cult_inquisition',
            displayName: '§c[★ Вожак] Инквизитор Багрового Культа§r',
            barTitle: 'Инквизитор Багрового Культа (Магистр Пламени)',
            barColor: 'red',
            rarity: 'common',
            weight: 35,
            sector: 2,
            dimension: 'both',
            behavior: 'nomadic',
            entityType: 'irons_spellbooks:pyromancer',
            maxHp: 165,
            speed: 0.26,
            attackDamage: 8,
            armor: 9,
            campType: 'cult_camp',
            minions: [
                { type: 'irons_spellbooks:cultist', count: 2, role: 'tank', name: '§4Фанатик Кровавого Клинка§r', hp: 42, armor: 6, mainHand: 'minecraft:iron_sword' },
                { type: 'irons_spellbooks:apothecarist', count: 1, role: 'caster', name: '§cАлхимик Огненных Смесей§r', hp: 36, armor: 4 },
                { type: 'divinerpg:hell_pig', count: 1, role: 'beast', name: '§6Боевой Адский Вепрь§r', hp: 40, dmg: 6 }
            ],
            abilities: { fireBarrageCooldown: 16 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'minecraft:blaze_powder', min: 4, max: 8 },
                    { item: 'minecraft:magma_cream', min: 3, max: 6 }
                ],
                chanceLoot: [
                    { item: 'kubejs:elemental_stone_fire_2', chance: 0.25 },
                    { item: 'kubejs:martial_tablet_helm_splitter', chance: 0.25 }
                ]
            }
        },

        basalt_revenant_squad: {
            id: 'basalt_revenant_squad',
            displayName: '§8[★ Вожак] Базальтовый Призрак Незера§r',
            barTitle: 'Базальтовый Призрак (Огненосный Ревенант)',
            barColor: 'purple',
            rarity: 'uncommon',
            weight: 25,
            sector: 2,
            dimension: 'both',
            behavior: 'nomadic',
            entityType: 'cataclysm:ignited_revenant',
            maxHp: 185,
            speed: 0.25,
            attackDamage: 9,
            armor: 12,
            armorToughness: 4,
            campType: 'nether_outpost',
            minions: [
                { type: 'cataclysm:draugr', count: 2, role: 'tank', name: '§7Пепельный Пехотинец Со Смертоносной Секирой§r', hp: 46, armor: 7, mainHand: 'minecraft:iron_axe' },
                { type: 'divinerpg:sun_archer', count: 1, role: 'ranged', name: '§eСтрелок Серных Огней§r', hp: 34, armor: 5, mainHand: 'minecraft:bow' },
                { type: 'divinerpg:hell_spider', count: 1, role: 'beast', name: '§4Жгучий Паук Разлома§r', hp: 36, dmg: 5 }
            ],
            abilities: { shieldBashCooldown: 15 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'kubejs:steel_ingot', min: 2, max: 4 },
                    { item: 'minecraft:obsidian', min: 2, max: 5 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_iron_stance', chance: 0.30 },
                    { item: 'kubejs:elemental_stone_shadow_2', chance: 0.20 }
                ]
            }
        },

        nether_behemoth_pack: {
            id: 'nether_behemoth_pack',
            displayName: '§4[★ Вожак] Огнедышащий Бегемот Пустошей§r',
            barTitle: 'Огнедышащий Бегемот (Древний Зверь Незера)',
            barColor: 'red',
            rarity: 'uncommon',
            weight: 20,
            sector: 2,
            dimension: 'both',
            behavior: 'nomadic',
            entityType: 'divinerpg:behemoth',
            scale: 1.25,
            maxHp: 210,
            speed: 0.24,
            attackDamage: 10,
            armor: 10,
            armorToughness: 4,
            campType: 'den_camp',
            minions: [
                { type: 'divinerpg:hell_spider', count: 3, role: 'beast', name: '§cАдская Гончая Стаи§r', hp: 32, dmg: 6 },
                { type: 'divinerpg:wildfire', count: 1, role: 'caster', name: '§6Огненный Дух-Поджигатель§r', hp: 40, armor: 4 }
            ],
            abilities: { groundStompCooldown: 18 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'minecraft:leather', min: 6, max: 12 },
                    { item: 'minecraft:bone', min: 8, max: 16 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_earth_fracture', chance: 0.25 },
                    { item: 'kubejs:elemental_stone_fire_2', chance: 0.25 }
                ]
            }
        },

        scorched_deserter_legion: {
            id: 'scorched_deserter_legion',
            displayName: '§5[★ Вожак] Отступник Базальтового Чертога§r',
            barTitle: 'Отступник Базальтового Чертога (Бифрон)',
            barColor: 'purple',
            rarity: 'rare',
            weight: 12,
            sector: 2,
            dimension: 'both',
            behavior: 'nomadic',
            entityType: 'divinerpg:biphron',
            maxHp: 195,
            speed: 0.27,
            attackDamage: 9,
            armor: 11,
            campType: 'nether_outpost',
            minions: [
                { type: 'divinerpg:enchanted_warrior', count: 2, role: 'tank', name: '§9Закаленный Пепельный Рыцарь§r', hp: 48, armor: 9, mainHand: 'minecraft:iron_sword', offHand: 'minecraft:shield' },
                { type: 'irons_spellbooks:pyromancer', count: 1, role: 'caster', name: '§cРенегат Пиромантии§r', hp: 38, armor: 5 },
                { type: 'minecraft:wolf', count: 1, role: 'beast', name: '§4Сторожевой Пес Преисподней§r', aggressive: true, hp: 34, dmg: 5 }
            ],
            abilities: { dualCleaveCooldown: 14 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'kubejs:steel_ingot', min: 2, max: 5 },
                    { item: 'minecraft:gold_ingot', min: 6, max: 12 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_thousand_cuts', chance: 0.25 },
                    { item: 'kubejs:martial_tablet_helm_splitter', chance: 0.25 }
                ]
            }
        },

        mythic_ignited_berserker: {
            id: 'mythic_ignited_berserker',
            displayName: '§6§l[👑 ДИКОВИНКА] Испепеляющий Берсерк Бездны§r',
            barTitle: '★ ИСПЕПЕЛЯЮЩИЙ БЕРСЕРК БЕЗДНЫ (ВЕЛИКИЙ ВОЖАК) ★',
            barColor: 'red',
            rarity: 'mythic',
            weight: 5,
            sector: 2,
            dimension: 'both',
            behavior: 'nomadic',
            entityType: 'cataclysm:ignited_berserker',
            maxHp: 280,
            speed: 0.27,
            attackDamage: 12,
            armor: 14,
            armorToughness: 6,
            campType: 'nether_outpost',
            minions: [
                { type: 'cataclysm:ignited_revenant', count: 2, role: 'tank', name: '§6Элитный Телохранитель Бездны§r', hp: 65, armor: 10, mainHand: 'minecraft:iron_sword', offHand: 'minecraft:shield' },
                { type: 'irons_spellbooks:cultist', count: 2, role: 'caster', name: '§4Жрец Огненного Культа§r', hp: 45, armor: 6 },
                { type: 'cataclysm:amethyst_crab', count: 1, role: 'beast', name: '§dПещерный Краб-Хранитель§r', hp: 55, armor: 8, dmg: 6 }
            ],
            abilities: { berserkRageCooldown: 25 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 2 },
                    { item: 'kubejs:tier_upgrade_template', count: 1 },
                    { item: 'kubejs:steel_ingot', min: 4, max: 8 },
                    { item: 'minecraft:diamond', min: 1, max: 3 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_unstoppable_charge', chance: 0.40 },
                    { item: 'kubejs:martial_tablet_earth_fracture', chance: 0.40 },
                    { item: 'kubejs:elemental_stone_fire_2', chance: 0.50 }
                ]
            }
        },

        // ======================================================================
        // СЕКТОР III (ПРЕДГОРЬЯ ЭФИРА R=4500..8500) & THE AETHER
        // ======================================================================
        valkyrie_sky_patrol: {
            id: 'valkyrie_sky_patrol',
            displayName: '§b[★ Вожак] Командор Крылатых Валькирий§r',
            barTitle: 'Командор Валькирий (Небесный Страж Эфира)',
            barColor: 'blue',
            rarity: 'common',
            weight: 35,
            sector: 3,
            dimension: 'both',
            behavior: 'nomadic',
            entityType: 'aether:valkyrie',
            maxHp: 190,
            speed: 0.30,
            attackDamage: 9,
            armor: 11,
            armorToughness: 4,
            mainHand: 'minecraft:iron_sword',
            offHand: 'minecraft:shield',
            campType: 'aether_shrine',
            minions: [
                { type: 'divinerpg:enchanted_warrior', count: 2, role: 'tank', name: '§9Эфирный Меченосец Со Щитом§r', hp: 50, armor: 9, mainHand: 'minecraft:iron_sword', offHand: 'minecraft:shield' },
                { type: 'divinerpg:sun_archer', count: 2, role: 'ranged', name: '§6Лучник Небесного Солнца§r', hp: 36, armor: 5, mainHand: 'minecraft:bow' },
                { type: 'aether:cockatrice', count: 1, role: 'beast', name: '§eБоевой Кокатрис Авангарда§r', hp: 42, dmg: 5 }
            ],
            abilities: { valkyrieDiveCooldown: 18 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'minecraft:feather', min: 8, max: 16 },
                    { item: 'minecraft:gold_ingot', min: 4, max: 8 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_spear_flurry', chance: 0.25 },
                    { item: 'kubejs:martial_tablet_polearm_vault', chance: 0.25 },
                    { item: 'kubejs:elemental_stone_holy_2', chance: 0.20 }
                ]
            }
        },

        cockatrice_beast_pack: {
            id: 'cockatrice_beast_pack',
            displayName: '§e[★ Вожак] Альфа-Кокатрис Небес§r',
            barTitle: 'Альфа-Кокатрис (Свирепый Хищник Эфира)',
            barColor: 'yellow',
            rarity: 'common',
            weight: 35,
            sector: 3,
            dimension: 'both',
            behavior: 'nomadic',
            entityType: 'aether:cockatrice',
            scale: 1.35,
            maxHp: 170,
            speed: 0.34,
            attackDamage: 8,
            armor: 7,
            campType: 'den_camp',
            minions: [
                { type: 'aether:cockatrice', count: 3, role: 'beast', name: '§eЯдовитый Кокатрис Стаи§r', hp: 36, dmg: 5 },
                { type: 'divinerpg:kobblin', count: 1, role: 'caster', name: '§6Дрессировщик Кобблин§r', hp: 36, armor: 4, mainHand: 'minecraft:stick' }
            ],
            abilities: { venomBurstCooldown: 15 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'minecraft:feather', min: 12, max: 24 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_triple_shot', chance: 0.25 },
                    { item: 'kubejs:elemental_stone_nature_2', chance: 0.20 }
                ]
            }
        },

        sun_temple_vanguard: {
            id: 'sun_temple_vanguard',
            displayName: '§6[★ Вожак] Инквизитор Солнечного Храма§r',
            barTitle: 'Инквизитор Солнечного Храма (Элитный Стрелок)',
            barColor: 'yellow',
            rarity: 'uncommon',
            weight: 25,
            sector: 3,
            dimension: 'both',
            behavior: 'nomadic',
            entityType: 'divinerpg:sun_archer',
            maxHp: 180,
            speed: 0.28,
            attackDamage: 9,
            armor: 10,
            mainHand: 'minecraft:bow',
            campType: 'aether_shrine',
            minions: [
                { type: 'divinerpg:enchanted_warrior', count: 2, role: 'tank', name: '§eПаладин Солнечного Оплота§r', hp: 52, armor: 10, mainHand: 'minecraft:iron_sword', offHand: 'minecraft:shield' },
                { type: 'irons_spellbooks:priest', count: 1, role: 'caster', name: '§fЖрец Священного Света§r', hp: 42, armor: 5 },
                { type: 'minecraft:wolf', count: 1, role: 'beast', name: '§eСолнечный Мастиф§r', aggressive: true, hp: 36, dmg: 5 }
            ],
            abilities: { radiantShotCooldown: 16 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'minecraft:gold_ingot', min: 6, max: 12 },
                    { item: 'kubejs:steel_ingot', min: 2, max: 5 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_arrow_barrage', chance: 0.25 },
                    { item: 'kubejs:elemental_stone_holy_2', chance: 0.25 }
                ]
            }
        },

        zephyr_storm_caller: {
            id: 'zephyr_storm_caller',
            displayName: '§9[★ Вожак] Буревестник Эфирных Ветров§r',
            barTitle: 'Буревестник Эфирных Ветров (Маг Бури)',
            barColor: 'blue',
            rarity: 'uncommon',
            weight: 20,
            sector: 3,
            dimension: 'both',
            behavior: 'nomadic',
            entityType: 'irons_spellbooks:cryomancer',
            maxHp: 185,
            speed: 0.26,
            attackDamage: 8,
            armor: 8,
            campType: 'aether_shrine',
            minions: [
                { type: 'eternal_starlight:lonestar_skeleton', count: 2, role: 'ranged', name: '§bСтрелок Ледяного Шквала§r', hp: 36, armor: 5, mainHand: 'minecraft:bow' },
                { type: 'aether:cockatrice', count: 1, role: 'beast', name: '§3Буревой Кокатрис§r', hp: 40, dmg: 6 },
                { type: 'divinerpg:glacon', count: 1, role: 'tank', name: '§bМорозный Голем Авангарда§r', hp: 60, armor: 8, dmg: 6 }
            ],
            abilities: { blizzardPulseCooldown: 18 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'minecraft:snowball', min: 16, max: 32 }
                ],
                chanceLoot: [
                    { item: 'kubejs:elemental_stone_frost_2', chance: 0.25 },
                    { item: 'kubejs:elemental_stone_lightning_2', chance: 0.25 }
                ]
            }
        },

        mythic_sky_sentinel: {
            id: 'mythic_sky_sentinel',
            displayName: '§6§l[👑 ДИКОВИНКА] Небесный Колосс Эфира§r',
            barTitle: '★ НЕБЕСНЫЙ КОЛОСС ЭФИРА (ХРАНИТЕЛЬ ЗЕНИТА) ★',
            barColor: 'yellow',
            rarity: 'mythic',
            weight: 5,
            sector: 3,
            dimension: 'both',
            behavior: 'nomadic',
            entityType: 'aether:sentry',
            maxHp: 320,
            speed: 0.26,
            attackDamage: 13,
            armor: 15,
            armorToughness: 6,
            campType: 'aether_shrine',
            minions: [
                { type: 'aether:valkyrie', count: 2, role: 'tank', name: '§6Королевская Валькирия-Хранитель§r', hp: 65, armor: 11, mainHand: 'minecraft:iron_sword', offHand: 'minecraft:shield' },
                { type: 'divinerpg:sun_archer', count: 2, role: 'ranged', name: '§eСнайпер Солнечных Небес§r', hp: 42, armor: 6, mainHand: 'minecraft:bow' },
                { type: 'irons_spellbooks:priest', count: 1, role: 'caster', name: '§fВерховный Жрец Зенита§r', hp: 48, armor: 6 }
            ],
            abilities: { sentrySlamCooldown: 20 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 2 },
                    { item: 'kubejs:tier_upgrade_template', count: 1 },
                    { item: 'kubejs:steel_ingot', min: 4, max: 8 },
                    { item: 'minecraft:gold_block', min: 1, max: 2 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_polearm_vault', chance: 0.40 },
                    { item: 'kubejs:martial_tablet_spear_flurry', chance: 0.40 },
                    { item: 'kubejs:elemental_stone_holy_2', chance: 0.50 }
                ]
            }
        },

        // ======================================================================
        // ПОДЗЕМНЫЙ САД (THE UNDERGARDEN TIER 1.5)
        // ======================================================================
        undergarden_rot_legion: {
            id: 'undergarden_rot_legion',
            displayName: '§2[★ Форпост] Гнилостный Великан Недр§r',
            barTitle: 'Гнилостный Великан Недр (Брут Подземного Сада)',
            barColor: 'green',
            rarity: 'rare',
            weight: 30,
            sector: 0,
            dimension: 'undergarden:undergarden',
            behavior: 'static_outpost',
            entityType: 'undergarden:brute',
            maxHp: 220,
            speed: 0.24,
            attackDamage: 10,
            armor: 10,
            armorToughness: 4,
            campType: 'undergarden_post',
            minions: [
                { type: 'undergarden:rotwalker', count: 3, role: 'tank', name: '§2Гнилостный Пехотинец Сада§r', hp: 45, armor: 6 },
                { type: 'undergarden:nargoyle', count: 1, role: 'beast', name: '§aНаргойл-Преследователь§r', hp: 40, dmg: 6 }
            ],
            abilities: { bruteSmashCooldown: 18 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'undergarden:cloggrum_ingot', min: 3, max: 6 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_crushing_uppercut', chance: 0.30 },
                    { item: 'kubejs:elemental_stone_nature_2', chance: 0.25 }
                ]
            }
        },

        // ======================================================================
        // СЕКТОР IV (OVERWORLD TIER 4: РУБЕЖИ КРАЯ И БЕЗДНЫ, R = 8500..13500м)
        // ======================================================================
        void_cult_cabal: {
            id: 'void_cult_cabal',
            displayName: '§5[★ Вожак] Верховный Чернокнижник Пустоты§r',
            barTitle: 'Верховный Чернокнижник Пустоты (Адепт Края)',
            barColor: 'purple',
            rarity: 'common',
            weight: 40,
            sector: 4,
            dimension: 'both',
            behavior: 'nomadic',
            entityType: 'cataclysm:deepling_warlock',
            maxHp: 210,
            speed: 0.27,
            attackDamage: 11,
            armor: 12,
            campType: 'void_camp',
            minions: [
                { type: 'cataclysm:deepling_brute', count: 2, role: 'tank', name: '§5Глубинный Гвардеец Края§r', hp: 65, armor: 10, dmg: 8 },
                { type: 'irons_spellbooks:cultist', count: 1, role: 'caster', name: '§dАдепт Темного Затмения§r', hp: 45, armor: 6 },
                { type: 'divinerpg:soul_spider', count: 1, role: 'beast', name: '§8Призрачный Паук Бездны§r', hp: 38, dmg: 6 }
            ],
            abilities: { voidBurstCooldown: 16 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'minecraft:ender_pearl', min: 2, max: 5 },
                    { item: 'kubejs:steel_ingot', min: 3, max: 6 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_shadow_step', chance: 0.30 },
                    { item: 'kubejs:elemental_stone_shadow_3', chance: 0.25 }
                ]
            }
        },

        sculk_abyssal_stalker: {
            id: 'sculk_abyssal_stalker',
            displayName: '§1[★ Вожак] Скалк-Ловчий Темных Глубин§r',
            barTitle: 'Скалк-Ловчий Темных Глубин (Эхо Бездны)',
            barColor: 'blue',
            rarity: 'common',
            weight: 35,
            sector: 4,
            dimension: 'both',
            behavior: 'nomadic',
            entityType: 'deeperdarker:shattered',
            maxHp: 220,
            speed: 0.28,
            attackDamage: 12,
            armor: 12,
            campType: 'sculk_redoubt',
            minions: [
                { type: 'deeperdarker:sculk_snapper', count: 2, role: 'tank', name: '§3Скалк-Панцирник Авангарда§r', hp: 55, armor: 8, dmg: 7 },
                { type: 'deeperdarker:sculk_centipede', count: 1, role: 'beast', name: '§1Скалк-Многоножка Охоты§r', hp: 45, dmg: 7 },
                { type: 'deeperdarker:sludge', count: 1, role: 'beast', name: '§0Слизевик Забвения§r', hp: 35, dmg: 5 }
            ],
            abilities: { sculkRoarCooldown: 18 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'minecraft:echo_shard', min: 1, max: 3 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_bone_crusher', chance: 0.30 },
                    { item: 'kubejs:elemental_stone_shadow_3', chance: 0.25 }
                ]
            }
        },

        ender_dusk_patrol: {
            id: 'ender_dusk_patrol',
            displayName: '§d[★ Вожак] Центурион Сумрака Края§r',
            barTitle: 'Центурион Сумрака Края (Страж Разлома)',
            barColor: 'pink',
            rarity: 'uncommon',
            weight: 25,
            sector: 4,
            dimension: 'both',
            behavior: 'nomadic',
            entityType: 'cataclysm:amethyst_crab',
            maxHp: 250,
            speed: 0.26,
            attackDamage: 13,
            armor: 14,
            armorToughness: 6,
            campType: 'void_camp',
            minions: [
                { type: 'divinerpg:ender_spider', count: 2, role: 'beast', name: '§5Странник Разлома Края§r', hp: 50, dmg: 8 },
                { type: 'eternal_starlight:lonestar_skeleton', count: 2, role: 'ranged', name: '§dСтрелок Темного Небосвода§r', hp: 42, armor: 6, mainHand: 'minecraft:bow' }
            ],
            abilities: { crabSlamCooldown: 16 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'minecraft:amethyst_shard', min: 4, max: 8 },
                    { item: 'minecraft:ender_pearl', min: 2, max: 4 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_severing_cleave', chance: 0.35 },
                    { item: 'kubejs:elemental_stone_shadow_3', chance: 0.30 }
                ]
            }
        },

        abyssal_dreadnought: {
            id: 'abyssal_dreadnought',
            displayName: '§4[★ Вожак] Панцирный Дредноут Бездны§r',
            barTitle: 'Панцирный Дредноут Бездны (Тяжелый Колосс)',
            barColor: 'red',
            rarity: 'rare',
            weight: 15,
            sector: 4,
            dimension: 'both',
            behavior: 'nomadic',
            entityType: 'cataclysm:deepling_brute',
            maxHp: 290,
            speed: 0.25,
            attackDamage: 14,
            armor: 16,
            armorToughness: 8,
            campType: 'void_camp',
            minions: [
                { type: 'cataclysm:deepling_warlock', count: 2, role: 'caster', name: '§5Адепт Темного Потока§r', hp: 52, armor: 8 },
                { type: 'deeperdarker:sculk_snapper', count: 2, role: 'tank', name: '§1Броненосный Скалк-Защитник§r', hp: 60, armor: 10, dmg: 7 }
            ],
            abilities: { bruteSmashCooldown: 18 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 2 },
                    { item: 'minecraft:diamond', min: 2, max: 5 },
                    { item: 'kubejs:steel_ingot', min: 4, max: 8 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_earth_sunder', chance: 0.40 },
                    { item: 'kubejs:elemental_stone_shadow_3', chance: 0.35 }
                ]
            }
        },

        mythic_void_harbinger: {
            id: 'mythic_void_harbinger',
            displayName: '§5§l[👑 ДИКОВИНКА] Предвестник Разлома Края§r',
            barTitle: '★ ПРЕДВЕСТНИК РАЗЛОМА КРАЯ (ВЛАДЫКА ПУСТОТЫ) ★',
            barColor: 'purple',
            rarity: 'mythic',
            weight: 5,
            sector: 4,
            dimension: 'both',
            behavior: 'nomadic',
            entityType: 'cataclysm:ender_golem',
            maxHp: 420,
            speed: 0.25,
            attackDamage: 16,
            armor: 18,
            armorToughness: 10,
            campType: 'void_camp',
            minions: [
                { type: 'cataclysm:deepling_brute', count: 2, role: 'tank', name: '§5Гвардеец Разлома Края§r', hp: 75, armor: 12, dmg: 9 },
                { type: 'cataclysm:deepling_warlock', count: 2, role: 'caster', name: '§dВерховный Сектант Бездны§r', hp: 58, armor: 8 },
                { type: 'deeperdarker:stalker', count: 1, role: 'beast', name: '§1Теневой Сталкер Глубин§r', hp: 65, dmg: 9 }
            ],
            abilities: { voidSlamCooldown: 20 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 2 },
                    { item: 'kubejs:tier_upgrade_template', count: 1 },
                    { item: 'minecraft:ender_eye', min: 2, max: 4 },
                    { item: 'minecraft:diamond_block', count: 1 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_thousand_cuts', chance: 0.45 },
                    { item: 'kubejs:martial_tablet_arrow_barrage', chance: 0.45 },
                    { item: 'kubejs:elemental_stone_shadow_3', chance: 0.50 }
                ]
            }
        },

        // ======================================================================
        // ФОРПОСТЫ ДАЛЬНИХ ИЗМЕРЕНИЙ (NATIVE DIMENSIONS TIER 4 - 8)
        // ======================================================================
        end_garrison_outpost: {
            id: 'end_garrison_outpost',
            displayName: '§5[★ Форпост] Хранитель Цитадели Края§r',
            barTitle: 'Хранитель Цитадели Края (Голем Энда)',
            barColor: 'purple',
            rarity: 'rare',
            weight: 30,
            sector: 0,
            dimension: 'minecraft:the_end',
            behavior: 'static_outpost',
            entityType: 'cataclysm:ender_golem',
            maxHp: 350,
            speed: 0.24,
            attackDamage: 15,
            armor: 16,
            armorToughness: 8,
            campType: 'void_camp',
            minions: [
                { type: 'cataclysm:deepling_brute', count: 2, role: 'tank', name: '§5Страж Врат Энда§r', hp: 65, armor: 10, dmg: 8 },
                { type: 'divinerpg:ender_spider', count: 2, role: 'beast', name: '§dПаук Пустоты Края§r', hp: 45, dmg: 7 }
            ],
            abilities: { voidSlamCooldown: 18 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'minecraft:ender_pearl', min: 4, max: 8 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_severing_cleave', chance: 0.35 },
                    { item: 'kubejs:elemental_stone_shadow_3', chance: 0.30 }
                ]
            }
        },

        starlight_titan_bastion: {
            id: 'starlight_titan_bastion',
            displayName: '§b[★ Форпост] Титан Звездного Бастиона§r',
            barTitle: 'Титан Звездного Бастиона (Страж Созвездий)',
            barColor: 'blue',
            rarity: 'rare',
            weight: 30,
            sector: 0,
            dimension: 'eternal_starlight:starlight',
            behavior: 'static_outpost',
            entityType: 'eternal_starlight:starlight_golem',
            maxHp: 320,
            speed: 0.24,
            attackDamage: 14,
            armor: 15,
            armorToughness: 8,
            campType: 'starlight_camp',
            minions: [
                { type: 'eternal_starlight:astral_golem', count: 2, role: 'tank', name: '§bАстральный Защитник§r', hp: 60, armor: 10, dmg: 7 },
                { type: 'eternal_starlight:grimstone_golem', count: 1, role: 'tank', name: '§8Мрачнокаменный Страж§r', hp: 55, armor: 10, dmg: 6 }
            ],
            abilities: { starlightPulseCooldown: 18 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'eternal_starlight:starlight_crystal_shard', min: 3, max: 6 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_lightning_thrust', chance: 0.35 },
                    { item: 'kubejs:elemental_stone_holy_3', chance: 0.30 }
                ]
            }
        },

        sculk_shadow_citadel: {
            id: 'sculk_shadow_citadel',
            displayName: '§1[★ Форпост] Древний Сталкер Бездны§r',
            barTitle: 'Древний Сталкер Бездны (Владыка Скалка)',
            barColor: 'blue',
            rarity: 'rare',
            weight: 30,
            sector: 0,
            dimension: 'deeperdarker:otherside',
            behavior: 'static_outpost',
            entityType: 'deeperdarker:stalker',
            maxHp: 300,
            speed: 0.28,
            attackDamage: 15,
            armor: 14,
            armorToughness: 6,
            campType: 'sculk_redoubt',
            minions: [
                { type: 'deeperdarker:shattered', count: 2, role: 'tank', name: '§1Осколочный Скалк-Пехотинец§r', hp: 55, armor: 8, dmg: 7 },
                { type: 'deeperdarker:sculk_centipede', count: 1, role: 'beast', name: '§3Скалк-Многоножка Охранения§r', hp: 45, dmg: 7 }
            ],
            abilities: { sculkStalkerRoarCooldown: 16 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'minecraft:echo_shard', min: 2, max: 4 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_bone_crusher', chance: 0.35 },
                    { item: 'kubejs:elemental_stone_shadow_3', chance: 0.30 }
                ]
            }
        },

        divine_wildwood_redoubt: {
            id: 'divine_wildwood_redoubt',
            displayName: '§a[★ Форпост] Рыцарь Древнего Диколесья§r',
            barTitle: 'Рыцарь Древнего Диколесья (Элитный Титан)',
            barColor: 'green',
            rarity: 'rare',
            weight: 30,
            sector: 0,
            dimension: 'both',
            behavior: 'static_outpost',
            entityType: 'divinerpg:gruzzorlug_knight',
            maxHp: 320,
            speed: 0.25,
            attackDamage: 14,
            armor: 16,
            armorToughness: 8,
            campType: 'divine_sanctuary',
            minions: [
                { type: 'divinerpg:enchanted_warrior', count: 2, role: 'tank', name: '§aЗачарованный Гвардеец Диколесья§r', hp: 60, armor: 10, dmg: 7 },
                { type: 'divinerpg:sun_archer', count: 2, role: 'ranged', name: '§eЛучник Священной Рощи§r', hp: 45, armor: 6, mainHand: 'minecraft:bow' }
            ],
            abilities: { wildwoodSlamCooldown: 18 },
            loot: {
                guaranteed: [
                    { item: 'kubejs:respec_shard_copper', count: 1 },
                    { item: 'minecraft:emerald', min: 3, max: 6 }
                ],
                chanceLoot: [
                    { item: 'kubejs:martial_tablet_earth_sunder', chance: 0.35 },
                    { item: 'kubejs:elemental_stone_nature_3', chance: 0.30 }
                ]
            }
        }
    }
};

// ==============================================================================
// 🧠 СИСТЕМНОЕ СОСТОЯНИЕ В ПАМЯТИ (TRACKER)
// ==============================================================================
global.ElyriumNomadBosses = global.ElyriumNomadBosses || {};
// Global tracker

function getActiveNomadCount(sector, dimension) {
    let count = 0;
    for (let uuid in (global.ElyriumNomadBosses || {})) {
        let b = global.ElyriumNomadBosses[uuid];
        if (!b) continue;
        if (dimension && b.dimension !== dimension) continue;
        if (sector && b.sector !== sector) continue;
        count++;
    }
    return count;
}

// Проверка расстояния от любой активной банды (Anti-Clustering)
function isTooCloseToOtherBosses(x, z, dimension, minDist) {
    for (let uuid in (global.ElyriumNomadBosses || {})) {
        let b = global.ElyriumNomadBosses[uuid];
        if (!b) continue;
        if (b.dimension === dimension) {
            let distSq = (b.x - x) * (b.x - x) + (b.z - z) * (b.z - z);
            if (distSq < minDist * minDist) {
                return true;
            }
        }
    }
    return false;
}

// Удаление лагеря из блоков мира (Zero-Trash)
function removeCampsiteBlocks(server, campBlocks, dimension) {
    if (!campBlocks || campBlocks.length === 0) return;
    let level = server.getLevel(dimension || 'minecraft:overworld');
    if (!level) return;

    campBlocks.forEach(b => {
        let currentBlock = level.getBlock(b.x, b.y, b.z);
        if (currentBlock && currentBlock.id !== 'minecraft:air') {
            if (currentBlock.id === b.placedId) {
                level.setBlock(b.x, b.y, b.z, b.originalId || 'minecraft:air');
            }
        }
    });
}

function cleanExpiredBosses(server) {
    let now = Date.now();
    let maxLifetimeMs = NOMAD_CONFIG.bossDespawnTimeoutMinutes * 60 * 1000;

    for (let uuid in (global.ElyriumNomadBosses || {})) {
        let boss = global.ElyriumNomadBosses[uuid];
        if (!boss) continue;

        let elapsed = now - boss.spawnTime;
        if (elapsed > maxLifetimeMs) {
            server.runCommandSilent(`bossbar remove nomad_${boss.barId}`);
            if (boss.campBlocks) {
                removeCampsiteBlocks(server, boss.campBlocks, boss.dimension);
            }

            let level = server.getLevel(boss.dimension || 'minecraft:overworld');
            if (level) {
                let bossEnt = level.getEntity(uuid);
                if (bossEnt) bossEnt.discard();
                if (boss.minionUuids) {
                    boss.minionUuids.forEach(mId => {
                        let mEnt = level.getEntity(mId);
                        if (mEnt) mEnt.discard();
                    });
                }
            }

            delete global.ElyriumNomadBosses[uuid];
        }
    }
}

// ==============================================================================
// 🏕️ ПРОЦЕДУРНОЕ РАЗВЕРТЫВАНИЕ ПОЛЕВЫХ СТОЯНОК И ФОРПОСТОВ
// ==============================================================================
function deployCampsite(level, cx, cy, cz, campType) {
    let placedBlocks = [];

    function safePlace(x, y, z, blockId) {
        let existing = level.getBlock(x, y, z);
        let origId = existing ? existing.id : 'minecraft:air';
        if (origId === 'minecraft:air' || origId.includes('grass') || origId.includes('flower') || origId.includes('fern') || origId.includes('nether_sprouts')) {
            level.setBlock(x, y, z, blockId);
            placedBlocks.push({ x: x, y: y, z: z, originalId: origId, placedId: blockId.split('[')[0] });
        }
    }

    if (campType === 'nether_outpost' || campType === 'cult_camp') {
        // Инфернальный редут Незера
        safePlace(cx, cy, cz, 'minecraft:soul_campfire[lit=true]');
        safePlace(cx + 2, cy, cz, 'minecraft:nether_bricks');
        safePlace(cx - 2, cy, cz, 'minecraft:nether_bricks');
        safePlace(cx, cy, cz + 2, 'minecraft:crying_obsidian');
        safePlace(cx + 1, cy, cz + 2, 'minecraft:red_carpet');
        safePlace(cx - 1, cy, cz + 2, 'minecraft:red_carpet');
        safePlace(cx + 2, cy, cz - 2, 'minecraft:barrel');
        safePlace(cx - 2, cy, cz - 2, 'minecraft:barrel');
        safePlace(cx + 3, cy, cz + 1, 'minecraft:chain');
        safePlace(cx + 3, cy + 1, cz + 1, 'minecraft:soul_torch');
    } else if (campType === 'aether_shrine') {
        // Небесное святилище Эфира
        safePlace(cx, cy, cz, 'minecraft:campfire[lit=true]');
        safePlace(cx + 2, cy, cz, 'minecraft:smooth_quartz[axis=y]');
        safePlace(cx - 2, cy, cz, 'minecraft:smooth_quartz[axis=y]');
        safePlace(cx, cy, cz + 2, 'minecraft:chiseled_quartz_block');
        safePlace(cx + 1, cy, cz + 2, 'minecraft:yellow_carpet');
        safePlace(cx - 1, cy, cz + 2, 'minecraft:light_blue_carpet');
        safePlace(cx + 2, cy, cz - 2, 'minecraft:chest');
        safePlace(cx + 3, cy, cz + 1, 'minecraft:iron_bars');
        safePlace(cx + 3, cy + 1, cz + 1, 'minecraft:lantern');
    } else if (campType === 'undergarden_post') {
        // Застава Подземного Сада
        safePlace(cx, cy, cz, 'minecraft:soul_campfire[lit=true]');
        safePlace(cx + 2, cy, cz, 'minecraft:polished_deepslate');
        safePlace(cx - 2, cy, cz, 'minecraft:polished_deepslate');
        safePlace(cx, cy, cz + 2, 'minecraft:red_mushroom_block');
        safePlace(cx + 2, cy, cz - 2, 'minecraft:barrel');
        safePlace(cx + 3, cy, cz + 1, 'minecraft:deepslate_wall');
        safePlace(cx + 3, cy + 1, cz + 1, 'minecraft:soul_torch');
    } else if (campType === 'void_camp') {
        // Редут Пустоты и Края (Сектор IV / The End)
        safePlace(cx, cy, cz, 'minecraft:soul_campfire[lit=true]');
        safePlace(cx + 2, cy, cz, 'minecraft:end_stone_bricks');
        safePlace(cx - 2, cy, cz, 'minecraft:end_stone_bricks');
        safePlace(cx, cy, cz + 2, 'minecraft:purpur_block');
        safePlace(cx + 1, cy, cz + 2, 'minecraft:purple_carpet');
        safePlace(cx - 1, cy, cz + 2, 'minecraft:black_carpet');
        safePlace(cx + 2, cy, cz - 2, 'minecraft:crying_obsidian');
        safePlace(cx - 2, cy, cz - 2, 'minecraft:barrel');
        safePlace(cx + 3, cy, cz + 1, 'minecraft:chain');
        safePlace(cx + 3, cy + 1, cz + 1, 'minecraft:soul_torch');
    } else if (campType === 'starlight_camp') {
        // Звездный лагерь (Eternal Starlight)
        safePlace(cx, cy, cz, 'minecraft:soul_campfire[lit=true]');
        safePlace(cx + 2, cy, cz, 'minecraft:polished_deepslate');
        safePlace(cx - 2, cy, cz, 'minecraft:polished_deepslate');
        safePlace(cx, cy, cz + 2, 'minecraft:chiseled_deepslate');
        safePlace(cx + 1, cy, cz + 2, 'minecraft:light_blue_carpet');
        safePlace(cx - 1, cy, cz + 2, 'minecraft:cyan_carpet');
        safePlace(cx + 2, cy, cz - 2, 'minecraft:barrel');
        safePlace(cx + 3, cy, cz + 1, 'minecraft:deepslate_wall');
        safePlace(cx + 3, cy + 1, cz + 1, 'minecraft:lantern');
    } else if (campType === 'sculk_redoubt') {
        // Скалк-цитадель (Deeper Darker / Скалк-зоны)
        safePlace(cx, cy, cz, 'minecraft:soul_campfire[lit=true]');
        safePlace(cx + 2, cy, cz, 'minecraft:bone_block[axis=y]');
        safePlace(cx - 2, cy, cz, 'minecraft:bone_block[axis=y]');
        safePlace(cx, cy, cz + 2, 'minecraft:sculk');
        safePlace(cx + 1, cy, cz + 2, 'minecraft:black_carpet');
        safePlace(cx - 1, cy, cz + 2, 'minecraft:cyan_carpet');
        safePlace(cx + 2, cy, cz - 2, 'minecraft:barrel');
        safePlace(cx + 3, cy, cz + 1, 'minecraft:deepslate_wall');
        safePlace(cx + 3, cy + 1, cz + 1, 'minecraft:soul_torch');
    } else if (campType === 'divine_sanctuary') {
        // Древнее святилище (DivineRPG)
        safePlace(cx, cy, cz, 'minecraft:campfire[lit=true]');
        safePlace(cx + 2, cy, cz, 'minecraft:smooth_stone');
        safePlace(cx - 2, cy, cz, 'minecraft:smooth_stone');
        safePlace(cx, cy, cz + 2, 'minecraft:gold_block');
        safePlace(cx + 1, cy, cz + 2, 'minecraft:yellow_carpet');
        safePlace(cx - 1, cy, cz + 2, 'minecraft:green_carpet');
        safePlace(cx + 2, cy, cz - 2, 'minecraft:barrel');
        safePlace(cx + 3, cy, cz + 1, 'minecraft:stone_brick_wall');
        safePlace(cx + 3, cy + 1, cz + 1, 'minecraft:torch');
    } else {
        // Стандартный лесной / горный лагерь
        safePlace(cx, cy, cz, 'minecraft:campfire[lit=true]');
        safePlace(cx + 2, cy, cz, 'minecraft:oak_log[axis=z]');
        safePlace(cx - 2, cy, cz, 'minecraft:oak_log[axis=z]');
        safePlace(cx, cy, cz + 2, 'minecraft:hay_block');
        safePlace(cx + 1, cy, cz + 2, 'minecraft:brown_carpet');
        safePlace(cx - 1, cy, cz + 2, 'minecraft:brown_carpet');
        safePlace(cx + 2, cy, cz - 2, 'minecraft:barrel');
        safePlace(cx - 2, cy, cz - 2, 'minecraft:barrel');
        safePlace(cx + 3, cy, cz + 1, 'minecraft:oak_fence');
        safePlace(cx + 3, cy + 1, cz + 1, 'minecraft:oak_fence');
        safePlace(cx + 3, cy + 2, cz + 1, 'minecraft:torch');
    }

    return placedBlocks;
}

// ==============================================================================
// 🛠️ СПАВН ВОЖАКА, СВИТЫ И РЕГИСТРАЦИЯ
// ==============================================================================
function spawnNomadBoss(server, bossId, x, y, z, forcedDim) {
    let config = NOMAD_CONFIG.bosses[bossId];
    if (!config) return null;

    let targetDim = forcedDim || (config.dimension === 'both' ? 'minecraft:overworld' : config.dimension);
    let level = server.getLevel(targetDim);
    if (!level) return null;

    // Развертывание полевой стоянки
    let campBlocks = [];
    if (NOMAD_CONFIG.campSpawnChance && Math.random() <= NOMAD_CONFIG.campSpawnChance) {
        campBlocks = deployCampsite(level, x, y, z, config.campType || 'woodland_camp');
    }

    let bossEntity = level.createEntity(config.entityType);
    if (!bossEntity) return null;

    bossEntity.setPos(x + 0.5, y + 0.5, z + 0.5);
    bossEntity.addTag('elyrium_nomad_boss');
    bossEntity.addTag('nomad_id_' + bossId);
    bossEntity.setCustomName(Text.of(config.displayName));
    bossEntity.setCustomNameVisible(true);

    let spawned = bossEntity.spawn();
    if (!spawned) return null;

    let stringUuid = bossEntity.stringUuid;
    let barId = stringUuid.replace(/-/g, '_').substring(0, 16);

    // Установка атрибутов
    server.runCommandSilent(`attribute ${stringUuid} minecraft:max_health base set ${config.maxHp}`);
    server.runCommandSilent(`attribute ${stringUuid} minecraft:attack_damage base set ${config.attackDamage}`);
    server.runCommandSilent(`attribute ${stringUuid} minecraft:armor base set ${config.armor}`);
    if (config.armorToughness) {
        server.runCommandSilent(`attribute ${stringUuid} minecraft:armor_toughness base set ${config.armorToughness}`);
    }
    if (config.speed) {
        server.runCommandSilent(`attribute ${stringUuid} minecraft:movement_speed base set ${config.speed}`);
    }
    server.runCommandSilent(`attribute ${stringUuid} minecraft:follow_range base set 40`);
    if (config.scale) {
        server.runCommandSilent(`attribute ${stringUuid} minecraft:generic.scale base set ${config.scale}`);
        server.runCommandSilent(`attribute ${stringUuid} minecraft:scale base set ${config.scale}`);
    }
    if (config.entityType === 'minecraft:wolf') {
        server.runCommandSilent(`data merge entity ${stringUuid} {CollarColor:14b,AngryAt:[I;0,0,0,0],AngerTime:99999}`);
    }

    bossEntity.health = config.maxHp;

    // Экипировка
    if (config.mainHand) server.runCommandSilent(`item replace entity ${stringUuid} weapon.mainhand with ${config.mainHand}`);
    if (config.offHand) server.runCommandSilent(`item replace entity ${stringUuid} weapon.offhand with ${config.offHand}`);

    // Боссбар (Диковинки получают notched_20 и особый цвет)
    let barStyle = config.rarity === 'mythic' ? 'notched_20' : 'notched_10';
    server.runCommandSilent(`bossbar add nomad_${barId} "${config.barTitle}"`);
    server.runCommandSilent(`bossbar set nomad_${barId} color ${config.barColor || 'yellow'}`);
    server.runCommandSilent(`bossbar set nomad_${barId} style ${barStyle}`);
    server.runCommandSilent(`bossbar set nomad_${barId} max ${config.maxHp}`);
    server.runCommandSilent(`bossbar set nomad_${barId} value ${config.maxHp}`);

    let minionUuids = [];

    // Спавн ролевой свиты
    if (config.minions && config.minions.length > 0) {
        config.minions.forEach(mGroup => {
            for (let i = 0; i < mGroup.count; i++) {
                let offsetX = (Math.random() - 0.5) * 8;
                let offsetZ = (Math.random() - 0.5) * 8;
                let minion = level.createEntity(mGroup.type);
                if (minion) {
                    minion.setPos(x + offsetX, y, z + offsetZ);
                    minion.addTag('elyrium_nomad_minion');
                    minion.addTag('nomad_parent_' + stringUuid);
                    if (mGroup.role) minion.addTag('nomad_role_' + mGroup.role);

                    let minionName = mGroup.name || `§7[Свита] ${config.displayName}`;
                    minion.setCustomName(Text.of(minionName));
                    minion.setCustomNameVisible(true);

                    if (minion.spawn()) {
                        let mUuid = minion.stringUuid;
                        minionUuids.push(mUuid);

                        if (mGroup.hp) server.runCommandSilent(`attribute ${mUuid} minecraft:max_health base set ${mGroup.hp}`);
                        if (mGroup.armor) server.runCommandSilent(`attribute ${mUuid} minecraft:armor base set ${mGroup.armor}`);
                        if (mGroup.dmg) server.runCommandSilent(`attribute ${mUuid} minecraft:attack_damage base set ${mGroup.dmg}`);
                        server.runCommandSilent(`attribute ${mUuid} minecraft:follow_range base set 36`);

                        if (mGroup.mainHand) server.runCommandSilent(`item replace entity ${mUuid} weapon.mainhand with ${mGroup.mainHand}`);
                        if (mGroup.offHand) server.runCommandSilent(`item replace entity ${mUuid} weapon.offhand with ${mGroup.offHand}`);

                        if (mGroup.aggressive && mGroup.type === 'minecraft:wolf') {
                            server.runCommandSilent(`data merge entity ${mUuid} {AngryAt:[I;0,0,0,0],AngerTime:99999}`);
                        }

                        if (mGroup.hp) minion.health = mGroup.hp;
                    }
                }
            }
        });
    }

    // Аудио-оповещение: Диковинки гремят набатными рогами
    if (config.rarity === 'mythic') {
        server.runCommandSilent(`playsound minecraft:item.goat_horn.sound.1 master @a[x=${x},y=${y},z=${z},distance=..128] ${x} ${y} ${z} 2.0 0.6`);
        server.runCommandSilent(`particle minecraft:totem_of_undying ${x} ${y + 2} ${z} 1.0 1.0 1.0 0.1 50`);
    } else {
        server.runCommandSilent(`playsound minecraft:item.goat_horn.sound.0 neutral @a[x=${x},y=${y},z=${z},distance=..64] ${x} ${y} ${z} 1.5 0.8`);
        server.runCommandSilent(`particle minecraft:campfire_signal_smoke ${x} ${y + 1} ${z} 0.5 1.5 0.5 0.05 35`);
    }

    // Регистрация в реестре
    let now = Date.now();
    global.ElyriumNomadBosses[stringUuid] = {
        uuid: stringUuid,
        barId: barId,
        bossId: bossId,
        name: config.displayName,
        rarity: config.rarity || 'common',
        sector: config.sector || 1,
        dimension: targetDim,
        behavior: (targetDim === 'minecraft:overworld') ? 'nomadic' : 'static_outpost',
        state: 'camping', // 'camping' | 'marching' | 'combat'
        stateChangeTime: now,
        x: Math.floor(x),
        y: Math.floor(y),
        z: Math.floor(z),
        campX: Math.floor(x),
        campY: Math.floor(y),
        campZ: Math.floor(z),
        targetWaypoint: null,
        spawnTime: now,
        lastAbilityTime: 0,
        minionUuids: minionUuids,
        campBlocks: campBlocks
    };

    return global.ElyriumNomadBosses[stringUuid];
}

// ==============================================================================
// ⏱️ ТИКОВЫЙ ЦИКЛ: СПАВН, КОЧЕВОЙ МАРШ, БОССБАРЫ И СВИТА
// ==============================================================================
ServerEvents.tick(event => {
    let server = event.server;
    if (!NOMAD_CONFIG.enabled) return;

    // --------------------------------------------------------------------------
    // 1. ПЕРИОДИЧЕСКИЙ СПАВН ПО КВОТАМ СЕКТОРОВ И ИЗМЕРЕНИЙ (checkIntervalTicks)
    // --------------------------------------------------------------------------
    if (server.tickCount % NOMAD_CONFIG.checkIntervalTicks === 0) {
        cleanExpiredBosses(server);

        let overworld = server.getLevel('minecraft:overworld');
        if (overworld) {
            let players = overworld.players;
            if (players && !players.isEmpty()) {
                players.forEach(p => {
                    if (p.isCreative() || p.isSpectator()) return;

                    let px = p.x;
                    let pz = p.z;
                    let r = Math.sqrt(px * px + pz * pz);

                    // Определение сектора игрока
                    let sector = 0;
                    if (r >= 250 && r <= 1450) sector = 1;
                    else if (r > 1450 && r <= 4500) sector = 2;
                    else if (r > 4500 && r <= 8500) sector = 3;
                    else if (r > 8500 && r <= 13500) sector = 4;

                    if (sector === 0) return;

                    // 1. Проверка секторного лимита
                    let currentSectorCount = getActiveNomadCount(sector, 'minecraft:overworld');
                    let maxSectorCap = NOMAD_CONFIG.sectorCaps[sector] || 5;
                    if (currentSectorCount >= maxSectorCap) return;

                    // 2. Проверка локальной плотности вокруг игрока (макс 1 банда в 120м)
                    let nearbyCount = 0;
                    for (let uuid in (global.ElyriumNomadBosses || {})) {
                        let b = global.ElyriumNomadBosses[uuid];
                        if (b && b.dimension === 'minecraft:overworld') {
                            let dSq = (b.x - px) * (b.x - px) + (b.z - pz) * (b.z - pz);
                            if (dSq < NOMAD_CONFIG.playerLocalRadius * NOMAD_CONFIG.playerLocalRadius) {
                                nearbyCount++;
                            }
                        }
                    }
                    if (nearbyCount >= NOMAD_CONFIG.playerLocalCap) return;

                    // 3. Выбор случайных координат на дистанции 45..75б
                    let angle = Math.random() * Math.PI * 2;
                    let dist = NOMAD_CONFIG.playerSearchRadiusMin + Math.random() * (NOMAD_CONFIG.playerSearchRadiusMax - NOMAD_CONFIG.playerSearchRadiusMin);
                    let spawnX = Math.floor(px + Math.cos(angle) * dist);
                    let spawnZ = Math.floor(pz + Math.sin(angle) * dist);
                    let spawnR = Math.sqrt(spawnX * spawnX + spawnZ * spawnZ);

                    // Валидация радиуса сектора
                    let minR = (sector === 1) ? 250 : (sector === 2) ? 1500 : (sector === 3) ? 4500 : 8500;
                    let maxR = (sector === 1) ? 1450 : (sector === 2) ? 4500 : (sector === 3) ? 8500 : 13500;
                    if (spawnR < minR || spawnR > maxR) return;

                    // 4. Проверка дистанции от других банд (Anti-Clustering >= 250м)
                    if (isTooCloseToOtherBosses(spawnX, spawnZ, 'minecraft:overworld', NOMAD_CONFIG.antiClusteringDistance)) {
                        return;
                    }

                    let topY = overworld.getHeight('motion_blocking', spawnX, spawnZ);
                    if (topY < 55 || topY > 210) return;

                    // 5. Выбор архетипа по весам редкости
                    let eligible = [];
                    for (let id in NOMAD_CONFIG.bosses) {
                        let arc = NOMAD_CONFIG.bosses[id];
                        if (arc.sector === sector && (arc.dimension === 'minecraft:overworld' || arc.dimension === 'both')) {
                            eligible.push(arc);
                        }
                    }

                    if (eligible.length > 0) {
                        let totalWeight = eligible.reduce((sum, a) => sum + (a.weight || 10), 0);
                        let roll = Math.random() * totalWeight;
                        let selected = eligible[0];
                        for (let a of eligible) {
                            roll -= (a.weight || 10);
                            if (roll <= 0) {
                                selected = a;
                                break;
                            }
                        }

                        let spawned = spawnNomadBoss(server, selected.id, spawnX, topY, spawnZ, 'minecraft:overworld');
                        if (spawned) {
                            if (spawned.rarity === 'mythic') {
                                p.tell(Text.gold(`⚡ ВНИМАНИЕ: В вашем секторе пробудилась легендарная ДИКОВИНКА — ${spawned.name}! Приготовьтесь к битве!`));
                            } else {
                                p.displayClientMessage(Text.of(`§6⚔ Разведка доносит: в окрестностях замечен ${spawned.name}!§r`), true);
                            }
                        }
                    }
                });
            }
        }

        // Спавн форпостов в Незере и Эфире
        [
            'minecraft:the_nether',
            'aether:the_aether',
            'undergarden:undergarden',
            'minecraft:the_end',
            'eternal_starlight:starlight',
            'deeperdarker:otherside',
            'divinerpg:eden',
            'divinerpg:wildwood',
            'divinerpg:mortum'
        ].forEach(dimId => {
            let dimLevel = server.getLevel(dimId);
            if (!dimLevel) return;

            let dimPlayers = dimLevel.players;
            if (!dimPlayers || dimPlayers.isEmpty()) return;

            let activeCount = getActiveNomadCount(null, dimId);
            let maxDimCap = NOMAD_CONFIG.dimensionCaps[dimId] || 3;
            if (activeCount >= maxDimCap) return;

            dimPlayers.forEach(p => {
                if (p.isCreative() || p.isSpectator()) return;

                let px = p.x;
                let py = p.y;
                let pz = p.z;

                let angle = Math.random() * Math.PI * 2;
                let dist = 50 + Math.random() * 30;
                let sx = Math.floor(px + Math.cos(angle) * dist);
                let sz = Math.floor(pz + Math.sin(angle) * dist);

                if (isTooCloseToOtherBosses(sx, sz, dimId, 180)) return;

                let sy = Math.floor(py);
                // Поиск твердого блока пола
                let groundY = -1;
                for (let testY = Math.min(220, sy + 15); testY >= Math.max(30, sy - 15); testY--) {
                    let b = dimLevel.getBlock(sx, testY, sz);
                    let above = dimLevel.getBlock(sx, testY + 1, sz);
                    let above2 = dimLevel.getBlock(sx, testY + 2, sz);
                    if (b && b.id !== 'minecraft:air' && b.id !== 'minecraft:lava' && above && above.id === 'minecraft:air' && above2 && above2.id === 'minecraft:air') {
                        groundY = testY + 1;
                        break;
                    }
                }

                if (groundY > 0) {
                    let dimEligible = [];
                    for (let id in NOMAD_CONFIG.bosses) {
                        let arc = NOMAD_CONFIG.bosses[id];
                        if (arc.dimension === dimId) {
                            dimEligible.push(arc);
                        } else if (arc.dimension === 'both') {
                            // Строгая гармонизация секторов Оверворлда с их каноническими измерениями
                            if (dimId === 'minecraft:the_nether' && arc.sector === 2) dimEligible.push(arc);
                            else if (dimId === 'aether:the_aether' && arc.sector === 3) dimEligible.push(arc);
                            else if (dimId === 'minecraft:the_end' && arc.sector === 4) dimEligible.push(arc);
                            else if (dimId.startsWith('divinerpg:') && arc.id === 'divine_wildwood_redoubt') dimEligible.push(arc);
                        }
                    }

                    if (dimEligible.length > 0) {
                        // Взвешенный ролл редкости (Common, Uncommon, Rare, Mythic)
                        let totalWeight = dimEligible.reduce((sum, a) => sum + (a.weight || 10), 0);
                        let roll = Math.random() * totalWeight;
                        let selected = dimEligible[0];
                        for (let a of dimEligible) {
                            roll -= (a.weight || 10);
                            if (roll <= 0) {
                                selected = a;
                                break;
                            }
                        }
                        spawnNomadBoss(server, selected.id, sx, groundY, sz, dimId);
                    }
                }
            });
        });
    }

    // --------------------------------------------------------------------------
    // 2. ДВИЖОК КОЧЕВОГО МАРША И БОССБАРОВ (Каждые 20 тиков = 1 сек)
    // --------------------------------------------------------------------------
    if (server.tickCount % 20 === 0) {
        let now = Date.now();

        for (let uuid in (global.ElyriumNomadBosses || {})) {
            let bInfo = global.ElyriumNomadBosses[uuid];
            if (!bInfo) continue;

            let level = server.getLevel(bInfo.dimension || 'minecraft:overworld');
            if (!level) continue;

            let entity = level.getEntity(uuid);
            if (!entity || !entity.isLiving() || !entity.isAlive()) {
                server.runCommandSilent(`bossbar remove nomad_${bInfo.barId}`);
                if (bInfo.campBlocks) removeCampsiteBlocks(server, bInfo.campBlocks, bInfo.dimension);
                delete global.ElyriumNomadBosses[uuid];
                continue;
            }

            bInfo.x = Math.floor(entity.x);
            bInfo.y = Math.floor(entity.y);
            bInfo.z = Math.floor(entity.z);

            // Обновление здоровья боссбара
            let curHp = Math.max(0, Math.floor(entity.health));
            server.runCommandSilent(`bossbar set nomad_${bInfo.barId} value ${curHp}`);

            // Поиск игроков рядом
            let nearPlayers = level.getEntitiesWithin(AABB.of(
                entity.x - NOMAD_CONFIG.combatRadius, entity.y - 16, entity.z - NOMAD_CONFIG.combatRadius,
                entity.x + NOMAD_CONFIG.combatRadius, entity.y + 16, entity.z + NOMAD_CONFIG.combatRadius
            )).filter(e => e.isPlayer() && !e.isSpectator());

            // Управление входом/выходом из боя
            if (nearPlayers.length > 0 || entity.lastHurtByMob) {
                bInfo.state = 'combat';
                let playerNames = nearPlayers.map(p => p.username).join(' ');
                server.runCommandSilent(`bossbar set nomad_${bInfo.barId} players ${playerNames}`);
                server.runCommandSilent(`bossbar set nomad_${bInfo.barId} visible true`);
            } else {
                server.runCommandSilent(`bossbar set nomad_${bInfo.barId} visible false`);
                if (bInfo.state === 'combat') {
                    // Возврат в спокойное состояние через 10 секунд без игроков
                    bInfo.state = 'camping';
                    bInfo.stateChangeTime = now;
                }
            }

            // ------------------------------------------------------------------
            // 🚶 КОЧЕВОЙ ЦИКЛ ОВЕРВОРЛДА: CAMPING <-> MARCHING
            // ------------------------------------------------------------------
            if (bInfo.behavior === 'nomadic' && bInfo.state !== 'combat') {
                let stateTime = (now - bInfo.stateChangeTime) / 1000;

                // Переход: Привал -> Пора в путь (Марш)
                if (bInfo.state === 'camping' && stateTime >= NOMAD_CONFIG.campDurationSeconds) {
                    // 1. Сворачиваем старый лагерь
                    if (bInfo.campBlocks) {
                        removeCampsiteBlocks(server, bInfo.campBlocks, bInfo.dimension);
                        bInfo.campBlocks = [];
                    }

                    // 2. Выбираем новую путевую точку (45..80м вперед в пределах сектора)
                    let marchAngle = Math.random() * Math.PI * 2;
                    let marchDist = 45 + Math.random() * 35;
                    let targetX = Math.floor(entity.x + Math.cos(marchAngle) * marchDist);
                    let targetZ = Math.floor(entity.z + Math.sin(marchAngle) * marchDist);
                    let targetR = Math.sqrt(targetX * targetX + targetZ * targetZ);

                    let minR = (bInfo.sector === 1) ? 250 : (bInfo.sector === 2) ? 1500 : 4500;
                    let maxR = (bInfo.sector === 1) ? 1450 : (bInfo.sector === 2) ? 4500 : 8500;

                    // Если точка выходит за границы сектора — разворачиваем обратно
                    if (targetR < minR || targetR > maxR) {
                        marchAngle += Math.PI;
                        targetX = Math.floor(entity.x + Math.cos(marchAngle) * marchDist);
                        targetZ = Math.floor(entity.z + Math.sin(marchAngle) * marchDist);
                    }

                    let groundY = level.getHeight('motion_blocking', targetX, targetZ);
                    bInfo.targetWaypoint = { x: targetX, y: groundY, z: targetZ };
                    bInfo.state = 'marching';
                    bInfo.stateChangeTime = now;

                    // Звук шага отряда
                    server.runCommandSilent(`playsound minecraft:entity.iron_golem.step neutral @a[x=${entity.x},y=${entity.y},z=${entity.z},distance=..32] ${entity.x} ${entity.y} ${entity.z} 1.0 0.8`);
                }

                // Переход: Марш -> Прибыли на место (Новый привал)
                if (bInfo.state === 'marching' && bInfo.targetWaypoint) {
                    let distToWp = Math.sqrt(
                        (entity.x - bInfo.targetWaypoint.x) * (entity.x - bInfo.targetWaypoint.x) +
                        (entity.z - bInfo.targetWaypoint.z) * (entity.z - bInfo.targetWaypoint.z)
                    );

                    if (distToWp <= 5.0 || stateTime >= NOMAD_CONFIG.marchDurationMaxSeconds) {
                        // Развертывание нового лагеря
                        let campY = level.getHeight('motion_blocking', Math.floor(entity.x), Math.floor(entity.z));
                        let cfg = NOMAD_CONFIG.bosses[bInfo.bossId];
                        bInfo.campBlocks = deployCampsite(level, Math.floor(entity.x), campY, Math.floor(entity.z), cfg ? cfg.campType : 'woodland_camp');
                        bInfo.state = 'camping';
                        bInfo.stateChangeTime = now;
                        bInfo.targetWaypoint = null;

                        server.runCommandSilent(`playsound minecraft:item.flintandsteel.use neutral @a[x=${entity.x},y=${entity.y},z=${entity.z},distance=..32] ${entity.x} ${entity.y} ${entity.z} 1.2 1.0`);
                    }
                }
            }

            // ------------------------------------------------------------------
            // 🛡️ ТАКТИЧЕСКИЙ СТРОЙ И СИНХРОННОЕ ДВИЖЕНИЕ СВИТЫ
            // ------------------------------------------------------------------
            if (bInfo.minionUuids && bInfo.minionUuids.length > 0) {
                let aliveMinions = [];
                bInfo.minionUuids.forEach(mUuid => {
                    let minionEnt = level.getEntity(mUuid);
                    if (minionEnt && minionEnt.isLiving() && minionEnt.isAlive()) {
                        aliveMinions.push(mUuid);

                        let distToLeader = Math.sqrt(
                            (minionEnt.x - entity.x) * (minionEnt.x - entity.x) +
                            (minionEnt.z - entity.z) * (minionEnt.z - entity.z)
                        );

                        // Если на марше: свита держит дистанцию 4-8 блоков за вожаком
                        if (bInfo.state === 'marching') {
                            if (distToLeader > 8.0) {
                                minionEnt.potionEffects.add('minecraft:speed', 60, 1, false, false);
                                let dx = (entity.x - minionEnt.x) / distToLeader * 0.35;
                                let dz = (entity.z - minionEnt.z) / distToLeader * 0.35;
                                minionEnt.setDeltaMovement(dx, 0.05, dz);
                            }
                        } else if (distToLeader > 18.0) {
                            // Обычное стягивание при отставании в бою или лагере
                            minionEnt.potionEffects.add('minecraft:speed', 80, 1, false, false);
                            let dx = (entity.x - minionEnt.x) / distToLeader * 0.4;
                            let dz = (entity.z - minionEnt.z) / distToLeader * 0.4;
                            minionEnt.setDeltaMovement(dx, 0.1, dz);
                        }
                    }
                });
                bInfo.minionUuids = aliveMinions;
            }
        }
    }

    // --------------------------------------------------------------------------
    // 3. ФИЗИЧЕСКИЙ ШАГ ПОХОДНОГО МАРША (Каждые marchTickInterval = 2 сек)
    // --------------------------------------------------------------------------
    if (server.tickCount % NOMAD_CONFIG.marchTickInterval === 0) {
        for (let uuid in (global.ElyriumNomadBosses || {})) {
            let bInfo = global.ElyriumNomadBosses[uuid];
            if (!bInfo || bInfo.state !== 'marching' || !bInfo.targetWaypoint) continue;

            let level = server.getLevel(bInfo.dimension || 'minecraft:overworld');
            if (!level) continue;

            let entity = level.getEntity(uuid);
            if (!entity || !entity.isLiving() || !entity.isAlive()) continue;

            let dx = bInfo.targetWaypoint.x - entity.x;
            let dz = bInfo.targetWaypoint.z - entity.z;
            let dist = Math.sqrt(dx * dx + dz * dz);

            if (dist > 3.0) {
                let speedMod = 0.25;
                let moveX = (dx / dist) * speedMod;
                let moveZ = (dz / dist) * speedMod;

                entity.potionEffects.add('minecraft:speed', 50, 0, false, false);
                entity.setDeltaMovement(moveX, 0.05, moveZ);

                // Походные частицы шага
                server.runCommandSilent(`particle minecraft:dust 0.6 0.5 0.3 1.0 ${entity.x} ${entity.y} ${entity.z} 0.3 0.1 0.3 0.02 5`);
            }
        }
    }
});

// ==============================================================================
// 💥 ПЕРЕХВАТ УРОНА: АГРО СВИТЫ И ЗАЩИТА ВОЖАКА
// ==============================================================================
EntityEvents.beforeHurt(event => {
    let target = event.entity;
    if (!target || !target.isLiving()) return;

    let server = event.server;
    let level = target.level;
    let attacker = event.source.actual;

    if (target.tags.contains('elyrium_nomad_boss')) {
        let stringUuid = target.stringUuid;
        let bossInfo = global.ElyriumNomadBosses[stringUuid];
        if (!bossInfo) return;

        // Немедленное прерывание марша при атаке!
        bossInfo.state = 'combat';

        // Свита бросается на обидчика Вожака
        if (attacker && attacker.isPlayer() && bossInfo.minionUuids) {
            bossInfo.minionUuids.forEach(mUuid => {
                let mEnt = level.getEntity(mUuid);
                if (mEnt && mEnt.isLiving() && mEnt.isAlive()) {
                    server.runCommandSilent(`execute as ${mUuid} run data merge entity @s {AngryAt:[I;0,0,0,0],AngerTime:600}`);
                }
            });
        }

        // Рыцарский блок щитом (-50% урона в лоб)
        if (bossInfo.bossId === 'fallen_deserter_knight' && attacker && attacker.isPlayer()) {
            event.damage = event.damage * 0.5;
            server.runCommandSilent(`playsound minecraft:item.shield.block player @a[x=${target.x},y=${target.y},z=${target.z},distance=..16] ${target.x} ${target.y} ${target.z} 1.0 1.0`);
        }
    }
});

// ==============================================================================
// 🏆 СМЕРТЬ ВОЖАКА: ДЕБАФФ СВИТЫ, ЛУТ И ЧИСТОВОЕ УДАЛЕНИЕ СТОЯНКИ
// ==============================================================================
EntityEvents.death(event => {
    let entity = event.entity;
    if (!entity || !entity.isLiving()) return;

    if (entity.tags.contains('elyrium_nomad_boss')) {
        let stringUuid = entity.stringUuid;
        let bossInfo = global.ElyriumNomadBosses[stringUuid];
        let bossId = bossInfo ? bossInfo.bossId : null;

        if (!bossId) {
            entity.tags.forEach(t => {
                if (t.startsWith('nomad_id_')) bossId = t.replace('nomad_id_', '');
            });
        }

        let config = NOMAD_CONFIG.bosses[bossId];
        let server = event.server;
        let level = entity.level;

        // 1. Дебафф «Потеря Лидера» для свиты
        if (bossInfo && bossInfo.minionUuids) {
            bossInfo.minionUuids.forEach(mUuid => {
                let mEnt = level.getEntity(mUuid);
                if (mEnt && mEnt.isLiving() && mEnt.isAlive()) {
                    mEnt.potionEffects.add('minecraft:weakness', 140, 1, false, true);
                    mEnt.potionEffects.add('minecraft:slowness', 100, 1, false, true);
                    server.runCommandSilent(`particle minecraft:cloud ${mEnt.x} ${mEnt.y + 1} ${mEnt.z} 0.5 0.5 0.5 0.05 10`);
                }
            });
        }

        // 2. Очистка боссбара и лагеря
        if (bossInfo) {
            server.runCommandSilent(`bossbar remove nomad_${bossInfo.barId}`);
            if (bossInfo.campBlocks) {
                server.scheduleInTicks(600, () => {
                    removeCampsiteBlocks(server, bossInfo.campBlocks, bossInfo.dimension);
                });
            }
            delete global.ElyriumNomadBosses[stringUuid];
        }

        let bossTitle = config ? config.displayName : 'Кочевой Вожак';

        // Звуковой триумф
        server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete master @a[x=${entity.x},y=${entity.y},z=${entity.z},distance=..48] ${entity.x} ${entity.y} ${entity.z} 1.2 1.0`);
        server.runCommandSilent(`particle minecraft:totem_of_undying ${entity.x} ${entity.y + 1} ${entity.z} 0.6 0.8 0.6 0.2 40`);

        let nearPlayers = level.getEntitiesWithin(AABB.of(
            entity.x - 48, entity.y - 16, entity.z - 48,
            entity.x + 48, entity.y + 16, entity.z + 48
        )).filter(e => e.isPlayer());

        nearPlayers.forEach(p => {
            p.tell(Text.gold('═════════════════════════════════════════════════════'));
            p.tell(Text.yellow(`🏆 ВОЖАК ПОВЕРЖЕН: ${bossTitle}`));
            p.tell(Text.green('   Лидер пал! Свита деморализована, лагерь разгромлен.'));
            p.tell(Text.gold('═════════════════════════════════════════════════════'));
        });

        // 3. Выдача RPG-Лута
        if (config && config.loot) {
            if (config.loot.guaranteed) {
                config.loot.guaranteed.forEach(g => {
                    let count = g.count || (g.min + Math.floor(Math.random() * (g.max - g.min + 1)));
                    let drop = level.createEntity('minecraft:item');
                    if (drop) {
                        drop.setPos(entity.x, entity.y + 0.5, entity.z);
                        drop.item = Item.of(g.item, count);
                        drop.spawn();
                    }
                });
            }

            if (config.loot.chanceLoot) {
                config.loot.chanceLoot.forEach(c => {
                    if (Math.random() <= c.chance) {
                        let count = c.count || 1;
                        let drop = level.createEntity('minecraft:item');
                        if (drop) {
                            drop.setPos(entity.x, entity.y + 0.5, entity.z);
                            drop.item = Item.of(c.item, count);
                            drop.spawn();
                        }
                    }
                });
            }
        }
    }
});

// ==============================================================================
// 💬 КОМАНДНАЯ СТРОКА ДЛЯ КУРАТОРА И ТЕСТИРОВАНИЯ (/nomad)
// ==============================================================================
ServerEvents.command(event => {
    let command = event.parseResults.reader.string.trim();
    if (!command.startsWith('nomad')) return;

    let player = event.parseResults.context.source.player;
    let server = event.server;
    let parts = command.split(/\s+/);
    let subCmd = parts[1] ? parts[1].toLowerCase() : 'help';

    if (subCmd === 'spawn') {
        let bossId = parts[2] ? parts[2].toLowerCase() : 'bandit_warlord';
        if (!NOMAD_CONFIG.bosses[bossId]) {
            let valid = Object.keys(NOMAD_CONFIG.bosses).join(', ');
            let msg = `§cНеизвестный архетип: ${bossId}! Доступные: ${valid}`;
            if (player) player.displayClientMessage(Text.of(msg), false);
            else server.tell(Text.of(msg));
            return;
        }

        let sx = player ? Math.floor(player.x + 3) : 0;
        let sy = player ? Math.floor(player.y) : 65;
        let sz = player ? Math.floor(player.z + 3) : 0;

        let forcedDim = player ? player.level.dimension.toString() : 'minecraft:overworld';
        let spawned = spawnNomadBoss(server, bossId, sx, sy, sz, forcedDim);
        let msg = spawned ? `§a[Nomad] Успешно призван ${spawned.name} (${spawned.rarity}) на (${sx}, ${sy}, ${sz}) в ${forcedDim}!` : `§cОшибка спавна!`;
        if (player) player.displayClientMessage(Text.of(msg), false);
        else server.tell(Text.of(msg));
        return;
    }

    if (subCmd === 'list') {
        let count = 0;
        let msg = `§6=== АКТИВНЫЕ БАНДЫ И ФОРПОСТЫ ===§r\n`;
        for (let uuid in (global.ElyriumNomadBosses || {})) {
            let b = global.ElyriumNomadBosses[uuid];
            if (b) {
                count++;
                msg += `§e• ${b.name} §7[${b.rarity}] (${b.dimension}, Сектор ${b.sector}) [${b.x}, ${b.y}, ${b.z}] Состояние: ${b.state}\n`;
            }
        }
        if (count === 0) msg += `§7Нет активных кочевых банд.\n`;
        if (player) player.displayClientMessage(Text.of(msg), false);
        else server.tell(Text.of(msg));
        return;
    }

    if (subCmd === 'clear') {
        let count = 0;
        for (let uuid in (global.ElyriumNomadBosses || {})) {
            let b = global.ElyriumNomadBosses[uuid];
            if (b) {
                server.runCommandSilent(`bossbar remove nomad_${b.barId}`);
                if (b.campBlocks) removeCampsiteBlocks(server, b.campBlocks, b.dimension);
                let level = server.getLevel(b.dimension || 'minecraft:overworld');
                if (level) {
                    let ent = level.getEntity(uuid);
                    if (ent) ent.discard();
                    if (b.minionUuids) {
                        b.minionUuids.forEach(mId => {
                            let mEnt = level.getEntity(mId);
                            if (mEnt) mEnt.discard();
                        });
                    }
                }
                count++;
            }
        }
        global.ElyriumNomadBosses = {};
    // Global tracker
        let msg = `§a[Nomad] Успешно удалено ${count} активных банд и зачищены лагеря!`;
        if (player) player.displayClientMessage(Text.of(msg), false);
        else server.tell(Text.of(msg));
        return;
    }

    let helpMsg = `§6=== КОМАНДЫ ДВИЖКА КОЧЕВЫХ БАНД ===\n§e/nomad spawn <id> §7- Призвать банду/форпост\n§e/nomad list §7- Список активных отрядов\n§e/nomad clear §7- Удалить все отряды и убрать лагеря`;
    if (player) player.displayClientMessage(Text.of(helpMsg), false);
    else server.tell(Text.of(helpMsg));
});
