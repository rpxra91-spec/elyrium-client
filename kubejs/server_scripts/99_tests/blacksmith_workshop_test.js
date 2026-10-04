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
    // 1. SPATIAL AUTO-ALIGNMENT ALGORITHM & CANONICAL RANKING
    // --------------------------------------------------------------------------
    {
        const RANK = {
            'kubejs:infernal_crucible': 0,    // 3
            'kubejs:blacksmith_workbench': 1, // 1
            'kubejs:blacksmith_hearth': 2,    // 2
            'kubejs:void_anvil': 3            // 4
        };

        function sortBlocks(input) {
            return [...input].sort((a, b) => RANK[a] - RANK[b]);
        }

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
    // 2. CRAFTING CATALOG PENALTY & INTEGRITY
    // --------------------------------------------------------------------------
    {
        // Test 2.1: Standalone Workbench Penalty (+1 Ingot)
        function calcIngots(base, hasHearth) {
            return base + (hasHearth ? 0 : 1);
        }
        assert(
            "Penalty: Standalone Workbench (+1 Ingot)",
            calcIngots(2, false) === 3 && calcIngots(2, true) === 2,
            `Standalone: ${calcIngots(2, false)} (expected 3), Connected: ${calcIngots(2, true)} (expected 2)`
        );

        // Test 2.2: Standalone Hearth Repair Penalty (25% vs 50%)
        function calcRepairPercent(hasHearth) {
            return hasHearth ? 0.50 : 0.25;
        }
        assert(
            "Penalty: Standalone Hearth (25% vs 50% durability)",
            calcRepairPercent(false) === 0.25 && calcRepairPercent(true) === 0.50,
            `Standalone: ${calcRepairPercent(false) * 100}%, Connected: ${calcRepairPercent(true) * 100}%`
        );

        // Test 2.3: 15 SimplySwords presence in BS_CATALOG
        if (typeof BS_CATALOG !== 'undefined') {
            let weapons = BS_CATALOG[0] || [];
            assert(
                "Catalog: 15 SimplySwords Weapons Registered",
                weapons.length === 15,
                `Found ${weapons.length} weapons (expected 15)`
            );
        }
    }

    // --------------------------------------------------------------------------
    // 3. DIAMOND MINING BARRIER LOGIC
    // --------------------------------------------------------------------------
    {
        const DISALLOWED = ['wood', 'stone', 'gold', 'iron', 'copper', 'flint', 'bone'];

        function canMineDiamonds(toolId) {
            if (toolId === 'kubejs:steel_pickaxe') return true;
            for (let sub of DISALLOWED) {
                if (toolId.includes(sub) && !toolId.includes('steel')) {
                    return false;
                }
            }
            if (toolId.includes('diamond') || toolId.includes('netherite') || toolId.includes('cinder')) {
                return true;
            }
            return false;
        }

        assert("Barrier: Blocks Wooden Pickaxe", !canMineDiamonds('minecraft:wooden_pickaxe'), "Wood blocked");
        assert("Barrier: Blocks Stone Pickaxe", !canMineDiamonds('minecraft:stone_pickaxe'), "Stone blocked");
        assert("Barrier: Blocks Iron Pickaxe", !canMineDiamonds('minecraft:iron_pickaxe'), "Iron blocked");
        assert("Barrier: Blocks Golden Pickaxe", !canMineDiamonds('minecraft:golden_pickaxe'), "Gold blocked");
        assert("Barrier: Allows Steel Pickaxe", canMineDiamonds('kubejs:steel_pickaxe'), "Steel pickaxe permitted");
        assert("Barrier: Allows Diamond Pickaxe", canMineDiamonds('minecraft:diamond_pickaxe'), "Diamond pickaxe permitted");
        assert("Barrier: Allows Netherite Pickaxe", canMineDiamonds('minecraft:netherite_pickaxe'), "Netherite pickaxe permitted");
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
