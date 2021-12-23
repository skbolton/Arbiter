const validate = require('./utils/validate')
const _models = Symbol('models')

/**
 * Top level Salesforce Connection and Model Registry
 *
 * @class Arbiter
 */
class Arbiter {
  constructor (Connector, Model) {
    this.Connector = Connector
    this.Model = Model
    this[_models] = {}
    this.oracle = null
  }

  /**
   * Configures and instantiates Arbiter Connection to Salesforce
   *
   * @param {object} config - any valid jsforce connection config is allowed here
   *
   * @memberof Arbiter
   */
  configure (config) {
    validate.checkType(config, 'Object', 'arbiter.configure(config, ..)')
    this.oracle = new this.Connector(config)
  }

  /**
   * Gets connection from Connector
   *
   * @returns Promise - Pool connection | Error
   *
   * @memberof Arbiter
   */
  getConnection () {
    return this.oracle
      ? this.oracle.getConnection()
      : Promise.reject(new Error('Connection has not been configured on Arbiter'))
  }

  /**
   * Creates a model against arbiter instance
   * verifies that namespace has not already been taken by another model
   *
   * @param {string} name
   * @param {Schema} schema
   * @returns Model Instance
   *
   * @memberof Arbiter
   */
  model (name, schema) {
    if (this[_models][name]) {
      throw new Error(`Model: ${name} has already been registered on Arbiter`)
    }
    this[_models][name] = new this.Model(name, this, schema)
    return this[_models][name]
  }

  getModel (name) {
    return this[_models][name]
  }
}

module.exports = Arbiter
