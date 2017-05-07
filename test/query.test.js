const { expect } = require('chai')
const td = require('testdouble')
const Query = require('../lib/model/query')
const Arbiter = require('../lib/arbiter')
const arbiter = new Arbiter()
const { oppSchema } = require('./fixtures/schema')

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

    it('should get all local fields if `.` is an arg', () => {
      query
        .fields('.', 'project.name')

      const expected = [
        'id',
        'name',
        'noAerialPhoto',
        'project.name'
      ]
      const actual = [...query._fields]

      expect(actual).to.eql(expected)
    })

    it('should overwrite `model._fields` with args passed in', () => {
      query
        .fields('name')
        .fields('noAerialPhoto', 'project.name')

      const expected = ['id', 'noAerialPhoto', 'project.name']
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

    it('should add `opts` keys to `model._where`', () => {
      query.where({
        status: 'Open'
      })

      const status = query._where.get('status')
      expect(status).to.equal('Open')
    })

    it('should keep old keys on `model._where`', () => {
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

    it('should return name of model that assoc is tied to', () => {
      query
        .with('lineItems')

      const expected = 'LineItems'
      const actual = query._with.lineItems

      expect(actual).to.equal(expected)
    })

    it('should throw if `assoc` is not a string', () => {
      function shouldThrow () {
        query.with({})
      }

      expect(shouldThrow).to.throw(Error)
    })

    it('should throw if `assoc` is not on schema', () => {
      function shouldThrow () {
        query.with('noWay')
      }

      expect(shouldThrow).to.throw(Error)
    })
  })

  describe('#createGrunts()', () => {
    it('should be a function', () => {
      expect(query).to.respondTo('createGrunts')
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
})
