var test = require('tape'), 
    _ = require('underscore'), 
    PouchDB = require('pouchdb'), 
    _p = require('./underpouch.js') 

PouchDB.plugin(require('pouchdb-adapter-memory'))    

test('_p.find', (t) => {
  t.plan(1)

  db = new PouchDB('find', {adapter: 'memory'})

  db.bulkDocs([
    { num : 1 },
    { num : 2 }, 
    { num : 3 }, 
    { num : 4 }, 
    { num : 5 }, 
    { num : 6 }       
  ], (err, res) => {
    if(err) return t.fail(err)

    //Predicate based on underscore's official _find example: 
    _p.find(db, (doc) => doc.num % 2 == 0, (err, doc) => {
      t.ok(doc.num == 2 || doc.num == 4 || doc.num == 6)
      //note however docs retrieved from Pouch in this function
      //are not guaranteed in a specific order so 
      //we'll need to accommodate for any of the above matches.
    })
  })
})

test('_p.filter', (t) => {
  t.plan(4)

  db = new PouchDB('filter', {adapter: 'memory'})

  db.bulkDocs([
    { num : 1 },
    { num : 2 }, 
    { num : 3 }, 
    { num : 4 }, 
    { num : 5 }, 
    { num : 6 }        
  ], (err, res) => {
    if(err) return t.fail(err)

    _p.filter(db, (doc) => doc.num % 2 == 0, (err, docs) => {
      t.equals(docs.length, 3) 
      var evens = _.map(docs, (doc) => doc.num) 
      t.ok( _.contains(evens, 2))
      t.ok( _.contains(evens, 4))
      t.ok( _.contains(evens, 6))
    })
  })
})

test('_p.where', (t) => {
  t.plan(2)

  db = new PouchDB('where', {adapter: 'memory'})

  db.bulkDocs([
    {title: "Tamburlaine the Great", author: "Christopher Marlowe", year: 1588},     
    {title: "Comedy of Errors", author: "Shakespeare", year: 1589},
    {title: "Twelfth Night", author: "Shakespeare", year: 1599}, 
    {title: "As You Like It", author: "Shakespeare", year: 1599}, 
    {title: "Julius Caesar", author: "Shakespeare", year: 1599}, 
    {title: "Cymbeline", author: "Shakespeare", year: 1611},   
    {title: "The Alchemist", author: "Ben Jonson", year: 1610}, 
    {title: "The Tempest", author: "Shakespeare", year: 1611}
  ], (err, res) => {
    if(err) return t.fail(err)    
    _p.where(db, {author: "Shakespeare", year: 1599}, (err, docs) => {
      if(err) return t.fail(err) 
      t.equals(docs.length, 3)
      t.ok(_.every(docs, (doc) => doc.author == 'Shakespeare' && doc.year == 1599))
    })
  })
})

test('_p.findWhere', (t) => {
  t.plan(1)

  db = new PouchDB('findWhere', {adapter: 'memory'})

  db.bulkDocs([
    {
      year: 1918, 
      newsroom: "The New York Times",
      reason: "For its public service in publishing in full so many official reports, documents and speeches by European statesmen relating to the progress and conduct of the war."
    }, 
    {
      year: 1998, 
      newsroom: "Los Angeles Times", 
      reason : "For its comprehensive coverage of a botched bank robbery and subsequent police shoot-out in North Hollywood."
    }, 
    {
      year: 1922, 
      newsroom: "New York World", 
      reason : "On the Road to Moscow."
    }, 
    {
      year: 1947, 
      newsroom: "The New York Times",       
      reason : "For distinguished correspondence during 1946, as exemplified by his series of articles on Russia."
    }
  ], (err, res) => {
    if(err) return t.fail(err)    
    _p.findWhere(db, {newsroom: "The New York Times"}, (err, doc) => {
      if(err) return t.fail(err) 
      t.ok(doc.year == 1947 || doc.year == 1918 && doc.newsroom == "The New York Times")
    })
  })
})
