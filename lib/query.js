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
    this._mappings = new Set(['Id'])
    this._where = {}
    this._with = null
    this._sort = null
    this._limit = null
    this._skip = null
    this._errors = []
    this._singleReturn = false
    this._verifyResults = null
    this._rejectMutations = new Set()
  }

  /*
   * Adds `fields` to query state. These get expanded so that we have a set of all requested fields
   * and latter a set of the mapped, salesforce version of the fields.
   *
   */
  select (...fields) {
    try {
      this._fields = new Set(
        this.schema.expandFields([...this._fields, ...fields])
      )
      this._mappings = new Set(this.schema.mapFields([...this._fields]))
    } catch (e) {
      this._errors.push(e)
    }
    return this
  }

  // alias for select
  fields (...fields) {
    return this.select(...fields)
  }

  where (opts = {}) {
    try {
      valid.checkType(opts, 'Object', `${this.model.name}.where(opts)`)
      const unmappedWhereClauseKeys = Object.keys(opts)
      const mappedWhereClauseKeys = this.schema.mapFields(
        unmappedWhereClauseKeys
      )
      this._where = mappedWhereClauseKeys.reduce(
        (mappedWhereClause, key, idx) => {
          mappedWhereClause[key] = opts[unmappedWhereClauseKeys[idx]]
          return mappedWhereClause
        },
        {}
      )
    } catch (e) {
      this._errors.push(e)
    }
    return this
  }

  limit (count) {
    if (isNaN(parseInt(count))) {
      const error = new Error('query.limit(count) must be passed a number')
      this._errors.push(error)
      return this
    }
    this._limit = count
    return this
  }

  skip (amount) {
    if (isNaN(parseInt(amount))) {
      const error = new Error('query.skip(amount) must be passed a number')
      this._errors.push(error)
      return this
    }
    this._skip = amount
    return this
  }

  first () {
    this._singleReturn = true
    return this
  }

  // Alias for skip
  offset (amount) {
    return this.skip(amount)
  }

  // TODO: jsforce api allows field to be object containing field and dir
  sort (field, dir = 'ASC') {
    this.sort = {
      field,
      dir
    }
  }

  with (association, queryCb = () => {}) {
    const configForAssociation = this.model.getAssociation(association)
    if (!configForAssociation) {
      const error = new Error(
        `Cannot fetch assocation ${association}. Not configured on ${this.model.name}`
      )
      this._errors.push(error)
      return this
    }
    this._with = Object.assign({}, configForAssociation, {
      association,
      queryCb
    })
    // the from field of association has to be on query to join results together later
    return this.select(this._with.from)
  }

  throwIfNotFound (error = new Error(`${this.model.name} not found`)) {
    let _error
    if (typeof error === 'string') {
      _error = new Error(error)
    }
    if (error instanceof Error) {
      _error = error
    }
    this._verifyResults = {
      error: _error
    }
    return this
  }

  allowMutations (mutations) {
    const writables = Object.keys(this.schema.getAllWritables())
    // verify that all mutations exist in writables
    const allMutationsWritable = mutations.every(mutation =>
      writables.find(writable => writable === mutation)
    )
    if (!allMutationsWritable) {
      const error = new Error(
        'Muations in to query.allowMutations(...mutations) must be declared writable in schema'
      )
      this._errors.push(error)
      return this
    }
    const toReject = writables.filter(
      writable => !mutations.find(mutation => mutation === writable)
    )
    this._rejectMutations = new Set([...toReject])
    return this
  }

  rejectMutations (mutations) {
    const writables = Object.keys(this.schema.getAllWritables())
    // verify that all mutations past are in schema as writable
    const allMutationsWritable = mutations.every(mutation =>
      writables.find(writable => writable === mutation)
    )
    if (!allMutationsWritable) {
      const error = new Error(
        'A mutation in query.rejectMutations(...mutations) was not found as writable field in schema. You probably mistyped a field'
      )
      this._errors.push(error)
      return this
    }
    this._rejectMutations = new Set([...mutations])
    return this
  }

  // methods for kicking off a query
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
    if (this._errors.length) {
      return Promise.reject(new Error(`${this._errors.join(', ')}`))
    }
    // const jsForceFindToCall = this._singleReturn ? 'findOne' : 'find'
    return this.model
      .sobject()
      .then(sobject => {
        const query = sobject.find(this._where, [
          ...this._mappings
        ])
        if (this._singleReturn) {
          query.limit(1)
        }
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
      .then(queryResults => this.verifyResults(queryResults))
      .then(queryResults => this.createGrunts(queryResults))
      .then(grunts => (this._with ? this.fetchAssociations(grunts) : grunts))
      .then(results => this.handleSingleReturn(results))
  }

  verifyResults (queryResults) {
    if (this._verifyResults) {
      if (queryResults.length < 1) {
        throw this._verifyResults.error
      }
    }
    return queryResults
  }

  handleSingleReturn (results) {
    return this._singleReturn ? results[0] : results
  }

  fetchAssociations (grunts) {
    if (grunts.length < 1) {
      return grunts
    }
    const { from, to, association, relation, model, queryCb } = this._with
    const fromFields = grunts.map(grunt => grunt[from])
    const query = model.find({ [to]: fromFields }).select(to)
    // if (relation === 'hasOne') {
    //   query.first()
    // }
    // stub query.doQuery so callback doesn't execute query
    query.doQuery = () => {
      const error = new Error(
        'Do not execute a query passed to query.with(), this is done for you'
      )
      throw error
    }
    queryCb(query)
    // place it back
    query.doQuery = this.doQuery
    return query.exec().then(associatedGrunts => {
      const idSorted = !Array.isArray(associatedGrunts)
        ? [ { [associatedGrunts[to]]: associatedGrunts } ]
        : associatedGrunts.reduce((ids, assocGrunt) => {
          const id = assocGrunt[to]
          ids[id] = ids[id] || []
          ids[id].push(assocGrunt)
          return ids
        }, {})
      grunts.forEach(grunt => {
        grunt[association] = relation === 'hasOne'
          ? idSorted[grunt[from]] && idSorted[grunt[from]][0]
            ? idSorted[grunt[from]][0]
            : null
          : idSorted[grunt[from]] || []
      })
      return grunts
    })
  }

  createGrunts (results) {
    const fields = [...this._fields]
    const mappings = [...this._mappings]
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
            { strict: this._strictMode, rejectMutations: this._rejectMutations }
          )
      )
  }
}

module.exports = Query
