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
      enum: [ 'one', 'of', 'these' ]
    }
  })
  it('should be a function', () => {
    expect(typeof validator).toEqual('function')
  })

  it('return a function', () => {
    expect(typeof validator('field', config)).toEqual('function')
  })

  it('should validate `field` based off of `config`', () => {
    const notDate = 5
    const validate = validator('date', config)

    const result = validate(notDate)
    expect(result).toBeInstanceOf(Error)
  })

  it('should validate boolean types', () => {
    config.type = 'boolean'
    const notBoolean = 5

    const validate = validator('boolean', config)
    const result = validate(notBoolean)

    expect(result).toBeInstanceOf(Error)
  })

  it('should validate number types', () => {
    config.type = 'number'
    const notNumber = 'hi'

    const validate = validator('number', config)
    const result = validate(notNumber)

    expect(result).toBeInstanceOf(Error)
  })

  it('should return default value if undefined is passed', () => {
    const validate = validator('date', config)

    const result = validate()
    expect(result).toBeInstanceOf(Date)
  })

  it('should return error when default is different than type', () => {
    const badConfig = {
      required: true,
      default: 'not a date',
      type: 'date'
    }

    const validate = validator('date', badConfig)
    const result = validate()

    expect(result).toBeInstanceOf(Error)
  })

  it('should error if value is not in enum collection', () => {
    const validate = validator('enum', ofConfig)
    const result = validate('not in enum')

    expect(result).toBeInstanceOf(Error)
  })

  it('should pass value through if it is in enum collection', () => {
    const validate = validator('enum', ofConfig)
    const result = validate('these')

    expect(result).toEqual('these')
  })
})
