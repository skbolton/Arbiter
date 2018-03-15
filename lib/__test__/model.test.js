jest.mock('../query')
const mockQuery = require('../query')
const Model = require('../model')

const stubbedQueryFunctions = {
  where: jest.fn().mockReturnThis()
}

mockQuery.mockImplementation(() => stubbedQueryFunctions)

describe('Model class', () => {
  describe('constructor(name, arbiter, schema)', () => {
    it('adds `name` and `schema` s immutable properties to instance', () => {
      const name = 'Name'
      const Schema = {}
      const model = new Model(name, {}, Schema)
      expect(model.schema).toEqual(Schema)
      expect(model.name).toEqual(name)
      // attempt to change the props
      model.name = 'troll'
      model.schema = {}
      expect(model.schema).toEqual(Schema)
      expect(model.name).toEqual(name)
    })

    it('return instance with sfobject property that is same as schema', () => {
      const schema = { sfObject: 'Case' }
      const model = new Model('Name', {}, schema)
      const expected = 'Case'
      const actual = model.sfObject
      expect(actual).toEqual(expected)
    })
  })

  describe('#find(opts)', () => {
    const name = 'Opportunity'
    let model
    beforeEach(() => {
      model = new Model(name, {}, {})
    })

    it('creates a query object and passes`opts` into query.where', () => {
      const opts = {}
      model.find(opts)
      expect(stubbedQueryFunctions.where).toHaveBeenCalledWith(opts)
    })
  })

  describe('#findById(id)', () => {
    let model
    beforeEach(() => {
      model = new Model('opportunity', {}, {})
    })

    it('creates a query object and passes object with id key to query.where', () => {
      const id = 1
      model.findById(1)
      expect(stubbedQueryFunctions.where).toHaveBeenCalledWith({ id })
    })
  })

  describe('#findByIds(ids)', () => {
    let model
    beforeEach(() => {
      model = new Model('opportunity', {}, {})
    })

    it('creates a query object and passes object with ids to query.where', () => {
      const ids = [ 1, 2, 3 ]
      model.findByIds(ids)
      expect(stubbedQueryFunctions.where).toHaveBeenCalledWith({ id: ids })
    })
  })

  describe('#jsforce()', () => {
    const mockConnection = { sobject: jest.fn() }
    const mockArbiter = {
      getConnection: jest.fn().mockResolvedValue(mockConnection)
    }

    const model = new Model('Opportunity', mockArbiter, { sfObject: 'Opportunity' })
    it('gets connection from arbiter and configures to sObject contained in schema', () => {
      return model.jsforce()
        .then(() => expect(mockConnection.sobject).toHaveBeenCalledWith('Opportunity'))
    })
  })

  // implement tests once grunt has been moved to proper place in fs
  describe.skip('#new', () => {})
})
