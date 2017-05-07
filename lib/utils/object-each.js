module.exports = (obj, fn) => {
  const keys = Object.keys(obj)
  for (let key of keys) {
    fn(key, obj[key], obj)
  }
}
