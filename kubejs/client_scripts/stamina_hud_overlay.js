// ==============================================================================
// ⚔️ ELYRIUM RPG: UNIFIED CLASSIC RPG HUD (HEALTH, STAMINA, HUNGER, MANA)
// Minecraft 1.21.1 NeoForge | KubeJS Client Script (v2.6)
// ==============================================================================
// 1. Suppresses vanilla hearts and chicken drumsticks via RenderGuiLayerEvent$Pre:
//    - VanillaGuiLayers.PLAYER_HEALTH
//    - VanillaGuiLayers.FOOD_LEVEL
// 2. Renders clean, modern RPG status bars:
//    - CENTERED ROW (screenHeight - 52):
//      * Health Bar (left: Ruby Red crystal v=42, Lag-Trail v=126, Absorption v=105)
//      * Native Mana Bar (right: Cyan crystal v=21, ClientMagicData.getPlayerMana())
//    - RIGHT FLANK (midX + 98 adjacent to hotbar with boundary clamp):
//      * Stamina Bar (at Mana level: centerBarY = screenHeight - 52)
//      * Hunger & Saturation Bar (below Stamina: centerBarY + 26 = screenHeight - 26)
// 3. Compact 92x21 px authentic metallic frames (v=0), split current/max values.
// 4. Clean font rendering without emojis/icons, centered in frame channels.
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

// HUD Geometry Constants (Narrow 92px Authentic RPG Frames: 92x21 px)
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
 * Eliminates the '/' slash and shifts text down to barY + 17 to prevent overlapping.
 */
function drawBarSplitValues(guiGraphics, font, barX, barY, curVal, maxVal, color) {
    if (!guiGraphics || !font) return;
    let strCur = String(curVal);
    let strMax = String(maxVal);
    let ty = Math.round(barY + 17);

    // Left sub-wing center: around barX + 22 (leaves 3-4px margin from outer left edge and center gem)
    let wCur = font.width(strCur);
    let txCur = Math.round(barX + 22 - (wCur / 2));
    safeDrawString(guiGraphics, font, strCur, txCur, ty, color);

    // Right sub-wing center: around barX + 70
    let wMax = font.width(strMax);
    let txMax = Math.round(barX + 70 - (wMax / 2));
    safeDrawString(guiGraphics, font, strMax, txMax, ty, color);
}

// ------------------------------------------------------------------------------
// 3. MASTER HUD RENDER ROUTINE: UNIFIED 2x2 FANTASY RPG BARS
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
            let sName = mc.screen.getClass().getSimpleName();
            // Show HUD during chat and inventory; hide in pause menu, options, etc.
            if (sName !== 'ChatScreen' && sName !== 'InventoryScreen') {
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
        // LAYOUT GEOMETRY: Option 1 (Curator Design)
        // 1. HEALTH & MANA: Centered symmetrically above hotbar (lower row)
        // 2. STAMINA & HUNGER: Stacked to the RIGHT of hotbar (slots 8-9 flank)
        // ======================================================================
        let barW = BAR_WIDTH; // 92px
        let barH = BAR_HEIGHT; // 21px

        // Centered lower row: Health (left) & Mana (right)
        let hpX = midX - barW - 2;       // midX - 94 to midX - 2
        let manaX = midX + 2;            // midX + 2 to midX + 94
        let centerBarY = screenHeight - 52; // Leaves comfortable 5px gap above hotbar

        // Right flank: Stamina (level with Mana) & Hunger (below Stamina)
        let rightFlankX = Math.min(midX + 98, screenWidth - barW - 2); // Sits right adjacent to hotbar with edge clamp
        let stamY = centerBarY;          // On the same vertical level as Mana/Health
        let foodY = centerBarY + 26;     // Lowered below Stamina (screenHeight - 26, clean 1px bottom air, no clipping)

        let font = mc.font;
        let hudTex = getHudBarsTex();

        // ======================================================================
        // 1. HEALTH BAR (Left Wing, Centered: hpX, centerBarY)
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

        let hpBlitSuccess = false;
        if (hudTex) {
            // 1. Outer Authentic Metallic Frame (v=0)
            hpBlitSuccess = safeBlit(guiGraphics, hudTex, hpX, centerBarY, 0, 0, barW, barH);

            // 2. Damage Lag-Trail (v=126)
            if (lagFillWidth > hpFillWidth) {
                safeBlit(guiGraphics, hudTex, hpX, centerBarY, 0, 126, lagFillWidth, barH);
            }

            // 3. Ruby Red Health Crystal (v=42)
            if (hpFillWidth > 0) {
                safeBlit(guiGraphics, hudTex, hpX, centerBarY, 0, 42, hpFillWidth, barH);
            }

            // 4. Radiant Sun Gold Absorption Shield Overlay (v=105)
            if (absFillWidth > 0) {
                safeBlit(guiGraphics, hudTex, hpX, centerBarY, 0, 105, absFillWidth, barH);
            }
        }

        if (!hpBlitSuccess) {
            safeFill(guiGraphics, hpX, centerBarY + 8, hpX + barW, centerBarY + 15, COLOR_BORDER);
            safeFill(guiGraphics, hpX + 1, centerBarY + 9, hpX + barW - 1, centerBarY + 14, COLOR_BG);
            if (lagFillWidth > hpFillWidth) {
                safeFill(guiGraphics, hpX + 1, centerBarY + 9, hpX + 1 + lagFillWidth, centerBarY + 14, COLOR_LAG);
            }
            if (hpFillWidth > 0) {
                safeFillGradient(guiGraphics, hpX + 1, centerBarY + 9, hpX + 1 + hpFillWidth, centerBarY + 14, COLOR_HP_TOP, COLOR_HP_BOT);
            }
            if (absFillWidth > 0) {
                safeFillGradient(guiGraphics, hpX + 1, centerBarY + 9, hpX + 1 + absFillWidth, centerBarY + 14, COLOR_ABS_TOP, COLOR_ABS_BOT);
            }
        }

        // Split text: [Current HP] on left, [Max HP] on right (with absorption if active)
        let curHpDisplay = Math.ceil(curHealth) + (absorption > 0.1 ? `+${Math.ceil(absorption)}` : '');
        let maxHpDisplay = Math.ceil(maxHealth);
        drawBarSplitValues(guiGraphics, font, hpX, centerBarY, curHpDisplay, maxHpDisplay, COLOR_HP_TOP);

        // ======================================================================
        // 2. MANA BAR (Right Wing, Centered: manaX, centerBarY)
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
        let manaBlitSuccess = false;

        if (hudTex) {
            manaBlitSuccess = safeBlit(guiGraphics, hudTex, manaX, centerBarY, 0, 0, barW, barH);
            if (manaFillWidth > 0) {
                safeBlit(guiGraphics, hudTex, manaX, centerBarY, 0, 21, manaFillWidth, barH);
            }
        }

        if (!manaBlitSuccess) {
            safeFill(guiGraphics, manaX, centerBarY + 8, manaX + barW, centerBarY + 15, COLOR_BORDER);
            safeFill(guiGraphics, manaX + 1, centerBarY + 9, manaX + barW - 1, centerBarY + 14, COLOR_BG);
            if (manaFillWidth > 0) {
                safeFillGradient(guiGraphics, manaX + 1, centerBarY + 9, manaX + 1 + manaFillWidth, centerBarY + 14, COLOR_MANA_TOP, COLOR_MANA_BOT);
            }
        }

        // Split text: [Current Mana] on left, [Max Mana] on right
        drawBarSplitValues(guiGraphics, font, manaX, centerBarY, Math.round(curMana), Math.round(maxMana), COLOR_TEXT_MANA);

        // ======================================================================
        // 3. STAMINA BAR (Right Flank, Level with Mana: rightFlankX, stamY)
        // ======================================================================
        displayedStamina += (clientStamina - displayedStamina) * 0.35;
        if (Math.abs(clientStamina - displayedStamina) < 0.1) displayedStamina = clientStamina;

        let maxStam = Math.max(1, clientMaxStamina);
        let stamProgress = Math.max(0.0, Math.min(1.0, displayedStamina / maxStam));
        let stamFillWidth = Math.round(barW * stamProgress);

        let isBlocking = player.isBlocking ? player.isBlocking() : false;
        let stamBlitSuccess = false;

        if (hudTex) {
            let frameV = isBlocking ? 147 : 0;
            stamBlitSuccess = safeBlit(guiGraphics, hudTex, rightFlankX, stamY, 0, frameV, barW, barH);
            if (stamFillWidth > 0) {
                safeBlit(guiGraphics, hudTex, rightFlankX, stamY, 0, 63, stamFillWidth, barH);
            }
        }

        if (!stamBlitSuccess) {
            let currentStamBorder = isBlocking ? COLOR_STAM_BLOCK : COLOR_BORDER;
            safeFill(guiGraphics, rightFlankX, stamY + 8, rightFlankX + barW, stamY + 15, currentStamBorder);
            safeFill(guiGraphics, rightFlankX + 1, stamY + 9, rightFlankX + barW - 1, stamY + 14, COLOR_BG);
            if (stamFillWidth > 0) {
                safeFillGradient(guiGraphics, rightFlankX + 1, stamY + 9, rightFlankX + 1 + stamFillWidth, stamY + 14, COLOR_AMBER_TOP, COLOR_AMBER_BOT);
            }
        }

        // Split text: [Current Stamina] on left, [Max Stamina] on right
        drawBarSplitValues(guiGraphics, font, rightFlankX, stamY, Math.round(clientStamina), Math.round(maxStam), COLOR_AMBER_TOP);

        // ======================================================================
        // 4. HUNGER & SATURATION BAR (Right Flank, Below Stamina: rightFlankX, foodY)
        // ======================================================================
        let foodData = player.getFoodData ? player.getFoodData() : null;
        let foodLevel = foodData ? (foodData.getFoodLevel ? foodData.getFoodLevel() : 20) : 20;
        let saturation = foodData ? (foodData.getSaturationLevel ? foodData.getSaturationLevel() : 5) : 5;

        let foodProgress = Math.max(0.0, Math.min(1.0, foodLevel / 20.0));
        let foodFillWidth = Math.round(barW * foodProgress);
        let satProgress = Math.max(0.0, Math.min(1.0, saturation / 20.0));
        let satFillWidth = Math.round(barW * satProgress);

        let foodBlitSuccess = false;

        if (hudTex) {
            foodBlitSuccess = safeBlit(guiGraphics, hudTex, rightFlankX, foodY, 0, 0, barW, barH);
            if (foodFillWidth > 0) {
                safeBlit(guiGraphics, hudTex, rightFlankX, foodY, 0, 84, foodFillWidth, barH);
            }
            if (satFillWidth > 0) {
                safeBlit(guiGraphics, hudTex, rightFlankX, foodY, 0, 105, satFillWidth, barH);
            }
        }

        if (!foodBlitSuccess) {
            safeFill(guiGraphics, rightFlankX, foodY + 8, rightFlankX + barW, foodY + 15, COLOR_BORDER);
            safeFill(guiGraphics, rightFlankX + 1, foodY + 9, rightFlankX + barW - 1, foodY + 14, COLOR_BG);
            if (foodFillWidth > 0) {
                safeFillGradient(guiGraphics, rightFlankX + 1, foodY + 9, rightFlankX + 1 + foodFillWidth, foodY + 14, COLOR_FOOD_TOP, COLOR_FOOD_BOT);
            }
            if (satFillWidth > 0) {
                safeFillGradient(guiGraphics, rightFlankX + 1, foodY + 9, rightFlankX + 1 + satFillWidth, foodY + 14, COLOR_SAT_TOP, COLOR_SAT_BOT);
            }
        }

        // Curator rule: at high saturation, simply show total > 20 on left!
        // E.g. foodLevel 20 + saturation 4.0 = 24 on left, 20 on right.
        let curFoodDisplay = (saturation > 0.05) ? Math.round(foodLevel + saturation) : foodLevel;
        drawBarSplitValues(guiGraphics, font, rightFlankX, foodY, curFoodDisplay, 20, COLOR_FOOD_TOP);

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
