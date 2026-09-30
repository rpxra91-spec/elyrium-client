// ==============================================================================
// 🛠️ ELYRIUM RPG: WEAPONMASTER'S BENCH GUI & CHISEL SOCKET PUNCHING ENGINE
// Minecraft 1.21.1 NeoForge | KubeJS Server Script (v1.1)
// ==============================================================================
// Premier 4-row RPG Interface for Weaponmaster's Bench:
// - Slot I: Main Weapon Slot with In-World 3D Display sync.
// - Slot 1: Innate / Primary Martial Art (ПКМ / Shift+ПКМ со щитом).
// - Slot 2: Secondary Martial Art (Tier 4+ Nether era).
// - Slot 3: Tertiary Martial Art (Tier 7+ Astral era).
// - Slot 4: Elemental Infusion (Fire, Frost, Lightning, Shadow, Holy).
// - Slot 5: Apotheosis Gem (Ruby, Sapphire, Emerald, Diamond, Amethyst, Opal, Topaz, Onyx, Amber, Luminarite).
// - Chisel & Socket Punching: 100% guaranteed master crafting with Weaponmaster's
//   Chisel (kubejs:weapon_chisel) and Tier Ingot (Netherite/Cinder for Slot 2,
//   Starlight/Luminite for Slot 3) without weapon breakage or RNG.
// ==============================================================================

var WB_SocketHelper = null;
var WB_SocketedGems = null;
try {
    WB_SocketHelper = Java.loadClass('dev.shadowsoffire.apotheosis.socket.SocketHelper');
    WB_SocketedGems = Java.loadClass('dev.shadowsoffire.apotheosis.socket.SocketedGems');
} catch (e) {
    console.error('[WeaponBench] Failed to load Apotheosis SocketHelper/SocketedGems: ' + e);
}

// Таблица названий и архетипов Боевых Искусств
const WB_ART_INFO = {
    'whirlwind_cleave': { name: 'Вихревой Размах', archetype: 'heavy', desc: 'Круговой клив на 360° (180% урона, отбрасывание)' },
    'earth_sunder': { name: 'Сотрясение Земли', archetype: 'heavy', desc: 'Радиальная волна на 5м (200% урона, Замедление IV)' },
    'severing_cleave': { name: 'Рассекающий Клив', archetype: 'heavy', desc: 'Фронтальный клив (210% урона, обход 40% брони)' },
    'iai_slash': { name: 'Фантомный Выпад (Иай)', archetype: 'finesse', desc: 'Рывок на 6 блоков (190% урона, кровотечение)' },
    'crushing_uppercut': { name: 'Сокрушительный Апперкот', archetype: 'bludgeoning', desc: 'Удар снизу-вверх: запуск цели на 4м, стан 2с' },
    'piercing_thrust': { name: 'Бронебойный Прокол', archetype: 'finesse', desc: 'Выпад на 5.5 блоков со 100% игнорированием брони' },
    'scissor_cross': { name: 'Ножницы', archetype: 'daggers', desc: 'Парный удар: 2x 110% урона + Глубокие Раны' },
    'shadow_step': { name: 'Теневой Шаг', archetype: 'daggers', desc: 'Смещение за спину (5.5б), невидимость и 100% крит' },
    'reverse_sunder': { name: 'Реверсивный Раскол', archetype: 'any', desc: 'Возвратный взмах: 195% урона, сбивает блок щита' },
    'fan_barrage': { name: 'Веерный Залп', archetype: 'ranged', desc: 'Выпуск 5 стрел широким веером' },
    'piercing_shot': { name: 'Бронебойный Выстрел', archetype: 'ranged', desc: 'Стрела со 100% пробитием брони и препятствий' },
    'arrow_rain': { name: 'Град Стрел', archetype: 'ranged', desc: 'Ливень стрел по площади 6x6 блоков' },
    'tactical_backstep': { name: 'Тактический Отскок', archetype: 'ranged', desc: 'Отскок назад на 6м с выстрелом' },
    'triple_shot': { name: 'Беглая Тройка', archetype: 'ranged', desc: 'Три скорострельные стрелы подряд' },
    'shield_bash': { name: 'Таранный Натиск', archetype: 'shield', desc: 'Таран на 5м с оглушением на 2с' },
    'unwavering_bulwark': { name: 'Непоколебимый Оплот', archetype: 'shield', desc: 'Абсолютная защита и сопротивление отбрасыванию' },
    'flame_vortex': { name: 'Пламенный Вихрь', archetype: 'any', desc: 'Огненный смерч: 190% урона огнем + поджог' },
    'frost_stomp': { name: 'Ледяная Поступь', archetype: 'any', desc: 'Конус льда: 185% урона холодом + Заморозка' },
    'lightning_smite': { name: 'Громовой Раскат', archetype: 'any', desc: 'Нисходящая молния: 200% урона молнией' },
    'blood_harvest': { name: 'Кровавая Жатва', archetype: 'any', desc: 'Рассечение: 195% урона + вампиризм 20%' },
    'holy_blade': { name: 'Священный Клинок', archetype: 'any', desc: 'Святой удар: 210% урона по нежити' }
};

const WB_ELEMENTAL_STONES = {
    'kubejs:elemental_stone_fire': { elem: 'fire', name: 'Пламя', color: '§c', desc: '25-30% конверсия в урон Огнем' },
    'kubejs:elemental_stone_frost': { elem: 'frost', name: 'Лед', color: '§b', desc: '25-30% конверсия в урон Холодом' },
    'kubejs:elemental_stone_lightning': { elem: 'lightning', name: 'Молния', color: '§e', desc: '25-30% конверсия в урон Молнией' },
    'kubejs:elemental_stone_shadow': { elem: 'shadow', name: 'Бездна', color: '§5', desc: '25-30% конверсия в урон Тьмой' },
    'kubejs:elemental_stone_holy': { elem: 'holy', name: 'Святость', color: '§6', desc: '25-30% конверсия в урон Святостью' }
};

const ROMAN_NUMS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

// Активные сессии игроков
let activeBenchSessions = new Map();

function getOrCreateBenchSession(player, blockPos) {
    let uuid = player.uuid.toString();
    if (!activeBenchSessions.has(uuid)) {
        activeBenchSessions.set(uuid, {
            equipment: null,
            chisel: null,
            tierMaterial: null,
            benchPos: blockPos || null,
            refreshingTime: 0
        });
    } else if (blockPos) {
        let sess = activeBenchSessions.get(uuid);
        sess.benchPos = blockPos;
    }
    return activeBenchSessions.get(uuid);
}

function clearAndRefundBenchSession(player, force) {
    let uuid = player.uuid.toString();
    let session = activeBenchSessions.get(uuid);
    if (!session) return;

    if (!force && session.refreshingTime && (Date.now() - session.refreshingTime < 350)) {
        return;
    }

    // Возврат резца и тирового материала игроку
    if (session.chisel && !session.chisel.isEmpty()) {
        player.give(session.chisel);
        session.chisel = null;
    }
    if (session.tierMaterial && !session.tierMaterial.isEmpty()) {
        player.give(session.tierMaterial);
        session.tierMaterial = null;
    }

    // Если меню было открыто не через физический блок, оружие возвращается в инвентарь
    if (!session.benchPos && session.equipment && !session.equipment.isEmpty()) {
        player.give(session.equipment);
        session.equipment = null;
    }

    activeBenchSessions.delete(uuid);
}

// ------------------------------------------------------------------------------
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ КЛАССИФИКАЦИИ И NBT
// ------------------------------------------------------------------------------

function isWeaponItem(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = String(item.id).toLowerCase();
    if (item.hasTag('c:tools/melee_weapon') || item.hasTag('minecraft:swords') ||
        item.hasTag('c:swords') || item.hasTag('c:tools/swords') ||
        item.hasTag('minecraft:axes') || item.hasTag('c:tools/axes') ||
        item.hasTag('c:tools/bows') || item.hasTag('c:tools/crossbows') ||
        item.hasTag('minecraft:bows') || item.hasTag('c:tools/daggers') ||
        item.hasTag('c:tools/maces') || item.hasTag('c:tools/hammers') ||
        item.hasTag('c:tools/shields') || item.hasTag('c:shields') ||
        item.hasTag('minecraft:shields')) {
        return true;
    }
    return id.includes('sword') || id.includes('blade') || id.includes('claymore') ||
           id.includes('greatsword') || id.includes('katana') || id.includes('dagger') ||
           id.includes('hammer') || id.includes('spear') || id.includes('halberd') ||
           id.includes('greataxe') || id.includes('axe') || id.includes('bow') ||
           id.includes('crossbow') || id.includes('mace') || id.includes('club') ||
           id.includes('scythe') || id.includes('rapier') || id.includes('saber') ||
           id.includes('shield');
}

function getWeaponProgressionTier(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return 1;
    for (let t = 11; t >= 1; t--) {
        if (item.hasTag(`skd:tier_${t}`) || item.hasTag(`c:tools/tier_${t}`)) return t;
    }
    try {
        let tag = getSafeItemCustomData(item);
        if (tag && tag.contains('skd_tier')) {
            return tag.getInt('skd_tier') || 1;
        }
    } catch (e) {}

    let id = String(item.id).toLowerCase();
    if (id.includes('mortum') || id.includes('divinerpg:mortum') || id.includes('the_incinerator') || id.includes('aquatooth') || id.includes('halite')) return 11;
    if (id.includes('apalachia') || id.includes('skythern') || id.includes('divinerpg:apalachia') || id.includes('divinerpg:skythern')) return 10;
    if (id.includes('eden') || id.includes('wildwood') || id.includes('divinerpg:eden') || id.includes('divinerpg:wildwood')) return 9;
    if (id.includes('sculk') || id.includes('echo') || id.includes('warden') || id.startsWith('deeperdarker:')) return 8;
    if (id.includes('starlight') || id.includes('luminite') || id.startsWith('eternal_starlight:') || id.includes('thermal_springstone')) return 7;
    if (id.includes('dragon') || id.includes('void') || id.includes('ender_guardian') || id.includes('ender_golem') || id.includes('elytra')) return 6;
    if (id.includes('gravitite') || id.includes('zanite') || id.includes('valkyrie') || id.includes('skyjade') || id.startsWith('aether:')) return 5;
    if (id.includes('cinder') || id.includes('netherite') || id.includes('ignitium') || id.includes('monstrosity')) return 4;
    if (id.includes('diamond') || id.includes('cobalt') || id.includes('rune') || (id.includes('iron') && !id.includes('crude'))) return 3;
    if (id.includes('copper') || id.includes('bronze') || id.includes('silver') || id.includes('flint')) return 2;
    return 1;
}

function getSafeItemCustomData(item) {
    if (!item || item.isEmpty()) return null;
    try {
        if (item.customData) return item.customData;
        if (item.getCustomData) return item.getCustomData();
        if (item.nbt) return item.nbt;
    } catch (e) {}
    try {
        let DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents');
        let cd = item.get(DataComponents.CUSTOM_DATA);
        if (cd) return cd.copyTag();
    } catch (e2) {}
    return null;
}

function saveSafeItemCustomData(item, tag) {
    if (!item || item.isEmpty() || !tag) return;
    try {
        let DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents');
        let CustomData = Java.loadClass('net.minecraft.world.item.component.CustomData');
        item.set(DataComponents.CUSTOM_DATA, CustomData.of(tag));
    } catch (e) {
        try {
            if (item.setCustomData) item.setCustomData(tag);
        } catch (e2) {}
    }
}

function getOrCreateSafeCustomData(item) {
    if (!item || item.isEmpty()) return null;
    let tag = getSafeItemCustomData(item);
    if (tag) return tag;
    try {
        let CompoundTag = Java.loadClass('net.minecraft.nbt.CompoundTag');
        tag = new CompoundTag();
        saveSafeItemCustomData(item, tag);
        return tag;
    } catch (e) {}
    return null;
}

function getReinforceLevel(item) {
    let tag = getSafeItemCustomData(item);
    if (tag && tag.contains('skd_reinforce')) return tag.getInt('skd_reinforce') || 0;
    return 0;
}

function getSocketCount(item) {
    let tag = getSafeItemCustomData(item);
    if (!tag) return 0;
    if (tag.contains('skd_sockets')) return tag.getInt('skd_sockets') || 0;
    let count = 0;
    if (tag.getBoolean('skd_socket_2') || tag.getInt('skd_socket_2') > 0) count = 1;
    if (tag.getBoolean('skd_socket_3') || tag.getInt('skd_socket_3') > 0) count = 2;
    return count;
}

function hasSocket2(item) {
    let tag = getSafeItemCustomData(item);
    if (!tag) return false;
    if (tag.contains('skd_sockets') && tag.getInt('skd_sockets') >= 1) return true;
    return tag.getBoolean('skd_socket_2') || tag.getInt('skd_socket_2') > 0;
}

function hasSocket3(item) {
    let tag = getSafeItemCustomData(item);
    if (!tag) return false;
    if (tag.contains('skd_sockets') && tag.getInt('skd_sockets') >= 2) return true;
    return tag.getBoolean('skd_socket_3') || tag.getInt('skd_socket_3') > 0;
}

function getWeaponArtInSlot(item, slotNum) {
    let tag = getSafeItemCustomData(item);
    if (!tag) return null;
    let key = 'skd_art_' + slotNum;
    if (tag.contains(key)) {
        let a = String(tag.getString(key)).trim().toLowerCase();
        if (a && a.length > 0) return a;
    }
    // Обратная совместимость для слота 1 и 2
    if (slotNum === 1 && tag.contains('skd_weapon_art')) {
        let a = String(tag.getString('skd_weapon_art')).trim().toLowerCase();
        if (a && a.length > 0) return a;
    }
    if (slotNum === 2 && tag.contains('elyrium_inscribed_art')) {
        let a = String(tag.getString('elyrium_inscribed_art')).trim().toLowerCase();
        if (a && a.length > 0) return a;
    }
    return null;
}

function getWeaponArtRankInSlot(item, slotNum) {
    let tag = getSafeItemCustomData(item);
    if (!tag) return 1;
    let key = 'skd_art_' + slotNum + '_rank';
    if (tag.contains(key)) return Math.max(1, Math.min(5, tag.getInt(key) || 1));
    if (slotNum === 1 && tag.contains('skd_art_rank')) return Math.max(1, Math.min(5, tag.getInt('skd_art_rank') || 1));
    return 1;
}

function getElementalInfusion(item) {
    let tag = getSafeItemCustomData(item);
    if (!tag) return null;
    if (tag.contains('skd_elemental_infusion')) {
        let elem = String(tag.getString('skd_elemental_infusion')).trim().toLowerCase();
        if (elem && elem.length > 0) return elem;
    }
    return null;
}

function isTier4SocketMaterial(item) {
    if (!item || item.isEmpty()) return false;
    let id = String(item.id).toLowerCase();
    return id === 'minecraft:netherite_ingot' ||
           id === 'skd:cinder_alloy_ingot' ||
           id === 'kubejs:ascension_catalyst_t4' ||
           id === 'minecraft:netherite_scrap';
}

function isTier7SocketMaterial(item) {
    if (!item || item.isEmpty()) return false;
    let id = String(item.id).toLowerCase();
    return id === 'eternal_starlight:aethersent_ingot' ||
           id === 'eternal_starlight:golem_steel_ingot' ||
           id === 'eternal_starlight:deepsilver_ingot' ||
           id === 'eternal_starlight:red_starlight_crystal_shard' ||
           id === 'eternal_starlight:blue_starlight_crystal_shard' ||
           id === 'kubejs:ascension_catalyst_t7' ||
           id.includes('luminite') ||
           id.includes('starlight');
}

function isMartialTablet(item) {
    if (!item || item.isEmpty()) return false;
    return String(item.id).startsWith('kubejs:martial_tablet_');
}

function extractTabletArtId(tabletItem) {
    if (!tabletItem || tabletItem.isEmpty()) return null;
    let id = String(tabletItem.id).replace('kubejs:martial_tablet_', '').replace('kubejs:', '').trim();
    // Маппинг суффиксов к ID боевых искусств
    const MAP = {
        'whirlwind': 'whirlwind_cleave',
        'earth_sunder': 'earth_sunder',
        'severing_cleave': 'severing_cleave',
        'lightning_thrust': 'iai_slash',
        'crushing_uppercut': 'crushing_uppercut',
        'piercing_thrust': 'piercing_thrust',
        'scissor_cross': 'scissor_cross',
        'shadow_step': 'shadow_step',
        'reverse_sunder': 'reverse_sunder',
        'arrow_barrage': 'fan_barrage',
        'piercing_shot': 'piercing_shot',
        'arrow_rain': 'arrow_rain',
        'tactical_backstep': 'tactical_backstep',
        'triple_shot': 'triple_shot',
        'juggernaut': 'shield_bash',
        'unwavering_bulwark': 'unwavering_bulwark',
        'flame_vortex': 'flame_vortex',
        'frost_stomp': 'frost_stomp',
        'lightning_smite': 'lightning_smite',
        'blood_rend': 'blood_harvest',
        'holy_blade': 'holy_blade'
    };
    return MAP[id] || id;
}

function extractTabletRank(tabletItem) {
    if (!tabletItem || tabletItem.isEmpty()) return 1;
    let tag = getSafeItemCustomData(tabletItem);
    if (tag && tag.contains('skd_art_rank')) {
        return Math.max(1, Math.min(5, tag.getInt('skd_art_rank') || 1));
    }
    return 1;
}

// ------------------------------------------------------------------------------
// СИСТЕМА ФИЗИЧЕСКОГО 3D OTOБРАЖЕНИЯ ОРУЖИЯ В МИРЕ (IN-WORLD 3D DISPLAY)
// ------------------------------------------------------------------------------

function getBenchPosKey(pos) {
    if (!pos) return null;
    return `${pos.dim}_${pos.x}_${pos.y}_${pos.z}`;
}

function getStoredBenchWeapon(level, pos) {
    if (!level || !pos) return null;
    let root = level.persistentData.getCompound('weapon_bench_storage');
    let key = getBenchPosKey(pos);
    if (!root || !root.contains(key)) return null;
    try {
        let itemTag = root.getCompound(key);
        let ItemStackClass = Java.loadClass('net.minecraft.world.item.ItemStack');
        let levelHolder = level.minecraftLevel ? level.minecraftLevel.registryAccess() : null;
        if (levelHolder && ItemStackClass.parseOptional) {
            let nmsStack = ItemStackClass.parseOptional(levelHolder, itemTag);
            if (nmsStack && !nmsStack.isEmpty()) {
                return Item.of(nmsStack);
            }
        }
    } catch (e) {}
    return null;
}

function setStoredBenchWeapon(level, pos, weaponItem) {
    if (!level || !pos) return;
    let root = level.persistentData.getCompound('weapon_bench_storage');
    if (!root) {
        let CompoundTag = Java.loadClass('net.minecraft.nbt.CompoundTag');
        root = new CompoundTag();
        level.persistentData.put('weapon_bench_storage', root);
    }
    let key = getBenchPosKey(pos);
    if (!weaponItem || weaponItem.isEmpty() || weaponItem.id === 'minecraft:air') {
        root.remove(key);
    } else {
        try {
            let levelHolder = level.minecraftLevel ? level.minecraftLevel.registryAccess() : null;
            let nmsStack = weaponItem.itemStack || weaponItem;
            if (levelHolder && nmsStack.saveOptional) {
                let saved = nmsStack.saveOptional(levelHolder);
                root.put(key, saved);
            }
        } catch (e) {}
    }
}

function clearBenchWorldDisplay(level, pos) {
    if (!level || !pos) return;
    let server = level.server;
    if (!server) return;
    let tag = `wb_disp_${pos.x}_${pos.y}_${pos.z}`;
    server.runCommandSilent(`execute in ${pos.dim} run kill @e[type=minecraft:item_display,tag=${tag}]`);
}

function updateBenchWorldDisplay(level, pos, weaponItem) {
    if (!level || !pos) return;
    clearBenchWorldDisplay(level, pos);
    if (!weaponItem || weaponItem.isEmpty() || weaponItem.id === 'minecraft:air') return;

    let server = level.server;
    if (!server) return;

    let bx = pos.x;
    let by = pos.y;
    let bz = pos.z;
    let dim = pos.dim;
    let facing = pos.facing || 'NORTH';

    // Вычисляем угол поворота по горизонтали стола
    let yaw = 0;
    if (facing === 'SOUTH') yaw = 180;
    else if (facing === 'WEST') yaw = 270;
    else if (facing === 'EAST') yaw = 90;

    let tag = `wb_disp_${bx}_${by}_${bz}`;
    let posX = (bx + 0.5).toFixed(3);
    let posY = (by + 1.015).toFixed(3);
    let posZ = (bz + 0.5).toFixed(3);

    // 1. Попытка нативного спавна через NeoForge Display$ItemDisplay
    let spawned = false;
    try {
        let EntityType = Java.loadClass('net.minecraft.world.entity.EntityType');
        let mcLevel = level.minecraftLevel || level;
        let display = EntityType.ITEM_DISPLAY.create(mcLevel);
        if (display) {
            display.setPos(bx + 0.5, by + 1.015, bz + 0.5);
            display.setYRot(yaw);
            display.setXRot(90.0);
            display.addTag('weapon_bench_display');
            display.addTag(tag);

            let ItemDisplayContext = Java.loadClass('net.minecraft.world.item.ItemDisplayContext');
            display.setItemDisplayContext(ItemDisplayContext.FIXED);
            display.setItemStack(weaponItem.itemStack || weaponItem);

            mcLevel.addFreshEntity(display);
            spawned = true;
        }
    } catch (eNative) {}

    // 2. Резервный fail-safe вызов команды summon
    if (!spawned) {
        let itemId = String(weaponItem.id);
        server.runCommandSilent(
            `execute in ${dim} run summon minecraft:item_display ${posX} ${posY} ${posZ} ` +
            `{Tags:["weapon_bench_display","${tag}"],item_display:"fixed",Rotation:[${yaw}f,90.0f],item:{id:"${itemId}",count:1b}}`
        );
    }
}

// ------------------------------------------------------------------------------
// ГЕНЕРАТОРЫ ИКОНОК И СЛОТОВ ИНТЕРФЕЙСА
// ------------------------------------------------------------------------------

function getSlotWeaponItem(session) {
    if (session.equipment && !session.equipment.isEmpty()) return session.equipment;
    return Item.of('minecraft:netherite_upgrade_smithing_template')
        .withCustomName(Text.of('§6✦ [ СЛОТ I: ОРУЖИЕ ] ✦'))
        .withLore([
            Text.of('§7Установите боевое оружие для гравировки'),
            Text.of('§7и пробития рунических сокетов Резцом.'),
            Text.of('§8────────────────────────────────'),
            Text.of('§a▶ Нажмите на оружие в инвентаре снизу,'),
            Text.of('   §aчтобы быстро закрепить его на столе!'),
            Text.of('§e▶ Нажмите сюда с оружием в руке.')
        ]);
}

function getArtSlotItem(session, slotNum) {
    let gear = session.equipment;
    if (!gear || gear.isEmpty()) {
        return Item.of('minecraft:gray_stained_glass_pane')
            .withCustomName(Text.of(`§8✦ Слот ${slotNum}: [Вставьте оружие] ✦`));
    }

    let tier = getWeaponProgressionTier(gear);

    // Слот 1: Основное / Врожденное искусство (Доступно всем тирам)
    if (slotNum === 1) {
        let inscribed = getWeaponArtInSlot(gear, 1);
        if (inscribed && WB_ART_INFO[inscribed]) {
            let info = WB_ART_INFO[inscribed];
            let rank = getWeaponArtRankInSlot(gear, 1);
            let rankStr = ROMAN_NUMS[rank] || 'I';
            return Item.of('kubejs:martial_tablet_whirlwind')
                .withCustomName(Text.of(`§6⚔ Слот 1: §e${info.name} §6[Ранг ${rankStr}]`))
                .withLore([
                    Text.of('§8[Гравированное Боевое Искусство: Слот 1]'),
                    Text.of(`§7• Эффект: §f${info.desc}`),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§e▶ Активация: §b[ПКМ] §7(или [Shift+ПКМ] со щитом)'),
                    Text.of('§a▶ Кликните сюда, чтобы извлечь скрижаль назад в сумку.')
                ]);
        } else {
            return Item.of('minecraft:iron_sword')
                .withCustomName(Text.of('§6⚔ Слот 1: [Врожденное Искусство Оружия]'))
                .withLore([
                    Text.of('§7Оружие использует базовый боевой прием своего класса.'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§e▶ Активация: §b[ПКМ] §7(или [Shift+ПКМ] со щитом)'),
                    Text.of('§a▶ Вставьте сюда Трактат Боевых Искусств,'),
                    Text.of('   §aчтобы переопределить прием Скрижалью!')
                ]);
        }
    }

    // Слот 2: Требует Тир 4+
    if (slotNum === 2) {
        if (tier < 4) {
            return Item.of('minecraft:barrier')
                .withCustomName(Text.of('§c🔒 Слот 2: [ЗАБЛОКИРОВАНО]'))
                .withLore([
                    Text.of(`§7Текущий тир оружия: §eТир ${tier}`),
                    Text.of('§cВторой боевой слот доступен строго'),
                    Text.of('§cна оружии §6Тира 4+ (Незерит / Пепельный сплав).'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§8Возвысьте оружие на Адской Наковальне.')
                ]);
        }
        if (!hasSocket2(gear)) {
            return Item.of('minecraft:chain')
                .withCustomName(Text.of('§e🔒 Слот 2: [ЗАКРЫТЫЙ СОКЕТ]'))
                .withLore([
                    Text.of('§7Оружие имеет потенциал для 2-го боевого слота!'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§6⚒ Пробейте сокет Резцом Оружейника в ряду ниже:'),
                    Text.of('   §e• Требуется: §f1 Резец Оружейника + 1 Незеритовый/Пепельный слиток'),
                    Text.of('   §a• Шанс успеха: §2100% гарантия мастера')
                ]);
        }
        let inscribed = getWeaponArtInSlot(gear, 2);
        if (inscribed && WB_ART_INFO[inscribed]) {
            let info = WB_ART_INFO[inscribed];
            let rank = getWeaponArtRankInSlot(gear, 2);
            let rankStr = ROMAN_NUMS[rank] || 'I';
            return Item.of('kubejs:martial_tablet_lightning_thrust')
                .withCustomName(Text.of(`§d💎 Слот 2: §e${info.name} §6[Ранг ${rankStr}]`))
                .withLore([
                    Text.of('§8[Гравированное Боевое Искусство: Слот 2]'),
                    Text.of(`§7• Эффект: §f${info.desc}`),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§e▶ Активация: §b[Shift+ПКМ] §7(без щита) или клавиша §b[Z]'),
                    Text.of('§a▶ Кликните сюда, чтобы извлечь скрижаль назад в сумку.')
                ]);
        } else {
            return Item.of('minecraft:amethyst_shard')
                .withCustomName(Text.of('§a✦ Слот 2: [ОТКРЫТЫЙ СОКЕТ] ✦'))
                .withLore([
                    Text.of('§7Сокет успешно пробит Резцом Оружейника!'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§a▶ Вставьте сюда Трактат Боевых Искусств,'),
                    Text.of('   §aчтобы инкрустировать дополнительный прием.'),
                    Text.of('§e▶ Активация приема в бою: клавиша §b[Z]')
                ]);
        }
    }

    // Слот 3: Требует Тир 7+
    if (slotNum === 3) {
        if (tier < 7) {
            return Item.of('minecraft:barrier')
                .withCustomName(Text.of('§c🔒 Слот 3: [ЗАБЛОКИРОВАНО]'))
                .withLore([
                    Text.of(`§7Текущий тир оружия: §eТир ${tier}`),
                    Text.of('§cТретий боевой слот доступен строго'),
                    Text.of('§cна оружии §bТира 7+ (Eternal Starlight / Звездный металл).'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§8Возвысьте оружие на Адской Наковальне.')
                ]);
        }
        if (!hasSocket3(gear)) {
            return Item.of('minecraft:chain')
                .withCustomName(Text.of('§e🔒 Слот 3: [ЗАКРЫТЫЙ СОКЕТ]'))
                .withLore([
                    Text.of('§7Оружие имеет потенциал для 3-го боевого слота!'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§6⚒ Пробейте сокет Резцом Оружейника в ряду ниже:'),
                    Text.of('   §e• Требуется: §f1 Резец Оружейника + 1 Звездный/Люминаритовый слиток'),
                    Text.of('   §a• Шанс успеха: §2100% гарантия мастера')
                ]);
        }
        let inscribed = getWeaponArtInSlot(gear, 3);
        if (inscribed && WB_ART_INFO[inscribed]) {
            let info = WB_ART_INFO[inscribed];
            let rank = getWeaponArtRankInSlot(gear, 3);
            let rankStr = ROMAN_NUMS[rank] || 'I';
            return Item.of('kubejs:martial_tablet_holy_blade')
                .withCustomName(Text.of(`§5🌟 Слот 3: §e${info.name} §6[Ранг ${rankStr}]`))
                .withLore([
                    Text.of('§8[Гравированное Боевое Искусство: Слот 3]'),
                    Text.of(`§7• Эффект: §f${info.desc}`),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§e▶ Активация: клавиша §b[X]'),
                    Text.of('§a▶ Кликните сюда, чтобы извлечь скрижаль назад в сумку.')
                ]);
        } else {
            return Item.of('minecraft:amethyst_shard')
                .withCustomName(Text.of('§a✦ Слот 3: [ОТКРЫТЫЙ СОКЕТ] ✦'))
                .withLore([
                    Text.of('§7Сокет успешно пробит Резцом Оружейника!'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§a▶ Вставьте сюда Трактат Боевых Искусств,'),
                    Text.of('   §aчтобы инкрустировать третий прием.'),
                    Text.of('§e▶ Активация приема в бою: клавиша §b[X]')
                ]);
        }
    }

    return Item.of('minecraft:gray_stained_glass_pane');
}

function getSlotElementalItem(session) {
    let gear = session.equipment;
    if (!gear || gear.isEmpty()) {
        return Item.of('minecraft:gray_stained_glass_pane')
            .withCustomName(Text.of('§8✦ Слот 4: [Вставьте оружие] ✦'));
    }

    let elem = getElementalInfusion(gear);
    if (elem) {
        let stoneId = 'kubejs:elemental_stone_' + elem;
        let info = WB_ELEMENTAL_STONES[stoneId] || { name: elem, color: '§b', desc: 'Стихийная конверсия 30%' };
        return Item.of(stoneId)
            .withCustomName(Text.of(`§e🔮 Слот 4: ${info.color}Инфузия Стихии: ${info.name}`))
            .withLore([
                Text.of('§8[Камень Стихии Оружейника]'),
                Text.of(`§7• Эффект: §f${info.desc}`),
                Text.of('§7• Обход брони: §a30% урона наносится чистой стихией'),
                Text.of('§7• Стихийные реакции: §6Термошок §7и §bСверхпроводимость'),
                Text.of('§8────────────────────────────────'),
                Text.of('§a▶ Кликните сюда, чтобы извлечь камень назад в сумку.')
            ]);
    } else {
        return Item.of('minecraft:echo_shard')
            .withCustomName(Text.of('§b🔮 Слот 4: [СТИХИЙНЫЙ СОКЕТ: ПУСТО] ✦'))
            .withLore([
                Text.of('§7Инкрустируйте сюда любой из 5 Камней Стихий:'),
                Text.of('§c• Пламя §7(Огонь)  §b• Лед §7(Холод)  §e• Молния'),
                Text.of('§5• Бездна §7(Тьма)  §6• Святость'),
                Text.of('§8────────────────────────────────'),
                Text.of('§a▶ Нажмите на Камень Стихии в инвентаре снизу.')
            ]);
    }
}

function getSlotApotheosisGemItem(session) {
    let gear = session.equipment;
    if (!gear || gear.isEmpty()) {
        return Item.of('minecraft:gray_stained_glass_pane')
            .withCustomName(Text.of('§8✦ Слот 5: [Вставьте оружие] ✦'));
    }

    let rawGear = gear.getItemStack ? gear.getItemStack() : gear;
    let sockets = 0;
    let gems = null;
    try {
        if (WB_SocketHelper) {
            sockets = WB_SocketHelper.getSockets(rawGear);
            gems = WB_SocketHelper.getGems(rawGear);
        }
    } catch (e) {}

    if (sockets <= 0) {
        return Item.of('minecraft:iron_bars')
            .withCustomName(Text.of('§c💎 Слот 5: [ГНЕЗДА НЕ ПРОБИТЫ]'))
            .withLore([
                Text.of('§7Оружие не имеет открытых гнезд самоцветов.'),
                Text.of('§8────────────────────────────────'),
                Text.of('§e• Пробейте Слот 2 (Т4+): §f+1 гнездо самоцвета'),
                Text.of('§b• Пробейте Слот 3 (Т7+): §f+2 гнезда самоцветов'),
                Text.of('§8────────────────────────────────'),
                Text.of('§7Используйте Резец Оружейника в мастерской ниже.')
            ]);
    }

    let installedGems = [];
    if (gems) {
        for (let i = 0; i < gems.size(); i++) {
            let g = gems.get(i);
            if (g && g.isValid && g.isValid()) {
                installedGems.push(g);
            }
        }
    }

    if (installedGems.length > 0) {
        let firstGem = installedGems[0];
        let gemStack = firstGem.gemStack();
        let gemName = (gemStack && gemStack.hoverName) ? gemStack.hoverName.getString() : 'Самоцвет Апофеоза';

        let displayItem = (gemStack && !gemStack.isEmpty()) ? Item.of(gemStack.copy()) : Item.of('minecraft:amethyst_shard');
        return displayItem
            .withCustomName(Text.of(`§6💎 Слот 5: ${gemName}`))
            .withLore([
                Text.of('§8[Инкрустированный Самоцвет Апофеоза]'),
                Text.of(`§7• Самоцвет: §e${gemName}`),
                Text.of(`§7• Занято гнезд: §a${installedGems.length} / ${sockets}`),
                Text.of('§8────────────────────────────────'),
                Text.of('§a▶ Кликните сюда, чтобы безопасно извлечь'),
                Text.of('   §aсамоцвет обратно в сумку.')
            ]);
    } else {
        return Item.of('minecraft:amethyst_shard')
            .withCustomName(Text.of(`§b💎 Слот 5: [ГНЕЗДО САМОЦВЕТА: ${sockets} СВОБОДНО] ✦`))
            .withLore([
                Text.of(`§7Доступно открытых гнезд: §a${sockets}`),
                Text.of('§7Инкрустируйте любой Самоцвет Элириума:'),
                Text.of('§c• Рубин  §9• Сапфир  §a• Изумруд  §b• Алмаз Колосса'),
                Text.of('§5• Аметист Бездны  §f• Опал  §e• Топаз  §8• Оникс'),
                Text.of('§6• Охотничий Янтарь  §d• Звездный Люминарит (Т7+)'),
                Text.of('§8────────────────────────────────'),
                Text.of('§a▶ Кликните сюда для автоматической инкрустации'),
                Text.of('   §aподходящего самоцвета из вашей сумки!')
            ]);
    }
}

function getSlotChiselItem(session) {
    if (session.chisel && !session.chisel.isEmpty()) return session.chisel;
    return Item.of('minecraft:flint')
        .withCustomName(Text.of('§6🗡 [ СЛОТ РЕЗЦА ОРУЖЕЙНИКА ]'))
        .withLore([
            Text.of('§7Установите Резец Оружейника (kubejs:weapon_chisel).'),
            Text.of('§8────────────────────────────────'),
            Text.of('§a▶ Кликните на Резец в сумке снизу,'),
            Text.of('   §aчтобы переместить его в верстак!'),
            Text.of('§7Прочность: 128 единиц (1 ед. за сокет).')
        ]);
}

function getSlotMaterialItem(session) {
    if (session.tierMaterial && !session.tierMaterial.isEmpty()) return session.tierMaterial;
    return Item.of('minecraft:copper_ingot')
        .withCustomName(Text.of('§e🧱 [ СЛОТ ТИРОВОГО СЛИТКА ]'))
        .withLore([
            Text.of('§7Установите тировый материал для пробития сокета:'),
            Text.of('§8────────────────────────────────'),
            Text.of('§6• Для Слота 2 (Т4): §fНезеритовый / Пепельный слиток'),
            Text.of('§b• Для Слота 3 (Т7): §fЗвездный / Люминаритовый слиток'),
            Text.of('§8────────────────────────────────'),
            Text.of('§a▶ Кликните на слиток в сумке снизу.')
        ]);
}

function getPunchActionButtonItem(session) {
    let gear = session.equipment;
    let chisel = session.chisel;
    let mat = session.tierMaterial;

    if (!gear || gear.isEmpty()) {
        return Item.of('minecraft:anvil')
            .withCustomName(Text.of('§8⚒ [ ПРОБИТИЕ СОКЕТА: НЕТ ОРУЖИЯ ] ⚒'))
            .withLore([Text.of('§7Сначала закрепите оружие в Слоте I верстака.')]);
    }

    let tier = getWeaponProgressionTier(gear);
    let needSlot = null;

    if (tier >= 4 && !hasSocket2(gear)) needSlot = 2;
    else if (tier >= 7 && !hasSocket3(gear)) needSlot = 3;

    if (!needSlot) {
        return Item.of('minecraft:nether_star')
            .withCustomName(Text.of('§a✓ [ ВСЕ СОКЕТЫ ЭПОХИ ПРОБИТЫ ] ✓'))
            .withLore([
                Text.of(`§7Оружие (Тир ${tier}) имеет максимальное число сокетов!`),
                Text.of('§8Все доступные слоты боевых искусств открыты.')
            ]);
    }

    let hasChisel = chisel && !chisel.isEmpty() && chisel.id === 'kubejs:weapon_chisel';
    let hasMat = false;
    let requiredMatName = (needSlot === 2) ? 'Незеритовый / Пепельный слиток (Т4)' : 'Звездный / Люминаритовый слиток (Т7)';

    if (needSlot === 2 && isTier4SocketMaterial(mat)) hasMat = true;
    if (needSlot === 3 && isTier7SocketMaterial(mat)) hasMat = true;

    if (!hasChisel) {
        return Item.of('minecraft:chipped_anvil')
            .withCustomName(Text.of(`§c⚒ ПРОБИТЬ СЛОТ ${needSlot}: [НЕТ РЕЗЦА] ⚒`))
            .withLore([
                Text.of(`§7Оружие готово к пробитию Слота ${needSlot}.`),
                Text.of('§c✖ Установите Резец Оружейника в Слот Резца!'),
                Text.of(`§7• Требуется материал: §e${requiredMatName}`)
            ]);
    }

    if (!hasMat) {
        return Item.of('minecraft:chipped_anvil')
            .withCustomName(Text.of(`§e⚒ ПРОБИТЬ СЛОТ ${needSlot}: [НЕТ МАТЕРИАЛА] ⚒`))
            .withLore([
                Text.of(`§7Оружие готово к пробитию Слота ${needSlot}.`),
                Text.of(`§c✖ Требуется тировый материал: §f${requiredMatName}`),
                Text.of('§a✓ Резец Оружейника готов к работе')
            ]);
    }

    return Item.of('minecraft:smithing_table')
        .withCustomName(Text.of(`§a⚒ [ НАЖМИТЕ: ПРОБИТЬ СОКЕТ ${needSlot} ] ⚒`))
        .withLore([
            Text.of(`§7Пробитие дополнительного боевого Слота ${needSlot}!`),
            Text.of('§8────────────────────────────────'),
            Text.of('§2✦ 100% ГАРАНТИЯ МАСТЕРА БЕЗ РИСКА ПОЛОМКИ'),
            Text.of('§7• Будет израсходован: §f1x ' + requiredMatName),
            Text.of('§7• Прочность резца: §e-1 ед.'),
            Text.of('§8────────────────────────────────'),
            Text.of('§a▶ Нажмите ЛКМ для завершения ковки!')
        ]);
}

// ------------------------------------------------------------------------------
// ГЛАВНЫЙ ИНТЕРФЕЙС ОРУЖЕЙНОГО ВЕРСТАКА (4 РЯДА / 36 СЛОТОВ)
// ------------------------------------------------------------------------------

function openWeaponBenchGUI(player, block) {
    let blockPos = null;
    if (block) {
        let facingStr = 'NORTH';
        try {
            if (block.properties && block.properties.facing) facingStr = String(block.properties.facing).toUpperCase();
        } catch (e) {}
        blockPos = {
            dim: String(block.level.dimension),
            x: block.x,
            y: block.y,
            z: block.z,
            facing: facingStr
        };
    }

    let session = getOrCreateBenchSession(player, blockPos);

    // Если на блоке в мире уже лежит оружие и в сессии пусто, загружаем его
    if (blockPos && (!session.equipment || session.equipment.isEmpty())) {
        let stored = getStoredBenchWeapon(player.level, blockPos);
        if (stored && !stored.isEmpty()) {
            session.equipment = stored;
        }
    }

    player.openChestGUI(Text.of('🛠 §6§lОРУЖЕЙНЫЙ ВЕРСТАК §8✦ §eЭЛИРИУМ'), 4, gui => {
        gui.playerSlots = true;
        gui.closed = () => {
            clearAndRefundBenchSession(player, false);
        };

        // ----------------------------------------------------------------------
        // 1. ДЕКОРАТИВНЫЙ ФРЕЙМ И СТАТУСНЫЙ ЭКРАН
        // ----------------------------------------------------------------------
        let ironFrame = Item.of('minecraft:gray_stained_glass_pane').withCustomName(Text.of('§8✦ Стальная Оправа Верстака ✦'));
        let oakTrim = Item.of('minecraft:brown_stained_glass_pane').withCustomName(Text.of('§6✦ Массив Мореного Дуба ✦'));
        let linkLine = Item.of('minecraft:chain').withCustomName(Text.of('§7»»» Рунический Канал »»»'));

        for (let x = 0; x < 9; x++) {
            for (let y = 0; y < 4; y++) {
                gui.slot(x, y, s => {
                    s.setItem(ironFrame);
                    s.leftClicked = () => {}; s.rightClicked = () => {};
                });
            }
        }

        // ======================================================================
        // РЯД 0 (Y=0): ИНФОРМАЦИЯ, СЛОТ I (ОРУЖИЕ) И СТАТУС
        // ======================================================================
        gui.slot(0, 0, s => {
            s.setItem(Item.of('minecraft:book')
                .withCustomName(Text.of('§6📖 [ КОДЕКС ОРУЖЕЙНОГО ВЕРСТАКА ]'))
                .withLore([
                    Text.of('§7Священный стол оружейников Элириума.'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§e• Слот I: Оружие (отображается в 3D на плите).'),
                    Text.of('§e• Слот 1: Основное / Врожденное искусство.'),
                    Text.of('§e• Слот 2: Дополнительное искусство (Т4+).'),
                    Text.of('§e• Слот 3: Дополнительное искусство (Т7+).'),
                    Text.of('§e• Слот 4: Стихийный камень инфузии (25-30%).'),
                    Text.of('§e• Слот 5: Самоцвет Апофеоза (Оружие/Щит/Броня).'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§a✓ Пробитие Резцом со 100% гарантией мастера.')
                ]));
            s.leftClicked = () => {}; s.rightClicked = () => {};
        });

        // СЛОТ I: ОРУЖИЕ (X=4, Y=0)
        gui.slot(4, 0, s => {
            s.setItem(getSlotWeaponItem(session));
            let clickHandler = () => {
                let sess = getOrCreateBenchSession(player, blockPos);
                if (sess.equipment && !sess.equipment.isEmpty()) {
                    player.give(sess.equipment);
                    sess.equipment = null;
                    if (sess.benchPos) {
                        setStoredBenchWeapon(player.level, sess.benchPos, null);
                        clearBenchWorldDisplay(player.level, sess.benchPos);
                    }
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                } else {
                    let main = player.mainHandItem;
                    if (main && !main.isEmpty() && isWeaponItem(main)) {
                        sess.equipment = main.split(1);
                        if (sess.benchPos) {
                            setStoredBenchWeapon(player.level, sess.benchPos, sess.equipment);
                            updateBenchWorldDisplay(player.level, sess.benchPos, sess.equipment);
                        }
                        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                    } else {
                        let inv = player.inventory;
                        let found = false;
                        for (let i = 0; i < inv.size; i++) {
                            let st = inv.getItem(i);
                            if (st && !st.isEmpty() && isWeaponItem(st)) {
                                sess.equipment = st.split(1);
                                if (sess.benchPos) {
                                    setStoredBenchWeapon(player.level, sess.benchPos, sess.equipment);
                                    updateBenchWorldDisplay(player.level, sess.benchPos, sess.equipment);
                                }
                                player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            player.tell(Text.of('§eℹ В инвентаре не найдено боевого оружия.'));
                            player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                        }
                    }
                }
                refreshWeaponBenchGUI(player, blockPos);
            };
            s.leftClicked = clickHandler;
            s.rightClicked = clickHandler;
        });

        // МОНИТОР ПРОГРЕССИИ ОРУЖИЯ (X=8, Y=0)
        gui.slot(8, 0, s => {
            let gear = session.equipment;
            if (gear && !gear.isEmpty()) {
                let tier = getWeaponProgressionTier(gear);
                let reinf = getReinforceLevel(gear);
                let s2 = hasSocket2(gear) ? '§a[Открыт]' : (tier >= 4 ? '§e[Закрыт]' : '§c[Недоступен]');
                let s3 = hasSocket3(gear) ? '§a[Открыт]' : (tier >= 7 ? '§e[Закрыт]' : '§c[Недоступен]');
                let elem = getElementalInfusion(gear) ? '§b[' + getElementalInfusion(gear) + ']' : '§7[Нет]';

                let rawGear = gear.getItemStack ? gear.getItemStack() : gear;
                let apothSockets = 0;
                let gemName = '§7[Нет]';
                try {
                    if (WB_SocketHelper) {
                        apothSockets = WB_SocketHelper.getSockets(rawGear);
                        let gems = WB_SocketHelper.getGems(rawGear);
                        if (gems) {
                            for (let i = 0; i < gems.size(); i++) {
                                let g = gems.get(i);
                                if (g && g.isValid && g.isValid()) {
                                    let gst = g.gemStack();
                                    gemName = '§6[' + (gst && gst.hoverName ? gst.hoverName.getString() : 'Самоцвет') + ']';
                                    break;
                                }
                            }
                        }
                    }
                } catch (ePass) {}
                let gemStatus = apothSockets > 0 ? (gemName !== '§7[Нет]' ? gemName : '§a[Свободно]') : '§c[Не открыто]';

                s.setItem(Item.of('minecraft:compass')
                    .withCustomName(Text.of(`§6📊 [ ПАСПОРТ ЭКИПИРОВКИ: ТИР ${tier} ]`))
                    .withLore([
                        Text.of(`§7• Уровень Заточки: §e+${reinf}`),
                        Text.of(`§7• Боевой Слот 1: §a[Активен]`),
                        Text.of(`§7• Боевой Слот 2: ${s2}`),
                        Text.of(`§7• Боевой Слот 3: ${s3}`),
                        Text.of(`§7• Стихийная Инфузия: ${elem}`),
                        Text.of(`§7• Самоцвет Апофеоза: ${gemStatus}`),
                        Text.of('§8────────────────────────────────'),
                        Text.of('§2✓ Эволюция на Адской Наковальне 100% переносит сокеты!')
                    ]));
            } else {
                s.setItem(Item.of('minecraft:compass')
                    .withCustomName(Text.of('§8📊 [ ПАСПОРТ ЭКИПИРОВКИ ]'))
                    .withLore([Text.of('§7Вставьте оружие для считывания параметров.')]));
            }
            s.leftClicked = () => {}; s.rightClicked = () => {};
        });

        // ======================================================================
        // РЯД 1 (Y=1): ЧЕТЫРЕ БОЕВЫХ И СТИХИЙНЫХ СЛОТА
        // ======================================================================

        // МАРКИРОВКА ЛИНИИ (X=0, Y=1)
        gui.slot(0, 1, s => {
            s.setItem(Item.of('minecraft:writable_book').withCustomName(Text.of('§6✦ СОКЕТЫ ОРУЖИЯ ✦')));
            s.leftClicked = () => {}; s.rightClicked = () => {};
        });

        // СЛОТ 1: Врожденное / Основное искусство (X=1, Y=1)
        gui.slot(1, 1, s => {
            s.setItem(getArtSlotItem(session, 1));
            let clickHandler = () => {
                let sess = getOrCreateBenchSession(player, blockPos);
                let gear = sess.equipment;
                if (!gear || gear.isEmpty()) return;

                let inscribed = getWeaponArtInSlot(gear, 1);
                if (inscribed) {
                    // Извлечение скрижали назад
                    let tabletId = 'kubejs:martial_tablet_' + inscribed;
                    let tabItem = Item.of(tabletId);
                    if (tabItem.isEmpty()) tabItem = Item.of('kubejs:martial_tablet_whirlwind');
                    let r = getWeaponArtRankInSlot(gear, 1);
                    let tabTag = getOrCreateSafeCustomData(tabItem);
                    if (tabTag) tabTag.putInt('skd_art_rank', r);
                    player.give(tabItem);

                    // Очищаем слот 1
                    let gTag = getSafeItemCustomData(gear);
                    if (gTag) {
                        gTag.remove('skd_art_1');
                        gTag.remove('skd_art_1_rank');
                        gTag.remove('skd_weapon_art');
                        gTag.remove('skd_art_rank');
                    }
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.2`);
                    player.tell(Text.of('§a✓ Скрижаль Слота 1 безопасно возвращена в сумку.'));
                } else {
                    // Ищем скрижаль в инвентаре
                    let inv = player.inventory;
                    let found = null;
                    for (let i = 0; i < inv.size; i++) {
                        let st = inv.getItem(i);
                        if (st && !st.isEmpty() && isMartialTablet(st)) {
                            found = st;
                            break;
                        }
                    }
                    if (found) {
                        let artId = extractTabletArtId(found);
                        let rank = extractTabletRank(found);
                        found.shrink(1);
                        let gTag = getOrCreateSafeCustomData(gear);
                        if (gTag) {
                            gTag.putString('skd_art_1', artId);
                            gTag.putInt('skd_art_1_rank', rank);
                            gTag.putString('skd_weapon_art', artId);
                            gTag.putInt('skd_art_rank', rank);
                        }
                        player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                        player.server.runCommandSilent(`particle minecraft:wax_off ${player.x} ${player.y + 1} ${player.z} 0.3 0.3 0.3 0.05 20`);
                        player.tell(Text.of(`§a✓ Боевое Искусство «${WB_ART_INFO[artId] ? WB_ART_INFO[artId].name : artId}» успешно гравировано в Слот 1!`));
                    } else {
                        player.tell(Text.of('§eℹ В инвентаре не найдено Скрижалей Боевых Искусств.'));
                    }
                }
                if (sess.benchPos) {
                    setStoredBenchWeapon(player.level, sess.benchPos, sess.equipment);
                    updateBenchWorldDisplay(player.level, sess.benchPos, sess.equipment);
                }
                refreshWeaponBenchGUI(player, blockPos);
            };
            s.leftClicked = clickHandler; s.rightClicked = clickHandler;
        });

        gui.slot(2, 1, s => { s.setItem(linkLine); s.leftClicked = () => {}; s.rightClicked = () => {}; });

        // СЛОТ 2: Дополнительное искусство Т4+ (X=3, Y=1)
        gui.slot(3, 1, s => {
            s.setItem(getArtSlotItem(session, 2));
            let clickHandler = () => {
                let sess = getOrCreateBenchSession(player, blockPos);
                let gear = sess.equipment;
                if (!gear || gear.isEmpty()) return;

                let tier = getWeaponProgressionTier(gear);
                if (tier < 4) {
                    player.tell(Text.of('§c✖ Второй слот требует оружие Тира 4+ (Незерит / Пепельный сплав).'));
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                    return;
                }
                if (!hasSocket2(gear)) {
                    player.tell(Text.of('§eℹ Слот 2 еще не пробит! Используйте Резец Оружейника в ряду ниже.'));
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                    return;
                }

                let inscribed = getWeaponArtInSlot(gear, 2);
                if (inscribed) {
                    let tabletId = 'kubejs:martial_tablet_' + inscribed;
                    let tabItem = Item.of(tabletId);
                    if (tabItem.isEmpty()) tabItem = Item.of('kubejs:martial_tablet_lightning_thrust');
                    let r = getWeaponArtRankInSlot(gear, 2);
                    let tabTag = getOrCreateSafeCustomData(tabItem);
                    if (tabTag) tabTag.putInt('skd_art_rank', r);
                    player.give(tabItem);

                    let gTag = getSafeItemCustomData(gear);
                    if (gTag) {
                        gTag.remove('skd_art_2');
                        gTag.remove('skd_art_2_rank');
                        gTag.remove('elyrium_inscribed_art');
                    }
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.2`);
                    player.tell(Text.of('§a✓ Скрижаль Слота 2 безопасно возвращена в сумку.'));
                } else {
                    let inv = player.inventory;
                    let found = null;
                    for (let i = 0; i < inv.size; i++) {
                        let st = inv.getItem(i);
                        if (st && !st.isEmpty() && isMartialTablet(st)) {
                            found = st;
                            break;
                        }
                    }
                    if (found) {
                        let artId = extractTabletArtId(found);
                        let rank = extractTabletRank(found);
                        found.shrink(1);
                        let gTag = getOrCreateSafeCustomData(gear);
                        if (gTag) {
                            gTag.putString('skd_art_2', artId);
                            gTag.putInt('skd_art_2_rank', rank);
                            gTag.putString('elyrium_inscribed_art', artId);
                        }
                        player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                        player.server.runCommandSilent(`particle minecraft:wax_off ${player.x} ${player.y + 1} ${player.z} 0.3 0.3 0.3 0.05 20`);
                        player.tell(Text.of(`§a✓ Боевое Искусство «${WB_ART_INFO[artId] ? WB_ART_INFO[artId].name : artId}» успешно гравировано в Слот 2!`));
                    } else {
                        player.tell(Text.of('§eℹ В инвентаре не найдено Скрижалей Боевых Искусств.'));
                    }
                }
                if (sess.benchPos) {
                    setStoredBenchWeapon(player.level, sess.benchPos, sess.equipment);
                    updateBenchWorldDisplay(player.level, sess.benchPos, sess.equipment);
                }
                refreshWeaponBenchGUI(player, blockPos);
            };
            s.leftClicked = clickHandler; s.rightClicked = clickHandler;
        });

        gui.slot(4, 1, s => { s.setItem(linkLine); s.leftClicked = () => {}; s.rightClicked = () => {}; });

        // СЛОТ 3: Дополнительное искусство Т7+ (X=5, Y=1)
        gui.slot(5, 1, s => {
            s.setItem(getArtSlotItem(session, 3));
            let clickHandler = () => {
                let sess = getOrCreateBenchSession(player, blockPos);
                let gear = sess.equipment;
                if (!gear || gear.isEmpty()) return;

                let tier = getWeaponProgressionTier(gear);
                if (tier < 7) {
                    player.tell(Text.of('§c✖ Третий слот требует оружие Тира 7+ (Eternal Starlight / Звездный металл).'));
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                    return;
                }
                if (!hasSocket3(gear)) {
                    player.tell(Text.of('§eℹ Слот 3 еще не пробит! Используйте Резец Оружейника в ряду ниже.'));
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                    return;
                }

                let inscribed = getWeaponArtInSlot(gear, 3);
                if (inscribed) {
                    let tabletId = 'kubejs:martial_tablet_' + inscribed;
                    let tabItem = Item.of(tabletId);
                    if (tabItem.isEmpty()) tabItem = Item.of('kubejs:martial_tablet_holy_blade');
                    let r = getWeaponArtRankInSlot(gear, 3);
                    let tabTag = getOrCreateSafeCustomData(tabItem);
                    if (tabTag) tabTag.putInt('skd_art_rank', r);
                    player.give(tabItem);

                    let gTag = getSafeItemCustomData(gear);
                    if (gTag) {
                        gTag.remove('skd_art_3');
                        gTag.remove('skd_art_3_rank');
                    }
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.2`);
                    player.tell(Text.of('§a✓ Скрижаль Слота 3 безопасно возвращена в сумку.'));
                } else {
                    let inv = player.inventory;
                    let found = null;
                    for (let i = 0; i < inv.size; i++) {
                        let st = inv.getItem(i);
                        if (st && !st.isEmpty() && isMartialTablet(st)) {
                            found = st;
                            break;
                        }
                    }
                    if (found) {
                        let artId = extractTabletArtId(found);
                        let rank = extractTabletRank(found);
                        found.shrink(1);
                        let gTag = getOrCreateSafeCustomData(gear);
                        if (gTag) {
                            gTag.putString('skd_art_3', artId);
                            gTag.putInt('skd_art_3_rank', rank);
                        }
                        player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                        player.server.runCommandSilent(`particle minecraft:wax_off ${player.x} ${player.y + 1} ${player.z} 0.3 0.3 0.3 0.05 20`);
                        player.tell(Text.of(`§a✓ Боевое Искусство «${WB_ART_INFO[artId] ? WB_ART_INFO[artId].name : artId}» успешно гравировано в Слот 3!`));
                    } else {
                        player.tell(Text.of('§eℹ В инвентаре не найдено Скрижалей Боевых Искусств.'));
                    }
                }
                if (sess.benchPos) {
                    setStoredBenchWeapon(player.level, sess.benchPos, sess.equipment);
                    updateBenchWorldDisplay(player.level, sess.benchPos, sess.equipment);
                }
                refreshWeaponBenchGUI(player, blockPos);
            };
            s.leftClicked = clickHandler; s.rightClicked = clickHandler;
        });

        gui.slot(6, 1, s => { s.setItem(linkLine); s.leftClicked = () => {}; s.rightClicked = () => {}; });

        // СЛОТ 4: Стихийная Инфузия (X=7, Y=1)
        gui.slot(7, 1, s => {
            s.setItem(getSlotElementalItem(session));
            let clickHandler = () => {
                let sess = getOrCreateBenchSession(player, blockPos);
                let gear = sess.equipment;
                if (!gear || gear.isEmpty()) return;

                let elem = getElementalInfusion(gear);
                if (elem) {
                    let stoneId = 'kubejs:elemental_stone_' + elem;
                    player.give(Item.of(stoneId));
                    let gTag = getSafeItemCustomData(gear);
                    if (gTag) {
                        gTag.remove('skd_elemental_infusion');
                        gTag.remove('skd_elemental_stone');
                    }
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.2`);
                    player.tell(Text.of('§a✓ Камень Стихии возвращен в сумку.'));
                } else {
                    let inv = player.inventory;
                    let found = null;
                    for (let i = 0; i < inv.size; i++) {
                        let st = inv.getItem(i);
                        if (st && !st.isEmpty() && WB_ELEMENTAL_STONES[st.id]) {
                            found = st;
                            break;
                        }
                    }
                    if (found) {
                        let info = WB_ELEMENTAL_STONES[found.id];
                        found.shrink(1);
                        let gTag = getOrCreateSafeCustomData(gear);
                        if (gTag) {
                            gTag.putString('skd_elemental_infusion', info.elem);
                            gTag.putString('skd_elemental_stone', found.id);
                        }
                        player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                        player.server.runCommandSilent(`particle minecraft:wax_off ${player.x} ${player.y + 1} ${player.z} 0.3 0.3 0.3 0.05 20`);
                        player.tell(Text.of(`§a✓ Инфузия Стихии ${info.name} успешно инкрустирована в оружие!`));
                    } else {
                        player.tell(Text.of('§eℹ В сумке не найдено Камней Стихий (Пламя, Лед, Молния, Бездна, Святость).'));
                    }
                }
                if (sess.benchPos) {
                    setStoredBenchWeapon(player.level, sess.benchPos, sess.equipment);
                    updateBenchWorldDisplay(player.level, sess.benchPos, sess.equipment);
                }
                refreshWeaponBenchGUI(player, blockPos);
            };
            s.leftClicked = clickHandler; s.rightClicked = clickHandler;
        });

        // СЛОТ 5: Самоцвет Апофеоза (X=8, Y=1)
        gui.slot(8, 1, s => {
            s.setItem(getSlotApotheosisGemItem(session));
            let clickHandler = () => {
                let sess = getOrCreateBenchSession(player, blockPos);
                let gear = sess.equipment;
                if (!gear || gear.isEmpty()) return;

                if (!WB_SocketHelper) {
                    player.tell(Text.of('§c✖ Ошибка: Модуль самоцветов Apotheosis не загружен.'));
                    return;
                }

                let rawGear = gear.getItemStack ? gear.getItemStack() : gear;
                let sockets = WB_SocketHelper.getSockets(rawGear);
                if (sockets <= 0) {
                    player.tell(Text.of('§eℹ В оружии нет открытых гнезд самоцветов! Пробейте сокет Резцом Оружейника ниже.'));
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                    return;
                }

                let gems = WB_SocketHelper.getGems(rawGear);
                let installedGems = [];
                if (gems) {
                    for (let i = 0; i < gems.size(); i++) {
                        let g = gems.get(i);
                        if (g && g.isValid && g.isValid()) {
                            installedGems.push(g);
                        }
                    }
                }

                if (installedGems.length > 0) {
                    // Извлечение установленного гема (gemInstance.gemStack().copy()) в сумку
                    let lastGem = installedGems[installedGems.length - 1];
                    let extractedStack = lastGem.gemStack().copy();
                    player.give(Item.of(extractedStack));

                    if (installedGems.length === 1) {
                        WB_SocketHelper.setGems(rawGear, WB_SocketedGems.EMPTY);
                    } else {
                        let newItems = new java.util.ArrayList();
                        for (let i = 0; i < installedGems.length - 1; i++) {
                            newItems.add(installedGems[i].gemStack().copy());
                        }
                        try {
                            let ItemContainerContents = Java.loadClass('net.minecraft.world.item.component.ItemContainerContents');
                            let ApothComponents = Java.loadClass('dev.shadowsoffire.apotheosis.Apoth$Components');
                            let contents = ItemContainerContents.fromItems(newItems);
                            rawGear.set(ApothComponents.SOCKETED_GEMS, contents);
                        } catch (eCont) {
                            WB_SocketHelper.setGems(rawGear, WB_SocketedGems.EMPTY);
                        }
                    }

                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.2`);
                    player.tell(Text.of(`§a✓ Самоцвет «${extractedStack.hoverName.getString()}» безопасно извлечен в сумку.`));
                } else {
                    // Инкрустация: поиск подходящего apotheosis:gem в сумке игрока
                    let inv = player.inventory;
                    let foundGemStack = null;

                    for (let i = 0; i < inv.size; i++) {
                        let st = inv.getItem(i);
                        if (st && !st.isEmpty() && st.id === 'apotheosis:gem') {
                            let rawGem = st.getItemStack ? st.getItemStack() : st;
                            try {
                                if (WB_SocketHelper.canSocketGemInItem(rawGear, rawGem)) {
                                    foundGemStack = st;
                                    break;
                                }
                            } catch (eCheck) {}
                        }
                    }

                    if (foundGemStack) {
                        let rawGem = foundGemStack.getItemStack ? foundGemStack.getItemStack() : foundGemStack;
                        let gemName = rawGem.hoverName.getString();
                        let singleGem = rawGem.copy();
                        singleGem.setCount(1);

                        try {
                            let socketedStack = WB_SocketHelper.socketGemInItem(rawGear, singleGem);
                            if (socketedStack && !socketedStack.isEmpty()) {
                                sess.equipment = Item.of(socketedStack);
                                foundGemStack.shrink(1);

                                player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                                player.server.runCommandSilent(`playsound minecraft:ui.stonecutter.take_result player ${player.username} ~ ~ ~ 1.0 1.2`);
                                player.server.runCommandSilent(`particle minecraft:wax_off ${player.x} ${player.y + 1} ${player.z} 0.3 0.3 0.3 0.05 25`);
                                player.server.runCommandSilent(`particle minecraft:enchanted_hit ${player.x} ${player.y + 1} ${player.z} 0.3 0.3 0.3 0.1 20`);
                                player.tell(Text.of(`§a✦ [ЮВЕЛИР] Самоцвет «${gemName}» успешно инкрустирован в гнездо оружия! ✦`));
                            } else {
                                player.tell(Text.of('§c✖ Не удалось инкрустировать самоцвет в оружие.'));
                            }
                        } catch (eSock) {
                            console.error('[WeaponBench] Error socketing gem: ' + eSock);
                            player.tell(Text.of('§c✖ Ошибка при инкрустации самоцвета: ' + eSock));
                        }
                    } else {
                        player.tell(Text.of('§eℹ В инвентаре не найдено подходящих самоцветов Apotheosis для данного оружия.'));
                        player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                    }
                }

                if (sess.benchPos) {
                    setStoredBenchWeapon(player.level, sess.benchPos, sess.equipment);
                    updateBenchWorldDisplay(player.level, sess.benchPos, sess.equipment);
                }
                refreshWeaponBenchGUI(player, blockPos);
            };
            s.leftClicked = clickHandler;
            s.rightClicked = clickHandler;
        });

        // ======================================================================
        // РЯД 2 (Y=2): РЕЗЕЦ, ТИРОВЫЙ СЛИТОК И ПРОБИТИЕ СОКЕТОВ
        // ======================================================================

        gui.slot(0, 2, s => {
            s.setItem(Item.of('minecraft:paper')
                .withCustomName(Text.of('§6⚒ [ МАСТЕРСКАЯ ПРОБИТИЯ СОКЕТОВ ]'))
                .withLore([
                    Text.of('§7100% честный крафт мастера без рандома и риска.'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§e• Резец Оружейника: §f128 единиц прочности.'),
                    Text.of('§e• Расход за сокет: §f1 ед. прочности + 1 тировый слиток.'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§a✓ Слот 2: Требует Незеритовый/Пепельный слиток (Т4).'),
                    Text.of('§a✓ Слот 3: Требует Звездный/Люминаритовый слиток (Т7).')
                ]));
            s.leftClicked = () => {}; s.rightClicked = () => {};
        });

        // СЛОТ РЕЗЦА (X=1, Y=2)
        gui.slot(1, 2, s => {
            s.setItem(getSlotChiselItem(session));
            let clickHandler = () => {
                let sess = getOrCreateBenchSession(player, blockPos);
                if (sess.chisel && !sess.chisel.isEmpty()) {
                    player.give(sess.chisel);
                    sess.chisel = null;
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                } else {
                    let inv = player.inventory;
                    let found = null;
                    for (let i = 0; i < inv.size; i++) {
                        let st = inv.getItem(i);
                        if (st && !st.isEmpty() && st.id === 'kubejs:weapon_chisel') {
                            found = st;
                            break;
                        }
                    }
                    if (found) {
                        sess.chisel = found.split(1);
                        player.server.runCommandSilent(`playsound minecraft:item.flintandsteel.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                    } else {
                        player.tell(Text.of('§eℹ В сумке не найдено Резца Оружейника (kubejs:weapon_chisel).'));
                        player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                    }
                }
                refreshWeaponBenchGUI(player, blockPos);
            };
            s.leftClicked = clickHandler; s.rightClicked = clickHandler;
        });

        gui.slot(2, 2, s => { s.setItem(linkLine); s.leftClicked = () => {}; s.rightClicked = () => {}; });

        // СЛОТ ТИРОВОГО СЛИТКА (X=3, Y=2)
        gui.slot(3, 2, s => {
            s.setItem(getSlotMaterialItem(session));
            let clickHandler = () => {
                let sess = getOrCreateBenchSession(player, blockPos);
                if (sess.tierMaterial && !sess.tierMaterial.isEmpty()) {
                    player.give(sess.tierMaterial);
                    sess.tierMaterial = null;
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
                } else {
                    let inv = player.inventory;
                    let found = null;
                    for (let i = 0; i < inv.size; i++) {
                        let st = inv.getItem(i);
                        if (st && !st.isEmpty() && (isTier4SocketMaterial(st) || isTier7SocketMaterial(st))) {
                            found = st;
                            break;
                        }
                    }
                    if (found) {
                        sess.tierMaterial = found.split(found.count);
                        player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                    } else {
                        player.tell(Text.of('§eℹ В сумке не найдено подходящих тировых слитков (Незерит, Пепел, Звездный металл).'));
                        player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                    }
                }
                refreshWeaponBenchGUI(player, blockPos);
            };
            s.leftClicked = clickHandler; s.rightClicked = clickHandler;
        });

        // КНОПКА «ПРОБИТЬ СОКЕТ РЕЗЦОМ» (X=4, Y=2)
        gui.slot(4, 2, s => {
            s.setItem(getPunchActionButtonItem(session));
            let clickHandler = () => {
                let sess = getOrCreateBenchSession(player, blockPos);
                let gear = sess.equipment;
                let chisel = sess.chisel;
                let mat = sess.tierMaterial;

                if (!gear || gear.isEmpty()) return;
                let tier = getWeaponProgressionTier(gear);

                let targetSlot = null;
                if (tier >= 4 && !hasSocket2(gear)) targetSlot = 2;
                else if (tier >= 7 && !hasSocket3(gear)) targetSlot = 3;

                if (!targetSlot) {
                    player.tell(Text.of('§eℹ Для данного оружия все сокеты текущей эпохи уже открыты.'));
                    return;
                }

                if (!chisel || chisel.isEmpty() || chisel.id !== 'kubejs:weapon_chisel') {
                    player.tell(Text.of('§c✖ Установите Резец Оружейника в Слот Резца!'));
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                    return;
                }

                let validMat = false;
                if (targetSlot === 2 && isTier4SocketMaterial(mat)) validMat = true;
                if (targetSlot === 3 && isTier7SocketMaterial(mat)) validMat = true;

                if (!validMat) {
                    let reqName = (targetSlot === 2) ? 'Незеритовый / Пепельный слиток (Т4)' : 'Звездный / Люминаритовый слиток (Т7)';
                    player.tell(Text.of(`§c✖ Для пробития Слота ${targetSlot} требуется ${reqName}!`));
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.6 0.6`);
                    return;
                }

                // 100% УСПЕШНОЕ ПРОБИТИЕ СОКЕТА
                mat.shrink(1);
                if (mat.count <= 0) sess.tierMaterial = null;

                // Износ резца на 1 ед.
                let curDmg = chisel.damageValue || 0;
                let maxDmg = chisel.maxDamage || 128;
                if (curDmg + 1 >= maxDmg) {
                    sess.chisel = null;
                    player.server.runCommandSilent(`playsound minecraft:item.shield.break player ${player.username} ~ ~ ~ 1.0 0.8`);
                    player.tell(Text.of('§cРезец Оружейника исчерпал свою прочность и раскололся!'));
                } else {
                    chisel.damageValue = curDmg + 1;
                }

                // Запись NBT в оружие и пробитие гнезд Apotheosis
                let gTag = getOrCreateSafeCustomData(gear);
                let rawGear = gear.getItemStack ? gear.getItemStack() : gear;
                let curSockets = 0;
                try {
                    if (WB_SocketHelper) curSockets = WB_SocketHelper.getSockets(rawGear);
                } catch (eSock) {}

                if (gTag) {
                    if (targetSlot === 2) {
                        gTag.putBoolean('skd_socket_2', true);
                        gTag.putInt('skd_sockets', Math.max(getSocketCount(gear), 1));
                        try {
                            if (WB_SocketHelper) WB_SocketHelper.setSockets(rawGear, Math.max(1, curSockets));
                        } catch (eApoth2) {
                            console.error('[WeaponBench] Error setting Apotheosis socket 1: ' + eApoth2);
                        }
                    } else if (targetSlot === 3) {
                        gTag.putBoolean('skd_socket_3', true);
                        gTag.putInt('skd_sockets', 2);
                        try {
                            if (WB_SocketHelper) WB_SocketHelper.setSockets(rawGear, Math.max(2, curSockets));
                        } catch (eApoth3) {
                            console.error('[WeaponBench] Error setting Apotheosis socket 2: ' + eApoth3);
                        }
                    }

                    try {
                        let DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents');
                        let CustomData = Java.loadClass('net.minecraft.world.item.component.CustomData');
                        gear.set(DataComponents.CUSTOM_DATA, CustomData.of(gTag));
                    } catch (eSave) {
                        saveSafeItemCustomData(gear, gTag);
                    }
                }

                // Аудио и визуальные эффекты
                player.server.runCommandSilent(`playsound minecraft:ui.stonecutter.take_result player ${player.username} ~ ~ ~ 1.0 1.2`);
                player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                player.server.runCommandSilent(`particle minecraft:wax_off ${player.x} ${player.y + 1} ${player.z} 0.35 0.35 0.35 0.05 30`);
                player.server.runCommandSilent(`particle minecraft:crit ${player.x} ${player.y + 1} ${player.z} 0.3 0.3 0.3 0.1 20`);
                player.tell(Text.of(`§a✦ [МАСТЕРСКАЯ] Слот ${targetSlot} успешно пробит Резцом Оружейника со 100% гарантией! ✦`));

                if (sess.benchPos) {
                    setStoredBenchWeapon(player.level, sess.benchPos, sess.equipment);
                    updateBenchWorldDisplay(player.level, sess.benchPos, sess.equipment);
                }
                refreshWeaponBenchGUI(player, blockPos);
            };
            s.leftClicked = clickHandler; s.rightClicked = clickHandler;
        });

        gui.slot(5, 2, s => { s.setItem(linkLine); s.leftClicked = () => {}; s.rightClicked = () => {}; });

        // КНОПКА «БЕЗОПАСНОЕ ИЗВЛЕЧЕНИЕ СКРИЖАЛЕЙ И КАМНЕЙ» (X=6, Y=2)
        gui.slot(6, 2, s => {
            s.setItem(Item.of('minecraft:hopper')
                .withCustomName(Text.of('§e🔄 [ ИЗВЛЕЧЬ ВСЕ СКРИЖАЛИ И КАМНИ ]'))
                .withLore([
                    Text.of('§7Безопасно извлекает все инкрустированные скрижали,'),
                    Text.of('§7камень стихии и самоцветы Апофеоза обратно в сумку.'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§a✓ Пробитые сокеты и заточка оружия полностью сохраняются!'),
                    Text.of('§e▶ Нажмите ЛКМ для извлечения.')
                ]));
            let clickHandler = () => {
                let sess = getOrCreateBenchSession(player, blockPos);
                let gear = sess.equipment;
                if (!gear || gear.isEmpty()) return;

                let extractedCount = 0;
                // Слот 1
                let art1 = getWeaponArtInSlot(gear, 1);
                if (art1) {
                    let tab = Item.of('kubejs:martial_tablet_' + art1);
                    if (tab.isEmpty()) tab = Item.of('kubejs:martial_tablet_whirlwind');
                    let r = getWeaponArtRankInSlot(gear, 1);
                    let tTag = getOrCreateSafeCustomData(tab);
                    if (tTag) tTag.putInt('skd_art_rank', r);
                    player.give(tab);
                    extractedCount++;
                }
                // Слот 2
                let art2 = getWeaponArtInSlot(gear, 2);
                if (art2) {
                    let tab = Item.of('kubejs:martial_tablet_' + art2);
                    if (tab.isEmpty()) tab = Item.of('kubejs:martial_tablet_lightning_thrust');
                    let r = getWeaponArtRankInSlot(gear, 2);
                    let tTag = getOrCreateSafeCustomData(tab);
                    if (tTag) tTag.putInt('skd_art_rank', r);
                    player.give(tab);
                    extractedCount++;
                }
                // Слот 3
                let art3 = getWeaponArtInSlot(gear, 3);
                if (art3) {
                    let tab = Item.of('kubejs:martial_tablet_' + art3);
                    if (tab.isEmpty()) tab = Item.of('kubejs:martial_tablet_holy_blade');
                    let r = getWeaponArtRankInSlot(gear, 3);
                    let tTag = getOrCreateSafeCustomData(tab);
                    if (tTag) tTag.putInt('skd_art_rank', r);
                    player.give(tab);
                    extractedCount++;
                }
                // Слот 4
                let elem = getElementalInfusion(gear);
                if (elem) {
                    player.give(Item.of('kubejs:elemental_stone_' + elem));
                    extractedCount++;
                }

                // Слот 5: Извлечение всех Самоцветов Апофеоза
                if (WB_SocketHelper) {
                    try {
                        let rawGear = gear.getItemStack ? gear.getItemStack() : gear;
                        let gems = WB_SocketHelper.getGems(rawGear);
                        let gemExtracted = 0;
                        if (gems) {
                            for (let i = 0; i < gems.size(); i++) {
                                let g = gems.get(i);
                                if (g && g.isValid && g.isValid()) {
                                    let gemSt = g.gemStack().copy();
                                    player.give(Item.of(gemSt));
                                    gemExtracted++;
                                }
                            }
                            if (gemExtracted > 0) {
                                WB_SocketHelper.setGems(rawGear, WB_SocketedGems.EMPTY);
                                extractedCount += gemExtracted;
                            }
                        }
                    } catch (eGemEx) {
                        console.error('[WeaponBench] Error extracting Apotheosis gems: ' + eGemEx);
                    }
                }

                // Очистка тегов
                let gTag = getSafeItemCustomData(gear);
                if (gTag) {
                    gTag.remove('skd_art_1'); gTag.remove('skd_art_1_rank');
                    gTag.remove('skd_weapon_art'); gTag.remove('skd_art_rank');
                    gTag.remove('skd_art_2'); gTag.remove('skd_art_2_rank');
                    gTag.remove('elyrium_inscribed_art');
                    gTag.remove('skd_art_3'); gTag.remove('skd_art_3_rank');
                    gTag.remove('skd_elemental_infusion'); gTag.remove('skd_elemental_stone');
                    saveSafeItemCustomData(gear, gTag);
                }

                if (extractedCount > 0) {
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.2`);
                    player.tell(Text.of(`§a✓ Извлечено ${extractedCount} компонентов обратно в сумку.`));
                } else {
                    player.tell(Text.of('§eℹ В оружии не найдено инкрустированных скрижалей или камней.'));
                }

                if (sess.benchPos) {
                    setStoredBenchWeapon(player.level, sess.benchPos, sess.equipment);
                    updateBenchWorldDisplay(player.level, sess.benchPos, sess.equipment);
                }
                refreshWeaponBenchGUI(player, blockPos);
            };
            s.leftClicked = clickHandler; s.rightClicked = clickHandler;
        });

        gui.slot(7, 2, s => { s.setItem(oakTrim); s.leftClicked = () => {}; s.rightClicked = () => {}; });
        gui.slot(8, 2, s => { s.setItem(oakTrim); s.leftClicked = () => {}; s.rightClicked = () => {}; });

        // ======================================================================
        // РЯД 3 (Y=3): БЫСТРЫЕ ДЕЙСТВИЯ И ВЫХОД
        // ======================================================================

        // 0,3: Авто-оружие из руки
        gui.slot(0, 3, s => {
            s.setItem(Item.of('minecraft:iron_sword').withCustomName(Text.of('§6⚡ [ ВЗЯТЬ ОРУЖИЕ ИЗ РУКИ ]')));
            let clickHandler = () => {
                let sess = getOrCreateBenchSession(player, blockPos);
                let main = player.mainHandItem;
                if (main && !main.isEmpty() && isWeaponItem(main)) {
                    if (sess.equipment && !sess.equipment.isEmpty()) player.give(sess.equipment);
                    sess.equipment = main.split(1);
                    if (sess.benchPos) {
                        setStoredBenchWeapon(player.level, sess.benchPos, sess.equipment);
                        updateBenchWorldDisplay(player.level, sess.benchPos, sess.equipment);
                    }
                    player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                }
                refreshWeaponBenchGUI(player, blockPos);
            };
            s.leftClicked = clickHandler; s.rightClicked = clickHandler;
        });

        // 2,3: Авто-вставить резец
        gui.slot(2, 3, s => {
            s.setItem(Item.of('kubejs:weapon_chisel').withCustomName(Text.of('§6🗡 [ АВТО-РЕЗЕЦ ИЗ СУМКИ ]')));
            let clickHandler = () => {
                let sess = getOrCreateBenchSession(player, blockPos);
                let inv = player.inventory;
                for (let i = 0; i < inv.size; i++) {
                    let st = inv.getItem(i);
                    if (st && !st.isEmpty() && st.id === 'kubejs:weapon_chisel') {
                        if (sess.chisel && !sess.chisel.isEmpty()) player.give(sess.chisel);
                        sess.chisel = st.split(1);
                        player.server.runCommandSilent(`playsound minecraft:item.flintandsteel.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                        break;
                    }
                }
                refreshWeaponBenchGUI(player, blockPos);
            };
            s.leftClicked = clickHandler; s.rightClicked = clickHandler;
        });

        // 4,3: Очистить стол (забрать все в сумку)
        gui.slot(4, 3, s => {
            s.setItem(Item.of('minecraft:barrel')
                .withCustomName(Text.of('§c🔄 [ ЗАБРАТЬ ВСЕ СО СТОЛА В СУМКУ ]'))
                .withLore([
                    Text.of('§7Возвращает оружие, резец и материал в сумку.'),
                    Text.of('§73D-модель оружия на столе будет убрана.')
                ]));
            let clickHandler = () => {
                let sess = getOrCreateBenchSession(player, blockPos);
                if (sess.equipment && !sess.equipment.isEmpty()) {
                    player.give(sess.equipment);
                    sess.equipment = null;
                }
                if (sess.chisel && !sess.chisel.isEmpty()) {
                    player.give(sess.chisel);
                    sess.chisel = null;
                }
                if (sess.tierMaterial && !sess.tierMaterial.isEmpty()) {
                    player.give(sess.tierMaterial);
                    sess.tierMaterial = null;
                }
                if (sess.benchPos) {
                    setStoredBenchWeapon(player.level, sess.benchPos, null);
                    clearBenchWorldDisplay(player.level, sess.benchPos);
                }
                player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.2`);
                player.tell(Text.of('§a✓ Все предметы возвращены в сумку.'));
                refreshWeaponBenchGUI(player, blockPos);
            };
            s.leftClicked = clickHandler; s.rightClicked = clickHandler;
        });

        // 6,3: Авто-скрижаль
        gui.slot(6, 3, s => {
            s.setItem(Item.of('kubejs:martial_tablet_whirlwind').withCustomName(Text.of('§e💎 [ АВТО-СКРИЖАЛЬ ИЗ СУМКИ ]')));
            let clickHandler = () => {
                let sess = getOrCreateBenchSession(player, blockPos);
                let gear = sess.equipment;
                if (gear && !gear.isEmpty()) {
                    let inv = player.inventory;
                    for (let i = 0; i < inv.size; i++) {
                        let st = inv.getItem(i);
                        if (st && !st.isEmpty() && isMartialTablet(st)) {
                            let artId = extractTabletArtId(st);
                            let rank = extractTabletRank(st);
                            // Ищем свободный сокет (1, 2 или 3)
                            let targetSlot = null;
                            if (!getWeaponArtInSlot(gear, 1)) targetSlot = 1;
                            else if (hasSocket2(gear) && !getWeaponArtInSlot(gear, 2)) targetSlot = 2;
                            else if (hasSocket3(gear) && !getWeaponArtInSlot(gear, 3)) targetSlot = 3;

                            if (targetSlot) {
                                st.shrink(1);
                                let gTag = getOrCreateSafeCustomData(gear);
                                if (gTag) {
                                    gTag.putString('skd_art_' + targetSlot, artId);
                                    gTag.putInt('skd_art_' + targetSlot + '_rank', rank);
                                    if (targetSlot === 1) {
                                        gTag.putString('skd_weapon_art', artId);
                                        gTag.putInt('skd_art_rank', rank);
                                    } else if (targetSlot === 2) {
                                        gTag.putString('elyrium_inscribed_art', artId);
                                    }
                                    saveSafeItemCustomData(gear, gTag);
                                }
                                player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                                player.tell(Text.of(`§a✓ Скрижаль инкрустирована в Слот ${targetSlot}!`));
                                break;
                            }
                        }
                    }
                }
                if (sess.benchPos) {
                    setStoredBenchWeapon(player.level, sess.benchPos, sess.equipment);
                    updateBenchWorldDisplay(player.level, sess.benchPos, sess.equipment);
                }
                refreshWeaponBenchGUI(player, blockPos);
            };
            s.leftClicked = clickHandler; s.rightClicked = clickHandler;
        });

        // 8,3: Выход
        gui.slot(8, 3, s => {
            s.setItem(Item.of('minecraft:barrier').withCustomName(Text.of('§c✖ [ ЗАКРЫТЬ МЕНЮ ]')));
            let clickHandler = () => {
                clearAndRefundBenchSession(player, true);
                player.closeChestGUI();
            };
            s.leftClicked = clickHandler; s.rightClicked = clickHandler;
        });

        // ======================================================================
        // ИНТЕЛЛЕКТУАЛЬНЫЙ 1-КЛИК РОУТИНГ ИЗ ИНВЕНТАРЯ ИГРОКА (gui.inventoryClicked)
        // ======================================================================
        gui.inventoryClicked = event => {
            let clickedItem = event.item;
            if (!clickedItem || clickedItem.isEmpty() || clickedItem.id === 'minecraft:air') return;

            // 1. Оружие ➔ Слот I
            if (isWeaponItem(clickedItem)) {
                let toEquip = clickedItem.copy();
                toEquip.setCount(1);
                clickedItem.shrink(1);
                event.setItem(clickedItem);

                if (session.equipment && !session.equipment.isEmpty()) {
                    player.give(session.equipment);
                }
                session.equipment = toEquip;
                if (session.benchPos) {
                    setStoredBenchWeapon(player.level, session.benchPos, session.equipment);
                    updateBenchWorldDisplay(player.level, session.benchPos, session.equipment);
                }
                player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                refreshWeaponBenchGUI(player, blockPos);
                return;
            }

            // 2. Резец Оружейника ➔ Слот Резца
            if (clickedItem.id === 'kubejs:weapon_chisel') {
                let toChisel = clickedItem.copy();
                toChisel.setCount(1);
                clickedItem.shrink(1);
                event.setItem(clickedItem);

                if (session.chisel && !session.chisel.isEmpty()) {
                    player.give(session.chisel);
                }
                session.chisel = toChisel;
                player.server.runCommandSilent(`playsound minecraft:item.flintandsteel.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                refreshWeaponBenchGUI(player, blockPos);
                return;
            }

            // 3. Тировый слиток ➔ Слот Слитка
            if (isTier4SocketMaterial(clickedItem) || isTier7SocketMaterial(clickedItem)) {
                let toMat = clickedItem.copy();
                event.setItem(Item.empty);

                if (session.tierMaterial && !session.tierMaterial.isEmpty()) {
                    player.give(session.tierMaterial);
                }
                session.tierMaterial = toMat;
                player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
                refreshWeaponBenchGUI(player, blockPos);
                return;
            }

            // 4. Камень Стихии ➔ Слот 4
            if (WB_ELEMENTAL_STONES[clickedItem.id]) {
                let gear = session.equipment;
                if (gear && !gear.isEmpty()) {
                    let info = WB_ELEMENTAL_STONES[clickedItem.id];
                    clickedItem.shrink(1);
                    event.setItem(clickedItem);

                    let elemOld = getElementalInfusion(gear);
                    if (elemOld) {
                        player.give(Item.of('kubejs:elemental_stone_' + elemOld));
                    }
                    let gTag = getOrCreateSafeCustomData(gear);
                    if (gTag) {
                        gTag.putString('skd_elemental_infusion', info.elem);
                        gTag.putString('skd_elemental_stone', clickedItem.id);
                        saveSafeItemCustomData(gear, gTag);
                    }
                    player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                    player.server.runCommandSilent(`particle minecraft:wax_off ${player.x} ${player.y + 1} ${player.z} 0.3 0.3 0.3 0.05 20`);
                    player.tell(Text.of(`§a✓ Инфузия Стихии ${info.name} успешно инкрустирована в Слот 4!`));
                    if (session.benchPos) {
                        setStoredBenchWeapon(player.level, session.benchPos, session.equipment);
                        updateBenchWorldDisplay(player.level, session.benchPos, session.equipment);
                    }
                    refreshWeaponBenchGUI(player, blockPos);
                    return;
                }
            }

            // 5. Трактат Боевых Искусств ➔ Первый свободный сокет (1, 2 или 3)
            if (isMartialTablet(clickedItem)) {
                let gear = session.equipment;
                if (gear && !gear.isEmpty()) {
                    let artId = extractTabletArtId(clickedItem);
                    let rank = extractTabletRank(clickedItem);

                    let targetSlot = null;
                    if (!getWeaponArtInSlot(gear, 1)) targetSlot = 1;
                    else if (hasSocket2(gear) && !getWeaponArtInSlot(gear, 2)) targetSlot = 2;
                    else if (hasSocket3(gear) && !getWeaponArtInSlot(gear, 3)) targetSlot = 3;

                    if (targetSlot) {
                        clickedItem.shrink(1);
                        event.setItem(clickedItem);
                        let gTag = getOrCreateSafeCustomData(gear);
                        if (gTag) {
                            gTag.putString('skd_art_' + targetSlot, artId);
                            gTag.putInt('skd_art_' + targetSlot + '_rank', rank);
                            if (targetSlot === 1) {
                                gTag.putString('skd_weapon_art', artId);
                                gTag.putInt('skd_art_rank', rank);
                            } else if (targetSlot === 2) {
                                gTag.putString('elyrium_inscribed_art', artId);
                            }
                            saveSafeItemCustomData(gear, gTag);
                        }
                        player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 0.8 1.4`);
                        player.server.runCommandSilent(`particle minecraft:wax_off ${player.x} ${player.y + 1} ${player.z} 0.3 0.3 0.3 0.05 20`);
                        player.tell(Text.of(`§a✓ Боевое Искусство инкрустировано в Слот ${targetSlot}!`));
                        if (session.benchPos) {
                            setStoredBenchWeapon(player.level, session.benchPos, session.equipment);
                            updateBenchWorldDisplay(player.level, session.benchPos, session.equipment);
                        }
                        refreshWeaponBenchGUI(player, blockPos);
                        return;
                    } else {
                        player.tell(Text.of('§eℹ Нет открытых свободных сокетов для установки скрижали.'));
                    }
                }
            }
        };
    });
}

function refreshWeaponBenchGUI(player, blockPos) {
    let session = getOrCreateBenchSession(player, blockPos);
    session.refreshingTime = Date.now();
    openWeaponBenchGUI(player, blockPos ? { level: player.level, x: blockPos.x, y: blockPos.y, z: blockPos.z, properties: { facing: blockPos.facing } } : null);
}

// ------------------------------------------------------------------------------
// ИНТЕГРАЦИЯ С МИРОМ: БЛОК И ВЗАИМОДЕЙСТВИЕ
// ------------------------------------------------------------------------------

// 1. Клик ПКМ по блоку Оружейного Стола
BlockEvents.rightClicked('kubejs:weapon_bench', event => {
    let player = event.player;
    if (!player || player.level.isClientSide()) return;

    let handStr = event.hand ? String(event.hand) : 'MAIN_HAND';
    if (!handStr.includes('MAIN')) return;

    let block = event.block;
    let facingStr = 'NORTH';
    try {
        if (block.properties && block.properties.facing) facingStr = String(block.properties.facing).toUpperCase();
    } catch (e) {}

    let blockPos = {
        dim: String(block.level.dimension),
        x: block.x,
        y: block.y,
        z: block.z,
        facing: facingStr
    };

    // Если игрок приседает (Shift+ПКМ):
    if (player.isCrouching()) {
        let stored = getStoredBenchWeapon(player.level, blockPos);
        let main = player.mainHandItem;

        // Если в руке оружие, а стол пуст — моментальная установка на верстак
        if ((!stored || stored.isEmpty()) && main && !main.isEmpty() && isWeaponItem(main)) {
            event.cancel();
            let equipped = main.split(1);
            setStoredBenchWeapon(player.level, blockPos, equipped);
            updateBenchWorldDisplay(player.level, blockPos, equipped);
            player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.2`);
            player.tell(Text.of('§6⚔ Оружие установлено на Оружейный Стол.'));
            return;
        }

        // Если рука пуста, а на столе лежит оружие — моментальное снятие со стола
        if (stored && !stored.isEmpty() && (!main || main.isEmpty() || main.id === 'minecraft:air')) {
            event.cancel();
            player.give(stored);
            setStoredBenchWeapon(player.level, blockPos, null);
            clearBenchWorldDisplay(player.level, blockPos);
            player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
            player.tell(Text.of('§6⚔ Оружие снято с Оружейного Стола в сумку.'));
            return;
        }
    }

    event.cancel();
    openWeaponBenchGUI(player, block);
    player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.8 1.0`);
});

// 2. Перехват клика ПКМ с предметом в руке
ItemEvents.rightClicked(event => {
    let player = event.player;
    if (!player || player.level.isClientSide()) return;

    let handStr = event.hand ? String(event.hand) : 'MAIN_HAND';
    if (!handStr.includes('MAIN')) return;

    let target = event.target || (player.rayTrace ? player.rayTrace(5.0) : null);
    if (target && target.block && String(target.block.id) === 'kubejs:weapon_bench') {
        event.cancel();
        openWeaponBenchGUI(player, target.block);
        player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 0.8 1.0`);
    }
});

// 3. Демонтаж блока (разрушение стола)
BlockEvents.broken('kubejs:weapon_bench', event => {
    let block = event.block;
    let level = block.level;
    let pos = {
        dim: String(level.dimension),
        x: block.x,
        y: block.y,
        z: block.z
    };

    // Удаляем In-World 3D Display
    clearBenchWorldDisplay(level, pos);

    // Если на столе лежало оружие, гарантированно дропаем его в мир
    let stored = getStoredBenchWeapon(level, pos);
    if (stored && !stored.isEmpty()) {
        block.popItem(stored);
        setStoredBenchWeapon(level, pos, null);
    }
});

// 4. Закрытие инвентаря игроком
PlayerEvents.inventoryClosed(event => {
    let player = event.player;
    if (player) {
        clearAndRefundBenchSession(player, false);
    }
});

PlayerEvents.loggedOut(event => {
    let player = event.player;
    if (player) {
        clearAndRefundBenchSession(player, true);
    }
});

// 5. Тестовая чат-команда для быстрого доступа
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;
    event.register(
        Commands.literal('weapon_bench')
            .executes(ctx => {
                let p = ctx.source.player;
                if (p) openWeaponBenchGUI(p, null);
                return 1;
            })
    );
});
