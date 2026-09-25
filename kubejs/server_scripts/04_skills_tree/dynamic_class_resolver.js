// ==============================================================================
// 🌟 ELYRIUM: DYNAMIC RPG CLASS & ARCHETYPE RESOLVER (KUBEJS 1.21.1)
// ==============================================================================
// Dynamically resolves player's active class based on unlocked constellation nodes
// in Puffish Skills ('celestial_tree') and dominant SimpleStats attributes.
// ==============================================================================

const ARCHETYPES = {
    BERSERKER: { name: 'Берсерк', title: '§c[Берсерк]§r', icon: '⚔️', desc: 'Мастер сокрушительных ударов и ярости ближнего боя.' },
    PALADIN: { name: 'Паладин', title: '§e[Паладин]§r', icon: '✨🛡️', desc: 'Воин Света, сочетающий глухую оборону и святые чары.' },
    JUGGERNAUT: { name: 'Джаггернаут', title: '§9[Джаггернаут]§r', icon: '🛡️', desc: 'Несокрушимый оплот, поглощающий любые удары врагов.' },
    SWORDSMAN: { name: 'Мастер Клинка', title: '§b[Мастер Клинка]§r', icon: '🗡️', desc: 'Виртуоз дуэльных выпадов, парирования и скорости атак.' },
    
    ARCHMAGE: { name: 'Архимаг', title: '§d[Архимаг]§r', icon: '🔮', desc: 'Повелитель первородных стихий и неиссякаемого потока маны.' },
    PYROMANCER: { name: 'Пиромансер', title: '§6[Пиромансер]§r', icon: '🔥', desc: 'Владыка испепеляющего пламени и огненных бурь.' },
    CRYO_MAGE: { name: 'Маг Льда', title: '§b[Маг Льда]§r', icon: '❄️', desc: 'Скователь холодом, обращающий плоть врагов в лед.' },
    STORM_CALLER: { name: 'Повелитель Бури', title: '§e[Повелитель Бури]§r', icon: '⚡', desc: 'Мастер сокрушительных цепных молний и шока.' },
    BLOOD_MAGE: { name: 'Маг Крови', title: '§4[Маг Крови]§r', icon: '🩸', desc: 'Жертвует жизненной силой ради чудовищного вампиризма.' },
    SUMMONER: { name: 'Призыватель', title: '§5[Призыватель]§r', icon: '💀', desc: 'Командует ордой нежити и призванных духов.' },

    RANGER: { name: 'Следопыт', title: '§a[Следопыт]§r', icon: '🏹', desc: 'Меткий стрелок, поражающий цели с предельной дистанции.' },
    ASSASSIN: { name: 'Ассасин', title: '§8[Ассасин]§r', icon: '🗡️', desc: 'Теневой клинок, наносящий смертельные критические удары.' },
    SPELLBLADE: { name: 'Боевой Маг', title: '§3[Боевой Маг]§r', icon: '✨⚔️', desc: 'Смертоносный сплав клинка и заклинаний.' },
    
    ADVENTURER: { name: 'Авантюрист', title: '§7[Авантюрист]§r', icon: '🧭', desc: 'Странник, только начинающий свой путь по созвездиям.' }
};

// Periodic class resolver (Runs every 100 ticks / 5 seconds per player)
PlayerEvents.tick(event => {
    let player = event.player;
    if (!player || player.age % 100 !== 0) return;

    let pData = player.persistentData;
    let perks = pData.getCompound('simplestats_perks');
    let str = perks ? perks.getInt('strength') : 0;
    let vit = perks ? perks.getInt('vitality') : 0;
    let def = perks ? perks.getInt('defense') : 0;
    let agi = perks ? perks.getInt('agility') : 0;
    let crit = perks ? perks.getInt('crit') : 0;
    let mana = perks ? perks.getInt('mana') : 0;

    let resolved = ARCHETYPES.ADVENTURER;

    // Archetype resolution logic
    let totalStats = str + vit + def + agi + crit + mana;
    if (totalStats >= 10) {
        if (mana >= 15 && str >= 12) {
            resolved = ARCHETYPES.SPELLBLADE;
        } else if (mana >= 15 && def >= 12) {
            resolved = ARCHETYPES.PALADIN;
        } else if (mana > (str + 8) && mana > (agi + 8)) {
            resolved = ARCHETYPES.ARCHMAGE;
        } else if (str > (mana + 8) && str > (agi + 8)) {
            if (def >= 15) {
                resolved = ARCHETYPES.JUGGERNAUT;
            } else {
                resolved = ARCHETYPES.BERSERKER;
            }
        } else if (agi > (str + 6) && agi > (mana + 6)) {
            if (crit >= 12) {
                resolved = ARCHETYPES.ASSASSIN;
            } else {
                resolved = ARCHETYPES.RANGER;
            }
        } else if (str >= 10 && agi >= 10) {
            resolved = ARCHETYPES.SWORDSMAN;
        }
    }

    let prevClass = pData.getString('elyrium_class');
    if (prevClass !== resolved.name) {
        pData.putString('elyrium_class', resolved.name);
        
        // Notify player of new dynamic class attainment
        if (prevClass !== '') {
            player.displayClientMessage(
                Text.of(`§6✦ Созвездия отозвались! Ваш стиль боя признан: ${resolved.title} §e${resolved.name}`),
                false
            );
            player.level.playSound(null, player.blockX, player.blockY, player.blockZ, 'minecraft:ui.toast.challenge_complete', 'players', 0.8, 1.2);
        }
    }
});
