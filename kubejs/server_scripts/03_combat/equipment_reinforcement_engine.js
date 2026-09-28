// ==============================================================================
// 🔨 ELYRIUM RPG: VANILLA ANVIL REINFORCEMENT LOCK
// ==============================================================================
// Reinforcement (+1..+10) is exclusively performed on the Infernal Anvil (Tier 4)
// via the dedicated backend API (elyrium_forge_api.js) and GUI (infernal_anvil_gui.js).
// Vanilla Anvils cannot withstand the heat of Smithing Stones.
// ==============================================================================

try {
    let NeoForge = Java.loadClass('net.neoforged.neoforge.common.NeoForge');
    let AnvilUpdateEventClass = Java.loadClass('net.neoforged.neoforge.event.AnvilUpdateEvent');
    let Consumer = Java.loadClass('java.util.function.Consumer');

    let anvilListener = new Consumer({
        accept: function(event) {
            let right = event.right;
            if (!right || right.isEmpty()) return;

            let rId = right.id ? String(right.id) : '';
            if (rId.startsWith('kubejs:smithing_stone_') || rId === 'kubejs:ancient_smith_aegis') {
                event.setOutput(Item.empty);
                let player = event.player;
                if (player) {
                    player.displayClientMessage(
                        Text.of('§c✖ Обычная наковальня раскалывается от жара! §eИспользуйте §6Адскую Наковальню§e (Tier 4 Незер).'),
                        true
                    );
                }
            }
        }
    });

    NeoForge.EVENT_BUS['addListener(java.lang.Class,java.util.function.Consumer)'](AnvilUpdateEventClass, anvilListener);
} catch (e) {
    console.error('[AnvilLock] NeoForge AnvilUpdateEvent registration error: ' + e);
}
