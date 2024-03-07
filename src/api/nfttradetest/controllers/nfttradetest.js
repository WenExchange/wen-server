'use strict';

/**
 * A set of functions called "actions" for `nfttradetest`
 */

module.exports = {
  list: async (ctx, next) => {
    try {

      

      const {
        nfts,


      } = ctx.request.body.data;

      console.log(333, nfts);

      /** Validate Signing */

      // get price, from , price ,,, ,
      // NFT Trade Log  생성
      strapi.service('api::nft-trade-log.nft-trade-log').createTradeLogAtListing({nft, from, price, expired_at});
      
      
      // NFT Price, expired At 업데이트
      // collection stats 업데이트
      

      ctx.body = 'ok';
    } catch (err) {
      ctx.body = err;
    }
  }
};
