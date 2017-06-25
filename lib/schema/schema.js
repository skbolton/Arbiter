const validate = require('../utils/validate')
const Handler = require('./handler')
const Tree = require('./tree')

const _tree = Symbol('tree')

const unknownFieldError = (field, schema) => {
  const msg = `Unknown field ${field} has been requested from Schema ${schema}`
  throw new Error(msg)
}

class Schema {
  /**
   * Creates an instance of Schema.
   * @param {string} sfObject
   * @param {object} config
   *
   * @memberOf Schema
   */
  constructor (sfObject, config, opts = { root: true }) {
    validate.checkType(sfObject, 'string', 'Schema(sfObject, ..)')
    validate.checkType(config, 'Object', 'Schema(.., config)')
    Object.defineProperty(this, 'sfObject', {
      value: sfObject
    })
    const isRoot = opts.root
    this[_tree] = new Tree(config, isRoot)
    this.proxyHandler = new Handler(this.getAllWritables())
  }

  getAssoc (assoc) {
    return this[_tree].assocs.get(assoc)
  }

  getRel (sfObject) {
    for (let [ field, rel ] of this[_tree].rels) {
      if (Array.isArray(rel)) {
        const relFound = rel.find(object => object === sfObject)
        if (relFound) {
          return field
        }
      } else {
        if (rel === sfObject) {
          return field
        }
      }
    }
  }

  /**
   * Returns mapping of a field on a schema.
   *
   * @param string field
   * @returns string | undefined
   *
   * @memberOf Schema
   */
  getFieldMapping (field) {
    if (this[_tree].fields.get(field)) {
      return this[_tree].fields.get(field)
    }
    if (this[_tree].children.get(field)) {
      return this[_tree].children.get(field).sfObject
    }
  }

  /**
   * Gets all fields in a Schema tree by starting at root and then recursing through children to get their fields. Child fields are concatenated with the name of the relationship that the parent holds
   * ['name', 'id'] -> ['project.name', 'project.id']
   *
   * @returns array
   *
   * @memberOf Schema
   */
  getAllFields () {
    let fields = []
    this[_tree].fields.forEach((val, key) => {
      fields.push(key)
    })
    this[_tree].children.forEach((schema, name) => {
      fields = [
        ...fields,
        ...schema.getAllFields().map(field => `${name}.${field}`)
      ]
    })
    return fields
  }

  /**
   * Get local fields from a schema object not including children references
   *
   * @returns array
   *
   * @memberOf Schema
   */
  getLocalFields () {
    let locals = []
    this[_tree].fields.forEach((sf, mapping) => locals.push(mapping))
    return locals
  }

  /**
   * Returns all writable fields that a schema holds. This is used so that Doc objects know what fields they can then save back to SalesForce
   *
   * @returns array
   *
   * @memberOf Schema
   */
  getAllWritables () {
    const writables = {}
    this[_tree].writables.forEach((mapping, key) => {
      writables[key] = mapping
    })
    return writables
  }

  /**
   * Given a collection of fields this function will expand all the fields that are schema nodes into all of their local fields
   *
   * @param {array} fields
   * @returns {array} expandedFields
   *
   * @memberof Schema
   */
  expandFields (fields) {
    return fields.reduce((expanded, field) => {
      const path = field.split('.')
      if (path.length === 1) {
        // is it a field or a child schema
        if (this[_tree].fields.get(field)) {
          expanded.push(field)
          return expanded
        }
        if (this[_tree].children.get(field)) {
          return [
            ...expanded,
            ...this[_tree].children.get(field).getLocalFields().map(childField =>
              `${field}.${childField}`
            )
          ]
        }
      }
      // path consists of multiple segments
      const front = path.shift()
      const child = this[_tree].children.get(front)
      if (!child) {
        unknownFieldError(front, this.sfObject)
      }
      return [
        ...expanded,
        ...child.expandFields([path.join('.')]).map(childField =>
          `${front}.${childField}`
        )
      ]
    }, [])
  }

  /**
   * Given a collection of fields return the SalesForce mapping of the fields
   *
   * @param array fields
   * @returns array
   *
   * @memberOf Schema
   */
  mapFields (fields) {
    return fields.reduce((mappedFields, field) => {
      const path = field.split('.')
      if (path.length === 1) {
        const mapping = this.getFieldMapping(field)
        if (!mapping) {
          unknownFieldError(field, this.sfObject)
        }
        mappedFields.push(mapping)
        return mappedFields
      }
      const front = path.shift()
      const child = this[_tree].children.get(front)
      if (!child) {
        unknownFieldError(front, this.sfObject)
      }
      return [
        ...mappedFields,
        ...child.mapFields([path.join('.')]).map(field =>
          `${child.sfObject}.${field}`
        )
      ]
    }, [])
  }

  /**
   * Allows a schema to be added to a schema tree after it has been constructed.
   * @param Schema - and instance of a schema
   * @param string - a path to save schema at in tree
   */
  addChildSchema (schema, path) {
    validate.checkIsa(schema, Schema, 'Schema.addChildren(schema, ..)')
    validate.checkType(path, 'string', 'Schema.addChildSchema(.., path)')
    const segments = path.split('.')
    if (segments.length === 1) {
      return this[_tree].addChild(segments[0], schema)
    }
    const [ segment ] = segments
    const child = this[_tree].children.get(segment)
    if (child) {
      return child.addChildSchema(schema, segments.slice(1).join('.'))
    }
    throw new Error(`Cannot add schema. Segment ${segment} does not exist in schema tree`)
  }
}

module.exports = Schema
