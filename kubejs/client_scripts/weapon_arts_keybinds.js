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
    x: false,
    attack: false
};

let lastArtKeySend = 0;

ClientEvents.tick(event => {
    initArtsClientApi();

    let mc = J_MC_ARTS ? J_MC_ARTS.getInstance() : null;
    if (!mc || !mc.player || mc.screen != null || mc.isPaused()) {
        artsKeyPrev.z = false;
        artsKeyPrev.x = false;
        artsKeyPrev.attack = false;
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

    // 3. Shield Combat Combinations on Left-Click (LMB):
    //    - Shield Raised (RMB) + Left-Click (LMB) -> Shield Bash!
    //    - Shield in Offhand + Shift (Crouch) + Left-Click (LMB) -> Innate Weapon Art!
    let isAttackDown = false;
    try {
        if (mc.options && mc.options.keyAttack && mc.options.keyAttack.isDown()) {
            isAttackDown = true;
        } else if (J_GLFW_ARTS.glfwGetMouseButton(windowHandle, 0) === 1) {
            isAttackDown = true;
        }
    } catch (eAtt) {}

    if (isAttackDown && !artsKeyPrev.attack) {
        let offHand = mc.player.getOffhandItem ? mc.player.getOffhandItem() : mc.player.offHandItem;
        let isShield = false;
        if (offHand && !offHand.isEmpty()) {
            let itemId = String(offHand.getItem ? offHand.getItem().toString() : offHand.id).toLowerCase();
            if (itemId.includes('shield')) {
                isShield = true;
            }
        }

        if (isShield) {
            let isBlocking = false;
            try {
                if (mc.player.isBlocking && mc.player.isBlocking()) {
                    isBlocking = true;
                } else if (mc.options && mc.options.keyUse && mc.options.keyUse.isDown()) {
                    isBlocking = true;
                } else if (J_GLFW_ARTS.glfwGetMouseButton(windowHandle, 1) === 1) {
                    isBlocking = true;
                }
            } catch (eBlk) {}

            let isCrouching = false;
            try {
                if (mc.player.isCrouching && mc.player.isCrouching()) {
                    isCrouching = true;
                } else if (mc.options && mc.options.keyShift && mc.options.keyShift.isDown()) {
                    isCrouching = true;
                }
            } catch (eCrch) {}

            // Combination 1: Shield Raised + LMB -> Shield Bash
            if (isBlocking) {
                if (now - lastArtKeySend >= 250) {
                    lastArtKeySend = now;
                    try {
                        mc.player.sendData('elyrium:trigger_weapon_art', { action: 'shield_bash' });
                    } catch (eNet) {}
                }
            }
            // Combination 2: Holding Shield + Shift + LMB -> Main Hand Innate Art
            else if (isCrouching) {
                if (now - lastArtKeySend >= 250) {
                    lastArtKeySend = now;
                    try {
                        mc.player.sendData('elyrium:trigger_weapon_art', { action: 'innate_art' });
                    } catch (eNet) {}
                }
            }
        }
    }
    artsKeyPrev.attack = isAttackDown;
});
