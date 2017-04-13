class Schema {
  constructor (sfObject, config) {
    Object.defineProperty(this, 'id', {
      value: 'Id',
      writable: false
    })
  }
}

module.exports = Schema