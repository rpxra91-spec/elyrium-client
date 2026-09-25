// Server Script: Remove recipes for Wood/Gold Simply Swords clutter
ServerEvents.recipes(event => {
    const HIDDEN_CLUTTER = [
        'simplyswords:copper_chakram',
        'simplyswords:copper_claymore',
        'simplyswords:copper_cutlass',
        'simplyswords:copper_glaive',
        'simplyswords:copper_greataxe',
        'simplyswords:copper_greathammer',
        'simplyswords:copper_halberd',
        'simplyswords:copper_katana',
        'simplyswords:copper_longsword',
        'simplyswords:copper_rapier',
        'simplyswords:copper_sai',
        'simplyswords:copper_scythe',
        'simplyswords:copper_spear',
        'simplyswords:copper_twinblade',
        'simplyswords:copper_warglaive',
        'simplyswords:gold_chakram',
        'simplyswords:gold_claymore',
        'simplyswords:gold_cutlass',
        'simplyswords:gold_glaive',
        'simplyswords:gold_greataxe',
        'simplyswords:gold_greathammer',
        'simplyswords:gold_halberd',
        'simplyswords:gold_katana',
        'simplyswords:gold_longsword',
        'simplyswords:gold_rapier',
        'simplyswords:gold_sai',
        'simplyswords:gold_scythe',
        'simplyswords:gold_spear',
        'simplyswords:gold_twinblade',
        'simplyswords:gold_warglaive',
        'simplyswords:wood_chakram',
        'simplyswords:wood_claymore',
        'simplyswords:wood_cutlass',
        'simplyswords:wood_glaive',
        'simplyswords:wood_greataxe',
        'simplyswords:wood_greathammer',
        'simplyswords:wood_halberd',
        'simplyswords:wood_katana',
        'simplyswords:wood_longsword',
        'simplyswords:wood_rapier',
        'simplyswords:wood_sai',
        'simplyswords:wood_scythe',
        'simplyswords:wood_spear',
        'simplyswords:wood_twinblade',
        'simplyswords:wood_warglaive'
    ]
    HIDDEN_CLUTTER.forEach(id => {
        if (Item.exists(id)) {
            event.remove({ output: id })
        }
    })
})
