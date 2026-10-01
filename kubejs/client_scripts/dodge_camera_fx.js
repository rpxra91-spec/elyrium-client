// ==============================================================================
// ⚔️ ELYRIUM RPG: SOULS DODGE CLIENT FX & CAMERA ENGINE (v1.0)
// Minecraft 1.21.1 NeoForge | KubeJS Client Script
// ==============================================================================
// 1. Double-Tap WASD (<350ms) detection + Alt Keybind Listener
// 2. Instant client-side physics impulse: setDeltaMovement(new Vec3(...))
// 3. First-Person Camera FX:
//    - Kinetic Roll (6 degrees) and Pitch (4 degrees) tilt via ViewportEvent$ComputeCameraAngles
//    - Seamless first-person view WITHOUT forcing 3rd person perspective
//    - Sweep sound & poof particles feedback
// 4. Third-Person View:
//    - Local skeletal animation 'spell_engine:dodge' via PlayerAnimationAccess
// 5. Network sync:
//    - Sends 'elyrium:player_dodge' to server with normalized motion direction
// ==============================================================================

let J_Minecraft = null;
let J_Vec3 = null;
let J_ComputeCameraAngles = null;
let J_PlayerAnimationRegistry = null;
let J_PlayerAnimationAccess = null;
let J_KeyframeAnimationPlayer = null;
let J_ResourceLocation = null;
let J_GLFW = null;
let isClientDodgeApiLoaded = false;

function initClientDodgeApi() {
    if (isClientDodgeApiLoaded) return;

    try {
        J_Minecraft = Java.loadClass('net.minecraft.client.Minecraft');
        J_Vec3 = Java.loadClass('net.minecraft.world.phys.Vec3');
    } catch (e) {}

    try {
        J_ComputeCameraAngles = Java.loadClass('net.neoforged.neoforge.client.event.ViewportEvent$ComputeCameraAngles');
    } catch (e) {}

    try {
        J_PlayerAnimationRegistry = Java.loadClass('dev.kosmx.playerAnim.minecraftApi.PlayerAnimationRegistry');
        J_PlayerAnimationAccess = Java.loadClass('dev.kosmx.playerAnim.minecraftApi.PlayerAnimationAccess');
        J_KeyframeAnimationPlayer = Java.loadClass('dev.kosmx.playerAnim.api.layered.KeyframeAnimationPlayer');
        J_ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation');
    } catch (e) {}

    try {
        J_GLFW = Java.loadClass('org.lwjgl.glfw.GLFW');
    } catch (e) {}

    isClientDodgeApiLoaded = true;
}

// State tracking for double-tap WASD and Alt keybind
let lastTapTimes = {
    forward: 0,
    back: 0,
    left: 0,
    right: 0
};

let keyPrevStates = {
    forward: false,
    back: false,
    left: false,
    right: false,
    alt: false
};

let lastDodgeTimestamp = 0;
const DODGE_CLIENT_COOLDOWN_MS = 600; // Anti-spam combat cooldown

// Camera tilt state variables
let cameraFxActive = false;
let cameraFxStartTime = 0;
let cameraFxDuration = 350; // ms
let cameraTargetRoll = 0.0;
let cameraTargetPitch = 0.0;

/**
 * Calculates armor weight for local client player (0 to 12 pts).
 */
function getClientArmorWeight(player) {
    if (!player) return 0;

    let slots = [
        player.headArmorItem,
        player.chestArmorItem,
        player.legsArmorItem,
        player.feetArmorItem
    ];

    let weight = 0;
    for (let i = 0; i < slots.length; i++) {
        let it = slots[i];
        if (!it || it.isEmpty() || it.id === 'minecraft:air') continue;
        let id = it.id.toLowerCase();

        if (
            id.includes('netherite') || id.includes('diamond') || id.includes('plate') ||
            id.includes('heavy') || id.includes('knight') || id.includes('ignitium') ||
            id.includes('warden') || id.includes('sculk') || id.includes('gravitite') ||
            id.includes('mortum') || id.includes('apalachia') || id.includes('skythern') ||
            id.includes('ancient') || id.includes('o_yoroi') || id.includes('golem') ||
            id.includes('titan') || id.includes('steel')
        ) {
            weight += 3;
        } else if (
            id.includes('iron') || id.includes('chainmail') || id.includes('chain') ||
            id.includes('copper') || id.includes('gold') || id.includes('golden') ||
            id.includes('bronze') || id.includes('silver') || id.includes('zanite') ||
            id.includes('scale') || id.includes('mail') || id.includes('reinforced')
        ) {
            weight += 2;
        } else {
            weight += 1;
        }
    }
    return Math.min(12, weight);
}

/**
 * Plays 3rd person skeletal animation locally via playerAnim.
 */
function playLocalThirdPersonDodge(player, speed) {
    if (!player) return;
    initClientDodgeApi();

    if (J_PlayerAnimationRegistry && J_PlayerAnimationAccess && J_ResourceLocation) {
        try {
            let resLoc = J_ResourceLocation.parse('elyrium:roll');
            let animationData = J_PlayerAnimationRegistry.getAnimation(resLoc);
            if (!animationData) {
                resLoc = J_ResourceLocation.parse('spell_engine:dodge');
                animationData = J_PlayerAnimationRegistry.getAnimation(resLoc);
            }
            if (animationData) {
                let rawPlayer = player.minecraftPlayer || player.minecraftEntity || player;
                let stack = J_PlayerAnimationAccess.getPlayerAnimLayer(rawPlayer);
                if (stack) {
                    let animPlayer = null;
                    if (typeof animationData.playAnimation === 'function') {
                        animPlayer = animationData.playAnimation();
                    } else if (J_KeyframeAnimationPlayer) {
                        animPlayer = new J_KeyframeAnimationPlayer(animationData);
                    }
                    if (animPlayer) {
                        stack.addAnimLayer(1000, animPlayer);
                    }
                }
            }
        } catch (e) {}
    }
}

/**
 * Executes dodge maneuver on client side.
 * @param {number} forwardInput +1 forward, -1 backward, 0 none
 * @param {number} strafeInput +1 left, -1 right, 0 none
 */
function performClientDodge(forwardInput, strafeInput) {
    initClientDodgeApi();

    let mc = J_Minecraft ? J_Minecraft.getInstance() : null;
    if (!mc || !mc.player || mc.screen != null || mc.isPaused()) return;
    let player = mc.player;
    if (!player.isAlive()) return;

    let now = Date.now();
    if (now - lastDodgeTimestamp < DODGE_CLIENT_COOLDOWN_MS) return;
    lastDodgeTimestamp = now;

    // 1. Calculate direction vector from yaw and inputs
    let fwd = forwardInput;
    let str = strafeInput;

    if (fwd === 0 && str === 0) {
        // Default dodge forward if no direction is held
        fwd = 1;
    }

    let yawRad = player.yRot * (Math.PI / 180.0);
    let fx = -Math.sin(yawRad);
    let fz = Math.cos(yawRad);
    let rx = Math.cos(yawRad);
    let rz = Math.sin(yawRad);

    // Correct strafe math: str > 0 is left (+rx, +rz), str < 0 is right (-rx, -rz)
    let dirX = fx * fwd + rx * str;
    let dirZ = fz * fwd + rz * str;

    let len = Math.sqrt(dirX * dirX + dirZ * dirZ);
    if (len > 0.001) {
        dirX /= len;
        dirZ /= len;
    } else {
        dirX = fx;
        dirZ = fz;
    }

    // 2. Armor Weight & Impulse Profile
    let weight = getClientArmorWeight(player);
    let horizSpeed = 0.58;
    let vertSpeed = 0.10;
    let animSpeed = 1.25;
    let staminaCost = 14;

    if (weight > 8) {
        // Heavy Armor Tier
        if (fwd > 0) {
            // Heavy Bull Charge forward (closes gap on light targets!)
            horizSpeed = 0.65;
            vertSpeed = 0.05;
            animSpeed = 1.0;
            staminaCost = 30;
        } else {
            // Fat Roll backwards / sideways
            horizSpeed = 0.32;
            vertSpeed = 0.04;
            animSpeed = 0.75;
            staminaCost = 35;
        }
    } else if (weight > 4) {
        // Medium Roll
        horizSpeed = 0.46;
        vertSpeed = 0.08;
        animSpeed = 1.05;
        staminaCost = 24;
    }

    // 3. Client Stamina Gate (Zero-latency local check)
    if (typeof ElyriumClientStamina !== 'undefined' && ElyriumClientStamina.current < staminaCost) {
        try {
            player.playSound('minecraft:entity.player.breath', 0.85, 1.1);
        } catch (eBreath) {}
        return; // Complete physical and network block!
    }
    if (typeof ElyriumClientStamina !== 'undefined') {
        ElyriumClientStamina.consume(staminaCost);
    }

    // 4. Instant Client Physical Impulse
    let vx = dirX * horizSpeed;
    let vy = vertSpeed;
    let vz = dirZ * horizSpeed;

    try {
        if (J_Vec3) {
            player.setDeltaMovement(new J_Vec3(vx, vy, vz));
        } else if (typeof Vec3 !== 'undefined') {
            player.setDeltaMovement(new Vec3(vx, vy, vz));
        }
    } catch (eImp) {}

    // 4. Camera & Visual Feedback
    let isFirstPerson = mc.options.cameraType.isFirstPerson();

    if (isFirstPerson) {
        // First Person: Kinetic Camera Roll & Pitch Tilt (Roll 6 degrees, Pitch 4 degrees)
        cameraTargetRoll = (str !== 0) ? (str > 0 ? -6.0 : 6.0) : 0.0;
        cameraTargetPitch = (fwd < 0) ? -4.0 : 4.0;
        cameraFxStartTime = now;
        cameraFxDuration = 350;
        cameraFxActive = true;

        // Play sweep sound and spawn poof particles
        try {
            player.playSound('minecraft:entity.player.attack.sweep', 0.85, 1.25);
            if (Client && Client.level && typeof Client.level.addParticle === 'function') {
                Client.level.addParticle('minecraft:poof', player.x, player.y + 0.2, player.z, vx * 0.1, 0.02, vz * 0.1);
            }
        } catch (eFx) {}
    } else {
        // Third Person: Local 3D Skeletal Animation
        playLocalThirdPersonDodge(player, animSpeed);
    }

    // 5. Send Network Packet to Server
    try {
        player.sendData('elyrium:player_dodge', { dirX: dirX, dirZ: dirZ });
    } catch (eNet) {}
}

// ------------------------------------------------------------------------------
// CLIENT TICK: Double-Tap WASD (<350ms) and Alt Key Monitoring
// ------------------------------------------------------------------------------

ClientEvents.tick(event => {
    initClientDodgeApi();

    let mc = J_Minecraft ? J_Minecraft.getInstance() : null;
    if (!mc || !mc.player || mc.screen != null || mc.isPaused()) return;

    let now = Date.now();

    // Key states
    let isForwardDown = mc.options.keyUp.isDown();
    let isBackDown = mc.options.keyDown.isDown();
    let isLeftDown = mc.options.keyLeft.isDown();
    let isRightDown = mc.options.keyRight.isDown();

    // Check Alt key directly via GLFW (Key 342 = GLFW_KEY_LEFT_ALT)
    let isAltDown = false;
    try {
        if (J_GLFW && mc.getWindow && mc.getWindow()) {
            let handle = mc.getWindow().getWindow();
            if (handle) {
                isAltDown = (J_GLFW.glfwGetKey(handle, 342) === 1);
            }
        }
    } catch (eGlfw) {}

    // 1. Single-Press Alt Keybind Trigger
    if (isAltDown && !keyPrevStates.alt) {
        let fwd = 0;
        let str = 0;
        if (isForwardDown) fwd += 1;
        if (isBackDown) fwd -= 1;
        if (isLeftDown) str += 1;
        if (isRightDown) str -= 1;
        performClientDodge(fwd, str);
    }

    // 2. Double-Tap WASD Detection (<350ms)
    // Forward (W)
    if (isForwardDown && !keyPrevStates.forward) {
        if (now - lastTapTimes.forward < 350) {
            performClientDodge(1, 0);
            lastTapTimes.forward = 0;
        } else {
            lastTapTimes.forward = now;
        }
    }

    // Backward (S)
    if (isBackDown && !keyPrevStates.back) {
        if (now - lastTapTimes.back < 350) {
            performClientDodge(-1, 0);
            lastTapTimes.back = 0;
        } else {
            lastTapTimes.back = now;
        }
    }

    // Left (A)
    if (isLeftDown && !keyPrevStates.left) {
        if (now - lastTapTimes.left < 350) {
            performClientDodge(0, 1);
            lastTapTimes.left = 0;
        } else {
            lastTapTimes.left = now;
        }
    }

    // Right (D)
    if (isRightDown && !keyPrevStates.right) {
        if (now - lastTapTimes.right < 350) {
            performClientDodge(0, -1);
            lastTapTimes.right = 0;
        } else {
            lastTapTimes.right = now;
        }
    }

    // Update previous states
    keyPrevStates.forward = isForwardDown;
    keyPrevStates.back = isBackDown;
    keyPrevStates.left = isLeftDown;
    keyPrevStates.right = isRightDown;
    keyPrevStates.alt = isAltDown;
});

// ------------------------------------------------------------------------------
// KEYBIND EVENT LISTENER: 'elyrium.dodge'
// ------------------------------------------------------------------------------

try {
    if (typeof KeyBindEvents !== 'undefined' && KeyBindEvents.pressed) {
        KeyBindEvents.pressed('elyrium.dodge', event => {
            initClientDodgeApi();
            let mc = J_Minecraft ? J_Minecraft.getInstance() : null;
            if (!mc || !mc.player || mc.screen != null) return;

            let fwd = 0;
            let str = 0;
            if (mc.options.keyUp.isDown()) fwd += 1;
            if (mc.options.keyDown.isDown()) fwd -= 1;
            if (mc.options.keyLeft.isDown()) str += 1;
            if (mc.options.keyRight.isDown()) str -= 1;
            performClientDodge(fwd, str);
        });
    }
} catch (eKb) {}

// ------------------------------------------------------------------------------
// CAMERA VIEWPORT EVENT: Smooth First-Person Kinetic Roll & Pitch Tilt
// ------------------------------------------------------------------------------

try {
    initClientDodgeApi();
    if (J_ComputeCameraAngles && typeof NativeEvents !== 'undefined') {
        NativeEvents.onEvent(J_ComputeCameraAngles, event => {
            if (!cameraFxActive || cameraFxStartTime <= 0) return;

            let elapsed = Date.now() - cameraFxStartTime;
            if (elapsed >= cameraFxDuration) {
                cameraFxActive = false;
                cameraFxStartTime = 0;
                return;
            }

            // Smooth sine curve: starts at 0, peaks at middle, returns to 0
            let progress = elapsed / cameraFxDuration;
            let factor = Math.sin(progress * Math.PI);

            if (cameraTargetRoll !== 0.0) {
                event.setRoll(event.getRoll() + (cameraTargetRoll * factor));
            }
            if (cameraTargetPitch !== 0.0) {
                event.setPitch(event.getPitch() + (cameraTargetPitch * factor));
            }
        });
    }
} catch (eCamEvent) {}
