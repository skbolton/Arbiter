jest.mock('../fields')
jest.mock('../association')
jest.mock('../modifier')
jest.mock('../where')

const Query = require('../index')

const Fields = require('../fields')
const Where = require('../where')
const Modifier = require('../modifier')

describe('Query class', () => {
  let query
  const schema = {
    expandFields: jest.fn(fields => fields),
    mapFields: jest.fn(fields => fields)
  }
  const model = { schema }

  beforeEach(() => {
    query = new Query(model)
  })
  describe('constructor(model)', () => {
    it('adds model and schema from model as immutable properties', () => {
      expect(query.model).toBe(model)
      expect(query.schema).toBe(schema)

      query.model = 'should not be changeable'
      query.schema = 'dont ever let this happen'

      expect(query.model).toBe(model)
      expect(query.schema).toBe(schema)
    })
    it('sets up basic state holders for query to be built', () => {
      expect(query._fields).toBeDefined()
      expect(query._where).toBeDefined()
      expect(query._sort).toBeDefined()
      expect(query._modifier).toBeDefined()
    })
  })

  describe('#select(...fields)', () => {
    it('calls into Fields class to mangage selection of fields', () => {
      const input = 'field, field2, field3'
      query.select(input)
      const [ mockFieldInstance ] = Fields.mock.instances

      const mockAdd = mockFieldInstance.add

      expect(mockAdd).toHaveBeenCalledWith([input])
    })

    it('returns query object for chaining', () => {
      const returned = query.select()

      expect(returned).toBe(query)
    })
  })

  describe('#where(opts)', () => {
    it('calls into Where class to manage where clause state', () => {
      const input = {
        status: 'Open'
      }

      query.where(input)
      const [ mockWhereInstance ] = Where.mock.instances
      const mockAdd = mockWhereInstance.add

      expect(mockAdd).toHaveBeenCalledWith(input)
    })

    it('returns query object for chaining', () => {
      const returned = query.where()

      expect(returned).toBe(query)
    })
  })

  describe('#limit(count)', () => {
    it('calls into modifier class to manage limit state', () => {
      const input = 5

      query.limit(input)
      const [ mockedModifierInstance ] = Modifier.mock.instances
      const mockAddLimit = mockedModifierInstance.addLimit

      expect(mockAddLimit).toHaveBeenCalledWith(input)
    })

    it('returns query object for chaining', () => {
      const returned = query.limit()

      expect(returned).toBe(query)
    })
  })

  describe('#skip(amount)', () => {
    it('calls into modifier class to manage skip state', () => {
      const input = 10

      query.skip(input)
      const [ mockedModifierInstance ] = Modifier.mock.instances
      const mockAddSkip = mockedModifierInstance.addSkip

      expect(mockAddSkip).toHaveBeenCalledWith(input)
    })

    it('returns query object for chaining', () => {
      const returned = query.skip()

      expect(returned).toBe(query)
    })
  })

  describe('#offset(amount)', () => {
    it('is an alias for query.skip', () => {
      const input = 10
      query.skip = jest.fn()

      query.offset(input)

      expect(query.skip).toHaveBeenCalledWith(input)
    })

    it('returns query object for chaining', () => {
      const returned = query.offset()

      expect(returned).toBe(query)
    })
  })
})
