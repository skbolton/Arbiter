const Schema = require('./schema/schema')
const modelProto = require('./model/model-proto')
const gandalf = require('../utils/gandalf')

class Arbiter {
  constructor () {
    this._models = {}
    this.pool = null
  }

  configure (config, callbacks) {
    gandalf.checkType(config, 'Object', 'arbiter.configure(config, ..)')
    gandalf.checkType(callbacks, 'Object', 'arbiter.configure(.., callbacks)')
    this.pool = config
  }

  getConnection () {
    return this.pool
      ? this.pool.getConnection()
      : Promise.reject(new Error(`Pool has not been configured on Arbiter`))
  }

  getModels () {
    return this._models
  }

  getModel (name) {
    return this._models[name]
  }

  model (name, schema) {
    gandalf.checkType(name, 'string', 'arbiter.model(name, ..)')
    gandalf.checkIsa(schema, Schema, 'arbiter.model(.., Schema)')
    if (this._models[name]) {
      throw new Error(`Model: ${name} has already been registered on Arbiter`)
    }
    const proto = Object.create(this)
    Object.assign(proto, modelProto)
    const instance = Object.create(proto)
    Object.defineProperties(instance, {
      __name: {
        value: name
      },
      __schema: {
        value: schema
      }
    })
    instance._fields = []
    instance._where = new Map()
    instance._mappings = []
    this._models[name] = instance
    return instance
  }
}

module.exports = Arbiter
