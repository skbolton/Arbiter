const Arbiter = require('./lib/arbiter')
const Schema = require('./lib/schema/schema')

const arbiter = new Arbiter()
arbiter.Schema = Schema
module.exports = arbiter
