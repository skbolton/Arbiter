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
    this._checkResults = false
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
      // do an automatic findOne if id is in opts and its not an array of ids
      if (opts.id && !Array.isArray(opts.id)) {
        this._singleReturn = true
      }
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
  // one day
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
    return this.select(this._with.from)
  }

  throwIfNotFound () {
    this._checkResults = true
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
    return this.model
      .jsforce()
      .then(sobject => {
        const query = sobject[jsForceFindToCall](this._where, [
          ...this._mappings
        ])
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
      .then(grunts => (this._with ? this.fetchAssociations(grunts) : grunts))
  }

  handleResult (queryResult) {
    if (this._checkResults) {
      if (
        this._singleReturn &&
        (queryResult === undefined || queryResult === null)
      ) {
        throw new Error(`${this.model.name} not found`)
      }
      if (Array.isArray(queryResult) && queryResult.length === 0) {
        throw new Error(`${this.model.name} not found`)
      }
    }

    // remove attributes
    if (this._singleReturn) {
      delete queryResult.attributes
    } else {
      queryResult.forEach(record => {
        delete record.attributes
      })
    }

    const skeletons = this.createGruntSkeletons(queryResult)
    return this._singleReturn
      ? new Grunt(skeletons, this.model, this.schema.proxyHandler)
      : skeletons.map(
          skeleton => new Grunt(skeleton, this.model, this.schema.proxyHandler)
        )
  }

  fetchAssociations (grunts) {
    const { from, to, association, relation, model, queryCb } = this._with
    const fromFields = Array.isArray(grunts)
      ? grunts.map(grunt => grunt[from])
      : [grunts[from]]
    const query = model.find({ [to]: fromFields })
    if (relation === 'hasOne') {
      query.first()
    }
    // TODO: need to stub .then(), .exec(), .execute so queryCB can't call them
    queryCb(query)
    return query.exec().then(associatedGrunts => {
      if (!Array.isArray(grunts)) {
        grunts[association] = associatedGrunts
        return grunts
      }
      const idSorted = !Array.isArray(associatedGrunts)
        ? { [associatedGrunts[to]]: associatedGrunts }
        : associatedGrunts.reduce((ids, assocGrunt) => {
          const id = assocGrunt[to]
          ids[id] = ids[id] || []
          ids[id].push(assocGrunt)
          return ids
        }, {})
      grunts.forEach(grunt => {
        grunt[association] =
          idSorted[grunt[from]] || (relation === 'hasOne' ? null : [])
      })
      return grunts
    })
  }

  createGruntSkeletons (result) {
    if (this._singleReturn) {
      return this.formatGruntSkeleton(result)
    }
    return result.map(this.formatGruntSkeleton.bind(this))
  }

  formatGruntSkeleton (queryResult) {
    const fields = [...this._fields]
    const mappings = [...this._mappings]
    return fields.reduce((skeleton, field, idx) => {
      const onQueryResult = dotPath.get(queryResult, mappings[idx], null)
      dotPath.set(skeleton, field, onQueryResult)
      return skeleton
    }, {})
  }
}

module.exports = Query
