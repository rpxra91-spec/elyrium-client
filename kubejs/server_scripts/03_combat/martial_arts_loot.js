// ==============================================================================
// ⚔️ ELYRIUM RPG: MARTIAL ARTS LOOT INJECTION & ANVIL INSCRIPTION ENGINE
// ==============================================================================
// 1. Injects 8 Martial Tablets across 11 Tiers into dungeon chests instead of trash gear:
//    - Tier 1-3: Simple Dungeons, Mineshafts, Strongholds (Rank I..II)
//    - Tier 4: Nether Fortress & Bastion bridges (Rank II..III)
//    - Tier 5: Aether Bronze, Silver, Gold dungeons (Rank II..III)
//    - Tier 6: End City treasures (Rank III..IV)
//    - Tier 7-8: Eternal Starlight & Deeper Darker (Rank III..V)
//    - Tier 9-11: DivineRPG dimensions (Rank IV..V)
// 2. Anvil Inscription System:
//    - Players can inscribe Martial Tablets into compatible weapons at any Anvil!
// ==============================================================================

const TABLETS_METADATA = {
    'kubejs:martial_tablet_whirlwind': {
        key: 'whirlwind',
        name: 'Вихревой Размах',
        validWeapon: function(id) {
            return id.includes('claymore') || id.includes('greatsword') || id.includes('greataxe') || 
                   id.includes('broadsword') || id.includes('heavy') || id.includes('battleaxe');
        },
        weaponDesc: 'Двуручные мечи, клейморы, секиры'
    },
    'kubejs:martial_tablet_earth_sunder': {
        key: 'earth_sunder',
        name: 'Рассечение Земли',
        validWeapon: function(id) {
            return id.includes('claymore') || id.includes('greatsword') || id.includes('hammer') || 
                   id.includes('mace') || id.includes('greataxe');
        },
        weaponDesc: 'Тяжелые двуручники, боевые молоты'
    },
    'kubejs:martial_tablet_juggernaut': {
        key: 'juggernaut',
        name: 'Неумолимый Натиск',
        validWeapon: function(id) {
            return id.includes('claymore') || id.includes('greatsword') || id.includes('halberd') || 
                   id.includes('spear') || id.includes('glaive');
        },
        weaponDesc: 'Двуручные мечи, алебарды'
    },
    'kubejs:martial_tablet_lightning_thrust': {
        key: 'lightning_thrust',
        name: 'Молниеносный Выпад',
        validWeapon: function(id) {
            return id.includes('katana') || id.includes('rapier') || id.includes('dagger') || 
                   id.includes('sai') || id.includes('saber') || id.includes('sword');
        },
        weaponDesc: 'Катаны, рапиры, кинжалы'
    },
    'kubejs:martial_tablet_blood_rend': {
        key: 'blood_rend',
        name: 'Кровавый Росчерк',
        validWeapon: function(id) {
            return id.includes('katana') || id.includes('scythe') || id.includes('saber') || 
                   id.includes('blade') || id.includes('sword');
        },
        weaponDesc: 'Катаны, косы, сабли'
    },
    'kubejs:martial_tablet_seismic_slam': {
        key: 'seismic_slam',
        name: 'Сейсмический Молот',
        validWeapon: function(id) {
            return id.includes('hammer') || id.includes('mace') || id.includes('club') || 
                   id.includes('flail');
        },
        weaponDesc: 'Молоты, дубины, булавы'
    },
    'kubejs:martial_tablet_shadow_step': {
        key: 'shadow_step',
        name: 'Теневой Шаг',
        validWeapon: function(id) {
            return id.includes('dagger') || id.includes('sai') || id.includes('claw') || 
                   id.includes('knife') || id.includes('katana');
        },
        weaponDesc: 'Кинжалы, саи, когти'
    },
    'kubejs:martial_tablet_arrow_barrage': {
        key: 'arrow_barrage',
        name: 'Залп Стрел',
        validWeapon: function(id) {
            return id.includes('bow') || id.includes('crossbow');
        },
        weaponDesc: 'Луки, арбалеты'
    }
};

const TRASH_ITEMS = [
    'minecraft:wooden_sword', 'minecraft:wooden_axe', 'minecraft:wooden_pickaxe', 'minecraft:wooden_shovel', 'minecraft:wooden_hoe',
    'minecraft:stone_sword', 'minecraft:stone_axe', 'minecraft:stone_pickaxe', 'minecraft:stone_shovel', 'minecraft:stone_hoe',
    'minecraft:golden_sword', 'minecraft:golden_axe', 'minecraft:golden_pickaxe', 'minecraft:golden_shovel', 'minecraft:golden_hoe',
    'minecraft:leather_helmet', 'minecraft:leather_chestplate', 'minecraft:leather_leggings', 'minecraft:leather_boots',
    'minecraft:golden_helmet', 'minecraft:golden_chestplate', 'minecraft:golden_leggings', 'minecraft:golden_boots',
    'minecraft:chainmail_helmet', 'minecraft:chainmail_boots',
    'minecraft:poisonous_potato', 'minecraft:bowl', 'minecraft:beetroot_seeds', 'minecraft:wheat_seeds'
];

function isTrashItem(itemId, stack) {
    if (TRASH_ITEMS.indexOf(itemId) !== -1) return true;
    if ((itemId.startsWith('minecraft:iron_') || itemId.startsWith('minecraft:golden_')) && stack && stack.isDamaged && stack.isDamaged()) {
        return true;
    }
    return false;
}

// ------------------------------------------------------------------------------
// 1. ANVIL INSCRIPTION SYSTEM (Main hand: Tablet, Off hand: Weapon)
// ------------------------------------------------------------------------------

BlockEvents.rightClicked(event => {
    let block = event.block;
    if (!block) return;
    let bId = block.id.toLowerCase();
    if (!bId.includes('anvil')) return;

    let player = event.player;
    if (!player || player.level.isClientSide()) return;

    let mainItem = player.mainHandItem;
    let offItem = player.offHandItem;

    let tabletItem = null;
    let weaponItem = null;
    let isTabletInMain = false;

    if (mainItem && mainItem.id.startsWith('kubejs:martial_tablet_')) {
        tabletItem = mainItem;
        weaponItem = offItem;
        isTabletInMain = true;
    } else if (offItem && offItem.id.startsWith('kubejs:martial_tablet_')) {
        tabletItem = offItem;
        weaponItem = mainItem;
        isTabletInMain = false;
    }

    if (!tabletItem || !weaponItem || weaponItem.isEmpty() || weaponItem.id === 'minecraft:air') return;

    let wId = weaponItem.id.toLowerCase();
    let meta = TABLETS_METADATA[tabletItem.id];
    if (!meta) return;

    // Check if weapon is valid for this art
    let isMeleeOrRanged = weaponItem.hasTag('c:tools/melee_weapon') || weaponItem.hasTag('minecraft:swords') ||
                          weaponItem.hasTag('minecraft:axes') || weaponItem.hasTag('c:tools/bows') ||
                          weaponItem.hasTag('c:tools/crossbows') || weaponItem.hasTag('c:weapons') ||
                          wId.includes('sword') || wId.includes('blade') || wId.includes('claymore') ||
                          wId.includes('katana') || wId.includes('dagger') || wId.includes('scythe') ||
                          wId.includes('rapier') || wId.includes('glaive') || wId.includes('spear') ||
                          wId.includes('halberd') || wId.includes('axe') || wId.includes('bow') ||
                          wId.includes('crossbow') || wId.includes('hammer') || wId.includes('mace');

    if (!isMeleeOrRanged) {
        player.sendSystemMessage(Text.of('§c❌ Этот предмет не является боевым оружием!'), true);
        event.cancel();
        return;
    }

    if (!meta.validWeapon(wId)) {
        player.sendSystemMessage(Text.of(`§c❌ Несовместимое оружие! Для ${meta.name} требуется: §e${meta.weaponDesc}`), true);
        event.cancel();
        return;
    }

    // Check if weapon already has an art
    let existingArt = null;
    try {
        if (weaponItem.nbt && weaponItem.nbt.contains('skd_weapon_art')) {
            existingArt = weaponItem.nbt.getString('skd_weapon_art');
        } else if (weaponItem.customData && weaponItem.customData.contains('skd_weapon_art')) {
            existingArt = weaponItem.customData.getString('skd_weapon_art');
        }
    } catch (e) {}

    if (existingArt) {
        player.sendSystemMessage(Text.of('§c❌ В это оружие уже инкрустировано Боевое Искусство!'), true);
        event.cancel();
        return;
    }

    // Extract tablet rank
    let rank = 1;
    try {
        if (tabletItem.nbt && tabletItem.nbt.contains('skd_art_rank')) {
            rank = tabletItem.nbt.getInt('skd_art_rank') || 1;
        } else if (tabletItem.customData && tabletItem.customData.contains('skd_art_rank')) {
            rank = tabletItem.customData.getInt('skd_art_rank') || 1;
        }
    } catch (e) {}

    // Inscribe art into weapon
    try {
        if (!weaponItem.nbt) weaponItem.nbt = {};
        weaponItem.nbt.putString('skd_weapon_art', meta.key);
        weaponItem.nbt.putInt('skd_art_rank', rank);
    } catch (e1) {
        try {
            if (!weaponItem.customData) weaponItem.customData = {};
            weaponItem.customData.putString('skd_weapon_art', meta.key);
            weaponItem.customData.putInt('skd_art_rank', rank);
        } catch (e2) {}
    }

    // Consume 1 tablet
    tabletItem.shrink(1);

    // Audio-visual feedback
    let server = event.server;
    let u = player.username;
    if (server) {
        server.runCommandSilent(`playsound minecraft:block.anvil.use player ${u} ~ ~ ~ 1.0 1.1`);
        server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${u} ~ ~ ~ 0.8 1.4`);
        server.runCommandSilent(`particle minecraft:enchanted_hit ${block.x} ${block.y + 1} ${block.z} 0.5 0.5 0.5 0.1 25`);
    }

    player.sendSystemMessage(Text.of(`§a⚔ Успешно выгравировано: §e${meta.name} §6[Ранг ${rank}]§a!`), true);
    event.cancel();
});

// ------------------------------------------------------------------------------
// 2. DUNGEON LOOT INJECTION ENGINE (Across 11 Tiers)
// ------------------------------------------------------------------------------

function determineChestTierAndType(player, block, level) {
    let dim = String(level.dimension).toLowerCase();

    // 1. Nether (Tier 4)
    if (dim.includes('nether')) {
        return { eligible: true, tier: 4, chance: 0.65, structure: 'nether_bridge' };
    }

    // 2. Aether (Tier 5)
    if (dim.includes('aether')) {
        return { eligible: true, tier: 5, chance: 0.70, structure: 'aether_dungeon' };
    }

    // 3. The End (Tier 6)
    if (dim.includes('the_end') || dim.includes('end')) {
        return { eligible: true, tier: 6, chance: 0.75, structure: 'end_city' };
    }

    // 4. Eternal Starlight (Tier 7)
    if (dim.includes('starlight')) {
        return { eligible: true, tier: 7, chance: 0.80, structure: 'starlight_dungeon' };
    }

    // 5. Deeper Darker (Tier 8)
    if (dim.includes('otherside') || dim.includes('deeperdarker')) {
        return { eligible: true, tier: 8, chance: 0.85, structure: 'ancient_city' };
    }

    // 6. DivineRPG (Tiers 9 - 11)
    if (dim.includes('eden') || dim.includes('wildwood')) {
        return { eligible: true, tier: 9, chance: 0.90, structure: 'divinerpg_eden' };
    }
    if (dim.includes('apalachia') || dim.includes('skythern')) {
        return { eligible: true, tier: 10, chance: 0.90, structure: 'divinerpg_skythern' };
    }
    if (dim.includes('mortum')) {
        return { eligible: true, tier: 11, chance: 0.95, structure: 'divinerpg_mortum' };
    }

    // 7. Overworld (Tiers 1 - 3)
    if (dim.includes('overworld')) {
        let isStronghold = false;
        let isDungeon = false;
        let isMineshaft = false;

        // Check surroundings if block exists
        if (block) {
            let bx = block.x;
            let by = block.y;
            let bz = block.z;

            // Stronghold indicators
            for (let dx = -3; dx <= 3; dx += 3) {
                for (let dz = -3; dz <= 3; dz += 3) {
                    let near = level.getBlock(bx + dx, by, bz + dz);
                    if (near) {
                        let nid = near.id.toLowerCase();
                        if (nid.includes('stone_brick') || nid.includes('iron_bars') || nid.includes('end_portal')) {
                            isStronghold = true;
                            break;
                        }
                        if (nid.includes('spawner') || nid.includes('mossy_cobblestone')) {
                            isDungeon = true;
                            break;
                        }
                        if (nid.includes('rail') || nid.includes('cobweb')) {
                            isMineshaft = true;
                            break;
                        }
                    }
                }
                if (isStronghold || isDungeon || isMineshaft) break;
            }
        }

        if (isStronghold) {
            return { eligible: true, tier: 3, chance: 0.60, structure: 'stronghold' };
        }

        if (isDungeon || isMineshaft) {
            let dist = Math.sqrt(player.x * player.x + player.z * player.z);
            let t = dist < 1500 ? 1 : (dist < 3500 ? 2 : 3);
            return { eligible: true, tier: t, chance: 0.50, structure: 'simple_dungeon' };
        }

        // Generic underground chest below Y=30
        if (block && block.y < 30) {
            return { eligible: true, tier: 2, chance: 0.35, structure: 'simple_dungeon' };
        }
    }

    return { eligible: false, tier: 1, chance: 0, structure: 'unknown' };
}

function selectTabletForTier(target) {
    let t = target.tier || 1;
    let pool = [];
    let rank = 1;

    if (t === 1) {
        pool = ['kubejs:martial_tablet_whirlwind', 'kubejs:martial_tablet_lightning_thrust', 'kubejs:martial_tablet_arrow_barrage'];
        rank = 1;
    } else if (t === 2) {
        pool = ['kubejs:martial_tablet_whirlwind', 'kubejs:martial_tablet_earth_sunder', 'kubejs:martial_tablet_lightning_thrust', 'kubejs:martial_tablet_arrow_barrage'];
        rank = Math.random() < 0.3 ? 2 : 1;
    } else if (t === 3) {
        // Stronghold / Sector 3
        pool = ['kubejs:martial_tablet_earth_sunder', 'kubejs:martial_tablet_seismic_slam', 'kubejs:martial_tablet_shadow_step', 'kubejs:martial_tablet_juggernaut'];
        rank = Math.random() < 0.5 ? 2 : 1;
    } else if (t === 4) {
        // Nether Bridge / Bastion
        pool = ['kubejs:martial_tablet_juggernaut', 'kubejs:martial_tablet_blood_rend', 'kubejs:martial_tablet_earth_sunder', 'kubejs:martial_tablet_seismic_slam'];
        rank = Math.random() < 0.4 ? 3 : 2;
    } else if (t === 5) {
        // Aether Dungeons
        pool = ['kubejs:martial_tablet_whirlwind', 'kubejs:martial_tablet_lightning_thrust', 'kubejs:martial_tablet_arrow_barrage', 'kubejs:martial_tablet_seismic_slam'];
        rank = Math.random() < 0.5 ? 3 : 2;
    } else if (t === 6) {
        // End City
        pool = ['kubejs:martial_tablet_shadow_step', 'kubejs:martial_tablet_blood_rend', 'kubejs:martial_tablet_juggernaut', 'kubejs:martial_tablet_earth_sunder'];
        rank = Math.random() < 0.4 ? 4 : 3;
    } else if (t === 7) {
        // Eternal Starlight
        pool = ['kubejs:martial_tablet_lightning_thrust', 'kubejs:martial_tablet_whirlwind', 'kubejs:martial_tablet_arrow_barrage'];
        rank = Math.random() < 0.5 ? 4 : 3;
    } else if (t === 8) {
        // Deeper Darker
        pool = ['kubejs:martial_tablet_shadow_step', 'kubejs:martial_tablet_seismic_slam', 'kubejs:martial_tablet_earth_sunder'];
        rank = Math.random() < 0.4 ? 5 : 4;
    } else {
        // DivineRPG (Tiers 9 - 11)
        pool = Object.keys(TABLETS_METADATA);
        rank = Math.random() < 0.7 ? 5 : 4;
    }

    let chosenId = pool[Math.floor(Math.random() * pool.length)];
    let tabletItem = Item.of(chosenId);
    try {
        if (!tabletItem.nbt) tabletItem.nbt = {};
        tabletItem.nbt.putInt('skd_art_rank', rank);
    } catch (e1) {
        try {
            if (!tabletItem.customData) tabletItem.customData = {};
            tabletItem.customData.putInt('skd_art_rank', rank);
        } catch (e2) {}
    }

    return tabletItem;
}

PlayerEvents.chestOpened(event => {
    let player = event.player;
    if (!player || player.level.isClientSide()) return;

    let inventory = null;
    try {
        inventory = event.inventory;
    } catch (e) {}
    if (!inventory) return;

    let level = player.level;
    let block = null;
    try {
        block = event.block;
    } catch (e) {}

    let slotsCount = 0;
    try {
        slotsCount = inventory.getSlots ? inventory.getSlots() : (inventory.slots || 27);
    } catch (e) {
        slotsCount = 27;
    }

    let alreadyHasTablet = false;
    let trashSlots = [];
    let emptySlots = [];

    for (let i = 0; i < slotsCount; i++) {
        let stack = inventory.getStackInSlot(i);
        if (!stack || stack.isEmpty() || stack.id === 'minecraft:air') {
            emptySlots.push(i);
            continue;
        }
        let itemId = String(stack.id).toLowerCase();
        if (itemId.startsWith('kubejs:martial_tablet_')) {
            alreadyHasTablet = true;
            break;
        }
        if (isTrashItem(itemId, stack)) {
            trashSlots.push(i);
        }
    }

    if (alreadyHasTablet) return;

    // Determine target tier and structure
    let target = determineChestTierAndType(player, block, level);
    if (!target.eligible) return;

    // Roll RNG chance
    if (Math.random() > target.chance) return;

    let tabletItem = selectTabletForTier(target);
    if (!tabletItem) return;

    // Injects instead of trash gear!
    if (trashSlots.length > 0) {
        let targetSlot = trashSlots[Math.floor(Math.random() * trashSlots.length)];
        inventory.setStackInSlot(targetSlot, tabletItem);
    } else if (emptySlots.length > 0) {
        let targetSlot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
        inventory.setStackInSlot(targetSlot, tabletItem);
    }
});

// ------------------------------------------------------------------------------
// 3. DECLARATIVE LOOT MODIFIER (When LootEvents is present)
// ------------------------------------------------------------------------------

if (typeof LootEvents !== 'undefined') {
    LootEvents.modify(event => {
        // Overworld Simple Dungeons
        event.modify(['minecraft:chests/simple_dungeon', 'minecraft:chests/abandoned_mineshaft'], table => {
            table.addPool(pool => {
                pool.rolls = 1;
                pool.survivesExplosion();
                pool.addItem('kubejs:martial_tablet_whirlwind').weight(10);
                pool.addItem('kubejs:martial_tablet_lightning_thrust').weight(10);
                pool.addItem('kubejs:martial_tablet_arrow_barrage').weight(10);
                pool.addEmpty(20);
            });
        });

        // Strongholds
        event.modify(['minecraft:chests/stronghold_corridor', 'minecraft:chests/stronghold_crossing', 'minecraft:chests/stronghold_library'], table => {
            table.addPool(pool => {
                pool.rolls = 1;
                pool.survivesExplosion();
                pool.addItem('kubejs:martial_tablet_earth_sunder').weight(12);
                pool.addItem('kubejs:martial_tablet_seismic_slam').weight(12);
                pool.addItem('kubejs:martial_tablet_shadow_step').weight(12);
                pool.addEmpty(15);
            });
        });

        // Nether Bridge / Fortress
        event.modify(['minecraft:chests/nether_bridge', 'minecraft:chests/bastion_treasure', 'minecraft:chests/bastion_other'], table => {
            table.addPool(pool => {
                pool.rolls = 1;
                pool.survivesExplosion();
                pool.addItem('kubejs:martial_tablet_juggernaut').weight(15);
                pool.addItem('kubejs:martial_tablet_blood_rend').weight(15);
                pool.addItem('kubejs:martial_tablet_earth_sunder').weight(10);
                pool.addEmpty(15);
            });
        });

        // Aether Dungeons
        event.modify([
            'aether:chests/dungeon/bronze/bronze_dungeon_reward',
            'aether:chests/dungeon/silver/silver_dungeon_reward',
            'aether:chests/dungeon/gold/gold_dungeon_reward'
        ], table => {
            table.addPool(pool => {
                pool.rolls = 1;
                pool.survivesExplosion();
                pool.addItem('kubejs:martial_tablet_whirlwind').weight(12);
                pool.addItem('kubejs:martial_tablet_lightning_thrust').weight(12);
                pool.addItem('kubejs:martial_tablet_arrow_barrage').weight(12);
                pool.addItem('kubejs:martial_tablet_seismic_slam').weight(12);
                pool.addEmpty(10);
            });
        });

        // End City
        event.modify(['minecraft:chests/end_city_treasure'], table => {
            table.addPool(pool => {
                pool.rolls = 1;
                pool.survivesExplosion();
                pool.addItem('kubejs:martial_tablet_shadow_step').weight(15);
                pool.addItem('kubejs:martial_tablet_blood_rend').weight(15);
                pool.addItem('kubejs:martial_tablet_juggernaut').weight(15);
                pool.addItem('kubejs:martial_tablet_earth_sunder').weight(15);
                pool.addEmpty(10);
            });
        });
    });
}
