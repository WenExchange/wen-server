const { NFT_LOG_TYPE, jsonRpcProvider, WEN_EX_CONTRACT_ADDRESS, CONTRACT_ADDRESSES, EX_TYPE }  = require("../utils/constants") 
const { ethers }  = require("ethers") 

const dayjs = require("dayjs");
const IERC721 = require("../api/sdk/controllers/IERC721");
const listing_cancel_detector =  async ({ strapi }) => {
    console.log("[CRON TASK] LISTING CANCEL DETECTOR");
    try {
      const current = dayjs().unix()
      const willDeleteOrders = await strapi.db.query("api::order.order").findMany({
        where: {
          expiration_time: {
            $lt : current
          }
        },
        populate: {
          nft: true
        }
      })
      const willDeletePromise = willDeleteOrders.map(order => {
        return strapi.entityService.delete("api::order.order", order.id).then(deletedOrder => {
          return strapi.entityService.create("api::nft-trade-log.nft-trade-log",{
            data: {
              ex_type: EX_TYPE.WEN,
              tyle: NFT_LOG_TYPE.LOG_TYPE_AUTO_CANCEL_LISTING,
              from: deletedOrder.maker,
              nft: deletedOrder.nft.id,
              timestamp: dayjs().unix()


            }
          } )
        })
      })

      await Promise.all(willDeletePromise)


      const orders = await strapi.db.query("api::order.order").findMany({
        populate: {
          collection:true,
          nft: true
        }
      })

      const deletePromises = orders.map(order => {
        const collectionContract = new ethers.Contract(order.collection.contract_address, IERC721.abi, jsonRpcProvider)
        return collectionContract.isApprovedForAll(order.maker, CONTRACT_ADDRESSES.WEN_EX).then(isApprovedForAll => {
          if (isApprovedForAll)  return null
          return strapi.entityService.delete("api::order.order", order.id, {
            populate: {
              nft: true
            }
          }).then(deletedOrder => {
            return strapi.entityService.create("api::nft-trade-log.nft-trade-log",{
              data: {
                ex_type: EX_TYPE.WEN,
                tyle: NFT_LOG_TYPE.LOG_TYPE_AUTO_CANCEL_LISTING,
                from: deletedOrder.maker,
                nft: deletedOrder.nft.id,
                timestamp: dayjs().unix()


              }
            } )
          })
        })
       
      })
      await Promise.all(deletePromises)
      
    } 
    catch (error) {
      console.error(error.message);
    }
  }
  





  module.exports = {
    listing_cancel_detector
  }