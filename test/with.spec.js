/**
 * query.with() is a way to join Models and query over relations that don't exist
 * in a Salesforce schema.
 *
 * Its a way to have Arbiter make multiple requests for you and properly join the results
 * together so that you don't have to
 *
 * Example in test
 * Fetch Cases, with their comments, with their users
 */

const setup = require('./setup')
const nockQuery = require('./nocks/query')
const CaseCurry = require('./models/case')

let Case
beforeAll(() => {
  const arbiter = setup()
  Case = CaseCurry(arbiter)
})

const case1 = {
  Id: 'case1'
}
const case2 = {
  Id: 'case2'
}
const case3 = {
  Id: 'case3'
}
const case4 = {
  Id: 'case4'
}
const user1 = {
  Id: 'user1',
  FirstName: 'Stephen',
  LastName: 'Bolton'
}
const user2 = {
  Id: 'user2',
  FirstName: 'Jasper',
  LastName: 'Collins'
}
// 2 comments on case 1
const comment1 = {
  Id: '1',
  ParentId: case1.Id,
  CommentBody: 'That guy was nuts...',
  CreatedById: user1.Id
}
const comment2 = {
  Id: '2',
  ParentId: case1.Id,
  CommentBody: 'Yeah Stephen was right that guy is nuts',
  CreatedById: user2.Id
}
// one comment on case 3
const comment3 = {
  Id: '3',
  ParentId: case3.Id,
  CommentBody: 'We need to convert this guy right now!',
  CreatedById: user2.Id
}

it('loads associtions', () => {
  // IMPORTANT: Order of nock calls mattters!
  // first query will be for cases
  nockQuery.query([ case1, case2, case3, case4 ])
  // next will be for comments
  nockQuery.query([ comment1, comment2, comment3 ])
  // next will be for users
  nockQuery.query([ user1, user2 ])

  const expected = [
    {
      id: case1.Id,
      comments: [
        {
          id: comment1.Id,
          comment: comment1.CommentBody,
          createdById: user1.Id,
          case: comment1.ParentId,
          owner: {
            id: user1.Id,
            firstName: user1.FirstName,
            lastName: user1.LastName
          }
        },
        {
          id: comment2.Id,
          comment: comment2.CommentBody,
          createdById: user2.Id,
          case: comment2.ParentId,
          owner: {
            id: user2.Id,
            firstName: user2.FirstName,
            lastName: user2.LastName
          }
        }
      ]
    },
    {
      id: case2.Id,
      comments: []
    },
    {
      id: case3.Id,
      comments: [
        {
          id: comment3.Id,
          comment: comment3.CommentBody,
          createdById: comment3.CreatedById,
          owner: {
            id: user2.Id,
            firstName: user2.FirstName,
            lastName: user2.LastName
          }
        }
      ]
    },
    {
      id: case4.Id,
      comments: []
    }
  ]

  return Case.findByIds([ case1.Id, case2.Id, case3.Id, case4.Id ])
    .with('comments', commentsQuery => {
      commentsQuery.select('*')
        .with('owner', ownerQuery => {
          ownerQuery.select('*')
        })
    })
    .exec()
    .then(result => {
      const [ first, second, third, fourth ] = expected
      const [ grunt1, grunt2, grunt3, grunt4 ] = result

      expect(grunt1.comments[0]).toMatchObject(first.comments[0])
      expect(grunt1.comments[0].owner).toMatchObject(first.comments[0].owner)
      expect(grunt1.comments[1]).toMatchObject(first.comments[1])
      expect(grunt1.comments[1].owner).toMatchObject(first.comments[1].owner)

      // 2nd and 4th case shouldn't have comments
      expect(grunt2).toMatchObject(second)
      expect(grunt4).toMatchObject(fourth)

      expect(grunt3.comments[0]).toMatchObject(third.comments[0])
      expect(grunt3.comments[0].owner).toMatchObject(third.comments[0].owner)
    })
})
