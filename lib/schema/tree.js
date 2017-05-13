const objEach = require('../utils/object-each')
const buildValidation = require('./validator')

class Tree {
  // passing in the schema class to function fixes a testing circular dep
  constructor (config, isRoot = true) {
    this.fields = new Map()
    this.children = new Map()
    this.fields.set('id', 'Id')
    this.writables = new Map()
    this.assocs = new Map()
    this.rels = new Map()
    objEach(config, (field, value) => {
      if (typeof value === 'string') {
        return this.fields.set(field, value)
      }
      // if it has an sfObject it is a nested schema
      if (value.sfObject) {
        return this.children.set(field, value)
      }
      // don't set up validation or assocs for nested schemas
      if (isRoot) {
        // field is an object with customization
        if (value.assoc) {
          this.assocs.set(field, value.assoc)
          return
        }
        this.fields.set(field, value.sf)
        // if writable add validation
        if (value.writable) {
          value.validate = buildValidation(field, value)
          this.writables.set(field, value)
        }
        if (value.rel) {
          this.rels.set(field, value.rel)
        }
      }
    })
  }
}

module.exports = Tree
