const { NFT_LOG_TYPE, jsonRpcProvider, WEN_EX_CONTRACT_ADDRESS }  = require("../utils/constants") 
const { ethers }  = require("ethers") 

const dayjs = require("dayjs");
const IERC721 = require("../api/sdk/controllers/IERC721");
const listing_cancel_detector =  async ({ strapi }) => {
    console.log("[CRON TASK] LISTING CANCEL DETECTOR");
    try {
      // const deletedCount = await strapi.db.query("api::order.order").deleteMany({
      //   where: {
      //     expiration_time: {
      //       $lt : dayjs().unix()
      //     }
      //   }
      // })

      const orders = await strapi.db.query("api::order.order").findMany({
        populate: {
          collection:true
        }
      })

      const deletePromises = orders.map(order => {
        const collectionContract = new ethers.Contract(order.collection.contract_address, IERC721.abi, jsonRpcProvider)
        return collectionContract.isApprovedForAll(order.maker, WEN_EX_CONTRACT_ADDRESS).then(isApprovedForAll => {
          if (isApprovedForAll)  return null
          return order
          // return strapi.entityService.delete("api::order.order", order.id)
        })
       
      })

      const results = await Promise.all(deletePromises)
      const willDeleteOrders = results.filter(_ => _ !== null)
      console.log(333, "willDeleteOrders",willDeleteOrders, willDeleteOrders.length);

      


      
      
    } 
    catch (error) {
      console.error(error.message);
    }
  }
  





  module.exports = {
    listing_cancel_detector
  }