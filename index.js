const R = require('ramda')

// [?b ...]
// (count ?u)
//

// (not [?u :user/follows ?b])

// :where (or [?b :board/created-by ?e]
//           [?b :board/admins ?e])]

// (or-join [?b ?bs ?u]

//  (and
// [?bs :board-settings/permission-level :private]
// [?bs :board-settings/discoverable true])
//
// (parent-from-post ?e ?p)

class DatalogQuery {
  constructor(props) {
    this.findVars = null
    this.clauses = []
    // this.in = []
  }

  foo() {
    return 123
  }

  find(...findVars) {
    this.findVars = findVars
    return this
  }

  in() {
    return this
  }

  where(...bindingVars) {
    this.clauses.push(bindingVars)
    return this
  }
}

const isVar = x => {
  return String(x).startsWith('?')
}

function q(datalogQuery, inputs) {
  let clauses = datalogQuery.clauses

  let context = {
    rels: [],
    inputs
  }

  // given an index mapping of matching positions
  // filter the input to only datoms that match those
  // this would incur a db search if supported
  // (otherwise full scan on inputs occurs)
  const filterInput = (index, inputs) => {
    return inputs.filter(datom => {
      let tests = R.keys(index).map(iStr => {
        let i = Number(iStr)
        let val = datom[i]
        let expected = index[i]
        return R.equals(val, expected)
      })
      return R.all(x => !!x, tests)
    })
  }

  const makeRel = (ctx, clause) => {
    let symbols = clause.filter(isVar)

    // create a mapping of index to constant
    // this is used to filter the input source to match the
    // clause
    let index = R.range(0, 4).reduce((acc, i) => {
      let elem = clause[i]
      if (!isVar(elem) && !!elem) {
        acc[i] = elem
      }
      return acc
    }, {})

    // construct a mapping of logic var to position
    // in the clause for use during hashjoin
    let offsetMap = R.pipe(
      clauses =>
        clauses.map((elem, i) => {
          if (isVar(elem)) {
            return [elem, i]
          }
        }),
      R.filter(x => !!x),
      R.fromPairs
    )(clause)

    let coll = filterInput(index, ctx.inputs)

    return {
      symbols,
      offsetMap,
      coll
    }
  }

  // create a new relation by comparing the coll values in rel2
  // with those in rel1, keeping only the values that match for each
  // logic var
  // TODO hash against the smaller collection
  const hashJoin = (rel1, rel2) => {
    let combinedSyms = R.uniq(R.concat(rel1.symbols, rel2.symbols))
    let sharedSyms = R.intersection(rel1.symbols, rel2.symbols)

    let hashTable = new Map()

    for (bindingVar in rel1.offsetMap) {
      hashTable.set(bindingVar, new Set())
    }

    for (tuple of rel1.coll) {
      for (bindingVar in rel1.offsetMap) {
        let idx = rel1.offsetMap[bindingVar]
        let value = tuple[idx]
        hashTable.get(bindingVar).add(value)
      }
    }

    let intersectionColl = rel2.coll.filter(tuple => {
      let tests = []
      for (bindingVar of sharedSyms) {
        let idx = rel2.offsetMap[bindingVar]
        let value = tuple[idx]
        let test = hashTable.get(bindingVar).has(value)
        tests.push(test)
      }
      return tests.every(x => !!x)
    })

    let combinedRelation = {
      symbols: combinedSyms,
      // what should offset map be in the case of "ref" types
      // where the same binding var is used in both positions?
      offsetMap: R.merge(rel1.offsetMap, rel2.offsetMap),
      // unclear on whether the combined relation should have both
      // relation's collections. 
      coll: intersectionColl,
      joined: true
    }

    return combinedRelation
  }

  const hashJoinRel = (ctx, rel2) => {
    let rel1 = ctx.rels
    return hashJoin(rel1, rel2)
  }

  const applyFind = (datalogQuery, ctx) => {

    const findVars = datalogQuery.findVars
    const returnSet = new Set()

    for (tuple of ctx.coll) {
      let row = new Set()
      for (bindingVar of findVars) {
        let idx = ctx.offsetMap[bindingVar]
        let value = tuple[idx]
        row.add(value)
      }
      returnSet.add(row)
    }

    return returnSet
  }

  let reducedCtx = clauses.reduce((ctx, clause) => {
    let [e, a, v = '_'] = clause

    let rel = makeRel(ctx, clause)

    if (R.isEmpty(ctx.rels)) {
      ctx.rels = rel
      return ctx
    }

    let newCtx = hashJoinRel(ctx, rel)

    return newCtx
    //     let filtered = inputs.filtered(datom => {
    //       let ret = false
    //       return ret
    //     })
  }, context)

  // TODO
  // apply find spec
  // perform find

  return applyFind(datalogQuery, reducedCtx)
}

let myQ = new DatalogQuery({})

let query = myQ
  .find('?e', '?s')
  .where('?e', ':user/age', 50)
  .where('?e', ':user/speed', '?s')

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

let res = q(query, data)

console.log('res', res)
