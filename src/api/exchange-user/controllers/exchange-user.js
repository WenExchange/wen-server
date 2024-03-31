'use strict';
const {ethers} = require('ethers');
const dayjs = require("dayjs")
const {jsonRpcProvider_cron} = require("../../../utils/constants")
const ERC721 = require("../../../web3/abis/ERC721.json")
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
                    populate: {
                        early_user: true
                    }
           
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
           

        
    },

    async earlyAccessBridge(ctx) {
        {
            try {
                let {
                    signature,
                    address,
                    message
                  } = ctx.request.body.data;
                  const recoveredAddress = ethers.utils.verifyMessage(message, signature);

                  console.log(signature,
                    address,
                    message);
    
      
                  if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
                      return ctx.body = {
                          success: false,
                          message: "Signature verification failed."
                      }
                  }


                  let user = await strapi.db.query('api::exchange-user.exchange-user').findOne({
                
                    where: { address  },
                    populate: {
                        "early_user": true
                    }
           
                  });

                  if (!user) {
                    return ctx.body = {
                        success: false,
                        message: "Connect your wallet first."
                    }
                  }

                  const earlyUser = await strapi.db.query('api::early-user.early-user').findOne({
                    where: { wallet: address },
                  });

                  if (!earlyUser) {
                    return ctx.body = {
                        success: false,
                        message: "You are not an early access user."
                    }
                  }

                //   user
                if (!user["early_user"]) {
                    // og pass check
                      let is_og = false
                      try {
                        const ogpassStakingContract = new ethers.Contract("0xcCBA7f02f53b3cE11eBF9Bf15067429fE6479bC2",[{
                            "inputs": [
                              {
                                "internalType": "address",
                                "name": "user",
                                "type": "address"
                              }
                            ],
                            "name": "stakedTokensByUser",
                            "outputs": [
                              {
                                "internalType": "uint256[]",
                                "name": "",
                                "type": "uint256[]"
                              }
                            ],
                            "stateMutability": "view",
                            "type": "function"
                          }], jsonRpcProvider_cron )

                        const staked = await ogpassStakingContract.stakedTokensByUser(user.address)
                        is_og = staked.length > 0
                        
                        if (!is_og) {
                            const ogpassContract = new ethers.Contract("0x64e38aa7515826bcc00cece38f57ca21b1495710",ERC721, jsonRpcProvider_cron )
                            let balance = await ogpassContract.balanceOf(user.address)
                            balance = balance.toNumber()
                            is_og = balance > 0
                            
                        }
                      } catch (error) {
                          console.error(error.message)
                          return ctx.body = {
                            success: false,
                            message: "JSON RPC Error - OG Pass"
                        }
                      }

                      let blur_point = 0
                      try {
                          const ethereumProvider =  new ethers.providers.JsonRpcProvider(
                            "https://rpc.ankr.com/eth/73a9b5e44df22487ad7bab31df917958efd0f16bc7d83fcec50a565e1a0c1aee"
                          )

                          const blurPointContract = new ethers.Contract("0xeC2432a227440139DDF1044c3feA7Ae03203933E", 
                          [ {
                            inputs: [
                              {
                                internalType: "address",
                                name: "",
                                type: "address"
                              }
                            ],
                            name: "balanceOf",
                            outputs: [
                              {
                                internalType: "uint256",
                                name: "",
                                type: "uint256"
                              }
                            ],
                            stateMutability: "view",
                            type: "function"
                          }], ethereumProvider);

                          const blurPoint = await blurPointContract.balanceOf(user.address)
                          blur_point = ethers.utils.formatEther(blurPoint)
                          if (!Number.isNaN(blur_point)) {
                            blur_point = Number(blur_point)
                          } else {
                            blur_point = 0
                          }

                
                      } catch (error) {
                        console.error(error.message)
                        return ctx.body = {
                          success: false,
                          message: "JSON RPC Error - Blur Point"
                      }
                    }

                    // caculate airdrop point
                    let pre_token = 400
                    let boost = 0

                    // twitter share 
                    boost += 50

                    // 초대해서 들어온 사람
                    if(earlyUser.ref_code) {
                        boost += 15
                    }

                    // 초대코드
                    if (earlyUser.total_invite_point && !Number.isNaN(earlyUser.total_invite_point)) {
                       
                        pre_token += Number(earlyUser.total_invite_point)
                    }
                    if (earlyUser.guests) {
                        const guestBoost = earlyUser.guests >= 10 ? 10 * 15 : 15 * earlyUser.guests
                        boost += guestBoost
                    }

                    // bridging
                    if (earlyUser.bridging_point && !Number.isNaN(earlyUser.bridging_point)) {
                        pre_token += Number(earlyUser.bridging_point)
                    }

                    // blur point
                    if (blur_point > 0) {
                        pre_token += blur_point * 7
                    }


                    // community incentive
                    if (earlyUser.community_incentive && !Number.isNaN(earlyUser.community_incentive)){
                        pre_token += Number(earlyUser.community_incentive)

                    }

                    // ogpass
                    if (is_og) {
                        boost += 150
                    }
                    const total_pre_token = pre_token * (1 + boost / 100)

                    await strapi.db.query('api::early-user.early-user').update({
                        where: { 
                            id: earlyUser.id
                         },
    
                         data: {
                            is_og,
                            blur_point,
                            pre_token: total_pre_token
                         }
               
                      }); 

                      let airdrop_point = total_pre_token * 0.02465493614
                      if (earlyUser.is_suspended) airdrop_point = 0

                      

                      if (!earlyUser.is_suspended) {
                        const airdropHistoryLog = await strapi.db.query('api::airdrop-history-log.airdrop-history-log').create({
                            data: {
                               "exchange_user": user.id,
                               type: "EARLY_ACCESS",
                               timestamp: dayjs().unix(),
                               airdrop_point,
                            }
                  
                         }); 
                      }
                      
                      
                    
                      let total_airdrop_point = user.total_airdrop_point && !Number.isNaN(user.total_airdrop_point) ? Number(user.total_airdrop_point) + airdrop_point : airdrop_point
                    user = await strapi.db.query('api::exchange-user.exchange-user').update({
                        where: { 
                            id: user.id
                         },
                         data: {
                            early_user: earlyUser.id,
                            total_airdrop_point
                            
                            
                         },
                         populate: {
                             early_user: true
                         }
               
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
           

        
    },

    async getEarlyAccessRank(ctx) {
        {
            try {
                const { early_user_id } = ctx.request.query;

                  const earlyUser = await strapi.db.query('api::early-user.early-user').findOne({
                    where: { 
                        id: early_user_id
                    } 
                  });

                  if (!earlyUser) {
                    throw new Error("Not found early user")
                  }


                  const count = await strapi.db.query('api::early-user.early-user').count({
                    where: { 
                        pre_token: {
                            $gt: earlyUser.pre_token
                        }
                        
                        
                    } 
                  }); 
                  return ctx.body = {
                    success: true,
                    count
                }  

            } catch (error) {
                console.error(error.message)
            }
        }
           

        
    }

  }) );
