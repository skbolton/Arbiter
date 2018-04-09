const functionize = require('../utils/functionize')
const chain = require('../utils/chain')
const valid = require('../utils/validate')

const buildValidationChain = (validationObj) => {
  // IMPORTANT: order of importance
  // default
  // enum [ 'one', 'of', 'these', 'values' ]
  // type
  // required
  const chain = []
  chain.push(validationObj.default)
  chain.push(validationObj.enum)
  chain.push(validationObj.type)
  chain.push(validationObj.required)
  return chain
}

const functionizeConfig = (field, config) => {
  const _config = Object.assign({}, config)
  if (valid.getType(config.default) !== 'function') {
    _config.default = functionize.wrapValue(config.default)
  }
  if (_config.enum) {
    _config.enum = (value) => {
      if (config.enum.indexOf(value) === -1) {
        throw new Error(`Field ${field} only accpets [ ${config.of.join(', ')} ]. Instead got ${value}`)
      } else {
        return value
      }
    }
  } else {
    _config.enum = functionize.noopForward
  }
  if (_config.type) {
    _config.type = (value) => {
      const type = valid[config.type.toLowerCase()]
      const isValid = type(value)
      if (isValid !== null) {
        return isValid
      }
      throw new Error(`Field: ${field} is expecting type: ${config.type}`)
    }
  } else {
    _config.type = functionize.noopForward
  }
  if (_config.required) {
    _config.required = (value) => {
      if (value === undefined) {
        throw new Error(`Required field: ${field} does not have a value set`)
      } else {
        return value
      }
    }
  } else {
    _config.required = functionize.noopForward
  }
  return _config
}

module.exports = (field, config = {}) => {
  const _config = functionizeConfig(field, config)
  return (value) => {
    // check all validation
    if (value === undefined) {
      const validationChain = buildValidationChain(_config)
      return chain(validationChain, value)
    } else {
      // validate typings and of
      return chain([_config.enum, _config.type], value)
    }
  }
}
