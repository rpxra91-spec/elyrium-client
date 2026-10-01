// ==============================================================================
// 🏛️ ELYRIUM RPG: UNIFIED RPG LEVELING & EXPERIENCE ENGINE (1–100 LEVELS)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script (v2.1)
// ==============================================================================
// - Fuses SimpleStats (1-100) and Puffish Skills ('elyrium:celestial_tree').
// - Direct JVM LevelManager API integration (zero NBT lag, atomic updates).
// - Strict Zero Start: New players start at Level 1, 0% XP bar, 0 Stat Points, 0 Talent Points.
// - Level 2+ Atomic Progression: +1 Stat Point (SimpleStats) and +1 Talent Point (Puffish Skills).
// - Full RPG Fanfare: challenge sound, celebratory screen title, chat alert,
//   and golden/azure particles.
// - "Second Wind" (Второе Дыхание): 100% Health, Food, and Mana replenishment.
// - Harmonizes Vanilla XP bar with RPG Hero Level (1-100) and XP progress via LevelManager.getXpProgress.
// - Captures Vanilla XP gains (mining ores, smelting, breeding, fishing, quests)
//   and directly routes them into SimpleStats via LevelManager.addXP.
// - Abolishes vanilla XP drain: disables Enchanting Table and restores level on anvil.
// ==============================================================================

let LevelManager = null;
try {
    LevelManager = Java.loadClass('network.roto.simplestats.leveling.LevelManager');
} catch (e) {
    console.error('[RPG Leveling] Failed to load SimpleStats LevelManager:', e);
}

// Helper: Safely resolve raw Minecraft ServerPlayer
function getRawPlayer(player) {
    if (!player) return null;
    return player.minecraftPlayer || player.minecraftEntity || player.entity || player;
}

// Helper: Get effective RPG level of player (Direct Java API or NBT fallback)
function getPlayerLevel(player) {
    if (!player) return 1;
    if (LevelManager) {
        try {
            let raw = getRawPlayer(player);
            return LevelManager.getLevel(raw);
        } catch (e) {
            try {
                return LevelManager.getLevel(player);
            } catch (e2) {}
        }
    }
    let pData = player.persistentData;
    return pData ? Math.max(1, pData.getInt('simplestats_level')) : 1;
}

// Helper: Calculate XP required for next level in SimpleStats
function getRequiredXpForLevel(lvl) {
    if (LevelManager) {
        try {
            return LevelManager.getXpRequiredForLevel(lvl);
        } catch (e) {}
    }
    let l = Math.max(1, lvl);
    return Math.max(1, Math.floor(50 * Math.pow(1.08, l <= 1 ? 0 : l - 2)));
}

// Helper: Get normalized XP progress (0.0 to 1.0)
function getPlayerXpProgress(player) {
    if (!player) return 0.0;
    if (LevelManager) {
        try {
            let raw = getRawPlayer(player);
            return Math.min(0.999, Math.max(0.0, LevelManager.getXpProgress(raw)));
        } catch (e) {
            try {
                return Math.min(0.999, Math.max(0.0, LevelManager.getXpProgress(player)));
            } catch (e2) {}
        }
    }
    let pData = player.persistentData;
    let curXp = pData ? (pData.getInt('simplestats_xp') || 0) : 0;
    let currentLvl = getPlayerLevel(player);
    let reqXp = getRequiredXpForLevel(currentLvl + 1);
    return Math.min(0.999, Math.max(0.0, curXp / Math.max(1, reqXp)));
}

// Helper: Synchronously add XP to player via direct Java API
function addPlayerXp(player, amount) {
    if (!player || amount <= 0) return;
    if (LevelManager) {
        try {
            let raw = getRawPlayer(player);
            LevelManager.addXP(raw, amount);
            return;
        } catch (e) {
            try {
                LevelManager.addXP(player, amount);
                return;
            } catch (e2) {
                console.error('[RPG Leveling] Error calling LevelManager.addXP:', e2);
            }
        }
    }
    player.server.runCommandSilent(`simplestats xp add ${player.username} ${amount}`);
}

// Synchronizes the HUD XP bar with SimpleStats progression
function syncVanillaXpBar(player, currentLvl) {
    try {
        let progress = getPlayerXpProgress(player);

        // Ensure experience level number reflects RPG Hero Level
        if (player.experienceLevel !== currentLvl) {
            try {
                player.setExperienceLevels(currentLvl);
            } catch (e1) {
                player.server.runCommandSilent(`experience set ${player.username} ${currentLvl} levels`);
            }
        }

        // Set visual progress on XP bar
        player.experienceProgress = progress;

        // Keep internal XP points in sync
        try {
            let pts = Math.round(progress * Math.max(1, player.getXpNeededForNextLevel()));
            player.setExperiencePoints(pts);
        } catch (e2) {}

        // Anchor synced total XP to prevent self-triggering loops
        if (player.persistentData) {
            player.persistentData.putInt('elyrium_synced_total_xp', player.totalExperience);
        }
    } catch (e) {}
}

// Strict Zero Start & First Login Initialization
function handleStrictZeroStart(player, forceReset) {
    if (!player || !player.isAlive()) return;
    let pData = player.persistentData;
    if (!pData) return;
    let server = player.server;
    if (!server) return;

    if (forceReset || !pData.getBoolean('elyrium_zero_start_initialized')) {
        pData.putBoolean('elyrium_zero_start_initialized', true);

        let raw = getRawPlayer(player);

        // 1. Strict Level 1, 0 XP, and 0 Stat Points in SimpleStats
        if (LevelManager) {
            try {
                LevelManager.setXP(raw, 0);
                let currentPts = LevelManager.getPoints(raw);
                if (currentPts > 0) {
                    LevelManager.handlePointsUpdate(raw, -currentPts);
                }
            } catch (e) {
                console.error('[RPG Leveling] Zero start SimpleStats init error:', e);
            }
        }
        server.runCommandSilent(`simplestats points set ${player.username} 0`);
        server.runCommandSilent(`simplestats xp set ${player.username} 0`);
        server.runCommandSilent(`simplestats level set ${player.username} 1`);
        pData.putInt('simplestats_level', 1);
        pData.putInt('simplestats_xp', 0);
        pData.putInt('simplestats_points', 0);

        // 2. Strict 0 talent points in Puffish Skills celestial tree
        server.runCommandSilent(`puffish_skills points set ${player.username} elyrium:celestial_tree 0`);

        // 3. Strict Level 1 and 0% bar in Vanilla HUD
        try {
            player.setExperienceLevels(1);
        } catch (e) {
            server.runCommandSilent(`experience set ${player.username} 1 levels`);
        }
        player.experienceProgress = 0.0;
        try {
            player.setExperiencePoints(0);
        } catch (e) {}

        // Anchor tracking tags
        pData.putInt('elyrium_tracked_level', 1);
        pData.putInt('elyrium_synced_total_xp', player.totalExperience);

        // Sync visual bar
        syncVanillaXpBar(player, 1);
        return;
    }

    // Existing player: ensure tracking tag is initialized
    let currentLvl = getPlayerLevel(player);
    let trackedLvl = pData.getInt('elyrium_tracked_level');
    if (!trackedLvl || trackedLvl < 1) {
        pData.putInt('elyrium_tracked_level', currentLvl);
    }
    pData.putInt('elyrium_synced_total_xp', player.totalExperience);
    syncVanillaXpBar(player, currentLvl);
}

// Level Check, XP Ingestion and Level Up Logic
function checkRpgLevelUp(player) {
    if (!player || !player.isAlive()) return;

    let pData = player.persistentData;
    if (!pData) return;

    let server = player.server;
    if (!server) return;

    // Strict zero start check if not initialized yet
    if (!pData.getBoolean('elyrium_zero_start_initialized')) {
        handleStrictZeroStart(player, false);
        return;
    }

    // 1. INGEST VANILLA XP ORBS (Mining, Smelting, Breeding, Fishing, Quests)
    let lastTotalXp = pData.getInt('elyrium_synced_total_xp');
    let currentTotalXp = player.totalExperience;
    if (typeof lastTotalXp === 'number' && lastTotalXp > 0 && currentTotalXp > lastTotalXp) {
        let gainedXp = currentTotalXp - lastTotalXp;
        // Directly add XP into SimpleStats progression via LevelManager Java API
        addPlayerXp(player, gainedXp);
    }

    // 2. CHECK LEVEL PROGRESSION (Direct JVM call, zero NBT lag)
    let currentLvl = getPlayerLevel(player);
    let trackedLvl = pData.getInt('elyrium_tracked_level');

    if (!trackedLvl || trackedLvl < 1) {
        pData.putInt('elyrium_tracked_level', currentLvl);
        trackedLvl = currentLvl;
    }

    // LEVEL UP DETECTED (Level 2+)
    if (currentLvl > trackedLvl) {
        let delta = currentLvl - trackedLvl;
        pData.putInt('elyrium_tracked_level', currentLvl);

        // 1. Grant Puffish Skills talent points (1 point per level gained)
        for (let i = 0; i < delta; i++) {
            server.runCommandSilent(`puffish_skills points add ${player.username} elyrium:celestial_tree 1`);
        }

        // 2. Audio-Visual RPG Fanfare
        server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete player ${player.username} ~ ~ ~ 1.0 1.0`);
        server.runCommandSilent(`title ${player.username} times 10 70 20`);
        server.runCommandSilent(`title ${player.username} subtitle {"text":"★ Достигнут ${currentLvl} уровень Героя! ★","color":"yellow"}`);
        server.runCommandSilent(`title ${player.username} title {"text":"★ ПОВЫШЕНИЕ УРОВНЯ! ★","color":"gold","bold":true}`);

        // Golden and azure celebration particles
        let px = player.x;
        let py = player.y + 1.0;
        let pz = player.z;
        server.runCommandSilent(`particle minecraft:totem_of_undying ${px} ${py} ${pz} 0.8 1.0 0.8 0.15 60`);
        server.runCommandSilent(`particle minecraft:electric_spark ${px} ${py} ${pz} 0.6 0.8 0.6 0.2 40`);

        // Celebratory Chat Announcement
        player.tell(Text.of('§6================================================'));
        player.tell(Text.of('§6★ ТРИУМФ ВОЗВЫШЕНИЯ! ★').bold());
        player.tell(Text.of(`§eПоздравляем! Вы достигли §6${currentLvl}§e уровня Героя!`));
        player.tell(Text.of(`§a✔ Награда: §f+${delta} Очко Характеристик [C] и +${delta} Очко Талантов [P]`));
        player.tell(Text.of('§b✔ Второе Дыхание: §fЗдоровье, сытость и запас маны восполнены на 100%!'));
        player.tell(Text.of('§6================================================'));

        // 3. Second Wind (Второе Дыхание): Replenish HP, Food, and Mana
        player.setHealth(player.maxHealth);
        player.setFoodLevel(20);
        player.setSaturation(20.0);

        // Replenish Mana via Iron's Spells command
        server.runCommandSilent(`mana set ${player.username} 100000`);
    } else if (currentLvl < trackedLvl) {
        // If an admin or respec lowered the level
        pData.putInt('elyrium_tracked_level', currentLvl);
    }

    // Continuously synchronize vanilla XP bar to match Hero Level
    syncVanillaXpBar(player, currentLvl);

    // Synchronize Intellect scaling attributes (max mana, mana regen, cooldown reduction, cast reduction)
    syncIntellectAttributes(player);
}

// ------------------------------------------------------------------------------
// 🔮 SIMPLESTATS INTELLECT SCALING (VARIANT B - NO OVER-DAMAGE)
// ------------------------------------------------------------------------------
function syncIntellectAttributes(player) {
    if (!player || !player.isAlive()) return;
    let s = player.server;
    if (!s) return;

    let manaLvl = 0;
    try {
        let PerkManager = Java.loadClass('network.roto.simplestats.leveling.PerkManager');
        if (PerkManager) {
            let raw = player.minecraftPlayer || player;
            let lvl = PerkManager.getPerkLevel(raw, 'mana');
            if (lvl !== null && lvl !== undefined && !isNaN(lvl)) manaLvl = Number(lvl);
        }
    } catch (e) {}

    if (manaLvl === 0 && player.persistentData) {
        let perks = player.persistentData.getCompound('simplestats_perks');
        if (perks && perks.contains('mana')) {
            manaLvl = perks.getInt('mana') || 0;
        }
    }

    let pData = player.persistentData;
    let lastSynced = pData ? pData.getInt('elyrium_synced_intellect') : -1;
    if (manaLvl === lastSynced) return;
    if (pData) pData.putInt('elyrium_synced_intellect', manaLvl);

    let u = player.username;

    // 1. Max Mana: 100 + level * 4.0
    let totalMaxMana = 100.0 + (manaLvl * 4.0);
    s.runCommandSilent(`attribute ${u} irons_spellbooks:max_mana base set ${totalMaxMana}`);

    // 2. Mana Regen: +0.0025 per level (+25% at 100)
    let bonusRegen = (manaLvl * 0.0025).toFixed(4);
    s.runCommandSilent(`attribute ${u} irons_spellbooks:mana_regen modifier remove elyrium:intellect_mana_regen`);
    if (manaLvl > 0) {
        s.runCommandSilent(`attribute ${u} irons_spellbooks:mana_regen modifier add elyrium:intellect_mana_regen ${bonusRegen} add_value`);
    }

    // 3. Cooldown Reduction: +0.0030 per level (+30% at 100)
    let bonusCdr = (manaLvl * 0.0030).toFixed(4);
    s.runCommandSilent(`attribute ${u} irons_spellbooks:cooldown_reduction modifier remove elyrium:intellect_cdr`);
    if (manaLvl > 0) {
        s.runCommandSilent(`attribute ${u} irons_spellbooks:cooldown_reduction modifier add elyrium:intellect_cdr ${bonusCdr} add_value`);
    }

    // 4. Cast Time Reduction: +0.0020 per level (+20% at 100)
    let bonusCast = (manaLvl * 0.0020).toFixed(4);
    s.runCommandSilent(`attribute ${u} irons_spellbooks:cast_time_reduction modifier remove elyrium:intellect_cast_reduction`);
    if (manaLvl > 0) {
        s.runCommandSilent(`attribute ${u} irons_spellbooks:cast_time_reduction modifier add elyrium:intellect_cast_reduction ${bonusCast} add_value`);
    }
}

// Tick Hook: Check level every 5 ticks (0.25s) for snappy responsiveness
PlayerEvents.tick(event => {
    let player = event.player;
    if (!player) return;
    let tick = (typeof player.tickCount === 'number') ? player.tickCount : (player.age || 0);
    if (tick % 5 !== 0) return;
    checkRpgLevelUp(player);
});

// Instant level check on mob death
EntityEvents.death(event => {
    let killer = event.source ? (event.source.player || event.source.actual) : null;
    if (killer && killer.isPlayer()) {
        checkRpgLevelUp(killer);
    }
});

// Login Hook: Strict Zero Start & initial sync upon joining
PlayerEvents.loggedIn(event => {
    handleStrictZeroStart(event.player, false);
});

// Respawn Hook: Restore level display and status
PlayerEvents.respawned(event => {
    let p = event.player;
    if (p && p.persistentData) {
        p.persistentData.putInt('elyrium_synced_total_xp', p.totalExperience);
    }
    checkRpgLevelUp(p);
});

// Admin / Test Command for Leveling Reset & Status
ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event;
    event.register(
        Commands.literal('elyrium_leveling')
            .then(Commands.literal('reset')
                .requires(src => src.hasPermission(2))
                .then(Commands.argument('target', Arguments.PLAYER.create(event))
                    .executes(ctx => {
                        let targetPlayer = Arguments.PLAYER.getResult(ctx, 'target');
                        if (targetPlayer) {
                            targetPlayer.persistentData.remove('elyrium_zero_start_initialized');
                            handleStrictZeroStart(targetPlayer, true);
                            ctx.source.sendSuccess(() => Text.of(`§a[Elyrium Leveling] Сброс выполнен для ${targetPlayer.username}: Уровень 1, 0 очков статов, 0 очков талантов.`), true);
                        }
                        return 1;
                    })
                )
            )
            .then(Commands.literal('sync')
                .executes(ctx => {
                    let player = ctx.source.player;
                    if (player) {
                        let lvl = getPlayerLevel(player);
                        syncVanillaXpBar(player, lvl);
                        ctx.source.sendSuccess(() => Text.of(`§a[Elyrium Leveling] HUD синхронизирован: Уровень ${lvl}.`), false);
                    }
                    return 1;
                })
            )
    );
});

// ------------------------------------------------------------------------------
// 🚫 DE-VANILLAFICATION & PROTECTION OF LEVEL PROGRESSION
// ------------------------------------------------------------------------------

// 1. Block Vanilla Enchanting Table Interaction
BlockEvents.rightClicked('minecraft:enchanting_table', event => {
    event.cancel();
    let p = event.player;
    p.tell(Text.of('§c[Древний Запрет] Стол зачарований уничтожен древней магией Элириума!'));
    p.tell(Text.of('§7Используйте §cАдскую Наковальню§7, кузнечные камни и Трактаты Боевых Искусств.'));
    p.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${p.username} ~ ~ ~ 0.6 0.5`);
});

// 2. Remove Enchanting Table Crafting Recipe
ServerEvents.recipes(event => {
    event.remove({ output: 'minecraft:enchanting_table' });
});

// 3. Anvil Level Protection: Prevent level loss when using vanilla anvils
PlayerEvents.inventoryChanged(event => {
    let player = event.player;
    if (!player || !player.isAlive()) return;

    let menu = player.containerMenu;
    if (!menu) return;

    let menuClass = String(menu);
    if (!menuClass.includes('Anvil')) return;

    let currentLvl = getPlayerLevel(player);
    if (currentLvl > 0 && player.experienceLevel < currentLvl) {
        try {
            player.setExperienceLevels(currentLvl);
        } catch (e1) {
            player.server.runCommandSilent(`experience set ${player.username} ${currentLvl} levels`);
        }
    }
});
