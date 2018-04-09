class Modifier {
  constructor () {
    this.limit = null
    this.skip = null
    this.errors = []
  }

  buildError (context) {
    return new Error(`query.${context}(amount) must be passed a number`)
  }

  addSkip (amount) {
    if (isNaN(parseInt(amount))) {
      this.errors.push(this.buildError('[skip||offset]'))
      return this
    }
    this.skip = amount
    return this
  }

  addLimit (amount) {
    if (isNaN(amount)) {
      this.errors.push(this.buildError('limit'))
      return this
    }
    this.limit = amount
    return this
  }

  build () {
    return this.errors.length > 0
      ? new Error(this.errors.join(', '))
      : { skip: this.skip, limit: this.limit }
  }
}

module.exports = Modifier
