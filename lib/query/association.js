const valid = require('../utils/validate')

class Association {
  constructor (model) {
    this.associations = []
    this.error = null
    this.model = model
  }

  add (associations, maybeCallback) {
    const newAssociation = valid.getType(associations) === 'string'
      ? { [associations]: maybeCallback }
      : associations
    const configsforAssociation = Object.keys(newAssociation).map(key => {
      const config = this.model.getAssociation(key)
      return config
        ? Object.assign({}, config, { association: key, queryCb: newAssociation[key] })
        : null
    })
    if (configsforAssociation.some(config => config === null)) {
      const error = new Error(
        `Cannot fetch associations. Not configured on ${this.model.name}`
      )
      this.error = error
      return this
    }
    this.associations = [ ...this.associations, ...configsforAssociation ]
    return this
  }

  getSelects () {
    return this.associations.map(association => association.from)
  }

  build () {
    return this.error ? this.error : this.associations
  }

  fetch (grunts) {
    if (grunts.length < 1) {
      return grunts
    }
    if (this.associations.length === 0) {
      return grunts
    }
    const queries = this.associations.map(association =>
      this.fetchAssociation(grunts, association)
    )
    return Promise.all(queries).then(() => grunts)
  }

  fetchAssociation (grunts, associationConfig) {
    const { from, to, association, model, queryCb, relation } = associationConfig
    const fromFields = grunts.map(grunt => grunt[from])
    const query = model.find({ [to]: fromFields }).select(to)
    // stub query execution so that query does not get called by user
    const executeQuery = query.executeQuery
    query.executeQuery = () => {
      const error = new Error(
        'Do not execute a query passed to query.with(), this is done for you'
      )
      throw error
    }
    queryCb(query)
    // put query back
    query.executeQuery = executeQuery
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
    })
  }
}

module.exports = Association
