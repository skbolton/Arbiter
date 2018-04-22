const Association = require('../association')

describe('Association class', () => {
  const model = {
    name: 'Model',
    getAssociation: jest.fn()
  }
  let association
  beforeEach(() => {
    association = new Association(model)
  })

  describe('constructor(model)', () => {
    it('sets up correct initial state', () => {
      const expected = {
        model,
        error: null,
        associations: []
      }
      const actual = association

      expect(actual).toEqual(expected)
    })
  })

  describe('#add(associations, maybeCallback)', () => {
    it('calls off to model to get config for associations', () => {
      const input = { comments (comments) { comments.select('*') } }

      association.add(input)

      expect(model.getAssociation).toHaveBeenCalledWith('comments')
    })

    it('takes config returned by model and adds association name and callback to it', () => {
      const mockReturn = {
        from: 'something',
        to: 'somewhere',
        model, // this doesn't make sense technically but works for test
        relation: 'hasMany'
      }
      model.getAssociation.mockImplementationOnce(() => mockReturn)

      const name = 'comments'
      const callback = function (comments) { comments.select('*') }
      const input = { [name]: callback }

      association.add(input)
      const expected = Object.assign(mockReturn, { association: name, queryCb: callback })
      const actual = association.associations[0]

      expect(actual).toEqual(expected)
    })

    it('handles adding multiple associations', () => {
      model.getAssociation.mockImplementation(val => val)
      const input = {
        comments () {},
        somethingElse () {}
      }

      association.add(input)
      expect(association.associations.length).toBe(2)
    })

    it('adds an error to state if model does not return a config', () => {
      model.getAssociation.mockImplementationOnce(() => undefined)
      const input = { nope: () => {} }

      expect(association.error).toBe(null)
      association.add(input)
      expect(association.error).toBeInstanceOf(Error)
    })

    it('handles when association is a string and maybecallback gets passed', () => {
      const mockReturn = {
        from: 'somewhere',
        to: 'somewhere',
        relation: 'hasMany',
        model
      }
      model.getAssociation.mockImplementationOnce(() => mockReturn)
      const associationName = 'comments'
      const callback = function () { }

      association.add(associationName, callback)
      const expected = Object.assign(mockReturn, {
        association: associationName,
        queryCb: callback
      })
      const actual = association.associations[0]

      expect(actual).toEqual(expected)
    })
  })

  describe('#getSelects()', () => {
    it('returns all from fields in associations', () => {
      association.associations = [
        {
          from: 'something'
        },
        {
          from: 'otherThing'
        }
      ]

      const expected = [ 'something', 'otherThing' ]
      const actual = association.getSelects()

      expect(actual).toEqual(expected)
    })
  })

  describe('#build()', () => {
    it('returns associations when no errors present', () => {
      const expected = association.associations
      const actual = association.build()

      expect(actual).toBe(expected)
    })

    it('returns error when one is in state', () => {
      const error = new Error('whoops')
      association.error = error

      const expected = error
      const actual = association.build()

      expect(actual).toEqual(expected)
    })
  })

  describe('#fetch(grunts)', () => {
    it('returns grunts if grunts is empty', () => {
      const input = []

      const expected = input
      const actual = association.fetch(input)

      expect(actual).toBe(expected)
    })

    it('returns grunts if associations is empty', () => {
      const input = [ 1, 2, 3 ]

      const expected = input
      const actual = association.fetch(input)

      expect(actual).toEqual(expected)
    })

    it('should call fetchAssociation for every association configured', () => {
      association.fetchAssociation = jest.fn()
      // these are not correct looking associations but aren't needed for this test
      association.associations = [ 1, 2, 3, 4 ]
      const input = [ 1, 2, 3, 4 ]

      association.fetch(input)

      expect(association.fetchAssociation).toHaveBeenCalledTimes(4)
    })
  })
})
