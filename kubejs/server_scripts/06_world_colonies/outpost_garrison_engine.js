// ==============================================================================
// 🛡️ ELYRIUM: OUTPOST GARRISON & NPC PEACE PROTECTION (SUBPHASE 7.3)
// ==============================================================================
// 1. Player Attack Immunity: Players CANNOT hurt friendly NPCs, merchants, or guards.
// 2. Essential Merchant Status: Key merchants cannot be permanently killed by mobs;
//    upon taking fatal damage, they enter a 15s knockdown recovery state.
// 3. Guard Auto-Respawn: Fallen outpost guards respawn at their posts after 3 minutes.
// 4. Mob Incursion Support: Mobs cannot naturally SPAWN inside safe perimeters,
//    but outside wandering mobs CAN advance into courtyards for guards to engage.
// ==============================================================================

const PENDING_RESPAWNS = [];

function isFriendlyNPC(entity) {
    if (!entity || !entity.isLiving() || entity.isPlayer()) return false;

    let type = entity.type.toString().toLowerCase();
    
    // MineColonies citizens & guards
    if (type.includes('minecolonies:citizen') || type.includes('minecolonies')) return true;

    // Standard friendly humanoids & villagers
    if (type.includes('villager') || type.includes('wandering_trader') || type.includes('iron_golem')) return true;

    // Custom Elyrium tags or names
    if (entity.tags && (entity.tags.contains('elyrium:guard') || 
                        entity.tags.contains('elyrium:outpost_guard') || 
                        entity.tags.contains('elyrium:merchant') || 
                        entity.tags.contains('elyrium:innkeeper') || 
                        entity.tags.contains('elyrium:friendly_npc'))) return true;

    let customName = entity.customName ? entity.customName.string.toLowerCase() : '';
    if (customName.includes('страж') || customName.includes('дозор') || 
        customName.includes('трактир') || customName.includes('кузнец') ||
        customName.includes('торговец') || customName.includes('guard') ||
        customName.includes('трактирщик') || customName.includes('корчмарь') ||
        customName.includes('ратник') || customName.includes('гарнизон') ||
        customName.includes('innkeeper')) return true;

    return false;
}

function isEssentialMerchant(entity) {
    if (!entity || !entity.isLiving()) return false;
    let type = entity.type.toString().toLowerCase();
    let name = entity.customName ? entity.customName.string.toLowerCase() : '';

    if (type.includes('wandering_trader') || type.includes('villager')) return true;
    if (name.includes('трактир') || name.includes('кузнец') || 
        name.includes('торговец') || name.includes('алхимик') || 
        name.includes('merchant') || name.includes('innkeeper') ||
        name.includes('трактирщик') || name.includes('корчмарь')) return true;

    if (entity.tags && (entity.tags.contains('elyrium:merchant') || entity.tags.contains('elyrium:innkeeper'))) return true;
    return false;
}

// ------------------------------------------------------------------------------
// 1. ABSOLUTE PROTECTION: PLAYERS CANNOT DAMAGE FRIENDLY NPCS
// ------------------------------------------------------------------------------
EntityEvents.beforeHurt(event => {
    let target = event.entity;
    if (!target || !isFriendlyNPC(target)) return;

    let source = event.source;
    if (!source) return;

    let attacker = source.actual || source.player;
    if (attacker && attacker.isPlayer()) {
        event.cancel();
        attacker.displayClientMessage(Text.of('§c🛡 В мирной зоне запрещено нападать на жителей и стражу!'), true);
        attacker.server.runCommandSilent(`playsound minecraft:block.shield.block player ${attacker.username} ~ ~ ~ 0.8 1.2`);
        return;
    }

    // --------------------------------------------------------------------------
    // 2. ESSENTIAL STATUS: MERCHANTS RECOVER FROM FATAL MONSTER DAMAGE
    // --------------------------------------------------------------------------
    if (isEssentialMerchant(target)) {
        let incomingDamage = event.damage;
        let currentHealth = target.health;

        if (incomingDamage >= currentHealth) {
            // Prevent fatal death
            event.cancel();
            target.health = target.maxHealth * 0.5; // Restore 50% HP

            // Apply knockdown effects (Slowness, Resistance, invulnerability window)
            target.potionEffects.add('minecraft:slowness', 300, 4, false, false);
            target.potionEffects.add('minecraft:resistance', 300, 4, false, false);
            target.potionEffects.add('minecraft:regeneration', 200, 1, false, false);

            let server = target.server;
            if (server) {
                server.runCommandSilent(`playsound minecraft:entity.player.levelup block ${target.x} ${target.y} ${target.z} 0.8 0.8`);
                server.runCommandSilent(`particle minecraft:totem_of_undying ${target.x} ${target.y + 1} ${target.z} 0.5 0.5 0.5 0.1 20`);
                
                // Alert nearby players
                let overworld = server.overworld();
                if (overworld) {
                    overworld.players.forEach(p => {
                        let dx = p.x - target.x;
                        let dz = p.z - target.z;
                        if (dx * dx + dz * dz <= 32 * 32) {
                            p.displayClientMessage(Text.of('§e⚠ [Торговец оглушен] Торговец перевязывает раны под защитой стражи!'), true);
                        }
                    });
                }
            }
        }
    }
});

// ------------------------------------------------------------------------------
// 3. GUARD & INNKEEPER RESPAWN REGISTRATION ON DEATH
// ------------------------------------------------------------------------------
EntityEvents.death(event => {
    let victim = event.entity;
    if (!victim || victim.isPlayer()) return;

    let isGuard = false;
    let isInnkeeper = false;
    let type = victim.type.toString().toLowerCase();
    let name = victim.customName ? victim.customName.string.toLowerCase() : '';

    if (victim.tags && (victim.tags.contains('elyrium:guard') || victim.tags.contains('elyrium:outpost_guard'))) isGuard = true;
    if (name.includes('страж') || name.includes('дозор') || name.includes('guard') || name.includes('ратник') || name.includes('гарнизон')) isGuard = true;
    if (type.includes('iron_golem')) isGuard = true;

    if (victim.tags && victim.tags.contains('elyrium:innkeeper')) isInnkeeper = true;
    if (name.includes('трактирщик') || name.includes('корчмарь') || name.includes('innkeeper')) isInnkeeper = true;

    if (isGuard || isInnkeeper) {
        let server = victim.server;
        if (!server) return;

        let cooldownSeconds = isInnkeeper ? 60 : 180;
        let respawnTick = server.tickCount + (20 * cooldownSeconds);
        let defaultName = isInnkeeper ? 'Трактирщик' : 'Страж Дозора';
        let defaultTag = isInnkeeper ? 'elyrium:innkeeper' : 'elyrium:guard';

        let respawnData = {
            entityType: victim.type.toString(),
            x: Math.floor(victim.x) + 0.5,
            y: Math.floor(victim.y),
            z: Math.floor(victim.z) + 0.5,
            yaw: victim.yaw || 0,
            customName: victim.customName ? victim.customName.string : defaultName,
            tags: victim.tags ? Array.from(victim.tags) : [defaultTag],
            respawnTick: respawnTick,
            dimension: victim.level.dimension.toString()
        };

        PENDING_RESPAWNS.push(respawnData);
    }
});

// ------------------------------------------------------------------------------
// 4. TICK CYCLE: PROCESS GUARD RESPAWNS
// ------------------------------------------------------------------------------
ServerEvents.tick(event => {
    let server = event.server;
    if (server.tickCount % 40 !== 0) return; // Check every 2 seconds

    if (PENDING_RESPAWNS.length === 0) return;

    let currentTick = server.tickCount;
    for (let i = PENDING_RESPAWNS.length - 1; i >= 0; i--) {
        let job = PENDING_RESPAWNS[i];
        if (currentTick >= job.respawnTick) {
            PENDING_RESPAWNS.splice(i, 1);

            let level = server.getLevel(job.dimension) || server.overworld();
            if (!level) continue;

            // Summon replacement guard
            try {
                let spawnedEntity = level.createEntity(job.entityType);
                if (spawnedEntity) {
                    spawnedEntity.setPos(job.x, job.y, job.z);
                    spawnedEntity.setYRot(job.yaw);
                    spawnedEntity.setCustomName(Text.of(job.customName));
                    spawnedEntity.setCustomNameVisible(true);

                    if (job.tags && job.tags.length > 0) {
                        job.tags.forEach(t => spawnedEntity.addTag(t));
                    }

                    level.spawnEntity(spawnedEntity);

                    level.server.runCommandSilent(`playsound minecraft:block.bell.use block ${job.x} ${job.y} ${job.z} 0.8 1.2`);
                    level.server.runCommandSilent(`particle minecraft:happy_villager ${job.x} ${job.y + 1} ${job.z} 0.5 0.5 0.5 0.05 15`);
                }
            } catch (e) {
                // Fallback via command if entity creation factory differs
                server.runCommandSilent(`execute in ${job.dimension} run summon ${job.entityType} ${job.x} ${job.y} ${job.z} {CustomName:'{"text":"${job.customName}"}',Tags:["elyrium:guard"]}`);
            }
        }
    }
});
