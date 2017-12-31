![underpouch logo](./logo.svg)

An underscore API for PouchDB with added bonuses!


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
_pouch.findWhere(db, { author: "Shakespeare", year: 1611 }, (err, doc) => {
    //doc = { _id: 'example', _rev: 'xxx...', title: "Cymbeline", author: "Shakespeare", year: 1611 }
})
```


(note that the following examples return docs with _id and _rev but are trimmed, unless otherwise indicated, for brevity)
   
## Collections (for sifting, sorting docs)
--------------------------------------------

**find**  
`_pouch.find(db, truthTest, callback)`  
Looks through each doc in the db, returning the first one that passes a truth test. 

```javascript
  _pouch.find(db, (doc) => doc.magicNumber % 2 == 0, (err, doc) => {
    //doc = { name: 'magicDoc', magicNumber: 2 }
  })
```

**filter**  
`_pouch.filter(db, truthTest, callback)`  
Looks through each doc in the db, returning an array of docs that pass a truth test. 

```javascript
  _pouch.filter(db, (doc) => doc.number % 2 == 0, (err, docs) => {
    //docs = [{ number: 2 }, { number: 4 }, { number: 6 }}
  })
```
  
**where**  
`_pouch.where(db, properties, callback)`  
 Looks through each doc in the db, returning an array of all the docs that contain all of the key-value pairs listed in properties. 

```javascript
  _pouch.where(playsDb, { author: "Shakespeare", year: 1611 }, (err, docs) => {
    /*docs = [{ title: "Cymbeline", author: "Shakespeare", year: 1611 },
    { title: "The Tempest", author: "Shakespeare", year: 1611 }] */
  })
```
  
**findWhere**  
`_pouch.findWhere(db, properties, callback)`  
 Looks through the list and returns the first value that matches all of the key-value pairs listed in properties. 

```javascript
  _pouch.findWhere(db, {newsroom: "The New York Times"}, (err, doc) => {
    //doc = { year: 1918, newsroom: "The New York Times", reason: "For its public service in publishing in full so many official reports, documents and speeches by European statesmen relating to the progress and conduct of the war."}  
  })
```

**max**  
Returns the doc with the maximum value.  If no iteratee function is provided, defaults to _.id (parseInt will be used).
```javascript
  _pouch.max(db, (stoogeDoc) => stoogeDoc.age, (err, doc) => {
    //doc = { name: 'curly', age: 60 }
  })
```

**all !**   
`_pouch.all(db, callback)`  
Returns an array of all the docs in the db 

```javascript
  _pouch.all(db, (err, allDocs) => {
    //allDocs = [{_id: 'all'},{_id: 'the'}, {_id: 'docs'}]
  })
```

**deleteDocs !**   
`_pouch.deleteDocs(db, callback)`  
Deletes all docs in database, without deleting the database (adds { _deleted : true } to each doc) 

```javascript
  _pouch.deleteDocs(db, (err, res) => {
    //res is a list of the ids/revs of the deleted docs
  })
```

   
## Object Functions (for modifying docs)
------------------------------------------

**extend**  
`_pouch.extend(db, destinationDocId, sourceDoc, callback)`  
Copy all of the properties in the source doc over to the destination doc, put and return the destination doc with its updated rev.   It's in-order, so the last source will override properties of the same name in previous arguments. 

```javascript
  _pouch.extend(db, 'user', { email: jeff@gmail.com }, (err, updatedDoc) => {
    //updatedDoc = { email: "jeff@gmail.com", name: "Jeff", age: 35 }
  })
```


**extendPut !**   
`_pouch.extendPut(db, destinationDocId, sourceDoc, callback)`     
Like _pouch.extend but `put()`'s the sourceDoc even if destination doc is not existing.

```javascript
  _pouch.extendPut(db, { 'some-id-that-doesnt-exist', {name: "Sara"}, (err, extendedDoc) => {
    //extendedDoc = { _id: "some-id-that-doesnt-exist", name: "Sara" }
  })
```

**extendPutOrPost !**   
`_pouch.extendPutOrPost(db, destinationDoc, sourceDoc, callback)`   
Like _pouch.extendPut but will post() the doc if no id is provided. 

```javascript
  _pouch.extendPut(db, {name: "Sara"}, (err, extendedDoc) => {
    //extendedDoc = { _id: "262db426-2b2a...", name: "Sara" }
  })
```


**merge ! (lodash)**   
`_pouch.merge(db, destinationDocId, sourceDoc, callback)`   
Like _pouch.extend but uses [lodash's merge](https://lodash.com/docs#merge) so that child properties are merged, not overwritten. Ie: _pouch.extend will overwrite properties whereas _pouch.merge will merge them.

```javascript
  //originalDoc = { _.id: 'food', fruits: ['mango', 'lemon']}
  _pouch.merge(db, 'food', { fruits: ['lime, kiwi'] }, (err, updatedDoc) => {
    //updatedDoc = { _.id: 'food', fruits: ['mango', 'lemon', 'lime', 'kiwi']}
  })
```

**mergePutOrPost !**  
`_pouch.merge(db, destinationDocId, sourceDoc, callback)`   
Like _pouch.mergePutOrPost but will post (if no _id) or put the doc if not already existing.

```javascript
  _pouch.mergePutOrPost(db, { fruits: ['lime, kiwi'] }, (err, updatedDoc) => {
    //updatedDoc = { _.id: "262db426-2b2a...", fruits: ['lime, kiwi']}
  })
```


**replace !**
`_pouch.replace(db, doc, callback)`
Overwrites an existing doc, regardless of revision (shortcut for doing db.get and then db.put) or if doc existing or not (posts if not existing). 

```javascript
  //no doc existing: 
  _p.replace(db, { _id : 'favorite-food', value : 'pizza' }, (err, replacedDoc) => {
    //no rev necessary: 
    _p.replace(db, { _id : 'favorite-food', value : 'ice cream' }, (err, repacedDoc2) => {
      //replacedDoc2 = { _id : 'favorite-food', value : 'ice cream' } }
    })
  })
```
