const jsforce = require('jsforce')
const { struct } = require('superstruct')

const ConnectionConfig = struct({
  username: 'string',
  password: 'string',
  maxConnectionTime: 'number',
  connection: {
    oath2: 'string?',
    logLevel: struct.enum([undefined, 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']),
    version: 'string?',
    maxRequest: 'number?',
    // jsforce doesn't require a login url but we need to for Arbiter to work
    loginUrl: 'string',
    instanceUrl: 'string?',
    accessToken: 'string?',
    sessionId: 'string?',
    refreshToken: 'string?',
    signedRequest: 'string?',
    proxyUrl: 'string?',
    httpProxy: 'string?'
  }
}, {
  // defaults
  maxConnectionTime: 6 * 60 * 60 * 1000 // 6 hours
})

const _maxConnectionTime = Symbol('maxConnectionTime')
const _connection = Symbol('connection')
const _connectionPromise = Symbol('connectionPromise')
const _initializedAt = Symbol('initializedAt')
const _config = Symbol('config')

/**
 * @class Oracle
 * @classdesc A Salesforce connection object, responsible for managing
 * salesforce connection sessions
 */
class Oracle {
  /**
   * Connection manager for Arbiter
   * @param {ConnectionConfig}
   * @param {object} - connectionUtil - used for testing defaults to jsforce
   * @return {Connection} The connection object
   */
  constructor (config) {
    // this will throw if config is invalid
    const connectionConfig = ConnectionConfig(config)
    this[_maxConnectionTime] = connectionConfig.maxConnectionTime
    this[_connection] = new jsforce.Connection(connectionConfig.connection)
    this[_config] = connectionConfig

    this.invalidateConnection()
  }

  /**
   * @name Connection#getConnection
   * @function
   * @description Gets the current connection, or create a new one if the
   * current connection doesn't exist or is invalid
   * @returns {Promise} resolves to the raw jsforce connection object
   */
  getConnection () {
    if (this.hasValidConnection) return this[_connectionPromise]

    let username = this[_config].username
    let password = this[_config].password

    let accessToken = this[_config].connection.accessToken
    if (accessToken) password += accessToken

    this[_initializedAt] = Date.now()
    this[_connectionPromise] = Promise.resolve()
      .then(() => this[_connection].login(username, password))
      .then(() => this[_connection])
      .catch(err => {
        this.invalidateConnection()
        throw err
      })

    return this[_connectionPromise]
  }

  /**
   * @name Connection#invalidateConnection
   * @function
   * @description Invalidates the current connection. The next time
   * getConnection is called, it will create a new salesforce connection
   * @returns {null} doesn't return anything
   */
  invalidateConnection () {
    this[_initializedAt] = null
  }

  /**
   * @name Connection#_hasValidConnection
   * @member {boolean}
   * @private
   * @description returns whether or not the current connection is valid or not.
   */
  get hasValidConnection () {
    if (!this[_connectionPromise] || !this[_initializedAt]) return false
    if (this.connectionLength > this[_maxConnectionTime]) return false

    return true
  }

  /**
   * @name Connection#connectionLength
   * @member {number}
   * @description returns the amount of time (in ms) that the current connection
   * has been alive
   */
  get connectionLength () {
    if (!this[_initializedAt]) return 0
    return Date.now() - this[_initializedAt]
  }
}

module.exports = Oracle
