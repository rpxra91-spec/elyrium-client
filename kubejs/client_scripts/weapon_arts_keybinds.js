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
let J_MC_BC = null;
let J_PlayerAttackAnimatable = null;
let J_Integer_ARTS = null;
let J_Float_ARTS = null;

function initArtsClientApi() {
    if (!J_GLFW_ARTS) {
        try { J_GLFW_ARTS = Java.loadClass('org.lwjgl.glfw.GLFW'); } catch (e) {}
    }
    if (!J_MC_ARTS) {
        try { J_MC_ARTS = Java.loadClass('net.minecraft.client.Minecraft'); } catch (e) {}
    }
    if (!J_MC_BC) {
        try { J_MC_BC = Java.loadClass('net.bettercombat.api.MinecraftClient_BetterCombat'); } catch (e) {}
    }
    if (!J_PlayerAttackAnimatable) {
        try { J_PlayerAttackAnimatable = Java.loadClass('net.bettercombat.client.animation.PlayerAttackAnimatable'); } catch (e) {}
    }
    if (!J_Integer_ARTS) {
        try { J_Integer_ARTS = Java.loadClass('java.lang.Integer'); } catch (e) {}
    }
    if (!J_Float_ARTS) {
        try { J_Float_ARTS = Java.loadClass('java.lang.Float'); } catch (e) {}
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

    // Helper to immediately suppress Minecraft & Better Combat attacks
    function suppressCombatAttack() {
        try {
            if (mc.options && mc.options.keyAttack) {
                mc.options.keyAttack.setDown(false);
                while (mc.options.keyAttack.consumeClick()) {}
            }
        } catch (eOpt) {}
        try { mc.missTime = 10; } catch (eMiss) {}
        try {
            if (typeof mc.cancelUpswing === 'function') {
                mc.cancelUpswing();
            } else if (J_MC_BC) {
                try {
                    let m = J_MC_BC.getMethod('cancelUpswing');
                    if (m) m.invoke(mc);
                } catch (eInv) {
                    try { J_MC_BC.cast(mc).cancelUpswing(); } catch (eC) {}
                }
            }
        } catch (eBc1) {}
        try {
            if (typeof mc.player.stopAttackAnimation === 'function') {
                mc.player.stopAttackAnimation(0);
            }
        } catch (eStop1) {}
        try {
            if (J_PlayerAttackAnimatable) {
                let zeroFloat = J_Float_ARTS ? J_Float_ARTS.valueOf(0.0) : 0.0;
                for (let m of J_PlayerAttackAnimatable.getMethods()) {
                    if (m.getName() === 'stopAttackAnimation') {
                        let params = m.getParameterTypes();
                        if (params.length === 0) {
                            m.invoke(mc.player);
                        } else if (params.length === 1) {
                            m.invoke(mc.player, zeroFloat);
                        }
                    }
                }
            }
        } catch (eBc2) {}
    }

    // 1. Trigger Slot 2 on [Z] key press
    if (isZDown && !artsKeyPrev.z) {
        if (now - lastArtKeySend >= 250) {
            lastArtKeySend = now;
            suppressCombatAttack();
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
            suppressCombatAttack();
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

    if (isAttackDown) {
        let offHand = mc.player.getOffhandItem ? mc.player.getOffhandItem() : mc.player.offHandItem;
        let mainHand = mc.player.getMainHandItem ? mc.player.getMainHandItem() : mc.player.mainHandItem;
        let isShield = false;
        let checkShieldItem = function(stack) {
            if (!stack || stack.isEmpty()) return false;
            let id = String(stack.getItem ? stack.getItem().toString() : (stack.id || '')).toLowerCase();
            if (id.includes('shield')) return true;
            try {
                if (stack.hasTag && (stack.hasTag('c:tools/shields') || stack.hasTag('minecraft:shields') || stack.hasTag('c:shields'))) return true;
            } catch (eT) {}
            return false;
        };
        if (checkShieldItem(offHand) || checkShieldItem(mainHand)) {
            isShield = true;
        }

        if (isShield) {
            let isBlocking = false;
            try {
                if (mc.player.isBlocking && mc.player.isBlocking()) {
                    isBlocking = true;
                } else if (mc.player.isUsingItem && mc.player.isUsingItem()) {
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
                } else if (mc.player.isShiftKeyDown && mc.player.isShiftKeyDown()) {
                    isCrouching = true;
                } else if (mc.options && mc.options.keyShift && mc.options.keyShift.isDown()) {
                    isCrouching = true;
                } else if (mc.options && mc.options.keySneak && mc.options.keySneak.isDown()) {
                    isCrouching = true;
                } else if (J_GLFW_ARTS.glfwGetKey(windowHandle, 340) === 1 || J_GLFW_ARTS.glfwGetKey(windowHandle, 344) === 1) {
                    isCrouching = true;
                }
            } catch (eCrch) {}

            // Unconditionally suppress Better Combat / Vanilla attack when blocking or crouching with shield
            if (isBlocking || isCrouching) {
                suppressCombatAttack();
            }

            if (!artsKeyPrev.attack) {
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
    }
    artsKeyPrev.attack = isAttackDown;
});
