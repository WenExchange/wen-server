'use strict';
const ethers = require('ethers');
const dayjs = require("dayjs")
/**
 * exchange-user controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::exchange-user.exchange-user',({ strapi }) => ({
  
    async verifyAndCreateUser(ctx) {
        {
            try {
                const {
                    signature,
                    address,
                    message
                  } = ctx.request.body.data;
                  const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    
      
                  if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
                      return ctx.body = {
                          success: false,
                          message: "Signature verification failed."
                      }
                  }

                  let user = await strapi.db.query('api::exchange-user.exchange-user').findOne({
                
                    where: { address, signature  },
           
                  });

                  const currentTimestamp = Date.now();

const isoString = dayjs(currentTimestamp).toISOString();
                  if (user) {
                      /** Update stats */
                   strapi.entityService.update('api::exchange-user.exchange-user',user.id , {
                        data: {
                       
                         at_last_login: isoString
                        },
                      });  

                 

                  } else {
                    user = await strapi.entityService.create('api::exchange-user.exchange-user', {
                        data: {
                         address: address.toLowerCase(),
                         signature,
                         at_last_login: isoString
                        },
                      });  
                  }



 return ctx.body = {
                          success: true,
                          user
                      }                  

                  


                 



            } catch (error) {
                console.error(error.message)
            }
        }
           

        
    }
  }) );
