// ==============================================================================
// 🔄 ELYRIUM RPG: DUAL CHARACTER RESPEC SYSTEM (СБРОС БИЛДА И ХАРАКТЕРИСТИК)
// ==============================================================================
// 1. Channel A: Experience-Based Respec with Escalating Penalties (/respec)
//    - Tier 0: 20 XP levels
//    - Tier 1: 40 XP levels
//    - Tier 2: 70 XP levels
//    - Tier 3+: 100 XP levels
//    - Real-Time Decay: Penalty decreases by 1 tier every 24 real-world hours
// 2. Channel B: Master Alchemist Consumable ("Эликсир Очищения Души")
//    - Free instant respec without XP cost or penalty escalation
// ==============================================================================

const RESPEC_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const RESPEC_XP_COSTS = [20, 40, 70, 100];

function getEffectivePenaltyTier(player) {
    let pData = player.persistentData;
    let tier = pData.getInt('skd_respec_penalty_tier') || 0;
    let lastTime = pData.getLong('skd_last_respec_time') || 0;
    let now = Date.now();

    if (tier > 0 && lastTime > 0) {
        let elapsed = now - lastTime;
        let decayTiers = Math.floor(elapsed / RESPEC_COOLDOWN_MS);
        if (decayTiers > 0) {
            tier = Math.max(0, tier - decayTiers);
            pData.putInt('skd_respec_penalty_tier', tier);
            pData.putLong('skd_last_respec_time', now - (elapsed % RESPEC_COOLDOWN_MS));
        }
    }
    return tier;
}

function getRespecCost(tier) {
    if (tier >= RESPEC_XP_COSTS.length) {
        return RESPEC_XP_COSTS[RESPEC_XP_COSTS.length - 1];
    }
    return RESPEC_XP_COSTS[tier];
}

function getTimeUntilDecay(player) {
    let pData = player.persistentData;
    let lastTime = pData.getLong('skd_last_respec_time') || 0;
    if (lastTime <= 0) return 0;
    let elapsed = Date.now() - lastTime;
    let remaining = RESPEC_COOLDOWN_MS - (elapsed % RESPEC_COOLDOWN_MS);
    return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60))); // in hours
}

// ------------------------------------------------------------------------------
// 1. COMMAND SYSTEM: /respec and /resetstats
// ------------------------------------------------------------------------------
ServerEvents.command(event => {
    let command = event.parseResults.reader.string.trim();
    if (!command.startsWith('respec') && !command.startsWith('resetstats')) return;

    let player = event.parseResults.context.source.player;
    if (!player) return;

    event.cancel(); // Handle natively in KubeJS

    let parts = command.split(' ');
    let subCommand = parts.length > 1 ? parts[1].toLowerCase() : 'info';

    let tier = getEffectivePenaltyTier(player);
    let cost = getRespecCost(tier);
    let hoursLeft = getTimeUntilDecay(player);

    if (subCommand === 'confirm') {
        // Execute Respec
        if (player.experienceLevel < cost && !player.isCreative()) {
            player.sendSystemMessage(Text.of(`§c❌ Недостаточно уровней опыта для сброса!`));
            player.sendSystemMessage(Text.of(`§7Требуется: §e${cost} ур. §7(у вас: §c${player.experienceLevel} ур.§7)`));
            player.server.runCommandSilent(`playsound minecraft:block.chest.locked player ${player.username} ~ ~ ~ 1.0 0.8`);
            return;
        }

        // Deduct XP
        if (!player.isCreative()) {
            player.experienceLevel -= cost;
        }

        // Reset SimpleStats attributes and points
        player.server.runCommandSilent(`simplestats reset ${player.username}`);
        player.persistentData.remove('simplestats_perks');

        // Escalate penalty
        let nextTier = Math.min(RESPEC_XP_COSTS.length, tier + 1);
        player.persistentData.putInt('skd_respec_penalty_tier', nextTier);
        player.persistentData.putLong('skd_last_respec_time', Date.now());

        let nextCost = getRespecCost(nextTier);

        // Visual and Audio FX
        player.server.runCommandSilent(`playsound minecraft:block.beacon.activate player ${player.username} ~ ~ ~ 1.5 0.9`);
        player.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${player.username} ~ ~ ~ 1.2 0.7`);
        player.server.runCommandSilent(`particle minecraft:totem_of_undying ~ ~1 ~ 0.5 0.8 0.5 0.1 60 normal`);
        player.server.runCommandSilent(`particle minecraft:enchant ~ ~1.5 ~ 0.8 0.5 0.8 0.2 40 normal`);

        player.sendSystemMessage(Text.of('§6=================================================='));
        player.sendSystemMessage(Text.of('§6✨ ОЧИЩЕНИЕ ДУХА: §aВсе характеристики успешно сброшены!'));
        player.sendSystemMessage(Text.of(`§fСнято опыта: §b-${cost} уровней§f. Очки возвращены в пул SimpleStats.`));
        player.sendSystemMessage(Text.of(`§c⏳ Штраф за частый сброс: §fСледующий сброс будет стоить §e${nextCost} ур.`));
        player.sendSystemMessage(Text.of('§7(Штраф автоматически снизится через 24 часа реального времени)'));
        player.sendSystemMessage(Text.of('§6=================================================='));

    } else {
        // Show Info
        player.sendSystemMessage(Text.of('§6=================================================='));
        player.sendSystemMessage(Text.of('§6🔄 СБРОС ХАРАКТЕРИСТИК (CHARACTER RESPEC)'));
        player.sendSystemMessage(Text.of(`§7Текущая ступень штрафа: §eРанг ${tier} из 3`));
        player.sendSystemMessage(Text.of(`§7Стоимость текущего сброса: §b${cost} уровней опыта`));
        player.sendSystemMessage(Text.of(`§7Ваш текущий опыт: §a${player.experienceLevel} уровней`));
        if (tier > 0) {
            player.sendSystemMessage(Text.of(`§7Снижение штрафа (-1 ступень): §eчерез ~${hoursLeft} ч.`));
        }
        player.sendSystemMessage(Text.of(' '));
        player.sendSystemMessage(Text.of('§eДля подтверждения сброса введите: §a/respec confirm'));
        player.sendSystemMessage(Text.of('§dИли используйте крафтовый §f«Эликсир Очищения Души» §d(без штрафа XP).'));
        player.sendSystemMessage(Text.of('§6=================================================='));
    }
});

// ------------------------------------------------------------------------------
// 2. TIERED RESPEC ARTIFACTS CONFIGURATION
// ------------------------------------------------------------------------------
const TIERED_RESPEC_CONFIG = {
    'kubejs:respec_shard_copper': { maxStats: 20,  maxLevel: 20,  name: 'Медный Осколок Очищения', reqTier: 'Tier 1–2 (Overworld: 1–20 ур.)' },
    'kubejs:respec_shard_steel':  { maxStats: 32,  maxLevel: 32,  name: 'Стальной Осколок Очищения', reqTier: 'Tier 3 (Цитадель: 21–32 ур.)' },
    'kubejs:respec_vessel_cinder':{ maxStats: 44,  maxLevel: 44,  name: 'Пепельный Сосуд Очищения', reqTier: 'Tier 4 (Nether: 33–44 ур.)' },
    'kubejs:respec_orb_aether':   { maxStats: 56,  maxLevel: 56,  name: 'Небесная Сфера Забвения', reqTier: 'Tier 5 (Aether: 45–56 ур.)' },
    'kubejs:respec_echo_void':    { maxStats: 68,  maxLevel: 68,  name: 'Эхо Бездны Очищения', reqTier: 'Tier 6 (The End: 57–68 ур.)' },
    'kubejs:respec_tome_divine':  { maxStats: 9999, maxLevel: 100, name: 'Божественный Фолиант Перерождения', reqTier: 'Tier 7–11 (Endgame: 69–100 ур.)' }
};

ItemEvents.foodEaten(event => {
    let item = event.item;
    if (!item) return;

    let config = TIERED_RESPEC_CONFIG[item.id];
    if (!config) return;

    let player = event.player;
    if (!player) return;

    // Calculate player's current total invested stats
    let pData = player.persistentData;
    let perks = pData.getCompound('simplestats_perks');
    let str = perks ? perks.getInt('strength') : 0;
    let vit = perks ? perks.getInt('vitality') : 0;
    let def = perks ? perks.getInt('defense') : 0;
    let agi = perks ? perks.getInt('agility') : 0;
    let crit = perks ? perks.getInt('crit') : 0;
    let mana = perks ? perks.getInt('mana') : 0;
    let totalStats = str + vit + def + agi + crit + mana;

    // Strict Level / Stat Gating:
    if (totalStats > config.maxStats) {
        // Soul is too mature for this weak item! Refund item.
        player.give(item.id);
        player.server.runCommandSilent(`playsound minecraft:block.chest.locked player ${player.username} ~ ~ ~ 1.2 0.8`);
        player.sendSystemMessage(Text.of('§c=================================================='));
        player.sendSystemMessage(Text.of(`§c❌ ВАША ДУША СЛИШКОМ СИЛЬНА ДЛЯ ЭТОГО ПРЕДМЕТА!`));
        player.sendSystemMessage(Text.of(`§7Артефакт: §e«${config.name}» §7рассчитан только до §a${config.maxLevel} уровня§7.`));
        player.sendSystemMessage(Text.of(`§fВаша сила: §b${totalStats} очков статов §7(эквивалент ~${Math.ceil(totalStats / 2)} ур.).`));
        player.sendSystemMessage(Text.of(`§6Вам необходим артефакт более высокого тира!`));
        player.sendSystemMessage(Text.of('§c=================================================='));
        return;
    }

    // Passed: Reset SimpleStats
    player.server.runCommandSilent(`simplestats reset ${player.username}`);
    pData.remove('simplestats_perks');

    // Visual & Audio FX
    player.server.runCommandSilent(`playsound minecraft:item.totem.use player ${player.username} ~ ~ ~ 1.5 1.0`);
    player.server.runCommandSilent(`playsound minecraft:block.amethyst_block.resonate player ${player.username} ~ ~ ~ 1.5 1.2`);
    player.server.runCommandSilent(`particle minecraft:totem_of_undying ~ ~1 ~ 0.6 1.0 0.6 0.1 80 normal`);
    player.server.runCommandSilent(`particle minecraft:portal ~ ~1 ~ 0.5 0.5 0.5 0.2 50 normal`);

    player.sendSystemMessage(Text.of('§d=================================================='));
    player.sendSystemMessage(Text.of(`§d✨ ${config.name.toUpperCase()} ПОГЛОЩЕН!`));
    player.sendSystemMessage(Text.of('§aХарактеристики полностью очищены, очки возвращены в нераспределенный пул!'));
    player.sendSystemMessage(Text.of('§d=================================================='));
});

