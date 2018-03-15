const Query = require('../query')

describe('Query class', () => {
  describe('constructor(model)', () => {
    const schema = {}
    const model = { schema }
    const query = new Query(model)
    it('adds model and schema from model as immutable properties', () => {

      expect(query.model).toBe(model)
      expect(query.schema).toBe(schema)

      query.model = 'should not be changeable'
      query.schema = 'dont ever let this happen'

      expect(query.model).toBe(model)
      expect(query.schema).toBe(schema)
    })
    it('sets up basic state holders for query to be built', () => {
      expect(query._fields).toBeDefined()
      expect(query._where).toBeDefined()
      expect(query._limit).toBeDefined()
      expect(query._skip).toBeDefined()
      expect(query._sort).toBeDefined()
      expect(query._mappings).toBeDefined()
      expect(query._errors).toBeDefined()
    })
  })

  describe('#select(...fields)', () => {
    it('catches any errors the schema throws from expandFields, adds to _errors property', () => {
      const error = new Error('yikes')
      const schema = {
        expandFields () {
          throw error
        }
      }
      const query = new Query({ schema })
      expect(query._errors.length).toBe(0)
      query.select()
      expect(query._errors[0]).toBe(error)
    })

    it('catches any errors the shcema throws from MapFields, adds to _errors property', () => {
      const error = new Error('doh')
      const schema = {
        expandFields () {
          return []
        },
        mapFields () {
          throw error
        }
      }

      const query = new Query({ schema })
      expect(query._errors.length).toBe(0)
      query.select()
      expect(query._errors[0]).toBe(error)
    })

    it('passes the current _fields and `fields` arg into schema expandFields', () => {
      const schema = {
        expandFields: jest.fn(fields => fields),
        // needed so test doesn't fail
        mapFields: jest.fn()
      }
      const query = new Query({ schema })
      // query always has id as a field
      query.select('something', 'anotherThing')

      expect(schema.expandFields).toHaveBeenCalledWith([ 'id', 'something', 'anotherThing' ])
      query.select('more')

      expect(schema.expandFields).toHaveBeenCalledWith([ 'id', 'something', 'anotherThing', 'more' ])
    })

    it('sets _mappings based on all fields that have been requested', () => {
      const schema = {
        expandFields: jest.fn(fields => fields),
        mapFields: jest.fn(fields => fields)
      }
      const query = new Query({ schema })
      query.select('field1', 'field2')

      expect(schema.mapFields).toHaveBeenCalledWith([ 'id', 'field1', 'field2' ])
      // TODO: maybe find a way to not couple to the fact that it is a set?
      expect(query._mappings.size).toEqual(3)
    })

    it('returns query object for chaining', () => {
      const schema = {
        expandFields () {
          return []
        },
        mapFields () {
          return []
        }
      }
      const query = new Query({ schema })
      const returned = query.select()

      expect(returned).toBe(query)
    })
  })
})
