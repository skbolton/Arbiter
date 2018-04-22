const Thrower = require('../thrower')

describe('Thrower Class', () => {
  let thrower
  beforeEach(() => {
    thrower = new Thrower()
  })

  describe('constructor()', () => {
    it('sets up correct initial state', () => {
      const expected = {
        error: null
      }
      const actual = thrower

      expect(actual).toEqual(expected)
    })
  })

  describe('#add(error)', () => {
    it('builds and attaches error to state when error is a string', () => {
      const input = 'Whoopsie'

      thrower.add(input)
      const expected = new Error(input)
      const actual = thrower.error

      expect(actual).toEqual(expected)
    })

    it('adds error to state when it is already an error', () => {
      const input = new Error('Yikes')

      thrower.add(input)
      const expected = input
      const actual = thrower.error

      expect(actual).toBe(expected)
    })
  })

  describe('#throwIfNeeded(resutls)', () => {
    it('throws error when results are empty and error has been configured on thrower', () => {
      const error = new Error('yikes')
      thrower.add(error)
      const results = []

      const shouldThrow = () => {
        thrower.throwIfNeeded(results)
      }

      expect(shouldThrow).toThrow(error)
    })

    it('returns results if they are not empty', () => {
      const input = [ 'something' ]

      const expected = input
      const actual = thrower.throwIfNeeded(input)

      expect(actual).toBe(expected)
    })

    it('returns results, even if they are empty, if no error was configured on thrower', () => {
      const input = []

      const expected = input
      const actual = thrower.throwIfNeeded(input)

      expect(actual).toEqual(expected)
    })

    it('returns results if they are not empty and error is configured', () => {
      const error = new Error('Sorry')
      thrower.add(error)

      const input = [ { something: 1 } ]
      const expected = input
      const actual = thrower.throwIfNeeded(input)

      expect(actual).toBe(expected)
    })
  })
})
