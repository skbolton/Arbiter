const validate = require('../utils/validate')
const Handler = require('./handler')
const Tree = require('./tree')

const _tree = Symbol('tree')

const unknownFieldError = (field, schema) => {
  const msg = `Unknown field ${field} has been requested from Schema ${schema}`
  throw new Error(msg)
}

class Prophet {
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
   * TODO: Do we need this api anymore?
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
   * Takes a collection of fields and expands them to their full values. * becomes all the values
   * that are at that node in the tree.
   *
   * We could leave the stars and just pass them in to jsforce but we have to keep a one to one
   * between fields being requested and the ones being mapped that way we can construct grunts
   * properly
   * @param {array} fields
   * @returns {array} expandedFields
   *
   * @memberof Schema
   */
  expandFields (fields) {
    return fields.reduce((expanded, field) => {
      const path = field.split('.')
      const [segment, segment2] = path
      if (path.length === 1) {
        if (segment === '*') {
          const allLocalFields = this.getLocalFields()
          return [ ...expanded, ...allLocalFields ]
        }
        if (this[_tree].fields.get(segment)) {
          return [...expanded, segment]
        }
        unknownFieldError(segment, this.sfObject)
      }
      if (segment2 === '*') {
        return [
          ...expanded,
          ...this[_tree].children
            .get(segment)
            .getLocalFields()
            .map(childField => `${segment}.${childField}`)
        ]
      }
      // path consists of multiple segments
      const child = this[_tree].children.get(segment)
      if (!child) {
        unknownFieldError(segment, this.sfObject)
      }
      return [
        ...expanded,
        ...child
          .expandFields([path.slice(1).join('.')])
          .map(childField => `${segment}.${childField}`)
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
      // we are dealing with a nested schema field
      // its possible user might have put __c as the field
      // reference change to __r to avoid traversal error
      const objectName = child.sfObject.replace('__c', '__r')
      return [
        ...mappedFields,
        ...child.mapFields([path.join('.')]).map(field =>
          `${objectName}.${field}`
        )
      ]
    }, [])
  }

  /**
   * Allows a schema to be added to a schema tree after it has been constructed.
   * @param Schema - and instance of a schema
   * @param string - a path to save schema at in tree
   */
  addChildSchema (path, schema) {
    validate.checkIsa(schema, Prophet, 'Schema.addChildren(schema, ..)')
    validate.checkType(path, 'string', 'Schema.addChildSchema(.., path)')
    const segments = path.split('.')
    if (segments.length === 1) {
      return this[_tree].addChild(segments[0], schema)
    }
    const [ segment ] = segments
    const child = this[_tree].children.get(segment)
    if (child) {
      return child.addChildSchema(segments.slice(1).join('.'), schema)
    }
    throw new Error(`Cannot add schema. Segment ${segment} does not exist in schema tree`)
  }
}

module.exports = Prophet
