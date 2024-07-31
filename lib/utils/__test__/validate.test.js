const validate = require('../validate')

describe('validate type checking', () => {
  describe('#checkType(thing, expected, context)', () => {
    it('should throw error if thing is not type expected', () => {
      function shouldThrow () {
        validate.checkType(5, 'string', 'Test')
      }

      expect(shouldThrow).toThrow(TypeError)
    })

    it('it should work for all basic types', () => {
      function number () {
        validate.checkType('not a number', 'number', 'Test')
      }

      function array () {
        validate.checkType('not an array', 'array', 'Test')
      }

      function string () {
        validate.checkType(5, 'string', 'Test')
      }

      expect(number).toThrow(TypeError)
      expect(array).toThrow(TypeError)
      expect(string).toThrow(TypeError)
    })

    it('should not consider an array as an object', () => {
      function object () {
        validate.checkType([], 'Object', 'Test')
      }

      expect(object).toThrow(TypeError)
    })

    it('should return undefined if type is correct', () => {
      const expected = undefined
      const actual = validate.checkType('some string', 'string', 'Test')

      expect(actual).toEqual(expected)
    })
  })

  describe('#checkIsa(thing, parent, context)', () => {
    it('should throw if `thing` is not instance of `parent`', () => {
      function shouldThrow () {
        validate.checkIsa(1, String, 'Test')
      }

      expect(shouldThrow).toThrow(TypeError)
    })

    it('should return undefined if `thing` is instance of `parent`', () => {
      const expected = undefined
      const actual = validate.checkIsa([], Array, 'Test')

      expect(actual).toEqual(expected)
    })
  })

  describe('#checkTypeAsync(thing, expected, context)', () => {
    it('should resolve if type is correct', () => {
      const subject = 5
      const type = 'number'
      const shouldResolve = validate.checkTypeAsync(subject, type, 'context')
      return expect(shouldResolve).resolves.toBe(undefined)
    })

    it('should throw if `thing` is not `expected` type', () => {
      const subject = new Date()
      const type = 'string'

      const shouldReject = validate.checkTypeAsync(subject, type, 'context')

      return expect(shouldReject).rejects.toThrow()
    })
  })

  describe('#checkIsaAsync(thing, parent, context)', () => {
    it('should resolve if `thing` is instanceof `parent`', () => {
      const thing = new Date()
      const parent = Date

      const shouldResolve = validate.checkIsaAsync(thing, parent, 'context')

      return expect(shouldResolve).resolves.toBe(undefined)
    })

    it('should reject if `thing` is not instanceof `parent`', () => {
      const thing = 'thing'
      const notParent = Array

      const shouldReject = validate.checkIsaAsync(thing, notParent, 'context')

      return expect(shouldReject).rejects.toThrow()
    })
  })

  it('should check a string value is a string', () => {
    const expected = 'string'
    const actual = validate.string(expected)

    expect(actual).toEqual(expected)
  })

  it('should return null if the string is not a string', () => {
    const expected = null
    const actual = validate.string({})

    expect(actual).toEqual(expected)
  })
})
