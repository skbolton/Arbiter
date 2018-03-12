const Arbiter = require('../arbiter')

describe('Arbiter Class', () => {
  const fakeConnector = td.constructor(['getConnection'])
  const fakeModel = td.constructor()
  let arbiter

  beforeEach(() => {
    arbiter = new Arbiter(fakeConnector, fakeModel)
  })
  afterEach(td.reset.bind(td))

  describe('constructor(Connector, Model)', () => {
    it('adds Connector and Model as properties', () => {
      const { Connector, Model } = arbiter

      expect(Connector).toEqual(fakeConnector)
      expect(Model).toEqual(fakeModel)
    })

    it('starts without a connection', () => {
      const expected = null
      const actual = arbiter.oracle
      expect(actual).toEqual(expected)
    })
  })

  describe('#configure(config)', () => {
    it('verifies that `config` is an object', () => {
      const shouldThrow = () => {
        arbiter.configure('not an object')
      }

      expect(shouldThrow).toThrow()
    })

    it('sets up the Connector', () => {
      arbiter.configure({})
      expect(arbiter.oracle).toBeInstanceOf(fakeConnector)
    })
  })

  describe('#getConnection()', () => {
    it('rejects when connection has not been made', () => {
      return expect(arbiter.getConnection()).rejects.toThrow()
    })

    it('calls into Connector class to get connection', () => {
      arbiter.configure({})
      arbiter.getConnection()
      td.verify(fakeConnector.prototype.getConnection())
    })
  })

  describe('#model(name, schema)', () => {
    it('registers model by `name` in arbiter', () => {
      const name = 'Opportunity'
      const actual = arbiter.model(name)
      expect(actual).toBeInstanceOf(fakeModel)
    })

    it('throws when registering a name that is already registered', () => {
      const name = 'Opportunity'
      arbiter.model(name)
      const shouldThrow = () => {
        arbiter.model(name)
      }

      expect(shouldThrow).toThrow()
    })
  })

  describe('#query()', () => {
    it('calls getConnection() on Connector if connection has been configured', () => {
      arbiter.configure({})
      arbiter.query()
      td.verify(fakeConnector.prototype.getConnection())
    })
  })
})
