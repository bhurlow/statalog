const R = require('ramda')
const { DatalogQuery } = require('../src/query')
const q = require('../src/q')

const attrs = [':user/age', ':user/size', ':user/speed']

const values = [25, 50, 150]

const randNth = seq => {
  let max = seq.length
  let r = Math.floor(Math.random() * max)
  return seq[r]
}

let rnd = randNth(attrs)

const n = 1000000
const data = R.range(0, n).map(i => {
  return [i, randNth(attrs), randNth(values)]
})


data.push([6000, ':user/age', 50])
data.push([6000, ':user/size', 90])
data.push([6001, ':user/age', 50])
data.push([6001, ':user/size', 91])

let myQ = new DatalogQuery({})

let query = myQ
  .find('?e', '?s')
  .where('?e', ':user/age', 50)
  .where('?e', ':user/size', '?s')

let start = Date.now()
let res = q(query, data)
let end = Date.now()
let elapsed = end - start

console.log(res)
console.log(`${data.length} rows, ${elapsed}ms`)

