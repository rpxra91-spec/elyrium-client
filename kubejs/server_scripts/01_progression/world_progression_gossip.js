// ==============================================================================
// 🌍 ELYRIUM: LIVING WORLD PROGRESSION, RUMORS & GOSSIP ENGINE (PHASE 7.4)
// ==============================================================================
// 1. Dynamic NPC Dialogues: Guards and Innkeepers react to player's current Tier.
// 2. Tavern Gossip & Rumor System: Innkeepers share regional lore, boss locations,
//    and world events upon interaction.
// 3. Blacksmith Anvil Repair & Trade: Repairs held damaged item for 2 Gold Coins.
// 4. Saluting Guard Patrols: Nearby guards acknowledge high-tier heroes.
// ==============================================================================

const GOSSIP_DATABASE = {
    tier1: [
        '§e[Трактирщик] §f«Говорят, в древних курганах на западе видели оживших мертвецов в истлевших доспехах... Осторожнее на старом тракте.»',
        '§e[Трактирщик] §f«Если собираешься за Великую Стену, проверь запас факелов и стрел. Ночью на пустошах воют не простые волки.»',
        '§e[Трактирщик] §f«Горячая похлебка и кружка эля на втором этаже быстро поставят на ноги любого путника!»'
    ],
    tier2: [
        '§e[Трактирщик] §f«Весь тракт гудит! Говорят, кто-то сокрушил древнего Стража у Первого Рубежа! Не твоя ли работа?»',
        '§e[Трактирщик] §f«Караваны из Второго Сектора доносят, что в глубоких разломах находят залежи титановой руды и кобальта.»',
        '§e[Трактирщик] §f«Один бродячий охотник клянется, что видел гигантского Левиафана в затопленных каньонах... Жуткое зрелище.»'
    ],
    tier3: [
        '§e[Трактирщик] §f«Воздух с юга пахнет серой и гарью... Небось Инфернальный Разлом снова начинает тлеть.»',
        '§e[Трактирщик] §f«Кузнецы в Столице наконец научились ковать сплавы Незерита. Говорят, без огненного праха к их горнам не подойти.»',
        '§e[Трактирщик] §f«Если пойдешь в Нижний Мир, возьми с собой свиток экстренного побега. Оттуда мало кто возвращается пешком.»'
    ],
    tier4: [
        '§e[Трактирщик] §f«Слава Защитникам! Огненные титаны Cataclysm повержены, и небо над Стенной Заставой снова чистое!»',
        '§e[Трактирщик] §f«Звездочеты шепчутся, что врата в Небесный Эфир начали вибрировать в унисон с лунным циклом...»'
    ]
};

function getPlayerTier(player) {
    if (!player) return 1;
    return Math.max(1, player.persistentData.getInt('elyrium_progression_tier') || 1);
}

// ------------------------------------------------------------------------------
// 1. NPC INTERACTION: DIALOGUES, GOSSIP & SERVICES
// ------------------------------------------------------------------------------
ItemEvents.entityInteracted(event => {
    let player = event.player;
    let target = event.target;
    let hand = event.hand;

    if (hand.toString() !== 'MAIN_HAND' || !target || !target.isLiving()) return;

    let targetName = target.customName ? target.customName.string.toLowerCase() : '';
    let targetType = target.type.toString().toLowerCase();

    let tier = getPlayerTier(player);

    // --- A. ТРАКТИРЩИК / INNKEEPER ---
    if (targetName.includes('трактир') || targetName.includes('innkeeper') || target.tags.contains('elyrium:innkeeper')) {
        event.cancel();

        let pool = GOSSIP_DATABASE['tier' + Math.min(tier, 4)] || GOSSIP_DATABASE.tier1;
        let gossip = pool[Math.floor(Math.random() * pool.length)];

        player.displayClientMessage(Text.of(gossip), false);
        player.server.runCommandSilent(`playsound minecraft:entity.villager.trade player ${player.username} ~ ~ ~ 0.8 1.0`);
        return;
    }

    // --- B. КУЗНЕЦ / BLACKSMITH REPAIR SERVICE ---
    if (targetName.includes('кузнец') || targetName.includes('blacksmith') || target.tags.contains('elyrium:blacksmith')) {
        event.cancel();

        let heldItem = player.mainHandItem;
        if (!heldItem || heldItem.isEmpty() || !heldItem.isDamaged()) {
            player.displayClientMessage(Text.of('§6[Кузнец] §f«Здравствуй, путник! Держи поврежденное оружие или доспех в руке, и за 2 Золотые Монеты я починю его до блеска!»'), true);
            player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.5 1.4`);
            return;
        }

        // Check for 2 Gold Coins (elyrium:gold_coin or lightmanscurrency:coin_gold)
        let coinItem = 'lightmanscurrency:coin_gold';
        let coinCount = player.inventory.count(coinItem);

        if (coinCount >= 2) {
            player.inventory.clear(Item.of(coinItem, 2));
            heldItem.damageValue = 0; // Completely repaired!

            player.displayClientMessage(Text.of('§a[Кузнец] §f«Готово! Твой клинок снова как новый. Береги его в бою!»'), true);
            player.server.runCommandSilent(`playsound minecraft:block.anvil.place player ${player.username} ~ ~ ~ 0.8 1.0`);
            player.server.runCommandSilent(`particle minecraft:crit ${target.x} ${target.y + 1.2} ${target.z} 0.3 0.3 0.3 0.2 15`);
        } else {
            player.displayClientMessage(Text.of('§c[Кузнец] §f«Для починки нужно 2 Золотые Монеты! У тебя не хватает золота.»'), true);
            player.server.runCommandSilent(`playsound minecraft:entity.villager.no player ${player.username} ~ ~ ~ 0.8 1.0`);
        }
        return;
    }

    // --- C. СТРАЖНИК ДОЗОРА / OUTPOST GUARD ---
    if (targetName.includes('страж') || targetName.includes('дозор') || targetName.includes('guard') || target.tags.contains('elyrium:guard')) {
        event.cancel();

        if (tier === 1) {
            player.displayClientMessage(Text.of('§b[Страж Ворот] §f«Держи оружие в ножнах на заставе. За пределами Стены бродят древние чудовища, путник.»'), true);
        } else if (tier === 2) {
            player.displayClientMessage(Text.of('§a[Страж Ворот] §f«Честь и слава Победителю Стража! Тракт до Второго Сектора теперь патрулируется нашими отрядами.»'), true);
        } else {
            player.displayClientMessage(Text.of('§6[Страж Ворот] §f«Приветствуем героя Империи! Ворота открыты перед тобой в любое время суток!»'), true);
        }

        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.1`);
        return;
    }
});

// ------------------------------------------------------------------------------
// 2. AMBIENT GUARD SALUTES FOR HIGH-TIER PLAYERS (Every 100 ticks / 5 seconds)
// ------------------------------------------------------------------------------
PlayerEvents.tick(event => {
    let player = event.player;
    if (player.age % 100 !== 0) return;

    let tier = getPlayerTier(player);
    if (tier < 2) return; // Only salute heroes who unlocked Tier 2+

    let level = player.level;
    let guards = level.getEntitiesWithin(AABB.of(player.x - 6, player.y - 3, player.z - 6, player.x + 6, player.y + 3, player.z + 6));

    for (let ent of guards) {
        if (!ent || !ent.isLiving()) continue;
        let name = ent.customName ? ent.customName.string.toLowerCase() : '';
        if (ent.tags.contains('elyrium:guard') || name.includes('страж') || name.includes('дозор')) {
            // Random chance to salute
            if (Math.random() < 0.25) {
                player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ${ent.x} ${ent.y} ${ent.z} 0.6 1.2`);
                player.displayClientMessage(Text.of('§7*Дозорный гарнизона отдает вам воинское приветствие*'), true);
                break;
            }
        }
    }
});
