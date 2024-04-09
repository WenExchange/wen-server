
const axios = require("axios");
const DiscordManager = require("../discord/DiscordManager");

const update_ether_price =  async ({ strapi }) => {
    strapi.log.info("[CRON TASK] - START | UPDATE ETHER PRICE");
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

      strapi.log.info("[CRON TASK] - COMPLETE | UPDATE ETHER PRICE");

    } catch (error) {
      const dm = DiscordManager.getInstance()
      dm.logError({error, identifier: "Cron - update_ether_price"})
      strapi.log.error(`update_ether_price error- ${error.message}`);
    }
  }
  





  module.exports = {
    update_ether_price
  }