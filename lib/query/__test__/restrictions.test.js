const Restrictions = require('../restrictions')

describe('Restrictions class', () => {
  const schema = {
    getAllWritables: jest.fn()
  }
  let restrictions
  beforeEach(() => {
    restrictions = new Restrictions(schema)
  })

  describe('constructor(schema)', () => {
    it('sets up correct initial state', () => {
      const expected = {
        schema,
        error: null,
        restrictions: new Set()
      }
      const actual = restrictions

      expect(actual).toEqual(expected)
    })
  })

  describe('#allow(mutations)', () => {
    it('sets all other writable fields according to schema to restrictions', () => {
      const writables = {
        status: {},
        field: {},
        someOtherField: {}
      }
      schema.getAllWritables.mockImplementationOnce(() => writables)

      const input = [ 'status' ]
      const expected = Object.keys(writables).filter(writable => writable !== 'status')

      restrictions.allow(input)
      expected.forEach(restriction => expect(restrictions.restrictions.has(restriction)).toBe(true))
    })

    it('adds an error if trying to allow a field that is not writable in schema', () => {
      const writables = { status: {} }
      schema.getAllWritables.mockImplementationOnce(() => writables)
      const input = [ 'tallyHo!' ]

      expect(restrictions.error).toBe(null)
      restrictions.allow(input)
      expect(restrictions.error).toBeInstanceOf(Error)
    })
  })

  describe('#rejectMutations(mutations)', () => {
    it('sets mutations to restrictions', () => {
      const writables = {
        status: {},
        field: {}
      }
      schema.getAllWritables.mockImplementationOnce(() => writables)
      const input = [ 'field' ]

      const expected = [ 'field' ]
      restrictions.reject(input)

      expected.forEach(field => expect(restrictions.restrictions.has(field)).toBe(true))
    })

    it('adds an error if trying to reject a mutation that is not writable in schema', () => {
      const writables = { status: {} }
      schema.getAllWritables.mockImplementationOnce(() => writables)
      const input = [ 'noWayJose' ]

      expect(restrictions.error).toBe(null)
      restrictions.reject(input)
      expect(restrictions.error).toBeInstanceOf(Error)
    })
  })

  describe('#build()', () => {
    it('returns restrictions if no error is present in state', () => {
      const _restrictions = new Set()
      restrictions.restrictions = _restrictions

      const expected = _restrictions
      const actual = restrictions.build()

      expect(actual).toEqual(expected)
    })

    it('returns error if one is present in state', () => {
      const error = new Error('yikes')
      restrictions.error = error

      const expected = error
      const actual = restrictions.build()

      expect(actual).toEqual(expected)
    })
  })
})
