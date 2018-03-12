/**
 * Model.new(fields) is a way to create a grunt on the fly.
 * This is the api for how a user would create new instances of object in salesforce
 * and also to update and save objects at nested levels of a tree
 */

const setup = require('./setup')
const nockQuery = require('./nocks/query')
const Case = require('./models/case')
const CaseComment = require('./models/caseComment')

beforeAll(setup)

it('create grunt which can be saved', () => {
  nockQuery.create('Case')
  const grunt = Case.new()
  grunt.status = 'Active'

  return expect(grunt.save()).resolves.toBeDefined()
})

it('can take in exsisting grunts and save them', () => {
  const caseResult = {
    Id: '1'
  }

  const caseCommentResult = {
    ParentId: '1',
    CommentBody: 'Hello There'
  }

  nockQuery.query(caseResult)
  nockQuery.query(caseCommentResult)
  // nock the save
  nockQuery.update()

  const query = Case.findOne()
    .with('comments', query => query.select('id, comment'))
    .then(_case => {
      const comment = CaseComment.new(_case.comments[0])
      comment.comment = 'A new comment'

      return comment.save()
    })

  return expect(query).resolves.toBeDefined()
})
