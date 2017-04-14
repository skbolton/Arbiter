const { expect } = require('chai')

const Arbiter = require('./arbiter')
const Schema = require('./schema/schema')

describe('Class Arbiter', () => {
  let arbiter

  beforeEach(() => { arbiter = new Arbiter() })
  afterEach(() => { arbiter = null })

  it('should return an object', () => {
    expect(arbiter).to.be.an('object')
  })

  it('should have `_models` property', () => {
    expect(arbiter).to.haveOwnProperty('_models')
  })

  it('should have a `pool` property', () => {
    expect(arbiter).to.haveOwnProperty('pool')
  })

  specify('pool should start out as null until configured', () => {
    expect(arbiter.pool).to.equal(null)
  })

  describe('#configure(config, callbacks)', () => {
    it('should throw if `config` is not an object', () => {
      function shouldThrow () {
        arbiter.configure('bad')
      }
      expect(shouldThrow).to.throw(TypeError)
    })

    it('should throw if `callbacks` is not an object', () => {
      function shouldThrow () {
        arbiter.configure({}, 'bad')
      }
      expect(shouldThrow).to.throw(TypeError)
    })

    it('should set `pool` property on arbiter', () => {
      // these {} will eventually be dreadsteed config options
      arbiter.configure({}, {})
      expect(arbiter.pool).to.be.an('object')
    })
  })

  describe('#model(name, schema)', () => {
    const goodSchema = new Schema('Opportunity', {})

    it('should throw if `name` is not a string', () => {
      function shouldThrow () {
        arbiter.model(1)
      }

      expect(shouldThrow).to.throw(TypeError)
    })

    it('should throw if `schema` is not type Schema', () => {
      function shouldThrow () {
        arbiter.model('Opportunity', {})
      }

      expect(shouldThrow).to.throw(TypeError)
    })

    it('should add `name` to `arbiter._models`', () => {
      arbiter.model('Opportunity', goodSchema)

      expect(arbiter._models.Opportunity).to.be.an('object')
    })

    it('should throw error if user adds model with same name again', () => {
      arbiter.model('Opportunity', goodSchema)

      function shouldThrow () {
        arbiter.model('Opportunity', goodSchema)
      }

      expect(shouldThrow).to.throw(Error)
    })

    it('should return an object', () => {
      const Opportunity = arbiter.model('Opportunity', goodSchema)

      expect(Opportunity).to.be.an('object')
    })

    specify('object should have access to `arbiter.pool`', () => {
      const Opportunity = arbiter.model('Opportunity', goodSchema)

      expect(Opportunity.pool).to.equal(arbiter.pool)
    })
  })

  describe('#getModels()', () => {
    const arbiter = new Arbiter()
    const goodSchema1 = new Schema('Opportunity', {})
    const goodSchema2 = new Schema('Service__c', {})
    arbiter.model('Opportunity', goodSchema1)
    arbiter.model('Service', goodSchema2)

    it('should return models that have been registered', () => {
      const actual = arbiter.getModels()

      expect(actual).to.haveOwnProperty('Opportunity')
      expect(actual).to.haveOwnProperty('Service')
    })
  })

  describe('#getModel(name)', () => {
    it('should return model by `name` it has been registered', () => {
      const actual = arbiter.getModel('Opportunity')
      const notRegistered = arbiter.getModel('NotHere')

      expect(actual).to.equal(arbiter._models.Opportunity)
      expect(notRegistered).to.not.be.an('object')
    })
  })
})
