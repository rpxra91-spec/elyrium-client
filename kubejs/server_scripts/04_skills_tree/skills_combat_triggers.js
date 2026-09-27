// ==============================================================================
// ⚔ ELYRIUM RPG: FULL ATTACK & DEFENSE COMBAT MECHANICS ENGINE
// Minecraft 1.21.1 NeoForge | KubeJS Server Script
// ==============================================================================

// ------------------------------------------------------------------------------
// 1. OUTGOING & INCOMING COMBAT TRIGGERS (EntityEvents.beforeHurt)
// ------------------------------------------------------------------------------
EntityEvents.beforeHurt(event => {
    let source = event.source
    if (!source) return

    let attacker = source.actual || source.player
    let victim = event.entity

    // ==========================================================================
    // A. OUTGOING DAMAGE (Player attacks an entity)
    // ==========================================================================
    if (attacker && attacker.isPlayer() && victim && victim.isAlive()) {
        let tags = attacker.tags
        if (tags) {
            let mainItem = attacker.mainHandItem
            let offItem = attacker.offHandItem
            let mainId = mainItem ? String(mainItem.id).toLowerCase() : ''

            // --- 1. МЕЧНИК (Swordsman) ---
            let isDual = (mainItem && mainItem.maxDamage > 0) && (offItem && offItem.maxDamage > 0)
            if (isDual) {
                let dualBonus = 1.0
                if (tags.contains('skill_swordsman_dual_5')) dualBonus += 0.05
                if (tags.contains('skill_swordsman_master_dual')) dualBonus += 0.15
                if (dualBonus > 1.0) event.damage *= dualBonus
            }

            // Тетродотоксин I & II
            if (tags.contains('skill_swordsman_tetrodotoxin_1') && Math.random() < 0.10) {
                victim.potionEffects.add('minecraft:slowness', 100, 1, false, true)
                attacker.server.runCommandSilent(`playsound minecraft:entity.spider.ambient player ${attacker.username} ~ ~ ~ 0.7 1.4`)
            }
            if (tags.contains('skill_swordsman_tetrodotoxin_2') && Math.random() < 0.15) {
                victim.potionEffects.add('minecraft:weakness', 120, 2, false, true)
            }

            // Рваная рана (Bleeding)
            if (tags.contains('skill_swordsman_bleed') && Math.random() < 0.15) {
                victim.potionEffects.add('attributeslib:bleeding', 160, 0, false, true)
                attacker.server.runCommandSilent(`playsound minecraft:entity.player.attack.crit player ${attacker.username} ~ ~ ~ 0.8 1.1`)
                attacker.sendSystemMessage(Text.of('§4🩸 Нанесена глубокая рваная рана! (Кровотечение)'), true)
            }

            // Мастер Меча: Ускорение при атаке
            if (tags.contains('skill_swordsman_master_haste') && Math.random() < 0.50) {
                attacker.potionEffects.add('irons_spellbooks:hastened', 80, 2, false, false)
            }

            // --- 2. БЕРСЕРК (Berserker) ---
            // Урон от потерянного здоровья (+0.5% за каждый 1% недостающего HP)
            if (tags.contains('skill_warrior_berserk_subclass')) {
                let missingRatio = Math.max(0.0, 1.0 - (attacker.health / attacker.maxHealth))
                let berserkBonus = 1.0 + (missingRatio * 0.45)
                event.damage *= berserkBonus
            }

            // Сильная кровавая рана (Berserk Grievous Bleed)
            if (tags.contains('skill_warrior_berserk_skill_2_2_9') && Math.random() < 0.25) {
                victim.potionEffects.add('attributeslib:bleeding', 160, 1, false, true)
                victim.potionEffects.add('minecraft:slowness', 80, 1, false, false)
                attacker.server.runCommandSilent(`particle minecraft:crimson_spore ${victim.x} ${victim.y + 1} ${victim.z} 0.3 0.3 0.3 0.05 10`)
                attacker.sendSystemMessage(Text.of('§4🩸 Глубокая артериальная рана!'), true)
            }

            // --- 3. СОКРУШИТЕЛЬ (Crusher / Heavy Attacker) ---
            // Мастерство тяжелого оружия (Axes, Claymores, Greatswords, Hammers)
            if (tags.contains('skill_warrior_attackers_subclass')) {
                let isHeavy = mainId.includes('axe') || mainId.includes('hammer') || mainId.includes('claymore') || mainId.includes('greatsword')
                if (isHeavy) {
                    event.damage *= 1.15
                }
            }

            // Раскол души (Soul Sunder)
            if (tags.contains('skill_warrior_attackers_skill_10') && Math.random() < 0.25) {
                victim.potionEffects.add('minecraft:slowness', 80, 2, false, true)
                victim.potionEffects.add('minecraft:mining_fatigue', 80, 2, false, true)
                attacker.server.runCommandSilent(`playsound minecraft:block.anvil.land player ${attacker.username} ~ ~ ~ 0.7 0.8`)
                attacker.sendSystemMessage(Text.of('§8⚡ Душа врага расколота! (-30% подвижности)'), true)
            }

            // Разрушение брони (Armor Shred)
            if (tags.contains('skill_warrior_attackers_skill_12')) {
                event.damage *= 1.20
            }

            // Сокрушающее ускорение (Momentum)
            if (tags.contains('skill_warrior_attackers_skill_11_4')) {
                attacker.potionEffects.add('minecraft:haste', 60, 0, false, false)
            }

            // Укрепление духа при крите
            if (tags.contains('skill_warrior_attackers_skill_11_11')) {
                if (attacker.health < attacker.maxHealth) {
                    attacker.heal(1.5)
                }
            }

            // Крушитель защиты: Сокрушительная ударная волна
            if (tags.contains('skill_warrior_attackers_final')) {
                let level = attacker.level
                let nearby = level.getEntitiesWithin(AABB.of(victim.x - 3.5, victim.y - 1.5, victim.z - 3.5, victim.x + 3.5, victim.y + 2.5, victim.z + 3.5))
                let waveDmg = event.damage * 0.5
                for (let ent of nearby) {
                    if (ent && ent.isAlive() && ent !== attacker && ent !== victim && ent.isLiving() && !ent.isPlayer()) {
                        ent.attack(source, waveDmg)
                        ent.potionEffects.add('minecraft:slowness', 40, 3, false, false)
                    }
                }
                attacker.server.runCommandSilent(`particle minecraft:explosion ${victim.x} ${victim.y + 0.5} ${victim.z} 0.5 0.2 0.5 0.05 3`)
                attacker.server.runCommandSilent(`playsound minecraft:entity.generic.explode player ${attacker.username} ~ ~ ~ 0.8 1.2`)
            }

            // --- 4. ПАЛЛАДИН (Paladin) ---
            // Карающая десница против нежити и демонов
            if (tags.contains('skill_warrior_paladin_skill_2_1_4')) {
                let victimType = String(victim.type).toLowerCase()
                let isUndeadOrDemon = victimType.includes('zombie') || victimType.includes('skeleton') || victimType.includes('wither') ||
                                      victimType.includes('draugr') || victimType.includes('nether') || victimType.includes('demon')
                if (isUndeadOrDemon) {
                    event.damage *= 1.35
                    attacker.server.runCommandSilent(`particle minecraft:soul_fire_flame ${victim.x} ${victim.y + 1} ${victim.z} 0.2 0.4 0.2 0.02 8`)
                    attacker.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${attacker.username} ~ ~ ~ 0.8 1.2`)
                }
            }

            // Молот слабости (Paladin Hammer of Weakness)
            if (tags.contains('skill_warrior_paladin_skill_2_2_9') && Math.random() < 0.30) {
                victim.potionEffects.add('minecraft:weakness', 100, 2, false, true)
                victim.potionEffects.add('minecraft:glowing', 100, 0, false, false)
            }

            // --- 5. ТАНК (Tank) ---
            // Молот замедления (Tank Hammer Slow)
            if (tags.contains('skill_warrior_tank_skill_2_1_4')) {
                victim.potionEffects.add('minecraft:slowness', 80, 2, false, true)
            }

            // --- 6. РЫЦАРЬ (Knight) ---
            // Героическая стойкость: Бонус урона, если игрок не бежит спринтом
            if (tags.contains('skill_warrior_defenders_final')) {
                if (!attacker.isSprinting()) {
                    event.damage *= 1.15
                }
            }

            // --- 7. ЛУЧНИК (Archer) ---
            let isProjectile = (source.direct && (String(source.direct.type).includes('arrow') || String(source.direct.type).includes('projectile'))) || String(source.type).toLowerCase().includes('arrow')
            if (isProjectile) {
                if (tags.contains('skill_archer_subclass')) {
                    event.damage *= 1.15
                }
                // Кровожадные стрелы
                if (tags.contains('skill_archer_skill_2_1_8_1')) {
                    victim.potionEffects.add('attributeslib:bleeding', 120, 0, false, true)
                    if (attacker.health < attacker.maxHealth) {
                        attacker.heal(event.damage * 0.10)
                    }
                }
                // Снайперский выстрел с дальней дистанции (>15 блоков)
                if (tags.contains('skill_archer_skill_2_2_3')) {
                    let dist = Math.hypot(attacker.x - victim.x, attacker.z - victim.z)
                    if (dist > 15.0) {
                        event.damage *= 1.30
                        attacker.server.runCommandSilent(`playsound minecraft:entity.arrow.hit_player player ${attacker.username} ~ ~ ~ 0.8 1.3`)
                        attacker.sendSystemMessage(Text.of('§6🎯 Снайперский выстрел с дальней дистанции! (+30% урона)'), true)
                    }
                }
                // Убийственный выстрел
                if (tags.contains('skill_archer_skill_3')) {
                    victim.potionEffects.add('minecraft:slowness', 60, 3, false, true)
                }
                // Абсолютное стрелковое мастерство
                if (tags.contains('skill_archer_final')) {
                    event.damage *= 1.25
                    if (Math.random() < 0.35) {
                        attacker.give('minecraft:arrow')
                    }
                }
            }

            // --- 8. РАЗВЕДЧИК И АССАСИН (Scout / Rogue / Assassin: Backstab Detection) ---
            let pLook = attacker.getLookAngle()
            let vLook = victim.getLookAngle()
            let pLen = Math.max(0.001, Math.sqrt(pLook.x * pLook.x + pLook.z * pLook.z))
            let vLen = Math.max(0.001, Math.sqrt(vLook.x * vLook.x + vLook.z * vLook.z))
            let dot = (pLook.x * vLook.x + pLook.z * vLook.z) / (pLen * vLen)

            let dx = attacker.x - victim.x
            let dz = attacker.z - victim.z
            let dLen = Math.max(0.001, Math.sqrt(dx * dx + dz * dz))
            let posDot = (dx * vLook.x + dz * vLook.z) / (dLen * vLen)

            let isDagger = mainId.includes('dagger') || mainId.includes('knife') || mainId.includes('rapier') || mainId.includes('stiletto') || mainId.includes('sickle')
            let isBehind = dot > 0.65 && posDot < 0.25 // Both facing same way (within ~90°) AND attacker is behind victim
            let isSneak = attacker.isCrouching() || (typeof attacker.isShiftKeyDown === 'function' && attacker.isShiftKeyDown())

            if (isBehind || (isSneak && isDagger)) {
                // Base 2.5x multiplier, scaling up to 3.5x based on assassin/scout perks
                let critMult = 2.5
                if (tags.contains('skill_assassin_subclass')) critMult += 0.3
                if (tags.contains('skill_assassin_skill_2_1_8_1')) critMult += 0.3
                if (tags.contains('skill_assassin_final')) critMult += 0.4

                event.damage *= critMult

                attacker.server.runCommandSilent(`playsound minecraft:entity.player.attack.crit player ${attacker.username} ~ ~ ~ 1.5 1.5`)
                attacker.server.runCommandSilent(`playsound minecraft:entity.arrow.hit_player player ${attacker.username} ~ ~ ~ 1.0 1.6`)
                attacker.server.runCommandSilent(`particle minecraft:smoke ${victim.x} ${victim.y + 1} ${victim.z} 0.5 0.5 0.5 0.05 20 normal`)
                attacker.server.runCommandSilent(`particle minecraft:large_smoke ${victim.x} ${victim.y + 1} ${victim.z} 0.3 0.3 0.3 0.02 8 normal`)
                attacker.server.runCommandSilent(`particle minecraft:crit ${victim.x} ${victim.y + 1} ${victim.z} 0.8 0.8 0.8 0.2 25 normal`)
                attacker.sendSystemMessage(Text.of(`§8🗡 БЭКСТЭБ СО СПИНЫ! §c[×${critMult.toFixed(1)} Крит] §7(${Math.round(event.damage)} урона)`), true)
            }

            // Смертельный яд
            if (tags.contains('skill_assassin_skill_2_1_8_1') && Math.random() < 0.30) {
                victim.potionEffects.add('minecraft:poison', 100, 1, false, true)
                victim.potionEffects.add('minecraft:weakness', 80, 1, false, true)
            }
            // Отравляющие шаги (на спринте)
            if (tags.contains('skill_assassin_skill_3') && attacker.isSprinting()) {
                attacker.potionEffects.add('minecraft:speed', 60, 1, false, false)
            }
            // Абсолютная тень
            if (tags.contains('skill_assassin_final')) {
                if (attacker.hasEffect && attacker.hasEffect('minecraft:invisibility')) {
                    event.damage *= 1.60
                    attacker.server.runCommandSilent(`playsound minecraft:entity.wither.shoot player ${attacker.username} ~ ~ ~ 0.7 1.2`)
                    attacker.sendSystemMessage(Text.of('§5☠ Казнь из невидимости! (+60% урона)'), true)
                }
            }

            // --- 9. НАЁМНИК (Mercenary / Scout) ---
            if (tags.contains('skill_adventurer_subclass')) {
                if (Math.random() < 0.20 && attacker.health < attacker.maxHealth) {
                    attacker.heal(1.5)
                }
            }

            // --- 10. МАГИЯ ОГНЯ (Fire Wizard) ---
            if (tags.contains('skill_wizard_fire_ignite')) {
                victim.setSecondsOnFire(5)
                if (victim.isOnFire()) {
                    event.damage *= 1.20
                    attacker.server.runCommandSilent(`particle minecraft:flame ${victim.x} ${victim.y + 1} ${victim.z} 0.3 0.3 0.3 0.05 10`)
                }
            }
            if (tags.contains('skill_wizard_fire_combustion') && victim.isOnFire()) {
                event.damage *= 1.25
                attacker.server.runCommandSilent(`playsound minecraft:item.firecharge.use player ${attacker.username} ~ ~ ~ 0.8 1.2`)
            }

            // --- 11. МАГИЯ КРОВИ (Blood Wizard) ---
            if (tags.contains('skill_wizard_blood_vampirism')) {
                if (attacker.health < attacker.maxHealth) {
                    attacker.heal(Math.max(1.0, event.damage * 0.12))
                    attacker.server.runCommandSilent(`particle minecraft:damage_indicator ${attacker.x} ${attacker.y + 1} ${attacker.z} 0.2 0.2 0.2 0.05 3`)
                }
            }
            if (tags.contains('skill_wizard_blood_harvest') && victim.health < victim.maxHealth * 0.50) {
                attacker.potionEffects.add('minecraft:strength', 80, 1, false, true)
                attacker.potionEffects.add('minecraft:speed', 80, 0, false, false)
                attacker.heal(2.0)
                attacker.sendSystemMessage(Text.of('§4🩸 Кровавая жатва активна! (+Сила II)'), true)
            }

            // --- 12. СВЯТАЯ МАГИЯ (Holy Wizard) ---
            if (tags.contains('skill_wizard_holy_smite') && victim.isUndead()) {
                event.damage *= 1.40
                victim.potionEffects.add('minecraft:glowing', 100, 0, false, false)
                attacker.potionEffects.add('minecraft:regeneration', 60, 0, false, false)
                attacker.server.runCommandSilent(`playsound minecraft:block.amethyst_block.chime player ${attacker.username} ~ ~ ~ 0.9 1.4`)
                attacker.server.runCommandSilent(`particle minecraft:electric_spark ${victim.x} ${victim.y + 1} ${victim.z} 0.4 0.4 0.4 0.05 15`)
            }

            // --- 13. МАГИЯ ПРИРОДЫ (Nature Wizard) ---
            if (tags.contains('skill_wizard_nature_entangle')) {
                victim.potionEffects.add('minecraft:slowness', 80, 1, false, true)
                victim.potionEffects.add('minecraft:poison', 60, 0, false, true)
            }

            // --- 14. МАГИЯ ЛЬДА (Ice Wizard) ---
            if (tags.contains('skill_wizard_ice_frostbite')) {
                victim.potionEffects.add('minecraft:slowness', 80, 2, false, true)
            }
            if (tags.contains('skill_wizard_ice_absolute_zero')) {
                if (victim.hasEffect && victim.hasEffect('minecraft:slowness')) {
                    event.damage *= 1.50
                    attacker.server.runCommandSilent(`playsound minecraft:block.glass.break player ${attacker.username} ~ ~ ~ 1.0 1.2`)
                    attacker.server.runCommandSilent(`particle minecraft:snowflake ${victim.x} ${victim.y + 1} ${victim.z} 0.5 0.5 0.5 0.1 20`)
                    attacker.sendSystemMessage(Text.of('§b❄ Раскалывание льда! (+50% урона)'), true)
                }
            }

            // --- 15. МАГИЯ МОЛНИИ (Lightning Wizard) ---
            if (tags.contains('skill_wizard_lightning_static')) {
                if (Math.random() < 0.35) {
                    attacker.server.runCommandSilent(`playsound minecraft:entity.lightning_bolt.thunder player ${attacker.username} ~ ~ ~ 0.8 1.2`)
                    attacker.server.runCommandSilent(`particle minecraft:electric_spark ${victim.x} ${victim.y + 1} ${victim.z} 0.5 0.5 0.5 0.2 25`)
                    event.damage *= 1.20
                }
            }
            if (tags.contains('skill_wizard_lightning_wrath')) {
                if (Math.random() < 0.20) {
                    attacker.server.runCommandSilent(`execute at ${attacker.username} run playsound minecraft:entity.lightning_bolt.impact player ${attacker.username} ~ ~ ~ 0.8 1.0`)
                    attacker.server.runCommandSilent(`particle minecraft:flash ${victim.x} ${victim.y + 1} ${victim.z} 0 0 0 0 1`)
                    event.damage *= 1.35
                    attacker.sendSystemMessage(Text.of('§e⚡ Гнев шторма поразил цель!'), true)
                }
            }

            // --- 16. МАГИЯ БЕЗДНЫ (Eldritch Wizard) ---
            if (tags.contains('skill_wizard_eldritch_insanity')) {
                victim.potionEffects.add('minecraft:darkness', 80, 0, false, true)
                victim.potionEffects.add('minecraft:weakness', 80, 1, false, true)
            }

            // --- 17. МАГИЯ КРАЯ (Ender Wizard) ---
            if (tags.contains('skill_wizard_ender_shift')) {
                let dist = Math.hypot(attacker.x - victim.x, attacker.z - victim.z)
                if (dist > 8.0) {
                    event.damage *= 1.25
                    attacker.server.runCommandSilent(`particle minecraft:portal ${victim.x} ${victim.y + 1} ${victim.z} 0.3 0.3 0.3 0.1 10`)
                }
            }

            // ==================================================================
            // ELEMENTAL COMBOS (SUPERCONDUCTIVITY & THERMAL SHOCK)
            // ==================================================================
            let isVictimFrozen = false
            try {
                if ((typeof victim.ticksFrozen === 'number' && victim.ticksFrozen > 0) ||
                    (victim.hasEffect && (victim.hasEffect('minecraft:slowness') || victim.hasEffect('irons_spellbooks:chilled') || victim.hasEffect('irons_spellbooks:frozen'))) ||
                    (victim.persistentData && victim.persistentData.getBoolean('elyrium_frozen'))) {
                    isVictimFrozen = true
                }
            } catch (e) {}

            let isVictimBurning = victim.isOnFire() || (typeof victim.remainingFireTicks === 'number' && victim.remainingFireTicks > 0)

            let isLightningAttack = String(source.type).toLowerCase().includes('lightning') ||
                                    String(source.type).toLowerCase().includes('shock') ||
                                    tags.contains('skill_wizard_lightning_static') ||
                                    tags.contains('skill_wizard_lightning_wrath') ||
                                    mainId.includes('lightning') ||
                                    (source.direct && String(source.direct.type).toLowerCase().includes('lightning'))

            let isIceAttack = String(source.type).toLowerCase().includes('freeze') ||
                              String(source.type).toLowerCase().includes('ice') ||
                              String(source.type).toLowerCase().includes('frost') ||
                              tags.contains('skill_wizard_ice_frostbite') ||
                              tags.contains('skill_wizard_ice_absolute_zero') ||
                              mainId.includes('ice') || mainId.includes('frost')

            let isFireAttack = isVictimBurning ||
                               String(source.type).toLowerCase().includes('fire') ||
                               tags.contains('skill_wizard_fire_ignite') ||
                               tags.contains('skill_wizard_fire_combustion') ||
                               mainId.includes('fire') || mainId.includes('flame')

            // COMBO 1: SUPERCONDUCTIVITY (Freeze + Lightning)
            // 150% AoE lightning explosion in 5 block radius
            if (isVictimFrozen && isLightningAttack) {
                event.damage *= 1.5

                let level = attacker.level
                let nearby = level.getEntitiesWithin(AABB.of(victim.x - 5.0, victim.y - 2.0, victim.z - 5.0, victim.x + 5.0, victim.y + 3.0, victim.z + 5.0))
                let aoeDmg = event.damage * 1.5
                let hits = 0

                for (let ent of nearby) {
                    if (ent && ent.isAlive() && ent !== attacker && ent !== victim && ent.isLiving() && !ent.isPlayer()) {
                        try {
                            ent.attack(source, aoeDmg)
                            ent.potionEffects.add('minecraft:slowness', 60, 2, false, true)
                            hits++
                        } catch (e) {}
                    }
                }

                try {
                    victim.setTicksFrozen(0)
                    victim.persistentData.remove('elyrium_frozen')
                } catch (e) {}

                attacker.server.runCommandSilent(`playsound minecraft:entity.lightning_bolt.thunder player ${attacker.username} ~ ~ ~ 1.2 1.4`)
                attacker.server.runCommandSilent(`playsound minecraft:block.glass.break player ${attacker.username} ~ ~ ~ 1.0 1.2`)
                attacker.server.runCommandSilent(`particle minecraft:electric_spark ${victim.x} ${victim.y + 1} ${victim.z} 1.2 0.8 1.2 0.2 35 normal`)
                attacker.server.runCommandSilent(`particle minecraft:flash ${victim.x} ${victim.y + 1} ${victim.z} 0.1 0.1 0.1 0 1 normal`)
                attacker.server.runCommandSilent(`particle minecraft:snowflake ${victim.x} ${victim.y + 1} ${victim.z} 1.0 0.5 1.0 0.1 20 normal`)
                attacker.sendSystemMessage(Text.of(`§b⚡ СВЕРХПРОВОДИМОСТЬ! §eВзрыв дуговой молнии в радиусе 5б (+150% AoE Урона) | Задето: §a${hits}`), true)
            }

            // COMBO 2: THERMAL SHOCK (Burn + Freeze)
            // 100% armor shred and burst damage
            if ((isVictimBurning && isIceAttack) || (isVictimFrozen && isFireAttack)) {
                event.damage *= 2.0

                // 100% Armor shred debuff
                victim.potionEffects.add('minecraft:weakness', 100, 2, false, true)
                victim.potionEffects.add('minecraft:slowness', 60, 2, false, true)

                // Quench fire / thaw ice
                try {
                    victim.clearFire()
                    victim.setTicksFrozen(0)
                    victim.persistentData.remove('elyrium_frozen')
                } catch (e) {}

                attacker.server.runCommandSilent(`playsound minecraft:block.fire.extinguish player ${attacker.username} ~ ~ ~ 1.2 0.6`)
                attacker.server.runCommandSilent(`playsound minecraft:entity.generic.explode player ${attacker.username} ~ ~ ~ 1.0 1.3`)
                attacker.server.runCommandSilent(`particle minecraft:cloud ${victim.x} ${victim.y + 1} ${victim.z} 1.2 0.6 1.2 0.1 30 normal`)
                attacker.server.runCommandSilent(`particle minecraft:lava ${victim.x} ${victim.y + 1} ${victim.z} 0.8 0.4 0.8 0.1 15 normal`)
                attacker.server.runCommandSilent(`particle minecraft:snowflake ${victim.x} ${victim.y + 1} ${victim.z} 0.8 0.4 0.8 0.1 15 normal`)
                attacker.sendSystemMessage(Text.of('§6🔥❄ ТЕРМОШОК! §cРазрушение 100% брони и термальный взрыв!'), true)
            }
        }
    }

    // ==========================================================================
    // B. INCOMING DAMAGE TO PLAYER (Player takes damage / defends)
    // ==========================================================================
    if (victim && victim.isPlayer() && victim.isAlive()) {
        let pTags = victim.tags
        if (pTags) {
            let pData = victim.persistentData
            let isBlocking = victim.isBlocking()

            // 1. ТАНК: Щит несломимости (Damage Cap: максимум 35% от макс HP за один удар)
            if (pTags.contains('skill_warrior_tank_skill_2_2_3')) {
                let maxAllowed = victim.maxHealth * 0.35
                if (event.damage > maxAllowed) {
                    event.damage = maxAllowed
                    victim.server.runCommandSilent(`playsound minecraft:item.shield.block player ${victim.username} ~ ~ ~ 0.8 0.9`)
                    victim.sendSystemMessage(Text.of('§9🛡 Щит Несломимости сдержал критический урон!'), true)
                }
            }

            // 2. ТАНК: Каменный оплот / Древесный доспех (Доп. -25% урона при блокировании щитом)
            if (isBlocking && pTags.contains('skill_warrior_tank_skill_2_1_8_1')) {
                event.damage *= 0.75
                victim.potionEffects.add('minecraft:resistance', 40, 0, false, false)
            }

            // 3. ТАНК: Проклятие разрушения (Отражение 30% урона обратно атакующему)
            if (pTags.contains('skill_warrior_tank_skill_2_2_9') && attacker && attacker.isLiving() && attacker !== victim) {
                let reflectDmg = Math.max(1.0, event.damage * 0.30)
                attacker.attack(source, reflectDmg)
                victim.server.runCommandSilent(`particle minecraft:crit ${attacker.x} ${attacker.y + 1} ${attacker.z} 0.2 0.2 0.2 0.05 5`)
            }

            // 4. ТАНК: Легендарная Защита (Бастион Колосса при HP < 40%)
            if (pTags.contains('skill_warrior_tank_final') && (victim.health - event.damage) < (victim.maxHealth * 0.40)) {
                let now = victim.level.time
                let lastBulwark = pData.getLong('last_tank_bulwark_time') || 0
                if (now - lastBulwark > 1200) { // 60s cooldown
                    pData.putLong('last_tank_bulwark_time', now)
                    victim.potionEffects.add('minecraft:absorption', 200, 3, false, true) // +8 golden hearts
                    victim.potionEffects.add('minecraft:resistance', 200, 2, false, true)
                    victim.server.runCommandSilent(`playsound minecraft:item.shield.break player ${victim.username} ~ ~ ~ 1.0 0.8`)
                    victim.sendSystemMessage(Text.of('§9🛡 БАСТИОН КОЛОССА: Активирована несокрушимая защита!'), true)
                }
            }

            // 5. ПАЛЛАДИН: Божественный щит (Cheat Death: предотвращение смертельного урона)
            if (pTags.contains('skill_warrior_paladin_final') && event.damage >= victim.health) {
                let now = victim.level.time
                let lastCheatDeath = pData.getLong('last_paladin_divine_shield') || 0
                if (now - lastCheatDeath > 3600) { // 180s cooldown
                    pData.putLong('last_paladin_divine_shield', now)
                    event.damage = 0
                    event.cancel()
                    victim.health = victim.maxHealth * 0.50
                    victim.potionEffects.add('minecraft:resistance', 80, 4, false, true) // Invulnerability for 4s
                    victim.potionEffects.add('minecraft:regeneration', 120, 2, false, true)
                    victim.server.runCommandSilent(`playsound minecraft:block.bell.resonate player ${victim.username} ~ ~ ~ 1.0 1.0`)
                    victim.server.runCommandSilent(`particle minecraft:totem_of_undying ${victim.x} ${victim.y + 1} ${victim.z} 0.5 0.8 0.5 0.3 35`)
                    victim.sendSystemMessage(Text.of('§e✨ БОЖЕСТВЕННЫЙ ЩИТ: Смертельный удар отражен светом небес!'), true)
                    return
                }
            }

            // 6. ПАЛЛАДИН: Щит добродетели (Ослепление и слабость при блокировании)
            if (isBlocking && pTags.contains('skill_warrior_paladin_skill_2_2_3') && attacker && attacker.isLiving()) {
                if (Math.random() < 0.35) {
                    attacker.potionEffects.add('minecraft:blindness', 80, 0, false, true)
                    attacker.potionEffects.add('minecraft:weakness', 80, 1, false, true)
                    victim.server.runCommandSilent(`playsound minecraft:entity.illusioner.cast_spell player ${victim.username} ~ ~ ~ 0.7 1.2`)
                }
            }

            // 7. РЫЦАРЬ: Щит жизни и Барьер рыцаря при блокировании
            if (isBlocking) {
                if (pTags.contains('skill_warrior_defenders_skill_11_4')) {
                    if (victim.health < victim.maxHealth) victim.heal(2.0)
                }
                if (pTags.contains('skill_warrior_defenders_skill_11_11')) {
                    victim.potionEffects.add('minecraft:resistance', 60, 1, false, false)
                }
            }

            // 8. БЕРСЕРК: Ошибка выжившего (Last Stand при HP < 30%)
            if (pTags.contains('skill_warrior_berserk_skill_2_1_8_1') && (victim.health - event.damage) < (victim.maxHealth * 0.30)) {
                let now = victim.level.time
                let lastStand = pData.getLong('last_berserk_stand_time') || 0
                if (now - lastStand > 900) { // 45s cooldown
                    pData.putLong('last_berserk_stand_time', now)
                    victim.potionEffects.add('minecraft:strength', 160, 1, false, true)
                    victim.potionEffects.add('minecraft:resistance', 160, 1, false, true)
                    victim.potionEffects.add('minecraft:speed', 160, 1, false, true)
                    victim.server.runCommandSilent(`playsound minecraft:entity.ender_dragon.growl player ${victim.username} ~ ~ ~ 1.0 1.2`)
                    victim.server.runCommandSilent(`particle minecraft:flame ${victim.x} ${victim.y + 1} ${victim.z} 0.4 0.4 0.4 0.05 20`)
                    victim.sendSystemMessage(Text.of('§4🔥 ОШИБКА ВЫЖИВШЕГО: Кровавая ярость берсерка пробуждена!'), true)
                }
            }

            // 9. РАЗВЕДЧИК / НАЁМНИК: Уклонение (Dodge Roll 5% - 25%)
            let dodgeChance = 0.0
            if (pTags.contains('skill_adventurer_subclass')) dodgeChance += 0.05
            if (pTags.contains('skill_assassin_subclass')) dodgeChance += 0.05
            if (pTags.contains('skill_adventurer_skill_11_4')) dodgeChance += 0.05
            if (pTags.contains('skill_assassin_skill_3')) dodgeChance += 0.05
            if (pTags.contains('skill_adventurer_final')) dodgeChance += 0.05

            try {
                let attr = victim.attributes.getValue('apothic_attributes:dodge_chance')
                if (attr && attr > 0) dodgeChance = Math.max(dodgeChance, attr)
            } catch (e) {}

            dodgeChance = Math.min(0.25, Math.max(0.0, dodgeChance))

            if (dodgeChance > 0 && Math.random() < dodgeChance) {
                event.damage = 0
                event.cancel()

                // Leap backward 2 blocks with smoke puff
                let look = victim.getLookAngle()
                let hLen = Math.max(0.001, Math.sqrt(look.x * look.x + look.z * look.z))
                victim.setDeltaMovement(-look.x / hLen * 0.75, 0.22, -look.z / hLen * 0.75)
                victim.hasImpulse = true

                victim.server.runCommandSilent(`playsound minecraft:entity.player.attack.sweep player ${victim.username} ~ ~ ~ 0.9 1.6`)
                victim.server.runCommandSilent(`particle minecraft:poof ${victim.x} ${victim.y + 0.5} ${victim.z} 0.4 0.2 0.4 0.05 15 normal`)
                victim.server.runCommandSilent(`particle minecraft:smoke ${victim.x} ${victim.y + 0.5} ${victim.z} 0.3 0.2 0.3 0.02 10 normal`)
                victim.sendSystemMessage(Text.of(`§a✦ УКЛОНЕНИЕ! §f(Ловкий перекат назад [${Math.round(dodgeChance * 100)}%])`), true)
                return
            }

            // 10. НАЁМНИК: Укрепление духа
            if (pTags.contains('skill_adventurer_skill_12') && Math.random() < 0.25) {
                victim.potionEffects.add('minecraft:regeneration', 60, 1, false, false)
            }

            // 11. БЕЗДНА: Эгида Бездны (Магический щит - поглощает 25% урона)
            if (pTags.contains('skill_wizard_eldritch_mana_shield')) {
                event.damage *= 0.75
                victim.server.runCommandSilent(`particle minecraft:enchant ${victim.x} ${victim.y + 1} ${victim.z} 0.4 0.4 0.4 0.2 10`)
            }

            // 12. ЭВОКАЦИЯ: Защитный пакт призванных существ (-20% урона)
            if (pTags.contains('skill_wizard_summon_aegis')) {
                event.damage *= 0.80
            }

            // 13. СВЯТОСТЬ: Божественная кара (Нежить получает святой отпор)
            if (pTags.contains('skill_wizard_holy_retribution') && attacker && attacker.isLiving() && attacker.isUndead()) {
                attacker.attack(source, Math.max(2.0, event.damage * 0.40))
                attacker.setSecondsOnFire(4)
                victim.server.runCommandSilent(`particle minecraft:totem_of_undying ${attacker.x} ${attacker.y + 1} ${attacker.z} 0.2 0.4 0.2 0.1 10`)
            }

            // 14. ЭНДЕР: Экстренный телепорт / Разлом Бездны при критическом уроне
            if (pTags.contains('skill_wizard_ender_emergency_blink') && (victim.health - event.damage) < (victim.maxHealth * 0.30)) {
                let now = victim.level.time
                let lastBlink = pData.getLong('last_ender_emergency_blink') || 0
                if (now - lastBlink > 1200) { // 60s cooldown
                    pData.putLong('last_ender_emergency_blink', now)
                    event.damage *= 0.20 // Reduce fatal damage to 20%
                    victim.potionEffects.add('minecraft:invisibility', 80, 0, false, true)
                    victim.potionEffects.add('minecraft:speed', 80, 2, false, true)
                    victim.server.runCommandSilent(`playsound minecraft:entity.enderman.teleport player ${victim.username} ~ ~ ~ 1.0 1.0`)
                    victim.server.runCommandSilent(`particle minecraft:portal ${victim.x} ${victim.y + 1} ${victim.z} 0.6 0.8 0.6 0.3 40`)
                    victim.sendSystemMessage(Text.of('§5🌀 РАЗЛОМ БЕЗДНЫ: Экстренное перемещение в тень!'), true)
                }
            }
        }
    }
})

// ------------------------------------------------------------------------------
// 2. ON-KILL EFFECTS (Регенерация, Кровавое Ускорение, Аура Берсерка)
// ------------------------------------------------------------------------------
EntityEvents.death(event => {
    let source = event.source
    if (!source) return

    let killer = source.actual || source.player
    if (!killer || !killer.isPlayer() || !killer.isAlive()) return

    let tags = killer.tags
    if (!tags) return

    // Мечник: Смертельная регенерация
    if (tags.contains('skill_swordsman_regen_on_kill') && Math.random() < 0.20) {
        killer.potionEffects.add('minecraft:regeneration', 80, 1, false, false)
        killer.server.runCommandSilent(`playsound minecraft:entity.experience_orb.pickup player ${killer.username} ~ ~ ~ 0.7 1.3`)
        killer.sendSystemMessage(Text.of('§a💚 Смертельная Регенерация активирована!'), true)
    }

    // Берсерк: Кровавое ускорение
    if (tags.contains('skill_warrior_berserk_skill_3')) {
        killer.potionEffects.add('minecraft:speed', 120, 1, false, false)
        killer.potionEffects.add('minecraft:haste', 120, 1, false, false)
        killer.server.runCommandSilent(`playsound minecraft:entity.player.attack.sweep player ${killer.username} ~ ~ ~ 0.8 1.4`)
    }

    // Берсерк: Мастер ауры (восстановление 15% потерянного HP при убийстве)
    if (tags.contains('skill_warrior_berserk_final')) {
        let missing = killer.maxHealth - killer.health
        if (missing > 0) {
            killer.heal(missing * 0.15)
            killer.server.runCommandSilent(`particle minecraft:heart ${killer.x} ${killer.y + 1} ${killer.z} 0.2 0.2 0.2 0.02 2`)
        }
    }

    // Ассасин: Призрачная тень (растворение в невидимости при убийстве)
    if (tags.contains('skill_assassin_skill_2_1_4')) {
        killer.potionEffects.add('minecraft:invisibility', 100, 0, false, true)
        killer.potionEffects.add('minecraft:speed', 100, 1, false, false)
        killer.server.runCommandSilent(`playsound minecraft:entity.illusioner.mirror_move player ${killer.username} ~ ~ ~ 0.7 1.2`)
        killer.sendSystemMessage(Text.of('§8👤 Призрачная тень: растворение в невидимости!'), true)
    }

    // Маг Огня: Взрыв пламени при убийстве горящей цели
    if (tags.contains('skill_wizard_fire_combustion')) {
        let entity = event.entity
        if (entity && entity.isOnFire()) {
            killer.server.runCommandSilent(`particle minecraft:explosion_emitter ${entity.x} ${entity.y + 1} ${entity.z} 0 0 0 0 1`)
            killer.server.runCommandSilent(`playsound minecraft:entity.generic.explode player ${killer.username} ~ ~ ~ 0.7 1.3`)
            let level = killer.level
            let nearby = level.getEntitiesWithin(AABB.of(entity.x - 4, entity.y - 2, entity.z - 4, entity.x + 4, entity.y + 3, entity.z + 4))
            for (let mob of nearby) {
                if (mob && mob.isAlive() && mob !== killer && mob !== entity && mob.isMonster()) {
                    mob.setSecondsOnFire(5)
                }
            }
        }
    }
})

// ------------------------------------------------------------------------------
// 3. PASSIVE TICK EFFECTS (Присед, Аура Палладина, Стойкость Рыцаря)
// ------------------------------------------------------------------------------
PlayerEvents.tick(event => {
    let player = event.player
    if (!player) return

    let age = (typeof player.age === 'number') ? player.age : (typeof player.tickCount === 'number' ? player.tickCount : 0)
    // Check every 10 ticks (0.5s)
    if (age % 10 !== 0) return

    let tags = player.tags
    if (!tags) return

    // АВАНТЮРИСТ: Регенерация в приседе
    if (tags.contains('skill_adventurer_crouch_regen')) {
        let isSneaking = false
        try {
            if (player.isShiftKeyDown && player.isShiftKeyDown()) isSneaking = true
            else if (player.isCrouching && player.isCrouching()) isSneaking = true
            else if (player.shiftKeyDown) isSneaking = true
            else if (player.crouching) isSneaking = true
            else if (player.pose && String(player.pose).toUpperCase().includes('CROUCH')) isSneaking = true
        } catch (e) {
            if (player.crouching || player.shiftKeyDown) isSneaking = true
        }

        if (isSneaking && player.isAlive()) {
            player.potionEffects.add('minecraft:regeneration', 40, 0, false, true)
            if (player.health < player.maxHealth) {
                player.heal(0.5)
                player.server.runCommandSilent(`particle minecraft:heart ${player.x} ${player.y + 0.8} ${player.z} 0.2 0.2 0.2 0.02 1`)
            }
            player.sendSystemMessage(Text.of('§a💚 Регенерация в приседе активна...'), true)
        }
    }

    // РЫЦАРЬ: Героическая стойкость (Сопротивление урону, если не бежит спринтом)
    if (tags.contains('skill_warrior_defenders_final')) {
        if (!player.isSprinting() && player.isAlive()) {
            player.potionEffects.add('minecraft:resistance', 30, 0, false, false)
        }
    }

    // РЫЦАРЬ: Дух крепости (Сопротивление урону при здоровье выше 75%)
    if (tags.contains('skill_warrior_defenders_skill_12')) {
        if (player.health >= player.maxHealth * 0.75 && player.isAlive()) {
            player.potionEffects.add('minecraft:resistance', 30, 0, false, false)
        }
    }

    // ПАЛЛАДИН: Благословение стража (Аура исцеления союзников в радиусе 10 блоков)
    if (tags.contains('skill_warrior_paladin_skill_2_1_8_1') && age % 20 === 0 && player.isAlive()) {
        let level = player.level
        let allies = level.getEntitiesWithin(AABB.of(player.x - 10, player.y - 3, player.z - 10, player.x + 10, player.y + 4, player.z + 10))
        for (let ally of allies) {
            if (ally && ally.isAlive() && ally !== player && (ally.isPlayer() || String(ally.tags).includes('elyrium:guard') || ally.type === 'minecraft:iron_golem')) {
                ally.potionEffects.add('minecraft:regeneration', 40, 0, false, false)
            }
        }
    }

    // НАЁМНИК: Незримый мастер (Защита от опасного падения с высоты)
    if (tags.contains('skill_adventurer_final') && player.fallDistance > 3.0 && player.isAlive()) {
        player.potionEffects.add('minecraft:slow_falling', 40, 0, false, false)
    }

    // ДРУИД: Связь с природой (Регенерация на траве/мху или под дождем)
    if (tags.contains('skill_wizard_nature_communion') && age % 40 === 0 && player.isAlive()) {
        let blockBelow = player.block.offset(0, -1, 0)
        let isNatureBlock = blockBelow && (blockBelow.id.includes('grass') || blockBelow.id.includes('moss') || blockBelow.id.includes('leaf') || blockBelow.id.includes('leaves'))
        let isRaining = player.level.isRaining() && player.level.canSeeSky(player.blockPosition())
        if (isNatureBlock || isRaining) {
            player.potionEffects.add('minecraft:regeneration', 45, 0, false, false)
        }
    }
})

// ------------------------------------------------------------------------------
// 4. SHORTCUT COMMAND: /points
// ------------------------------------------------------------------------------
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event
    event.register(
        Commands.literal('points')
            .executes(c => {
                let player = c.source.player
                if (player) {
                    player.server.runCommandSilent(`puffish_skills points add ${player.username} elyrium:celestial_tree 200`)
                    player.tell('§a✨ Вам выдано 200 очков навыков древа созвездий!')
                }
                return 1
            })
    )
})
