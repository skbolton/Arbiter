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

/**
 * Test to see if a value is a valid date. Can accpet a date string or a date object
 * @param {*} testDate
 */
const date = testDate => {
  if (typeof testDate.getDate === 'function') {
    return testDate
  }
  if (testDate.search(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) > -1) {
    return testDate
  }
  return null
}

/**
 * Test to see if a value is a number
 * @param {*} numTest
 */
const number = numTest => {
  if (isNaN(Number(numTest))) {
    return null
  }
  return numTest
}

/**
 * Test to see if a value is a boolean. NOTE: It might be worthwile later to do coercion here as a helper but for now it strictly sees if it is passed true or false
 * @param {*} boolTest
 */
const boolean = boolTest => {
  const asString = boolTest.toString()
  if (asString === 'true' || asString === 'false') {
    return asString
  }
  return null
}

// Checking to see if something is a string is a little silly so this will
// probably will get removed
const string = value => {
  if (getType(value) === 'string') {
    return value
  }
  return null
}

module.exports = {
  getType,
  checkType,
  checkIsa,
  checkTypeAsync,
  checkIsaAsync,
  date,
  number,
  boolean,
  string
}
