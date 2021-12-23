/**
 * query.allowMutations() is a way to allow only certain writable fields from schema
 * to get written. It requires that the fields being allowed are actually writable.
 *
 * query.rejectMutations() is the oppositie of allow but otherwise works the same
 */

const setup = require('./setup')
const nockQuery = require('./nocks/query')
const CaseCurry = require('./models/case')

describe('allow and reject mutations', () => {
  let Case
  beforeAll(() => {
    const arbiter = setup()
    Case = CaseCurry(arbiter)
  })

  describe('allowMutations(mutations)', () => {
    it('rejects if field in mutations is not writable in schema', () => {
      // incorrect spelling of writable field
      const query = Case.findOne({ status: 'Active' }).allowMutations([ 'sttatus' ]).exec()

      return expect(query).rejects.toThrow(Error)
    })

    it('allows mutation on field', () => {
      const CASE_ID = '1'
      nockQuery.query({
        Status: 'Active',
        Id: CASE_ID
      })
      nockQuery.update('Case', CASE_ID)

      const query = Case.findOne({
        status: 'Active'
      })
      .allowMutations([ 'status' ])
      .exec()
      .then(_case => {
        _case.status = 'Something else'
        return _case.save()
      })

      return expect(query).resolves.toMatchObject({
        id: CASE_ID,
        status: 'Something else'
      })
    })
  })

  describe('rejectMutations(mutations)', () => {
    it('rejects if field in mutations is not writable in schema', () => {
      // field that doesn't exist in schema
      const query = Case.findOne({ status: 'Active' }).rejectMutations([ 'what' ]).exec()

      return expect(query).rejects.toThrow(Error)
    })

    it('rejects if trying to mutate field that is in rejectMutations', () => {
      nockQuery.query({ Status: 'Active', Id: '1' })

      const query = Case.findOne({ status: 'Active' })
        .rejectMutations(['status'])
        .then(_case => {
          _case.status = 'Not going to work'
          return _case.save()
        })
      return expect(query).rejects.toThrow(Error)
    })
  })
})
