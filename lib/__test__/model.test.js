jest.mock('../query')
const mockQuery = require('../query')
const Model = require('../model')

const stubbedQueryFunctions = {
  where: jest.fn().mockReturnThis(),
  first: jest.fn()
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

  // TODO: add more tests for validation
  describe('#setAssociations(config)', () => {
    const associatedModel = new Model('Associated', {}, {})
    let model
    beforeEach(() => {
      model = new Model('Model', {}, {})
    })
    it('adds config to _associations if valid', () => {
      const input = {
        associated: {
          from: 'id',
          to: 'otherField',
          model: associatedModel,
          relation: 'hasMany'
        }
      }
      model.setAssociations(input)
      const expected = input
      const actual = model._associations

      expect(actual).toEqual(expected)
    })

    it('throws if `config` does not contain all requied values', () => {
      const input = {
        associated: {
          // missing -> from: 'id',
          to: 'otherFieldOnAssociatedModel',
          model: associatedModel,
          relation: 'hasMany'
        }
      }

      const shouldThrow = () => model.setAssociations(input)

      expect(shouldThrow).toThrow(Error)
    })
  })

  describe('#getAssociation(name)', () => {
    const model = new Model('Model', {}, {})
    const associationConfig = {
      associated: {
        from: 'id',
        to: 'otherFieldOnAssociatedModel',
        relation: 'hasMany',
        model: new Model('AssociatedModel', {}, {})
      }
    }
    model.setAssociations(associationConfig)

    it('looks up config by name', () => {
      const expected = associationConfig.associated
      const actual = model.getAssociation('associated')

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
      const ids = [1, 2, 3]
      model.findByIds(ids)
      expect(stubbedQueryFunctions.where).toHaveBeenCalledWith({ id: ids })
    })
  })

  describe('#sobject()', () => {
    const mockConnection = { sobject: jest.fn() }
    const mockArbiter = {
      getConnection: jest.fn().mockResolvedValue(mockConnection)
    }

    const model = new Model('Opportunity', mockArbiter, {
      sfObject: 'Opportunity'
    })
    it('gets connection from arbiter and configures to sObject contained in schema', () => {
      return model
        .sobject()
        .then(() =>
          expect(mockConnection.sobject).toHaveBeenCalledWith('Opportunity')
        )
    })
  })

  // implement tests once grunt has been moved to proper place in fs
  describe.skip('#new', () => {})
})
