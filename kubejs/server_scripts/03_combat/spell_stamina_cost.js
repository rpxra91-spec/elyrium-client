// ==============================================================================
// ⚔️ ELYRIUM RPG: SPELL ENGINE STAMINA COST INTEGRATION
// ==============================================================================
// Файл: kubejs/server_scripts/03_combat/spell_stamina_cost.js
// Назначение: Проверка запаса выносливости игрока перед началом каста (PRE)
//             и списание выносливости при успешном завершении каста (SPELL_CAST).
// Синхронизация: Зеркально в Server и Client.
// ==============================================================================

const ELYRIUM_COMBAT_ART_STAMINA = {
    'elyrium:reverse_sunder': 30,     // Мечи — Реверсивный Раскол
    'elyrium:whirlwind_cleave': 40,   // Клейморы — Вихревой Размах
    'elyrium:severing_cleave': 35,    // Топоры — Рассекающий Клив
    'elyrium:earth_sunder': 45,       // Молоты — Сотрясение Земли
    'elyrium:crushing_uppercut': 30,  // Булавы — Сокрушительный Апперкот
    'elyrium:piercing_thrust': 25,    // Копья — Бронебойный Прокол
    'elyrium:scissor_cross': 25,      // Кинжалы — Ножницы
    'elyrium:iai_slash': 30,          // Катаны — Фантомный Выпад (Иай)
    'elyrium:fan_barrage': 30         // Луки — Веерный Залп
};

// Вспомогательные классы Minecraft / Spell Engine
let J_SpellEvents = null;
let J_SpellAttempt = null;
let J_Component = null;

try {
    J_SpellEvents = Java.loadClass('net.spell_engine.api.spell.event.SpellEvents');
    J_SpellAttempt = Java.loadClass('net.spell_engine.internals.casting.SpellCast');
    J_Component = Java.loadClass('net.minecraft.network.chat.Component');
} catch (eClassLoad) {
    console.warn('[Elyrium:SpellStamina] Could not pre-load Java classes: ' + eClassLoad);
}

/**
 * Извлечение ID заклинания из Holder<Spell>
 */
function getSpellIdentifier(spellHolder) {
    if (!spellHolder) return null;
    try {
        if (typeof spellHolder.getRegisteredName === 'function') {
            let name = spellHolder.getRegisteredName();
            if (name) return String(name);
        }
    } catch (e1) {}
    try {
        if (typeof spellHolder.unwrapKey === 'function') {
            let opt = spellHolder.unwrapKey();
            if (opt && opt.isPresent()) {
                return String(opt.get().location().toString());
            }
        }
    } catch (e2) {}
    try {
        if (typeof spellHolder.key === 'function') {
            let key = spellHolder.key();
            if (key && key.location) {
                return String(key.location().toString());
            }
        }
    } catch (e3) {}
    return null;
}

/**
 * Получение текущей выносливости игрока с поддержкой fallback
 */
function getElyriumPlayerStamina(player) {
    if (!player) return 100;
    if (typeof getPlayerStamina === 'function') {
        return getPlayerStamina(player);
    }
    if (global && typeof global.getPlayerStamina === 'function') {
        return global.getPlayerStamina(player);
    }
    let pData = player.persistentData;
    if (!pData.contains('elyrium_stamina')) {
        let maxStam = getElyriumPlayerMaxStamina(player);
        pData.putInt('elyrium_stamina', maxStam);
        return maxStam;
    }
    return pData.getInt('elyrium_stamina');
}

/**
 * Получение максимальной выносливости игрока с поддержкой SimpleStats
 */
function getElyriumPlayerMaxStamina(player) {
    if (!player) return 100;
    if (typeof getPlayerMaxStamina === 'function') {
        return getPlayerMaxStamina(player);
    }
    if (global && typeof global.getPlayerMaxStamina === 'function') {
        return global.getPlayerMaxStamina(player);
    }
    let perks = player.persistentData ? player.persistentData.getCompound('simplestats_perks') : null;
    let agi = perks ? perks.getInt('agility') : 0;
    let vit = perks ? perks.getInt('vitality') : 0;
    return 100 + (agi * 5) + (vit * 5);
}

/**
 * Списание выносливости игрока и обновление HUD/BossBar
 */
function consumeElyriumPlayerStamina(player, amount) {
    if (!player || amount <= 0) return true;
    if (typeof consumePlayerStamina === 'function') {
        return consumePlayerStamina(player, amount);
    }
    if (global && typeof global.consumePlayerStamina === 'function') {
        return global.consumePlayerStamina(player, amount);
    }
    let current = getElyriumPlayerStamina(player);
    if (current < amount) return false;
    let maxStam = getElyriumPlayerMaxStamina(player);
    let newStam = current - amount;
    player.persistentData.putInt('elyrium_stamina', newStam);
    try {
        if (typeof updateStaminaBossBar === 'function') {
            updateStaminaBossBar(player, newStam, maxStam);
        } else if (global && typeof global.updateStaminaBossBar === 'function') {
            global.updateStaminaBossBar(player, newStam, maxStam);
        }
    } catch (eBar) {}
    return true;
}

/**
 * Отправка визуального и звукового предупреждения о нехватке выносливости
 */
function notifyLowStamina(player, requiredCost, currentStam) {
    let msgText = '§c⚡ Недостаточно выносливости! Требуется: §e' + requiredCost + ' §c(У вас: §7' + currentStam + '§c)';
    try {
        if (typeof player.displayClientMessage === 'function') {
            let comp = J_Component ? J_Component.literal(msgText) : Text.of(msgText);
            player.displayClientMessage(comp, true);
        } else if (typeof player.sendSystemMessage === 'function') {
            player.sendSystemMessage(Text.of(msgText), true);
        }
    } catch (eMsg) {
        try {
            player.tell(msgText);
        } catch (eTell) {}
    }

    try {
        if (player.server && typeof player.server.runCommandSilent === 'function') {
            player.server.runCommandSilent('playsound minecraft:entity.player.breath player ' + player.username + ' ~ ~ ~ 0.8 1.4');
        }
    } catch (eSnd) {}
}

// Note: Raw Java StagedEvent.register requires compiled SAM classes that Rhino ArrowFunctions cannot be cast to.
// Stamina consumption and checks are handled natively by physical_weapon_arts_engine.js executeWeaponArt.
console.info('[Elyrium:SpellStamina] Spell stamina subsystem active (managed via KubeJS combat engine).');
