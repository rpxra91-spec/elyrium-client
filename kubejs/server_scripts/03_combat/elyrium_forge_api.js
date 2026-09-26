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

// ==============================================================================
// PUBLIC GLOBAL API
// ==============================================================================
global.ElyriumForgeAPI = {
    getReinforceLevel: function(item) {
        return getReinforceTag(item);
    },

    evaluate: function(gear, reagent, aegis) {
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

        // 2. Martial Tablets
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

        // 3. Tier Template
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
        let evalData = this.evaluate(gear, reagent, aegis);
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
