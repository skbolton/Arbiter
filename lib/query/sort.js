const valid = require('../utils/validate')

class Sort {
  constructor (schema) {
    this.schema = schema
    this.sort = {}
  }

  add (opts) {
    if (valid.getType(opts) === 'string') {
      return this.buildSortObject(opts)
    }
    this.sort = opts
    return this
  }

  buildSortObject (str) {
    const parts = str.split(' ')
    this.sort = parts.reduce((sortObj, part) => {
      if (part.startsWith('-')) {
        sortObj[part.slice(1)] = -1
        return sortObj
      }
      sortObj[part] = 1
      return sortObj
    }, {})
    return this
  }

  build () {
    // schema could throw if passed unknown field
    try {
      const unmappedSortFields = Object.keys(this.sort)
      if (unmappedSortFields.length < 1) {
        return null
      }
      const mappedSortFields = this.schema.mapFields(unmappedSortFields)
      const jsForceReadySort = mappedSortFields.reduce((jsForceSort, mappedKey, idx) => {
        jsForceSort[mappedKey] = this.sort[unmappedSortFields[idx]]
        return jsForceSort
      }, {})
      // return sort object or null to signify no sorting needed
      return jsForceReadySort
    } catch (e) {
      return e
    }
  }
}

module.exports = Sort
