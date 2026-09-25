// ==============================================================================
// 🌿 ELYRIUM RPG: GATHERING PROFESSIONS MECHANICS ENGINE
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================
// 1. Farmer (Фермер): Crop duplication, triple harvest, auto-replant, bone meal potency.
// 2. Miner (Шахтёр): Ore duplication, extra fortune, gem extraction.
// 3. Woodcutter (Дровосек): Extra logs duplication, tree gifts (apples, saplings, golden apples).
// 4. Fisherman (Рыбак): Double catch fish, sunken treasures, bite speed focus.
// ==============================================================================

// ------------------------------------------------------------------------------
// 1. FARMER MECHANICS (СБОР УРОЖАЯ & СИЛА КОСТНОЙ МУКИ)
// ------------------------------------------------------------------------------

const MATURE_CROPS = {
    'minecraft:wheat': '7',
    'minecraft:carrots': '7',
    'minecraft:potatoes': '7',
    'minecraft:beetroots': '3',
    'minecraft:nether_wart': '3',
    'minecraft:cocoa': '2',
    'minecraft:sweet_berry_bush': '3'
};

BlockEvents.broken(event => {
    let player = event.player;
    if (!player || player.isCreative()) return;
    let level = event.level;
    if (!level || level.isClientSide()) return;

    let tags = player.tags;
    if (!tags) return;

    let block = event.block;
    let blockId = String(block.id);

    // Check if broken block is a harvestable crop
    let isCrop = block.hasTag('minecraft:crops') ||
                 block.hasTag('c:crops') ||
                 MATURE_CROPS[blockId] !== undefined ||
                 blockId === 'minecraft:melon' ||
                 blockId === 'minecraft:pumpkin' ||
                 blockId === 'minecraft:sugar_cane' ||
                 blockId === 'minecraft:cactus' ||
                 blockId.includes('farmersdelight:');

    if (!isCrop) return;

    // Check maturity if age property is present
    let reqAge = MATURE_CROPS[blockId];
    if (reqAge !== undefined && block.properties && block.properties.age !== undefined) {
        if (String(block.properties.age) !== reqAge) {
            return; // Not mature yet
        }
    }

    // Calculate crop duplication chance
    let cropDupChance = 0;
    if (tags.contains('skill_farmer_crop_dup_base')) cropDupChance += 15;
    if (tags.contains('skill_farmer_crop_dup_1')) cropDupChance += 3;
    if (tags.contains('skill_farmer_crop_dup_2')) cropDupChance += 3;
    if (tags.contains('skill_farmer_crop_dup_3')) cropDupChance += 6;
    if (tags.contains('skill_farmer_crop_dup_3_1')) cropDupChance += 3;
    if (tags.contains('skill_farmer_crop_dup_3_2')) cropDupChance += 3;
    if (tags.contains('skill_farmer_crop_dup_3_3')) cropDupChance += 4;
    if (tags.contains('skill_farmer_crop_dup_3_4')) cropDupChance += 4;
    if (tags.contains('skill_farmer_crop_dup_4')) cropDupChance += 8;
    if (tags.contains('skill_farmer_crop_dup_4_1')) cropDupChance += 3;
    if (tags.contains('skill_farmer_crop_dup_4_2')) cropDupChance += 3;
    if (tags.contains('skill_farmer_crop_dup_4_3')) cropDupChance += 4;
    if (tags.contains('skill_farmer_crop_dup_4_4')) cropDupChance += 5;
    if (tags.contains('skill_farmer_crop_dup_notable')) cropDupChance += 20;
    if (tags.contains('skill_farmer_mastery')) cropDupChance += 25;

    if (cropDupChance <= 0) return;

    if (Math.random() * 100.0 < cropDupChance) {
        let isNotable = tags.contains('skill_farmer_crop_dup_notable') || tags.contains('skill_farmer_mastery');
        let isTriple = isNotable && (Math.random() < 0.35);
        let count = isTriple ? 2 : 1;

        let bonusItem = null;
        if (blockId === 'minecraft:wheat') bonusItem = Item.of('minecraft:wheat', count);
        else if (blockId === 'minecraft:carrots') bonusItem = Item.of('minecraft:carrot', count);
        else if (blockId === 'minecraft:potatoes') bonusItem = Item.of('minecraft:potato', count);
        else if (blockId === 'minecraft:beetroots') bonusItem = Item.of('minecraft:beetroot', count);
        else if (blockId === 'minecraft:melon') bonusItem = Item.of('minecraft:melon_slice', count * 3);
        else if (blockId === 'minecraft:pumpkin') bonusItem = Item.of('minecraft:pumpkin', count);
        else if (blockId === 'minecraft:nether_wart') bonusItem = Item.of('minecraft:nether_wart', count * 2);
        else if (blockId === 'minecraft:cocoa') bonusItem = Item.of('minecraft:cocoa_beans', count * 2);
        else if (blockId === 'minecraft:sweet_berry_bush') bonusItem = Item.of('minecraft:sweet_berries', count * 2);
        else if (blockId === 'minecraft:sugar_cane') bonusItem = Item.of('minecraft:sugar_cane', count);
        else if (blockId === 'minecraft:cactus') bonusItem = Item.of('minecraft:cactus', count);
        else if (blockId.includes('cabbage')) bonusItem = Item.of('farmersdelight:cabbage', count);
        else if (blockId.includes('tomato')) bonusItem = Item.of('farmersdelight:tomato', count);
        else if (blockId.includes('onion')) bonusItem = Item.of('farmersdelight:onion', count);
        else if (blockId.includes('rice')) bonusItem = Item.of('farmersdelight:rice_panicle', count);

        if (bonusItem) {
            player.give(bonusItem);
            player.server.runCommandSilent(`playsound minecraft:entity.experience_orb.pickup player ${player.username} ~ ~ ~ 0.8 1.4`);
            if (isTriple) {
                player.sendSystemMessage(Text.of(`§6🌟 ТРОЙНОЙ УРОЖАЙ! §a+${count} доп. сбора с поля`), true);
            } else {
                player.sendSystemMessage(Text.of(`§a🌾 Обильный сбор урожая! (+${count} доп. урожай)`), true);
            }
        }

        // Auto-replant mechanic
        if (tags.contains('skill_farmer_auto_replant') || tags.contains('skill_farmer_mastery')) {
            let pos = block.pos;
            let cropToReplant = blockId;
            let reqAgeProp = reqAge;
            if (reqAgeProp !== undefined) {
                player.server.scheduleInTicks(1, () => {
                    let curBlock = level.getBlock(pos.x, pos.y, pos.z);
                    let below = level.getBlock(pos.x, pos.y - 1, pos.z);
                    if (curBlock && curBlock.id === 'minecraft:air') {
                        if (below && (below.id === 'minecraft:farmland' || below.id === 'minecraft:soul_sand')) {
                            curBlock.set(cropToReplant, { age: '0' });
                        }
                    }
                });
            }
        }
    }
});

// Bone Meal Potency (Мгновенное созревание и 3x3 удобрение)
BlockEvents.rightClicked(event => {
    let player = event.player;
    if (!player) return;
    let handItem = player.mainHandItem;
    if (!handItem || handItem.id !== 'minecraft:bone_meal') return;

    let tags = player.tags;
    if (!tags) return;

    let block = event.block;
    let blockId = String(block.id);
    let reqAge = MATURE_CROPS[blockId];
    if (reqAge === undefined) return;

    let hasNotable = tags.contains('skill_farmer_bonemeal_potency_notable') || tags.contains('skill_farmer_mastery');
    let hasBase = tags.contains('skill_farmer_bonemeal_potency_base') ||
                  tags.contains('skill_farmer_bonemeal_potency_1') ||
                  tags.contains('skill_farmer_bonemeal_potency_2') ||
                  tags.contains('skill_farmer_bonemeal_potency_3');

    if (!hasBase && !hasNotable) return;

    let level = event.level;
    if (level.isClientSide()) return;

    if (hasNotable) {
        // Instantly mature target crop
        block.set(blockId, { age: reqAge });

        // Fertilize surrounding 3x3 area
        let pos = block.pos;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                if (dx === 0 && dz === 0) continue;
                let neighbor = level.getBlock(pos.x + dx, pos.y, pos.z + dz);
                let nId = String(neighbor.id);
                let nAge = MATURE_CROPS[nId];
                if (nAge !== undefined) {
                    neighbor.set(nId, { age: nAge });
                }
            }
        }

        // 50% chance to not consume bone meal
        if (Math.random() < 0.50) {
            player.server.scheduleInTicks(1, () => {
                player.give(Item.of('minecraft:bone_meal', 1));
            });
            player.sendSystemMessage(Text.of('§a🌿 Чудотворное Удобрение: Костная мука сохранена!'), true);
        } else {
            player.sendSystemMessage(Text.of('§a🌿 Чудотворное Удобрение: Вся грядка 3x3 мгновенно созрела!'), true);
        }

        player.server.runCommandSilent(`playsound minecraft:item.bone_meal.use block ${player.username} ${pos.x} ${pos.y} ${pos.z} 1.0 1.2`);
    } else {
        // Standard potency: 40% chance for instant maturity
        if (Math.random() < 0.40) {
            block.set(blockId, { age: reqAge });
            player.sendSystemMessage(Text.of('§a🌱 Усиленная костная мука: урожай созрел моментально!'), true);
        }
    }
});


// ------------------------------------------------------------------------------
// 2. MINER MECHANICS (УДВОЕНИЕ РУДЫ & ИЗВЛЕЧЕНИЕ САМОЦВЕТОВ)
// ------------------------------------------------------------------------------

const ORE_DUPLICATES = {
    'iron': 'minecraft:raw_iron',
    'gold': 'minecraft:raw_gold',
    'copper': 'minecraft:raw_copper',
    'coal': 'minecraft:coal',
    'lapis': 'minecraft:lapis_lazuli',
    'redstone': 'minecraft:redstone',
    'diamond': 'minecraft:diamond',
    'emerald': 'minecraft:emerald',
    'quartz': 'minecraft:quartz',
    'debris': 'minecraft:ancient_debris'
};

BlockEvents.broken(event => {
    let player = event.player;
    if (!player || player.isCreative()) return;
    let level = event.level;
    if (!level || level.isClientSide()) return;

    let mainHand = player.mainHandItem;
    if (!mainHand || !String(mainHand.id).includes('_pickaxe')) return;

    let block = event.block;
    let blockId = String(block.id);
    let isOre = blockId.includes('_ore') || block.hasTag('c:ores') || blockId === 'minecraft:ancient_debris';
    if (!isOre) return;

    let tags = player.tags;
    if (!tags) return;

    let hasSilkTouch = (mainHand.getEnchantmentLevel('minecraft:silk_touch') || 0) > 0;

    // Calculate Ore Duplication Chance
    let oreDupChance = 0;
    if (tags.contains('skill_miner_ore_dup_base')) oreDupChance += 10;
    if (tags.contains('skill_miner_ore_dup_1')) oreDupChance += 3;
    if (tags.contains('skill_miner_ore_dup_2')) oreDupChance += 5;
    if (tags.contains('skill_miner_ore_dup_3_1')) oreDupChance += 3;
    if (tags.contains('skill_miner_ore_dup_3_3')) oreDupChance += 4;
    if (tags.contains('skill_miner_ore_dup_3')) oreDupChance += 7;
    if (tags.contains('skill_miner_ore_dup_4_2')) oreDupChance += 4;
    if (tags.contains('skill_miner_ore_dup_4_4')) oreDupChance += 5;
    if (tags.contains('skill_miner_ore_dup_notable')) oreDupChance += 12;
    if (tags.contains('skill_miner_mastery')) oreDupChance += 15;

    // Calculate Gem Extraction Chance
    let gemExtractChance = 0;
    if (tags.contains('skill_miner_gem_extract_base')) gemExtractChance += 5;
    if (tags.contains('skill_miner_gem_extract_1')) gemExtractChance += 3;
    if (tags.contains('skill_miner_gem_extract_2')) gemExtractChance += 4;
    if (tags.contains('skill_miner_gem_extract_3_2')) gemExtractChance += 3;
    if (tags.contains('skill_miner_gem_extract_3_4')) gemExtractChance += 4;
    if (tags.contains('skill_miner_gem_extract_3')) gemExtractChance += 5;
    if (tags.contains('skill_miner_gem_extract_4_1')) gemExtractChance += 3;
    if (tags.contains('skill_miner_gem_extract_4_3')) gemExtractChance += 4;
    if (tags.contains('skill_miner_gem_extract_notable')) gemExtractChance += 10;
    if (tags.contains('skill_miner_mastery')) gemExtractChance += 8;

    // --- A. ORE DUPLICATION ROLL ---
    if (oreDupChance > 0 && Math.random() * 100.0 < oreDupChance) {
        let isTriple = (tags.contains('skill_miner_ore_dup_notable') || tags.contains('skill_miner_mastery')) && (Math.random() < 0.30);
        let count = isTriple ? 2 : 1;

        let dupItem = null;
        if (hasSilkTouch) {
            dupItem = Item.of(blockId, count);
        } else {
            for (let [oreKey, itemRes] of Object.entries(ORE_DUPLICATES)) {
                if (blockId.includes(oreKey)) {
                    let multiplier = (oreKey === 'lapis' || oreKey === 'redstone') ? 3 : 1;
                    dupItem = Item.of(itemRes, count * multiplier);
                    break;
                }
            }
            if (!dupItem) {
                dupItem = Item.of(blockId, count);
            }
        }

        if (dupItem) {
            player.give(dupItem);
            player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.8 1.2`);
            if (isTriple) {
                player.sendSystemMessage(Text.of(`§6🌟 ТРОЙНОЙ РУДНЫЙ ПЛАСТ! §e+${count} доп. руды`), true);
            } else {
                player.sendSystemMessage(Text.of(`§e⛏ Рудная жила: +${count} дополнительная руда!`), true);
            }
        }
    }

    // --- B. GEM EXTRACTION ROLL (Silk Touch prevents cracking raw gems) ---
    if (!hasSilkTouch && gemExtractChance > 0 && Math.random() * 100.0 < gemExtractChance) {
        let isNotable = tags.contains('skill_miner_gem_extract_notable') || tags.contains('skill_miner_mastery');
        let gemRoll = Math.random();
        let extractedGem = null;

        if (blockId.includes('nether') && isNotable && gemRoll < 0.05) {
            extractedGem = Item.of('minecraft:netherite_scrap', 1);
        } else if (gemRoll < 0.12 && isNotable) {
            extractedGem = Item.of('minecraft:diamond', 1);
        } else if (gemRoll < 0.30) {
            extractedGem = Item.of('minecraft:emerald', 1);
        } else if (gemRoll < 0.60) {
            extractedGem = Item.of('minecraft:lapis_lazuli', 3);
        } else {
            extractedGem = Item.of('minecraft:amethyst_shard', 2);
        }

        if (extractedGem) {
            player.give(extractedGem);
            player.server.runCommandSilent(`playsound minecraft:block.amethyst_block.chime player ${player.username} ~ ~ ~ 1.0 1.3`);
            player.sendSystemMessage(Text.of(`§b💎 Извлечён драгоценный самоцвет: §f${extractedGem.name.string}§b!`), true);
        }
    }
});


// ------------------------------------------------------------------------------
// 3. WOODCUTTER MECHANICS (ДОПОЛНИТЕЛЬНЫЕ БРЁВНА & ДАРЫ ДЕРЕВА)
// ------------------------------------------------------------------------------

const TREE_SAPLINGS = {
    'oak': 'minecraft:oak_sapling',
    'spruce': 'minecraft:spruce_sapling',
    'birch': 'minecraft:birch_sapling',
    'jungle': 'minecraft:jungle_sapling',
    'acacia': 'minecraft:acacia_sapling',
    'dark_oak': 'minecraft:dark_oak_sapling',
    'cherry': 'minecraft:cherry_sapling',
    'mangrove': 'minecraft:mangrove_propagule'
};

BlockEvents.broken(event => {
    let player = event.player;
    if (!player || player.isCreative()) return;
    let level = event.level;
    if (!level || level.isClientSide()) return;

    let mainHand = player.mainHandItem;
    if (!mainHand || !String(mainHand.id).includes('_axe')) return;

    let block = event.block;
    let blockId = String(block.id);
    let isLog = blockId.includes('_log') || blockId.includes('_stem') || blockId.includes('_wood') || blockId.includes('_hyphae');
    if (!isLog) return;

    let tags = player.tags;
    if (!tags) return;

    // Calculate Log Bonus Chance
    let logDupChance = 0;
    if (tags.contains('skill_woodcutter_log_dup_base')) logDupChance += 10;
    if (tags.contains('skill_woodcutter_log_dup_1')) logDupChance += 3;
    if (tags.contains('skill_woodcutter_log_dup_2')) logDupChance += 6;
    if (tags.contains('skill_woodcutter_log_dup_3_1')) logDupChance += 3;
    if (tags.contains('skill_woodcutter_log_dup_3_3')) logDupChance += 4;
    if (tags.contains('skill_woodcutter_log_dup_3')) logDupChance += 8;
    if (tags.contains('skill_woodcutter_log_dup_4_1')) logDupChance += 3;
    if (tags.contains('skill_woodcutter_log_dup_4_3')) logDupChance += 5;
    if (tags.contains('skill_woodcutter_log_dup_notable')) logDupChance += 15;
    if (tags.contains('skill_woodcutter_mastery')) logDupChance += 20;

    // Calculate Tree Gifts Chance
    let treeGiftsChance = 0;
    if (tags.contains('skill_woodcutter_tree_gifts_base')) treeGiftsChance += 8;
    if (tags.contains('skill_woodcutter_tree_gifts_1')) treeGiftsChance += 4;
    if (tags.contains('skill_woodcutter_tree_gifts_2')) treeGiftsChance += 5;
    if (tags.contains('skill_woodcutter_tree_gifts_3_2')) treeGiftsChance += 4;
    if (tags.contains('skill_woodcutter_tree_gifts_3_4')) treeGiftsChance += 5;
    if (tags.contains('skill_woodcutter_tree_gifts_3')) treeGiftsChance += 6;
    if (tags.contains('skill_woodcutter_tree_gifts_4_2')) treeGiftsChance += 4;
    if (tags.contains('skill_woodcutter_tree_gifts_4_4')) treeGiftsChance += 7;
    if (tags.contains('skill_woodcutter_tree_gifts_notable')) treeGiftsChance += 15;
    if (tags.contains('skill_woodcutter_mastery')) treeGiftsChance += 10;

    // --- A. LOG DUPLICATION ROLL ---
    if (logDupChance > 0 && Math.random() * 100.0 < logDupChance) {
        let isHuge = (tags.contains('skill_woodcutter_log_dup_notable') || tags.contains('skill_woodcutter_mastery')) && (Math.random() < 0.30);
        let count = isHuge ? 2 : 1;
        player.give(Item.of(blockId, count));
        player.server.runCommandSilent(`playsound minecraft:block.wood.break player ${player.username} ~ ~ ~ 0.7 1.4`);
        if (isHuge) {
            player.sendSystemMessage(Text.of(`§6🌟 ИДЕАЛЬНЫЙ СПИЛ! §e+${count} доп. брёвен`), true);
        } else {
            player.sendSystemMessage(Text.of(`§6🪓 Чистый срез: +${count} дополнительное бревно!`), true);
        }
    }

    // --- B. TREE GIFTS ROLL (APPLES, SAPLINGS, GOLDEN APPLES) ---
    if (treeGiftsChance > 0 && Math.random() * 100.0 < treeGiftsChance) {
        let goldChance = 0;
        if (tags.contains('skill_woodcutter_tree_gifts_3_4')) goldChance += 0.01;
        if (tags.contains('skill_woodcutter_tree_gifts_4_4')) goldChance += 0.02;
        if (tags.contains('skill_woodcutter_tree_gifts_notable')) goldChance += 0.03;

        let gift = null;
        if (goldChance > 0 && Math.random() < goldChance) {
            gift = Item.of('minecraft:golden_apple', 1);
            player.server.runCommandSilent(`playsound minecraft:entity.player.levelup player ${player.username} ~ ~ ~ 1.0 1.6`);
            player.sendSystemMessage(Text.of('§6🍎 Золотой дар древнего дерева!'), true);
        } else {
            let roll = Math.random();
            if (roll < 0.45) {
                gift = Item.of('minecraft:apple', 1);
            } else if (roll < 0.80) {
                for (let [woodKey, saplingId] of Object.entries(TREE_SAPLINGS)) {
                    if (blockId.includes(woodKey)) {
                        gift = Item.of(saplingId, 1);
                        break;
                    }
                }
                if (!gift) gift = Item.of('minecraft:oak_sapling', 1);
            } else {
                gift = Item.of('minecraft:stick', 3);
            }
            player.server.runCommandSilent(`playsound minecraft:entity.item.pickup player ${player.username} ~ ~ ~ 0.6 1.5`);
            player.sendSystemMessage(Text.of(`§a🌲 Дар Дерева: §f${gift.name.string}`), true);
        }

        if (gift) {
            player.give(gift);
        }
    }
});


// ------------------------------------------------------------------------------
// 4. FISHERMAN MECHANICS (ДВОЙНОЙ УЛОВ, ЗАТОНУВШИЕ СОКРОВИЩА, БЫСТРЫЙ КЛЁВ)
// ------------------------------------------------------------------------------

const FISH_ITEMS = new Set([
    'minecraft:cod', 'minecraft:salmon', 'minecraft:tropical_fish', 'minecraft:pufferfish',
    'minecraft:cooked_cod', 'minecraft:cooked_salmon'
]);

ItemEvents.pickedUp(event => {
    let player = event.player;
    if (!player) return;
    let item = event.item;
    if (!item) return;

    let itemId = String(item.id);
    if (!FISH_ITEMS.has(itemId)) return;

    let tags = player.tags;
    if (!tags) return;

    // Calculate Double Fish Chance
    let doubleFishChance = 0;
    if (tags.contains('skill_fisherman_double_catch_base')) doubleFishChance += 15;
    if (tags.contains('skill_fisherman_double_catch_1')) doubleFishChance += 3;
    if (tags.contains('skill_fisherman_double_catch_2')) doubleFishChance += 6;
    if (tags.contains('skill_fisherman_double_catch_3_1')) doubleFishChance += 3;
    if (tags.contains('skill_fisherman_double_catch_3_3')) doubleFishChance += 4;
    if (tags.contains('skill_fisherman_double_catch_3')) doubleFishChance += 8;
    if (tags.contains('skill_fisherman_double_catch_4_1')) doubleFishChance += 3;
    if (tags.contains('skill_fisherman_double_catch_4_3')) doubleFishChance += 4;
    if (tags.contains('skill_fisherman_double_catch_notable')) doubleFishChance += 20;
    if (tags.contains('skill_fisherman_mastery')) doubleFishChance += 25;

    // Calculate Sunken Treasure Chance
    let treasureChance = 0;
    if (tags.contains('skill_fisherman_treasure_base')) treasureChance += 5;
    if (tags.contains('skill_fisherman_treasure_1')) treasureChance += 2;
    if (tags.contains('skill_fisherman_treasure_2')) treasureChance += 4;
    if (tags.contains('skill_fisherman_treasure_3_2')) treasureChance += 2;
    if (tags.contains('skill_fisherman_treasure_3_4')) treasureChance += 3;
    if (tags.contains('skill_fisherman_treasure_3')) treasureChance += 5;
    if (tags.contains('skill_fisherman_treasure_4_2')) treasureChance += 3;
    if (tags.contains('skill_fisherman_treasure_4_4')) treasureChance += 3;
    if (tags.contains('skill_fisherman_treasure_notable')) treasureChance += 12;
    if (tags.contains('skill_fisherman_mastery')) treasureChance += 15;

    // --- A. DOUBLE FISH ROLL ---
    if (doubleFishChance > 0 && Math.random() * 100.0 < doubleFishChance) {
        let isTriple = (tags.contains('skill_fisherman_double_catch_notable') || tags.contains('skill_fisherman_mastery')) && (Math.random() < 0.30);
        let count = isTriple ? 2 : 1;
        player.give(Item.of(itemId, count));
        player.server.runCommandSilent(`playsound minecraft:entity.experience_orb.pickup player ${player.username} ~ ~ ~ 0.8 1.3`);
        if (isTriple) {
            player.sendSystemMessage(Text.of(`§6🌟 ТРОЙНОЙ УЛОВ! §bПоймано +${count} доп. рыбы`), true);
        } else {
            player.sendSystemMessage(Text.of(`§b🐟 Богатый улов: +${count} удвоенная рыба!`), true);
        }
    }

    // --- B. SUNKEN TREASURE ROLL ---
    if (treasureChance > 0 && Math.random() * 100.0 < treasureChance) {
        let isNotable = tags.contains('skill_fisherman_treasure_notable') || tags.contains('skill_fisherman_mastery');
        let roll = Math.random();
        let treasure = null;

        if (isNotable && roll < 0.05) {
            treasure = Item.of('minecraft:heart_of_the_sea', 1);
        } else if (roll < 0.25) {
            treasure = Item.of('minecraft:nautilus_shell', 1);
        } else if (roll < 0.45) {
            treasure = Item.of('minecraft:prismarine_crystals', 3);
        } else if (roll < 0.65) {
            treasure = Item.of('minecraft:experience_bottle', 2);
        } else if (roll < 0.85) {
            treasure = Item.of('minecraft:gold_ingot', 2);
        } else {
            treasure = Item.of('minecraft:iron_ingot', 3);
        }

        if (treasure) {
            player.give(treasure);
            player.server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete player ${player.username} ~ ~ ~ 1.0 1.2`);
            player.sendSystemMessage(Text.of(`§6🔱 Сокровище глубин поднято на борт: §e${treasure.name.string}§6!`), true);
        }
    }
});

// Bite Speed Focus & Quick Reel
ItemEvents.firstLeftClicked(event => {
    let player = event.player;
    if (!player) return;
    let item = event.item;
    if (!item || !String(item.id).includes('fishing_rod')) return;

    let tags = player.tags;
    if (!tags) return;

    let hasBiteSpeed = tags.contains('skill_fisherman_bite_speed_base') ||
                       tags.contains('skill_fisherman_bite_speed_1') ||
                       tags.contains('skill_fisherman_bite_speed_2') ||
                       tags.contains('skill_fisherman_bite_speed_3') ||
                       tags.contains('skill_fisherman_bite_speed_notable') ||
                       tags.contains('skill_fisherman_mastery');

    if (hasBiteSpeed) {
        player.server.runCommandSilent(`effect give ${player.username} minecraft:luck 15 1 true`);
        player.server.runCommandSilent(`playsound minecraft:entity.fishing_bobber.throw player ${player.username} ~ ~ ~ 0.8 1.4`);
        player.sendSystemMessage(Text.of('§b🎣 Чутьё морского волка: Удача рыбака активирована!'), true);
    }
});
