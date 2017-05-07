const valid = require('../../utils/validate')
const Query = require('./query')

const _name = Symbol('name')
const _schema = Symbol('schema')
const _arbiter = Symbol('arbiter')

/**
 * Model representing a Salesforce object for easy querying and writing.
 *
 * @class Model
 */
class Model {
  constructor (name, arbiter, schema) {
    Object.defineProperty(this, 'name', {
      value: name
    })
    this[_arbiter] = arbiter
    this[_schema] = schema
    this._fields = []
    this._mappings = []
    this._where = new Map()
    this._with = {}
  }

  /**
   * Gets a pool connection from pool manager
   *
   * @returns Promise
   *
   * @memberof Model
   */
  getConnection () {
    return this[_arbiter].getConnection()
  }

  /**
   * Takes in options and uses them to build up `_where` state on Model. If no options are passed in function becomes noop and forwards Model for chaining
   *
   * @param {object} opts
   * @chainable
   * @returns Model
   *
   * @memberof Model
   */
  find (opts) {
    const query = new Query(this, this[_schema])
    if (opts) {
      valid.checkType(opts, 'Object', `${this[_name]}.find(opts)`)
      query.where(opts)
    }
    return query
  }

  /**
   * Adds `id` into Model `_where` state for next query. Causes query to only return a single result instead of collection
   *
   * @param {string|number} id
   * @chainable
   * @returns Model
   * @memberof Model
   */
  findById (id) {
    if (id === undefined) {
      throw new Error(`${this.name}.findById(id) needs id to be defined`)
    }
    return new Query(this, this[_schema]).where({ id })
  }

  /**
   * Takes in array of `ids` and adds them to Model `_where` state for next query
   *
   * @param {array} ids
   * @chainable
   * @returns Model
   *
   * @memberof Model
   */
  findByIds (ids) {
    valid.checkType(ids, 'Array', `${this[_name]}.findByIds(ids)`)
    return new Query(this, this[_schema]).where({ id: ids })
  }

  new (fields = {}) {
    return fields
  }

  /**
   * Injects values into a query string. If value at key on `params` is an array then it stringifies the array and surrounds in () even if `quotes` is set to false. If `quotes` is passed in as false values are not injected with quotation marks
   *
   * @param {string} query
   * @param {object} [params={}]
   * @param {boolean} [quotes=true]
   * @returns string
   *
   * @memberof Model
   */
  inject (query, params = {}, quotes = true) {
    valid.checkType(query, 'string', `${this[_name]}.inject(query, .., ..)`)
    valid.checkType(params, 'Object', `${this[_name]}.inject(.., params, ..)`)
    return Query.inject(query, params, quotes)
  }

  query (query) {

  }

  RAW (query) {
    return valid
      .checkTypeAsync(query, 'string', `${this[_name]}.RAW(query)`)
  }
}

module.exports = Model
