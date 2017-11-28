const { expect } = require('chai')
const td = require('testdouble')
const Query = require('../query')
const Arbiter = require('../../arbiter')
const arbiter = new Arbiter()
const { oppSchema } = require('../../../test/fixtures/schema')
const {
  missingProject,
  multipleQueryResults
} = require('../../../test/fixtures/queryResult')

const Opportunity = arbiter.model('Opportunity', oppSchema)

describe('Query Class', () => {
  let query

  beforeEach(() => {
    query = new Query(Opportunity, oppSchema)
  })

  afterEach(() => {
    query = null
  })

  describe('constructor(model, schema)', () => {
    it('should return query instance', () => {
      const returned = new Query(Opportunity, oppSchema)

      expect(returned).to.be.an.instanceof(Query)
    })

    specify('query should have _fields property', () => {
      expect(query).to.haveOwnProperty('_fields')
    })

    specify('query should have _mappings property', () => {
      expect(query).to.haveOwnProperty('_mappings')
    })

    specify('query should have _where property', () => {
      expect(query).to.haveOwnProperty('_where')
    })

    specify('query should have _queryString property', () => {
      expect(query).to.haveOwnProperty('_queryString')
    })

    specify('query should have _with property', () => {
      expect(query).to.haveOwnProperty('_with')
    })

    specify('query should have model property', () => {
      expect(query).to.haveOwnProperty('model')
    })

    specify('query should have schema property', () => {
      expect(query).to.haveOwnProperty('schema')
    })
  })

  describe('#fields(...fields)', () => {
    it('should be a function', () => {
      expect(query).to.respondTo('fields')
    })

    it('should always add `id` to fields', () => {
      query.fields('name')
      expect(query._fields.has('id')).to.equal(true)
    })

    it('should get all fields if `*` is an arg', () => {
      query
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
      const actual = [...query._fields]

      expect(actual).to.eql(expected)
    })

    specify('there should\'t be duplicates of fields', () => {
      query
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
      const actual = [...query._fields]

      expect(actual).to.eql(expected)
    })

    // The implementation looks for '.', removes it, and adds all fields to the end of collection
    // order of fields doesn't really make a difference
    it('should get all local fields if `.` is an arg', () => {
      query
        .fields('.', 'project.name')

      const expected = [
        'id',
        'project.name',
        'name',
        'noAerialPhoto'
      ]
      const actual = [...query._fields]

      expect(actual).to.eql(expected)
    })

    it('should not overwrite `model._fields` with args passed in', () => {
      query
        .fields('name')
        .fields('noAerialPhoto', 'project.name')

      const expected = ['id', 'name', 'noAerialPhoto', 'project.name']
      const actual = [ ...query._fields ]

      expect(actual).to.eql(expected)
    })

    it('should return the query for chaining', () => {
      const returned = query.fields()
      expect(returned).to.equal(query)
    })
  })

  describe('#where(opts)', () => {
    it('should be a function', () => {
      expect(query).to.respondTo('where')
    })

    it('should throw if `opts` is not an object', () => {
      function shouldThrow () {
        query.where('not an obj')
      }

      expect(shouldThrow).to.throw(Error)
    })

    it('should add `opts` keys to `query._where`', () => {
      query.where({
        status: 'Open'
      })

      const status = query._where.get('status')
      expect(status).to.equal('Open')
    })

    it('should keep old keys on `query._where`', () => {
      query.where({
        name: 'something'
      })

      query.where({
        id: 1
      })
      const status = query._where.get('name')
      const id = query._where.get('id')
      expect(status).to.equal('something')
      expect(id).to.equal(1)
    })
  })

  describe('#with(assoc)', () => {
    it('should be a function', () => {
      expect(query).to.respondTo('with')
    })

    it('should add all fields and empty where when `assoc` is a string', () => {
      query
        .with('lineItems')

      const expected = { model: 'LineItems', fields: ['*'], where: {} }
      const actual = query._with.get('lineItems')

      expect(actual).to.eql(expected)
    })

    it('should add fields and where from `assoc` when it is an object', () => {
      const fields = [ 'field', 'otherField' ]
      const where = { field: 'hi' }
      query
        .with({ lineItems: { fields, where } })

      const actual = query._with.get('lineItems')

      expect(actual.fields).to.eql(fields)
      expect(actual.where).to.eql(where)
    })

    it('should throw if association doesn\'t exist', () => {
      function shouldThrowAsString () {
        query.with('haha')
      }

      function shouldThrowAsObj () {
        query.with({ nope: { fields: [], where: {} } })
      }

      expect(shouldThrowAsString).to.throw(Error)
      expect(shouldThrowAsObj).to.throw(Error)
    })

    it('should throw if `assoc` is not on schema', () => {
      function shouldThrow () {
        query.with('noWay')
      }

      expect(shouldThrow).to.throw(Error)
    })
  })

  describe('#createGruntSkeletons()', () => {
    it('should be a function', () => {
      expect(query).to.respondTo('createGruntSkeletons')
    })

    it('should create a skeleton for every query result', () => {
      query
        .fields('name', 'noAerialPhoto', 'project', 'service')

      const returned = query.createGruntSkeletons(multipleQueryResults)

      expect(returned).to.have.length(2)
    })
  })

  describe('#formatSkeleton(queryResult)', () => {
    it('should be a function', () => {
      expect(query).to.respondsTo('formatSkeleton')
    })

    it('should return skeleton with all fields on it', () => {
      query
        .fields('name', 'noAerialPhoto', 'project', 'service')

      // doesn't have a project key should put object in place
      const skeleton = query.formatSkeleton(missingProject)

      expect(skeleton.project).to.be.an('object')
    })
  })

  describe('#explain()', () => {
    let logger
    before(() => {
      logger = td.function('logger')
      td.when(logger()).thenReturn('what?')
    })
    after(() => { td.reset() })

    it('should call logging function with state of query', () => {
      query
        .fields('.')
        .where({
          id: 5
        })

      query.explain(logger)
      const callCount = td.explain(logger).callCount
      expect(callCount).to.equal(1)
    })

    it('should return the query for chaining', () => {
      const returned = query.explain(logger)

      expect(returned).to.equal(query)
    })
  })

  describe('#buildSelect()', () => {
    it('should return a string', () => {
      query.fields('name', 'noAerialPhoto', 'project')
      const returned = query.buildSelect()

      expect(returned).to.be.a('string')
    })

    specify('string should be mapped version of fields', () => {
      query.fields('name', 'noAerialPhoto', 'project')

      const expected = 'SELECT Id, Name, No_Aerial_Photo__c, Project__r.Id, Project__r.Name'
      const actual = query.buildSelect()

      expect(actual).to.equal(expected)
    })
  })

  describe('#buildQuery()', () => {
    it('should return a string', () => {
      query.fields('name')

      const returned = query.buildQuery()

      expect(returned).to.be.a('string')
    })

    it('should take `_fields` and `_where` state and build query', () => {
      query
        .fields('name', 'service', 'project')
        // test all the where possibilites
        .where({
          id: [1, 2, 3, 4],
          name: true,
          'service.serviceNumber': { not: null },
          'project.name': { like: '%Something' },
          noAerialPhoto: { gt: 5, lte: 10 }
        })

      const expected = "SELECT Id, Name, Service__r.Id, Service__r.Service_Number__c, Service__r.Name, Project__r.Id, Project__r.Name FROM Opportunity WHERE Id IN ('1', '2', '3', '4') AND Name = true AND Service__r.Service_Number__c != null AND Project__r.Name LIKE '%Something' AND No_Aerial_Photo__c > '5' AND No_Aerial_Photo__c <= '10'"
      const actual = query.buildQuery()

      expect(actual).to.equal(expected)
    })

    it('should take `_fields`, `_where`, `_limit`, `_orderBy` state and build query', () => {
      query
        .fields('name', 'service', 'project')
        // test all the where possibilites
        .where({
          id: [1, 2, 3, 4],
          name: true,
          'service.serviceNumber': { not: null },
          'project.name': { like: '%Something' },
          noAerialPhoto: { gt: 5, lte: 10 }
        })
        .limit(10)
        .orderBy('name')

      const expected = "SELECT Id, Name, Service__r.Id, Service__r.Service_Number__c, Service__r.Name, Project__r.Id, Project__r.Name FROM Opportunity WHERE Id IN ('1', '2', '3', '4') AND Name = true AND Service__r.Service_Number__c != null AND Project__r.Name LIKE '%Something' AND No_Aerial_Photo__c > '5' AND No_Aerial_Photo__c <= '10' LIMIT 10 ORDER BY Name asc"
      const actual = query.buildQuery()

      expect(actual).to.eql(expected)
    })
  })

  describe('#offset(num)', () => {
    it('`num` should be stored at `_offset`', () => {
      query.offset(5)
      const expected = 5
      const actual = query._offset

      expect(actual).to.equal(expected)
    })

    it('should throw if `num` is not a number', () => {
      function shouldThrow () {
        query.offset('not an number')
      }

      expect(shouldThrow).to.throw(Error)
    })
  })

  describe('#limit(num)', () => {
    it('`num` should be stored at `_limit`', () => {
      query.limit(5)
      const expected = 5
      const actual = query._limit

      expect(actual).to.equal(expected)
    })

    it('should throw if `num` is not a number', () => {
      function shouldThrow () {
        query.limit('not a number')
      }

      expect(shouldThrow).to.throw(Error)
    })
  })

  describe('#orderBy(field, ?dir)', () => {
    it('should store { dir: `asc`, value: field } at _orderBy', () => {
      query.orderBy('name')
      const expected = {
        dir: 'asc',
        value: 'Name'
      }
      const actual = query._orderBy

      expect(actual).to.eql(expected)
    })

    it('should store { dir: `desc`, value: field } at _orderBy', () => {
      query.orderBy('name', 'desc')
      const expected = {
        dir: 'desc',
        value: 'Name'
      }
      const actual = query._orderBy

      expect(actual).to.eql(expected)
    })

    it('should default to `asc` when a bad `dir` is given', () => {
      query.orderBy('name', '1 Direction')
      const expected = {
        dir: 'asc',
        value: 'Name'
      }
      const actual = query._orderBy

      expect(actual).to.eql(expected)
    })
  })

  describe('#buildOffset()', () => {
    it('should return `OFFSET num` where `_offset = num` ', () => {
      query.offset(5)
      const expected = 'OFFSET 5'
      const actual = query.buildOffset()

      expect(actual).to.equal(expected)
    })

    it('should return an empty string when `_offset === null`', () => {
      const expected = ''
      const actual = query.buildOffset()

      expect(actual).to.equal(expected)
    })
  })

  describe('#buildLimit()', () => {
    it('should return `LIMIT num` where `_limit = num`', () => {
      query.limit(5)
      const expected = 'LIMIT 5'
      const actual = query.buildLimit()

      expect(actual).to.equal(expected)
    })

    it('should return an empty string when `_limit === null`', () => {
      const expected = ''
      const actual = query.buildLimit()

      expect(actual).to.equal(expected)
    })
  })

  describe('#buildOrderBy()', () => {
    it('should return `ORDER BY Name asc` where `orderBy(`name`)`', () => {
      query.orderBy('name')
      const expected = 'ORDER BY Name asc'
      const actual = query.buildOrderBy()

      expect(actual).to.equal(expected)
    })

    it('should return an empty string when `_orderBy === null`', () => {
      const expected = ''
      const actual = query.buildOrderBy()

      expect(actual).to.equal(expected)
    })
  })

  // toString
  describe('#toString()', () => {
    it('should return a string', () => {
      query.fields('name')

      const returned = query.toString()

      expect(returned).to.be.a('string')
    })
  })
})
