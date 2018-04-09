const chain = require('../chain')

describe('chain(fns, initial)', () => {
  let fn1, fn2, fn3
  beforeEach(() => {
    fn1 = jest.fn((val) => val === undefined ? 1 : 'pong')
    fn2 = jest.fn(val => val === 1 ? 2 : 'ping')
    fn3 = jest.fn(val => val === 2 ? 3 : 'pong')
  })

  it('should call all `fns` in chain', () => {
    const fns = [fn1, fn2, fn3]
    chain(fns)

    fns.forEach(fn => expect(fn).toHaveBeenCalledTimes(1))
  })

  it('should allow an `intial` value to be passed in to chain', () => {
    const fns = [ fn1, fn2, fn3 ]
    const expected = 'pong'
    const actual = chain(fns, 'ping')

    expect(actual).toEqual(expected)
  })

  it('`initial` should default to undefined', () => {
    const fns = [ fn1, fn2, fn3 ]
    const expected = 3
    const actual = chain(fns)

    expect(actual).toEqual(expected)
  })

  it('should pass the return from one function to the next', () => {
    const expected = 3
    const actual = chain([ fn1, fn2, fn3 ])

    expect(actual).toEqual(expected)
  })

  it('should return error if any fn throws error', () => {
    const error = jest.fn(() => { throw new Error('an error') })

    const fns = [ fn1, error, fn2, fn3 ]
    const actual = chain(fns)

    expect(actual).toBeInstanceOf(Error)
  })
})
