const { expect } = require('chai')
const validate = require('../validate')

describe('validate type checking', () => {
  describe('#checkType(thing, expected, context)', () => {
    it('should throw error if thing is not type expected', () => {
      function shouldThrow () {
        validate.checkType(5, 'string', 'Test')
      }

      expect(shouldThrow).to.throw(TypeError)
    })

    specify('it should work for all basic types', () => {
      function number () {
        validate.checkType('not a number', 'number', 'Test')
      }

      function array () {
        validate.checkType('not an array', 'array', 'Test')
      }

      expect(number).to.throw(TypeError)
      expect(array).to.throw(TypeError)
    })

    it('should not consider an array as an object', () => {
      function object () {
        validate.checkType([], 'Object', 'Test')
      }

      expect(object).to.throw(TypeError)
    })

    it('should return undefined if type is correct', () => {
      const expected = undefined
      const actual = validate.checkType('some string', 'string', 'Test')

      expect(actual).to.equal(expected)
    })
  })

  describe('#checkIsa(thing, parent, context)', () => {
    it('should throw if `thing` is not instance of `parent`', () => {
      function shouldThrow () {
        validate.checkIsa(1, String, 'Test')
      }

      expect(shouldThrow).to.throw(TypeError)
    })

    it('should return undefined if `thing` is instance of `parent`', () => {
      const expected = undefined
      const actual = validate.checkIsa([], Array, 'Test')

      expect(actual).to.equal(expected)
    })
  })
})
