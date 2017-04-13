const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const expect = chai.expect

const Arbiter = require('../lib/arbiter')
const Schema = require('../lib/schema')

describe('Arbiter', () => {

  let arbiter
  beforeEach(() => arbiter = new Arbiter())
  afterEach(() => arbiter = null)

  it('should be a function', () => {
    expect(Arbiter).to.be.a('function')
  })

  it('should return an object with _models key', () => {
    expect(arbiter).to.haveOwnProperty('_models')
  })

  specify('arbiter._models should be an object', () => {
    expect(arbiter._models).to.be.an('object')
  })
  
  // this function will be changed quite a bit!!
  describe('#configure(pool)', () => {

    it('should set a pool prop on arbiter object', () => {
      expect(arbiter.pool).to.be.undefined
      arbiter.configure({ bad: 'this will change later in experimentation' })
      expect(arbiter.pool).to.be.an('object')
    })

    it('should throw error if non object is passed in', () => {
      expect(arbiter.configure.bind(arbiter, 'no good')).to.throw(TypeError)
    })
  })

  describe('#model(name, schema)', () => {
    it('should throw error if `name` is not a string', () => {
      expect(arbiter.model.bind(arbiter, 1)).to.throw(TypeError)
    })

    it('should throw error if `schema isn\'t an instance of Schema', () => {
      expect(arbiter.model.bind(arbiter, 'some name', {})).to.throw(TypeError)
    })

    it('should throw if `name` has already been registered', () => {
      const first = arbiter.model('first', new Schema()) 
      expect(arbiter.model.bind(arbiter, 'first', new Schema())).to.throw(Error)
    })

    it('should return an object', () => {
      const obj = arbiter.model('name', new Schema())
      expect(obj).to.be.an('object')
    })

    specify('object should have access to arbiter.pool', () => {
      arbiter.configure({ wow: 'I know bad this will change' })
      const obj = arbiter.model('some name', new Schema())
      expect(obj.pool).to.be.an('object')
    })
  })

  describe('#checkPool()', () => {
    it('should resolve if a pool has been configured', () => {
      arbiter.configure({ pool: 'yo yo yo' })
      return expect(arbiter.checkPool()).to.eventually.be.fulfilled
    })

    it('should reject if the pool hasn\'t been configured', () => {
      return expect(arbiter.checkPool()).to.eventually.be.rejected
    })
  })
})