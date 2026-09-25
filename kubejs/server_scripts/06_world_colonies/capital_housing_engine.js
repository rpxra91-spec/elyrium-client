// ==============================================================================
// 🏛️ ELYRIUM: CAPITAL HOUSING & PRIVATE REAL ESTATE ENGINE
// ==============================================================================
// 1. Lifetime housing ownership via Capital Deed & Notary Registry.
// 2. Tenement apartments (Studio, 2-room, Luxury Penthouse) & Private Estates.
// 3. Notary Agent: Purchases with Gold Coins, Duplicate Keys for 1 Silver Coin.
// 4. Lock & Key Mechanics: Only Owner or Key-holder can open entrance doors.
// 5. Container & Chest Protection: Prevents unauthorized looting inside homes.
// ==============================================================================

const COIN_GOLD = 'lightmanscurrency:coin_gold';
const COIN_SILVER = 'lightmanscurrency:coin_silver';

const CAPITAL_ESTATES = [
    // 1. Сборные Модульные Дома (Архитектурные Типовые Проекты)
    {
        id: 'capital_modular_studio',
        name: 'Модульная Студия (1 модуль)',
        type: 'Сборный типовой дом (1 модуль, 7x7)',
        price: 15, // 15 Gold Coins
        door: { x: 28, y: 75, z: 12 },
        min: { x: 24, y: 74, z: 8 },
        max: { x: 33, y: 82, z: 17 }
    },
    {
        id: 'capital_modular_family_home',
        name: 'Семейный Дом (2 модуля)',
        type: 'Сборный двухмодульный дом с мансардой',
        price: 40, // 40 Gold Coins
        door: { x: 28, y: 75, z: 26 },
        min: { x: 23, y: 74, z: 21 },
        max: { x: 36, y: 85, z: 34 }
    },
    {
        id: 'capital_modular_manor',
        name: 'Поместье «Модульный Ансамбль» (3 модуля)',
        type: 'Сборное поместье буквой П с внутренним двориком',
        price: 100, // 100 Gold Coins
        door: { x: -28, y: 75, z: 32 },
        min: { x: -42, y: 74, z: 22 },
        max: { x: -16, y: 86, z: 46 }
    },

    // 2. Квартиры в Доходном Доме
    {
        id: 'studio_01',
        name: 'Студия «Уютный Уголок» №1',
        type: 'Доходный дом (1 этаж)',
        price: 15, // 15 Gold Coins
        door: { x: 14, y: 75, z: 12 },
        min: { x: 11, y: 74, z: 9 },
        max: { x: 19, y: 79, z: 17 }
    },
    {
        id: 'studio_02',
        name: 'Студия «Ремесленная» №2',
        type: 'Доходный дом (1 этаж)',
        price: 15,
        door: { x: 14, y: 75, z: 22 },
        min: { x: 11, y: 74, z: 19 },
        max: { x: 19, y: 79, z: 27 }
    },
    {
        id: 'two_room_01',
        name: 'Квартира «Купеческая» (2 комнаты)',
        type: 'Доходный дом (2 этаж)',
        price: 35, // 35 Gold Coins
        door: { x: 14, y: 81, z: 15 },
        min: { x: 10, y: 80, z: 9 },
        max: { x: 22, y: 86, z: 26 }
    },
    {
        id: 'luxury_penthouse',
        name: 'Пентхаус «Имперский Люкс»',
        type: 'Доходный дом (Верхний ярус с панорамой)',
        price: 75, // 75 Gold Coins
        door: { x: 14, y: 87, z: 15 },
        min: { x: 9, y: 86, z: 8 },
        max: { x: 23, y: 94, z: 27 }
    },

    // 3. Частный Сектор
    {
        id: 'cottage_river',
        name: 'Коттедж «Прибрежная Заводь»',
        type: 'Отдельный каменный коттедж',
        price: 120, // 120 Gold Coins
        door: { x: -35, y: 75, z: 25 },
        min: { x: -44, y: 73, z: 16 },
        max: { x: -27, y: 84, z: 34 }
    },
    {
        id: 'manor_sunhill',
        name: 'Дворянская Усадьба «Солнечный Холм»',
        type: 'Загородная усадьба с садом и конюшней',
        price: 250, // 250 Gold Coins
        door: { x: -50, y: 76, z: -40 },
        min: { x: -65, y: 74, z: -55 },
        max: { x: -35, y: 90, z: -25 }
    }
];

function getEstateById(id) {
    for (let e of CAPITAL_ESTATES) {
        if (e.id === id) return e;
    }
    return null;
}

function getEstateAtPos(pos) {
    if (!pos) return null;
    let px = pos.getX ? pos.getX() : pos.x;
    let py = pos.getY ? pos.getY() : pos.y;
    let pz = pos.getZ ? pos.getZ() : pos.z;

    for (let e of CAPITAL_ESTATES) {
        if (px >= e.min.x && px <= e.max.x &&
            py >= e.min.y && py <= e.max.y &&
            pz >= e.min.z && pz <= e.max.z) {
            return e;
        }
    }
    return null;
}

function getEstateDoor(server, estate) {
    if (server && server.persistentData && server.persistentData.getInt('estate_door_x_' + estate.id) !== 0) {
        return {
            x: server.persistentData.getInt('estate_door_x_' + estate.id),
            y: server.persistentData.getInt('estate_door_y_' + estate.id),
            z: server.persistentData.getInt('estate_door_z_' + estate.id)
        };
    }
    return estate.door;
}

function getEstateByDoorPos(pos, server) {
    if (!pos) return null;
    let px = pos.getX ? pos.getX() : pos.x;
    let py = pos.getY ? pos.getY() : pos.y;
    let pz = pos.getZ ? pos.getZ() : pos.z;

    for (let e of CAPITAL_ESTATES) {
        let door = (server ? getEstateDoor(server, e) : e.door);
        let dx = Math.abs(door.x - px);
        let dz = Math.abs(door.z - pz);
        let dy = py - door.y;
        // Door can be upper or lower half (dy 0 or 1)
        if (dx <= 1 && dz <= 1 && (dy >= -1 && dy <= 2)) {
            return e;
        }
    }
    return null;
}

function getEstateOwnerUUID(server, estateId) {
    return server.persistentData.getString('estate_owner_' + estateId);
}

function getEstateOwnerName(server, estateId) {
    return server.persistentData.getString('estate_owner_name_' + estateId);
}

function isPlayerKeyHolder(player, estateId) {
    if (!player) return false;

    function checkItem(stack) {
        if (!stack || stack.isEmpty() || stack.id === 'minecraft:air') return false;
        if (stack.persistentData && stack.persistentData.getString('estate_key_id') === estateId) {
            return true;
        }
        let customName = stack.getName ? stack.getName().getString() : '';
        return customName.includes('Ключ') && customName.includes(estateId);
    }

    if (checkItem(player.mainHandItem)) return true;
    if (checkItem(player.offHandItem)) return true;

    for (let i = 0; i < player.inventory.size; i++) {
        if (checkItem(player.inventory.get(i))) return true;
    }
    return false;
}

function isPlayerEstateAuthorized(player, estate) {
    if (!player || !estate) return false;
    if (player.isCreative()) return true;

    let server = player.server;
    let ownerUUID = getEstateOwnerUUID(server, estate.id);
    if (ownerUUID && ownerUUID === player.uuid.toString()) return true;

    return isPlayerKeyHolder(player, estate.id);
}

// Function accessible across all server scripts
function isInsideOwnedPlayerEstate(player, pos) {
    let estate = getEstateAtPos(pos);
    if (!estate) return false;
    return isPlayerEstateAuthorized(player, estate);
}

function createEstateKeyItem(player, estate) {
    let key = Item.of('minecraft:tripwire_hook')
        .withCustomName(Text.gold(`🔑 Ключ от Недвижимости [${estate.id}]`))
        .withLore([
            Text.yellow(`Объект: §f${estate.name}`),
            Text.aqua(`Тип: §f${estate.type}`),
            Text.green(`Законный Владелец: §f${player.username}`),
            Text.darkGray(`Координаты двери: (${estate.door.x}, ${estate.door.y}, ${estate.door.z})`),
            Text.gray(`Столица Элириума • Государственный Реестр`)
        ]);

    key.persistentData.putString('estate_key_id', estate.id);
    key.persistentData.putString('estate_owner_uuid', player.uuid.toString());
    key.persistentData.putString('estate_owner_name', player.username);
    return key;
}

// ------------------------------------------------------------------------------
// 1. LOCK & KEY MECHANIC: ENTRANCE DOORS
// ------------------------------------------------------------------------------
BlockEvents.rightClicked(event => {
    let block = event.block;
    let blockId = block.id.toString();
    if (!blockId.includes('door')) return;

    let estate = getEstateByDoorPos(block.pos, event.player.server);
    if (!estate) return;

    let player = event.player;
    let server = player.server;
    let ownerUUID = getEstateOwnerUUID(server, estate.id);
    let ownerName = getEstateOwnerName(server, estate.id);

    // Case A: Estate is UNOWNED -> Display purchase prompt
    if (!ownerUUID || ownerUUID.trim() === '') {
        event.cancel();
        player.tell(Text.gold('══════════════════════════════════════════════════════'));
        player.tell(Text.yellow(`🏛 [СТОЛИЧНАЯ НЕДВИЖИМОСТЬ: ${estate.name}]`));
        player.tell(Text.gray(`   Категория: §f${estate.type}`));
        player.tell(Text.green(`   Статус: §aСвободно для покупки!`));
        player.tell(Text.gold(`   Стоимость: §e${estate.price} Золотых Монет`));
        player.tell(Text.aqua(`   Купить: обратитесь к Нотариусу или введите §f.estate buy ${estate.id}`));
        player.tell(Text.gold('══════════════════════════════════════════════════════'));
        player.displayClientMessage(Text.of(`§e🏛 ${estate.name} — свободно для покупки! (.estate buy ${estate.id})`), true);
        server.runCommandSilent(`playsound minecraft:block.wood.hit player ${player.username} ${block.x} ${block.y} ${block.z} 0.8 1.1`);
        return;
    }

    // Case B: Estate is OWNED -> Check authorization
    if (isPlayerEstateAuthorized(player, estate)) {
        player.displayClientMessage(Text.of(`§a🔓 [Замок] Дверь открыта ключом владельца (${estate.name}).`), true);
        server.runCommandSilent(`playsound minecraft:block.iron_trapdoor.open player ${player.username} ${block.x} ${block.y} ${block.z} 0.6 1.4`);
        // Let vanilla toggle door
    } else {
        event.cancel();
        player.displayClientMessage(Text.of(`§c🔒 Заперто! Недвижимость принадлежит гражданину ${ownerName}`), true);
        server.runCommandSilent(`playsound minecraft:block.chest.locked player ${player.username} ${block.x} ${block.y} ${block.z} 1.0 0.8`);
    }
});

// ------------------------------------------------------------------------------
// 2. LIQUID & FIRE PROHIBITION IN ESTATES & CAPITAL
// ------------------------------------------------------------------------------
ItemEvents.rightClicked(event => {
    let player = event.player;
    if (!player || player.isCreative()) return;
    let item = event.item;
    if (!item) return;

    let id = item.id.toString().toLowerCase();
    let isDangerous = id.includes('lava_bucket') || id.includes('water_bucket') ||
                      id.includes('flint_and_steel') || id.includes('fire_charge');

    if (isDangerous) {
        let dim = player.level.dimension.toString();
        if (dim.includes('overworld')) {
            let dist = Math.hypot(player.x, player.z);
            if (dist <= 300 || getEstateAtPos(player.blockPosition())) {
                event.cancel();
                player.displayClientMessage(Text.of('§c⚠ [Имперская Стража] Разливать жидкости и огонь в черте Столицы строго запрещено!'), true);
                player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ~ ~ ~ 0.8 1.0`);
            }
        }
    }
});

BlockEvents.placed(event => {
    let player = event.player;
    if (!player || player.isCreative()) return;
    let block = event.block;
    let id = block.id.toString().toLowerCase();

    if (id.includes('fire') || id.includes('lava') || id.includes('water')) {
        let dim = event.level.dimension.toString();
        if (dim.includes('overworld')) {
            let dist = Math.hypot(block.x, block.z);
            if (dist <= 300 || getEstateAtPos(block.pos)) {
                event.cancel();
                player.displayClientMessage(Text.of('§c⚠ [Имперская Стража] Разливать жидкости и огонь в черте Столицы строго запрещено!'), true);
                player.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${player.username} ${block.x} ${block.y} ${block.z} 0.8 1.0`);
            }
        }
    }
});

// ------------------------------------------------------------------------------
// 3. CONTAINER & CHEST PROTECTION INSIDE PRIVATE PROPERTIES
// ------------------------------------------------------------------------------
BlockEvents.rightClicked(event => {
    let block = event.block;
    let blockId = block.id.toString();

    // Check if player is interacting with containers/safes/storage
    let isContainer = blockId.includes('chest') || blockId.includes('barrel') ||
                      blockId.includes('shulker') || blockId.includes('hopper') ||
                      blockId.includes('furnace') || blockId.includes('dispenser') ||
                      blockId.includes('dropper') || blockId.includes('storage') ||
                      blockId.includes('drawer') || blockId.includes('safe');

    if (!isContainer) return;

    let estate = getEstateAtPos(block.pos);
    if (!estate) return;

    let player = event.player;
    let server = player.server;
    let ownerUUID = getEstateOwnerUUID(server, estate.id);
    let ownerName = getEstateOwnerName(server, estate.id);

    // If owned and player is not authorized -> block chest opening!
    if (ownerUUID && ownerUUID.trim() !== '') {
        if (!isPlayerEstateAuthorized(player, estate)) {
            event.cancel();
            player.displayClientMessage(Text.of(`§c🔒 Этот сундук находится в частных владениях гражданина ${ownerName}!`), true);
            server.runCommandSilent(`playsound minecraft:block.chest.locked player ${player.username} ${block.x} ${block.y} ${block.z} 1.0 0.8`);
        }
    }
});

// ------------------------------------------------------------------------------
// 3. TRANSACTION ENGINE (BUY PROPERTY & RESTORE DUPLICATE KEY)
// ------------------------------------------------------------------------------
function buyEstate(player, estateId) {
    let estate = getEstateById(estateId);
    let server = player.server;

    if (!estate) {
        player.tell(Text.red(`[Нотариус] Недвижимость с ID "${estateId}" не найдена в реестре Столицы.`));
        return false;
    }

    let currentOwner = getEstateOwnerUUID(server, estate.id);
    if (currentOwner && currentOwner.trim() !== '') {
        let ownerName = getEstateOwnerName(server, estate.id);
        player.tell(Text.red(`[Нотариус] Данная недвижимость уже находится во владении гражданина ${ownerName}!`));
        server.runCommandSilent(`playsound minecraft:entity.villager.no player ${player.username} ~ ~ ~ 0.8 1.0`);
        return false;
    }

    let goldCount = player.inventory.count(COIN_GOLD);
    if (goldCount < estate.price) {
        player.tell(Text.red(`[Нотариус] Недостаточно средств! Стоимость: ${estate.price} Золотых Монет (у вас: ${goldCount}).`));
        server.runCommandSilent(`playsound minecraft:entity.villager.no player ${player.username} ~ ~ ~ 0.8 1.0`);
        return false;
    }

    // Deduct payment
    player.inventory.clear(Item.of(COIN_GOLD, estate.price));

    // Register ownership
    server.persistentData.putString('estate_owner_' + estate.id, player.uuid.toString());
    server.persistentData.putString('estate_owner_name_' + estate.id, player.username);

    // Issue deed key
    let keyItem = createEstateKeyItem(player, estate);
    player.give(keyItem);

    player.tell(Text.gold('═════════════════════════════════════════════════════════'));
    player.tell(Text.green(`🏛 ПОЗДРАВЛЯЕМ С ПРИОБРЕТЕНИЕМ СТОЛИЧНОЙ НЕДВИЖИМОСТИ!`));
    player.tell(Text.yellow(`   Объект: §f${estate.name}`));
    player.tell(Text.aqua(`   Категория: §f${estate.type}`));
    player.tell(Text.gold(`   Уплачено: §e${estate.price} Золотых Монет`));
    player.tell(Text.white(`   Именной Ключ Владельца выдан в ваш инвентарь.`));
    player.tell(Text.gray(`   При утере ключа вы всегда можете получить дубликат за 1 Серебряную.`));
    player.tell(Text.gold('═════════════════════════════════════════════════════════'));

    server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete player ${player.username} ~ ~ ~ 0.9 1.1`);
    server.runCommandSilent(`particle minecraft:happy_villager ${player.x} ${player.y + 1.2} ${player.z} 0.5 0.5 0.5 0.1 20`);
    return true;
}

function restoreEstateKey(player, estateId) {
    let server = player.server;
    let estate = getEstateById(estateId);

    if (!estate) {
        player.tell(Text.red(`[Нотариус] Недвижимость с ID "${estateId}" не найдена.`));
        return false;
    }

    let ownerUUID = getEstateOwnerUUID(server, estate.id);
    if (!ownerUUID || ownerUUID !== player.uuid.toString()) {
        player.tell(Text.red(`[Нотариус] Вы не являетесь зарегистрированным владельцем этого объекта!`));
        server.runCommandSilent(`playsound minecraft:entity.villager.no player ${player.username} ~ ~ ~ 0.8 1.0`);
        return false;
    }

    let silverCount = player.inventory.count(COIN_SILVER);
    if (silverCount < 1) {
        player.tell(Text.red(`[Нотариус] Изготовление дубликата ключа стоит 1 Серебряную Монету (у вас: ${silverCount}).`));
        server.runCommandSilent(`playsound minecraft:entity.villager.no player ${player.username} ~ ~ ~ 0.8 1.0`);
        return false;
    }

    // Deduct 1 Silver Coin
    player.inventory.clear(Item.of(COIN_SILVER, 1));

    // Give new key
    let keyItem = createEstateKeyItem(player, estate);
    player.give(keyItem);

    player.tell(Text.green(`[Нотариус] «Дубликат ключа от "${estate.name}" успешно изготовлен. Постарайтесь больше не терять его!»`));
    server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.6 1.3`);
    return true;
}

function printEstateCatalog(player) {
    let server = player.server;
    player.tell(Text.gold('══════════ [ ГОСУДАРСТВЕННЫЙ РЕЕСТР НЕДВИЖИМОСТИ СТОЛИЦЫ ] ══════════'));
    CAPITAL_ESTATES.forEach(e => {
        let ownerUUID = getEstateOwnerUUID(server, e.id);
        let ownerName = getEstateOwnerName(server, e.id);
        let isFree = (!ownerUUID || ownerUUID.trim() === '');
        let isMine = (ownerUUID === player.uuid.toString());

        let statusText = isFree ? '§a[СВОБОДНО]' : (isMine ? '§b[ВАША СОБСТВЕННОСТЬ]' : `§c[Владелец: ${ownerName}]`);
        player.tell(Text.of(`§6• §e${e.name} §8(${e.id}) §f— §6${e.price} Золотых §8| ${statusText}`));
    });
    player.tell(Text.gray('Команды: §f.estate buy <id> §8| §f.estate key <id> §8| §f.estate info'));
    player.tell(Text.gold('═══════════════════════════════════════════════════════════════════════'));
}

// ------------------------------------------------------------------------------
// 4. NOTARY NPC INTERACTION & COMMAND REGISTRY
// ------------------------------------------------------------------------------
ItemEvents.entityInteracted(event => {
    let target = event.target;
    if (!target) return;

    let targetName = target.name ? target.name.getString().toLowerCase() : '';
    if (targetName.includes('нотариус') || targetName.includes('управдом') || targetName.includes('риелтор') || target.tags.contains('elyrium:notary')) {
        event.cancel();
        let player = event.player;
        player.tell(Text.gold('══════════════ [ КАНЦЕЛЯРИЯ НОТАРИУСА СТОЛИЦЫ ] ══════════════'));
        player.tell(Text.of('§f«Приветствую, почтенный путник! Я заверяю купчие на недвижимость Столицы.»'));
        printEstateCatalog(player);
        player.server.runCommandSilent(`playsound minecraft:entity.villager.work_librarian player ${player.username} ~ ~ ~ 0.8 1.0`);
    }
});

// Command: /estate
ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event;

    event.register(
        Commands.literal('estate')
            .then(Commands.literal('list')
                .executes(ctx => {
                    let player = ctx.source.player;
                    if (!player) return 0;
                    printEstateCatalog(player);
                    return 1;
                })
            )
            .then(Commands.literal('info')
                .executes(ctx => {
                    let player = ctx.source.player;
                    if (!player) return 0;
                    let estate = getEstateAtPos(player.blockPosition());
                    if (!estate) {
                        player.tell(Text.yellow('[Реестр] Вы находитесь вне границ частной недвижимости Столицы.'));
                    } else {
                        let server = ctx.source.server;
                        let ownerName = getEstateOwnerName(server, estate.id) || 'Свободно';
                        player.tell(Text.gold(`[Реестр] ${estate.name} (${estate.type}). Владелец: §f${ownerName}`));
                    }
                    return 1;
                })
            )
            .then(Commands.literal('buy')
                .then(Commands.argument('id', Arguments.STRING.create(event))
                    .executes(ctx => {
                        let player = ctx.source.player;
                        if (!player) return 0;
                        let id = Arguments.STRING.getResult(ctx, 'id');
                        buyEstate(player, id);
                        return 1;
                    })
                )
            )
            .then(Commands.literal('key')
                .then(Commands.argument('id', Arguments.STRING.create(event))
                    .executes(ctx => {
                        let player = ctx.source.player;
                        if (!player) return 0;
                        let id = Arguments.STRING.getResult(ctx, 'id');
                        restoreEstateKey(player, id);
                        return 1;
                    })
                )
            )
            .then(Commands.literal('setdoor')
                .requires(src => src.hasPermission(2))
                .then(Commands.argument('id', Arguments.STRING.create(event))
                    .executes(ctx => {
                        let player = ctx.source.player;
                        if (!player) return 0;
                        let id = Arguments.STRING.getResult(ctx, 'id');
                        let estate = getEstateById(id);
                        if (!estate) {
                            player.tell(Text.red(`[Реестр] Недвижимость с ID "${id}" не найдена.`));
                            return 0;
                        }
                        let pos = player.blockPosition();
                        let server = ctx.source.server;
                        server.persistentData.putInt('estate_door_x_' + estate.id, pos.x);
                        server.persistentData.putInt('estate_door_y_' + estate.id, pos.y);
                        server.persistentData.putInt('estate_door_z_' + estate.id, pos.z);
                        player.tell(Text.green(`[Реестр] Дверь для "${estate.name}" успешно привязана к (${pos.x}, ${pos.y}, ${pos.z})!`));
                        server.runCommandSilent(`playsound minecraft:block.iron_door.open player ${player.username} ~ ~ ~ 0.8 1.2`);
                        return 1;
                    })
                )
            )
            .executes(ctx => {
                let player = ctx.source.player;
                if (!player) return 0;
                printEstateCatalog(player);
                return 1;
            })
    );
});

// Chat shortcuts: ".estate"
PlayerEvents.chat(event => {
    let msg = event.message.trim().toLowerCase();
    let parts = msg.split(' ');
    let cmd = parts[0];

    if (cmd === '.estate' || cmd === '.недвижимость') {
        event.cancel();
        let sub = parts[1] || 'list';
        let arg = parts[2];

        if (sub === 'buy' && arg) {
            buyEstate(event.player, arg);
        } else if (sub === 'key' && arg) {
            restoreEstateKey(event.player, arg);
        } else if (sub === 'setdoor' && arg && event.player.hasPermissions(2)) {
            let estate = getEstateById(arg);
            if (estate) {
                let pos = event.player.blockPosition();
                let server = event.player.server;
                server.persistentData.putInt('estate_door_x_' + estate.id, pos.x);
                server.persistentData.putInt('estate_door_y_' + estate.id, pos.y);
                server.persistentData.putInt('estate_door_z_' + estate.id, pos.z);
                event.player.tell(Text.green(`[Реестр] Дверь для "${estate.name}" привязана к (${pos.x}, ${pos.y}, ${pos.z})!`));
            }
        } else if (sub === 'info') {
            let estate = getEstateAtPos(event.player.blockPosition());
            if (!estate) {
                event.player.tell(Text.yellow('[Реестр] Вы находитесь вне границ частной недвижимости Столицы.'));
            } else {
                let ownerName = getEstateOwnerName(event.player.server, estate.id) || 'Свободно';
                event.player.tell(Text.gold(`[Реестр] ${estate.name} (${estate.type}). Владелец: §f${ownerName}`));
            }
        } else {
            printEstateCatalog(event.player);
        }
    }
});
