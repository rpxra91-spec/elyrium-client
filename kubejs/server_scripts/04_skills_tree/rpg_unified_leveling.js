// ==============================================================================
// 🏛️ ELYRIUM RPG: UNIFIED RPG LEVELING & EXPERIENCE ENGINE (1–100 LEVELS)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script (v1.1)
// ==============================================================================
// - Fuses SimpleStats (1-100) and Puffish Skills ('elyrium:celestial_tree').
// - Awards 1 Skill Point in Puffish Skills upon each SimpleStats Level Up.
// - Full RPG Fanfare: challenge sound, celebratory screen title, chat alert,
//   and golden/azure particles.
// - "Second Wind" (Второе Дыхание): 100% Health, Food, and Mana replenishment.
// - Harmonizes Vanilla XP bar with RPG Hero Level (1-100) and XP progress.
// - Abolishes vanilla XP drain: disables Enchanting Table and restores level on anvil.
// ==============================================================================

// Helper: Calculate XP required for next level in SimpleStats
function getRequiredXpForLevel(lvl) {
    let l = Math.max(1, lvl);
    return Math.round(50 * Math.pow(1.08, l - 1));
}

// Level Check and Level Up Logic
function checkRpgLevelUp(player) {
    if (!player || !player.isAlive()) return;

    let pData = player.persistentData;
    if (!pData) return;

    // Get true SimpleStats level (defaults to 1 if not yet initialized)
    let currentLvl = pData.getInt('simplestats_level');
    if (!currentLvl || currentLvl < 1) {
        currentLvl = 1;
    }

    let trackedLvl = pData.getInt('elyrium_tracked_level');

    // First time tracking on join / migration:
    // If existing player joins at level > 1, start tracking from 1 so they catch up talent points
    if (!trackedLvl || trackedLvl < 1) {
        if (currentLvl > 1) {
            pData.putInt('elyrium_tracked_level', 1);
            trackedLvl = 1;
        } else {
            pData.putInt('elyrium_tracked_level', 1);
            syncVanillaXpBar(player, currentLvl);
            return;
        }
    }

    // LEVEL UP DETECTED
    if (currentLvl > trackedLvl) {
        let delta = currentLvl - trackedLvl;
        pData.putInt('elyrium_tracked_level', currentLvl);

        let server = player.server;
        if (!server) return;

        // 1. Grant Puffish Skills talent points (1 point per level gained)
        server.runCommandSilent(`puffish_skills points add ${player.username} elyrium:celestial_tree ${delta}`);

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
}

// Synchronizes the HUD XP bar with SimpleStats progression
function syncVanillaXpBar(player, currentLvl) {
    try {
        let pData = player.persistentData;
        let curXp = pData ? (pData.getInt('simplestats_xp') || 0) : 0;
        let reqXp = getRequiredXpForLevel(currentLvl);
        let progress = Math.min(0.99, Math.max(0.0, curXp / Math.max(1, reqXp)));

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

        // Keep internal XP points in sync and force client network packet update
        try {
            let pts = Math.round(progress * Math.max(1, player.getXpNeededForNextLevel()));
            player.setExperiencePoints(pts);
        } catch (e2) {}
    } catch (e) {}
}

// Tick Hook: Check level every 10 ticks (0.5s)
PlayerEvents.tick(event => {
    let player = event.player;
    if (!player) return;
    let tick = (typeof player.tickCount === 'number') ? player.tickCount : (player.age || 0);
    if (tick % 10 !== 0) return;
    checkRpgLevelUp(player);
});

// Login Hook: Initial sync upon joining
PlayerEvents.loggedIn(event => {
    checkRpgLevelUp(event.player);
});

// Respawn Hook: Restore level display and status
PlayerEvents.respawned(event => {
    checkRpgLevelUp(event.player);
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

    let pData = player.persistentData;
    let currentLvl = pData ? pData.getInt('simplestats_level') : 0;
    if (currentLvl > 0 && player.experienceLevel < currentLvl) {
        try {
            player.setExperienceLevels(currentLvl);
        } catch (e1) {
            player.server.runCommandSilent(`experience set ${player.username} ${currentLvl} levels`);
        }
    }
});
