// ==============================================================================
// ☠ ELYRIUM RPG: SOUL TRAUMA DEATH PENALTY ENGINE (ТРАВМА ДУШИ)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script (03_combat)
// ==============================================================================
// 1. Permanent Character Level is NEVER lost on death (SimpleStats persistent).
// 2. On Death:
//    - Evaluates death streak within a 3-minute window:
//      * Streak 1: Base duration 30 seconds.
//      * Streak 2: 45 seconds.
//      * Streak 3: 60 seconds.
//      * Streak 4: 75 seconds.
//      * Streak 5+: 90 seconds (hard cap).
//    - Gear Degradation: Equipped armor and weapons take 5% max durability wear.
// 3. On Respawn (PlayerEvents.respawned):
//    - Applies «Травма Души» (Soul Trauma):
//      * Weakness I (reduced physical melee attack power)
//      * Slowness I (15% slower movement)
//      * Mining Fatigue I (impaired mining speed)
//    - Displays atmospheric notification with exact duration and death streak.
// 4. Cleansing Mechanic (ItemEvents.foodEaten):
//    - Any hearty cooked meal, soup, stew, or chef masterpiece instantly
//      dispels Soul Trauma and resets the death streak!
// ==============================================================================

const BASE_TRAUMA_SECONDS = 30;
const STREAK_INCREMENT_SECONDS = 15;
const MAX_TRAUMA_SECONDS = 90;
const STREAK_RESET_WINDOW_MS = 3 * 60 * 1000; // 3 minutes without death resets streak

// Track player death & apply gear wear
EntityEvents.death(event => {
    let entity = event.entity;
    if (!entity || !entity.isPlayer()) return;

    let player = entity;
    let now = Date.now();
    let lastDeathTime = player.persistentData.getLong('elyrium_last_death_time') || 0;
    let currentStreak = player.persistentData.getInt('elyrium_death_streak') || 0;

    // Check if death occurred within streak window
    if (lastDeathTime > 0 && (now - lastDeathTime) <= STREAK_RESET_WINDOW_MS) {
        currentStreak = Math.min(5, currentStreak + 1);
    } else {
        currentStreak = 1;
    }

    player.persistentData.putLong('elyrium_last_death_time', now);
    player.persistentData.putInt('elyrium_death_streak', currentStreak);

    // Apply 5% durability wear to equipped armor and held items
    let equipmentSlots = ['head', 'chest', 'legs', 'feet', 'mainhand', 'offhand'];
    let damagedCount = 0;

    equipmentSlots.forEach(slot => {
        let item = player.getEquipment(slot);
        if (item && !item.isEmpty() && item.isDamageableItem()) {
            let maxDmg = item.maxDamage;
            let wear = Math.max(1, Math.floor(maxDmg * 0.05));
            let newDamage = Math.min(maxDmg - 1, item.damageValue + wear);
            item.damageValue = newDamage;
            damagedCount++;
        }
    });

    if (damagedCount > 0) {
        player.tell(Text.of('§c🛡 Экипировка повреждена при падении (-5% прочности)!'));
    }
});

// Apply Soul Trauma upon respawning
PlayerEvents.respawned(event => {
    let player = event.player;
    if (!player) return;

    let streak = player.persistentData.getInt('elyrium_death_streak') || 1;
    let durationSeconds = Math.min(MAX_TRAUMA_SECONDS, BASE_TRAUMA_SECONDS + (streak - 1) * STREAK_INCREMENT_SECONDS);
    let durationTicks = durationSeconds * 20;

    // Mark soul trauma active
    player.persistentData.putBoolean('elyrium_soul_trauma', true);

    // Apply status debuffs
    player.potionEffects.add('minecraft:weakness', durationTicks, 0, false, true);
    player.potionEffects.add('minecraft:slowness', durationTicks, 0, false, true);
    player.potionEffects.add('minecraft:mining_fatigue', durationTicks, 0, false, true);

    // Play eerie heartbeat / chime
    player.server.runCommandSilent(`playsound minecraft:entity.warden.heartbeat player ${player.username} ~ ~ ~ 1.0 0.8`);

    // Atmospheric feedback
    if (streak <= 1) {
        player.sendSystemMessage(
            Text.of(`§c☠ [Травма Души] Связь с телом ослаблена (${durationSeconds} сек)! Урон и скорость временно снижены.`),
            false
        );
    } else {
        player.sendSystemMessage(
            Text.of(`§c☠ [Глубокая Травма Души] Серия смертей (x${streak})! Длительность: ${durationSeconds} сек. Горячая трапеза снимет недуг.`),
            false
        );
    }
});

// Cleansing: Consuming hot/hearty dishes dispels Soul Trauma
ItemEvents.foodEaten(event => {
    let player = event.player;
    let item = event.item;
    if (!player || !item) return;

    if (!player.persistentData.getBoolean('elyrium_soul_trauma')) return;

    let itemId = String(item.id).toLowerCase();
    let isHeartyDish = itemId.includes('stew') || itemId.includes('soup') ||
                       itemId.includes('pie') || itemId.includes('roast') ||
                       itemId.includes('feast') || itemId.includes('cooked_') ||
                       itemId.includes('bread') || itemId.includes('golden_apple') ||
                       itemId.includes('sandwich');

    if (isHeartyDish) {
        // Dispel trauma
        player.potionEffects.remove('minecraft:weakness');
        player.potionEffects.remove('minecraft:slowness');
        player.potionEffects.remove('minecraft:mining_fatigue');

        player.persistentData.putBoolean('elyrium_soul_trauma', false);
        player.persistentData.putInt('elyrium_death_streak', 0);

        player.sendSystemMessage(
            Text.of('§a✨ [Очищение Духа] Горячая трапеза восстановила силы! Травма души рассеялась.'),
            true
        );
        player.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${player.username} ~ ~ ~ 0.7 1.5`);
    }
});
