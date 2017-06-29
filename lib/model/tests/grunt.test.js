const { expect } = require('chai')

const Grunt = require('../grunt')
const { oppSchema } = require('../../../test/fixtures/schema')
const Arbiter = require('../../arbiter')

describe('Grunt Class', () => {
  const arbiter = new Arbiter()
  const Opportunity = arbiter.model('Opportunity', oppSchema)

  let grunt

  beforeEach(() => {
    const skeleton = {
      id: 1,
      noAerialPhoto: false,
      project: {
        id: 1,
        name: 'P-8976',
        proposalCAD: {
          id: 1,
          proposalCompleted: false
        }
      },
      service: {
        id: null,
        serviceNumber: null,
        name: null
      }
    }
    grunt = new Grunt(skeleton, Opportunity, Opportunity.schema.proxyHandler)
  })
  afterEach(() => {
    grunt = null
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

    it('should add field to `__errors` when it is invalid', () => {
      grunt.noAerialPhoto = 5

      expect(grunt.__errors.noAerialPhoto).to.be.an('error')
    })
  })

  describe('#save()', () => {
    it('should have function save', () => {
      expect(grunt).to.respondTo('save')
    })
  })
})
