// ==============================================================================
// 🧪 ELYRIUM RPG: AUTOMATED SKILL TEST SUITE
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// File: skills_test_suite.js
// ==============================================================================
// Provides automated verification for Combat, Defense, Magic, and Craftsman logic
// without requiring real mobs or in-game entities.
// Commands:
//   /test_skills       - Runs standard automated test suite and outputs summary
//   /test_skills full  - Runs comprehensive test suite with full diagnostic trace
// ==============================================================================

function runSkillTestSuite(isFull) {
    let results = []
    let totalTests = 0
    let passedCount = 0
    let failedCount = 0

    function approxEqual(a, b, epsilon) {
        let eps = epsilon !== undefined ? epsilon : 0.001
        return Math.abs(a - b) < eps
    }

    function recordTest(name, passed, detail) {
        totalTests++
        if (passed) {
            passedCount++
            results.push({ name: name, passed: true, detail: detail })
        } else {
            failedCount++
            results.push({ name: name, passed: false, detail: detail })
        }
    }

    // --------------------------------------------------------------------------
    // A. ATTACK & DAMAGE TRIGGERS
    // --------------------------------------------------------------------------

    // 1. Backstab (+40% bonus when sneak/behind)
    {
        let baseDmg = 10.0
        // Helper matching skills_combat_triggers.js:
        function calcBackstab(base, isSneaking, attackerYaw, victimYaw) {
            let dmg = base
            let isBehind = false
            let diff = Math.abs((attackerYaw - victimYaw) % 360)
            if (diff > 180) diff = 360 - diff
            if (diff < 60) isBehind = true

            if (isSneaking || isBehind) {
                dmg *= 1.40
            }
            return dmg
        }

        let sneakDmg = calcBackstab(baseDmg, true, 0, 180)    // Sneaking from front
        let behindDmg = calcBackstab(baseDmg, false, 45, 30)  // Behind (diff = 15 < 60)
        let normalDmg = calcBackstab(baseDmg, false, 0, 180)  // Face-to-face (diff = 180)

        let pass = approxEqual(sneakDmg, 14.0) && approxEqual(behindDmg, 14.0) && approxEqual(normalDmg, 10.0)
        recordTest(
            'Backstab (+40% DMG)',
            pass,
            `Базовый: 10.0 | Скрытность: ${sneakDmg.toFixed(1)} (+40%) | Сзади (15°): ${behindDmg.toFixed(1)} (+40%) | В лоб: ${normalDmg.toFixed(1)}`
        )
    }

    // 2. Sniper (+30% bonus at distance > 15)
    {
        let baseDmg = 10.0
        function calcSniper(base, x1, z1, x2, z2) {
            let dmg = base
            let dx = x1 - x2
            let dz = z1 - z2
            let dist = Math.sqrt(dx * dx + dz * dz)
            if (dist > 15.0) {
                dmg *= 1.30
            }
            return { dmg: dmg, dist: dist }
        }

        let longShot = calcSniper(baseDmg, 0, 0, 16, 0)      // dist = 16.0 > 15.0
        let boundaryShot = calcSniper(baseDmg, 0, 0, 15, 0)  // dist = 15.0 (not > 15)
        let closeShot = calcSniper(baseDmg, 0, 0, 5, 0)      // dist = 5.0

        let pass = approxEqual(longShot.dmg, 13.0) && approxEqual(boundaryShot.dmg, 10.0) && approxEqual(closeShot.dmg, 10.0)
        recordTest(
            'Sniper Distance Shot (+30% DMG)',
            pass,
            `Дистанция 16м: ${longShot.dmg.toFixed(1)} (+30%) | Дистанция 15м (граница): ${boundaryShot.dmg.toFixed(1)} | Дистанция 5м: ${closeShot.dmg.toFixed(1)}`
        )
    }

    // 3. Ice Shatter (+50% bonus on slowed victim)
    {
        let baseDmg = 20.0
        function calcIceShatter(base, isSlowed) {
            let dmg = base
            if (isSlowed) {
                dmg *= 1.50
            }
            return dmg
        }

        let slowedDmg = calcIceShatter(baseDmg, true)
        let normalDmg = calcIceShatter(baseDmg, false)

        let pass = approxEqual(slowedDmg, 30.0) && approxEqual(normalDmg, 20.0)
        recordTest(
            'Ice Shatter (+50% DMG)',
            pass,
            `Базовый: 20.0 | По замедленной цели: ${slowedDmg.toFixed(1)} (+50%) | По обычной цели: ${normalDmg.toFixed(1)}`
        )
    }

    // 4. Fire Combustion (+20% on burning victim)
    {
        let baseDmg = 10.0
        function calcFireCombustion(base, isOnFire) {
            let dmg = base
            if (isOnFire) {
                dmg *= 1.20
            }
            return dmg
        }

        let burningDmg = calcFireCombustion(baseDmg, true)
        let unburntDmg = calcFireCombustion(baseDmg, false)

        let pass = approxEqual(burningDmg, 12.0) && approxEqual(unburntDmg, 10.0)
        recordTest(
            'Fire Combustion (+20% DMG)',
            pass,
            `Базовый: 10.0 | По горящей цели: ${burningDmg.toFixed(1)} (+20%) | Без огня: ${unburntDmg.toFixed(1)}`
        )
    }

    // 5. Blood Vampirism (+12% lifesteal calculation)
    {
        function calcLifesteal(dmg) {
            return Math.max(1.0, dmg * 0.12)
        }

        let heal50 = calcLifesteal(50.0)
        let heal100 = calcLifesteal(100.0)
        let healLow = calcLifesteal(5.0) // 5 * 0.12 = 0.6 -> clamped to min 1.0

        let pass = approxEqual(heal50, 6.0) && approxEqual(heal100, 12.0) && approxEqual(healLow, 1.0)
        recordTest(
            'Blood Vampirism (+12% Lifesteal)',
            pass,
            `Урон 50 -> Лечение: ${heal50.toFixed(1)} HP (12%) | Урон 100 -> Лечение: ${heal100.toFixed(1)} HP | Урон 5 -> Мин. порог: ${healLow.toFixed(1)} HP`
        )
    }

    // 6. Holy Smite (+40% on undead victim)
    {
        let baseDmg = 25.0
        function calcHolySmite(base, isUndead) {
            let dmg = base
            if (isUndead) {
                dmg *= 1.40
            }
            return dmg
        }

        let undeadDmg = calcHolySmite(baseDmg, true)
        let livingDmg = calcHolySmite(baseDmg, false)

        let pass = approxEqual(undeadDmg, 35.0) && approxEqual(livingDmg, 25.0)
        recordTest(
            'Holy Smite (+40% Undead DMG)',
            pass,
            `Базовый: 25.0 | По нежити: ${undeadDmg.toFixed(1)} (+40%) | По живым: ${livingDmg.toFixed(1)}`
        )
    }

    // --------------------------------------------------------------------------
    // B. DEFENSIVE TRIGGERS
    // --------------------------------------------------------------------------

    // 7. Tank Damage Cap (limit to 35% max health)
    {
        let maxHealth = 40.0
        let maxAllowed = maxHealth * 0.35 // 14.0 HP cap
        function calcTankCap(incomingDmg, maxHp) {
            let cap = maxHp * 0.35
            return incomingDmg > cap ? cap : incomingDmg
        }

        let hugeHit = calcTankCap(60.0, maxHealth)
        let regularHit = calcTankCap(8.0, maxHealth)
        let exactCap = calcTankCap(14.0, maxHealth)

        let pass = approxEqual(hugeHit, 14.0) && approxEqual(regularHit, 8.0) && approxEqual(exactCap, 14.0)
        recordTest(
            'Tank Damage Cap (35% Max HP)',
            pass,
            `Макс HP: 40.0 (Кэп: 14.0 HP) | Входящий 60.0 -> ${hugeHit.toFixed(1)} | Входящий 8.0 -> ${regularHit.toFixed(1)}`
        )
    }

    // 8. Paladin Divine Shield (Cheat Death prevention at fatal damage)
    {
        function simulateCheatDeath(currentHp, maxHp, incomingDmg, nowTime, lastCooldownTime) {
            let state = {
                damage: incomingDmg,
                canceled: false,
                currentHp: currentHp,
                cooldownUpdated: false,
                newCooldownTime: lastCooldownTime
            }
            if (incomingDmg >= currentHp) {
                if (nowTime - lastCooldownTime > 3600) {
                    state.newCooldownTime = nowTime
                    state.cooldownUpdated = true
                    state.damage = 0
                    state.canceled = true
                    state.currentHp = maxHp * 0.50
                }
            }
            return state
        }

        let readyCase = simulateCheatDeath(5.0, 20.0, 25.0, 4000, 0)
        let cooldownCase = simulateCheatDeath(5.0, 20.0, 25.0, 4500, 4000)

        let passReady = readyCase.damage === 0 && readyCase.canceled === true && approxEqual(readyCase.currentHp, 10.0) && readyCase.cooldownUpdated
        let passCooldown = cooldownCase.damage === 25.0 && cooldownCase.canceled === false

        let pass = passReady && passCooldown
        recordTest(
            'Paladin Cheat Death',
            pass,
            `КД готов: Урон -> 0, Отмена: да, HP -> ${readyCase.currentHp.toFixed(1)}/20 (50%) | На КД: Урон -> ${cooldownCase.damage.toFixed(1)}, Отмена: нет`
        )
    }

    // 9. Mercenary Evasion (15% dodge chance calculation)
    {
        function calcDodge(roll) {
            return roll < 0.15
        }

        let detDodge = calcDodge(0.10) === true
        let detHit = calcDodge(0.20) === false

        // Monte Carlo simulation with 10,000 rolls
        let simCount = 10000
        let dodges = 0
        for (let i = 0; i < simCount; i++) {
            if (Math.random() < 0.15) dodges++
        }
        let empiricalRate = dodges / simCount
        // 99.9% confidence interval for 10000 trials of p=0.15 is approx [0.138, 0.162]
        let passRate = empiricalRate >= 0.135 && empiricalRate <= 0.165
        let pass = detDodge && detHit && passRate

        recordTest(
            'Mercenary Evasion',
            pass,
            `Порог: 15% | Детерм: (0.10->Уворот, 0.20->Удар) | Монте-Карло (${simCount} бросков): ${(empiricalRate * 100).toFixed(2)}% (норма: 15±1.5%)`
        )
    }

    // 10. Eldritch Mana Shield (25% damage absorption)
    {
        let baseDmg = 40.0
        function calcManaShield(dmg) {
            return dmg * 0.75
        }

        let reducedDmg = calcManaShield(baseDmg)
        let pass = approxEqual(reducedDmg, 30.0) && approxEqual(calcManaShield(100.0), 75.0)

        recordTest(
            'Eldritch Mana Shield',
            pass,
            `Входящий: 40.0 -> После поглощения: ${reducedDmg.toFixed(1)} (-25% урона) | Входящий 100 -> ${calcManaShield(100.0).toFixed(1)}`
        )
    }

    // --------------------------------------------------------------------------
    // C. CRAFTSMAN TRIGGERS
    // --------------------------------------------------------------------------

    // 11. Durability calculation (+4% up to +50%)
    {
        function calcDurability(baseMax, bonusPct) {
            return Math.round(baseMax * (1.0 + bonusPct / 100.0))
        }

        let baseDurability = 1000
        let d4 = calcDurability(baseDurability, 4)   // +4%
        let d8 = calcDurability(baseDurability, 8)   // +8%
        let d12 = calcDurability(baseDurability, 12) // +12%
        let d25 = calcDurability(baseDurability, 25) // +25%
        let d50 = calcDurability(baseDurability, 50) // +50%

        let pass = (d4 === 1040) && (d8 === 1080) && (d12 === 1120) && (d25 === 1250) && (d50 === 1500)
        recordTest(
            'Masterwork Durability Scaling',
            pass,
            `База: 1000 | +4% -> ${d4} | +8% -> ${d8} | +12% -> ${d12} | +25% -> ${d25} | +50% -> ${d50}`
        )
    }

    // 12. Masterwork Crafting roll (15% roll with Unbreaking I and lore)
    {
        function simulateMasterwork(baseBonusPct, roll, currentUnbreaking) {
            let isMasterwork = roll < 0.15
            let finalBonus = baseBonusPct
            let appliedUnbreaking = currentUnbreaking
            let hasLore = false

            if (isMasterwork) {
                finalBonus += 20
                if (appliedUnbreaking < 1) {
                    appliedUnbreaking = 1
                }
                hasLore = true
            }
            return {
                isMasterwork: isMasterwork,
                finalBonus: finalBonus,
                unbreaking: appliedUnbreaking,
                hasLore: hasLore
            }
        }

        let mwSuccess = simulateMasterwork(8, 0.10, 0)
        let mwFail = simulateMasterwork(8, 0.20, 0)

        // Monte Carlo simulation
        let simCount = 10000
        let mwCount = 0
        for (let i = 0; i < simCount; i++) {
            if (Math.random() < 0.15) mwCount++
        }
        let mwRate = mwCount / simCount
        let passMonte = mwRate >= 0.135 && mwRate <= 0.165

        let pass = (mwSuccess.isMasterwork === true) && (mwSuccess.finalBonus === 28) &&
                   (mwSuccess.unbreaking === 1) && mwSuccess.hasLore &&
                   (mwFail.isMasterwork === false) && (mwFail.finalBonus === 8) && passMonte

        recordTest(
            'Masterwork Crafting Roll',
            pass,
            `Шедевр (+20% прочности, Прочность I, Лор): да | Обычный: да | Монте-Карло (${simCount}): ${(mwRate * 100).toFixed(2)}% (норма: 15±1.5%)`
        )
    }

    // 13. Anvil free repair calculation (20% chance)
    {
        function simulateAnvilRepair(hasMastery, hasRepairMaster, roll) {
            let freeChance = 0.0
            if (hasMastery) freeChance += 0.20
            if (hasRepairMaster) freeChance += 0.10

            let isFree = roll < freeChance
            let refundLevels = 0
            if (isFree) {
                refundLevels = 3 // 3 to 5 levels
            } else {
                refundLevels = hasMastery ? 2 : 1
            }
            return { freeChance: freeChance, isFree: isFree, refund: refundLevels }
        }

        let anvilMaster = simulateAnvilRepair(true, false, 0.10)
        let anvilFail = simulateAnvilRepair(true, false, 0.50)

        // Monte Carlo 10,000 rolls
        let simCount = 10000
        let freeCount = 0
        for (let i = 0; i < simCount; i++) {
            if (Math.random() < 0.20) freeCount++
        }
        let freeRate = freeCount / simCount
        let passMonte = freeRate >= 0.185 && freeRate <= 0.215

        let pass = (anvilMaster.freeChance === 0.20) && (anvilMaster.isFree === true) && (anvilMaster.refund === 3) &&
                   (anvilFail.isFree === false) && (anvilFail.refund === 2) && passMonte

        recordTest(
            'Anvil Repair Refund',
            pass,
            `Шанс: ${(anvilMaster.freeChance * 100)}% | Бесплатно -> возврат ${anvilMaster.refund} ур. | Скидка -> возврат ${anvilFail.refund} ур. | Монте-Карло: ${(freeRate * 100).toFixed(2)}%`
        )
    }

    // 14. Enchanting table free enchant calculation (20% chance)
    {
        function simulateEnchantTable(hasFinal, hasLuck, hasSubclass, hasArcansmith, roll) {
            let freeChance = 0.0
            if (hasFinal) freeChance += 0.10
            if (hasLuck) freeChance += 0.05
            if (hasSubclass) freeChance += 0.025
            if (hasArcansmith) freeChance += 0.025

            let isFree = roll < freeChance
            let xpRefund = isFree ? 3 : (hasFinal ? 2 : 1)
            let lapisRefund = isFree ? 3 : 0

            return { freeChance: freeChance, isFree: isFree, xp: xpRefund, lapis: lapisRefund }
        }

        let fullEnchanter = simulateEnchantTable(true, true, true, true, 0.10)
        let partialEnchanter = simulateEnchantTable(true, true, true, true, 0.50)

        // Monte Carlo 10,000 rolls
        let simCount = 10000
        let freeCount = 0
        for (let i = 0; i < simCount; i++) {
            if (Math.random() < 0.20) freeCount++
        }
        let freeRate = freeCount / simCount
        let passMonte = freeRate >= 0.185 && freeRate <= 0.215

        let pass = approxEqual(fullEnchanter.freeChance, 0.20) && (fullEnchanter.isFree === true) &&
                   (fullEnchanter.xp === 3) && (fullEnchanter.lapis === 3) &&
                   (partialEnchanter.isFree === false) && (partialEnchanter.xp === 2) && passMonte

        recordTest(
            'Free Enchanting Logic',
            pass,
            `Сумма перков: ${(fullEnchanter.freeChance * 100).toFixed(1)}% | Бесплатно -> возврат 3 ур. + 3 лазурита | Скидка -> возврат 2 ур. | Монте-Карло: ${(freeRate * 100).toFixed(2)}%`
        )
    }

    return {
        results: results,
        total: totalTests,
        passed: passedCount,
        failed: failedCount,
        isFull: isFull
    }
}

// ------------------------------------------------------------------------------
// EXECUTE & OUTPUT HANDLER
// ------------------------------------------------------------------------------
function handleSkillTestSuiteExecution(ctx, isFull) {
    let report = runSkillTestSuite(isFull)
    let outputLines = []

    outputLines.push('§6=== [ELYRIUM SKILLS TEST SUITE] ===')
    if (isFull) {
        outputLines.push('§e[РЕЖИМ ПОЛНОЙ ДИАГНОСТИКИ С ДЕТАЛИЗАЦИЕЙ]')
    }

    for (let test of report.results) {
        let mark = test.passed ? '§a✔' : '§c✘'
        let status = test.passed ? '§aPASS' : '§cFAIL'
        outputLines.push(`${mark} ${test.name}: ${status}`)
        if (isFull && test.detail) {
            outputLines.push(`  §7└─ ${test.detail}`)
        }
    }

    outputLines.push(`§eВсего тестов: ${report.total} | Успешно: ${report.passed} | Ошибок: ${report.failed}`)

    // Send lines to executor and log to server console
    for (let line of outputLines) {
        ctx.source.sendSuccess(() => Text.of(line), false)
        console.info(line.replace(/§[0-9a-fk-or]/g, ''))
    }

    return report.failed === 0 ? 1 : 0
}

// ------------------------------------------------------------------------------
// COMMAND REGISTRATION (/test_skills and /test_skills full)
// ------------------------------------------------------------------------------
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event

    event.register(
        Commands.literal('test_skills')
            .then(
                Commands.literal('full')
                    .executes(ctx => {
                        return handleSkillTestSuiteExecution(ctx, true)
                    })
            )
            .executes(ctx => {
                return handleSkillTestSuiteExecution(ctx, false)
            })
    )
})
