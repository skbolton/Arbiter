const wrapValue = (value) => () => value
const noopForward = (value) => value

module.exports = {
  wrapValue,
  noopForward
}
