const valid = require('../utils/validate')

class Where {
  constructor (schema) {
    this.schema = schema
    this.where = {}
  }

  add (opts) {
    if (valid.getType(opts) === 'string') {
      this.where.RAW = opts
      return this
    }
    this.where = opts
  }

  build () {
    if (this.where.RAW) {
      return this.where.RAW
    }
    try {
      const unmappedWhereClauses = Object.keys(this.where)
      const mappedWhereClauseKeys = this.schema.mapFields(
        unmappedWhereClauses
      )
      return mappedWhereClauseKeys.reduce(
        (mappedWhereClause, key, idx) => {
          mappedWhereClause[key] = this.where[unmappedWhereClauses[idx]]
          return mappedWhereClause
        },
        {}
      )
    } catch (e) {
      return e
    }
  }
}

module.exports = Where
