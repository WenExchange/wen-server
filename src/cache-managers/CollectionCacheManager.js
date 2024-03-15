
let instance = null;
module.exports = class CollectionCacheManager {
CACHE_COLLECTION_ADDRESSES = []
  constructor(strapi) {
    this.strapi = strapi;
    this.fetchAndUpdateCollections({strapi})
  }

  

  static getInstance(strapi) {
    if (!instance) {
      instance = new CollectionCacheManager(strapi);
    }
    return instance;
  }

  async fetchAndUpdateCollections({strapi}) {
    try {
      // collelction update
      const colllections = await strapi.db.query( "api::collection.collection").findMany();

      const collectionAddresses = colllections.map(_ => _.contract_address)
      this.setCollectionAddresses(collectionAddresses)
      
    } catch (error) {
      throw error;
    }
  }

  /** Handlers */
  getCollectionAddresses = () => {
      return this.CACHE_COLLECTION_ADDRESSES
  }
  setCollectionAddresses = (addresses) => {
    this.CACHE_COLLECTION_ADDRESSES = addresses
  }


  
};




