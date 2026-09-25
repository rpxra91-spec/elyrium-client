# Spawn Champion F1: Outlaw Packmaster
kill @e[type=pillager,tag=aincrad_champion_f1,distance=..60]
kill @e[type=wolf,tag=aincrad_champion_wolf_f1,distance=..60]

summon wolf ~ ~ ~ {Tags:["uncrad_champion_wolf_f1","aincrad_mob"],CustomName:'{"text":"Бронированный Лютоволк","color":"dark_red","bold":true}',CustomNameVisible:1b,Attributes:[{Name:"generic.max_health",Base:80.0},{Name:"generic.movement_speed",Base:0.38},{Name:"generic.attack_damage",Base:6.0}],Health:80.0f,CollarColor:14b,DeathLootTable:"aincrad:champions/champion_f1"}

summon pillager ~ ~ ~ {Tags:["aincrad_champion_f1","aincrad_mob"],CustomName:'{"text":"Главарь Шайки Волкодавов [F1 Чемпион�","color":"red","bold":true}',CustomNameVisible:1b,Attributes:[{Name:"generic.max_health",Base:120.0},{Name:"generic.armor",Base:8.0},{Name:"generic.knockback_resistance",Base:0.6},{Name:"generic.attack_damage",Base:7.0}],Health:120.0f,HandItems:[{id:"minecraft:crossbow",count:1,components:{"minecraft:fancy_name":'{"text":"Осадный Тяжелый Арбалет","color":"red"}',"minecraft:enchantments":{levels:{"minecraft:quick_charge":2,"minecraft:piercing":1}}}},{}],ArmorItems:[{id:"minecraft:iron_boots",count:1},{id:"minecraft:iron_leggings",count:1},{id:"minecraft:chainmail_chestplate",count:1},{id:"minecraft:iron_helmet",count:1}],ArmorDropChances:[0.0f,0.0f,0.0f,0.0f],HandDropChances:[0.0f,0.0f],DeathLootTable:"aincrad:champions/champion_f1"}

title @a[distance=..50] title {"text":"ЧЕМПИОН ВРАТ ПОЯВИЛСЯ!","color":"red","bold":true}
title @a[distance=..50] subtitle {"text":"Уничтожьте Главаря Волкодавов для открытия Башни F2","color":"yellow"}
playsound minecraft:entity.raid.horn master @a[distance=..50] ~ ~ ~ 1.0 0.8
