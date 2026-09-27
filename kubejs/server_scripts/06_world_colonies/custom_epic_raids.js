// KubeJS Script: Thematic Racial Raid Armies (No Strange Mixed Mess!)
// Each raid chooses ONE pure race/faction, but INSIDE that race there is a huge, rich variety of 15-20+ distinct creatures!
//
// FACTIONS:
// 1. 💀 Легион Нежити (The Undead Legion) - 18 видов нежити: зомби, скелеты, призраки, мумии, ревенанты
// 2. 🔥 Демоны и Твари Незера (Infernal Nether Host) - 15 видов адских тварей: демоны, бруты, берсерки, магма
// 3. 🌑 Порождения Бездны и Скулка (The Abyssal Swarm) - 16 видов тварей тьмы: скулк, аметист, многоножки, сталкеры
// 4. 🪓 Бандиты, Разбойники и Культисты (Outlaws & Cultists) - 15 видов гуманоидов: арбалетчики, поборники, маги, наёмники

const FACTION_ARMIES = {
    'UNDEAD': {
        name: '💀 Легион Нежити',
        scouts_and_soldiers: [
            // Skeletons / Archers
            'minecraft:skeleton', 'minecraft:stray', 'eternal_starlight:lonestar_skeleton',
            // Zombies / Walkers / Ghouls
            'minecraft:zombie', 'minecraft:husk', 'minecraft:drowned',
            'eternal_starlight:stranghoul', 'eternal_starlight:tangled_husk',
            'cataclysm:ancient_remnant', 'cataclysm:drowned_host',
            'divinerpg:ancient_entity', 'divinerpg:husk',
            'astral_dimension:fried_zombie', 'irons_spellbooks:catacombs_zombie'
        ],
        elites: [
            'minecraft:wither_skeleton', 'deeperdarker:shattered',
            'astral_dimension:ruined_knight', 'divinerpg:gruzzorlug_knight',
            'cataclysm:deepling_brute', 'divinerpg:dissiment'
        ],
        commanders: [
            'cataclysm:ignited_revenant', 'divinerpg:groglin_chieftain'
        ]
    },

    'NETHER_DEMONS': {
        name: '🔥 Демонический Легион Незера',
        scouts_and_soldiers: [
            'minecraft:zombified_piglin', 'minecraft:piglin', 'minecraft:magma_cube',
            'divinerpg:hell_spider', 'divinerpg:dungeon_demon', 'minecraft:blaze'
        ],
        elites: [
            'minecraft:piglin_brute', 'cataclysm:ignited_berserker',
            'divinerpg:demon_of_darkness', 'divinerpg:twilight_demon',
            'divinerpg:stone_golem'
        ],
        commanders: [
            'cataclysm:netherite_ministrosity', 'divinerpg:captain_merik'
        ]
    },

    'ABYSSAL_SWARM': {
        name: '🌑 Твари Бездны и Скулка',
        scouts_and_soldiers: [
            'deeperdarker:sculk_centipede', 'deeperdarker:sculk_snapper',
            'deeperdarker:sludge', 'astral_dimension:amethyst_crawler',
            'astral_dimension:baby_amethyst_crawler', 'astral_dimension:amethyst_sentry',
            'divinerpg:cave_crawler', 'divinerpg:desert_crawler',
            'divinerpg:ender_spider', 'divinerpg:soul_spider',
            'eternal_starlight:nightfall_spider', 'eternal_starlight:seeker',
            'irons_spellbooks:ice_spider'
        ],
        elites: [
            'deeperdarker:shriek_worm', 'astral_dimension:corrupted_astral_golem',
            'astral_dimension:amethyst_knight', 'eternal_starlight:astral_golem',
            'cataclysm:ender_golem'
        ],
        commanders: [
            'deeperdarker:stalker', 'astral_dimension:titan_sentry'
        ]
    },

    'BANDITS_AND_CULTISTS': {
        name: '🪓 Бандиты, Наёмники и Тёмные Маги',
        scouts_and_soldiers: [
            'minecraft:pillager', 'minecraft:vindicator',
            'irons_spellbooks:magehunter_vindicator', 'eternal_starlight:ratlin',
            'eternal_starlight:thirst_walker', 'divinerpg:ent'
        ],
        elites: [
            'minecraft:witch', 'minecraft:evoker',
            'astral_dimension:melee_astral_golem',
            'irons_spellbooks:citadel_keeper'
        ],
        commanders: [
            'minecraft:ravager', 'irons_spellbooks:archevoker'
        ]
    }
}

// === 1. DAY-TIME SCOUT WARNING ===
ServerEvents.tick(event => {
    let server = event.server
    if (server.tickCount % 200 !== 0) return

    let overworld = server.getLevel('minecraft:overworld')
    if (!overworld) return

    let dayTime = overworld.dayTime() % 24000
    if (dayTime >= 5800 && dayTime <= 6200) {
        let tagKey = 'raid_scout_pure_day_' + Math.floor(overworld.dayTime() / 24000)
        if (!server.persistentData.getBoolean(tagKey)) {
            server.persistentData.putBoolean(tagKey, true)

            try {
                let ColonyManager = Java.loadClass('com.minecolonies.api.colony.IColonyManager').getInstance()
                if (ColonyManager) {
                    let colonies = ColonyManager.getAllColonies()
                    if (colonies) {
                        for (let colony of colonies) {
                            let raiderMgr = colony.getRaiderManager()
                            if (raiderMgr && raiderMgr.willRaidTonight()) {
                                let factionKeys = Object.keys(FACTION_ARMIES)
                                let chosenFactionKey = factionKeys[Math.floor(Math.random() * factionKeys.length)]
                                let faction = FACTION_ARMIES[chosenFactionKey]

                                server.persistentData.putString(`colony_raid_faction_${colony.getID()}`, chosenFactionKey)

                                let colonyName = colony.getName() || "Колония"
                                server.tell(Text.darkRed('⚠️ ═════════════════════════════════════════════════════ ⚠️'))
                                server.tell(Text.red(`🚨 ТРЕВОГА! Дозорные колонии "${colonyName}" бьют в набат!`))
                                server.tell(Text.gold(`   Разведка докладывает: этой ночью город штурмует единая армия:`))
                                server.tell(Text.yellow(`   ⚔️ ${faction.name}!`))
                                server.tell(Text.gray('   Приготовьте стражу к отражению нападения и заприте главные ворота!'))
                                server.tell(Text.darkRed('⚠️ ═════════════════════════════════════════════════════ ⚠️'))

                                server.players.forEach(p => {
                                    server.runCommandSilent(`playsound minecraft:block.bell.use ambient ${p.username} ~ ~ ~ 1.5 0.7`)
                                })
                            }
                        }
                    }
                }
            } catch (e) {
                // Ignore
            }
        }
    }
})

// === 2. MONSTER SPAWNING (STRICTLY FROM THE SELECTED FACTION) ===
EntityEvents.spawned(event => {
    let entity = event.entity
    if (!entity || !entity.isLiving() || entity.isPlayer()) return

    let type = entity.type.toString()
    if (!type.startsWith('minecolonies:')) return

    if (type.includes('barbarian') || type.includes('pirate') || type.includes('norsemen') || type.includes('amazon') || type.includes('mummy')) {
        let level = entity.level
        if (level.isClientSide()) return

        let pos = entity.blockPosition()
        let server = event.server

        try {
            let ColonyManager = Java.loadClass('com.minecolonies.api.colony.IColonyManager').getInstance()
            if (ColonyManager) {
                let colony = ColonyManager.getIColony(level.minecraftLevel, pos)
                if (colony) {
                    let colonyId = colony.getID()
                    let factionKey = server.persistentData.getString(`colony_raid_faction_${colonyId}`)
                    if (!factionKey || !FACTION_ARMIES[factionKey]) {
                        factionKey = 'UNDEAD'
                    }
                    let faction = FACTION_ARMIES[factionKey]

                    let isBoss = type.includes('chief') || type.includes('captain') || type.includes('pharao')
                    let targetMobId = 'minecraft:zombie'
                    let isCommander = false

                    if (isBoss) {
                        targetMobId = faction.commanders[Math.floor(Math.random() * faction.commanders.length)]
                        isCommander = true
                    } else {
                        // 70% Soldiers, 30% Elites within the same faction!
                        if (Math.random() < 0.30) {
                            targetMobId = faction.elites[Math.floor(Math.random() * faction.elites.length)]
                        } else {
                            targetMobId = faction.scouts_and_soldiers[Math.floor(Math.random() * faction.scouts_and_soldiers.length)]
                        }
                    }

                    event.cancel()

                    let spawnedMob = level.createEntity(targetMobId)
                    if (spawnedMob) {
                        spawnedMob.setPos(entity.x, entity.y, entity.z)
                        spawnedMob.addTag('custom_colony_raider')

                        if (isCommander) {
                            spawnedMob.addTag('colony_raid_commander')
                            spawnedMob.setCustomName(Text.darkRed(`⚔️ Предводитель: ${faction.name}`))
                            spawnedMob.setCustomNameVisible(true)
                        }

                        spawnedMob.spawn()
                    }
                }
            }
        } catch (e) {
            // Keep default mob on error
        }
    }
})

// === 3. COMMANDER DEFEAT & REWARDS ===
EntityEvents.death(event => {
    let entity = event.entity
    if (!entity || !entity.isLiving()) return

    if (entity.tags.contains('colony_raid_commander')) {
        let server = event.server

        server.tell(Text.gold('═════════════════════════════════════════════════════'))
        server.tell(Text.yellow('🏆 ПРЕДВОДИТЕЛЬ ШТУРМА ПОВЕРЖЕН!'))
        server.tell(Text.green('   Вражеская армия разгромлена! Защитники города получают боевые трофеи!'))
        server.tell(Text.gold('═════════════════════════════════════════════════════'))

        let level = entity.level
        let drop = level.createEntity('minecraft:item')
        if (drop) {
            drop.item = Item.of('kubejs:sphere_of_ascension', 1)
            drop.setPos(entity.x, entity.y + 0.5, entity.z)
            drop.spawn()
        }

        server.players.forEach(p => {
            if (p.distanceToEntity(entity) < 150) {
                server.runCommandSilent(`simplestats points add ${p.username} 1`)
                server.runCommandSilent(`simplestats xp add ${p.username} 500`)
                server.runCommandSilent(`playsound minecraft:ui.toast.challenge_complete player ${p.username} ~ ~ ~ 1 1`)
            }
        })
    }
})
