// ==============================================================================
// 🗺️ ELYRIUM: PROCEDURAL TOPONYMY & DYNAMIC SIGNPOST ENGINE
// ==============================================================================
// 1. Procedural Slavic-Fantasy naming for all generated villages, towers, taverns and dungeons.
// 2. Deterministic: A structure at (X, Z) ALWAYS retains the exact same name for all players.
// 3. Cinematic on-screen titles when entering a settlement, tavern, watchtower or dungeon.
// 4. Dynamic Wayfarer Signposts: Right-clicking any roadside sign reads real directions & distances!
// ==============================================================================

const SETTLEMENT_PREFIXES = ['Ветро', 'Дубо', 'Серебро', 'Ясно', 'Медо', 'Озерно', 'Камне', 'Тихо', 'Красно', 'Березо', 'Сосно', 'Злато', 'Светло', 'Вольно', 'Горно', 'Речно', 'Липо', 'Яро', 'Холмо'];
const SETTLEMENT_SUFFIXES = ['град', 'дол', 'полье', 'ручей', 'бор', 'причал', 'яры', 'устье', 'горье', 'водье', 'лесье', 'селье', 'остров'];

const TAVERN_NAMES = [
    'Таверна «Приют Скитальца»',
    'Корчма «Пьяный Гоблин»',
    'Таверна «Три Подковы»',
    'Трактир «У Старого Волка»',
    'Постоялый двор «Перекресток»',
    'Таверна «Уютный Очаг»',
    'Корчма «Дикий Кабан»',
    'Трактир «Хмельной Леший»',
    'Таверна «Седьмая Луна»',
    'Корчма «Медовый Кубок»'
];

const WATCHTOWER_NAMES = [
    'Башня Соколиного Пика',
    'Застава Черного Волка',
    'Караулка на Ветреном Перевале',
    'Орлиное Гнездо',
    'Северный Рубеж',
    'Башня Семи Ветров',
    'Дозорный Шпиль Элириума',
    'Застава Каменного Стража',
    'Бастион Стального Клыка',
    'Маяк Блуждающих Огней',
    'Башня Драконьего Взора'
];

const DUNGEON_PREFIXES = ['Цитадель', 'Катакомбы', 'Гробница', 'Чертог', 'Святилище', 'Руины', 'Бастион', 'Крипта'];
const DUNGEON_SUFFIXES = ['Забытого Пламени', 'Шепчущих Костей', 'Пепельного Короля', 'Древней Тьмы', 'Падших Рыцарей', 'Отрекшихся Магов', 'Вечного Мороза', 'Багровой Луны', 'Железного Владыки', 'Бездны'];

function getCoordHash(x, z) {
    let chunkX = Math.floor(x / 16);
    let chunkZ = Math.floor(z / 16);
    let hash = (chunkX * 73856093) ^ (chunkZ * 19349663);
    return Math.abs(hash);
}

function getStructureMeta(structId, x, z) {
    let id = structId.toLowerCase();
    let hash = getCoordHash(x, z);

    // 1. Taverns & Pubs
    if (id.includes('pub') || id.includes('tavern') || id.includes('inn') || id.includes('bathhouse')) {
        let name = TAVERN_NAMES[hash % TAVERN_NAMES.length];
        return { name: name, subtitle: 'Придорожный приют • Оазис тепла и сытной похлебки', type: 'tavern' };
    }

    // 2. Watchtowers & Outposts
    if (id.includes('totw_modded:') || id.includes('outpost') || id.includes('tower') || id.includes('fort') || id.includes('camp')) {
        let name = WATCHTOWER_NAMES[hash % WATCHTOWER_NAMES.length];
        return { name: name, subtitle: 'Дозорный рубеж • На страже мирных земель', type: 'tower' };
    }

    // 3. Villages & Settlements
    if (id.includes('village') || id.includes('ctov:') || id.includes('minecolonies:')) {
        let p = SETTLEMENT_PREFIXES[hash % SETTLEMENT_PREFIXES.length];
        let s = SETTLEMENT_SUFFIXES[(hash >> 4) % SETTLEMENT_SUFFIXES.length];
        let townName = p + s;
        return { name: townName, subtitle: 'Вольное торговое поселение • Безопасная зона', type: 'village' };
    }

    // 4. Major Dungeons & Cataclysm
    if (id.includes('cataclysm:') || id.includes('dungeons_arise:') || id.includes('irons_spellbooks:')) {
        let p = DUNGEON_PREFIXES[hash % DUNGEON_PREFIXES.length];
        let s = DUNGEON_SUFFIXES[(hash >> 3) % DUNGEON_SUFFIXES.length];
        let dungeonName = `${p} ${s}`;
        return { name: dungeonName, subtitle: 'Древнее подземелье • Смертельная угроза', type: 'dungeon' };
    }

    return null;
}

function getCompassDirection(dx, dz) {
    let angle = Math.atan2(dz, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    if (angle >= 337.5 || angle < 22.5) return 'Восток [В] ➔';
    if (angle >= 22.5 && angle < 67.5) return 'Юго-Восток [Ю-В] ↘';
    if (angle >= 67.5 && angle < 112.5) return 'Юг [Ю] ⬇';
    if (angle >= 112.5 && angle < 157.5) return 'Юго-Запад [Ю-З] ↙';
    if (angle >= 157.5 && angle < 202.5) return 'Запад [З] ⬅';
    if (angle >= 202.5 && angle < 247.5) return 'Северо-Запад [С-З] ↖';
    if (angle >= 247.5 && angle < 292.5) return 'Север [С] ⬆';
    return 'Северо-Восток [С-В] ↗';
}

// ==============================================================================
// 1. CINEMATIC DISCOVERY TITLE TRIGGER (Every 20 ticks / 1 second)
// ==============================================================================
PlayerEvents.tick(event => {
    let player = event.player;
    if (player.age % 20 !== 0) return;

    let level = player.level;
    let pos = player.blockPosition();

    try {
        let structureManager = level.asKubeJS().minecraftLevel.structureManager();
        if (!structureManager) return;

        let structureStart = structureManager.getStructureWithPieceAt(pos);
        if (!structureStart || !structureStart.isValid()) {
            player.persistentData.remove('skd_current_structure_loc');
            return;
        }

        let structId = structureStart.getStructure().toString();
        let box = structureStart.getBoundingBox();
        let centerKey = `${box.minX()}_${box.minZ()}`;

        let lastLoc = player.persistentData.getString('skd_current_structure_loc');
        if (lastLoc === centerKey) return; // Already discovered / currently inside

        player.persistentData.putString('skd_current_structure_loc', centerKey);

        let meta = getStructureMeta(structId, box.minX(), box.minZ());
        if (!meta) return;

        // Cinematic display
        if (meta.type === 'village') {
            player.sendTitle(Text.gold(`§l${meta.name}`), Text.yellow(meta.subtitle), 10, 70, 20);
            player.server.runCommandSilent(`playsound minecraft:block.bell.resonate ambient ${player.username} ~ ~ ~ 0.8 1.1`);
        } else if (meta.type === 'tavern') {
            player.sendTitle(Text.yellow(`§l${meta.name}`), Text.gold(meta.subtitle), 10, 60, 20);
            player.server.runCommandSilent(`playsound minecraft:item.goat_horn.sound.0 ambient ${player.username} ~ ~ ~ 0.6 1.4`);
        } else if (meta.type === 'tower') {
            player.sendTitle(Text.aqua(`§l${meta.name}`), Text.gray(meta.subtitle), 10, 60, 20);
            player.server.runCommandSilent(`playsound minecraft:entity.experience_orb.pickup ambient ${player.username} ~ ~ ~ 0.7 0.8`);
        } else if (meta.type === 'dungeon') {
            player.sendTitle(Text.darkRed(`§l⚠ ${meta.name}`), Text.red(meta.subtitle), 15, 80, 25);
            player.server.runCommandSilent(`playsound minecraft:entity.warden.heartbeat hostile ${player.username} ~ ~ ~ 1.0 0.8`);
        }
    } catch (e) {}
});

// ==============================================================================
// 2. DYNAMIC SIGNPOST INTERACTION (Right-click any sign / road marker)
// ==============================================================================
BlockEvents.rightClicked(event => {
    let block = event.block;
    let blockId = block.id;

    // Check if player clicked a sign or hanging sign
    if (!blockId.includes('sign')) return;

    let player = event.player;
    let level = event.level;
    let pos = block.pos;

    try {
        let mcLevel = level.asKubeJS().minecraftLevel;
        let pPos = new BlockPos(pos.x, pos.y, pos.z);

        // Find nearest village
        let villageTag = ResourceLocation.parse('minecraft:village');
        let nearestVillage = mcLevel.findNearestMapStructure(villageTag, pPos, 100, false);

        player.server.runCommandSilent(`playsound minecraft:item.book.page_turn player ${player.username} ${pos.x} ${pos.y} ${pos.z} 1.0 1.0`);
        player.tell(Text.of('§6📜 [Путевой Указатель] §7Вы внимательно изучаете старые дорожные зарубки:'));

        if (nearestVillage) {
            let vPos = nearestVillage.getFirst();
            let dx = vPos.getX() - pos.x;
            let dz = vPos.getZ() - pos.z;
            let dist = Math.round(Math.sqrt(dx * dx + dz * dz));
            let dir = getCompassDirection(dx, dz);
            let meta = getStructureMeta('ctov:village', vPos.getX(), vPos.getZ());
            let vName = meta ? meta.name : 'Торговое Поселение';

            player.tell(Text.of(` §e➔ §6${vName} §7— расстояние §f~${dist}м§7, направление: §b${dir}`));
        } else {
            player.tell(Text.of(' §7➔ Дорог к крупным городам поблизости не отмечено...'));
        }

        // Show player current zone / sector
        let distFromSpawn = Math.round(Math.sqrt(pos.x * pos.x + pos.z * pos.z));
        let sector = distFromSpawn < 1500 ? 'Сектор I (Мирные Земли)' : (distFromSpawn < 4000 ? 'Сектор II (Земли Рубежа)' : 'Сектор III (Дикие Земли)');
        player.displayClientMessage(Text.of(`§7Удаленность от Столицы: §f${distFromSpawn}м §8| §e${sector}`), true);

    } catch (e) {
        player.tell(Text.of('§7Надписи на указателе стерты бурями и временем...'));
    }
});
