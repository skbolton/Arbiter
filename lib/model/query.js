// const util = require('util')
const valid = require('../../utils/validate')
const Grunt = require('./grunt')

/**
 * Helper class to build and execute salesforce queries
 *
 * @class Query
 */
class Query {
  /**
   * Creates an instance of Query.
   * @param {object} model
   * @param {Schema} schema
   *
   * @memberof Query
   */
  constructor (model, schema) {
    Object.defineProperties(this, {
      schema: {
        value: schema
      },
      model: {
        value: model
      }
    })
    this._fields = new Set()
    this._mappings = new Set()
    this._where = new Map()
    this._with = {}
    this._queryString = ''
  }

  /**
   * Assigns `fields` to query state. 'id' field is always added for user, '*' gets expanced to all fields, and '.' expands to local fields of schema. Any requested field that is a schema instance gets expanded to all of its local fields
   *
   * @param {string} fields
   * @chainable
   * @returns Query
   *
   * @memberof Query
   */
  fields (...fields) {
    this._fields = new Set()
    // always add top level id
    this._fields.add('id')
    for (let field of fields) {
      if (field === '*') {
        const allFields = this.schema.getAllFields()
        this._fields = new Set(allFields)
        break
      }
      if (field === '.') {
        const locals = this.schema.getLocalFields()
        for (let local of locals) {
          this._fields.add(local)
        }
        continue
      }
      this._fields.add(field)
    }
    this._fields = new Set(this.schema.expandFields([...this._fields]))
    return this
  }

  /**
   * Assigns `opts` to query state.
   *
   * @param {object} opts
   * @chainable
   * @returns Query
   *
   * @memberof Query
   */
  where (opts) {
    valid.checkType(opts, 'Object', `${this.model.name}.where(opts)`)
    Object.keys(opts).forEach(key => this._where.set(key, opts[key]))
    return this
  }

  /**
   * Adds associated Models to query state
   *
   * @param {string} assoc
   * @chainable
   * @returns Query
   *
   * @memberof Query
   */
  with (assoc) {
    valid.checkType(assoc, 'string', `${this.model.name}.with(assoc)`)
    const withModel = this.schema.getAssoc(assoc)
    if (!withModel) {
      throw new Error(`${this.model.name} does not have association with key of ${assoc}`)
    }
    this._with[assoc] = withModel
    return this
  }

  // TODO: this function needs a way to accept a custom logger
  /**
   * Logs the internal state of query to inspect values and query that would get executed
   *
   * @param {function} fn
   * @chainable
   * @returns Query
   *
   * @memberof Query
   */
  explain (fn) {
    const state = {
      SalesForceObject: this.schema.sfObject,
      fields: [...this._fields],
      where: this._where,
      query: this.buildQuery()
    }
    fn(state)
    return this
  }

  /**
   * Builds up query and exectues a salesforce query. Then takes all results and creates Grunt instances
   *
   * @returns [Grunt] | Grunt
   *
   * @memberof Query
   */
  exec () {
    if (this._fields.size === 0) {
      this.fields('*')
    }
    const mappings = this.schema.mapFields(...this._fields)
    this._mappings = new Set(mappings)
    this._queryString = this.buildQuery()
    return this.model.getConnection()
      .then(conn => conn.queryAsync(this._queryString))
      .then(({ records }) => {
        // delete sf metadata
        delete records.attributes
        return records
      })
      .then(queryResults => {
        delete queryResults.attributes
        const hasId = this._where.has('id')
        if (hasId && !Array.isArray(hasId)) {
          const [ result ] = queryResults
          return [ new Grunt(result, this.model, this.schema) ]
        } else {
          return queryResults.map(result =>
            new Grunt(result, this.model, this.schema)
          )
        }
      })
      .then(grunts => {
        return this._where.size
          // TODO: might need to handle errors from fetchAssocs()
          ? this.fetchAssocs(grunts)
          : grunts
      })
      .then(this.checkForSingleReturn.bind(this))
  }

  /**
   * Takes `queryRestuls` from salesforce and creates Grunt instances. If `_where` state of model has an id and the id isn't an array then this wilal return a single instance. Otherwise an array of Grunts
   *
   * @param {array} queryResults
   * @returns [Grunt] | Grunt
   *
   * @memberof Query
   */
  createGrunts (queryResults) {
    const hasId = this._where.has('id')
    if (hasId && !Array.isArray(hasId)) {
      // only need to create a single grunt
      const [ result ] = queryResults
      return new Grunt(result, this, this.schema)
    } else {
      return queryResults.map(result =>
        new Grunt(result, this, this.schema)
      )
    }
  }

  /**
   * Uses `_with` state on query to find associated model. First fetches the associated model and gets field that the model relates to this one. Then builds up and executes query on associated model where relation field is equal to ids of this executed query.
   *
   * @param {any} grunts
   * @returns
   *
   * @memberof Query
   */
  fetchAssocs (grunts) {
    const ids = grunts.map(grunt => grunt.id)
    const [ assocField, modelName ] = this._where.entries().next().value
    const assocModel = this.model.getModel(modelName)
    const relField = assocModel.getRelField(this.schema.sfObject)
    if (!relField) {
      const error = new Error(
        `Model ${assocModel.name} does not have a relation field to ${this.model.name} defined. Cannot fetch associated ${assocField}`
      )
      Promise.reject(error)
    }
    return assocModel
      .find({
        [relField]: ids
      })
      .exec()
      .then(assocGrunts => {
        return assocGrunts.reduce((ids, assoc) => {
          const id = assoc[relField]
          ids[id] = ids[id]
            ? ids[id].push(assoc)
            : [ assoc ]
        }, {})
      })
      .then(idSorted => {
        grunts.forEach(grunt => {
          grunt[assocField] = idSorted[grunt.id]
        })
        return grunts
      })
  }

  checkForSingleReturn (grunts) {
    const hasId = this._where.has('id')
    if (hasId && !Array.isArray(hasId)) {
      return grunts[0]
    } else {
      return grunts
    }
  }

  /**
   * Takes query state and builds up queryString
   *
   * @returns string
   *
   * @memberof Query
   */
  buildQuery () {
    const select = this.buildSelect()
    const from = `FROM ${this.schema.sfObject}`
    const where = this.buildWhere()
    return `${select} ${from} ${where}`
  }

  /**
   * Builds select portion of query string
   *
   * @returns string
   *
   * @memberof Query
   */
  buildSelect () {
    return `SELECT ${[...this._mappings].join(', ')}`
  }

  /**
   * Builds where portion of query string
   *
   * @returns string
   *
   * @memberof Query
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
    const mappedKeys = this.schema.mapFields(keys)
    // the final array of mapped strings that will get joined
    const whereClauses = []
    mappedKeys.forEach((key, idx) => {
      const value = values[idx]
      const type = valid.getType(value)
      if (key === 'RAW') {
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

  /**
   * Helper function to inject values into a string. Loops over `params` and injects value of each key. If the value at a key is an array then it will be stringified and surrounded by () even if `quotes` === false. When injecting other types of values inject adds quotes by default unless `quotes` === false
   *
   * @static
   * @param {string} query
   * @param {object} [params={}]
   * @param {boolean} [quotes=true]
   * @returns string
   *
   * @memberof Query
   */
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

  /**
   * Helper function to handle where clauses that contain object configurations
   *
   * @static
   * @param {string} key
   * @param {object} value
   * @returns string
   *
   * @memberof Query
   */
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
