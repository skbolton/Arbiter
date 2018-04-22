const objEach = require('./utils/object-each')
const _sobject = Symbol('sobject')
const _elite = Symbol('elite')
const _update = Symbol('update')
const _create = Symbol('create')
const _validateAll = Symbol('validateAll')
const _showErrors = Symbol('showErrors')

/**
 * Class for managing query results and object creation. Class is proxied by a handler that the schema creates in order to validate keys being written to object
 *
 * @class Grunt
 */
class Grunt {
  /**
   * Creates an instance of Grunt.
   * @param {object} props
   * @param {Model} model
   * @param {Handler} handler
   *
   * @memberof Grunt
   */
  constructor (initialProps, sobjectQuery, elite, { strict, rejectMutations } = {}) {
    // properties to expose so that elite handler can read/write
    Object.defineProperties(this, {
      __changeset: {
        value: {},
        writable: true
      },
      __errors: {
        value: {},
        writable: true
      },
      __rejectMutations: {
        value: rejectMutations || new Set()
      }
    })
    Object.assign(this, initialProps)
    this[_sobject] = sobjectQuery
    this[_elite] = elite
    return new Proxy(this, elite)
  }

  /**
   * Gets from handler all the fields that are writable and then sets on themselves the value they currently hold for that field. Potentially they hold nothing there and the validation of the handler kicks in
   *
   *
   * @memberof Grunt
   */
  [_validateAll] () {
    this[_elite].validateAllKeys(this)
  }

  /**
   * Updates Salesforce by taking all of the fields in the `__changeset` and sending them to salesforce
   *
   * @returns Grunt
   *
   * @memberof Grunt
   */
  [_update] () {
    return this[_sobject]()
      .then(sobject => {
        this.__changeset.Id = this.id
        return sobject.update(this.__changeset)
      })
      .then(() => {
        this.__changeset = {}
        return this
      })
  }

  /**
   * Used when a grunt does not have an id and represents a grunt that has not been queried from Salesforce
   *
   * @returns Grunt
   *
   * @memberof Grunt
   */
  [_create] () {
    return this[_sobject]()
      .then(sobject => sobject.create(this.__changeset))
      // this lowercase id is not a mapping jsforce returns it lowercased for some reason
      .then(({ id }) => {
        this.id = id
        this.__changeset = {}
        return this
      })
  }

  [_showErrors] () {
    let output = ''
    objEach(this.__errors, (field, err) => {
      output += ` ${err.message}`
    })
    return new Error(output)
  }

  /**
   * Attempts to save a grunt against salesforce
   *
   * @returns Grunt
   *
   * @memberof Grunt
   */
  save () {
    // has no id this is an unsaved grunt (Model.new created it)
    if (!this.id) {
      // validate all writables
      this[_validateAll]()
      if (Object.keys(this.__errors).length > 0) {
        return Promise.reject(this[_showErrors]())
      }
      // nothing to save
      if (Object.keys(this.__changeset).length === 0) {
        return Promise.resolve(this)
      }
      // send up to salesforce
      return this[_create]()
    } else {
      // has errors
      if (Object.keys(this.__errors).length > 0) {
        return Promise.reject(this[_showErrors]())
      }
      // nothing to save
      if (Object.keys(this.__changeset).length === 0) {
        return Promise.resolve(this)
      }
      // no errors update
      return this[_update]()
    }
  }
}

module.exports = Grunt
