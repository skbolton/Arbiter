const valid = require('../utils/validate')

/**
 * Class for managing the fields being requested on a query and their mappings
 * to the value they really are as defined in the schema
 * @class Fields
 */
class Fields {
  /**
   * Creates fields instance
   * @param {Schema} schema - schema to request expansion and mappings from
   */
  constructor (schema) {
    this.schema = schema
    // all queries start off with the id at minimum
    this.fields = new Set(['id'])
    this.mappings = new Set(['Id'])
  }

  /**
   * Sets the fields that are being selected for later processing
   *
   * query.select() simply gathers up all its arguments and calls this
   * so there are a few shapes that will come through
   * @example
   *   // becomes array of strings
   *   query.select('field1', 'field2', 'field3')
   * @example
   *   // becomes array with index 0 being an array
   *   query.select(['field1', 'field2', 'field3'])
   * @example
   *   // becomes array with string of fields at index 0
   *   query.select('field1, field2, field3')
   */
  add (fields) {
    let _fields
    const [ first, ...rest ] = fields
    if (Array.isArray(first)) {
      _fields = [ ...first, ...rest ]
    }
    if (valid.getType(first) === 'string') {
      _fields = [ ...first.split(',').map(chunk => chunk.trim()), ...rest ]
    }
    this.fields = new Set([ ...this.fields, ..._fields ])
    return this
  }
  /**
   * Attempts to get the expanded fields and mappings for those fields
   * from schema.
   *
   * Query class needs a one to one from field being requested to the mapping of
   * that field so that it can read from the query result at the mapping and set
   * on the grunt the key being the field
   *
   * @returns {Error | object}
   */
  build () {
    try {
      this.fields = new Set(this.schema.expandFields([ ...this.fields ]))
      this.mappings = new Set(this.schema.mapFields([ ...this.fields ]))
      return {
        fields: [ ...this.fields ],
        mappings: [ ...this.mappings ]
      }
    } catch (e) {
      return e
    }
  }
}

module.exports = Fields
