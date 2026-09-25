// Client Script: Filter Technical Portal Multiblock Parts from JEI / REI / EMI
// Only 'kubejs:infernal_portal_frame' (Обсидиан Преисподней) remains visible as the craftable/buildable block.

RecipeViewerEvents.removeEntries('item', event => {
    const TECHNICAL_PORTAL_PARTS = [
        'kubejs:infernal_portal_frame_active',
        'kubejs:infernal_portal_frame_eye_left',
        'kubejs:infernal_portal_frame_eye_right',
        'kubejs:infernal_portal_corner_dormant',
        'kubejs:infernal_portal_corner_active',
        'kubejs:infernal_portal_pillar_dormant',
        'kubejs:infernal_portal_pillar_active',
        'kubejs:infernal_portal_pillar_left_dormant',
        'kubejs:infernal_portal_pillar_right_dormant',
        'kubejs:infernal_portal_pillar_left_active',
        'kubejs:infernal_portal_pillar_right_active',
        'kubejs:infernal_portal_pillar_bottom_left_dormant',
        'kubejs:infernal_portal_pillar_bottom_right_dormant',
        'kubejs:infernal_portal_pillar_bottom_left_active',
        'kubejs:infernal_portal_pillar_bottom_right_active',
        'kubejs:infernal_portal_pillar_middle_left_dormant',
        'kubejs:infernal_portal_pillar_middle_right_dormant',
        'kubejs:infernal_portal_pillar_middle_left_active',
        'kubejs:infernal_portal_pillar_middle_right_active',
        'kubejs:infernal_portal_pillar_top_left_dormant',
        'kubejs:infernal_portal_pillar_top_right_dormant',
        'kubejs:infernal_portal_pillar_top_left_active',
        'kubejs:infernal_portal_pillar_top_right_active',
        'kubejs:infernal_portal_threshold_dormant',
        'kubejs:infernal_portal_threshold_active',
        'kubejs:infernal_portal_keystone_left_dormant',
        'kubejs:infernal_portal_keystone_right_dormant'
    ]

    TECHNICAL_PORTAL_PARTS.forEach(id => {
        event.remove(id)
    })
})
