const { merge, identity, always, contains } = require('ramda')
const chain = require('../utils/chain')
const valid = require('../utils/validate')

// IMPORTANT: order of importance
// default
// enum [ 'one', 'of', 'these', 'values' ]
// type
// required
const buildValidationChain = validationObj => {
  const chain = []
  chain.push(validationObj.default)
  chain.push(validationObj.enum)
  chain.push(validationObj.type)
  chain.push(validationObj.required)
  return chain
}

const functionizeConfig = (field, config) => {
  // make all validations default to return value and not do any checks
  const _config = merge(
    {
      default: identity,
      type: identity,
      enum: identity,
      required: identity
    },
    config
  )
  // add custom validations based on config passed in
  if (valid.getType(config.default) !== 'function') {
    _config.default = always(config.default)
  }
  if (config.enum) {
    _config.enum = value => {
      if (!contains(value, config.enum)) {
        throw new Error(
          `Field ${field} only accpets [ ${config.enum.join(', ')} ]. Instead got ${value}`
        )
      } else {
        return value
      }
    }
  }
  if (config.type) {
    _config.type = value => {
      // Don't validate the value if it is optional and not set
      if (!config.required && (value === undefined || value === null)) {
        return value
      } 

      const type = valid[config.type.toLowerCase()]
      const isValid = type(value)
      if (isValid !== null) {
        return isValid
      }
      throw new Error(`Field: ${field} is expecting type: ${config.type}`)
    }
  }
  if (config.required) {
    _config.required = value => {
      if (value === undefined || value === null) {
        throw new Error(`Required field: ${field} does not have a value set`)
      } else {
        return value
      }
    }
  }
  return _config
}

module.exports = (field, config = {}) => {
  const _config = functionizeConfig(field, config)
  return value => {
    // check all validation
    if (value === undefined) {
      const validationChain = buildValidationChain(_config)
      return chain(validationChain, value)
    } else {
      // validate typings and enum
      return chain([_config.enum, _config.type], value)
    }
  }
}
