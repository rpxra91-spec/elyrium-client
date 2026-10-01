// ==============================================================================
// ⚔️ ELYRIUM RPG: UNIFIED CLASSIC RPG HUD (HEALTH, STAMINA, HUNGER, MANA)
// Minecraft 1.21.1 NeoForge | KubeJS Client Script (v2.3)
// ==============================================================================
// 1. Suppresses vanilla hearts and chicken drumsticks via RenderGuiLayerEvent$Pre:
//    - VanillaGuiLayers.PLAYER_HEALTH
//    - VanillaGuiLayers.FOOD_LEVEL
// 2. Renders clean, modern, symmetrical 2x2 RPG status bars:
//    - LEFT WING:
//      * Stamina Bar (topY: Amber Gold crystal v=45, Shield Block Aura v=105)
//      * Health Bar (bottomY: Ruby Red crystal v=30, Lag-Trail v=90, Absorption v=75)
//    - RIGHT WING:
//      * Hunger & Saturation Bar (topY: Caramel Orange v=60, Radiant Sun Gold v=75)
//      * Native Mana Bar (bottomY: Cyan crystal v=15, ClientMagicData.getPlayerMana())
// 3. Compact 15px bar height, dark matte steel / gunmetal frames (v=0).
// 4. Clean unscaled 1.0 font rendering without emojis/icons, centered in channel.
// 5. Intercepts VanillaGuiLayers.SELECTED_ITEM_NAME to translate up by 20px over bars.
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

// HUD Geometry Constants (Unified 15px Compact RPG Frames: 98x15 px)
var BAR_WIDTH = 98;
var BAR_HEIGHT = 15;

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
        if (mc.screen != null) return;

        let nowTime = Date.now();
        if (nowTime - lastRenderedTick < 4) return;
        lastRenderedTick = nowTime;

        let player = mc.player;
        let window = mc.getWindow();
        let screenWidth = window ? window.getGuiScaledWidth() : (guiGraphics.guiWidth ? guiGraphics.guiWidth() : 400);
        let screenHeight = window ? window.getGuiScaledHeight() : (guiGraphics.guiHeight ? guiGraphics.guiHeight() : 300);

        let midX = Math.floor(screenWidth / 2);
        // Symmetrical 2x2 layout matching 98x15 compact frames:
        let leftX = midX - 99;           // Left wing: midX - 99 to midX - 1
        let rightX = midX + 1;          // Right wing: midX + 1 to midX + 99
        let bottomY = screenHeight - 44; // Bottom row: Health (left) & Mana (right)
        let topY = bottomY - 13;         // Top row: Stamina (left) & Hunger (right)

        let font = mc.font;
        let hudTex = getHudBarsTex();

        // ======================================================================
        // 1. TOP ROW: Stamina (Left: leftX, topY) & Hunger (Right: rightX, topY)
        // ======================================================================

        // ----------------------------------------------------------------------
        // A. PERMANENT STAMINA BAR (Left Side, Top Row: leftX, topY)
        // ----------------------------------------------------------------------
        let stamY = topY;
        displayedStamina += (clientStamina - displayedStamina) * 0.35;
        if (Math.abs(clientStamina - displayedStamina) < 0.1) displayedStamina = clientStamina;

        let maxStam = Math.max(1, clientMaxStamina);
        let stamProgress = Math.max(0.0, Math.min(1.0, displayedStamina / maxStam));
        let stamFillWidth = Math.round(BAR_WIDTH * stamProgress);

        let isBlocking = player.isBlocking ? player.isBlocking() : false;
        let stamBlitSuccess = false;

        if (hudTex) {
            // 1. Frame: Neon cyan glow on block (v=105) or Dark Steel frame (v=0)
            let frameV = isBlocking ? 105 : 0;
            stamBlitSuccess = safeBlit(guiGraphics, hudTex, leftX, stamY, 0, frameV, BAR_WIDTH, BAR_HEIGHT);

            // 2. Amber Gold Stamina Crystal (v=45)
            if (stamFillWidth > 0) {
                safeBlit(guiGraphics, hudTex, leftX, stamY, 0, 45, stamFillWidth, BAR_HEIGHT);
            }
        }

        if (!stamBlitSuccess) {
            let currentStamBorder = isBlocking ? COLOR_STAM_BLOCK : COLOR_BORDER;
            safeFill(guiGraphics, leftX, stamY + 5, leftX + BAR_WIDTH, stamY + 12, currentStamBorder);
            safeFill(guiGraphics, leftX + 1, stamY + 6, leftX + BAR_WIDTH - 1, stamY + 11, COLOR_BG);
            if (stamFillWidth > 0) {
                safeFillGradient(guiGraphics, leftX + 1, stamY + 6, leftX + 1 + stamFillWidth, stamY + 11, COLOR_AMBER_TOP, COLOR_AMBER_BOT);
            }
        }

        // 3. Clean Font 1.0: [stam] / [max]
        let stamText = `${Math.round(clientStamina)}/${Math.round(maxStam)}`;
        if (font) {
            let tw = font.width(stamText);
            let tx = leftX + Math.round((BAR_WIDTH - tw) / 2);
            let ty = stamY + 3;
            safeDrawString(guiGraphics, font, stamText, tx, ty, COLOR_TEXT);
        }

        // ----------------------------------------------------------------------
        // B. HUNGER & SATURATION BAR (Right Side, Top Row: rightX, topY)
        // ----------------------------------------------------------------------
        let foodData = player.getFoodData ? player.getFoodData() : null;
        let foodLevel = foodData ? (foodData.getFoodLevel ? foodData.getFoodLevel() : 20) : 20;
        let saturation = foodData ? (foodData.getSaturationLevel ? foodData.getSaturationLevel() : 5) : 5;

        let foodProgress = Math.max(0.0, Math.min(1.0, foodLevel / 20.0));
        let foodFillWidth = Math.round(BAR_WIDTH * foodProgress);
        let satProgress = Math.max(0.0, Math.min(1.0, saturation / 20.0));
        let satFillWidth = Math.round(BAR_WIDTH * satProgress);

        let foodY = topY;
        let foodBlitSuccess = false;

        if (hudTex) {
            // 1. Dark Steel Frame (v=0)
            foodBlitSuccess = safeBlit(guiGraphics, hudTex, rightX, foodY, 0, 0, BAR_WIDTH, BAR_HEIGHT);

            // 2. Caramel Orange Food Crystal (v=60)
            if (foodFillWidth > 0) {
                safeBlit(guiGraphics, hudTex, rightX, foodY, 0, 60, foodFillWidth, BAR_HEIGHT);
            }

            // 3. Radiant Sun Gold Saturation Overlay (v=75)
            if (satFillWidth > 0) {
                safeBlit(guiGraphics, hudTex, rightX, foodY, 0, 75, satFillWidth, BAR_HEIGHT);
            }
        }

        if (!foodBlitSuccess) {
            safeFill(guiGraphics, rightX, foodY + 5, rightX + BAR_WIDTH, foodY + 12, COLOR_BORDER);
            safeFill(guiGraphics, rightX + 1, foodY + 6, rightX + BAR_WIDTH - 1, foodY + 11, COLOR_BG);
            if (foodFillWidth > 0) {
                safeFillGradient(guiGraphics, rightX + 1, foodY + 6, rightX + 1 + foodFillWidth, foodY + 11, COLOR_FOOD_TOP, COLOR_FOOD_BOT);
            }
            if (satFillWidth > 0) {
                safeFillGradient(guiGraphics, rightX + 1, foodY + 6, rightX + 1 + satFillWidth, foodY + 11, COLOR_SAT_TOP, COLOR_SAT_BOT);
            }
        }

        // 4. Clean Font 1.0: [food]/20 (+[sat])
        let satFormatted = (saturation > 0.05) ? saturation.toFixed(1) : '0';
        let foodText = `${foodLevel}/20` + (saturation > 0.05 ? ` (+${satFormatted})` : '');

        if (font) {
            let tw = font.width(foodText);
            let tx = rightX + Math.round((BAR_WIDTH - tw) / 2);
            let ty = foodY + 3;
            safeDrawString(guiGraphics, font, foodText, tx, ty, COLOR_TEXT);
        }

        // ======================================================================
        // 2. BOTTOM ROW: Health (Left: leftX, bottomY) & Mana (Right: rightX, bottomY)
        // ======================================================================

        // ----------------------------------------------------------------------
        // C. HEALTH BAR (Left Side, Bottom Row: leftX, bottomY)
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
        let hpFillWidth = Math.round(BAR_WIDTH * hpProgress);
        let lagFillWidth = Math.round(BAR_WIDTH * lagProgress);
        let absProgress = Math.max(0.0, Math.min(1.0, absorption / Math.max(1, maxHealth)));
        let absFillWidth = Math.round(BAR_WIDTH * absProgress);

        let hpBlitSuccess = false;
        if (hudTex) {
            // 1. Outer Dark Steel Frame (v=0)
            hpBlitSuccess = safeBlit(guiGraphics, hudTex, leftX, bottomY, 0, 0, BAR_WIDTH, BAR_HEIGHT);

            // 2. Damage Lag-Trail (v=90)
            if (lagFillWidth > hpFillWidth) {
                safeBlit(guiGraphics, hudTex, leftX, bottomY, 0, 90, lagFillWidth, BAR_HEIGHT);
            }

            // 3. Ruby Red Health Crystal (v=30)
            if (hpFillWidth > 0) {
                safeBlit(guiGraphics, hudTex, leftX, bottomY, 0, 30, hpFillWidth, BAR_HEIGHT);
            }

            // 4. Radiant Sun Gold Absorption Shield Overlay (v=75)
            if (absFillWidth > 0) {
                safeBlit(guiGraphics, hudTex, leftX, bottomY, 0, 75, absFillWidth, BAR_HEIGHT);
            }
        }

        // Fallback to safeFill if texture is unavailable
        if (!hpBlitSuccess) {
            safeFill(guiGraphics, leftX, bottomY + 5, leftX + BAR_WIDTH, bottomY + 12, COLOR_BORDER);
            safeFill(guiGraphics, leftX + 1, bottomY + 6, leftX + BAR_WIDTH - 1, bottomY + 11, COLOR_BG);
            if (lagFillWidth > hpFillWidth) {
                safeFill(guiGraphics, leftX + 1, bottomY + 6, leftX + 1 + lagFillWidth, bottomY + 11, COLOR_LAG);
            }
            if (hpFillWidth > 0) {
                safeFillGradient(guiGraphics, leftX + 1, bottomY + 6, leftX + 1 + hpFillWidth, bottomY + 11, COLOR_HP_TOP, COLOR_HP_BOT);
            }
            if (absFillWidth > 0) {
                safeFillGradient(guiGraphics, leftX + 1, bottomY + 6, leftX + 1 + absFillWidth, bottomY + 11, COLOR_ABS_TOP, COLOR_ABS_BOT);
            }
        }

        // 5. Clean Font 1.0: [cur] / [max] (and (+[abs]) if absorption > 0.1)
        let hpText = `${Math.ceil(curHealth)}/${Math.ceil(maxHealth)}` + (absorption > 0.1 ? ` (+${Math.ceil(absorption)})` : '');
        if (font) {
            let tw = font.width(hpText);
            let tx = leftX + Math.round((BAR_WIDTH - tw) / 2);
            let ty = bottomY + 3;
            safeDrawString(guiGraphics, font, hpText, tx, ty, COLOR_TEXT);
        }

        // ----------------------------------------------------------------------
        // D. MANA BAR (Right Side, Bottom Row: rightX, bottomY)
        // ----------------------------------------------------------------------
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
        let manaFillWidth = Math.round(BAR_WIDTH * manaProgress);

        let manaY = bottomY;
        let manaBlitSuccess = false;

        if (hudTex) {
            // 1. Dark Steel Frame (v=0)
            manaBlitSuccess = safeBlit(guiGraphics, hudTex, rightX, manaY, 0, 0, BAR_WIDTH, BAR_HEIGHT);

            // 2. Cyan Mana Crystal (v=15)
            if (manaFillWidth > 0) {
                safeBlit(guiGraphics, hudTex, rightX, manaY, 0, 15, manaFillWidth, BAR_HEIGHT);
            }
        }

        if (!manaBlitSuccess) {
            safeFill(guiGraphics, rightX, manaY + 5, rightX + BAR_WIDTH, manaY + 12, COLOR_BORDER);
            safeFill(guiGraphics, rightX + 1, manaY + 6, rightX + BAR_WIDTH - 1, manaY + 11, COLOR_BG);
            if (manaFillWidth > 0) {
                safeFillGradient(guiGraphics, rightX + 1, manaY + 6, rightX + 1 + manaFillWidth, manaY + 11, COLOR_MANA_TOP, COLOR_MANA_BOT);
            }
        }

        // 3. Clean Font 1.0: [curMana]/[maxMana] in ChatFormatting.AQUA
        let manaText = `${Math.round(curMana)}/${Math.round(maxMana)}`;
        if (font) {
            let tw = font.width(manaText);
            let tx = rightX + Math.round((BAR_WIDTH - tw) / 2);
            let ty = manaY + 3;
            safeDrawString(guiGraphics, font, manaText, tx, ty, COLOR_TEXT_MANA);
        }

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
        // Intercept SELECTED_ITEM_NAME to translate upwards (+Y is downwards, so -20 moves it up)
        if (name.equals(J_VanillaGuiLayers.SELECTED_ITEM_NAME)) {
            let gg = event.getGuiGraphics ? event.getGuiGraphics() : event.guiGraphics;
            let pose = gg && gg.pose ? gg.pose() : null;
            if (pose) {
                pose.pushPose();
                pose.translate(0, -20, 0);
                isSelectedItemPosePushed = true;
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
