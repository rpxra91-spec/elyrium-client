// ==============================================================================
// 🔮 ELYRIUM RPG: RUNIC INSCRIPTION TABLE GUI ENGINE (v1.0)
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 100% Non-Chest Custom Workstation Experience (ARPG / Wynncraft Style):
// - Full-screen custom dark fantasy overlay (`\uF808\uE002`) hiding generic chest art.
// - Clean 4-slot workstation workflow:
//   [Экипировка] + [Древний Глиф] + [Рунная Тушь] ➔ [Результат Зачарования]
// - Zero gray glass panes, zero dummy clutter.
// - Real-time result preview.
// - 100% item safety: zero loss on close.
// ==============================================================================

// Active player sessions
let activeRunicTableSessions = new Map();

function getOrCreateRunicSession(player) {
    let uuid = player.uuid.toString();
    if (!activeRunicTableSessions.has(uuid)) {
        activeRunicTableSessions.set(uuid, {
            gear: null,
            glyph: null,
            ink: null,
            result: null,
            updating: false
        });
    }
    return activeRunicTableSessions.get(uuid);
}

function clearRunicSession(player) {
    let uuid = player.uuid.toString();
    activeRunicTableSessions.delete(uuid);
}

// ------------------------------------------------------------------------------
// CRAFTING EVALUATOR
// ------------------------------------------------------------------------------
function evaluateRunicEnchantment(gear, glyph, ink) {
    if (!gear || gear.isEmpty() || !glyph || glyph.isEmpty() || !ink || ink.isEmpty()) {
        return null;
    }

    if (ink.id !== 'kubejs:runic_ink') return null;

    let parsed = parseGlyphItemId(glyph.id);
    if (!parsed) return null;

    if (!isEligibleGearForGlyph(gear, parsed.type)) return null;

    let glyphDef = GLYPH_DATA[parsed.type];
    if (!glyphDef) return null;

    let incomingRarity = 0;
    try {
        if (glyph.customData && glyph.customData.contains('rarity')) {
            incomingRarity = glyph.customData.getInt('rarity') || 0;
        }
    } catch (e) {}

    let glyphs = getGearGlyphs(gear);
    let existingIndex = -1;
    for (let i = 0; i < glyphs.length; i++) {
        if (glyphs[i].type === parsed.type) {
            existingIndex = i;
            break;
        }
    }

    let resultItem = gear.copy();
    let updatedGlyphs = [];
    glyphs.forEach(g => updatedGlyphs.push({ type: g.type, tier: g.tier, rarity: g.rarity }));

    // SCENARIO 1: GLYPH ALREADY PRESENT
    if (existingIndex !== -1) {
        let existing = updatedGlyphs[existingIndex];
        let maxRarity = getMaxRarityForTier(Math.max(existing.tier, parsed.tier));

        // Subcase A: Higher Tier applied -> Replace with that exact Tier and Rarity of incoming glyph!
        if (parsed.tier > existing.tier) {
            existing.tier = parsed.tier;
            existing.rarity = incomingRarity; // Replaced with applied glyph!
            saveGearGlyphs(resultItem, updatedGlyphs);
            return {
                result: resultItem,
                action: 'TIER_UPGRADE',
                message: `Эволюция: ${glyphDef.name} Tier ${existing.tier} (${RARITY_INFO[existing.rarity].name})`
            };
        }

        // Subcase B: Same Tier applied -> Upgrade Rarity (Common -> Uncommon -> Rare...)
        if (existing.rarity < maxRarity) {
            existing.rarity += 1;
            saveGearGlyphs(resultItem, updatedGlyphs);
            return {
                result: resultItem,
                action: 'RARITY_UPGRADE',
                message: `Возвышение: ${glyphDef.name} T${existing.tier} (${RARITY_INFO[existing.rarity].name})`
            };
        } else {
            return null; // Reached rarity cap for this world tier
        }
    }

    // SCENARIO 2: NEW GLYPH (CHECK CAPACITY MAX 2)
    if (updatedGlyphs.length >= 2) {
        return null; // Capacity full (2/2)
    }

    updatedGlyphs.push({
        type: parsed.type,
        tier: parsed.tier,
        rarity: incomingRarity
    });

    saveGearGlyphs(resultItem, updatedGlyphs);
    return {
        result: resultItem,
        action: 'NEW_GLYPH',
        message: `Начертание: ${glyphDef.name} T${parsed.tier} (${RARITY_INFO[incomingRarity].name})`
    };
}

// ------------------------------------------------------------------------------
// BLOCK RIGHT-CLICK INTERACTION
// ------------------------------------------------------------------------------
BlockEvents.rightClicked('kubejs:runic_table', event => {
    let player = event.player;
    if (!player || player.isFake()) return;

    openRunicTableGUI(player);
});

// ------------------------------------------------------------------------------
// RUNIC SCRIPTORIUM GUI (3-ROW WITH FONT OVERLAY)
// ------------------------------------------------------------------------------
function openRunicTableGUI(player) {
    let session = getOrCreateRunicSession(player);
    session.updating = true;

    // \uF808 = -8px horizontal offset, \uE002 = 176x166 custom scriptorium overlay
    let fullTitle = '\uF808\uE002§r§5§lСТОЛ РУННОГО НАЧЕРТАНИЯ';

    player.openChestGUI(Text.of(fullTitle), 3, gui => {
        gui.playerSlots = true;

        gui.closed = () => {
            // Refund all items left in workstation slots safely
            let refundList = [session.gear, session.glyph, session.ink];
            session.gear = null;
            session.glyph = null;
            session.ink = null;
            session.result = null;

            refundList.forEach(item => {
                if (item && !item.isEmpty()) {
                    player.give(item);
                }
            });

            clearRunicSession(player);
        };

        // Function to refresh the Result Slot
        function updateResultSlot() {
            let evalRes = evaluateRunicEnchantment(session.gear, session.glyph, session.ink);
            if (evalRes && evalRes.result) {
                session.result = evalRes.result;
                gui.slot(7, 1, s => {
                    s.setItem(session.result);
                });
            } else {
                session.result = null;
                gui.slot(7, 1, s => {
                    s.setItem(Item.of('minecraft:air'));
                });
            }
        }

        // Slot 1: [Экипировка] (Col 1, Row 1 = Slot 10)
        gui.slot(1, 1, s => {
            if (session.gear) s.setItem(session.gear);
            s.leftClicked = () => {
                let cursor = player.cursorItem;
                if (!cursor || cursor.isEmpty()) {
                    if (session.gear) {
                        player.setCursorItem(session.gear);
                        session.gear = null;
                        s.setItem(Item.of('minecraft:air'));
                        updateResultSlot();
                    }
                } else {
                    let id = String(cursor.id).toLowerCase();
                    let isGear = cursor.hasTag('minecraft:swords') || cursor.hasTag('c:weapons') || 
                                 cursor.hasTag('minecraft:armors') || cursor.hasTag('c:armors') || 
                                 id.includes('sword') || id.includes('blade') || id.includes('axe') || 
                                 id.includes('helmet') || id.includes('chestplate') || id.includes('leggings') || id.includes('boots');
                    if (isGear) {
                        let old = session.gear;
                        session.gear = cursor.copy();
                        player.setCursorItem(old ? old : Item.of('minecraft:air'));
                        s.setItem(session.gear);
                        updateResultSlot();
                    }
                }
            };
        });

        // Slot 2: [Древний Глиф] (Col 3, Row 1 = Slot 12)
        gui.slot(3, 1, s => {
            if (session.glyph) s.setItem(session.glyph);
            s.leftClicked = () => {
                let cursor = player.cursorItem;
                if (!cursor || cursor.isEmpty()) {
                    if (session.glyph) {
                        player.setCursorItem(session.glyph);
                        session.glyph = null;
                        s.setItem(Item.of('minecraft:air'));
                        updateResultSlot();
                    }
                } else {
                    if (parseGlyphItemId(cursor.id)) {
                        let singleGlyph = cursor.split(1);
                        if (session.glyph) player.give(session.glyph);
                        session.glyph = singleGlyph;
                        s.setItem(session.glyph);
                        updateResultSlot();
                    }
                }
            };
        });

        // Slot 3: [Рунная Тушь] (Col 5, Row 1 = Slot 14)
        gui.slot(5, 1, s => {
            if (session.ink) s.setItem(session.ink);
            s.leftClicked = () => {
                let cursor = player.cursorItem;
                if (!cursor || cursor.isEmpty()) {
                    if (session.ink) {
                        player.setCursorItem(session.ink);
                        session.ink = null;
                        s.setItem(Item.of('minecraft:air'));
                        updateResultSlot();
                    }
                } else {
                    if (cursor.id === 'kubejs:runic_ink') {
                        let singleInk = cursor.split(1);
                        if (session.ink) player.give(session.ink);
                        session.ink = singleInk;
                        s.setItem(session.ink);
                        updateResultSlot();
                    }
                }
            };
        });

        // Slot 4: [Результат Чар] (Col 7, Row 1 = Slot 16)
        gui.slot(7, 1, s => {
            if (session.result) s.setItem(session.result);
            s.leftClicked = () => {
                if (!session.result || session.result.isEmpty()) return;

                let output = session.result.copy();

                // Consume input gear
                session.gear = null;
                gui.slot(1, 1, st => st.setItem(Item.of('minecraft:air')));

                // Consume 1x glyph
                if (session.glyph) {
                    session.glyph.shrink(1);
                    if (session.glyph.count <= 0) session.glyph = null;
                    gui.slot(3, 1, st => st.setItem(session.glyph ? session.glyph : Item.of('minecraft:air')));
                }

                // Consume 1x ink
                if (session.ink) {
                    session.ink.shrink(1);
                    if (session.ink.count <= 0) session.ink = null;
                    gui.slot(5, 1, st => st.setItem(session.ink ? session.ink : Item.of('minecraft:air')));
                }

                session.result = null;
                s.setItem(Item.of('minecraft:air'));

                // Give result to player
                player.give(output);

                // Audio & visual effects
                let server = player.server;
                server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 1.0 1.2`);
                server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 1.0 1.4`);
                server.runCommandSilent(`particle minecraft:enchant ~ ~1.2 ~ 0.5 0.5 0.5 0.2 45`);
                server.runCommandSilent(`particle minecraft:witch ~ ~1.0 ~ 0.4 0.4 0.4 0.1 30`);

                player.tell(Text.of('§a✨ [Начертание Успешно!] §fРуническая печать впечатана в снаряжение!'));
            };
        });

        // Initialize state
        updateResultSlot();
        session.updating = false;
    });
}
