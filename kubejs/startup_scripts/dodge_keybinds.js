// ==============================================================================
// ⚔️ ELYRIUM RPG: SOULS DODGE KEYBINDS REGISTRATION (STARTUP SCRIPT)
// Minecraft 1.21.1 NeoForge | KubeJS Startup Script
// ==============================================================================
// Registers custom keybinding 'elyrium.dodge' mapped to Left Alt by default.
// Category: 'key.categories.movement'
// ==============================================================================

try {
    if (typeof KeyBindEvents !== 'undefined' && KeyBindEvents.registry) {
        KeyBindEvents.registry(event => {
            try {
                let builder = event.register('elyrium.dodge', 'key.categories.movement');
                if (builder) {
                    if (typeof builder.defaultKey === 'function') {
                        builder.defaultKey('KEY_LEFT_ALT');
                    }
                    if (typeof builder.inGame === 'function') {
                        builder.inGame();
                    }
                }
            } catch (eInner) {}
        });
    }
} catch (eOuter) {}
