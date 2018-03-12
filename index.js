const Arbiter = require('./lib/arbiter')
const Schema = require('./lib/schema/schema')
const Model = require('./lib/model')
const Connection = require('./lib/connection')

const arbiter = new Arbiter(Connection, Model)
arbiter.Schema = Schema
module.exports = arbiter
