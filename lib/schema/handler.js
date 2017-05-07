class Handler {
  constructor (writables) {
    this.writables = writables
  }

  // Proxy handler functions

  set (grunt, key, value) {
    if (key in this.writables && grunt[key] !== value) {
      this.validateKey(grunt, key, value)
    }
    grunt[key] = value
    return true
  }

  get (grunt, key) {
    return grunt[key]
  }

  deleteProperty (grunt, key) {
    if (key.toLowerCase() === 'id') {
      throw new Error('Deleting Id fields is not allowed')
    } else {
      return true
    }
  }

  validateKey (grunt, key, value) {
    // const validator = this.writables[key].validate
    // if (validator(value)) {
    //   const mapping = this.writables[key].sf
    //   grunt.__changeset[mapping] = value
    //   grunt.__errors[key] = null
    // } else {
    //   grunt.__errors[key] = 'Some sort of error'
    // }
  }
}

module.exports = Handler
