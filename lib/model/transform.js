const soqlArrayStringify = (array) => {
  return `('${array.join("', '")}')`
}

const like = (key, value) => {
  return `${key} LIKE '${value.like}'`
}

const not = (key, value) => {
  const option = value.not
  if (Array.isArray(option)) {
    return `${key} NOT IN ${soqlArrayStringify(option)}`
  }
  return option === null
    ? `${key} != ${option}`
    : `${key} != '${option}'`
}

const notlike = (key, value) => {
  return `(NOT ${key} LIKE '${value.notLike}'`
}

const gt = (key, value) => {
  return comparitor(key, value.gt, '>')
}

const gte = (key, value) => {
  return comparitor(key, value.gte, '>=')
}

const lt = (key, value) => {
  return comparitor(key, value.lt, '<')
}

const lte = (key, value) => {
  return comparitor(key, value.lte, '<=')
}

const comparitor = (key, value, compar) => {
  return `${key} ${compar} '${value}'`
}

module.exports = {
  soqlArrayStringify,
  like,
  not,
  notlike,
  gt,
  gte,
  lt,
  lte,
  comparitors: ['like', 'not', 'notLike', 'gt', 'gte', 'lt', 'lte']
}
