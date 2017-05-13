const { expect } = require('chai')

const Arbiter = require('./arbiter')
const Schema = require('./schema/schema')

describe('Arbiter Class', () => {
  let arbiter
  let Opportunity
  const goodSchema1 = new Schema('Opportunity', {})
  const goodSchema2 = new Schema('Service__r', {})

  beforeEach(() => {
    arbiter = new Arbiter()
    Opportunity = arbiter.model('Opportunity', goodSchema1)
    arbiter.model('Service', goodSchema2)
  })

  afterEach(() => {
    arbiter = null
  })

  it('should return an object', () => {
    expect(arbiter).to.be.an('object')
  })

  it('should not expose its models', () => {
    expect(arbiter).to.not.haveOwnProperty('_models')
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

    xit('should set `pool` property on arbiter', () => {
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
      const modelExists = arbiter.getModel('Opportunity')
      expect(modelExists).to.be.an('object')
    })

    it('should throw error if user adds model with same name again', () => {
      function shouldThrow () {
        arbiter.model('Opportunity', goodSchema)
      }

      expect(shouldThrow).to.throw(Error)
    })

    it('should return an object', () => {
      expect(Opportunity).to.be.an('object')
    })
  })

  describe('#getModels()', () => {
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

      expect(actual).to.equal(Opportunity)
      expect(notRegistered).to.not.be.an('object')
    })
  })
})
