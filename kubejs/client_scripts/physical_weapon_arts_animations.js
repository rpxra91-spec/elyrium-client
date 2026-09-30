// ==============================================================================
// ⚔️ ELYRIUM RPG: REAL SKELETAL WEAPON ARTS ANIMATIONS (CLIENT SCRIPT)
// Minecraft 1.21.1 NeoForge | KubeJS Client Script
// ==============================================================================
// Plays REAL PlayerAnimator 3D skeletal body animations on player models:
// 1. Receives network packets from server:
//    - 'elyrium:play_art_anim' (local player)
//    - 'elyrium:play_player_art_anim' (broadcasted to nearby players)
// 2. Integrates with dev.kosmx.playerAnim PlayerAnimationAccess & PlayerAnimationRegistry
//    - Real skeletal keyframes with full first-person & third-person rendering
// 3. Fallbacks seamlessly to Spell Engine AnimatablePlayer or arm swings.
// ==============================================================================

let J_PlayerAnimationRegistry = null;
let J_PlayerAnimationAccess = null;
let J_KeyframeAnimationPlayer = null;
let J_FirstPersonMode = null;
let J_ResourceLocation = null;
let J_SpellCastAnimationEnum = null;
let J_Minecraft = null;
let isAnimationApiInitialized = false;

function initAnimationApi() {
    if (isAnimationApiInitialized) return;
    try {
        J_PlayerAnimationRegistry = Java.loadClass('dev.kosmx.playerAnim.minecraftApi.PlayerAnimationRegistry');
        J_PlayerAnimationAccess = Java.loadClass('dev.kosmx.playerAnim.minecraftApi.PlayerAnimationAccess');
        J_KeyframeAnimationPlayer = Java.loadClass('dev.kosmx.playerAnim.api.layered.KeyframeAnimationPlayer');
        J_FirstPersonMode = Java.loadClass('dev.kosmx.playerAnim.api.firstPerson.FirstPersonMode');
        J_ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation');
        J_Minecraft = Java.loadClass('net.minecraft.client.Minecraft');
    } catch (e) {}

    try {
        J_SpellCastAnimationEnum = Java.loadClass('net.spell_engine.internals.casting.SpellCast$Animation');
    } catch (e) {}

    isAnimationApiInitialized = true;
}

function playRealPlayerAnimation(targetPlayer, animId, speed) {
    if (!targetPlayer || !animId) return;
    initAnimationApi();

    // Sanitize animation ID (strip unexpected surrounding quotes)
    let cleanAnimId = String(animId).trim();
    while (cleanAnimId.startsWith('"') || cleanAnimId.startsWith("'")) {
        cleanAnimId = cleanAnimId.substring(1);
    }
    while (cleanAnimId.endsWith('"') || cleanAnimId.endsWith("'")) {
        cleanAnimId = cleanAnimId.substring(0, cleanAnimId.length - 1);
    }
    cleanAnimId = cleanAnimId.trim();
    if (!cleanAnimId) return;

    let animPlayed = false;
    let s = (typeof speed === 'number' && speed > 0) ? speed : 1.0;

    let mc = null;
    try {
        mc = J_Minecraft ? J_Minecraft.getInstance() : null;
    } catch (e) {}

    // Ensure we resolve directly to native AbstractClientPlayer (mc.player or native entity)
    let rawPlayer = null;
    if (mc && mc.player) {
        let isLocal = (targetPlayer === Client.player || targetPlayer === mc.player);
        if (!isLocal && targetPlayer.getUUID && mc.player.getUUID) {
            try {
                if (targetPlayer.getUUID().equals(mc.player.getUUID())) isLocal = true;
            } catch (eUuid) {}
        }
        if (isLocal) {
            rawPlayer = mc.player;
        }
    }

    if (!rawPlayer) {
        if (targetPlayer.minecraftPlayer) rawPlayer = targetPlayer.minecraftPlayer;
        else if (targetPlayer.minecraftEntity) rawPlayer = targetPlayer.minecraftEntity;
        else if (targetPlayer.rawPlayer) rawPlayer = targetPlayer.rawPlayer;
        else if (targetPlayer.entity) rawPlayer = targetPlayer.entity;
        else if (targetPlayer.player) rawPlayer = targetPlayer.player;
        else rawPlayer = targetPlayer;
    }

    // 1. Primary: Spell Engine AnimatablePlayer Mixin (if present, but skip for Better Combat)
    if (!cleanAnimId.startsWith('bettercombat:')) {
        try {
            let playFunc = rawPlayer.playSpellAnimation || targetPlayer.playSpellAnimation;
            if (typeof playFunc === 'function' && J_SpellCastAnimationEnum) {
                let releaseType = null;
                try {
                    releaseType = J_SpellCastAnimationEnum.RELEASE || J_SpellCastAnimationEnum.valueOf('RELEASE');
                } catch (eRel) {
                    try { releaseType = J_SpellCastAnimationEnum.values()[0]; } catch (eVals) {}
                }
                if (releaseType) {
                    if (typeof rawPlayer.playSpellAnimation === 'function') {
                        rawPlayer.playSpellAnimation(releaseType, cleanAnimId, s);
                        animPlayed = true;
                    } else if (typeof targetPlayer.playSpellAnimation === 'function') {
                        targetPlayer.playSpellAnimation(releaseType, cleanAnimId, s);
                        animPlayed = true;
                    }
                }
            }
        } catch (eSpell) {}
    }

    // 2. Secondary / Direct: KosmX PlayerAnimationAccess & PlayerAnimationRegistry
    if (!animPlayed && J_PlayerAnimationRegistry && J_PlayerAnimationAccess && J_ResourceLocation) {
        try {
            let resLoc = J_ResourceLocation.parse(cleanAnimId);
            let animationData = J_PlayerAnimationRegistry.getAnimation(resLoc);
            if (animationData) {
                let stack = J_PlayerAnimationAccess.getPlayerAnimLayer(rawPlayer);
                if (stack) {
                    // Guaranteed removal of any previous layer 1000 before adding new animation
                    try {
                        stack.removeLayer(1000);
                    } catch (eRem) {}

                    // Clear any previously tracked cleanups for this stack
                    for (let i = activeKosmxLayers.length - 1; i >= 0; i--) {
                        if (activeKosmxLayers[i].stack === stack) {
                            try { activeKosmxLayers[i].animPlayer.stop(); } catch (eSt) {}
                            activeKosmxLayers.splice(i, 1);
                        }
                    }

                    let animPlayer = null;
                    if (typeof animationData.playAnimation === 'function') {
                        animPlayer = animationData.playAnimation();
                    } else if (J_KeyframeAnimationPlayer) {
                        animPlayer = new J_KeyframeAnimationPlayer(animationData);
                    }

                    if (animPlayer) {
                        // Enable full 3D skeletal first person rendering
                        try {
                            if (J_FirstPersonMode && typeof animPlayer.setFirstPersonMode === 'function') {
                                animPlayer.setFirstPersonMode(J_FirstPersonMode.THIRD_PERSON_MODEL);
                            }
                        } catch (eFp) {}

                        stack.addAnimLayer(1000, animPlayer);
                        animPlayed = true;

                        // Calculate animation length in ticks
                        let lengthTicks = 20;
                        try {
                            if (animationData.stopTick && animationData.stopTick > 0) {
                                lengthTicks = animationData.stopTick;
                            } else if (animationData.endTick && animationData.endTick > 0) {
                                lengthTicks = animationData.endTick;
                            } else if (typeof animationData.getLength === 'function') {
                                lengthTicks = animationData.getLength();
                            }
                        } catch (eLen) {}

                        let durationTicks = Math.max(8, Math.ceil(lengthTicks / s));
                        scheduleKosmxCleanup(stack, animPlayer, durationTicks);
                    }
                }
            }
        } catch (eKosmx) {}
    }

    // 3. Client Arm Swing Feedback (only as fallback if no 3D skeletal animation was played)
    if (!animPlayed) {
        try {
            if (typeof rawPlayer.swing === 'function') {
                rawPlayer.swing(rawPlayer.usedItemHand || 'main_hand');
            } else if (typeof targetPlayer.swing === 'function') {
                targetPlayer.swing(targetPlayer.usedItemHand || 'main_hand');
            }
        } catch (eSwing) {}
    }
}

// ------------------------------------------------------------------------------
// NETWORK LISTENERS (KubeJS Client)
// ------------------------------------------------------------------------------

NetworkEvents.dataReceived('elyrium:play_art_anim', event => {
    let animId = event.data.anim || (event.data.getString ? event.data.getString('anim') : null);
    let speed = event.data.speed || (event.data.getFloat ? event.data.getFloat('speed') : 1.0) || 1.0;
    if (!animId) return;

    let mc = null;
    try {
        mc = J_Minecraft ? J_Minecraft.getInstance() : null;
    } catch (e) {}

    let localPlayer = (mc && mc.player) ? mc.player : Client.player;
    if (localPlayer) {
        playRealPlayerAnimation(localPlayer, animId, speed);
    }
});

NetworkEvents.dataReceived('elyrium:play_player_art_anim', event => {
    let pId = event.data.playerId || (event.data.getInt ? event.data.getInt('playerId') : null);
    let animId = event.data.anim || (event.data.getString ? event.data.getString('anim') : null);
    let speed = event.data.speed || (event.data.getFloat ? event.data.getFloat('speed') : 1.0) || 1.0;
    if (!animId) return;

    let targetPlayer = null;
    try {
        if (Client.level && typeof Client.level.getEntity === 'function') {
            targetPlayer = Client.level.getEntity(pId);
        }
    } catch (e) {}

    if (targetPlayer) {
        playRealPlayerAnimation(targetPlayer, animId, speed);
    }
});

// ------------------------------------------------------------------------------
// GUARANTEED KOSMX LAYER CLEANUP SCHEDULER (Client Tick)
// ------------------------------------------------------------------------------

let activeKosmxLayers = [];
let clientAnimTickCount = 0;

function scheduleKosmxCleanup(stack, animPlayer, durationTicks) {
    if (!stack || !animPlayer) return;
    let targetTick = clientAnimTickCount + Math.max(5, durationTicks);
    activeKosmxLayers.push({
        stack: stack,
        animPlayer: animPlayer,
        expireTick: targetTick
    });
}

ClientEvents.tick(event => {
    clientAnimTickCount++;
    if (activeKosmxLayers.length === 0) return;

    for (let i = activeKosmxLayers.length - 1; i >= 0; i--) {
        let item = activeKosmxLayers[i];
        let shouldRemove = false;
        try {
            if (clientAnimTickCount >= item.expireTick) {
                shouldRemove = true;
            } else if (item.animPlayer && typeof item.animPlayer.isActive === 'function' && !item.animPlayer.isActive()) {
                shouldRemove = true;
            }
        } catch (e) {
            shouldRemove = true;
        }

        if (shouldRemove) {
            try {
                if (item.animPlayer && typeof item.animPlayer.stop === 'function') {
                    item.animPlayer.stop();
                }
            } catch (eStop) {}
            try {
                if (item.stack) {
                    item.stack.removeLayer(1000);
                    item.stack.removeLayer(item.animPlayer);
                }
            } catch (eRem) {}
            activeKosmxLayers.splice(i, 1);
        }
    }
});

