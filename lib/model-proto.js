const gandalf = require('../utils/gandalf')
const modelProto = {
  findById (id) {
    return Promise.all([
      this.checkPool()
    ])
    .then(([ pool ]) => pool)
  },

  findByIds (ids) {
    return Promise.all([
      this.checkPool(),
      gandalf.async.checkType(ids, 'Array', 'Model.findByIds(ids)')
    ])
    .then(([ pool ]) => pool)
  },

  query (query) {
    return Promise.all([
      this.checkPool(),
      gandalf.async.checkType(query, 'string', 'Model.query(query)')
    ])
  },

  RAW (query) {
    return Promise.all([
      this.checkPool(),
      gandalf.async.checkType(query, 'string', 'Model.RAW(query)')
    ])
  },

  inject (query, params = {}, quotes = true) {
    gandalf.checkType(query, 'string', 'Model.inject(query, .., ..)')
    gandalf.checkType(params, 'Object', 'Model.inject(.., params, ..)')
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

  }
}

module.exports = modelProto