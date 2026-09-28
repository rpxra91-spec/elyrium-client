// ==============================================================================
// 🗡️ ELYRIUM RPG: WEAPONMASTER'S CHISEL (РЕЗЕЦ ОРУЖЕЙНИКА)
// Minecraft 1.21.1 NeoForge | KubeJS Startup Script
// ==============================================================================

StartupEvents.registry('item', event => {
    event.create('weapon_chisel')
        .displayName('§6🗡 Резец Оружейника§r')
        .tooltip('§8[Инструмент Мастера-Оружейника]')
        .tooltip('§7Используется на Оружейном Столе для')
        .tooltip('§7пробития дополнительных рунических сокетов.')
        .tooltip('§e✦ Прочность: §f128 применений')
        .tooltip('§a✦ 100% гарантия мастера без риска поломки оружия')
        .maxDamage(128)
        .rarity('uncommon')
        .tag('c:tools')
        .tag('elyrium:chisels');
});
