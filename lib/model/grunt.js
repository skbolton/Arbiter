const dotProp = require('dot-prop')

const _fields = Symbol('fields')
const _mappings = Symbol('mappings')
const _model = Symbol('model')
const _schema = Symbol('schema')
const _addValues = Symbol('addValues')

class Grunt {
  constructor (result, model, schema) {
    Object.defineProperty(this, '__changeset', {
      value: {},
      writable: true
    })
    this[_model] = model
    this[_schema] = schema
    this[_fields] = this[_model]._fields
    this[_mappings] = this[_model]._mappings
    this[_addValues](result)
    const handler = schema.writablesProxy
    return new Proxy(handler, this)
  }

  [_addValues] (queryResult) {
    // delete some metadata that salesforce adds
    delete queryResult.attributes
    this[_fields].forEach((field, idx) => {
      const queryValue = dotProp.get(
        queryResult,
        this[_mappings][idx],
        null // default to null
      )
      dotProp.set(this, field, queryValue)
    })
  }

  save () {
    if (Object.keys(this.__changeset).length === 0) {
      return Promise.resolve(this)
    } else {
      // validationville
    }
  }
}

module.exports = Grunt
