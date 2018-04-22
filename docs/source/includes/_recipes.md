# Recipe Book

## Composable queries

> Returning the query instance for additional modification

```js
const arbiter = require('arbiter')
// leaving out schema details for brevity
const oppSchema = new arbiter.Schema('Case', {})

const Case = arbiter.model('Case', oppSchema)

// Notice that by calling find and where
// that we are adding up the state of the two
// one doesn't overwrite the other unless they
// contain the same field
Case.byStatus = function (status, whereClauses = {}) {
  return Case.find({ status })
    .select('*')
    .where(whereClauses)
}
```

A lot of flexibility is available by leveraging the composabilty of queries. Since their state is cumulative you can accept outside input and add it to the query. We have also found that it is advantageous to not execute the query inside a function attached to the model. By returning the query you allow the outside world to attach more fields and other query state to shape the query different for their needs. Doing this will make a lot more of your queries reusable in other places in your app and trims down on code.

At a minimum consider having all of your query functions accept a where clause argument. This is generally the part that makes one query unique over another or helps make queries more composable.

This is not always possible and sometimes you have to execute queries in order to supply the right data or maybe you don't want the abstraction of the query to show up outside of the model. But if you find yourself seeing an existing query that is very close to what you need consider changing your apis to this style and being more extensible.

## Reusable Schemas

> Extract the field config into a seperate file

```js
// opportunity.js
module.exports = {
  name: 'Name',
  status: {
    sf: 'Status',
    enum: ['Active', 'Suspended', 'Inactive'],
    writable: true,
    default: 'Active'
  }
}

// service.js
module.exports = {
  name: 'Name',
  assignedTo: {
    sf: 'Assigned_To__c',
    writable: true,
    required: true
  }
}

// building the schema
const arbiter = require('arbiter')
const opportunityConfig = require('./opportunity')
const serviceConfig = require('./service')

// notice how we don't have to define the field configs here now
const opportunitySchema = new arbiter.Schema('Opporunity', opportunityConfig)
const serviceSchema = new arbiter.Schema('Service__c', serviceConfig)

opportunitySchema.addChildSchema('service', serviceSchema)
```

There might come a point when working with Arbiter when you have to use the same schema object in multiple schema trees. You could just redefine the schema fields and deal with the possiblilty of the two getting out of sync. Or what you can do is pull out the basic structure of each of your schemas into seperate files. Then require those files when you are building up your schema trees.

This makes it so that you have a lot less schemas to write over and over and you can move much faster. It also means that you can no longer do a nested schema definition and you will need to the the [`addChildSchema`](#nested-schemas) api for building up the objects.

This is optional but highly recommended since writing schema configs can be cumbersome and its nice to only have to do it once per object you will interface with.
