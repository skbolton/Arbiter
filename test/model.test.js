const { expect } = require('chai')

const Arbiter = require('../lib/arbiter')
const { oppSchema, lineItemsSchema } = require('./fixtures/schema')
const Query = require('../lib/model/query')

describe('Model', () => {
  let arbiter
  let Model
  let Model2

  beforeEach(() => {
    arbiter = new Arbiter()
    Model = arbiter.model('Opportunity', oppSchema)
    Model2 = arbiter.model('LineItems', lineItemsSchema)
  })

  afterEach(() => {
    Model = null
    Model2 = null
  })

  it('should have a `_fields` property', () => {
    expect(Model).to.haveOwnProperty('_fields')
  })

  it('should have a `_where` property', () => {
    expect(Model).to.haveOwnProperty('_where')
  })

  it('should have a `_mappings` property', () => {
    expect(Model).to.haveOwnProperty('_mappings')
  })

  it('should have a `_with` property', () => {
    expect(Model).to.haveOwnProperty('_with')
  })

  describe('#findById(id)', () => {
    it('should be a function', () => {
      expect(Model).to.respondTo('findById')
    })

    it('should throw if `id` is not defined', () => {
      function shouldThrow () {
        Model.findById()
      }

      expect(shouldThrow).to.throw(Error)
    })

    it('should return a Query instance', () => {
      const returned = Model.findById(1)

      expect(returned).to.be.an.instanceOf(Query)
    })

    it('should add `id` to Query `_where` state', () => {
      const query = Model.findById(1)

      const expected = 1
      const actual = query._where.get('id')

      expect(actual).to.equal(expected)
    })
  })

  describe('#findByIds(ids)', () => {
    it('should be a function', () => {
      expect(Model).to.respondTo('findByIds')
    })

    it('should throw if `ids` is not an array', () => {
      function shouldThrow () {
        Model.findByIds('not an array')
      }

      expect(shouldThrow).to.throw(Error)
    })

    it('should return Query instance', () => {
      const returned = Model.findByIds([1])

      expect(returned).to.be.an.instanceOf(Query)
    })

    it('should add `ids` to Query `_where` state', () => {
      const query = Model.findByIds([1, 2, 3])

      const expected = [1, 2, 3]
      const actual = query._where.get('id')

      expect(actual).to.eql(expected)
    })
  })

  describe('#find(opts)', () => {
    it('should be a function', () => {
      expect(Model).to.respondTo('find')
    })

    it('should throw if `opts` is not an object', () => {
      function shouldThrow () {
        return Model.find('not way jose')
      }

      expect(shouldThrow).to.throw(Error)
    })

    specify('`opts` are not required', () => {
      function shouldNotThrow () {
        return Model.find()
      }

      expect(shouldNotThrow).to.not.throw(Error)
    })

    it('should return Query instanct', () => {
      const returned = Model.find()

      expect(returned).to.be.an.instanceOf(Query)
    })

    it('should add `opts` to Query `_where` state', () => {
      const query = Model.find({
        id: 1,
        status: 'Open'
      })

      const id = query._where.get('id')
      const status = query._where.get('status')

      expect(id).to.equal(1)
      expect(status).to.equal('Open')
    })
  })

  describe('#RAW(str)', () => {
    it('should be a function', () => {
      expect(Model).to.respondTo('RAW')
    })

    it('should reject if `str` is not a string', () => {
      const prom = Model.RAW(1)

      return expect(prom).to.eventually.be.rejected
    })
  })

  describe('#query(str)', () => {
    it('should be a function', () => {
      expect(Model).to.respondTo('query')
    })

    it('should reject if `str` is not a string', () => {
      const prom = Model.RAW(1)

      return expect(prom).to.eventually.be.rejected
    })
  })

  describe('#inject(query, params, quotes)', () => {
    it('should have method inject(query, params)', () => {
      expect(Model).to.respondTo('inject')
    })

    it('should throw if `query` is not a string', () => {
      function shouldThrow () {
        Model.inject(1)
      }
      expect(shouldThrow).to.throw(Error)
    })

    it('should throw if `params` is not an object', () => {
      function shouldThrow () {
        Model.inject('hey', [])
      }
      expect(shouldThrow).to.throw(Error)
    })

    it('should replace @keys with values on `params` object', () => {
      const query = 'Hey there @person'
      const params = { person: 'Delilah' }

      const expected = "Hey there 'Delilah'"
      const actual = Model.inject(query, params, true)

      expect(actual).to.equal(expected)
    })

    it('should not inject values with quotes if `!quotes`', () => {
      const query = 'Hey there @person'
      const params = { person: 'Delilah' }

      const expected = 'Hey there Delilah'
      const actual = Model.inject(query, params, false)

      expect(actual).to.equal(expected)
    })

    specify('`quotes` should default to true', () => {
      const query = 'Hey there @person'
      const params = { person: 'Delilah' }

      const expected = "Hey there 'Delilah'"
      const actual = Model.inject(query, params)

      expect(actual).to.equal(expected)
    })

    it('should stringify arrays with () and quotes even if `!quotes`', () => {
      const query = 'SELECT Id, Name FROM Opportunity WHERE Id in @ids'
      const params = { ids: [1, 2, 3, 4] }

      const expected = 'SELECT Id, Name FROM Opportunity WHERE Id in ' +
        "('1', '2', '3', '4')"
      const actual = Model.inject(query, params, false)
      expect(actual).to.equal(expected)
    })

    it('should add quotes to other values if `!quotes`', () => {
      const query = 'SELECT Id, Name FROM Opportunity WHERE Id in @ids' +
        " AND Name = '@name'"
      const params = { ids: [1, 2, 3, 4], name: 'Stephen' }
      const actual = Model.inject(query, params, false)
      const expected = 'SELECT Id, Name FROM Opportunity WHERE Id in ' +
        "('1', '2', '3', '4') AND Name = 'Stephen'"
      expect(actual).to.equal(expected)
    })
  })

  describe('#getModel(name)', () => {
    it('should fetch model by `name` from arbiter registry', () => {
      const returned = Model.getModel(Model.name)

      expect(returned).to.equal(Model)
    })

    it('should return undefined on unregisterd models', () => {
      const returned = Model.getModel('no freaking way')

      expect(returned).to.equal(undefined)
    })
  })

  describe('#getRelField(sfObject)', () => {
    it('should return field that one model relates to another', () => {
      const expected = 'oppId'
      const actual = Model2.getRelField('Opportunity')

      expect(actual).to.equal(expected)
    })
  })
})
