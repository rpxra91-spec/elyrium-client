// KubeJS Server Script: Abyss Boss Colosseum, Crucible of Trials, Field Boss Lair & Warband
// 1. Колизей Великого Хранителя (Y = -90): Полностью открытый, осушенный и очищенный зал (без гор и преград!)
//    Босс: Легендарный Незеритовый Титан Малгарос (cataclysm:netherite_monstrosity)
// 2. Горнило Испытаний (Y = 40): Гладиаторская арена с 9-блочными стенами (мобы НИКОГДА не падают в Бездну!)
// 3. Логово Полевого Босса (Y = 240): Капище Древнего Титана (cataclysm:ancient_remnant)
// 4. Укрепленный Лагерь Варбанды (Y = 140)

const DIM_LAYER_01 = 'skd_abyss:layer_01'

// =========================================================================
// 1. КОЛИЗЕЙ ВЕЛИКОГО ХРАНИТЕЛЯ (Y = -90)
// =========================================================================
const COLOSSEUM = {
    minX: -28, maxX: 28,
    minY: -90, maxY: -62,
    minZ: -355, maxZ: -286,
    gateMinX: -5, gateMaxX: 5,
    gateMinY: -90, gateMaxY: -82,
    gateZ: -285,
    bossX: 0, bossY: -90, bossZ: -320
}

const RUNWAY = {
    minX: -6, maxX: 6,
    minY: -90, maxY: -80,
    minZ: -284, maxZ: -255,
    altarX: 0, altarY: -89, altarZ: -272
}

function setColosseumGate(server, closed) {
    let block = closed ? 'minecraft:crying_obsidian' : 'minecraft:air'
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${COLOSSEUM.gateMinX} ${COLOSSEUM.gateMinY} ${COLOSSEUM.gateZ} ${COLOSSEUM.gateMaxX} ${COLOSSEUM.gateMaxY} ${COLOSSEUM.gateZ} ${block}`)
}

function buildColosseum(server) {
    let level = server.getLevel(DIM_LAYER_01)
    if (!level) return

    // 1. Снимаем ванильный лимит на количество блоков в /fill
    server.runCommandSilent(`gamerule commandModificationBlockLimit 1000000`)

    // 2. Прогружаем чанки
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run forceload add -2 -23 2 -17`)

    // 3. Расчистка зала Колизея безопасными слайсами (каждый строго меньше 22 000 блоков!)
    // Это на 100% испаряет гору и камни перед вратами
    let x1 = -28, x2 = 28
    // Секция 1: Z от -355 до -335
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${x1} -90 -355 ${x2} -76 -335 minecraft:air`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${x1} -75 -355 ${x2} -62 -335 minecraft:air`)
    // Секция 2: Z от -334 до -310
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${x1} -90 -334 ${x2} -76 -310 minecraft:air`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${x1} -75 -334 ${x2} -62 -310 minecraft:air`)
    // Секция 3: Z от -309 до -286 (прямо перед вратами!)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${x1} -90 -309 ${x2} -76 -286 minecraft:air`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${x1} -75 -309 ${x2} -62 -286 minecraft:air`)

    // 4. Сплошной ровный пол арены
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill -28 -91 -355 28 -91 -286 minecraft:deepslate_tiles`)

    // 5. Капитальные внешние стены зала (защита от водопадов и пещер)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill -29 -91 -356 29 -61 -356 minecraft:deepslate_bricks`) // Север
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill -29 -91 -285 29 -61 -285 minecraft:deepslate_bricks`) // Юг
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill -29 -91 -356 -29 -61 -285 minecraft:deepslate_bricks`) // Запад
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill 29 -91 -356 29 -61 -285 minecraft:deepslate_bricks`)  // Восток
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill -29 -61 -356 29 -61 -285 minecraft:chiseled_deepslate`) // Потолок

    // 6. Прорубаем парадную арку входа в южной стене (Z = -285)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${COLOSSEUM.gateMinX} ${COLOSSEUM.gateMinY} ${COLOSSEUM.gateZ} ${COLOSSEUM.gateMaxX} ${COLOSSEUM.gateMaxY} ${COLOSSEUM.gateZ} minecraft:air`)

    // 7. Освещенные колонны внутри Колизея
    let pillars = [
        { x: -16, z: -305 }, { x: 16, z: -305 },
        { x: -16, z: -335 }, { x: 16, z: -335 }
    ]
    pillars.forEach(p => {
        server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${p.x - 1} -90 ${p.z - 1} ${p.x + 1} -63 ${p.z + 1} minecraft:chiseled_tuff_bricks`)
        server.runCommandSilent(`execute in ${DIM_LAYER_01} run setblock ${p.x} -87 ${p.z - 2} minecraft:soul_lantern[hanging=false]`)
        server.runCommandSilent(`execute in ${DIM_LAYER_01} run setblock ${p.x} -87 ${p.z + 2} minecraft:soul_lantern[hanging=false]`)
    })

    // 8. Аллея подхода (Runway)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${RUNWAY.minX - 1} -91 ${RUNWAY.maxZ + 1} ${RUNWAY.maxX + 1} -79 ${RUNWAY.minZ} minecraft:deepslate_bricks hollow`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${RUNWAY.minX} -91 ${RUNWAY.minZ} ${RUNWAY.maxX} -91 ${RUNWAY.maxZ} minecraft:polished_deepslate`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${RUNWAY.minX} ${RUNWAY.minY} ${RUNWAY.minZ} ${RUNWAY.maxX} ${RUNWAY.maxY} ${RUNWAY.maxZ} minecraft:air`)

    // Фонари душ вдоль аллеи
    for (let z = -258; z >= -282; z -= 6) {
        server.runCommandSilent(`execute in ${DIM_LAYER_01} run setblock -5 -90 ${z} minecraft:soul_lantern`)
        server.runCommandSilent(`execute in ${DIM_LAYER_01} run setblock  5 -90 ${z} minecraft:soul_lantern`)
    }

    // 9. Триединый Алтарь на аллее (Z = -272)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run setblock -3 -90 ${RUNWAY.altarZ} minecraft:chiseled_deepslate`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run setblock -3 -89 ${RUNWAY.altarZ} minecraft:soul_fire`)

    server.runCommandSilent(`execute in ${DIM_LAYER_01} run setblock 0 -90 ${RUNWAY.altarZ} minecraft:chiseled_tuff_bricks`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run setblock 0 -89 ${RUNWAY.altarZ} minecraft:crying_obsidian`)

    server.runCommandSilent(`execute in ${DIM_LAYER_01} run setblock 3 -90 ${RUNWAY.altarZ} minecraft:chiseled_deepslate`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run setblock 3 -89 ${RUNWAY.altarZ} minecraft:soul_fire`)

    // 10. Закрываем барьер врат
    setColosseumGate(server, true)
}

// =========================================================================
// 2. ГОРНИЛО ИСПЫТАНИЙ (Y = 40): ГЛАДИАТОРСКИЙ ПИТ С ВЫСОКИМИ СТЕНАМИ
// =========================================================================
const TRIALS = {
    minX: -24, maxX: 24,
    minZ: 26, maxZ: 74,
    floorY: 39,
    wallHeight: 48,
    altarX: 0, altarY: 41, altarZ: 50
}

function buildTrialsCrucible(server) {
    let level = server.getLevel(DIM_LAYER_01)
    if (!level) return

    server.runCommandSilent(`gamerule commandModificationBlockLimit 1000000`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run forceload add -2 1 2 5`)

    // 1. Полная зачистка воздуха арены двумя безопасными слоями
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill -23 40 27 23 47 73 minecraft:air`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill -23 48 27 23 56 73 minecraft:air`)

    // 2. Пол арены
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${TRIALS.minX} ${TRIALS.floorY} ${TRIALS.minZ} ${TRIALS.maxX} ${TRIALS.floorY} ${TRIALS.maxZ} minecraft:polished_deepslate`)

    // 3. Высокие 9-блочные стены (Y = 40 ... 48) - 100% защита от падения мобов
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${TRIALS.minX} 40 ${TRIALS.minZ} ${TRIALS.maxX} ${TRIALS.wallHeight} ${TRIALS.minZ} minecraft:polished_deepslate_bricks`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${TRIALS.minX} 40 ${TRIALS.maxZ} ${TRIALS.maxX} ${TRIALS.wallHeight} ${TRIALS.maxZ} minecraft:polished_deepslate_bricks`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${TRIALS.minX} 40 ${TRIALS.minZ} ${TRIALS.minX} ${TRIALS.wallHeight} ${TRIALS.maxZ} minecraft:polished_deepslate_bricks`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${TRIALS.maxX} 40 ${TRIALS.minZ} ${TRIALS.maxX} ${TRIALS.wallHeight} ${TRIALS.maxZ} minecraft:polished_deepslate_bricks`)

    // 4. Освещение на стенах
    for (let x = -20; x <= 20; x += 8) {
        server.runCommandSilent(`execute in ${DIM_LAYER_01} run setblock ${x} 42 ${TRIALS.minZ + 1} minecraft:lantern`)
        server.runCommandSilent(`execute in ${DIM_LAYER_01} run setblock ${x} 42 ${TRIALS.maxZ - 1} minecraft:lantern`)
    }
    for (let z = 34; z <= 66; z += 8) {
        server.runCommandSilent(`execute in ${DIM_LAYER_01} run setblock ${TRIALS.minX + 1} 42 ${z} minecraft:lantern`)
        server.runCommandSilent(`execute in ${DIM_LAYER_01} run setblock ${TRIALS.maxX - 1} 42 ${z} minecraft:lantern`)
    }

    // 5. Алтарь Арены в центре
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run setblock ${TRIALS.altarX} 40 ${TRIALS.altarZ} minecraft:chiseled_tuff_bricks`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run setblock ${TRIALS.altarX} ${TRIALS.altarY} ${TRIALS.altarZ} minecraft:respawn_anchor[charges=4]`)
}

// =========================================================================
// 3. ЛОГОВО ПОЛЕВОГО БОССА: КАПИЩЕ ДРЕВНЕГО ТИТАНА (Y = 240)
// =========================================================================
const FIELD_LAIR = {
    minX: -20, maxX: 20,
    minZ: 435, maxZ: 475,
    floorY: 240,
    wallHeight: 246,
    altarX: 0, altarY: 241, altarZ: 455
}

function buildFieldBossLair(server) {
    let level = server.getLevel(DIM_LAYER_01)
    if (!level) return

    server.runCommandSilent(`gamerule commandModificationBlockLimit 1000000`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run forceload add -2 27 2 30`)

    // 1. Пол капища
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${FIELD_LAIR.minX} ${FIELD_LAIR.floorY} ${FIELD_LAIR.minZ} ${FIELD_LAIR.maxX} ${FIELD_LAIR.floorY} ${FIELD_LAIR.maxZ} minecraft:bone_block`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill -16 240 439 16 240 471 minecraft:moss_block`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${FIELD_LAIR.minX + 1} 241 ${FIELD_LAIR.minZ + 1} ${FIELD_LAIR.maxX - 1} 258 ${FIELD_LAIR.maxZ - 1} minecraft:air`)

    // 2. Ограждение капища (Y = 241 ... 246)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${FIELD_LAIR.minX} 241 ${FIELD_LAIR.minZ} ${FIELD_LAIR.maxX} ${FIELD_LAIR.wallHeight} ${FIELD_LAIR.minZ} minecraft:bone_block`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${FIELD_LAIR.minX} 241 ${FIELD_LAIR.maxZ} ${FIELD_LAIR.maxX} ${FIELD_LAIR.wallHeight} ${FIELD_LAIR.maxZ} minecraft:bone_block`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${FIELD_LAIR.minX} 241 ${FIELD_LAIR.minZ} ${FIELD_LAIR.minX} ${FIELD_LAIR.wallHeight} ${FIELD_LAIR.maxZ} minecraft:bone_block`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${FIELD_LAIR.maxX} 241 ${FIELD_LAIR.minZ} ${FIELD_LAIR.maxX} ${FIELD_LAIR.wallHeight} ${FIELD_LAIR.maxZ} minecraft:bone_block`)

    // 3. Освещение
    for (let x = -16; x <= 16; x += 8) {
        server.runCommandSilent(`execute in ${DIM_LAYER_01} run setblock ${x} 247 ${FIELD_LAIR.minZ} minecraft:soul_torch`)
        server.runCommandSilent(`execute in ${DIM_LAYER_01} run setblock ${x} 247 ${FIELD_LAIR.maxZ} minecraft:soul_torch`)
    }

    // 4. Древний Череп-Алтарь
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run setblock 0 241 455 minecraft:chiseled_bookshelf`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run setblock 0 242 455 minecraft:skeleton_skull`)
}

// =========================================================================
// 4. ЛАГЕРЬ ВАРБАНДЫ (Y = 140)
// =========================================================================
const WARBAND_CAMP = {
    minX: -18, maxX: 18,
    minZ: -80, maxZ: -40,
    floorY: 140,
    chestX: 0, chestY: 141, chestZ: -60
}

function buildWarbandCamp(server) {
    let level = server.getLevel(DIM_LAYER_01)
    if (!level) return

    server.runCommandSilent(`gamerule commandModificationBlockLimit 1000000`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run forceload add -2 -5 2 -2`)

    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${WARBAND_CAMP.minX} 140 ${WARBAND_CAMP.minZ} ${WARBAND_CAMP.maxX} 140 ${WARBAND_CAMP.maxZ} minecraft:coarse_dirt`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill -12 140 -74 12 140 -46 minecraft:spruce_planks`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${WARBAND_CAMP.minX + 1} 141 ${WARBAND_CAMP.minZ + 1} ${WARBAND_CAMP.maxX - 1} 155 ${WARBAND_CAMP.maxZ - 1} minecraft:air`)

    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${WARBAND_CAMP.minX} 141 ${WARBAND_CAMP.minZ} ${WARBAND_CAMP.maxX} 144 ${WARBAND_CAMP.minZ} minecraft:spruce_fence`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${WARBAND_CAMP.minX} 141 ${WARBAND_CAMP.maxZ} ${WARBAND_CAMP.maxX} 144 ${WARBAND_CAMP.maxZ} minecraft:spruce_fence`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${WARBAND_CAMP.minX} 141 ${WARBAND_CAMP.minZ} ${WARBAND_CAMP.minX} 144 ${WARBAND_CAMP.maxZ} minecraft:spruce_fence`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run fill ${WARBAND_CAMP.maxX} 141 ${WARBAND_CAMP.minZ} ${WARBAND_CAMP.maxX} 144 ${WARBAND_CAMP.maxZ} minecraft:spruce_fence`)

    server.runCommandSilent(`execute in ${DIM_LAYER_01} run setblock 0 141 -55 minecraft:campfire`)
    server.runCommandSilent(`execute in ${DIM_LAYER_01} run setblock ${WARBAND_CAMP.chestX} ${WARBAND_CAMP.chestY} ${WARBAND_CAMP.chestZ} minecraft:chest`)
}

// Авто-строительство при загрузке
ServerEvents.loaded(event => {
    let server = event.server
    buildColosseum(server)
    buildTrialsCrucible(server)
    buildFieldBossLair(server)
    buildWarbandCamp(server)
})

// =========================================================================
// ИНТЕРАКТИВ 1: ТРИЕДИНЫЙ АЛТАРЬ -> НЕЗЕРИТОВЫЙ ТИТАН МАЛГАРОС
// =========================================================================
BlockEvents.rightClicked(event => {
    let block = event.block
    if (block.level.dimension.toString() !== DIM_LAYER_01) return

    if (block.getX() === RUNWAY.altarX && block.getY() === RUNWAY.altarY && block.getZ() === RUNWAY.altarZ) {
        let player = event.player
        let server = event.server

        server.tell(Text.gold('═══════════════════════════════════════════════════'))
        server.tell(Text.darkPurple('⚡ ТРИЕДИНЫЙ АЛТАРЬ БЕЗДНЫ ПРОБУЖДЕН!'))
        server.tell(Text.aqua(`   ${player.username} активировал древний алтарь!`))
        server.tell(Text.red('   Врата Колизея растворились! В центре зала пробудился Великий Хранитель!'))
        server.tell(Text.gold('═══════════════════════════════════════════════════'))

        // Распахиваем врата
        setColosseumGate(server, false)

        // Звуки и спецэффекты
        server.runCommandSilent(`execute in ${DIM_LAYER_01} run playsound cataclysm:netherite_monstrosity_ambient hostile @a ${RUNWAY.altarX} -90 ${RUNWAY.altarZ} 2 0.8`)
        server.runCommandSilent(`execute in ${DIM_LAYER_01} run particle minecraft:soul_fire_flame ${RUNWAY.altarX} -88 ${RUNWAY.altarZ} 2 2 2 0.1 80`)

        // Спавн Незеритового Титана точно в центре открытого зала (Z = -320)
        server.runCommandSilent(`execute in ${DIM_LAYER_01} positioned ${COLOSSEUM.bossX} ${COLOSSEUM.bossY} ${COLOSSEUM.bossZ} run summon cataclysm:netherite_monstrosity ~ ~ ~ {CustomName:'"Великий Хранитель Малгарос"',PersistenceRequired:1b}`)
        server.runCommandSilent(`execute in ${DIM_LAYER_01} run particle minecraft:explosion_emitter ${COLOSSEUM.bossX} ${COLOSSEUM.bossY + 2} ${COLOSSEUM.bossZ} 3 3 3 0.1 10`)
    }
})

// =========================================================================
// ИНТЕРАКТИВ 2: ГОРНИЛО ИСПЫТАНИЙ -> ВОЛНЫ ГЛАДИАТОРОВ CATACLYSM
// =========================================================================
BlockEvents.rightClicked(event => {
    let block = event.block
    if (block.level.dimension.toString() !== DIM_LAYER_01) return

    if (block.getX() === TRIALS.altarX && block.getY() === TRIALS.altarY && block.getZ() === TRIALS.altarZ) {
        let server = event.server
        let player = event.player

        server.tell(Text.darkRed('⚔️ [ГОРНИЛО ИСПЫТАНИЙ] Битва на арене началась!'))
        server.tell(Text.yellow('   Стены арены заблокированы. Победите гладиаторов Бездны!'))
        server.runCommandSilent(`execute in ${DIM_LAYER_01} run playsound minecraft:entity.elder_guardian.curse hostile @a ${TRIALS.altarX} 40 ${TRIALS.altarZ} 1.5 0.8`)

        // Спавним 4 Коболетона + 2 Драугра
        let spawns = [
            { id: 'cataclysm:koboleton', x: -10, z: 40 },
            { id: 'cataclysm:koboleton', x: 10, z: 40 },
            { id: 'cataclysm:koboleton', x: -10, z: 60 },
            { id: 'cataclysm:koboleton', x: 10, z: 60 },
            { id: 'cataclysm:draugr', x: 0, z: 35 },
            { id: 'cataclysm:draugr', x: 0, z: 65 }
        ]
        spawns.forEach(s => {
            server.runCommandSilent(`execute in ${DIM_LAYER_01} run summon ${s.id} ${s.x} 40 ${s.z} {PersistenceRequired:1b}`)
        })

        // Через 20 секунд спавним Чемпиона-Гладиатора Арены
        server.scheduleInTicks(400, () => {
            server.tell(Text.gold('⚠️ На арену вступает Чемпион Горнила — Коболедиатор!'))
            server.runCommandSilent(`execute in ${DIM_LAYER_01} run summon cataclysm:kobolediator 0 40 55 {CustomName:'"Чемпион Горнила Бездны"',PersistenceRequired:1b}`)
        })
    }
})

// =========================================================================
// ИНТЕРАКТИВ 3: КАПИЩЕ ДРЕВНЕГО ТИТАНА -> ПОЛЕВОЙ БОСС
// =========================================================================
BlockEvents.rightClicked(event => {
    let block = event.block
    if (block.level.dimension.toString() !== DIM_LAYER_01) return

    if (block.getX() === FIELD_LAIR.altarX && block.getY() === 242 && block.getZ() === FIELD_LAIR.altarZ) {
        let server = event.server
        let player = event.player

        server.tell(Text.darkAqua('💀 [КАПИЩЕ ТИТАНА] Древние кости содрогаются...'))
        server.tell(Text.aqua(`   ${player.username} потревожил покой Древнего Остана!`))

        server.runCommandSilent(`execute in ${DIM_LAYER_01} run playsound minecraft:entity.wither.spawn hostile @a ${FIELD_LAIR.altarX} 242 ${FIELD_LAIR.altarZ} 2 0.8`)
        server.runCommandSilent(`execute in ${DIM_LAYER_01} run summon cataclysm:ancient_remnant 0 241 460 {CustomName:'"Полевой Босс: Древний Остан"',PersistenceRequired:1b}`)
    }
})

// =========================================================================
// КОМАНДЫ УПРАВЛЕНИЯ И НАВИГАЦИИ
// =========================================================================
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event

    // 1. Перестроить все 4 точки: /abyss_build_sprint2
    event.register(
        Commands.literal('abyss_build_sprint2')
            .requires(src => src.hasPermission(2))
            .executes(ctx => {
                let server = ctx.source.server
                buildColosseum(server)
                buildTrialsCrucible(server)
                buildFieldBossLair(server)
                buildWarbandCamp(server)
                ctx.source.sendSuccess(() => Text.green('✔ Все 4 боевые точки Спринта 2 (Колизей, Горнило, Капище Босса, Лагерь) построены!'), true)
                return 1
            })
    )

    // 2. Телепорт к Колизею Босса: /abyss_tp_boss
    event.register(
        Commands.literal('abyss_tp_boss')
            .requires(src => src.hasPermission(2))
            .executes(ctx => {
                let player = ctx.source.player
                let server = ctx.source.server
                buildColosseum(server)
                if (player) {
                    player.teleportTo(DIM_LAYER_01, 0, -90, -260, 180, 0)
                    player.potionEffects.add('minecraft:night_vision', 1200, 0, false, false)
                    player.tell(Text.darkPurple('🌀 Вы на освещенной аллее Колизея (Y = -90). Прямо перед вами Триединый Алтарь и Врата в зал!'))
                }
                return 1
            })
    )

    // 3. Телепорт к Горнилу Испытаний: /abyss_tp_arena
    event.register(
        Commands.literal('abyss_tp_arena')
            .requires(src => src.hasPermission(2))
            .executes(ctx => {
                let player = ctx.source.player
                let server = ctx.source.server
                buildTrialsCrucible(server)
                if (player) {
                    player.teleportTo(DIM_LAYER_01, 0, 40, 32, 0, 0)
                    player.potionEffects.add('minecraft:night_vision', 1200, 0, false, false)
                    player.tell(Text.gold('⚔️ Вы внутри закрытого Горнила Испытаний (Y = 40). Стены 9 блоков высотой — мобы не выпадут!'))
                }
                return 1
            })
    )

    // 4. Телепорт к Полевому Боссу (Капище Титана): /abyss_tp_fieldboss (или /abyss_tp_ledge)
    event.register(
        Commands.literal('abyss_tp_fieldboss')
            .requires(src => src.hasPermission(2))
            .executes(ctx => {
                let player = ctx.source.player
                let server = ctx.source.server
                buildFieldBossLair(server)
                if (player) {
                    player.teleportTo(DIM_LAYER_01, 0, 241, 445, 0, 0)
                    player.potionEffects.add('minecraft:night_vision', 1200, 0, false, false)
                    player.tell(Text.aqua('💀 Вы в Капище Древнего Титана (Y = 240). Кликните ПКМ по черепу для вызова Полевого Босса!'))
                }
                return 1
            })
    )
    event.register(
        Commands.literal('abyss_tp_ledge')
            .requires(src => src.hasPermission(2))
            .executes(ctx => {
                let player = ctx.source.player
                let server = ctx.source.server
                buildFieldBossLair(server)
                if (player) {
                    player.teleportTo(DIM_LAYER_01, 0, 241, 445, 0, 0)
                    player.potionEffects.add('minecraft:night_vision', 1200, 0, false, false)
                    player.tell(Text.aqua('💀 Вы в Капище Древнего Титана (Y = 240).'))
                }
                return 1
            })
    )

    // 5. Телепорт к Лагерю Варбанды: /abyss_tp_warband
    event.register(
        Commands.literal('abyss_tp_warband')
            .requires(src => src.hasPermission(2))
            .executes(ctx => {
                let player = ctx.source.player
                let server = ctx.source.server
                buildWarbandCamp(server)
                if (player) {
                    player.teleportTo(DIM_LAYER_01, 0, 141, -50, 180, 0)
                    player.potionEffects.add('minecraft:night_vision', 1200, 0, false, false)
                    player.tell(Text.yellow('⛺ Вы у Лагеря Варбанды (Y = 140).'))
                }
                return 1
            })
    )
})
