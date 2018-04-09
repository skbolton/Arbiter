const arbiter = require('../../index')
const { Schema } = arbiter

const userSchema = new Schema('User', {
  firstName: 'FirstName',
  lastName: 'LastName'
})

const User = arbiter.model('User', userSchema)

module.exports = User
