const Modifier = require('../modifier')

describe('Modifier Class', () => {
  let modifier

  beforeEach(() => {
    modifier = new Modifier()
  })

  describe('constructor()', () => {
    it('sets up initial modifier state', () => {
      const expected = {
        limit: null,
        skip: null,
        errors: []
      }
      const actual = modifier

      expect(actual).toEqual(expected)
    })
  })

  describe('#addSkip(amount)', () => {
    it('adds an error if amount is not a number', () => {
      const input = 'hi'

      expect(modifier.errors.length).toBe(0)
      modifier.addSkip(input)
      expect(modifier.errors.length).toBe(1)
    })

    it('updates skip state to amount', () => {
      const input = 5

      modifier.addSkip(input)
      const expected = input
      const actual = modifier.skip

      expect(actual).toEqual(expected)
    })
  })

  describe('#addLimit(amount)', () => {
    it('adds an error if amount is not a number', () => {
      const input = 'hi'

      expect(modifier.errors.length).toBe(0)
      modifier.addLimit(input)
      expect(modifier.errors.length).toBe(1)
    })

    it('updates limit state to amount', () => {
      const input = 10

      modifier.addLimit(input)
      const expected = input
      const actual = modifier.limit

      expect(actual).toBe(expected)
    })
  })

  describe('#build()', () => {
    it('returns errors if they are present', () => {
      modifier.errors.push(new Error('whoops'))

      const expected = Error
      const actual = modifier.build()

      expect(actual).toBeInstanceOf(expected)
    })

    it('returns limit and skip state if no errors are present', () => {
      modifier.limit = 10
      modifier.skip = 5

      const expected = { skip: modifier.skip, limit: modifier.limit }
      const actual = modifier.build()

      expect(actual).toEqual(expected)
    })
  })

  describe('#buildError(context)', () => {
    it('builds up an error', () => {
      const input = 'skip'

      const expected = Error
      const actual = modifier.buildError(input)

      expect(actual).toBeInstanceOf(expected)
    })
  })
})
