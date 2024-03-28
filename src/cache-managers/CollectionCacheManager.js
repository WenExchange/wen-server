

let instance = null;
module.exports = class CollectionCacheManager {
  CACHE_COLLECTIONS = [];
  CACHE_COLLECTION_ADDRESSES = [];
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
      this.setCollections(colllections);
    } catch (error) {
      throw error;
    }
  }


  /** Handlers */

  getCollections = () => {
    return this.CACHE_COLLECTIONS;
  };
  setCollections = (collections) => {
    this.CACHE_COLLECTIONS = collections;
  };

  /** Helpers */

  getCollectionAddresses = () => {
    const collectionAddresses = this.CACHE_COLLECTIONS.map((_) =>
      _.contract_address.toLowerCase()
    );
    return collectionAddresses;
  };

  getCollectionByAddress = (_contract_address) => {
    try {
      const contract_address = _contract_address.toLowerCase();
      return this.CACHE_COLLECTIONS.find(
        (collection) =>
          collection.contract_address.toLowerCase() === contract_address
      );
    } catch (error) {
      return null;
    }
  };

  getCollectionBySlug = (slug) => {
    try {
      return this.CACHE_COLLECTIONS.find(
        (collection) => collection.slug === slug
      );
    } catch (error) {
      return null;
    }
  };
};
