const dotPath = require('dot-prop')
const Grunt = require('../grunt')
const Fields = require('./fields')
const Where = require('./where')
const Sort = require('./sort')
const Modifier = require('./modifier')
const Association = require('./association')
const Restrictions = require('./restrictions')
const Thrower = require('./thrower')

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
    this._fields = new Fields(this.schema)
    this._where = new Where(this.schema)
    this._associations = new Association(this.model)
    this._sort = new Sort(this.schema)
    this._modifier = new Modifier()
    this._singleReturn = false
    this._thrower = new Thrower()
    this._restrictions = new Restrictions(this.schema)
  }

  /*
   * Sets the select state of query. Requested fields get expanded and mapped to
   * the values that they are in salesforce which is later passed to jsforce
   * accepted argument shape:
   *   .select('field', 'field2', 'field3')
   *   .select([ 'field', 'field2', 'field3' ])
   *   .select('field1, field2, field3')
   */
  select (...args) {
    this._fields.add(args)
    return this
  }

  // alias for select
  fields (...args) {
    return this.select(args)
  }

  /**
   * Sets the where clause filters for query.
   * Clause fields get mapped to what they are in salesforce
   */
  where (opts = {}) {
    this._where.add(opts)
    return this
  }

  limit (amount) {
    this._modifier.addLimit(amount)
    return this
  }

  skip (amount) {
    this._modifier.addSkip(amount)
    return this
  }

  // Alias for skip
  offset (amount) {
    return this.skip(amount)
  }

  first () {
    this._singleReturn = true
    return this
  }

  sort (opts) {
    this._sort.add(opts)
    return this
  }

  /**
   * Queries for associated Models as configured on the Model
   * @param {String} association - association to query for
   * @param {function} queryCb   - function to refine query
   */
  with (associations, callback) {
    this._associations.add(associations, callback)
    // query has to have the fields needed to join the associations
    return this.select(this._associations.getSelects())
  }

  /**
   * Verifies that results do not come back empty
   * Throws error if results are empty
   * Arguments can be either an Error instance or a string which becomes the error message
   */
  throwIfNotFound (error = new Error(`${this.model.name} not found`)) {
    this._thrower.add(error)
    return this
  }

  /**
   * Restricts the mutations that can be done on grunts returned by query
   * All fields in `mutations` have to be writable in schema
   */
  allowMutations (mutations) {
    this._restrictions.allow(mutations)
    return this
  }

  /**
   * Restrictsmutations that can be done on grunts returned by query
   * All fields in `mutations` have to be writable in schema
   */
  rejectMutations (mutations) {
    this._restrictions.reject(mutations)
    return this
  }

  /*
   * QUERY EXECUTION METHODS
   */

  then (onFulfilled, onRejected) {
    return this.executeQuery().then(onFulfilled, onRejected)
  }

  execute () {
    return this.executeQuery()
  }

  exec () {
    return this.executeQuery()
  }

  executeQuery () {
    const select = this._fields.build()
    const whereClauses = this._where.build()
    const modifiers = this._modifier.build()
    const sort = this._sort.build()
    const restrictions = this._restrictions.build()
    const associations = this._associations.build()

    const checks = [ select, whereClauses, sort, restrictions, associations, modifiers ]
    const errors = checks.filter(check => check instanceof Error)
    if (errors.length) {
      return Promise.reject(new Error(`${errors.join(', ')}`))
    }

    return this.model.sobject()
      .then(sobject => {
        const query = sobject.find(whereClauses, [ ...select.mappings ])
        if (this._singleReturn) {
          query.limit(1)
        }
        if (modifiers.skip) {
          query.skip(modifiers.skip)
        }
        if (modifiers.limit) {
          query.limit(modifiers.limit)
        }
        if (sort) {
          query.sort(sort)
        }
        return query.execute()
      })
      .then(queryResults => this._thrower.throwIfNeeded(queryResults))
      .then(queryResults =>
        this.createGrunts(queryResults, select.fields, select.mappings, restrictions)
      )
      .then(grunts => this._associations.fetch(grunts))
      .then(grunts => this.handleSingleReturn(grunts))
  }

  handleSingleReturn (results) {
    return this._singleReturn ? results[0] : results
  }

  createGrunts (results, fields, mappings, restrictions) {
    return results
      .map(queryResult =>
        fields.reduce((skeleton, field, idx) => {
          const onQueryResult = dotPath.get(queryResult, mappings[idx], null)
          dotPath.set(skeleton, field, onQueryResult)
          return skeleton
        }, {})
      )
      .map(
        skeleton =>
          new Grunt(
            skeleton,
            this.model.sobject.bind(this.model),
            this.schema.proxyHandler,
            { rejectMutations: restrictions }
          )
      )
  }
}

module.exports = Query
