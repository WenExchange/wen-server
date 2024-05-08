const {
  NFT_LOG_TYPE,
  jsonRpcProvider,
  CONTRACT_ADDRESSES,
  EX_TYPE,
  jsonRpcProvider_cron,
} = require("../utils/constants");
const {
  updateBestOffer,
} = require("../listener/collectionStats");
const { ethers } = require("ethers");

const dayjs = require("dayjs");
const DiscordManager = require("../discord/DiscordManager");

const offer_cancel_detector = async ({ strapi }) => {
  strapi.log.info("[CRON TASK] - START | OFFER CANCEL DETECTOR - Expirtation");
  try {
    const current = dayjs().unix();

    let batchBuyOrders = await strapi.db
    .query("api::batch-buy-order.batch-buy-order")
    .findMany({
      where: {
        $and: [
          { is_cancelled: false },
          { is_all_sold: false },
          {
            expiration_time: {
              $lt: current,
            },
          }
        ],
      },
      populate: {
        collection: {
          select: ["contract_address"]
        },
      },
    });

    strapi.log.info(`offer_cancel_detector - batchBuyOrders length - ${batchBuyOrders.length}`)

  if (batchBuyOrders && batchBuyOrders.length > 0) {
    const contractAddresses = new Set();

    for (let i = 0; i < batchBuyOrders.length; i++) {
      const batchBuyOrder = batchBuyOrders[i];
      const deletedBatchBuyOrder = await strapi.entityService.delete(
        "api::batch-buy-order.batch-buy-order",
        batchBuyOrder.id,
      );
      if (deletedBatchBuyOrder) {
        contractAddresses.add(batchBuyOrder.collection.contract_address);
        await strapi.entityService
        .create("api::nft-trade-log.nft-trade-log", {
          data: {
            type: NFT_LOG_TYPE.LOG_TYPE_AUTO_CANCEL_OFFER,
            from: deletedBatchBuyOrder.maker,
            timestamp: dayjs().unix(),
          },
        })

      }
    }

    for (const address of contractAddresses) {
      await updateBestOffer({
        strapi,
        contractAddress: address,
      });
    }
  }

    strapi.log.info("[CRON TASK] - COMPLETE | OFFER CANCEL DETECTOR - Expirtation");
  } catch (error) {
    const dm = DiscordManager.getInstance()
    dm.logError({ error, identifier: "Cron - offer_cancel_detector" })
    strapi.log.error(`offer_cancel_detector error- ${error.message}`);
  }
};

module.exports = {
  offer_cancel_detector
};
