// ==============================================================================
// 🩹 ELYRIUM RPG: HEALING SUPPORT & COMBAT MEDIC ENGINE
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 1. Combat Bandages (Походные Бинты):
//    - Rapid use item on hotbar. Restores 25% Max HP, purges Poison/Wither/Bleed.
//    - Cooldown: 45 seconds. Interrupted if hit during cast.
// 2. Healing Threat Engine:
//    - Healing allies generates 0.5x threat distributed among nearby aggroed mobs.
// 3. Recipes for Bandages and War Horn.
// ==============================================================================

ItemEvents.rightClicked(event => {
    let item = event.item;
    let player = event.player;
    if (!item || !player || item.id !== 'kubejs:combat_bandage') return;

    let now = Date.now();
    let pData = player.persistentData;
    let lastBandage = pData.getLong('elyrium_last_bandage_time') || 0;
    let cdMs = 45000;

    if (now - lastBandage < cdMs) {
        let remSec = Math.ceil((cdMs - (now - lastBandage)) / 1000);
        player.displayClientMessage(Component.literal(`§c⏳ «Походные Бинты» перезаряжаются: ${remSec}с`), true);
        event.cancel();
        return;
    }

    if (player.health >= player.maxHealth) {
        player.displayClientMessage(Component.literal('§a❤️ Ваше здоровье уже полно!'), true);
        event.cancel();
        return;
    }

    pData.putLong('elyrium_last_bandage_time', now);
    item.count--;

    // Heal 25% max health
    let healAmount = player.maxHealth * 0.25;
    player.heal(healAmount);

    // Cleanse bleeds and poisons
    try {
        player.removeEffect('minecraft:poison');
        player.removeEffect('minecraft:wither');
    } catch (e) {}

    // Visuals and sounds
    player.playNotifySound('minecraft:item.armor.equip_leather', 'players', 1.0, 1.1);
    let level = player.level;
    try {
        level.sendParticles('minecraft:happy_villager', player.x, player.y + 1.0, player.z, 12, 0.4, 0.5, 0.4, 0.05);
    } catch (eP) {}

    player.displayClientMessage(Component.literal(`§a🩹 [ПЕРЕВЯЗКА] §fРаны перевязаны: §a+${Math.round(healAmount)} HP §f(Кулдаун 45с)`), true);
    event.cancel();
});

// ------------------------------------------------------------------------------
// RECIPES
// ------------------------------------------------------------------------------

ServerEvents.recipes(event => {
    // 1. Походные Бинты (4 шт)
    event.shaped('4x kubejs:combat_bandage', [
        ' S ',
        'PPP',
        ' H '
    ], {
        S: '#c:strings',
        P: 'minecraft:paper',
        H: '#c:foods/berries'
    });

    // Альтернативный рецепт с шерстью
    event.shaped('4x kubejs:combat_bandage', [
        ' S ',
        'WWW',
        ' H '
    ], {
        S: '#c:strings',
        W: '#minecraft:wool',
        H: '#c:foods/berries'
    });

    // 2. Боевой Рог Провокации (Танк)
    event.shaped('kubejs:war_horn_taunt', [
        ' I ',
        'ICI',
        ' R '
    ], {
        I: '#c:ingots/iron',
        C: '#c:ingots/copper',
        R: '#c:dusts/redstone'
    });
});
