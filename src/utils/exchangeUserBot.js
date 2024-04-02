const { getISOString } = require("./helpers");
const dayjs = require("dayjs")

const checkNFTTradeLogAndCreateExchangeUser = async ({strapi}) => {
    try {
        
        const tradeLogs = await strapi.db.query("api::nft-trade-log.nft-trade-log").findMany({
            where: {
                type: "SALE"
            },
         
        })
    console.log(`Trade Logs - ${tradeLogs.length}`);

    for (let i = 0; i < tradeLogs.length; i++) {
      
        const tl = tradeLogs[i];
            await strapi.db.query("api::exchange-user.exchange-user").findOne({
                where: 
                    {
                        address: tl.from
                    }
                
            }).then(exchangeUser => {
                if (exchangeUser) {
                    return null
                } else {
                    console.log(`created exchange user - ${i} - ${tl.from}`);
                    return strapi.db.query("api::exchange-user.exchange-user").create({
                        data: {
                            address: tl.from ,
                            maker_nonce: 0,
                            hash_nonce: 0
                        }
                })
                }
            })

            await strapi.db.query("api::exchange-user.exchange-user").findOne({
                where: 
                    {
                        address: tl.to
                    }
                
            }).then(exchangeUser => {
                if (exchangeUser) {
                    return null
                } else {
                    console.log(`created exchange user - ${i} - ${tl.to}`);
                    return strapi.db.query("api::exchange-user.exchange-user").create({
                        data: {
                            address: tl.to ,
                            maker_nonce: 0,
                            hash_nonce: 0
                        }
                })
                }
            })

            
        
    }
}catch(e){
console.error(e.message)
}
    
    
}




module.exports = {
    checkNFTTradeLogAndCreateExchangeUser
}
