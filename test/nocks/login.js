const nock = require('nock')
const connection = require('../connection-vars')

module.exports = () =>
  nock(connection.loginUrl)
    .post(/^\/services\/Soap\/u\//)
    .reply(200,
      `
        <soapenv:Body>
          <serverUrl>${connection.serverUrl}</serverUrl>
          <organizationId>${connection.organizationId}</organizationId>
          <userId>${connection.userId}</userId>
          <sessionId>${connection.sessionId}</sessionId>
        </soapenv:Body>
      `
    )
