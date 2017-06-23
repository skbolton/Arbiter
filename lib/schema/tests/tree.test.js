const { expect } = require('chai')
const Tree = require('../tree')
const { oppSchema } = require('../../../test/fixtures/schema')

describe('Tree class', () => {
  const isRoot = false
  const notRootTree = new Tree(oppSchema, isRoot)

  describe('constructor(config, isRoot)', () => {
    it('shouldn\'t add keys in `config` to writables when not root tree', () => {
      expect(notRootTree.writables.size).to.equal(0)
    })

    it('should\'t add keys in `config` to assocs when not root tree', () => {
      expect(notRootTree.assocs.size).to.equal(0)
    })

    it('should\'t add keys in `config` to rels when not root tree', () => {
      expect(notRootTree.rels.size).to.equal(0)
    })

    it('adds all fields to tree even when not root', () => {
      const configFieldCount = Object.keys(oppSchema).length
      expect(notRootTree.fields.size).to.equal(configFieldCount)
    })
  })
})
