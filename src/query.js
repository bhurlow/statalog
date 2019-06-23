class DatalogQuery {
  constructor(props) {
    this.findVars = null
    this.clauses = []
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

module.exports = {
  DatalogQuery
}
