const { BLACKLIST_TYPE } = require("../utils/constants");


let instance = null;
module.exports = class BlacklistCacheManager {
  CACHE_BLACKLISTS = [];
  CACHE_CONTRACT_ADDRESSES = []
  constructor(strapi) {
    this.strapi = strapi;
    this.fetchAndUpdateBlacklists({ strapi })
  }

  static getInstance(strapi) {
    if (!instance) {
      instance = new BlacklistCacheManager(strapi);
    }
    return instance;
  }

  async fetchAndUpdateBlacklists({ strapi }) {
    try {
      const blacklists = await strapi.db.query("api::blacklist.blacklist").findMany({
        where: {
          type: BLACKLIST_TYPE.COLLECTION
        },
        populate: {
          collection: {
            select: ["id", "name", "slug", "contract_address"]
          }
        }
      });
      if (!Array.isArray(blacklists)) return 
      this.setBlacklists(blacklists);
    } catch (error) {
      throw error;
    }
  }

  /** Handlers */
  getBlacklists = () => {
    return this.CACHE_BLACKLISTS;
  };

  setBlacklists = (blacklists) => {
    this.CACHE_BLACKLISTS = blacklists;
    try {
      const collectionAddresses = blacklists.map((_) =>
        _.collection.contract_address.toLowerCase()
      );
      this.CACHE_CONTRACT_ADDRESSES = collectionAddresses
    } catch (error) {
      this.strapi.log.error(`setBlacklists - ${error.message}`)
    }
  };

  /** Helpers */
  getBlacklistAddresses = () => {
    return this.CACHE_CONTRACT_ADDRESSES;
  };

  getBlacklistByAddress = (_contract_address) => {
    try {
      const contract_address = _contract_address.toLowerCase();
      return this.CACHE_BLACKLISTS.find(
        (b) =>
          b.collection.contract_address.toLowerCase() === contract_address
      );
    } catch (error) {
      return null;
    }
  };

};
