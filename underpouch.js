var _ = require('underscore')

_pouch = {}

_pouch.pluck = function(db, callback) {
  db.allDocs({include_docs: true}, function(err, res) {
    if(err) return console.log(err)
    docs = _.pluck(res.rows, 'doc')
    return callback(docs)
  })
}

_pouch.where = function(db, keyValuePair, callback) {
  db.allDocs({include_docs: true}, function(err, res) {
    if(err) return console.log(err)
    docs = _.chain(res.rows)
            .pluck('doc')
            .where(keyValuePair)
            .value()
    return callback(docs)
  })
}


_pouch.findWhere = function(db, keyValuePair, callback) {
  db.allDocs({include_docs: true}, function(err, res) {
    if(err) return console.log(err)
    docs = _.pluck(res.rows, 'doc')
    doc = _.findWhere(docs, keyValuePair)
    return callback(doc)
  })
}

_pouch.find = function(db, truthTest, callback) {
  db.allDocs({include_docs: true}, function(err, res) {
    if(err) return console.log(err)
    docs = _.pluck(res.rows, 'doc')
    doc = _.find(docs, truthTest)
    return callback(doc)
  })
}


module.exports = _pouch
