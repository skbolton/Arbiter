# Quick Start
## Install
```shell
# or use yarn
npm install -S arbiter-salesforce
```
## Define
Define Schema, add it to a model, configure connection, and query away!
```js
const arbiter = require('arbiter-salesforce')
// configuring connection can happen after creating models
// but in order to execute queries this needs to happen somewhere in your app
arbiter.configure({
  username: 'John Smith',
  password: 'secretagentman',
  connection: {
    loginUrl: 'http://login.salesforce.com',
  }
})

// create schema
const opportunitySchema = new arbiter.Schema('Opportunity', {
  oppName: 'Name',
  contract: new arbiter.Schema('Contract', {
    status: {
      sf: 'Status',
      writable: true,
      enum: [
        'Active',
        'Inactive',
        'Suspended'
      ]
    }
  }, { root: false })
}, { root: true })

// create model with schema
const Opportunity = arbiter.model('Opportunity', opportunitySchema)

// make a query
Opportunity.findOne({ contract.status: 'Active' })
  .select(['oppName', 'contract.*'])
  .throwIfNotFound()
  .exec()
  .then(opp => {
    // you have an opportunity!
  })

// stash complicated query on model so callers have access to it later
Opportunity.fakeComplicatedQuery = function (whereClauses = {}) {
  return Opportunity.find(whereClauses)
    .select('*')
    // consider not always calling the query but instead returning
    // query to caller to modify and change for their needs
    // otherwise kick of query with
    // .exec() || .execute() || .then(successFn, errorFn)
}
```
