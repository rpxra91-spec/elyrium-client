// ==============================================================================
// 🛡️ ELYRIUM RPG: THREAT & AGGRO ENGINE (WoW-Style Threat Table & Tank Taunt)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 1. Threat Generation:
//    - Normal DPS Player: 1.0x Threat per damage dealt.
//    - Tank (Shield equipped or Heavy Armor): 3.5x - 4.0x Threat per damage dealt.
//    - Shield Block: Generates bonus threat (+40) when blocking enemy attacks.
// 2. Target Switching:
//    - In Melee (<= 5 blocks): switches target when another player exceeds 110% threat.
//    - At Range (> 5 blocks): switches target when another player exceeds 130% threat.
// 3. Active Taunt (Боевой Клич):
//    - Re-targets all hostile entities in a 14-block radius to the Tank for 4.0 seconds.
//    - Equalizes Tank's threat to 125% of highest threat in the mob's table.
// ==============================================================================

const ELYRIUM_THREAT_TABLE = new Map();

function isPlayerTank(player) {
    if (!player) return false;
    let mainItem = String(player.mainHandItem.id).toLowerCase();
    let offItem = String(player.offHandItem.id).toLowerCase();
    if (mainItem.includes('shield') || offItem.includes('shield')) {
        return true;
    }
    try {
        let armor = player.armorValue || 0;
        let toughness = player.getAttributeValue('minecraft:generic.armor_toughness') || 0;
        if (armor >= 16 || toughness >= 4) {
            return true;
        }
    } catch (e) {}
    return false;
}

function getPlayerThreatMultiplier(player) {
    if (isPlayerTank(player)) {
        return 3.5;
    }
    return 1.0;
}

function addMobThreat(mob, player, rawDamage) {
    if (!mob || !player || mob.isPlayer()) return;
    if (typeof mob.isMonster === 'function' && !mob.isMonster()) {
        let isHostile = mob.target != null || (mob.persistentData && mob.persistentData.getBoolean('is_boss'));
        if (!isHostile) return;
    }

    let mobId = String(mob.uuid);
    let pId = String(player.uuid);
    let now = Date.now();

    if (!ELYRIUM_THREAT_TABLE.has(mobId)) {
        ELYRIUM_THREAT_TABLE.set(mobId, new Map());
    }
    let table = ELYRIUM_THREAT_TABLE.get(mobId);

    let mult = getPlayerThreatMultiplier(player);
    let threatGain = Math.max(1.0, rawDamage * 10.0 * mult);
    let currentPThreat = (table.get(pId) || 0) + threatGain;
    table.set(pId, currentPThreat);

    // Check taunt lock
    let tauntUntil = mob.persistentData.getLong('elyrium_taunted_until') || 0;
    if (now < tauntUntil) {
        let tauntedBy = mob.persistentData.getString('elyrium_taunted_by');
        if (tauntedBy && tauntedBy !== pId) {
            return; // Mob is locked by taunt
        }
    }

    // Determine target switch
    let currentTarget = mob.target;
    if (!currentTarget || !currentTarget.isAlive() || currentTarget.uuid === player.uuid) {
        if (!currentTarget || currentTarget.uuid !== player.uuid) {
            try { mob.setTarget(player); } catch (e) {}
        }
        return;
    }

    let targetId = String(currentTarget.uuid);
    let currentTargetThreat = table.get(targetId) || 1.0;

    let distSq = mob.distanceToEntitySqr(player);
    let threshold = distSq <= 25.0 ? 1.10 : 1.30;

    if (currentPThreat >= currentTargetThreat * threshold) {
        try {
            mob.setTarget(player);
        } catch (e) {}
    }
}

function executeTankTaunt(player) {
    if (!player || !player.isAlive()) return;
    let now = Date.now();
    let pData = player.persistentData;
    let lastTaunt = pData.getLong('elyrium_last_taunt_time') || 0;
    let cdMs = 20000;

    if (now - lastTaunt < cdMs) {
        let remSec = Math.ceil((cdMs - (now - lastTaunt)) / 1000);
        player.displayClientMessage(Component.literal(`§c⏳ «Боевой Клич» перезаряжается: ${remSec}с`), true);
        return;
    }

    // Check stamina (25 pts)
    if (typeof consumePlayerStamina === 'function') {
        if (!consumePlayerStamina(player, 25)) {
            player.displayClientMessage(Component.literal('§c⚡ Недостаточно выносливости для Боевого Клича (нужно 25)!'), true);
            player.playNotifySound('minecraft:entity.player.breath', 'players', 0.8, 0.7);
            return;
        }
    }

    pData.putLong('elyrium_last_taunt_time', now);
    let pId = String(player.uuid);
    let pPos = player.blockPosition();
    let level = player.level;

    let box = AABB.of(
        pPos.x - 14, pPos.y - 6, pPos.z - 14,
        pPos.x + 14, pPos.y + 8, pPos.z + 14
    );

    let enemies = level.getEntitiesWithin(box);
    let tauntedCount = 0;

    for (let i = 0; i < enemies.size(); i++) {
        let mob = enemies.get(i);
        if (!mob || !mob.isAlive() || mob.isPlayer()) continue;
        if (typeof mob.setTarget !== 'function') continue;

        let mobId = String(mob.uuid);
        if (!ELYRIUM_THREAT_TABLE.has(mobId)) {
            ELYRIUM_THREAT_TABLE.set(mobId, new Map());
        }
        let table = ELYRIUM_THREAT_TABLE.get(mobId);

        let maxOtherThreat = 0;
        table.forEach((threatVal, otherId) => {
            if (otherId !== pId && threatVal > maxOtherThreat) {
                maxOtherThreat = threatVal;
            }
        });

        let newThreat = Math.max(maxOtherThreat * 1.25, 200.0);
        table.set(pId, newThreat);

        mob.persistentData.putLong('elyrium_taunted_until', now + 4000);
        mob.persistentData.putString('elyrium_taunted_by', pId);

        try {
            mob.setTarget(player);
        } catch (e) {}

        try {
            level.sendParticles('minecraft:angry_villager', mob.x, mob.y + mob.eyeHeight + 0.3, mob.z, 3, 0.2, 0.2, 0.2, 0.0);
        } catch (eP) {}

        tauntedCount++;
    }

    // Sound and visual feedback
    player.playNotifySound('minecraft:item.horn.sound.0', 'players', 1.0, 0.85);
    try {
        level.sendParticles('minecraft:flame', player.x, player.y + 1.0, player.z, 25, 1.2, 0.5, 1.2, 0.05);
    } catch (eP) {}

    player.displayClientMessage(Component.literal(`§6⚔ [БОЕВОЙ КЛИЧ] §fСпровоцировано врагов: §e${tauntedCount} §f(Фокус на 4.0с)`), true);
}

// ------------------------------------------------------------------------------
// EVENT HOOKS
// ------------------------------------------------------------------------------

EntityEvents.hurt(event => {
    let damage = event.damage;
    let victim = event.entity;
    let source = event.source;
    if (!victim || !source) return;

    let attacker = source.player || source.actual;
    if (attacker && attacker.isPlayer()) {
        addMobThreat(victim, attacker, damage);
    }

    // Shield block threat bonus
    if (victim.isPlayer() && victim.isBlocking()) {
        let incomingAttacker = source.actual;
        if (incomingAttacker && !incomingAttacker.isPlayer()) {
            addMobThreat(incomingAttacker, victim, 8.0); // +80 threat on block
        }
    }
});

ItemEvents.rightClicked(event => {
    let item = event.item;
    let player = event.player;
    if (!item || !player) return;

    if (item.id === 'kubejs:war_horn_taunt') {
        executeTankTaunt(player);
        event.cancel();
    }
});

EntityEvents.death(event => {
    let entity = event.entity;
    if (entity) {
        ELYRIUM_THREAT_TABLE.delete(String(entity.uuid));
    }
});

ServerEvents.commandRegistry(event => {
    let { commands: Commands, arguments: Arguments } = event;
    event.register(
        Commands.literal('taunt')
            .requires(s => s.hasPermission(0))
            .executes(ctx => {
                let player = ctx.source.player;
                if (player) {
                    executeTankTaunt(player);
                }
                return 1;
            })
    );
});
