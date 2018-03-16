const Tree = require('../tree')
const { oppSchema } = require('../../../test/fixtures/schema')

// TODO: need more tests here for when it is a root tree
describe('Tree class', () => {
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
