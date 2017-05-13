module.exports = (fns) => {
  let lastCall
  for (let fn of fns) {
    try {
      lastCall = fn(lastCall)
    } catch (e) {
      return e
    }
  }
  return lastCall
}
