
const bridgingData = {
    "data": [
      {
        "hash": "0x868dff161e77b0082b0cfe1081f6645d24b49333e796022dadbd181dc09eebcb",
        "from": "0x0000000002c0fd34c64a4813d6568abf13b0adda",
        "block_number": "19352962",
        "bridged": { "ETH": "204152171832481922", "DAI": "258289869565934403" }
      },
      {
        "hash": "0x7179aafd141052a4eeace983a669b93b75e64176c33da352fbc74fada03d5aa6",
        "from": "0x230b72dfc46d3f38b285f5b602cf963272e976fa",
        "block_number": "19352962",
        "bridged": { "ETH": "258289869565934403" }
      }
    ]
  }


  const checkUserAndAddBridgingData = async ({strapi}) => {
      try {
        const bridgingList = bridgingData.data
        const updatePromises = bridgingList.map(data => {
            const {from,bridged } = data
  
            return strapi.db.query(
              "api::early-user.early-user").findOne({
                  where: {
                      wallet: from
                  }
              }).then(entry => {
                  if (!entry) return null
                  
                  return strapi.entityService.update(
                    "api::early-user.early-user", entry.id,
                    {
                    data: {
                        bridging_eth: bridged?.ETH || null,
                        bridging_usd: bridged?.DAI || null
                    }
                    }
                
                  )
              })
        })
  
        await Promise.all(updatePromises)
      } catch (error) {
          console.log(error.message);
      }
     
      
  }


  module.exports = {
   checkUserAndAddBridgingData
  }
