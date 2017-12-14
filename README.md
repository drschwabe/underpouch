##  _pouch
Underscore API for querying & modifying documents in a PouchDB.  


```
npm install underpouch
```


### usage

```javascript
var PouchDB = require('pouchdb')
var _pouch = require('underpouch')

var db = new PouchDB('db')
```

Now you can query PouchDB with familiar _.underscore functions: 

```javascript
_pouch.findWhere(db, { author: "Shakespeare", year: 1611 }, function(err, doc) {
    //doc = { _id: 'example', _rev: 'xxx...', title: "Cymbeline", author: "Shakespeare", year: 1611 }
})
```
  
  
This is a WIP.  Only a few _.underscore functions are currently implemented.  The currently available library is as follows: 

(note that all examples return docs with _id and _rev but are trimmed here for brevity)
   
   
#### Collection Functions (for sifting, sorting docs)

**find**  
`_pouch.find(db, truthTest, callback)`    
Looks through each doc in the db, returning the first one that passes a truth test. 

```javascript
  _pouch.find(db, function(doc) { return doc.magicNumber % 2 == 0; }, function(err, doc) {
    //doc = { name: 'magicDoc', magicNumber: 2 }
  })
```
  
**where**  
`_pouch.where(db, properties, callback)`  
 Looks through each doc in the db, returning an array of all the docs that contain all of the key-value pairs listed in properties. 


```javascript
  _pouch.where(playsDb, { author: "Shakespeare", year: 1611 }, function(err, docs) {
    /*docs = [{ title: "Cymbeline", author: "Shakespeare", year: 1611 },
    { title: "The Tempest", author: "Shakespeare", year: 1611 }] */
  })
```

  
**findWhere**  
`_pouch.findWhere(db, properties, callback)`  
 Looks through the list and returns the first value that matches all of the key-value pairs listed in properties. 

```javascript
  _pouch.findWhere(db, {newsroom: "The New York Times"}, function(err, doc) {
    //doc = { year: 1918, newsroom: "The New York Times", reason: "For its public service in publishing in full so many official reports, documents and speeches by European statesmen relating to the progress and conduct of the war."}  
  })
```

**max (WIP)**  
Returns the doc with the maximum value.  If no iteratee function is provided, defaults to _.id (parseInt will be used). 

   
#### Object Functions (for modifying docs)

**extend**  
`_pouch.extend(db, destinationDocId, sourceDoc, callback)`  
Copy all of the properties in the source doc over to the destination doc, put and return the destination doc with its updated rev.   It's in-order, so the last source will override properties of the same name in previous arguments. 

```javascript
  _pouch.extend(db, 'user', { email: jeff@gmail.com }, function(err, updatedDoc) {
    //updatedDoc = { email: "jeff@gmail.com", name: "Jeff", age: 35 }
  })
```


#### Extras (not in Underscore's API)

**all**   
`_pouch.all(db, callback)`  
Returns an array of all the docs in the db.  

```javascript
  _pouch.all(db, function(err, allDocs) {
    //allDocs = [{_id: 'all'},{_id: 'the'}, {_id: 'docs'}]
  })
```

**merge**  
`_pouch.merge(db, destinationDocId, sourceDoc, callback)`  
Like _pouch.extend but uses [lodash's merge](https://lodash.com/docs#merge) so that child properties are merged, not overwritten. Ie: _pouch.extend will overwrite properties whereas _pouch.merge will merge them.

```javascript
  //originalDoc = { _.id: 'food', fruits: ['mango', 'lemon']}
  _pouch.merge(db, 'food', { fruits: ['lime, kiwi'] }, function(err, updatedDoc) {
    //updatedDoc = { _.id: 'food', fruits: ['mango', 'lemon', 'lime', 'kiwi']}
  })
```

**extendPut**
`_pouch.extendPut(db, destinationDocId, sourceDoc, callback)`  
Like _pouch.extend but `put()`'s the sourceDoc even if destination doc is not existing.

**extendPutOrPost**
`_pouch.extendPutOrPost(db, destinationDoc, sourceDoc, callback)`  
Like _pouch.extendPut but will post() the doc if no id is provided. 


**replace**
`_pouch.replace(db, doc, callback)`
Overwrites an existing doc, regardless of revision (shortcut for doing db.get and then db.put).
