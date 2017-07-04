const valid = require('../utils/validate')
const objEach = require('../utils/object-each')
const Query = require('./query')
const Grunt = require('./grunt')

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
  }

  get sfObject () {
    return this[_schema].sfObject
  }

  get schema () {
    return this[_schema]
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
   * Fetches Model by `name` from arbiter registry
   *
   * @param {string} name
   * @returns Model
   *
   * @memberof Model
   */
  getModel (name) {
    return this[_arbiter].getModel(name)
  }

  /**
   * Gets the field that a model relates to another one if one exists
   *
   * @param {string} sfObject
   * @returns
   *
   * @memberof Model
   */
  getRelField (sfObject) {
    return this[_schema].getRel(sfObject)
  }

  /**
   * Creates a Query instance and passes `opts` into query `_where` state
   *
   * @param {object} opts
   * @returns Query
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
   * Creates Query instance and passes `id` to query `_where` state
   *
   * @param {string|number} id
   * @returns Query
   * @memberof Model
   */
  findById (id) {
    if (id === undefined) {
      throw new Error(`${this.name}.findById(id) needs id to be defined`)
    }
    return new Query(this, this[_schema]).where({ id })
  }

  /**
   * Creates Query and adds `ids` to query `_where` state
   *
   * @param {array} ids
   * @returns Query
   *
   * @memberof Model
   */
  findByIds (ids) {
    valid.checkType(ids, 'Array', `${this[_name]}.findByIds(ids)`)
    return new Query(this, this[_schema]).where({ id: ids })
  }

  /**
   * Creates a new empty grunt based off of Model
   *
   * @param {object} [fields={}] fields to add to new grunt
   * @returns
   *
   * @memberof Model
   */
  new (fields = {}) {
    const grunt = new Grunt({}, this, this[_schema].proxyHandler)
    objEach(fields, (field, value) => {
      grunt[field] = value
    })
    return grunt
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
