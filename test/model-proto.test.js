const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
const expect = chai.expect

const Arbiter = require('../lib/arbiter')
const Schema = require('../lib/schema')

describe('Model', () => {
  let arbiter
  let model

  beforeEach(() => {
    arbiter = new Arbiter()
    arbiter.configure({ pool: 'hello' })
    model = arbiter.model('Opportunity', new Schema())
  })

  describe('#findById(id)', () => {

    it('should have method findById(id)', () => {
      expect(model).to.respondTo('findById')
    })
    
    it('should throw if pool is not configured', () => {
      // dirtily deleting pool
      arbiter.pool = null
      return expect(model.findById(1)).to.eventually.be.rejected
    })

  })

  describe('#findByIds(ids)', () => {

    it('should have method findByIds(ids)', () => {
      expect(model).to.respondTo('findByIds')
    })

    it('should throw if non array is passed in', () => {
      return expect(model.findByIds(1)).to.eventually.be.rejected
    })

    it('should return blah', () => {
      return expect(model.findByIds([1, 2, 3])).to.eventually.be.fulfilled
    })


    it('should throw if pool is not configured', () => {
      // dirtily deleting pool
      arbiter.pool = null
      return expect(model.findByIds([1])).to.eventually.be.rejected
    })

  })

  describe('#query(query)', () => {
    
    it('should have method query(query)', () => {
      expect(model).to.respondTo('query')
    })

    specify('should throw if not passed a string', () => {
      return expect(model.query()).to.eventually.be.rejected
    })
    
    it('should throw if pool isn\'t configured', () => {
      arbiter.pool = null
      return expect(model.query('a string')).to.eventually.be.rejected
    })
  })

  describe('#inject(query, params, quotes)', () => {

    it('should have method inject(query, params)', () => {
      expect(model).to.respondTo('inject')
    })

    it('should throw if `query` is not a string', () => {
      expect(model.inject.bind(model, 1)).to.throw(Error)
    })
    
    it('should throw if `params` is not an object', () => {
      expect(model.inject.bind(model, 'hey', [])).to.throw(Error)
    })

    it('should replace @keys with values on `params` object', () => {
      const query = 'Hey there @person'
      const params = { person: 'Delilah' }

      const expected = "Hey there 'Delilah'"
      const actual = model.inject(query, params, true)
      
      expect(actual).to.equal(expected)
    })

    it('should not inject values with quotes if `!quotes`', () => {
      const query = 'Hey there @person'
      const params = { person: 'Delilah' }

      const expected = 'Hey there Delilah'
      const actual = model.inject(query, params, false)

      expect(actual).to.equal(expected)
    })

    specify('`quotes` should default to true', () => {
      const query = 'Hey there @person'
      const params = { person: 'Delilah' }

      const expected = "Hey there 'Delilah'"
      const actual = model.inject(query, params)

      expect(actual).to.equal(expected)
    })

    it('should stringify arrays with () and quotes even if `!quotes`', () => {
      const query = 'SELECT Id, Name FROM Opportunity WHERE Id in @ids'
      const params = { ids: [1, 2, 3, 4] }

      const expected = 'SELECT Id, Name FROM Opportunity WHERE Id in '
        + "('1', '2', '3', '4')"
      const actual = model.inject(query, params, false)
    })

    it('should add quotes to other values if `!quotes`', () => {
      const query = 'SELECT Id, Name FROM Opportunity WHERE Id in @ids'
        + " AND Name = '@name'"
      const params = { ids: [1, 2, 3, 4], name: 'Stephen' }

      const expected = 'SELECT Id, Name FROM Opportunity WHERE Id in '
        + "('1', '2', '3', '4') AND Name = 'Stephen'"

    })
  })

  describe('#new(fields)', () => {
    it('should have method new(fields)', () => {
      expect(model).to.respondTo('new')
    })
  })
})