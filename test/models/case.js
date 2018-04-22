const arbiter = require('../../index')
const { Schema } = arbiter

const caseSchema = new Schema('Case', {
  status: {
    sf: 'Status',
    writable: true
  },
  recordTypId: 'RecordTypeId'
})

const Case = arbiter.model('Case', caseSchema)

Case.setAssociations({
  comments: {
    from: 'id',
    to: 'case',
    relation: Case.relations.hasMany,
    model: require('./caseComment')
  }
})

module.exports = Case
