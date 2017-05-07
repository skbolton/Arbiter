const { expect } = require('chai')
const Schema = require('../lib/schema/schema')
const { oppSchema, lineItemsSchema } = require('./fixtures/schema')

describe('Schema Class', () => {
  describe('constructor(sfObject, config)', () => {
    it('should throw if `sfObject` is not a string', () => {
      function shouldThrow () {
        const badSchema = new Schema(1)
        return badSchema
      }

      expect(shouldThrow).to.throw(Error)
    })

    it('should throw if `config` is not an object', () => {
      function shouldThrow () {
        const badSchema = new Schema('this is okay technically', 'not this')
        return badSchema
      }

      expect(shouldThrow).to.throw(Error)
    })

    it('should return object with `sfObject` property', () => {
      expect(oppSchema).to.haveOwnProperty('sfObject')
    })

    it('should not allow user to overwrite `sfObject` property', () => {
      oppSchema.sfObject = 'this will not go through'
      expect(oppSchema.sfObject).to.equal('Opportunity')
    })
  })

  describe('#getFieldMapping(field)', () => {
    it('should return mapping if field is in schema', () => {
      const expected = 'Name'
      const actual = oppSchema.getFieldMapping('name')

      expect(actual).to.equal(expected)
    })

    it('should return undefined if `field` is not in schema', () => {
      const expected = undefined
      const actual = oppSchema.getFieldMapping('notHere')

      expect(actual).to.equal(expected)
    })
  })

  describe('#getAllFields()', () => {
    it('should traverse schema tree and get all fields', () => {
      const expected = [
        'id',
        'name',
        'noAerialPhoto',
        'project.id',
        'project.name',
        'project.proposalCAD.id',
        'project.proposalCAD.proposalCompleted',
        'service.id',
        'service.serviceNumber',
        'service.name'
      ]
      const actual = oppSchema.getAllFields()

      expect(actual).to.eql(expected)
    })
  })

  describe('#getLocalFields()', () => {
    it('should only return fields on schema not children fields', () => {
      const expected = [
        'id',
        'name',
        'noAerialPhoto'
      ]
      const actual = oppSchema.getLocalFields()

      expect(actual).to.eql(expected)
    })
  })

  describe('#mapResults(query)', () => {

  })

  describe('#getAllWritables()', () => {
    it('should return any field that passes a writable configuration', () => {
      const expected = {
        createdById: 'CreatedById',
        createdOn: 'CreatedDate',
        productCode: 'ProductCode'
      }
      const actual = lineItemsSchema.getAllWritables()

      expect(actual).to.eql(expected)
    })
  })

  describe('#mapFields(fields)', () => {
    it('should give back mappings for each item in `fields`', () => {
      const fields = oppSchema.getAllFields()

      const expected = [
        'Id',
        'Name',
        'No_Aerial_Photo__c',
        'Project__r.Id',
        'Project__r.Name',
        'Project__r.Proposal_CAD__r.Id',
        'Project__r.Proposal_CAD__r.Proposal_Completed__c',
        'Service__r.Id',
        'Service__r.Service_Number__c',
        'Service__r.Name'
      ]
      const actual = oppSchema.mapFields(fields)

      expect(actual).to.eql(expected)
      // expect(actual.length).to.equal(expected.length)
    })

    it('should throw if asking for a field schema doesn\'t have', () => {
      function shouldThrow () {
        return oppSchema.mapFields(['nopey'])
      }

      function shouldThrow2 () {
        // even on nested keys
        return oppSchema.mapFields(['something', 'child.notgonnawork'])
      }

      expect(shouldThrow).to.throw(Error)
      expect(shouldThrow2).to.throw(Error)
    })
  })
})
