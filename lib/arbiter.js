const Schema = require('./schema/schema')
const Model = require('./model/model')
const validate = require('../utils/validate')

const _models = Symbol('models')

/**
 * Top level pool manager and Model Ringleader for Salesforce ORM
 *
 * @class Arbiter
 */
class Arbiter {
  constructor () {
    this[_models] = {}
    this.pool = null
  }

  /**
   * Configures arbiter pool.
   *
   * @param {object} config
   * @param {object|function} callbacks
   *
   * @memberof Arbiter
   */
  configure (config, callbacks) {
    validate.checkType(config, 'Object', 'arbiter.configure(config, ..)')
    validate.checkType(callbacks, 'Object', 'arbiter.configure(.., callbacks)')
    this.pool = config
  }

  /**
   * Gets connection from Arbiters pool
   *
   * @returns Promise - Pool connection | Error
   *
   * @memberof Arbiter
   */
  getConnection () {
    return this.pool
      ? this.pool.getConnection()
      : Promise.reject(new Error(`Pool has not been configured on Arbiter`))
  }

  /**
   * Gets all models that have been registered against an arbiter instance
   *
   * @returns object
   *
   * @memberof Arbiter
   */
  getModels () {
    return this[_models]
  }

  /**
   * Get's a model based off of `name` if one exists
   *
   * @param {string} name
   * @returns Model instance | undefined
   *
   * @memberof Arbiter
   */
  getModel (name) {
    return this[_models][name]
  }

  /**
   * Creates and registers a model against arbiter instance
   *
   * @param {string} name
   * @param {Schema} schema
   * @returns Model Instance
   *
   * @memberof Arbiter
   */
  model (name, schema) {
    validate.checkType(name, 'string', 'arbiter.model(name, ..)')
    validate.checkIsa(schema, Schema, 'arbiter.model(.., Schema)')
    if (this.getModel(name)) {
      throw new Error(`Model: ${name} has already been registered on Arbiter`)
    }
    this[_models][name] = new Model(name, this, schema)
    return this.getModel(name)
  }
}

module.exports = Arbiter
