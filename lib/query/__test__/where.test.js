const Where = require('../where')

describe('Where class', () => {
  let where
  const schema = {
    mapFields: jest.fn()
  }

  beforeEach(() => {
    where = new Where(schema)
  })

  describe('constructor(schema)', () => {
    it('stores the schema as a property', () => {
      expect(where.schema).toBe(schema)
    })
  })

  describe('#add(opts)', () => {
    it('puts opts at RAW key when opts is a string', () => {
      const rawSQL = "Id = '1'"
      where.add(rawSQL)

      expect(where.where.RAW).toBe(rawSQL)
    })

    it('puts opts at where key when opts is an object', () => {
      const input = {
        status: 'Open'
      }
      where.add(input)

      expect(where.where).toBe(input)
    })
  })

  describe('#build()', () => {
    it('returns string at RAW if there is one', () => {
      where.where.RAW = "Id = '1'"

      const expected = where.where.RAW
      const actual = where.build()

      expect(actual).toBe(expected)
    })

    it('calls into schema.mapFields to get mappings for keys in where state', () => {
      const whereState = {
        Status: 'Open',
        IsDeleted: false
      }
      where.where = whereState

      where.build()

      expect(schema.mapFields).toHaveBeenCalledWith([ 'Status', 'IsDeleted' ])
    })

    it('returns object with keys that are the mapping from schema.mapFields', () => {
      schema.mapFields.mockImplementationOnce(fields =>
        fields.map(field => field.toLowerCase())
      )
      const whereState = {
        Status: 'Open',
        IsDeleted: false
      }
      where.where = whereState

      const expected = { status: 'Open', isdeleted: false }
      const actual = where.build()

      expect(actual).toEqual(expected)
    })

    it('returns any errors that are thrown by schema', () => {
      const error = new Error('whoops')
      schema.mapFields.mockImplementationOnce(() => { throw error })

      const expected = error
      const actual = where.build()

      expect(actual).toBe(expected)
    })
  })
})
