const Schema = require('../../lib/schema/schema')

const oppSchema = new Schema('Opportunity', {
  name: 'Name',
  noAerialPhoto: {
    sf: 'No_Aerial_Photo__c',
    type: 'boolean',
    writable: true
  },
  project: new Schema('Project__r', {
    name: 'Name',
    proposalCAD: new Schema('Proposal_CAD__r', {
      proposalCompleted: 'Proposal_Completed__c'
    })
  }),
  service: new Schema('Service__r', {
    serviceNumber: 'Service_Number__c',
    name: 'Name'
  }),
  lineItems: {
    assoc: 'LineItems'
  }
})

const lineItemsSchema = new Schema('OpportunityLineItem', {
  oppId: {
    sf: 'OpportunityId',
    rel: 'Opportunity'
  },
  createdById: {
    sf: 'CreatedById',
    writable: true,
    required: true
  },
  createdOn: {
    sf: 'CreatedDate',
    writable: true,
    default: () => new Date()
  },
  productCode: {
    sf: 'ProductCode',
    writable: true,
    required: true,
    type: 'string'
  }
})

module.exports = {
  oppSchema,
  lineItemsSchema
}
