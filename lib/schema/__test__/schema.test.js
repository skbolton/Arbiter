const Schema = require('../schema')

describe('Schema Class', () => {
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
    })
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

  describe('constructor(sfObject, config)', () => {
    it('should throw if `sfObject` is not a string', () => {
      function shouldThrow () {
        const badSchema = new Schema(1)
        return badSchema
      }

      expect(shouldThrow).toThrow(Error)
    })

    it('should throw if `config` is not an object', () => {
      function shouldThrow () {
        const badSchema = new Schema('this is okay technically', 'not this')
        return badSchema
      }

      expect(shouldThrow).toThrow(Error)
    })

    it('should return object with `sfObject` property', () => {
      expect(oppSchema).toHaveProperty('sfObject')
    })

    it('should not allow user to overwrite `sfObject` property', () => {
      oppSchema.sfObject = 'this will not go through'
      expect(oppSchema.sfObject).toEqual('Opportunity')
    })
  })

  describe('#getFieldMapping(field)', () => {
    it('should return mapping if field is in schema', () => {
      const expected = 'Name'
      const actual = oppSchema.getFieldMapping('name')

      expect(actual).toEqual(expected)
    })

    it('should return undefined if `field` is not in schema', () => {
      const expected = undefined
      const actual = oppSchema.getFieldMapping('notHere')

      expect(actual).toEqual(expected)
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

      expect(actual).toEqual(expected)
    })
  })

  describe('#getLocalFields()', () => {
    it('should only return fields on schema not children fields', () => {
      const expected = ['id', 'name', 'noAerialPhoto']
      const actual = oppSchema.getLocalFields()

      expect(actual).toEqual(expected)
    })
  })

  describe('#mapResults(query)', () => {})

  describe('#getAllWritables()', () => {
    it('should return any field that passes a writable configuration', () => {
      const keys = ['createdById', 'createdOn', 'productCode']
      const actual = Object.keys(lineItemsSchema.getAllWritables())

      expect(actual).toEqual(keys)
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

      expect(actual).toEqual(expected)
    })

    it('should handle when nested schema fields were authored with __c', () => {
      const schema = new Schema('Opportuntiy', {
        // user might accidentally define nested schema with a __c name
        project: new Schema('Project__c', {
          status: 'Status'
        })
      })

      const expected = [ 'Project__r.Id' ]
      const actual = schema.mapFields(['project.id'])

      expect(actual).toEqual(expected)
    })

    it("should throw if asking for a field schema doesn't have", () => {
      function shouldThrow () {
        return oppSchema.mapFields(['nopey'])
      }

      function shouldThrow2 () {
        // even on nested keys
        return oppSchema.mapFields(['something', 'child.notgonnawork'])
      }

      expect(shouldThrow).toThrow(Error)
      expect(shouldThrow2).toThrow(Error)
    })
  })

  describe('#addChildSchema(schema, path)', () => {
    it('should throw if `schema` is not a Schema instance', () => {
      const shouldThrow = () => {
        oppSchema.addChildSchema('some path', 'not a schema')
      }

      expect(shouldThrow).toThrow(Error)
    })

    it('should throw if `path` is not a string', () => {
      const shouldThrow = () => {
        oppSchema.addChildSchema({}, lineItemsSchema)
      }

      expect(shouldThrow).toThrow(Error)
    })

    it('should throw if `path` does not already exist in schema', () => {
      const shouldThrow = () => {
        oppSchema.addChildSchema('nope.bad.bad', lineItemsSchema)
      }

      const shouldThrowAgain = () => {
        // almost good path
        oppSchema.addChildSchema('project.bad.proposalCAD', lineItemsSchema)
      }

      expect(shouldThrow).toThrow(Error)
      expect(shouldThrowAgain).toThrow(Error)
    })

    it('should add `schema` to tree at path', () => {
      const path = 'project.proposalCAD.lineItem'
      // test that it is not there to begin with
      const notThere = () => {
        oppSchema.mapFields([path + '.id'])
      }
      expect(notThere).toThrow(Error)
      // now add it
      oppSchema.addChildSchema(path, lineItemsSchema)
      // check to see if its fields are in path now
      const expected = ['Project__r.Proposal_CAD__r.OpportunityLineItem.Id']
      const actual = oppSchema.mapFields([path + '.id'])
      expect(actual).toEqual(expected)
    })
  })
})
