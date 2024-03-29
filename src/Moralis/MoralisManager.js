require("./MoralisClient");
const Moralis = require("moralis").default;
const { EvmChain } = require("@moralisweb3/common-evm-utils");

let instance = null;
module.exports = class MoralisManager {
  constructor(strapi) {
    this.strapi = strapi;
    /** Constants */

    /** Moralis Client */
  }

  static getInstance(strapi) {
    if (!instance) {
      instance = new MoralisManager(strapi);
    }
    return instance;
  }

  /** Controllers */
  checkWalletActivity = async (address) => {
    try {
      const chains = [EvmChain.ETHEREUM];
  
      const response = await Moralis.EvmApi.wallets.getWalletActiveChains({
        address,
        chains
      });
  
      const result = response.toJSON();
  
      if (!Array.isArray(result.active_chains)) return null;
      if (result.active_chains.length <= 0) return null;
      return result.active_chains[0].first_transaction ? true : false;
    } catch (error) {
      console.log(error.message);
      return null;
    }
  };
  
};
