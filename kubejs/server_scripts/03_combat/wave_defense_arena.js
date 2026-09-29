// ==============================================================================
// 🏟️ ELYRIUM RPG: WAVE DEFENSE ARENA & COLOSSEUM GATEWAYS
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 1. Gate Pearl Activation: Opens the Elyrium Colosseum Wave Gateway.
// 2. Announcements, combat alerts and sound effects.
// ==============================================================================

ItemEvents.rightClicked(event => {
    let item = event.item;
    let player = event.player;
    if (!item || !player || item.id !== 'kubejs:gate_pearl_colosseum') return;

    let level = player.level;
    let blockPos = player.blockPosition();

    // Consume 1 Pearl
    item.count--;

    // Sound & particles
    player.playNotifySound('minecraft:entity.warden.emerge', 'players', 1.0, 0.9);
    try {
        level.sendParticles('minecraft:portal', player.x, player.y + 1.0, player.z, 50, 1.5, 1.0, 1.5, 0.2);
    } catch (eP) {}

    // Open Gateway
    player.server.runCommandSilent(`execute at ${player.username} run gateway open gateways:elyrium_colosseum`);

    player.displayClientMessage(Component.literal('§5⚡ [КОЛИЗЕЙ ЭЛИРИУМА] §fВрата Испытаний пробуждены! Приготовьтесь к обороне!'), true);
    event.cancel();
});
