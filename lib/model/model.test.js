const { expect } = require('chai')
const td = require('testdouble')

const Arbiter = require('../arbiter')
const Schema = require('../schema/schema')
const schema = new Schema('Schema', {
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
  })
})

const queryResult = {
  attributes: {
    whatever: 'this is metadata from sf that gets deleted'
  },
  Id: 1,
  Name: 'Some Name',
  // leaving of No_Aerial_Photo__c on purpose
  Project__r: {
    Name: 'Some Child Name'
    // leaving proposalCAD off on purpose
  }
}

describe('Model', () => {
  let arbiter
  let Model

  beforeEach(() => {
    arbiter = new Arbiter()
    Model = arbiter.model('Model', schema)
  })
  afterEach(() => { Model = null })

  it('should have property `__schema`', () => {
    expect(Model).to.haveOwnProperty('__schema')
  })

  it('should have property `_fields`', () => {
    expect(Model).to.haveOwnProperty('_fields')
  })

  it('should have property `_where`', () => {
    expect(Model).to.haveOwnProperty('_where')
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

  describe('#with(opts)', () => {
    it('should be a function', () => {
      expect(Model).to.respondTo('with')
    })

    it('should throw if `opts` is not an object', () => {
      function shouldThrow () {
        Model.with('not an obj')
      }

      expect(shouldThrow).to.throw(Error)
    })
  })

  describe('#exec()', () => {
    it('should be a function', () => {
      expect(Model).to.respondTo('exec')
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

  describe('#doc()', () => {
    it('should be a function', () => {
      expect(Model).to.respondTo('doc')
    })

    it('should return an object', () => {
      expect(Model.doc({})).to.be.an('object')
    })

    specify('object should have a `_changeset` property', () => {
      const doc = Model.doc({})

      expect(doc).to.haveOwnProperty('_changeset')
    })

    it('should add values to `_changset` when they are changed', () => {
      // needed to build up fields on model
      Model
        .fields('name', 'noAerialPhoto', 'project', 'project.proposalCAD')
        .buildQuery()

      const result = Model.mapResult(queryResult)
      const doc = Model.doc(result)

      doc.noAerialPhoto = true
      expect(doc._changeset).to.haveOwnProperty('No_Aerial_Photo__c')
    })
  })

  describe('#buildQuery()', () => {
    it('should be a function', () => {
      expect(Model).to.respondTo('buildQuery')
    })

    it('should build query based of `model._fields`', () => {
      Model.fields('name', 'project', 'project.proposalCAD')

      // The buildQuery might add spaces to the end of the string
      const actual = Model.buildQuery().trim()
      const expected = 'SELECT Id, Name, Project__r.Id, Project__r.Name, Project__r.Proposal_CAD__r.Id, Project__r.Proposal_CAD__r.Proposal_Completed__c FROM Schema'
      expect(actual).to.equal(expected)
    })

    it('should build query off of `model._where`', () => {
      Model
        .fields('name', 'project', 'project.proposalCAD')
        .where({
          id: [1, 2, 3, 4],
          name: 'O-5489',
          service: { notlike: '%hi' },
          project: { not: null },
          'project.proposalCAD.proposalCompleted': { like: '%whatever%' },
          'project.name': { not: null },
          noAerialPhoto: null
        })

      const actual = Model.buildQuery()
      const expected = "SELECT Id, Name, Project__r.Id, Project__r.Name, Project__r.Proposal_CAD__r.Id, Project__r.Proposal_CAD__r.Proposal_Completed__c FROM Schema WHERE Id IN ('1', '2', '3', '4') AND Name = 'O-5489' AND (NOT Service__r LIKE '%hi') AND Project__r != null AND Project__r.Proposal_CAD__r.Proposal_Completed__c LIKE '%whatever%' AND Project__r.Name != null AND No_Aerial_Photo__c = null"
      expect(actual).to.equal(expected)
    })
  })

  describe('#getResultSkeleton()', () => {
    it('should build up a result object based on Model._fields', () => {
      Model
        .find()
        .fields('name', 'project', 'project.proposalCAD.proposalCompleted')

      // expected shape
      // {
      //   id: undefined,
      //   name: undefined,
      //   project: {
      //     name: undefined,
      //     proposalCAD: {
      //       proposalCompleted: undefined
      //     }
      //   }
      // }
      const actual = Model.getResultSkeleton()
      expect(Object.keys(actual)).to.include.members(['id', 'name', 'project'])
      expect(actual.project.proposalCAD).to.have.haveOwnProperty('proposalCompleted')
    })
  })

  describe('#mapResult(result)', () => {
    it('should return mapped object based off `Model._fields`', () => {
      Model
        .fields('name', 'noAerialPhoto', 'project', 'project.proposalCAD')
        .buildQuery()
      const mappedResults = Model.mapResult(queryResult)

      expect(mappedResults.name).to.equal('Some Name')
      expect(mappedResults.noAerialPhoto).to.equal(null)
      expect(mappedResults.project.name).to.equal('Some Child Name')
      expect(mappedResults.project.proposalCAD).to.be.an('object')
    })
  })

  describe('#clearQuery()', () => {
    it('should be a function', () => {
      expect(Model).to.respondTo('clearQuery')
    })

    it('should empty `_fields`, `_where`, and mappings fields', () => {
      // add random stuff to fields for test
      Model._fields.something = 'something here'
      Model._where.somethingElse = 'something else here'
      Model.clearQuery()

      const _fieldsSize = Object.keys(Model._fields).length
      const _whereSize = Model._where.size
      const _mappingsSize = Model._mappings.length

      expect(_fieldsSize).to.equal(0)
      expect(_whereSize).to.equal(0)
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
