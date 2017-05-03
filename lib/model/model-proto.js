const util = require('util')
const dotPath = require('dot-prop')
const gandalf = require('../../utils/gandalf')
const docProto = require('./doc')

const modelProto = {

  find (opts) {
    if (opts) {
      gandalf.checkType(opts, 'Object', `${this.name}.find(opts)`)
      this.where(opts)
    }
    return this
  },

  findById (id) {
    this.where({ id: id })
    return this
  },

  findByIds (ids) {
    gandalf.checkType(ids, 'Array', `${this.name}.findByIds(ids)`)
    this.where({ id: ids })
    return this
  },

  explain () {
    const explanation = {
      SFObject: this._schema.sfObject,
      fields: this._fields,
      where: this._where,
      query: this.buildQuery()
    }
    console.log(util.inspect(explanation, { colors: true, depth: null }))
    return this
  },

  fields (...args) {
    const requestedFields = new Set(args)
    if (requestedFields.has('*')) {
      this._fields = this._schema.getAllFields()
      return this
    }
    if (requestedFields.has('.')) {
      const dotIndex = args.findIndex(field => field === '.')
      args = [
        ...args.slice(0, dotIndex),
        ...this._schema.getLocalFields(),
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
    this._fields = this._schema.expandFields(args)
    return this
  },

  where (opts) {
    gandalf.checkType(opts, 'Object', `${this.name}.where(opts)`)
    Object.keys(opts).forEach(key => this._where.set(key, opts[key]))
    return this
  },

  with (opts) {
    gandalf.checkType(opts, 'Object', `${this.name}.where(opts)`)
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
      '_changeset': {
        value: {},
        configurable: true
      },
      Id: {
        value: result.id
      },
      'sfObject': {
        value: this._schema.sfObject
      }
    })
    // set up a proxy to deal with writables
    return new Proxy(instance, this._schema.writablesProxy)
  },

  buildQuery () {
    const select = this.buildSelect()
    const from = `FROM ${this._schema.sfObject}`
    const where = this.buildWhere()
    return `${select} ${from} ${where}`
  },

  buildSelect () {
    if (this._mappings.length === 0) {
      this._mappings = this._schema.mapFields(this._fields)
    }
    return `SELECT ${this._mappings.join(', ')}`
  },

  // TODO: This function could use some cleanup
  buildWhere () {
    if (this._where.size === 0) {
      return ''
    }
    const keys = []
    const values = []
    for (const [ key, value ] of this._where.entries()) {
      keys.push(key)
      values.push(value)
    }
    const mappedKeys = this._schema.mapFields(keys)
    const whereClauses = []
    mappedKeys.forEach((key, idx) => {
      const value = values[idx]
      const type = typeof value
      if (value === null) {
        whereClauses.push(`${key} = null`)
      }
      if (Array.isArray(value)) {
        whereClauses.push(
          this.inject(`${key} IN @value`, { value })
        )
      }
      if (type === 'number' || type === 'string') {
        whereClauses.push(
          `${key} = '${value}'`
        )
      }
      if (type === 'object' && value !== null) {
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

  clearQuery () {
    this._where.clear()
    this._fields = []
    this._mappings = []
  },

  inject (query, params = {}, quotes = true) {
    gandalf.checkType(query, 'string', `${this.name}.inject(query, .., ..)`)
    gandalf.checkType(params, 'Object', `${this.name}.inject(.., params, ..)`)
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

  new (fields = {}) {
    const doc = Object.create(this)
    Object.assign(doc, docProto)
    doc.changeset = {}
    return doc
  },

  // Async Functions

  exec () {
    if (this._fields.length === 0) {
      this._fields = this._schema.getAllFields()
    }
    // get mappings for fields
    this._mappings = this._schema.mapFields(this._fields)
    return this.getConnection()
      .then(conn => conn.queryAsync(this.buildQuery()))
      .then(({ records }) => {
        // salesforce adds some metadata that is not needed
        delete records.attributes
        return records
      })
      .then(queryResult => queryResult.map(this.mapResult.bind(this)))
      .then(this.createDocs.bind(this))
  },

  query (query) {
    return gandalf.async.checkType(query, 'string', `${this.name}.query(query)`)
  },

  RAW (query) {
    return gandalf.async.checkType(query, 'string', `${this.name}.RAW(query)`)
    .then(() => this.getConnection())
    .then(conn => conn.queryAsync(query))
    .then(data => data.records)
  }

}

module.exports = modelProto
