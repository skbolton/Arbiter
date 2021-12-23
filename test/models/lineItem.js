const { Schema } = require('../../index')

const lineItemsSchema = new Schema('OpportunityLineItem', {
  name: 'Name',
  oppId: 'OpportunityId',
  description: 'Description'
})

module.exports = (arbiter) => {
  const model = arbiter.getModel('LineItem');
  if (model) {
    return model;
  }

  const LineItem = arbiter.model('LineItem', lineItemsSchema)

  return LineItem
}
