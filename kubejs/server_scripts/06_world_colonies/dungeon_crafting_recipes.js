// ==============================================================================
// 🏛️ ELYRIUM RPG: DUNGEON CRAFTING & PROGRESSION LOOP (PHASE 17)
// ==============================================================================
// 1. Сборка Рунических Ядер (3x3 Shaped Crafting: 9 эссенций = 1 Ядро)
// 2. Кузнечный Стол (Smithing Transform: Базовая вещь + Ядро + Слиток Эпохи = Эпик)
// 3. Джекпот Очищения (Shapeless Crafting: Оскверненная вещь + Слиток Эпохи = Очищенная)
// 4. Дроп Эссенций и Джекпота (EntityEvents.drops с мобов и боссов подземелий)
// ==============================================================================

const DUNGEON_TIER_CONFIG = [
    {
        tier: 1,
        name: 'Overworld Sector I (Медный Век)',
        essence: 'kubejs:dungeon_essence_t1',
        core: 'kubejs:dungeon_core_t1',
        epochIngot: 'minecraft:copper_ingot',
        baseBlades: ['minecraft:wooden_sword', 'minecraft:stone_sword'],
        baseChestplates: ['minecraft:leather_chestplate', 'minecraft:chainmail_chestplate'],
        defiledBlade: 'kubejs:defiled_blade_t1',
        defiledChestplate: 'kubejs:defiled_chestplate_t1',
        purifiedBlade: 'kubejs:purified_blade_t1',
        purifiedChestplate: 'kubejs:purified_chestplate_t1'
    },
    {
        tier: 2,
        name: 'Overworld Sector II (Железный Век)',
        essence: 'kubejs:dungeon_essence_t2',
        core: 'kubejs:dungeon_core_t2',
        epochIngot: 'minecraft:iron_ingot',
        baseBlades: ['minecraft:iron_sword', 'minecraft:golden_sword'],
        baseChestplates: ['minecraft:iron_chestplate', 'minecraft:golden_chestplate'],
        defiledBlade: 'kubejs:defiled_blade_t2',
        defiledChestplate: 'kubejs:defiled_chestplate_t2',
        purifiedBlade: 'kubejs:purified_blade_t2',
        purifiedChestplate: 'kubejs:purified_chestplate_t2'
    },
    {
        tier: 3,
        name: 'Overworld Sector III & Citadel (Алмазный Век)',
        essence: 'kubejs:dungeon_essence_t3',
        core: 'kubejs:dungeon_core_t3',
        epochIngot: 'minecraft:diamond',
        baseBlades: ['minecraft:diamond_sword'],
        baseChestplates: ['minecraft:diamond_chestplate'],
        defiledBlade: 'kubejs:defiled_blade_t3',
        defiledChestplate: 'kubejs:defiled_chestplate_t3',
        purifiedBlade: 'kubejs:purified_blade_t3',
        purifiedChestplate: 'kubejs:purified_chestplate_t3'
    },
    {
        tier: 4,
        name: 'The Nether (Пепельный Сплав)',
        essence: 'kubejs:dungeon_essence_t4',
        core: 'kubejs:dungeon_core_t4',
        epochIngot: 'skd:cinder_alloy_ingot',
        baseBlades: ['minecraft:netherite_sword', 'minecraft:diamond_sword'],
        baseChestplates: ['minecraft:netherite_chestplate', 'minecraft:diamond_chestplate'],
        defiledBlade: 'kubejs:defiled_blade_t4',
        defiledChestplate: 'kubejs:defiled_chestplate_t4',
        purifiedBlade: 'kubejs:purified_blade_t4',
        purifiedChestplate: 'kubejs:purified_chestplate_t4'
    },
    {
        tier: 5,
        name: 'The Aether (Занорит / Небесный Нефрит)',
        essence: 'kubejs:dungeon_essence_t5',
        core: 'kubejs:dungeon_core_t5',
        epochIngot: 'aether:zanite_gemstone',
        baseBlades: ['aether:zanite_sword', 'minecraft:netherite_sword'],
        baseChestplates: ['aether:zanite_chestplate', 'minecraft:netherite_chestplate'],
        defiledBlade: 'kubejs:defiled_blade_t5',
        defiledChestplate: 'kubejs:defiled_chestplate_t5',
        purifiedBlade: 'kubejs:purified_blade_t5',
        purifiedChestplate: 'kubejs:purified_chestplate_t5'
    },
    {
        tier: 6,
        name: 'The End (Дыхание Дракона)',
        essence: 'kubejs:dungeon_essence_t6',
        core: 'kubejs:dungeon_core_t6',
        epochIngot: 'minecraft:dragon_breath',
        baseBlades: ['minecraft:diamond_sword', 'minecraft:netherite_sword'],
        baseChestplates: ['minecraft:diamond_chestplate', 'minecraft:netherite_chestplate'],
        defiledBlade: 'kubejs:defiled_blade_t6',
        defiledChestplate: 'kubejs:defiled_chestplate_t6',
        purifiedBlade: 'kubejs:purified_blade_t6',
        purifiedChestplate: 'kubejs:purified_chestplate_t6'
    },
    {
        tier: 7,
        name: 'Eternal Starlight (Слиток Aethersent)',
        essence: 'kubejs:dungeon_essence_t7',
        core: 'kubejs:dungeon_core_t7',
        epochIngot: 'eternal_starlight:aethersent_ingot',
        baseBlades: ['eternal_starlight:deepsilver_sword', 'minecraft:netherite_sword'],
        baseChestplates: ['eternal_starlight:deepsilver_chestplate', 'minecraft:netherite_chestplate'],
        defiledBlade: 'kubejs:defiled_blade_t7',
        defiledChestplate: 'kubejs:defiled_chestplate_t7',
        purifiedBlade: 'kubejs:purified_blade_t7',
        purifiedChestplate: 'kubejs:purified_chestplate_t7'
    },
    {
        tier: 8,
        name: 'Deeper Darker (Осколок Эха)',
        essence: 'kubejs:dungeon_essence_t8',
        core: 'kubejs:dungeon_core_t8',
        epochIngot: 'minecraft:echo_shard',
        baseBlades: ['deeperdarker:warden_sword', 'minecraft:netherite_sword'],
        baseChestplates: ['deeperdarker:warden_chestplate', 'minecraft:netherite_chestplate'],
        defiledBlade: 'kubejs:defiled_blade_t8',
        defiledChestplate: 'kubejs:defiled_chestplate_t8',
        purifiedBlade: 'kubejs:purified_blade_t8',
        purifiedChestplate: 'kubejs:purified_chestplate_t8'
    }
];

// ==============================================================================
// 1. РЕЦЕПТЫ КРАФТА И ПЕРЕКОВКИ (ServerEvents.recipes)
// ==============================================================================
ServerEvents.recipes(event => {
    DUNGEON_TIER_CONFIG.forEach(cfg => {
        let t = cfg.tier;

        // ----------------------------------------------------------------------
        // А. Верстак 3x3: 9 Эссенций -> 1 Руническое Ядро
        // ----------------------------------------------------------------------
        event.shaped(cfg.core, [
            'EEE',
            'EEE',
            'EEE'
        ], {
            E: cfg.essence
        }).id(`elyrium:crafting/dungeon_core_t${t}`);

        // ----------------------------------------------------------------------
        // Б. Кузнечный Стол: Базовая вещь + Руническое Ядро + Слиток Эпохи -> Эпик
        // ----------------------------------------------------------------------
        // Клинки:
        cfg.baseBlades.forEach((bladeId, idx) => {
            let recipeId = idx === 0 ? `elyrium:smithing/blade_t${t}` : `elyrium:smithing/blade_alt_${idx}_t${t}`;
            event.smithing(
                cfg.purifiedBlade,
                cfg.core,
                bladeId,
                cfg.epochIngot
            ).id(recipeId);
        });

        // Панцири:
        cfg.baseChestplates.forEach((chestId, idx) => {
            let recipeId = idx === 0 ? `elyrium:smithing/chestplate_t${t}` : `elyrium:smithing/chestplate_alt_${idx}_t${t}`;
            event.smithing(
                cfg.purifiedChestplate,
                cfg.core,
                chestId,
                cfg.epochIngot
            ).id(recipeId);
        });

        // ----------------------------------------------------------------------
        // В. 5% Джекпот Очищения (Верстак): Оскверненная вещь + ТОЛЬКО Слиток Эпохи
        // ----------------------------------------------------------------------
        event.shapeless(cfg.purifiedBlade, [
            cfg.defiledBlade,
            cfg.epochIngot
        ]).id(`elyrium:purification/blade_t${t}`);

        event.shapeless(cfg.purifiedChestplate, [
            cfg.defiledChestplate,
            cfg.epochIngot
        ]).id(`elyrium:purification/chestplate_t${t}`);
    });
});

// ==============================================================================
// 2. СИСТЕМА ДРОПА ЭССЕНЦИЙ И ДЖЕКПОТА (EntityEvents.drops)
// ==============================================================================
EntityEvents.drops(event => {
    let entity = event.entity;
    if (!entity || !entity.level) return;
    if (!entity.isLiving() || (entity.isPlayer && entity.isPlayer())) return;

    let dim = String(entity.level.dimension);
    let server = entity.level.server;
    let tags = entity.tags;

    let isDungeonMob = false;
    let isMiniboss = false;
    let isBoss = false;
    let explicitTier = 0;
    let instanceId = null;

    if (tags) {
        tags.forEach(tag => {
            let t = String(tag);
            if (t.startsWith('inst_')) {
                isDungeonMob = true;
                instanceId = t;
            }
            if (t === 'elyrium_dungeon_mob' || t === 'dungeon_elite' || t === 'elyrium_elite') {
                isDungeonMob = true;
            }
            if (t === 'dungeon_miniboss' || t === 'elyrium_miniboss' || t === 'miniboss') {
                isMiniboss = true;
            }
            if (t === 'dungeon_boss' || t === 'elyrium_boss' || t === 'boss') {
                isBoss = true;
            }

            for (let i = 1; i <= 8; i++) {
                if (t === 'tier_' + i || t === 'sector_' + i || t === 'dungeon_tier_' + i || t === 't' + i) {
                    explicitTier = i;
                }
            }
        });
    }

    // Если моб находится в специальном мире инстансов elyrium:dungeons - он точно моб данжа
    if (dim === 'elyrium:dungeons') {
        isDungeonMob = true;
    }

    // Если это обычный моб открытого мира без тегов данжа - пропускаем
    if (!isDungeonMob && !isMiniboss && !isBoss) return;

    // Определение тира подземелья
    let tier = explicitTier;

    // 1. Поиск в Compound постоянных данных инстанса
    if (tier === 0 && instanceId && server && server.persistentData) {
        if (server.persistentData.contains(instanceId)) {
            let instCompound = server.persistentData.getCompound(instanceId);
            if (instCompound.contains('tier')) {
                tier = instCompound.getInt('tier');
            } else if (instCompound.contains('sector')) {
                tier = instCompound.getInt('sector');
            }
        }
    }

    // 2. Поиск по координатной сетке elyrium:dungeons (X = ID * 1500)
    if (tier === 0 && dim === 'elyrium:dungeons' && server && server.persistentData) {
        let calcId = Math.round(entity.x / 1500);
        let instKey = 'inst_' + calcId;
        if (server.persistentData.contains(instKey)) {
            let instCompound = server.persistentData.getCompound(instKey);
            if (instCompound.contains('tier')) {
                tier = instCompound.getInt('tier');
            } else if (instCompound.contains('sector')) {
                tier = instCompound.getInt('sector');
            }
        }
    }

    // 3. Fallback: по измерению и расстоянию от спавна
    if (tier < 1 || tier > 8) {
        if (dim === 'minecraft:the_nether') tier = 4;
        else if (dim === 'aether:the_aether' || dim === 'deep_aether:deep_aether') tier = 5;
        else if (dim === 'minecraft:the_end') tier = 6;
        else if (dim === 'eternal_starlight:starlight') tier = 7;
        else if (dim === 'deeperdarker:otherside') tier = 8;
        else if (dim === 'minecraft:overworld') {
            let r = Math.sqrt(entity.x * entity.x + entity.z * entity.z);
            if (r < 1500) tier = 1;
            else if (r < 3500) tier = 2;
            else tier = 3;
        } else {
            tier = 1;
        }
    }

    tier = Math.max(1, Math.min(8, tier));

    // --------------------------------------------------------------------------
    // Выдача наград по правилам баланса Фазы 17:
    // --------------------------------------------------------------------------

    if (isBoss) {
        // Финальный босс: гарантированно 1 эссенция + 5% шанс на джекпот оскверненной вещи (клинок или панцирь)
        event.addDrop(Item.of(`kubejs:dungeon_essence_t${tier}`, 1));

        // 5% Джекпот Очищения
        if (Math.random() < 0.05) {
            let isBlade = Math.random() < 0.50;
            let jackpotItem = isBlade ? `kubejs:defiled_blade_t${tier}` : `kubejs:defiled_chestplate_t${tier}`;
            event.addDrop(Item.of(jackpotItem, 1));

            if (server) {
                let x = entity.x;
                let y = entity.y;
                let z = entity.z;
                server.runCommandSilent(`execute in ${dim} run particle minecraft:totem_of_undying ${x} ${y + 1.2} ${z} 0.8 0.8 0.8 0.1 50`);
                server.runCommandSilent(`execute in ${dim} run particle minecraft:soul_fire_flame ${x} ${y + 1.5} ${z} 0.6 0.6 0.6 0.05 30`);
                server.runCommandSilent(`execute in ${dim} run playsound minecraft:ui.toast.challenge_complete master @a[distance=..64] ${x} ${y} ${z} 1.0 1.0`);
                let itemName = isBlade ? `Оскверненный Клинок T${tier}` : `Оскверненный Панцирь T${tier}`;
                server.tell(Text.of(`§6⭐ [ПОДЗЕМЕЛЬЕ ЭЛИРИУМА] §dДЖЕКПОТ ОЧИЩЕНИЯ! §fИз поверженного босса выпала редчайшая заготовка (§e${itemName}§f)!`));
            }
        }
    } else if (isMiniboss) {
        // Проходной мини-босс: гарантированно 1 эссенция
        event.addDrop(Item.of(`kubejs:dungeon_essence_t${tier}`, 1));

        if (server) {
            let x = entity.x;
            let y = entity.y;
            let z = entity.z;
            server.runCommandSilent(`execute in ${dim} run particle minecraft:enchant ${x} ${y + 0.8} ${z} 0.5 0.5 0.5 0.1 20`);
            server.runCommandSilent(`execute in ${dim} run playsound minecraft:entity.experience_orb.pickup master @a[distance=..32] ${x} ${y} ${z} 0.9 1.1`);
        }
    } else if (isDungeonMob) {
        // Элитные мобы подземелья (4 пака за ран): 20% шанс дропа 1 эссенции
        if (Math.random() < 0.20) {
            event.addDrop(Item.of(`kubejs:dungeon_essence_t${tier}`, 1));
        }
    }
});
