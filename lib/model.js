const Query = require('./query')
const Grunt = require('./_model/grunt')
const objEach = require('./utils/object-each')
const _arbiter = Symbol('arbiter')

class Model {
  constructor (name, arbiter, schema) {
    Object.defineProperties(this, {
      name: {
        value: name
      },
      schema: {
        value: schema
      }
    })
    this[_arbiter] = arbiter
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
    return this.find({ id })
  }

  findByIds (ids) {
    return this.find({ id: ids })
  }
}

module.exports = Model
