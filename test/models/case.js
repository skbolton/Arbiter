const { Schema } = require('../../index')

const caseSchema = new Schema('Case', {
  status: {
    sf: 'Status',
    writable: true
  },
  recordTypId: 'RecordTypeId'
})

module.exports = (arbiter) => {
  const model = arbiter.getModel('Case');
  if (model) {
    return model;
  }

  const Case = arbiter.model('Case', caseSchema)

  Case.setAssociations({
    comments: {
      from: 'id',
      to: 'case',
      relation: Case.relations.hasMany,
      model: require('./caseComment')(arbiter)
    }
  })

  return Case
}
