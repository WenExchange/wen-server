'use strict';
const dayjs = require("dayjs");
const {ethers} = require("ethers");
const IERC721 = require("../../sdk/controllers/IERC721");
const {jsonRpcProvider, CONTRACT_ADDRESSES, EX_TYPE, NFT_LOG_TYPE} = require("../../../utils/constants")


/**
 * nft controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { updateListingPoint } = require("../../../utils/airdropPrePointHelper");
const { updateFloorPrice, updateOrdersCount, updateOwnerCount } = require("../../../listener/collectionStats");

module.exports = createCoreController('api::nft.nft', ({ strapi }) => ({
  
    async getNFTs(ctx) {
        {
            try {
              const {limit} = ctx.request.query
              if (limit > 1000) {
                ctx.badRequest()
              }
              
                const [entries, count] = await strapi.db.query('api::nft.nft').findWithCount({
                    ...ctx.request.query
                  });

                  return ctx.body = {
                    entries,
                    count
                  }

            } catch (error) {
                console.error(error.message)
            }
        }
           

        
    }, 
    
    async getNFT(ctx) {
        {
            try {
                const entry = await strapi.db.query('api::nft.nft').findOne({
                    ...ctx.request.query
                  });

                  return ctx.body = entry

            } catch (error) {
                console.error(error.message)
            }
        }
           

        
    },



    async getNFTCount(ctx) {
        {
            try {
                const count = await strapi.db.query('api::nft.nft').count({
                    ...ctx.request.query
                  });

                  return ctx.body = {
                    count
                  }

            } catch (error) {
                console.error(error.message)
            }
        }
           

        
    },

    async checkValidTradableNFT (ctx) {
        const {token_id,contract_address, nft_id, owner, order_id} = ctx.request.query
        

        const collectionContract = new ethers.Contract(contract_address, IERC721.abi, jsonRpcProvider);
        try {
            const realOwner = await collectionContract.ownerOf(token_id);
            if (realOwner.toLowerCase() !== owner.toLowerCase()) {
                await updateOwner({strapi, nft_id, realOwner, contract_address, order_id})
                return ctx.body = {
                    success: false,
                    message: "This NFT has already been sold."
                }
            }

            const isApprovedForAll = await collectionContract.isApprovedForAll(owner, CONTRACT_ADDRESSES.WEN_EX)
            if (!isApprovedForAll) {
                await deleteOrderByApprove({strapi, order_id})
                return ctx.body = {
                    success: false,
                    message: "This NFT has already been sold."
                }

            }

            return ctx.body = {
                success: true,
            }
            

        

            
        } catch (error) {
        }
        

        
    }


  }));


  const updateOwner =  async({strapi, nft_id, realOwner, contract_address, order_id}) => {
    await strapi.entityService
    .update("api::nft.nft", nft_id, {
      data: {
        owner: realOwner,
      },
    })
  await updateOwnerCount({ strapi }, contract_address);

    await strapi.entityService
      .delete("api::order.order", order_id, {
        populate: { nft: true },
      })
      .then((deletedOrder) => {
        return strapi.entityService
          .create("api::nft-trade-log.nft-trade-log", {
            data: {
              ex_type: EX_TYPE.WEN,
              type: NFT_LOG_TYPE.LOG_TYPE_AUTO_CANCEL_LISTING,
              from: realOwner,
              nft: nft_id,
              timestamp: dayjs().unix(),
            },
          })
          .then((_) => {
            // CANCEL LISTING HISTORY LOG IF ANY
            return updateListingPoint(
              true,
              deletedOrder.maker,
              deletedOrder.contract_address,
              deletedOrder.nft.token_id,
              0,
              0,
              { strapi }
            ).then((_) => {
              return updateFloorPrice({ strapi }, deletedOrder.contract_address)
                .then((_) => {
                  return updateOrdersCount(
                    { strapi },
                    deletedOrder.contract_address
                  );
                })
            });
          });
      })
  
  }

  const deleteOrderByApprove = async ({strapi, order_id}) => {
    console.log(
    `listing_cancel_detector_approve - will delete order id: ${order_id} `
    );
    return strapi.entityService
    .delete("api::order.order", order_id, {
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
            deletedOrder.contract_address,
            deletedOrder.nft.token_id,
            0,
            0,
            { strapi }
            ).then((_) => {
            return updateFloorPrice(
                { strapi },
                deletedOrder.contract_address
            )
                .then((_) => {
                return updateOrdersCount(
                    { strapi },
                    deletedOrder.contract_address
                );
                })
                .catch((e) => console.error(e.message));
            });
        });
    });
  }