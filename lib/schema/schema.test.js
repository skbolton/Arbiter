const { expect } = require('chai')

const Schema = require('./schema')

describe('Schema', () => {
  let schema

  beforeEach(() => { schema = new Schema('Opportunity', {}) })
  afterEach(() => { schema = null })

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
      expect(schema).to.haveOwnProperty('sfObject')
    })

    it('should not allow user to overwrite `sfObject` property', () => {
      schema.sfObject = 'this will not go through'
      expect(schema.sfObject).to.equal('Opportunity')
    })
  })

  describe('#getFieldMapping(field)', () => {
    const fieldMapping = new Schema('Contains', {
      name: 'Name',
      something: {
        writable: true,
        sf: 'Something__c'
      },
      child: new Schema('Child', {
        name: 'name'
      })
    })

    it('should return mapping if field is in schema', () => {
      const expected = 'Name'
      const actual = fieldMapping.getFieldMapping('name')

      expect(actual).to.equal(expected)
    })

    it('should return undefined if `field` is not in schema', () => {
      const expected = undefined
      const actual = fieldMapping.getFieldMapping('notHere')

      expect(actual).to.equal(expected)
    })
  })

  describe('#getAllFields()', () => {
    it('should traverse schema graph and get all fields', () => {
      /*
           opp(....fields) -> project(....fields) -> proposalCAD(...fields)
           name, id, project.id, project.name, project.proposalCAD.id etc
      */
      const oppSchema = new Schema('Opportunity', {
        name: 'Name',
        project: new Schema('Project__r', {
          name: 'Name',
          proposalCAD: new Schema('Proposal_CAD__r', {
            name: 'Name'
          })
        })
      })

      const expected = [
        'id',
        'name',
        'project.id',
        'project.name',
        'project.proposalCAD.id',
        'project.proposalCAD.name'
      ]
      // loop through results and check against actual
      // NOTE: They don't HAVE to be in this order technically
      const actual = oppSchema.getAllFields()
      actual.forEach((field, idx) => {
        expect(actual[idx]).to.equal(expected[idx])
      })
    })
  })

  describe('#getLocalFields()', () => {
    it('should only return fields on schema not children fields', () => {
      const schema = new Schema('Test', {
        name: 'Name',
        other: 'Other__c',
        // these fields shouldn't show up
        child: new Schema('Child', {
          name: 'Name'
        })
      })
      const expected = ['id', 'name', 'other']
      const actual = schema.getLocalFields()
      expect(actual).to.include.members(expected)
      expect(actual.length).to.equal(expected.length)
    })
  })

  describe('#mapResults(query)', () => {

  })

  describe('#getAllWritables()', () => {
    it('should return any field that passes a writable configuration', () => {
      const oppSchema = new Schema('Opportunity', {
        noAerialPhoto: {
          sf: 'No_Aerial_Photo__c',
          writable: true
        },
        name: 'Name',
        status: {
          sf: 'Status',
          writable: true
        }
      })

      const expected = ['noAerialPhoto', 'status']
      const actual = oppSchema.getAllWritables()

      expect(actual).to.include.members(expected)
      expect(actual).to.not.include.members(['name'])
    })
  })

  describe('#mapFields(fields)', () => {
    const nestedSchema = new Schema('Top', {
      name: 'Name',
      something: 'Something__c',
      somethingElse: 'Something_Else__c',
      child: new Schema('Child__r', {
        name: 'Name',
        nestedSomething: 'Nested_Something__c',
        child2: new Schema('Child2__r', {
          name: 'Name',
          deepNested: 'Deeply_Nested__c'
        })
      })
    })

    it('should give back mappings for each item in `fields`', () => {
      const testSchema = new Schema('Test', {
        name: 'Name',
        testy: 'Test__c'
      })

      const fields = testSchema.getAllFields()
      const expected = ['Id', 'Name', 'Test__c']
      const actual = testSchema.mapFields(fields)
      expect(actual).to.include.members(expected)
      expect(actual.length).to.equal(expected.length)
    })

    it('should be able to map nested fields', () => {
      const expected = [
        'Something__c',
        'Child__r',
        'Child__r.Child2__r'
      ]
      const fields = ['something', 'child', 'child.child2']
      const actual = nestedSchema.mapFields(fields)
      expect(actual).to.include.members(expected)
      expect(actual.length).to.equal(expected.length)
    })

    it('should throw if asking for a field schema doesn\'t have', () => {
      function shouldThrow () {
        return nestedSchema.mapFields(['nopey'])
      }

      function shouldThrow2 () {
        // even on nested keys
        return nestedSchema.mapFields(['something', 'child.notgonnawork'])
      }

      expect(shouldThrow).to.throw(Error)
      expect(shouldThrow2).to.throw(Error)
    })
  })
})
