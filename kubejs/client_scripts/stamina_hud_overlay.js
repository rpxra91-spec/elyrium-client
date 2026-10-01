// ==============================================================================
// ⚔️ ELYRIUM RPG: UNIFIED CLASSIC RPG HUD (HEALTH, HUNGER, SATURATION, STAMINA)
// Minecraft 1.21.1 NeoForge | KubeJS Client Script
// ==============================================================================
// 1. Suppresses vanilla hearts and chicken drumsticks via RenderGuiLayerEvent$Pre:
//    - VanillaGuiLayers.PLAYER_HEALTH
//    - VanillaGuiLayers.FOOD_LEVEL
// 2. Renders clean, modern, symmetrical RPG status bars in RenderGuiEvent$Post:
//    - LEFT SIDE:
//      * Health Bar (81x7 px, Ruby Red, Damage Lag-Trail, Absorption Shield)
//      * Stamina Bar (81x6 px, Amber Gold, Permanent 100% visible, Shield Block Aura)
//    - RIGHT SIDE:
//      * Hunger & Saturation Bar (81x7 px, Caramel Orange with Golden Saturation Overlay)
//      * (Mana Bar from Iron's Spells aligns directly above Hunger)
// 3. Zero-Latency Network Sync: listens to 'elyrium:sync_stamina' and 'elyrium:sync_posture'
// ==============================================================================

let J_Minecraft = null;
let J_RenderGuiEventPost = null;
let J_RenderGuiLayerEventPre = null;
let J_VanillaGuiLayers = null;
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
// 2. LAYER SUPPRESSION: Suppress Vanilla Hearts and Drumsticks
// ------------------------------------------------------------------------------
function handleLayerPre(event) {
    if (!event) return;
    try {
        let name = event.getName ? event.getName() : null;
        if (!name || !J_VanillaGuiLayers) return;

        // Cancel vanilla player hearts
        if (name.equals(J_VanillaGuiLayers.PLAYER_HEALTH)) {
            event.setCanceled(true);
            return;
        }
        // Cancel vanilla food / hunger drumsticks
        if (name.equals(J_VanillaGuiLayers.FOOD_LEVEL)) {
            event.setCanceled(true);
            return;
        }
    } catch (eLayer) {}
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
        let screenWidth = guiGraphics.guiWidth ? guiGraphics.guiWidth() : mc.getWindow().getGuiScaledWidth();
        let screenHeight = guiGraphics.guiHeight ? guiGraphics.guiHeight() : mc.getWindow().getGuiScaledHeight();

        const BAR_WIDTH = 81;
        const HP_BAR_HEIGHT = 7;
        const STAM_BAR_HEIGHT = 6;
        const FOOD_BAR_HEIGHT = 7;

        let midX = Math.floor(screenWidth / 2);
        let leftX = midX - 91;
        let rightX = midX + 10;
        let bottomY = screenHeight - 39;

        let font = mc.font;
        let pose = guiGraphics.pose ? guiGraphics.pose() : null;

        // Colors (ARGB 32-bit signed ints)
        const COLOR_BORDER = (0xFF1F2937 | 0);       // Dark Slate #1F2937
        const COLOR_BG = (0xCC111827 | 0);           // Deep Graphite 80% opacity #111827
        const COLOR_TEXT = (0xFFFFFFFF | 0);         // Crisp White
        const COLOR_TEXT_SHADOW = (0xFF000000 | 0);

        // ----------------------------------------------------------------------
        // A. HEALTH BAR (Left Side, Bottom Row: y = bottomY)
        // ----------------------------------------------------------------------
        let curHealth = player.getHealth ? player.getHealth() : player.health;
        let maxHealth = player.getMaxHealth ? player.getMaxHealth() : player.maxHealth;
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
        guiGraphics.fill(leftX | 0, hpY | 0, (leftX + BAR_WIDTH) | 0, (hpY + HP_BAR_HEIGHT) | 0, COLOR_BORDER);
        // 2. Background
        guiGraphics.fill((leftX + 1) | 0, (hpY + 1) | 0, (leftX + BAR_WIDTH - 1) | 0, (hpY + HP_BAR_HEIGHT - 1) | 0, COLOR_BG);

        // 3. Damage Lag-Trail (White / Light Red)
        if (lagFillWidth > hpFillWidth) {
            const COLOR_LAG = (0xFFFECACA | 0); // Light Red #FECACA
            guiGraphics.fill((leftX + 1 + hpFillWidth) | 0, (hpY + 1) | 0, (leftX + 1 + lagFillWidth) | 0, (hpY + HP_BAR_HEIGHT - 1) | 0, COLOR_LAG);
        }

        // 4. Ruby Red Health Gradient
        if (hpFillWidth > 0) {
            const COLOR_HP_TOP = (0xFFEF4444 | 0); // Red #EF4444
            const COLOR_HP_BOT = (0xFF991B1B | 0); // Crimson #991B1B
            try {
                guiGraphics.fillGradient((leftX + 1) | 0, (hpY + 1) | 0, (leftX + 1 + hpFillWidth) | 0, (hpY + HP_BAR_HEIGHT - 1) | 0, 0, COLOR_HP_TOP, COLOR_HP_BOT);
            } catch (eHGrad) {
                guiGraphics.fill((leftX + 1) | 0, (hpY + 1) | 0, (leftX + 1 + hpFillWidth) | 0, (hpY + HP_BAR_HEIGHT - 1) | 0, COLOR_HP_TOP);
            }
        }

        // 5. Golden Absorption Shield Overlay
        if (absorption > 0) {
            let absProgress = Math.max(0.0, Math.min(1.0, absorption / Math.max(1, maxHealth)));
            let absFillWidth = Math.round(innerWidth * absProgress);
            const COLOR_ABS_TOP = (0x99F59E0B | 0); // Amber/Gold semi-transparent
            const COLOR_ABS_BOT = (0x99D97706 | 0);
            try {
                guiGraphics.fillGradient((leftX + 1) | 0, (hpY + 1) | 0, (leftX + 1 + absFillWidth) | 0, (hpY + HP_BAR_HEIGHT - 1) | 0, 0, COLOR_ABS_TOP, COLOR_ABS_BOT);
            } catch (eAbs) {
                guiGraphics.fill((leftX + 1) | 0, (hpY + 1) | 0, (leftX + 1 + absFillWidth) | 0, (hpY + HP_BAR_HEIGHT - 1) | 0, COLOR_ABS_TOP);
            }
        }

        // 6. Text: ♥ [cur]/[max]
        let curHPInt = Math.max(0, Math.round(curHealth));
        let maxHPInt = Math.round(maxHealth);
        let hpText = `♥ ${curHPInt}/${maxHPInt}` + (absorption > 0 ? ` (+${Math.round(absorption)})` : '');

        if (font && pose) {
            const SCALE = 0.72;
            let tw = font.width(hpText);
            pose.pushPose();
            pose.scale(SCALE, SCALE, 1.0);
            let tx = (leftX + (BAR_WIDTH - tw * SCALE) / 2) / SCALE;
            let ty = (hpY + (HP_BAR_HEIGHT - 7.5 * SCALE) / 2) / SCALE;
            guiGraphics.drawString(font, hpText, Math.round(tx), Math.round(ty), COLOR_TEXT, true);
            pose.popPose();
        }

        // ----------------------------------------------------------------------
        // B. STAMINA BAR (Left Side, Above Health: y = hpY - 8)
        // ----------------------------------------------------------------------
        let stamY = hpY - 8;
        displayedStamina += (clientStamina - displayedStamina) * 0.35;
        if (Math.abs(clientStamina - displayedStamina) < 0.2) displayedStamina = clientStamina;

        let stamProgress = Math.max(0.0, Math.min(1.0, displayedStamina / Math.max(1, clientMaxStamina)));
        let stamFillWidth = Math.round(innerWidth * stamProgress);

        let isBlocking = player.isBlocking ? player.isBlocking() : false;
        const COLOR_STAM_BORDER = isBlocking ? (0xFF38BDF8 | 0) : COLOR_BORDER; // Cyan highlight if blocking!

        guiGraphics.fill(leftX | 0, stamY | 0, (leftX + BAR_WIDTH) | 0, (stamY + STAM_BAR_HEIGHT) | 0, COLOR_STAM_BORDER);
        guiGraphics.fill((leftX + 1) | 0, (stamY + 1) | 0, (leftX + BAR_WIDTH - 1) | 0, (stamY + STAM_BAR_HEIGHT - 1) | 0, COLOR_BG);

        if (stamFillWidth > 0) {
            const COLOR_AMBER_TOP = (0xFFF59E0B | 0);
            const COLOR_AMBER_BOT = (0xFFD97706 | 0);
            try {
                guiGraphics.fillGradient((leftX + 1) | 0, (stamY + 1) | 0, (leftX + 1 + stamFillWidth) | 0, (stamY + STAM_BAR_HEIGHT - 1) | 0, 0, COLOR_AMBER_TOP, COLOR_AMBER_BOT);
            } catch (eSGrad) {
                guiGraphics.fill((leftX + 1) | 0, (stamY + 1) | 0, (leftX + 1 + stamFillWidth) | 0, (stamY + STAM_BAR_HEIGHT - 1) | 0, COLOR_AMBER_TOP);
            }
        }

        let curStamInt = Math.max(0, Math.round(displayedStamina));
        let maxStamInt = Math.round(clientMaxStamina);
        let stamText = (isBlocking ? `🛡 ` : `⚡ `) + `${curStamInt}/${maxStamInt}`;

        if (font && pose) {
            const SCALE = 0.70;
            let tw = font.width(stamText);
            pose.pushPose();
            pose.scale(SCALE, SCALE, 1.0);
            let tx = (leftX + (BAR_WIDTH - tw * SCALE) / 2) / SCALE;
            let ty = (stamY + (STAM_BAR_HEIGHT - 7.5 * SCALE) / 2) / SCALE;
            guiGraphics.drawString(font, stamText, Math.round(tx), Math.round(ty), COLOR_TEXT, true);
            pose.popPose();
        }

        // ----------------------------------------------------------------------
        // C. HUNGER & SATURATION BAR (Right Side, Bottom Row: x = rightX, y = bottomY)
        // ----------------------------------------------------------------------
        let foodData = player.getFoodData ? player.getFoodData() : null;
        let foodLevel = foodData && typeof foodData.getFoodLevel === 'function' ? foodData.getFoodLevel() : 20;
        let saturation = foodData && typeof foodData.getSaturationLevel === 'function' ? foodData.getSaturationLevel() : 0.0;

        let foodProgress = Math.max(0.0, Math.min(1.0, foodLevel / 20.0));
        let foodFillWidth = Math.round(innerWidth * foodProgress);

        let foodY = bottomY;

        // 1. Outer Border
        guiGraphics.fill(rightX | 0, foodY | 0, (rightX + BAR_WIDTH) | 0, (foodY + FOOD_BAR_HEIGHT) | 0, COLOR_BORDER);
        // 2. Background
        guiGraphics.fill((rightX + 1) | 0, (foodY + 1) | 0, (rightX + BAR_WIDTH - 1) | 0, (foodY + FOOD_BAR_HEIGHT - 1) | 0, COLOR_BG);

        // 3. Caramel Orange Food Bar
        if (foodFillWidth > 0) {
            const COLOR_FOOD_TOP = (0xFFEA580C | 0); // Orange #EA580C
            const COLOR_FOOD_BOT = (0xFFC2410C | 0); // Rust #C2410C
            try {
                guiGraphics.fillGradient((rightX + 1) | 0, (foodY + 1) | 0, (rightX + 1 + foodFillWidth) | 0, (foodY + FOOD_BAR_HEIGHT - 1) | 0, 0, COLOR_FOOD_TOP, COLOR_FOOD_BOT);
            } catch (eFGrad) {
                guiGraphics.fill((rightX + 1) | 0, (foodY + 1) | 0, (rightX + 1 + foodFillWidth) | 0, (foodY + FOOD_BAR_HEIGHT - 1) | 0, COLOR_FOOD_TOP);
            }
        }

        // 4. Glowing Golden Saturation Overlay (Saturation can go up to foodLevel)
        if (saturation > 0.1) {
            let satProgress = Math.max(0.0, Math.min(1.0, saturation / 20.0));
            let satFillWidth = Math.round(innerWidth * satProgress);
            const COLOR_SAT_TOP = (0xAAFACC15 | 0); // Gold Yellow with shimmer
            const COLOR_SAT_BOT = (0xAAEAB308 | 0);
            try {
                guiGraphics.fillGradient((rightX + 1) | 0, (foodY + 1) | 0, (rightX + 1 + satFillWidth) | 0, (foodY + FOOD_BAR_HEIGHT - 1) | 0, 0, COLOR_SAT_TOP, COLOR_SAT_BOT);
            } catch (eSat) {
                guiGraphics.fill((rightX + 1) | 0, (foodY + 1) | 0, (rightX + 1 + satFillWidth) | 0, (foodY + FOOD_BAR_HEIGHT - 1) | 0, COLOR_SAT_TOP);
            }
        }

        // 5. Text: 🍗 [food]/20 (+[sat])
        let satFormatted = (saturation > 0.05) ? saturation.toFixed(1) : '0';
        let foodText = `🍗 ${foodLevel}/20` + (saturation > 0.05 ? ` (+${satFormatted})` : '');

        if (font && pose) {
            const SCALE = 0.72;
            let tw = font.width(foodText);
            pose.pushPose();
            pose.scale(SCALE, SCALE, 1.0);
            let tx = (rightX + (BAR_WIDTH - tw * SCALE) / 2) / SCALE;
            let ty = (foodY + (FOOD_BAR_HEIGHT - 7.5 * SCALE) / 2) / SCALE;
            guiGraphics.drawString(font, foodText, Math.round(tx), Math.round(ty), COLOR_TEXT, true);
            pose.popPose();
        }

    } catch (eHud) {}
}

// ------------------------------------------------------------------------------
// 4. REGISTRATION: Layer Suppression & Master HUD Render
// ------------------------------------------------------------------------------
try {
    initStaminaHudApi();

    // 1. Layer Pre Listener (Suppress Hearts and Drumsticks)
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

    // 2. Render Gui Post Listener (Master RPG HUD)
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
