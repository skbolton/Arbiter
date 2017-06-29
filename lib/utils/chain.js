module.exports = (fns, initial = undefined) => {
  let lastCall = initial
  for (let fn of fns) {
    try {
      lastCall = fn(lastCall)
    } catch (e) {
      return e
    }
  }
  return lastCall
}
