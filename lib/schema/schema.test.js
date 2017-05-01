const { expect } = require('chai')

const Schema = require('./schema')

describe('Schema', () => {
  let schema

  beforeEach(() => {
    schema = new Schema('Schema', {
      name: 'Name',
      something: {
        writable: true,
        sf: 'Something__c'
      },
      somethingElse: {
        writable: true,
        sf: 'Something_Else__c'
      },
      child: new Schema('Child', {
        name: 'Name',
        another: new Schema('Child2', {
          deep: 'Something_Deeply_Nested'
        })
      })
    })
  })
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
      expect(schema.sfObject).to.equal('Schema')
    })
  })

  describe('#getFieldMapping(field)', () => {
    it('should return mapping if field is in schema', () => {
      const expected = 'Name'
      const actual = schema.getFieldMapping('name')

      expect(actual).to.equal(expected)
    })

    it('should return undefined if `field` is not in schema', () => {
      const expected = undefined
      const actual = schema.getFieldMapping('notHere')

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
      const expected = ['id', 'name', 'something', 'somethingElse']
      const actual = schema.getLocalFields()
      expect(actual).to.include.members(expected)
      expect(actual.length).to.equal(expected.length)
    })
  })

  describe('#mapResults(query)', () => {

  })

  describe('#getAllWritables()', () => {
    it('should return any field that passes a writable configuration', () => {
      const expected = {
        something: 'Something__c',
        somethingElse: 'Something_Else__c'
      }
      const actual = schema.getAllWritables()

      expect(actual).to.contain.all.keys(Object.keys(expected))
      // make sure all the keys have the correct value
      Object.keys(actual).forEach(key => {
        expect(actual[key]).to.equal(expected[key])
      })
    })
  })

  describe('#mapFields(fields)', () => {
    it('should give back mappings for each item in `fields`', () => {
      const fields = schema.getAllFields()
      const expected = [
        'Id',
        'Name',
        'Something__c',
        'Something_Else__c',
        'Child.Id',
        'Child.Name',
        'Child.Child2.Id',
        'Child.Child2.Something_Deeply_Nested'
      ]
      const actual = schema.mapFields(fields)
      expect(actual).to.include.members(expected)
      expect(actual.length).to.equal(expected.length)
    })

    it('should throw if asking for a field schema doesn\'t have', () => {
      function shouldThrow () {
        return schema.mapFields(['nopey'])
      }

      function shouldThrow2 () {
        // even on nested keys
        return schema.mapFields(['something', 'child.notgonnawork'])
      }

      expect(shouldThrow).to.throw(Error)
      expect(shouldThrow2).to.throw(Error)
    })
  })

  describe('#createWritablesProxy()', () => {
    it('should return an object', () => {
      const returned = schema.createWritablesProxy()

      expect(returned).to.be.an('object')
    })
    it('should add a Proxy handler object to schema', () => {
      schema.createWritablesProxy()

      expect(schema).to.haveOwnProperty('writablesProxy')
    })

    it('should add all writable keys to `schema.writablesProxy`', () => {
      schema.createWritablesProxy()

      const writables = ['something', 'somethingElse']
      expect(schema.writablesProxy.writables).to.have.all.keys(writables)
    })

    it('should have a set function on returned object', () => {
      const returned = schema.createWritablesProxy()

      expect(returned).to.respondTo('set')
    })
  })
})
