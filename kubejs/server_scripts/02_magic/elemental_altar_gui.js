// ==============================================================================
// 🔮 ELYRIUM RPG: ELEMENTAL ALTAR GUI & 4-RANK ATTUNEMENT & UPGRADE ENGINE (v0.4.33)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// Intercepts minecraft:enchanting_table right-click:
// - Shift+RightClick OR RightClick with Staff / Elemental Stone opens Elemental Altar.
// - 4-Row Premier RPG ChestMenu:
//   * Slot I   (2, 1): Staff / Mage Implement / Weapon
//   * Slot II  (4, 1): Elemental Stone (Ranks I..IV)
//   * Slot III (6, 1): Upgrade Material Catalyst (Iron/Steel -> Netherite/Cinder -> Zanite/Gravitite)
//   * Button A (2, 2): «Настроить Посох» (+5% / +10% / +18% / +25% Spell Power по рангу)
//   * Button B (4, 2): «Улучшить Камень (I➔II➔III➔IV)» (Повышение ранга катализатора на Алтаре)
//   * Button C (6, 2): «Извлечь Камень» (Безопасный возврат камня в инвентарь без потерь)
//   * Button Close (8, 3): [✖] Закрыть Алтарь
// - Complete 1-Click Inventory Routing (gui.inventoryClicked)
// - Safe Item Refund on Close or Disconnect
// ==============================================================================

const ALTAR_STONE_REGISTRY = {
    // Rank I (5% spell power)
    'kubejs:elemental_stone_fire':      { elem: 'fire', rank: 1, name: 'Пламя', color: '§c', rankRoman: 'I', bonusPct: 5, upgradeMat: 'minecraft:iron_ingot', upgradeMatName: 'Железный слиток', upgradeMatCount: 4, nextStone: 'kubejs:elemental_stone_fire_2' },
    'kubejs:elemental_stone_frost':     { elem: 'frost', rank: 1, name: 'Лед', color: '§b', rankRoman: 'I', bonusPct: 5, upgradeMat: 'minecraft:iron_ingot', upgradeMatName: 'Железный слиток', upgradeMatCount: 4, nextStone: 'kubejs:elemental_stone_frost_2' },
    'kubejs:elemental_stone_lightning': { elem: 'lightning', rank: 1, name: 'Молния', color: '§e', rankRoman: 'I', bonusPct: 5, upgradeMat: 'minecraft:iron_ingot', upgradeMatName: 'Железный слиток', upgradeMatCount: 4, nextStone: 'kubejs:elemental_stone_lightning_2' },
    'kubejs:elemental_stone_nature':    { elem: 'nature', rank: 1, name: 'Природа', color: '§a', rankRoman: 'I', bonusPct: 5, upgradeMat: 'minecraft:iron_ingot', upgradeMatName: 'Железный слиток', upgradeMatCount: 4, nextStone: 'kubejs:elemental_stone_nature_2' },
    'kubejs:elemental_stone_holy':      { elem: 'holy', rank: 1, name: 'Свет', color: '§6', rankRoman: 'I', bonusPct: 5, upgradeMat: 'minecraft:iron_ingot', upgradeMatName: 'Железный слиток', upgradeMatCount: 4, nextStone: 'kubejs:elemental_stone_holy_2' },
    'kubejs:elemental_stone_shadow':    { elem: 'shadow', rank: 1, name: 'Бездна', color: '§5', rankRoman: 'I', bonusPct: 5, upgradeMat: 'minecraft:iron_ingot', upgradeMatName: 'Железный слиток', upgradeMatCount: 4, nextStone: 'kubejs:elemental_stone_shadow_2' },

    // Rank II (10% spell power)
    'kubejs:elemental_stone_fire_2':      { elem: 'fire', rank: 2, name: 'Пламя', color: '§c', rankRoman: 'II', bonusPct: 10, upgradeMat: 'minecraft:netherite_ingot', upgradeMatName: 'Незеритовый слиток', upgradeMatCount: 1, nextStone: 'kubejs:elemental_stone_fire_3' },
    'kubejs:elemental_stone_frost_2':     { elem: 'frost', rank: 2, name: 'Лед', color: '§b', rankRoman: 'II', bonusPct: 10, upgradeMat: 'minecraft:netherite_ingot', upgradeMatName: 'Незеритовый слиток', upgradeMatCount: 1, nextStone: 'kubejs:elemental_stone_frost_3' },
    'kubejs:elemental_stone_lightning_2': { elem: 'lightning', rank: 2, name: 'Молния', color: '§e', rankRoman: 'II', bonusPct: 10, upgradeMat: 'minecraft:netherite_ingot', upgradeMatName: 'Незеритовый слиток', upgradeMatCount: 1, nextStone: 'kubejs:elemental_stone_lightning_3' },
    'kubejs:elemental_stone_nature_2':    { elem: 'nature', rank: 2, name: 'Природа', color: '§a', rankRoman: 'II', bonusPct: 10, upgradeMat: 'minecraft:netherite_ingot', upgradeMatName: 'Незеритовый слиток', upgradeMatCount: 1, nextStone: 'kubejs:elemental_stone_nature_3' },
    'kubejs:elemental_stone_holy_2':      { elem: 'holy', rank: 2, name: 'Свет', color: '§6', rankRoman: 'II', bonusPct: 10, upgradeMat: 'minecraft:netherite_ingot', upgradeMatName: 'Незеритовый слиток', upgradeMatCount: 1, nextStone: 'kubejs:elemental_stone_holy_3' },
    'kubejs:elemental_stone_shadow_2':    { elem: 'shadow', rank: 2, name: 'Бездна', color: '§5', rankRoman: 'II', bonusPct: 10, upgradeMat: 'minecraft:netherite_ingot', upgradeMatName: 'Незеритовый слиток', upgradeMatCount: 1, nextStone: 'kubejs:elemental_stone_shadow_3' },

    // Rank III (18% spell power)
    'kubejs:elemental_stone_fire_3':      { elem: 'fire', rank: 3, name: 'Пламя', color: '§c', rankRoman: 'III', bonusPct: 18, upgradeMat: 'aether:zanite_gemstone', upgradeMatName: 'Занит / Гравитит', upgradeMatCount: 2, nextStone: 'kubejs:elemental_stone_fire_4' },
    'kubejs:elemental_stone_frost_3':     { elem: 'frost', rank: 3, name: 'Лед', color: '§b', rankRoman: 'III', bonusPct: 18, upgradeMat: 'aether:zanite_gemstone', upgradeMatName: 'Занит / Гравитит', upgradeMatCount: 2, nextStone: 'kubejs:elemental_stone_frost_4' },
    'kubejs:elemental_stone_lightning_3': { elem: 'lightning', rank: 3, name: 'Молния', color: '§e', rankRoman: 'III', bonusPct: 18, upgradeMat: 'aether:zanite_gemstone', upgradeMatName: 'Занит / Гравитит', upgradeMatCount: 2, nextStone: 'kubejs:elemental_stone_lightning_4' },
    'kubejs:elemental_stone_nature_3':    { elem: 'nature', rank: 3, name: 'Природа', color: '§a', rankRoman: 'III', bonusPct: 18, upgradeMat: 'aether:zanite_gemstone', upgradeMatName: 'Занит / Гравитит', upgradeMatCount: 2, nextStone: 'kubejs:elemental_stone_nature_4' },
    'kubejs:elemental_stone_holy_3':      { elem: 'holy', rank: 3, name: 'Свет', color: '§6', rankRoman: 'III', bonusPct: 18, upgradeMat: 'aether:zanite_gemstone', upgradeMatName: 'Занит / Гравитит', upgradeMatCount: 2, nextStone: 'kubejs:elemental_stone_holy_4' },
    'kubejs:elemental_stone_shadow_3':    { elem: 'shadow', rank: 3, name: 'Бездна', color: '§5', rankRoman: 'III', bonusPct: 18, upgradeMat: 'aether:zanite_gemstone', upgradeMatName: 'Занит / Гравитит', upgradeMatCount: 2, nextStone: 'kubejs:elemental_stone_shadow_4' },

    // Rank IV (25% spell power - MAX)
    'kubejs:elemental_stone_fire_4':      { elem: 'fire', rank: 4, name: 'Пламя', color: '§c', rankRoman: 'IV', bonusPct: 25, upgradeMat: null, upgradeMatName: null, upgradeMatCount: 0, nextStone: null },
    'kubejs:elemental_stone_frost_4':     { elem: 'frost', rank: 4, name: 'Лед', color: '§b', rankRoman: 'IV', bonusPct: 25, upgradeMat: null, upgradeMatName: null, upgradeMatCount: 0, nextStone: null },
    'kubejs:elemental_stone_lightning_4': { elem: 'lightning', rank: 4, name: 'Молния', color: '§e', rankRoman: 'IV', bonusPct: 25, upgradeMat: null, upgradeMatName: null, upgradeMatCount: 0, nextStone: null },
    'kubejs:elemental_stone_nature_4':    { elem: 'nature', rank: 4, name: 'Природа', color: '§a', rankRoman: 'IV', bonusPct: 25, upgradeMat: null, upgradeMatName: null, upgradeMatCount: 0, nextStone: null },
    'kubejs:elemental_stone_holy_4':      { elem: 'holy', rank: 4, name: 'Свет', color: '§6', rankRoman: 'IV', bonusPct: 25, upgradeMat: null, upgradeMatName: null, upgradeMatCount: 0, nextStone: null },
    'kubejs:elemental_stone_shadow_4':    { elem: 'shadow', rank: 4, name: 'Бездна', color: '§5', rankRoman: 'IV', bonusPct: 25, upgradeMat: null, upgradeMatName: null, upgradeMatCount: 0, nextStone: null }
};

const ELEMENT_DEFAULT_NAMES = {
    'fire': { name: 'Пламя', color: '§c' },
    'frost': { name: 'Лед', color: '§b' },
    'lightning': { name: 'Молния', color: '§e' },
    'nature': { name: 'Природа', color: '§a' },
    'holy': { name: 'Свет', color: '§6' },
    'shadow': { name: 'Бездна', color: '§5' }
};

// Player Altar Sessions
let activeAltarSessions = new Map();

function getOrCreateAltarSession(player) {
    let uuid = player.uuid.toString();
    if (!activeAltarSessions.has(uuid)) {
        activeAltarSessions.set(uuid, {
            staff: null,
            stone: null,
            catalyst: null,
            refreshingTime: 0
        });
    }
    return activeAltarSessions.get(uuid);
}

function clearAndRefundAltarSession(player, force) {
    let uuid = player.uuid.toString();
    let session = activeAltarSessions.get(uuid);
    if (!session) return;

    if (!force && session.refreshingTime && (Date.now() - session.refreshingTime < 350)) {
        return;
    }

    if (session.staff && !session.staff.isEmpty()) {
        player.give(session.staff);
        session.staff = null;
    }
    if (session.stone && !session.stone.isEmpty()) {
        player.give(session.stone);
        session.stone = null;
    }
    if (session.catalyst && !session.catalyst.isEmpty()) {
        player.give(session.catalyst);
        session.catalyst = null;
    }

    activeAltarSessions.delete(uuid);
}

// ------------------------------------------------------------------------------
// HELPER NBT & ATTUNEMENT FUNCTIONS
// ------------------------------------------------------------------------------

function isStaffOrMageWeapon(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = String(item.id).toLowerCase();
    return id.includes('staff') || id.includes('rod') || id.includes('cane') ||
           id.includes('wand') || id.includes('grimoire') || id.includes('spell_book') ||
           id.includes('tome') || item.hasTag('c:tools') || item.hasTag('minecraft:swords');
}

function getAttunedElement(item) {
    if (!item || item.isEmpty()) return null;
    try {
        if (item.customData && item.customData.contains('elyrium_attuned_element')) {
            return String(item.customData.getString('elyrium_attuned_element')).toLowerCase().trim();
        }
    } catch (e) {}
    try {
        if (item.nbt && item.nbt.contains('elyrium_attuned_element')) {
            return String(item.nbt.getString('elyrium_attuned_element')).toLowerCase().trim();
        }
    } catch (e2) {}
    return null;
}

function getAttunedRank(item) {
    if (!item || item.isEmpty()) return 1;
    try {
        if (item.customData && item.customData.contains('elyrium_attuned_rank')) {
            return Math.max(1, Math.min(4, item.customData.getInt('elyrium_attuned_rank')));
        }
    } catch (e) {}
    try {
        if (item.nbt && item.nbt.contains('elyrium_attuned_rank')) {
            return Math.max(1, Math.min(4, item.nbt.getInt('elyrium_attuned_rank')));
        }
    } catch (e2) {}
    return 1;
}

function setAttunedElement(item, elementId, rank) {
    if (!item || item.isEmpty()) return false;
    let norm = String(elementId).toLowerCase().trim();
    let r = Math.max(1, Math.min(4, rank || 1));
    try {
        if (item.customData) {
            item.customData.putString('elyrium_attuned_element', norm);
            item.customData.putInt('elyrium_attuned_rank', r);
            return true;
        }
    } catch (e) {}
    try {
        if (item.nbt) {
            item.nbt.putString('elyrium_attuned_element', norm);
            item.nbt.putInt('elyrium_attuned_rank', r);
            return true;
        }
    } catch (e2) {}
    return false;
}

function removeAttunedElement(item) {
    if (!item || item.isEmpty()) return false;
    let removed = false;
    try {
        if (item.customData) {
            if (item.customData.contains('elyrium_attuned_element')) {
                item.customData.remove('elyrium_attuned_element');
                removed = true;
            }
            if (item.customData.contains('elyrium_attuned_rank')) {
                item.customData.remove('elyrium_attuned_rank');
            }
        }
    } catch (e) {}
    try {
        if (item.nbt) {
            if (item.nbt.contains('elyrium_attuned_element')) {
                item.nbt.remove('elyrium_attuned_element');
                removed = true;
            }
            if (item.nbt.contains('elyrium_attuned_rank')) {
                item.nbt.remove('elyrium_attuned_rank');
            }
        }
    } catch (e2) {}
    return removed;
}

function matchesUpgradeCatalyst(catalystItem, requiredMatId) {
    if (!catalystItem || catalystItem.isEmpty() || !requiredMatId) return false;
    let cId = String(catalystItem.id).toLowerCase();
    let rId = String(requiredMatId).toLowerCase();

    if (cId === rId) return true;

    // Support alternatives for Rank I -> II: steel_ingot
    if (rId === 'minecraft:iron_ingot' && (cId === 'kubejs:steel_ingot' || cId.includes('steel'))) return true;

    // Support alternatives for Rank II -> III: cinder alloy
    if (rId === 'minecraft:netherite_ingot' && (cId.includes('cinder') || cId.includes('ignitium'))) return true;

    // Support alternatives for Rank III -> IV: gravitite or skyjade
    if (rId === 'aether:zanite_gemstone' && (cId.includes('gravitite') || cId.includes('skyjade') || cId.includes('valkyrie'))) return true;

    return false;
}

// ------------------------------------------------------------------------------
// GUI SLOTS FACTORY
// ------------------------------------------------------------------------------

function getSlotStaffItem(session) {
    if (session.staff && !session.staff.isEmpty()) return session.staff;
    return Item.of('minecraft:stick')
        .withCustomName(Text.of('§6✦ [ СЛОТ I: ПОСОХ / ОРУЖИЕ МАГА ] ✦'))
        .withLore([
            Text.of('§7Поместите сюда магический посох или орудие.'),
            Text.of('§8────────────────────────────────'),
            Text.of('§a▶ Нажмите на посох в инвентаре снизу,'),
            Text.of('   §aчтобы быстро поместить его на Алтарь.')
        ]);
}

function getSlotStoneItem(session) {
    if (session.stone && !session.stone.isEmpty()) return session.stone;
    return Item.of('minecraft:amethyst_shard')
        .withCustomName(Text.of('§b✦ [ СЛОТ II: СТИХИЙНЫЙ КАМЕНЬ ] ✦'))
        .withLore([
            Text.of('§7Поместите Стихийный Камень (Ранги I..IV):'),
            Text.of('§c• Пламя  §b• Лед  §e• Молния'),
            Text.of('§6• Свет  §5• Бездна  §a• Природа'),
            Text.of('§8────────────────────────────────'),
            Text.of('§a▶ Нажмите на Камень в инвентаре снизу.')
        ]);
}

function getSlotCatalystItem(session) {
    if (session.catalyst && !session.catalyst.isEmpty()) return session.catalyst;
    return Item.of('minecraft:copper_ingot')
        .withCustomName(Text.of('§e✦ [ СЛОТ III: МАТЕРИАЛ ДЛЯ УЛУЧШЕНИЯ ] ✦'))
        .withLore([
            Text.of('§7Поместите металл для повышения Ранга Камня:'),
            Text.of('§7• I ➔ II:  §fЖелезо / Сталь x4'),
            Text.of('§7• II ➔ III: §4Незерит / Пепельный Сплав x1'),
            Text.of('§7• III ➔ IV: §bЗанит / Гравитит Эфира x2'),
            Text.of('§8────────────────────────────────'),
            Text.of('§a▶ Нажмите на слитки в инвентаре снизу.')
        ]);
}

function getAttuneButtonItem(session) {
    let staff = session.staff;
    let stone = session.stone;
    let currentAttunement = staff ? getAttunedElement(staff) : null;
    let currentRank = staff ? getAttunedRank(staff) : 1;

    if (!staff || staff.isEmpty()) {
        return Item.of('minecraft:gray_dye')
            .withCustomName(Text.of('§8[ УСТАНОВИТЕ ПОСОХ ]'))
            .withLore([Text.of('§7Для проведения ритуала настройки требуется посох.')]);
    }

    if (!stone || stone.isEmpty()) {
        if (currentAttunement) {
            let elemInfo = ELEMENT_DEFAULT_NAMES[currentAttunement] || { name: currentAttunement, color: '§b' };
            let bonusPct = (currentRank === 1) ? 5 : (currentRank === 2) ? 10 : (currentRank === 3) ? 18 : 25;
            return Item.of('minecraft:experience_bottle')
                .withCustomName(Text.of(`§a✦ [ НАСТРОЕН: ${elemInfo.color}${elemInfo.name} §fРанг ${currentRank} §a] ✦`))
                .withLore([
                    Text.of(`§7Текущая сила школы: §a+${bonusPct}% к заклинаниям`),
                    Text.of('§eВставьте другой Камень для перенастройки,'),
                    Text.of('§aили нажмите [Извлечь Камень] для снятия.')
                ]);
        }
        return Item.of('minecraft:gray_dye')
            .withCustomName(Text.of('§8[ ВСТАВЬТЕ СТИХИЙНЫЙ КАМЕНЬ ]'))
            .withLore([Text.of('§7Выберите Камень Стихии (Слот II) для настройки.')]);
    }

    let stoneId = String(stone.id);
    let sInfo = ALTAR_STONE_REGISTRY[stoneId];
    if (!sInfo) {
        return Item.of('minecraft:barrier')
            .withCustomName(Text.of('§c[ НЕВЕРНЫЙ РЕАГЕНТ ]'))
            .withLore([Text.of('§cЭтот предмет не является Камнем Стихии!')]);
    }

    return Item.of('minecraft:nether_star')
        .withCustomName(Text.of(`§6✨ НАСТРОИТЬ ПОСОХ: ${sInfo.color}${sInfo.name} §e[Ранг ${sInfo.rankRoman}]`))
        .withLore([
            Text.of('§8[Ритуал Стихийной Концентрации]'),
            Text.of(`§7• Бонус школы заклинаний: §a+${sInfo.bonusPct}% урона`),
            Text.of(`§7• Ранг катализатора: §eРанг ${sInfo.rankRoman}`),
            Text.of('§8────────────────────────────────'),
            Text.of('§a✓ 100% безопасная настройка без риска поломки!'),
            Text.of('§b✓ Предыдущий камень будет аккуратно возвращен.'),
            Text.of('§e▶ Нажмите сюда для привязки стихии!')
        ]);
}

function getUpgradeStoneButtonItem(session) {
    let stone = session.stone;
    let catalyst = session.catalyst;

    if (!stone || stone.isEmpty()) {
        return Item.of('minecraft:anvil')
            .withCustomName(Text.of('§8[ ВСТАВЬТЕ КАМЕНЬ ДЛЯ УЛУЧШЕНИЯ ]'))
            .withLore([Text.of('§7Поместите Стихийный Камень в Слот II.')]);
    }

    let stoneId = String(stone.id);
    let sInfo = ALTAR_STONE_REGISTRY[stoneId];
    if (!sInfo) {
        return Item.of('minecraft:barrier').withCustomName(Text.of('§c[ НЕВЕРНЫЙ КАМЕНЬ ]'));
    }

    if (sInfo.rank >= 4) {
        return Item.of('minecraft:gold_block')
            .withCustomName(Text.of('§6👑 [ МАКСИМАЛЬНЫЙ РАНГ IV: ПЕРВОРОДНЫЙ ]'))
            .withLore([
                Text.of('§7Этот Камень достиг апогея стихийной мощи!'),
                Text.of('§a✓ +30% физической конверсии в чистый урон'),
                Text.of('§a✓ +25% к силе заклинаний школы'),
                Text.of('§d✓ Разблокирован Ультимейт (Эффект 2) с КД!')
            ]);
    }

    let reqMatName = sInfo.upgradeMatName;
    let reqCount = sInfo.upgradeMatCount;
    let hasCatalyst = catalyst && !catalyst.isEmpty() && matchesUpgradeCatalyst(catalyst, sInfo.upgradeMat);
    let hasCount = hasCatalyst && catalyst.count >= reqCount;

    if (!hasCount) {
        return Item.of('minecraft:flint_and_steel')
            .withCustomName(Text.of(`§c⚒ [ ТРЕБУЕТСЯ: ${reqMatName} x${reqCount} ]`))
            .withLore([
                Text.of(`§7Для улучшения с Ранга ${sInfo.rankRoman} до Ранга ${sInfo.rank + 1}:`),
                Text.of(`§e• Необходим материал: §f${reqMatName} x${reqCount}`),
                Text.of('§8Поместите нужные слитки в Слот III.')
            ]);
    }

    return Item.of('minecraft:smithing_table')
        .withCustomName(Text.of(`§a⚒ УЛУЧШИТЬ КАМЕНЬ: ${sInfo.color}${sInfo.name} §7(Ранг ${sInfo.rankRoman} ➔ ${sInfo.rank + 1})`))
        .withLore([
            Text.of('§8[Великая Трансмутация на Алтаре]'),
            Text.of(`§7• Расход: §e${reqMatName} x${reqCount}`),
            Text.of(`§7• Результат: §b${sInfo.name} [Ранг ${sInfo.rank + 1}]`),
            Text.of('§8────────────────────────────────'),
            Text.of('§a✓ Гарантированное улучшение (100% успех)!'),
            Text.of('§e▶ Нажмите для проведения ритуала улучшения!')
        ]);
}

function getExtractButtonItem(session) {
    let staff = session.staff;
    if (!staff || staff.isEmpty()) {
        return Item.of('minecraft:iron_bars')
            .withCustomName(Text.of('§8[ НЕТ ПОСОХА ДЛЯ ИЗВЛЕЧЕНИЯ ]'));
    }

    let currentElem = getAttunedElement(staff);
    if (!currentElem) {
        return Item.of('minecraft:iron_bars')
            .withCustomName(Text.of('§8[ ПОСОХ НЕ ИМЕЕТ ИНКРУСТАЦИИ ]'))
            .withLore([Text.of('§7В посохе нет установленного стихийного камня.')]);
    }

    let currentRank = getAttunedRank(staff);
    let stoneId = (currentRank > 1) ? `kubejs:elemental_stone_${currentElem}_${currentRank}` : `kubejs:elemental_stone_${currentElem}`;
    let elemInfo = ELEMENT_DEFAULT_NAMES[currentElem] || { name: currentElem, color: '§b' };

    return Item.of('minecraft:shears')
        .withCustomName(Text.of(`§e✂ [ ИЗВЛЕЧЬ КАМЕНЬ: ${elemInfo.color}${elemInfo.name} §fРанг ${currentRank} §e]`))
        .withLore([
            Text.of('§7Безопасно извлекает Стихийный Камень из посоха'),
            Text.of('§7и возвращает его прямо в вашу сумку.'),
            Text.of('§8────────────────────────────────'),
            Text.of('§a✓ Без штрафов, без затрат опыта и без повреждений.'),
            Text.of('§e▶ Нажмите для извлечения камня.')
        ]);
}

// ------------------------------------------------------------------------------
// OPEN & REFRESH GUI
// ------------------------------------------------------------------------------

function openElementalAltarGUI(player) {
    let session = getOrCreateAltarSession(player);

    player.openChestGUI(Text.of('🔮 §5§lАЛТАРЬ СТИХИЙ §8✦ §dНАСТРОЙКА И УЛУЧШЕНИЕ'), 4, gui => {
        gui.playerSlots = true;
        gui.closed = () => {
            clearAndRefundAltarSession(player, false);
        };

        // Frame
        let obsidianFrame = Item.of('minecraft:purple_stained_glass_pane').withCustomName(Text.of('§5✦ Обсидиановая Руническая Рама ✦'));
        let voidTrim = Item.of('minecraft:black_stained_glass_pane').withCustomName(Text.of('§8✦ Грань Бездны ✦'));

        for (let x = 0; x < 9; x++) {
            for (let y = 0; y < 4; y++) {
                gui.slot(x, y, s => {
                    s.setItem((x === 0 || x === 8 || y === 0 || y === 3) ? voidTrim : obsidianFrame);
                    s.leftClicked = () => {}; s.rightClicked = () => {};
                });
            }
        }

        // Info Codex (0, 0)
        gui.slot(0, 0, s => {
            s.setItem(Item.of('minecraft:book')
                .withCustomName(Text.of('§d📖 [ КОДЕКС АЛТАРЯ СТИХИЙ • 4 РАНГА ]'))
                .withLore([
                    Text.of('§7Древнее святилище чародеев Элириума (v0.4.33).'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§6• Настройка Посохов: §f+5% / +10% / +18% / +25% силы спеллов.'),
                    Text.of('§b• Физическое Оружие: §f10% / 18% / 24% / 30% обхода брони.'),
                    Text.of('§a• Улучшение Камней: §fТрансмутация Ранга I ➔ II ➔ III ➔ IV.'),
                    Text.of('§e  - I ➔ II: Железо/Сталь x4'),
                    Text.of('§e  - II ➔ III: Незерит/Пепел x1'),
                    Text.of('§e  - III ➔ IV: Занит/Гравитит x2'),
                    Text.of('§8────────────────────────────────'),
                    Text.of('§a✓ Свободная смена и извлечение в 1 клик без потерь!')
                ]));
            s.leftClicked = () => {}; s.rightClicked = () => {};
        });

        // SLOT I: Staff / Implement (2, 1)
        gui.slot(2, 1, s => {
            s.setItem(getSlotStaffItem(session));
            let click = () => {
                if (session.staff && !session.staff.isEmpty()) {
                    player.give(session.staff);
                    session.staff = null;
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.2`);
                    refreshElementalAltarGUI(player);
                }
            };
            s.leftClicked = click; s.rightClicked = click;
        });

        // Rune Channel 1 (3, 1)
        gui.slot(3, 1, s => {
            s.setItem(Item.of('minecraft:chain').withCustomName(Text.of('§d»»» Стихийный Канал »»»')));
            s.leftClicked = () => {}; s.rightClicked = () => {};
        });

        // SLOT II: Elemental Stone (4, 1)
        gui.slot(4, 1, s => {
            s.setItem(getSlotStoneItem(session));
            let click = () => {
                if (session.stone && !session.stone.isEmpty()) {
                    player.give(session.stone);
                    session.stone = null;
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.2`);
                    refreshElementalAltarGUI(player);
                }
            };
            s.leftClicked = click; s.rightClicked = click;
        });

        // Rune Channel 2 (5, 1)
        gui.slot(5, 1, s => {
            s.setItem(Item.of('minecraft:chain').withCustomName(Text.of('§e««« Катализатор «««')));
            s.leftClicked = () => {}; s.rightClicked = () => {};
        });

        // SLOT III: Upgrade Catalyst (6, 1)
        gui.slot(6, 1, s => {
            s.setItem(getSlotCatalystItem(session));
            let click = () => {
                if (session.catalyst && !session.catalyst.isEmpty()) {
                    player.give(session.catalyst);
                    session.catalyst = null;
                    player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.2`);
                    refreshElementalAltarGUI(player);
                }
            };
            s.leftClicked = click; s.rightClicked = click;
        });

        // BUTTON A: Attune Ritual (2, 2)
        gui.slot(2, 2, s => {
            s.setItem(getAttuneButtonItem(session));
            let click = () => {
                let staff = session.staff;
                let stone = session.stone;
                if (!staff || staff.isEmpty() || !stone || stone.isEmpty()) return;

                let stoneId = String(stone.id);
                let sInfo = ALTAR_STONE_REGISTRY[stoneId];
                if (!sInfo) return;

                // Refund previous stone if already attuned
                let prevElem = getAttunedElement(staff);
                let prevRank = getAttunedRank(staff);
                if (prevElem) {
                    let prevStoneId = (prevRank > 1) ? `kubejs:elemental_stone_${prevElem}_${prevRank}` : `kubejs:elemental_stone_${prevElem}`;
                    player.give(Item.of(prevStoneId));
                    player.tell(Text.of(`§eℹ Предыдущий камень стихии (${prevElem} [Ранг ${prevRank}]) возвращен в инвентарь.`));
                }

                // Consume stone from slot
                stone.shrink(1);
                if (stone.count <= 0) {
                    session.stone = null;
                }

                // Apply attunement
                setAttunedElement(staff, sInfo.elem, sInfo.rank);

                // Audio & visual effects
                player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 1.0 1.2`);
                player.server.runCommandSilent(`playsound minecraft:block.beacon.activate player ${player.username} ~ ~ ~ 0.8 1.5`);
                player.server.runCommandSilent(`particle minecraft:enchant ${player.x} ${player.y + 1.2} ${player.z} 0.5 0.5 0.5 0.5 50 normal`);
                player.server.runCommandSilent(`particle minecraft:end_rod ${player.x} ${player.y + 1} ${player.z} 0.4 0.4 0.4 0.05 25 normal`);

                player.sendSystemMessage(Text.of(`§6✦ РИТУАЛ ЗАВЕРШЕН! §fПосох настроен на стихию: ${sInfo.color}${sInfo.name} §e[Ранг ${sInfo.rankRoman}] §a(+${sInfo.bonusPct}% силы заклинаний)!`), true);
                refreshElementalAltarGUI(player);
            };
            s.leftClicked = click; s.rightClicked = click;
        });

        // BUTTON B: Upgrade Stone (4, 2)
        gui.slot(4, 2, s => {
            s.setItem(getUpgradeStoneButtonItem(session));
            let click = () => {
                let stone = session.stone;
                let catalyst = session.catalyst;
                if (!stone || stone.isEmpty() || !catalyst || catalyst.isEmpty()) return;

                let stoneId = String(stone.id);
                let sInfo = ALTAR_STONE_REGISTRY[stoneId];
                if (!sInfo || sInfo.rank >= 4 || !sInfo.nextStone) return;

                if (!matchesUpgradeCatalyst(catalyst, sInfo.upgradeMat) || catalyst.count < sInfo.upgradeMatCount) {
                    player.tell(Text.of(`§c✖ Недостаточно материалов для улучшения! Требуется: ${sInfo.upgradeMatName} x${sInfo.upgradeMatCount}`));
                    return;
                }

                // Consume catalyst
                catalyst.shrink(sInfo.upgradeMatCount);
                if (catalyst.count <= 0) {
                    session.catalyst = null;
                }

                // Upgrade 1 stone
                let nextStoneId = sInfo.nextStone;
                if (stone.count === 1) {
                    session.stone = Item.of(nextStoneId);
                } else {
                    stone.shrink(1);
                    player.give(Item.of(nextStoneId));
                }

                player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 1.0 1.2`);
                player.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${player.username} ~ ~ ~ 0.8 1.4`);
                player.server.runCommandSilent(`particle minecraft:totem_of_undying ${player.x} ${player.y + 1.2} ${player.z} 0.5 0.5 0.5 0.2 40 normal`);

                player.sendSystemMessage(Text.of(`§a✨ УЛУЧШЕНИЕ ЗАВЕРШЕНО! §fСтихийный Камень ${sInfo.color}${sInfo.name} §fповышен до §eРанга ${sInfo.rank + 1}§f!`), true);
                refreshElementalAltarGUI(player);
            };
            s.leftClicked = click; s.rightClicked = click;
        });

        // BUTTON C: Extract Stone (6, 2)
        gui.slot(6, 2, s => {
            s.setItem(getExtractButtonItem(session));
            let click = () => {
                let staff = session.staff;
                if (!staff || staff.isEmpty()) return;

                let curElem = getAttunedElement(staff);
                if (!curElem) return;

                let curRank = getAttunedRank(staff);
                let stoneId = (curRank > 1) ? `kubejs:elemental_stone_${curElem}_${curRank}` : `kubejs:elemental_stone_${curElem}`;
                player.give(Item.of(stoneId));

                removeAttunedElement(staff);

                player.server.runCommandSilent(`playsound minecraft:block.amethyst_block.break player ${player.username} ~ ~ ~ 0.9 1.4`);
                player.server.runCommandSilent(`particle minecraft:wax_off ${player.x} ${player.y + 1} ${player.z} 0.4 0.4 0.4 0.05 20 normal`);

                player.sendSystemMessage(Text.of(`§e✂ Стихийный Камень (${curElem} [Ранг ${curRank}]) благополучно извлечен из посоха!`), true);
                refreshElementalAltarGUI(player);
            };
            s.leftClicked = click; s.rightClicked = click;
        });

        // BUTTON Close (8, 3)
        gui.slot(8, 3, s => {
            s.setItem(Item.of('minecraft:barrier').withCustomName(Text.of('§c✖ [ ЗАКРЫТЬ АЛТАРЬ ]')));
            let click = () => {
                clearAndRefundAltarSession(player, true);
                player.closeChestGUI();
            };
            s.leftClicked = click; s.rightClicked = click;
        });

        // ----------------------------------------------------------------------
        // INVENTORY 1-CLICK ROUTING
        // ----------------------------------------------------------------------
        gui.inventoryClicked = event => {
            let item = event.item;
            if (!item || item.isEmpty() || item.id === 'minecraft:air') return;

            let itemId = String(item.id);

            // 1. Staff / Mage Weapon -> Slot I
            if (isStaffOrMageWeapon(item) && (!session.staff || session.staff.isEmpty())) {
                let toEquip = item.copy();
                toEquip.setCount(1);
                item.shrink(1);
                event.setItem(item);

                session.staff = toEquip;
                player.server.runCommandSilent(`playsound minecraft:item.armor.equip_leather player ${player.username} ~ ~ ~ 0.8 1.3`);
                refreshElementalAltarGUI(player);
                return;
            }

            // 2. Elemental Stone -> Slot II
            if (ALTAR_STONE_REGISTRY[itemId] && (!session.stone || session.stone.isEmpty())) {
                let toEquip = item.copy();
                toEquip.setCount(1);
                item.shrink(1);
                event.setItem(item);

                session.stone = toEquip;
                player.server.runCommandSilent(`playsound minecraft:block.amethyst_block.place player ${player.username} ~ ~ ~ 0.8 1.4`);
                refreshElementalAltarGUI(player);
                return;
            }

            // 3. Catalyst Materials -> Slot III
            let isCatalystCandidate = itemId === 'minecraft:iron_ingot' || itemId === 'kubejs:steel_ingot' ||
                                     itemId === 'minecraft:netherite_ingot' || itemId.includes('cinder') ||
                                     itemId === 'aether:zanite_gemstone' || itemId.includes('gravitite');
            if (isCatalystCandidate && (!session.catalyst || session.catalyst.isEmpty())) {
                let toEquip = item.copy();
                item.setCount(0);
                event.setItem(item);

                session.catalyst = toEquip;
                player.server.runCommandSilent(`playsound minecraft:item.armor.equip_iron player ${player.username} ~ ~ ~ 0.8 1.4`);
                refreshElementalAltarGUI(player);
                return;
            }
        };
    });
}

function refreshElementalAltarGUI(player) {
    let session = getOrCreateAltarSession(player);
    session.refreshingTime = Date.now();
    openElementalAltarGUI(player);
}

// ------------------------------------------------------------------------------
// INTERACTION & COMMAND HOOKS
// ------------------------------------------------------------------------------

ItemEvents.rightClicked(event => {
    let player = event.player;
    if (!player || player.level.isClientSide()) return;

    let handStr = event.hand ? String(event.hand) : 'MAIN_HAND';
    if (!handStr.includes('MAIN')) return;

    let target = event.target || (player.rayTrace ? player.rayTrace(5.0) : null);
    if (target && target.block && String(target.block.id) === 'minecraft:enchanting_table') {
        event.cancel();
        openElementalAltarGUI(player);
    }
});

PlayerEvents.inventoryClosed(event => {
    let player = event.player;
    if (player) {
        clearAndRefundAltarSession(player, false);
    }
});

PlayerEvents.loggedOut(event => {
    let player = event.player;
    if (player) {
        clearAndRefundAltarSession(player, true);
    }
});

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;
    event.register(
        Commands.literal('elemental_altar')
            .executes(ctx => {
                let p = ctx.source.player;
                if (p) openElementalAltarGUI(p);
                return 1;
            })
    );
});
