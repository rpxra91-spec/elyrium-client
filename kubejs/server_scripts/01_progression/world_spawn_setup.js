// ==============================================================================
// 🌍 ELYRIUM RPG: WORLD SPAWN, TEST ARENA & PRE-GENERATION ENGINE
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 1. Spawns 20x20 Pristine Combat Testing Arena at Spawn:
//    - Bounds: X: -10..10, Z: -10..10, Y = 75 (Polished Deepslate, Stone Bricks & Sea Lanterns).
//    - Clears airspace above platform (Y = 76..84) from obstructions.
//    - World spawn set to X = 0, Y = 76, Z = 0.
// 2. Interactive Test Dummy Spawner:
//    - Pedestal with button at (0, 76, 7) + informational sign.
//    - Right-clicking button summons a 500 HP Zombified Piglin training dummy at arena center (0, 76, 0).
// 3. Absolute Natural Monster Suppression (Radius 100 blocks):
//    - Automatically cancels ANY hostile entity spawn within 100 blocks of (0, 0).
//    - Excludes explicit 'elyrium_test_dummy' tagged entities.
// 4. Chunky 500-block Radial Pre-generation:
//    - Automatically configures Chunky: center 0 0, radius 500, shape circle, and launches pre-gen on server start.
// ==============================================================================

const ARENA_CONFIG = {
    minX: -10,
    maxX: 10,
    minZ: -10,
    maxZ: 10,
    floorY: 75,
    clearTopY: 84,
    buttonX: 0,
    buttonY: 77,
    buttonZ: 7,
    dummySpawnX: 0,
    dummySpawnY: 76,
    dummySpawnZ: 0,
    suppressionRadiusSq: 100 * 100
};

// ------------------------------------------------------------------------------
// BUILD TESTING ARENA (20x20 PLATFORM)
// ------------------------------------------------------------------------------

function buildCombatTestingArena(server) {
    if (!server) return;

    // 1. Clear Airspace
    server.runCommandSilent(`fill -10 76 -10 10 ${ARENA_CONFIG.clearTopY} 10 minecraft:air`);

    // 2. Foundation Floor (21x21 = -10..10)
    server.runCommandSilent(`fill -10 75 -10 10 75 10 minecraft:polished_deepslate`);
    server.runCommandSilent(`fill -8 75 -8 8 75 8 minecraft:stone_bricks`);
    server.runCommandSilent(`fill -4 75 -4 4 75 4 minecraft:polished_andesite`);

    // 3. Low Perimeter Wall with 4 Gate Openings
    server.runCommandSilent(`fill -10 76 -10 10 76 -10 minecraft:polished_deepslate_wall`);
    server.runCommandSilent(`fill -10 76 10 10 76 10 minecraft:polished_deepslate_wall`);
    server.runCommandSilent(`fill -10 76 -10 -10 76 10 minecraft:polished_deepslate_wall`);
    server.runCommandSilent(`fill 10 76 -10 10 76 10 minecraft:polished_deepslate_wall`);

    // Clear Entrances
    server.runCommandSilent(`setblock 0 76 -10 minecraft:air`);
    server.runCommandSilent(`setblock 0 76 10 minecraft:air`);
    server.runCommandSilent(`setblock -10 76 0 minecraft:air`);
    server.runCommandSilent(`setblock 10 76 0 minecraft:air`);

    // 4. Illumination Corners & Midpoints
    server.runCommandSilent(`setblock -10 77 -10 minecraft:sea_lantern`);
    server.runCommandSilent(`setblock 10 77 -10 minecraft:sea_lantern`);
    server.runCommandSilent(`setblock -10 77 10 minecraft:sea_lantern`);
    server.runCommandSilent(`setblock 10 77 10 minecraft:sea_lantern`);
    server.runCommandSilent(`setblock -10 77 0 minecraft:sea_lantern`);
    server.runCommandSilent(`setblock 10 77 0 minecraft:sea_lantern`);
    server.runCommandSilent(`setblock 0 77 -10 minecraft:sea_lantern`);
    server.runCommandSilent(`setblock 0 77 10 minecraft:sea_lantern`);

    // 5. Test Dummy Spawner Pedestal at (0, 76, 7)
    server.runCommandSilent(`setblock 0 76 7 minecraft:chiseled_stone_bricks`);
    server.runCommandSilent(`setblock 0 77 7 minecraft:polished_blackstone_button[face=floor,facing=north]`);

    // Sign with Instructions at (0, 76, 8)
    server.runCommandSilent(`setblock 0 76 8 minecraft:oak_sign[rotation=0]{front_text:{messages:['"§6[ТЕСТОВЫЙ]"','"§e[МАНЕКЕН]"','"§a[КЛИК ПО КНОПКЕ]"','"§7Зомби-пиглин"']}}`);
}

// ------------------------------------------------------------------------------
// SUMMON TEST DUMMY (ZOMBIFIED PIGLIN)
// ------------------------------------------------------------------------------

function summonTestDummy(server, triggerPlayer) {
    if (!server) return;

    let sx = ARENA_CONFIG.dummySpawnX;
    let sy = ARENA_CONFIG.dummySpawnY;
    let sz = ARENA_CONFIG.dummySpawnZ;

    // Remove old test dummies at the arena
    server.runCommandSilent(`kill @e[type=minecraft:zombified_piglin,tag=elyrium_test_dummy,distance=..25]`);

    // Summon durable test dummy (500 HP, no wander, high knockback resist)
    // NeoForge 1.21.1 requires {id:"...",base:...} attribute format
    server.runCommandSilent(`summon minecraft:zombified_piglin ${sx} ${sy} ${sz} {Tags:["elyrium_test_dummy"],CustomName:'"§e⚔ Тестовый Манекен (500 HP) ⚔"',CustomNameVisible:1b,Attributes:[{id:"minecraft:generic.max_health",base:500.0d},{id:"minecraft:generic.movement_speed",base:0.0d},{id:"minecraft:generic.knockback_resistance",base:0.4d}],Health:500.0f,NoAI:0b,Silent:0b}`);

    server.runCommandSilent(`playsound minecraft:block.bell.use ambient @a ${sx} ${sy} ${sz} 1.2 1.2`);
    server.runCommandSilent(`playsound minecraft:entity.zombified_piglin.ambient ambient @a ${sx} ${sy} ${sz} 1.2 1.0`);
    server.runCommandSilent(`particle minecraft:totem_of_undying ${sx} ${sy + 1} ${sz} 0.6 0.8 0.6 0.15 35 normal`);
    server.runCommandSilent(`particle minecraft:flash ${sx} ${sy + 1} ${sz} 0.1 0.1 0.1 0 1 normal`);

    if (triggerPlayer) {
        triggerPlayer.sendSystemMessage(Text.of('§a⚔ Манекен Зомби-пиглина призван в центре платформы (500 HP, неподвижен для комбо-тестов).'), true);
    }
}

// ------------------------------------------------------------------------------
// SERVER LOADED: ARENA BUILD, CHUNKY PRE-GEN & SPAWN SETUP
// ------------------------------------------------------------------------------

ServerEvents.loaded(event => {
    let server = event.server;

    // 1. Set Exact World Spawn
    server.runCommandSilent('setworldspawn 0 76 0');

    // 2. Build Test Arena Platform
    buildCombatTestingArena(server);

    // 3. Launch Chunky 500-Block Radial Pre-Generation
    server.scheduleInTicks(40, () => {
        server.runCommandSilent('chunky center 0 0');
        server.runCommandSilent('chunky radius 500');
        server.runCommandSilent('chunky shape circle');
        server.runCommandSilent('chunky start');
        console.log('[Elyrium] Launched Chunky pre-generation: radius 500 at (0, 0).');
    });
});

// ------------------------------------------------------------------------------
// BLOCK INTERACTION: BUTTON CLICK TO SUMMON DUMMY
// ------------------------------------------------------------------------------

BlockEvents.rightClicked(event => {
    if (event.hand && String(event.hand).toUpperCase().includes('OFF')) return;
    let block = event.block;
    if (!block) return;

    let x = block.x;
    let y = block.y;
    let z = block.z;

    // Check if clicked the dummy button at (0, 77, 7) or pedestal
    if ((x === ARENA_CONFIG.buttonX && y === ARENA_CONFIG.buttonY && z === ARENA_CONFIG.buttonZ) ||
        (x === 0 && y === 76 && z === 7 && block.id.includes('button')) ||
        (x === 0 && y === 77 && z === 7 && block.id.includes('button'))) {
        let now = Date.now();
        let p = event.player;
        let lastSpawn = p ? (p.persistentData.getLong('skd_last_dummy_spawn') || 0) : 0;
        if (now - lastSpawn < 1200) return;
        if (p) p.persistentData.putLong('skd_last_dummy_spawn', now);
        summonTestDummy(event.server, p);
    }
});

// ------------------------------------------------------------------------------
// MOB SPAWN SUPPRESSION (100 BLOCKS AROUND SPAWN)
// ------------------------------------------------------------------------------

EntityEvents.checkSpawn(event => {
    let entity = event.entity;
    if (!entity || !entity.isLiving() || entity.isPlayer()) return;

    // Allow intentional test dummies
    if (entity.tags && entity.tags.contains('elyrium_test_dummy')) return;

    let dx = entity.x;
    let dz = entity.z;
    if (dx * dx + dz * dz <= ARENA_CONFIG.suppressionRadiusSq) {
        event.cancel();
    }
});

EntityEvents.spawned(event => {
    let entity = event.entity;
    if (!entity || !entity.isLiving() || entity.isPlayer()) return;

    // Allow intentional test dummies
    if (entity.tags && entity.tags.contains('elyrium_test_dummy')) return;

    let dx = entity.x;
    let dz = entity.z;
    if (dx * dx + dz * dz <= ARENA_CONFIG.suppressionRadiusSq) {
        event.cancel();
        entity.discard();
    }
});

// ------------------------------------------------------------------------------
// PLAYER LOGIN: SPAWN GREETING & LANDING SAFETY
// ------------------------------------------------------------------------------

PlayerEvents.loggedIn(event => {
    let player = event.player;
    let server = player.server;

    // First login teleport to arena edge facing center
    if (!player.persistentData.getBoolean('skd_spawn_initialized')) {
        player.persistentData.putBoolean('skd_spawn_initialized', true);
        server.runCommandSilent('tp ' + player.username + ' 0 76 -5 0 0');
        server.runCommandSilent('effect give ' + player.username + ' minecraft:slow_falling 5 1 true');
        server.runCommandSilent('effect give ' + player.username + ' minecraft:resistance 5 4 true');
    }

    server.runCommandSilent('title ' + player.username + ' times 20 80 20');
    server.runCommandSilent('title ' + player.username + ' title {"text":"§6🏛 БОЕВАЯ АРЕНА ЭЛИРИУМА 🏛"}');
    server.runCommandSilent('title ' + player.username + ' subtitle {"text":"§aПлатформа 20х20 | Манекен Зомби-пиглина"}');
    server.runCommandSilent('playsound minecraft:ui.toast.challenge_complete player ' + player.username + ' ~ ~ ~ 0.8 1.0');

    player.tell('§6═══════════════════════════════════════════════════════');
    player.tell('§6🏛 ДОБРО ПОЖАЛОВАТЬ НА БОЕВУЮ АРЕНУ ЭЛИРИУМА! 🏛');
    player.tell('§aПлатформа 20х20 блоков со встроенной станцией вызова манекена.');
    player.tell('§eЕстественный спавн монстров отключен в радиусе 100 блоков.');
    player.tell('§b⚔ Нажмите кнопку на постаменте сзади (Z=7) для вызова Зомби-пиглина (500 HP).');
    player.tell('§d⭐ Прегенерация мира Chunky запущена на 500 блоков.');
    player.tell('§6═══════════════════════════════════════════════════════');
});
