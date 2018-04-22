const Handler = require('../handler')

describe('Handler Class', () => {
  let handler
  const writables = {
    field1: {
      sf: 'Field1',
      validate: jest.fn()
    },
    field2: {
      sf: 'Field2',
      validate: jest.fn()
    }
  }

  beforeEach(() => {
    handler = new Handler(writables)
  })
  describe('constructor(writables)', () => {
    it('setups up correct initial state', () => {
      const expected = { writables }
      const actual = handler

      expect(actual).toEqual(expected)
    })
  })

  describe('#set(grunt, key, value)', () => {
    it('adds key to grunt regardless of errors', () => {
      const grunt = {}
      const key = 'yo'
      const value = 'hi'

      handler.set(grunt, key, value)

      expect(grunt).toEqual({ [key]: value })
    })

    it('adds key to __errors on grunt if field is invalid', () => {
      const error = new Error('Invalid')
      const grunt = { __errors: {}, __changeset: {} }
      // make validation always fail
      writables.field1.validate.mockImplementationOnce(() => error)

      handler.set(grunt, 'field1', true)

      expect(grunt).toHaveProperty('__errors.field1', error)
    })

    it('removes key from __changeset when there is an error in field', () => {
      const error = new Error('yikes')
      const grunt = {
        __errors: {},
        // changesets get the mapping of the value saved
        __changeset: {
          Field1: true
        }
      }
      // make validation fail
      writables.field1.validate.mockImplementationOnce(() => error)

      handler.set(grunt, 'field1', true)

      expect(grunt).not.toHaveProperty('__changeset.Field1')
    })

    it('adds field to changeset if it is writable and passes validation', () => {
      const grunt = { __errors: {}, __changeset: {} }
      writables.field2.validate.mockImplementationOnce(() => true)

      handler.set(grunt, 'field2', true)

      expect(grunt).toHaveProperty('__changeset.Field2', true)
    })

    it('removes field from errors if validation passes', () => {
      const grunt = {
        __errors: {
          field2: new Error('I failed at one point')
        },
        __changeset: {}
      }
      writables.field2.validate.mockImplementationOnce(() => true)

      handler.set(grunt, 'field2', true)

      expect(grunt).not.toHaveProperty('__errors.field2')
    })
  })

  describe('#deleteProperty(grunt, key)', () => {
    it('throws error if trying to delete the id key', () => {
      const shouldThrow = () => {
        handler.deleteProperty({}, 'id')
      }

      expect(shouldThrow).toThrow(Error)
    })

    it('removes key from grunt at all places that it exists', () => {
      // has key as error
      const grunt1 = {
        field1: true,
        __errors: { field1: new Error('I was wrong') },
        __changeset: {}
      }

      // had it as a value in changeset
      const grunt2 = {
        field1: true,
        __errors: {},
        __changeset: {
          Field1: true
        }
      }

      handler.deleteProperty(grunt1, 'field1')
      handler.deleteProperty(grunt2, 'field1')

      expect(grunt1).not.toHaveProperty('field1')
      expect(grunt1).not.toHaveProperty('__errors.field1')
      expect(grunt2).not.toHaveProperty('field1')
      expect(grunt2).not.toHaveProperty('__changest.Field1')
    })
  })

  describe('#validateAllKeys(grunt)', () => {
    it('validates all keys on grunt and sets them where they belong based on validation', () => {
      const error = new Error('Whoops')
      const grunt = {
        // pretend valid field
        field1: true,
        // pretend invalid field
        field2: false,
        __errors: {},
        __changeset: {}
      }
      writables.field1.validate.mockImplementationOnce(() => true)
      writables.field2.validate.mockImplementationOnce(() => error)

      handler.validateAllKeys(grunt)

      expect(grunt).toHaveProperty('__errors.field2', error)
      expect(grunt).toHaveProperty('__changeset.Field1')
    })
  })
})
