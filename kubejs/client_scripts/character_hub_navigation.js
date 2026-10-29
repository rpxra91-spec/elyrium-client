// ==============================================================================
// 🏛️ ELYRIUM RPG: UNIFIED CHARACTER SHEET & NAVIGATION HUB
// ==============================================================================
// Unifies Character Stats (SimpleStats [C]), Passive Constellation Tree
// (Puffish Skills [N]), and Quest Journal (FTB Quests [J]) into a seamless,
// integrated character sheet experience with visual tabs and fast-switch hotkeys.
// Also maintains anti-exploit protection (disables free respec '-' buttons).
// ==============================================================================

function hideDowngradeButtons(screen) {
    if (!screen) return;
    try {
        if (screen.getClass().getName() !== 'network.roto.simplestats.client.SimpleStatsScreen') return;
        let children = screen.children();
        if (!children) return;
        for (let i = 0; i < children.size(); i++) {
            let widget = children.get(i);
            if (widget && typeof widget.getMessage === 'function') {
                let msg = widget.getMessage();
                if (msg) {
                    let text = String(msg.getString()).trim();
                    if (text === '-') {
                        widget.visible = false;
                        widget.active = false;
                        if (typeof widget.setVisible === 'function') widget.setVisible(false);
                        if (typeof widget.setActive === 'function') widget.setActive(false);
                    }
                }
            }
        }
    } catch (screenErr) {
        // Guard against any internal screen access issues
    }
}

function openSkillsScreen() {
    try {
        let SkillsClientMod = Java.loadClass('net.puffish.skillsmod.client.SkillsClientMod');
        let Optional = Java.loadClass('java.util.Optional');
        SkillsClientMod.getInstance().openScreen(Optional.empty());
    } catch (e) {
        console.error('[Character Hub] Failed to open SkillsScreen: ' + e);
    }
}

function openSimpleStatsScreen() {
    try {
        let Minecraft = Java.loadClass('net.minecraft.client.Minecraft');
        let SimpleStatsScreen = Java.loadClass('network.roto.simplestats.client.SimpleStatsScreen');
        Minecraft.getInstance().setScreen(new SimpleStatsScreen());
    } catch (e) {
        console.error('[Character Hub] Failed to open SimpleStatsScreen: ' + e);
    }
}

function openQuestsScreen() {
    try {
        let ClientQuestFile = Java.loadClass('dev.ftb.mods.ftbquests.client.ClientQuestFile');
        ClientQuestFile.openGui();
    } catch (e) {
        console.error('[Character Hub] Failed to open QuestScreen: ' + e);
    }
}

try {
    let NeoForge = Java.loadClass('net.neoforged.neoforge.common.NeoForge');
    let Consumer = Java.loadClass('java.util.function.Consumer');
    let ScreenEventInitPost = Java.loadClass('net.neoforged.neoforge.client.event.ScreenEvent$Init$Post');
    let ScreenEventRenderPre = Java.loadClass('net.neoforged.neoforge.client.event.ScreenEvent$Render$Pre');
    let ScreenEventKeyPressedPre = Java.loadClass('net.neoforged.neoforge.client.event.ScreenEvent$KeyPressed$Pre');

    let Button = Java.loadClass('net.minecraft.client.gui.components.Button');
    let Component = Java.loadClass('net.minecraft.network.chat.Component');
    let OnPress = Java.loadClass('net.minecraft.client.gui.components.Button$OnPress');

    // 1. Screen Init: Add Navigation Tabs & Enforce Anti-Exploit
    let initListener = new Consumer({
        accept: function(event) {
            try {
                if (!event || typeof event.getScreen !== 'function') return;
                let scr = event.getScreen();
                if (!scr) return;
                let className = scr.getClass().getName();

                // Case A: SimpleStatsScreen
                if (className === 'network.roto.simplestats.client.SimpleStatsScreen') {
                    hideDowngradeButtons(scr);

                    let sw = scr.width;
                    let sh = scr.height;
                    let topY = Math.max(4, Math.floor((sh - 240) / 2) - 24);
                    let centerX = Math.floor(sw / 2);

                    // Tab: Stats (Active)
                    let btnStats = Button.builder(Component.literal('§6📊 Статы'), new OnPress({
                        onPress: function(btn) {}
                    })).bounds(centerX - 110, topY, 65, 20).build();
                    btnStats.active = false;
                    event.addListener(btnStats);

                    // Tab: Constellations (Switch to N)
                    let btnSkills = Button.builder(Component.literal('§b✨ Навыки [N]'), new OnPress({
                        onPress: function(btn) {
                            openSkillsScreen();
                        }
                    })).bounds(centerX - 42, topY, 84, 20).build();
                    event.addListener(btnSkills);

                    // Tab: Quests (Switch to J)
                    let btnQuests = Button.builder(Component.literal('§e📜 Квесты [J]'), new OnPress({
                        onPress: function(btn) {
                            openQuestsScreen();
                        }
                    })).bounds(centerX + 45, topY, 65, 20).build();
                    event.addListener(btnQuests);
                }

                // Case B: Puffish SkillsScreen
                if (className === 'net.puffish.skillsmod.client.gui.SkillsScreen') {
                    // Top-Left Return Buttons
                    let btnStats = Button.builder(Component.literal('§6📊 Статы [C]'), new OnPress({
                        onPress: function(btn) {
                            openSimpleStatsScreen();
                        }
                    })).bounds(8, 8, 95, 20).build();
                    event.addListener(btnStats);

                    let btnQuests = Button.builder(Component.literal('§e📜 Квесты [J]'), new OnPress({
                        onPress: function(btn) {
                            openQuestsScreen();
                        }
                    })).bounds(107, 8, 85, 20).build();
                    event.addListener(btnQuests);
                }
            } catch (initErr) {
                // Safeguard against title screen or startup crash
            }
        }
    });
    NeoForge.EVENT_BUS['addListener(java.lang.Class,java.util.function.Consumer)'](ScreenEventInitPost, initListener);

    // 2. Render Pre: Continuously ensure anti-exploit downgrade buttons stay hidden
    let renderListener = new Consumer({
        accept: function(event) {
            try {
                if (event && typeof event.getScreen === 'function') {
                    let scr = event.getScreen();
                    if (scr && scr.getClass().getName() === 'network.roto.simplestats.client.SimpleStatsScreen') {
                        hideDowngradeButtons(scr);
                    }
                }
            } catch (renderErr) {}
        }
    });
    NeoForge.EVENT_BUS['addListener(java.lang.Class,java.util.function.Consumer)'](ScreenEventRenderPre, renderListener);

    // 3. Fast Hotkey Tab Switching: [C] <-> [N] <-> [J]
    let keyListener = new Consumer({
        accept: function(event) {
            try {
                if (!event || typeof event.getScreen !== 'function' || typeof event.getKeyCode !== 'function') return;
                let scr = event.getScreen();
                if (!scr) return;
                let className = scr.getClass().getName();
                let keyCode = event.getKeyCode();

                // KeyCode 67 = 'C' (Stats)
                // KeyCode 78 = 'N' (Skills)
                // KeyCode 74 = 'J' (Quests)

                if (className === 'network.roto.simplestats.client.SimpleStatsScreen') {
                    if (keyCode === 78) { // N pressed inside stats
                        openSkillsScreen();
                    } else if (keyCode === 74) { // J pressed inside stats
                        openQuestsScreen();
                    }
                } else if (className === 'net.puffish.skillsmod.client.gui.SkillsScreen') {
                    if (keyCode === 67) { // C pressed inside skills
                        openSimpleStatsScreen();
                    } else if (keyCode === 74) { // J pressed inside skills
                        openQuestsScreen();
                    }
                }
            } catch (keyErr) {}
        }
    });
    NeoForge.EVENT_BUS['addListener(java.lang.Class,java.util.function.Consumer)'](ScreenEventKeyPressedPre, keyListener);

    console.info('[Elyrium Character Hub] Unified Character Hub navigation registered successfully.');
} catch (e) {
    console.info('[Elyrium Character Hub] ScreenEvent listener registration skipped (headless/server): ' + e);
}
