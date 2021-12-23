const { Schema } = require('../../index')

const oppSchema = new Schema('Opportunity', {
  name: 'Name',
  status: {
    sf: 'Status',
    writable: true,
    enum: [ 'Active', 'Suspended', 'Inactive' ]
  },
  project: new Schema('Project__c', {
    proposalCAD: new Schema('Proposal_CAD__c', {
      proposalCompleted: 'Proposal_Completed__c'
    })
  })
})

module.exports = (arbiter) => {
  const model = arbiter.getModel('Opportunity');
  if (model) {
    return model;
  }

  const Opportunity = arbiter.model('Opportunity', oppSchema)

  Opportunity.setAssociations({
    lineItems: {
      from: 'id',
      to: 'oppId',
      relation: Opportunity.relations.hasMany,
      model: require('./lineItem')(arbiter)
    }
  })

  return Opportunity
}
