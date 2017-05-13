const { expect } = require('chai')
const validator = require('../validator')

describe('validator(field, config)', () => {
  const config = {
    required: true,
    default: () => new Date(),
    type: 'date'
  }
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
})
