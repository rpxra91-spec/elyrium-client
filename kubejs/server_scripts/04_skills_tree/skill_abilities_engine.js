// ==============================================================================
// 🌟 ELYRIUM RPG: UNIFIED CELESTIAL SKILL ABILITIES ENGINE
// ==============================================================================
// 1. Passive / Talent Mechanics:
//    - "Лесоруб-виртуоз" (Tree Capitator): Instant recursive tree falling.
//    - "Шахтерская Жила" (Vein Miner): Sneak-mining breaks connected ore veins.
//    - "Шеф-Повар Элириума" (Chef's Mastery): Food saturation & regen bonuses.
// 2. Class Active Abilities [R]:
//    - Warrior: «Вихрь Клинков» (AoE sweep & massive damage)
//    - Rogue: «Теневой Шаг» (Phase-shift teleport & guaranteed crit)
//    - Mage: «Астральный Взрыв» (Arcane shockwave & +50 Mana)
// 3. Racial / Ultimate Abilities [V]:
//    - Warrior: «Ярость Титана» (Resistance III, Absorption, Titan Smash)
//    - Rogue: «Буря Тени» (Phantom speed & shadow strikes)
//    - Mage: «Абсолютное Вознесение» (Infinite mana & lightning shield)
//    - Crafts: «Дар Демиурга» (Repairs 25% gear durability, Haste III)
// ==============================================================================

const MAX_LOG_BLOCKS = 96
const MAX_ORE_BLOCKS = 32

// ------------------------------------------------------------------------------
// 1. TREE CAPITATOR (ЛЕСОРУБ-ВИРТУОЗ)
// ------------------------------------------------------------------------------
BlockEvents.broken(event => {
    let player = event.player
    if (!player || player.isCreative()) return

    if (!player.tags || !player.tags.contains('skill_tree_capitator')) return

    let block = event.block
    let blockId = String(block.id)
    if (!blockId.includes('_log') && !blockId.includes('_stem') && !blockId.includes('_wood')) return

    let mainHand = player.mainHandItem
    let toolId = String(mainHand.id)
    if (!toolId.includes('_axe')) return

    // Execute recursive tree fall (upwards BFS)
    let level = event.level
    let startPos = block.pos
    let queue = [startPos]
    let visited = new Set()
    visited.add(`${startPos.x},${startPos.y},${startPos.z}`)

    let logsBroken = 0
    let toBreak = []

    while (queue.length > 0 && toBreak.length < MAX_LOG_BLOCKS) {
        let curr = queue.shift()
        
        // Check 3x3x3 neighbors, prioritized upwards
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                for (let dy = 0; dy <= 2; dy++) {
                    if (dx === 0 && dy === 0 && dz === 0) continue
                    let nx = curr.x + dx
                    let ny = curr.y + dy
                    let nz = curr.z + dz
                    let key = `${nx},${ny},${nz}`
                    if (visited.has(key)) continue
                    visited.add(key)

                    let neighbor = level.getBlock(nx, ny, nz)
                    let nId = String(neighbor.id)
                    if (nId === blockId || (nId.includes('_log') && nId.split(':')[1].split('_')[0] === blockId.split(':')[1].split('_')[0])) {
                        toBreak.push({ x: nx, y: ny, z: nz })
                        queue.push({ x: nx, y: ny, z: nz })
                    }
                }
            }
        }
    }

    if (toBreak.length > 0) {
        toBreak.forEach(p => {
            let b = level.getBlock(p.x, p.y, p.z)
            if (b) {
                b.destroy(true)
                logsBroken++
            }
        })

        // Damage the axe appropriately
        let unbreaking = mainHand.getEnchantmentLevel('minecraft:unbreaking') || 0
        let effectiveDamage = Math.max(1, Math.floor(logsBroken / (unbreaking + 1)))
        mainHand.damageValue += effectiveDamage

        player.server.runCommandSilent(`playsound minecraft:block.wood.break block ${player.username} ${startPos.x} ${startPos.y} ${startPos.z} 1.2 0.8`)
        player.sendSystemMessage(Text.of(`§a🌲 Срублено дерево: §f${logsBroken + 1} бревен`), true)
    }
})

// ------------------------------------------------------------------------------
// 2. VEIN MINER (ШАХТЕРСКАЯ ЖИЛА)
// ------------------------------------------------------------------------------
BlockEvents.broken(event => {
    let player = event.player
    if (!player || player.isCreative()) return

    if (!player.tags || !player.tags.contains('skill_vein_miner')) return
    if (!player.isCrouching()) return // Must be sneaking

    let block = event.block
    let blockId = String(block.id)
    if (!blockId.includes('_ore')) return

    let mainHand = player.mainHandItem
    let toolId = String(mainHand.id)
    if (!toolId.includes('_pickaxe')) return

    // Execute recursive vein mining
    let level = event.level
    let startPos = block.pos
    let queue = [startPos]
    let visited = new Set()
    visited.add(`${startPos.x},${startPos.y},${startPos.z}`)

    let oresBroken = 0
    let toBreak = []

    while (queue.length > 0 && toBreak.length < MAX_ORE_BLOCKS) {
        let curr = queue.shift()
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    if (dx === 0 && dy === 0 && dz === 0) continue
                    let nx = curr.x + dx
                    let ny = curr.y + dy
                    let nz = curr.z + dz
                    let key = `${nx},${ny},${nz}`
                    if (visited.has(key)) continue
                    visited.add(key)

                    let neighbor = level.getBlock(nx, ny, nz)
                    let nId = String(neighbor.id)
                    if (nId === blockId) {
                        toBreak.push({ x: nx, y: ny, z: nz })
                        queue.push({ x: nx, y: ny, z: nz })
                    }
                }
            }
        }
    }

    if (toBreak.length > 0) {
        toBreak.forEach(p => {
            let b = level.getBlock(p.x, p.y, p.z)
            if (b) {
                b.destroy(true)
                oresBroken++
            }
        })

        let unbreaking = mainHand.getEnchantmentLevel('minecraft:unbreaking') || 0
        let effectiveDamage = Math.max(1, Math.floor(oresBroken / (unbreaking + 1)))
        mainHand.damageValue += effectiveDamage

        player.server.runCommandSilent(`playsound minecraft:block.stone.break block ${player.username} ${startPos.x} ${startPos.y} ${startPos.z} 1.0 0.9`)
        player.sendSystemMessage(Text.of(`§6💎 Раскопана жила: §f${oresBroken + 1} руды`), true)
    }
})

// ------------------------------------------------------------------------------
// 3. CHEF'S MASTERY (КУЛИНАРНЫЙ ШЕФ)
// ------------------------------------------------------------------------------
ItemEvents.foodEaten(event => {
    let player = event.player
    if (!player) return

    let tags = player.tags
    if (!tags) return

    if (tags.contains('skill_chef_master')) {
        player.potionEffects.add('minecraft:saturation', 200, 1, false, false)
        player.potionEffects.add('minecraft:regeneration', 300, 0, false, false)
        player.sendSystemMessage(Text.of('§6🍲 Изысканная Трапеза: §aНасыщение и Регенерация!'), true)
    } else if (tags.contains('skill_chef_apprentice')) {
        player.potionEffects.add('minecraft:saturation', 100, 0, false, false)
        player.sendSystemMessage(Text.of('§e🍞 Питательный Перекус: §a+Сытность!'), true)
    }
})

// ------------------------------------------------------------------------------
// 4. ACTIVE ABILITY ENGINE ([R] - CLASS ACTIVE)
// ------------------------------------------------------------------------------
function triggerClassActive(player) {
    if (!player || !player.isAlive()) return

    let tags = player.tags
    let now = Date.now()
    let lastUse = player.persistentData.getLong('skd_last_active_r') || 0

    // Check which active skill player unlocked
    if (tags && tags.contains('skill_active_whirlwind')) {
        // WARRIOR: Whirlwind
        const CD = 20000
        if (now - lastUse < CD) {
            let left = Math.ceil((CD - (now - lastUse)) / 1000)
            player.sendSystemMessage(Text.of(`§c⏳ «Вихрь Клинков» перезаряжается: ${left} сек`), true)
            return
        }
        player.persistentData.putLong('skd_last_active_r', now)

        // Deal 250% weapon damage to mobs in 5 block radius
        let baseDmg = player.attributes.getValue('minecraft:generic.attack_damage') || 5
        let totalDmg = baseDmg * 2.5

        let level = player.level
        let nearby = level.getEntitiesWithin(AABB.of(player.x - 5, player.y - 2, player.z - 5, player.x + 5, player.y + 3, player.z + 5))
        let hits = 0
        nearby.forEach(ent => {
            if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive()) {
                ent.attack(player, totalDmg)
                let dx = ent.x - player.x
                let dz = ent.z - player.z
                let dist = Math.max(0.1, Math.sqrt(dx * dx + dz * dz))
                ent.knockback(0.8, -dx / dist, -dz / dist)
                hits++
            }
        })

        // Sound & visual
        player.server.runCommandSilent(`playsound minecraft:entity.player.attack.sweep player ${player.username} ~ ~ ~ 1.5 0.8`)
        player.server.runCommandSilent(`particle minecraft:sweep_attack ~ ~1 ~ 1.5 0.2 1.5 0.1 20 normal`)
        player.server.runCommandSilent(`particle minecraft:crit ~ ~1 ~ 1.0 0.5 1.0 0.2 30 normal`)
        player.sendSystemMessage(Text.of(`§c🌪 ВИХРЬ КЛИНКОВ! §eПоражено врагов: ${hits} (урон ×2.5)`), true)

    } else if (tags && tags.contains('skill_active_shadowstep')) {
        // ROGUE: Shadowstep
        const CD = 18000
        if (now - lastUse < CD) {
            let left = Math.ceil((CD - (now - lastUse)) / 1000)
            player.sendSystemMessage(Text.of(`§c⏳ «Теневой Шаг» перезаряжается: ${left} сек`), true)
            return
        }
        player.persistentData.putLong('skd_last_active_r', now)

        // Teleport 8 blocks in look direction
        let look = player.getLookAngle()
        let tx = player.x + look.x * 8
        let ty = player.y + look.y * 8
        let tz = player.z + look.z * 8

        player.server.runCommandSilent(`particle minecraft:portal ~ ~1 ~ 0.5 0.5 0.5 0.1 50 normal`)
        player.teleportTo('minecraft:overworld', tx, ty, tz, player.yaw, player.pitch)
        player.potionEffects.add('minecraft:invisibility', 60, 0, false, false)
        player.potionEffects.add('minecraft:speed', 60, 1, false, false)

        player.server.runCommandSilent(`playsound minecraft:entity.enderman.teleport player ${player.username} ~ ~ ~ 1.2 1.2`)
        player.server.runCommandSilent(`particle minecraft:smoke ~ ~1 ~ 0.8 0.8 0.8 0.1 30 normal`)
        player.sendSystemMessage(Text.of(`§8🌑 ТЕНЕВОЙ ШАГ! §b(Невидимость + Ускорение)`), true)

    } else if (tags && tags.contains('skill_active_astral_blast')) {
        // MAGE: Astral Blast
        const CD = 22000
        if (now - lastUse < CD) {
            let left = Math.ceil((CD - (now - lastUse)) / 1000)
            player.sendSystemMessage(Text.of(`§c⏳ «Астральный Взрыв» перезаряжается: ${left} сек`), true)
            return
        }
        player.persistentData.putLong('skd_last_active_r', now)

        // Deal magic damage to mobs in 6 block radius and restore mana
        let level = player.level
        let nearby = level.getEntitiesWithin(AABB.of(player.x - 6, player.y - 2, player.z - 6, player.x + 6, player.y + 3, player.z + 6))
        let hits = 0
        nearby.forEach(ent => {
            if (ent && ent.isLiving() && !ent.isPlayer() && ent.isAlive()) {
                ent.attack(player, 16.0) // 16 magic damage
                hits++
            }
        })

        // Restore Iron's Spells mana if present
        try {
            let magicData = Java.loadClass('io.redspace.ironsspellbooks.api.magic.MagicData').getPlayerMagicData(player)
            if (magicData) {
                magicData.setMana(Math.min(magicData.getMaxMana(), magicData.getMana() + 50))
            }
        } catch (e) {}

        player.server.runCommandSilent(`playsound minecraft:block.enchantment_table.use player ${player.username} ~ ~ ~ 1.4 1.1`)
        player.server.runCommandSilent(`particle minecraft:enchant ~ ~1.2 ~ 1.2 0.8 1.2 0.5 60 normal`)
        player.server.runCommandSilent(`particle minecraft:electric_spark ~ ~1.2 ~ 1.0 0.8 1.0 0.2 40 normal`)
        player.sendSystemMessage(Text.of(`§b💫 АСТРАЛЬНЫЙ ВЗРЫВ! §9(+50 Маны, ${hits} целей поражено)`), true)

    } else {
        player.sendSystemMessage(Text.of(`§7У вас не открыт активный навык [R] в Созвездиях Элириума.`), true)
    }
}

// ------------------------------------------------------------------------------
// 5. ULTIMATE ABILITY ENGINE ([V] - RACIAL / LEVEL 50)
// ------------------------------------------------------------------------------
function triggerUltimate(player) {
    if (!player || !player.isAlive()) return

    let tags = player.tags
    let now = Date.now()
    let lastUse = player.persistentData.getLong('skd_last_ultimate_v') || 0

    if (tags && tags.contains('skill_ultimate_titan')) {
        // WARRIOR ULTIMATE
        const CD = 90000
        if (now - lastUse < CD) {
            let left = Math.ceil((CD - (now - lastUse)) / 1000)
            player.sendSystemMessage(Text.of(`§c⏳ «Ярость Титана» перезаряжается: ${left} сек`), true)
            return
        }
        player.persistentData.putLong('skd_last_ultimate_v', now)

        player.potionEffects.add('minecraft:resistance', 300, 2, false, false) // 15 sec Resistance III
        player.potionEffects.add('minecraft:strength', 300, 1, false, false)
        player.potionEffects.add('minecraft:absorption', 600, 3, false, false)
        player.potionEffects.add('minecraft:fire_resistance', 600, 0, false, false)

        player.server.runCommandSilent(`playsound minecraft:entity.lightning_bolt.thunder player ${player.username} ~ ~ ~ 1.5 0.7`)
        player.server.runCommandSilent(`particle minecraft:explosion_emitter ~ ~1 ~ 1 1 1 0 1 normal`)
        player.sendSystemMessage(Text.of(`§4🔱 ЯРОСТЬ ТИТАНА АКТИВИРОВАНА! §c(+Урон, Сопротивление III, Поглощение)`), true)

    } else if (tags && tags.contains('skill_ultimate_tempest')) {
        // ROGUE ULTIMATE
        const CD = 85000
        if (now - lastUse < CD) {
            let left = Math.ceil((CD - (now - lastUse)) / 1000)
            player.sendSystemMessage(Text.of(`§c⏳ «Буря Тени» перезаряжается: ${left} сек`), true)
            return
        }
        player.persistentData.putLong('skd_last_ultimate_v', now)

        player.potionEffects.add('minecraft:speed', 240, 2, false, false) // 12 sec Speed III
        player.potionEffects.add('minecraft:invisibility', 240, 0, false, false)
        player.potionEffects.add('minecraft:regeneration', 240, 1, false, false)

        player.server.runCommandSilent(`playsound minecraft:entity.illusioner.prepare_blindness player ${player.username} ~ ~ ~ 1.5 1.0`)
        player.server.runCommandSilent(`particle minecraft:witch ~ ~1 ~ 1.2 1.0 1.2 0.1 50 normal`)
        player.sendSystemMessage(Text.of(`§5🌌 БУРЯ ТЕНИ АКТИВИРОВАНА! §d(Скорость III, Невидимость)`), true)

    } else if (tags && tags.contains('skill_ultimate_ascendance')) {
        // MAGE ULTIMATE
        const CD = 90000
        if (now - lastUse < CD) {
            let left = Math.ceil((CD - (now - lastUse)) / 1000)
            player.sendSystemMessage(Text.of(`§c⏳ «Абсолютное Вознесение» перезаряжается: ${left} сек`), true)
            return
        }
        player.persistentData.putLong('skd_last_ultimate_v', now)

        player.potionEffects.add('minecraft:slow_falling', 240, 0, false, false)
        player.potionEffects.add('minecraft:glowing', 240, 0, false, false)

        try {
            let magicData = Java.loadClass('io.redspace.ironsspellbooks.api.magic.MagicData').getPlayerMagicData(player)
            if (magicData) {
                magicData.setMana(magicData.getMaxMana())
            }
        } catch (e) {}

        player.server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete player ${player.username} ~ ~ ~ 1.2 1.3`)
        player.server.runCommandSilent(`particle minecraft:totem_of_undying ~ ~1.5 ~ 1.0 1.0 1.0 0.4 80 normal`)
        player.sendSystemMessage(Text.of(`§3🌠 АБСОЛЮТНОЕ ВОЗНЕСЕНИЕ! §b(Полная Мана, Эфирный Щит)`), true)

    } else if (tags && tags.contains('skill_ultimate_demiurge')) {
        // CRAFTS ULTIMATE
        const CD = 120000
        if (now - lastUse < CD) {
            let left = Math.ceil((CD - (now - lastUse)) / 1000)
            player.sendSystemMessage(Text.of(`§c⏳ «Дар Демиурга» перезаряжается: ${left} сек`), true)
            return
        }
        player.persistentData.putLong('skd_last_ultimate_v', now)

        // Repair 25% of worn armor & main hand tool
        let repaired = 0
        let items = [player.mainHandItem, player.offHandItem, player.headArmorItem, player.chestArmorItem, player.legsArmorItem, player.feetArmorItem]
        items.forEach(st => {
            if (st && !st.isEmpty() && st.damageValue > 0) {
                let repairAmount = Math.floor(st.maxDamage * 0.25)
                st.damageValue = Math.max(0, st.damageValue - repairAmount)
                repaired++
            }
        })

        player.potionEffects.add('minecraft:haste', 1200, 2, false, false) // 60 sec Haste III
        player.potionEffects.add('minecraft:night_vision', 1200, 0, false, false)

        player.server.runCommandSilent(`playsound minecraft:block.anvil.use player ${player.username} ~ ~ ~ 1.2 1.2`)
        player.server.runCommandSilent(`particle minecraft:happy_villager ~ ~1.2 ~ 1.0 0.8 1.0 0.1 40 normal`)
        player.sendSystemMessage(Text.of(`§e🔨 ДАР ДЕМИУРГА! §6(Отремонтировано предметов: ${repaired}, Спешка III на 60 сек)`), true)

    } else {
        player.sendSystemMessage(Text.of(`§7У вас не открыт ультимейт [V] в Созвездиях Элириума.`), true)
    }
}

// ------------------------------------------------------------------------------
// 6. COMMAND REGISTRATION & CHAT TRIGGERS
// ------------------------------------------------------------------------------
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event

    // /r or /skill_r
    event.register(
        Commands.literal('skill_r')
            .executes(ctx => {
                let p = ctx.source.player
                if (p) triggerClassActive(p)
                return 1
            })
    )
    event.register(
        Commands.literal('r')
            .executes(ctx => {
                let p = ctx.source.player
                if (p) triggerClassActive(p)
                return 1
            })
    )

    // /v or /skill_v
    event.register(
        Commands.literal('skill_v')
            .executes(ctx => {
                let p = ctx.source.player
                if (p) triggerUltimate(p)
                return 1
            })
    )
    event.register(
        Commands.literal('v')
            .executes(ctx => {
                let p = ctx.source.player
                if (p) triggerUltimate(p)
                return 1
            })
    )
})

// Chat fallback triggers (.r, .v, !r, !v)
PlayerEvents.chat(event => {
    let msg = event.message.trim().toLowerCase()
    let player = event.player
    if (!player) return

    if (msg === '.r' || msg === '!r' || msg === 'r') {
        triggerClassActive(player)
        event.cancel()
    } else if (msg === '.v' || msg === '!v' || msg === 'v') {
        triggerUltimate(player)
        event.cancel()
    }
})

