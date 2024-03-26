
const axios = require("axios")

const update_ether_price =  async ({ strapi }) => {
    console.log("[CRON TASK] UPDATE ETHER PRICE");
    try {
      const priceInfo = await axios
        .get(`https://api.api-ninjas.com/v1/cryptoprice?symbol=ETHUSDT`, {
          headers: { "X-Api-Key": "RvlBPLkBQkQ323ebmaAnPA==0RUW8U3YEnJdRez7" }
        })
        .then((res) => res.data);

      await strapi.entityService.update("api::coin-price.coin-price", 1, {
        data: {
          ...priceInfo
        }
      })
    } catch (error) {
      console.error(error.message);
    }
  }
  





  module.exports = {
    update_ether_price
  }