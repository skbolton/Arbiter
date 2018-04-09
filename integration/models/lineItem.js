const arbiter = require('../../index')
const { Schema } = arbiter

const lineItemsSchema = new Schema('OpportunityLineItem', {
  name: 'Name',
  oppId: 'OpportunityId',
  description: 'Description'
})

const LineItem = arbiter.model('LineItem', lineItemsSchema)

module.exports = LineItem
