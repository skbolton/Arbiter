# API Reference

# Arbiter

The main import of the library houses the manager of the connection to Salesforce as well as a place to define Schemas and models. It is also where you go to kick off a JSForce query.

## configure

```js
const arbiter = require('arbiter')
// showing required fields
arbiter.configure({
  username: 'Johnny English',
  password: 'Secret_Agent_Man',
  connection: {
    loginUrl: 'https://login.salesforce.com'
  }
})
```

Sets up connection to Salesforce. It needs to happen somewhere in your application one time. You are free to define models and Schemas before it is configured, but it most be done before you attempt a query.

### Arguments

* `opts` (object) - The options to configure connection
  * `username` (string) - username for connection
  * `password` (string) - password for connection
  * `maxConnectionTime` (number) [defaut:21600000] - number of milliseconds before refreshing connection
  * `connection` (object) - Anything valid passed to <a href="http://jsforce.github.io/jsforce/doc/Connection.html" target="_blank">new jsforce.Connection()</a>
      * `loginUrl` (string) - Url to login. Only required field on `connection`.

### Return Value
`undefined`


## getConnection

```js
const arbiter = require('arbiter')

arbiter.getConnection()
  .then(conn => {
    /*
      You have a jsforce connection
    */
  })
```

Gets connection to salesforce. This is a JSForce connection and any queries done through this connection will not have any mappings or validations from the schema. Use this as an escape hatch or while migrating to Arbiter. **Arbiter uses the same connection throughout all of its queries so any changes to the connection here will show up everywhere until the connection expires as defined in the call to `arbiter.configure()`**

### Arguments

None

### Return Value
[JSForce](http://jsforce.github.io/jsforce/doc/Connection.html) Connection instance

## model

```js
const arbiter = require('arbiter')

const schemaInstance = new arbiter.Schema('Opportunity', {...})
const model = arbiter.model('SomeName', schemaInstance)
```

Creates a new [model](#models) instance

### Arguments

* `name` (string) - name for the model, this will show up in debugging and errors.
* `schema` ([Schema](#schemas)) - a Schema instance to query against

### Return Value
`model`

## Schema

```js
const arbiter = require('arbiter')

const schema = new arbiter.Schema('Opportunity', {
  status: {
    sf: 'Status',
    writable: true,
    enum: [
      'Active',
      'Inactive',
      'Suspended'
    ],
    default: 'Active'
  },
  accountId: 'AccountId'
})
```

Creates a [schema](#schemas) instance defining mapping and validation for fields.

### Arguments
* `salesforceObject` (string) - name of salesforce object the schema is a reference to.
* `config` (object) - configuration for fields of schema

The fields of the config can either be simple `key: value` pairings which sets the key as the way you want to reference the field. The value can also be an object in order to extend the configuration. All the possible values are shown in example to right.

> Expanded config for a field in schema config

```js
{
  // only required field
  sf: 'Some_Salesforce_Field__c',
  // boolean, date, string, number
  type: 'string',
  // must be one of these
  enum: [ null, 'value', 'value2' ],
  // we want to be able to have grunts update this field
  writable: true,
  // when saving a new object this field cannot be null/undefined
  required: true,
  // defaults, this makes having required redundant since it will always
  // be there because of this having a default
  default: 'A Default',
  // can also be a function
  default() { return 'A default' }
}
```

# Model

An object that can get connections from pool and kick off queries.

## sobject

```js
model.sobject()
  .then(sobject => {
    return sobject.find(...)
  })
```

> Same as calling

```js
arbiter.getConnection()
  .then(conn => conn.sobject('SomeSObject'))
```

Gets a JSForce connection and sets that connection to the sobject that the model is linked to. This is found out by looking at the schema that was added to the model.
### Argumens

None

### Return Value

<a href="http://jsforce.github.io/jsforce/doc/SObject.html" target="_blank">JSForce</a> SObject instance

<aside class="warning">
This is a raw JSForce connection and any queries done through this will not have schema mappings or validation in place.
</aside>

## setAssociations

```js
model.setAssocations({
  singeAssociation: {
    from: 'a field on me',
    to: 'a field on them',
    model: SomeOtherModel,
    // this field should be a single value
    relation: model.relations.hasOne
  },
  pluralAssocation: {
    from: 'a field on me',
    to: 'a field on them',
    model: SomeModel,
    // this field should be an array of things
    relation: model.relations.hasMany
  }
})
```

Assocations are a way to have Arbiter be able to execute multiple queries and join the results together. In your Salesforce you will most likely have many relationships that allow you to do queries across relations. Associations are for the cases where you cannot traverse the relationship and instead would have to do multiple queries to get the data for associated objects. Using this api allows you to show models how to do the "joins" in order to get all the data.

The keys of the object become the name of the association you can ask for later when you call [`query.with()`](#query)

### Arguments
* `associations` (object) - Associations to add to the model
  * `from` (string) - Field on current model to start from
  * `to` (string) - Field on associated model to join on
  * `model` (model) - Model to execute next query
  * `relation` (string) - [hasOne| hasMany] - Signify whether association is single entity or many things.

 For convenience models have a `relations.hasMany` and `relations.hasOne` property on them that point to the respective strings.

### Return Value
`undefined`

## new

```js
const newObject = model.new()
newObject.status = 'Active'
newObject.save()
  .then(() => /* created grunt! */)
```

> Example of passing in some starting fields

```js
// these fields will still need to pass validation of the schema
const newObject = model.new({
  status: 'Active'
})

newObject.save().then(...)
```

Creates an instance of a grunt. This is one way of creating salesforce objects on the fly or doing a direct update of an object without querying for it first. When calling `save()` on a grunt if it's given an `id` field it will do an update. Otherwise it will attempt to create the object.

### Arguments
* `fields` (object) [optional] - fields to add to grunt after creating it

### Return Value
[grunt](#grunt) instance

## find

```js
model.find()
  .select('*')
  .exec()
```

> Passing in where clause

```js
model.find({ 'account.lastName': 'Rollins' })
```

> Same as doing:

```js
model.find().where({ 'account.lastName': 'Rollins' })
```

Kicks off a query. Optional where clause options can be passed to find.

### Arguments
  * `whereClauses` (object) [optional] - passes object into query as where clauses

### Return Value
[query](#query) instance

## findOne

```js
model.findOne({ isActive: true })
```

> Same as doing

```js
model.find({ isActive: true }).first()
```

Shorthand that exists for calling a query that is only looking for an individual record back

### Arguments
  * `whereClauses` (object) [optional] - passes object into query as where clauses

### Return Value

[query](#query) instance

## findById

```js
model.findById('1')
```

> Same as doing:

```js
model.find().where({ id: '1' }).first()
```

Kicks off a query. Returns a single result, if one is found.

### Arguments
* `id` (string) - id of model to be searched for

### Return Value
[query](#query) instance

## findByIds

```js
model.findByIds([ '1', '2', '3' ])
```

> Same as doing:

```js
model.find().where({ id: [ '1', '2', '3' ]})
```

Kicks off a query searching for objects from a collection of ids.

### Arguments
* `ids` [array] - ids to search for

### Return Value
[query](#query) instance

# Query

Queries are created by calling any of the find methods on a model `find, findById, findByIds` and have many methods to shape your request. Besides any of the methods that execute a query (`then, exec, execute`) query methods can be called in any order. Also most query functions state is cumulative. Calling [select](#select), [where](#where), or [with](#with) keeps adding to the same state instead of wiping it out everytime. You can use this to your advantage to build highly [composable](#composable) queries.

## select

> All call signatures

```js
model.find()
  // as positional arguments
  .select('id', 'isDeleted', 'status', 'contract.created')

model.find()
  // as array
  .select([ 'id', 'isDeleted', 'status', 'contract.created' ])

model.find()
  // as single string of comma delimited fields
  .select('id, isDeleted, status, contract.created')
```

Selects the fields you want returned in a query.

### Arguments
  * `fields` (array | string) - fields you would like returned

### Return Value
[query](#query) instance

## fields

alias for [select](#select)


## where

```js
model.find()
  .where({
    status: 'Active',
    isDeleted: false
  })
```

> Also accepts a RAW SOQL String

```js
// keep in mind this needs to be the Salesforce naming of fields
// this is good for some edge case queries like one below
model.find()
  .where("DISTANCE(Location__c, GEOLOCATION(37.775,-122.418), 'mi') < 20")
```

Adds where clauses to the query.

### Arguments
  * `clauses` (object | string) - clauses to add to query


### Return Value
[query](#query) instance

<aside class="warning">
If <code>clauses</code> is a string it gets passed straight to JSForce and no mapping will happen on fields contained within.
</aside>

## limit

```js
model.find()
  .limit(5)
```

Sets a limit on the query.

### Arguments

* `amount` (number) - The number of results to limit the query to

### Return Value

[query](#query) instance

## skip

```js
model.find()
  .skip(10)
```

Sets up a skip on query.

### Arguments

* `amount` (number) - Amount to skip in query

### Return Value

[query](#query) instance


## offset

alias to [skip](#skip)

## sort

> minus in front of field signifys descending order

```js
model.find()
  .sort('-createdDate status')
```

> Other signatures

```js
model.find()
  .sort({ createdData: -1, status: 1 })
```

Sets up sorting of query.

### Arguments
* `sort` (object | string) - opts for how to sort

### Return Value

[query](#query) instance

## first

```js
model.find()
  .first()
```

> Executing the query does something similar to

```js
model.find()
  .exec()
  .then(results => results[0])
```

Sets the query state that you only want the first result that comes back. This makes the return a single value instead of an array.

### Arguments

None

### Return Value

[query](#query) instance

## with

> As positional arguments

```js
model.find({ status: 'Suspended' })
  .select('*')
  // with this syntax you would have to call `with` multiple times
  // to fetch multiple associations
  .with('association', associationQuery => {
    // notice we don't call any of the functions to start query
    // Arbiter does this for you when it is ready to do query
    associationQuery.select('field, anotherField, yetAnotherField')
  })
```

> As an object to with

```js
model.find({ status: 'Active' })
  .select('*')
  .with({
    // you can pass multiple associations here too if you need to
    association (associationQuery) {
      associationQuery.select('field, anotherField, yetAnotherField')
    }
  })
```

Sets up an association query to be called once outer query has executed. The associations that you can fetch go hand in hand with the associations that have been configured on the models with [`setAssociations()`](#setassociations).

These are very powerful for joining together objects that you normally can't query through in a regular SOQL query. Also they can be nested, since the query function for an association is just creating a query instance the entire query api is available to you. The only things that aren't would be the functions to execute the inner queries since Arbiter will need to do that once it is ready.

Two apis exist for calling `with`. The `with(associationName, queryCB)` style and the `with(asocciationObject)` style. The `associationObject` style might be better if you need to fetch multiple associations but that is always possible with the other style as long as you call `with` multiple times.

### Arguments

#### 2 argument version

* `associationName` (string) - the name of the association to fetch as configured on model
* `queryCB` (function) [optional] - the query to filter and modify the association query. Not specifying filters or fields will simply return ids for nested queries

### Object style
* `associationsConfig` (object) - the associations to fetch and functions to call for associations
  * `association` (string) - name of association to fetch as configured on model
      * `queryCB` (function) - the query to filter and modify the association query. Not specifying filters or fields will simply return ids for nested queries

## throwIfNotFound

```js
model.find()
  .throwIfNotFound()
```

> Handles when query is on a single value or an array of values

```js
// when query would maybe return one thing
model.findOne()
  .throwIfNotFound(new Error('whoops'))

// or when query returns multiple things
model.find()
  .throwIfNotFound('error message')
```

Helper for handling when query might return an empty array or null for a query. Doing so will cause the query to return a rejected promise. This covers some edge cases that can happen when you are operating on data in your `.then()` not realizing that the query returned no results.

### Arguments
* `error` (error | string | undefined) - What error to throw. If `undefined` is passed the default message for the thrown error is `[Model.name] not found`

### Return Value

[query](#query) instance

## allowMutations

```js
model.find()
  // assuming that status is a writable field
  .select('status')
  .allowMuations(['status'])
  .then(grunt => {
    grunt.status = 'something new'
    // any other updates that are writable in schema would fail
    return grunt.save()
  })
```

Configures the returned grunts to allow mutations on only certain fields. The fields that are passed must be listed as writable in the schema. This is handy for sanitizing queries and restricting writes to certain values that are writable some of the time but you need to protect at other times

### Arguments

* `mutations` (array) - fields to allow mutations on

### Return Value

[query](#query) instance

<aside class="notice">
  The fields that you allow don't have to be present on the results that come back from the query
</aside>

## rejectMuations

```js
model.find()
  .rejectMutations(['status'])
  .then(grunt => {
    // cannot change status even if listed as writable in schema
  })
```

The inverse of [allowMuations](#allowmutations) use which ever one is easier to describe the fields you want to allow or reject field mutations in the query

### Arguments

* `mutations` (array) - fields to not allow modification of on grunt

<aside class="notice">
  The fields that you restrict don't have to be present on the results that come back from the query
</aside>

## execute

```js
model.find()
  .execute()
```

Triggers a query to get executed. All of the state built up to this point gets turned into a query and sent over connection

### Arguments

None

### Return Value

<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise" target="_blank">Promise</a>

## exec

alias for [execute](#execute)

## then

> Make query promise like

```js
model.find()
  .then(onSuccessFn, onRejectFn)
```

alias for [`execute`](#execute) except for that it allows passing of success and reject handlers for the query. This makes the query conform to a promise interface

### Arguments
* `successHandler` (function) - function to call on successful query
* `errorHandler` (function) [optional] - function to call on unsuccessful query

### Return Value

<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise" target="_blank">Promise</a>
