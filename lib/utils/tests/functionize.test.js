const { expect } = require('chai')
const functionize = require('../functionize')

describe('functionize utility', () => {
  it('should have noopForward function', () => {
    expect(functionize).to.respondTo('noopForward')
  })

  it('should have wrapValue function', () => {
    expect(functionize).to.respondTo('wrapValue')
  })

  describe('noopForward()', () => {
    it('should return whatever value it is called with', () => {
      const expected = 5
      const actual = functionize.noopForward(5)

      expect(actual).to.equal(expected)
    })
  })

  describe('wrapValue(value)', () => {
    it('should return a function', () => {
      const returned = functionize.wrapValue()

      expect(returned).to.be.a('function')
    })

    specify('returned function should return wrapped value', () => {
      const wrapped = functionize.wrapValue(5)

      const expected = 5
      const actual = wrapped()

      expect(actual).to.equal(expected)
    })

    specify('it should wrap all values', () => {
      const obj = { name: 'stephen' }
      const str = 'hey there'
      const wrappedObj = functionize.wrapValue(obj)
      const wrappgedStr = functionize.wrapValue(str)

      expect(wrappedObj()).to.equal(obj)
      expect(wrappgedStr()).to.equal(str)
    })
  })
})
