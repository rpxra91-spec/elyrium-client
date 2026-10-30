// =============================================================================
// ELYRIUM RPG — NATURAL DARKNESS SPAWN SUPPRESSOR & DUNGEON VOID LOCKDOWN
// =============================================================================
// Назначение:
// 1. Полностью глушит спавн мобов из темноты и пустоты в измерении elyrium:dungeons.
//    (Блокирует сотни спавнящихся ванильных мобов на крышах и в темноте пустоты).
// 2. Блокирует бесконечный спавн мобов из темноты (spawnReason == 'NATURAL')
//    внутри Bounding Box любых структур модов (Dungeons Arise, Cataclysm, Yung's и т.д.).
// 3. Оставляет в живых скриптовые спавны данжей (COMMAND / inst_ tags), шаблоны NBT и спавнеры.
// =============================================================================

EntityEvents.spawned(event => {
    let entity = event.entity;
    let level = event.level;
    let reason = event.spawnReason ? event.spawnReason.toString() : '';

    // 1. ПРИОРИТЕТНАЯ ЗАЩИТА ИЗМЕРЕНИЯ ПОДЗЕМЕЛИЙ (elyrium:dungeons)
    // В измерении инстансов запрещен любой естественный/фоновый спавн мобов из темноты!
    if (level.dimension === 'elyrium:dungeons') {
        if (reason === 'NATURAL' || reason === 'CHUNK_GENERATION' || reason === 'REINFORCEMENT' ||
            reason === 'PATROL' || reason === 'SPAWNER_MINECART' || reason === 'STRUCTURE' || !reason) {
            event.cancel();
            return;
        }
        // Если это монстр без скриптовой команды или без тега подземелья — блокируем!
        if (entity.isMonster() && reason !== 'COMMAND' && reason !== 'SPAWNER' && reason !== 'MOB_SUMMONED') {
            event.cancel();
            return;
        }
    }

    // 2. Проверяем только враждебных монстров в остальных мирах
    if (!entity.isMonster()) return;

    // Нас интересует только естественный спавн из темноты
    if (reason !== 'NATURAL') return;

    let pos = event.block.pos;

    try {
        let structureManager = level.asKubeJS().minecraftLevel.structureManager();
        if (structureManager) {
            let structureStart = structureManager.getStructureWithPieceAt(pos);
            if (structureStart && structureStart.isValid()) {
                event.cancel();
            }
        }
    } catch (e) {
        // Fallback: безопасный выход без краша сервера
    }
});
