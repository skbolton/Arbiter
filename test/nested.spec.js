/**
 * Test that nested schemas and the mapping are working
 */

const setup = require('./setup')
const nockQuery = require('./nocks/query')
const OpportunityCurry = require('./models/opportunity')

let Opportunity
beforeAll(() => {
  const arbiter = setup()
  Opportunity = OpportunityCurry(arbiter)
})

test('should map the values correctly based on schema', () => {
  const oppId = '1'
  const oppName = 'O-54321'
  const projId = '1'
  const proposalId = '1'
  const proposalCompleted = '2018-02-22T00:00:00z'
  nockQuery.query({
    Id: oppId,
    Name: oppName,
    Project__r: {
      Id: projId,
      Proposal_CAD__r: {
        Id: proposalId,
        Proposal_Completed__c: proposalCompleted
      }
    }
  })

  const expected = {
    id: oppId,
    name: oppName,
    project: {
      id: projId,
      proposalCAD: {
        id: proposalId,
        proposalCompleted
      }
    }
  }

  return Opportunity.findOne()
    .select('*, project.*, project.proposalCAD.*')
    .exec()
    .then(opp => expect(opp).toMatchObject(expected))
})
