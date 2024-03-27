

const { getNFTsAndUpdateOwnerOfNFTs, updateOwnerOfNFTs } = require("../utils/updateOwner");

const update_nft_owner =  async ({ strapi }) => {
    console.log("[CRON TASK] UPDATE NFT OWNER");
    try {
      const nfts = await getNFTsAndUpdateOwnerOfNFTs({strapi})
      if (nfts.length <= 0) return
      await  updateOwnerOfNFTs({strapi, nfts})
    } catch (error) {
      console.error(error.message);
    }
  }
  





  module.exports = {
    update_nft_owner
  }