# Schema
Schemas are at the heart of Arbiter and its query building. They represent Salesforce objects and provide a way for you to map fields to however you want to reference them. You can also add validation and the ability to update a field to the schema. Schemas can also be nested inside each other to represent the relationships that exist in your Salesforce instance.
```
const schema = new arbiter.Schema(salesforceObject, schemaFieldsConfig, opts)
```
`salesforceObject` (string)

The name of the Salesforce object. At the root this is the actual name of the object. At nested levels its how the root references it.
```js
const opportunitySchema = new arbiter.Schema('Opportunity', {
  // even though customObject might be called Custom_Object__c we reference it how the Opportunity references it
  customObject: new arbiter.Schema('Custom_Object__r', {})
})
```
* `schemaFieldsConfig` (object) - configuration for all fields in schema tree.
* `opts` (object) _[optional]_ - additional schema config

`schemaFieldsConfig` is the main part of a schema and should be discussed first. The simplest config just defines key value pairs of what the value should be called to what it is in salesforce. **Arbiter also writes in a mapping of `Id` to `id` for you in every schema so you don't have to.**
```js
new arbiter.Schema('SalesforceObject', {
  type: 'Type',
  name: 'Name',
  oppStatus: 'Status'
})
```
You can also add additional meta data to a field and customize the validation of the field.
```js
const sampleFieldsConfig = {
  callItThis: {
    sf: 'What_It_Is_In_Salesforce__c',
    // type validation
    type: 'boolean', // or string, number, date,
    // in a collection, picklist
    enum: ['must', 'be', 'one', 'of', 'these']
  }
}
```
