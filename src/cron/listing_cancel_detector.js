const {
  NFT_LOG_TYPE,
  jsonRpcProvider,
  CONTRACT_ADDRESSES,
  EX_TYPE,
  jsonRpcProvider_cron,
} = require("../utils/constants");
const {
  updateFloorPrice,
  updateOrdersCount,
  updateOwnerCount,
} = require("../listener/collectionStats");
const { ethers } = require("ethers");

const dayjs = require("dayjs");
const IERC721 = require("../api/sdk/controllers/IERC721");
const { updateListingPoint } = require("../utils/airdropPrePointHelper");
const { getISOString } = require("../utils/helpers");
const DiscordManager = require("../discord/DiscordManager");
const listing_cancel_detector_expiration = async ({ strapi }) => {
  strapi.log.info("[CRON TASK] - START | LISTING CANCEL DETECTOR - Expirtation");
  try {
    const current = dayjs().unix();
    const willDeleteOrders = await strapi.db
      .query("api::order.order")
      .findMany({
        where: {
          expiration_time: {
            $lt: current,
          },
        },
      });
    
      for (let i = 0; i < willDeleteOrders.length; i++) {
        const order = willDeleteOrders[i];
        const deletedOrder = await strapi.db
        .query("api::order.order")
        .delete({
          where: {
            id: order.id,
          },
          populate: {
            nft: {
              select: ["id","token_id"]
            },
            collection: {
              select: ["contract_address"]
            },
          },
        })
        if (deletedOrder) {
          await strapi.entityService
        .create("api::nft-trade-log.nft-trade-log", {
          data: {
            ex_type: EX_TYPE.WEN,
            type: NFT_LOG_TYPE.LOG_TYPE_AUTO_CANCEL_LISTING,
            from: deletedOrder.maker,
            nft: deletedOrder.nft.id,
            timestamp: dayjs().unix(),
          },
        })
        await updateListingPoint(
          true,
          deletedOrder.maker,
          deletedOrder.collection.contract_address,
          deletedOrder.nft.token_id,
          0,
          0,
          { strapi }
        )
        await updateFloorPrice(
          { strapi },
          deletedOrder.collection.contract_address
        )

        await updateOrdersCount(
          { strapi },
          deletedOrder.collection.contract_address
        );
        }
        
      }
    strapi.log.info("[CRON TASK] - COMPLETE | LISTING CANCEL DETECTOR - Expirtation");
  } catch (error) {
    const dm = DiscordManager.getInstance()
    dm.logError({error, identifier: "Cron - listing_cancel_detector_expiration"})
    strapi.log.error(`listing_cancel_detector_expiration error- ${error.message}`);
  }
};

const listing_cancel_detector_approve = async ({ strapi }) => {
  strapi.log.info("[CRON TASK] - START | LISTING CANCEL DETECTOR - isApprovedForAll");
  try {
    const orders = await strapi.db.query("api::order.order").findMany({
      populate: {
        collection: true,
        nft: true,
      },
      where: {
        createdAt: {
          $gte: getISOString(dayjs().unix() - 60 * 16)
        }
      }
    });

    await checkIsApprovedForAllAndDelete({ strapi, orders });
    strapi.log.info("[CRON TASK] - COMPLETE | LISTING CANCEL DETECTOR - isApprovedForAll");
  } catch (error) {
    const dm = DiscordManager.getInstance()
    dm.logError({error, identifier: "Cron - listing_cancel_detector_approve"})
    strapi.log.error(`listing_cancel_detector_approve error- ${error.message}`);
  }
};

const checkIsApprovedForAllAndDelete = async ({ strapi, orders }) => {
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const collectionContract = new ethers.Contract(
      order.collection.contract_address,
      IERC721.abi,
      jsonRpcProvider_cron
    );
    return collectionContract
      .isApprovedForAll(order.maker, CONTRACT_ADDRESSES.WEN_EX)
      .then((isApprovedForAll) => {
        if (isApprovedForAll) return null;
        console.log(
          `listing_cancel_detector_approve - will delete order id: ${order.id} | ${order.nft.name} `
        );
        return strapi.entityService
          .delete("api::order.order", order.id, {
            populate: {
              nft: true,
            },
          })
          .then((deletedOrder) => {
            return strapi.entityService
              .create("api::nft-trade-log.nft-trade-log", {
                data: {
                  ex_type: EX_TYPE.WEN,
                  type: NFT_LOG_TYPE.LOG_TYPE_AUTO_CANCEL_LISTING,
                  from: deletedOrder.maker,
                  nft: deletedOrder.nft.id,
                  timestamp: dayjs().unix(),
                },
              })
              .then((_) => {
                // CANCEL LISTING HISTORY LOG IF ANY
                return updateListingPoint(
                  true,
                  deletedOrder.maker,
                  order.collection.contract_address,
                  deletedOrder.nft.token_id,
                  0,
                  0,
                  { strapi }
                ).then((_) => {
                  return updateFloorPrice(
                    { strapi },
                    order.collection.contract_address
                  )
                    .then((_) => {
                      return updateOrdersCount(
                        { strapi },
                        order.collection.contract_address
                      );
                    })
                    .catch((e) => console.error(e.message));
                });
              });
          });
      });

  }
 
};

module.exports = {
  listing_cancel_detector_expiration,
  listing_cancel_detector_approve,
};
