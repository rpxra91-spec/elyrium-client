# Spawn Mini-Boss F5: Warlord Brandor Ironfang
kill @e[type=vindicator,tag=aincrad_boss_f5,distance=..100]

bossbar add aincrad:brandor_f5 {"text":"Брандор Железный Клык — Варлорд Разбойников","color":"yellow","bold":true}
bossbar set aincrad:brandor_f5 max 1250
bossbar set aincrad:brandor_f5 value 1250
bossbar set aincrad:brandor_f5 style notched_10
bossbar set aincrad:brandor_f5 color yellow
bossbar set aincrad:brandor_f5 players @a[distance=..120]

summon vindicator ~ ~ ~ {Tags:["aincrad_boss_f5","aincrad_boss","aincrad_phase_1"],CustomName:'{"text":"Брандор Железный Клык","color":"gold","bold":true}',CustomNameVisible:1b,Attributes:[{Name:"generic.max_health",Base:1250.0},{Name:"generic.armor",Base:16.0},{Name:"generic.armor_toughness",Base:4.0},{Name:"generic.knockback_resistance",Base:0.8},{Name:"generic.movement_speed",Base:0.26},{Name:"generic.attack_damage",Base:12.0},{Name:"generic.scale",Base:1.25}],Health:1250.0f,HandItems:[{id:"minecraft:iron_axe",count:1,components:{"minecraft:custom_name":'{"text":"Боевой Молот Варлорда","color":"gold"}'}},{id:"minecraft:shield",count:1,components:{"minecraft:custom_name":'{"text":"Стальной Башенный Щит","color":"blue"}'}}],ArmorItems:[{id:"minecraft:iron_boots",count:1},{id:"minecraft:iron_leggings",count:1},{id:"minecraft:iron_chestplate",count:1},{id:"minecraft:iron_helmet",count:1}],ArmorDropChances:[0.0f,0.0f,0.0f,0.0f],HandDropChances:[0.0f,0.0f],DeathLootTable:"aincrad:bosses/boss_f5_warlord"}

title @a[distance=..100] title {"text":"РУБЕЖ ЭТАЖА 5","color":"dark_red","bold":true}
title @a[distance=..100] subtitle {"text":"Варлорд Разбойников вышел на Арену!","color":"gold"}
playsound minecraft:entity.wither.spawn master @a[distance=..100] ~ ~ ~ 1.0 0.5
particle minecraft:explosion_emitter ~ ~1 ~ 1 1 1 0.1 30
