


module.exports = {
    routes: [
      { // Path defined with an URL parameter
        method: 'GET',
        path: '/collection/single',
        handler: 'collection.getFindOneCollection',
      },

      {
        method: 'POST',
        path: '/collection/ownerupdate',
        handler: 'collection.updateCollectionByOwner',
      }
    ]
  }