


const getSelect = ({schema, filterSelect}) => {
    try {
    if (!schema?.attributes) return null
    if (Object.keys(schema?.attributes).length <= 0) return null

    let select = Object.keys(schema?.attributes).filter(key => {
        const value = schema?.attributes[key]
        if (value?.relation) {
            return false
        } else {
            return true
        }
    })
    if (Array.isArray(filterSelect) && filterSelect.length > 0) {
        select = select.filter(s => !filterSelect.includes(s))
    }
    
    if (!select.includes("id")) {
        select.push("id")   
    }
    return select
    } catch (error) {
        return null
    }
    
}


module.exports = {
    getSelect
}