const util = require('util')
const dotPath = require('dot-prop')
const validate = require('../../utils/validate')
const docProto = require('./doc')

const modelProto = {

  /**
   * Takes in a set of options to build up `Model._where`. If no options are passed becomes noop and moves Model along for chaining
   *
   * @param {object} opts
   * @returns Model
   */
  find (opts) {
    if (opts) {
      validate.checkType(opts, 'Object', `${this.__name}.find(opts)`)
      this.where(opts)
    }
    return this
  },

  /**
   * Adds passed in `id` on `Model._where`
   *
   * @param {any} id
   * @returns Model
   */
  findById (id) {
    this.where({ id: id })
    return this
  },

  /**
   * Adds `ids` to `Model._where`
   *
   * @param {array} ids
   * @returns Model
   */
  findByIds (ids) {
    validate.checkType(ids, 'Array', `${this.__name}.findByIds(ids)`)
    this.where({ id: ids })
    return this
  },

  /**
   * Outputs to console internal state of Model for debugging
   *
   * @returns Model
   */
  explain () {
    const explanation = {
      SFObject: this.__schema.sfObject,
      fields: this._fields,
      where: this._where,
      query: this.buildQuery()
    }
    console.log(util.inspect(explanation, { colors: true, depth: null }))
    return this
  },

  /**
   * Sets properties on Model._fields based off `args` passed in. '*' gets converted into all keys, and '.' gets converted to all of Models local fields. 'id' will always be injected in Model._fields. Lastly, Model goes to its schema to expand any `args` that are schemas to all of their local fields.
   *
   * @param {string} args
   * @returns Model
   */
  fields (...args) {
    const requestedFields = new Set(args)
    if (requestedFields.has('*')) {
      this._fields = this.__schema.getAllFields()
      return this
    }
    if (requestedFields.has('.')) {
      const dotIndex = args.findIndex(field => field === '.')
      args = [
        ...args.slice(0, dotIndex),
        // replace '.' with all of localfields
        ...this.__schema.getLocalFields(),
        ...args.slice(dotIndex + 1)
      ]
      requestedFields.add('id')
    }
    if (!requestedFields.has('id')) {
      args = [
        'id',
        ...args
      ]
    }
    this._fields = this.__schema.expandFields(args)
    return this
  },

  /**
   * Adds `opts` to `Model._where`
   *
   * @param {object} opts
   * @returns Model
   */
  where (opts) {
    validate.checkType(opts, 'Object', `${this.__name}.where(opts)`)
    Object.keys(opts).forEach(key => this._where.set(key, opts[key]))
    return this
  },

  with (opts) {
    validate.checkType(opts, 'Object', `${this.__name}.where(opts)`)
    return this
  },

  /**
   * Given a collection of Salesforce query results this will loop through them and create doc instances for each one
   *
   * @param {array} results
   * @returns {array} docs
   */
  createDocs (results) {
    return results.map(this.doc.bind(this))
  },

  /**
   * Takes in a mapped result and sets up a prototype chain so that fields can be edited on object and saved back up to SalesForce
   *
   * @param {object} result
   * @returns Proxied object
   */
  doc (result) {
    // docs inherit from Model so they can get access to pool for saving
    const proto = Object.create(this)
    Object.assign(proto, docProto)
    const instance = Object.create(proto)
    // add all the result fields to the object
    Object.assign(instance, result)
    Object.defineProperties(instance, {
      '__changeset': {
        value: {},
        configurable: true
      },
      Id: {
        value: result.id
      },
      'sfObject': {
        value: this.__schema.sfObject
      }
    })
    // set up a proxy to deal with writables
    return new Proxy(instance, this.__schema.writablesProxy)
  },

  /**
   * Takes state of Model (_fields and _where) in order to build up a query string
   *
   * @returns string
   */
  buildQuery () {
    const select = this.buildSelect()
    const from = `FROM ${this.__schema.sfObject}`
    const where = this.buildWhere()
    return `${select} ${from} ${where}`
  },

  /**
   * Builds up SELECT portion of query to Salesforce. If `Model._mapping` hasn't been created then it builds up the mapping.
   *
   * @returns string
   */
  buildSelect () {
    if (this._mappings.length === 0) {
      this._mappings = this.__schema.mapFields(this._fields)
    }
    return `SELECT ${this._mappings.join(', ')}`
  },

  // TODO: This function could use some cleanup
  /**
   * Builds up the WHERE portion of query to Salesforce
   * There are a few options that can be on a `Model._where` key:
   *   field: 'value',
   *   field: [array of values],
   *   field: { not: 'value' },
   *   field: { like: 'value' },
   *   field: { notlike: 'value' }
   *
   * @returns string
   */
  buildWhere () {
    if (this._where.size === 0) {
      return ''
    }
    // seperate keys and values. Keys need to get mapped to SF version
    // values need to be analyzed to build query correctly
    const keys = []
    const values = []
    for (const [ key, value ] of this._where.entries()) {
      keys.push(key)
      values.push(value)
    }
    const mappedKeys = this.__schema.mapFields(keys)
    // the final array of mapped strings that will get joined
    const whereClauses = []
    mappedKeys.forEach((key, idx) => {
      const value = values[idx]
      const type = validate.getType(value)
      if (type === 'null') {
        whereClauses.push(`${key} = null`)
      }
      if (type === 'Array') {
        whereClauses.push(
          this.inject(`${key} IN @value`, { value })
        )
      }
      if (type === 'number' || type === 'string') {
        whereClauses.push(
          `${key} = '${value}'`
        )
      }
      // value at key is an object and needs logic to parse correctly
      if (type === 'Object') {
        // this part sucks
        let option
        if ('like' in value) {
          option = value.like
          whereClauses.push(
            `${key} LIKE '${option}'`
          )
        }
        if ('not' in value) {
          option = value.not
          if (Array.isArray(option)) {
            whereClauses.push(
              this.inject(`${key} NOT IN @option`, { option })
            )
          } else {
            whereClauses.push(
              `${key} != ${option}`
            )
          }
        }
        if ('notlike' in value) {
          option = value.notlike
          whereClauses.push(
            `(NOT ${key} LIKE '${option}')`
          )
        }
      }
    })
    return `WHERE ${whereClauses.join(' AND ')}`
  },

  /**
   * Takes the fields that a model is going to query and builds up a skeleton object of the results. Keys are set to null so that they don't get stripped out by JSON when sent to client
   *
   * fields ['id' 'project.proposal.name'] -> {
   *    id: null,
   *    project: {
   *      proposal: {
   *       name: null
   *     }
   *   }
   * }
   *
   * @returns Object
   */
  getResultSkeleton () {
    const result = {}
    this._fields.forEach(field => {
      if (~field.search(/\./)) {
        dotPath.set(result, field, null)
      } else {
        result[field] = null
      }
    })
    return result
  },

  /**
   * Takes a singe salesforce query response object and maps its values over to a skeleton object.
   *
   * @param {object} queryResult
   * @returns object
   */
  mapResult (queryResult) {
    // more metadata that salesforce adds
    delete queryResult.attributes
    const skeleton = this.getResultSkeleton()
    this._fields.forEach((field, idx) => {
      const queryValue = dotPath.get(
        queryResult,
        this._mappings[idx],
        null // default to null (undefined gets stripped by JSON)
        )
      dotPath.set(skeleton, field, queryValue)
    })
    return skeleton
  },

  /**
   * Resets the state of Model after query has been executed
   *
   */
  clearQuery () {
    this._where.clear()
    this._fields = []
    this._mappings = []
  },

  /**
   * Takes a string and a `params` object and replaces all the keys in `params` with the values at its key. Any values that are arrays are automatically stringified and surrounded by (). Quotes are injected by default but can be set to false with `quotes`
   *
   * @param {string} query
   * @param {object} [params={}]
   * @param {boolean} [quotes=true]
   * @returns string
   */
  inject (query, params = {}, quotes = true) {
    validate.checkType(query, 'string', `${this.__name}.inject(query, .., ..)`)
    validate.checkType(params, 'Object', `${this.__name}.inject(.., params, ..)`)
    return Object.keys(params).reduce((newQuery, key) => {
      // is key: value an array
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
  },

  /**
   * Creates a new doc instance. All `fields` passed in get added as keys on doc. Any that are writable get set up so that doc can be saved().
   *
   * @param {object} [fields={}]
   * @returns doc
   */
  new (fields = {}) {
    const doc = Object.create(this)
    Object.assign(doc, docProto)
    doc.changeset = {}
    return doc
  },

  // Async Functions

  /**
   * Takes state of Model, builds query, executes the query, and then creates doc instances for every result.
   *
   * @returns array
   */
  exec () {
    if (this._fields.length === 0) {
      this._fields = this.__schema.getAllFields()
    }
    // get mappings for fields
    this._mappings = this.__schema.mapFields(this._fields)
    return this.getConnection()
      .then(conn => conn.queryAsync(this.buildQuery()))
      .then(({ records }) => {
        // salesforce adds some metadata that is not needed
        delete records.attributes
        return records
      })
      .then(queryResult => {
        // if the id where clause is single value only return one result
        const idClause = this._where.has('id')
        if (idClause && !Array.isArray(idClause)) {
          return this.mapResult(queryResult[0])
        }
        return queryResult.map(this.mapResult, this)
      })
      .then(this.createDocs.bind(this))
  },

  /**
   * Takes in a query and runs it against salesforce mapping the result according to schema.
   *
   * @param {string} query
   * @returns array
   */
  query (query) {
    return validate
      .checkTypeAsync(query, 'string', `${this.__name}.query(query)`)
      .then(this.getConnection.bind(this))
      .then(conn => conn.queryAsync(query))
      .then(data => data.records)
  },

  /**
   * Bypasses all of Arbiter's mapping and executes passed in query giving back raw SF response.
   *
   * @param {string} query
   * @returns array
   */
  RAW (query) {
    return validate
      .checkTypeAsync(query, 'string', `${this.__name}.RAW(query)`)
      .then(() => this.getConnection())
      .then(conn => conn.queryAsync(query))
  }

}

module.exports = modelProto
