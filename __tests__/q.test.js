const R = require('ramda')
const { DatalogQuery } = require('../src/query')
const q = require('../src/q')

test('basic bindings', async () => {
  const data = [
    [90, ':user/age', 50],
    [91, ':user/age', 50],
    [91, ':user/speed', 88],
    [93, ':user/age', 50],
    [93, ':user/speed', 4],
    [93, ':user/size', 22],
    [94, ':user/age', 62],
    [94, ':user/speed', 7]
  ]

  let myQ = new DatalogQuery({})

  let query = myQ
    .find('?s')
    .where('?e', ':user/age', 50)
    .where('?e', ':user/speed', '?s')

  let res = q(query, data)

  let expected = new Set([new Set([88]), new Set([4])])

  expect(res).toEqual(expected)
})

test('find bindings', async () => {
  const data = [
    [90, ':user/age', 50],
    [91, ':user/age', 50],
    [91, ':user/speed', 88],
    [93, ':user/age', 50],
    [93, ':user/speed', 4],
    [93, ':user/size', 22],
    [94, ':user/age', 62],
    [94, ':user/speed', 7],
    [93, ':user/size', 50]
  ]

  let myQ = new DatalogQuery({})

  let query = myQ.find('?e').where('?e', '?a', 50)

  let res = q(query, data)

  let expected = new Set([
    new Set([90]),
    new Set([91]),
    new Set([93]),
    new Set([93])
  ])

  expect(res).toEqual(expected)
})
