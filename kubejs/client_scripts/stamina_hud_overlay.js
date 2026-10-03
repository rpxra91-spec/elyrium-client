// ==============================================================================
// ⚔️ ELYRIUM RPG: UNIFIED CLASSIC RPG HUD (HEALTH, STAMINA, HUNGER, MANA)
// Minecraft 1.21.1 NeoForge | KubeJS Client Script (v2.7)
// ==============================================================================
// 1. Suppresses vanilla hearts and chicken drumsticks via RenderGuiLayerEvent$Pre:
//    - VanillaGuiLayers.PLAYER_HEALTH
//    - VanillaGuiLayers.FOOD_LEVEL
// 2. Renders clean, modern RPG status bars (Option 3 Layout):
//    - CENTERED ROW (Above hotbar, bottom at screenHeight - 29, 5px gap over hotbar):
//      * Health Bar: Centered above hotbar, scaled +20% (110x25 px, hpX = midX - 55, hpY = screenHeight - 54)
//      * Mana Bar: Left of HP, scaled -10% (83x19 px, manaX = hpX - 87, manaY = screenHeight - 48)
//      * Stamina Bar: Right of HP, scaled -10% (83x19 px, stamX = hpX + 114, stamY = screenHeight - 48)
//    - RIGHT FLANK (Adjacent to hotbar with boundary clamp, bottom at screenHeight - 29):
//      * Hunger & Saturation Bar: Standard 100% scale (92x21 px, foodY = screenHeight - 50)
// 3. Crisp PoseStack matrix scaling for bar frames, fill bars & crystal graphics.
// 4. Clean, sharp Minecraft font rendering for split values without blur or emoji.
// 5. Intercepts VanillaGuiLayers.SELECTED_ITEM_NAME to translate up by 28px over bars.
// 6. Synchronous pause hiding: all 4 bars hide cleanly when mc.screen != null (ESC).
// ==============================================================================

let J_Minecraft = null;
let J_RenderGuiEventPost = null;
let J_RenderGuiLayerEventPre = null;
let J_RenderGuiLayerEventPost = null;
let J_VanillaGuiLayers = null;
let J_RenderType = null;
let J_NeoForge = null;
let J_Consumer = null;
let J_ClientMagicData = null;
let isStaminaHudApiLoaded = false;
let isRenderListenerRegistered = false;
let isLayerListenerRegistered = false;
let isLayerPostListenerRegistered = false;

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
        J_RenderGuiLayerEventPost = Java.loadClass('net.neoforged.neoforge.client.event.RenderGuiLayerEvent$Post');
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
    try {
        J_ClientMagicData = Java.loadClass('io.redspace.ironsspellbooks.player.ClientMagicData');
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

// Render de-duplication and layer state
let lastRenderedTick = -1;
let hasLayerRenderedThisFrame = false;
let isSelectedItemPosePushed = false;
let isOverlayMessagePosePushed = false;

// HUD Geometry Constants (Base 92px Authentic RPG Frames: 92x21 px)
var BAR_WIDTH = 92;
var BAR_HEIGHT = 21;

// HUD Color Palette (ARGB 32-bit signed integers fallback)
var COLOR_BORDER = (0xFF1A1D22 | 0);       // Dark Matte Steel #1A1D22
var COLOR_BG = (0xCC111827 | 0);           // Deep Graphite 80% opacity #111827
var COLOR_TEXT = (0xFFFFFFFF | 0);         // Crisp White
var COLOR_TEXT_MANA = (0xFF55FFFF | 0);    // Aqua #55FFFF (ChatFormatting.AQUA)
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
var COLOR_MANA_TOP = (0xFF38BDF8 | 0);     // Sky Cyan #38BDF8
var COLOR_MANA_BOT = (0xFF0284C7 | 0);     // Deep Cyan #0284C7

// Texture loader for elyrium:textures/gui/hud/hud_bars.png
var J_ResourceLocation = null;
var HUD_BARS_TEX = null;

function getHudBarsTex() {
    if (HUD_BARS_TEX) return HUD_BARS_TEX;
    try {
        if (!J_ResourceLocation) {
            J_ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation');
        }
        if (J_ResourceLocation) {
            if (typeof J_ResourceLocation.fromNamespaceAndPath === 'function') {
                HUD_BARS_TEX = J_ResourceLocation.fromNamespaceAndPath('elyrium', 'textures/gui/hud/hud_bars.png');
            } else if (typeof J_ResourceLocation.parse === 'function') {
                HUD_BARS_TEX = J_ResourceLocation.parse('elyrium:textures/gui/hud/hud_bars.png');
            }
        }
    } catch (eRL) {}
    if (!HUD_BARS_TEX && typeof ResourceLocation !== 'undefined') {
        try {
            HUD_BARS_TEX = ResourceLocation.parse('elyrium:textures/gui/hud/hud_bars.png');
        } catch (e2) {}
    }
    return HUD_BARS_TEX;
}

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

function safeBlit(guiGraphics, tex, x, y, u, v, w, h) {
    if (!guiGraphics || !tex || w <= 0 || h <= 0) return false;
    let ix = x | 0;
    let iy = y | 0;
    let iu = u | 0;
    let iv = v | 0;
    let iw = w | 0;
    let ih = h | 0;

    // 1. Try 6-arg blit(ResourceLocation, x, y, u, v, w, h)
    try {
        guiGraphics.blit(tex, ix, iy, iu, iv, iw, ih);
        return true;
    } catch (e1) {}

    // 2. Try 8-arg blit(ResourceLocation, x, y, float u, float v, int w, int h, int texW, int texH)
    try {
        guiGraphics.blit(tex, ix, iy, iu, iv, iw, ih, 256, 256);
        return true;
    } catch (e2) {}

    return false;
}

/**
 * Renders split current and max values under an authentic HUD bar:
 * [Current] on left sub-wing, [Max] on right sub-wing, with bottom diamond gem in the center.
 * Dynamically scales wing centers and vertical baseline to match bar width & height.
 */
function drawBarSplitValues(guiGraphics, font, barX, barY, curVal, maxVal, color, actualW, actualH) {
    if (!guiGraphics || !font) return;
    let strCur = String(curVal);
    let strMax = String(maxVal);
    let w = actualW || BAR_WIDTH;
    let h = actualH || BAR_HEIGHT;

    let leftCenter = Math.round(barX + (w * (22 / 92)));
    let rightCenter = Math.round(barX + (w * (70 / 92)));
    let ty = Math.round(barY + (h * (17 / 21)));

    let wCur = (typeof font.width === 'function') ? font.width(strCur) : (strCur.length * 6);
    let txCur = Math.round(leftCenter - (wCur / 2));
    safeDrawString(guiGraphics, font, strCur, txCur, ty, color);

    let wMax = (typeof font.width === 'function') ? font.width(strMax) : (strMax.length * 6);
    let txMax = Math.round(rightCenter - (wMax / 2));
    safeDrawString(guiGraphics, font, strMax, txMax, ty, color);
}

/**
 * Renders a HUD bar graphic using PoseStack matrix scaling (if scaled) or direct coordinates.
 * Guarantees crisp rendering without UV clipping and balanced pushPose/popPose.
 */
function renderBarGraphic(guiGraphics, hudTex, x, y, actualW, actualH, renderFn) {
    let pose = guiGraphics && guiGraphics.pose ? guiGraphics.pose() : null;
    if (pose) {
        let scaleX = actualW / BAR_WIDTH;
        let scaleY = actualH / BAR_HEIGHT;
        pose.pushPose();
        pose.translate(x, y, 0);
        pose.scale(scaleX, scaleY, 1.0);
        try {
            renderFn(0, 0);
        } finally {
            pose.popPose();
        }
    } else {
        renderFn(x, y);
    }
}

// ------------------------------------------------------------------------------
// 3. MASTER HUD RENDER ROUTINE: OPTION 3 CLASSIC RPG BARS
// ------------------------------------------------------------------------------
function renderMasterRpgHud(guiGraphics) {
    if (!guiGraphics) return;
    try {
        initStaminaHudApi();

        let mc = J_Minecraft ? J_Minecraft.getInstance() : null;
        if (!mc || !mc.player || !mc.player.isAlive()) return;
        if (mc.options.hideGui) return;
        if (mc.player.isCreative() || mc.player.isSpectator()) return;
        if (mc.screen != null) {
            let sStr = String(mc.screen);
            let sClass = mc.screen['class'] || null;
            let sName = (sClass && sClass.getSimpleName) ? String(sClass.getSimpleName()) : '';
            // Show HUD during chat and inventory; hide in pause menu, options, death, etc.
            let isAllowedScreen = sName.includes('ChatScreen') || sName.includes('InventoryScreen') ||
                                 sStr.includes('ChatScreen') || sStr.includes('InventoryScreen');
            if (!isAllowedScreen) {
                return;
            }
        }

        let nowTime = Date.now();
        if (nowTime - lastRenderedTick < 4) return;
        lastRenderedTick = nowTime;

        let player = mc.player;
        let window = mc.getWindow();
        let screenWidth = window ? window.getGuiScaledWidth() : (guiGraphics.guiWidth ? guiGraphics.guiWidth() : 400);
        let screenHeight = window ? window.getGuiScaledHeight() : (guiGraphics.guiHeight ? guiGraphics.guiHeight() : 300);

        let midX = Math.floor(screenWidth / 2);

        // ======================================================================
        // LAYOUT GEOMETRY: Option 3 (Curator Request)
        // 1. HEALTH (HP): Strictly centered above hotbar, scaled +20% (110x25 px)
        // 2. MANA: Left of HP at same baseline, scaled -10% (83x19 px)
        // 3. STAMINA: Right of HP at same baseline, scaled -10% (83x19 px)
        // 4. HUNGER & SATURATION: Right flank at standard 100% scale (92x21 px)
        // All 4 bars aligned with bottom at screenHeight - 29 (5px gap above hotbar).
        // ======================================================================
        let barW = BAR_WIDTH;   // Base frame width: 92px
        let barH = BAR_HEIGHT;  // Base frame height: 21px

        // HP: +20% larger -> 110 x 25 px
        let hpW = 110;
        let hpH = 25;
        let hpX = midX - Math.floor(hpW / 2);
        let hpY = screenHeight - 54; // bottom at screenHeight - 29

        // Mana: -10% smaller -> 83 x 19 px, left of HP
        let manaW = 83;
        let manaH = 19;
        let manaX = hpX - 4 - manaW;
        let manaY = screenHeight - 48; // bottom at screenHeight - 29

        // Stamina: -10% smaller -> 83 x 19 px, right of HP
        let stamW = 83;
        let stamH = 19;
        let stamX = hpX + hpW + 4;
        let stamY = screenHeight - 48; // bottom at screenHeight - 29

        // Hunger & Saturation: 100% scale -> 92 x 21 px
        // Wide screens: sits on right flank aligned horizontally (screenHeight - 50, bottom screenHeight - 29)
        // Narrow screens (< 480 px): gracefully drops to lower right flank (screenHeight - 26) to prevent Stamina overlap
        let foodW = 92;
        let foodH = 21;
        let canFitRightRow = (screenWidth - foodW - 2) >= (stamX + stamW + 4);
        let foodX = canFitRightRow ? (stamX + stamW + 6) : Math.min(midX + 96, screenWidth - foodW - 2);
        let foodY = canFitRightRow ? (screenHeight - 50) : (screenHeight - 26);

        let font = mc.font;
        let hudTex = getHudBarsTex();

        // ======================================================================
        // 1. HEALTH BAR (Centered above hotbar: hpX, hpY, scaled +20%: 110x25 px)
        // ======================================================================
        let curHealth = player.getHealth ? player.getHealth() : (player.health || 20);
        let maxHealth = player.getMaxHealth ? player.getMaxHealth() : (player.maxHealth || 20);
        let absorption = player.getAbsorptionAmount ? player.getAbsorptionAmount() : (player.absorptionAmount || 0);

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
        let hpFillWidth = Math.round(barW * hpProgress);
        let lagFillWidth = Math.round(barW * lagProgress);
        let absProgress = Math.max(0.0, Math.min(1.0, absorption / Math.max(1, maxHealth)));
        let absFillWidth = Math.round(barW * absProgress);

        renderBarGraphic(guiGraphics, hudTex, hpX, hpY, hpW, hpH, function(ox, oy) {
            let hpBlitSuccess = false;
            if (hudTex) {
                // 1. Outer Authentic Metallic Frame (v=0)
                hpBlitSuccess = safeBlit(guiGraphics, hudTex, ox, oy, 0, 0, barW, barH);

                // 2. Damage Lag-Trail (v=126)
                if (lagFillWidth > hpFillWidth) {
                    safeBlit(guiGraphics, hudTex, ox, oy, 0, 126, lagFillWidth, barH);
                }

                // 3. Ruby Red Health Crystal (v=42)
                if (hpFillWidth > 0) {
                    safeBlit(guiGraphics, hudTex, ox, oy, 0, 42, hpFillWidth, barH);
                }

                // 4. Radiant Sun Gold Absorption Shield Overlay (v=105)
                if (absFillWidth > 0) {
                    safeBlit(guiGraphics, hudTex, ox, oy, 0, 105, absFillWidth, barH);
                }
            }

            if (!hpBlitSuccess) {
                safeFill(guiGraphics, ox, oy + 8, ox + barW, oy + 15, COLOR_BORDER);
                safeFill(guiGraphics, ox + 1, oy + 9, ox + barW - 1, oy + 14, COLOR_BG);
                if (lagFillWidth > hpFillWidth) {
                    safeFill(guiGraphics, ox + 1, oy + 9, ox + 1 + lagFillWidth, oy + 14, COLOR_LAG);
                }
                if (hpFillWidth > 0) {
                    safeFillGradient(guiGraphics, ox + 1, oy + 9, ox + 1 + hpFillWidth, oy + 14, COLOR_HP_TOP, COLOR_HP_BOT);
                }
                if (absFillWidth > 0) {
                    safeFillGradient(guiGraphics, ox + 1, oy + 9, ox + 1 + absFillWidth, oy + 14, COLOR_ABS_TOP, COLOR_ABS_BOT);
                }
            }
        });

        // Split text: [Current HP] on left, [Max HP] on right (with absorption if active)
        let curHpDisplay = Math.ceil(curHealth) + (absorption > 0.1 ? `+${Math.ceil(absorption)}` : '');
        let maxHpDisplay = Math.ceil(maxHealth);
        drawBarSplitValues(guiGraphics, font, hpX, hpY, curHpDisplay, maxHpDisplay, COLOR_HP_TOP, hpW, hpH);

        // ======================================================================
        // 2. MANA BAR (Left of HP: manaX, manaY, scaled -10%: 83x19 px)
        // ======================================================================
        let curMana = 100;
        let maxMana = 100;
        if (player.getAttributeValue) {
            try {
                let attr = player.getAttributeValue('irons_spellbooks:max_mana');
                if (typeof attr === 'number' && attr > 0) maxMana = attr;
            } catch (eAttr) {}
        }
        if (J_ClientMagicData) {
            try {
                let m = J_ClientMagicData.getPlayerMana();
                if (typeof m === 'number' && !isNaN(m)) curMana = m;
            } catch (eM) {}
        } else {
            curMana = maxMana;
        }

        let manaProgress = Math.max(0.0, Math.min(1.0, curMana / Math.max(1, maxMana)));
        let manaFillWidth = Math.round(barW * manaProgress);

        renderBarGraphic(guiGraphics, hudTex, manaX, manaY, manaW, manaH, function(ox, oy) {
            let manaBlitSuccess = false;
            if (hudTex) {
                manaBlitSuccess = safeBlit(guiGraphics, hudTex, ox, oy, 0, 0, barW, barH);
                if (manaFillWidth > 0) {
                    safeBlit(guiGraphics, hudTex, ox, oy, 0, 21, manaFillWidth, barH);
                }
            }

            if (!manaBlitSuccess) {
                safeFill(guiGraphics, ox, oy + 8, ox + barW, oy + 15, COLOR_BORDER);
                safeFill(guiGraphics, ox + 1, oy + 9, ox + barW - 1, oy + 14, COLOR_BG);
                if (manaFillWidth > 0) {
                    safeFillGradient(guiGraphics, ox + 1, oy + 9, ox + 1 + manaFillWidth, oy + 14, COLOR_MANA_TOP, COLOR_MANA_BOT);
                }
            }
        });

        // Split text: [Current Mana] on left, [Max Mana] on right
        drawBarSplitValues(guiGraphics, font, manaX, manaY, Math.round(curMana), Math.round(maxMana), COLOR_TEXT_MANA, manaW, manaH);

        // ======================================================================
        // 3. STAMINA BAR (Right of HP: stamX, stamY, scaled -10%: 83x19 px)
        // ======================================================================
        displayedStamina += (clientStamina - displayedStamina) * 0.35;
        if (Math.abs(clientStamina - displayedStamina) < 0.1) displayedStamina = clientStamina;

        let maxStam = Math.max(1, clientMaxStamina);
        let stamProgress = Math.max(0.0, Math.min(1.0, displayedStamina / maxStam));
        let stamFillWidth = Math.round(barW * stamProgress);

        let isBlocking = player.isBlocking ? player.isBlocking() : false;

        renderBarGraphic(guiGraphics, hudTex, stamX, stamY, stamW, stamH, function(ox, oy) {
            let stamBlitSuccess = false;
            if (hudTex) {
                let frameV = isBlocking ? 147 : 0;
                stamBlitSuccess = safeBlit(guiGraphics, hudTex, ox, oy, 0, frameV, barW, barH);
                if (stamFillWidth > 0) {
                    safeBlit(guiGraphics, hudTex, ox, oy, 0, 63, stamFillWidth, barH);
                }
            }

            if (!stamBlitSuccess) {
                let currentStamBorder = isBlocking ? COLOR_STAM_BLOCK : COLOR_BORDER;
                safeFill(guiGraphics, ox, oy + 8, ox + barW, oy + 15, currentStamBorder);
                safeFill(guiGraphics, ox + 1, oy + 9, ox + barW - 1, oy + 14, COLOR_BG);
                if (stamFillWidth > 0) {
                    safeFillGradient(guiGraphics, ox + 1, oy + 9, ox + 1 + stamFillWidth, oy + 14, COLOR_AMBER_TOP, COLOR_AMBER_BOT);
                }
            }
        });

        // Split text: [Current Stamina] on left, [Max Stamina] on right
        drawBarSplitValues(guiGraphics, font, stamX, stamY, Math.round(clientStamina), Math.round(maxStam), COLOR_AMBER_TOP, stamW, stamH);

        // ======================================================================
        // 4. HUNGER & SATURATION BAR (Right Flank: foodX, foodY, 100% scale: 92x21 px)
        // ======================================================================
        let foodData = player.getFoodData ? player.getFoodData() : null;
        let foodLevel = foodData ? (foodData.getFoodLevel ? foodData.getFoodLevel() : 20) : 20;
        let saturation = foodData ? (foodData.getSaturationLevel ? foodData.getSaturationLevel() : 5) : 5;

        let foodProgress = Math.max(0.0, Math.min(1.0, foodLevel / 20.0));
        let foodFillWidth = Math.round(barW * foodProgress);
        let satProgress = Math.max(0.0, Math.min(1.0, saturation / 20.0));
        let satFillWidth = Math.round(barW * satProgress);

        renderBarGraphic(guiGraphics, hudTex, foodX, foodY, foodW, foodH, function(ox, oy) {
            let foodBlitSuccess = false;
            if (hudTex) {
                foodBlitSuccess = safeBlit(guiGraphics, hudTex, ox, oy, 0, 0, barW, barH);
                if (foodFillWidth > 0) {
                    safeBlit(guiGraphics, hudTex, ox, oy, 0, 84, foodFillWidth, barH);
                }
                if (satFillWidth > 0) {
                    safeBlit(guiGraphics, hudTex, ox, oy, 0, 105, satFillWidth, barH);
                }
            }

            if (!foodBlitSuccess) {
                safeFill(guiGraphics, ox, oy + 8, ox + barW, oy + 15, COLOR_BORDER);
                safeFill(guiGraphics, ox + 1, oy + 9, ox + barW - 1, oy + 14, COLOR_BG);
                if (foodFillWidth > 0) {
                    safeFillGradient(guiGraphics, ox + 1, oy + 9, ox + 1 + foodFillWidth, oy + 14, COLOR_FOOD_TOP, COLOR_FOOD_BOT);
                }
                if (satFillWidth > 0) {
                    safeFillGradient(guiGraphics, ox + 1, oy + 9, ox + 1 + satFillWidth, oy + 14, COLOR_SAT_TOP, COLOR_SAT_BOT);
                }
            }
        });

        // Curator rule: at high saturation, simply show total > 20 on left!
        // E.g. foodLevel 20 + saturation 4.0 = 24 on left, 20 on right.
        let curFoodDisplay = (saturation > 0.05) ? Math.round(foodLevel + saturation) : foodLevel;
        drawBarSplitValues(guiGraphics, font, foodX, foodY, curFoodDisplay, 20, COLOR_FOOD_TOP, foodW, foodH);

    } catch (eHud) {
        try {
            console.error('[Elyrium HUD Render Error]: ' + eHud);
        } catch (eLog) {}
    }
}

// ------------------------------------------------------------------------------
// 4. REGISTRATION: Layer Suppression, Interception & Master HUD Render
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
                hasLayerRenderedThisFrame = true;
            }
            return;
        }
        // Cancel vanilla food / hunger drumsticks
        if (name.equals(J_VanillaGuiLayers.FOOD_LEVEL)) {
            event.setCanceled(true);
            return;
        }
        // Intercept SELECTED_ITEM_NAME to translate upwards (+Y is downwards, so -28 moves it up)
        if (name.equals(J_VanillaGuiLayers.SELECTED_ITEM_NAME)) {
            let gg = event.getGuiGraphics ? event.getGuiGraphics() : event.guiGraphics;
            let pose = gg && gg.pose ? gg.pose() : null;
            if (pose) {
                pose.pushPose();
                pose.translate(0, -28, 0);
                isSelectedItemPosePushed = true;
            }
            return;
        }
        // Intercept OVERLAY_MESSAGE (dungeon instance text) to translate upwards
        if (name.equals(J_VanillaGuiLayers.OVERLAY_MESSAGE)) {
            let gg = event.getGuiGraphics ? event.getGuiGraphics() : event.guiGraphics;
            let pose = gg && gg.pose ? gg.pose() : null;
            if (pose) {
                pose.pushPose();
                pose.translate(0, -18, 0);
                isOverlayMessagePosePushed = true;
            }
            return;
        }
    } catch (eLayer) {
        try { console.error('[Elyrium Layer Error]: ' + eLayer); } catch (eL) {}
    }
}

function handleLayerPost(event) {
    if (!event) return;
    try {
        let name = event.getName ? event.getName() : null;
        if (!name || !J_VanillaGuiLayers) return;

        // Restore pose stack for SELECTED_ITEM_NAME
        if (name.equals(J_VanillaGuiLayers.SELECTED_ITEM_NAME)) {
            if (isSelectedItemPosePushed) {
                let gg = event.getGuiGraphics ? event.getGuiGraphics() : event.guiGraphics;
                let pose = gg && gg.pose ? gg.pose() : null;
                if (pose) {
                    pose.popPose();
                }
                isSelectedItemPosePushed = false;
            }
            return;
        }
        // Restore pose stack for OVERLAY_MESSAGE
        if (name.equals(J_VanillaGuiLayers.OVERLAY_MESSAGE)) {
            if (isOverlayMessagePosePushed) {
                let gg = event.getGuiGraphics ? event.getGuiGraphics() : event.guiGraphics;
                let pose = gg && gg.pose ? gg.pose() : null;
                if (pose) {
                    pose.popPose();
                }
                isOverlayMessagePosePushed = false;
            }
            return;
        }
    } catch (eLayerPost) {}
}

try {
    initStaminaHudApi();

    // 1. Layer Pre Listener (Suppress Hearts and Drumsticks + render custom HUD + translate SELECTED_ITEM_NAME)
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
            try {
                J_NeoForge.EVENT_BUS.addListener(J_RenderGuiLayerEventPre, layerListener);
            } catch (eBus1) {
                J_NeoForge.EVENT_BUS.addListener(layerListener);
            }
            isLayerListenerRegistered = true;
        }
    }

    // 2. Layer Post Listener (Pop pose stack for SELECTED_ITEM_NAME)
    if (J_RenderGuiLayerEventPost && !isLayerPostListenerRegistered) {
        if (typeof NativeEvents !== 'undefined') {
            NativeEvents.onEvent(J_RenderGuiLayerEventPost, event => {
                handleLayerPost(event);
            });
            isLayerPostListenerRegistered = true;
        } else if (J_NeoForge && J_Consumer) {
            let layerPostListener = new J_Consumer({
                accept: function(ev) { handleLayerPost(ev); }
            });
            try {
                J_NeoForge.EVENT_BUS.addListener(J_RenderGuiLayerEventPost, layerPostListener);
            } catch (eBus2) {
                J_NeoForge.EVENT_BUS.addListener(layerPostListener);
            }
            isLayerPostListenerRegistered = true;
        }
    }

    // 3. Render Gui Post Listener (Fallback Master RPG HUD)
    if (J_RenderGuiEventPost && !isRenderListenerRegistered) {
        if (typeof NativeEvents !== 'undefined') {
            NativeEvents.onEvent(J_RenderGuiEventPost, event => {
                try {
                    if (hasLayerRenderedThisFrame) {
                        hasLayerRenderedThisFrame = false;
                        return;
                    }
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
                        if (hasLayerRenderedThisFrame) {
                            hasLayerRenderedThisFrame = false;
                            return;
                        }
                        if (ev) {
                            let guiGraphics = ev.getGuiGraphics ? ev.getGuiGraphics() : ev.guiGraphics;
                            if (guiGraphics) {
                                renderMasterRpgHud(guiGraphics);
                            }
                        }
                    } catch (err) {}
                }
            });
            try {
                J_NeoForge.EVENT_BUS.addListener(J_RenderGuiEventPost, renderListener);
            } catch (eBus3) {
                J_NeoForge.EVENT_BUS.addListener(renderListener);
            }
            isRenderListenerRegistered = true;
        }
    }
} catch (eInitAll) {}
