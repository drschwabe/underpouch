var _ = require('underscore'), 
    _merge = require('lodash/merge')

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

_pouch.where = function(db, properties, callback) {
  if(_.isFunction(db.createIndex)) { 
    db.find({
      selector: properties
    }, function(err2, res2) {
      if(err2) return console.log(err2)                 
      return callback(res2.docs)
    })
  } else {
    db.allDocs({include_docs: true}, function(err, res) {
      if(err) return console.log(err)
      docs = _.chain(res.rows)
              .pluck('doc')
              .where(properties)
              .value()
      return callback(docs)
    })
  }  
}

_pouch.findWhere = function(db, properties, callback) {
  //Check for the pouchdb-find plugin... 
  if(_.isFunction(db.createIndex)) { 
    db.find({
      selector: properties, 
      limit: 1
    }, function(err, res) {
      if(err) return console.log(err)
      return callback(res.docs[0])
    })
  } else { //Otherwise just do an in-memory one time query:  
    db.allDocs({include_docs: true}, function(err, res) {
      if(err) return console.log(err)
      docs = _.pluck(res.rows, 'doc')
      doc = _.findWhere(docs, properties)
      return callback(doc)
    })    
  }
}


/* Objects------------------------------------------- */

//### extend ###

//Common function used by .extend and .extendPut: 
var extendDoc = function(db, destinationDoc, sourceDoc, callback) {
  const destinationDocRev = destinationDoc._rev
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
}

_pouch.extend = function(db, destinationDocId, sourceDoc, callback) {
  db.get(destinationDocId, function(err, destinationDoc) {
    if(err) return console.log(err)
    extendDoc(db, destinationDoc, sourceDoc, callback)
  })
}

_pouch.extendPut = function(db, destinationDocId, sourceDoc, callback) {
  db.get(destinationDocId, function(err, destinationDoc) {
    //If the doc is missing, simply do a routine put(): 
    if(err && err.reason == 'missing') {
      db.put(sourceDoc, function(err, res) {
        if(err) return console.log(err) 
        sourceDoc._rev = res.rev
        return callback(sourceDoc)
      })
    } else { //Otherwise, extend it: 
      extendDoc(db, destinationDoc, sourceDoc, callback)      
    } 
  })
}
//#######

_pouch.merge = function(db, destinationDocId, sourceDoc, callback) {
  db.get(destinationDocId, function(err, destinationDoc) {
    if(err) return console.log(err)
    var destinationDocRev = destinationDoc._rev
    //Merge with the sourceDoc...
    destinationDoc = _merge(destinationDoc, sourceDoc)
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

_pouch.replace = function(db, doc, callback) {
  db.get(doc._id, function(err, existingDoc) {
    if(err && err.reason == 'missing') {
      //doc does not exist, so just post it: 
      return db.post(doc, callback)
    } else {
      return console.log(err)
    }
    //Otherwise, update the rev and then put: 
    doc._rev = existingDoc._rev
    db.put(doc, callback)
  })
}


module.exports = _pouch
