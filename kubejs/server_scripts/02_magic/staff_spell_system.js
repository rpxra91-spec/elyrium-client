// staff_spell_system.js - Elyrium Staff & Unique Implement Engine
// Auto-initializes Unique Staves with innate spells + open inscription slots.
// Integrated with spell_capacity_engine.js for Hybrid Sockets & Spell Weights.

var ISpellContainer = ISpellContainer || Java.loadClass('io.redspace.ironsspellbooks.api.spells.ISpellContainer');
var SpellRegistry = SpellRegistry || Java.loadClass('io.redspace.ironsspellbooks.api.registry.SpellRegistry');

// Unique Staves definitions: innate spell + level + total max slots
const STAFF_CONFIG = {
    'irons_spellbooks:graybeard_staff': {
        spell: 'irons_spellbooks:root',
        level: 2,
        maxSpells: 3 // 1 innate + 2 inscription slots
    },
    'irons_spellbooks:artificer_cane': {
        spell: 'irons_spellbooks:magic_missile',
        level: 2,
        maxSpells: 3 // 1 innate + 2 inscription slots
    },
    'irons_spellbooks:ice_staff': {
        spell: 'irons_spellbooks:icicle',
        level: 3,
        maxSpells: 4 // 1 innate + 3 inscription slots
    },
    'irons_spellbooks:lightning_rod': {
        spell: 'irons_spellbooks:lightning_bolt',
        level: 3,
        maxSpells: 4 // 1 innate + 3 inscription slots
    },
    'irons_spellbooks:blood_staff': {
        spell: 'irons_spellbooks:blood_slash',
        level: 3,
        maxSpells: 4 // 1 innate + 3 inscription slots
    },
    'irons_spellbooks:pyrium_staff': {
        spell: 'irons_spellbooks:firebolt',
        level: 4,
        maxSpells: 4 // 1 innate + 3 inscription slots
    },
    'irons_spellbooks:hither_thither_wand': {
        spell: 'irons_spellbooks:teleport',
        level: 3,
        maxSpells: 4 // 1 innate + 3 inscription slots
    },
    'irons_spellbooks:staff_of_the_nines': {
        spell: 'irons_spellbooks:eldritch_blast',
        level: 5,
        maxSpells: 5 // 1 innate + 4 inscription slots
    },
    'kubejs:rift_apprentice_staff': {
        spell: 'irons_spellbooks:magic_missile',
        level: 1,
        maxSpells: 3 // 1 innate + 2 inscription slots
    },
    'kubejs:cinder_staff': {
        spell: 'irons_spellbooks:firebolt',
        level: 2,
        maxSpells: 4 // 1 innate + 3 inscription slots
    }
};

function getRawItemStack(item) {
    if (!item) return null;
    if (typeof item.getItemStack === 'function') {
        return item.getItemStack();
    }
    return item;
}

function setupStaffSpellContainer(itemStack) {
    if (!itemStack || itemStack.isEmpty()) return false;
    let itemId = String(itemStack.id);
    let cfg = STAFF_CONFIG[itemId];
    if (!cfg) return false;

    let raw = getRawItemStack(itemStack);
    if (!raw) return false;

    // Check if item already has spells inscribed
    if (ISpellContainer.isSpellContainer(raw)) {
        let existing = ISpellContainer.get(raw);
        if (existing && !existing.isEmpty()) {
            return false;
        }
    }

    try {
        let spell = SpellRegistry.getSpell(cfg.spell);
        if (!spell || (spell.getSpellId && spell.getSpellId() === 'none')) {
            console.error(`[StaffMagic] Could not find spell: ${cfg.spell}`);
            return false;
        }

        // create(maxSpells, addsToSpellWheel, mustBeEquipped)
        // mustBeEquipped = false allows casting directly from hand without equipping in curio!
        let container = ISpellContainer.create(cfg.maxSpells, true, false);
        let mutable = container.mutableCopy();

        // Slot 0: innate locked spell
        mutable.addSpellAtIndex(spell, cfg.level, 0, true);

        // Commit to ItemStack
        ISpellContainer.set(raw, mutable.toImmutable());
        console.info(`[StaffMagic] Successfully initialized ${itemId} with ${cfg.spell} (lvl ${cfg.level}) and ${cfg.maxSpells - 1} open slots!`);
        return true;
    } catch (e) {
        console.error(`[StaffMagic] Failed to initialize ${itemId}: ${e}`);
        return false;
    }
}

// 1. Inventory Check: When player holds or interacts with staves in inventory
PlayerEvents.tick(event => {
    let player = event.player;
    if (!player || !player.isAlive()) return;
    let age = (player.age !== undefined && player.age !== null) ? player.age : (player.tickCount || 0);
    if (age % 20 !== 0) return; // Check every 1.0s

    let inv = player.inventory;
    if (inv) {
        let size = inv.getContainerSize ? inv.getContainerSize() : (inv.size || 36);
        for (let i = 0; i < size; i++) {
            let stack = inv.getItem(i);
            if (stack && !stack.isEmpty() && STAFF_CONFIG[String(stack.id)]) {
                setupStaffSpellContainer(stack);
            }
        }
    }
});

// 2. Crafting Check: When player crafts a staff
ItemEvents.crafted(event => {
    let stack = event.item;
    if (stack && STAFF_CONFIG[String(stack.id)]) {
        setupStaffSpellContainer(stack);
    }
});
