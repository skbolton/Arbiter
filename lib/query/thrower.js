const valid = require('../utils/validate')

class Thrower {
  constructor () {
    this.error = null
  }

  add (error) {
    if (valid.getType(error) === 'string') {
      this.error = new Error(error)
      return this
    }
    this.error = error
    return this
  }

  throwIfNeeded (results) {
    if (this.error) {
      if (results.length < 1) {
        throw this.error
      }
    }
    return results
  }
}

module.exports = Thrower
