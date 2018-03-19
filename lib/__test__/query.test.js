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

  describe('#select(fields, ...rest)', () => {
    let query
    const schema = {
      expandFields: jest.fn(fields => fields),
      mapFields: jest.fn(fields => fields)
    }
    beforeEach(() => {
      query = new Query({ schema })
    })
    it('handles when fields is a string', () => {
      const input = 'field, field2, field3'
      query.select(input)
      expect(schema.expandFields).toHaveBeenCalledWith([ 'id', 'field', 'field2', 'field3' ])
    })

    it('handles when fields is an array', () => {
      const input = [ 'field', 'field2', 'field3' ]
      query.select(input)

      expect(schema.expandFields).toHaveBeenCalledWith([ 'id', ...input ])
    })

    it('handles when fields are passed in as positional arguments', () => {
      const input = [ 'field', 'field2', 'field3' ]
      query.select(...input)

      expect(schema.expandFields).toHaveBeenCalledWith([ 'id', ...input ])
    })

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

      expect(schema.expandFields).toHaveBeenCalledWith([
        'id',
        'something',
        'anotherThing'
      ])
      query.select('more')

      expect(schema.expandFields).toHaveBeenCalledWith([
        'id',
        'something',
        'anotherThing',
        'more'
      ])
    })

    it('sets _mappings based on all fields that have been requested', () => {
      const schema = {
        expandFields: jest.fn(fields => fields),
        mapFields: jest.fn(fields => fields)
      }
      const query = new Query({ schema })
      query.select('field1', 'field2')

      expect(schema.mapFields).toHaveBeenCalledWith(['id', 'field1', 'field2'])
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

  describe('#where(opts)', () => {
    it('catches any errors schema throws and adds to _errors prop', () => {
      const error = new Error('bad')
      const schema = {
        mapFields () {
          throw error
        }
      }

      const query = new Query({ schema })
      expect(query._errors.length).toBe(0)
      query.where()

      expect(query._errors[0]).toBe(error)
    })
  })

  it('adds to _errors prop when `opts` is not an object', () => {
    const query = new Query({ schema: {} })
    expect(query._errors.length).toBe(0)
    query.where(true)
    expect(query._errors.length).toBe(1)
  })

  it('calls schema to get mapping of all props of `opts` and adds to _where prop', () => {
    // making mock schema mapping to just return uppercase version of fields
    const schema = {
      mapFields: jest.fn(fields => fields.map(field => field.toUpperCase()))
    }
    const query = new Query({ schema })
    const input = {
      field: 'something',
      field2: { gt: 'something' }
    }
    query.where(input)

    const expected = {
      FIELD: 'something',
      FIELD2: { gt: 'something' }
    }
    const actual = query._where

    expect(actual).toEqual(expected)
  })

  describe('#limit(count)', () => {
    let query
    beforeEach(() => {
      query = new Query({ schema: {} })
    })

    it('adds `count` to _limit prop', () => {
      const input = 5
      query.limit(input)

      const expected = input
      const actual = query._limit

      expect(actual).toEqual(expected)
    })

    it('adds error to _errors when `count` is not a parsable number', () => {
      const input = true
      query.limit(input)

      expect(query._limit).toBe(null)
      expect(query._errors.length).toBe(1)
    })
  })

  describe('#skip(amount)', () => {
    let query
    beforeEach(() => {
      query = new Query({ schema: {} })
    })

    it('adds amount to _skip prop', () => {
      const input = 10
      query.skip(input)

      const expected = input
      const actual = query._skip

      expect(actual).toEqual(expected)
    })

    it('adds error to _errors when `amount` is not a parsable number', () => {
      const input = true
      query.skip(input)

      expect(query._skip).toBe(null)
      expect(query._errors.length).toBe(1)
    })
  })

  describe('#offset(amount)', () => {
    let query
    beforeEach(() => {
      query = new Query({ schema: {} })
    })

    it('adds amount to _skip prop', () => {
      const input = 10
      query.offset(input)

      const expected = input
      const actual = query._skip

      expect(actual).toEqual(expected)
    })

    it('adds error to _errors when `amount` is not a parsable number', () => {
      const input = true
      query.offset(input)

      expect(query._skip).toBe(null)
      expect(query._errors.length).toBe(1)
    })
  })
})
