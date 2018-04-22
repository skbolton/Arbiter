class Restrictions {
  constructor (schema) {
    this.schema = schema
    this.error = null
    this.restrictions = new Set()
  }

  get InvalidMutationError () {
    return new Error(
      'Mutations in query.allowMuations(...mutations) must be declared writable in schema'
    )
  }

  allow (mutations) {
    const writables = Object.keys(this.schema.getAllWritables())
    if (!this.verifyWritables(writables, mutations)) {
      this.error = this.InvalidMutationError
      return this
    }
    const toReject = writables.filter(
      writable => !mutations.find(mutation => mutation === writable)
    )
    this.restrictions = new Set(toReject)
    return this
  }

  reject (mutations) {
    const writables = Object.keys(this.schema.getAllWritables())
    if (!this.verifyWritables(writables, mutations)) {
      this.error = this.InvalidMutationError
      return this
    }
    this.restrictions = new Set(mutations)
    return this
  }

  build () {
    return this.error ? this.error : this.restrictions
  }

  verifyWritables (writables, maybeWritables) {
    return maybeWritables.every(maybe => writables.find(writable => maybe === writable))
  }
}

module.exports = Restrictions
