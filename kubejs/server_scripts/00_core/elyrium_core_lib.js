// ==============================================================================
// 🏛️ ELYRIUM RPG: CORE UTILITY & CANONICAL DEFINITIONS LIBRARY (v1.0)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script (00_core)
// ==============================================================================
// Supreme Canonical Single Source of Truth for cross-module functions:
// 1. Loaded FIRST alphabetically in 00_core to ensure unified Rhino scope.
// 2. Eliminates silent function overwriting / name collisions across modules.
// 3. Exposes functions globally and under `global.ElyriumCore.*`.
//
// Covered Systems:
// - getReinforceLevel: DataComponents CUSTOM_DATA, customData, NBT [0..15]
// - getWeaponProgressionTier: Canon 8 Tiers + Tier 1.5 Undergarden
// - getPlayerLevel: LevelManager (SimpleStats) -> simplestats_level -> perks -> xpLevel
// - getPlayerTier: Player world milestone progression [1..8] + creative bypass
// - isShield, isSpear, isTwoHandedWeapon, requiresTwoHands, isWeaponItem
// - getRawItemStack: Extracts underlying net.minecraft.world.item.ItemStack
// - matchesItemOrTag, countPlayerItems, deductPlayerItems: Safe inventory checks
// ==============================================================================

// ------------------------------------------------------------------------------
// 1. ITEM REINFORCEMENT & LEVEL (+0 .. +15)
// ------------------------------------------------------------------------------
function getReinforceLevel(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return 0;
    try {
        if (item.customData && item.customData.contains('skd_reinforce')) {
            let lvl = item.customData.getInt('skd_reinforce');
            return Math.max(0, Math.min(15, lvl));
        }
        if (item.nbt && item.nbt.contains('skd_reinforce')) {
            let lvl = item.nbt.getInt('skd_reinforce');
            return Math.max(0, Math.min(15, lvl));
        }
        let DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents');
        if (DataComponents) {
            let cd = item.get(DataComponents.CUSTOM_DATA);
            if (cd) {
                let tag = cd.copyTag();
                if (tag && tag.contains('skd_reinforce')) {
                    return Math.max(0, Math.min(15, tag.getInt('skd_reinforce') || 0));
                }
            }
        }
    } catch (e) {}
    return 0;
}

// ------------------------------------------------------------------------------
// 2. WEAPON & GEAR PROGRESSION TIER (Canon 8 Tiers + 1.5 Undergarden)
// ------------------------------------------------------------------------------
function getWeaponProgressionTier(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return 1;

    // 1. Elyrium Tier Tags (8 Tiers Canon + 1.5 Undergarden)
    if (item.hasTag('elyrium:tier_8')) return 8;
    if (item.hasTag('elyrium:tier_7')) return 7;
    if (item.hasTag('elyrium:tier_6')) return 6;
    if (item.hasTag('elyrium:tier_5')) return 5;
    if (item.hasTag('elyrium:tier_4')) return 4;
    if (item.hasTag('elyrium:tier_3')) return 3;
    if (item.hasTag('elyrium:tier_2')) return 2;
    if (item.hasTag('elyrium:tier_1_5') || item.hasTag('elyrium:tier_undergarden')) return 1.5;
    if (item.hasTag('elyrium:tier_1')) return 1;

    for (let t = 8; t >= 1; t--) {
        if (item.hasTag(`skd:tier_${t}`) || item.hasTag(`c:tools/tier_${t}`)) return t;
    }

    try {
        if (item.customData && item.customData.contains('skd_tier')) {
            return item.customData.getInt('skd_tier') || 1;
        }
        if (item.nbt && item.nbt.contains('skd_tier')) {
            return item.nbt.getInt('skd_tier') || 1;
        }
    } catch (e) {}

    let id = String(item.id).toLowerCase();

    // Tier 8: DivineRPG Mortum, Apalachia & Skythern, Halite, Apex Void
    if (id.includes('mortum') || id.includes('divinerpg:mortum') || id.includes('apalachia') ||
        id.includes('skythern') || id.includes('divinerpg:apalachia') || id.includes('divinerpg:skythern') ||
        id.includes('the_incinerator') || id.includes('aquatooth') || id.includes('halite')) return 8;

    // Tier 7: DivineRPG Eden & Wildwood
    if (id.includes('eden') || id.includes('wildwood') || id.includes('divinerpg:eden') || id.includes('divinerpg:wildwood')) return 7;

    // Tier 6: Deeper Darker (Otherside) / Warden
    if (id.includes('sculk') || id.includes('echo') || id.includes('warden') || id.startsWith('deeperdarker:')) return 6;

    // Tier 5: Eternal Starlight
    if (id.includes('starlight') || id.includes('luminite') || id.includes('luminarite') || id.startsWith('eternal_starlight:') || id.includes('thermal_springstone')) return 5;

    // Tier 4: The End / Void / Ender Guardian / Dragon / Enderite
    if (id.includes('dragon') || id.includes('void') || id.includes('ender_guardian') || id.includes('ender_golem') || id.includes('elytra') || id.includes('enderite')) return 4;

    // Tier 3: The Aether & Deep Aether
    if (id.includes('gravitite') || id.includes('zanite') || id.includes('valkyrie') || id.includes('skyjade') || id.startsWith('aether:') || id.startsWith('deep_aether:')) return 3;

    // Tier 2: The Nether (Cinder Alloy, Netherite, Ignitium, Cataclysm)
    if (id.includes('cinder') || id.includes('netherite') || id.startsWith('cataclysm:') || id.includes('ignitium') || id.includes('witherite') || id.includes('monstrosity') || id.includes('wither') || id.includes('ignis')) return 2;

    // Tier 1.5: The Undergarden
    if (id.includes('cloggrum') || id.includes('froststeel') || id.startsWith('undergarden:')) return 1.5;

    return 1;
}

// ------------------------------------------------------------------------------
// 3. PLAYER RPG LEVEL (LevelManager SimpleStats -> simplestats_level -> perks -> xp)
// ------------------------------------------------------------------------------
function getPlayerLevel(player) {
    if (!player) return 1;

    // 1. SimpleStats LevelManager Java API
    try {
        let LevelManagerClass = Java.loadClass('net.caffeinemc.mods.simplestats.LevelManager');
        if (LevelManagerClass) {
            let raw = (typeof player.minecraftPlayer !== 'undefined' && player.minecraftPlayer) ? player.minecraftPlayer : (player.raw || player);
            try {
                let lvl = LevelManagerClass.getLevel(raw);
                if (lvl && lvl > 0) return lvl;
            } catch (e1) {
                try {
                    let lvl2 = LevelManagerClass.getLevel(player);
                    if (lvl2 && lvl2 > 0) return lvl2;
                } catch (e2) {}
            }
        }
    } catch (eLm) {}

    // 2. PersistentData simplestats_level
    try {
        let pData = player.persistentData;
        if (pData) {
            let lvl = pData.getInt('simplestats_level');
            if (lvl && lvl > 0) return lvl;

            // 3. Fallback: simplestats_perks compound
            let perks = pData.getCompound('simplestats_perks');
            if (perks) {
                let total = (perks.getInt('strength') || 0) +
                            (perks.getInt('vitality') || 0) +
                            (perks.getInt('agility') || 0) +
                            (perks.getInt('intelligence') || 0) +
                            (perks.getInt('wisdom') || 0);
                if (total > 0) return Math.max(1, Math.floor(total / 2));
            }
        }
    } catch (ePd) {}

    // 4. Vanilla XP level fallback
    return (player.xpLevel && player.xpLevel > 0) ? player.xpLevel : 1;
}

// ------------------------------------------------------------------------------
// 4. PLAYER WORLD PROGRESSION TIER (Canon Milestones 1..8)
// ------------------------------------------------------------------------------
function getPlayerTier(player) {
    if (!player) return 1;
    if (player.isCreative && player.isCreative()) return 8;
    if (player.isSpectator && player.isSpectator()) return 8;
    if (player.tags && (player.tags.contains('tier_bypass') || player.tags.contains('admin_bypass'))) return 8;

    let data = player.persistentData;
    if (!data) return 1;

    let explicitTier = data.getInt('elyrium_progression_tier');
    if (explicitTier && explicitTier > 0) return Math.min(8, explicitTier);

    if (data.getBoolean('skd_tier7_completed')) return 8;
    if (data.getBoolean('skd_tier6_completed')) return 7;
    if (data.getBoolean('skd_tier5_completed')) return 6;
    if (data.getBoolean('skd_tier4_completed')) return 5;
    if (data.getBoolean('skd_tier3_completed')) return 4;
    if (data.getBoolean('skd_tier2_completed')) return 3;
    if (data.getBoolean('skd_tier1_completed') || data.getBoolean('skd_sector1_completed')) return 2;

    return 1;
}

// ------------------------------------------------------------------------------
// 5. WEAPON & SHIELD CATEGORY CLASSIFICATION
// ------------------------------------------------------------------------------
function isShield(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = String(item.id).toLowerCase();
    return item.hasTag('c:tools/shields') ||
           item.hasTag('c:shields') ||
           item.hasTag('forge:shields') ||
           item.hasTag('minecraft:shields') ||
           id.includes('shield');
}

function isSpear(item, id) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let itemId = id || String(item.id).toLowerCase();
    return itemId.includes('spear') || itemId.includes('halberd') || itemId.includes('lance') ||
           itemId.includes('glaive') || itemId.includes('polearm') || itemId.includes('trident') ||
           itemId.includes('pike') || item.hasTag('c:tools/spears') || item.hasTag('c:spears') ||
           item.hasTag('c:tools/polearms') || item.hasTag('c:polearms');
}

function isTwoHandedWeapon(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;

    // Better Combat weapon registry check (if available)
    try {
        let registry = Java.loadClass('net.bettercombat.api.WeaponRegistry');
        if (registry) {
            let rawStack = (typeof item.getItemStack === 'function') ? item.getItemStack() : (item.minecraftItemStack || item);
            let attrs = registry.getAttributes(rawStack);
            if (attrs) {
                if (typeof attrs.two_handed === 'function' && attrs.two_handed()) return true;
                if (attrs.two_handed === true) return true;
                if (typeof attrs.isTwoHanded === 'function' && attrs.isTwoHanded()) return true;
            }
        }
    } catch (eBc) {}

    let id = String(item.id).toLowerCase();
    if (id.includes('claymore') ||
        id.includes('greathammer') ||
        id.includes('greatsword') ||
        id.includes('halberd') ||
        id.includes('scythe') ||
        id.includes('breaker') ||
        id.includes('hammer') ||
        id.includes('greataxe') ||
        id.includes('warhammer') ||
        id.includes('maul') ||
        id.includes('twinblade') ||
        id.includes('warglaive') ||
        id.includes('spear') ||
        id.includes('lance') ||
        id.includes('zweihander') ||
        id.includes('colossal')) {
        return true;
    }
    if (item.hasTag('c:two_handed') || item.hasTag('bettercombat:two_handed') || item.hasTag('skd:two_handed')) {
        return true;
    }
    return false;
}

function requiresTwoHands(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = String(item.id).toLowerCase();
    // Bows & crossbows require two hands
    if (((id.includes('bow') && !id.includes('bowl')) || id.includes('crossbow')) ||
        item.hasTag('c:tools/bows') || item.hasTag('c:tools/crossbows') ||
        item.hasTag('minecraft:enchantable/bow') || item.hasTag('minecraft:enchantable/crossbow')) {
        return true;
    }
    // Staves & quarterstaves
    if (id.includes('staff') || id.includes('quarterstaff')) {
        return true;
    }
    return isTwoHandedWeapon(item);
}

function isWeaponItem(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = String(item.id).toLowerCase();

    if (item.hasTag('c:tools/melee_weapon') ||
        item.hasTag('minecraft:swords') ||
        item.hasTag('c:swords') ||
        item.hasTag('c:tools/swords') ||
        item.hasTag('minecraft:axes') ||
        item.hasTag('c:tools/axes') ||
        item.hasTag('c:tools/bows') ||
        item.hasTag('c:tools/crossbows') ||
        item.hasTag('minecraft:bows') ||
        item.hasTag('c:tools/daggers') ||
        item.hasTag('c:tools/maces') ||
        item.hasTag('c:tools/hammers') ||
        item.hasTag('c:tools/shields') ||
        item.hasTag('c:shields') ||
        item.hasTag('minecraft:shields')) {
        return true;
    }

    return id.includes('sword') || id.includes('blade') || id.includes('claymore') ||
           id.includes('greatsword') || id.includes('katana') || id.includes('dagger') ||
           id.includes('hammer') || id.includes('spear') || id.includes('halberd') ||
           id.includes('greataxe') || id.includes('axe') || id.includes('bow') ||
           id.includes('crossbow') || id.includes('mace') || id.includes('club') ||
           id.includes('scythe') || id.includes('rapier') || id.includes('saber') ||
           id.includes('sai') || id.includes('knife') || id.includes('shortsword') ||
           id.includes('polearm') || id.includes('lance') || id.includes('glaive') ||
           id.includes('twinblade') || id.includes('warglaive') || id.includes('shield');
}

// ------------------------------------------------------------------------------
// 6. ITEMSTACK CONVERSION UTILITIES
// ------------------------------------------------------------------------------
function getRawItemStack(item) {
    if (!item) return null;
    if (typeof item.getItemStack === 'function') {
        return item.getItemStack();
    }
    if (typeof item.getMinecraftItemStack === 'function') {
        return item.getMinecraftItemStack();
    }
    return item;
}

// ------------------------------------------------------------------------------
// 7. INVENTORY ITEM MATCHING & DEDUCTION (CRAFTING / UPGRADES)
// ------------------------------------------------------------------------------
function matchesItemOrTag(st, itemIdOrTag) {
    if (!st || st.isEmpty() || !itemIdOrTag) return false;
    let stId = String(st.id);
    if (itemIdOrTag.startsWith('#')) {
        let tag = itemIdOrTag.substring(1);
        return st.hasTag(tag);
    }
    if (stId === itemIdOrTag) return true;
    if (itemIdOrTag === 'minecraft:iron_ingot' && (st.hasTag('c:ingots/iron') || st.hasTag('forge:ingots/iron'))) return true;
    if (itemIdOrTag === 'kubejs:steel_ingot' && (st.hasTag('c:ingots/steel') || st.hasTag('forge:ingots/steel'))) return true;
    if (itemIdOrTag === 'minecraft:copper_ingot' && (st.hasTag('c:ingots/copper') || st.hasTag('forge:ingots/copper'))) return true;
    if (itemIdOrTag === 'skd:cinder_alloy_ingot' && (st.hasTag('c:ingots/cinder_alloy') || stId.includes('cinder_alloy'))) return true;
    return false;
}

function countPlayerItems(player, itemIdOrTag) {
    if (!player || !itemIdOrTag) return 0;
    let inv = player.inventory;
    let count = 0;
    for (let i = 0; i < inv.size; i++) {
        let st = inv.getItem(i);
        if (matchesItemOrTag(st, itemIdOrTag)) count += st.count;
    }
    return count;
}

function deductPlayerItems(player, itemIdOrTag, needed) {
    if (!player || needed <= 0) return true;
    let inv = player.inventory;
    let remain = needed;
    for (let i = 0; i < inv.size && remain > 0; i++) {
        let st = inv.getItem(i);
        if (matchesItemOrTag(st, itemIdOrTag)) {
            let take = Math.min(st.count, remain);
            st.shrink(take);
            remain -= take;
            if (st.isEmpty() || st.count <= 0) {
                try { inv.setItem(i, Item.of('minecraft:air')); } catch (e) {}
            }
        }
    }
    return remain === 0;
}

// ------------------------------------------------------------------------------
// 8. NAMESPACE EXPORT
// ------------------------------------------------------------------------------
global.ElyriumCore = {
    getReinforceLevel: getReinforceLevel,
    getWeaponProgressionTier: getWeaponProgressionTier,
    getPlayerLevel: getPlayerLevel,
    getPlayerTier: getPlayerTier,
    isShield: isShield,
    isSpear: isSpear,
    isTwoHandedWeapon: isTwoHandedWeapon,
    requiresTwoHands: requiresTwoHands,
    isWeaponItem: isWeaponItem,
    getRawItemStack: getRawItemStack,
    matchesItemOrTag: matchesItemOrTag,
    countPlayerItems: countPlayerItems,
    deductPlayerItems: deductPlayerItems
};
