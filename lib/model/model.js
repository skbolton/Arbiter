const util = require('util')
const valid = require('../../utils/validate')
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
    this[_name] = name
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
    if (opts) {
      valid.checkType(opts, 'Object', `${this[_name]}.find(opts)`)
      this.where(opts)
    }
    return this
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
    this.where({ id })
    return this
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
    this.where({ id: ids })
    return this
  }

  /**
   * Outputs state of Model for debugging purposes
   *
   * @chainable
   * @returns Model
   *
   * @memberof Model
   */
  explain () {
    const explanation = {
      SalesforceObject: this[_schema].sfObject,
      fields: this._fields,
      where: this._where,
      query: new Query(this._fields, this._where, this[_schema]).queryString
    }

    console.log(util.inspect(explanation, { colors: true, depth: null }))
    return this
  }

  /**
   * Resets state of Model after a query has been executed
   *
   * @memberof Model
   */
  clearState () {
    this._where.clear()
    this._fields = []
    this._mappings = []
    this._with = {}
  }

  new (fields = {}) {
    return fields
  }

  /**
   * Creates grunt instances. If 'id' is a field in Model `_where` state, and it is not a collection of ids, then it will return only one instance of Grunt
   *
   * @param {array} queryResults
   * @returns [Grunt] | Grunt
   *
   * @memberof Model
   */
  createGrunts (queryResults) {
    const hasId = this._where.has('id')
    if (hasId && !Array.isArray(hasId)) {
      // only need to create a single grunt
      const [ result ] = queryResults
      return new Grunt(result, this, this[_schema])
    } else {
      return queryResults.map(result => new Grunt(result, this, this[_schema]))
    }
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

  /**
   * Takes in a list of fields to add to Model `_field` state. Any `field` that is a Schema root will be expanded into all of its local fields by Schema.
   *
   * @param {array} args
   * @chainable
   * @returns Model
   *
   * @memberof Model
   */
  fields (...fields) {
    const requestedFields = new Set(fields)
    if (requestedFields.has('*')) {
      this._fields = this[_schema].getAllFields()
      return this
    }
    if (requestedFields.has('.')) {
      const dotIndex = fields.findIndex(field => field === '.')
      fields = [
        ...fields.slice(0, dotIndex),
        ...this[_schema].getLocalFields(),
        ...fields.slice(dotIndex + 1)
      ]
      requestedFields.add('id')
    }
    if (!requestedFields.has('id')) {
      fields = [
        'id',
        ...fields
      ]
    }
    this._fields = this[_schema].expandFields(fields)
    return this
  }

   /**
    * Builds up `_where` state on Model
    *
    * @param {object} opts
    * @chainable
    * @returns Model
    *
    * @memberof Model
    */
  where (opts) {
    valid.checkType(opts, 'Object', `${this[_name]}.where(opts)`)
    Object.keys(opts).forEach(key => this._where.set(key, opts[key]))
    return this
  }

  /**
   * Adds fetching of associated salesforce objects to query
   *
   * @param {string} assoc - name of association to fetch
   * @chainable
   * @returns Model
   * @memberof Model
   */
  with (assoc) {
    valid.checkType(assoc, 'string', `${this[_name]}.with(assoc)`)
    const withModel = this[_schema].getAssoc(assoc)
    if (!withModel) {
      throw new Error(`${this[_name]} does not have assoc with ${assoc}`)
    }
    this._with[assoc] = withModel
    return this
  }

  // ------- ASYNC FUNCTIONS ----------

  /**
   * Takes `_field`, `_where`, and `_with` state on Model and executes query.
   *
   * @returns [Grunt] | Grunt
   *
   * @memberof Model
   */
  exec () {
    const query = new Query(this._fields, this._where, this[_schema])
    this._mappings = query.fieldMappings
    return this[_arbiter].getConnection()
      .then(conn => conn.queryAsync(query.queryString))
      .then(({ records }) => {
        // salesforce adds some metadata that is not needed
        delete records.attributes
        return records
      })
      .then(this.createGrunts.bind(this))
  }

  query (query) {

  }

  RAW (query) {
    return valid
      .checkTypeAsync(query, 'string', `${this[_name]}.RAW(query)`)
  }
}

module.exports = Model
