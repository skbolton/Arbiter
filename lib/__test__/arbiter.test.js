const Arbiter = require('../arbiter')

describe('Arbiter Class', () => {
  const mockConnection = { getConnection: jest.fn() }
  const mockConnector = jest.fn(() => mockConnection)
  const fakeModel = jest.fn()
  let arbiter

  beforeEach(() => {
    arbiter = new Arbiter(mockConnector, fakeModel)
  })

  describe('constructor(Connector, Model)', () => {
    it('adds Connector and Model as properties', () => {
      const { Connector, Model } = arbiter

      expect(Connector).toEqual(mockConnector)
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
      expect(mockConnector).toHaveBeenCalled()
    })
  })

  describe('#getConnection()', () => {
    it('rejects when connection has not been made', () => {
      return expect(arbiter.getConnection()).rejects.toThrow()
    })

    it('calls into Connector class to get connection', () => {
      arbiter.configure({})
      arbiter.getConnection()
      expect(mockConnection.getConnection).toHaveBeenCalled()
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
      expect(mockConnection.getConnection).toHaveBeenCalled()
    })
  })
})
