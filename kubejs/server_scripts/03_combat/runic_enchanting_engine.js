// ==============================================================================
// 🔮 ELYRIUM RPG: RUNIC ENCHANTING & GLYPH INSCRIPTION ENGINE (v2.0)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 100% Deterministic ARPG Multi-Tier Enchanting:
// - 2-Slot Capacity per item (Enchantment Capacity: max 2).
// - Multi-tier world progression (T1..T8).
// - 5 Rarity Grades: Common ⚪ -> Uncommon 🟢 -> Rare 🔵 -> Epic 🟣 -> Legendary 🟠
// - In-Place Upgrades: applying duplicate glyph upgrades quality on the weapon!
// - In-Place Tier Evolution: applying higher-tier glyph upgrades tier on the weapon!
// - 100% preserved through Forge Ascension.
// ==============================================================================

const GLYPH_DATA = {
    'sharpness': {
        name: 'Заточка',
        color: '§c',
        slot: 'weapon',
        baseValue: 3.0,
        tierScale: 0.35,
        unit: '% физ. урона',
        nativeEnchant: 'minecraft:sharpness'
    },
    'elemental': {
        name: 'Стихийный Раскол',
        color: '§6',
        slot: 'weapon',
        baseValue: 2.5,
        tierScale: 0.35,
        unit: '% стихийного урона',
        nativeEnchant: 'minecraft:fire_aspect'
    },
    'vampirism': {
        name: 'Похищение Жизни',
        color: '§5',
        slot: 'weapon',
        baseValue: 1.0,
        tierScale: 0.50,
        unit: '% отхила в HP',
        nativeEnchant: null
    },
    'executioner': {
        name: 'Казнь Палача',
        color: '§4',
        slot: 'weapon',
        baseValue: 4.0,
        tierScale: 0.40,
        unit: '% урона по целям <30% HP',
        nativeEnchant: 'minecraft:smite'
    },
    'protection': {
        name: 'Оплот',
        color: '§b',
        slot: 'armor',
        baseValue: 1.5,
        tierScale: 0.35,
        unit: '% защиты',
        nativeEnchant: 'minecraft:protection'
    },
    'unbreaking': {
        name: 'Несокрушимость',
        color: '§a',
        slot: 'any',
        baseValue: 12.0,
        tierScale: 0.30,
        unit: '% сохранения прочности',
        nativeEnchant: 'minecraft:unbreaking'
    },
    'bastion': {
        name: 'Бастион',
        color: '§9',
        slot: 'armor',
        baseValue: 5.0,
        tierScale: 0.40,
        unit: '% стойки блока',
        nativeEnchant: null
    },
    'swiftness': {
        name: 'Скороход',
        color: '§e',
        slot: 'feet',
        baseValue: 2.0,
        tierScale: 0.35,
        unit: '% скорости бега',
        nativeEnchant: 'minecraft:depth_strider'
    },
    'mystic_flow': {
        name: 'Рунный Приток',
        color: '§3',
        slot: 'head',
        baseValue: 15.0,
        tierScale: 0.35,
        unit: ' маны / +5% стамины',
        nativeEnchant: null
    }
};

const RARITY_INFO = [
    { name: 'Обычный', color: '§f', mult: 1.00 },
    { name: 'Необычный', color: '§a', mult: 1.15 },
    { name: 'Редкий', color: '§9', mult: 1.30 },
    { name: 'Эпический', color: '§5', mult: 1.50 },
    { name: 'Легендарный', color: '§6', mult: 1.75 }
];

function getMaxRarityForTier(tier) {
    if (tier <= 3) return 2; // Rare (🔵)
    if (tier <= 6) return 3; // Epic (🟣)
    return 4; // Legendary (🟠)
}

function parseGlyphItemId(itemId) {
    if (!itemId) return null;
    let s = String(itemId).replace('kubejs:', '');
    if (!s.startsWith('glyph_')) return null;

    let rest = s.replace('glyph_', '');
    let parts = rest.split('_t');
    let type = parts[0];
    let tier = parts.length > 1 ? parseInt(parts[1], 10) : 1;

    // Special default tiers for glyphs that start higher
    if (parts.length === 1) {
        if (type === 'vampirism' || type === 'bastion') tier = 2;
    }

    if (!GLYPH_DATA[type]) return null;
    return { type: type, tier: isNaN(tier) ? 1 : tier };
}

function getGearGlyphs(item) {
    if (!item || item.isEmpty()) return [];
    let result = [];
    try {
        if (item.customData && item.customData.contains('elyrium_glyphs')) {
            let list = item.customData.get('elyrium_glyphs');
            if (list) {
                for (let i = 0; i < list.size(); i++) {
                    let entry = list.get(i);
                    // Structured CompoundTag support
                    if (entry.getAsCompound) {
                        let c = entry.getAsCompound();
                        let type = c.getString('type');
                        let tier = c.getInt('tier') || 1;
                        let rarity = c.getInt('rarity') || 0;
                        if (type && GLYPH_DATA[type]) {
                            result.push({ type: type, tier: tier, rarity: rarity });
                        }
                    } else {
                        // Legacy string fallback
                        let str = String(entry.getAsString());
                        let parsed = parseGlyphItemId(str);
                        if (parsed) {
                            result.push({ type: parsed.type, tier: parsed.tier, rarity: 0 });
                        }
                    }
                }
            }
        }
    } catch (e) {}
    return result;
}

function saveGearGlyphs(item, glyphs) {
    if (!item || item.isEmpty()) return false;
    try {
        let ListTag = Java.loadClass('net.minecraft.nbt.ListTag');
        let CompoundTag = Java.loadClass('net.minecraft.nbt.CompoundTag');
        let CustomData = Java.loadClass('net.minecraft.world.item.component.CustomData');
        let DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents');

        let cd = item.get(DataComponents.CUSTOM_DATA);
        let tag = cd ? cd.copyTag() : new CompoundTag();

        let listTag = new ListTag();
        glyphs.forEach(g => {
            let ct = new CompoundTag();
            ct.putString('type', g.type);
            ct.putInt('tier', g.tier);
            ct.putInt('rarity', g.rarity);
            listTag.add(ct);
        });

        tag.put('elyrium_glyphs', listTag);
        item.set(DataComponents.CUSTOM_DATA, CustomData.of(tag));

        // Sync native enchantments
        glyphs.forEach(g => {
            let def = GLYPH_DATA[g.type];
            if (def && def.nativeEnchant) {
                let lvl = Math.min(5, Math.max(1, Math.round(g.tier * 0.6 + g.rarity * 0.5)));
                item.enchant(def.nativeEnchant, lvl);
            }
        });

        return true;
    } catch (err) {
        console.error('[RunicEnchanting] Error saving glyphs: ' + err);
        return false;
    }
}

function isEligibleGearForGlyph(item, glyphType) {
    if (!item || item.isEmpty()) return false;
    let def = GLYPH_DATA[glyphType];
    if (!def) return false;

    let id = String(item.id).toLowerCase();
    let isWeapon = item.hasTag('minecraft:swords') || item.hasTag('c:weapons') || id.includes('sword') || id.includes('blade') || id.includes('axe') || id.includes('claymore') || id.includes('mace');
    let isArmor = item.hasTag('minecraft:armors') || item.hasTag('c:armors') || id.includes('helmet') || id.includes('chestplate') || id.includes('leggings') || id.includes('boots');
    let isBoots = item.hasTag('minecraft:foot_armor') || id.includes('boots');
    let isHead = id.includes('helmet') || id.includes('hood') || id.includes('crown') || id.includes('staff');

    if (def.slot === 'any') return isWeapon || isArmor;
    if (def.slot === 'weapon') return isWeapon;
    if (def.slot === 'armor') return isArmor;
    if (def.slot === 'feet') return isBoots;
    if (def.slot === 'head') return isHead || isArmor;
    return false;
}

// ------------------------------------------------------------------------------
// INTERACTION: RIGHT-CLICK GLYPH TO INSCRIBE / UPGRADE ONTO GEAR
// ------------------------------------------------------------------------------
ItemEvents.rightClicked(event => {
    let player = event.player;
    if (!player || player.isFake()) return;

    let mainItem = player.mainHandItem;
    let offItem = player.offHandItem;

    let glyphItem = null;
    let gearItem = null;

    if (mainItem && parseGlyphItemId(mainItem.id)) {
        glyphItem = mainItem;
        gearItem = offItem;
    } else if (offItem && parseGlyphItemId(offItem.id)) {
        glyphItem = offItem;
        gearItem = mainItem;
    }

    if (!glyphItem) return;

    let parsed = parseGlyphItemId(glyphItem.id);
    if (!parsed) return;

    let glyphDef = GLYPH_DATA[parsed.type];

    if (!gearItem || gearItem.isEmpty()) {
        player.tell(Text.of(`§d🔮 [Начертание Чар] §7Возьмите экипировку во вторую руку для начертания ${glyphDef.color}«${glyphDef.name}»§7!`));
        return;
    }

    if (!isEligibleGearForGlyph(gearItem, parsed.type)) {
        player.tell(Text.of(`§c[Начертание] ${glyphDef.color}«${glyphDef.name}» §cне подходит для данного типа предмета (Требуется: ${glyphDef.slot})!`));
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

    let glyphs = getGearGlyphs(gearItem);
    let existingIndex = -1;
    for (let i = 0; i < glyphs.length; i++) {
        if (glyphs[i].type === parsed.type) {
            existingIndex = i;
            break;
        }
    }

    let server = player.server;

    // SCENARIO 1: GLYPH ALREADY PRESENT -> UPGRADE RARITY OR TIER!
    if (existingIndex !== -1) {
        let existing = glyphs[existingIndex];
        let maxRarity = getMaxRarityForTier(Math.max(existing.tier, parsed.tier));

        // Subcase A: Higher Tier applied -> Upgrade Tier!
        if (parsed.tier > existing.tier) {
            existing.tier = parsed.tier;
            saveGearGlyphs(gearItem, glyphs);

            // Deduct ink & glyph
            consumeInk(inv);
            glyphItem.shrink(1);

            server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete player ${player.username} ~ ~ ~ 1.0 1.2`);
            server.runCommandSilent(`particle minecraft:totem_of_undying ~ ~1.2 ~ 0.5 0.5 0.5 0.2 40`);

            let rInfo = RARITY_INFO[existing.rarity];
            player.tell(Text.of(`§6🌟 [Прорыв Эпохи!] §fГлиф ${glyphDef.color}«${glyphDef.name}» §fулучшен до §eTier ${existing.tier}§f! (${rInfo.color}${rInfo.name}§f)`));
            return;
        }

        // Subcase B: Same Tier applied -> Upgrade Rarity (Common -> Uncommon -> Rare...)!
        if (existing.rarity < maxRarity) {
            existing.rarity += 1;
            saveGearGlyphs(gearItem, glyphs);

            // Deduct ink & glyph
            consumeInk(inv);
            glyphItem.shrink(1);

            server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 1.0 1.4`);
            server.runCommandSilent(`particle minecraft:enchant ~ ~1.2 ~ 0.5 0.5 0.5 0.2 30`);

            let newR = RARITY_INFO[existing.rarity];
            player.tell(Text.of(`§a✨ [Возвышение Чар!] §fГлиф ${glyphDef.color}«${glyphDef.name} T${existing.tier}» §fвозвышен до качества: ${newR.color}${newR.name}§f!`));
            return;
        } else {
            let maxR = RARITY_INFO[maxRarity];
            player.tell(Text.of(`§c[Начертание] Достигнут предел качества для этой эпохи (${maxR.color}${maxR.name}§c)! Для дальнейшего роста нужен глиф следующего тира.`));
            return;
        }
    }

    // SCENARIO 2: NEW GLYPH -> CHECK CAPACITY (MAX 2)
    if (glyphs.length >= 2) {
        player.tell(Text.of('§c[Начертание] Лимит чар исчерпан! Максимум 2 Древних Глифа на один предмет экипировки.'));
        return;
    }

    // Determine incoming rarity (default 0 Common)
    let incomingRarity = 0;
    try {
        if (glyphItem.customData && glyphItem.customData.contains('rarity')) {
            incomingRarity = glyphItem.customData.getInt('rarity') || 0;
        }
    } catch (e) {}

    glyphs.push({
        type: parsed.type,
        tier: parsed.tier,
        rarity: incomingRarity
    });

    let ok = saveGearGlyphs(gearItem, glyphs);
    if (ok) {
        consumeInk(inv);
        glyphItem.shrink(1);

        server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 1.0 1.2`);
        server.runCommandSilent(`particle minecraft:enchant ~ ~1.2 ~ 0.5 0.5 0.5 0.2 40`);
        server.runCommandSilent(`particle minecraft:witch ~ ~1.0 ~ 0.4 0.4 0.4 0.1 25`);

        let rInfo = RARITY_INFO[incomingRarity];
        player.tell(Text.of(`§a✨ [Начертание Успешно!] §fГлиф ${glyphDef.color}«${glyphDef.name} T${parsed.tier}» §fвпечатан в предмет! (${rInfo.color}${rInfo.name}§f)`));
        player.tell(Text.of(`§8[Потенциал Чар: ${glyphs.length}/2]`));
    }
});

function consumeInk(inv) {
    for (let i = 0; i < inv.size; i++) {
        let st = inv.getStackInSlot(i);
        if (st && st.id === 'kubejs:runic_ink') {
            st.shrink(1);
            break;
        }
    }
}

// ------------------------------------------------------------------------------
// COMBAT MATRIX HOOKS: GLYPH SPECIAL EFFECTS
// ------------------------------------------------------------------------------
EntityEvents.hurt(event => {
    let source = event.source;
    let victim = event.entity;
    if (!source || !victim) return;

    // 1. ATTACKER HOOKS (Player Weapon)
    if (source.actual && source.actual.isPlayer()) {
        let attacker = source.actual;
        let weapon = attacker.mainHandItem;
        if (weapon && !weapon.isEmpty()) {
            let glyphs = getGearGlyphs(weapon);
            glyphs.forEach(g => {
                let rMult = RARITY_INFO[g.rarity] ? RARITY_INFO[g.rarity].mult : 1.0;

                // Vampirism Hook
                if (g.type === 'vampirism') {
                    let basePct = 0.010 + (g.tier - 2) * 0.005;
                    let finalPct = Math.min(0.045, basePct * rMult);
                    let dmg = event.damage || 0;
                    if (dmg > 0) {
                        let heal = Math.max(0.5, dmg * finalPct);
                        attacker.heal(heal);
                        attacker.server.runCommandSilent(`particle minecraft:heart ${attacker.x} ${attacker.y + 1.2} ${attacker.z} 0.2 0.2 0.2 0.05 2`);
                    }
                }

                // Executioner Hook (targets with HP < 30%)
                if (g.type === 'executioner') {
                    let maxHp = victim.maxHealth || 20;
                    let currentHp = victim.health || 20;
                    if (currentHp / maxHp <= 0.30) {
                        let bonusPct = (0.04 + (g.tier - 1) * 0.025) * rMult;
                        event.damage = event.damage * (1.0 + bonusPct);
                        attacker.server.runCommandSilent(`particle minecraft:crit ${victim.x} ${victim.y + 1.0} ${victim.z} 0.3 0.3 0.3 0.1 5`);
                    }
                }

                // Elemental Rend Hook
                if (g.type === 'elemental') {
                    victim.setSecondsOnFire(Math.min(6, 2 + g.tier));
                }
            });
        }
    }

    // 2. DEFENDER HOOKS (Player Armor & Shields)
    if (victim.isPlayer()) {
        let armorPieces = [
            victim.getHeadArmorItem(),
            victim.getChestArmorItem(),
            victim.getLegsArmorItem(),
            victim.getFeetArmorItem()
        ];

        let totalProtReduction = 0;
        armorPieces.forEach(piece => {
            if (piece && !piece.isEmpty()) {
                let glyphs = getGearGlyphs(piece);
                glyphs.forEach(g => {
                    let rMult = RARITY_INFO[g.rarity] ? RARITY_INFO[g.rarity].mult : 1.0;

                    if (g.type === 'protection') {
                        let baseRed = 0.015 + (g.tier - 1) * 0.008;
                        totalProtReduction += Math.min(0.12, baseRed * rMult);
                    }
                });
            }
        });

        if (totalProtReduction > 0) {
            totalProtReduction = Math.min(0.40, totalProtReduction); // Cap at 40% total
            event.damage = event.damage * (1.0 - totalProtReduction);
        }
    }
});
