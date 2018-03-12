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

exports.update = (object, id) => {
  const url = new RegExp(`^\\/services\\/data\\/v\\d{2}\\.\\d+\\/sobjects\\/${object}\\/${id}`)
  return nock(connection.serverUrl)
    .patch(url)
    .reply(200, {})
}

exports.create = object => {
  const url = new RegExp(`^\\/services\\/data\\/v\\d{2}\\.\\d+\\/sobjects\\/${object}`)
  return nock(connection.serverUrl)
    .post(url)
    .reply(201, {})
}
