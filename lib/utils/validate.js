const detect = require('type-detect')

const getType = (thing) => detect(thing)

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
    throw new TypeError(`${context} needs to be instance of ${parent.name}`)
  }
}

const checkTypeAsync = (...args) => {
  try {
    checkType(...args)
    return Promise.resolve()
  } catch (err) {
    return Promise.reject(err)
  }
}

const checkIsaAsync = (...args) => {
  try {
    checkIsa(...args)
    return Promise.resolve()
  } catch (err) {
    return Promise.reject(err)
  }
}

module.exports = {
  getType,
  checkType,
  checkIsa,
  checkTypeAsync,
  checkIsaAsync
}
