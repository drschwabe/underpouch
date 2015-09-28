##  _pouch
An underscore wrapper for querying documents in a PouchDB.  


```
npm install underpouch
```


###usage

```
var _pouch = require('underpouch')
var PouchDB = require('pouchdb')

var db = new PouchDB('db')

```

Now you can query PouchDB with familiar _.underscore functions: 

```
//Get all docs: 
_pouch.pluck(db, function(allDocs) {
    //The response contains just the docs...   
    allDocs.forEach(function(doc) {
        //Do stuff with a doc.
    })
})

//Where: 
_pouch.where(db, { author: "Shakespeare", year: 1611 }, function(doc) {
    //doc = {title: "Cymbeline", author: "Shakespeare", year: 1611}
})

```


This is a WIP, only a few _.underscore functions are currently implemented.    
