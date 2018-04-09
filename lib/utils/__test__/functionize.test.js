const functionize = require('../functionize')

describe('functionize utility', () => {
  it('should have noopForward function', () => {
    expect(typeof functionize.noopForward).toBe('function')
  })

  it('should have wrapValue function', () => {
    expect(typeof functionize.wrapValue).toBe('function')
  })

  describe('noopForward()', () => {
    it('should return whatever value it is called with', () => {
      const expected = 5
      const actual = functionize.noopForward(5)

      expect(actual).toEqual(expected)
    })
  })

  describe('wrapValue(value)', () => {
    it('should return a function', () => {
      const returned = functionize.wrapValue()

      expect(typeof returned).toBe('function')
    })

    it('returned function should return wrapped value', () => {
      const wrapped = functionize.wrapValue(5)

      const expected = 5
      const actual = wrapped()

      expect(actual).toEqual(expected)
    })

    it('it should wrap all values', () => {
      const obj = { name: 'stephen' }
      const str = 'hey there'
      const wrappedObj = functionize.wrapValue(obj)
      const wrappgedStr = functionize.wrapValue(str)

      expect(wrappedObj()).toEqual(obj)
      expect(wrappgedStr()).toEqual(str)
    })
  })
})
