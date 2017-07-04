// const util = require('util')
const dotPath = require('dot-prop')
const valid = require('../utils/validate')
const transform = require('./transform')
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
    // top level id must be in selected fields (grunts need it to save against)
    this._fields = new Set(['id'])
    this._mappings = new Set()
    this._where = new Map()
    this._with = new Map()
    this._queryString = ''
    this._noResults = false
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
    this._fields = new Set([...this._fields, ...fields])
    // '*' is all fields in schema clean field selection in case their are duplicates
    if (this._fields.has('*')) {
      const allFields = this.schema.getAllFields()
      this._fields = new Set(allFields)
      return this
    }
    // '.' is all local fields query for them and remove '.' form field selection
    if (this._fields.has('.')) {
      const locals = this.schema.getLocalFields()
      this._fields.delete('.')
      this._fields = new Set([...this._fields, ...locals])
    }
    // User can pass fields in that are schema nodes and need to be expanded
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
    // valid.checkType(assoc, 'string', `${this.model.name}.with(assoc)`)
    // const withModel = this.schema.getAssoc(assoc)
    // if (!withModel) {
    //   throw new Error(`${this.model.name} does not have association with key of ${assoc}`)
    // }
    // this._with.set(assoc, withModel)
    if (valid.getType(assoc) === 'string') {
      const assocModel = this.schema.getAssoc(assoc)
      if (!assocModel) {
        throw new Error(`${this.model.name} does not have association with key of ${assoc}`)
      }
      this._with.set(assoc, { model: assocModel, fields: [], where: {} })
    } else {
      // assoc needs to be an object
      valid.checkType(assoc, 'Object', `${this.model.name}.with(assoc)`)
      const [ assocKey ] = Object.keys(assoc)
      const assocModel = this.schema.getAssoc(assocKey)
      if (!assocModel) {
        throw new Error(`${this.model.name} does not have association with key of ${assoc}`)
      }
      this._with.set(assocKey, {
        model: assocModel,
        fields: assoc[assocKey].fields || [],
        where: assoc[assocKey].where || {}
      })
    }
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
    const mappings = new Set(this.schema.mapFields([ ...this._fields ]))
    this._mappings = new Set(mappings)
    const queryString = this.buildQuery()
    return this.model.getConnection()
      .then(conn => conn.queryAsync(queryString))
      .then(({ records }) => {
        // delete sf metadata
        delete records.attributes
        if (records.length === 0) {
          this._noResults = true
        }
        return records
      })
      .then(queryResults => {
        delete queryResults.attributes
        return this.createGruntSkeletons(queryResults)
      })
      .then(skeletons => skeletons.map(
        skeleton => new Grunt(skeleton, this.model, this.schema.proxyHandler)
      ))
      .then(grunts => {
        if (this._noResults) {
          return grunts
        }
        // attempt to fetch associations if necessary
        return this._with.size
          // TODO: might need to handle errors from fetchAssocs()
          ? this.fetchAssocs(grunts)
          : grunts
      })
      .then(this.checkForSingleReturn.bind(this))
  }

  formatSkeleton (queryResult) {
    const skeleton = {}
    const fields = [ ...this._fields ]
    if (this._mappings.size === 0) {
      this._mappings = new Set(this.schema.mapFields([ ...this._fields ]))
    }
    const mappings = [ ...this._mappings ]
    fields.forEach((field, idx) => {
      const onQueryResult = dotPath.get(queryResult, mappings[idx], null)
      dotPath.set(skeleton, field, onQueryResult)
    })
    return skeleton
  }

  /**
   * Takes `queryRestuls` from salesforce and creates Grunt instances. If `_where` state of model has an id and the id isn't an array then this wilal return a single instance. Otherwise an array of Grunts
   *
   * @param {array} queryResults
   * @returns [Grunt] | Grunt
   *
   * @memberof Query
   */
  createGruntSkeletons (queryResults) {
    if (this._noResults) {
      return queryResults
    }
    const hasId = this._where.get('id')
    if (hasId && !Array.isArray(hasId)) {
      // only return one grunt
      const [ result ] = queryResults
      return [ result ].map(this.formatSkeleton, this)
    } else {
      // return multiple grunts
      return queryResults.map(this.formatSkeleton, this)
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
    const [ assocField, meta ] = this._with.entries().next().value
    const assocModel = this.model.getModel(meta.model)
    const relField = assocModel.getRelField(this.schema.sfObject)
    if (!relField) {
      const error = new Error(
        `Model ${assocModel.name} does not have a relation field to ${this.model.name} defined. Cannot fetch associated ${assocField}`
      )
      Promise.reject(error)
    }
    // we pass the _with meta in first to make sure they don't overwrite relField and ruin query
    return assocModel
      .find(meta.where)
      .fields(meta.fields)
      .where({
        [relField]: ids
      })
      .exec()
      .then(assocGrunts => {
        return assocGrunts.reduce((ids, assoc) => {
          const id = assoc[relField]
          ids[id] = ids[id] || []
          ids[id].push(assoc)
          return ids
        }, {})
      })
      .then(idSorted => {
        grunts.forEach(grunt => {
          grunt[assocField] = idSorted[grunt.id] || []
        })
        return grunts
      })
  }

  checkForSingleReturn (grunts) {
    const hasId = this._where.get('id')
    if (hasId && !Array.isArray(hasId)) {
      if (this._noResults) {
        return null
      }
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
    if (this._fields.size === 0) {
      this.fields('*')
    }
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
    if (this._mappings.size === 0) {
      this._mappings = new Set(this.schema.mapFields([...this._fields]))
    }
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
    // seperate fields and options. Keys need to get mapped to SF version
    // options need to be analyzed to build query correctly
    const fields = []
    const values = []
    // don't pass RAW through mappings
    const RAW = this._where.get('RAW')
    this._where.delete('RAW')
    for (const [ field, value ] of this._where.entries()) {
      fields.push(field)
      values.push(value)
    }
    const mappedFields = this.schema.mapFields(fields)
    if (RAW) {
      mappedFields.push('RAW')
      values.push(RAW)
    }
    // the final array of mapped strings that will get joined
    let whereClauses = []
    mappedFields.forEach((field, idx) => {
      const value = values[idx]
      const type = valid.getType(value)
      if (field === 'RAW') {
        return whereClauses.push(value)
      }
      if (type === 'null') {
        whereClauses.push(`${field} = null`)
      }
      if (type === 'Array') {
        whereClauses.push(
          `${field} IN ${transform.soqlArrayStringify(value)}`
        )
      }
      if (type === 'number' || type === 'string') {
        whereClauses.push(
          `${field} = '${value}'`
        )
      }
      // value at key is an object and needs logic to parse correctly
      if (type === 'Object') {
        whereClauses = [ ...whereClauses, ...Query.complexWhere(field, value) ]
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
  static complexWhere (field, opts) {
    const transforms = []
    let transformer
    // using for of loop for early exit
    Object.keys(opts).forEach(option => {
      transformer = transform[option]
      if (!transformer) {
        throw new Error(`Cannot build where clause for field: ${field} using option: ${option}. Options must be one of ${transform.comparitors.join(', ')}`)
      }
      transforms.push(transformer(field, opts))
    })
    return transforms
  }
}

module.exports = Query
