// ==============================================================================
// 🧪 ELYRIUM RPG: MAGIC, SOCKETS & TESTING KITS HELPER
// ==============================================================================
// Commands for instant test kits:
//   .magic   - Gives filled spellbooks with active spells, staves, and spell scrolls
//   .socket  - Gives Apotheosis socket sigils (add gem sockets to weapons/armor),
//              gem cases, gem dust, and gem cutting table
//   .stones  - Gives 5 ranks of Smithing Stones + Ancient Smith's Aegis + weapons
//   .arts    - Gives all 8 Martial Tablets + Tier Succession Templates
//   .kit     - Gives the COMPLETE ALL-IN-ONE testing arsenal!
// ==============================================================================

var K_ISpellContainer = Java.loadClass('io.redspace.ironsspellbooks.api.spells.ISpellContainer');
var K_SpellRegistry = Java.loadClass('io.redspace.ironsspellbooks.api.registry.SpellRegistry');

function createFilledMagicItem(itemId, slots, spellEntries) {
    let kItem = Item.of(itemId);
    let raw = kItem.getItemStack ? kItem.getItemStack() : kItem;
    try {
        let container = K_ISpellContainer.create(slots, true, false);
        let mutable = container.mutableCopy();
        if (spellEntries && spellEntries.length > 0) {
            for (let i = 0; i < spellEntries.length; i++) {
                let sId = spellEntries[i][0];
                let lvl = spellEntries[i][1];
                let locked = spellEntries[i][2] || false;
                let spell = K_SpellRegistry.getSpell(sId);
                if (spell && (!spell.getSpellId || spell.getSpellId() !== 'none')) {
                    mutable.addSpellAtIndex(spell, lvl, i, locked);
                }
            }
        }
        K_ISpellContainer.set(raw, mutable.toImmutable());
        return Item.of(raw);
    } catch (e) {
        console.error('[MagicKit] Error creating filled item ' + itemId + ': ' + e);
        return kItem;
    }
}

function giveMagicArsenal(player) {
    let server = player.server;
    let u = player.username;

    // 1. Give Pre-Filled Diamond Spell Book (8 powerful spells)
    let spellBook = createFilledMagicItem('irons_spellbooks:diamond_spell_book', 8, [
        ['irons_spellbooks:fireball', 5, false],
        ['irons_spellbooks:chain_lightning', 5, false],
        ['irons_spellbooks:heal', 5, false],
        ['irons_spellbooks:ice_spike', 5, false],
        ['irons_spellbooks:blood_slash', 5, false],
        ['irons_spellbooks:black_hole', 3, false],
        ['irons_spellbooks:magic_missile', 5, false],
        ['irons_spellbooks:sonic_boom', 3, false]
    ]);
    player.give(spellBook);

    // 2. Give Pre-Filled Elemental Staves (with innate spells + open slots)
    let pyriumStaff = createFilledMagicItem('irons_spellbooks:pyrium_staff', 4, [
        ['irons_spellbooks:fireball', 5, true]
    ]);
    player.give(pyriumStaff);

    let iceStaff = createFilledMagicItem('irons_spellbooks:ice_staff', 4, [
        ['irons_spellbooks:ice_spike', 5, true]
    ]);
    player.give(iceStaff);

    let bloodStaff = createFilledMagicItem('irons_spellbooks:blood_staff', 4, [
        ['irons_spellbooks:blood_slash', 5, true]
    ]);
    player.give(bloodStaff);

    let lightningRod = createFilledMagicItem('irons_spellbooks:lightning_rod', 4, [
        ['irons_spellbooks:chain_lightning', 5, true]
    ]);
    player.give(lightningRod);

    let graybeardStaff = createFilledMagicItem('irons_spellbooks:graybeard_staff', 3, [
        ['irons_spellbooks:heal', 5, true]
    ]);
    player.give(graybeardStaff);

    // 3. Give Hybrid Netherite Sword with 2 open spell slots
    let netheriteSword = createFilledMagicItem('minecraft:netherite_sword', 2, []);
    player.give(netheriteSword);

    // 4. Inscription Table for custom crafting & spell insertion
    player.give(Item.of('irons_spellbooks:inscription_table', 1));

    // 5. Create active Scrolls in inventory
    let scrolls = [
        ['irons_spellbooks:fireball', 5],
        ['irons_spellbooks:chain_lightning', 5],
        ['irons_spellbooks:heal', 5],
        ['irons_spellbooks:ice_spike', 5],
        ['irons_spellbooks:blood_slash', 5],
        ['irons_spellbooks:black_hole', 3],
        ['irons_spellbooks:magic_missile', 5],
        ['irons_spellbooks:sonic_boom', 3],
        ['irons_spellbooks:blood_step', 3],
        ['irons_spellbooks:spectral_hammer', 4]
    ];

    for (let s of scrolls) {
        server.runCommandSilent(`execute as ${u} at ${u} run createScroll ${s[0]} ${s[1]}`);
    }

    player.tell(Text.of('§a🪄 [Магия Элириума] Выдан полный арсенал заклинателя:'));
    player.tell(Text.of('§e  • Алмазный гримуар с 8 готовыми заклинаниями!'));
    player.tell(Text.of('§e  • 5 стихийных посохов с врожденными заклинаниями!'));
    player.tell(Text.of('§e  • Незеритовый меч с 2 открытыми магическими слотами!'));
    player.tell(Text.of('§e  • Свитки заклинаний 8 школ и Стол Начертания'));
    player.tell(Text.of('§b  • Нажмите «V» для вызова Колеса Заклинаний!'));
}

function giveSocketArsenal(player) {
    player.give(Item.of('apotheosis:sigil_of_socketing', 16));
    player.give(Item.of('apotheosis:sigil_of_enhancement', 8));
    player.give(Item.of('apotheosis:sigil_of_rebirth', 8));
    player.give(Item.of('apotheosis:gem_cutting_table', 1));
    player.give(Item.of('apotheosis:gem_dust', 64));
    player.give(Item.of('apotheosis:gem_case', 8));
    player.give(Item.of('minecraft:smithing_table', 1));

    player.tell(Text.of('§6💎 [Сокеты и Гнёзда Apotheosis] Выдан кузнечный набор:'));
    player.tell(Text.of('§e  • 16x Печать Гнёзд (Sigil of Socketing) — добавьте слоты в Столе Кузнеца!'));
    player.tell(Text.of('§e  • 8x Кейсы с Самоцветами (ПКМ чтобы открыть редкие камни)'));
    player.tell(Text.of('§e  • Стол огранки и Пыль самоцветов'));
}

function giveStonesArsenal(player) {
    player.give(Item.of('kubejs:smithing_stone_1', 64));
    player.give(Item.of('kubejs:smithing_stone_2', 64));
    player.give(Item.of('kubejs:smithing_stone_3', 64));
    player.give(Item.of('kubejs:smithing_stone_4', 64));
    player.give(Item.of('kubejs:smithing_stone_5', 64));
    player.give(Item.of('kubejs:smithing_aegis', 32));
    player.give(Item.of('minecraft:anvil', 16));
    player.give(Item.of('minecraft:netherite_ingot', 16));
    player.give(Item.of('minecraft:diamond', 64));
    player.give(Item.of('minecraft:iron_ingot', 64));
    player.give(Item.of('minecraft:netherite_sword', 1));
    player.give(Item.of('minecraft:diamond_sword', 1));
    player.give(Item.of('minecraft:iron_sword', 1));
    player.give(Item.of('minecraft:shield', 1));
    player.give(Item.of('minecraft:netherite_chestplate', 1));

    player.tell(Text.of('§b🔨 [Кузнечные Камни] Выданы камни заточки (+1..+10), Печати Кузнеца, наковальни и тестовая экипировка!'));
}

function giveArtsArsenal(player) {
    player.give(Item.of('kubejs:martial_tablet_whirlwind', 4));
    player.give(Item.of('kubejs:martial_tablet_earth_sunder', 4));
    player.give(Item.of('kubejs:martial_tablet_juggernaut', 4));
    player.give(Item.of('kubejs:martial_tablet_lightning_thrust', 4));
    player.give(Item.of('kubejs:martial_tablet_blood_rend', 4));
    player.give(Item.of('kubejs:martial_tablet_seismic_slam', 4));
    player.give(Item.of('kubejs:martial_tablet_shadow_step', 4));
    player.give(Item.of('kubejs:martial_tablet_arrow_barrage', 4));
    player.give(Item.of('kubejs:tier_upgrade_template', 16));

    player.tell(Text.of('§d⚔ [Боевые Искусства] Выданы все 8 Трактатов Пепла Войны и Шаблоны Наследия!'));
}

// ------------------------------------------------------------------------------
// CHAT TRIGGER LISTENER
// ------------------------------------------------------------------------------
PlayerEvents.chat(event => {
    let player = event.player;
    if (!player) return;

    let msg = event.message.trim().toLowerCase();

    if (msg === '.magic' || msg === '!magic') {
        event.cancel();
        giveMagicArsenal(player);
        return;
    }

    if (msg === '.socket' || msg === '.sockets' || msg === '!socket') {
        event.cancel();
        giveSocketArsenal(player);
        return;
    }

    if (msg === '.stones' || msg === '!stones') {
        event.cancel();
        giveStonesArsenal(player);
        return;
    }

    if (msg === '.arts' || msg === '!arts') {
        event.cancel();
        giveArtsArsenal(player);
        return;
    }

    if (msg === '.kit' || msg === '!kit' || msg === '.all') {
        event.cancel();
        giveMagicArsenal(player);
        giveSocketArsenal(player);
        giveStonesArsenal(player);
        giveArtsArsenal(player);
        player.tell(Text.of('§a⭐⭐⭐ [ПОЛНЫЙ ТЕСТОВЫЙ НАБОР ВЫДАН] ⭐⭐⭐'));
        return;
    }
});

// ------------------------------------------------------------------------------
// SLASH COMMAND REGISTRATION (/rpgkit, /stones, /arts, /magic)
// ------------------------------------------------------------------------------
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;

    event.register(
        Commands.literal('rpgkit')
            .requires(s => s.hasPermission(0))
            .executes(ctx => {
                let player = ctx.source.player;
                if (!player) return 0;
                giveMagicArsenal(player);
                giveSocketArsenal(player);
                giveStonesArsenal(player);
                giveArtsArsenal(player);
                player.tell(Text.of('§a⭐⭐⭐ [ПОЛНЫЙ ТЕСТОВЫЙ НАБОР ВЫДАН] ⭐⭐⭐'));
                return 1;
            })
    );

    event.register(
        Commands.literal('stones')
            .requires(s => s.hasPermission(0))
            .executes(ctx => {
                let player = ctx.source.player;
                if (!player) return 0;
                giveStonesArsenal(player);
                return 1;
            })
    );

    event.register(
        Commands.literal('arts')
            .requires(s => s.hasPermission(0))
            .executes(ctx => {
                let player = ctx.source.player;
                if (!player) return 0;
                giveArtsArsenal(player);
                return 1;
            })
    );

    event.register(
        Commands.literal('magic')
            .requires(s => s.hasPermission(0))
            .executes(ctx => {
                let player = ctx.source.player;
                if (!player) return 0;
                giveMagicArsenal(player);
                return 1;
            })
    );
});
