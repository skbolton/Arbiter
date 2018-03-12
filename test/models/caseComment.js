const arbiter = require('../../index')
const { Schema } = arbiter

const caseCommentSchema = new Schema('CaseComment', {
  comment: 'CommentBody',
  createdById: 'CreatedById',
  case: 'ParentId'
})

const CaseComment = arbiter.model('CaseComment', caseCommentSchema)

CaseComment.setAssociations({
  owner: {
    from: 'createdById',
    to: 'id',
    relation: CaseComment.relations.hasOne,
    model: require('./user')
  }
})

module.exports = CaseComment
