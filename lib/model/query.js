const valid = require('../../utils/validate')

class Query {
  constructor (fields, wheres, schema) {
    this.schema = schema
    this.fields = fields
    this.wheres = wheres
    this.fieldMappings = schema.mapFields(fields)
    const select = this.buildSelect()
    const from = schema.sfObject
    const where = this.buildWhere()
    this.queryString = `${select} ${from} ${where}`
  }

  buildSelect () {
    return `SELECT ${this.fieldMappings.join(', ')}`
  }

  buildWhere () {
    if (this.wheres.size === 0) {
      return ''
    }
    // seperate keys and values. Keys need to get mapped to SF version
    // values need to be analyzed to build query correctly
    const keys = []
    const values = []
    for (const [ key, value ] of this.wheres.entries()) {
      keys.push(key)
      values.push(value)
    }
    const mappedKeys = this.schema.mapFields(keys)
    // the final array of mapped strings that will get joined
    const whereClauses = []
    mappedKeys.forEach((key, idx) => {
      const value = values[idx]
      const type = valid.getType(value)
      if (key === 'raw') {
        whereClauses.push(value)
      }
      if (type === 'null') {
        whereClauses.push(`${key} = null`)
      }
      if (type === 'Array') {
        whereClauses.push(
          Query.inject(`${key} IN @value`, { value })
        )
      }
      if (type === 'number' || type === 'string') {
        whereClauses.push(
          `${key} = '${value}'`
        )
      }
      // value at key is an object and needs logic to parse correctly
      if (type === 'Object') {
        whereClauses.push(Query.complexWhere(key, value))
      }
    })
    return `WHERE ${whereClauses.join(' AND ')}`
  }

  static inject (query, params = {}, quotes = true) {
    return Object.keys(params).reduce((newQuery, key) => {
      // stringify array values
      if (Array.isArray(params[key])) {
        let joinedStr = params[key].join("', '")
        joinedStr = `('${joinedStr}')`
        return newQuery.replace(`@${key}`, joinedStr)
      }
      const replacement = quotes
      ? `'${params[key]}'`
      : params[key]
      return newQuery.replace(`@${key}`, replacement)
    }, query)
  }

  static complexWhere (key, value) {
    let option
    if ('like' in value) {
      option = value.like
      return `${key} LIKE '${option}'`
    }
    if ('not' in value) {
      option = value.not
      if (Array.isArray(option)) {
        return Query.inject(`${key} NOT IN @option`, { option })
      } else {
        return `${key} != ${option}`
      }
    }
    if ('notlike' in value) {
      option = value.notlike
      return `(NOT ${key} LIKE '${option}')`
    }
  }
}

module.exports = Query
