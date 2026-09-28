// ==============================================================================
// ⚔️ ELYRIUM RPG: WEAPON ARTS COMBAT KEYBINDS [Z] & [X] (CLIENT SCRIPT)
// Minecraft 1.21.1 NeoForge | KubeJS Client Script
// ==============================================================================
// Binds secondary and tertiary weapon arts to dedicated keys:
// - [Z] Key (GLFW 90): Triggers Slot 2 (Secondary Art / Spell)
// - [X] Key (GLFW 88): Triggers Slot 3 (Tertiary High-Tier Art)
// Preserves vanilla Minecraft quick-access hotbar slots 1–9 completely intact!
// ==============================================================================

let J_GLFW_ARTS = null;
let J_MC_ARTS = null;

function initArtsClientApi() {
    if (!J_GLFW_ARTS) {
        try { J_GLFW_ARTS = Java.loadClass('org.lwjgl.glfw.GLFW'); } catch (e) {}
    }
    if (!J_MC_ARTS) {
        try { J_MC_ARTS = Java.loadClass('net.minecraft.client.Minecraft'); } catch (e) {}
    }
}

let artsKeyPrev = {
    z: false,
    x: false
};

let lastArtKeySend = 0;

ClientEvents.tick(event => {
    initArtsClientApi();

    let mc = J_MC_ARTS ? J_MC_ARTS.getInstance() : null;
    if (!mc || !mc.player || mc.screen != null || mc.isPaused()) {
        artsKeyPrev.z = false;
        artsKeyPrev.x = false;
        return;
    }

    let windowHandle = 0;
    try {
        if (mc.getWindow && mc.getWindow()) {
            windowHandle = mc.getWindow().getWindow();
        }
    } catch (eWin) {}

    if (!windowHandle || !J_GLFW_ARTS) return;

    let now = Date.now();
    let isZDown = (J_GLFW_ARTS.glfwGetKey(windowHandle, 90) === 1); // 90 = GLFW_KEY_Z
    let isXDown = (J_GLFW_ARTS.glfwGetKey(windowHandle, 88) === 1); // 88 = GLFW_KEY_X

    // 1. Trigger Slot 2 on [Z] key press
    if (isZDown && !artsKeyPrev.z) {
        if (now - lastArtKeySend >= 250) {
            lastArtKeySend = now;
            try {
                mc.player.sendData('elyrium:trigger_weapon_art', { slot: 2 });
            } catch (eNet) {}
        }
    }
    artsKeyPrev.z = isZDown;

    // 2. Trigger Slot 3 on [X] key press
    if (isXDown && !artsKeyPrev.x) {
        if (now - lastArtKeySend >= 250) {
            lastArtKeySend = now;
            try {
                mc.player.sendData('elyrium:trigger_weapon_art', { slot: 3 });
            } catch (eNet) {}
        }
    }
    artsKeyPrev.x = isXDown;
});
