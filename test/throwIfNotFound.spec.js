/**
 * query.throwIfNotFound() will inspect the result of a query and throw if it is
 * either null or an empty array
 */

const setup = require('./setup')
const nockQuery = require('./nocks/query')
const OpportunityCurry = require('./models/opportunity')

let Opportunity
beforeAll(() => {
  const arbiter = setup()
  Opportunity = OpportunityCurry(arbiter)
})

it('does not throw if query.throwIfNotFound was not called even if results are empty', () => {
  nockQuery.empty()
  expect(Opportunity.find().exec()).resolves.toEqual([])
})

it('throws if query.throwIfNotFound is called and results are empty', () => {
  nockQuery.empty()
  const error = new Error('Your results were not found')
  const query = Opportunity.find()
    .throwIfNotFound(error)
    .exec()

  return expect(query).rejects.toThrow(error)
})

it('does not throw if query.throwIfNotFound was called, but results come back', () => {
  const response = [
    {
      Project__r: {
        Id: '1'
      }
    },
    {
      Project__r: {
        Id: '2'
      }
    }
  ]
  nockQuery.query(response)

  const query = Opportunity.find().select('project.id').throwIfNotFound().exec()

  return expect(query).resolves.toBeDefined()
})
