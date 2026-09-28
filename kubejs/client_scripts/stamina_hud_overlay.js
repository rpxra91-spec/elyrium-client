// ==============================================================================
// ⚡ ELYRIUM RPG: NATIVE STAMINA HUD OVERLAY (v1.0)
// Minecraft 1.21.1 NeoForge | KubeJS Client Script
// ==============================================================================
// 1. Subscribes to net.neoforged.neoforge.client.event.RenderGuiEvent$Post
// 2. Positions above health hearts / armor icons:
//    X = Math.floor(screenWidth / 2) - 91
//    Y = screenHeight - (hasArmor ? 59 : 49)
// 3. Styling & Dimensions:
//    - Dimensions: 81 x 6 px
//    - Outer Border (1px): Graphite #1F2937 (0xFF1F2937)
//    - Inner Background (79x4): Semi-transparent #111827 (0xCC111827, 80% opacity)
//    - Bar: Amber gradient #F59E0B -> #D97706 (0xFFF59E0B -> 0xFFD97706)
//    - Text: ⚡ [cur]/[max] centered inside bar (scaled 0.7x via PoseStack)
// 4. Zero-Latency Network Sync: listens to 'elyrium:sync_stamina'
// ==============================================================================

let J_Minecraft = null;
let J_RenderGuiEventPost = null;
let J_NeoForge = null;
let J_Consumer = null;
let isStaminaHudApiLoaded = false;
let isRenderListenerRegistered = false;

function initStaminaHudApi() {
    if (isStaminaHudApiLoaded) return;
    try {
        J_Minecraft = Java.loadClass('net.minecraft.client.Minecraft');
    } catch (e) {}
    try {
        J_RenderGuiEventPost = Java.loadClass('net.neoforged.neoforge.client.event.RenderGuiEvent$Post');
    } catch (e) {}
    try {
        J_NeoForge = Java.loadClass('net.neoforged.neoforge.common.NeoForge');
        J_Consumer = Java.loadClass('java.util.function.Consumer');
    } catch (e) {}
    isStaminaHudApiLoaded = true;
}

// Client-side stamina state
let clientStamina = 100;
let clientMaxStamina = 100;
let displayedStamina = 100;
let isInitialSync = true;

// API export for other client scripts
var ElyriumClientStamina = {
    get current() { return clientStamina; },
    get max() { return clientMaxStamina; },
    consume: function(amount) {
        clientStamina = Math.max(0, clientStamina - amount);
    },
    sync: function(cur, max) {
        if (typeof cur === 'number') clientStamina = cur;
        if (typeof max === 'number' && max > 0) clientMaxStamina = max;
    }
};

// ------------------------------------------------------------------------------
// 1. NETWORK RECEIVER: 'elyrium:sync_stamina'
// ------------------------------------------------------------------------------
NetworkEvents.dataReceived('elyrium:sync_stamina', event => {
    let data = event.data;
    if (!data) return;

    let stam = (typeof data.stamina === 'number') ? data.stamina : 
               (data.getInt ? data.getInt('stamina') : null);
    let max = (typeof data.maxStamina === 'number') ? data.maxStamina : 
              (data.getInt ? data.getInt('maxStamina') : null);

    if (stam != null) {
        clientStamina = stam;
        if (isInitialSync) {
            displayedStamina = stam;
        }
    }
    if (max != null && max > 0) {
        clientMaxStamina = max;
    }
    isInitialSync = false;
});

// ------------------------------------------------------------------------------
// 2. HUD RENDER ROUTINE
// ------------------------------------------------------------------------------
function renderStaminaBar(guiGraphics) {
    if (!guiGraphics) return;
    initStaminaHudApi();

    let mc = J_Minecraft ? J_Minecraft.getInstance() : null;
    if (!mc || !mc.player || !mc.player.isAlive()) return;
    if (mc.options.hideGui) return;
    if (mc.player.isCreative() || mc.player.isSpectator()) return;
    if (mc.screen != null) return;

    // Screen dimensions
    let screenWidth = guiGraphics.guiWidth ? guiGraphics.guiWidth() : mc.getWindow().getGuiScaledWidth();
    let screenHeight = guiGraphics.guiHeight ? guiGraphics.guiHeight() : mc.getWindow().getGuiScaledHeight();

    // Armor check: checks if player has any armor points (which causes vanilla armor bar to render)
    let hasArmor = false;
    try {
        if (typeof mc.player.getArmorValue === 'function') {
            hasArmor = mc.player.getArmorValue() > 0;
        } else if (typeof mc.player.armorValue === 'number') {
            hasArmor = mc.player.armorValue > 0;
        }
    } catch (eArmor) {}

    // Coordinates calculation
    const BAR_WIDTH = 81;
    const BAR_HEIGHT = 6;
    let x = Math.floor(screenWidth / 2) - 91;
    let y = screenHeight - (hasArmor ? 59 : 49);

    // Smooth animation interpolation towards actual stamina
    displayedStamina += (clientStamina - displayedStamina) * 0.35;
    if (Math.abs(clientStamina - displayedStamina) < 0.2) {
        displayedStamina = clientStamina;
    }

    let progress = Math.max(0.0, Math.min(1.0, displayedStamina / Math.max(1, clientMaxStamina)));
    let innerWidth = BAR_WIDTH - 2; // 79 px
    let fillWidth = Math.round(innerWidth * progress);

    // Colors (ARGB)
    const COLOR_BORDER = 0xFF1F2937;     // Graphite #1F2937
    const COLOR_BG = 0xCC111827;         // Semi-transparent #111827 (80% opacity)
    const COLOR_AMBER_TOP = 0xFFF59E0B;  // Amber Gradient Start #F59E0B
    const COLOR_AMBER_BOT = 0xFFD97706;  // Amber Gradient End #D97706
    const COLOR_TEXT = 0xFFFFFFFF;       // Crisp White with drop shadow

    // 1. Draw 1px Outer Border (81 x 6)
    guiGraphics.fill(x, y, x + BAR_WIDTH, y + BAR_HEIGHT, COLOR_BORDER);

    // 2. Draw Inner Background (79 x 4)
    guiGraphics.fill(x + 1, y + 1, x + BAR_WIDTH - 1, y + BAR_HEIGHT - 1, COLOR_BG);

    // 3. Draw Amber Gradient Stamina Bar
    if (fillWidth > 0) {
        try {
            guiGraphics.fillGradient(x + 1, y + 1, x + 1 + fillWidth, y + BAR_HEIGHT - 1, 0, COLOR_AMBER_TOP, COLOR_AMBER_BOT);
        } catch (eGrad) {
            guiGraphics.fill(x + 1, y + 1, x + 1 + fillWidth, y + BAR_HEIGHT - 1, COLOR_AMBER_TOP);
        }
    }

    // 4. Draw Centered Text: ⚡ [cur]/[max]
    let curInt = Math.max(0, Math.round(displayedStamina));
    let maxInt = Math.round(clientMaxStamina);
    let text = `⚡ ${curInt}/${maxInt}`;

    let font = mc.font;
    if (font) {
        let textWidth = font.width(text);
        let pose = guiGraphics.pose ? guiGraphics.pose() : null;

        if (pose) {
            // Elegant 0.7x scale to nest smoothly inside the 6px bar
            const SCALE = 0.7;
            pose.pushPose();
            pose.scale(SCALE, SCALE, 1.0);

            let scaledX = (x + (BAR_WIDTH - textWidth * SCALE) / 2) / SCALE;
            let scaledY = (y + (BAR_HEIGHT - 7.5 * SCALE) / 2) / SCALE;

            guiGraphics.drawString(font, text, Math.round(scaledX), Math.round(scaledY), COLOR_TEXT, true);
            pose.popPose();
        } else {
            // Fallback unscaled drawing
            let textX = x + Math.round((BAR_WIDTH - textWidth) / 2);
            let textY = y - 1;
            guiGraphics.drawString(font, text, textX, textY, COLOR_TEXT, true);
        }
    }
}

// ------------------------------------------------------------------------------
// 3. EVENT REGISTRATION (NativeEvents with NeoForge.EVENT_BUS Fallback)
// ------------------------------------------------------------------------------
try {
    initStaminaHudApi();

    if (J_RenderGuiEventPost && !isRenderListenerRegistered) {
        if (typeof NativeEvents !== 'undefined') {
            NativeEvents.onEvent(J_RenderGuiEventPost, event => {
                if (event) {
                    let guiGraphics = event.getGuiGraphics ? event.getGuiGraphics() : event.guiGraphics;
                    if (guiGraphics) {
                        renderStaminaBar(guiGraphics);
                    }
                }
            });
            isRenderListenerRegistered = true;
        } else if (J_NeoForge && J_Consumer) {
            let renderListener = new J_Consumer({
                accept: function(event) {
                    if (event) {
                        let guiGraphics = event.getGuiGraphics ? event.getGuiGraphics() : event.guiGraphics;
                        if (guiGraphics) {
                            renderStaminaBar(guiGraphics);
                        }
                    }
                }
            });
            J_NeoForge.EVENT_BUS['addListener(java.lang.Class,java.util.function.Consumer)'](J_RenderGuiEventPost, renderListener);
            isRenderListenerRegistered = true;
        }
    }
} catch (eReg) {
    console.error('[Stamina HUD] Failed to register RenderGuiEvent listener: ' + eReg);
}
