const { expect } = require('chai')

const Grunt = require('../lib/model/grunt')
const { oppSchema } = require('./fixtures/schema')
const { singleQueryResult } = require('./fixtures/queryResult')
const Arbiter = require('../lib/arbiter')

xdescribe('Grunt Class', () => {
  const arbiter = new Arbiter()
  const Opportunity = arbiter.model('Opportunity', oppSchema)

  let grunt

  beforeEach(() => {
    const data = {
      fields: ['id', 'name', 'noAerialPhoto', 'project.id', 'project.name'],
      mappings: ['Id', 'Name', 'No_Aerial_Photo__c', 'Project__r.Id', 'Project__r.Name'],
      queryResult: singleQueryResult
    }
    grunt = new Grunt(Opportunity, data)
  })

  describe('constructor(model, data)', () => {
    it('should return an object', () => {
      expect(grunt).to.be.an('object')
    })

    it('should have a `__changeset` property', () => {
      expect(grunt).to.haveOwnProperty('__changeset')
    })

    it('should add a changed field to `__changeset` when writable', () => {
      grunt.noAerialPhoto = true

      expect(grunt.__changeset.No_Aerial_Photo__c).to.equal(true)
    })

    it('should not add field to `__changeset` if value didn\'t change', () => {
      grunt.noAerialPhoto = false

      expect(grunt.__changeset.No_Aerial_Photo__c).to.equal(undefined)
    })
  })

  describe('#save()', () => {
    it('should have function save', () => {
      expect(grunt).to.respondTo('save')
    })
  })
})
