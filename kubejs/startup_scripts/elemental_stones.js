// ==============================================================================
// 💎 ELYRIUM RPG: 4-TIER ELEMENTAL STONES SYSTEM (v0.4.33)
// Minecraft 1.21.1 NeoForge | KubeJS Startup Script
// ==============================================================================
// 4 Ranks x 6 Elements = 24 Progression Elemental Stones:
//
// 1. Ranks & Weapon Conversion Rules (No INT dependency, scales strictly off Weapon Base):
//    - Оружейная База = Базовый урон * (1.0 + Бонус Заточки +1..+15)
//    - Rank I (Треснувший):   10% физ. урона -> Стихия (обход брони) / Посох: +5% спеллов
//    - Rank II (Ограненный):  18% физ. урона -> Стихия (обход брони) / Посох: +10% спеллов + Пассивный Ритм (Эффект 1)
//    - Rank III (Совершенный): 24% физ. урона -> Стихия (обход брони) / Посох: +18% спеллов + Пассивный Ритм (Эффект 1)
//    - Rank IV (Первородный):  30% физ. урона -> Стихия (обход брони) / Посох: +25% спеллов + Ультимейт с КД (Эффект 2)
//
// 2. 6 Elements:
//    - Fire (Пламя), Frost (Лед), Lightning (Молния), Shadow (Бездна), Holy (Свет), Nature (Природа)
//
// 3. Passive Rhythm (Эффект 1) [Ранги II и III]:
//    - Огонь: поджог на 3 сек.
//    - Лед: Замедление I на 2 сек.
//    - Молния: статический заряд, каждый 4-й удар бьет цепной мини-искрой соседнего врага (без станлока!).
//    - Природа: Отравление I на 3 сек.
//    - Свет: +25% урона строго по нежити.
//    - Бездна: Иссушение I на 2.5 сек.
//
// 4. Ultimates (Эффект 2) [Ранг IV]:
//    - Огонь (КД 15с): «Огненная Волна» (отталкивание на 2 блока + АоЕ-ожог).
//    - Лед (КД 18с): «Оледенение» (заморозка соло-цели на 1.5 сек + хрупкость +25% физ. урона следующего удара).
//    - Молния (КД 15с): «Нисходящий Разряд» (одиночный удар молнии с небес по цели).
//    - Природа (КД 20с): «Оплетающие Споры» (обездвиживание соло-цели на 2 сек + вампиризм 4 HP игроку).
//    - Свет (КД 15с): «Вспышка Очищения» (ослепление врагов на 2 сек + снятие 1 дебаффа с игрока).
//    - Бездна (КД 20с): «Пожирание Тени» (срез 20% маг. защиты соло-цели на 4 сек + 15 маны игроку).
// ==============================================================================

StartupEvents.registry('item', event => {

    const ELEMENTS = [
        {
            elem: 'fire',
            name: 'Пламени',
            color: '§c',
            subColor: '§6',
            effect1: '§c• Эффект (Ритм): §7Поджигает цель на 3 секунды.',
            effect2: '§6• Ультимейт [КД 15с]: §e«Огненная Волна» §7— отталкивание на 2 блока и АоЕ-ожог врагов.'
        },
        {
            elem: 'frost',
            name: 'Льда',
            color: '§b',
            subColor: '§3',
            effect1: '§b• Эффект (Ритм): §7Накладывает Замедление I на 2 секунды.',
            effect2: '§3• Ультимейт [КД 18с]: §b«Оледенение» §7— заморозка цели на 1.5с + хрупкость (+25% к след. физ. удару).'
        },
        {
            elem: 'lightning',
            name: 'Молнии',
            color: '§e',
            subColor: '§6',
            effect1: '§e• Эффект (Ритм): §7Статический заряд (каждый 4-й удар бьет цепной мини-искрой соседнего врага).',
            effect2: '§6• Ультимейт [КД 15с]: §e«Нисходящий Разряд» §7— сокрушительный удар молнии с небес по цели.'
        },
        {
            elem: 'nature',
            name: 'Природы',
            color: '§a',
            subColor: '§2',
            effect1: '§a• Эффект (Ритм): §7Накладывает Отравление I на 3 секунды.',
            effect2: '§2• Ультимейт [КД 20с]: §a«Оплетающие Споры» §7— паралич цели на 2с и восстановление +4 HP игроку.'
        },
        {
            elem: 'holy',
            name: 'Света',
            color: '§6',
            subColor: '§e',
            effect1: '§6• Эффект (Ритм): §e+25% стихийного урона строго по нежити.',
            effect2: '§e• Ультимейт [КД 15с]: §6«Вспышка Очищения» §7— ослепляет врагов на 2с и снимает негативный эффект с игрока.'
        },
        {
            elem: 'shadow',
            name: 'Бездны',
            color: '§5',
            subColor: '§d',
            effect1: '§5• Эффект (Ритм): §dНакладывает Иссушение I на 2.5 секунды.',
            effect2: '§d• Ультимейт [КД 20с]: §5«Пожирание Тени» §7— срез 20% маг. защиты цели на 4с и +15 маны игроку.'
        }
    ];

    const RANKS = [
        {
            rank: 1,
            suffix: '',
            prefixTitle: 'Треснувший Камень',
            rarity: 'common',
            glow: false,
            physConv: '10%',
            staffSpell: '+5%',
            rankRoman: 'I',
            rankColor: '§7'
        },
        {
            rank: 2,
            suffix: '_2',
            prefixTitle: 'Ограненный Камень',
            rarity: 'uncommon',
            glow: false,
            physConv: '18%',
            staffSpell: '+10%',
            rankRoman: 'II',
            rankColor: '§a'
        },
        {
            rank: 3,
            suffix: '_3',
            prefixTitle: 'Совершенный Камень',
            rarity: 'rare',
            glow: true,
            physConv: '24%',
            staffSpell: '+18%',
            rankRoman: 'III',
            rankColor: '§b'
        },
        {
            rank: 4,
            suffix: '_4',
            prefixTitle: 'Первородный Камень',
            rarity: 'epic',
            glow: true,
            physConv: '30%',
            staffSpell: '+25%',
            rankRoman: 'IV',
            rankColor: '§d'
        }
    ];

    ELEMENTS.forEach(elemInfo => {
        RANKS.forEach(rankInfo => {
            let itemId = `elemental_stone_${elemInfo.elem}${rankInfo.suffix}`;
            let itemReg = event.create(itemId)
                .displayName(`${elemInfo.color}${rankInfo.prefixTitle} ${elemInfo.name} §r${rankInfo.rankColor}[${rankInfo.rankRoman}]`)
                .tooltip(`§8[Стихийный Катализатор • Ранг ${rankInfo.rankRoman}]`)
                .tooltip(`§eПрименение: §fОружейный Верстак / Алтарь Стихий`)
                .tooltip(`§6Оружие: §fКонвертирует §e${rankInfo.physConv} §fОружейной Базы в стихийный урон (обход брони).`)
                .tooltip(`§dПосох: §f${rankInfo.staffSpell} к силе заклинаний школы.`)
                .rarity(rankInfo.rarity)
                .maxStackSize(16);

            if (rankInfo.glow) {
                itemReg.glow(true);
            }

            // Добавление специфических эффектов в тултип по рангам
            if (rankInfo.rank >= 2) {
                itemReg.tooltip(elemInfo.effect1);
            }
            if (rankInfo.rank === 4) {
                itemReg.tooltip(elemInfo.effect2);
            }
        });
    });

});
