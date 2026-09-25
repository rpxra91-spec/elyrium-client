// ==============================================================================
// SKD RPG: ELYRIUM — ANTI-AFK FARM & DAMAGE SHARE SYSTEM
// Phase 6: Subphase 6.1 — Anti-AFK Farming, Cramming & Loot Fair Distribution
// ==============================================================================

ServerEvents.loaded(event => {
    // 1. Enforce strict maxEntityCramming = 8 to prevent cramming mob pits
    event.server.runCommandSilent('gamerule maxEntityCramming 8');
    console.log('[Anti-AFK System] gamerule maxEntityCramming set to 8');
});

// 2. Track player damage dealt to mobs
EntityEvents.beforeHurt(event => {
    let target = event.entity;
    if (!target || !target.isMonster()) return;

    let source = event.source;
    if (!source) return;
    let attacker = source.actual;

    // Only track direct player or player projectile damage
    if (!attacker || !attacker.isPlayer()) return;

    let current = target.persistentData.getDouble('skd_player_dmg') || 0;
    target.persistentData.putDouble('skd_player_dmg', current + (Number(event.damage) || 0));
});

// 3. Fair Loot Drop Filter
EntityEvents.drops(event => {
    let entity = event.entity;
    if (!entity || !entity.isMonster()) return;

    let maxHp = entity.maxHealth || 20;
    let playerDmg = entity.persistentData.getDouble('skd_player_dmg') || 0;

    // If mob was killed primarily by gravity/lava/cramming with less than 40% player contribution:
    if ((playerDmg / maxHp) < 0.40) {
        if (event.drops) {
            event.drops.clear();
        }
    }
});
