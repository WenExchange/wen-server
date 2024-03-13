'use strict';
const {NFT_TRADE_LOG_TYPE} = require("../../../utils/constants")

/**
 * nft-trade-log service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::nft-trade-log.nft-trade-log', ({strapi}) => ({

    async createTradeLogAtListing ({nft, from, price, expired_at}) {
        const tradeLog = await strapi.entityService.create('api::nft-trade-log.nft-trade-log', {
            data: {
              nft: nft.id,
              collection: nft.collection.id,
              type: NFT_TRADE_LOG_TYPE.LISTING,
              from, 
              price,
              expired_at
            },
          });

          return tradeLog
    }
}));
