// ==============================================================================
// 🔮 ELYRIUM RPG: RUNIC ENCHANTING & GLYPH INSCRIPTION ENGINE
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 100% Deterministic ARPG Enchanting.
// How to Inscribe:
// - Hold the Equipment in Main Hand and the Glyph in Off-Hand (or right-click Glyph with gear in Off-Hand).
// - Requires 1x `kubejs:runic_ink` in inventory.
// - Maximum 2 Glyphs per item (Enchantment Capacity).
// - 100% preserved through Infernal Crucible Ascension (Tab 3).
// ==============================================================================

const GLYPH_CONFIG = {
    'kubejs:glyph_sharpness': {
        name: 'Острота',
        color: '§c',
        slot: 'weapon',
        nativeEnchant: 'minecraft:sharpness',
        nativeLevel: 5,
        desc: '+20% Физического Урона'
    },
    'kubejs:glyph_protection': {
        name: 'Защита',
        color: '§b',
        slot: 'armor',
        nativeEnchant: 'minecraft:protection',
        nativeLevel: 4,
        desc: '+12% Снижения Урона'
    },
    'kubejs:glyph_unbreaking': {
        name: 'Несокрушимость',
        color: '§a',
        slot: 'any',
        nativeEnchant: 'minecraft:unbreaking',
        nativeLevel: 3,
        desc: '+50% Сохранение Прочности'
    },
    'kubejs:glyph_vampirism': {
        name: 'Вампиризм',
        color: '§5',
        slot: 'weapon',
        nativeEnchant: null,
        desc: '+6% Вампиризма Здоровья'
    },
    'kubejs:glyph_swiftness': {
        name: 'Легконогость',
        color: '§e',
        slot: 'feet',
        nativeEnchant: 'minecraft:depth_strider',
        nativeLevel: 3,
        desc: '+10% Скорости Передвижения'
    },
    'kubejs:glyph_elemental': {
        name: 'Стихийный Гнев',
        color: '§6',
        slot: 'weapon',
        nativeEnchant: 'minecraft:fire_aspect',
        nativeLevel: 2,
        desc: '+15% Стихийного Урона'
    }
};

function getGearGlyphs(item) {
    if (!item || item.isEmpty()) return [];
    try {
        if (item.customData && item.customData.contains('elyrium_glyphs')) {
            let list = item.customData.get('elyrium_glyphs');
            if (list) {
                let res = [];
                for (let i = 0; i < list.size(); i++) {
                    res.push(String(list.get(i).getAsString()));
                }
                return res;
            }
        }
    } catch (e) {}
    return [];
}

function addGearGlyph(item, glyphId) {
    if (!item || item.isEmpty() || !glyphId) return false;
    let glyphs = getGearGlyphs(item);
    if (glyphs.length >= 2) return false;
    if (glyphs.includes(glyphId)) return false;

    glyphs.push(glyphId);

    try {
        let ListTag = Java.loadClass('net.minecraft.nbt.ListTag');
        let StringTag = Java.loadClass('net.minecraft.nbt.StringTag');
        let CompoundTag = Java.loadClass('net.minecraft.nbt.CompoundTag');
        let CustomData = Java.loadClass('net.minecraft.world.item.component.CustomData');
        let DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents');

        let cd = item.get(DataComponents.CUSTOM_DATA);
        let tag = cd ? cd.copyTag() : new CompoundTag();

        let listTag = new ListTag();
        glyphs.forEach(g => listTag.add(StringTag.valueOf(g)));
        tag.put('elyrium_glyphs', listTag);
        item.set(DataComponents.CUSTOM_DATA, CustomData.of(tag));

        // Native enchantment application if available
        let cfg = GLYPH_CONFIG[glyphId];
        if (cfg && cfg.nativeEnchant) {
            item.enchant(cfg.nativeEnchant, cfg.nativeLevel);
        }

        return true;
    } catch (err) {
        console.error('[RunicEnchanting] Error stamping glyph: ' + err);
        return false;
    }
}

function isEligibleGearForGlyph(item, glyphId) {
    if (!item || item.isEmpty()) return false;
    let cfg = GLYPH_CONFIG[glyphId];
    if (!cfg) return false;

    let id = String(item.id).toLowerCase();
    let isWeapon = item.hasTag('minecraft:swords') || item.hasTag('c:weapons') || id.includes('sword') || id.includes('blade') || id.includes('axe') || id.includes('claymore');
    let isArmor = item.hasTag('minecraft:armors') || item.hasTag('c:armors') || id.includes('helmet') || id.includes('chestplate') || id.includes('leggings') || id.includes('boots');
    let isBoots = item.hasTag('minecraft:foot_armor') || id.includes('boots');

    if (cfg.slot === 'any') return isWeapon || isArmor;
    if (cfg.slot === 'weapon') return isWeapon;
    if (cfg.slot === 'armor') return isArmor;
    if (cfg.slot === 'feet') return isBoots;
    return false;
}

// ------------------------------------------------------------------------------
// INTERACTION: RIGHT-CLICK GLYPH TO INSCRIBE ONTO GEAR
// ------------------------------------------------------------------------------
ItemEvents.rightClicked(event => {
    let player = event.player;
    if (!player || player.isFake()) return;

    let mainItem = player.mainHandItem;
    let offItem = player.offHandItem;

    let glyphItem = null;
    let gearItem = null;
    let isGlyphMain = false;

    if (mainItem && GLYPH_CONFIG[mainItem.id]) {
        glyphItem = mainItem;
        gearItem = offItem;
        isGlyphMain = true;
    } else if (offItem && GLYPH_CONFIG[offItem.id]) {
        glyphItem = offItem;
        gearItem = mainItem;
        isGlyphMain = false;
    }

    if (!glyphItem) return;

    let glyphId = String(glyphItem.id);
    let cfg = GLYPH_CONFIG[glyphId];

    if (!gearItem || gearItem.isEmpty()) {
        player.tell(Text.of(`§d🔮 [Начертание Чар] §7Возьмите экипировку во вторую руку для начертания ${cfg.color}«${cfg.name}»§7!`));
        return;
    }

    if (!isEligibleGearForGlyph(gearItem, glyphId)) {
        player.tell(Text.of(`§c[Начертание] ${cfg.color}«${cfg.name}» §cне подходит для данного типа предмета (Требуется: ${cfg.slot})!`));
        return;
    }

    let existingGlyphs = getGearGlyphs(gearItem);
    if (existingGlyphs.length >= 2) {
        player.tell(Text.of('§c[Начертание] Лимит чар исчерпан! Максимум 2 Древних Глифа на один предмет.'));
        return;
    }

    if (existingGlyphs.includes(glyphId)) {
        player.tell(Text.of(`§c[Начертание] Предмет уже содержит глиф ${cfg.color}«${cfg.name}»§c!`));
        return;
    }

    // Check Runic Ink requirement
    let inkCount = 0;
    let inv = player.inventory;
    for (let i = 0; i < inv.size; i++) {
        let st = inv.getStackInSlot(i);
        if (st && st.id === 'kubejs:runic_ink') inkCount += st.count;
    }

    if (inkCount < 1) {
        player.tell(Text.of('§c[Начертание] Отсутствует §dРунная Тушь Начертания §c(kubejs:runic_ink) в сумке!'));
        return;
    }

    // Deduct Runic Ink
    for (let i = 0; i < inv.size; i++) {
        let st = inv.getStackInSlot(i);
        if (st && st.id === 'kubejs:runic_ink') {
            st.shrink(1);
            break;
        }
    }

    // Consume Glyph
    glyphItem.shrink(1);

    // Apply Glyph & Enchantment
    let success = addGearGlyph(gearItem, glyphId);
    if (success) {
        let server = player.server;
        let x = player.x, y = player.y, z = player.z;
        server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 1.0 1.2`);
        server.runCommandSilent(`particle minecraft:enchant ~ ~1.2 ~ 0.5 0.5 0.5 0.2 40`);
        server.runCommandSilent(`particle minecraft:witch ~ ~1.0 ~ 0.4 0.4 0.4 0.1 25`);

        player.tell(Text.of(`§a✨ [Начертание Успешно!] §fГлиф ${cfg.color}«${cfg.name}» §fвпечатан в предмет! §7(${cfg.desc})`));
        player.tell(Text.of(`§8[Потенциал Чар: ${existingGlyphs.length + 1}/2]`));
    }
});

// ------------------------------------------------------------------------------
// COMBAT HOOK: VAMPIRISM EFFECT
// ------------------------------------------------------------------------------
EntityEvents.hurt(event => {
    let source = event.source;
    let entity = event.entity;
    if (!source || !entity || !source.actual || !source.actual.isPlayer()) return;

    let player = source.actual;
    let weapon = player.mainHandItem;
    if (!weapon || weapon.isEmpty()) return;

    let glyphs = getGearGlyphs(weapon);
    if (glyphs.includes('kubejs:glyph_vampirism')) {
        let dmg = event.damage || 0;
        if (dmg > 0) {
            let healAmt = Math.max(0.5, dmg * 0.06);
            player.heal(healAmt);
            player.server.runCommandSilent(`particle minecraft:heart ${player.x} ${player.y + 1.2} ${player.z} 0.2 0.2 0.2 0.05 3`);
        }
    }
});
