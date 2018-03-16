const { superstruct } = require('superstruct')
const Query = require('./query')
const Grunt = require('./_model/grunt')
const objEach = require('./utils/object-each')
const _arbiter = Symbol('arbiter')

const struct = superstruct({
  types: {
    Model: val => val instanceof Model
  }
})

const AssociationConfig = struct({
  from: 'string',
  to: 'string',
  model: 'Model',
  relation: struct.enum([ 'hasMany', 'hasOne' ])
})

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
    this._associations = {}
    this[_arbiter] = arbiter
  }

  get sfObject () {
    return this.schema.sfObject
  }

  /**
   * Configures associated models that Model can query for and the config for
   * how to line up the fields to query
   * @param {AssociationConfig} config
   */
  setAssociations (config) {
    // this will throw if invalid
    objEach(config, (key, value) => AssociationConfig(value))
    this._associations = config
    return this
  }

  /**
   * Gets an association config from model
   * @param {string} name
   */
  getAssociation (name) {
    return this._associations[name]
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

  findOne (opts = {}) {
    return new Query(this).where(opts).first()
  }

  findById (id) {
    return this.find({ id }).first()
  }

  findByIds (ids) {
    return this.find({ id: ids })
  }
}

module.exports = Model
