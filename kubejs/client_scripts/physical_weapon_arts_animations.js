// ==============================================================================
// ⚔️ ELYRIUM RPG: REAL SKELETAL WEAPON ARTS ANIMATIONS (CLIENT SCRIPT)
// Minecraft 1.21.1 NeoForge | KubeJS Client Script
// ==============================================================================
// Plays REAL PlayerAnimator 3D skeletal body animations on player models:
// 1. Receives network packets from server:
//    - 'elyrium:play_art_anim' (local player)
//    - 'elyrium:play_player_art_anim' (broadcasted to nearby players)
// 2. Integrates with dev.kosmx.playerAnim PlayerAnimationAccess & PlayerAnimationRegistry
// 3. Fallbacks seamlessly to Spell Engine AnimatablePlayer or arm swings.
// ==============================================================================

let J_PlayerAnimationRegistry = null;
let J_PlayerAnimationAccess = null;
let J_KeyframeAnimationPlayer = null;
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
        J_ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation');
        J_Minecraft = Java.loadClass('net.minecraft.client.Minecraft');
    } catch (e) {}

    try {
        J_SpellCastAnimationEnum = Java.loadClass('net.spell_engine.internals.casting.SpellCast$Animation');
    } catch (e) {}

    isAnimationApiInitialized = true;
}

function playRealPlayerAnimation(targetPlayer, animId, speed) {
    if (!targetPlayer) return;
    initAnimationApi();

    let animPlayed = false;
    let s = (typeof speed === 'number' && speed > 0) ? speed : 1.0;

    // 1. Primary: Spell Engine AnimatablePlayer Mixin (if present)
    try {
        if (typeof targetPlayer.playSpellAnimation === 'function' && J_SpellCastAnimationEnum) {
            let releaseType = J_SpellCastAnimationEnum.RELEASE || J_SpellCastAnimationEnum.values()[1] || J_SpellCastAnimationEnum.values()[0];
            targetPlayer.playSpellAnimation(releaseType, String(animId), s);
            animPlayed = true;
        }
    } catch (eSpell) {}

    // 2. Secondary / Direct: KosmX PlayerAnimationAccess & PlayerAnimationRegistry
    if (!animPlayed && J_PlayerAnimationRegistry && J_PlayerAnimationAccess && J_KeyframeAnimationPlayer && J_ResourceLocation) {
        try {
            let resLoc = J_ResourceLocation.parse(String(animId));
            let animationData = J_PlayerAnimationRegistry.getAnimation(resLoc);
            if (animationData) {
                let stack = J_PlayerAnimationAccess.getPlayerAnimLayer(targetPlayer);
                if (stack) {
                    let animPlayer = new J_KeyframeAnimationPlayer(animationData);
                    stack.addAnimLayer(1000, animPlayer);
                    animPlayed = true;
                }
            }
        } catch (eKosmx) {}
    }

    // 3. Client Arm Swing Feedback
    try {
        if (typeof targetPlayer.swing === 'function') {
            targetPlayer.swing(targetPlayer.usedItemHand || 'main_hand');
        }
    } catch (eSwing) {}
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
