// ==============================================================================
// 🧪 ELYRIUM RPG: POTION QUICK-DRINK & ALCHEMIST BELT SYSTEM
// ==============================================================================
// Hotkeys / Commands: .drink_hp and .drink_mana (or /drink_hp and /drink_mana)
// - Scans player Curios belt slots first (Alchemist Belt), then main inventory
// - Consumes healing or mana potions, applying effects immediately
// - Plays drink sound and particle effects
// - Auto-recycles empty glass bottles into inventory without clutter
// - Enforces 8-second cooldown with actionbar feedback
// ==============================================================================

const POTION_COOLDOWN_TICKS = 160 // 8 seconds (20 ticks/sec)

function getCuriosHelper() {
    try {
        return Java.loadClass('top.theillusivec4.curios.api.CuriosApi')
    } catch (e) {
        return null
    }
}

// Check if item is an empty bottle
function isGlassBottle(item) {
    if (!item || item.isEmpty()) return false
    let id = String(item.id)
    return id === 'minecraft:glass_bottle' || id.endsWith(':glass_bottle')
}

// Attempt to add glass bottle to inventory, merging with existing bottle stacks
function recycleGlassBottle(player) {
    let inv = player.inventory
    if (!inv) {
        player.give(Item.of('minecraft:glass_bottle', 1))
        return
    }

    // Try finding existing stack of glass bottles that isn't full
    let slots = inv.getSlots()
    let placed = false
    for (let i = 0; i < slots; i++) {
        let stack = inv.getStackInSlot(i)
        if (stack && !stack.isEmpty() && isGlassBottle(stack) && stack.count < stack.maxStackSize) {
            stack.grow(1)
            placed = true
            break
        }
    }

    if (!placed) {
        player.give(Item.of('minecraft:glass_bottle', 1))
    }
}

// Find item in Curios belt
function findPotionInCuriosBelt(player, type) {
    let CuriosApi = getCuriosHelper()
    if (!CuriosApi) return null

    try {
        let opt = CuriosApi.getCuriosInventory(player)
        if (!opt || !opt.isPresent()) return null

        let handler = opt.get()
        let beltHandlerOpt = handler.getStacksHandler('belt')
        if (!beltHandlerOpt || !beltHandlerOpt.isPresent()) return null

        let stacks = beltHandlerOpt.get().getStacks()
        for (let i = 0; i < stacks.getSlots(); i++) {
            let stack = stacks.getStackInSlot(i)
            if (stack && !stack.isEmpty() && isTargetPotion(stack, type)) {
                return {
                    source: 'curios',
                    slot: i,
                    stackHandler: stacks,
                    itemStack: stack
                }
            }
        }
    } catch (e) {}

    return null
}

// Find potion in player inventory
function findPotionInInventory(player, type) {
    let inv = player.inventory
    if (!inv) return null

    let slots = inv.getSlots()
    for (let i = 0; i < slots; i++) {
        let stack = inv.getStackInSlot(i)
        if (stack && !stack.isEmpty() && isTargetPotion(stack, type)) {
            return {
                source: 'inventory',
                slot: i,
                inv: inv,
                itemStack: stack
            }
        }
    }
    return null
}

function isTargetPotion(itemStack, type) {
    let id = String(itemStack.id).toLowerCase()

    if (type === 'hp') {
        if (id === 'minecraft:potion' || id === 'minecraft:splash_potion') {
            // Check NBT / potion contents for healing / regeneration
            let nbt = itemStack.nbt
            if (nbt) {
                let nbtStr = nbt.toString().toLowerCase()
                if (nbtStr.includes('healing') || nbtStr.includes('regeneration')) {
                    return true
                }
            }
        }
        // Modded healing potions
        if (id.includes('greater_healing_potion') || id.includes('healing_potion') || id.includes('health_potion') || id.includes('healing_elixir')) {
            return true
        }
    } else if (type === 'mana') {
        // Modded mana potions / elixirs
        if (id.includes('mana') || id.includes('elixir') || id.includes('instant_mana')) {
            return true
        }
        let nbt = itemStack.nbt
        if (nbt && nbt.toString().toLowerCase().includes('mana')) {
            return true
        }
    }

    return false
}

function applyPotionEffects(player, itemStack, type) {
    let id = String(itemStack.id).toLowerCase()

    if (type === 'hp') {
        let isStrong = id.includes('greater') || id.includes('strong') || (itemStack.nbt && itemStack.nbt.toString().includes('strong'))
        if (isStrong) {
            player.potionEffects.add('minecraft:instant_health', 1, 1, false, true)
            player.potionEffects.add('minecraft:regeneration', 120, 1, false, true)
        } else {
            player.potionEffects.add('minecraft:instant_health', 1, 0, false, true)
            player.potionEffects.add('minecraft:regeneration', 80, 0, false, true)
        }
    } else if (type === 'mana') {
        // Apply Iron's Spells Instant Mana effect if present, otherwise restore magic power
        player.potionEffects.add('irons_spellbooks:instant_mana', 1, 1, false, true)
        // Bonus magic buff: Absorption & Haste
        player.potionEffects.add('minecraft:absorption', 200, 0, false, true)
    }
}

function executeQuickDrink(player, type) {
    if (!player || !player.isAlive()) return

    let now = player.level.gameTime
    let cdKey = 'skd_last_drink_' + type
    let lastDrink = player.persistentData.getLong(cdKey) || 0

    if (now - lastDrink < POTION_COOLDOWN_TICKS) {
        let remSeconds = Math.ceil((POTION_COOLDOWN_TICKS - (now - lastDrink)) / 20)
        let typeName = type === 'hp' ? 'Здоровья' : 'Маны'
        player.sendSystemMessage(Text.of(`§c⏳ Зелье ${typeName} на перезарядке! Подождите ${remSeconds} сек.`), true)
        player.playSound('minecraft:block.chest.locked', 0.8, 1.2)
        return
    }

    // 1. Scan belt first, then inventory
    let found = findPotionInCuriosBelt(player, type) || findPotionInInventory(player, type)

    if (!found) {
        let typeName = type === 'hp' ? '§cисцеления (HP)' : '§bманы (Mana)'
        player.sendSystemMessage(Text.of(`§e⚠ В поясе и инвентаре нет доступных зелий ${typeName}§e!`), true)
        player.playSound('minecraft:block.chest.locked', 0.8, 1.5)
        return
    }

    // 2. Consume item
    let stack = found.itemStack
    applyPotionEffects(player, stack, type)

    if (found.source === 'curios') {
        stack.shrink(1)
        found.stackHandler.setStackInSlot(found.slot, stack.isEmpty() ? Item.empty : stack)
    } else if (found.source === 'inventory') {
        stack.shrink(1)
        found.inv.setStackInSlot(found.slot, stack.isEmpty() ? Item.empty : stack)
    }

    // 3. Recycle glass bottle
    recycleGlassBottle(player)

    // 4. Update cooldown
    player.persistentData.putLong(cdKey, now)

    // 5. Sound & visual feedback
    player.playSound('minecraft:entity.generic.drink', 1.0, 1.0)
    try {
        let particle = type === 'hp' ? 'minecraft:heart' : 'minecraft:enchant'
        player.level.spawnParticles(particle, true, player.x, player.y + 1.2, player.z, 0.4, 0.4, 0.4, 6, 0.1)
    } catch (e) {}

    let successMsg = type === 'hp' 
        ? '§a✨ Использовано Зелье Здоровья! (+HP)' 
        : '§b💧 Использован Эликсир Маны! (+MANA)'
    player.sendSystemMessage(Text.of(successMsg), true)
}

// Register Commands & Chat triggers
ServerEvents.commandRegistry(event => {
    const { commands: Commands } = event

    event.register(
        Commands.literal('drink_hp')
            .executes(ctx => {
                let player = ctx.source.player
                if (player) executeQuickDrink(player, 'hp')
                return 1
            })
    )

    event.register(
        Commands.literal('drink_mana')
            .executes(ctx => {
                let player = ctx.source.player
                if (player) executeQuickDrink(player, 'mana')
                return 1
            })
    )
})

// Chat trigger fallback (.drink_hp, .drink_mana, .hp, .mana)
PlayerEvents.chat(event => {
    let msg = event.message.trim().toLowerCase()
    let player = event.player
    if (!player) return

    if (msg === '.drink_hp' || msg === '!drink_hp' || msg === '.hp') {
        executeQuickDrink(player, 'hp')
        event.cancel()
    } else if (msg === '.drink_mana' || msg === '!drink_mana' || msg === '.mana') {
        executeQuickDrink(player, 'mana')
        event.cancel()
    }
})
