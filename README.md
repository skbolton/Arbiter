# Arbiter
## NOTE: THIS IS IN BETA AND SHOULD NOT BE USED IN PRODUCTION YET
As good of a tool as Salesforce can be, it definitely has some downsides. Managing and building SOQL queries can be cumbersome. Also working directly with Salesforce fields is horrible, `Custom__r.Another_Custom__r.Id` anyone?

Arbiter's mission is to ease the pain or using Salesforce as a software developer. It is not trying to be a tool to edit and set up your Salesforce objects and relations (you are still going to need developers to do that). While Arbiter is not a true ORM it does provide many of the awesome features that you lean on an ORM for. Including a awesome query building syntax, customized schema mappings, and ease of reading and writing to your Salesforce. Heavily inspired by [Mongoosejs](https://github.com/Automattic/mongoose), Arbiter tries to keep its API as close to Mongoose as possible while matching the needs of working with Salesforce.

## Usage
This is a basic rundown of Arbiter's usage. See below sections for full description of each part of the API.
```js
const arbiter = require('arbiter')

// setup connection
arbiter.configure({
  maxConnDuration: 10.000,
  maxRetries: 2,
  maxEventListeners: 100,
  salesforce: {
    Username:        'salesforceapi@salesforce.com',
    Password:        'salesforcepassword',
    Endpoint:        'https://test.salesforce.com',//login.salesforce.com
    SecurityToken:   'thisisasecuritytoken',
  }
})

const OpportunitySchema = new arbiter.Schema('Opportunity', {
  id: 'Id', // this is actually done for you automatically even in nested schemas
  // simple key => value for mappings
  name: 'Name',
  // object syntax for customized definitions
  callRequested: {
    sf: 'Call_Requested_By__c',
    // we want to be able to write to this field
    writable: true
  }
  custom: 'Custom__c',
  // can handle nested Schemas
  project: new arbiter.Schema('Project__r', {
    name: 'Name',
    createdDate: 'Created_Date__c'
  })
})

const Opportunity = arbiter.model('Opportunity', OpportunitySchema)

Opportunity
  .findById(1)
  .fields('name', 'callRequested', 'project') // yeah grab all of project (id, name, createdDate)!
  .where({
    callRequested: 'John Smith',
    custom: { not: null },
    name: ['in', 'one', 'of', 'these'],
    'project.name': { like: '%regex%' }
  })
  .exec()
  .then(opp => {
    // edit fields in place and call save to send back up to salesforce
    opp.callRequested = 'Jane Doe'
    return opp.save()
  })
  .then(opp => /* opp was saved */)
```
___

## API

## **Schemas**
```js
const schemaObj = new arbiter.Schema('Salesforce Object', opts)
```
It all starts with a Schema definintion. Schemas describe the mappings from a Salesforce value to how you want to reference it. They also can be nested. The first argument when creating a schema is is the mapping to a salesforce object. At the root schema level this would be the object you would save to. At nested levels it is the mapping of how the root references it. **It's important to note that this nesting represents Salesforce Object relationships that have to be in place in order for Arbiter to query them. Arbiter cannot 'create' the connection between two Salesforce objects.**

Imagine that in our Salesforce situation we have a `Lead` object which has a reference to a `Contact` which in turn has a reference to a `Contract`. We could set up a schema like so.
```js
const LeadSchema = new arbiter.Schema('Lead', {
  // id: 'Id' is always written in at every level for you
  firstContactDate: 'First_Contact_Date__c',
  // we want to name our Contact relationship contact
  contact: new arbiter.Schema('Contact', {
    firstName: 'First_Name__c',
    lastName: 'Last_Name__c',
    // and out Contact's Contract relationship as contract
    contract: new arbiter.Schema('Contract__r', {
      signedDate: 'Contract_Signed_Date__c'
    })
  })
})
// lead -> contact -> contract
```
We could now successfully query data off of the contract through our Lead Schema!
#### With Great Power
The nested schema power of Arbiter needs to be used with care. It is possible that in your instance you might have a trail of 5 connected objects and you would maybe link them all together. Or maybe you write a schema in one model that covers your entire salesforce setup. This will only lead to a bloated and slow Model. In our above example we are writing a Lead Schema if need be we could still write a contact and contract schema along with Models if those objects see a lot of activity. The idea in Arbiter is that a schema might extend slightly out of its bounds and into its relations only for querying power.

## **Models**
```js
const Model = arbiter.model('Model name', schemaObj)
```
Creating a Model is easy all you need is a unique name (Arbiter makes sure you don't overwrite exising models) and a schema to bake into it. The Model and Schema work together to provide most of the functionality of Arbiter. Arbiter's API is chainable, aside from `exec()`, Model functions can be called in any order.

### `Model.fields(...fields)`
* `field` (String) - The field to select
  * `id` of toplevel schema is always included
  * If you pass the name of a nested schema all local fields on that schema will be selected (no relationships from it)
  *  `'.'` will select local fields on the top level schema (no relationships)
  * `'*'` will traverse the entire schema tree and give you all fields in the schema.

```js
const simpleSchema = new arbiter.Schema('Simple', {
  name: 'Name',
  other: 'Other'
  nested: new arbiter.Schema('Nested', {
    something: 'Something__c',
    anotherNested: new arbiter.Schema('Another_Nested__r', {
      anotherSomething: 'Another_Something__c'
    })
  })
})

const SimpleModel = new arbiter.model('Simple', simpleSchema)

SimpleModel
  // selects id name, all of nested, and the anotherSomething field
  .fields('name', 'nested', 'nested.anotherNested.anotherSomething')

SimpleModel
// selects id, name, and other
  .fields('.')

SimpleModel
  // id, name, other, all of nested, all of anotherNested
  .fields('*')

```
In most cases Arbiters API is repeatable. `fields(...fields)` is not. Successive calls to `fields(...fields)` will overwrite previous calls.

### `Model.where(opts)`
* `opts` (Object) - The where clauses to filter query by

**Available where clause options**
```js
Model
  .where({
    field: 'equal this',
    field: { not: 'not equal this' },
    field: { like: '%regex searching' }
    field: { notlike: '%should not match this%' }
    field: [ 'in', 'one', 'of', 'these' ],
    field: { not: [ 'not', 'in', 'one', 'of', 'these' ] },
    // filter off nested values is allowed
    'field.nested.name': 'all of the above work here'
  })
```

### `Model.find(opts)`
* `opts` (Object) _[optional]_ - If provided `opts` work the same as passing an object to `Model.where(opts)`. If nothing is passed then function becomes a noop and simply passes Model for chaining

```js
Model
  .find({
    id: 1,
    status: { like: '%open' }
  })
```

### `Model.findById(id)`
* `id` (any) - id to include in query

```js
Model
  .findById(1)

// same as doing
Model
  .where({
    id: 1
  })
```

### `Model.findByIds(ids)`
* `ids` (Array) - ids to include in query

```js
Model
  .findByIds([ 1, 2, 3, 4 ])

// same as
Model
  .where({
    id: [ 1, 2, 3, 4 ]
  })
```

### `Model.explain()`
With Arbiter being a work in progress I wanted to keep it as open as possible so that developers can see what is going on behind the scenes in case bugs occur. `Model.explain()` can be added to any part of the chain to reveal state of Model including fields selected, where clauses, and the query that has been built up at the point that `explain()` is called. For now this function will simply log to the console. Later implementations will allow passing a custom logger. `explain()` is chainable so it can be placed at any point in a Model's chain and not stop a query from executing.

```js
Model
  .fields('id', 'name')
  .where({
    id: 1,
    status: { not: null }
  })
  .explain()
  .exec()
  //...

  // logs
  // {
  //   SFObject: 'Whatever Object Model is linked to',
  //   fields: ['id', 'name'],
  //   where: { id: 1, status: { not: null } },
  //   query: 'SELECT Id, Name FROM ModelSFObject WHERE Id = \'1\' AND Status != null'
  // }

```

### `Model.RAW(query)`
* `query` (String) - query to execute

This is an option to have Arbiter query Salesforce and forget about all the mapping and features that Arbiter provides. Querying this way simply gives back untouched raw results

```js
Model
  .RAW('Select First_Name__c FROM Lead')
  .then(data => data.records)
  .then(response => {
    // [{ First_Name__c: 'Jane Doe' }]
  })
```

### `Model.query(query)`
* `query` (String) - query to execute

Very similar to `Model.RAW(query)` except this will run the response through all of Arbiter's mapping and return a Document instance. This is useful if you already have a query string and don't need any of Arbiter's `.fields()` or `.where()` API.

```js
Model
  .query('Select First_Name__c FROM Lead')
  .then(lead => {
    // { firstName: 'Jane Doe' }
  })
```

### `Model.inject(query, params, quotes, replaceChar)`
* `query` (String) - query to inject values into
* `params` (Object) [default {}] - object with keys to replace with keys value
* `quotes` (Boolean) [default true] - whether to surround injected value with quotes
* `replaceChar` (String) [default @] - what value to look for when searching keys on `params`

If you prefer to work with SOQL query strings directly then this function will help you write flexible query templates. **NOTE: When the value of a key in `params` is an array then the array is automatically stringified and surrouned in '()'**

```js
const query = 'Select Id from Lead Where Status Like @status'
Model
  .query(Model.inject(query, { status: 'Open' }))
  // Select Id from Lead where Status like \'Open\'

const customReplacer = 'Select Id from Lead Where Status In $status'
Model
  .query(
    Model.inject(customReplacer), {status: ['Open', 'Closed'], true, '$' }
    // Select Id from Lead Where Status in (\'Open\', \'Closed\')
  )
```

# TODO: fill in rest of API
