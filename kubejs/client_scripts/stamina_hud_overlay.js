// ==============================================================================
// ⚔️ ELYRIUM RPG: UNIFIED CLASSIC RPG HUD (HEALTH, HUNGER, SATURATION, STAMINA)
// Minecraft 1.21.1 NeoForge | KubeJS Client Script (v2.1)
// ==============================================================================
// 1. Suppresses vanilla hearts and chicken drumsticks via RenderGuiLayerEvent$Pre:
//    - VanillaGuiLayers.PLAYER_HEALTH
//    - VanillaGuiLayers.FOOD_LEVEL
// 2. Renders clean, modern, symmetrical RPG status bars:
//    - LEFT SIDE:
//      * Health Bar (81x7 px, Ruby Red, Damage Lag-Trail, Absorption Shield)
//      * Stamina Bar (81x6 px, Amber Gold, Permanent 100% visible, Shield Block Aura)
//    - RIGHT SIDE:
//      * Hunger & Saturation Bar (81x7 px, Caramel Orange with Golden Saturation Overlay)
// 3. NeoForge 1.21.1 Compatible: uses RenderType.gui(), 5-arg drawString, and safeFill fallbacks.
// 4. Zero-Latency Network Sync: listens to 'elyrium:sync_stamina'
// ==============================================================================

let J_Minecraft = null;
let J_RenderGuiEventPost = null;
let J_RenderGuiLayerEventPre = null;
let J_VanillaGuiLayers = null;
let J_RenderType = null;
let J_NeoForge = null;
let J_Consumer = null;
let isStaminaHudApiLoaded = false;
let isRenderListenerRegistered = false;
let isLayerListenerRegistered = false;

function initStaminaHudApi() {
    if (isStaminaHudApiLoaded) return;
    try {
        J_Minecraft = Java.loadClass('net.minecraft.client.Minecraft');
    } catch (e) {}
    try {
        J_RenderGuiEventPost = Java.loadClass('net.neoforged.neoforge.client.event.RenderGuiEvent$Post');
    } catch (e) {}
    try {
        J_RenderGuiLayerEventPre = Java.loadClass('net.neoforged.neoforge.client.event.RenderGuiLayerEvent$Pre');
    } catch (e) {}
    try {
        J_VanillaGuiLayers = Java.loadClass('net.neoforged.neoforge.client.gui.VanillaGuiLayers');
    } catch (e) {}
    try {
        J_RenderType = Java.loadClass('net.minecraft.client.renderer.RenderType');
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

// Client-side health lag-trail state
let displayedHealth = 20;
let lagHealth = 20;
let lastDamageTime = 0;

// Render de-duplication per frame
let lastRenderedTick = -1;

// HUD Geometry Constants (top-level declaration prevents Rhino function-scope redeclaration errors)
var BAR_WIDTH = 81;
var HP_BAR_HEIGHT = 7;
var STAM_BAR_HEIGHT = 6;
var FOOD_BAR_HEIGHT = 7;
var SCALE_HP = 0.72;
var SCALE_STAM = 0.65;
var SCALE_FOOD = 0.72;

// HUD Color Palette (ARGB 32-bit signed integers)
var COLOR_BORDER = (0xFF1F2937 | 0);       // Dark Slate #1F2937
var COLOR_BG = (0xCC111827 | 0);           // Deep Graphite 80% opacity #111827
var COLOR_TEXT = (0xFFFFFFFF | 0);         // Crisp White
var COLOR_LAG = (0xFFFECACA | 0);          // Light Red Damage Lag-Trail
var COLOR_HP_TOP = (0xFFEF4444 | 0);       // Red #EF4444
var COLOR_HP_BOT = (0xFF991B1B | 0);       // Crimson #991B1B
var COLOR_ABS_TOP = (0xCCFBBF24 | 0);      // Amber Gold Absorption Shield
var COLOR_ABS_BOT = (0xCCD97706 | 0);
var COLOR_AMBER_TOP = (0xFFF59E0B | 0);    // Amber #F59E0B
var COLOR_AMBER_BOT = (0xFFB45309 | 0);    // Bronze Amber #B45309
var COLOR_STAM_BLOCK = (0xFF06B6D4 | 0);   // Cyan glow on block
var COLOR_FOOD_TOP = (0xFFFB923C | 0);     // Orange #FB923C
var COLOR_FOOD_BOT = (0xFFC2410C | 0);     // Dark Orange #C2410C
var COLOR_SAT_TOP = (0xAAFACC15 | 0);      // Golden Saturation Overlay
var COLOR_SAT_BOT = (0xAAEAB308 | 0);

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
    try {
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
    } catch (eNet) {}
});

// ------------------------------------------------------------------------------
// 2. SAFE RENDERING PRIMITIVES (NeoForge 1.21.1 Compatible)
// ------------------------------------------------------------------------------
function safeFill(guiGraphics, x1, y1, x2, y2, color) {
    if (!guiGraphics) return;
    let ix1 = x1 | 0;
    let iy1 = y1 | 0;
    let ix2 = x2 | 0;
    let iy2 = y2 | 0;
    let icol = color | 0;

    // 1. Try 1.21.1 RenderType.gui()
    if (J_RenderType) {
        try {
            let rType = J_RenderType.gui ? J_RenderType.gui() : null;
            if (rType) {
                guiGraphics.fill(rType, ix1, iy1, ix2, iy2, icol);
                return;
            }
        } catch (e1) {}
    }
    // 2. Try fillGradient(x1, y1, x2, y2, 0, color, color)
    try {
        guiGraphics.fillGradient(ix1, iy1, ix2, iy2, 0, icol, icol);
        return;
    } catch (e2) {}
    // 3. Try legacy 5-arg fill
    try {
        guiGraphics.fill(ix1, iy1, ix2, iy2, icol);
    } catch (e3) {}
}

function safeFillGradient(guiGraphics, x1, y1, x2, y2, colorFrom, colorTo) {
    if (!guiGraphics) return;
    let ix1 = x1 | 0;
    let iy1 = y1 | 0;
    let ix2 = x2 | 0;
    let iy2 = y2 | 0;
    let colFrom = colorFrom | 0;
    let colTo = colorTo | 0;

    if (J_RenderType) {
        try {
            let rType = J_RenderType.gui ? J_RenderType.gui() : null;
            if (rType) {
                guiGraphics.fillGradient(rType, ix1, iy1, ix2, iy2, 0, colFrom, colTo);
                return;
            }
        } catch (e1) {}
    }
    try {
        guiGraphics.fillGradient(ix1, iy1, ix2, iy2, 0, colFrom, colTo);
        return;
    } catch (e2) {}
    safeFill(guiGraphics, ix1, iy1, ix2, iy2, colFrom);
}

function safeDrawString(guiGraphics, font, text, x, y, color) {
    if (!guiGraphics || !font) return;
    let ix = Math.round(x);
    let iy = Math.round(y);
    let icol = color | 0;
    let str = String(text);

    // 1. Try 1.21.1 5-arg drawString(font, text, x, y, color)
    try {
        guiGraphics.drawString(font, str, ix, iy, icol);
        return;
    } catch (e1) {}
    // 2. Try legacy 6-arg drawString(font, text, x, y, color, dropShadow)
    try {
        guiGraphics.drawString(font, str, ix, iy, icol, true);
    } catch (e2) {}
}

// ------------------------------------------------------------------------------
// 3. MASTER HUD RENDER ROUTINE: UNIFIED RPG BARS
// ------------------------------------------------------------------------------
function renderMasterRpgHud(guiGraphics) {
    if (!guiGraphics) return;
    try {
        initStaminaHudApi();

        let mc = J_Minecraft ? J_Minecraft.getInstance() : null;
        if (!mc || !mc.player || !mc.player.isAlive()) return;
        if (mc.options.hideGui) return;
        if (mc.player.isCreative() || mc.player.isSpectator()) return;
        if (mc.screen != null) return;

        let player = mc.player;
        let window = mc.getWindow();
        let screenWidth = window ? window.getGuiScaledWidth() : (guiGraphics.guiWidth ? guiGraphics.guiWidth() : 400);
        let screenHeight = window ? window.getGuiScaledHeight() : (guiGraphics.guiHeight ? guiGraphics.guiHeight() : 300);

        let midX = Math.floor(screenWidth / 2);
        let leftX = midX - 91;
        let rightX = midX + 10;
        let bottomY = screenHeight - 39;

        let font = mc.font;
        let pose = guiGraphics.pose ? guiGraphics.pose() : null;

        // ----------------------------------------------------------------------
        // A. HEALTH BAR (Left Side, Bottom Row: y = bottomY)
        // ----------------------------------------------------------------------
        let curHealth = player.getHealth ? player.getHealth() : (player.health || 20);
        let maxHealth = player.getMaxHealth ? player.getMaxHealth() : (player.maxHealth || 20);
        let absorption = player.getAbsorptionAmount ? player.getAbsorptionAmount() : (player.absorptionAmount || 0);

        // Track lag-trail for damage
        if (curHealth < displayedHealth) {
            lastDamageTime = Date.now();
        }
        displayedHealth += (curHealth - displayedHealth) * 0.30;
        if (Math.abs(curHealth - displayedHealth) < 0.1) displayedHealth = curHealth;

        if (Date.now() - lastDamageTime > 600) {
            lagHealth += (curHealth - lagHealth) * 0.15;
            if (Math.abs(curHealth - lagHealth) < 0.1) lagHealth = curHealth;
        }

        let hpProgress = Math.max(0.0, Math.min(1.0, displayedHealth / Math.max(1, maxHealth)));
        let lagProgress = Math.max(0.0, Math.min(1.0, lagHealth / Math.max(1, maxHealth)));
        let innerWidth = BAR_WIDTH - 2;
        let hpFillWidth = Math.round(innerWidth * hpProgress);
        let lagFillWidth = Math.round(innerWidth * lagProgress);

        let hpY = bottomY;

        // 1. Outer Border
        safeFill(guiGraphics, leftX, hpY, leftX + BAR_WIDTH, hpY + HP_BAR_HEIGHT, COLOR_BORDER);
        // 2. Background
        safeFill(guiGraphics, leftX + 1, hpY + 1, leftX + BAR_WIDTH - 1, hpY + HP_BAR_HEIGHT - 1, COLOR_BG);

        // 3. Damage Lag-Trail (Light Red)
        if (lagFillWidth > hpFillWidth) {
            safeFill(guiGraphics, leftX + 1 + hpFillWidth, hpY + 1, leftX + 1 + lagFillWidth, hpY + HP_BAR_HEIGHT - 1, COLOR_LAG);
        }

        // 4. Ruby Red Health Gradient
        if (hpFillWidth > 0) {
            safeFillGradient(guiGraphics, leftX + 1, hpY + 1, leftX + 1 + hpFillWidth, hpY + HP_BAR_HEIGHT - 1, COLOR_HP_TOP, COLOR_HP_BOT);
        }

        // 5. Golden Absorption Shield Overlay
        if (absorption > 0.1) {
            let absProgress = Math.max(0.0, Math.min(1.0, absorption / Math.max(1, maxHealth)));
            let absFillWidth = Math.round(innerWidth * absProgress);
            safeFillGradient(guiGraphics, leftX + 1, hpY + 1, leftX + 1 + absFillWidth, hpY + HP_BAR_HEIGHT - 1, COLOR_ABS_TOP, COLOR_ABS_BOT);
        }

        // 6. Text: ♥ [cur] / [max]
        let hpText = `♥ ${Math.ceil(curHealth)}/${Math.ceil(maxHealth)}` + (absorption > 0.1 ? ` (+${Math.ceil(absorption)})` : '');
        if (font && pose) {
            let tw = font.width(hpText);
            pose.pushPose();
            pose.scale(SCALE_HP, SCALE_HP, 1.0);
            let tx = (leftX + (BAR_WIDTH - tw * SCALE_HP) / 2) / SCALE_HP;
            let ty = (hpY + (HP_BAR_HEIGHT - 7.5 * SCALE_HP) / 2) / SCALE_HP;
            safeDrawString(guiGraphics, font, hpText, tx, ty, COLOR_TEXT);
            pose.popPose();
        }

        // ----------------------------------------------------------------------
        // B. PERMANENT STAMINA BAR (Left Side, Top Row: y = bottomY - 9)
        // ----------------------------------------------------------------------
        let stamY = bottomY - 9;
        displayedStamina += (clientStamina - displayedStamina) * 0.35;
        if (Math.abs(clientStamina - displayedStamina) < 0.1) displayedStamina = clientStamina;

        let maxStam = Math.max(1, clientMaxStamina);
        let stamProgress = Math.max(0.0, Math.min(1.0, displayedStamina / maxStam));
        let stamFillWidth = Math.round(innerWidth * stamProgress);

        let isBlocking = player.isBlocking ? player.isBlocking() : false;
        let currentStamBorder = isBlocking ? COLOR_STAM_BLOCK : COLOR_BORDER; // Cyan glow on block

        // 1. Outer Border
        safeFill(guiGraphics, leftX, stamY, leftX + BAR_WIDTH, stamY + STAM_BAR_HEIGHT, currentStamBorder);
        // 2. Background
        safeFill(guiGraphics, leftX + 1, stamY + 1, leftX + BAR_WIDTH - 1, stamY + STAM_BAR_HEIGHT - 1, COLOR_BG);

        // 3. Stamina Gradient (Amber / Emerald Gold)
        if (stamFillWidth > 0) {
            safeFillGradient(guiGraphics, leftX + 1, stamY + 1, leftX + 1 + stamFillWidth, stamY + STAM_BAR_HEIGHT - 1, COLOR_AMBER_TOP, COLOR_AMBER_BOT);
        }

        // 4. Text: ⚡ [stam] / [max]
        let stamText = `⚡ ${Math.round(clientStamina)}/${Math.round(maxStam)}`;
        if (font && pose) {
            let tw = font.width(stamText);
            pose.pushPose();
            pose.scale(SCALE_STAM, SCALE_STAM, 1.0);
            let tx = (leftX + (BAR_WIDTH - tw * SCALE_STAM) / 2) / SCALE_STAM;
            let ty = (stamY + (STAM_BAR_HEIGHT - 7.5 * SCALE_STAM) / 2) / SCALE_STAM;
            safeDrawString(guiGraphics, font, stamText, tx, ty, COLOR_TEXT);
            pose.popPose();
        }

        // ----------------------------------------------------------------------
        // C. HUNGER & SATURATION BAR (Right Side, Bottom Row: y = bottomY)
        // ----------------------------------------------------------------------
        let foodData = player.getFoodData ? player.getFoodData() : null;
        let foodLevel = foodData ? (foodData.getFoodLevel ? foodData.getFoodLevel() : 20) : 20;
        let saturation = foodData ? (foodData.getSaturationLevel ? foodData.getSaturationLevel() : 5) : 5;

        let foodProgress = Math.max(0.0, Math.min(1.0, foodLevel / 20.0));
        let foodFillWidth = Math.round(innerWidth * foodProgress);

        let foodY = bottomY;

        // 1. Outer Border
        safeFill(guiGraphics, rightX, foodY, rightX + BAR_WIDTH, foodY + FOOD_BAR_HEIGHT, COLOR_BORDER);
        // 2. Background
        safeFill(guiGraphics, rightX + 1, foodY + 1, rightX + BAR_WIDTH - 1, foodY + FOOD_BAR_HEIGHT - 1, COLOR_BG);

        // 3. Caramel Orange Food Bar
        if (foodFillWidth > 0) {
            safeFillGradient(guiGraphics, rightX + 1, foodY + 1, rightX + 1 + foodFillWidth, foodY + FOOD_BAR_HEIGHT - 1, COLOR_FOOD_TOP, COLOR_FOOD_BOT);
        }

        // 4. Glowing Golden Saturation Overlay
        if (saturation > 0.1) {
            let satProgress = Math.max(0.0, Math.min(1.0, saturation / 20.0));
            let satFillWidth = Math.round(innerWidth * satProgress);
            safeFillGradient(guiGraphics, rightX + 1, foodY + 1, rightX + 1 + satFillWidth, foodY + FOOD_BAR_HEIGHT - 1, COLOR_SAT_TOP, COLOR_SAT_BOT);
        }

        // 5. Text: 🍗 [food]/20 (+[sat])
        let satFormatted = (saturation > 0.05) ? saturation.toFixed(1) : '0';
        let foodText = `🍗 ${foodLevel}/20` + (saturation > 0.05 ? ` (+${satFormatted})` : '');

        if (font && pose) {
            let tw = font.width(foodText);
            pose.pushPose();
            pose.scale(SCALE_FOOD, SCALE_FOOD, 1.0);
            let tx = (rightX + (BAR_WIDTH - tw * SCALE_FOOD) / 2) / SCALE_FOOD;
            let ty = (foodY + (FOOD_BAR_HEIGHT - 7.5 * SCALE_FOOD) / 2) / SCALE_FOOD;
            safeDrawString(guiGraphics, font, foodText, tx, ty, COLOR_TEXT);
            pose.popPose();
        }

    } catch (eHud) {
        try {
            console.error('[Elyrium HUD Render Error]: ' + eHud);
        } catch (eLog) {}
    }
}

// ------------------------------------------------------------------------------
// 4. REGISTRATION: Layer Suppression & Master HUD Render
// ------------------------------------------------------------------------------
function handleLayerPre(event) {
    if (!event) return;
    try {
        let name = event.getName ? event.getName() : null;
        if (!name || !J_VanillaGuiLayers) return;

        // Cancel vanilla player hearts AND render custom HUD
        if (name.equals(J_VanillaGuiLayers.PLAYER_HEALTH)) {
            event.setCanceled(true);
            let gg = event.getGuiGraphics ? event.getGuiGraphics() : event.guiGraphics;
            if (gg) {
                renderMasterRpgHud(gg);
            }
            return;
        }
        // Cancel vanilla food / hunger drumsticks
        if (name.equals(J_VanillaGuiLayers.FOOD_LEVEL)) {
            event.setCanceled(true);
            return;
        }
    } catch (eLayer) {
        try { console.error('[Elyrium Layer Error]: ' + eLayer); } catch (eL) {}
    }
}

try {
    initStaminaHudApi();

    // 1. Layer Pre Listener (Suppress Hearts and Drumsticks + render custom HUD)
    if (J_RenderGuiLayerEventPre && !isLayerListenerRegistered) {
        if (typeof NativeEvents !== 'undefined') {
            NativeEvents.onEvent(J_RenderGuiLayerEventPre, event => {
                handleLayerPre(event);
            });
            isLayerListenerRegistered = true;
        } else if (J_NeoForge && J_Consumer) {
            let layerListener = new J_Consumer({
                accept: function(ev) { handleLayerPre(ev); }
            });
            J_NeoForge.EVENT_BUS.addListener(layerListener);
            isLayerListenerRegistered = true;
        }
    }

    // 2. Render Gui Post Listener (Fallback Master RPG HUD)
    if (J_RenderGuiEventPost && !isRenderListenerRegistered) {
        if (typeof NativeEvents !== 'undefined') {
            NativeEvents.onEvent(J_RenderGuiEventPost, event => {
                try {
                    if (event) {
                        let guiGraphics = event.getGuiGraphics ? event.getGuiGraphics() : event.guiGraphics;
                        if (guiGraphics) {
                            renderMasterRpgHud(guiGraphics);
                        }
                    }
                } catch (err) {}
            });
            isRenderListenerRegistered = true;
        } else if (J_NeoForge && J_Consumer) {
            let renderListener = new J_Consumer({
                accept: function(ev) {
                    try {
                        if (ev) {
                            let guiGraphics = ev.getGuiGraphics ? ev.getGuiGraphics() : ev.guiGraphics;
                            if (guiGraphics) {
                                renderMasterRpgHud(guiGraphics);
                            }
                        }
                    } catch (err) {}
                }
            });
            J_NeoForge.EVENT_BUS.addListener(renderListener);
            isRenderListenerRegistered = true;
        }
    }
} catch (eInitAll) {}
