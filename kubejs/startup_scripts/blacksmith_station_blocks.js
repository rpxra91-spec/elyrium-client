// ==============================================================================
// ⚒️ ELYRIUM RPG: MODULAR BLACKSMITH WORKSHOP & METALLURGY (STARTUP SCRIPT)
// Minecraft 1.21.1 NeoForge | KubeJS Startup Script
// ==============================================================================
// Registers the 4 modular workstation blocks of the Blacksmith Workshop:
// 1. kubejs:blacksmith_workbench («Верстак Оружейника», Tier 1) - ковка клинков и брони.
// 2. kubejs:blacksmith_hearth («Кузнечный Очаг / Меха», Tier 1) - разогрев и ремонт.
// 3. kubejs:infernal_crucible («Адский Горн», Tier 3 Nether) - высокотемпературное возвышение.
// 4. kubejs:void_anvil («Пустотная Наковальня», Tier 5 The End) - алтарь глубокой заточки +1..+10.
//
// Block Properties:
// - BlockProperties.HORIZONTAL_FACING (north, south, east, west)
// - StringProperty('part', ['single', 'pair_left', 'pair_right', 'trio_left', 'trio_mid', 'trio_right', 'quad_0', 'quad_1', 'quad_2', 'quad_3'])
//
// Registers Steel Metallurgy items:
// - kubejs:steel_charge («Шихта Сырой Стали»)
// - kubejs:steel_ingot («Стальной Слиток»)
// - kubejs:steel_pickaxe («Стальная Кирка», Tier Diamond / Level 3, 650 durability)
// ==============================================================================

const StringProperty = (name, values) => Java.loadClass('com.elyrium.properties.StringProperty').create(name, values);
const BS_PART_PROPERTY = StringProperty('part', [
    'single',
    'pair_left', 'pair_right',
    'trio_left', 'trio_mid', 'trio_right',
    'quad_0', 'quad_1', 'quad_2', 'quad_3'
]);

StartupEvents.registry('block', event => {

    // 1. ВЕРСТАК ОРУЖЕЙНИКА (Tier 1 Overworld)
    event.create('blacksmith_workbench')
        .displayName('§6⚒ Верстак Оружейника')
        .soundType('wood')
        .hardness(2.5)
        .resistance(6.0)
        .requiresTool(false)
        .tagBlock('minecraft:mineable/axe')
        .tagBlock('minecraft:mineable/pickaxe')
        .fullBlock(false)
        .notSolid()
        .box(0, 0, 0, 16, 16, 16)
        .property(BlockProperties.HORIZONTAL_FACING)
        .property(BS_PART_PROPERTY)
        .defaultState(state => {
            state.set(BlockProperties.HORIZONTAL_FACING, Direction.NORTH);
            state.setValue(BS_PART_PROPERTY, 'single');
        })
        .placementState(state => {
            state.set(BlockProperties.HORIZONTAL_FACING, state.horizontalDirection.opposite);
            state.setValue(BS_PART_PROPERTY, 'single');
        });

    // 2. КУЗНЕЧНЫЙ ОЧАГ / МЕХА (Tier 1 Overworld)
    event.create('blacksmith_hearth')
        .displayName('§c🔥 Кузнечный Очаг')
        .soundType('stone')
        .hardness(3.5)
        .resistance(12.0)
        .requiresTool(true)
        .tagBlock('minecraft:mineable/pickaxe')
        .lightLevel(0.8) // Свет 12/15
        .fullBlock(false)
        .notSolid()
        .box(0, 0, 0, 16, 16, 16)
        .property(BlockProperties.HORIZONTAL_FACING)
        .property(BS_PART_PROPERTY)
        .defaultState(state => {
            state.set(BlockProperties.HORIZONTAL_FACING, Direction.NORTH);
            state.setValue(BS_PART_PROPERTY, 'single');
        })
        .placementState(state => {
            state.set(BlockProperties.HORIZONTAL_FACING, state.horizontalDirection.opposite);
            state.setValue(BS_PART_PROPERTY, 'single');
        });

    // 3. АДСКИЙ ГОРН (Tier 3 Nether)
    event.create('infernal_crucible')
        .displayName('§4🌋 Адский Горн')
        .soundType('stone')
        .hardness(5.0)
        .resistance(20.0)
        .requiresTool(true)
        .tagBlock('minecraft:mineable/pickaxe')
        .lightLevel(0.9) // Свет 13.5/15
        .fullBlock(false)
        .notSolid()
        .box(0, 0, 0, 16, 16, 16)
        .property(BlockProperties.HORIZONTAL_FACING)
        .property(BS_PART_PROPERTY)
        .defaultState(state => {
            state.set(BlockProperties.HORIZONTAL_FACING, Direction.NORTH);
            state.setValue(BS_PART_PROPERTY, 'single');
        })
        .placementState(state => {
            state.set(BlockProperties.HORIZONTAL_FACING, state.horizontalDirection.opposite);
            state.setValue(BS_PART_PROPERTY, 'single');
        });

    // 4. ПУСТОТНАЯ НАКОВАЛЬНЯ (Tier 5 The End)
    event.create('void_anvil')
        .displayName('§5🌌 Пустотная Наковальня')
        .soundType('anvil')
        .hardness(10.0)
        .resistance(50.0)
        .requiresTool(true)
        .tagBlock('minecraft:mineable/pickaxe')
        .lightLevel(0.4) // Свет 6/15
        .fullBlock(false)
        .notSolid()
        .box(0, 0, 0, 16, 19, 16)
        .property(BlockProperties.HORIZONTAL_FACING)
        .property(BS_PART_PROPERTY)
        .defaultState(state => {
            state.set(BlockProperties.HORIZONTAL_FACING, Direction.NORTH);
            state.setValue(BS_PART_PROPERTY, 'single');
        })
        .placementState(state => {
            state.set(BlockProperties.HORIZONTAL_FACING, state.horizontalDirection.opposite);
            state.setValue(BS_PART_PROPERTY, 'single');
        });
});

StartupEvents.registry('item', event => {

    // 1. ШИХТА СЫРОЙ СТАЛИ
    event.create('steel_charge')
        .displayName('§8Шихта Сырой Стали')
        .tooltip('§7Смесь железа, углерода (уголь) и флюса (кальцит или глина).')
        .tooltip('§e▶ Переплавьте в Доменной Печи для получения Стального Слитка.')
        .maxStackSize(64)
        .tag('c:raw_materials');

    // 2. СТАЛЬНОЙ СЛИТОК
    event.create('steel_ingot')
        .displayName('§fСтальной Слиток')
        .tooltip('§7Высокопрочный углеродистый сплав эпохи расцвета кузнечества.')
        .tooltip('§b✦ Основной конструкционный металл Тира 1 Верхнего Мира.')
        .maxStackSize(64)
        .tag('c:ingots')
        .tag('c:ingots/steel');

    // 3. СТАЛЬНАЯ КИРКА
    event.create('steel_pickaxe', 'pickaxe')
        .displayName('§fСтальная Кирка')
        .tier('diamond')
        .speed(7.0)
        .attackDamageBaseline(4.0)
        .speedBaseline(1.2)
        .maxDamage(650)
        .rarity('uncommon')
        .tag('minecraft:pickaxes')
        .tag('c:tools/pickaxes')
        .tag('c:tools')
        .tooltip('§8[Инструмент Металлурга Элириума]')
        .tooltip('§a✦ Уровень добычи: 3 (Алмазный уровень)')
        .tooltip('§7Обладает твердостью для добычи природной и глубинной алмазной руды.')
        .tooltip('§e✦ Прочность: §f650 единиц');
});
