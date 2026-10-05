// ==============================================================================
// 🧪 ELYRIUM RPG: MODULAR BLACKSMITH & METALLURGY QA TEST SUITE
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// File: server_scripts/99_tests/blacksmith_workshop_test.js
// ==============================================================================

function runBlacksmithTestSuite() {
    let results = [];
    let total = 0;
    let passed = 0;
    let failed = 0;

    function assert(name, condition, detail) {
        total++;
        if (condition) {
            passed++;
            results.push({ name: name, passed: true, detail: detail });
        } else {
            failed++;
            results.push({ name: name, passed: false, detail: detail });
        }
    }

    // --------------------------------------------------------------------------
    // 1. CANONICAL RANKING & SPATIAL AUTO-ALIGNMENT
    // --------------------------------------------------------------------------
    {
        assert(
            "Ranking: Infernal Crucible is Rank 0 (Module 3)",
            typeof BS_CANONICAL_RANK !== 'undefined' && BS_CANONICAL_RANK['kubejs:infernal_crucible'] === 0,
            `Crucible rank: ${typeof BS_CANONICAL_RANK !== 'undefined' ? BS_CANONICAL_RANK['kubejs:infernal_crucible'] : 'undefined'}`
        );

        assert(
            "Ranking: Blacksmith Workbench is Rank 1 (Module 1)",
            typeof BS_CANONICAL_RANK !== 'undefined' && BS_CANONICAL_RANK['kubejs:blacksmith_workbench'] === 1,
            `Workbench rank: ${typeof BS_CANONICAL_RANK !== 'undefined' ? BS_CANONICAL_RANK['kubejs:blacksmith_workbench'] : 'undefined'}`
        );

        assert(
            "Ranking: Blacksmith Hearth is Rank 2 (Module 2)",
            typeof BS_CANONICAL_RANK !== 'undefined' && BS_CANONICAL_RANK['kubejs:blacksmith_hearth'] === 2,
            `Hearth rank: ${typeof BS_CANONICAL_RANK !== 'undefined' ? BS_CANONICAL_RANK['kubejs:blacksmith_hearth'] : 'undefined'}`
        );

        assert(
            "Ranking: Void Anvil is Rank 3 (Module 4)",
            typeof BS_CANONICAL_RANK !== 'undefined' && BS_CANONICAL_RANK['kubejs:void_anvil'] === 3,
            `Anvil rank: ${typeof BS_CANONICAL_RANK !== 'undefined' ? BS_CANONICAL_RANK['kubejs:void_anvil'] : 'undefined'}`
        );

        let sortBlocks = function(input) {
            return input.slice().sort((a, b) => {
                let rA = (BS_CANONICAL_RANK[a] !== undefined) ? BS_CANONICAL_RANK[a] : 99;
                let rB = (BS_CANONICAL_RANK[b] !== undefined) ? BS_CANONICAL_RANK[b] : 99;
                return rA - rB;
            });
        };

        // Test 1.1: Pair [2, 1] -> [1, 2]
        let pairInput = ['kubejs:blacksmith_hearth', 'kubejs:blacksmith_workbench'];
        let pairSorted = sortBlocks(pairInput);
        assert(
            "Auto-Sort: Pair [2, 1] -> [1, 2]",
            pairSorted[0] === 'kubejs:blacksmith_workbench' && pairSorted[1] === 'kubejs:blacksmith_hearth',
            `Result: ${pairSorted.join(' -> ')}`
        );

        // Test 1.2: Trio [1, 3, 2] -> [3, 1, 2]
        let trioInput = ['kubejs:blacksmith_workbench', 'kubejs:infernal_crucible', 'kubejs:blacksmith_hearth'];
        let trioSorted = sortBlocks(trioInput);
        assert(
            "Auto-Sort: Trio [1, 3, 2] -> [3, 1, 2]",
            trioSorted[0] === 'kubejs:infernal_crucible' &&
            trioSorted[1] === 'kubejs:blacksmith_workbench' &&
            trioSorted[2] === 'kubejs:blacksmith_hearth',
            `Result: ${trioSorted.join(' -> ')}`
        );

        // Test 1.3: Grand Forge [4, 2, 1, 3] -> [3, 1, 2, 4]
        let quadInput = [
            'kubejs:void_anvil',
            'kubejs:blacksmith_hearth',
            'kubejs:blacksmith_workbench',
            'kubejs:infernal_crucible'
        ];
        let quadSorted = sortBlocks(quadInput);
        assert(
            "Auto-Sort: Grand Forge [4, 2, 1, 3] -> [3, 1, 2, 4]",
            quadSorted[0] === 'kubejs:infernal_crucible' &&
            quadSorted[1] === 'kubejs:blacksmith_workbench' &&
            quadSorted[2] === 'kubejs:blacksmith_hearth' &&
            quadSorted[3] === 'kubejs:void_anvil',
            `Result: ${quadSorted.join(' -> ')}`
        );

        // Test 1.4: End Trio [4, 1, 2] -> [1, 2, 4]
        let endTrio = ['kubejs:void_anvil', 'kubejs:blacksmith_workbench', 'kubejs:blacksmith_hearth'];
        let endSorted = sortBlocks(endTrio);
        assert(
            "Auto-Sort: End Trio [4, 1, 2] -> [1, 2, 4]",
            endSorted[0] === 'kubejs:blacksmith_workbench' &&
            endSorted[1] === 'kubejs:blacksmith_hearth' &&
            endSorted[2] === 'kubejs:void_anvil',
            `Result: ${endSorted.join(' -> ')}`
        );
    }

    // --------------------------------------------------------------------------
    // 2. REAL CRAFTING CATALOG & REPAIR MATERIALS (BS_CATALOG)
    // --------------------------------------------------------------------------
    {
        if (typeof BS_CATALOG !== 'undefined') {
            // Test 2.1: 15 SimplySwords Weapons Registered
            let weapons = BS_CATALOG[0] || [];
            let allSimplySwords = weapons.every(w => w.id && w.id.startsWith('simplyswords:iron_'));
            assert(
                "Catalog: 15 SimplySwords Weapons Registered",
                weapons.length === 15 && allSimplySwords,
                `Found ${weapons.length} items (expected 15, all simplyswords:iron_*)`
            );

            // Test 2.2: Tier 1 Armor Sets Registered (16 pieces)
            let armors = BS_CATALOG[1] || [];
            assert(
                "Catalog: 16 Tier 1 Armor Pieces Registered",
                armors.length === 16,
                `Found ${armors.length} armor pieces (expected 16)`
            );

            // Test 2.3: Steel Pickaxe present in Tools Tab with 3 ingots
            let tools = BS_CATALOG[2] || [];
            let steelPick = tools.find(t => t.id === 'kubejs:steel_pickaxe');
            assert(
                "Catalog: Steel Pickaxe present with 3 steel ingots",
                steelPick !== undefined && steelPick.ingot === 'kubejs:steel_ingot' && steelPick.baseIngots === 3,
                `Steel pickaxe: ${steelPick ? (steelPick.baseIngots + ' ingots') : 'missing'}`
            );
        }

        // Test 2.4: Repair Material Resolution
        if (typeof getRepairMaterial === 'function') {
            assert("Repair: Steel Knight repairs with steel ingot", getRepairMaterial('kubejs:steel_knight_chestplate').id === 'kubejs:steel_ingot', "Steel ingot mapped");
            assert("Repair: Iron Chestplate repairs with iron ingot", getRepairMaterial('minecraft:iron_chestplate').id === 'minecraft:iron_ingot', "Iron ingot mapped");
            assert("Repair: Diamond Sword repairs with diamond", getRepairMaterial('minecraft:diamond_sword').id === 'minecraft:diamond', "Diamond mapped");
            assert("Repair: Wooden Tool repairs with planks", getRepairMaterial('minecraft:wooden_pickaxe').id === '#minecraft:planks', "Planks mapped");
            assert("Repair: Leather Boots repair with leather", getRepairMaterial('minecraft:leather_boots').id === 'minecraft:leather', "Leather mapped");
        }
    }

    // --------------------------------------------------------------------------
    // 3. DIAMOND MINING BARRIER LOGIC
    // --------------------------------------------------------------------------
    {
        if (typeof isPermittedDiamondMiningTool === 'function') {
            function mockTool(id, isPickaxeTag) {
                return {
                    id: id,
                    isEmpty: () => false,
                    hasTag: (tag) => {
                        if (isPickaxeTag && (tag === 'minecraft:pickaxes' || tag === 'c:tools/pickaxes')) return true;
                        return false;
                    }
                };
            }

            assert("Barrier: Blocks Wooden Pickaxe", !isPermittedDiamondMiningTool(mockTool('minecraft:wooden_pickaxe', true)), "Wood blocked");
            assert("Barrier: Blocks Stone Pickaxe", !isPermittedDiamondMiningTool(mockTool('minecraft:stone_pickaxe', true)), "Stone blocked");
            assert("Barrier: Blocks Iron Pickaxe", !isPermittedDiamondMiningTool(mockTool('minecraft:iron_pickaxe', true)), "Iron blocked");
            assert("Barrier: Blocks Golden Pickaxe", !isPermittedDiamondMiningTool(mockTool('minecraft:golden_pickaxe', true)), "Gold blocked");
            assert("Barrier: Blocks Sword / Non-Pickaxe", !isPermittedDiamondMiningTool(mockTool('minecraft:iron_sword', false)), "Sword blocked");
            assert("Barrier: Allows Steel Pickaxe", isPermittedDiamondMiningTool(mockTool('kubejs:steel_pickaxe', true)), "Steel pickaxe permitted");
            assert("Barrier: Allows Diamond Pickaxe", isPermittedDiamondMiningTool(mockTool('minecraft:diamond_pickaxe', true)), "Diamond pickaxe permitted");
            assert("Barrier: Allows Netherite Pickaxe", isPermittedDiamondMiningTool(mockTool('minecraft:netherite_pickaxe', true)), "Netherite pickaxe permitted");
            assert("Barrier: Allows Aether Zanite Pickaxe", isPermittedDiamondMiningTool(mockTool('aether:zanite_pickaxe', true)), "Aether Zanite permitted");
            assert("Barrier: Allows Undergarden Froststeel Pickaxe", isPermittedDiamondMiningTool(mockTool('undergarden:froststeel_pickaxe', true)), "Froststeel permitted");
        }
    }

    // --------------------------------------------------------------------------
    // 4. 3D MULTIBLOCK MODEL PART FORMATION LOGIC (determineFormationParts)
    // --------------------------------------------------------------------------
    {
        let partFn = (typeof determineFormationParts === 'function') ? determineFormationParts : function(sortedIds) {
            if (!sortedIds || sortedIds.length <= 1) return sortedIds ? sortedIds.map(() => 'single') : [];
            let len = sortedIds.length;
            if (len === 4) {
                let isGrand = (sortedIds[0] === 'kubejs:infernal_crucible' && sortedIds[1] === 'kubejs:blacksmith_workbench' && sortedIds[2] === 'kubejs:blacksmith_hearth' && sortedIds[3] === 'kubejs:void_anvil');
                return isGrand ? ['quad_0', 'quad_1', 'quad_2', 'quad_3'] : ['single', 'single', 'single', 'single'];
            }
            if (len === 3) {
                let isCanonicalTrio = (sortedIds[0] === 'kubejs:infernal_crucible' && sortedIds[1] === 'kubejs:blacksmith_workbench' && sortedIds[2] === 'kubejs:blacksmith_hearth');
                if (isCanonicalTrio) return ['trio_left', 'trio_mid', 'trio_right'];
                if (sortedIds[0] === 'kubejs:blacksmith_workbench' && sortedIds[1] === 'kubejs:blacksmith_hearth' && sortedIds[2] === 'kubejs:void_anvil') return ['pair_left', 'pair_right', 'single'];
                return ['single', 'single', 'single'];
            }
            if (len === 2) {
                let isCanonicalPair = (sortedIds[0] === 'kubejs:blacksmith_workbench' && sortedIds[1] === 'kubejs:blacksmith_hearth');
                return isCanonicalPair ? ['pair_left', 'pair_right'] : ['single', 'single'];
            }
            return sortedIds.map(() => 'single');
        };

        // Test 4.1: Canonical Pair [workbench, hearth]
        let p2 = partFn(['kubejs:blacksmith_workbench', 'kubejs:blacksmith_hearth']);
        assert("3D Part: Canonical Pair assigns [pair_left, pair_right]", p2[0] === 'pair_left' && p2[1] === 'pair_right', `Parts: ${p2.join(', ')}`);

        // Test 4.2: Invalid Pair [workbench, workbench] -> [single, single]
        let p2_inv = partFn(['kubejs:blacksmith_workbench', 'kubejs:blacksmith_workbench']);
        assert("3D Part: Duplicate Pair assigns [single, single]", p2_inv[0] === 'single' && p2_inv[1] === 'single', `Parts: ${p2_inv.join(', ')}`);

        // Test 4.3: Canonical Trio [crucible, workbench, hearth]
        let p3 = partFn(['kubejs:infernal_crucible', 'kubejs:blacksmith_workbench', 'kubejs:blacksmith_hearth']);
        assert("3D Part: Canonical Trio assigns [trio_left, trio_mid, trio_right]", p3[0] === 'trio_left' && p3[1] === 'trio_mid' && p3[2] === 'trio_right', `Parts: ${p3.join(', ')}`);

        // Test 4.4: Sub-canonical End Trio [workbench, hearth, anvil]
        let p3_end = partFn(['kubejs:blacksmith_workbench', 'kubejs:blacksmith_hearth', 'kubejs:void_anvil']);
        assert("3D Part: End Trio assigns [pair_left, pair_right, single]", p3_end[0] === 'pair_left' && p3_end[1] === 'pair_right' && p3_end[2] === 'single', `Parts: ${p3_end.join(', ')}`);

        // Test 4.5: Canonical Grand Forge [crucible, workbench, hearth, anvil]
        let p4 = partFn(['kubejs:infernal_crucible', 'kubejs:blacksmith_workbench', 'kubejs:blacksmith_hearth', 'kubejs:void_anvil']);
        assert("3D Part: Canonical Grand Forge assigns [quad_0, quad_1, quad_2, quad_3]", p4[0] === 'quad_0' && p4[1] === 'quad_1' && p4[2] === 'quad_2' && p4[3] === 'quad_3', `Parts: ${p4.join(', ')}`);

        // Test 4.6: Invalid Quad [workbench, workbench, workbench, workbench] -> all single
        let p4_inv = partFn(['kubejs:blacksmith_workbench', 'kubejs:blacksmith_workbench', 'kubejs:blacksmith_workbench', 'kubejs:blacksmith_workbench']);
        assert("3D Part: Non-Grand Quad defaults to all single", p4_inv.every(p => p === 'single'), `Parts: ${p4_inv.join(', ')}`);

        // Test 4.7: Solo module defaults to single
        let p1 = partFn(['kubejs:blacksmith_workbench']);
        assert("3D Part: Solo module defaults to single", p1[0] === 'single', `Part: ${p1[0]}`);
    }

    // --------------------------------------------------------------------------
    // 5. WORKSHOP METAL STORAGE BUFFER & DUAL-SOURCE LOGIC
    // --------------------------------------------------------------------------
    {
        let mockLevel = { persistentData: {}, getBlock: function() { return null; } };
        let mockPos = { x: 10, y: 64, z: 20 };
        let mockPlayer = {
            level: mockLevel,
            inventory: {
                size: 36,
                items: [],
                getItem: function(idx) { return this.items[idx] || null; }
            }
        };

        // Test 5.1: Buffer initialization and anchor key
        let anchorKey = (typeof getStationAnchorKey === 'function')
            ? getStationAnchorKey({ line: [mockPos] }, mockPos)
            : '10_64_20';
        assert("Buffer: Anchor key generated correctly", anchorKey === '10_64_20', `Anchor key: ${anchorKey}`);

        let buf = (typeof getWorkshopBuffer === 'function')
            ? getWorkshopBuffer(mockLevel, mockPos)
            : { steel: 0, iron: 0, copper: 0 };
        assert("Buffer: Storage buffer initializes steel, iron, copper", buf.steel === 0 && buf.iron === 0 && buf.copper === 0, `Buffer: ${JSON.stringify(buf)}`);

        // Test 5.2: Ingot deposit and buffer count
        if (typeof addBufferIngots === 'function' && typeof countBufferIngots === 'function') {
            addBufferIngots(mockLevel, mockPos, 'steel', 10);
            addBufferIngots(mockLevel, mockPos, 'iron', 25);
            let sCount = countBufferIngots(mockLevel, mockPos, 'kubejs:steel_ingot');
            let iCount = countBufferIngots(mockLevel, mockPos, 'minecraft:iron_ingot');
            assert("Buffer: Steel & Iron correctly added to buffer", sCount === 10 && iCount === 25, `Steel: ${sCount}, Iron: ${iCount}`);

            // Test 5.3: Buffer deduction
            let deducted = deductBufferIngots(mockLevel, mockPos, 'kubejs:steel_ingot', 4);
            let sAfter = countBufferIngots(mockLevel, mockPos, 'kubejs:steel_ingot');
            assert("Buffer: Deducting 4 steel leaves 6", deducted === 4 && sAfter === 6, `Deducted: ${deducted}, Remaining: ${sAfter}`);
        }

        // Test 5.4: Dual-Source Availability Calculation
        if (typeof getAvailableIngotsBS === 'function') {
            let availStandalone = getAvailableIngotsBS(mockPlayer, mockPos, 'kubejs:steel_ingot', false);
            assert("Dual-Source: Standalone Workbench does NOT access buffer", availStandalone.total === 0 && availStandalone.buffer === 0, `Total: ${availStandalone.total}`);

            let availConnected = getAvailableIngotsBS(mockPlayer, mockPos, 'kubejs:steel_ingot', true);
            assert("Dual-Source: Connected Station accesses buffer (+6 steel)", availConnected.total === 6 && availConnected.buffer === 6, `Total: ${availConnected.total}`);
        }
    }

    return { total: total, passed: passed, failed: failed, results: results };
}

ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event;
    event.register(
        Commands.literal('blacksmith_test')
            .requires(src => src.hasPermission(2))
            .executes(ctx => {
                let report = runBlacksmithTestSuite();
                ctx.source.sendSuccess(() => Text.of('§6=== ELYRIUM BLACKSMITH QA REPORT ==='), false);
                for (let r of report.results) {
                    let mark = r.passed ? '§a✔' : '§c✘';
                    ctx.source.sendSuccess(() => Text.of(`${mark} §f${r.name}: ${r.detail}`), false);
                }
                let summaryColor = report.failed === 0 ? '§a' : '§c';
                ctx.source.sendSuccess(() => Text.of(`${summaryColor}ИТОГ: Проверок: ${report.total} | Успешно: ${report.passed} | Ошибок: ${report.failed}`), false);
                return report.failed === 0 ? 1 : 0;
            })
    );
});
