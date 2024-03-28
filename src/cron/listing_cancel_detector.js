const { NFT_LOG_TYPE, jsonRpcProvider, CONTRACT_ADDRESSES, EX_TYPE, jsonRpcProvider_cron }  = require("../utils/constants") 
const { ethers }  = require("ethers") 

const dayjs = require("dayjs");
const IERC721 = require("../api/sdk/controllers/IERC721");
const listing_cancel_detector_expiration =  async ({ strapi }) => {
    console.log("[CRON TASK] LISTING CANCEL DETECTOR - Expirtation");
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
    } 
    catch (error) {
      console.error(`listing_cancel_detector_expiration error- ${error.message}`);
    }
  }

  const listing_cancel_detector_approve =  async ({ strapi }) => {
    console.log("[CRON TASK] LISTING CANCEL DETECTOR - isApprovedForAll");
    try {


      const orders = await strapi.db.query("api::order.order").findMany({
        populate: {
          collection: true,
          nft: true
        }
      })
      const unit = 20
      for (let i = 0; i < orders.length; i++) {
        const batchOrders = orders.slice(i * unit , (i + 1)*unit)
        await checkIsApprovedForAllAndDelete({strapi, orders: batchOrders})
        if ((i + 1)*unit >= orders.length) break
      }
      

     
      
    } 
    catch (error) {
      console.error(`listing_cancel_detector_approve error- ${error.message}`);
    }
  }

  const checkIsApprovedForAllAndDelete = async ({strapi, orders}) => {
    const deletePromises = orders.map(order => {
      const collectionContract = new ethers.Contract(order.collection.contract_address, IERC721.abi, jsonRpcProvider_cron)
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

  





  module.exports = {
    listing_cancel_detector_expiration,
    listing_cancel_detector_approve
  }