var _ = require('underscore'), 
    _merge = require('lodash/merge')

_pouch = {}


/* Collections------------------------------------------- */

_pouch.find = function(db, truthTest, callback) {
  db.allDocs({include_docs: true}, function(err, res) {
    if(err) return callback(err)
    docs = _.pluck(res.rows, 'doc')
    doc = _.find(docs, truthTest)
    return callback(null, doc)
  })
}

_pouch.filter = function(db, truthTest, callback) {
  db.allDocs({include_docs: true}, function(err, res) {
    if(err) return callback(err)
    docs = _.pluck(res.rows, 'doc')
    doc = _.filter(docs, truthTest)
    return callback(null, doc)
  })
}

_pouch.where = function(db, properties, callback) {
  //Check for the pouchdb-find plugin... 
  if(_.isFunction(db.createIndex)) { 
    db.find({
      selector: properties
    }, function(err, res) {
      if(err) return callback(err)                
      return callback(null, res.docs)
    })
  } else {  //Otherwise just do an in-memory one time query: 
    db.allDocs({include_docs: true}, function(err, res) {
      if(err) return callback(err) 
      docs = _.chain(res.rows)
              .pluck('doc')
              .where(properties)
              .value()
      return callback(null, docs)
    })
  }  
}

_pouch.findWhere = function(db, properties, callback) {
  if(_.isFunction(db.createIndex)) { 
    db.find({
      selector: properties, 
      limit: 1
    }, function(err, res) {
      if(err) return callback(err) 
      return callback(null, res.docs[0])
    })
  } else { 
    db.allDocs({include_docs: true}, function(err, res) {
      if(err) return callback(err) 
      docs = _.pluck(res.rows, 'doc')
      doc = _.findWhere(docs, properties)
      return callback(null, doc)
    })    
  }
}

_pouch.max = function(db, param1, param2) {
  var iteratee, callback
  if(!param2) {
    callback = param1
  } else if(param1 && param2) {
    iteratee = param1
    callback = param2
  }
  db.allDocs({include_docs: true}, function(err, res) {
    if(err) return callback(err)
    if(!iteratee) {
      var maxVal = _.chain(res.rows)
                    .pluck('doc')
                    .map(function(doc) {
                      return parseInt(doc._id)
                    })
                    .max()
                    .value()

      var docs = _.pluck(res.rows, 'doc')
      var doc = _.findWhere(docs, { _id : maxVal.toString() })
      return callback(null, doc)
    } else {
      var docs = _.pluck(res.rows, 'doc')
      var maxValDoc = _.max(docs, iteratee)
      return callback(null, maxValDoc)
    }
  })   
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
    if(err) {
      if(callback) return callback(err)
      else return console.error(err)
    }
    //Now update the doc once more with the latest rev...
    destinationDoc._rev = res.rev
    //and return it so the end user has the latest doc/rev:
    if(callback) {
      return callback(null, destinationDoc)      
    }
  })  
}

_pouch.extend = function(db, destinationDocId, sourceDoc, callback) {
  db.get(destinationDocId, function(err, destinationDoc) {
    if(err) {
      if(callback) return callback(err)
      else return console.error(err)
    }
    extendDoc(db, destinationDoc, sourceDoc, callback)
  })
}

_pouch.extendPut = function(db, param2, param3, param4) {
  var destinationDocId, 
      sourceDoc, 
      callback 

  if(_.isString(param2)) {
    destinationDocId = param2
    sourceDoc = param3
    callback = param4
  } else {
    destinationDocId = param2._id
    sourceDoc = param2
    callback = param3
  }
  
  db.get(destinationDocId, function(err, destinationDoc) {
    //If the doc is missing, simply do a routine put(): 
    if(err && err.reason == 'missing' || err && err.reason == 'deleted') {
      //if sourceDoc does not have an id, use the first param... 
      if(!sourceDoc._id) sourceDoc._id = destinationDocId
      db.put(sourceDoc, function(err, res) {
        if(err) return callback(err) 
        sourceDoc._rev = res.rev
        return callback(null, sourceDoc)
      })
    } else { //Otherwise, extend it:
      extendDoc(db, destinationDoc, sourceDoc, callback)      
    } 
  })
}

_pouch.extendPutOrPost = (db, doc, callback) => {
  if(doc._id) {
    db.get(doc._id, function(err, destinationDoc) {
      //If the doc is missing, do a routine post(): 
      if(err && err.reason == 'missing' || err && err.reason == 'deleted') {
        db.post(doc, function(err, res) {
          if(err) return callback(err)  
          doc._rev = res.rev
          if(callback) return callback(null, doc)
        })
      } else { //Otherwise, extend it: 
        extendDoc(db, destinationDoc, doc, callback)      
      } 
    })    
  } else {
    db.post(doc, (err, res) => {
      if(err) return console.log(err)
      doc._id = res.id 
      doc._rev = res.rev 
      if(callback) return callback(null, doc)
    }) 
  }
}

_pouch.merge = function(db, param1, param2, param3) {
  var destinationDocId, sourceDoc, callback
  if(_.isObject(param1)) {
    destinationDocId = param1._id
    sourceDoc = param1
    callback = param2
  } else if(_.isString(param1)) {
    destinationDocId = param1
    sourceDoc = param2
    callback = param3
  } else {
    return console.log('invalid params')
  }
  db.get(destinationDocId, function(err, destinationDoc) {
    if(err) return callback(err) 
    var destinationDocRev = destinationDoc._rev
    //Merge with the sourceDoc...
    destinationDoc = _merge(destinationDoc, sourceDoc)
    //but preserve this latest rev...
    destinationDoc._rev = destinationDocRev
    //so we can now save it back into the db: 
    db.put(destinationDoc, function(err, res) {
      if(err) return callback(err)
      //Now update the doc once more with the latest rev...
      destinationDoc._rev = res.rev

      //and return it so the end user has the latest doc/rev:
      return callback(null, destinationDoc)
    })
  })  
}


_pouch.mergePutOrPost = (db, doc, callback) => {
  if(doc._id) {
    db.get(doc._id, function(err, destinationDoc) {
      //If the doc is missing, do a routine post(): 
      if(err && err.reason == 'missing' || err && err.reason == 'deleted') {
        db.post(doc, function(err, res) {
          if(err) return callback(err)  
          doc._rev = res.rev
          if(callback) return callback(null, doc)
        })
      } else { //Otherwise, extend it: 
        const destinationDocRev = destinationDoc._rev
        //Extend with the sourceDoc...
        destinationDoc = _merge(doc, destinationDoc)
        //but preserve this latest rev...
        destinationDoc._rev = destinationDocRev
        //so we can now save it back into the db: 
        db.put(destinationDoc, function(err, res) {
          if(err) return callback(err) 
          //Now update the doc once more with the latest rev...
          destinationDoc._rev = res.rev
          //and return it so the end user has the latest doc/rev:
          return callback(null, destinationDoc)
        })  
      } 
    })    
  } else {
    db.post(doc, (err, res) => {
      if(err) return console.log(err)
      doc._id = res.id 
      doc._rev = res.rev 
      if(callback) return callback(null, doc)
    })
  }
}




//#######

/* Extras------------------------------------------- */

_pouch.all = function(db, callback) {
  db.allDocs({include_docs: true}, function(err, res) {
    if(err) return callback(err) 
    docs = _.pluck(res.rows, 'doc')
    return callback(null, docs)
  })
}

_pouch.replace = function(db, doc, callback) {
  if(doc._rev) delete doc._rev //< Discard any existing _rev. 
  db.get(doc._id, function(err, existingDoc) {
    if(err && err.reason == 'missing' || err && err.reason == 'deleted') {
      //doc does not exist, so just post it: 
      db.post(doc, (err, res) => {
        if(err) return callback(err)
        return callback(null, _.extend(doc, { _rev : res.rev }))
      })
    } else if(err) {
      return callback(err) 
    } else {
      //Otherwise, update the rev and then put: 
      doc._rev = existingDoc._rev
      db.put(doc,  (err, res) => {
        if(err) return callback(err)
        return callback(null, _.extend(doc, { _rev : res.rev }))
      })      
    }
  })
}

_pouch.deleteNow = function(db, docOrId, callback) {
  var docId
  _.isObject(docOrId) ? docId = docOrId._id : docId = docOrId
  db.get(docId, function(err, doc) {
    if(err) return callback(err) 
    doc._deleted = true 
    db.put(doc,  (err, res) => {
      if(err) return callback(err)
      return callback()
    })      
  })  
}

_pouch.deleteDocs = function(db, callback) {
  this.all(db,(err, allDocs) => {
    if(err) return callback(err)
    db.bulkDocs(
      _.map(allDocs, (doc) => _.extend(doc, { _deleted : true })
    ), (err, res) => {
      if(err) return callback(err)
      if(callback) return callback(null, res)
    })
  })
}

module.exports = _pouch
