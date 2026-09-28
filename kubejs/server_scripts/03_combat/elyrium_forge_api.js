// ==============================================================================
// 🔨 ELYRIUM RPG: FORGE & REINFORCEMENT BACKEND API
// ==============================================================================
// Pure architectural engine for Equipment Reinforcement, Martial Tablets,
// and Tier Transfer. Decoupled from GUI rendering.
// Can be called by ANY GUI engine (ChestMenu, FancyMenu, Custom Network Packets).
// ==============================================================================

const FORGE_CHANCES = {
    1: 100, 2: 50, 3: 30,
    4: 15,  5: 10, 6: 6,
    7: 3.5, 8: 1.8,
    9: 0.8, 10: 0.3
};

const REQUIRED_STONES = {
    1: 'kubejs:smithing_stone_1',
    2: 'kubejs:smithing_stone_1',
    3: 'kubejs:smithing_stone_1',
    4: 'kubejs:smithing_stone_2',
    5: 'kubejs:smithing_stone_2',
    6: 'kubejs:smithing_stone_2',
    7: 'kubejs:smithing_stone_3',
    8: 'kubejs:smithing_stone_3',
    9: 'kubejs:smithing_stone_4',
    10: 'kubejs:smithing_stone_5'
};

const STONE_NAMES = {
    'kubejs:smithing_stone_1': 'Кузнечный Камень I (Пепельный / +1..+3)',
    'kubejs:smithing_stone_2': 'Кузнечный Камень II (Небесный / +4..+6)',
    'kubejs:smithing_stone_3': 'Кузнечный Камень III (Драконий / +7..+8)',
    'kubejs:smithing_stone_4': 'Кузнечный Камень IV (Звездный / +9)',
    'kubejs:smithing_stone_5': 'Кузнечный Камень V (Скалк-Бездны / +10)'
};

function getReinforceTag(item) {
    if (!item || item.isEmpty()) return 0;
    try {
        if (item.customData && item.customData.contains('skd_reinforce')) {
            return item.customData.getInt('skd_reinforce') || 0;
        }
        if (item.nbt && item.nbt.contains('skd_reinforce')) {
            return item.nbt.getInt('skd_reinforce') || 0;
        }
    } catch (e) {}
    try {
        let DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents');
        let cd = item.get(DataComponents.CUSTOM_DATA);
        if (cd) {
            let tag = cd.copyTag();
            if (tag && tag.contains('skd_reinforce')) return tag.getInt('skd_reinforce') || 0;
        }
    } catch (e2) {}
    return 0;
}

function setReinforceTag(item, lvl) {
    if (!item || item.isEmpty()) return;
    let clamped = Math.max(0, Math.min(10, Math.floor(lvl || 0)));
    try {
        if (item.customData && typeof item.customData.putInt === 'function') {
            item.customData.putInt('skd_reinforce', clamped);
            return;
        }
    } catch (e1) {}

    try {
        let CompoundTag = Java.loadClass('net.minecraft.nbt.CompoundTag');
        let CustomData = Java.loadClass('net.minecraft.world.item.component.CustomData');
        let DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents');
        let tag = null;
        try {
            let cd = item.get(DataComponents.CUSTOM_DATA);
            if (cd) tag = cd.copyTag();
        } catch (e2) {}
        if (!tag) tag = new CompoundTag();
        tag.putInt('skd_reinforce', clamped);
        item.set(DataComponents.CUSTOM_DATA, CustomData.of(tag));
    } catch (err) {
        console.error('[ElyriumForgeAPI] Error setting reinforce tag: ' + err);
    }
}

function updateBadge(item, lvl) {
    if (!item || item.isEmpty()) return;
    try {
        let currentName = '';
        try {
            if (item.hoverName) currentName = '' + item.hoverName.getString();
            else if (item.displayName) currentName = '' + item.displayName.getString();
        } catch (e) {}

        let baseName = currentName
            .replace(/\[\+\d+\]/g, '')
            .replace(/★/g, '')
            .replace(/👑/g, '')
            .replace(/✦/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        let finalComp;
        if (lvl <= 0) {
            finalComp = Text.of(baseName);
        } else {
            let badge = '';
            if (lvl <= 3) badge = `§b[+${lvl}]`;
            else if (lvl <= 6) badge = `§d[+${lvl}]`;
            else if (lvl <= 8) badge = `§6★ [+${lvl}] ★`;
            else badge = `§c✦ §6👑 [+${lvl}] §c✦`;

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
    } catch (e) {
        console.error('[ElyriumForgeAPI] Error updating badge: ' + e);
    }
}

function isEligibleGear(item) {
    if (!item || item.isEmpty()) return false;
    let id = String(item.id).toLowerCase();
    return item.hasTag('c:tools/melee_weapon') || item.hasTag('minecraft:swords') ||
           item.hasTag('minecraft:axes') || item.hasTag('c:tools/bows') ||
           item.hasTag('c:tools/crossbows') || item.hasTag('c:weapons') ||
           item.hasTag('minecraft:armors') || item.hasTag('c:armors') ||
           item.hasTag('c:tools/shields') || item.hasTag('c:shields') ||
           id.includes('sword') || id.includes('blade') || id.includes('claymore') ||
           id.includes('katana') || id.includes('dagger') || id.includes('spear') ||
           id.includes('hammer') || id.includes('axe') || id.includes('bow') ||
           id.includes('shield') || id.includes('helmet') || id.includes('chestplate') ||
           id.includes('leggings') || id.includes('boots');
}

function getGearTier(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return 1;

    // 1. Explicit NBT ascension tag: skd_tier
    try {
        if (item.customData && item.customData.contains('skd_tier')) {
            let t = item.customData.getInt('skd_tier');
            if (t >= 1 && t <= 11) return t;
        }
        if (item.nbt && item.nbt.contains('skd_tier')) {
            let t = item.nbt.getInt('skd_tier');
            if (t >= 1 && t <= 11) return t;
        }
        let DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents');
        let cd = item.get(DataComponents.CUSTOM_DATA);
        if (cd) {
            let tag = cd.copyTag();
            if (tag && tag.contains('skd_tier')) {
                let t = tag.getInt('skd_tier');
                if (t >= 1 && t <= 11) return t;
            }
        }
    } catch (e) {}

    // 2. Tag-based overrides: skd:tier_X or c:tools/tier_X
    for (let t = 11; t >= 1; t--) {
        if (item.hasTag(`skd:tier_${t}`) || item.hasTag(`c:tools/tier_${t}`)) return t;
    }

    // 3. Name/ID canonical 11-tier mapping
    let id = String(item.id).toLowerCase();

    // Tier 11: DivineRPG Mortum & Apex Cataclysm
    if (id.includes('mortum') || id.includes('divinerpg:mortum') || id.includes('the_incinerator') || id.includes('aquatooth') || id.includes('halite')) return 11;

    // Tier 10: DivineRPG Apalachia & Skythern
    if (id.includes('apalachia') || id.includes('skythern') || id.includes('divinerpg:apalachia') || id.includes('divinerpg:skythern')) return 10;

    // Tier 9: DivineRPG Eden & Wildwood
    if (id.includes('eden') || id.includes('wildwood') || id.includes('divinerpg:eden') || id.includes('divinerpg:wildwood')) return 9;

    // Tier 8: Deeper Darker (Otherside) / Warden
    if (id.includes('sculk') || id.includes('echo') || id.includes('warden') || id.startsWith('deeperdarker:')) return 8;

    // Tier 7: Eternal Starlight
    if (id.includes('starlight') || id.includes('luminite') || id.startsWith('eternal_starlight:') || id.includes('thermal_springstone')) return 7;

    // Tier 6: The End / Void / Ender Guardian / Dragon
    if (id.includes('dragon') || id.includes('void') || id.includes('ender_guardian') || id.includes('ender_golem') || id.includes('elytra') || id.includes('ascended')) return 6;

    // Tier 5: The Aether & Deep Aether
    if (id.includes('gravitite') || id.includes('zanite') || id.includes('valkyrie') || id.includes('skyjade') || id.startsWith('aether:') || id.startsWith('deep_aether:')) return 5;

    // Tier 4: The Nether (Cinder Alloy, Netherite, Ignitium, Cataclysm)
    if (id.includes('cinder') || id.includes('netherite') || id.startsWith('cataclysm:') || id.includes('ignitium') || id.includes('witherite') || id.includes('monstrosity') || id.includes('wither')) return 4;

    // Tier 3: Diamond, Cobalt, Rune / Runes, Iron standard
    if (id.includes('diamond') || id.includes('cobalt') || id.includes('rune') || id.includes('runic') || id.startsWith('runes:') || id.includes('amethyst') ||
        (id.includes('iron') && !id.includes('early_iron') && !id.includes('crude_iron') && !id.includes('rusted_iron'))) {
        return 3;
    }

    // Tier 2: Copper, Chain, Iron early, Gold, Bronze, Brass, Silver, Flint
    if (id.includes('copper') || id.includes('chain') || id.includes('early_iron') || 
        id.includes('crude_iron') || id.includes('rusted_iron') || id.includes('gold') || 
        id.includes('golden') || id.includes('bronze') || id.includes('brass') || id.includes('silver') || id.includes('flint')) {
        return 2;
    }

    // Tier 1: Starter Wood / Leather / Stone
    return 1;
}

function isValidItem(id) {
    if (!id) return false;
    try {
        let it = Item.of(id);
        return it && !it.isEmpty() && String(it.id) !== 'minecraft:air';
    } catch (e) {
        return false;
    }
}

const DIRECT_ASCENSIONS = {
    4: {
        'minecraft:diamond_sword': 'minecraft:netherite_sword',
        'minecraft:diamond_axe': 'minecraft:netherite_axe',
        'minecraft:diamond_pickaxe': 'minecraft:netherite_pickaxe',
        'minecraft:diamond_shovel': 'minecraft:netherite_shovel',
        'minecraft:diamond_hoe': 'minecraft:netherite_hoe',
        'minecraft:diamond_helmet': 'minecraft:netherite_helmet',
        'minecraft:diamond_chestplate': 'minecraft:netherite_chestplate',
        'minecraft:diamond_leggings': 'minecraft:netherite_leggings',
        'minecraft:diamond_boots': 'minecraft:netherite_boots'
    },
    5: {
        'minecraft:netherite_sword': 'aether:gravitite_sword',
        'minecraft:netherite_axe': 'aether:gravitite_axe',
        'minecraft:netherite_pickaxe': 'aether:gravitite_pickaxe',
        'minecraft:netherite_shovel': 'aether:gravitite_shovel',
        'minecraft:netherite_hoe': 'aether:gravitite_hoe',
        'minecraft:netherite_helmet': 'aether:gravitite_helmet',
        'minecraft:netherite_chestplate': 'aether:gravitite_chestplate',
        'minecraft:netherite_leggings': 'aether:gravitite_leggings',
        'minecraft:netherite_boots': 'aether:gravitite_boots'
    },
    6: {
        'aether:gravitite_sword': 'cataclysm:void_forge'
    },
    9: {
        'deeperdarker:warden_sword': 'divinerpg:eden_blade',
        'deeperdarker:warden_helmet': 'divinerpg:eden_helmet',
        'deeperdarker:warden_chestplate': 'divinerpg:eden_chestplate',
        'deeperdarker:warden_leggings': 'divinerpg:eden_leggings',
        'deeperdarker:warden_boots': 'divinerpg:eden_boots'
    },
    10: {
        'divinerpg:eden_blade': 'divinerpg:apalachia_blade',
        'divinerpg:eden_helmet': 'divinerpg:apalachia_helmet',
        'divinerpg:eden_chestplate': 'divinerpg:apalachia_chestplate',
        'divinerpg:eden_leggings': 'divinerpg:apalachia_leggings',
        'divinerpg:eden_boots': 'divinerpg:apalachia_boots'
    },
    11: {
        'divinerpg:apalachia_blade': 'divinerpg:mortum_blade',
        'divinerpg:apalachia_helmet': 'divinerpg:mortum_helmet',
        'divinerpg:apalachia_chestplate': 'divinerpg:mortum_chestplate',
        'divinerpg:apalachia_leggings': 'divinerpg:mortum_leggings',
        'divinerpg:apalachia_boots': 'divinerpg:mortum_boots'
    }
};

function findAscensionTargetItem(gear, targetTier) {
    if (!gear || gear.isEmpty()) return null;
    let id = String(gear.id).toLowerCase();

    if (DIRECT_ASCENSIONS[targetTier] && DIRECT_ASCENSIONS[targetTier][id]) {
        let mapped = DIRECT_ASCENSIONS[targetTier][id];
        if (isValidItem(mapped)) return mapped;
    }

    if (targetTier === 4 && id.includes('diamond_')) {
        let netheriteCandidate = id.replace('diamond_', 'netherite_');
        if (isValidItem(netheriteCandidate)) return netheriteCandidate;
    }

    return null;
}

// ==============================================================================
// PUBLIC GLOBAL API
// ==============================================================================
global.ElyriumForgeAPI = {
    getReinforceLevel: function(item) {
        return getReinforceTag(item);
    },

    evaluate: function(a, b, c, d) {
        let player = null;
        let gear, reagent, aegis;
        if (a && typeof a.isPlayer === 'function' && a.isPlayer()) {
            player = a;
            gear = b;
            reagent = c;
            aegis = d;
        } else {
            gear = a;
            reagent = b;
            aegis = c;
        }

        if (!gear || gear.isEmpty() || !isEligibleGear(gear)) {
            return {
                canExecute: false,
                actionType: null,
                currentLevel: 0,
                targetLevel: 0,
                chancePercent: 0,
                isSafeZone: false,
                hasAegis: false,
                requiredReagentId: null,
                statusMessage: 'Установите экипировку (оружие, броня, щит)',
                canBreakOnFail: false
            };
        }

        let curLvl = getReinforceTag(gear);
        let hasAegis = (aegis && !aegis.isEmpty() && aegis.id === 'kubejs:smithing_aegis');

        if (!reagent || reagent.isEmpty()) {
            let next = curLvl + 1;
            let req = REQUIRED_STONES[next] || null;
            return {
                canExecute: false,
                actionType: null,
                currentLevel: curLvl,
                targetLevel: next <= 10 ? next : 10,
                chancePercent: 0,
                isSafeZone: curLvl < 3,
                hasAegis: hasAegis,
                requiredReagentId: req,
                statusMessage: req ? `Требуется: ${STONE_NAMES[req] || req}` : 'Максимальный уровень (+10)!',
                canBreakOnFail: curLvl >= 3 && !hasAegis
            };
        }

        let rId = String(reagent.id);

        // 1. Smithing Stones
        if (rId.startsWith('kubejs:smithing_stone_')) {
            if (curLvl >= 10) {
                return {
                    canExecute: false,
                    actionType: 'REINFORCE',
                    currentLevel: 10,
                    targetLevel: 10,
                    chancePercent: 0,
                    isSafeZone: false,
                    hasAegis: hasAegis,
                    requiredReagentId: null,
                    statusMessage: 'Достигнут абсолютный апогей ковки (+10)!',
                    canBreakOnFail: false
                };
            }

            let nextLvl = curLvl + 1;
            let requiredStone = REQUIRED_STONES[nextLvl];
            if (rId !== requiredStone) {
                return {
                    canExecute: false,
                    actionType: 'REINFORCE',
                    currentLevel: curLvl,
                    targetLevel: nextLvl,
                    chancePercent: 0,
                    isSafeZone: curLvl < 3,
                    hasAegis: hasAegis,
                    requiredReagentId: requiredStone,
                    statusMessage: `Неверный камень. Требуется: ${STONE_NAMES[requiredStone] || requiredStone}`,
                    canBreakOnFail: curLvl >= 3 && !hasAegis
                };
            }

            let chance = FORGE_CHANCES[nextLvl] || 0;
            return {
                canExecute: true,
                actionType: 'REINFORCE',
                currentLevel: curLvl,
                targetLevel: nextLvl,
                chancePercent: chance,
                isSafeZone: curLvl < 3,
                hasAegis: hasAegis,
                requiredReagentId: requiredStone,
                statusMessage: `Шанс успеха: ${chance}% ${curLvl < 3 ? '(Безопасно)' : hasAegis ? '(Защищено Эгидой)' : '(Риск отката -1)'}`,
                canBreakOnFail: curLvl >= 3 && !hasAegis
            };
        }

        // 2. Ascension Catalysts (T4 - T11)
        if (rId.startsWith('kubejs:ascension_catalyst_t')) {
            let targetTier = parseInt(rId.replace('kubejs:ascension_catalyst_t', ''));
            if (isNaN(targetTier) || targetTier < 4 || targetTier > 11) {
                return {
                    canExecute: false,
                    actionType: 'ASCENSION',
                    currentLevel: curLvl,
                    targetLevel: curLvl,
                    chancePercent: 0,
                    isSafeZone: true,
                    hasAegis: hasAegis,
                    requiredReagentId: null,
                    statusMessage: 'Неизвестный катализатор возвышения',
                    canBreakOnFail: false
                };
            }

            let curTier = getGearTier(gear);

            if (curTier === targetTier - 1) {
                let targetItemId = findAscensionTargetItem(gear, targetTier);
                let targetItemObj = null;
                if (targetItemId && isValidItem(targetItemId)) {
                    targetItemObj = Item.of(targetItemId);
                } else {
                    targetItemObj = gear.copy();
                    targetItemId = gear.id;
                }

                return {
                    canExecute: true,
                    actionType: 'ASCENSION',
                    successRate: 100,
                    chancePercent: 100,
                    currentTier: curTier,
                    targetTier: targetTier,
                    targetItem: targetItemObj,
                    targetItemId: targetItemId,
                    costLevel: 0,
                    currentLevel: curLvl,
                    targetLevel: curLvl,
                    isSafeZone: true,
                    hasAegis: hasAegis,
                    requiredReagentId: null,
                    statusMessage: `Возвышение Оружия в Эпоху Тира ${targetTier} (Шанс: 100%)`,
                    canBreakOnFail: false
                };
            } else if (curTier >= targetTier) {
                return {
                    canExecute: false,
                    actionType: 'ASCENSION',
                    successRate: 0,
                    chancePercent: 0,
                    currentTier: curTier,
                    targetTier: targetTier,
                    targetItem: null,
                    targetItemId: gear.id,
                    costLevel: 0,
                    currentLevel: curLvl,
                    targetLevel: curLvl,
                    isSafeZone: true,
                    hasAegis: hasAegis,
                    requiredReagentId: null,
                    statusMessage: `Оружие уже принадлежит Тиру ${curTier} (равно или выше катализатора T${targetTier}).`,
                    canBreakOnFail: false
                };
            } else {
                let neededTier = curTier + 1;
                let neededCat = `kubejs:ascension_catalyst_t${neededTier}`;
                return {
                    canExecute: false,
                    actionType: 'ASCENSION',
                    successRate: 0,
                    chancePercent: 0,
                    currentTier: curTier,
                    targetTier: targetTier,
                    targetItem: null,
                    targetItemId: gear.id,
                    costLevel: 0,
                    currentLevel: curLvl,
                    targetLevel: curLvl,
                    isSafeZone: true,
                    hasAegis: hasAegis,
                    requiredReagentId: neededCat,
                    statusMessage: `Несоответствие эпох! Оружие Тира ${curTier} требует Катализатор T${neededTier}.`,
                    canBreakOnFail: false
                };
            }
        }

        // 3. Martial Tablets
        if (rId.startsWith('kubejs:martial_tablet_')) {
            return {
                canExecute: true,
                actionType: 'MARTIAL_TABLET',
                currentLevel: curLvl,
                targetLevel: curLvl,
                chancePercent: 100,
                isSafeZone: true,
                hasAegis: hasAegis,
                requiredReagentId: null,
                statusMessage: 'Гравировка Боевого Искусства (Шанс: 100%)',
                canBreakOnFail: false
            };
        }

        // 4. Tier Template
        if (rId === 'kubejs:tier_upgrade_template') {
            return {
                canExecute: true,
                actionType: 'TIER_TEMPLATE',
                currentLevel: curLvl,
                targetLevel: curLvl,
                chancePercent: 100,
                isSafeZone: true,
                hasAegis: hasAegis,
                requiredReagentId: null,
                statusMessage: 'Преемственность Тиров (Шанс: 100%)',
                canBreakOnFail: false
            };
        }

        return {
            canExecute: false,
            actionType: null,
            currentLevel: curLvl,
            targetLevel: curLvl,
            chancePercent: 0,
            isSafeZone: false,
            hasAegis: hasAegis,
            requiredReagentId: null,
            statusMessage: 'Неизвестный реагент',
            canBreakOnFail: false
        };
    },

    executeForge: function(player, gear, reagent, aegis) {
        let evalData = this.evaluate(player, gear, reagent, aegis);
        if (evalData.actionType === 'ASCENSION') {
            return this.executeAscension(player, gear, reagent);
        }
        if (!evalData.canExecute || evalData.actionType !== 'REINFORCE') {
            return {
                status: 'INVALID',
                resultGear: gear,
                consumeReagentCount: 0,
                consumeAegis: false,
                oldLevel: evalData.currentLevel,
                newLevel: evalData.currentLevel,
                message: evalData.statusMessage
            };
        }

        let roll = Math.random() * 100;
        let isSuccess = (roll < evalData.chancePercent);
        let curLvl = evalData.currentLevel;
        let nextLvl = evalData.targetLevel;
        let resultItem = gear.copy();

        if (isSuccess) {
            setReinforceTag(resultItem, nextLvl);
            updateBadge(resultItem, nextLvl);

            if (player) {
                player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 1.0 1.2`);
                player.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${player.username} ~ ~ ~ 0.9 1.4`);

                if (nextLvl >= 7) {
                    player.server.runCommandSilent(`playsound minecraft:entity.lightning_bolt.thunder player ${player.username} ~ ~ ~ 1.2 1.0`);
                }
                if (nextLvl === 10) {
                    let rawName = resultItem.hoverName.getString();
                    player.server.runCommandSilent(
                        `tellraw @a ["",{"text":"👑 [АДСКАЯ КУЗНИЦА] ","color":"gold","bold":true},{"text":"Герой ","color":"yellow"},{"text":"${player.username}","color":"white","bold":true},{"text":" закалил ","color":"yellow"},{"text":"${rawName}","color":"light_purple","bold":true},{"text":" до ","color":"yellow"},{"text":"АПОГЕЯ БОГОВ (+10)","color":"red","bold":true},{"text":"!","color":"gray"}]`
                    );
                }
            }

            return {
                status: 'SUCCESS',
                resultGear: resultItem,
                consumeReagentCount: 1,
                consumeAegis: false,
                oldLevel: curLvl,
                newLevel: nextLvl,
                message: `★ УСПЕХ ЗАТОЧКИ! +${nextLvl} (Шанс: ${evalData.chancePercent}%)`
            };
        }

        // Неудача
        if (curLvl < 3) {
            if (player) {
                player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.8 0.7`);
            }
            return {
                status: 'FAIL_SAFE',
                resultGear: resultItem,
                consumeReagentCount: 1,
                consumeAegis: false,
                oldLevel: curLvl,
                newLevel: curLvl,
                message: `✖ Неудача! Камень сгорел. Уровень сохранен (+${curLvl}).`
            };
        }

        if (evalData.hasAegis) {
            if (player) {
                player.server.runCommandSilent(`playsound minecraft:item.shield.block player ${player.username} ~ ~ ~ 1.0 1.1`);
                player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
            }
            return {
                status: 'FAIL_SAVED_BY_AEGIS',
                resultGear: resultItem,
                consumeReagentCount: 1,
                consumeAegis: true,
                oldLevel: curLvl,
                newLevel: curLvl,
                message: `🛡 Печать Эгиды спасла от отката! Уровень сохранен (+${curLvl}). Печать сгорела.`
            };
        }

        let downLvl = Math.max(0, curLvl - 1);
        setReinforceTag(resultItem, downLvl);
        updateBadge(resultItem, downLvl);

        if (player) {
            player.server.runCommandSilent(`playsound minecraft:block.anvil.destroy player ${player.username} ~ ~ ~ 1.0 0.8`);
        }

        return {
            status: 'FAIL_DOWNGRADE',
            resultGear: resultItem,
            consumeReagentCount: 1,
            consumeAegis: false,
            oldLevel: curLvl,
            newLevel: downLvl,
            message: `✖ ПРОВАЛ КОВКИ! Откат: +${curLvl} ➔ +${downLvl}! (Камень сгорел)`
        };
    },

    executeMartialInscription: function(player, gear, tablet) {
        if (!gear || gear.isEmpty() || !tablet || tablet.isEmpty() || !String(tablet.id).startsWith('kubejs:martial_tablet_')) {
            return { status: 'INVALID', resultGear: gear, rank: 0, artName: '', message: 'Неверные предметы' };
        }

        let target = gear.copy();
        let rank = 1;
        if (tablet.id.endsWith('_2')) rank = 2;
        else if (tablet.id.endsWith('_3')) rank = 3;

        try {
            if (target.customData && typeof target.customData.putInt === 'function') {
                target.customData.putInt('skd_art_rank', rank);
            } else {
                let CompoundTag = Java.loadClass('net.minecraft.nbt.CompoundTag');
                let CustomData = Java.loadClass('net.minecraft.world.item.component.CustomData');
                let DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents');
                let tag = null;
                try {
                    let cd = target.get(DataComponents.CUSTOM_DATA);
                    if (cd) tag = cd.copyTag();
                } catch (e) {}
                if (!tag) tag = new CompoundTag();
                tag.putInt('skd_art_rank', rank);
                target.set(DataComponents.CUSTOM_DATA, CustomData.of(tag));
            }
        } catch (err) {}

        if (player) {
            player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 1.0 1.2`);
        }

        return {
            status: 'SUCCESS',
            resultGear: target,
            rank: rank,
            artName: tablet.hoverName.getString(),
            message: `⚔ Боевое Искусство Ранга ${rank} успешно инкрустировано!`
        };
    },

    executeAscension: function(player, gear, catalyst) {
        if (!gear || gear.isEmpty() || !catalyst || catalyst.isEmpty()) {
            return { status: 'INVALID', resultGear: gear, message: 'Отсутствует оружие или катализатор' };
        }

        let evalData = this.evaluate(player, gear, catalyst, null);
        if (!evalData.canExecute || evalData.actionType !== 'ASCENSION') {
            return {
                status: 'INVALID',
                resultGear: gear,
                consumeReagentCount: 0,
                targetTier: evalData.currentTier || 1,
                message: evalData.statusMessage || 'Возвышение невозможно'
            };
        }

        let targetTier = evalData.targetTier;
        let targetItemId = evalData.targetItemId;
        let resultItem = null;
        let isTrackA = false;

        // Track A (Direct Item Replacement)
        if (targetItemId && targetItemId !== gear.id && isValidItem(targetItemId)) {
            resultItem = Item.of(targetItemId);
            isTrackA = true;
            // 100% NBT Transfer: deep copy customData / CompoundTag / components
            if (gear.nbt) {
                resultItem.nbt = gear.nbt.copy();
            }
            try {
                let DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents');
                let cd = gear.get(DataComponents.CUSTOM_DATA);
                if (cd) {
                    let CustomData = Java.loadClass('net.minecraft.world.item.component.CustomData');
                    resultItem.set(DataComponents.CUSTOM_DATA, CustomData.of(cd.copyTag()));
                }
                let cn = gear.get(DataComponents.CUSTOM_NAME);
                if (cn) resultItem.set(DataComponents.CUSTOM_NAME, cn);
                let enc = gear.get(DataComponents.ENCHANTMENTS);
                if (enc) resultItem.set(DataComponents.ENCHANTMENTS, enc);
            } catch (eComp) {}

            // 100% Apotheosis Sockets and Gems Transfer
            try {
                let SocketHelper = Java.loadClass('dev.shadowsoffire.apotheosis.socket.SocketHelper');
                let rawGear = gear.getItemStack ? gear.getItemStack() : gear;
                let rawResult = resultItem.getItemStack ? resultItem.getItemStack() : resultItem;
                let sockets = SocketHelper.getSockets(rawGear);
                if (sockets > 0) {
                    SocketHelper.setSockets(rawResult, sockets);
                }
                let gems = SocketHelper.getGems(rawGear);
                if (gems && !gems.isEmpty()) {
                    SocketHelper.setGems(rawResult, gems);
                }
            } catch (eApoth) {}
        } else {
            // Track B (Unique / Mod Weapon NBT Ascension)
            resultItem = gear.copy();
        }

        // Reset durability to 100%
        resultItem.damageValue = 0;

        // Stamp skd_tier and skd:tier_X
        try {
            if (resultItem.customData && typeof resultItem.customData.putInt === 'function') {
                resultItem.customData.putInt('skd_tier', targetTier);
                resultItem.customData.putBoolean('skd:tier_' + targetTier, true);
            }
        } catch (e1) {}

        try {
            let CompoundTag = Java.loadClass('net.minecraft.nbt.CompoundTag');
            let CustomData = Java.loadClass('net.minecraft.world.item.component.CustomData');
            let DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents');
            let tag = null;
            try {
                let cd = resultItem.get(DataComponents.CUSTOM_DATA);
                if (cd) tag = cd.copyTag();
            } catch (e2) {}
            if (!tag) tag = new CompoundTag();
            tag.putInt('skd_tier', targetTier);
            tag.putBoolean('skd:tier_' + targetTier, true);
            resultItem.set(DataComponents.CUSTOM_DATA, CustomData.of(tag));
        } catch (e3) {}

        // Update reinforcement badge if reinforced
        let curReinforce = getReinforceTag(resultItem);
        if (curReinforce > 0) {
            updateBadge(resultItem, curReinforce);
        }

        // Audio and visual celebrations
        if (player) {
            player.server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete player ${player.username} ~ ~ ~ 1.0 1.0`);
            player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 1.0 1.2`);
            player.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${player.username} ~ ~ ~ 1.0 1.2`);
            player.server.runCommandSilent(`playsound minecraft:entity.lightning_bolt.thunder player ${player.username} ~ ~ ~ 0.8 1.4`);

            let rawName = resultItem.hoverName.getString();
            player.server.runCommandSilent(
                `tellraw @a ["",{"text":"🌟 [ВЕЛИКОЕ ВОЗВЫШЕНИЕ] ","color":"gold","bold":true},{"text":"Герой ","color":"yellow"},{"text":"${player.username}","color":"white","bold":true},{"text":" возвысил артефакт ","color":"yellow"},{"text":"${rawName}","color":"aqua","bold":true},{"text":" до эпохи ","color":"yellow"},{"text":"ТИРА ${targetTier}","color":"light_purple","bold":true},{"text":"!","color":"gold"}]`
            );
        }

        return {
            status: 'SUCCESS',
            resultGear: resultItem,
            consumeReagentCount: 1,
            consumeAegis: false,
            targetTier: targetTier,
            isTrackA: isTrackA,
            oldLevel: curReinforce,
            newLevel: curReinforce,
            message: `✦ ВОЗВЫШЕНИЕ ЭПОХИ! Артефакт достиг Тира ${targetTier}! (100% NBT сохранены)`
        };
    }
};

// ==============================================================================
// NETWORK PACKET LISTENER (FOR CUSTOM GUI INTEGRATION)
// ==============================================================================
NetworkEvents.dataReceived('elyrium:forge_request', event => {
    let player = event.player;
    let data = event.data;
    if (!player || !data) return;

    let action = data.getString('action');
    // GUI разработчик может отправлять слоты или запрашивать расчет
    if (action === 'EVALUATE') {
        player.sendData('elyrium:forge_response', { status: 'READY' });
    }
});
