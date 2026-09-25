// Mod Compatibility Tags for MineColonies
// Ensures bows from Too Many Bows and tools from Aether, DivineRPG, Eternal Starlight, Deeper and Darker
// are recognized by MineColonies citizens and work without tier errors.

ServerEvents.tags('item', event => {
    // 1. Bows compatibility
    event.get('minecraft:enchantable/bow').add([
        /too_many_bows:.*/,
        /l2archery:.*/
    ])
    event.get('c:tools/bows').add([
        /too_many_bows:.*/,
        /l2archery:.*/
    ])

    // 2. Pickaxes compatibility
    event.get('minecraft:pickaxes').add([
        /aether:.*pickaxe.*/,
        /deep_aether:.*pickaxe.*/,
        /divinerpg:.*pickaxe.*/,
        /eternalstarlight:.*pickaxe.*/,
        /deeperdarker:.*pickaxe.*/
    ])
    event.get('c:tools/pickaxes').add([
        /aether:.*pickaxe.*/,
        /deep_aether:.*pickaxe.*/,
        /divinerpg:.*pickaxe.*/,
        /eternalstarlight:.*pickaxe.*/,
        /deeperdarker:.*pickaxe.*/
    ])

    // 3. Axes compatibility
    event.get('minecraft:axes').add([
        /aether:.*axe.*/,
        /deep_aether:.*axe.*/,
        /divinerpg:.*axe.*/,
        /eternalstarlight:.*axe.*/,
        /deeperdarker:.*axe.*/
    ])
    event.get('c:tools/axes').add([
        /aether:.*axe.*/,
        /deep_aether:.*axe.*/,
        /divinerpg:.*axe.*/,
        /eternalstarlight:.*axe.*/,
        /deeperdarker:.*axe.*/
    ])

    // 4. Swords compatibility (Simply Swords + Dimensions)
    event.get('minecraft:swords').add([
        /simplyswords:.*/,
        /aether:.*sword.*/,
        /divinerpg:.*sword.*/,
        /eternalstarlight:.*sword.*/,
        /deeperdarker:.*sword.*/
    ])
    event.get('c:tools/swords').add([
        /simplyswords:.*/,
        /aether:.*sword.*/,
        /divinerpg:.*sword.*/,
        /eternalstarlight:.*sword.*/,
        /deeperdarker:.*sword.*/
    ])

    // 5. Quiver Curios & Accessories compatibility
    // Ensure all nyfsquiver items can be equipped into Curios back and belt slots
    event.get('curios:back').add([
        '#nyfsquiver:quiver',
        /nyfsquiver:.*/
    ])
    event.get('curios:belt').add([
        '#nyfsquiver:quiver',
        /nyfsquiver:.*/
    ])
    event.get('accessories:back').add([
        '#nyfsquiver:quiver',
        /nyfsquiver:.*/
    ])
    event.get('accessories:belt').add([
        '#nyfsquiver:quiver',
        /nyfsquiver:.*/
    ])
})

