jest.mock('jsforce')

const mockJsForce = require('jsforce')
const Oracle = require('../connection')

describe('Oracle Connection Class', () => {
  const config = {
    username: 'Ralph',
    password: 'secretagentman',
    maxConnectionTime: 100,
    connection: {
      loginUrl: 'salesforce.com'
    }
  }

  let oracle
  let mockConnection = { login: jest.fn() }
  beforeEach(() => {
    mockJsForce.Connection.mockImplementation(() => mockConnection)
    oracle = new Oracle(config)
  })

  describe('constructor(config)', () => {
    it('throws when all required fields are not passed in', () => {
      // could make this dynamic but keeping tests simple
      const badConfig1 = Object.assign({}, config)
      delete badConfig1.username
      const badConfig2 = Object.assign({}, config)
      delete badConfig2.password
      const badConfig3 = Object.assign({}, config)
      delete badConfig3.connection

      const shouldThrow = (badConfig) => {
        return new Oracle(badConfig)
      }

      [badConfig1, badConfig2, badConfig3].map(config => {
        expect(shouldThrow.bind(null, config)).toThrow()
      })
    })
  })

  it('connects to jsforce when config is valid', () => {
    const oracle = new Oracle(config, mockJsForce) // eslint-disable-line no-unused-vars
    expect(mockJsForce.Connection).toHaveBeenCalledWith(config.connection)
  })

  describe('#getConnection()', () => {
    it('calls login to setup connection', () => {
      return oracle.getConnection()
        .then(() => {
          return expect(mockConnection.login).toHaveBeenCalledWith(config.username, config.password)
        })
    })

    it('reuses same connection if maxConnectionTime has not expired', () => {
      return oracle.getConnection()
        .then(() => oracle.getConnection())
        .then(() => {
          expect(mockConnection.login).toHaveBeenCalledTimes(1)
        })
    })

    it('logins an and sets up new connection if maxConnectionTime has elapsed', () => {
      return oracle.getConnection()
        .then(() =>
          new Promise((resolve, reject) => {
            // resolve promise after maxConnectionTime amount
            setTimeout(resolve, config.maxConnectionTime * 1.1)
          })
        )
        .then(() => oracle.getConnection())
        .then(() => {
          expect(mockConnection.login).toHaveBeenCalledTimes(2)
        })
    })
  })
})
