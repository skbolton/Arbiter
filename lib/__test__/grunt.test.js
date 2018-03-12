const Grunt = require('../grunt')

describe('Grunt class', () => {
  let grunt
  const elite = { validateAllKeys: jest.fn() }
  const mockCreate = jest.fn(() => Promise.resolve(1))
  const mockUpdate = jest.fn(val => Promise.resolve(val))
  const sobjectQuery = jest.fn(() => Promise.resolve({ create: mockCreate, update: mockUpdate }))

  beforeEach(() => {
    grunt = new Grunt({}, sobjectQuery, elite)
  })
  describe('constructor(intialProps, sobjectQuery, elite, options)', () => {
    it('sets up correct initial state', () => {
      const expected = {
        __changeset: {},
        __errors: {},
        __rejectMutations: new Set()
      }
      const actual = grunt

      expect(actual).toMatchObject(expected)
    })
  })

  describe('save()', () => {
    it('should throw if any errors are on grunt', () => {
      grunt.__errors.bad = new Error('yikes')

      expect(grunt.save()).rejects.toThrow(Error)
    })

    it('should not make a query if there is no properties on the __changeset', () => {
      return grunt.save()
        .then(() => expect(sobjectQuery).not.toHaveBeenCalled)
    })
  })

  it('should call query if properties are on __changeset', () => {
    grunt.__changeset.aProp = true

    return grunt.save()
      .then(() => expect(sobjectQuery).toHaveBeenCalled)
  })

  it('calls create when grunt does not have an id property', () => {
    grunt.__changeset.aProp = true

    return grunt.save()
      .then(() => expect(mockCreate).toHaveBeenCalled)
  })

  it('calls update if grunt has an id property', () => {
    grunt.id = 1

    return grunt.save()
      .then(() => expect(mockUpdate).toHaveBeenCalled)
  })
})
