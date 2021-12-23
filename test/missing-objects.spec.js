/**
 * When querying nested schemas in Salesforce its not guaranteed that objects will be there.
 * Aribiter will scaffold out all objects and make sure that the path is there so you don't get
 * `cannot read property x of undefined`
 *
 * This will attempt to get the following path opportunity -> project -> proposal. In example we are going to respond with no project which will make proposal missing as well
 */
const setup = require('./setup')
const nockQuery = require('./nocks/query')
const OpportunityCurry = require('./models/opportunity')

let Opportunity
beforeAll(() => {
  const arbiter = setup()
  Opportunity = OpportunityCurry(arbiter)
})

it('scaffolds out all objects even if response does not have them', () => {
  const response = {
    Id: '1',
    // project doesn't exist so proposalCAD wont be there
    Project__r: null
  }
  nockQuery.query(response)

  // but arbiter will scaffold regardless
  const expected = {
    project: {
      proposalCAD: {
        id: null,
        proposalCompleted: null
      }
    }
  }

  return Opportunity.findOne().select('project.proposalCAD.*')
    .then(actual => {
      expect(actual).toMatchObject(expect.objectContaining(expected))
    })
})
