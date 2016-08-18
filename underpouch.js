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
    }, function(err, res) {
      if(err) {
        console.log('there was an error')
        console.log(err)                 
        return
        //TODO: create an index if not already existing. 
      }
      return callback(res.docs)
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
    //(now we can leverage indexes for faster subsequent calls with this same keyValueParing)

    //Try to do the find...
    db.find({
      selector: properties, 
      limit: 1
    }, function(err, res) {
      if(err) {
        console.log('there was an error')
        console.log(err)                 
        return
        //TODO: create an index if not already existing. 
      }
      //and return just the matching doc: 
      return callback(res.docs[0])
    })

  } else { //Otherwise just do an in-memory one time query (slow with large datasets): 
    db.allDocs({include_docs: true}, function(err, res) {
      if(err) return console.log(err)
      docs = _.pluck(res.rows, 'doc')
      doc = _.findWhere(docs, properties)
      return callback(doc)
    })    
  }
}



/* Objects------------------------------------------- */

_pouch.extend = function(db, destinationDocId, sourceDoc, callback) {
  db.get(destinationDocId, function(err, destinationDoc) {
    if(err) return console.log(err)
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

_pouch.merge = function(db, destinationDocId, sourceDoc, callback) {
  db.get(destinationDocId, function(err, destinationDoc) {

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


module.exports = _pouch
