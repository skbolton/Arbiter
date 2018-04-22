const Tree = require('../tree')
const Schema = require('../schema')

// TODO: need more tests here for when it is a root tree
describe('Tree class', () => {
  const oppSchema = new Schema('Opportunity', {
    name: 'Name',
    noAerialPhoto: {
      sf: 'No_Aerial_Photo__c',
      type: 'boolean',
      writable: true
    },
    project: new Schema('Project__r', {
      name: 'Name',
      proposalCAD: new Schema('Proposal_CAD__r', {
        proposalCompleted: 'Proposal_Completed__c'
      })
    }),
    service: new Schema('Service__r', {
      serviceNumber: 'Service_Number__c',
      name: 'Name'
    })
  })

  const isRoot = false
  const notRootTree = new Tree(oppSchema, isRoot)

  describe('constructor(config, isRoot)', () => {
    it('shouldn\'t add keys in `config` to writables when not root tree', () => {
      expect(notRootTree.writables.size).toEqual(0)
    })

    it('adds all fields to tree even when not root', () => {
      const configFieldCount = Object.keys(oppSchema).length
      expect(notRootTree.fields.size).toEqual(configFieldCount)
    })
  })

  describe('#addChild(key, value)', () => {
    it('should add `value` at `key` in children collection', () => {
      const expected = {} // making value object to be closer to use case
      const key = 'someKey'

      notRootTree.addChild(key, expected)
      const actual = notRootTree.children.get(key)

      expect(actual).toEqual(expected)
    })
  })
})
