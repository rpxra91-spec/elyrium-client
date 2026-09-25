// =============================================================================
// SKD RPG: ELYRIUM — PODFAZA 1.3: NATURAL DARKNESS SPAWN SUPPRESSOR
// =============================================================================
// Назначение:
// 1. Блокирует бесконечный спавн мобов из темноты (spawnReason == 'NATURAL')
//    внутри Bounding Box любых структур модов (Dungeons Arise, Cataclysm, Yung's и т.д.).
// 2. Оставляет в живых спавны из шаблонов NBT, триггерные спавны и спавнеры испытаний.
// 3. Предотвращает превращение данжей в лагающие муравейники с сотнями мобов.
// =============================================================================

EntityEvents.spawned(event => {
    let entity = event.entity;
    let level = event.level;

    // Проверяем только враждебных монстров
    if (!entity.isMonster()) return;

    // Нас интересует только естественный спавн из темноты
    // Причины NATURAL / CHUNK_GENERATION / SPAWNER / REINFORCEMENT
    let reason = event.spawnReason ? event.spawnReason.toString() : '';
    if (reason !== 'NATURAL') return;

    let pos = event.block.pos;

    try {
        // Проверяем наличие любой структуры в точке спавна
        // В NeoForge 1.21.1 / KubeJS:
        let structureManager = level.asKubeJS().minecraftLevel.structureManager();
        if (structureManager) {
            let structureStart = structureManager.getStructureWithPieceAt(pos);
            if (structureStart && structureStart.isValid()) {
                let structId = structureStart.getStructure().toString();
                // Если точка спавна внутри любой структуры (кроме чистой ванильной дикой природы)
                // Отменяем естественный спавн в темноте!
                event.cancel();
            }
        }
    } catch (e) {
        // Fallback: безопасный выход без краша сервера
    }
});
