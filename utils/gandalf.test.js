const { expect } = require('chai')
const gandalf = require('./gandalf')

describe('Gandalf type checking', () => {
  describe('#checkType(thing, expected, context)', () => {
    it('should throw error if thing is not type expected', () => {
      function shouldThrow () {
        gandalf.checkType(5, 'string', 'Test')
      }

      expect(shouldThrow).to.throw(TypeError)
    })

    specify('it should work for all basic types', () => {
      function number () {
        gandalf.checkType('not a number', 'number', 'Test')
      }

      function array () {
        gandalf.checkType('not an array', 'array', 'Test')
      }

      expect(number).to.throw(TypeError)
      expect(array).to.throw(TypeError)
    })

    it('should not consider an array as an object', () => {
      function object () {
        gandalf.checkType([], 'Object', 'Test')
      }

      expect(object).to.throw(TypeError)
    })

    it('should return undefined if type is correct', () => {
      const expected = undefined
      const actual = gandalf.checkType('some string', 'string', 'Test')

      expect(actual).to.equal(expected)
    })
  })

  describe('#checkIsa(thing, parent, context)', () => {
    it('should throw if `thing` is not instance of `parent`', () => {
      function shouldThrow () {
        gandalf.checkIsa(1, String, 'Test')
      }

      expect(shouldThrow).to.throw(TypeError)
    })

    it('should return undefined if `thing` is instance of `parent`', () => {
      const expected = undefined
      const actual = gandalf.checkIsa([], Array, 'Test')

      expect(actual).to.equal(expected)
    })
  })
})
