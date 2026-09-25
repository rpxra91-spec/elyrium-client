// ==============================================================================
// 🔨 ELYRIUM RPG: EQUIPMENT REINFORCEMENT ENGINE (+1 ... +10)
// ==============================================================================
// 1. Works at any Anvil block without requiring Minecraft XP.
// 2. Uses 5 unified Smithing Stones (+1..+2, +3..+4, +5..+6, +7..+8, +9..+10).
// 3. Raw hardcore RNG chances: +1: 100%, +2: 50%, +3: 30%, +4: 15%, +5: 10%,
//    +6: 6%, +7: 3.5%, +8: 1.8%, +9: 0.8%, +10: 0.3%.
// 4. Downgrade risk on failure from +4 (-1 level).
// 5. Protected by rare "Ancient Smith's Aegis" (prevents downgrade).
// ==============================================================================

const CHANCES = {
    1: 100.0,
    2: 50.0,
    3: 30.0,
    4: 15.0,
    5: 10.0,
    6: 6.0,
    7: 3.5,
    8: 1.8,
    9: 0.8,
    10: 0.3
};

const REQUIRED_STONES = {
    1: 'kubejs:smithing_stone_1',
    2: 'kubejs:smithing_stone_1',
    3: 'kubejs:smithing_stone_2',
    4: 'kubejs:smithing_stone_2',
    5: 'kubejs:smithing_stone_3',
    6: 'kubejs:smithing_stone_3',
    7: 'kubejs:smithing_stone_4',
    8: 'kubejs:smithing_stone_4',
    9: 'kubejs:smithing_stone_5',
    10: 'kubejs:smithing_stone_5'
};

const STONE_NAMES = {
    'kubejs:smithing_stone_1': 'Кузнечный Оселок I (+1..+2)',
    'kubejs:smithing_stone_2': 'Закалочный Камень II (+3..+4)',
    'kubejs:smithing_stone_3': 'Небесный Камень III (+5..+6)',
    'kubejs:smithing_stone_4': 'Астральный Камень IV (+7..+8)',
    'kubejs:smithing_stone_5': 'Божественный Камень Мортума V (+9..+10)'
};

function isReinforceable(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = item.id.toLowerCase();

    // Weapons
    if (item.hasTag('c:tools/melee_weapon') || item.hasTag('minecraft:swords') ||
        item.hasTag('minecraft:axes') || item.hasTag('c:tools/bows') ||
        item.hasTag('c:tools/crossbows') || id.includes('sword') ||
        id.includes('blade') || id.includes('claymore') || id.includes('katana') ||
        id.includes('dagger') || id.includes('hammer') || id.includes('spear') ||
        id.includes('halberd') || id.includes('axe') || id.includes('bow') ||
        id.includes('staff') || id.includes('wand')) {
        return true;
    }

    // Armor
    if (item.hasTag('minecraft:armors') || item.hasTag('c:armors') ||
        id.includes('helmet') || id.includes('chestplate') ||
        id.includes('leggings') || id.includes('boots')) {
        return true;
    }

    // Shields
    if (item.hasTag('c:tools/shields') || item.hasTag('c:shields') || id.includes('shield')) {
        return true;
    }

    return false;
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

function getReinforceLevel(item) {
    if (!item || item.isEmpty()) return 0;
    let tag = getSafeItemTag(item);
    if (!tag) return 0;
    try {
        return tag.getInt('skd_reinforce') || 0;
    } catch (e) {
        return 0;
    }
}

function setReinforceLevel(item, lvl) {
    if (!item || item.isEmpty()) return;
    let clamped = Math.max(0, Math.min(10, lvl));
    let tag = getOrCreateSafeItemTag(item);
    if (tag) {
        try {
            tag.putInt('skd_reinforce', clamped);
        } catch (e) {}
    }
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
    } catch (e) {
        console.error('[ReinforceEngine] Error updating gear badge: ' + e);
    }
}

// ------------------------------------------------------------------------------
// ANVIL INTERACTION HOOK: Right Click Anvil with Smithing Stone
// ------------------------------------------------------------------------------
BlockEvents.rightClicked(event => {
    let block = event.block;
    if (!block) return;
    let bId = block.id.toLowerCase();
    if (!bId.includes('anvil')) return; // minecraft:anvil, chipped_anvil, damaged_anvil

    let player = event.player;
    if (!player || player.level.isClientSide()) return;

    let mainItem = player.mainHandItem;
    let offItem = player.offHandItem;

    let stoneItem = null;
    let targetItem = null;
    let isStoneInMain = false;

    // Detect Stone in Main Hand and Gear in Off Hand
    if (mainItem && mainItem.id.startsWith('kubejs:smithing_stone_')) {
        stoneItem = mainItem;
        targetItem = offItem;
        isStoneInMain = true;
    } 
    // Or Gear in Main Hand and Stone in Off Hand
    else if (offItem && offItem.id.startsWith('kubejs:smithing_stone_')) {
        stoneItem = offItem;
        targetItem = mainItem;
        isStoneInMain = false;
    }

    // If player is not holding forging stone, let default Anvil GUI open
    if (!stoneItem) return;

    // If Infernal Anvil, let the interactive GUI engine handle it
    if (bId === 'kubejs:infernal_anvil') return;

    // Intercept event on vanilla anvils: cancel vanilla anvil GUI
    event.cancel();

    // If not Infernal Anvil, reject with lore warning
    player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.5 0.5`);
    player.server.runCommandSilent(`particle minecraft:smoke ${block.x + 0.5} ${block.y + 1.0} ${block.z + 0.5} 0.3 0.3 0.3 0.05 20`);
    player.displayClientMessage(
        Text.of('§c✖ Обычная наковальня раскалывается от температуры камней! §eТребуется §6Адская Наковальня§e из Незера (Tier 4)!'),
        true
    );
    return;

    // Validate target gear
    if (!targetItem || targetItem.isEmpty() || !isReinforceable(targetItem)) {
        player.displayClientMessage(
            Text.of('§e🔨 [Кузница] Возьмите в другую руку §bоружие, броню или щит§e для заточки!'),
            true
        );
        player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.5 1.5`);
        return;
    }

    let curLvl = getReinforceLevel(targetItem);

    // Check Max Cap (+10)
    if (curLvl >= 10) {
        player.displayClientMessage(
            Text.of('§6👑 [Кузница] Этот предмет уже достиг Апогея Богов (+10)! Дальнейшая ковка невозможна.'),
            true
        );
        player.server.runCommandSilent(`playsound minecraft:entity.experience_orb.pickup player ${player.username} ~ ~ ~ 0.8 1.0`);
        return;
    }

    let nextLvl = curLvl + 1;
    let neededStone = REQUIRED_STONES[nextLvl];

    // Check Stone Tier match
    if (stoneItem.id !== neededStone) {
        let expectedName = STONE_NAMES[neededStone] || 'Подходящий камень';
        player.displayClientMessage(
            Text.of(`§c✖ Неподходящий камень! Для заточки с §e+${curLvl}§c на §e+${nextLvl}§c требуется: §f${expectedName}`),
            true
        );
        player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.7 0.8`);
        return;
    }

    // Check for Ancient Smith's Aegis in inventory
    let aegisSlot = -1;
    for (let i = 0; i < player.inventory.size; i++) {
        let s = player.inventory.getItem(i);
        if (s && s.id === 'kubejs:smithing_aegis') {
            aegisSlot = i;
            break;
        }
    }
    let hasAegis = (aegisSlot !== -1);

    // Consume 1 Smithing Stone
    stoneItem.shrink(1);

    // Roll RNG
    let baseChance = CHANCES[nextLvl] || 0.3;
    let roll = Math.random() * 100.0;
    let isSuccess = (roll < baseChance);

    let bx = block.x;
    let by = block.y;
    let bz = block.z;

    // --------------------------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------------------------
    if (isSuccess) {
        setReinforceLevel(targetItem, nextLvl);
        updateItemReinforceName(targetItem, nextLvl);

        // Sound & particles
        player.server.runCommandSilent(`playsound minecraft:block.anvil.use block @a ${bx} ${by} ${bz} 1.0 1.2`);
        player.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${player.username} ~ ~ ~ 0.9 1.4`);
        player.server.runCommandSilent(`particle minecraft:wax_off ${bx+0.5} ${by+1.2} ${bz+0.5} 0.4 0.4 0.4 0.05 30`);

        if (nextLvl >= 7) {
            player.server.runCommandSilent(`playsound minecraft:entity.lightning_bolt.thunder block @a ${bx} ${by} ${bz} 1.2 1.0`);
            player.server.runCommandSilent(`particle minecraft:totem_of_undying ${bx+0.5} ${by+1.5} ${bz+0.5} 0.5 0.5 0.5 0.2 50`);
            player.server.runCommandSilent(`particle minecraft:firework ${bx+0.5} ${by+1.8} ${bz+0.5} 0.3 0.3 0.3 0.1 40`);
        }

        if (nextLvl === 10) {
            // Global server announcement
            let rawName = targetItem.hoverName.getString();
            player.server.runCommandSilent(
                `tellraw @a ["",{"text":"👑 [ВЕЛИКАЯ КУЗНИЦА] ","color":"gold","bold":true},{"text":"Герой ","color":"yellow"},{"text":"${player.username}","color":"white","bold":true},{"text":" успешно закалил ","color":"yellow"},{"text":"${rawName}","color":"light_purple","bold":true},{"text":" до ","color":"yellow"},{"text":"АПОГЕЯ БОГОВ (+10)","color":"red","bold":true},{"text":"! (Шанс был 0.3%)","color":"gray"}]`
            );
        }

        player.displayClientMessage(
            Text.of(`§a★ УСПЕХ ЗАТОЧКИ! §f${targetItem.hoverName.getString()} §a(Шанс: ${baseChance}%)`),
            true
        );
    } 
    // --------------------------------------------------------------------------
    // FAILURE
    // --------------------------------------------------------------------------
    else {
        // Levels 1-3: Safe zone (no level drop)
        if (curLvl < 3) {
            player.server.runCommandSilent(`playsound minecraft:block.anvil.hit block @a ${bx} ${by} ${bz} 0.8 0.7`);
            player.server.runCommandSilent(`particle minecraft:smoke ${bx+0.5} ${by+1.1} ${bz+0.5} 0.3 0.3 0.3 0.02 20`);

            player.displayClientMessage(
                Text.of(`§c✖ Неудача! Камень сгорел. §7Уровень предмета сохранен (+${curLvl}).`),
                true
            );
        } 
        // Levels 4+: High risk zone (downgrade unless Aegis present)
        else {
            if (hasAegis) {
                // Consume 1 Aegis
                let aegisStack = player.inventory.getItem(aegisSlot);
                aegisStack.shrink(1);

                player.server.runCommandSilent(`playsound minecraft:item.shield.block block @a ${bx} ${by} ${bz} 1.0 1.1`);
                player.server.runCommandSilent(`playsound minecraft:block.anvil.hit block @a ${bx} ${by} ${bz} 0.8 0.8`);
                player.server.runCommandSilent(`particle minecraft:enchanted_hit ${bx+0.5} ${by+1.2} ${bz+0.5} 0.4 0.4 0.4 0.1 35`);

                player.displayClientMessage(
                    Text.of(`§6🛡 Печать Древнего Кузнеца спасла от отката! §7Уровень сохранен (+${curLvl}). Печать сгорела.`),
                    true
                );
            } else {
                // Downgrade level by 1
                let downLvl = curLvl - 1;
                setReinforceLevel(targetItem, downLvl);
                updateItemReinforceName(targetItem, downLvl);

                player.server.runCommandSilent(`playsound minecraft:block.anvil.destroy block @a ${bx} ${by} ${bz} 1.0 0.8`);
                player.server.runCommandSilent(`particle minecraft:large_smoke ${bx+0.5} ${by+1.2} ${bz+0.5} 0.4 0.4 0.4 0.05 30`);
                player.server.runCommandSilent(`particle minecraft:flame ${bx+0.5} ${by+1.1} ${bz+0.5} 0.3 0.3 0.3 0.03 15`);

                player.displayClientMessage(
                    Text.of(`§4✖ ПРОВАЛ КОВКИ! §cОткат уровня: +${curLvl} ➔ §4+${downLvl}§c! §7(Камень сгорел)`),
                    true
                );
            }
        }
    }
});

// ------------------------------------------------------------------------------
// 6. GUI ANVIL SUPPORT ENGINE (AnvilUpdateEvent & AnvilRepairEvent)
// ------------------------------------------------------------------------------

function getSharpenResult(left, right) {
    if (!left || left.isEmpty() || !isReinforceable(left)) return null;
    if (!right || right.isEmpty() || !right.id.startsWith('kubejs:smithing_stone_')) return null;

    let curLvl = getReinforceLevel(left);
    if (curLvl >= 10) return null; // Cap reached (+10)

    let nextLvl = curLvl + 1;
    let neededStone = REQUIRED_STONES[nextLvl];
    if (right.id !== neededStone) return null; // Stone tier mismatch

    let result = left.copy();
    setReinforceLevel(result, nextLvl);
    updateItemReinforceName(result, nextLvl);
    return {
        result: result,
        curLvl: curLvl,
        nextLvl: nextLvl,
        chance: CHANCES[nextLvl] || 0.3
    };
}

function cleanReinforcePreviewLore(item) {
    if (!item || item.isEmpty()) return;
    let tag = getSafeItemTag(item);
    if (tag) {
        try {
            tag.remove('skd_reinforce_preview');
            tag.remove('skd_prev_cur');
            tag.remove('skd_prev_next');
        } catch (e) {}
    }

    try {
        if (item.lore && item.lore.length > 0) {
            let clean = [];
            for (let l of item.lore) {
                let str = String(l.getString ? l.getString() : l);
                if (!str.includes('Кузнечное Улучшение') && !str.includes('Шанс успешной') &&
                    !str.includes('Безопасная зона') && !str.includes('риск отката') &&
                    !str.includes('Печать Кузнеца') && !str.includes('━━━━━━━━')) {
                    clean.push(l);
                }
            }
            item.setLore(clean);
        }
    } catch (e) {}
}

function prepareReinforcePreviewOutput(calcResult, player) {
    let result = calcResult.result.copy();
    let curLvl = calcResult.curLvl;
    let nextLvl = calcResult.nextLvl;
    let chance = calcResult.chance;

    // Check if player has Ancient Smith's Aegis in inventory
    let hasAegis = false;
    if (player && player.inventory) {
        for (let i = 0; i < player.inventory.size; i++) {
            let s = player.inventory.getItem(i);
            if (s && s.id === 'kubejs:smithing_aegis') {
                hasAegis = true;
                break;
            }
        }
    }

    let lore = [];
    if (result.lore) {
        for (let l of result.lore) {
            let str = String(l.getString ? l.getString() : l);
            if (!str.includes('Кузнечное Улучшение') && !str.includes('Шанс успешной') &&
                !str.includes('Безопасная зона') && !str.includes('риск отката') &&
                !str.includes('Печать Кузнеца') && !str.includes('━━━━━━━━')) {
                lore.push(l);
            }
        }
    }

    lore.push(Text.of('§7━━━━━━━━━━━━━━━━━━━━'));
    lore.push(Text.of(`§6🔨 [Кузнечное Улучшение] +${curLvl} ➔ §a+${nextLvl}`));
    lore.push(Text.of(`§fШанс успешной ковки: §e${chance}%`));
    if (curLvl < 3) {
        lore.push(Text.of('§a✓ Безопасная зона: без риска отката'));
    } else if (hasAegis) {
        lore.push(Text.of('§6🛡 Защита: Печать Древнего Кузнеца активна!'));
    } else {
        lore.push(Text.of('§c⚠ Внимание: риск отката -1 при неудаче'));
        lore.push(Text.of('§7(Печать Кузнеца в инвентаре защитит от отката)'));
    }
    lore.push(Text.of('§7━━━━━━━━━━━━━━━━━━━━'));
    result.setLore(lore);

    let tag = getOrCreateSafeItemTag(result);
    if (tag) {
        try {
            tag.putBoolean('skd_reinforce_preview', true);
            tag.putInt('skd_prev_cur', curLvl);
            tag.putInt('skd_prev_next', nextLvl);
        } catch (e) {}
    }
    return result;
}

try {
    let NeoForge = Java.loadClass('net.neoforged.neoforge.common.NeoForge');
    let AnvilUpdateEventClass = Java.loadClass('net.neoforged.neoforge.event.AnvilUpdateEvent');
    let Consumer = Java.loadClass('java.util.function.Consumer');
    let anvilListener = new Consumer({
        accept: function(event) {
            let left = event.left;
            let right = event.right;
            let player = event.player;
            if (!left || left.isEmpty() || !right || right.isEmpty()) return;

            // Vanilla Anvil block: reinforcement is locked to Infernal Anvil (Tier 4)
            let rId = right.id ? String(right.id) : '';
            if (rId.startsWith('kubejs:smithing_stone_')) {
                event.setOutput(Item.empty);
                if (player) {
                    player.displayClientMessage(
                        Text.of('§c✖ Обычная наковальня раскалывается от жара! §eИспользуйте §6Адскую Наковальню§e (Tier 4 Незер).'),
                        true
                    );
                }
                return;
            }

            let calc = getSharpenResult(left, right);
            if (!calc) return;

            let previewItem = prepareReinforcePreviewOutput(calc, player);
            event.setOutput(previewItem);
            event.setCost(1);
            event.setMaterialCost(1);

            // Vanilla AnvilMenu requires player.experienceLevel >= cost && cost > 0 in survival.
            // If the player has 0 levels, grant 1 temporary level so the client and server allow picking up.
            if (player && player.experienceLevel < 1) {
                player.giveExperienceLevels(1);
                if (player.persistentData) {
                    player.persistentData.putBoolean('skd_anvil_temp_xp', true);
                }
            }
        }
    });
    NeoForge.EVENT_BUS['addListener(java.lang.Class,java.util.function.Consumer)'](AnvilUpdateEventClass, anvilListener);
} catch (e) {
    console.error('[Reinforcement Engine] NeoForge AnvilUpdateEvent registration error: ' + e);
}

try {
    let NeoForge = Java.loadClass('net.neoforged.neoforge.common.NeoForge');
    let AnvilRepairEventClass = Java.loadClass('net.neoforged.neoforge.event.entity.player.AnvilRepairEvent');
    let Consumer = Java.loadClass('java.util.function.Consumer');
    let repairListener = new Consumer({
        accept: function(event) {
            let output = event.output;
            let left = event.left;
            let right = event.right;
            let player = event.entity || event.player;
            if (!output || output.isEmpty() || !player) return;

            let outTag = getSafeItemTag(output);
            let rightId = right && right.id ? String(right.id) : (right && right.getItem ? String(right.getItem()) : '');
            let isReinforcePreview = (outTag && outTag.getBoolean('skd_reinforce_preview')) ||
                                    (rightId.startsWith('kubejs:smithing_stone_'));
            if (!isReinforcePreview) return;

            event.setBreakChance(0.0);
            cleanReinforcePreviewLore(output);

            // Free reinforcement: refund the 1 XP level required by vanilla AnvilMenu
            if (player && player.persistentData) {
                if (player.persistentData.getBoolean('skd_anvil_temp_xp')) {
                    player.persistentData.remove('skd_anvil_temp_xp');
                } else if (player.giveExperienceLevels) {
                    player.giveExperienceLevels(1);
                }
            }

            let curLvl = getReinforceLevel(left);
            let nextLvl = curLvl + 1;
            let baseChance = CHANCES[nextLvl] || 0.3;
            let roll = Math.random() * 100.0;
            let isSuccess = (roll < baseChance);

            let aegisSlot = -1;
            for (let i = 0; i < player.inventory.size; i++) {
                let s = player.inventory.getItem(i);
                if (s && s.id === 'kubejs:smithing_aegis') {
                    aegisSlot = i;
                    break;
                }
            }
            let hasAegis = (aegisSlot !== -1);

            let px = player.x;
            let py = player.y;
            let pz = player.z;

            if (isSuccess) {
                setReinforceLevel(output, nextLvl);
                updateItemReinforceName(output, nextLvl);

                player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 1.0 1.2`);
                player.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${player.username} ~ ~ ~ 0.9 1.4`);
                player.server.runCommandSilent(`particle minecraft:wax_off ${px} ${py + 1.2} ${pz} 0.4 0.4 0.4 0.05 30`);

                if (nextLvl >= 7) {
                    player.server.runCommandSilent(`playsound minecraft:entity.lightning_bolt.thunder player ${player.username} ~ ~ ~ 1.2 1.0`);
                    player.server.runCommandSilent(`particle minecraft:totem_of_undying ${px} ${py + 1.5} ${pz} 0.5 0.5 0.5 0.2 50`);
                    player.server.runCommandSilent(`particle minecraft:firework ${px} ${py + 1.8} ${pz} 0.3 0.3 0.3 0.1 40`);
                }

                if (nextLvl === 10) {
                    let rawName = output.hoverName.getString();
                    player.server.runCommandSilent(
                        `tellraw @a ["",{"text":"👑 [ВЕЛИКАЯ КУЗНИЦА] ","color":"gold","bold":true},{"text":"Герой ","color":"yellow"},{"text":"${player.username}","color":"white","bold":true},{"text":" успешно закалил ","color":"yellow"},{"text":"${rawName}","color":"light_purple","bold":true},{"text":" до ","color":"yellow"},{"text":"АПОГЕЯ БОГОВ (+10)","color":"red","bold":true},{"text":"! (Шанс был 0.3%)","color":"gray"}]`
                    );
                }

                player.displayClientMessage(
                    Text.of(`§a★ УСПЕХ ЗАТОЧКИ! §f${output.hoverName.getString()} §a(Шанс: ${baseChance}%)`),
                    true
                );
            } else {
                if (curLvl < 3) {
                    setReinforceLevel(output, curLvl);
                    updateItemReinforceName(output, curLvl);
                    player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.8 0.7`);
                    player.server.runCommandSilent(`particle minecraft:smoke ${px} ${py + 1.1} ${pz} 0.3 0.3 0.3 0.02 20`);
                    player.displayClientMessage(
                        Text.of(`§c✖ Неудача! Камень сгорел. §7Уровень предмета сохранен (+${curLvl}).`),
                        true
                    );
                } else {
                    if (hasAegis) {
                        let aegisStack = player.inventory.getItem(aegisSlot);
                        aegisStack.shrink(1);
                        setReinforceLevel(output, curLvl);
                        updateItemReinforceName(output, curLvl);
                        player.server.runCommandSilent(`playsound minecraft:item.shield.block player ${player.username} ~ ~ ~ 1.0 1.1`);
                        player.server.runCommandSilent(`playsound minecraft:block.anvil.hit player ${player.username} ~ ~ ~ 0.8 0.8`);
                        player.server.runCommandSilent(`particle minecraft:enchanted_hit ${px} ${py + 1.2} ${pz} 0.4 0.4 0.4 0.1 35`);
                        player.displayClientMessage(
                            Text.of(`§6🛡 Печать Древнего Кузнеца спасла от отката! §7Уровень сохранен (+${curLvl}). Печать сгорела.`),
                            true
                        );
                    } else {
                        let downLvl = curLvl - 1;
                        setReinforceLevel(output, downLvl);
                        updateItemReinforceName(output, downLvl);
                        player.server.runCommandSilent(`playsound minecraft:block.anvil.destroy player ${player.username} ~ ~ ~ 1.0 0.8`);
                        player.server.runCommandSilent(`particle minecraft:large_smoke ${px} ${py + 1.2} ${pz} 0.4 0.4 0.4 0.05 30`);
                        player.server.runCommandSilent(`particle minecraft:flame ${px} ${py + 1.1} ${pz} 0.3 0.3 0.3 0.03 15`);
                        player.displayClientMessage(
                            Text.of(`§4✖ ПРОВАЛ КОВКИ! §cОткат уровня: +${curLvl} ➔ §4+${downLvl}§c! §7(Камень сгорел)`),
                            true
                        );
                    }
                }
            }
        }
    });
    NeoForge.EVENT_BUS['addListener(java.lang.Class,java.util.function.Consumer)'](AnvilRepairEventClass, repairListener);
} catch (e) {
    console.error('[Reinforcement Engine] NeoForge AnvilRepairEvent registration error: ' + e);
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

        // If Slot 2 is empty, calculate and place preview
        if (slot2.isEmpty() && !slot0.isEmpty() && !slot1.isEmpty()) {
            let calc = getSharpenResult(slot0, slot1);
            if (calc) {
                let previewItem = prepareReinforcePreviewOutput(calc, player);
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


