// Server script: Class Detection & Set Bonuses based on worn equipment
// Archetypes: Paladin/Knight, Fire/Spell Mage, Rogue/Ranger, Heavy Berserker

PlayerEvents.tick(event => {
    let player = event.player
    // Check every 20 ticks (1 second) to save server TPS
    if (player.age % 20 !== 0) return

    let head = player.getHeadArmorItem().id
    let chest = player.getChestArmorItem().id
    let legs = player.getLegsArmorItem().id
    let feet = player.getFeetArmorItem().id

    let currentClass = null
    let classColor = "§f"

    // 1. ПАЛАДИН / САМУРАЙ (Сеты Armor of the Ages / О-Ёрой / Кираса)
    if (chest.includes('armoroftheages:') || chest.includes('knight') || chest.includes('yoroi')) {
        currentClass = "Паладин-Защитник"
        classColor = "§e"
        // Сет-бонус: Твердость духа, сопротивление отбрасыванию и регенерация при низком HP
        player.potionEffects.add('minecraft:resistance', 40, 0, false, false)
        if (player.health < 6.0) {
            player.potionEffects.add('minecraft:regeneration', 60, 1, false, false)
            player.potionEffects.add('minecraft:absorption', 60, 0, false, false)
        }
    }
    // 2. БОЕВОЙ МАГ / ОГНЕНОСЕЦ (Сеты Hazen N Stuff / Iron's Spells)
    else if (chest.includes('hazennstuff:') || chest.includes('robes') || chest.includes('flamebearer') || chest.includes('tyros')) {
        currentClass = "Архимаг Пламени"
        classColor = "§c"
        // Сет-бонус: Сила магии и огнестойкость
        player.potionEffects.add('minecraft:fire_resistance', 40, 0, false, false)
    }
    // 3. СЛЕДОПЫТ / ЛОВЕЦ (Кожаные сеты, стрелковая броня)
    else if (chest.includes('leather') || chest.includes('scout') || chest.includes('ranger') || chest.includes('archer')) {
        currentClass = "Следопыт-Охотник"
        classColor = "§a"
        // Сет-бонус: Скорость передвижения и спешка
        player.potionEffects.add('minecraft:speed', 40, 0, false, false)
        player.potionEffects.add('minecraft:haste', 40, 0, false, false)
    }
    // 4. НЕЗЕРИТОВЫЙ ВАРВАР / БЕРСЕРК (Тяжелый Незерит / Cataclysm)
    else if (chest.includes('netherite') || chest.includes('cataclysm:')) {
        currentClass = "Незеритовый Берсерк"
        classColor = "§4"
        // Сет-бонус: Сила удара и огнестойкость
        player.potionEffects.add('minecraft:strength', 40, 0, false, false)
        player.potionEffects.add('minecraft:fire_resistance', 40, 0, false, false)
    }

    // Сохраняем состояние, чтобы не спамить уведомлением каждую секунду
    let pData = player.persistentData
    if (currentClass !== pData.getString('active_rpg_class')) {
        pData.putString('active_rpg_class', currentClass || "")
        if (currentClass) {
            player.tell(`§7[§6Классовый Сет§7] §fВы экипировали: ${classColor}★ ${currentClass} ★§f! Сет-бонус активирован.`)
        }
    }
})
