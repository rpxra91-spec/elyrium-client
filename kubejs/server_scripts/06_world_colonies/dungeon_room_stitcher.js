// =============================================================================
// ELYRIUM RPG: DUNGEON ROOM STITCHER (CANON ENGINE v8.0)
// 3-Tier Multi-Floor Full Procedural Random Walk Generator
// Maximum Randomness: Unpredictable Forks, Dynamic Snake Trajectories,
// 60% Punishing Dead-End Ambushes with Zero Loot, Portcullis Mini-Boss & Boss Sanctum
// =============================================================================

// High-speed Pseudo-Random Number Generator (PRNG - XorShift32)
function makePRNG(seed) {
    let s = (seed >>> 0) || 123456789;
    return {
        next: function() {
            s ^= s << 13;
            s ^= s >>> 17;
            s ^= s << 5;
            return ((s >>> 0) / 4294967296);
        },
        nextInt: function(min, max) {
            return Math.floor(this.next() * (max - min + 1)) + min;
        },
        choice: function(arr) {
            if (!arr || arr.length === 0) return null;
            return arr[Math.floor(this.next() * arr.length)];
        },
        shuffle: function(arr) {
            for (let i = arr.length - 1; i > 0; i--) {
                let j = Math.floor(this.next() * (i + 1));
                let temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
            return arr;
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
            golden_light: 'minecraft:soul_lantern',
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
            { id: 'cataclysm:ancient_remnant', name: 'Древний Реликт Катакомб [Босс]', hp: 450 },
            { id: 'irons_spellbooks:dead_king', name: 'Падший Король Склепа [Босс]', hp: 420 },
            { id: 'minecraft:warden', name: 'Хранитель Глубинного Разлома [Босс]', hp: 500 }
        ]
    },
    1.5: { // Sector 1.5: The Undergarden (Depthrock / Rot Crypts)
        palette: {
            floor: 'undergarden:depthrock_bricks',
            floor_cracked: 'undergarden:cracked_depthrock_bricks',
            floor_mossy: 'undergarden:shiverstone_bricks',
            wall: 'undergarden:depthrock_bricks',
            wall_detail: 'undergarden:chiseled_depthrock_bricks',
            pillar: 'undergarden:polished_depthrock',
            light: 'undergarden:shiverstone_lantern',
            golden_light: 'minecraft:soul_lantern',
            gate: 'minecraft:iron_bars',
            ceiling: 'undergarden:depthrock',
            accent: 'undergarden:cloggrum_block',
            abyss_floor: 'undergarden:tremblecrust_bricks',
            abyss_wall: 'undergarden:tremblecrust',
            liquid: 'undergarden:virulent_mix_fluid_source',
            sarcophagus: 'undergarden:depthrock_bricks',
            fire: 'undergarden:virulent_fire'
        },
        vanguard: [
            { id: 'undergarden:rotwalker', name: 'Гнилостный Ходок Недр', hp: 50 },
            { id: 'undergarden:rotbeast', name: 'Гнилостный Зверь Глубин', hp: 55 },
            { id: 'undergarden:stoneborn', name: 'Каменнорожденный Страж', hp: 60 }
        ],
        ranged: [
            { id: 'undergarden:sploogie', name: 'Плевун Чумных Катакомб', hp: 35 },
            { id: 'undergarden:rotling', name: 'Гнилостный Попрыгун', hp: 30 }
        ],
        miniboss: [
            { id: 'undergarden:forgotten_guardian', name: 'Забытый Страж Подземного Сада [Мини-Босс]', hp: 220 },
            { id: 'cataclysm:draugr', name: 'Гнилостный Командир [Мини-Босс]', hp: 210 }
        ],
        boss: [
            { id: 'undergarden:forgotten_guardian', name: 'Древний Владыка Глубин [Босс]', hp: 480 },
            { id: 'cataclysm:ancient_remnant', name: 'Реликт Чумных Пещер [Босс]', hp: 500 }
        ]
    },
    2: { // Sector 2: The Nether (Infernal Bastion)
        palette: {
            floor: 'minecraft:polished_blackstone_bricks',
            floor_cracked: 'minecraft:cracked_polished_blackstone_bricks',
            floor_mossy: 'minecraft:nether_bricks',
            wall: 'minecraft:polished_blackstone_bricks',
            wall_detail: 'minecraft:chiseled_polished_blackstone',
            pillar: 'minecraft:gilded_blackstone',
            light: 'minecraft:soul_lantern',
            golden_light: 'minecraft:shroomlight',
            gate: 'minecraft:nether_brick_fence',
            ceiling: 'minecraft:nether_bricks',
            accent: 'minecraft:crying_obsidian',
            abyss_floor: 'minecraft:crying_obsidian',
            abyss_wall: 'minecraft:polished_blackstone',
            liquid: 'minecraft:lava',
            sarcophagus: 'minecraft:gilded_blackstone',
            fire: 'minecraft:soul_fire'
        },
        vanguard: [
            { id: 'minecraft:wither_skeleton', name: 'Испепеленный Легионер', hp: 65, main: 'minecraft:diamond_sword', off: 'minecraft:shield', chest: 'minecraft:diamond_chestplate', helm: 'minecraft:diamond_helmet' },
            { id: 'cataclysm:ignited_revenant', name: 'Огненный Мститель Бастиона', hp: 70 },
            { id: 'minecraft:piglin_brute', name: 'Адский Громила', hp: 75, main: 'minecraft:diamond_axe', chest: 'minecraft:golden_chestplate', helm: 'minecraft:golden_helmet' }
        ],
        ranged: [
            { id: 'minecraft:blaze', name: 'Инфернальный Ифрит', hp: 45 },
            { id: 'irons_spellbooks:pyromancer', name: 'Пиромант Разлома', hp: 55 }
        ],
        miniboss: [
            { id: 'cataclysm:netherite_monstrosity', name: 'Незеритовый Страж Врат [Мини-Босс]', hp: 260 },
            { id: 'cataclysm:ignited_revenant', name: 'Владыка Пламени [Мини-Босс]', hp: 240 }
        ],
        boss: [
            { id: 'cataclysm:netherite_monstrosity', name: 'Незеритовый Колосс Бастиона [Босс]', hp: 550 },
            { id: 'cataclysm:ignis', name: 'Игнис: Владыка Преисподней [Босс]', hp: 600 }
        ]
    },
    3: { // Sector 3: The Aether (Celestial Sanctuary)
        palette: {
            floor: 'minecraft:quartz_bricks',
            floor_cracked: 'minecraft:chiseled_quartz_block',
            floor_mossy: 'minecraft:quartz_pillar',
            wall: 'minecraft:quartz_bricks',
            wall_detail: 'minecraft:chiseled_quartz_block',
            pillar: 'minecraft:quartz_pillar',
            light: 'minecraft:sea_lantern',
            golden_light: 'minecraft:glowstone',
            gate: 'minecraft:iron_bars',
            ceiling: 'minecraft:smooth_quartz',
            accent: 'minecraft:diamond_block',
            abyss_floor: 'minecraft:quartz_block',
            abyss_wall: 'minecraft:quartz_pillar',
            liquid: 'minecraft:water',
            sarcophagus: 'minecraft:chiseled_quartz_block',
            fire: 'minecraft:soul_fire'
        },
        vanguard: [
            { id: 'aether:valkyrie', name: 'Страж Небесных Палат', hp: 75, main: 'minecraft:diamond_sword', chest: 'minecraft:diamond_chestplate', helm: 'minecraft:diamond_helmet' },
            { id: 'minecraft:stray', name: 'Небесный Паладин', hp: 65, main: 'minecraft:golden_sword', off: 'minecraft:shield', chest: 'minecraft:golden_chestplate', helm: 'minecraft:golden_helmet' },
            { id: 'minecraft:iron_golem', name: 'Освященный Защитник', hp: 80 }
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
            golden_light: 'minecraft:crying_obsidian',
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
            golden_light: 'minecraft:ochre_froglight',
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
            golden_light: 'minecraft:sculk_sensor',
            gate: 'minecraft:iron_bars',
            ceiling: 'minecraft:cobbled_deepslate',
            accent: 'minecraft:sculk_shrieker',
            abyss_floor: 'minecraft:deepslate_bricks',
            abyss_wall: 'minecraft:reinforced_deepslate',
            liquid: 'minecraft:water',
            sarcophagus: 'minecraft:reinforced_deepslate',
            fire: 'minecraft:soul_fire'
        },
        vanguard: [
            { id: 'deeperdarker:sculk_centipede', name: 'Скалковая Многоножка', hp: 95 },
            { id: 'deeperdarker:shattered', name: 'Расколотый Страж', hp: 100 },
            { id: 'cataclysm:wadjet', name: 'Скалковый Страж Глубин', hp: 110 }
        ],
        ranged: [
            { id: 'deeperdarker:stalker', name: 'Скалковый Охотник', hp: 70 },
            { id: 'minecraft:skeleton', name: 'Чумной Стрелок Недр', hp: 65, bow: 'minecraft:bow', helm: 'minecraft:netherite_helmet' }
        ],
        miniboss: [
            { id: 'cataclysm:wadjet', name: 'Командор Скалковых Недр [Мини-Босс]', hp: 420 },
            { id: 'deeperdarker:shattered', name: 'Древний Скалковый Исполин [Мини-Босс]', hp: 400 }
        ],
        boss: [
            { id: 'cataclysm:the_harbinger', name: 'Предвестник Скалкового Разлома [Босс]', hp: 950 },
            { id: 'minecraft:warden', name: 'Хранитель Глубинной Тьмы [Босс]', hp: 1000 }
        ]
    },
    7: { // Sector 7: DivineRPG Eden (Golden Palace)
        palette: {
            floor: 'divinerpg:eden_stone',
            floor_cracked: 'divinerpg:eden_grass',
            floor_mossy: 'minecraft:yellow_terracotta',
            wall: 'divinerpg:eden_stone',
            wall_detail: 'divinerpg:eden_block',
            pillar: 'divinerpg:eden_block',
            light: 'minecraft:shroomlight',
            golden_light: 'minecraft:glowstone',
            gate: 'minecraft:iron_bars',
            ceiling: 'divinerpg:eden_stone',
            accent: 'divinerpg:eden_block',
            abyss_floor: 'divinerpg:eden_stone',
            abyss_wall: 'divinerpg:eden_block',
            liquid: 'minecraft:water',
            sarcophagus: 'divinerpg:eden_block',
            fire: 'minecraft:fire'
        },
        vanguard: [
            { id: 'divinerpg:eden_cadillion', name: 'Кадиллион Эдема', hp: 115 },
            { id: 'divinerpg:eden_tomo', name: 'Томо Золотых Земель', hp: 110 },
            { id: 'divinerpg:arid_warrior', name: 'Воин Солнечного Древа', hp: 120 }
        ],
        ranged: [
            { id: 'divinerpg:veren', name: 'Стрелок Золотого Рая', hp: 80 },
            { id: 'minecraft:skeleton', name: 'Лучник Небесного Сияния', hp: 75, bow: 'minecraft:bow', helm: 'minecraft:golden_helmet' }
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
            golden_light: 'minecraft:respawn_anchor',
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

    // 1. Sealed Subterranean Sarcophagus Hull (Spans X: -110 to +110, Y: 24 to 78, Z: -20 to 460)
    buildSarcophagus: function(server, originX, pal) {
        let floorBlock = pal.sarcophagus || pal.wall;
        let wallBlock = pal.wall;
        let ceilBlock = pal.ceiling || pal.wall;

        safeFill(server, originX - 110, 24, -20, originX + 110, 27, 460, floorBlock);
        safeFill(server, originX - 110, 24, -20, originX - 109, 78, 460, wallBlock);
        safeFill(server, originX + 109, 24, -20, originX + 110, 78, 460, wallBlock);
        safeFill(server, originX - 110, 24, -20, originX + 110, 78, -19, wallBlock);
        safeFill(server, originX - 110, 24, 459, originX + 110, 78, 460, wallBlock);
        safeFill(server, originX - 110, 76, -20, originX + 110, 78, 460, ceilBlock);
    },

    // 2. ROOM BUILDERS
    buildEntranceHall: function(server, cx, cy, cz, pal, sector, instanceId, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let r = 6;
        let h = 6;

        safeFill(server, cx - r, cy - 3, cz - r, cx + r, cy - 1, cz + r, pal.wall);
        safeFill(server, cx - r, cy, cz - r, cx + r, cy, cz + r, pal.floor);
        safeFill(server, cx - r, cy + 1, cz - r, cx + r, cy + h, cz - r, pal.wall);
        safeFill(server, cx - r, cy + 1, cz + r, cx + r, cy + h, cz + r, pal.wall);
        safeFill(server, cx - r, cy + 1, cz - r, cx - r, cy + h, cz + r, pal.wall);
        safeFill(server, cx + r, cy + 1, cz - r, cx + r, cy + h, cz + r, pal.wall);
        safeFill(server, cx - r, cy + h + 1, cz - r, cx + r, cy + h + 1, cz + r, pal.ceiling);
        safeFill(server, cx - (r - 1), cy + 1, cz - (r - 1), cx + (r - 1), cy + h, cz + (r - 1), 'minecraft:air');

        // Central Preparation Dais & Lighting
        cmd(`fill ${cx - 1} ${cy} ${cz - 1} ${cx + 1} ${cy} ${cz + 1} ${pal.wall_detail}`);
        cmd(`setblock ${cx} ${cy} ${cz} ${pal.accent}`);
        cmd(`setblock ${cx - 4} ${cy + 3} ${cz - 4} ${pal.light}`);
        cmd(`setblock ${cx + 4} ${cy + 3} ${cz - 4} ${pal.light}`);
        cmd(`setblock ${cx - 4} ${cy + 3} ${cz + 4} ${pal.light}`);
        cmd(`setblock ${cx + 4} ${cy + 3} ${cz + 4} ${pal.light}`);
    },

    buildCrossroadsHall: function(server, cx, cy, cz, pal, isLower, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let r = 6;
        let h = 6;
        let floorB = isLower ? pal.abyss_floor : pal.floor;
        let wallB = isLower ? pal.abyss_wall : pal.wall;
        let ceilB = isLower ? pal.abyss_floor : pal.ceiling;

        safeFill(server, cx - r, cy - 3, cz - r, cx + r, cy - 1, cz + r, wallB);
        safeFill(server, cx - r, cy, cz - r, cx + r, cy, cz + r, floorB);
        safeFill(server, cx - r, cy + 1, cz - r, cx + r, cy + h, cz - r, wallB);
        safeFill(server, cx - r, cy + 1, cz + r, cx + r, cy + h, cz + r, wallB);
        safeFill(server, cx - r, cy + 1, cz - r, cx - r, cy + h, cz + r, wallB);
        safeFill(server, cx + r, cy + 1, cz - r, cx + r, cy + h, cz + r, wallB);
        safeFill(server, cx - r, cy + h + 1, cz - r, cx + r, cy + h + 1, cz + r, ceilB);
        safeFill(server, cx - (r - 1), cy + 1, cz - (r - 1), cx + (r - 1), cy + h, cz + (r - 1), 'minecraft:air');

        // Center rosette
        cmd(`fill ${cx - 1} ${cy} ${cz - 1} ${cx + 1} ${cy} ${cz + 1} ${pal.wall_detail}`);
        cmd(`setblock ${cx} ${cy} ${cz} ${pal.accent}`);

        let pillars = [[-4, -4], [4, -4], [-4, 4], [4, 4]];
        pillars.forEach(p => {
            cmd(`fill ${cx + p[0]} ${cy + 1} ${cz + p[1]} ${cx + p[0]} ${cy + 4} ${cz + p[1]} ${pal.pillar}`);
            cmd(`setblock ${cx + p[0]} ${cy + 5} ${cz + p[1]} ${pal.light}`);
        });
    },

    buildPillaredHall: function(server, cx, cy, cz, radX, radZ, height, pal, isLower, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let floorB = isLower ? pal.abyss_floor : pal.floor;
        let wallB = isLower ? pal.abyss_wall : pal.wall;
        let ceilB = isLower ? pal.abyss_floor : pal.ceiling;

        safeFill(server, cx - radX, cy - 3, cz - radZ, cx + radX, cy - 1, cz + radZ, wallB);
        safeFill(server, cx - radX, cy, cz - radZ, cx + radX, cy, cz + radZ, floorB);

        safeFill(server, cx - radX, cy + 1, cz - radZ, cx + radX, cy + height, cz - radZ, wallB);
        safeFill(server, cx - radX, cy + 1, cz + radZ, cx + radX, cy + height, cz + radZ, wallB);
        safeFill(server, cx - radX, cy + 1, cz - radZ, cx - radX, cy + height, cz + radZ, wallB);
        safeFill(server, cx + radX, cy + 1, cz - radZ, cx + radX, cy + height, cz + radZ, wallB);
        safeFill(server, cx - radX, cy + height + 1, cz - radZ, cx + radX, cy + height + 1, cz + radZ, ceilB);
        safeFill(server, cx - (radX - 1), cy + 1, cz - (radZ - 1), cx + (radX - 1), cy + height, cz + (radZ - 1), 'minecraft:air');

        let px = Math.max(3, Math.floor(radX * 0.55));
        let pz = Math.max(3, Math.floor(radZ * 0.55));
        let pillars = [[-px, -pz], [px, -pz], [-px, pz], [px, pz]];
        pillars.forEach(p => {
            let colX = cx + p[0];
            let colZ = cz + p[1];
            safeFill(server, colX, cy + 1, colZ, colX + 1, cy + height - 1, colZ + 1, pal.pillar);
            cmd(`setblock ${colX} ${cy + 3} ${colZ - 1} ${pal.light}`);
            cmd(`setblock ${colX + 1} ${cy + 3} ${colZ + 2} ${pal.light}`);
        });
    },

    buildSarcophagusCrypt: function(server, cx, cy, cz, pal, isLower, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let r = 5;
        let h = 5;
        let floorB = isLower ? pal.abyss_floor : pal.floor;
        let wallB = isLower ? pal.abyss_wall : pal.wall;
        let ceilB = isLower ? pal.abyss_floor : pal.ceiling;

        safeFill(server, cx - r, cy - 3, cz - r, cx + r, cy - 1, cz + r, wallB);
        safeFill(server, cx - r, cy, cz - r, cx + r, cy, cz + r, floorB);
        safeFill(server, cx - r, cy + 1, cz - r, cx + r, cy + h, cz - r, wallB);
        safeFill(server, cx - r, cy + 1, cz + r, cx + r, cy + h, cz + r, wallB);
        safeFill(server, cx - r, cy + 1, cz - r, cx - r, cy + h, cz + r, wallB);
        safeFill(server, cx + r, cy + 1, cz - r, cx + r, cy + h, cz + r, wallB);
        safeFill(server, cx - r, cy + h + 1, cz - r, cx + r, cy + h + 1, cz + r, ceilB);
        safeFill(server, cx - (r - 1), cy + 1, cz - (r - 1), cx + (r - 1), cy + h, cz + (r - 1), 'minecraft:air');

        // Sarcophagi
        cmd(`fill ${cx - 3} ${cy + 1} ${cz - 1} ${cx - 3} ${cy + 1} ${cz + 1} ${pal.pillar}`);
        cmd(`fill ${cx + 3} ${cy + 1} ${cz - 1} ${cx + 3} ${cy + 1} ${cz + 1} ${pal.pillar}`);
        cmd(`setblock ${cx - 3} ${cy + 2} ${cz} minecraft:skeleton_skull`);
        cmd(`setblock ${cx + 3} ${cy + 2} ${cz} minecraft:skeleton_skull`);

        cmd(`setblock ${cx - 3} ${cy + 3} ${cz} ${pal.light}`);
        cmd(`setblock ${cx + 3} ${cy + 3} ${cz} ${pal.light}`);
    },

    buildChasmBridgeRoom: function(server, cx, cy, cz, pal, sector, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let r = 6;
        let h = 7;

        safeFill(server, cx - r, cy - 6, cz - r, cx + r, cy - 5, cz + r, pal.abyss_floor || pal.wall);
        safeFill(server, cx - r, cy - 4, cz - r, cx + r, cy - 4, cz + r, pal.liquid);
        safeFill(server, cx - r, cy - 3, cz - r, cx + r, cy - 1, cz + r, 'minecraft:air');

        safeFill(server, cx - r, cy, cz - r, cx + r, cy + h, cz - r, pal.wall);
        safeFill(server, cx - r, cy, cz + r, cx + r, cy + h, cz + r, pal.wall);
        safeFill(server, cx - r, cy, cz - r, cx - r, cy + h, cz + r, pal.wall);
        safeFill(server, cx + r, cy, cz - r, cx + r, cy + h, cz + r, pal.wall);
        safeFill(server, cx - r, cy + h + 1, cz - r, cx + r, cy + h + 1, cz + r, pal.ceiling);
        safeFill(server, cx - (r - 1), cy + 1, cz - (r - 1), cx + (r - 1), cy + h, cz + (r - 1), 'minecraft:air');

        // Central suspended walkway (Width 5) in Z and X
        safeFill(server, cx - 2, cy, cz - r, cx + 2, cy, cz + r, pal.floor);
        safeFill(server, cx - r, cy, cz - 2, cx + r, cy, cz + 2, pal.floor);

        // Archery perches
        cmd(`setblock ${cx - 4} ${cy + 2} ${cz - 4} ${pal.pillar}`);
        cmd(`setblock ${cx + 4} ${cy + 2} ${cz + 4} ${pal.pillar}`);

        this.spawnArcherSnipers(server, cx - 4, cy + 3, cz - 4, sector, 0, rng);
        this.spawnArcherSnipers(server, cx + 4, cy + 3, cz + 4, sector, 0, rng);
    },

    // 60% PUNISHING AMBUSH DEAD-END (ZERO CHEST, DEBRIS, MONSTER SWARM)
    buildAmbushDeadEnd: function(server, cx, cy, cz, pal, sector, instanceId, isLower, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let r = 5;
        let h = 5;
        let floorB = isLower ? pal.abyss_floor : pal.floor;
        let wallB = isLower ? pal.abyss_wall : pal.wall;
        let ceilB = isLower ? pal.abyss_floor : pal.ceiling;

        safeFill(server, cx - r, cy - 3, cz - r, cx + r, cy - 1, cz + r, wallB);
        safeFill(server, cx - r, cy, cz - r, cx + r, cy, cz + r, floorB);
        safeFill(server, cx - r, cy + 1, cz - r, cx + r, cy + h, cz - r, wallB);
        safeFill(server, cx - r, cy + 1, cz + r, cx + r, cy + h, cz + r, wallB);
        safeFill(server, cx - r, cy + 1, cz - r, cx - r, cy + h, cz + r, wallB);
        safeFill(server, cx + r, cy + 1, cz - r, cx + r, cy + h, cz + r, wallB);
        safeFill(server, cx - r, cy + h + 1, cz - r, cx + r, cy + h + 1, cz + r, ceilB);
        safeFill(server, cx - (r - 1), cy + 1, cz - (r - 1), cx + (r - 1), cy + h, cz + (r - 1), 'minecraft:air');

        // Ruined altar, skulls, cobwebs, broken pots - ABSOLUTELY ZERO CHEST!
        cmd(`fill ${cx - 1} ${cy} ${cz - 1} ${cx + 1} ${cy} ${cz + 1} ${pal.floor_cracked}`);
        cmd(`setblock ${cx} ${cy + 1} ${cz} minecraft:skeleton_skull`);
        cmd(`setblock ${cx - 2} ${cy + 1} ${cz - 2} minecraft:cobweb`);
        cmd(`setblock ${cx + 2} ${cy + 1} ${cz + 2} minecraft:cobweb`);
        cmd(`setblock ${cx - 2} ${cy + 1} ${cz + 2} minecraft:decorated_pot`);
        cmd(`setblock ${cx + 2} ${cy + 1} ${cz - 2} minecraft:decorated_pot`);
        cmd(`setblock ${cx} ${cy + 3} ${cz} ${pal.light}`);

        // Ambush spawn: 50% spider pack, 50% vanguard pack
        if (rng.next() < 0.5) {
            this.spawnSpiderPack(server, cx, cy + 1, cz, sector, instanceId, rng);
        } else {
            this.spawnVanguardPack(server, cx, cy + 1, cz, sector, instanceId, 'ambush_guard', rng);
        }
    },

    // 40% REWARD TREASURY VAULT (CHEST + ELITE GUARDS)
    buildTreasuryVault: function(server, cx, cy, cz, pal, sector, instanceId, isLower, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let r = 5;
        let h = 5;
        let floorB = isLower ? pal.abyss_floor : pal.floor;
        let wallB = isLower ? pal.abyss_wall : pal.wall;
        let ceilB = isLower ? pal.abyss_floor : pal.ceiling;

        safeFill(server, cx - r, cy - 3, cz - r, cx + r, cy - 1, cz + r, wallB);
        safeFill(server, cx - r, cy, cz - r, cx + r, cy, cz + r, floorB);
        safeFill(server, cx - r, cy + 1, cz - r, cx + r, cy + h, cz - r, wallB);
        safeFill(server, cx - r, cy + 1, cz + r, cx + r, cy + h, cz + r, wallB);
        safeFill(server, cx - r, cy + 1, cz - r, cx - r, cy + h, cz + r, wallB);
        safeFill(server, cx + r, cy + 1, cz - r, cx + r, cy + h, cz + r, wallB);
        safeFill(server, cx - r, cy + h + 1, cz - r, cx + r, cy + h + 1, cz + r, ceilB);
        safeFill(server, cx - (r - 1), cy + 1, cz - (r - 1), cx + (r - 1), cy + h, cz + (r - 1), 'minecraft:air');

        // Central treasure dais with real chest
        cmd(`fill ${cx - 1} ${cy} ${cz - 1} ${cx + 1} ${cy} ${cz + 1} ${pal.wall_detail}`);
        cmd(`setblock ${cx} ${cy} ${cz} ${pal.accent}`);

        cmd(`setblock ${cx} ${cy + 1} ${cz} minecraft:chest[facing=south]{CustomName:'{"text":"Сокровищница Подземелья","color":"gold"}'}`);
        this.populateTreasuryChest(server, cx, cy + 1, cz, sector, instanceId, rng);

        cmd(`setblock ${cx - 3} ${cy + 3} ${cz - 3} ${pal.light}`);
        cmd(`setblock ${cx + 3} ${cy + 3} ${cz + 3} ${pal.light}`);
        this.spawnVanguardPack(server, cx, cy + 1, cz + 2, sector, instanceId, 'treasury_guards', rng);
    },

    // MINI-BOSS ARENA (17x17, Height 8, Locked Portcullis Exit)
    buildMiniBossChamber: function(server, cx, cy, cz, pal, sector, instanceId, gateX, gateY, gateZ, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let r = 8;
        let h = 8;

        safeFill(server, cx - r, cy - 3, cz - r, cx + r, cy - 1, cz + r, pal.wall);
        safeFill(server, cx - r, cy, cz - r, cx + r, cy, cz + r, pal.floor);
        safeFill(server, cx - r, cy + 1, cz - r, cx + r, cy + h, cz - r, pal.wall);
        safeFill(server, cx - r, cy + 1, cz + r, cx + r, cy + h, cz + r, pal.wall);
        safeFill(server, cx - r, cy + 1, cz - r, cx - r, cy + h, cz + r, pal.wall);
        safeFill(server, cx + r, cy + 1, cz - r, cx + r, cy + h, cz + r, pal.wall);
        safeFill(server, cx - r, cy + h + 1, cz - r, cx + r, cy + h + 1, cz + r, pal.ceiling);
        safeFill(server, cx - (r - 1), cy + 1, cz - (r - 1), cx + (r - 1), cy + h, cz + (r - 1), 'minecraft:air');

        // Combat arena circle
        cmd(`fill ${cx - 4} ${cy} ${cz - 4} ${cx + 4} ${cy} ${cz + 4} ${pal.wall_detail}`);
        cmd(`setblock ${cx} ${cy} ${cz} ${pal.accent}`);

        // 4 Braziers
        let braziers = [[cx - 5, cz], [cx + 5, cz], [cx, cz - 5], [cx, cz + 5]];
        braziers.forEach(b => {
            cmd(`setblock ${b[0]} ${cy + 1} ${b[1]} minecraft:netherrack`);
            cmd(`setblock ${b[0]} ${cy + 2} ${b[1]} ${pal.fire || 'minecraft:fire'}`);
            cmd(`setblock ${b[0]} ${cy + 1} ${b[1] - 1} ${pal.gate}`);
            cmd(`setblock ${b[0]} ${cy + 1} ${b[1] + 1} ${pal.gate}`);
        });

        // 4 Columns
        let pillars = [[-6, -6], [6, -6], [-6, 6], [6, 6]];
        pillars.forEach(p => {
            cmd(`fill ${cx + p[0]} ${cy + 1} ${cz + p[1]} ${cx + p[0]} ${cy + 5} ${cz + p[1]} ${pal.pillar}`);
            cmd(`setblock ${cx + p[0]} ${cy + 6} ${cz + p[1]} ${pal.light}`);
        });

        // Portcullis Exit Gate (Locked Iron Bars)
        safeFill(server, gateX - 2, gateY + 1, gateZ, gateX + 2, gateY + 4, gateZ, pal.gate);

        let pData = server.persistentData;
        let instTag = `inst_${instanceId}`;
        let instInfo = pData.getCompound(instTag);
        instInfo.putDouble('gate_x', gateX);
        instInfo.putDouble('gate_y', gateY);
        instInfo.putDouble('gate_z', gateZ);
        pData.put(instTag, instInfo);

        this.spawnMiniBoss(server, cx, cy + 1, cz, sector, instanceId, rng);
    },

    // DESCENDING STAIRCASE BETWEEN FLOORS (16-block drop)
    buildDescendingStaircase: function(server, x1, z1, x2, z2, startY, endY, pal, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let minX = Math.min(x1, x2);
        let maxX = Math.max(x1, x2);
        let minZ = Math.min(z1, z2);
        let maxZ = Math.max(z1, z2);
        let isZAxis = (maxZ - minZ) >= (maxX - minX);

        if (isZAxis) {
            let totalSteps = maxZ - minZ + 1;
            let yDrop = startY - endY;
            for (let cz = minZ; cz <= maxZ; cz++) {
                let progress = (cz - minZ) / totalSteps;
                let currentY = Math.round(startY - (progress * yDrop));
                let sx = minX;

                cmd(`fill ${sx - 3} ${currentY - 3} ${cz} ${sx + 3} ${currentY} ${cz} ${pal.abyss_floor}`);
                cmd(`fill ${sx - 2} ${currentY + 1} ${cz} ${sx + 2} ${currentY + 5} ${cz} minecraft:air`);
                cmd(`fill ${sx - 3} ${currentY + 1} ${cz} ${sx - 3} ${currentY + 5} ${cz} ${pal.abyss_wall}`);
                cmd(`fill ${sx + 3} ${currentY + 1} ${cz} ${sx + 3} ${currentY + 5} ${cz} ${pal.abyss_wall}`);
                cmd(`fill ${sx - 3} ${currentY + 6} ${cz} ${sx + 3} ${currentY + 6} ${cz} ${pal.abyss_wall}`);

                if (cz % 3 === 0) {
                    cmd(`setblock ${sx - 2} ${currentY + 3} ${cz} ${pal.light}`);
                    cmd(`setblock ${sx + 2} ${currentY + 3} ${cz} ${pal.light}`);
                }
            }
        } else {
            let totalSteps = maxX - minX + 1;
            let yDrop = startY - endY;
            for (let cx = minX; cx <= maxX; cx++) {
                let progress = (cx - minX) / totalSteps;
                let currentY = Math.round(startY - (progress * yDrop));
                let sz = minZ;

                cmd(`fill ${cx} ${currentY - 3} ${sz - 3} ${cx} ${currentY} ${sz + 3} ${pal.abyss_floor}`);
                cmd(`fill ${cx} ${currentY + 1} ${sz - 2} ${cx} ${currentY + 5} ${sz + 2} minecraft:air`);
                cmd(`fill ${cx} ${currentY + 1} ${sz - 3} ${cx} ${currentY + 5} ${sz - 3} ${pal.abyss_wall}`);
                cmd(`fill ${cx} ${currentY + 1} ${sz + 3} ${cx} ${currentY + 5} ${sz + 3} ${pal.abyss_wall}`);
                cmd(`fill ${cx} ${currentY + 6} ${sz - 3} ${cx} ${currentY + 6} ${sz + 3} ${pal.abyss_wall}`);

                if (cx % 3 === 0) {
                    cmd(`setblock ${cx} ${currentY + 3} ${sz - 2} ${pal.light}`);
                    cmd(`setblock ${cx} ${currentY + 3} ${sz + 2} ${pal.light}`);
                }
            }
        }
    },

    // GRAND BOSS SANCTUM (25x25, Height 11, Imperial Dais, Final Boss, Victory Chest & Portal)
    buildGrandBossSanctum: function(server, cx, cy, cz, pal, sector, instanceId, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let r = 12; // 25x25
        let h = 11;

        safeFill(server, cx - r, cy - 4, cz - r, cx + r, cy - 1, cz + r, pal.abyss_wall);
        safeFill(server, cx - r, cy, cz - r, cx + r, cy, cz + r, pal.abyss_floor);
        safeFill(server, cx - r, cy + 1, cz - r, cx + r, cy + h, cz - r, pal.abyss_wall);
        safeFill(server, cx - r, cy + 1, cz + r, cx + r, cy + h, cz + r, pal.abyss_wall);
        safeFill(server, cx - r, cy + 1, cz - r, cx - r, cy + h, cz + r, pal.abyss_wall);
        safeFill(server, cx + r, cy + 1, cz - r, cx + r, cy + h, cz + r, pal.abyss_wall);
        safeFill(server, cx - r, cy + h + 1, cz - r, cx + r, cy + h + 1, cz + r, pal.abyss_wall);
        safeFill(server, cx - (r - 1), cy + 1, cz - (r - 1), cx + (r - 1), cy + h, cz + (r - 1), 'minecraft:air');

        // Raised Dais
        cmd(`fill ${cx - 5} ${cy} ${cz + 4} ${cx + 5} ${cy + 1} ${cz + 9} ${pal.wall_detail}`);
        cmd(`fill ${cx - 3} ${cy + 2} ${cz + 6} ${cx + 3} ${cy + 2} ${cz + 9} ${pal.accent}`);

        // Throne
        cmd(`fill ${cx - 1} ${cy + 3} ${cz + 8} ${cx + 1} ${cy + 5} ${cz + 8} ${pal.pillar}`);
        cmd(`setblock ${cx} ${cy + 3} ${cz + 8} minecraft:gilded_blackstone`);

        // Eternal Braziers
        let braziers = [[cx - 8, cz - 4], [cx + 8, cz - 4], [cx - 8, cz + 6], [cx + 8, cz + 6]];
        braziers.forEach(b => {
            cmd(`setblock ${b[0]} ${cy + 1} ${b[1]} minecraft:netherrack`);
            cmd(`setblock ${b[0]} ${cy + 2} ${b[1]} ${pal.fire || 'minecraft:soul_fire'}`);
        });

        // 4 Colossal Columns
        let cols = [[-7, -7], [7, -7], [-7, 7], [7, 7]];
        cols.forEach(col => {
            cmd(`fill ${cx + col[0]} ${cy + 1} ${cz + col[1]} ${cx + col[0] + 1} ${cy + h - 1} ${cz + col[1] + 1} ${pal.pillar}`);
            cmd(`setblock ${cx + col[0]} ${cy + 6} ${cz + col[1]} ${pal.light}`);
        });

        let pData = server.persistentData;
        let instTag = `inst_${instanceId}`;
        let instInfo = pData.getCompound(instTag);
        instInfo.putDouble('boss_throne_x', cx);
        instInfo.putDouble('boss_throne_y', cy + 3);
        instInfo.putDouble('boss_throne_z', cz + 6);
        instInfo.putInt('sector', Math.floor(sector));
        pData.put(instTag, instInfo);

        this.spawnFinalBoss(server, cx, cy + 3, cz + 6, sector, instanceId, rng);
    },

    // UNIFORM CONNECTING CORRIDORS
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

        for (let cz = startZ + 2; cz <= endZ - 2; cz += 4) {
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

        for (let cx = startX + 2; cx <= endX - 2; cx += 4) {
            cmd(`setblock ${cx} ${y + 3} ${z - halfW} ${pal.light}`);
            cmd(`setblock ${cx} ${y + 3} ${z + halfW} ${pal.light}`);
        }
    },

    // 3. LOOT POPULATORS & MOB SPAWNERS
    populateTreasuryChest: function(server, x, y, z, sector, instanceId, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let goldCount = rng.nextInt(4, 12);
        let ironCount = rng.nextInt(6, 16);
        let diamondCount = sector >= 2 ? rng.nextInt(1, 4) : 0;

        cmd(`item replace block ${x} ${y} ${z} container.0 with minecraft:gold_ingot ${goldCount}`);
        cmd(`item replace block ${x} ${y} ${z} container.1 with minecraft:iron_ingot ${ironCount}`);
        if (diamondCount > 0) {
            cmd(`item replace block ${x} ${y} ${z} container.2 with minecraft:diamond ${diamondCount}`);
        }
        cmd(`item replace block ${x} ${y} ${z} container.4 with minecraft:golden_apple ${rng.nextInt(1, 2)}`);
        cmd(`item replace block ${x} ${y} ${z} container.8 with minecraft:potion{Potion:"minecraft:strong_healing"}`);
    },

    populateVictoryChest: function(server, x, y, z, sector, instanceId, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let diaCount = rng.nextInt(8, 16);
        let netheriteScrap = sector >= 3 ? rng.nextInt(1, 3) : 0;

        cmd(`item replace block ${x} ${y} ${z} container.0 with minecraft:diamond ${diaCount}`);
        if (netheriteScrap > 0) {
            cmd(`item replace block ${x} ${y} ${z} container.1 with minecraft:netherite_scrap ${netheriteScrap}`);
        }
        cmd(`item replace block ${x} ${y} ${z} container.4 with minecraft:enchanted_golden_apple 1`);
        cmd(`item replace block ${x} ${y} ${z} container.8 with minecraft:experience_bottle 16`);
        cmd(`item replace block ${x} ${y} ${z} container.13 with minecraft:emerald_block 3`);
    },

    spawnVanguardPack: function(server, x, y, z, sector, instanceId, packName, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let tData = this.getTierData(sector);
        let pool = tData.vanguard;
        let count = rng.nextInt(2, 3);

        for (let i = 0; i < count; i++) {
            let m = rng.choice(pool);
            let ox = (rng.next() - 0.5) * 3;
            let oz = (rng.next() - 0.5) * 3;
            let mainItem = m.main ? `{id:"${m.main}",Count:1b}` : '{}';
            let offItem = m.off ? `{id:"${m.off}",Count:1b}` : '{}';
            let chestItem = m.chest ? `{id:"${m.chest}",Count:1b}` : '{}';
            let helmItem = m.helm ? `{id:"${m.helm}",Count:1b}` : '{}';

            cmd(`summon ${m.id} ${x + ox} ${y} ${z + oz} {CustomName:'{"text":"${m.name}","color":"red"}',CustomNameVisible:1b,Attributes:[{Name:"generic.max_health",Base:${m.hp}f},{Name:"generic.follow_range",Base:32.0f}],Health:${m.hp}f,HandItems:[${mainItem},${offItem}],ArmorItems:[{},{},${chestItem},${helmItem}],HandDropChances:[0.05f,0.05f],Tags:["elyrium_dungeon_mob","${packName}","inst_${instanceId}"]}`);
        }
    },

    spawnArcherSnipers: function(server, x, y, z, sector, instanceId, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let tData = this.getTierData(sector);
        let m = rng.choice(tData.ranged);
        let helmItem = m.helm ? `{id:"${m.helm}",Count:1b}` : '{}';

        cmd(`summon ${m.id} ${x} ${y} ${z} {CustomName:'{"text":"${m.name}","color":"yellow"}',CustomNameVisible:1b,Attributes:[{Name:"generic.max_health",Base:${m.hp}f},{Name:"generic.follow_range",Base:40.0f}],Health:${m.hp}f,HandItems:[{id:"${m.bow}",Count:1b},{}],ArmorItems:[{},{},{},${helmItem}],Tags:["elyrium_dungeon_mob","elyrium_sniper","inst_${instanceId}"]}`);
    },

    spawnSpiderPack: function(server, x, y, z, sector, instanceId, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let count = rng.nextInt(3, 4);
        for (let i = 0; i < count; i++) {
            let ox = (rng.next() - 0.5) * 3;
            let oz = (rng.next() - 0.5) * 3;
            cmd(`summon minecraft:cave_spider ${x + ox} ${y} ${z + oz} {CustomName:'{"text":"Ядовитый Ткач Склепа","color":"dark_red"}',CustomNameVisible:1b,Attributes:[{Name:"generic.max_health",Base:28.0f},{Name:"generic.follow_range",Base:32.0f}],Health:28.0f,Tags:["elyrium_dungeon_mob","elyrium_spider","inst_${instanceId}"]}`);
        }
    },

    spawnMiniBoss: function(server, x, y, z, sector, instanceId, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let tData = this.getTierData(sector);
        let mb = rng.choice(tData.miniboss);
        let mainItem = mb.main ? `{id:"${mb.main}",Count:1b}` : '{}';
        let chestItem = mb.chest ? `{id:"${mb.chest}",Count:1b}` : '{}';
        let helmItem = mb.helm ? `{id:"${mb.helm}",Count:1b}` : '{}';

        cmd(`summon ${mb.id} ${x} ${y} ${z} {CustomName:'{"text":"${mb.name}","color":"gold","bold":true}',CustomNameVisible:1b,Attributes:[{Name:"generic.max_health",Base:${mb.hp}f},{Name:"generic.attack_damage",Base:12.0f},{Name:"generic.follow_range",Base:48.0f},{Name:"generic.knockback_resistance",Base:0.6f}],Health:${mb.hp}f,HandItems:[${mainItem},{}],ArmorItems:[{},{},${chestItem},${helmItem}],Tags:["elyrium_dungeon_mob","dungeon_miniboss","inst_${instanceId}"]}`);
    },

    spawnFinalBoss: function(server, x, y, z, sector, instanceId, rng) {
        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        let tData = this.getTierData(sector);
        let b = rng.choice(tData.boss);

        cmd(`summon ${b.id} ${x} ${y} ${z} {CustomName:'{"text":"👑 ${b.name}","color":"dark_red","bold":true}',CustomNameVisible:1b,Attributes:[{Name:"generic.max_health",Base:${b.hp}f},{Name:"generic.attack_damage",Base:18.0f},{Name:"generic.knockback_resistance",Base:0.8f},{Name:"generic.follow_range",Base:64.0f}],Health:${b.hp}f,Tags:["elyrium_dungeon_mob","dungeon_boss","inst_${instanceId}"]}`);
    },

    unlockPortcullis: function(server, instanceId) {
        let pData = server.persistentData;
        let instTag = `inst_${instanceId}`;
        let instInfo = pData.getCompound(instTag);
        let gx = instInfo.getDouble('gate_x');
        let gy = instInfo.getDouble('gate_y');
        let gz = instInfo.getDouble('gate_z');

        if (gx !== 0 || gz !== 0) {
            safeFill(server, gx - 2, gy + 1, gz, gx + 2, gy + 4, gz, 'minecraft:air');
            server.runCommandSilent(`execute in elyrium:dungeons run playsound minecraft:block.iron_door.open block @a ${gx} ${gy} ${gz} 2.0 0.8`);
            server.runCommandSilent(`execute in elyrium:dungeons run playsound minecraft:entity.iron_golem.death block @a ${gx} ${gy} ${gz} 1.5 0.5`);

            let level = server.getLevel('elyrium:dungeons');
            if (level) {
                level.players.forEach(p => {
                    if (p.persistentData.getInt('elyrium_active_instance') === instanceId) {
                        p.displayClientMessage(Component.literal('§a⚔ [ПРОХОД ОТКРЫТ] §fРешетка Герсы опустилась! Путь в Глубины свободен!'), false);
                    }
                });
            }
        }
    },

    // 4. GRAPH-BASED RANDOM WALK FLOOR GENERATOR
    generateFloorGraph: function(floorY, startGx, startGz, targetLen, numBranches, rng, occupied) {
        let grid = {};
        let dirs = [[0, 1], [-1, 0], [1, 0], [0, -1]];
        let startKey = `${startGx}_${startGz}`;
        
        grid[startKey] = {
            gx: startGx, gz: startGz, y: floorY,
            type: 'start', is_main: true, step: 0, neighbors: []
        };
        occupied[startKey] = true;
        let curr = [startGx, startGz];
        let mainPath = [curr];

        // 1. Random Walk Main Path
        for (let step = 1; step < targetLen; step++) {
            let cx = curr[0];
            let cz = curr[1];
            let valid = [];

            dirs.forEach(d => {
                let nx = cx + d[0];
                let nz = cz + d[1];
                let key = `${nx}_${nz}`;
                if (nx >= -3 && nx <= 3 && !occupied[key]) {
                    valid.push([nx, nz]);
                }
            });

            if (valid.length === 0) break;

            let weighted = [];
            valid.forEach(v => {
                if (v[1] > cz) {
                    weighted.push(v);
                    weighted.push(v);
                    weighted.push(v);
                } else if (v[1] === cz) {
                    weighted.push(v);
                    weighted.push(v);
                } else {
                    weighted.push(v);
                }
            });

            let nxt = rng.choice(weighted);
            let nxtKey = `${nxt[0]}_${nxt[1]}`;
            grid[nxtKey] = {
                gx: nxt[0], gz: nxt[1], y: floorY,
                type: 'main_room', is_main: true, step: step, neighbors: [`${cx}_${cz}`]
            };
            grid[`${cx}_${cz}`].neighbors.push(nxtKey);
            occupied[nxtKey] = true;
            curr = nxt;
            mainPath.push(curr);
        }

        let exitKey = `${curr[0]}_${curr[1]}`;
        grid[exitKey].type = 'exit';

        // 2. Unpredictable Procedural Branch Placement
        let eligible = [];
        for (let i = 1; i < mainPath.length - 1; i++) {
            eligible.push(mainPath[i]);
        }
        rng.shuffle(eligible);

        let branchesDone = 0;
        for (let i = 0; i < eligible.length; i++) {
            if (branchesDone >= numBranches) break;
            let parent = eligible[i];
            let px = parent[0];
            let pz = parent[1];
            let parentKey = `${px}_${pz}`;

            let validB = [];
            dirs.forEach(d => {
                let nx = px + d[0];
                let nz = pz + d[1];
                let key = `${nx}_${nz}`;
                if (nx >= -3 && nx <= 3 && !occupied[key]) {
                    validB.push([nx, nz]);
                }
            });

            if (validB.length === 0) continue;

            let b1 = rng.choice(validB);
            let b1Key = `${b1[0]}_${b1[1]}`;
            occupied[b1Key] = true;

            let isAmbush = rng.next() < 0.6; // 60% punishing ambush with ZERO loot
            let isTwoRoom = rng.next() < 0.35; // 35% two-room branch depth

            if (!isTwoRoom) {
                grid[b1Key] = {
                    gx: b1[0], gz: b1[1], y: floorY,
                    type: isAmbush ? 'ambush_deadend' : 'treasury_vault',
                    is_main: false, is_ambush: isAmbush, neighbors: [parentKey]
                };
                grid[parentKey].neighbors.push(b1Key);
            } else {
                grid[b1Key] = {
                    gx: b1[0], gz: b1[1], y: floorY,
                    type: 'corridor_crypt', is_main: false, neighbors: [parentKey]
                };
                grid[parentKey].neighbors.push(b1Key);

                let validB2 = [];
                dirs.forEach(d => {
                    let nx = b1[0] + d[0];
                    let nz = b1[1] + d[1];
                    let key = `${nx}_${nz}`;
                    if (nx >= -3 && nx <= 3 && !occupied[key]) {
                        validB2.push([nx, nz]);
                    }
                });

                if (validB2.length > 0) {
                    let b2 = rng.choice(validB2);
                    let b2Key = `${b2[0]}_${b2[1]}`;
                    occupied[b2Key] = true;
                    grid[b2Key] = {
                        gx: b2[0], gz: b2[1], y: floorY,
                        type: isAmbush ? 'ambush_deadend' : 'treasury_vault',
                        is_main: false, is_ambush: isAmbush, neighbors: [b1Key]
                    };
                    grid[b1Key].neighbors.push(b2Key);
                }
            }
            branchesDone++;
        }

        return { grid: grid, mainPath: mainPath, exit: curr };
    },

    // 5. MASTER 3-TIER MULTI-FLOOR DUNGEON BUILDER (ENGINE v8.0)
    buildDungeon: function(server, instanceId, sector) {
        let tData = this.getTierData(sector);
        let pal = tData.palette;
        let ox = instanceId * 1500;

        let cmd = (c) => server.runCommandSilent(`execute in elyrium:dungeons run ${c}`);
        cmd(`forceload add ${ox - 110} -32 ${ox + 110} 460`);

        let seed = (instanceId * 1664525 + Math.floor(sector * 10) * 1013904223 + Date.now()) >>> 0;
        let rng = makePRNG(seed);
        console.log(`[ELYRIUM] Full Procedural 3-Tier Dungeon #${instanceId} (Sector ${sector}) Generating with seed: ${seed}`);

        // 1. Build Sarcophagus
        this.buildSarcophagus(server, ox, pal);

        // 2. Procedural Graphs Generation for 3 Floors
        let occupied = {};
        let f1 = this.generateFloorGraph(64, 0, 0, 6, 3, rng, occupied);
        let f2 = this.generateFloorGraph(48, f1.exit[0], f1.exit[1] + 1, 5, 2, rng, occupied);
        let f3 = this.generateFloorGraph(32, f2.exit[0], f2.exit[1] + 1, 4, 2, rng, occupied);

        // Ensure key milestones:
        // Floor 2 has Chasm Bridge over lava
        if (f2.mainPath.length >= 3) {
            let bridgeCell = f2.mainPath[1];
            f2.grid[`${bridgeCell[0]}_${bridgeCell[1]}`].type = 'chasm_bridge';
        }
        // Floor 2 exit is Mini-Boss Arena
        f2.grid[`${f2.exit[0]}_${f2.exit[1]}`].type = 'miniboss_arena';

        // Floor 3 exit is Grand Boss Sanctum
        f3.grid[`${f3.exit[0]}_${f3.exit[1]}`].type = 'grand_boss_sanctum';

        let allFloors = [f1, f2, f3];

        // 3. Build Rooms in World Space
        allFloors.forEach((fData, fIdx) => {
            let isLower = (fIdx >= 1);
            let floorY = (fIdx === 0 ? 64 : (fIdx === 1 ? 48 : 32));

            for (let key in fData.grid) {
                let cell = fData.grid[key];
                let cx = ox + cell.gx * 24;
                let cz = cell.gz * 24;
                let cy = floorY;

                switch (cell.type) {
                    case 'start':
                        if (fIdx === 0) {
                            this.buildEntranceHall(server, cx, cy, cz, pal, sector, instanceId, rng);
                        } else {
                            this.buildPillaredHall(server, cx, cy, cz, 6, 6, 6, pal, isLower, rng);
                        }
                        break;
                    case 'main_room':
                        let roll = rng.next();
                        if (roll < 0.33) {
                            this.buildCrossroadsHall(server, cx, cy, cz, pal, isLower, rng);
                        } else if (roll < 0.66) {
                            this.buildPillaredHall(server, cx, cy, cz, 6, 6, 6, pal, isLower, rng);
                        } else {
                            this.buildSarcophagusCrypt(server, cx, cy, cz, pal, isLower, rng);
                            this.spawnVanguardPack(server, cx, cy + 1, cz, sector, instanceId, 'main_guards', rng);
                        }
                        break;
                    case 'chasm_bridge':
                        this.buildChasmBridgeRoom(server, cx, cy, cz, pal, sector, rng);
                        break;
                    case 'miniboss_arena':
                        // Exit gate on the side leading to next floor
                        this.buildMiniBossChamber(server, cx, cy, cz, pal, sector, instanceId, cx, cy, cz + 8, rng);
                        break;
                    case 'ambush_deadend':
                        this.buildAmbushDeadEnd(server, cx, cy, cz, pal, sector, instanceId, isLower, rng);
                        break;
                    case 'treasury_vault':
                        this.buildTreasuryVault(server, cx, cy, cz, pal, sector, instanceId, isLower, rng);
                        break;
                    case 'corridor_crypt':
                        this.buildSarcophagusCrypt(server, cx, cy, cz, pal, isLower, rng);
                        break;
                    case 'grand_boss_sanctum':
                        this.buildGrandBossSanctum(server, cx, cy, cz, pal, sector, instanceId, rng);
                        break;
                    case 'exit':
                        this.buildPillaredHall(server, cx, cy, cz, 6, 6, 6, pal, isLower, rng);
                        break;
                }
            }
        });

        // 4. Build Connecting Corridors Between Rooms on Each Floor
        allFloors.forEach((fData, fIdx) => {
            let isLower = (fIdx >= 1);
            let floorY = (fIdx === 0 ? 64 : (fIdx === 1 ? 48 : 32));

            let processedEdges = {};
            for (let key in fData.grid) {
                let cell = fData.grid[key];
                let cx1 = ox + cell.gx * 24;
                let cz1 = cell.gz * 24;

                cell.neighbors.forEach(nKey => {
                    let edgeId = key < nKey ? `${key}_${nKey}` : `${nKey}_${key}`;
                    if (processedEdges[edgeId]) return;
                    processedEdges[edgeId] = true;

                    let nCell = fData.grid[nKey];
                    let cx2 = ox + nCell.gx * 24;
                    let cz2 = nCell.gz * 24;

                    if (cell.gx === nCell.gx) {
                        // Vertical Z corridor between room boundaries
                        let startZ = Math.min(cz1, cz2) + 5;
                        let endZ = Math.max(cz1, cz2) - 5;
                        this.buildCorridorZ(server, cx1, floorY, startZ, endZ, 4, pal, isLower, rng);
                    } else if (cell.gz === nCell.gz) {
                        // Horizontal X corridor between room boundaries
                        let startX = Math.min(cx1, cx2) + 5;
                        let endX = Math.max(cx1, cx2) - 5;
                        this.buildCorridorX(server, cz1, floorY, startX, endX, 4, pal, isLower, rng);
                    }
                });
            }
        });

        // 5. Build Inter-Floor Stairwells
        // Stairwell 1: from Floor 1 Exit to Floor 2 Start (Y=64 down to 48)
        let s1_x1 = ox + f1.exit[0] * 24;
        let s1_z1 = f1.exit[1] * 24 + 6;
        let s1_z2 = (f1.exit[1] + 1) * 24 - 6;
        this.buildDescendingStaircase(server, s1_x1, s1_z1, s1_x1, s1_z2, 64, 48, pal, rng);

        // Stairwell 2: from Floor 2 MiniBoss Exit to Floor 3 Start (Y=48 down to 32)
        let s2_x1 = ox + f2.exit[0] * 24;
        let s2_z1 = f2.exit[1] * 24 + 8;
        let s2_z2 = (f2.exit[1] + 1) * 24 - 6;
        this.buildDescendingStaircase(server, s2_x1, s2_z1, s2_x1, s2_z2, 48, 32, pal, rng);
    }
};

// ==============================================================================
// 6. ENTITY DEATH EVENT LISTENERS (PROGRESSION & VICTORY)
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
// 7. ADMIN COMMANDS
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
                        player.displayClientMessage(Component.literal(`§a[DUNGEON] 3-ярусное процедурное подземелье #${nextId} (Сектор ${sector}) сгенерировано! Вход: /dungeon_enter ${nextId}`), false);
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
                    player.displayClientMessage(Component.literal(`§6⚔ [ПОДЗЕМЕЛЬЕ #${id}] §fВы вошли в процедурный лабиринт! Двигайтесь вглубь, остерегаясь ложных развилок и пустых засад.`), true);
                    return 1;
                })
            )
    );
});
