const nock = require('nock')
const connection = require('../connection-vars')

exports.query = response =>
  nock(connection.serverUrl)
  .get(/^\/services\/data\/v\d{2}\.\d+\/query\?q=.*/)
    .reply(200, {
      records: Array.isArray(response) ? response : [ response ]
    })

exports.empty = () =>
  nock(connection.serverUrl)
    .get(/^\/services\/data\/v\d{2}\.\d+\/query\?q=.*/)
    .reply(200, { records: [] })
