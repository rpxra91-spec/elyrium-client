// ==============================================================================
// 🏰 ELYRIUM RPG: MULTI-TIER PROCEDURAL GRAPH MEGA-DUNGEON ENGINE (v4.0)
// Dimension: elyrium:dungeons | Isolation Grid: X = ID * 1500, Z = 0
// ==============================================================================
// - Pseudo-random generator (PRNG) per run: seed = instanceId + sector + timestamp.
// - Canonical 8 Tiers + Tier 1.5 Undergarden: dedicated palettes, authentic interiors.
// - Massive Mob & Boss Pools: multiple vanguards, snipers, mini-bosses, and overlords per tier.
// - Procedural Room Variations: columns, sarcophagi, bridges, braziers, and distress noise.
// - Dynamic Chest Populator: Essences, Epoch ingots, gems, and Defiled Equipment.
// - Portcullis Progression Gate: unlocks with mechanical chains upon Mini-Boss defeat.
// - Triumph Portal & Golden Victory Chest upon Final Boss defeat.
// ==============================================================================

function makePRNG(seed) {
    let s = (seed >>> 0);
    return {
        next: function() {
            s = (s * 1664525 + 1013904223) >>> 0;
            return s / 4294967296;
        },
        nextInt: function(min, max) {
            return Math.floor(this.next() * (max - min + 1)) + min;
        },
        choice: function(arr) {
            if (!arr || arr.length === 0) return null;
            return arr[Math.floor(this.next() * arr.length)];
        }
    };
}

// Safe recursive fill to prevent Vanilla 32,768 block volume limit overflow
function safeFill(server, x1, y1, z1, x2, y2, z2, block, extra) {
    let minX = Math.min(x1, x2);
    let maxX = Math.max(x1, x2);
    let minY = Math.min(y1, y2);
    let maxY = Math.max(y1, y2);
    let minZ = Math.min(z1, z2);
    let maxZ = Math.max(z1, z2);
    let extraStr = extra ? (' ' + extra) : '';

    let dx = maxX - minX + 1;
    let dy = maxY - minY + 1;
    let dz = maxZ - minZ + 1;
    let vol = dx * dy * dz;

    if (vol <= 30000) {
        server.runCommandSilent(`execute in elyrium:dungeons run fill ${minX} ${minY} ${minZ} ${maxX} ${maxY} ${maxZ} ${block}${extraStr}`);
        return;
    }

    if (dz >= dx && dz >= dy) {
        let midZ = Math.floor((minZ + maxZ) / 2);
        safeFill(server, minX, minY, minZ, maxX, maxY, midZ, block, extra);
        safeFill(server, minX, minY, midZ + 1, maxX, maxY, maxZ, block, extra);
    } else if (dy >= dx && dy >= dz) {
        let midY = Math.floor((minY + maxY) / 2);
        safeFill(server, minX, minY, minZ, maxX, midY, maxZ, block, extra);
        safeFill(server, minX, midY + 1, minZ, maxX, maxY, maxZ, block, extra);
    } else {
        let midX = Math.floor((minX + maxX) / 2);
        safeFill(server, minX, minY, minZ, midX, maxY, maxZ, block, extra);
        safeFill(server, midX + 1, minY, minZ, maxX, maxY, maxZ, block, extra);
    }
}

// ------------------------------------------------------------------------------
// TIER CONFIGURATION: PALETTES, MOB POOLS, MINI-BOSSES & MAIN BOSSES
// ------------------------------------------------------------------------------
const TIER_DATA = {
    1: { // Sector 1: Overworld (Ancient Crypts)
        palette: {
            floor: 'minecraft:stone_bricks',
            floor_cracked: 'minecraft:cracked_stone_bricks',
            floor_mossy: 'minecraft:mossy_stone_bricks',
            wall: 'minecraft:stone_bricks',
            wall_detail: 'minecraft:chiseled_stone_bricks',
            pillar: 'minecraft:polished_andesite',
            light: 'minecraft:lantern',
            gate: 'minecraft:iron_bars',
            ceiling: 'minecraft:cobblestone',
            accent: 'minecraft:gold_block',
            abyss_floor: 'minecraft:deepslate_bricks',
            abyss_wall: 'minecraft:polished_deepslate',
            liquid: 'minecraft:water',
            sarcophagus: 'minecraft:deepslate_bricks',
            fire: 'minecraft:fire'
        },
        vanguard: [
            { id: 'minecraft:zombie', name: 'Падший Рыцарь Катакомб', hp: 45, main: 'minecraft:iron_sword', off: 'minecraft:shield', chest: 'minecraft:chainmail_chestplate', helm: 'minecraft:iron_helmet' },
            { id: 'cataclysm:draugr', name: 'Древний Драугр Склепа', hp: 50, main: 'minecraft:iron_sword', off: '', chest: 'minecraft:iron_chestplate', helm: 'minecraft:iron_helmet' },
            { id: 'minecraft:skeleton', name: 'Костяной Страж Ордена', hp: 40, main: 'minecraft:iron_axe', off: 'minecraft:shield', chest: 'minecraft:chainmail_chestplate', helm: 'minecraft:chainmail_helmet' }
        ],
        ranged: [
            { id: 'minecraft:skeleton', name: 'Катакомбный Снайпер', hp: 30, bow: 'minecraft:bow', helm: 'minecraft:chainmail_helmet' },
            { id: 'minecraft:bogged', name: 'Чумной Стрелок Склепа', hp: 35, bow: 'minecraft:bow', helm: 'minecraft:iron_helmet' }
        ],
        miniboss: [
            { id: 'minecraft:vindicator', name: 'Палач Забытого Склепа [Мини-Босс]', hp: 180, main: 'minecraft:iron_axe', chest: 'minecraft:golden_chestplate', helm: 'minecraft:golden_helmet' },
            { id: 'cataclysm:draugr', name: 'Рыцарь-Командор Катакомб [Мини-Босс]', hp: 200, main: 'minecraft:diamond_sword', chest: 'minecraft:diamond_chestplate', helm: 'minecraft:iron_helmet' },
            { id: 'minecraft:wither_skeleton', name: 'Проклятый Чемпион Врат [Мини-Босс]', hp: 190, main: 'minecraft:iron_axe', chest: 'minecraft:iron_chestplate', helm: 'minecraft:golden_helmet' }
        ],
        boss: [
            { id: 'minecraft:piglin_brute', name: 'Владыка Недр Катакомб [Босс]', hp: 450, main: 'minecraft:netherite_axe', chest: 'minecraft:netherite_chestplate', helm: 'minecraft:golden_helmet' },
            { id: 'cataclysm:aptrgangr', name: 'Древний Король Склепа [Босс]', hp: 480, main: 'minecraft:netherite_sword', chest: 'minecraft:netherite_chestplate', helm: 'minecraft:golden_helmet' }
        ]
    },
    1.5: { // Sector 1.5: The Undergarden (Depthrock Catacombs)
        palette: {
            floor: 'undergarden:depthrock_bricks',
            floor_cracked: 'undergarden:cracked_depthrock_bricks',
            floor_mossy: 'undergarden:infested_depthrock',
            wall: 'undergarden:depthrock_bricks',
            wall_detail: 'undergarden:chiseled_depthrock',
            pillar: 'undergarden:shiverstone_bricks',
            light: 'minecraft:soul_lantern',
            gate: 'minecraft:iron_bars',
            ceiling: 'undergarden:depthrock',
            accent: 'undergarden:cloggrum_block',
            abyss_floor: 'undergarden:shiverstone_bricks',
            abyss_wall: 'undergarden:depthrock_bricks',
            liquid: 'minecraft:water',
            sarcophagus: 'undergarden:chiseled_depthrock',
            fire: 'minecraft:soul_fire'
        },
        vanguard: [
            { id: 'undergarden:rotwalker', name: 'Гнилостный Ходок Подземья', hp: 50 },
            { id: 'undergarden:dweller', name: 'Глубинный Охотник', hp: 45 },
            { id: 'undergarden:stoneborn', name: 'Каменный Страж Разлома', hp: 60 }
        ],
        ranged: [
            { id: 'undergarden:splooger', name: 'Плеватель Гнили', hp: 40 },
            { id: 'minecraft:stray', name: 'Стрелок Морозной Стали', hp: 45, bow: 'minecraft:bow', helm: 'minecraft:iron_helmet' }
        ],
        miniboss: [
            { id: 'undergarden:rotbeast', name: 'Гнилостный Зверь [Мини-Босс]', hp: 220 },
            { id: 'undergarden:forgotten_guardian', name: 'Забытый Страж Подземья [Мини-Босс]', hp: 240 }
        ],
        boss: [
            { id: 'undergarden:masticator', name: 'Пожиратель Недр Подземья [Босс]', hp: 550 },
            { id: 'undergarden:brute', name: 'Глубинный Исполин [Босс]', hp: 500 }
        ]
    },
    2: { // Sector 2: The Nether (Infernal Bastion)
        palette: {
            floor: 'minecraft:polished_blackstone',
            floor_cracked: 'minecraft:cracked_polished_blackstone_bricks',
            floor_mossy: 'minecraft:nether_bricks',
            wall: 'minecraft:polished_blackstone_bricks',
            wall_detail: 'minecraft:chiseled_polished_blackstone',
            pillar: 'minecraft:gilded_blackstone',
            light: 'minecraft:soul_lantern',
            gate: 'minecraft:iron_bars',
            ceiling: 'minecraft:nether_bricks',
            accent: 'minecraft:crying_obsidian',
            abyss_floor: 'minecraft:polished_blackstone_bricks',
            abyss_wall: 'minecraft:crying_obsidian',
            liquid: 'minecraft:lava',
            sarcophagus: 'minecraft:polished_blackstone_bricks',
            fire: 'minecraft:soul_fire'
        },
        vanguard: [
            { id: 'minecraft:wither_skeleton', name: 'Инфернальный Паладин', hp: 65, main: 'minecraft:iron_sword', off: 'minecraft:shield', chest: 'minecraft:golden_chestplate', helm: 'minecraft:iron_helmet' },
            { id: 'cataclysm:ignited_berserker', name: 'Пепельный Берсерк', hp: 70, main: 'minecraft:iron_axe', off: '', chest: 'minecraft:netherite_chestplate', helm: '' },
            { id: 'minecraft:piglin_brute', name: 'Незерский Штурмовик', hp: 60, main: 'minecraft:golden_axe', off: 'minecraft:shield', chest: 'minecraft:golden_chestplate', helm: 'minecraft:golden_helmet' }
        ],
        ranged: [
            { id: 'minecraft:blaze', name: 'Пламенный Ифрит', hp: 45 },
            { id: 'irons_spellbooks:pyromancer', name: 'Инфернальный Пиромант', hp: 55 }
        ],
        miniboss: [
            { id: 'minecraft:piglin_brute', name: 'Пепельный Палач [Мини-Босс]', hp: 260, main: 'minecraft:netherite_axe', chest: 'minecraft:golden_chestplate', helm: 'minecraft:golden_helmet' },
            { id: 'cataclysm:ignited_berserker', name: 'Инфернальный Инквизитор [Мини-Босс]', hp: 280, main: 'minecraft:diamond_axe', chest: 'minecraft:netherite_chestplate', helm: '' }
        ],
        boss: [
            { id: 'minecraft:wither_skeleton', name: 'Незеритовый Монолит Разлома [Босс]', hp: 580, main: 'minecraft:netherite_sword', chest: 'minecraft:netherite_chestplate', helm: 'minecraft:golden_helmet' },
            { id: 'cataclysm:ignis', name: 'Аватар Игниса: Владыка Пламени [Босс]', hp: 620, main: '', chest: '', helm: '' }
        ]
    },
    3: { // Sector 3: The Aether (Celestial Sanctuary)
        palette: {
            floor: 'minecraft:smooth_sandstone',
            floor_cracked: 'minecraft:cut_sandstone',
            floor_mossy: 'aether:carved_stone',
            wall: 'minecraft:quartz_bricks',
            wall_detail: 'minecraft:chiseled_quartz_block',
            pillar: 'minecraft:polished_diorite',
            light: 'minecraft:sea_lantern',
            gate: 'minecraft:iron_bars',
            ceiling: 'minecraft:smooth_quartz',
            accent: 'minecraft:gold_block',
            abyss_floor: 'minecraft:quartz_bricks',
            abyss_wall: 'minecraft:smooth_quartz',
            liquid: 'minecraft:water',
            sarcophagus: 'minecraft:cut_sandstone',
            fire: 'minecraft:fire'
        },
        vanguard: [
            { id: 'aether:valkyrie', name: 'Валькирия-Страж Эфира', hp: 70 },
            { id: 'aether:sentry', name: 'Эфирный Часовой', hp: 60 },
            { id: 'minecraft:stray', name: 'Небесный Паладин', hp: 65, main: 'minecraft:golden_sword', off: 'minecraft:shield', chest: 'minecraft:golden_chestplate', helm: 'minecraft:golden_helmet' }
        ],
        ranged: [
            { id: 'aether:zephyr', name: 'Зефир Небесной Бури', hp: 40 },
            { id: 'minecraft:skeleton', name: 'Солнечный Лучник', hp: 45, bow: 'minecraft:bow', helm: 'minecraft:golden_helmet' }
        ],
        miniboss: [
            { id: 'aether:valkyrie', name: 'Командир Валькирий [Мини-Босс]', hp: 300, main: 'minecraft:diamond_sword', chest: 'minecraft:golden_chestplate', helm: 'minecraft:golden_helmet' },
            { id: 'irons_spellbooks:archevoker', name: 'Солнечный Инквизитор [Мини-Босс]', hp: 280 }
        ],
        boss: [
            { id: 'aether:slider', name: 'Слайдер Небесной Бездны [Босс]', hp: 650 },
            { id: 'irons_spellbooks:archevoker', name: 'Архимаг Небесного Эфира [Босс]', hp: 600 }
        ]
    },
    4: { // Sector 4: The End (Void Bastion)
        palette: {
            floor: 'minecraft:end_stone_bricks',
            floor_cracked: 'minecraft:purpur_block',
            floor_mossy: 'minecraft:purpur_pillar',
            wall: 'minecraft:end_stone_bricks',
            wall_detail: 'minecraft:purpur_pillar',
            pillar: 'minecraft:obsidian',
            light: 'minecraft:end_rod',
            gate: 'minecraft:iron_bars',
            ceiling: 'minecraft:end_stone',
            accent: 'minecraft:crying_obsidian',
            abyss_floor: 'minecraft:purpur_block',
            abyss_wall: 'minecraft:obsidian',
            liquid: 'minecraft:air',
            sarcophagus: 'minecraft:purpur_pillar',
            fire: 'minecraft:soul_fire'
        },
        vanguard: [
            { id: 'minecraft:wither_skeleton', name: 'Рыцарь Пустотного Края', hp: 85, main: 'minecraft:netherite_sword', off: 'minecraft:shield', chest: 'minecraft:netherite_chestplate', helm: 'minecraft:netherite_helmet' },
            { id: 'cataclysm:ender_golem', name: 'Голем Края', hp: 90 },
            { id: 'minecraft:enderman', name: 'Теневой Сталкер', hp: 80 }
        ],
        ranged: [
            { id: 'minecraft:shulker', name: 'Шалкер-Охранник', hp: 50 },
            { id: 'minecraft:skeleton', name: 'Пустотный Снайпер', hp: 60, bow: 'minecraft:bow', helm: 'minecraft:netherite_helmet' }
        ],
        miniboss: [
            { id: 'cataclysm:ender_guardian', name: 'Хранитель Разлома Края [Мини-Босс]', hp: 350 },
            { id: 'minecraft:enderman', name: 'Пустотный Ассасин [Мини-Босс]', hp: 320 }
        ],
        boss: [
            { id: 'cataclysm:ender_golem', name: 'Пустотный Колосс [Босс]', hp: 750 },
            { id: 'cataclysm:ender_guardian', name: 'Владыка Пустоты [Босс]', hp: 800 }
        ]
    },
    5: { // Sector 5: Eternal Starlight (Astral Temple)
        palette: {
            floor: 'minecraft:prismarine_bricks',
            floor_cracked: 'minecraft:dark_prismarine',
            floor_mossy: 'minecraft:amethyst_block',
            wall: 'minecraft:dark_prismarine',
            wall_detail: 'minecraft:chiseled_stone_bricks',
            pillar: 'minecraft:chiseled_stone_bricks',
            light: 'minecraft:sea_lantern',
            gate: 'minecraft:iron_bars',
            ceiling: 'minecraft:prismarine',
            accent: 'minecraft:amethyst_block',
            abyss_floor: 'minecraft:dark_prismarine',
            abyss_wall: 'minecraft:prismarine_bricks',
            liquid: 'minecraft:water',
            sarcophagus: 'minecraft:amethyst_block',
            fire: 'minecraft:fire'
        },
        vanguard: [
            { id: 'eternal_starlight:aethersent_golem', name: 'Звездный Голем', hp: 90 },
            { id: 'eternal_starlight:boarwarf', name: 'Лунный Воин', hp: 75 },
            { id: 'minecraft:drowned', name: 'Астральный Страж', hp: 80, main: 'minecraft:trident', off: 'minecraft:shield', chest: 'minecraft:diamond_chestplate', helm: 'minecraft:diamond_helmet' }
        ],
        ranged: [
            { id: 'irons_spellbooks:cryomancer', name: 'Лунный Криомант', hp: 65 },
            { id: 'minecraft:stray', name: 'Астральный Стрелок', hp: 60, bow: 'minecraft:bow', helm: 'minecraft:diamond_helmet' }
        ],
        miniboss: [
            { id: 'eternal_starlight:aethersent_golem', name: 'Астральный Чемпион [Мини-Босс]', hp: 380 },
            { id: 'irons_spellbooks:cryomancer', name: 'Лунный Инквизитор [Мини-Босс]', hp: 350 }
        ],
        boss: [
            { id: 'cataclysm:maledictus', name: 'Лунный Монарх Бездны [Босс]', hp: 850 },
            { id: 'minecraft:warden', name: 'Астральный Титан [Босс]', hp: 820 }
        ]
    },
    6: { // Sector 6: Deeper Darker (Sculk Catacombs)
        palette: {
            floor: 'minecraft:deepslate_bricks',
            floor_cracked: 'minecraft:sculk',
            floor_mossy: 'minecraft:sculk_catalyst',
            wall: 'minecraft:polished_deepslate',
            wall_detail: 'minecraft:reinforced_deepslate',
            pillar: 'minecraft:reinforced_deepslate',
            light: 'minecraft:soul_lantern',
            gate: 'minecraft:iron_bars',
            ceiling: 'minecraft:cobbled_deepslate',
            accent: 'minecraft:sculk_shrieker',
            abyss_floor: 'minecraft:deepslate_bricks',
            abyss_wall: 'minecraft:reinforced_deepslate',
            liquid: 'minecraft:air',
            sarcophagus: 'minecraft:reinforced_deepslate',
            fire: 'minecraft:soul_fire'
        },
        vanguard: [
            { id: 'deeperdarker:sculk_snapper', name: 'Скалк-Снаппер', hp: 95 },
            { id: 'deeperdarker:stalker', name: 'Сталкер Глубинной Тьмы', hp: 100 },
            { id: 'deeperdarker:shattered', name: 'Расколотый Бродяга', hp: 90 }
        ],
        ranged: [
            { id: 'minecraft:bogged', name: 'Скалк-Снайпер Тьмы', hp: 70, bow: 'minecraft:bow', helm: 'minecraft:netherite_helmet' },
            { id: 'irons_spellbooks:necromancer', name: 'Колдун Глубинного Скалка', hp: 75 }
        ],
        miniboss: [
            { id: 'deeperdarker:stalker', name: 'Скалк-Центурион [Мини-Босс]', hp: 400 },
            { id: 'deeperdarker:shattered', name: 'Древний Страж Тьмы [Мини-Босс]', hp: 420 }
        ],
        boss: [
            { id: 'minecraft:warden', name: 'Древний Повелитель Скалка [Босс]', hp: 950 },
            { id: 'cataclysm:maledictus', name: 'Теневой Архидемон Тьмы [Босс]', hp: 900 }
        ]
    },
    7: { // Sector 7: DivineRPG Eden (Golden Palace)
        palette: {
            floor: 'minecraft:smooth_sandstone',
            floor_cracked: 'minecraft:cut_sandstone',
            floor_mossy: 'minecraft:sandstone',
            wall: 'minecraft:cut_sandstone',
            wall_detail: 'minecraft:chiseled_sandstone',
            pillar: 'minecraft:chiseled_sandstone',
            light: 'minecraft:glowstone',
            gate: 'minecraft:iron_bars',
            ceiling: 'minecraft:sandstone',
            accent: 'minecraft:gold_block',
            abyss_floor: 'minecraft:cut_sandstone',
            abyss_wall: 'minecraft:smooth_sandstone',
            liquid: 'minecraft:water',
            sarcophagus: 'minecraft:cut_sandstone',
            fire: 'minecraft:fire'
        },
        vanguard: [
            { id: 'divinerpg:arid_warrior', name: 'Эдемский Солнечный Воин', hp: 110 },
            { id: 'divinerpg:behemoth', name: 'Золотой Бегемот', hp: 120 },
            { id: 'minecraft:iron_golem', name: 'Эдемский Защитник', hp: 130 }
        ],
        ranged: [
            { id: 'divinerpg:sun_archer', name: 'Солнечный Стрелок Эдема', hp: 80 },
            { id: 'irons_spellbooks:pyromancer', name: 'Солнечный Жрец', hp: 85 }
        ],
        miniboss: [
            { id: 'divinerpg:behemoth', name: 'Защитник Золотого Эдема [Мини-Босс]', hp: 460 },
            { id: 'divinerpg:arid_warrior', name: 'Золотой Командор [Мини-Босс]', hp: 450 }
        ],
        boss: [
            { id: 'divinerpg:behemoth', name: 'Повелитель Золотого Эдема [Босс]', hp: 1100 },
            { id: 'minecraft:warden', name: 'Солнечный Титан Эдема [Босс]', hp: 1050 }
        ]
    },
    8: { // Sector 8: DivineRPG Mortum (Necropolis of Death)
        palette: {
            floor: 'minecraft:polished_blackstone',
            floor_cracked: 'minecraft:crying_obsidian',
            floor_mossy: 'minecraft:bone_block',
            wall: 'minecraft:crying_obsidian',
            wall_detail: 'minecraft:netherite_block',
            pillar: 'minecraft:netherite_block',
            light: 'minecraft:soul_lantern',
            gate: 'minecraft:iron_bars',
            ceiling: 'minecraft:blackstone',
            accent: 'minecraft:respawn_anchor',
            abyss_floor: 'minecraft:crying_obsidian',
            abyss_wall: 'minecraft:polished_blackstone',
            liquid: 'minecraft:lava',
            sarcophagus: 'minecraft:crying_obsidian',
            fire: 'minecraft:soul_fire'
        },
        vanguard: [
            { id: 'divinerpg:wildfire', name: 'Демон Пламени Мортума', hp: 130 },
            { id: 'cataclysm:aptrgangr', name: 'Некро-Титан Мортума', hp: 140 },
            { id: 'divinerpg:dungeon_demon', name: 'Демон Катакомб Смерти', hp: 150 }
        ],
        ranged: [
            { id: 'irons_spellbooks:dead_king', name: 'Прислужник Мертвых', hp: 100 },
            { id: 'minecraft:skeleton', name: 'Жнец Душ Мортума', hp: 90, bow: 'minecraft:bow', helm: 'minecraft:netherite_helmet' }
        ],
        miniboss: [
            { id: 'divinerpg:wildfire', name: 'Палач Мортума [Мини-Босс]', hp: 550 },
            { id: 'cataclysm:aptrgangr', name: 'Жнец Душ Некрополя [Мини-Босс]', hp: 580 }
        ],
        boss: [
            { id: 'cataclysm:ignis', name: 'Дредлорд Мортума: Владыка Ада [Босс]', hp: 1300 },
            { id: 'irons_spellbooks:dead_king', name: 'Владыка Вечной Смерти [Босс]', hp: 1250 }
        ]
    }
};

var ElyriumDungeonStitcher = {
    getTierData: function(sector) {
        if (sector === 1.5 || sector === 15) return TIER_DATA[1.5];
        return TIER_DATA[sector] || TIER_DATA[1];
    },

    // Sealed Subterranean Sarcophagus Hull (Guarantees zero void exposure)
    buildSarcophagus: function(server, originX, pal) {
        let floorBlock = pal.sarcophagus || pal.wall;
        let wallBlock = pal.wall;
        let ceilBlock = pal.ceiling || pal.wall;

        safeFill(server, originX - 64, 28, -26, originX + 64, 32, 156, floorBlock);
        safeFill(server, originX - 64, 28, -26, originX - 63, 78, 156, wallBlock);
        safeFill(server, originX + 63, 28, -26, originX + 64, 78, 156, wallBlock);
        safeFill(server, originX - 64, 28, -26, originX + 64, 78, -25, wallBlock);
        safeFill(server, originX - 64, 28, 155, originX + 64, 78, 156, wallBlock);
        safeFill(server, originX - 64, 77, -26, originX + 64, 78, 156, ceilBlock);
    },

    // 1. Entrance Pavilion
    buildEntranceHall: function(server, cx, cy, cz, pal, sector, instanceId, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let r = 5;

        safeFill(server, cx - r, cy - 3, cz - r, cx + r, cy - 1, cz + r, pal.wall);
        safeFill(server, cx - r, cy, cz - r, cx + r, cy, cz + r, pal.floor);

        safeFill(server, cx - r, cy + 1, cz - r, cx + r, cy + 5, cz - r, pal.wall);
        safeFill(server, cx - r, cy + 1, cz + r, cx + r, cy + 5, cz + r, pal.wall);
        safeFill(server, cx - r, cy + 1, cz - r, cx - r, cy + 5, cz + r, pal.wall);
        safeFill(server, cx + r, cy + 1, cz - r, cx + r, cy + 5, cz + r, pal.wall);
        safeFill(server, cx - r, cy + 6, cz - r, cx + r, cy + 6, cz + r, pal.ceiling);

        safeFill(server, cx - (r - 1), cy + 1, cz - (r - 1), cx + (r - 1), cy + 5, cz + (r - 1), 'minecraft:air');

        // Central Preparation Dais & Runes
        cmd(`fill ${cx - 1} ${cy} ${cz - 1} ${cx + 1} ${cy} ${cz + 1} ${pal.wall_detail}`);
        cmd(`setblock ${cx} ${cy} ${cz} ${pal.accent}`);

        // Corner Light Pillars
        cmd(`setblock ${cx - 4} ${cy + 1} ${cz - 4} ${pal.pillar}`);
        cmd(`setblock ${cx - 4} ${cy + 2} ${cz - 4} ${pal.light}`);
        cmd(`setblock ${cx + 4} ${cy + 1} ${cz - 4} ${pal.pillar}`);
        cmd(`setblock ${cx + 4} ${cy + 2} ${cz - 4} ${pal.light}`);
        cmd(`setblock ${cx - 4} ${cy + 1} ${cz + 4} ${pal.pillar}`);
        cmd(`setblock ${cx - 4} ${cy + 2} ${cz + 4} ${pal.light}`);
        cmd(`setblock ${cx + 4} ${cy + 1} ${cz + 4} ${pal.pillar}`);
        cmd(`setblock ${cx + 4} ${cy + 2} ${cz + 4} ${pal.light}`);

        // Exit Arch on South face
        cmd(`fill ${cx - 2} ${cy + 1} ${cz + r} ${cx + 2} ${cy + 4} ${cz + r} minecraft:air`);
    },

    // 2. Pillared Hall with organic texturing and procedural pillar layout
    buildPillaredHall: function(server, cx, cy, cz, radX, radZ, height, pal, isLower, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let floorB = isLower ? pal.abyss_floor : pal.floor;
        let wallB = isLower ? pal.abyss_wall : pal.wall;
        let ceilB = isLower ? pal.abyss_floor : pal.ceiling;

        safeFill(server, cx - radX, cy - 3, cz - radZ, cx + radX, cy - 1, cz + radZ, wallB);
        safeFill(server, cx - radX, cy, cz - radZ, cx + radX, cy, cz + radZ, floorB);

        // Organic cracked/mossy floor texture patches using PRNG
        cmd(`fill ${cx - Math.floor(radX / 2)} ${cy} ${cz - Math.floor(radZ / 2)} ${cx} ${cy} ${cz} ${pal.floor_cracked} replace ${floorB}`);
        cmd(`fill ${cx + 1} ${cy} ${cz + 1} ${cx + Math.floor(radX / 2)} ${cy} ${cz + Math.floor(radZ / 2)} ${pal.floor_mossy} replace ${floorB}`);

        safeFill(server, cx - radX, cy + 1, cz - radZ, cx + radX, cy + height, cz - radZ, wallB);
        safeFill(server, cx - radX, cy + 1, cz + radZ, cx + radX, cy + height, cz + radZ, wallB);
        safeFill(server, cx - radX, cy + 1, cz - radZ, cx - radX, cy + height, cz + radZ, wallB);
        safeFill(server, cx + radX, cy + 1, cz - radZ, cx + radX, cy + height, cz + radZ, wallB);
        safeFill(server, cx - radX, cy + height + 1, cz - radZ, cx + radX, cy + height + 1, cz + radZ, ceilB);

        safeFill(server, cx - (radX - 1), cy + 1, cz - (radZ - 1), cx + (radX - 1), cy + height, cz + (radZ - 1), 'minecraft:air');

        // Procedural Pillar Arrangement: 4 pillars or 2 central colonnades
        let style = rng.nextInt(0, 1);
        if (style === 0) {
            let px = Math.max(3, Math.floor(radX * 0.55));
            let pz = Math.max(3, Math.floor(radZ * 0.55));
            let pillars = [[-px, -pz], [px, -pz], [-px, pz], [px, pz]];
            pillars.forEach(p => {
                let colX = cx + p[0];
                let colZ = cz + p[1];
                safeFill(server, colX, cy + 1, colZ, colX + 1, cy + height - 1, colZ + 1, pal.pillar);
                safeFill(server, colX - 1, cy + 1, colZ - 1, colX + 2, cy + 1, colZ + 2, pal.wall_detail);
                cmd(`setblock ${colX} ${cy + 3} ${colZ - 1} ${pal.light}`);
                cmd(`setblock ${colX + 1} ${cy + 3} ${colZ + 2} ${pal.light}`);
            });
        } else {
            let pz1 = Math.floor(radZ * 0.4);
            let pz2 = -pz1;
            [pz1, pz2].forEach(pz => {
                safeFill(server, cx - 1, cy + 1, cz + pz, cx + 1, cy + height - 1, cz + pz + 1, pal.pillar);
                cmd(`setblock ${cx} ${cy + 3} ${cz + pz - 1} ${pal.light}`);
                cmd(`setblock ${cx} ${cy + 3} ${cz + pz + 2} ${pal.light}`);
            });
        }

        // Atmosphere props
        cmd(`setblock ${cx - radX + 1} ${cy + 1} ${cz - radZ + 1} minecraft:decorated_pot`);
        cmd(`setblock ${cx + radX - 1} ${cy + 1} ${cz + radZ - 1} minecraft:decorated_pot`);
        cmd(`setblock ${cx - radX + 1} ${cy + height} ${cz - radZ + 1} minecraft:cobweb`);
        cmd(`setblock ${cx + radX - 1} ${cy + height} ${cz + radZ - 1} minecraft:cobweb`);
    },

    // 3. Treasury Vault with Sarcophagi, Traps & Golden Chest
    buildTreasuryVault: function(server, cx, cy, cz, pal, sector, instanceId, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let r = 7;
        let h = 6;

        safeFill(server, cx - r, cy - 3, cz - r, cx + r, cy - 1, cz + r, pal.wall);
        safeFill(server, cx - r, cy, cz - r, cx + r, cy, cz + r, pal.floor);
        safeFill(server, cx - r, cy + 1, cz - r, cx + r, cy + h, cz - r, pal.wall);
        safeFill(server, cx - r, cy + 1, cz + r, cx + r, cy + h, cz + r, pal.wall);
        safeFill(server, cx - r, cy + 1, cz - r, cx - r, cy + h, cz + r, pal.wall);
        safeFill(server, cx + r, cy + 1, cz - r, cx + r, cy + h, cz + r, pal.wall);
        safeFill(server, cx - r, cy + h + 1, cz - r, cx + r, cy + h + 1, cz + r, pal.ceiling);
        safeFill(server, cx - (r - 1), cy + 1, cz - (r - 1), cx + (r - 1), cy + h, cz + (r - 1), 'minecraft:air');

        // Center Dais for the Treasury Chest
        cmd(`fill ${cx - 2} ${cy + 1} ${cz - 2} ${cx + 2} ${cy + 1} ${cz + 2} ${pal.wall_detail}`);
        cmd(`setblock ${cx} ${cy + 2} ${cz} minecraft:chest[facing=south]{CustomName:'{"text":"Сокровищница Подземелья","color":"gold"}'}`);

        // Populate Treasury Chest with authentic loot
        this.populateTreasuryChest(server, cx, cy + 2, cz, sector, instanceId, rng);

        // Procedural Sarcophagi (2 or 4)
        let sarcCount = rng.nextInt(2, 4);
        cmd(`fill ${cx - 5} ${cy + 1} ${cz - 1} ${cx - 5} ${cy + 1} ${cz + 1} ${pal.sarcophagus}`);
        cmd(`setblock ${cx - 5} ${cy + 2} ${cz - 1} minecraft:soul_candle[lit=true]`);
        cmd(`setblock ${cx - 5} ${cy + 2} ${cz + 1} minecraft:skeleton_skull`);

        cmd(`fill ${cx + 5} ${cy + 1} ${cz - 1} ${cx + 5} ${cy + 1} ${cz + 1} ${pal.sarcophagus}`);
        cmd(`setblock ${cx + 5} ${cy + 2} ${cz - 1} minecraft:soul_candle[lit=true]`);
        cmd(`setblock ${cx + 5} ${cy + 2} ${cz + 1} minecraft:skeleton_skull`);

        if (sarcCount === 4) {
            cmd(`fill ${cx - 2} ${cy + 1} ${cz - 5} ${cx + 2} ${cy + 1} ${cz - 5} ${pal.sarcophagus}`);
            cmd(`setblock ${cx} ${cy + 2} ${cz - 5} minecraft:skeleton_skull`);
        }

        // Lighting
        cmd(`setblock ${cx - 4} ${cy + 4} ${cz - 4} ${pal.light}`);
        cmd(`setblock ${cx + 4} ${cy + 4} ${cz - 4} ${pal.light}`);
        cmd(`setblock ${cx - 4} ${cy + 4} ${cz + 4} ${pal.light}`);
        cmd(`setblock ${cx + 4} ${cy + 4} ${cz + 4} ${pal.light}`);

        // Spawn Elite Guardians
        this.spawnVanguardPack(server, cx, cy + 1, cz - 3, sector, instanceId, 'treasury_guard', rng);
    },

    // 4. Chasm Bridge over Lava, Void or Water
    buildChasmBridge: function(server, cx, cy, cz, pal, sector, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let rx = 7;
        let rz = 9;
        let h = 8;

        safeFill(server, cx - rx, cy - 6, cz - rz, cx + rx, cy - 5, cz + rz, pal.wall);
        safeFill(server, cx - rx, cy - 4, cz - rz, cx + rx, cy + h, cz - rz, pal.wall);
        safeFill(server, cx - rx, cy - 4, cz + rz, cx + rx, cy + h, cz + rz, pal.wall);
        safeFill(server, cx - rx, cy - 4, cz - rz, cx - rx, cy + h, cz + rz, pal.wall);
        safeFill(server, cx + rx, cy - 4, cz - rz, cx + rx, cy + h, cz + rz, pal.wall);
        safeFill(server, cx - rx, cy + h + 1, cz - rz, cx + rx, cy + h + 1, cz + rz, pal.ceiling);

        safeFill(server, cx - (rx - 1), cy - 4, cz - (rz - 1), cx + (rx - 1), cy + h, cz + (rz - 1), 'minecraft:air');

        // Liquid Pool at the bottom of the Chasm
        let liquid = pal.liquid || 'minecraft:lava';
        if (liquid !== 'minecraft:air') {
            safeFill(server, cx - (rx - 1), cy - 4, cz - (rz - 1), cx + (rx - 1), cy - 3, cz + (rz - 1), liquid);
        }

        // Bridge: Arched stone bridge spanning Z (width 3)
        safeFill(server, cx - 1, cy, cz - rz, cx + 1, cy, cz + rz, pal.floor);
        cmd(`fill ${cx - 1} ${cy - 2} ${cz - 4} ${cx + 1} ${cy - 1} ${cz - 2} ${pal.pillar}`);
        cmd(`fill ${cx - 1} ${cy - 2} ${cz + 2} ${cx + 1} ${cy - 1} ${cz + 4} ${pal.pillar}`);

        // Railings
        for (let bz = cz - rz + 2; bz <= cz + rz - 2; bz += 2) {
            cmd(`setblock ${cx - 2} ${cy + 1} ${bz} ${pal.gate}`);
            cmd(`setblock ${cx + 2} ${cy + 1} ${bz} ${pal.gate}`);
        }

        // Side Sniper Balconies with lights
        safeFill(server, cx - rx + 1, cy + 2, cz - 3, cx - rx + 3, cy + 2, cz + 3, pal.floor);
        cmd(`setblock ${cx - rx + 2} ${cy + 3} ${cz} ${pal.light}`);
        safeFill(server, cx + rx - 3, cy + 2, cz - 3, cx + rx - 1, cy + 2, cz + 3, pal.floor);
        cmd(`setblock ${cx + rx - 2} ${cy + 3} ${cz} ${pal.light}`);
    },

    // 5. Mini-Boss Arena with Portcullis Progression Gate
    buildMiniBossChamber: function(server, cx, cy, cz, pal, sector, instanceId, gateX, gateY, gateZ, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let r = 9;
        let h = 8;

        safeFill(server, cx - r, cy - 3, cz - r, cx + r, cy - 1, cz + r, pal.wall);
        safeFill(server, cx - r, cy, cz - r, cx + r, cy, cz + r, pal.floor);
        safeFill(server, cx - r, cy + 1, cz - r, cx + r, cy + h, cz - r, pal.wall);
        safeFill(server, cx - r, cy + 1, cz + r, cx + r, cy + h, cz + r, pal.wall);
        safeFill(server, cx - r, cy + 1, cz - r, cx - r, cy + h, cz + r, pal.wall);
        safeFill(server, cx + r, cy + 1, cz - r, cx + r, cy + h, cz + r, pal.wall);
        safeFill(server, cx - r, cy + h + 1, cz - r, cx + r, cy + h + 1, cz + r, pal.ceiling);
        safeFill(server, cx - (r - 1), cy + 1, cz - (r - 1), cx + (r - 1), cy + h, cz + (r - 1), 'minecraft:air');

        // Circular combat ring in center
        cmd(`fill ${cx - 4} ${cy} ${cz - 4} ${cx + 4} ${cy} ${cz + 4} ${pal.wall_detail}`);
        cmd(`setblock ${cx} ${cy} ${cz} ${pal.accent}`);

        // 4 Burning Fire Braziers at cardinal points
        let braziers = [[cx - 5, cz], [cx + 5, cz], [cx, cz - 5], [cx, cz + 5]];
        braziers.forEach(b => {
            cmd(`setblock ${b[0]} ${cy + 1} ${b[1]} minecraft:netherrack`);
            cmd(`setblock ${b[0]} ${cy + 2} ${b[1]} ${pal.fire || 'minecraft:fire'}`);
            cmd(`setblock ${b[0]} ${cy + 1} ${b[1] - 1} ${pal.gate}`);
            cmd(`setblock ${b[0]} ${cy + 1} ${b[1] + 1} ${pal.gate}`);
        });

        // 4 Corner Observation Columns
        cmd(`fill ${cx - 7} ${cy + 1} ${cz - 7} ${cx - 7} ${cy + 4} ${cz - 7} ${pal.pillar}`);
        cmd(`setblock ${cx - 7} ${cy + 5} ${cz - 7} ${pal.light}`);
        cmd(`fill ${cx + 7} ${cy + 1} ${cz - 7} ${cx + 7} ${cy + 4} ${cz - 7} ${pal.pillar}`);
        cmd(`setblock ${cx + 7} ${cy + 5} ${cz - 7} ${pal.light}`);
        cmd(`fill ${cx - 7} ${cy + 1} ${cz + 7} ${cx - 7} ${cy + 4} ${cz + 7} ${pal.pillar}`);
        cmd(`setblock ${cx - 7} ${cy + 5} ${cz + 7} ${pal.light}`);
        cmd(`fill ${cx + 7} ${cy + 1} ${cz + 7} ${cx + 7} ${cy + 4} ${cz + 7} ${pal.pillar}`);
        cmd(`setblock ${cx + 7} ${cy + 5} ${cz + 7} ${pal.light}`);

        // Portcullis Exit Gate (Locked Iron Bars)
        safeFill(server, gateX - 2, gateY + 1, gateZ, gateX + 2, gateY + 4, gateZ, pal.gate);

        // Record Portcullis Gate Coordinates
        let pData = server.persistentData;
        let instTag = `inst_${instanceId}`;
        let instInfo = pData.getCompound(instTag);
        instInfo.putDouble('gate_x', gateX);
        instInfo.putDouble('gate_y', gateY);
        instInfo.putDouble('gate_z', gateZ);
        pData.put(instTag, instInfo);

        // Spawn Procedural Mini-Boss
        this.spawnMiniBoss(server, cx, cy + 1, cz, sector, instanceId, rng);
    },

    // 6. Abyssal Vault on Tier 2
    buildAbyssalVault: function(server, cx, cy, cz, pal, sector, instanceId, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let r = 7;
        let h = 7;

        safeFill(server, cx - r, cy - 3, cz - r, cx + r, cy - 1, cz + r, pal.abyss_wall);
        safeFill(server, cx - r, cy, cz - r, cx + r, cy, cz + r, pal.abyss_floor);
        safeFill(server, cx - r, cy + 1, cz - r, cx + r, cy + h, cz - r, pal.abyss_wall);
        safeFill(server, cx - r, cy + 1, cz + r, cx + r, cy + h, cz + r, pal.abyss_wall);
        safeFill(server, cx - r, cy + 1, cz - r, cx - r, cy + h, cz + r, pal.abyss_wall);
        safeFill(server, cx + r, cy + 1, cz - r, cx + r, cy + h, cz + r, pal.abyss_wall);
        safeFill(server, cx - r, cy + h + 1, cz - r, cx + r, cy + h + 1, cz + r, pal.abyss_floor);
        safeFill(server, cx - (r - 1), cy + 1, cz - (r - 1), cx + (r - 1), cy + h, cz + (r - 1), 'minecraft:air');

        // Accent pattern in center
        cmd(`fill ${cx - 3} ${cy} ${cz - 3} ${cx + 3} ${cy} ${cz + 3} ${pal.accent} replace ${pal.abyss_floor}`);

        // Hanging chains from ceiling
        cmd(`fill ${cx - 3} ${cy + 3} ${cz - 3} ${cx - 3} ${cy + h} ${cz - 3} minecraft:chain`);
        cmd(`setblock ${cx - 3} ${cy + 2} ${cz - 3} ${pal.light}`);
        cmd(`fill ${cx + 3} ${cy + 3} ${cz + 3} ${cx + 3} ${cy + h} ${cz + 3} minecraft:chain`);
        cmd(`setblock ${cx + 3} ${cy + 2} ${cz + 3} ${pal.light}`);

        // Spawn Abyssal Guards
        this.spawnAbyssGuards(server, cx, cy + 1, cz, sector, instanceId, rng);
    },

    // 7. Grand Boss Sanctum & Imperial Dais
    buildGrandBossSanctum: function(server, cx, cy, cz, pal, sector, instanceId, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let r = 12;
        let h = 10;

        safeFill(server, cx - r, cy - 3, cz - r, cx + r, cy - 1, cz + r, pal.abyss_wall);
        safeFill(server, cx - r, cy, cz - r, cx + r, cy, cz + r, pal.abyss_floor);
        safeFill(server, cx - r, cy + 1, cz - r, cx + r, cy + h, cz - r, pal.abyss_wall);
        safeFill(server, cx - r, cy + 1, cz + r, cx + r, cy + h, cz + r, pal.abyss_wall);
        safeFill(server, cx - r, cy + 1, cz - r, cx - r, cy + h, cz + r, pal.abyss_wall);
        safeFill(server, cx + r, cy + 1, cz - r, cx + r, cy + h, cz + r, pal.abyss_wall);
        safeFill(server, cx - r, cy + h + 1, cz - r, cx + r, cy + h + 1, cz + r, pal.abyss_floor);
        safeFill(server, cx - (r - 1), cy + 1, cz - (r - 1), cx + (r - 1), cy + h, cz + (r - 1), 'minecraft:air');

        // 4 Colossal Corner Columns (3x3) for tactical cover & dodging
        let colCoords = [[cx - 7, cz - 7], [cx + 7, cz - 7], [cx - 7, cz + 7], [cx + 7, cz + 7]];
        colCoords.forEach(pos => {
            safeFill(server, pos[0] - 1, cy + 1, pos[1] - 1, pos[0] + 1, cy + h - 1, pos[1] + 1, pal.pillar);
            cmd(`setblock ${pos[0]} ${cy + 4} ${pos[1]} ${pal.light}`);
        });

        // Raised Imperial Dais at the far end (Z + 8)
        let throneZ = cz + 8;
        safeFill(server, cx - 4, cy + 1, throneZ - 2, cx + 4, cy + 2, throneZ + 2, pal.wall_detail);
        safeFill(server, cx - 3, cy + 1, throneZ - 3, cx + 3, cy + 1, throneZ - 3, pal.wall_detail);

        // Ornate Throne Structure
        cmd(`setblock ${cx} ${cy + 3} ${throneZ} ${pal.pillar}`);
        cmd(`setblock ${cx} ${cy + 4} ${throneZ} ${pal.accent}`);
        cmd(`setblock ${cx - 1} ${cy + 3} ${throneZ} ${pal.wall_detail}`);
        cmd(`setblock ${cx + 1} ${cy + 3} ${throneZ} ${pal.wall_detail}`);

        // Flanking Burning Flame Bowls
        cmd(`setblock ${cx - 3} ${cy + 3} ${throneZ} minecraft:netherrack`);
        cmd(`setblock ${cx - 3} ${cy + 4} ${throneZ} ${pal.fire || 'minecraft:fire'}`);
        cmd(`setblock ${cx + 3} ${cy + 3} ${throneZ} minecraft:netherrack`);
        cmd(`setblock ${cx + 3} ${cy + 4} ${throneZ} ${pal.fire || 'minecraft:fire'}`);

        // Record Boss Throne Coordinates for persistentData victory spawning
        let pData = server.persistentData;
        let instTag = `inst_${instanceId}`;
        let instInfo = pData.getCompound(instTag);
        instInfo.putDouble('boss_throne_x', cx);
        instInfo.putDouble('boss_throne_y', cy + 1);
        instInfo.putDouble('boss_throne_z', throneZ - 4);
        pData.put(instTag, instInfo);

        // Spawn Procedural Final Boss
        this.spawnFinalBoss(server, cx, cy + 1, cz, sector, instanceId, rng);
    },

    // 8. Corridors & Stairways
    buildCorridorZ: function(server, x, y, z1, z2, width, pal, isLower, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let startZ = Math.min(z1, z2);
        let endZ = Math.max(z1, z2);
        let halfW = Math.floor(width / 2);
        let floorB = isLower ? pal.abyss_floor : pal.floor;
        let wallB = isLower ? pal.abyss_wall : pal.wall;
        let ceilB = isLower ? pal.abyss_floor : pal.ceiling;

        safeFill(server, x - halfW - 1, y - 3, startZ, x + halfW + 1, y - 1, endZ, wallB);
        safeFill(server, x - halfW, y, startZ, x + halfW, y, endZ, floorB);
        safeFill(server, x - halfW, y + 1, startZ, x + halfW, y + 4, endZ, 'minecraft:air');
        safeFill(server, x - halfW - 1, y + 1, startZ, x - halfW - 1, y + 4, endZ, wallB);
        safeFill(server, x + halfW + 1, y + 1, startZ, x + halfW + 1, y + 4, endZ, wallB);
        safeFill(server, x - halfW - 1, y + 5, startZ, x + halfW + 1, y + 5, endZ, ceilB);

        for (let cz = startZ; cz <= endZ; cz += 5) {
            cmd(`setblock ${x - halfW} ${y + 3} ${cz} ${pal.light}`);
            cmd(`setblock ${x + halfW} ${y + 3} ${cz} ${pal.light}`);
        }
    },

    buildCorridorX: function(server, z, y, x1, x2, width, pal, isLower, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let startX = Math.min(x1, x2);
        let endX = Math.max(x1, x2);
        let halfW = Math.floor(width / 2);
        let floorB = isLower ? pal.abyss_floor : pal.floor;
        let wallB = isLower ? pal.abyss_wall : pal.wall;
        let ceilB = isLower ? pal.abyss_floor : pal.ceiling;

        safeFill(server, startX, y - 3, z - halfW - 1, endX, y - 1, z + halfW + 1, wallB);
        safeFill(server, startX, y, z - halfW, endX, y, z + halfW, floorB);
        safeFill(server, startX, y + 1, z - halfW, endX, y + 4, z + halfW, 'minecraft:air');
        safeFill(server, startX, y + 1, z - halfW - 1, endX, y + 4, z - halfW - 1, wallB);
        safeFill(server, startX, y + 1, z + halfW + 1, endX, y + 4, z + halfW + 1, wallB);
        safeFill(server, startX, y + 5, z - halfW - 1, endX, y + 5, z + halfW + 1, ceilB);

        for (let cx = startX; cx <= endX; cx += 5) {
            cmd(`setblock ${cx} ${y + 3} ${z - halfW} ${pal.light}`);
            cmd(`setblock ${cx} ${y + 3} ${z + halfW} ${pal.light}`);
        }
    },

    buildDescendingStaircase: function(server, x, startY, endY, z1, z2, pal, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let startZ = Math.min(z1, z2);
        let endZ = Math.max(z1, z2);
        let totalSteps = endZ - startZ + 1;
        let yDrop = startY - endY;

        for (let cz = startZ; cz <= endZ; cz++) {
            let progress = (cz - startZ) / totalSteps;
            let currentY = Math.round(startY - (progress * yDrop));

            cmd(`fill ${x - 3} ${currentY - 3} ${cz} ${x + 3} ${currentY} ${cz} ${pal.abyss_floor}`);
            cmd(`fill ${x - 2} ${currentY + 1} ${cz} ${x + 2} ${currentY + 5} ${cz} minecraft:air`);
            cmd(`fill ${x - 3} ${currentY + 1} ${cz} ${x - 3} ${currentY + 5} ${cz} ${pal.abyss_wall}`);
            cmd(`fill ${x + 3} ${currentY + 1} ${cz} ${x + 3} ${currentY + 5} ${cz} ${pal.abyss_wall}`);
            cmd(`fill ${x - 3} ${currentY + 6} ${cz} ${x + 3} ${currentY + 6} ${cz} ${pal.abyss_wall}`);

            if (cz % 3 === 0) {
                cmd(`setblock ${x - 2} ${currentY + 3} ${cz} ${pal.light}`);
                cmd(`setblock ${x + 2} ${currentY + 3} ${cz} ${pal.light}`);
            }
        }
    },

    // 9. Dynamic Loot Populator
    populateTreasuryChest: function(server, x, y, z, sector, instanceId, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let essSector = Math.floor(sector);
        let essenceItem = `kubejs:dungeon_essence_t${essSector}`;

        let essCount = rng.nextInt(2, 3);
        cmd(`item replace block ${x} ${y} ${z} container.0 with ${essenceItem} ${essCount}`);

        let ingot = essSector >= 6 ? 'minecraft:netherite_ingot' : (essSector >= 3 ? 'minecraft:diamond' : (essSector >= 2 ? 'minecraft:iron_ingot' : 'minecraft:copper_ingot'));
        cmd(`item replace block ${x} ${y} ${z} container.4 with ${ingot} ${rng.nextInt(3, 6)}`);

        cmd(`item replace block ${x} ${y} ${z} container.12 with minecraft:gold_ingot ${rng.nextInt(4, 8)}`);
        cmd(`item replace block ${x} ${y} ${z} container.14 with minecraft:lapis_lazuli ${rng.nextInt(8, 16)}`);
        cmd(`item replace block ${x} ${y} ${z} container.22 with minecraft:potion[potion_contents={potion:"minecraft:healing"}] 1`);
    },

    populateVictoryChest: function(server, x, y, z, sector, instanceId, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let essSector = Math.floor(sector);
        let essenceItem = `kubejs:dungeon_essence_t${essSector}`;

        cmd(`item replace block ${x} ${y} ${z} container.4 with ${essenceItem} 3`);
        cmd(`item replace block ${x} ${y} ${z} container.0 with minecraft:diamond ${rng.nextInt(2, 4)}`);
        cmd(`item replace block ${x} ${y} ${z} container.8 with minecraft:emerald ${rng.nextInt(4, 8)}`);
        cmd(`item replace block ${x} ${y} ${z} container.20 with minecraft:gold_block ${rng.nextInt(1, 2)}`);
        cmd(`item replace block ${x} ${y} ${z} container.24 with minecraft:potion[potion_contents={potion:"minecraft:strong_healing"}] 2`);

        if (rng.next() <= 0.25) {
            let defiledItem = (rng.next() <= 0.5) ? `kubejs:defiled_blade_t${essSector}` : `kubejs:defiled_chestplate_t${essSector}`;
            cmd(`item replace block ${x} ${y} ${z} container.13 with ${defiledItem} 1`);
        }
    },

    // 10. Multi-Mob Spawners from Tier Data Pools
    spawnVanguardPack: function(server, x, y, z, sector, instanceId, packTag, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let tData = this.getTierData(sector);
        let vPool = tData.vanguard;

        for (let i = 0; i < 3; i++) {
            let mob = rng.choice(vPool);
            let ox = (i === 0 ? 0 : (i === 1 ? -2 : 2));
            let oz = (i === 0 ? 0 : 2);

            let hands = `HandItems:[${mob.main ? `{id:"${mob.main}",count:1}` : '{}'},${mob.off ? `{id:"${mob.off}",count:1}` : '{}'}]`;
            let armor = `ArmorItems:[{},{},${mob.chest ? `{id:"${mob.chest}",count:1}` : '{}'},${mob.helm ? `{id:"${mob.helm}",count:1}` : '{}'}]`;
            let nbt = `{Tags:["inst_${instanceId}","dungeon_elite","${packTag}"],CustomName:'{"text":"${mob.name}","color":"red"}',${hands},${armor},HandDropChances:[0.0f,0.0f],ArmorDropChances:[0.0f,0.0f,0.0f,0.0f],Attributes:[{Name:"generic.max_health",Base:${mob.hp}.0f}],Health:${mob.hp}.0f}`;

            cmd(`summon ${mob.id} ${x + ox} ${y} ${z + oz} ${nbt}`);
        }

        let rPool = tData.ranged;
        for (let j = 0; j < 2; j++) {
            let rMob = rng.choice(rPool);
            let rx = (j === 0 ? -3 : 3);
            let rNbt = `{Tags:["inst_${instanceId}","dungeon_elite","${packTag}"],CustomName:'{"text":"${rMob.name}","color":"dark_red"}',HandItems:[${rMob.bow ? `{id:"${rMob.bow}",count:1}` : '{}'},{}],ArmorItems:[{},{},{},${rMob.helm ? `{id:"${rMob.helm}",count:1}` : '{}'}],HandDropChances:[0.0f,0.0f],ArmorDropChances:[0.0f,0.0f,0.0f,0.0f],Attributes:[{Name:"generic.max_health",Base:${rMob.hp}.0f}],Health:${rMob.hp}.0f}`;

            cmd(`summon ${rMob.id} ${x + rx} ${y} ${z + 3} ${rNbt}`);
        }
    },

    spawnArcherSnipers: function(server, x, y, z, sector, instanceId, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let tData = this.getTierData(sector);
        let rMob = rng.choice(tData.ranged);

        let rNbt = `{Tags:["inst_${instanceId}","dungeon_elite","sniper"],CustomName:'{"text":"${rMob.name}","color":"dark_red"}',HandItems:[${rMob.bow ? `{id:"${rMob.bow}",count:1}` : '{}'},{}],ArmorItems:[{},{},{},${rMob.helm ? `{id:"${rMob.helm}",count:1}` : '{}'}],HandDropChances:[0.0f,0.0f]}`;
        cmd(`summon ${rMob.id} ${x} ${y} ${z} ${rNbt}`);
    },

    spawnMiniBoss: function(server, x, y, z, sector, instanceId, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let tData = this.getTierData(sector);
        let mb = rng.choice(tData.miniboss);

        let hands = `HandItems:[${mb.main ? `{id:"${mb.main}",count:1}` : '{}'},{}]`;
        let armor = `ArmorItems:[{},{},${mb.chest ? `{id:"${mb.chest}",count:1}` : '{}'},${mb.helm ? `{id:"${mb.helm}",count:1}` : '{}'}]`;
        let nbt = `{Tags:["inst_${instanceId}","dungeon_miniboss"],CustomName:'{"text":"${mb.name}","color":"gold","bold":true}',${hands},${armor},HandDropChances:[0.0f,0.0f],ArmorDropChances:[0.0f,0.0f,0.0f,0.0f],Attributes:[{Name:"generic.max_health",Base:${mb.hp}.0f},{Name:"generic.attack_damage",Base:9.0f},{Name:"generic.knockback_resistance",Base:0.6f}],Health:${mb.hp}.0f}`;

        cmd(`summon ${mb.id} ${x} ${y} ${z} ${nbt}`);
    },

    spawnAbyssGuards: function(server, x, y, z, sector, instanceId, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let tData = this.getTierData(sector);
        let mob = rng.choice(tData.vanguard);

        let nbt = `{Tags:["inst_${instanceId}","dungeon_abyss_guard"],CustomName:'{"text":"Страж Недр: ${mob.name}","color":"dark_purple"}',Attributes:[{Name:"generic.max_health",Base:${mob.hp + 20}.0f}],Health:${mob.hp + 20}.0f}`;
        cmd(`summon ${mob.id} ${x - 3} ${y} ${z} ${nbt}`);
        cmd(`summon ${mob.id} ${x + 3} ${y} ${z} ${nbt}`);
    },

    spawnFinalBoss: function(server, x, y, z, sector, instanceId, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let tData = this.getTierData(sector);
        let b = rng.choice(tData.boss);

        let hands = `HandItems:[${b.main ? `{id:"${b.main}",count:1}` : '{}'},{}]`;
        let armor = `ArmorItems:[{},{},${b.chest ? `{id:"${b.chest}",count:1}` : '{}'},${b.helm ? `{id:"${b.helm}",count:1}` : '{}'}]`;
        let nbt = `{Tags:["inst_${instanceId}","dungeon_boss"],CustomName:'{"text":"${b.name}","color":"dark_red","bold":true}',${hands},${armor},HandDropChances:[0.0f,0.0f],ArmorDropChances:[0.0f,0.0f,0.0f,0.0f],Attributes:[{Name:"generic.max_health",Base:${b.hp}.0f},{Name:"generic.attack_damage",Base:14.0f},{Name:"generic.knockback_resistance",Base:0.8f}],Health:${b.hp}.0f}`;

        cmd(`summon ${b.id} ${x} ${y} ${z} ${nbt}`);
    },

    // 11. Portcullis Unlock
    unlockPortcullis: function(server, instanceId) {
        let pData = server.persistentData;
        let instTag = `inst_${instanceId}`;
        if (!pData.contains(instTag)) return;

        let instInfo = pData.getCompound(instTag);
        let gx = instInfo.getDouble('gate_x');
        let gy = instInfo.getDouble('gate_y');
        let gz = instInfo.getDouble('gate_z');

        server.runCommandSilent(`execute in elyrium:dungeons run fill ${gx - 2} ${gy + 1} ${gz} ${gx + 2} ${gy + 4} ${gz} minecraft:air`);

        let level = server.getLevel('elyrium:dungeons');
        if (level) {
            level.players.forEach(p => {
                if (p.persistentData.getInt('elyrium_active_instance') === instanceId) {
                    p.playNotifySound('minecraft:block.iron_door.open', 'players', 1.0, 0.8);
                    p.playNotifySound('minecraft:block.grindstone.use', 'players', 1.0, 0.6);
                    p.displayClientMessage(Component.literal('§a⚔ [ЯРУС I ЗАЧИЩЕН] §fХранитель повержен! Решетка в Недра распахнута!'), false);
                }
            });
        }
    },

    // ==========================================================================
    // 12. MASTER PROCEDURAL DUNGEON BUILDER (Multi-Tier & Pseudo-Random Seed)
    // ==========================================================================
    buildDungeon: function(server, instanceId, sector) {
        let tData = this.getTierData(sector);
        let pal = tData.palette;
        let originX = instanceId * 1500;
        let originY = 64;
        let originZ = 0;

        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);

        cmd(`forceload add ${originX - 96} -96 ${originX + 96} 160`);

        // PRNG Seed based on instance, sector, and real time
        let seed = (instanceId * 1664525 + Math.floor(sector * 10) * 1013904223 + Date.now()) >>> 0;
        let rng = makePRNG(seed);

        let layout = rng.nextInt(0, 3);
        console.log(`[ELYRIUM] Multi-Tier Mega-Dungeon #${instanceId} (Sector ${sector}) Generating layout: ${layout} with seed: ${seed}`);

        // 1. Build Subterranean Sarcophagus Hull
        this.buildSarcophagus(server, originX, pal);

        // 2. Entrance Hall
        this.buildEntranceHall(server, originX, originY, originZ, pal, sector, instanceId, rng);
        this.buildCorridorZ(server, originX, originY, 5, 18, 4, pal, false, rng);

        // ======================================================================
        // LAYOUT 0: WEST BRANCHING CRYPT
        // ======================================================================
        if (layout === 0) {
            this.buildPillaredHall(server, originX, 64, 24, 6, 6, 6, pal, false, rng);

            // West Wing: Corridor to Treasury Vault
            this.buildCorridorX(server, 24, 64, originX - 7, originX - 22, 4, pal, false, rng);
            this.buildTreasuryVault(server, originX - 28, 64, 24, pal, sector, instanceId, rng);

            // North Path: Corridor into Pillared Crypt Hall
            this.buildCorridorZ(server, originX, 64, 30, 44, 4, pal, false, rng);
            this.buildPillaredHall(server, originX, 64, 50, 7, 7, 7, pal, false, rng);
            this.spawnVanguardPack(server, originX, 65, 50, sector, instanceId, 'hall_combat', rng);

            // Corridor to Mini-Boss Arena
            this.buildCorridorZ(server, originX, 64, 57, 70, 4, pal, false, rng);
            let gateZ = 85;
            this.buildMiniBossChamber(server, originX, 64, 76, pal, sector, instanceId, originX, 64, gateZ, rng);

            // Grand Descent Stairs from Y=64 to Y=46
            this.buildDescendingStaircase(server, originX, 64, 46, gateZ + 1, gateZ + 16, pal, rng);

            // Abyssal Vault on lower floor (Y=46)
            let abyssZ = gateZ + 24;
            this.buildAbyssalVault(server, originX, 46, abyssZ, pal, sector, instanceId, rng);

            // Boss Sanctum
            this.buildCorridorZ(server, originX, 46, abyssZ + 7, abyssZ + 18, 4, pal, true, rng);
            this.buildGrandBossSanctum(server, originX, 46, abyssZ + 30, pal, sector, instanceId, rng);
        }
        // ======================================================================
        // LAYOUT 1: EAST WING & CHASM BRIDGE
        // ======================================================================
        else if (layout === 1) {
            this.buildPillaredHall(server, originX, 64, 24, 6, 6, 6, pal, false, rng);

            // East Wing: Corridor to Treasury Vault
            this.buildCorridorX(server, 24, 64, originX + 7, originX + 22, 4, pal, false, rng);
            this.buildTreasuryVault(server, originX + 28, 64, 24, pal, sector, instanceId, rng);

            // North Path: Chasm Bridge over Lava/Void/Water
            this.buildCorridorZ(server, originX, 64, 30, 40, 4, pal, false, rng);
            this.buildChasmBridge(server, originX, 64, 49, pal, sector, rng);
            this.spawnArcherSnipers(server, originX - 5, 66, 49, sector, instanceId, rng);
            this.spawnArcherSnipers(server, originX + 5, 66, 49, sector, instanceId, rng);

            // Corridor to Mini-Boss Arena
            this.buildCorridorZ(server, originX, 64, 58, 70, 4, pal, false, rng);
            let gateZ = 85;
            this.buildMiniBossChamber(server, originX, 64, 76, pal, sector, instanceId, originX, 64, gateZ, rng);

            // Descent Stairs to Y=46
            this.buildDescendingStaircase(server, originX, 64, 46, gateZ + 1, gateZ + 16, pal, rng);

            // Abyssal Vault
            let abyssZ = gateZ + 24;
            this.buildAbyssalVault(server, originX, 46, abyssZ, pal, sector, instanceId, rng);

            // Boss Sanctum
            this.buildCorridorZ(server, originX, 46, abyssZ + 7, abyssZ + 18, 4, pal, true, rng);
            this.buildGrandBossSanctum(server, originX, 46, abyssZ + 30, pal, sector, instanceId, rng);
        }
        // ======================================================================
        // LAYOUT 2: L-SHAPED FLANK GAUNTLET
        // ======================================================================
        else if (layout === 2) {
            this.buildPillaredHall(server, originX, 64, 24, 7, 7, 6, pal, false, rng);
            this.spawnVanguardPack(server, originX, 65, 24, sector, instanceId, 'combat_l', rng);

            // Turn East: Corridor to Chasm Bridge
            this.buildCorridorX(server, 24, 64, originX + 7, originX + 22, 4, pal, false, rng);
            this.buildChasmBridge(server, originX + 28, 64, 33, pal, sector, rng);

            // Turn North: Corridor to Treasury Vault
            this.buildCorridorZ(server, originX + 28, 64, 42, 54, 4, pal, false, rng);
            this.buildTreasuryVault(server, originX + 28, 64, 61, pal, sector, instanceId, rng);

            // Turn West: Corridor to Mini-Boss Chamber
            this.buildCorridorX(server, 61, 64, originX + 21, originX + 7, 4, pal, false, rng);
            let gateZ = 75;
            this.buildMiniBossChamber(server, originX, 64, 61, pal, sector, instanceId, originX, 64, gateZ, rng);

            // Descent Stairs to Y=46
            this.buildDescendingStaircase(server, originX, 64, 46, gateZ + 1, gateZ + 16, pal, rng);

            // Abyssal Vault
            let abyssZ = gateZ + 24;
            this.buildAbyssalVault(server, originX, 46, abyssZ, pal, sector, instanceId, rng);

            // Boss Sanctum
            this.buildCorridorZ(server, originX, 46, abyssZ + 7, abyssZ + 18, 4, pal, true, rng);
            this.buildGrandBossSanctum(server, originX, 46, abyssZ + 30, pal, sector, instanceId, rng);
        }
        // ======================================================================
        // LAYOUT 3: DUAL FORK SANCTUM
        // ======================================================================
        else {
            this.buildPillaredHall(server, originX, 64, 24, 7, 7, 7, pal, false, rng);

            // Left Fork: Corridor to Treasury Crypt
            this.buildCorridorX(server, 24, 64, originX - 7, originX - 18, 4, pal, false, rng);
            this.buildCorridorZ(server, originX - 18, 64, 24, 44, 4, pal, false, rng);
            this.buildTreasuryVault(server, originX - 18, 64, 51, pal, sector, instanceId, rng);

            // Right Fork: Corridor to Mini-Boss Arena
            this.buildCorridorX(server, 24, 64, originX + 7, originX + 18, 4, pal, false, rng);
            this.buildCorridorZ(server, originX + 18, 64, 24, 44, 4, pal, false, rng);
            let gateZ = 65;
            this.buildMiniBossChamber(server, originX + 18, 64, 51, pal, sector, instanceId, originX + 18, 64, gateZ, rng);

            // Descent from Mini-Boss Gate down to Y=46
            this.buildDescendingStaircase(server, originX + 18, 64, 46, gateZ + 1, gateZ + 16, pal, rng);

            // Turn back to Center axis at Y=46
            let lowerZ = gateZ + 22;
            this.buildCorridorX(server, lowerZ, 46, originX + 18, originX, 4, pal, true, rng);

            // Abyssal Vault
            this.buildAbyssalVault(server, originX, 46, lowerZ, pal, sector, instanceId, rng);

            // Boss Sanctum
            this.buildCorridorZ(server, originX, 46, lowerZ + 7, lowerZ + 18, 4, pal, true, rng);
            this.buildGrandBossSanctum(server, originX, 46, lowerZ + 30, pal, sector, instanceId, rng);
        }
    }
};

// ==============================================================================
// 13. ENTITY DEATH EVENT LISTENERS (PROGRESSION & VICTORY)
// ==============================================================================
EntityEvents.death(event => {
    let entity = event.entity;
    if (!entity) return;

    let tags = entity.tags;
    let instanceId = -1;

    tags.forEach(t => {
        if (t.startsWith('inst_')) {
            instanceId = parseInt(t.replace('inst_', ''));
        }
    });

    if (instanceId <= 0) return;
    let server = entity.server;

    // Mini-boss death: open portcullis gate
    if (tags.contains('dungeon_miniboss')) {
        ElyriumDungeonStitcher.unlockPortcullis(server, instanceId);
    }

    // Final boss death: spawn Triumph Portal and Victory Chest
    if (tags.contains('dungeon_boss')) {
        let pData = server.persistentData;
        let instTag = `inst_${instanceId}`;
        let instInfo = pData.getCompound(instTag);
        let bx = instInfo.getDouble('boss_throne_x');
        let by = instInfo.getDouble('boss_throne_y');
        let bz = instInfo.getDouble('boss_throne_z');
        let sector = instInfo.getInt('sector') || 1;

        let seed = (instanceId * 1664525 + Math.floor(sector * 10) * 1013904223 + Date.now()) >>> 0;
        let rng = makePRNG(seed);

        // Spawn Victory Chest with authentic high-tier loot
        server.runCommandSilent(`execute in elyrium:dungeons run setblock ${bx} ${by} ${bz} minecraft:chest[facing=south]{CustomName:'{"text":"Сундук Победы Подземелья","color":"gold"}'}`);
        ElyriumDungeonStitcher.populateVictoryChest(server, bx, by, bz, sector, instanceId, rng);

        // Spawn Golden Portal of Triumph
        server.runCommandSilent(`execute in elyrium:dungeons run summon interaction ${bx + 0.5} ${by} ${bz + 4.5} {width:2.0f,height:3.0f,Tags:["elyrium_triumph_portal","inst_${instanceId}"]}`);
        server.runCommandSilent(`execute in elyrium:dungeons run summon block_display ${bx + 0.5} ${by + 0.2} ${bz + 4.5} {block_state:{Name:"minecraft:gilded_blackstone"},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],scale:[1.8f,2.8f,0.2f],translation:[-0.9f,0.0f,-0.1f]},Tags:["elyrium_triumph_display","inst_${instanceId}"]}`);

        let level = server.getLevel('elyrium:dungeons');
        if (level) {
            level.players.forEach(p => {
                if (p.persistentData.getInt('elyrium_active_instance') === instanceId) {
                    p.playNotifySound('minecraft:ui.toast.challenge_complete', 'players', 1.0, 1.0);
                    p.displayClientMessage(Component.literal('§6👑 [ТРИУМФ] §fВладыка Недр повержен! Войдите в Золотой Портал для возвращения!'), false);
                }
            });
        }
    }
});

// ==============================================================================
// 14. ADMIN COMMANDS
// ==============================================================================
ServerEvents.commandRegistry(event => {
    let { commands: Commands, arguments: Arguments } = event;

    event.register(
        Commands.literal('dungeon_generate')
            .requires(s => s.hasPermission(2))
            .then(Commands.argument('sector', Arguments.INTEGER.create(event))
                .executes(ctx => {
                    let sector = Arguments.INTEGER.getResult(ctx, 'sector');
                    let player = ctx.source.player;
                    let server = ctx.source.server;

                    let pData = server.persistentData;
                    let nextId = (pData.getInt('elyrium_instance_counter') || 0) + 1;
                    pData.putInt('elyrium_instance_counter', nextId);

                    ElyriumDungeonStitcher.buildDungeon(server, nextId, sector);

                    if (player) {
                        player.displayClientMessage(Component.literal(`§a[DUNGEON] Мега-данж #${nextId} (Сектор ${sector}) сгенерирован! Вход: /dungeon_enter ${nextId}`), false);
                    }
                    return 1;
                })
            )
    );

    event.register(
        Commands.literal('dungeon_enter')
            .then(Commands.argument('id', Arguments.INTEGER.create(event))
                .executes(ctx => {
                    let id = Arguments.INTEGER.getResult(ctx, 'id');
                    let player = ctx.source.player;
                    if (!player) return 0;

                    let cellX = id * 1500;
                    player.persistentData.putDouble('elyrium_return_x', player.x);
                    player.persistentData.putDouble('elyrium_return_y', player.y);
                    player.persistentData.putDouble('elyrium_return_z', player.z);
                    player.persistentData.putString('elyrium_return_dim', String(player.level.dimension));
                    player.persistentData.putInt('elyrium_active_instance', id);

                    player.teleportTo('elyrium:dungeons', cellX + 0.5, 65.0, 0.5, 0, 0);
                    player.displayClientMessage(Component.literal(`§6⚔ [ПОДЗЕМЕЛЬЕ #${id}] §fВы вошли на стартовую площадку катакомб!`), true);
                    return 1;
                })
            )
    );
});
