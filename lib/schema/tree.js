const objEach = require('../utils/object-each')
const buildValidation = require('./validator')

class Tree {
  constructor (config, isRoot = true) {
    this.fields = new Map()
    this.children = new Map()
    this.fields.set('id', 'Id')
    this.writables = new Map()
    objEach(config, (field, value) => {
      if (typeof value === 'string') {
        return this.fields.set(field, value)
      }
      // if it has an sfObject it is a nested schema
      if (value.sfObject) {
        return this.children.set(field, value)
      }
      if (value.sf) {
        this.fields.set(field, value.sf)
      }
      // don't set up validation or assocs for nested schemas
      if (isRoot) {
        // if writable add validation
        if (value.writable) {
          value.validate = buildValidation(field, value)
          this.writables.set(field, value)
        }
      }
    })
  }

  addChild (key, child) {
    this.children.set(key, child)
  }
}

module.exports = Tree
