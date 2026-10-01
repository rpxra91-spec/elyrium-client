// ==============================================================================
// ⚔️ ELYRIUM RPG: SOULS DODGE & I-FRAME COMBAT ENGINE (v1.0)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 1. Network Packet Handler: 'elyrium:player_dodge'
// 2. Dynamic Armor Weight Scale (0-12 points across 4 armor slots):
//    - 0-4 pts: Light Roll (18 stamina, 0.85 horizontal impulse, 1.25x anim speed)
//    - 5-8 pts: Medium Roll (25 stamina, 0.70 horizontal impulse, 1.05x anim speed)
//    - 9-12 pts: Heavy / Fat Roll (35 stamina, 0.48 horizontal impulse, 0.80x anim speed + heavy landing)
// 3. Precise I-Frames: 7 ticks (0.35s) Invulnerability via 'elyrium_dodge_iframe_until'
// 4. Full Damage Nullification in EntityEvents.beforeHurt during active I-Frames
// 5. 3D Skeletal Animation Broadcast: 'elyrium:play_player_art_anim' ('spell_engine:dodge')
// ==============================================================================

const DODGE_CONFIG = {
    iframeTicks: 8, // 8 ticks = 0.40s invulnerability window for light
    cooldownTicks: 12, // 12 ticks = 0.60s anti-spam delay between dodges
    tiers: {
        light: {
            maxWeight: 4,
            stamina: 14,
            horizSpeed: 0.58,
            vertSpeed: 0.10,
            animSpeed: 1.25,
            sound: 'minecraft:entity.player.attack.sweep',
            soundPitch: 1.25
        },
        medium: {
            maxWeight: 8,
            stamina: 24,
            horizSpeed: 0.46,
            vertSpeed: 0.08,
            animSpeed: 1.05,
            sound: 'minecraft:entity.player.attack.sweep',
            soundPitch: 1.0
        },
        heavy: {
            maxWeight: 12,
            stamina: 30,
            horizSpeed: 0.65,
            vertSpeed: 0.05,
            animSpeed: 1.00,
            sound: 'minecraft:entity.iron_golem.step',
            soundPitch: 0.8
        }
    }
};

/**
 * Calculates armor weight based on worn armor pieces (0 to 12 total points).
 * Light pieces (cloth/leather/robes/elytra) = 1 pt
 * Medium pieces (iron/gold/copper/chain/bronze) = 2 pts
 * Heavy pieces (diamond/netherite/heavy plates/boss sets) = 3 pts
 */
function calculatePlayerArmorWeight(player) {
    if (!player) return 0;

    let slots = [
        player.headArmorItem,
        player.chestArmorItem,
        player.legsArmorItem,
        player.feetArmorItem
    ];

    let totalWeight = 0;

    for (let i = 0; i < slots.length; i++) {
        let item = slots[i];
        if (!item || item.isEmpty() || item.id === 'minecraft:air') continue;

        let id = item.id.toLowerCase();

        // 3 Points: Heavy Armor (Diamond, Netherite, Plate, Boss Alloys)
        if (
            id.includes('netherite') || id.includes('diamond') || id.includes('plate') ||
            id.includes('heavy') || id.includes('knight') || id.includes('ignitium') ||
            id.includes('warden') || id.includes('sculk') || id.includes('gravitite') ||
            id.includes('mortum') || id.includes('apalachia') || id.includes('skythern') ||
            id.includes('ancient') || id.includes('o_yoroi') || id.includes('golem') ||
            id.includes('titan') || id.includes('steel') || id.includes('crushing')
        ) {
            totalWeight += 3;
        }
        // 2 Points: Medium Armor (Iron, Chain, Bronze, Copper, Gold, Zanite)
        else if (
            id.includes('iron') || id.includes('chainmail') || id.includes('chain') ||
            id.includes('copper') || id.includes('gold') || id.includes('golden') ||
            id.includes('bronze') || id.includes('silver') || id.includes('zanite') ||
            id.includes('scale') || id.includes('mail') || id.includes('crude_iron') ||
            id.includes('early_iron') || id.includes('reinforced')
        ) {
            totalWeight += 2;
        }
        // 1 Point: Light Armor (Leather, Cloth, Robes, Garments, Elytra, Wood, Light)
        else {
            totalWeight += 1;
        }
    }

    return Math.min(12, totalWeight);
}

/**
 * Resolves dodge tier based on armor weight score.
 */
function resolveDodgeTier(weight) {
    if (weight <= DODGE_CONFIG.tiers.light.maxWeight) {
        return DODGE_CONFIG.tiers.light;
    } else if (weight <= DODGE_CONFIG.tiers.medium.maxWeight) {
        return DODGE_CONFIG.tiers.medium;
    } else {
        return DODGE_CONFIG.tiers.heavy;
    }
}

/**
 * Internal helper to check and consume player stamina.
 */
function deductDodgeStamina(player, cost) {
    if (!player) return false;
    let pData = player.persistentData;

    let maxStam = 100;
    if (typeof getPlayerMaxStamina === 'function') {
        maxStam = getPlayerMaxStamina(player);
    } else {
        let perks = pData.getCompound('simplestats_perks');
        let vit = 1 + (perks ? perks.getInt('vitality') : 0);
        let agi = 1 + (perks ? perks.getInt('agility') : 0);
        maxStam = Math.min(220, 100 + Math.floor(vit * 1.5) + Math.floor(agi * 1.0));
    }

    let curStam = pData.contains('elyrium_stamina') ? pData.getInt('elyrium_stamina') : maxStam;

    if (curStam < cost) {
        return false;
    }

    let newStam = curStam - cost;
    pData.putInt('elyrium_stamina', newStam);

    // Update BossBar if physical arts engine is present
    if (typeof updateStaminaBossBar === 'function') {
        try {
            updateStaminaBossBar(player, newStam, maxStam);
        } catch (eBar) {}
    }

    return true;
}

// ------------------------------------------------------------------------------
// 1. NETWORK RECEIVER: 'elyrium:player_dodge'
// ------------------------------------------------------------------------------

NetworkEvents.dataReceived('elyrium:player_dodge', event => {
    let player = event.player;
    if (!player || !player.isAlive()) return;

    let level = player.level;
    let pData = player.persistentData;
    let nowTime = level.time;

    // 1. Anti-spam check
    let lastDodgeEnd = pData.getLong('elyrium_dodge_cd_until') || 0;
    if (nowTime < lastDodgeEnd) return;

    // 2. Armor Weight & Dodge Profile
    let armorWeight = calculatePlayerArmorWeight(player);
    let profile = resolveDodgeTier(armorWeight);

    // 3. Stamina check & deduction
    if (!deductDodgeStamina(player, profile.stamina)) {
        player.sendSystemMessage(Text.of('§c⚡ Недостаточно выносливости для переката!'), true);
        try {
            player.server.runCommandSilent(`playsound minecraft:entity.player.breath player ${player.username} ~ ~ ~ 0.8 1.1`);
        } catch (eSnd) {}
        return;
    }

    // Set cooldown
    pData.putLong('elyrium_dodge_cd_until', nowTime + DODGE_CONFIG.cooldownTicks);

    // 4. Determine Direction Vector
    let data = event.data;
    let dirX = 0;
    let dirZ = 0;

    if (data) {
        if (typeof data.dirX === 'number' && typeof data.dirZ === 'number') {
            dirX = data.dirX;
            dirZ = data.dirZ;
        } else if (typeof data.getFloat === 'function') {
            dirX = data.getFloat('dirX');
            dirZ = data.getFloat('dirZ');
        }
    }

    let len = Math.sqrt(dirX * dirX + dirZ * dirZ);
    if (len > 0.001) {
        dirX /= len;
        dirZ /= len;
    } else {
        // Fallback to player look angle
        let look = player.lookAngle;
        let hLen = Math.sqrt(look.x * look.x + look.z * look.z);
        if (hLen > 0.001) {
            dirX = look.x / hLen;
            dirZ = look.z / hLen;
        } else {
            dirX = 0;
            dirZ = 1;
        }
    }

    // 5. Apply Physical Impulse
    let vx = dirX * profile.horizSpeed;
    let vy = profile.vertSpeed;
    let vz = dirZ * profile.horizSpeed;

    player.setDeltaMovement(new Vec3(vx, vy, vz));
    player.hurtMarked = true;

    // 6. I-Frames: Exactly 7 ticks (0.35s) Invulnerability
    pData.putLong('elyrium_dodge_iframe_until', nowTime + DODGE_CONFIG.iframeTicks);

    // 7. Fat Roll Extra Effect (if heavy armor)
    if (armorWeight > DODGE_CONFIG.tiers.medium.maxWeight) {
        // Heavy armor fat roll sound and slight recovery delay
        try {
            player.server.runCommandSilent(`playsound minecraft:item.armor.equip_netherite player ${player.username} ~ ~ ~ 1.0 0.8`);
            player.potionEffects.add('minecraft:slowness', 8, 0, false, false);
        } catch (eFat) {}
    }

    // 8. Sounds & Visual Effects
    try {
        let u = player.username;
        player.server.runCommandSilent(`playsound ${profile.sound} player ${u} ~ ~ ~ 1.0 ${profile.soundPitch}`);
        player.server.runCommandSilent(`particle minecraft:poof ${player.x} ${player.y + 0.15} ${player.z} 0.3 0.1 0.3 0.04 12`);
    } catch (eFx) {}

    // 9. 3D Skeletal Animation Broadcast
    let animSpeed = profile.animSpeed;

    // Send to local player
    try {
        player.sendData('elyrium:play_art_anim', { anim: 'spell_engine:dodge', speed: animSpeed });
    } catch (eLoc) {}

    // Broadcast to tracking players in 64 blocks
    try {
        let box = AABB.of(player.x - 64, player.y - 64, player.z - 64, player.x + 64, player.y + 64, player.z + 64);
        let nearby = level.getEntitiesWithin(box);
        nearby.forEach(ent => {
            if (ent && ent.isPlayer() && ent.id !== player.id) {
                ent.sendData('elyrium:play_player_art_anim', {
                    playerId: player.id,
                    anim: 'spell_engine:dodge',
                    speed: animSpeed
                });
            }
        });
    } catch (eBroad) {}
});

// ------------------------------------------------------------------------------
// 2. I-FRAME DAMAGE NULLIFICATION (EntityEvents.beforeHurt)
// ------------------------------------------------------------------------------

EntityEvents.beforeHurt(event => {
    let victim = event.entity;
    if (!victim || !victim.isPlayer() || !victim.isAlive()) return;

    let pData = victim.persistentData;
    let iframeUntil = pData.getLong('elyrium_dodge_iframe_until') || 0;

    if (victim.level.time < iframeUntil) {
        // Fully cancel incoming damage during active dodge I-Frames!
        event.cancel();

        try {
            // Evasion spark feedback
            victim.server.runCommandSilent(`particle minecraft:crit ${victim.x} ${victim.y + 1.0} ${victim.z} 0.25 0.25 0.25 0.08 6`);
        } catch (eSpark) {}
    }
});
