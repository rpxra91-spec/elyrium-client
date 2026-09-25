// ==============================================================================
// ⚔️ ELYRIUM RPG: MARTIAL ARTS INSCRIPTION & TIER SUCCESSION ENGINE
// ==============================================================================
// 1. Inscription at Anvil / Crafting Table / Smithing Table:
//    - Sockets any of the 8 Martial Tablets into matching weapon types.
//    - Strict Archetype Validation:
//      * Whirlwind / Earth Sunder / Juggernaut Rush -> ONLY 2H / Heavy weapons
//        (claymore, greatsword, greataxe, hammer, halberd).
//      * Lightning Thrust / Blood Rend -> ONLY Finesse/Blades
//        (katana, rapier, scythe, sword, saber).
//      * Seismic Slam -> ONLY Bludgeoning
//        (hammer, mace, club).
//      * Shadow Step -> ONLY Daggers/Light
//        (dagger, sai, knife, shortsword).
//      * Arrow Barrage -> ONLY Ranged
//        (bow, crossbow).
//    - Writes NBT tags: `skd_weapon_art` (string) and `skd_art_rank` (1..5).
//    - Replaces previous martial art cleanly without NBT corruption.
//    - Audio/VFX: minecraft:block.anvil.use + particle minecraft:wax_off.
//
// 2. Tier Succession & Reinforcement Transfer:
//    - Upgrades weapon from T_{n-1} to T_n using `kubejs:tier_upgrade_template`.
//    - Transfers reinforcement level (`skd_reinforce`) with 100% preservation if
//      ΔTier <= 1, or applies -1 rank preservation penalty if upgraded to much
//      higher tier (ΔTier >= 2).
//    - Preserves existing inscribed Martial Art across tiers (with archetype check).
// ==============================================================================

const ROMAN_RANKS = {
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IV',
    5: 'V'
};

const MARTIAL_TABLETS = {
    'kubejs:martial_tablet_whirlwind': {
        artId: 'whirlwind_cleave',
        name: 'Вихревой Размах',
        archetype: 'heavy',
        allowedDesc: 'Двуручное / Тяжелое (клеймор, двуручник, секира, молот, алебарда)'
    },
    'kubejs:martial_tablet_earth_sunder': {
        artId: 'earth_sunder',
        name: 'Рассечение Земли',
        archetype: 'heavy',
        allowedDesc: 'Двуручное / Тяжелое (клеймор, двуручник, секира, молот, алебарда)'
    },
    'kubejs:martial_tablet_juggernaut': {
        artId: 'juggernaut_rush',
        name: 'Неумолимый Натиск',
        archetype: 'heavy',
        allowedDesc: 'Двуручное / Тяжелое (клеймор, двуручник, секира, молот, алебарда)'
    },
    'kubejs:martial_tablet_lightning_thrust': {
        artId: 'lightning_thrust',
        name: 'Молниеносный Выпад',
        archetype: 'finesse',
        allowedDesc: 'Клинковое / Ловкое (катана, рапира, коса, меч, сабля)'
    },
    'kubejs:martial_tablet_blood_rend': {
        artId: 'blood_rend',
        name: 'Кровавый Росчерк',
        archetype: 'finesse',
        allowedDesc: 'Клинковое / Ловкое (катана, рапира, коса, меч, сабля)'
    },
    'kubejs:martial_tablet_seismic_slam': {
        artId: 'seismic_slam',
        name: 'Сейсмический Молот',
        archetype: 'bludgeoning',
        allowedDesc: 'Дробящее (молот, булава, дубина)'
    },
    'kubejs:martial_tablet_shadow_step': {
        artId: 'shadow_step',
        name: 'Теневой Шаг',
        archetype: 'daggers',
        allowedDesc: 'Кинжалы / Легкое (кинжал, сай, нож, короткий меч)'
    },
    'kubejs:martial_tablet_arrow_barrage': {
        artId: 'arrow_barrage',
        name: 'Залп Стрел',
        archetype: 'ranged',
        allowedDesc: 'Стрелковое (лук, арбалет)'
    }
};

const ART_NAMES = {
    'whirlwind_cleave': 'Вихревой Размах',
    'earth_sunder': 'Рассечение Земли',
    'juggernaut_rush': 'Неумолимый Натиск',
    'lightning_thrust': 'Молниеносный Выпад',
    'blood_rend': 'Кровавый Росчерк',
    'seismic_slam': 'Сейсмический Молот',
    'shadow_step': 'Теневой Шаг',
    'arrow_barrage': 'Залп Стрел'
};

function getArtDisplayName(artId) {
    return ART_NAMES[artId] || artId;
}

// ------------------------------------------------------------------------------
// 1. WEAPON & ARCHETYPE VALIDATION HELPERS
// ------------------------------------------------------------------------------

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
        item.hasTag('c:tools/hammers')) {
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
           id.includes('twinblade') || id.includes('warglaive');
}

function is2HHeavyWeapon(item, id) {
    if (id.includes('claymore') || id.includes('greatsword') || id.includes('greataxe') ||
        id.includes('hammer') || id.includes('halberd') || id.includes('greathammer') ||
        id.includes('battleaxe') || id.includes('lance') || id.includes('twinblade') ||
        id.includes('warglaive') || id.includes('spear')) {
        return true;
    }
    if (item.hasTag('bettercombat:two_handed') || item.hasTag('c:two_handed') || item.hasTag('skd:two_handed')) {
        return true;
    }
    return false;
}

function isFinesseBladeWeapon(item, id) {
    // Exclude 2H heavy swords and light daggers
    if (id.includes('greatsword') || id.includes('claymore') || id.includes('shortsword') ||
        id.includes('dagger') || id.includes('sai') || id.includes('knife') || id.includes('kunai')) {
        return false;
    }
    if (id.includes('katana') || id.includes('rapier') || id.includes('scythe') ||
        id.includes('saber') || id.includes('sword') || id.includes('cutlass') || id.includes('blade')) {
        return true;
    }
    if (item.hasTag('minecraft:swords') || item.hasTag('c:tools/swords') || item.hasTag('c:swords')) {
        return true;
    }
    return false;
}

function isBludgeoningWeapon(item, id) {
    if (id.includes('hammer') || id.includes('mace') || id.includes('club') ||
        id.includes('cudgel') || id.includes('flail') || id.includes('greathammer') || id.includes('morningstar')) {
        return true;
    }
    if (item.hasTag('c:tools/maces') || item.hasTag('c:tools/hammers')) {
        return true;
    }
    return false;
}

function isDaggerLightWeapon(item, id) {
    if (id.includes('dagger') || id.includes('sai') || id.includes('knife') ||
        id.includes('shortsword') || id.includes('kunai') || id.includes('stiletto')) {
        return true;
    }
    if (item.hasTag('c:tools/dagger') || item.hasTag('c:tools/daggers')) {
        return true;
    }
    return false;
}

function isRangedWeapon(item, id) {
    if (id.includes('crossbow') || id.includes('bow') || id.includes('longbow') || id.includes('shortbow')) {
        return true;
    }
    if (item.hasTag('c:tools/bows') || item.hasTag('c:tools/crossbows') || item.hasTag('minecraft:bows')) {
        return true;
    }
    return false;
}

function isArtCompatibleWithWeapon(weaponItem, artId) {
    if (!weaponItem || weaponItem.isEmpty() || weaponItem.id === 'minecraft:air') return false;
    let id = String(weaponItem.id).toLowerCase();

    switch (artId) {
        case 'whirlwind_cleave':
        case 'earth_sunder':
        case 'juggernaut_rush':
            return is2HHeavyWeapon(weaponItem, id);

        case 'lightning_thrust':
        case 'blood_rend':
            return isFinesseBladeWeapon(weaponItem, id);

        case 'seismic_slam':
            return isBludgeoningWeapon(weaponItem, id);

        case 'shadow_step':
            return isDaggerLightWeapon(weaponItem, id);

        case 'arrow_barrage':
            return isRangedWeapon(weaponItem, id);

        default:
            return false;
    }
}

// ------------------------------------------------------------------------------
// 2. 11-TIER PROGRESSION CLASSIFIER
// ------------------------------------------------------------------------------

function getWeaponProgressionTier(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return 1;

    for (let t = 11; t >= 1; t--) {
        if (item.hasTag(`skd:tier_${t}`) || item.hasTag(`c:tools/tier_${t}`)) return t;
    }

    let id = String(item.id).toLowerCase();

    // Tier 11: DivineRPG Mortum, Apex Void Cataclysm
    if (id.includes('mortum') || id.includes('divinerpg:mortum') || id.includes('the_incinerator') || id.includes('aquatooth') || id.includes('halite')) return 11;

    // Tier 10: DivineRPG Apalachia & Skythern
    if (id.includes('apalachia') || id.includes('skythern') || id.includes('divinerpg:apalachia') || id.includes('divinerpg:skythern')) return 10;

    // Tier 9: DivineRPG Eden & Wildwood
    if (id.includes('eden') || id.includes('wildwood') || id.includes('divinerpg:eden') || id.includes('divinerpg:wildwood')) return 9;

    // Tier 8: Deeper Darker (Otherside) / Warden
    if (id.includes('sculk') || id.includes('echo') || id.includes('warden') || id.startsWith('deeperdarker:')) return 8;

    // Tier 7: Eternal Starlight
    if (id.includes('starlight') || id.includes('luminite') || id.startsWith('eternal_starlight:') || id.includes('thermal_springstone')) return 7;

    // Tier 6: The End / Void / Ender Guardian
    if (id.includes('dragon') || id.includes('void') || id.includes('ender_guardian') || id.includes('ender_golem') || id.includes('elytra') || id.includes('ascended')) return 6;

    // Tier 5: The Aether & Deep Aether
    if (id.includes('gravitite') || id.includes('zanite') || id.includes('valkyrie') || id.includes('skyjade') || id.startsWith('aether:') || id.startsWith('deep_aether:')) return 5;

    // Tier 4: The Nether (Cinder Alloy, Netherite, Ignitium)
    if (id.includes('cinder') || id.includes('netherite') || id.includes('ignitium') || id.includes('monstrosity') || id.includes('witherite') || id.includes('wither')) return 4;

    // Tier 3: Diamond, Cobalt, Rune / Runes, Iron
    if (id.includes('diamond') || id.includes('cobalt') || id.includes('rune') || id.includes('runic') || id.startsWith('runes:') || id.includes('amethyst') ||
        (id.includes('iron') && !id.includes('early_iron') && !id.includes('crude_iron') && !id.includes('rusted_iron'))) {
        return 3;
    }

    // Tier 2: Copper, Chain, Iron early, Gold, Bronze, Brass, Flint, Silver
    if (id.includes('copper') || id.includes('chain') || id.includes('early_iron') || id.includes('crude_iron') ||
        id.includes('rusted_iron') || id.includes('gold') || id.includes('golden') || id.includes('bronze') ||
        id.includes('brass') || id.includes('silver') || id.includes('flint')) {
        return 2;
    }

    // Tier 1: Wood, Leather, Stone, Starter items
    return 1;
}

// ------------------------------------------------------------------------------
// 3. NBT & METADATA GETTERS / SETTERS
// ------------------------------------------------------------------------------

function getReinforceLevel(item) {
    if (!item || item.isEmpty()) return 0;
    try {
        if (item.nbt && item.nbt.contains('skd_reinforce')) {
            return item.nbt.getInt('skd_reinforce') || 0;
        }
        if (item.customData && item.customData.contains('skd_reinforce')) {
            return item.customData.getInt('skd_reinforce') || 0;
        }
    } catch (e) {}
    return 0;
}

function setReinforceLevel(item, lvl) {
    if (!item || item.isEmpty()) return;
    let clamped = Math.max(0, Math.min(10, Math.floor(lvl || 0)));
    try {
        if (!item.nbt) item.nbt = {};
        item.nbt.putInt('skd_reinforce', clamped);
    } catch (e) {}
    try {
        if (item.customData) {
            item.customData.putInt('skd_reinforce', clamped);
        }
    } catch (e) {}
}

function updateItemReinforceName(item, newLvl) {
    if (!item) return;
    try {
        let currentName = '';
        try {
            if (item.hoverName) currentName = '' + item.hoverName.getString();
            else if (item.displayName) currentName = '' + item.displayName.getString();
        } catch (eName) {}

        let baseName = currentName
            .replace(/\[\+\d+\]/g, '')
            .replace(/★/g, '')
            .replace(/👑/g, '')
            .replace(/✦/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        let finalComp;
        if (newLvl <= 0) {
            finalComp = Text.of(baseName);
        } else {
            let badge = '';
            if (newLvl <= 3) {
                badge = `§b[+${newLvl}]`;
            } else if (newLvl <= 6) {
                badge = `§d[+${newLvl}]`;
            } else if (newLvl <= 8) {
                badge = `§6★ [+${newLvl}] ★`;
            } else {
                badge = `§c✦ §6👑 [+${newLvl}] §c✦`;
            }

            finalComp = Text.of(`${baseName} ${badge}`);
        }

        try {
            let DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents');
            item.set(DataComponents.CUSTOM_NAME, finalComp);
            return;
        } catch (e1) {}

        try {
            item.customName = finalComp;
        } catch (e2) {}
    } catch (e) {}
}

function getSafeItemTag(item) {
    if (!item || item.isEmpty()) return null;
    try {
        if (item.customData) return item.customData;
        if (item.getCustomData) return item.getCustomData();
        if (item.nbt) return item.nbt;
    } catch (e) {}
    return null;
}

function getOrCreateSafeItemTag(item) {
    if (!item || item.isEmpty()) return null;
    let tag = getSafeItemTag(item);
    if (tag) return tag;
    try {
        let CompoundTag = Java.loadClass('net.minecraft.nbt.CompoundTag');
        tag = new CompoundTag();
        if (item.setCustomData) item.setCustomData(tag);
        return tag;
    } catch (e) {}
    return null;
}

function getWeaponArt(item) {
    if (!item || item.isEmpty()) return null;
    let tag = getSafeItemTag(item);
    if (!tag) return null;
    try {
        if (tag.contains('skd_weapon_art')) {
            let art = String(tag.getString('skd_weapon_art'));
            if (art && art.length > 0) return art;
        }
    } catch (e) {}
    return null;
}

function getWeaponArtRank(item) {
    if (!item || item.isEmpty()) return 1;
    let tag = getSafeItemTag(item);
    if (!tag) return 1;
    try {
        if (tag.contains('skd_art_rank')) {
            return Math.max(1, Math.min(5, tag.getInt('skd_art_rank') || 1));
        }
    } catch (e) {}
    return 1;
}

function setWeaponArt(item, artId, rank) {
    if (!item || item.isEmpty()) return;
    let clampedRank = Math.max(1, Math.min(5, Math.floor(rank || 1)));
    let tag = getOrCreateSafeItemTag(item);
    if (tag) {
        try {
            tag.putString('skd_weapon_art', String(artId));
            tag.putInt('skd_art_rank', clampedRank);
        } catch (e) {}
    }
}

function getTabletRank(tabletItem) {
    if (!tabletItem || tabletItem.isEmpty()) return 1;
    let tag = getSafeItemTag(tabletItem);
    if (!tag) return 1;
    try {
        if (tag.contains('skd_art_rank')) {
            return Math.max(1, Math.min(5, tag.getInt('skd_art_rank') || 1));
        }
    } catch (e) {}
    return 1;
}

// ------------------------------------------------------------------------------
// 4. ACTIONBAR & AUDIO/VFX HELPERS
// ------------------------------------------------------------------------------

function sendActionbarMessage(player, text) {
    if (!player) return;
    try {
        player.displayClientMessage(Text.of(text), true);
    } catch (e) {}
}

function playAnvilSuccessFX(player, block) {
    if (!player || !block) return;
    let bx = block.x;
    let by = block.y;
    let bz = block.z;
    let server = player.server;
    if (!server) return;

    server.runCommandSilent(`playsound minecraft:block.anvil.use block @a ${bx} ${by} ${bz} 1.0 1.2`);
    server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${player.username} ~ ~ ~ 0.8 1.4`);
    server.runCommandSilent(`particle minecraft:wax_off ${bx + 0.5} ${by + 1.2} ${bz + 0.5} 0.35 0.35 0.35 0.05 30`);
    server.runCommandSilent(`particle minecraft:crit ${bx + 0.5} ${by + 1.2} ${bz + 0.5} 0.3 0.3 0.3 0.1 20`);
}

function playAnvilErrorFX(player) {
    if (!player || !player.server) return;
    player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.8 0.6`);
}

// ------------------------------------------------------------------------------
// 5. ANVIL & WORKBENCH INTERACTION HOOK (BlockEvents.rightClicked)
// ------------------------------------------------------------------------------

BlockEvents.rightClicked(event => {
    let block = event.block;
    if (!block) return;
    let bId = String(block.id).toLowerCase();

    // Works at Anvils, Smithing Tables, and Crafting Tables
    let isAnvil = bId.includes('anvil');
    let isSmithing = bId.includes('smithing_table');
    let isCrafting = bId.includes('crafting_table');

    if (!isAnvil && !isSmithing && !isCrafting) return;

    let player = event.player;
    if (!player || player.level.isClientSide()) return;

    let mainItem = player.mainHandItem;
    let offItem = player.offHandItem;

    let tabletItem = null;
    let weaponItem = null;
    let isTabletInMain = false;

    // Detect Martial Tablet in hands
    if (mainItem && MARTIAL_TABLETS[mainItem.id]) {
        tabletItem = mainItem;
        weaponItem = offItem;
        isTabletInMain = true;
    } else if (offItem && MARTIAL_TABLETS[offItem.id]) {
        tabletItem = offItem;
        weaponItem = mainItem;
        isTabletInMain = false;
    }

    // ==========================================================================
    // SYSTEM 1: MARTIAL ARTS TABLET INSCRIPTION
    // ==========================================================================
    if (tabletItem) {
        event.cancel();

        // Anti-spam cooldown (0.4s)
        let now = (typeof player.age === 'number') ? player.age : (typeof player.tickCount === 'number' ? player.tickCount : 0);
        let lastInscribe = player.persistentData.getInt('last_art_inscribe_tick') || 0;
        if (now - lastInscribe < 8) return;
        player.persistentData.putInt('last_art_inscribe_tick', now);

        let tabletDef = MARTIAL_TABLETS[tabletItem.id];

        // 1. Validate that the other hand holds a weapon
        if (!weaponItem || weaponItem.isEmpty() || weaponItem.id === 'minecraft:air' || !isWeaponItem(weaponItem)) {
            sendActionbarMessage(
                player,
                `§e⚔ [Кузница Искусств] Возьмите во вторую руку §bподходящее оружие§e для инкрустации трактата!`
            );
            playAnvilErrorFX(player);
            return;
        }

        // 2. Strict Archetype Validation
        let isCompatible = isArtCompatibleWithWeapon(weaponItem, tabletDef.artId);
        if (!isCompatible) {
            sendActionbarMessage(
                player,
                `§c✖ Несовместимый тип оружия! §e«${tabletDef.name}»§c подходит только для: §f${tabletDef.allowedDesc}`
            );
            playAnvilErrorFX(player);
            return;
        }

        // 3. Extract rank (1..5) from tablet
        let rank = getTabletRank(tabletItem);
        let rankRoman = ROMAN_RANKS[rank] || 'I';

        // 4. Inscribe NBT on weapon: clean overwrite
        setWeaponArt(weaponItem, tabletDef.artId, rank);

        // 5. Consume 1 tablet
        tabletItem.shrink(1);

        // 6. Sound & particle effects
        playAnvilSuccessFX(player, block);

        // 7. Inform player in Actionbar
        let weaponName = weaponItem.hoverName.getString();
        sendActionbarMessage(
            player,
            `§a⚔ ИНКРУСТАЦИЯ УСПЕШНА! §6«${tabletDef.name}» §e(Ранг ${rankRoman})§a инкрустирован в §f${weaponName}§a!`
        );
        return;
    }

    // ==========================================================================
    // SYSTEM 2: TIER SUCCESSION & REINFORCEMENT TRANSFER
    // ==========================================================================
    // Triggered when holding two weapons (target higher tier + source lower tier)
    // or holding tier_upgrade_template
    let isHoldingTwoWeapons = (mainItem && isWeaponItem(mainItem) && offItem && isWeaponItem(offItem));
    let isHoldingTemplate = (mainItem && mainItem.id === 'kubejs:tier_upgrade_template') ||
                           (offItem && offItem.id === 'kubejs:tier_upgrade_template');

    if (isHoldingTwoWeapons || isHoldingTemplate) {
        // If holding template and only 1 weapon, guide the player
        if (isHoldingTemplate && !isHoldingTwoWeapons) {
            event.cancel();
            sendActionbarMessage(
                player,
                '§e✦ [Преемственность] Возьмите в одну руку новое оружие (T_n), а во вторую — старое (T_{n-1})!'
            );
            playAnvilErrorFX(player);
            return;
        }

        if (isHoldingTwoWeapons) {
            event.cancel();

            // Anti-spam cooldown (0.5s)
            let now = (typeof player.age === 'number') ? player.age : (typeof player.tickCount === 'number' ? player.tickCount : 0);
            let lastSuccession = player.persistentData.getInt('last_tier_succession_tick') || 0;
            if (now - lastSuccession < 10) return;
            player.persistentData.putInt('last_tier_succession_tick', now);

            // 1. Locate tier_upgrade_template in inventory or hands
            let templateSlot = -1;
            for (let i = 0; i < player.inventory.size; i++) {
                let s = player.inventory.getItem(i);
                if (s && s.id === 'kubejs:tier_upgrade_template') {
                    templateSlot = i;
                    break;
                }
            }

            if (templateSlot === -1) {
                sendActionbarMessage(
                    player,
                    '§e✦ [Преемственность Тиров] Для переноса улучшений требуется §6Кузнечный Шаблон Преемственности§e в инвентаре!'
                );
                playAnvilErrorFX(player);
                return;
            }

            // 2. Identify Target (T_n) and Source (T_{n-1})
            let tierMain = getWeaponProgressionTier(mainItem);
            let tierOff = getWeaponProgressionTier(offItem);

            let targetItem = null;
            let sourceItem = null;
            let targetTier = 1;
            let sourceTier = 1;

            if (tierMain > tierOff) {
                targetItem = mainItem;
                sourceItem = offItem;
                targetTier = tierMain;
                sourceTier = tierOff;
            } else if (tierOff > tierMain) {
                targetItem = offItem;
                sourceItem = mainItem;
                targetTier = tierOff;
                sourceTier = tierMain;
            } else {
                // Same tier transfer: determine source based on who already has reinforcement / art
                let rMain = getReinforceLevel(mainItem);
                let rOff = getReinforceLevel(offItem);
                let artMain = getWeaponArt(mainItem);
                let artOff = getWeaponArt(offItem);

                if ((rOff > 0 || artOff) && rMain === 0 && !artMain) {
                    targetItem = mainItem;
                    sourceItem = offItem;
                } else {
                    targetItem = offItem;
                    sourceItem = mainItem;
                }
                targetTier = tierMain;
                sourceTier = tierOff;
            }

            // 3. Inspect source stats
            let sourceReinforce = getReinforceLevel(sourceItem);
            let sourceArt = getWeaponArt(sourceItem);
            let sourceArtRank = getWeaponArtRank(sourceItem);

            if (sourceReinforce <= 0 && !sourceArt) {
                sendActionbarMessage(
                    player,
                    '§c✖ Исходное оружие не имеет уровня заточки или боевых искусств для переноса!'
                );
                playAnvilErrorFX(player);
                return;
            }

            // 4. Validate Martial Art compatibility with target weapon
            if (sourceArt) {
                let compatible = isArtCompatibleWithWeapon(targetItem, sourceArt);
                if (!compatible) {
                    let artName = getArtDisplayName(sourceArt);
                    sendActionbarMessage(
                        player,
                        `§c✖ Боевое искусство «${artName}» несовместимо с архетипом целевого оружия!`
                    );
                    playAnvilErrorFX(player);
                    return;
                }
            }

            // 5. Calculate preserved reinforcement level
            let deltaTier = targetTier - sourceTier;
            let preservedReinforce = sourceReinforce;
            let hasPenalty = false;

            if (deltaTier > 1) {
                // -1 rank preservation penalty if upgraded to much higher tier (skipping tiers)
                preservedReinforce = Math.max(0, sourceReinforce - 1);
                hasPenalty = (sourceReinforce > 0);
            } else {
                // Full 100% preservation on direct succession (T_{n-1} -> T_n) or same tier
                preservedReinforce = sourceReinforce;
            }

            // 6. Apply stats to target weapon
            setReinforceLevel(targetItem, preservedReinforce);
            updateItemReinforceName(targetItem, preservedReinforce);

            if (sourceArt) {
                setWeaponArt(targetItem, sourceArt, sourceArtRank);
            }

            // 7. Consume 1 tier_upgrade_template
            let templateStack = player.inventory.getItem(templateSlot);
            if (templateStack) {
                templateStack.shrink(1);
            }

            // 8. Consume source weapon
            sourceItem.shrink(1);

            // 9. Audio & Visual FX
            let bx = block.x;
            let by = block.y;
            let bz = block.z;
            let server = player.server;

            server.runCommandSilent(`playsound minecraft:block.anvil.use block @a ${bx} ${by} ${bz} 1.0 1.1`);
            server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete player ${player.username} ~ ~ ~ 0.9 1.2`);
            server.runCommandSilent(`particle minecraft:wax_off ${bx + 0.5} ${by + 1.2} ${bz + 0.5} 0.4 0.4 0.4 0.05 35`);
            server.runCommandSilent(`particle minecraft:totem_of_undying ${bx + 0.5} ${by + 1.4} ${bz + 0.5} 0.4 0.4 0.4 0.15 40`);

            // 10. Comprehensive feedback in Actionbar & Chat
            let targetName = targetItem.hoverName.getString();
            let artNotice = sourceArt ? ` §a+ Искусство «§6${getArtDisplayName(sourceArt)} §e(${ROMAN_RANKS[sourceArtRank] || 'I'})§a»` : '';

            if (hasPenalty) {
                sendActionbarMessage(
                    player,
                    `§6✦ [Преемственность] Закалка: §e+${sourceReinforce} ➔ +${preservedReinforce} §c(-1 штраф за скачок тиров)${artNotice} §6перенесены в §f${targetName}§6!`
                );
            } else {
                sendActionbarMessage(
                    player,
                    `§a✦ [Преемственность] Закалка: §e+${preservedReinforce}${artNotice} §aуспешно перенесены в §f${targetName}§a!`
                );
            }
        }
    }
});

// ------------------------------------------------------------------------------
// 6. GUI ANVIL SUPPORT ENGINE (AnvilUpdateEvent & AnvilRepairEvent)
// ------------------------------------------------------------------------------

function getInscriptionResult(left, right) {
    if (!left || left.isEmpty() || !isWeaponItem(left)) return null;
    if (!right || right.isEmpty() || !MARTIAL_TABLETS[right.id]) return null;

    let tabletDef = MARTIAL_TABLETS[right.id];
    if (!isArtCompatibleWithWeapon(left, tabletDef.artId)) return null;

    let rank = getTabletRank(right);
    let result = left.copy();
    setWeaponArt(result, tabletDef.artId, rank);
    return {
        result: result,
        tabletDef: tabletDef,
        rank: rank,
        rankRoman: ROMAN_RANKS[rank] || 'I'
    };
}

function cleanArtPreviewLore(item) {
    if (!item || item.isEmpty()) return;
    let tag = getSafeItemTag(item);
    if (tag) {
        try {
            tag.remove('skd_anvil_art_preview');
            tag.remove('skd_prev_art');
            tag.remove('skd_prev_rank');
            tag.remove('skd_anvil_succession_preview');
        } catch (e) {}
    }

    try {
        if (item.lore && item.lore.length > 0) {
            let clean = [];
            for (let l of item.lore) {
                let str = String(l.getString ? l.getString() : l);
                if (!str.includes('Инкрустация Искусств') && !str.includes('100% Совместимо') &&
                    !str.includes('Преемственность Тиров') && !str.includes('Перенос закалки') &&
                    !str.includes('Боевое искусство:') && !str.includes('Поглощает Шаблон') &&
                    !str.includes('━━━━━━━━')) {
                    clean.push(l);
                }
            }
            item.setLore(clean);
        }
    } catch (e) {}
}

function prepareArtPreviewOutput(calc) {
    let result = calc.result.copy();
    let tabletDef = calc.tabletDef;
    let rankRoman = calc.rankRoman;

    let lore = [];
    if (result.lore) {
        for (let l of result.lore) {
            let str = String(l.getString ? l.getString() : l);
            if (!str.includes('Инкрустация Искусств') && !str.includes('100% Совместимо') &&
                !str.includes('━━━━━━━━')) {
                lore.push(l);
            }
        }
    }

    lore.push(Text.of('§7━━━━━━━━━━━━━━━━━━━━'));
    lore.push(Text.of(`§6⚔ [Инкрустация Искусств] «${tabletDef.name}» (Ранг ${rankRoman})`));
    lore.push(Text.of(`§a✓ 100% Совместимо: ${tabletDef.allowedDesc}`));
    lore.push(Text.of('§7━━━━━━━━━━━━━━━━━━━━'));
    result.setLore(lore);

    let tag = getOrCreateSafeItemTag(result);
    if (tag) {
        try {
            tag.putBoolean('skd_anvil_art_preview', true);
            tag.putString('skd_prev_art', tabletDef.artId);
            tag.putInt('skd_prev_rank', calc.rank);
        } catch (e) {}
    }
    return result;
}

function getSuccessionResult(left, right, player) {
    if (!left || left.isEmpty() || !right || right.isEmpty()) return null;
    if (!isWeaponItem(left) || !isWeaponItem(right)) return null;

    // Check for tier_upgrade_template in player inventory
    let hasTemplate = false;
    if (player && player.inventory) {
        for (let i = 0; i < player.inventory.size; i++) {
            let s = player.inventory.getItem(i);
            if (s && s.id === 'kubejs:tier_upgrade_template') {
                hasTemplate = true;
                break;
            }
        }
    }
    if (!hasTemplate) return null;

    let tierLeft = getWeaponProgressionTier(left);
    let tierRight = getWeaponProgressionTier(right);

    let targetItem = null;
    let sourceItem = null;
    let targetTier = 1;
    let sourceTier = 1;

    if (tierLeft > tierRight) {
        targetItem = left;
        sourceItem = right;
        targetTier = tierLeft;
        sourceTier = tierRight;
    } else if (tierRight > tierLeft) {
        targetItem = right;
        sourceItem = left;
        targetTier = tierRight;
        sourceTier = tierLeft;
    } else {
        let rL = getReinforceLevel(left);
        let rR = getReinforceLevel(right);
        let aL = getWeaponArt(left);
        let aR = getWeaponArt(right);
        if ((rR > 0 || aR) && rL === 0 && !aL) {
            targetItem = left;
            sourceItem = right;
        } else {
            targetItem = right;
            sourceItem = left;
        }
        targetTier = tierLeft;
        sourceTier = tierRight;
    }

    let sourceReinforce = getReinforceLevel(sourceItem);
    let sourceArt = getWeaponArt(sourceItem);
    let sourceArtRank = getWeaponArtRank(sourceItem);
    if (sourceReinforce <= 0 && !sourceArt) return null;

    if (sourceArt && !isArtCompatibleWithWeapon(targetItem, sourceArt)) return null;

    let deltaTier = targetTier - sourceTier;
    let preservedReinforce = deltaTier > 1 ? Math.max(0, sourceReinforce - 1) : sourceReinforce;
    let hasPenalty = (deltaTier > 1 && sourceReinforce > 0);

    let result = targetItem.copy();
    setReinforceLevel(result, preservedReinforce);
    updateItemReinforceName(result, preservedReinforce);
    if (sourceArt) {
        setWeaponArt(result, sourceArt, sourceArtRank);
    }

    return {
        result: result,
        targetItem: targetItem,
        sourceItem: sourceItem,
        sourceReinforce: sourceReinforce,
        preservedReinforce: preservedReinforce,
        sourceArt: sourceArt,
        sourceArtRank: sourceArtRank,
        hasPenalty: hasPenalty
    };
}

function prepareSuccessionPreviewOutput(calc) {
    let result = calc.result.copy();

    let lore = [];
    if (result.lore) {
        for (let l of result.lore) {
            let str = String(l.getString ? l.getString() : l);
            if (!str.includes('Преемственность Тиров') && !str.includes('Перенос закалки') &&
                !str.includes('Боевое искусство:') && !str.includes('Поглощает Шаблон') &&
                !str.includes('━━━━━━━━')) {
                lore.push(l);
            }
        }
    }

    lore.push(Text.of('§7━━━━━━━━━━━━━━━━━━━━'));
    lore.push(Text.of('§6✦ [Преемственность Тиров]'));
    lore.push(Text.of(`§fПеренос закалки: §e+${calc.sourceReinforce} ➔ §a+${calc.preservedReinforce}${calc.hasPenalty ? ' §c(-1 штраф)' : ''}`));
    if (calc.sourceArt) {
        lore.push(Text.of(`§fБоевое искусство: §6«${getArtDisplayName(calc.sourceArt)}»`));
    }
    lore.push(Text.of('§eПоглощает Шаблон Преемственности из инвентаря'));
    lore.push(Text.of('§7━━━━━━━━━━━━━━━━━━━━'));
    result.setLore(lore);

    let tag = getOrCreateSafeItemTag(result);
    if (tag) {
        try {
            tag.putBoolean('skd_anvil_succession_preview', true);
        } catch (e) {}
    }
    return result;
}

try {
    let NeoForge = Java.loadClass('net.neoforged.neoforge.common.NeoForge');
    let AnvilUpdateEventClass = Java.loadClass('net.neoforged.neoforge.event.AnvilUpdateEvent');
    let Consumer = Java.loadClass('java.util.function.Consumer');
    let inscribeUpdateListener = new Consumer({
        accept: function(event) {
            let left = event.left;
            let right = event.right;
            let player = event.player;
            if (!left || left.isEmpty() || !right || right.isEmpty()) return;

            // 1. Check Tablet Inscription
            let inscribeCalc = getInscriptionResult(left, right);
            if (inscribeCalc) {
                let previewItem = prepareArtPreviewOutput(inscribeCalc);
                event.setOutput(previewItem);
                event.setCost(1);
                event.setMaterialCost(1);
                if (player && player.experienceLevel < 1) {
                    player.giveExperienceLevels(1);
                    if (player.persistentData) player.persistentData.putBoolean('skd_anvil_temp_xp', true);
                }
                return;
            }

            // 2. Check Tier Succession
            let successionCalc = getSuccessionResult(left, right, player);
            if (successionCalc) {
                let previewItem = prepareSuccessionPreviewOutput(successionCalc);
                event.setOutput(previewItem);
                event.setCost(1);
                event.setMaterialCost(1);
                if (player && player.experienceLevel < 1) {
                    player.giveExperienceLevels(1);
                    if (player.persistentData) player.persistentData.putBoolean('skd_anvil_temp_xp', true);
                }
                return;
            }
        }
    });
    NeoForge.EVENT_BUS['addListener(java.lang.Class,java.util.function.Consumer)'](AnvilUpdateEventClass, inscribeUpdateListener);
} catch (e) {
    console.error('[Martial Arts Engine] Native AnvilUpdateEvent registration error: ' + e);
}

try {
    let NeoForge = Java.loadClass('net.neoforged.neoforge.common.NeoForge');
    let AnvilRepairEventClass = Java.loadClass('net.neoforged.neoforge.event.entity.player.AnvilRepairEvent');
    let Consumer = Java.loadClass('java.util.function.Consumer');
    let inscribeRepairListener = new Consumer({
        accept: function(event) {
            let output = event.output;
            let left = event.left;
            let right = event.right;
            let player = event.entity || event.player;
            if (!output || output.isEmpty() || !player) return;

            let outTag = getSafeItemTag(output);
            if (!outTag) return;

            // Handling Inscription Completion
            if (outTag.getBoolean('skd_anvil_art_preview')) {
                event.setBreakChance(0.0);
                if (player && player.persistentData) {
                    if (player.persistentData.getBoolean('skd_anvil_temp_xp')) {
                        player.persistentData.remove('skd_anvil_temp_xp');
                    } else if (player.giveExperienceLevels) {
                        player.giveExperienceLevels(1);
                    }
                }
                let artId = outTag.getString('skd_prev_art');
                let rank = outTag.getInt('skd_prev_rank') || 1;
                cleanArtPreviewLore(output);
                setWeaponArt(output, artId, rank);

                let artName = getArtDisplayName(artId);
                let rankRoman = ROMAN_RANKS[rank] || 'I';

                player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 1.0 1.2`);
                player.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${player.username} ~ ~ ~ 0.8 1.4`);
                player.server.runCommandSilent(`particle minecraft:wax_off ${player.x} ${player.y + 1.2} ${player.z} 0.35 0.35 0.35 0.05 30`);
                player.server.runCommandSilent(`particle minecraft:crit ${player.x} ${player.y + 1.2} ${player.z} 0.3 0.3 0.3 0.1 20`);

                sendActionbarMessage(
                    player,
                    `§a⚔ ИНКРУСТАЦИЯ УСПЕШНА! §6«${artName}» §e(Ранг ${rankRoman})§a инкрустирован в §f${output.hoverName.getString()}§a!`
                );
                return;
            }

            // Handling Succession Completion
            if (outTag.getBoolean('skd_anvil_succession_preview')) {
                event.setBreakChance(0.0);
                if (player && player.persistentData) {
                    if (player.persistentData.getBoolean('skd_anvil_temp_xp')) {
                        player.persistentData.remove('skd_anvil_temp_xp');
                    } else if (player.giveExperienceLevels) {
                        player.giveExperienceLevels(1);
                    }
                }
                cleanArtPreviewLore(output);

                // Consume 1 tier_upgrade_template from inventory
                for (let i = 0; i < player.inventory.size; i++) {
                    let s = player.inventory.getItem(i);
                    if (s && s.id === 'kubejs:tier_upgrade_template') {
                        s.shrink(1);
                        break;
                    }
                }

                player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 1.0 1.1`);
                player.server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete player ${player.username} ~ ~ ~ 0.9 1.2`);
                player.server.runCommandSilent(`particle minecraft:wax_off ${player.x} ${player.y + 1.2} ${player.z} 0.4 0.4 0.4 0.05 35`);
                player.server.runCommandSilent(`particle minecraft:totem_of_undying ${player.x} ${player.y + 1.4} ${player.z} 0.4 0.4 0.4 0.15 40`);

                let targetName = output.hoverName.getString();
                let rLvl = getReinforceLevel(output);
                let art = getWeaponArt(output);
                let artRank = getWeaponArtRank(output);
                let artNotice = art ? ` §a+ Искусство «§6${getArtDisplayName(art)} §e(${ROMAN_RANKS[artRank] || 'I'})§a»` : '';

                sendActionbarMessage(
                    player,
                    `§a✦ [Преемственность] Закалка: §e+${rLvl}${artNotice} §aуспешно перенесены в §f${targetName}§a!`
                );
            }
        }
    });
    NeoForge.EVENT_BUS['addListener(java.lang.Class,java.util.function.Consumer)'](AnvilRepairEventClass, inscribeRepairListener);
} catch (e) {
    console.error('[Martial Arts Engine] Native AnvilRepairEvent registration error: ' + e);
}

// Dual-layer inventory fallback for container menus
PlayerEvents.inventoryChanged(event => {
    let player = event.player;
    if (!player || !player.isAlive()) return;

    let menu = player.containerMenu;
    if (!menu) return;
    let menuClass = String(menu);
    if (!menuClass.includes('Anvil')) return;

    try {
        let slot0 = menu.getSlot(0).getItem();
        let slot1 = menu.getSlot(1).getItem();
        let slot2 = menu.getSlot(2).getItem();

        if (slot2.isEmpty() && !slot0.isEmpty() && !slot1.isEmpty()) {
            let inscribeCalc = getInscriptionResult(slot0, slot1);
            if (inscribeCalc) {
                let previewItem = prepareArtPreviewOutput(inscribeCalc);
                menu.getSlot(2).set(previewItem);
                if (menu.cost) {
                    try { menu.cost.set(1); } catch (e) {}
                }
                menu.broadcastChanges();
                return;
            }

            let successionCalc = getSuccessionResult(slot0, slot1, player);
            if (successionCalc) {
                let previewItem = prepareSuccessionPreviewOutput(successionCalc);
                menu.getSlot(2).set(previewItem);
                if (menu.cost) {
                    try { menu.cost.set(1); } catch (e) {}
                }
                menu.broadcastChanges();
            }
        }
    } catch (e) {}
});

PlayerEvents.inventoryClosed(event => {
    let p = event.player;
    if (p && p.persistentData && p.persistentData.getBoolean('skd_anvil_temp_xp')) {
        p.persistentData.remove('skd_anvil_temp_xp');
        if (p.experienceLevel > 0) {
            p.giveExperienceLevels(-1);
        }
    }
});

