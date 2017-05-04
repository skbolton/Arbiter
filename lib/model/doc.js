module.exports = {
  save () {
    if (Object.keys(this.__changeset).length === 0) {
      return Promise.resolve()
    }
    // changeset has updated values send up to save
    return this.getConnection()
      .then(conn => {
        this._writables.Id = this.Id
        return conn.updateAsync(this.sfObject, this.__changeset)
      })
      .then(() => {
        this._writables = {}
        return this
      })
  }
}
