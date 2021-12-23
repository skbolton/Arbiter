const { Connection, Model, Arbiter } = require('../index')
const { loginUrl } = require('./connection-vars')
const login = require('./nocks/login')

const connection = {
  loginUrl
}

// Optionally see jsforce debug logs
if (process.env.JSFORCE_DEBUG === 'true') {
  connection.logLevel = 'DEBUG'
}

module.exports = () => {
  // mock login respons
  login()

  const arbiter = new Arbiter(Connection, Model);

  // set up connection
  arbiter.configure({
    connection,
    username: 'Johnny English',
    password: 'Secret_Agent_Man'
  })

  return arbiter
}
