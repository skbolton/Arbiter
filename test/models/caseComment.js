const { Schema } = require('../../index')

const caseCommentSchema = new Schema('CaseComment', {
  comment: 'CommentBody',
  createdById: 'CreatedById',
  case: 'ParentId'
})

module.exports = (arbiter) => {
  const model = arbiter.getModel('CaseComment');
  if (model) {
    return model;
  }

  const CaseComment = arbiter.model('CaseComment', caseCommentSchema)

  CaseComment.setAssociations({
    owner: {
      from: 'createdById',
      to: 'id',
      relation: CaseComment.relations.hasOne,
      model: require('./user')(arbiter)
    }
  })

  return CaseComment
}
