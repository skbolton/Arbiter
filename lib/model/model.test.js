const { expect } = require('chai')
const td = require('testdouble')

const Arbiter = require('../arbiter')
const Schema = require('../schema/schema')
const basicSchema = new Schema('Opportunity', {})

describe('Model', () => {
  let arbiter
  let Model

  beforeEach(() => {
    arbiter = new Arbiter()
    Model = arbiter.model('Opportunity', basicSchema)
  })
  afterEach(() => { Model = null })

  it('should have property `schema`', () => {
    expect(Model).to.haveOwnProperty('schema')
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
    const bigSchema = new Schema('schema', {
      name: 'Name',
      something: 'Something__c',
      child: new Schema('Child', {
        name: 'Name',
        completed: 'Some_Completed_Date__c'
      })
    })

    let arbiter
    let FieldsModel

    beforeEach(() => {
      arbiter = new Arbiter()
      FieldsModel = arbiter.model('Fields', bigSchema)
    })

    afterEach(() => {
      arbiter = null
      FieldsModel = null
    })

    it('should be a function', () => {
      expect(Model).to.respondTo('fields')
    })

    it('should always add `id` to fields', () => {
      FieldsModel.fields('something')
      expect(FieldsModel._fields).to.include.members(['id'])
    })

    it('should get all fields if `*` is an arg', () => {
      FieldsModel
        .fields('*')

      const expected = [
        'id',
        'name',
        'something',
        'child.id',
        'child.name',
        'child.completed'
      ]
      const actual = FieldsModel._fields

      actual.forEach((field, idx) => {
        expect(field).to.equal(expected[idx])
      })

      specify('there should\'t be duplicates of fields', () => {
        FieldsModel
          // * gets all fields, name and child are repeats
          .fields('*', 'name', 'child')
        const expected = [
          'id',
          'name',
          'something',
          'child.id',
          'child.name',
          'child.completed'
        ]
        const actual = FieldsModel._fields

        actual.forEach((field, idx) => {
          expect(field).to.equal(expected[idx])
        })
      })
    })

    it('should get all local fields if `.` is an arg', () => {
      FieldsModel
        .fields('.', 'child.name')

      const expected = [
        'id',
        'name',
        'something',
        'child.name'
      ]
      const actual = FieldsModel._fields

      actual.forEach((field, idx) => {
        expect(field).to.equal(expected[idx])
      })
    })

    it('should overwrite `model._fields` with args passed in', () => {
      FieldsModel._fields = ['name']
      FieldsModel.fields('something', 'child.name')
      expect(FieldsModel._fields).to.include.members(['something', 'child.name'])
      expect(FieldsModel._fields.length).to.equal(3)
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
        status: 'Open'
      })

      Model.where({
        id: 1
      })
      const status = Model._where.get('status')
      const id = Model._where.get('id')
      expect(status).to.equal('Open')
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

    specify('object should have a `changeset` property', () => {
      const doc = Model.doc({})

      expect(doc).to.haveOwnProperty('changeset')
    })
  })

  describe('#buildQuery()', () => {
    const arbiter = new Arbiter()
    const oppSchema = new Schema('Opportunity', {
      name: 'Name',
      status: 'Status',
      noAerialPhoto: {
        sf: 'No_Aerial_Photo__c',
        writable: true
      },
      project: new Schema('Project__r', {
        name: 'Name',
        proposalCAD: new Schema('Proposal_CAD__r', {
          proposalCompleted: 'Proposal_Completed__c'
        })
      })
    })
    const Opportunity = arbiter.model('Opportunity', oppSchema)

    it('should be a function', () => {
      expect(Opportunity).to.respondTo('buildQuery')
    })

    it('should build query based of `model._fields`', () => {
      Opportunity.fields('name', 'project', 'project.proposalCAD')

      // The buildQuery might add spaces to the end of the string
      const actual = Opportunity.buildQuery().trim()
      const expected = 'SELECT Id, Name, Project__r.Id, Project__r.Name, Project__r.Proposal_CAD__r.Id, Project__r.Proposal_CAD__r.Proposal_Completed__c FROM Opportunity'
      expect(actual).to.equal(expected)
    })

    it('should build query off of `model._where`', () => {
      Opportunity
        .fields('name', 'project', 'project.proposalCAD')
        .where({
          id: [1, 2, 3, 4],
          name: 'O-5489',
          status: { notlike: '%hi' },
          project: { not: null },
          'project.proposalCAD.proposalCompleted': { like: '%whatever%' },
          'project.name': { not: null },
          noAerialPhoto: null
        })

      const actual = Opportunity.buildQuery()
      const expected = "SELECT Id, Name, Project__r.Id, Project__r.Name, Project__r.Proposal_CAD__r.Id, Project__r.Proposal_CAD__r.Proposal_Completed__c FROM Opportunity WHERE Id IN ('1', '2', '3', '4') AND Name = 'O-5489' AND (NOT Status LIKE '%hi') AND Project__r != null AND Project__r.Proposal_CAD__r.Proposal_Completed__c LIKE '%whatever%' AND Project__r.Name != null AND No_Aerial_Photo__c = null"
      expect(actual).to.equal(expected)
    })
  })

  describe('#getResultSkeleton()', () => {
    const arbiter = new Arbiter()
    const oppSchema = new Schema('Opportunity', {
      name: 'Name',
      status: 'Status',
      noAerialPhoto: {
        sf: 'No_Aerial_Photo__c',
        writable: true
      },
      project: new Schema('Project__r', {
        name: 'Name',
        proposalCAD: new Schema('Proposal_CAD__r', {
          proposalCompleted: 'Proposal_Completed__c'
        })
      })
    })

    let Opportunity
    beforeEach(() => {
      Opportunity = arbiter.model('Opportunity', oppSchema)
    })

    afterEach(() => {
      Opportunity = null
    })

    it('should build up a result object based on Model._fields', () => {
      Opportunity
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
      const actual = Opportunity.getResultSkeleton()
      expect(Object.keys(actual)).to.include.members(['id', 'name', 'project'])
      expect(actual.project.proposalCAD).to.have.haveOwnProperty('proposalCompleted')
    })
  })

  describe('#mapResult(result)', () => {
    const testSchema = new Schema('mapResults', {
      name: 'Name',
      somethingElse: 'Something_Else__c',
      child: new Schema('Child__r', {
        name: 'Name',
        nestedField: 'Nested_Field__c',
        child2: new Schema('Child_2__r', {
          deep: 'Super_Deep_Field__c'
        })
      })
    })

    const arbiter = new Arbiter()
    const MapResultsModel = arbiter.model('MapResults', testSchema)
    // fake salesforce response
    const queryResult = {
      Name: 'Some Name',
      Something_Else__c: 1234,
      Child__r: {
        Name: 'Some Child Name',
        'Nested_Field__c': 1234
        // leaving child2 off on purpose
      }
    }

    it('should `expectedShape` and add `queryShape` values', () => {
      MapResultsModel
        .fields('*')
        .buildQuery()
      const mappedResults = MapResultsModel.mapResult(queryResult)

      expect(mappedResults.name).to.equal('Some Name')
      expect(mappedResults.somethingElse).to.equal(1234)
      expect(mappedResults.child.name).to.equal('Some Child Name')
      expect(mappedResults.child.nestedField).to.equal(1234)
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
    const arbiter = new Arbiter()
    const explainSchema = new Schema('Opportunity', {
      name: 'Name',
      writable: {
        writable: true,
        sf: 'Writable__c'
      },
      child: new Schema('Child', {
        name: 'Name',
        something: 'Something_Weird__c'
      })
    })

    before(() => { td.replace(console, 'log') })
    after(() => { td.reset() })

    const Opportunity = arbiter.model('Opportunity', explainSchema)

    it('should console.log the state of Model', () => {
      Opportunity
        .fields('.', 'child.name')
        .where({
          id: 5
        })

      Opportunity.explain()
      const callCount = td.explain(console.log).callCount
      expect(callCount).to.equal(1)
    })

    it('should return the model for chaining', () => {
      const returned = Opportunity.explain()

      expect(returned).to.equal(Opportunity)
    })
  })
})
