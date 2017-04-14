const detect = require('type-detect')

const checkType = (thing, expected, context) => {
  const detected = detect(thing)
  if (detected !== expected) {
    throw new TypeError(
        `${context} is expecting ${expected}. Instead got: ${detected}.`
      )
  }
}

const checkIsa = (thing, parent, context) => {
  const isInstance = thing instanceof parent
  if (!isInstance) {
    throw new TypeError(`${context} needs to be instance of ${parent}`)
  }
}

const asyncCheckType = (...args) => {
  try {
    checkType(...args)
    return Promise.resolve()
  } catch (err) {
    return Promise.reject(err)
  }
}

const asyncCheckIsa = (...args) => {
  try {
    checkIsa(...args)
    return Promise.resolve()
  } catch (err) {
    return Promise.reject(err)
  }
}

module.exports = {
  checkType,
  checkIsa,
  async: {
    checkType: asyncCheckType,
    checkisa: asyncCheckIsa
  }
}
