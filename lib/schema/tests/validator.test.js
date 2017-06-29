const { expect } = require('chai')
const validator = require('../validator')

describe('validator(field, config)', () => {
  let config
  let ofConfig

  beforeEach(() => {
    config = {
      required: true,
      default: () => new Date(),
      type: 'date'
    }
    ofConfig = {
      required: true,
      of: [ 'one', 'of', 'these' ]
    }
  })
  it('should be a function', () => {
    expect(validator).to.be.a('function')
  })

  it('return a function', () => {
    expect(validator('field', config)).to.be.a('function')
  })

  it('should validate `field` based off of `config`', () => {
    const notDate = 5
    const validate = validator('date', config)

    const result = validate(notDate)
    expect(result).to.be.a('error')
  })

  it('should validate boolean types', () => {
    config.type = 'boolean'
    const notBoolean = 5

    const validate = validator('boolean', config)
    const result = validate(notBoolean)

    expect(result).to.be.an('error')
  })

  it('should validate number types', () => {
    config.type = 'number'
    const notNumber = 'hi'

    const validate = validator('number', config)
    const result = validate(notNumber)

    expect(result).to.be.an('error')
  })

  it('should return default value if undefined is passed', () => {
    const validate = validator('date', config)

    const result = validate()
    expect(result).to.be.a('date')
  })

  it('should return error when default is different than type', () => {
    const badConfig = {
      required: true,
      default: 'not a date',
      type: 'date'
    }

    const validate = validator('date', badConfig)
    const result = validate()

    expect(result).to.be.an('error')
  })

  it('should error if value is not in of collection', () => {
    const validate = validator('of', ofConfig)
    const result = validate('not in of')

    expect(result).to.be.an('error')
  })

  it('should pass value through if it is in of collection', () => {
    const validate = validator('of', ofConfig)
    const result = validate('these')

    expect(result).to.be.equal('these')
  })
})
