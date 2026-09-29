// ==============================================================================
// ⚔️ ELYRIUM RPG: TWO-HANDED OFFHAND VISUAL HIDER (CLIENT SCRIPT)
// Minecraft 1.21.1 NeoForge | KubeJS Client Script
// ==============================================================================
// Hides the offhand shield/item rendering in first person when holding
// a two-handed weapon (claymore, greatsword, bows, crossbows, spears, etc.)
// ==============================================================================

let J_RenderHandEvent_2H = null;
let J_InteractionHand_2H = null;
let J_WeaponRegistry_Client2H = null;
let J_Minecraft_2H = null;
let J_NeoForge_2H = null;
let J_Consumer_2H = null;
let isTwoHandedApiInit = false;

let isClientOffhandLocked = false;
let isRenderHandSubscribed = false;

function initTwoHandedClientApi() {
    if (isTwoHandedApiInit) return;
    try {
        J_RenderHandEvent_2H = Java.loadClass('net.neoforged.neoforge.client.event.RenderHandEvent');
        J_InteractionHand_2H = Java.loadClass('net.minecraft.world.InteractionHand');
        J_Minecraft_2H = Java.loadClass('net.minecraft.client.Minecraft');
    } catch (e) {}

    try {
        J_WeaponRegistry_Client2H = Java.loadClass('net.bettercombat.logic.WeaponRegistry');
    } catch (eBc) {}

    try {
        J_NeoForge_2H = Java.loadClass('net.neoforged.neoforge.common.NeoForge');
        J_Consumer_2H = Java.loadClass('java.util.function.Consumer');
    } catch (eNf) {}

    isTwoHandedApiInit = true;
}

function checkTwoHandedClient(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;

    if (J_WeaponRegistry_Client2H) {
        try {
            let rawStack = item.getItemStack ? item.getItemStack() : (item.minecraftItemStack || item);
            let attrs = J_WeaponRegistry_Client2H.getAttributes(rawStack);
            if (attrs) {
                if (typeof attrs.two_handed === 'function' && attrs.two_handed()) return true;
                if (attrs.two_handed === true) return true;
            }
        } catch (e) {}
    }

    let id = String(item.id || '').toLowerCase();
    if (id.includes('bow') || id.includes('crossbow')) return true;
    if (id.includes('spear') || id.includes('lance') || id.includes('halberd') || id.includes('glaive') || id.includes('staff')) return true;
    if (id.includes('claymore') || id.includes('greathammer') || id.includes('greatsword') ||
        id.includes('scythe') || id.includes('breaker') || id.includes('hammer') ||
        id.includes('greataxe') || id.includes('twinblade') || id.includes('zweihander') || id.includes('colossal')) {
        return true;
    }

    try {
        if (item.hasTag && (item.hasTag('c:two_handed') || item.hasTag('bettercombat:two_handed') || item.hasTag('skd:two_handed'))) {
            return true;
        }
    } catch (eTag) {}

    return false;
}

function isOffhandRestrictedClient(item) {
    if (!item || item.isEmpty() || item.id === 'minecraft:air') return false;
    let id = String(item.id || '').toLowerCase();
    if (id.includes('shield')) return true;
    try {
        if (item.hasTag && (item.hasTag('c:tools/shields') || item.hasTag('c:shields') || item.hasTag('minecraft:shields'))) {
            return true;
        }
    } catch (eTag) {}
    return false;
}

function handleRenderHand(event) {
    if (!event) return;
    try {
        let hand = event.getHand();
        let isOffhand = (hand && (hand === J_InteractionHand_2H.OFF_HAND || String(hand).includes('OFF')));
        if (!isOffhand) return;

        let mc = J_Minecraft_2H ? J_Minecraft_2H.getInstance() : null;
        if (!mc || !mc.player) return;

        let mainItem = mc.player.getMainHandItem ? mc.player.getMainHandItem() : mc.player.mainHandItem;
        let is2H = isClientOffhandLocked || checkTwoHandedClient(mainItem);

        if (is2H) {
            let offItem = event.getItemStack ? event.getItemStack() : mc.player.getOffhandItem();
            if (isOffhandRestrictedClient(offItem) || isClientOffhandLocked) {
                event.setCanceled(true);
            }
        }
    } catch (eHand) {}
}

// 1. Network listener for lock state sync
NetworkEvents.dataReceived('elyrium:offhand_lock_state', event => {
    try {
        let d = event.data;
        if (typeof d.locked === 'boolean') {
            isClientOffhandLocked = d.locked;
        } else if (typeof d.getBoolean === 'function') {
            isClientOffhandLocked = d.getBoolean('locked');
        }
    } catch (e) {}
});

// 2. Client-side tick to check lock state proactively
ClientEvents.tick(event => {
    initTwoHandedClientApi();

    let mc = J_Minecraft_2H ? J_Minecraft_2H.getInstance() : null;
    if (mc && mc.player) {
        let mainItem = mc.player.getMainHandItem ? mc.player.getMainHandItem() : mc.player.mainHandItem;
        let offItem = mc.player.getOffhandItem ? mc.player.getOffhandItem() : mc.player.offHandItem;
        isClientOffhandLocked = checkTwoHandedClient(mainItem) && isOffhandRestrictedClient(offItem);
    }

    // Lazy subscription to RenderHandEvent
    if (!isRenderHandSubscribed && J_RenderHandEvent_2H) {
        try {
            if (typeof NativeEvents !== 'undefined') {
                NativeEvents.onEvent(J_RenderHandEvent_2H, event => {
                    handleRenderHand(event);
                });
                isRenderHandSubscribed = true;
            } else if (J_NeoForge_2H && J_Consumer_2H) {
                let listener = new J_Consumer_2H({
                    accept: function(ev) {
                        handleRenderHand(ev);
                    }
                });
                J_NeoForge_2H.EVENT_BUS.addListener(listener);
                isRenderHandSubscribed = true;
            }
        } catch (eSub) {}
    }
});
