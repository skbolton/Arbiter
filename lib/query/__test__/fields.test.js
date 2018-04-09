const Fields = require('../fields')

const schema = {
  expandFields: jest.fn(),
  mapFields: jest.fn()
}

describe('Fields class', () => {
  let fields
  beforeEach(() => {
    fields = new Fields(schema)
  })

  describe('constructor(schema)', () => {
    it('saves schema as a property', () => {
      expect(fields.schema).toBe(schema)
    })

    it('starts with id field already selected', () => {
      const expected = true
      const actual = fields.fields.has('id')

      expect(actual).toBe(expected)
    })

    it('starts off with mapping of Id already set', () => {
      const expected = true
      const actual = fields.mappings.has('Id')

      expect(actual).toBe(expected)
    })
  })

  describe('#add(fields)', () => {
    it('handles when fields is an array', () => {
      const input = ['field', 'field2', 'field3']
      fields.add(input)

      input.forEach(field => {
        expect(fields.fields.has(field)).toBe(true)
      })
    })

    it('handles when first value of fields is a string of fields', () => {
      const input = [ [ 'field1, field2, field3' ] ]

      fields.add(input)
      const [ expected ] = input

      expected.forEach(field => {
        expect(fields.fields.has(field)).toBe(true)
      })
    })

    it('handles when first value is an array of fields', () => {
      const input = [ [ 'field1', 'field2', 'field3' ] ]

      fields.add(input)
      const [ expected ] = input

      expected.forEach(field => {
        expect(fields.fields.has(field)).toBe(true)
      })
    })

    describe('#build()', () => {
      it('calls into schema.expandFields with its fields to get their expanded value', () => {
        // id is always included
        fields.add(['hi'])

        fields.build()
        const expected = [ 'id', 'hi' ]

        expect(schema.expandFields).toHaveBeenCalledWith(expected)
      })

      it('calls into schema.mapFields to get their mapped value', () => {
        schema.expandFields.mockImplementationOnce(fields => fields)

        fields.add([ 'hi' ])

        fields.build()
        const expected = [ 'id', 'hi' ]

        expect(schema.mapFields).toHaveBeenCalledWith(expected)
      })

      it('returns any errors thrown by schema.expandFields()', () => {
        const error = new Error('whoops')
        schema.expandFields.mockImplementationOnce(() => { throw error })

        const actual = fields.build()
        const expected = error

        expect(actual).toEqual(expected)
      })

      it('returns any errors thrown by schema.mapFields()', () => {
        const error = new Error('whoops')
        schema.mapFields.mockImplementationOnce(() => { throw error })

        const actual = fields.build()
        const expected = error

        expect(actual).toBe(expected)
      })
    })
  })
})
