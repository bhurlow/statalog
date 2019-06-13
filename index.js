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

  console.log('initial context', context)

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

  const hashJoin = (rel1, rel2) => {
    console.log('HASH JOIN', rel1, rel2)
  
  
  }

  const hashJoinRel = (ctx, rel2) => {
    let rel1 = ctx.rels
    return hashJoin(rel1, rel2)
  }

  let reduced = clauses.reduce((ctx, clause) => {
    let [e, a, v = '_'] = clause
    console.log('evaluating clause', clause)

    let rel = makeRel(ctx, clause)

    console.log('REL', rel)

    console.log('---')

    if (R.isEmpty(ctx.rels)) {
      ctx.rels = rel
      return ctx
    }

    let newCtx = hashJoinRel(ctx, rel)

    return ctx
    //     let filtered = inputs.filtered(datom => {
    //       let ret = false
    //       return ret
    //     })
  }, context)

  // perform find

  return reduced
}

let myQ = new DatalogQuery({})

let query = myQ
  .find('?s')
  .where('?e', ':user/age', 50)
  .where('?e', ':user/speed', '?s')

console.log(query)

const data = [
  [90, ':user/age', 50],
  [91, ':user/age', 50],
  [91, ':user/speed', 88],
  [93, ':user/age', 50],
  [93, ':user/speed', 4],
  [93, ':user/size', 22]
]

let res = q(query, data)

console.log('res', res)
