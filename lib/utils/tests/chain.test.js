const { expect } = require('chai')
const td = require('testdouble')
const chain = require('../chain')

describe('chain(fns, initial)', () => {
  let fn1, fn2, fn3
  beforeEach(() => {
    fn1 = td.function()
    fn2 = td.function()
    fn3 = td.function()

    td.when(fn1(undefined)).thenReturn(1)
    td.when(fn1('ping')).thenReturn('pong')

    td.when(fn2(1)).thenReturn(2)
    td.when(fn2('pong')).thenReturn('ping')

    td.when(fn3(2)).thenReturn(3)
    td.when(fn3('ping')).thenReturn('pong')
  })
  afterEach(() => {
    td.reset()
  })

  it('should call all `fns` in chain', () => {
    const fns = [fn1, fn2, fn3]
    chain(fns)

    const callCounts = fns.map(fn => td.explain(fn).callCount)
    expect(callCounts.every(callCount => callCount === 1)).to.equal(true)
  })

  it('should allow an `intial` value to be passed in to chain', () => {
    const fns = [ fn1, fn2, fn3 ]
    const expected = 'pong'
    const actual = chain(fns, 'ping')

    expect(actual).to.equal(expected)
  })

  it('`initial` should default to undefined', () => {
    const fns = [ fn1, fn2, fn3 ]
    const expected = 3
    const actual = chain(fns)

    expect(actual).to.equal(expected)
  })

  it('should pass the return from one function to the next', () => {
    const expected = 3
    const actual = chain([ fn1, fn2, fn3 ])

    expect(actual).to.equal(expected)
  })

  it('should return error if any fn throws error', () => {
    const error = td.function()
    td.when(error(1)).thenThrow(new Error('an error'))

    const fns = [ fn1, error, fn2, fn3 ]
    const actual = chain(fns)

    expect(actual).to.be.a('error')
  })
})
