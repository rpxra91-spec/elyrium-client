// ==============================================================================
// 🐺 ELYRIUM RPG: NOMADIC WARBANDS & FIELD CAMPS ENGINE (v1.2)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 1. Sector-Based Roaming Warbands & Field Camps:
//    - Sector I (R = 250..1450m): 4 Distinct Warbands with full role synergy.
//    - Spawn protection around capital / origin (R < 250m is strictly forbidden).
// 2. 4 Unique Warband Archetypes with 3D-Models from Mods:
//    - 🪓 bandit_warlord: Атаман Черной Дубравы (Royal Draugr + Elite Shield Draugr + Koboleton Snipers + Amethyst Hound + Herbalist).
//    - 🐺 direwolf_alpha: Седогривый Вожак Стаи (Alpha Wolf 1.35x + Glacon Beast + Lonestar Pathfinder + Fierce Wolves + Pack Shaman).
//    - 🛡️ fallen_deserter_knight: Отверженный Рыцарь-Дезертир (Citadel Keeper + Heavy Squires + Sun Marksman + War Mastiff + Renegade Cryomancer).
//    - ⛰️ mountain_brigand_gang: Ватага Горных Грабителей (Cyclops Overseer + Heavy Draugr Thug + Koboleton Skirmishers + Pack Ratlin + Arsonist Pyromancer).
// 3. Dynamic Squad AI & Role Synergy:
//    - Retinue actively defends Leader (aggro redirection upon leader hurt).
//    - Retinue leashing (minions pull back if > 18 blocks away).
//    - Leadership Lost debuff (Weakness & panic upon leader demise).
// 4. Procedural Field Campsites:
//    - Atmospheric campfire, sleeping rolls, supply barrels, and watch totem.
//    - Clean cleanup protocol upon warband clear or expiration (Zero-Trash).
// 5. Anti-Trash RPG Loot & Tuning:
//    - Respec catalysts, epoch ingots, Martial Arts tablets, Elemental stones.
//    - Live tuning via NOMAD_CONFIG and `/kubejs reload server_scripts`.
// ==============================================================================

// ==============================================================================
// ⚙️ LIVE CONFIGURATION BLOCK (ИЗМЕНЕНИЯ ПРИМЕНЯЮТСЯ НА ЛЕТУ ЧЕРЕЗ /kubejs reload)
// ==============================================================================
const NOMAD_CONFIG = {
    enabled: true,
    checkIntervalTicks: 400,       // Интервал проверки спавна: каждые 20 сек
    maxActivePerSector1: 3,        // Максимум активных банд в Секторе I одновременно
    spawnMinR: 250,                // Минимальный радиус от спавна (безопасная гавань)
    spawnMaxR: 1450,               // Максимальный радиус Сектора I (до стены 1500м)
    playerSearchRadiusMin: 45,     // Минимальная дистанция от игрока при спавне
    playerSearchRadiusMax: 75,     // Максимальная дистанция от игрока при спавне
    combatRadius: 32,              // Радиус активности боя и боссбара
    bossDespawnTimeoutMinutes: 30, // Авто-уход банды, если бой не завершен за 30 минут
    campSpawnChance: 0.85,         // Шанс развертывания лагерной стоянки вокруг костра

    // --------------------------------------------------------------------------
    // ⚔️ БОЕВЫЕ БАНДЫ СЕКТОРА I (OVERWORLD TIER 1)
    // --------------------------------------------------------------------------
    bosses: {
        bandit_warlord: {
            id: 'bandit_warlord',
            displayName: '§6[★ Вожак] Атаман Черной Дубравы§r',
            barTitle: 'Атаман Черной Дубравы (Королевский Драугр)',
            barColor: 'yellow',
            entityType: 'cataclysm:royal_draugr', // Северный вожак в рогатом шлеме и латах
            maxHp: 140,
            speed: 0.28,
            attackDamage: 7,
            armor: 9,
            armorToughness: 3,
            mainHand: 'minecraft:iron_sword',
            offHand: 'minecraft:shield',
            biomes: ['forest', 'plains', 'birch_forest', 'dark_forest'],
            campType: 'woodland_camp',
            minions: [
                // 1. Щитовик Авангарда
                { type: 'cataclysm:elite_draugr', count: 1, role: 'tank', name: '§eЭлитный Драугр-Щитовик§r', hp: 45, armor: 8, mainHand: 'minecraft:iron_axe', offHand: 'minecraft:shield' },
                // 2. Стрелки-Застрельщики
                { type: 'cataclysm:koboleton', count: 2, role: 'ranged', name: '§fКобольд-Снайпер§r', hp: 26, armor: 4, mainHand: 'minecraft:crossbow' },
                // 3. Зверь-Преследователь
                { type: 'cataclysm:amethyst_crab', count: 1, role: 'beast', name: '§dПещерный Краб-Гончая§r', hp: 38, armor: 6, dmg: 5 },
                // 4. Саппорт / Мини-Элита
                { type: 'irons_spellbooks:apothecarist', count: 1, role: 'caster', name: '§aПолевой Травник Банды§r', hp: 32, armor: 4 }
            ],
            abilities: {
                warCryCooldown: 35, // секунд
                warCryHpThreshold: 0.55 // срабатывает ниже 55% HP
            },
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
            entityType: 'minecraft:wolf',
            scale: 1.35, // Увеличенный размер Лютоволка
            maxHp: 120,
            speed: 0.35,
            attackDamage: 6,
            armor: 6,
            armorToughness: 2,
            biomes: ['taiga', 'snowy_taiga', 'plains', 'forest', 'meadow'],
            campType: 'den_camp',
            minions: [
                // 1. Зверь Авангарда
                { type: 'divinerpg:glacon', count: 1, role: 'tank', name: '§bМорозный Зверь-Авангард§r', hp: 55, armor: 6, dmg: 5 },
                // 2. Стрелок-Охотник
                { type: 'eternal_starlight:lonestar_skeleton', count: 1, role: 'ranged', name: '§bОхотник Звездных Пустошей§r', hp: 28, armor: 4, mainHand: 'minecraft:bow' },
                // 3. Волки-Преследователи
                { type: 'minecraft:wolf', count: 3, role: 'beast', name: '§7Свирепый Волк Стаи§r', aggressive: true, hp: 24, dmg: 4 },
                // 4. Шаман Стаи
                { type: 'divinerpg:kobblin', count: 1, role: 'caster', name: '§6Шаман Стаи Кобблин§r', hp: 30, armor: 3, mainHand: 'minecraft:stick' }
            ],
            abilities: {
                fearHowlCooldown: 20 // секунд
            },
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
            entityType: 'irons_spellbooks:citadel_keeper', // Монументальный закованный в железо темный рыцарь
            maxHp: 160,
            speed: 0.24,
            attackDamage: 8,
            armor: 12,
            armorToughness: 4,
            mainHand: 'minecraft:iron_sword',
            offHand: 'minecraft:shield',
            biomes: ['plains', 'meadow', 'sunflower_plains', 'river', 'beach'],
            campType: 'knight_outpost',
            minions: [
                // 1. Закованный в железо Оруженосец
                { type: 'divinerpg:enchanted_warrior', count: 1, role: 'tank', name: '§9Зачарованный Оруженосец§r', hp: 42, armor: 8, mainHand: 'minecraft:iron_sword', offHand: 'minecraft:shield' },
                // 2. Стрелок Солнечных Пустошей
                { type: 'divinerpg:sun_archer', count: 1, role: 'ranged', name: '§6Мятежный Стрелок-Застрельщик§r', hp: 28, armor: 4, mainHand: 'minecraft:bow' },
                // 3. Боевой Мастиф
                { type: 'minecraft:wolf', count: 1, role: 'beast', name: '§8Сторожевой Мастиф Конвоя§r', aggressive: true, hp: 30, dmg: 4 },
                // 4. Отступник Криомантии
                { type: 'irons_spellbooks:cryomancer', count: 1, role: 'caster', name: '§bРенегат Ордена Криомантов§r', hp: 35, armor: 5 }
            ],
            abilities: {
                shieldGuardReduction: 0.50, // блокирует 50% урона в лоб
                slamCooldown: 16 // секунд
            },
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
            entityType: 'divinerpg:cyclops', // Одноглазый свирепый гигант
            maxHp: 150,
            speed: 0.25,
            attackDamage: 8,
            armor: 8,
            armorToughness: 2,
            biomes: ['windswept_hills', 'stony_peaks', 'savanna', 'badlands', 'plateau'],
            campType: 'brigand_redoubt',
            minions: [
                // 1. Латный Громила
                { type: 'cataclysm:draugr', count: 1, role: 'tank', name: '§8Горный Громила-Драугр§r', hp: 40, armor: 6, mainHand: 'minecraft:iron_axe' },
                // 2. Стрелок-Кобольд
                { type: 'cataclysm:koboleton', count: 2, role: 'ranged', name: '§6Кобольд-Застрельщик Пустошей§r', hp: 24, armor: 3, mainHand: 'minecraft:crossbow' },
                // 3. Зверь-Преследователь
                { type: 'eternal_starlight:ratlin', count: 1, role: 'beast', name: '§7Прирученный Пещерный Ратлин§r', hp: 28, armor: 3, dmg: 4 },
                // 4. Поджигатель-Пиромант
                { type: 'irons_spellbooks:pyromancer', count: 1, role: 'caster', name: '§cБеглый Пиромант-Поджигатель§r', hp: 32, armor: 4 }
            ],
            abilities: {
                cyclopsSmashCooldown: 18 // секунд
            },
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
        }
    }
};

// ==============================================================================
// 🧠 СИСТЕМНОЕ СОСТОЯНИЕ В ПАМЯТИ (TRACKER)
// ==============================================================================
if (!global.ElyriumNomadBosses) {
    global.ElyriumNomadBosses = {};
}

function getActiveNomadCount(sector) {
    let count = 0;
    for (let uuid in global.ElyriumNomadBosses) {
        let boss = global.ElyriumNomadBosses[uuid];
        if (!boss) continue;
        if (!sector || boss.sector === sector) {
            count++;
        }
    }
    return count;
}

// Удаление лагеря из блоков мира
function removeCampsiteBlocks(server, campBlocks) {
    if (!campBlocks || campBlocks.length === 0) return;
    let overworld = server.getLevel('minecraft:overworld');
    if (!overworld) return;

    campBlocks.forEach(b => {
        let currentBlock = overworld.getBlock(b.x, b.y, b.z);
        if (currentBlock && currentBlock.id !== 'minecraft:air') {
            // Удаляем только блоки, которые мы ставили
            if (currentBlock.id === b.placedId) {
                overworld.setBlock(b.x, b.y, b.z, b.originalId || 'minecraft:air');
            }
        }
    });
}

function cleanExpiredBosses(server) {
    let now = Date.now();
    let maxLifetimeMs = NOMAD_CONFIG.bossDespawnTimeoutMinutes * 60 * 1000;
    let overworld = server.getLevel('minecraft:overworld');

    for (let uuid in global.ElyriumNomadBosses) {
        let boss = global.ElyriumNomadBosses[uuid];
        if (!boss) continue;

        let elapsed = now - boss.spawnTime;
        if (elapsed > maxLifetimeMs) {
            // Remove bossbar
            server.runCommandSilent(`bossbar remove nomad_${boss.barId}`);

            // Remove camp blocks cleanly
            if (boss.campBlocks) {
                removeCampsiteBlocks(server, boss.campBlocks);
            }

            // Discard entities
            if (overworld) {
                let bossEnt = overworld.getEntity(uuid);
                if (bossEnt) bossEnt.discard();
                if (boss.minionUuids) {
                    boss.minionUuids.forEach(mId => {
                        let mEnt = overworld.getEntity(mId);
                        if (mEnt) mEnt.discard();
                    });
                }
            }

            delete global.ElyriumNomadBosses[uuid];
        }
    }
}

// ==============================================================================
// 🏕️ ПРОЦЕДУРНОЕ РАЗВЕРТЫВАНИЕ ПОЛЕВОГО ЛАГЕРЯ (FIELD CAMPSITE)
// ==============================================================================
function deployCampsite(overworld, cx, cy, cz, campType) {
    let placedBlocks = [];

    function safePlace(x, y, z, blockId) {
        let existing = overworld.getBlock(x, y, z);
        let origId = existing ? existing.id : 'minecraft:air';
        // Не ломаем твердые природные блоки основания, ставим только на/в воздух/траву
        if (origId === 'minecraft:air' || origId.includes('grass') || origId.includes('flower') || origId.includes('fern')) {
            overworld.setBlock(x, y, z, blockId);
            placedBlocks.push({ x: x, y: y, z: z, originalId: origId, placedId: blockId.split('[')[0] });
        }
    }

    // 1. Центральный костер стоянки
    safePlace(cx, cy, cz, 'minecraft:campfire[lit=true]');

    // 2. Сидячие бревна / тюки вокруг костра
    safePlace(cx + 2, cy, cz, 'minecraft:oak_log[axis=z]');
    safePlace(cx - 2, cy, cz, 'minecraft:oak_log[axis=z]');

    // 3. Спальные лежанки / палаточный угол (шерсть + ковер)
    safePlace(cx, cy, cz + 2, 'minecraft:hay_block');
    safePlace(cx + 1, cy, cz + 2, 'minecraft:brown_carpet');
    safePlace(cx - 1, cy, cz + 2, 'minecraft:brown_carpet');

    // 4. Бочки с припасами и ящики стоянки
    safePlace(cx + 2, cy, cz - 2, 'minecraft:barrel');
    safePlace(cx - 2, cy, cz - 2, 'minecraft:barrel');

    // 5. Сторожевой тотем / шест с факелом
    safePlace(cx + 3, cy, cz + 1, 'minecraft:oak_fence');
    safePlace(cx + 3, cy + 1, cz + 1, 'minecraft:oak_fence');
    safePlace(cx + 3, cy + 2, cz + 1, 'minecraft:torch');

    return placedBlocks;
}

// ==============================================================================
// 🛠️ ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ СПАВНА И ЭКИПИРОВКИ
// ==============================================================================
function spawnNomadBoss(server, bossId, x, y, z, forced) {
    let config = NOMAD_CONFIG.bosses[bossId];
    if (!config) return null;

    let overworld = server.getLevel('minecraft:overworld');
    if (!overworld) return null;

    // Развертывание полевой стоянки лагеря (если включено)
    let campBlocks = [];
    if (NOMAD_CONFIG.campSpawnChance && Math.random() <= NOMAD_CONFIG.campSpawnChance) {
        campBlocks = deployCampsite(overworld, x, y, z, config.campType || 'woodland_camp');
    }

    let bossEntity = overworld.createEntity(config.entityType);
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

    // Apply attributes via reliable server commands
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

    // Reset current HP to max
    bossEntity.health = config.maxHp;

    // Equip Armor & Weapons
    if (config.mainHand) server.runCommandSilent(`item replace entity ${stringUuid} weapon.mainhand with ${config.mainHand}`);
    if (config.offHand) server.runCommandSilent(`item replace entity ${stringUuid} weapon.offhand with ${config.offHand}`);
    if (config.helmet) server.runCommandSilent(`item replace entity ${stringUuid} armor.head with ${config.helmet}`);
    if (config.chest) server.runCommandSilent(`item replace entity ${stringUuid} armor.chest with ${config.chest}`);
    if (config.legs) server.runCommandSilent(`item replace entity ${stringUuid} armor.legs with ${config.legs}`);
    if (config.feet) server.runCommandSilent(`item replace entity ${stringUuid} armor.feet with ${config.feet}`);

    // Create Bossbar
    server.runCommandSilent(`bossbar add nomad_${barId} "${config.barTitle}"`);
    server.runCommandSilent(`bossbar set nomad_${barId} color ${config.barColor || 'yellow'}`);
    server.runCommandSilent(`bossbar set nomad_${barId} style notched_10`);
    server.runCommandSilent(`bossbar set nomad_${barId} max ${config.maxHp}`);
    server.runCommandSilent(`bossbar set nomad_${barId} value ${config.maxHp}`);

    let minionUuids = [];

    // Spawn Minions (Ролевая Свита Отряда)
    if (config.minions && config.minions.length > 0) {
        config.minions.forEach(mGroup => {
            for (let i = 0; i < mGroup.count; i++) {
                let offsetX = (Math.random() - 0.5) * 8;
                let offsetZ = (Math.random() - 0.5) * 8;
                let minion = overworld.createEntity(mGroup.type);
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
                        if (mGroup.helmet) server.runCommandSilent(`item replace entity ${mUuid} armor.head with ${mGroup.helmet}`);

                        if (mGroup.aggressive && mGroup.type === 'minecraft:wolf') {
                            server.runCommandSilent(`data merge entity ${mUuid} {AngryAt:[I;0,0,0,0],AngerTime:99999}`);
                        }

                        // Установка текущего здоровья
                        if (mGroup.hp) minion.health = mGroup.hp;
                    }
                }
            }
        });
    }

    // Audio telegraph & Atmosphere
    server.runCommandSilent(`playsound minecraft:item.goat_horn.sound.0 neutral @a[x=${x},y=${y},z=${z},distance=..64] ${x} ${y} ${z} 1.5 0.8`);
    server.runCommandSilent(`particle minecraft:campfire_signal_smoke ${x} ${y + 1} ${z} 0.5 1.5 0.5 0.05 35`);

    // Register in global tracking
    global.ElyriumNomadBosses[stringUuid] = {
        uuid: stringUuid,
        barId: barId,
        bossId: bossId,
        name: config.displayName,
        sector: 1,
        x: Math.floor(x),
        y: Math.floor(y),
        z: Math.floor(z),
        spawnTime: Date.now(),
        lastWarCry: 0,
        lastFearHowl: 0,
        lastSlam: 0,
        minionUuids: minionUuids,
        campBlocks: campBlocks
    };

    return global.ElyriumNomadBosses[stringUuid];
}

// ==============================================================================
// ⏱️ ТИКОВЫЙ ЦИКЛ: СПАВН, ПАТРУЛЬ, БОССБАР, ПРИВЯЗКА СВИТЫ И СПОСОБНОСТИ
// ==============================================================================
ServerEvents.tick(event => {
    let server = event.server;
    if (!NOMAD_CONFIG.enabled) return;

    let overworld = server.getLevel('minecraft:overworld');
    if (!overworld) return;

    // --------------------------------------------------------------------------
    // 1. ПЕРИОДИЧЕСКИЙ СПАВН В СЕКТОРЕ I (Каждые checkIntervalTicks)
    // --------------------------------------------------------------------------
    if (server.tickCount % NOMAD_CONFIG.checkIntervalTicks === 0) {
        cleanExpiredBosses(server);

        let activeCount = getActiveNomadCount(1);
        if (activeCount < NOMAD_CONFIG.maxActivePerSector1) {
            let players = overworld.players;
            if (players && !players.isEmpty()) {
                // Find a player wandering in Sector I (R in [250, 1450])
                let candidates = [];
                players.forEach(p => {
                    if (!p.isCreative() && !p.isSpectator()) {
                        let r = Math.sqrt(p.x * p.x + p.z * p.z);
                        if (r >= NOMAD_CONFIG.spawnMinR && r <= NOMAD_CONFIG.spawnMaxR) {
                            candidates.push(p);
                        }
                    }
                });

                if (candidates.length > 0) {
                    let targetPlayer = candidates[Math.floor(Math.random() * candidates.length)];
                    let angle = Math.random() * Math.PI * 2;
                    let dist = NOMAD_CONFIG.playerSearchRadiusMin + Math.random() * (NOMAD_CONFIG.playerSearchRadiusMax - NOMAD_CONFIG.playerSearchRadiusMin);
                    let spawnX = Math.floor(targetPlayer.x + Math.cos(angle) * dist);
                    let spawnZ = Math.floor(targetPlayer.z + Math.sin(angle) * dist);
                    let spawnR = Math.sqrt(spawnX * spawnX + spawnZ * spawnZ);

                    if (spawnR >= NOMAD_CONFIG.spawnMinR && spawnR <= NOMAD_CONFIG.spawnMaxR) {
                        let topY = overworld.getHeight('motion_blocking', spawnX, spawnZ);
                        if (topY > 60 && topY < 200) {
                            let bossKeys = Object.keys(NOMAD_CONFIG.bosses);
                            let selectedId = bossKeys[Math.floor(Math.random() * bossKeys.length)];
                            let spawnedBoss = spawnNomadBoss(server, selectedId, spawnX, topY, spawnZ, false);
                            if (spawnedBoss) {
                                targetPlayer.displayClientMessage(Text.of(`§6⚔ Разведка доносит: в окрестностях замечен ${spawnedBoss.name} со своим отрядом!§r`), true);
                            }
                        }
                    }
                }
            }
        }
    }

    // --------------------------------------------------------------------------
    // 2. БОССБАРЫ, КООРДИНАЦИЯ СВИТЫ И СПОСОБНОСТИ (Каждые 20 тиков = 1 сек)
    // --------------------------------------------------------------------------
    if (server.tickCount % 20 === 0) {
        for (let uuid in global.ElyriumNomadBosses) {
            let bossInfo = global.ElyriumNomadBosses[uuid];
            if (!bossInfo) continue;

            let entity = overworld.getEntity(uuid);
            if (!entity || !entity.isLiving() || !entity.isAlive()) {
                // Boss died or despawned
                server.runCommandSilent(`bossbar remove nomad_${bossInfo.barId}`);
                if (bossInfo.campBlocks) removeCampsiteBlocks(server, bossInfo.campBlocks);
                delete global.ElyriumNomadBosses[uuid];
                continue;
            }

            // Update Boss Coordinates
            bossInfo.x = Math.floor(entity.x);
            bossInfo.y = Math.floor(entity.y);
            bossInfo.z = Math.floor(entity.z);

            // Update Bossbar HP
            let curHp = Math.max(0, Math.floor(entity.health));
            server.runCommandSilent(`bossbar set nomad_${bossInfo.barId} value ${curHp}`);

            // Find nearby players
            let nearPlayers = overworld.getEntitiesWithin(AABB.of(
                entity.x - NOMAD_CONFIG.combatRadius, entity.y - 16, entity.z - NOMAD_CONFIG.combatRadius,
                entity.x + NOMAD_CONFIG.combatRadius, entity.y + 16, entity.z + NOMAD_CONFIG.combatRadius
            )).filter(e => e.isPlayer() && !e.isSpectator());

            if (nearPlayers.length > 0) {
                let playerNames = nearPlayers.map(p => p.username).join(' ');
                server.runCommandSilent(`bossbar set nomad_${bossInfo.barId} players ${playerNames}`);
                server.runCommandSilent(`bossbar set nomad_${bossInfo.barId} visible true`);
            } else {
                server.runCommandSilent(`bossbar set nomad_${bossInfo.barId} visible false`);
            }

            // ------------------------------------------------------------------
            // 3. ТАКТИЧЕСКОЕ ПОВЕДЕНИЕ И ПРИВЯЗКА СВИТЫ (SQUAD LEASHING)
            // ------------------------------------------------------------------
            if (bossInfo.minionUuids && bossInfo.minionUuids.length > 0) {
                let aliveMinions = [];
                bossInfo.minionUuids.forEach(mUuid => {
                    let minionEnt = overworld.getEntity(mUuid);
                    if (minionEnt && minionEnt.isLiving() && minionEnt.isAlive()) {
                        aliveMinions.push(mUuid);

                        // Проверка дистанции от Вожака
                        let distToLeader = Math.sqrt(
                            (minionEnt.x - entity.x) * (minionEnt.x - entity.x) +
                            (minionEnt.z - entity.z) * (minionEnt.z - entity.z)
                        );

                        // Если миньон отстал более чем на 18 блоков — возвращаем в строй к Лидеру
                        if (distToLeader > 18.0) {
                            minionEnt.potionEffects.add('minecraft:speed', 80, 1, false, false);
                            // Если у миньона нет активной цели, сдвигаем импульс к вожаку
                            let dx = (entity.x - minionEnt.x) / distToLeader * 0.4;
                            let dz = (entity.z - minionEnt.z) / distToLeader * 0.4;
                            minionEnt.setDeltaMovement(dx, 0.1, dz);
                        }
                    }
                });
                bossInfo.minionUuids = aliveMinions;
            }

            // ------------------------------------------------------------------
            // 4. БОЕВЫЕ СПОСОБНОСТИ ВОЖАКОВ (Таймеры)
            // ------------------------------------------------------------------
            let nowSec = Math.floor(Date.now() / 1000);

            // А. Седогривый Вожак: Ужасающий Вой (раз в 20с)
            if (bossInfo.bossId === 'direwolf_alpha' && nearPlayers.length > 0) {
                if (!bossInfo.lastFearHowl || nowSec - bossInfo.lastFearHowl >= NOMAD_CONFIG.bosses.direwolf_alpha.abilities.fearHowlCooldown) {
                    bossInfo.lastFearHowl = nowSec;
                    server.runCommandSilent(`playsound minecraft:entity.wolf.howl hostile @a[x=${entity.x},y=${entity.y},z=${entity.z},distance=..24] ${entity.x} ${entity.y} ${entity.z} 2.0 0.8`);
                    server.runCommandSilent(`particle minecraft:soul ${entity.x} ${entity.y + 1} ${entity.z} 1.0 0.5 1.0 0.05 25`);
                    nearPlayers.forEach(p => {
                        p.potionEffects.add('minecraft:weakness', 100, 0, false, true);
                        p.displayClientMessage(Text.of('§c🐺 Вожак стаи издает леденящий вой! На вас пала Слабость.§r'), true);
                    });
                }
            }

            // Б. Падший Рыцарь: Сотрясение земли булавой (раз в 16с)
            if (bossInfo.bossId === 'fallen_deserter_knight' && nearPlayers.length > 0) {
                if (!bossInfo.lastSlam || nowSec - bossInfo.lastSlam >= NOMAD_CONFIG.bosses.fallen_deserter_knight.abilities.slamCooldown) {
                    bossInfo.lastSlam = nowSec;
                    server.runCommandSilent(`playsound minecraft:entity.iron_golem.attack hostile @a[x=${entity.x},y=${entity.y},z=${entity.z},distance=..20] ${entity.x} ${entity.y} ${entity.z} 1.5 0.7`);
                    server.runCommandSilent(`particle minecraft:explosion ${entity.x} ${entity.y} ${entity.z} 0.8 0.2 0.8 0.1 8`);
                    nearPlayers.forEach(p => {
                        let d = Math.sqrt((p.x - entity.x) * (p.x - entity.x) + (p.z - entity.z) * (p.z - entity.z));
                        if (d <= 5.0) {
                            p.attack(overworld.damageSources().mobAttack(entity), 4.0);
                            p.potionEffects.add('minecraft:slowness', 60, 1, false, true);
                            p.displayClientMessage(Text.of('§b🛡 Падший Рыцарь сотрясает землю булавой!§r'), true);
                        }
                    });
                }
            }

            // В. Горный Надзиратель: Размашистый удар Циклопа (раз в 18с)
            if (bossInfo.bossId === 'mountain_brigand_gang' && nearPlayers.length > 0) {
                if (!bossInfo.lastSlam || nowSec - bossInfo.lastSlam >= NOMAD_CONFIG.bosses.mountain_brigand_gang.abilities.cyclopsSmashCooldown) {
                    bossInfo.lastSlam = nowSec;
                    server.runCommandSilent(`playsound minecraft:entity.ravager.attack hostile @a[x=${entity.x},y=${entity.y},z=${entity.z},distance=..20] ${entity.x} ${entity.y} ${entity.z} 1.6 0.6`);
                    server.runCommandSilent(`particle minecraft:large_smoke ${entity.x} ${entity.y + 1} ${entity.z} 1.0 0.5 1.0 0.05 20`);
                    nearPlayers.forEach(p => {
                        let d = Math.sqrt((p.x - entity.x) * (p.x - entity.x) + (p.z - entity.z) * (p.z - entity.z));
                        if (d <= 5.5) {
                            p.attack(overworld.damageSources().mobAttack(entity), 5.0);
                            p.potionEffects.add('minecraft:nausea', 80, 0, false, true);
                            p.displayClientMessage(Text.of('§e⛰ Надзиратель наносит сокрушительный удар по земле!§r'), true);
                        }
                    });
                }
            }
        }
    }
});

// ==============================================================================
// 💥 ПЕРЕХВАТ УРОНА: РЕАКЦИИ, ЗАЩИТА ВОЖАКА СВИТОЙ И БОЕВЫЕ СТОЙКИ
// ==============================================================================
EntityEvents.beforeHurt(event => {
    let target = event.entity;
    if (!target || !target.isLiving()) return;

    let server = event.server;
    let overworld = server.getLevel('minecraft:overworld');
    let attacker = event.source.actual;

    // 1. ЕСЛИ АТАКУЮТ ВОЖАКА: Свита синхронно переключается на обидчика!
    if (target.tags.contains('elyrium_nomad_boss')) {
        let stringUuid = target.stringUuid;
        let bossInfo = global.ElyriumNomadBosses[stringUuid];
        if (!bossInfo) return;

        let nowSec = Math.floor(Date.now() / 1000);

        // Перенаправление агро свиты на обидчика
        if (attacker && attacker.isPlayer() && bossInfo.minionUuids) {
            bossInfo.minionUuids.forEach(mUuid => {
                let minionEnt = overworld.getEntity(mUuid);
                if (minionEnt && minionEnt.isLiving() && minionEnt.isAlive()) {
                    // Активируем преследование
                    server.runCommandSilent(`execute as ${mUuid} run data merge entity @s {AngryAt:[I;0,0,0,0],AngerTime:600}`);
                }
            });
        }

        // А. Падший Рыцарь: Глухая Оборона со Щитом (-50% урона в лоб)
        if (bossInfo.bossId === 'fallen_deserter_knight' && attacker && attacker.isPlayer()) {
            event.damage = event.damage * (1.0 - NOMAD_CONFIG.bosses.fallen_deserter_knight.abilities.shieldGuardReduction);
            server.runCommandSilent(`playsound minecraft:item.shield.block player @a[x=${target.x},y=${target.y},z=${target.z},distance=..16] ${target.x} ${target.y} ${target.z} 1.0 1.0`);
        }

        // Б. Атаман Черной Дубравы: Боевой Клич при HP < 55%
        if (bossInfo.bossId === 'bandit_warlord') {
            let maxHp = NOMAD_CONFIG.bosses.bandit_warlord.maxHp;
            let currentHp = target.health;
            if (currentHp / maxHp <= NOMAD_CONFIG.bosses.bandit_warlord.abilities.warCryHpThreshold) {
                if (!bossInfo.lastWarCry || nowSec - bossInfo.lastWarCry >= NOMAD_CONFIG.bosses.bandit_warlord.abilities.warCryCooldown) {
                    bossInfo.lastWarCry = nowSec;
                    server.runCommandSilent(`playsound minecraft:entity.pillager.celebrate hostile @a[x=${target.x},y=${target.y},z=${target.z},distance=..32] ${target.x} ${target.y} ${target.z} 1.8 0.9`);
                    server.runCommandSilent(`particle minecraft:angry_villager ${target.x} ${target.y + 2} ${target.z} 0.5 0.5 0.5 0.05 15`);

                    target.potionEffects.add('minecraft:strength', 200, 0, false, true);
                    target.potionEffects.add('minecraft:speed', 200, 0, false, true);

                    // Бафф свиты при боевом кличе
                    if (bossInfo.minionUuids) {
                        bossInfo.minionUuids.forEach(mUuid => {
                            let mEnt = overworld.getEntity(mUuid);
                            if (mEnt && mEnt.isLiving()) {
                                mEnt.potionEffects.add('minecraft:speed', 160, 0, false, true);
                            }
                        });
                    }

                    // Alert nearby players
                    let nearPlayers = overworld.getEntitiesWithin(AABB.of(
                        target.x - 24, target.y - 8, target.z - 24,
                        target.x + 24, target.y + 8, target.z + 24
                    )).filter(e => e.isPlayer());

                    nearPlayers.forEach(p => {
                        p.displayClientMessage(Text.of('§6⚔ Атаман: «В атаку, псы! Добыча сама пришла в наши руки!»§r'), true);
                    });
                }
            }
        }
    }
});

// ==============================================================================
// 🏆 СМЕРТЬ ВОЖАКА: ДЕБАФФ СВИТЫ «ПОТЕРЯ ЛИДЕРА», РПГ-ЛУТ И ЗАЧИСТКА ЛАГЕРЯ
// ==============================================================================
EntityEvents.death(event => {
    let entity = event.entity;
    if (!entity || !entity.isLiving()) return;

    if (entity.tags.contains('elyrium_nomad_boss')) {
        let stringUuid = entity.stringUuid;
        let bossInfo = global.ElyriumNomadBosses[stringUuid];
        let bossId = bossInfo ? bossInfo.bossId : null;

        // Fallback detection from tags
        if (!bossId) {
            entity.tags.forEach(t => {
                if (t.startsWith('nomad_id_')) bossId = t.replace('nomad_id_', '');
            });
        }

        let config = NOMAD_CONFIG.bosses[bossId];
        let server = event.server;
        let level = entity.level;

        // 1. ДЕБАФФ «ПОТЕРЯ ЛИДЕРА» ДЛЯ ОСТАВШЕЙСЯ СВИТЫ
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
                // Плавное убирание костра и лагеря через 30 секунд
                server.scheduleInTicks(600, () => {
                    removeCampsiteBlocks(server, bossInfo.campBlocks);
                });
            }
            delete global.ElyriumNomadBosses[stringUuid];
        }

        let bossTitle = config ? config.displayName : 'Кочевой Вожак';

        // Fanfare & Local Announcement
        server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete master @a[x=${entity.x},y=${entity.y},z=${entity.z},distance=..48] ${entity.x} ${entity.y} ${entity.z} 1.2 1.0`);
        server.runCommandSilent(`particle minecraft:totem_of_undying ${entity.x} ${entity.y + 1} ${entity.z} 0.6 0.8 0.6 0.2 40`);

        let nearPlayers = level.getEntitiesWithin(AABB.of(
            entity.x - 48, entity.y - 16, entity.z - 48,
            entity.x + 48, entity.y + 16, entity.z + 48
        )).filter(e => e.isPlayer());

        nearPlayers.forEach(p => {
            p.tell(Text.gold('═════════════════════════════════════════════════════'));
            p.tell(Text.yellow(`🏆 КОЧЕВОЙ ВОЖАК ПОВЕРЖЕН: ${bossTitle}`));
            p.tell(Text.green('   Лидер отряда пал! Свита деморализована, лагерь разгромлен.'));
            p.tell(Text.gold('═════════════════════════════════════════════════════'));
        });

        // 3. Выдача RPG-Лута
        if (config && config.loot) {
            // Guaranteed Drops
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

            // Chance Drops
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
            let msg = `§cНеизвестная банда: ${bossId}! Доступные: ${valid}`;
            if (player) player.displayClientMessage(Text.of(msg), false);
            else server.tell(Text.of(msg));
            return;
        }

        let sx = player ? Math.floor(player.x + 3) : 0;
        let sy = player ? Math.floor(player.y) : 65;
        let sz = player ? Math.floor(player.z + 3) : 0;

        if (parts[3] && parts[4] && parts[5]) {
            sx = parseInt(parts[3]);
            sy = parseInt(parts[4]);
            sz = parseInt(parts[5]);
        }

        let boss = spawnNomadBoss(server, bossId, sx, sy, sz, true);
        let resp = boss ? `§aУспешно развернут ${boss.name} с лагерем на [${sx}, ${sy}, ${sz}]!` : `§cОшибка спавна ${bossId}!`;
        if (player) player.displayClientMessage(Text.of(resp), false);
        else server.tell(Text.of(resp));
        return;
    }

    if (subCmd === 'list') {
        let count = 0;
        let header = '§6══════════════ [ АКТИВНЫЕ КОЧЕВЫЕ БАНДЫ И ЛАГЕРЯ ] ══════════════§r';
        if (player) player.displayClientMessage(Text.of(header), false);
        else server.tell(Text.of(header));

        for (let uuid in global.ElyriumNomadBosses) {
            let b = global.ElyriumNomadBosses[uuid];
            if (!b) continue;
            count++;
            let r = Math.floor(Math.sqrt(b.x * b.x + b.z * b.z));
            let campStatus = b.campBlocks && b.campBlocks.length > 0 ? '§a[Лагерь Развернут]' : '§7[Пеший Патруль]';
            let line = `§e${count}. ${b.name} §7| Позиция: §f[${b.x}, ${b.y}, ${b.z}] (R=${r}м) §7| Свита: §b${b.minionUuids.length} мобов §7| ${campStatus}`;
            if (player) player.displayClientMessage(Text.of(line), false);
            else server.tell(Text.of(line));
        }

        if (count === 0) {
            let noBosses = '§7В мире сейчас нет активных кочевых банд.';
            if (player) player.displayClientMessage(Text.of(noBosses), false);
            else server.tell(Text.of(noBosses));
        }
        return;
    }

    if (subCmd === 'clear') {
        let cleared = 0;
        let overworld = server.getLevel('minecraft:overworld');
        for (let uuid in global.ElyriumNomadBosses) {
            let b = global.ElyriumNomadBosses[uuid];
            if (b) {
                server.runCommandSilent(`bossbar remove nomad_${b.barId}`);
                if (b.campBlocks) {
                    removeCampsiteBlocks(server, b.campBlocks);
                }
                if (overworld) {
                    let ent = overworld.getEntity(uuid);
                    if (ent) ent.discard();
                    b.minionUuids.forEach(mId => {
                        let mEnt = overworld.getEntity(mId);
                        if (mEnt) mEnt.discard();
                    });
                }
                cleared++;
            }
        }
        global.ElyriumNomadBosses = {};
        let resp = `§aУдалено ${cleared} кочевых банд, их свиты и полевые лагеря!`;
        if (player) player.displayClientMessage(Text.of(resp), false);
        else server.tell(Text.of(resp));
        return;
    }

    // Default: Help
    let helpMsg = [
        '§6═══════════════ [ ДВИЖОК КОЧЕВЫХ БАНД И ЛАГЕРЕЙ /nomad ] ═══════════════§r',
        '§e/nomad spawn <bandit_warlord|direwolf_alpha|fallen_deserter_knight|mountain_brigand_gang> §7- развернуть банду с лагерем',
        '§e/nomad list §7- показать список активных банд, свит и стоянок',
        '§e/nomad clear §7- очистить всех активных мобов и убрать лагерные блоки',
        '§7Все параметры (HP, урон, свита, лут) меняются на лету через /kubejs reload server_scripts!'
    ];
    helpMsg.forEach(m => {
        if (player) player.displayClientMessage(Text.of(m), false);
        else server.tell(Text.of(m));
    });
});
