---
title: arbiter

toc_footers:
  - Made with ❤️ <a href="https://github.com/skbolton" target="_blank">@skbolton</a>
  - <a href='https://github.com/lord/slate'>Documentation Powered by Slate</a>

includes:
  - recipes
  - api

search: true
---

# Introduction

![npm](https://img.shields.io/npm/v/arbiter.svg)[![Coverage Status](https://coveralls.io/repos/github/skbolton/Arbiter/badge.svg?branch=2.0)](https://coveralls.io/github/skbolton/Arbiter?branch=2.0)![Build](https://travis-ci.org/skbolton/Arbiter.svg?branch=2.0)

<a href="https://github.com/skbolton/Arbiter"><img style="position: absolute; top: 0; right: 0; border: 0;" src="https://s3.amazonaws.com/github/ribbons/forkme_right_green_007200.png" alt="Fork me on GitHub"></a>

Arbiter is a <a href="https://www.salesforce.com/" target="_blank">Salesforce</a> ORM for <a href="https://nodejs.org" target="_blank">Nodejs</a> with the goal of making modeling and querying Salesforce as painless as possible. With powerful schemas for validation and field remappings, Arbiter is the perfect layer to have between you and Salesforce.

Arbiter is built on top of the popular <a href="https://jsforce.github.io/" target="_blank">JSforce</a> query library. People familiar with its api will feel right at home in Arbiter since most of the api is mirrored. Also, JSForce <a href="https://jsforce.github.io/document/#query" target="_blank">connection</a> objects are exposed providing escape hatches when needed, or an eased migration to Arbiter.

What you get with Arbiter:

* **A Declarative way of defining models and [associations](#associations) between them**
* **Extended query building API**. JSForce with more helpers
* **Field remappings.** No longer are you tied to your Salesforce field names. Create your own that are easier to reason about or matches your problem domain. __Or just to strip out those darn underscores...__
* [**Smart query results**](#grunts). Makes updating and creating new objects quick and easy
* **Optional field validation and defaults**

What Arbiter **doesn't** give you:

* **A way to modify Salesforce objects and schemas**. You will still need Salesforce devs to do that. The objects and relations have to be in place in order for Arbiter to query them.
* **Automatic loading of Salesforce schemas**. Arbiter schemas must be writen by hand. This means that you don't have to follow your Salesforce setup exactly and allows you to map fields to completely different names to align with your problem domain. This could be seen as a downside but hopefully after trying the library you will appreciate the flexibility.

Arbiter does everything it can to get you down the happy path of making queries and getting access to your Salesforce data. Many of the helpers and additions are to help handle edge that arise when querying nested relations from Salesforce.

# Getting Started

## Installation

> -S is a shorthand for --save

```shell
npm install -S arbiter
```

Install using either npm or yarn.

## Define

```javascript
const arbiter = require('arbiter')
const { Schema } = arbiter

arbiter.configure({
  username: 'Johnny English',
  password: 'Secret_Agent_Man',
  connection: {
    loginUrl: 'http://login.salesforce.com',
  }
})

// create schema
const opportunitySchema = new Schema('Opportunity', {
  oppName: 'Name',
  contract: new Schema('Contract', {
    status: {
      sf: 'Status',
      writable: true,
      enum: [
        'Active',
        'Inactive',
        'Suspended'
      ]
    }
  })
})

// create model with schema
const Opportunity = arbiter.model('Opportunity', opportunitySchema)

// Give it a go!
Opportunity.findOne({ 'contract.status': 'Active' })
  .select(['oppName', 'contract.*'])
  .throwIfNotFound()
  .exec()
  .then(opp => {
    // you have an opportunity!
  })
```

To use Arbiter you will need to configure a connection to Salesforce. This only needs to happen once somewhere in your application. Arbiter will then maintain and monitor the connection and make it available to your models and their queries.

After that you can build up a model by first creating a schema, which defines field mappings and validations, then adding it to the model.

Then you are ready to start writing queries.

# Schemas

```js
const schema = new arbiter.Schema('Opportunity', {
  // key: value for simple mapping of fields
  name: 'Name',
  // field definition when you
  // need more than just mapping for a field
  description: {
    // mapping to salesforce
    sf: 'Description',
    // if we want to be able to update field
    writable: true,
    // type validation when updating
    // 'date', 'boolean', 'number', or 'string'
    type: 'string'
  },
  status: {
    sf: 'Status',
    writable: true,
    // when only certain values are allowed
    enum: [
      'Active',
      'Inactive'
    ],
    // when creating a new object and we don't specify value
    // default to value, can also be a function!
    default: 'Active'
  },
  customField: {
    sf: 'Custom_Field__c',
    // when creating a new object you have to supply this field
    // or save will reject
    required: true,
    writable: true
  }
})
```

`const schema = new arbiter.Schema(SFObject, mappings)`

Schemas are the driving force behind how Arbiter queries work so they deserve to be talked about first. Simply put, they are mappings of fields from how you want to reference them to the actual name of the field in Salesforce. Beyond that you can configure them to allow updates and validations on fields.

<aside class="notice">
Arbiter internally needs to references id's so schemas will automatically add <code>id: Id</code> for you. This also means that you will not be able to do your own mappings when it comes to ids.
</aside>

The first argument when creating a schema is the name of the Salesforce object that will be queried. At nested levels the name is how the parent schema references that object. The second argument is the mappings for the fields you want to be able to query. Once you have defined the mapping, you **never** reference the field by its Salesforce name again. Arbiter takes care of mapping to the real value behind the scenes for you. You can also only query for fields that you have defined in your schema.

Based on schema to the right we would be able to query for a `name` field which we cannot update or change. A `description` which is updateable, but must be a string. A `status` which is updateable but only to certain options, and `customField` which if we are creating a new Opportunity cannot be null.

<aside class="warning">
Schemas are bypassed when doing raw JSForce queries. None of the validations or mappings will be called.
</aside>

## Nested Schemas

> Using nested definition

```js
const schema = new arbiter.Schema('Opportunity', {
  name: 'Name',
  project: new arbiter.Schema('Project__c', {
    status: 'Status',
    proposal: new arbiter.Schema('Proposal__c', {
      proposalStarted: 'Proposal_Started__c',
      propsoalCompleted: 'Proposal_Completed__c'
    })
  })
})
```

> Usage with `schema.addChildSchema(key, schema)`

```js
// create all schemas first
const oppSchema = new arbiter.Schema('Opportunity', {
  name: 'Name'
})
const projSchema = new arbiter.Schema('Project__c', {
  status: 'Status'
})
const propSchema = new arbiter.Schema('Proposal__c', {
  proposalStarted: 'Proposal_Started__c',
  proposalCompleted: 'Proposal_Completed__c'
})

// then add them to each other
oppSchema.addChildSchema('project', projSchema)
projSchema.addChildSchema('proposal', propSchema)
// or add schemas at a path
// the parts of the path have to exist
// setting this before setting the project schema woudldn't work
oppSchema.addChildSchema('project.proposal', propSchema)
```

Arbiter allows schemas to be nested in each other. This nesting represents the relationships that you have defined in your company's Salesforce schema. By nesting schemas you are making it possible to query through relations just like you can in SOQL queries. As with regular fields the keys become the mapping to how we want to reference the relation.

In the example we name all the nested schema names based off of how parent schema references them. In the code to the right we named the project `Project__c` because thats how our Opportunity references it. Even if really the `Project__c` is a `My_Company_Project__c` object in our Salesforce.

There are two apis for defining nested schemas as shown on the right. Both styles outcomes are the exact same.

### Feature

Lets say we do a query based on the schema to the right to get the `proposalCompleted` field off of the `proposal`. What if in our query the project doesn't actually exist for our Opportunity? This would normally lead to errors when you tried to read `opportunity.project.proposal.proposalCompleted` since the project doesn't exist.

Arbiter will always scaffold out all the objects you request and place `null` in any fields you ask for. Then all the fields that come back from query will get filled in. This means you never need to check if objects exist along the path making defensive code a thing of the past. If you ever need to check to see if an object is not there then just look at its `id` property. If you see `null` you know that it does not exist.

# Models

`const model = arbiter.model(NameForModel, schemaInstance)`

```js
const aShema = new arbiter.Schema('SalesforceObject', {
  createdDate: 'CreatedDate',
  status: 'Staus'
})

const MyModel = arbiter.model('MyModel', aSchema)

MyModel.find({ status: 'Active' })
  // query instance methods
  .limit(10)
  .sort('-createdDate')
  .exec()

// stash complicated queries
MyModel.getByStatus = function (status) {
  return model.find({ status }).exec()
}
```

Models are the glue that bring schemas and queries together. They are just objects making them a great place to stash complicated queries.

A query instance gets returned by calling any one of the model's find functions

* [find](#find)
* [findOne](#findone)
* [findById](#findbyid)
* [findByIds](#findbyids)

## Associations

```js
const accountSchema = new arbiter.Schema('Account', {
  description: 'Description',
  rating: 'Rating'
})

const Account = arbiter.model('Account', accountSchema)

const oppSchema = new arbiter.Schema('Opportunity', {
  accountId: 'AccountId',
  status: 'Status'
})

const Opportunity = arbiter.model('Opportunity', oppSchema)

// normally we wouldn't be able to get fields off of
// account through the Opportunity
// but with Arbiter we can

Opportunity.setAssocitions({
  // the name we want to give the association
  // this comes into play later when we ask to get it
  account: {
    // what field on the current model do you join on
    from: 'accountId',
    // what field on the other object do you join on
    // IMPORTANT this still using the mapping of the field
    to: 'id',
    // what model to use for second query
    model: Account
    // hasOne for when theres only one
    // hasMany when it should be an array
    relation: Opportunity.relations.hasOne
  }
})

Opportunity.findOne({ status: 'Open' })
  .with('account', accountQuery => {
    accountQuery.select('rating')
  })
  .exec()

// or
Opportunity.findOne({ status: 'Open' })
  .with({
    account: accountQuery => {
      accountQuery.select('rating')
    }
  })
```

> The above will return an result shaped like this:

```json
{
  "id": "some id...",
  "account": {
    "rating": "some rating"
  }
}
```

Nested Schemas are powerful because they allow you to query through relations in one query and get the results you need. What do you do when you have a reference to another object but you can't query through it? Thats were associations come in. They allow you to describe to Arbiter how to do the joins and then Arbiter will make the queries and handle zipping the results together. Multiple queries still need to happen to get the data, but it can be a lifesaver to not have to write the manual code to do this yourself.

> Just showing off

```js
Case.find()
  .limit(10)
  // grab the comments for the cases we find
  // for every comment also go fetch the owner of the comment
  .with({
    comments: commentsQuery => {
      commentsQuery.select('*')
        .with('owner', ownerQuery => {
          ownerQuery.select('firstName')
        })
    },
    recordType: recordTypeQuery => {
      recordTypeQuery.select('name')
    }
  })
  .exec()
```

> That would result in this, only showing one result

```json
[
  {
    "id": "some case Id",
    "recordType": {
      "name": "A RecordType name"
    },
    "comments": [
      {
        "id": "some comment id",
        "comment": "The guy was talking....",
        "owner": {
          "firstName": "Peter"
        }
      }
    ]
  }
]
```

Whats even more impressive is that you can call off multiple associations at once and/or call associations on your assocations. This all is kicked off by calling [`query.with()`](#with)

# Grunts

> Assuming that status is a writable field and passes validation defined in schema

```js
model.findOne({ status: 'Open' })
  .select('status')
  .exec()
  .then(grunt => {
    // we can add other fields to the grunt that are not in the schema
    // these will not get sent with any saves
    grunt.extraField = 'Some extra field on grunt'
    grunt.status = 'Closed'
    return grunt.save()
  })
  .then(savedGrunt => {...})
```

> Updating many grunts

```js
model.find({ isActive: true })
  .limit(10)
  .then(grunts => {
    const updates = grunts.map(grunt => {
      grunt.isActive = false
      return grunt.save()
    })
    return Promise.all(updates)
  })
  .then(updatedGrunts => {...})
```

Grunts are objects returned by queries. For the most part you can use them just like regular objects, but they do have some tricks up their sleeves.

Grunts are <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy">Proxied</a> objects. The handler for a grunt is aware of what fields are `writable` in the schema and will run validations and mappings as you mutate writable fields on a grunt. Grunts are not limited to only fields that came back from a query or are in the schema. Feel free to add whatever additional fields you want and use grunts as transfer objects. The handler will make sure to keep track of only the updates that are `writable` and that have passed your validations as defined in the schema. The benefit of the approach is that you don't pay a cost for having these smart objects. If you only want to use them for their query power and not do mutations there is no slow down in performance. It also means you can query for 100's of grunts and it won't affect your query performance either.

You won't interface directly with the handler, but knowing it's there and what it is doing will make it easier to reason about what is happening. To update Salesforce with the writable changes on a grunt simply call `grunt.save()`. Any errors in your mutations will show up in the catch of the returned promise. The resolved value of the promise is the grunt itself.

<aside class="notice">
  If calling save creates a new grunt then the saved grunt that comes back will have a new <code>id</code> field on it.
</aside>

## Nested mutations

> Updating nested values

```js
model.findOne()
  .select('account.contract.createdDate')
  .then(grunt => {
    // we want to update the createdDate which is nested
    // since an id is present, calling save will do an update
    const contractGrunt = contractModel.new(grunt.contract)
    contractGrunt.createdDate = new Date()
    return contractGrunt.save()
  })
```

While models are able to query into nested relations the grunts they produce are not responsible to update the nested values. The grunts will have all the fields on them that you asked for, they just aren't responsible to save all of them. In order to update nested fields you will need to make a new grunt out of the data you want through the [`model.new()`](#new) api and then mutate and save the changes. If grunts have an `id` property they will call update, if no `id` is present on a grunt it will call a create query.

This is in part to make error handling and ordering of the saves explicit. If Arbiter allowed grunts to save every nested level on them it would be hard to imagine a clean api when an error occurred while saving.

# Raw JSForce Queries

> Raw connection object

```js
const arbiter = require('arbiter')

arbiter.getConnection()
  .then(conn => {
    // raw jsforce connection object
  })
```

> model.sobject() call

```js
const Opportunity = arbiter.model('Opportunity', aSchema)

Opportunity.sobject()
  .then(sobject => {
    // same as conn.sobject('whatever schema points to').then(...)
  })
```

Arbiter is built using JSForce behind the scenes. After it maps your values to what they really are it builds up a JSForce query. If for whatever reason you need to use a regular JSForce query, they are available to you. **Keep in mind that when using raw queries you are not going through the schema and will not receive back prettied results, or even grunts. This is a direct call into JSForce api and what they return.**

<aside class="warning">
Be sure to have your connection configured before trying to execute queries!
</aside>
