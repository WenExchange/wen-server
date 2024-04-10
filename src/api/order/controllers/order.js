'use strict';

/**
 * order controller
 */
const { ethers } = require("ethers");
const IERC721 = require("../../sdk/controllers/IERC721");
const dayjs = require("dayjs");
const {

    jsonRpcProvider_cron,
    EX_TYPE,
    NFT_LOG_TYPE,
    CONTRACT_ADDRESSES,
  } = require("../../../utils/constants");
const { updateListingPoint } = require("../../../utils/airdropPrePointHelper");
const { updateFloorPrice, updateOrdersCount } = require("../../../listener/collectionStats");
const DiscordManager = require("../../../discord/DiscordManager");
const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::order.order', ({ strapi }) => ({
  
    async checkValidOrderAndUpdate(ctx) {
        {
            try {
              let {order_ids} = ctx.request.query
              
              order_ids = JSON.parse(order_ids)
              if (!Array.isArray(order_ids)) throw new Error("isvalid order_ids") 
              if (order_ids.length <= 0) throw new Error("isvalid order_ids") 

              const orders = await strapi.db.query("api::order.order").findMany({
                where: {
                    $or: order_ids.map(order_id => {
                        return {
                            id: order_id
                        }
                    })
                },
                populate: {
                    collection:true
                }
              })

              if (!Array.isArray(orders) || orders.length <= 0) {
                return ctx.body = {
                    success: false,
                    message: "An NFT that has already been sold is included. Please refresh and try again."
                }
              }
              const collectionContract = new ethers.Contract(
                orders[0].collection.contract_address,
                IERC721.abi,
                jsonRpcProvider_cron
              );

              let willDeleteOrders = []
              for (let i = 0; i < orders.length; i++) {
                const order = orders[i];
                /** Owner Check */
                const realOwner = await collectionContract.ownerOf(order.token_id)
                if (realOwner.toLowerCase() !== order.maker.toLowerCase()) {
                    willDeleteOrders.push(order)
                    continue
                 
                   
                }

                /** Approve Check */
                const isApprovedForAll = await collectionContract.isApprovedForAll(order.maker, CONTRACT_ADDRESSES.WEN_EX)
                if (!isApprovedForAll) {
                    willDeleteOrders.push(order)
                    continue
                }
              }

              if (willDeleteOrders.length > 0) {
                for (let j = 0; j < willDeleteOrders.length; j++) {
                    const willDeleteOrder = willDeleteOrders[j];
                     await deleteOrder({strapi, order: willDeleteOrder})
                }
                
               
                return ctx.body = {
                    success: false,
                    message: "An NFT that has already been sold is included. Please refresh and try again."
                }
              }

              ctx.body = {
                success: true,
            }
            } catch (error) {
                const dm = DiscordManager.getInstance()
                 dm.logError({error, identifier: "checkValidOrderAndUpdate"}).catch()
                console.error(error.message)
            }
        }
           

        
    }, 




  }));

  const deleteOrder = async ({strapi, order}) => {
    await strapi.entityService
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

}
