const dotPath = require('dot-prop')
const valid = require('./utils/validate')
const Grunt = require('./_model/grunt')

/**
 * Arbiter query class that wraps jsforce and provides schema mappings and Grunts from
 * query results
 *
 * @class Query
 */
class Query {
  /**
   * creates a new query instance
   * @param {Model} model - Model requesting query
   */
  constructor (model) {
    Object.defineProperties(this, {
      schema: {
        value: model.schema
      },
      model: {
        value: model
      }
    })
    // we have to always include the id (grunts need it to save)
    this._fields = new Set(['id'])
    this._mappings = new Set()
    this._where = {}
    this._sort = null
    this._limit = null
    this._skip = null
    this._errors = []
    this._singleReturn = false
  }

  /*
   * Adds `fields` to query state. These get expanded so that we have a set of all requested fields
   * and latter a set of the mapped, salesforce version of the fields.
   *
   */
  select (...fields) {
    try {
      this._fields = new Set(this.schema.expandFields([...this._fields, ...fields]))
      this._mappings = new Set(this.schema.mapFields([...this._fields]))
    } catch (e) {
      this._errors.push(e)
    }
    return this
  }

  fields (...fields) {
    return this.select(...fields)
  }

  where (opts = {}) {
    try {
      valid.checkType(opts, 'Object', `${this.model.name}.where(opts)`)
      const unmappedWhereClauseKeys = Object.keys(opts)
      const mappedWhereClauseKeys = this.schema.mapFields(unmappedWhereClauseKeys)
      this._where = mappedWhereClauseKeys.reduce((mappedWhereClause, key, idx) => {
        mappedWhereClause[key] = opts[unmappedWhereClauseKeys[idx]]
        return mappedWhereClause
      }, {})
    } catch (e) {
      this._errors.push(e)
    }
    // do an automatic findOne if id is in where clause and its not an array of ids
    if (this._where.Id && !Array.isArray(this._where.Id)) {
      this._singleReturn = true
    }
    return this
  }

  limit (count) {
    this._limit = count
    return this
  }

  skip (amount) {
    this._skip = amount
    return this
  }

  offset (amount) {
    this._skip = amount
    return this
  }

  // TODO: jsforce api allows field to be object containing field and dir
  sort (field, dir = 'ASC') {
    this.sort = {
      field,
      dir
    }
  }
  // one day
  with () {
    return this
  }

  then (onFulfilled, onRejected) {
    return this.doQuery().then(onFulfilled, onRejected)
  }

  execute () {
    return this.doQuery()
  }

  exec () {
    return this.doQuery()
  }

  // you got this
  doQuery () {
    if (this._errors.length) {
      return Promise.reject(new Error(`${this._errors.join(', ')}`))
    }
    const jsForceFindToCall = this._singleReturn ? 'findOne' : 'find'
    return this.model.jsforce()
      .then(sobject => {
        const query = sobject[jsForceFindToCall](this._where, [ ...this._mappings ])
        if (this._skip) {
          query.skip(this.skip)
        }
        if (this._limit) {
          query.limit(this._limit)
        }
        if (this._sort) {
          const field = this.schema.mapFields([this._sort.field])
          query.sort(field, this._sort.dir)
        }
        return query.execute()
      })
      .then(this.handleResult.bind(this))
      .then(this.maybeFetchAssociations.bind(this))
  }

  handleResult (queryResult) {
    const result = this._singleReturn ? queryResult : queryResult.records
    // remove attributes
    delete result.attributes
    const skeletons = this.createGruntSkeletons(result)
    return this._singleReturn
      ? new Grunt(skeletons, this.model, this.schema.proxyHandler)
      : skeletons.map(skeleton => new Grunt(skeleton, this.model, this.schema.proxyHandler))
  }

  maybeFetchAssociations (something) {
    return something
  }

  createGruntSkeletons (result) {
    if (this._singleReturn) {
      return this.formatGruntSkeleton(result)
    }
    return result.map(this.formatGruntSkeleton.bind(this))
  }

  formatGruntSkeleton (queryResult) {
    const fields = [ ...this._fields ]
    const mappings = [ ...this._mappings ]
    return fields.reduce((skeleton, field, idx) => {
      const onQueryResult = dotPath.get(queryResult, mappings[idx], null)
      dotPath.set(skeleton, field, onQueryResult)
      return skeleton
    }, {})
  }
}

module.exports = Query
