const { Schema } = require('../../index')

const userSchema = new Schema('User', {
  firstName: 'FirstName',
  lastName: 'LastName'
})

module.exports = (arbiter) => {
  const model = arbiter.getModel('User');
  if (model) {
    return model;
  }

  const User = arbiter.model('User', userSchema)

  return User
}
