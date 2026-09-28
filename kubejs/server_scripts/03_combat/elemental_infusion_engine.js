// ==============================================================================
// ⚡ ELYRIUM RPG: ELEMENTAL INFUSION & COMBO ENGINE
// ==============================================================================
// Milestone M4: Phase 12 Architecture
// 1. 30% Armor-Bypassing Damage Conversion:
//    - event.damage *= 0.70 (30% physical damage converted)
//    - Converted elemental damage is dealt as pure magic damage bypassing armor.
// 2. Soft Intellect Scaling (simplestats_perks.mana / PerkManager):
//    - Base multiplier 1.0x at 0 INT (zero penalty for pure warrior builds).
//    - Formula: 1.0 + (intVal * 0.015).
// 3. Holy Undead Bonus:
//    - +50% bonus holy damage against undead entities.
// 4. Elemental Combo Reactions (4-second timestamp window in victim.persistentData):
//    - «Термошок» (Thermoshock): Fire + Frost -> Steam burst damage + cloud/smoke FX + extinguish sound.
//    - «Сверхпроводимость» (Superconductivity): Lightning + Frost -> Chain arc AoE + Slowness II & Weakness II debuffs.
// 5. Distinct Elemental Hit FX & Particles:
//    - Fire: minecraft:flame + target burn
//    - Frost: minecraft:snowflake + freeze ticks & slowness
//    - Lightning: minecraft:electric_spark + shock crackle
//    - Shadow: minecraft:sculk_charge_pop + wither & slowness
//    - Holy: minecraft:enchanted_hit + radiant chime & glowing
// 6. 100% Robust Recursion Guard:
//    - skd_elem_proc persistentData flag + magic source filtering.
// ==============================================================================

// ------------------------------------------------------------------------------
// 1. CONSTANTS & METADATA
// ------------------------------------------------------------------------------

const ELEMENTAL_DATA = {
    fire: {
        id: 'kubejs:elemental_stone_fire',
        name: 'Пламя',
        color: '§c',
        particle: 'minecraft:flame',
        procSound: 'minecraft:item.firecharge.use'
    },
    frost: {
        id: 'kubejs:elemental_stone_frost',
        name: 'Лед',
        color: '§b',
        particle: 'minecraft:snowflake',
        procSound: 'minecraft:block.glass.break'
    },
    lightning: {
        id: 'kubejs:elemental_stone_lightning',
        name: 'Молния',
        color: '§e',
        particle: 'minecraft:electric_spark',
        procSound: 'minecraft:entity.lightning_bolt.impact'
    },
    shadow: {
        id: 'kubejs:elemental_stone_shadow',
        name: 'Бездна',
        color: '§5',
        particle: 'minecraft:sculk_charge_pop',
        procSound: 'minecraft:block.sculk_shrieker.shriek'
    },
    holy: {
        id: 'kubejs:elemental_stone_holy',
        name: 'Святость',
        color: '§6',
        particle: 'minecraft:enchanted_hit',
        procSound: 'minecraft:block.amethyst_block.chime'
    }
};

// ------------------------------------------------------------------------------
// 2. HELPER FUNCTIONS
// ------------------------------------------------------------------------------

/**
 * Normalizes element string from weapon NBT or stone ID.
 */
function normalizeElement(elem) {
    if (!elem) return null;
    let s = String(elem).toLowerCase().trim();
    if (s.includes('fire') || s.includes('flame')) return 'fire';
    if (s.includes('frost') || s.includes('ice')) return 'frost';
    if (s.includes('lightning') || s.includes('shock') || s.includes('thunder')) return 'lightning';
    if (s.includes('shadow') || s.includes('void') || s.includes('dark')) return 'shadow';
    if (s.includes('holy') || s.includes('light') || s.includes('sacred')) return 'holy';
    return null;
}

/**
 * Reads elemental infusion type from weapon item stack.
 */
function getWeaponElementalInfusion(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return null;
    let infusion = null;

    try {
        if (item.customData) {
            if (item.customData.contains('skd_elemental_infusion')) {
                infusion = item.customData.getString('skd_elemental_infusion');
            } else if (item.customData.contains('skd_element')) {
                infusion = item.customData.getString('skd_element');
            }
        }
    } catch (e) {}

    if (!infusion) {
        try {
            if (item.nbt) {
                if (item.nbt.contains('skd_elemental_infusion')) {
                    infusion = item.nbt.getString('skd_elemental_infusion');
                } else if (item.nbt.contains('skd_element')) {
                    infusion = item.nbt.getString('skd_element');
                }
            }
        } catch (e2) {}
    }

    if (!infusion) {
        try {
            let DataComponents = Java.loadClass('net.minecraft.core.component.DataComponents');
            let cd = item.get(DataComponents.CUSTOM_DATA);
            if (cd) {
                let tag = cd.copyTag();
                if (tag) {
                    if (tag.contains('skd_elemental_infusion')) infusion = tag.getString('skd_elemental_infusion');
                    else if (tag.contains('skd_element')) infusion = tag.getString('skd_element');
                }
            }
        } catch (e3) {}
    }

    return normalizeElement(infusion);
}

/**
 * Sets elemental infusion onto a weapon item stack.
 */
function setWeaponElementalInfusion(item, element) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let norm = normalizeElement(element);
    if (!norm) return false;

    let applied = false;
    try {
        if (item.customData) {
            item.customData.putString('skd_elemental_infusion', norm);
            applied = true;
        }
    } catch (e) {}

    try {
        if (item.nbt) {
            item.nbt.putString('skd_elemental_infusion', norm);
            applied = true;
        }
    } catch (e2) {}

    return applied;
}

/**
 * Removes elemental infusion from a weapon item stack.
 */
function removeWeaponElementalInfusion(item) {
    if (!item || item.isEmpty()) return false;
    let removed = false;

    try {
        if (item.customData) {
            if (item.customData.contains('skd_elemental_infusion')) {
                item.customData.remove('skd_elemental_infusion');
                removed = true;
            }
            if (item.customData.contains('skd_element')) {
                item.customData.remove('skd_element');
                removed = true;
            }
        }
    } catch (e) {}

    try {
        if (item.nbt) {
            if (item.nbt.contains('skd_elemental_infusion')) {
                item.nbt.remove('skd_elemental_infusion');
                removed = true;
            }
            if (item.nbt.contains('skd_element')) {
                item.nbt.remove('skd_element');
                removed = true;
            }
        }
    } catch (e2) {}

    return removed;
}

/**
 * Retrieves player's Intellect / Mana stat from SimpleStats / PerkManager.
 */
function getPlayerIntellect(player) {
    if (!player) return 0;

    // 1. Try SimpleStats PerkManager class
    try {
        let PerkManager = Java.loadClass('network.roto.simplestats.leveling.PerkManager');
        if (PerkManager) {
            let rawPlayer = player.minecraftPlayer || player;
            let lvl = PerkManager.getPerkLevel(rawPlayer, 'mana');
            if (lvl !== null && lvl !== undefined && !isNaN(lvl)) {
                return Number(lvl);
            }
        }
    } catch (e) {}

    // 2. Try persistentData compound simplestats_perks
    try {
        if (player.persistentData) {
            let perks = player.persistentData.getCompound('simplestats_perks');
            if (perks && perks.contains('mana')) {
                return perks.getInt('mana') || 0;
            }
            if (perks && perks.contains('intelligence')) {
                return perks.getInt('intelligence') || 0;
            }
        }
    } catch (e2) {}

    return 0;
}

/**
 * Checks if target entity is undead for Holy element bonus.
 */
function isUndeadTarget(entity) {
    if (!entity) return false;
    try {
        if (typeof entity.isUndead === 'function' && entity.isUndead()) return true;
    } catch (e) {}

    let typeStr = entity.type ? String(entity.type).toLowerCase() : '';
    return typeStr.includes('zombie') || typeStr.includes('skeleton') ||
           typeStr.includes('phantom') || typeStr.includes('wither') ||
           typeStr.includes('drowned') || typeStr.includes('husk') ||
           typeStr.includes('stray') || typeStr.includes('zombified');
}

/**
 * Safely spawns elemental hit particles at target coordinates.
 */
function spawnElementalParticles(server, element, x, y, z) {
    if (!server) return;
    try {
        switch (element) {
            case 'fire':
                server.runCommandSilent(`particle minecraft:flame ${x} ${y + 1} ${z} 0.35 0.35 0.35 0.05 16 normal`);
                break;
            case 'frost':
                server.runCommandSilent(`particle minecraft:snowflake ${x} ${y + 1} ${z} 0.35 0.35 0.35 0.03 16 normal`);
                break;
            case 'lightning':
                server.runCommandSilent(`particle minecraft:electric_spark ${x} ${y + 1} ${z} 0.35 0.35 0.35 0.1 16 normal`);
                break;
            case 'shadow':
                server.runCommandSilent(`particle minecraft:sculk_charge_pop ${x} ${y + 1} ${z} 0.35 0.35 0.35 0.05 14 normal`);
                break;
            case 'holy':
                server.runCommandSilent(`particle minecraft:enchanted_hit ${x} ${y + 1} ${z} 0.35 0.35 0.35 0.1 20 normal`);
                break;
        }
    } catch (e) {}
}

// ------------------------------------------------------------------------------
// 3. COMBAT HOOK: EntityEvents.beforeHurt
// ------------------------------------------------------------------------------

EntityEvents.beforeHurt(event => {
    let source = event.source;
    if (!source) return;

    let victim = event.entity;
    if (!victim || !victim.isLiving() || !victim.isAlive() || victim.isPlayer()) return;

    // A. Recursion Guard: ignore secondary elemental procs or recursive calls
    if (victim.persistentData && victim.persistentData.getBoolean('skd_elem_proc')) return;

    // B. Ignore incoming pure magic attacks to prevent self-looping
    try {
        if (source.isMagic && source.isMagic()) return;
        let sType = source.type ? String(source.type).toLowerCase() : '';
        if (sType.includes('magic')) return;
    } catch (eGuard) {}

    let attacker = source.actual || source.player;
    if (!attacker || !attacker.isPlayer()) return;
    let player = attacker;

    // Ignore friendly MineColonies citizens
    if (victim.type && String(victim.type).includes('minecolonies:citizen')) return;

    // Resolve player's weapon (mainhand priority, offhand fallback)
    let weapon = player.mainHandItem;
    if (!weapon || weapon.isEmpty() || weapon.id === 'minecraft:air') {
        if (player.offHandItem && !player.offHandItem.isEmpty() && player.offHandItem.id !== 'minecraft:air') {
            weapon = player.offHandItem;
        }
    }
    if (!weapon || weapon.isEmpty()) return;

    // Check if weapon is infused with an element
    let element = getWeaponElementalInfusion(weapon);
    if (!element) return;

    let initialDamage = event.damage;
    if (initialDamage <= 0.1) return;

    // ==========================================================================
    // ⚔️ 1. DAMAGE CONVERSION: 30% PHYSICAL -> ELEMENTAL
    // ==========================================================================
    let baseElemDamage = initialDamage * 0.30;
    event.damage = initialDamage * 0.70; // Physical damage reduced to 70%

    // ==========================================================================
    // 🧠 2. SOFT INTELLECT SCALING
    // ==========================================================================
    // Base multiplier is 1.0x at 0 INT (0 penalty for pure warriors).
    // Each INT point provides +1.5% (+0.015) bonus to the elemental portion.
    let intVal = getPlayerIntellect(player);
    let intMultiplier = 1.0 + (Math.max(0, intVal) * 0.015);
    let scaledElemDamage = baseElemDamage * intMultiplier;

    // Holy bonus: +50% holy damage vs undead
    if (element === 'holy' && isUndeadTarget(victim)) {
        scaledElemDamage *= 1.50;
    }

    let now = Date.now();
    let server = player.server;

    // ==========================================================================
    // 🔄 3. ELEMENTAL COMBO REACTIONS (4-Second Window)
    // ==========================================================================
    let prevElem = null;
    let prevTime = 0;
    if (victim.persistentData) {
        prevElem = victim.persistentData.getString('skd_elem_applied');
        prevTime = victim.persistentData.getLong('skd_elem_time') || 0;
    }

    let isComboWindow = prevElem && (now - prevTime <= 4000);
    let comboTriggered = false;

    // --- COMBO A: «ТЕРМОШОК» (THERMOSHOCK) [Fire + Frost] ---
    if (isComboWindow && ((element === 'fire' && prevElem === 'frost') || (element === 'frost' && prevElem === 'fire'))) {
        comboTriggered = true;

        // Thermoshock explosive burst: extra 150% elemental burst damage
        let burstDamage = Math.max(8.0, scaledElemDamage * 1.50);
        scaledElemDamage += burstDamage;

        // Reset victim combo tracking
        victim.persistentData.remove('skd_elem_applied');
        victim.persistentData.remove('skd_elem_time');

        // Visual & Sound effects for Steam Explosion
        if (server) {
            server.runCommandSilent(`particle minecraft:cloud ${victim.x} ${victim.y + 1} ${victim.z} 0.6 0.6 0.6 0.05 30 normal`);
            server.runCommandSilent(`particle minecraft:poof ${victim.x} ${victim.y + 1} ${victim.z} 0.5 0.5 0.5 0.1 20 normal`);
            server.runCommandSilent(`particle minecraft:large_smoke ${victim.x} ${victim.y + 0.8} ${victim.z} 0.4 0.4 0.4 0.05 15 normal`);
            server.runCommandSilent(`playsound minecraft:entity.generic.extinguish_fire player ${player.username} ${victim.x} ${victim.y} ${victim.z} 1.5 0.9`);
            server.runCommandSilent(`playsound minecraft:entity.generic.explode player ${player.username} ${victim.x} ${victim.y} ${victim.z} 1.0 1.6`);
        }

        try {
            player.sendSystemMessage(Text.of('§c§l💥 ТЕРМОШОК! §eВзрыв пара нанес +' + burstDamage.toFixed(1) + ' чистого урона!'), true);
        } catch (eMsg) {}
    }

    // --- COMBO B: «СВЕРХПРОВОДИМОСТЬ» (SUPERCONDUCTIVITY) [Lightning + Frost] ---
    else if (isComboWindow && ((element === 'lightning' && prevElem === 'frost') || (element === 'frost' && prevElem === 'lightning'))) {
        comboTriggered = true;

        // Reset victim combo tracking
        victim.persistentData.remove('skd_elem_applied');
        victim.persistentData.remove('skd_elem_time');

        // Debuff victim: Slowness II (80 ticks) + Weakness II (80 ticks)
        try {
            if (victim.potionEffects) {
                victim.potionEffects.add('minecraft:slowness', 80, 1, false, true);
                victim.potionEffects.add('minecraft:weakness', 80, 1, false, true);
            }
        } catch (eDebuff) {}

        // Chain arc discharge to nearby enemies in 5-block radius
        let chainDamage = Math.max(4.0, scaledElemDamage * 0.75);
        let level = victim.level || player.level;
        if (level) {
            try {
                let nearby = level.getEntitiesWithin(AABB.of(
                    victim.x - 5.0, victim.y - 2.0, victim.z - 5.0,
                    victim.x + 5.0, victim.y + 3.0, victim.z + 5.0
                ));

                for (let ent of nearby) {
                    if (ent && ent.isAlive() && ent.isLiving() && ent !== player && ent !== victim && !ent.isPlayer()) {
                        if (ent.type && String(ent.type).includes('minecolonies:citizen')) continue;
                        try {
                            ent.persistentData.putBoolean('skd_elem_proc', true);
                            try {
                                ent.attack(player.damageSources().magic(), chainDamage);
                            } finally {
                                ent.persistentData.remove('skd_elem_proc');
                            }
                            if (ent.potionEffects) {
                                ent.potionEffects.add('minecraft:slowness', 80, 1, false, true);
                                ent.potionEffects.add('minecraft:weakness', 80, 1, false, true);
                            }
                            if (server) {
                                server.runCommandSilent(`particle minecraft:electric_spark ${ent.x} ${ent.y + 1} ${ent.z} 0.3 0.3 0.3 0.15 10 normal`);
                            }
                        } catch (eChain) {}
                    }
                }
            } catch (eAABB) {}
        }

        // Visual & Sound effects for Superconductivity
        if (server) {
            server.runCommandSilent(`particle minecraft:electric_spark ${victim.x} ${victim.y + 1} ${victim.z} 0.6 0.6 0.6 0.2 35 normal`);
            server.runCommandSilent(`particle minecraft:snowflake ${victim.x} ${victim.y + 1} ${victim.z} 0.5 0.5 0.5 0.05 20 normal`);
            server.runCommandSilent(`playsound minecraft:entity.lightning_bolt.thunder player ${player.username} ${victim.x} ${victim.y} ${victim.z} 0.8 1.8`);
            server.runCommandSilent(`playsound minecraft:block.conduit.attack.target player ${player.username} ${victim.x} ${victim.y} ${victim.z} 1.2 1.4`);
        }

        try {
            player.sendSystemMessage(Text.of('§b§l⚡ СВЕРХПРОВОДИМОСТЬ! §fЦепной разряд ослабил защиту врагов!'), true);
        } catch (eMsg2) {}
    }

    // ==========================================================================
    // 🌟 4. INDIVIDUAL ELEMENTAL EFFECTS (When no combo triggered)
    // ==========================================================================
    if (!comboTriggered) {
        // Record current element application for future combo reactions
        victim.persistentData.putString('skd_elem_applied', element);
        victim.persistentData.putLong('skd_elem_time', now);

        try {
            switch (element) {
                case 'fire':
                    victim.setRemainingFireTicks(80); // Ignite for 4 seconds
                    break;
                case 'frost':
                    victim.setTicksFrozen(140); // Deep freeze ticks
                    if (victim.potionEffects) {
                        victim.potionEffects.add('minecraft:slowness', 60, 0, false, true);
                    }
                    break;
                case 'lightning':
                    if (victim.potionEffects) {
                        victim.potionEffects.add('minecraft:weakness', 40, 0, false, true);
                    }
                    if (server) {
                        server.runCommandSilent(`playsound minecraft:entity.lightning_bolt.impact player ${player.username} ${victim.x} ${victim.y} ${victim.z} 0.6 2.0`);
                    }
                    break;
                case 'shadow':
                    if (victim.potionEffects) {
                        victim.potionEffects.add('minecraft:wither', 60, 0, false, true);
                        victim.potionEffects.add('minecraft:slowness', 60, 0, false, true);
                    }
                    break;
                case 'holy':
                    if (victim.potionEffects) {
                        victim.potionEffects.add('minecraft:glowing', 60, 0, false, true);
                    }
                    if (server) {
                        server.runCommandSilent(`playsound minecraft:block.amethyst_block.chime player ${player.username} ${victim.x} ${victim.y} ${victim.z} 0.8 1.4`);
                    }
                    break;
            }
        } catch (eStatus) {}
    }

    // ==========================================================================
    // 💥 5. SPAWN PARTICLES ON HIT
    // ==========================================================================
    spawnElementalParticles(server, element, victim.x, victim.y, victim.z);

    // ==========================================================================
    // 🛡️ 6. APPLY ARMOR-BYPASSING MAGIC DAMAGE WITH RECURSION GUARD
    // ==========================================================================
    victim.persistentData.putBoolean('skd_elem_proc', true);
    try {
        let magicSrc = null;
        try {
            if (victim.damageSources && typeof victim.damageSources().magic === 'function') {
                magicSrc = victim.damageSources().magic();
            } else if (player.damageSources && typeof player.damageSources().magic === 'function') {
                magicSrc = player.damageSources().magic();
            }
        } catch (eSrc) {}

        let hitSuccess = false;
        try {
            victim.invulnerableTime = 0;
            if (magicSrc) {
                hitSuccess = victim.attack(magicSrc, scaledElemDamage);
            }
        } catch (eAtt) {}

        if (!hitSuccess) {
            // Direct health subtraction fallback to guarantee damage delivery
            try {
                victim.setHealth(Math.max(0, victim.health - scaledElemDamage));
            } catch (eFb) {}
        }
    } finally {
        victim.persistentData.remove('skd_elem_proc');
    }
});

// ------------------------------------------------------------------------------
// 4. GLOBAL EXPORTS
// ------------------------------------------------------------------------------

global.ElyriumElementalInfusion = {
    getInfusion: getWeaponElementalInfusion,
    setInfusion: setWeaponElementalInfusion,
    removeInfusion: removeWeaponElementalInfusion,
    getIntellect: getPlayerIntellect,
    isUndead: isUndeadTarget,
    normalizeElement: normalizeElement,
    ELEMENTAL_DATA: ELEMENTAL_DATA
};
