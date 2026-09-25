// Shows English Original Name and Item ID in Tooltips
ItemEvents.modifyTooltips(event => {
    event.modify('*', tooltip => {
        let item = tooltip.item
        if (!item) return
        let id = String(item.id)
        if (id.startsWith('minecraft:')) return

        let parts = id.split(':')
        if (parts.length > 1) {
            let enName = parts[1].split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
            tooltip.add(Text.of('§8Оригинал: ' + enName + '§r'))
            tooltip.add(Text.of('§8ID: ' + id + '§r'))
        }
    })
})
