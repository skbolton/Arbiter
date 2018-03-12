const Grunt = require('./model/grunt')
const Query = require('./query')
const objEach = require('./utils/object-each')
const _arbiter = Symbol('arbiter')

class Model {
  constructor (name, arbiter, schema) {
    Object.defineProperty(this, 'name', {
      value: name
    })
    this[_arbiter] = arbiter
    this.schema = schema
  }

  get sfObject () {
    return this.schema.sfObject
  }

  /**
   * Creates an instance of the Model (Grunt)
   * Useful for creating salesforce objects on the fly instead of first querying for
   * and instance
   * @param {Object} fields - the fields to add to instance
   */
  new (fields = {}) {
    const grunt = new Grunt({}, this, this.schema.proxyHandler)
    objEach(fields, (field, value) => {
      grunt[field] = value
    })
    return grunt
  }

  /**
   * Returns jsforce query pointing at object model represents
   * Does not have any mapping or helpers involved
   */
  jsforce () {
    return this[_arbiter].getConnection()
      .then(conn => conn.sobject(this.sfObject))
  }

  // Query Methods using arbiter query class for mapping
  find (opts = {}) {
    return new Query(this).where(opts)
  }

  findById (id) {
    return new Query(this).where({ id })
  }

  findByIds (ids) {
    return new Query(this).where({ id: ids })
  }
}

module.exports = Model
