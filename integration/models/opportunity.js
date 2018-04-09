const arbiter = require('../../index')
const { Schema } = arbiter

const oppSchema = new Schema('Opportunity', {
  name: 'Name',
  project: new Schema('Project__c', {
    proposalCAD: new Schema('Proposal_CAD__c', {
      proposalCompleted: 'Proposal_Completed__c'
    })
  })
})

const Opportunity = arbiter.model('Opportunity', oppSchema)

Opportunity.setAssociations({
  lineItems: {
    from: 'id',
    to: 'oppId',
    relation: Opportunity.relations.hasMany,
    model: require('./lineItem')
  }
})

module.exports = Opportunity
