const { expect } = require('chai')
const td = require('testdouble')
const chain = require('../chain')

describe('chain(fns)', () => {
  let fn1, fn2, fn3
  beforeEach(() => {
    fn1 = td.function()
    fn2 = td.function()
    fn3 = td.function()

    td.when(fn1(undefined)).thenReturn(1)
    td.when(fn2(1)).thenReturn(2)
    td.when(fn3(2)).thenReturn(3)
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
