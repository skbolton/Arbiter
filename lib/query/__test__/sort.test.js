const Sort = require('../sort')

describe('Sort class', () => {
  let sort
  const schema = {
    mapFields: jest.fn()
  }
  beforeEach(() => {
    sort = new Sort(schema)
  })

  describe('constructor(schema)', () => {
    it('sets up correct initial state', () => {
      const expected = {
        schema,
        sort: {}
      }
      const actual = sort

      expect(actual).toEqual(expected)
    })
  })

  describe('#add(opts)', () => {
    it('builds a sort object when opts is a string', () => {
      const input = 'field field2'

      sort.add(input)
      const expected = {
        field: 1,
        field2: 1
      }
      const actual = sort.sort

      expect(actual).toEqual(expected)
    })

    it('handles when a - is in front of opts string to signify descending order', () => {
      const input = '-field field2'

      sort.add(input)
      const expected = {
        field: -1,
        field2: 1
      }
      const actual = sort.sort

      expect(actual).toEqual(expected)
    })

    it('handles when opts is an object', () => {
      const input = { createdDate: 1, somethingElse: -1 }

      sort.add(input)
      const expected = input
      const actual = sort.sort

      expect(actual).toEqual(expected)
    })
  })

  describe('#build()', () => {
    it('calls to schema to get mappings for all fields in sort', () => {
      const sortFields = { createdDate: 1, field2: 1 }
      sort.sort = sortFields

      sort.build()

      expect(schema.mapFields).toHaveBeenCalledWith(Object.keys(sortFields))
    })

    it('returns object that has mapped version of keys from schema call', () => {
      schema.mapFields.mockImplementationOnce(fields => fields.map(field => field.toUpperCase()))
      const sortObject = { createdDate: 1, anotherField: 1 }
      sort.sort = sortObject

      const expected = {
        CREATEDDATE: 1,
        ANOTHERFIELD: 1
      }
      const actual = sort.build()

      expect(actual).toEqual(expected)
    })

    it('returns error when schema throws trying to map fields', () => {
      const error = new Error('Yikes')
      schema.mapFields.mockImplementationOnce(() => { throw error })
      sort.sort = { createdDate: 1 }

      const expected = error
      const actual = sort.build()

      expect(actual).toBe(expected)
    })

    it('returns null when sort.add() was never called', () => {
      const expected = null
      const actual = sort.build()

      expect(actual).toBe(expected)
    })
  })
})
