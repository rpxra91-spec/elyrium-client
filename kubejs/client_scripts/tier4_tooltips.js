// Client Script: Custom Tooltips for Tier 4 RPG Items
ItemEvents.modifyTooltips(event => {
    event.modify('skd:cinder_alloy_ingot', tooltip => {
        tooltip.add(Text.of('§6[Кузнечный Материал • Эпоха Незера]§r'))
        tooltip.add(Text.of('§7Сплав базальта, кварца, золота и незерита.§r'))
        tooltip.add(Text.of('§eИспользуется на Кузнечном столе для ковки Т4-1.§r'))
    })

    event.modify('skd:weapon_core_t4', tooltip => {
        tooltip.add(Text.of('§c[Ранг: IV-1 • Оружейное Ядро]§r'))
        tooltip.add(Text.of('§7Хранит все зачарования и сокеты клинка.§r'))
        tooltip.add(Text.of('§aПоложите в Камнерез для выбора класса оружия!§r'))
    })

    event.modify('skd:ranged_core_t4', tooltip => {
        tooltip.add(Text.of('§c[Ранг: IV-1 • Стрелковое Ядро]§r'))
        tooltip.add(Text.of('§7Хранит все зачарования лука.§r'))
        tooltip.add(Text.of('§aПоложите в Камнерез для ковки Пепельного Лука!§r'))
    })

    event.modify('skd:tool_core_t4', tooltip => {
        tooltip.add(Text.of('§c[Ранг: IV-1 • Ядро Дробителя]§r'))
        tooltip.add(Text.of('§7Хранит все зачарования инструментов.§r'))
        tooltip.add(Text.of('§aПоложите в Камнерез для ковки Мульти-Дробителя!§r'))
    })

    event.modify('skd:cinder_katana', tooltip => {
        tooltip.add(Text.of('§c[Ранг: IV-1 • Пепельная Эпоха]§r'))
        tooltip.add(Text.of('§eБыстрый клинок: повышенный темп ударов и криты.§r'))
        tooltip.add(Text.of('§8Можно бесплатно сменить класс в Камнерезе§r'))
    })

    event.modify('skd:cinder_longsword', tooltip => {
        tooltip.add(Text.of('§c[Ранг: IV-1 • Пепельная Эпоха]§r'))
        tooltip.add(Text.of('§eКлассический клинок: баланс урона и защиты.§r'))
        tooltip.add(Text.of('§8Можно бесплатно сменить класс в Камнерезе§r'))
    })

    event.modify('skd:cinder_claymore', tooltip => {
        tooltip.add(Text.of('§c[Ранг: IV-1 • Пепельная Эпоха]§r'))
        tooltip.add(Text.of('§eТяжелый двуручник: сокрушительный круговой сплеш.§r'))
        tooltip.add(Text.of('§8Можно бесплатно сменить класс в Камнерезе§r'))
    })

    event.modify('skd:cinder_scythe', tooltip => {
        tooltip.add(Text.of('§c[Ранг: IV-1 • Пепельная Эпоха]§r'))
        tooltip.add(Text.of('§eБоевая коса: жатва толпы и вампирический разрез.§r'))
        tooltip.add(Text.of('§8Можно бесплатно сменить класс в Камнерезе§r'))
    })

    event.modify('skd:cinder_breaker', tooltip => {
        tooltip.add(Text.of('§c[Ранг: IV-1 • Пепельная Эпоха]§r'))
        tooltip.add(Text.of('§bУниверсальный Дробитель (3-в-1): Кирка + Топор + Лопата§r'))
        tooltip.add(Text.of('§7Скорость добычи: 9.5 (Комфортный контроль)§r'))
    })

    event.modify('skd:cinder_bow', tooltip => {
        tooltip.add(Text.of('§c[Ранг: IV-1 • Пепельная Эпоха]§r'))
        tooltip.add(Text.of('§eСоставной адский лук: огненное пробивание брони.§r'))
    })
})
