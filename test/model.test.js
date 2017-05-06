const { expect } = require('chai')
const td = require('testdouble')

const Arbiter = require('../lib/arbiter')
const Schema = require('../lib/schema/schema')
const firstSchema = new Schema('Schema', {
  name: 'Name',
  noAerialPhoto: {
    sf: 'No_Aerial_Photo__c',
    writable: true
  },
  project: new Schema('Project__r', {
    name: 'Name',
    proposalCAD: new Schema('Proposal_CAD__r', {
      proposalCompleted: 'Proposal_Completed__c'
    })
  }),
  service: new Schema('Service__r', {
    serviceNumber: 'Service_Number__c',
    name: 'Name'
  }),
  second: {
    assoc: 'Model2'
  }
})

describe('Model', () => {
  let arbiter
  let Model

  beforeEach(() => {
    arbiter = new Arbiter()
    Model = arbiter.model('Model', firstSchema)
  })
  afterEach(() => { Model = null })

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

    it('should add `id` to `model._where`', () => {
      const id = 1
      Model.findById(id)

      const actual = Model._where.get('id')
      expect(actual).to.equal(1)
    })

    it('should return model object for chaining', () => {
      const returned = Model.findById(1)

      expect(returned).to.equal(Model)
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

    it('should set `ids` on `model._where`', () => {
      const ids = [1, 2, 3]
      Model.findByIds(ids)

      const actual = Model._where.get('id')
      expect(actual).to.equal(ids)
    })

    it('should return model object for chaining', () => {
      const returned = Model.findByIds([1])

      expect(returned).to.equal(Model)
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

    it('should add to `model._where` if `opts` are passed in', () => {
      Model.find({ id: 5 })

      const actual = Model._where.get('id')
      expect(actual).to.equal(5)
    })

    it('should return model object for chaining', () => {
      const returned = Model.find()

      expect(returned).to.equal(Model)
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

  describe('#fields(...fields)', () => {
    it('should be a function', () => {
      expect(Model).to.respondTo('fields')
    })

    it('should always add `id` to fields', () => {
      Model.fields('name')
      expect(Model._fields).to.include.members(['id'])
    })

    it('should get all fields if `*` is an arg', () => {
      Model
        .fields('*')

      const expected = [
        'id',
        'name',
        'noAerialPhoto',
        'project.id',
        'project.name',
        'project.proposalCAD.id',
        'project.proposalCAD.proposalCompleted',
        'service.id',
        'service.serviceNumber',
        'service.name'
      ]
      const actual = Model._fields

      actual.forEach((field, idx) => {
        expect(field).to.equal(expected[idx])
      })

      specify('there should\'t be duplicates of fields', () => {
        Model
          // * gets all fields, name and child are repeats
          .fields('*', 'name', 'child')
        const expected = [
          'id',
          'name',
          'noAerialPhoto',
          'project.id',
          'project.name',
          'project.proposalCAD.id',
          'project.proposalCAD.proposalCompleted',
          'service.id',
          'service.serviceNumber',
          'service.name'
        ]
        const actual = Model._fields

        actual.forEach((field, idx) => {
          expect(field).to.equal(expected[idx])
        })
      })
    })

    it('should get all local fields if `.` is an arg', () => {
      Model
        .fields('.', 'project.name')

      const expected = [
        'id',
        'name',
        'noAerialPhoto',
        'project.name'
      ]
      const actual = Model._fields

      actual.forEach((field, idx) => {
        expect(field).to.equal(expected[idx])
      })
    })

    it('should overwrite `model._fields` with args passed in', () => {
      Model._fields = ['name']
      Model.fields('noAerialPhoto', 'project.name')
      expect(Model._fields).to.include.members(['id', 'noAerialPhoto', 'project.name'])
      expect(Model._fields.length).to.equal(3)
    })

    it('should return the Model for chaining', () => {
      const returned = Model.fields()
      expect(returned).to.equal(Model)
    })
  })

  describe('#where(opts)', () => {
    it('should be a function', () => {
      expect(Model).to.respondTo('where')
    })

    it('should throw if `opts` is not an object', () => {
      function shouldThrow () {
        Model.where('not an obj')
      }

      expect(shouldThrow).to.throw(Error)
    })

    it('should add `opts` keys to `model._where`', () => {
      Model.where({
        status: 'Open'
      })

      const status = Model._where.get('status')
      expect(status).to.equal('Open')
    })

    it('should keep old keys on `model._where`', () => {
      Model.where({
        name: 'something'
      })

      Model.where({
        id: 1
      })
      const status = Model._where.get('name')
      const id = Model._where.get('id')
      expect(status).to.equal('something')
      expect(id).to.equal(1)
    })
  })

  describe('#with(assoc)', () => {
    it('should be a function', () => {
      expect(Model).to.respondTo('with')
    })

    it('should return name of model that assoc is tied to', () => {
      Model
        .with('second')

      const expected = 'Model2'
      const actual = Model._with.second

      expect(actual).to.equal(expected)
    })

    it('should throw if `assoc` is not a string', () => {
      function shouldThrow () {
        Model.with({})
      }

      expect(shouldThrow).to.throw(Error)
    })

    it('should throw if `assoc` is not on schema', () => {
      function shouldThrow () {
        Model.with('noWay')
      }

      expect(shouldThrow).to.throw(Error)
    })
  })

  xdescribe('#exec()', () => {
    it('should be a function', () => {
      expect(Model).to.respondTo('exec')
    })

    it('should return a Promise', () => {
      const returned = Model
        .exec()
        .then(() => null, () => null)

      expect(returned).to.be.a('promise')
    })

    it('should throw if pool has not been configured', () => {
      const throwModel = arbiter.model('Throw', new Schema('test', {}))
      return expect(throwModel.exec()).to.eventually.be.rejected
    })
  })

  describe('#new()', () => {
    it('should be a function', () => {
      expect(Model).to.respondTo('new')
    })

    it('should return an object', () => {
      expect(Model.new()).to.be.an('object')
    })

    specify('object should have access to Model properties', () => {
      const returned = Model.new()

      expect(returned.schema).to.equal(Model.schema)
    })
  })

  describe('#createGrunts()', () => {
    it('should be a function', () => {
      expect(Model).to.respondTo('createGrunts')
    })
  })

  describe('#clearState()', () => {
    it('should be a function', () => {
      expect(Model).to.respondTo('clearState')
    })

    it('should reset `_fields`, `_where`, `_with` and `_mappings`', () => {
      // add random stuff to fields for test
      Model._fields.something = 'something here'
      Model._where.somethingElse = 'something else here'
      Model.clearState()

      const _fieldsSize = Object.keys(Model._fields).length
      const _whereSize = Model._where.size
      const _withSize = Object.keys(Model._with).length
      const _mappingsSize = Model._mappings.length

      expect(_fieldsSize).to.equal(0)
      expect(_whereSize).to.equal(0)
      expect(_withSize).to.equal(0)
      expect(_mappingsSize).to.equal(0)
    })
  })

  describe('#explain()', () => {
    before(() => { td.replace(console, 'log') })
    after(() => { td.reset() })

    it('should console.log the state of Model', () => {
      Model
        .fields('.')
        .where({
          id: 5
        })

      Model.explain()
      const callCount = td.explain(console.log).callCount
      expect(callCount).to.equal(1)
    })

    it('should return the model for chaining', () => {
      const returned = Model.explain()

      expect(returned).to.equal(Model)
    })
  })
})
