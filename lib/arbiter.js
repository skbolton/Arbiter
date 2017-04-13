const Schema = require('./schema')
const modelProto = require('./model-proto')
const gandalf = require('../utils/gandalf')

class Arbiter {
  constructor () {
    this._models = {}
  }

  configure (pool) {
    gandalf.checkType(pool, 'Object', 'arbiter.configure()')
    this.pool = pool
  }

  checkPool () {
    return this.pool 
      ? Promise.resolve(this.pool) 
      : Promise.reject(`Pool has not been configured on Arbiter`)
  }

  model(name, schema) {
    gandalf.checkType(name, 'string', 'model.name')
    gandalf.checkIsa(schema, Schema, 'model.schema')
    if (this._models[name]) {
      throw new Error(`Model: ${name} has already been registered on Arbiter`)
    }
    const proto = Object.create(this)
    Object.assign(proto, modelProto)
    const instance = Object.create(proto)
    this._models[name] = instance
    return instance
  }
}

module.exports = Arbiter
