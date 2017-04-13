module.exports = {
  getByIds (ids) {
    if (!this.pool) {
      return Promise.reject(new Error('Pool not configured!'))
    }
  },
  getById (id) {
    if (!this.pool) {
      return Promise.reject(new Error('Pool not configured!'))
    }
  },
  RAW (query) {
    if (!this.pool) {
      return Promise.reject(new Error('Pool not configured!'))
    }
    return this.pool.getConnection()
      .then(conn => conn.queryAsync(query))
      .then(data => data.records)
  }
}