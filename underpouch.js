var _ = require('underscore')

_pouch = {}


/* Collections------------------------------------------- */

_pouch.find = function(db, truthTest, callback) {
  db.allDocs({include_docs: true}, function(err, res) {
    if(err) return console.log(err)
    docs = _.pluck(res.rows, 'doc')
    doc = _.find(docs, truthTest)
    return callback(doc)
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
  //Check for the pouchdb-find plugin... 
  if(_.isFunction(db.createIndex)) { 
    //(now we can leverage indexes for faster subsequent calls with this same keyValueParing)

    var key = _.keys(keyValuePair)[0] //< (create a re-usable reference to the key)

    //create an index (or do nothing if index already exists)...
    db.createIndex({
      index: {
        fields: [key]
      }
    }, function (err, res) {
      if(err) return console.log(err)
      console.log(res)
      //now perform the lookup...
      db.find({
        selector: keyValuePair, 
        limit: 1
      }, function(err2, res2) {
        if(err2) return console.log(err2)
        //and return just the matching doc: 
        return callback(res2.docs[0])
      })
    })    
  } else { //Otherwise just do an in-memory one time query: 
    db.allDocs({include_docs: true}, function(err, res) {
      if(err) return console.log(err)
      docs = _.pluck(res.rows, 'doc')
      doc = _.findWhere(docs, keyValuePair)
      return callback(doc)
    })    
  }
}



/* Objects------------------------------------------- */

_pouch.extend = function(db, destinationDocId, sourceDoc, callback) {
  db.get(destinationDocId, function(err, destinationDoc) {
    var destinationDocRev = destinationDoc._rev
    //Extend with the sourceDoc...
    destinationDoc = _.extend(destinationDoc, sourceDoc)
    //but preserve this latest rev...
    destinationDoc._rev = destinationDocRev
    //so we can now save it back into the db: 
    db.put(destinationDoc, function(err, res) {
      if(err) return console.log(err)
      //Now update the doc once more with the latest rev...
      destinationDoc._rev = res.rev
      //and return it so the end user has the latest doc/rev:
      return callback(destinationDoc)
    })
  })
}



/* Extras------------------------------------------- */

_pouch.all = function(db, callback) {
  db.allDocs({include_docs: true}, function(err, res) {
    if(err) return console.log(err)
    docs = _.pluck(res.rows, 'doc')
    return callback(docs)
  })
}


module.exports = _pouch
