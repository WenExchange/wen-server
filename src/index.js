'use strict';

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap( { strapi }) {

    try {
      const {findBots, checkIsValidTwitterUser, checkIsValidIDiscordUser} = require("./utils/botCheckers")
      // 32000

      
      // checkIsValidIDiscordUser({strapi, start: 30000, limit: 50000})

      // checkIsValidIDiscordUser({strapi, start: 3000, limit: 1000})
      // checkIsValidIDiscordUser({strapi, start: 52000, limit: 10000})
      // await checkIsValidTwitterUser({strapi,start: 100000, limit: 1})
      // console.log(333, users.length);
        // findBots(strapi)
    // deleteBotUsers(strapi)

    } catch (error) {
      console.log( error.message)
    }
  },
};


