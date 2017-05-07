const _model = Symbol('model')
const _sfObject = Symbol('sfobject')
const _update = Symbol('update')
const _create = Symbol('create')

class Grunt {
  constructor (props, model, handler) {
    Object.defineProperties(this, {
      __changeset: {
        value: {},
        writable: true
      },
      __errors: {
        value: {},
        writable: true
      }
    })
    this[_model] = model
    this[_sfObject] = model.sfObject
    return new Proxy(this, handler)
  }

  [_update] () {
    return this[_model].getConnection()
      .then(conn => {
        this.__changeset.Id = this.id
        return conn.updateAsync(this[_sfObject], this.__changeset)
      })
      .then(() => {
        this.__changeset = {}
        return this
      })
  }

  [_create] () {
    return this[_model].getConnection()
      .then(conn => conn.createAsync(this[_sfObject], this.__changeset))
      .then(({ id }) => {
        this.id = id
        this.__changeset = {}
        return this
      })
  }

  save () {
    // has errors
    if (Object.keys(this.__errors).length > 0) {
      return Promise.reject(this.showErrors())
    }
    // nothing to save
    if (Object.keys(this.__changeset).length === 0) {
      return Promise.resolve(this)
    }
    // has no id this is an unsaved grunt (Model.new created it)
    if (!this.id) {
      // validate all writables

      // send up to salesforce
      this[_create]()
      // add id to grunt
    } else {
      // has errors
      if (Object.keys(this.__errors) > 0) {
        return Promise.reject(this.showErrors())
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
