const { NFT_LOG_TYPE }  = require("../utils/constants") 

const dayjs = require("dayjs");
const seconds_1m = 60
const seconds_1h = 60 * 60
const stats_1h_collection =  async ({ strapi }) => {
    console.log("[CRON TASK] 1H COLLECTION STATS");
    try {
      const colllections = await strapi.db.query("api::collection.collection").findMany();
      const statUpdatePromises = colllections.map(collection => {
        const timestamp = dayjs().unix()
        const collection_id = collection.id
        const floor_price_1h = collection.floor_price
       
      
        return strapi.db.query("api::collection-stat-log.collection-stat-log").findOne({
            where: {
              timestamp: {
                $gte: timestamp - seconds_1m
              },
              collection: {
                id: {
                  $eq: collection_id
                }
              }
            },
            populate: {
              collection: true
            }
          }).then(statLog => {
          if (statLog) return null
          return strapi.db.query( "api::nft-trade-log.nft-trade-log").findMany({
            where: {
              $and: [
                {
                  timestamp: {
                    $gte: timestamp - seconds_1h 
                  },
                },
                {
                  type:{
                    $eq: NFT_LOG_TYPE.LOG_TYPE_SALE
                  }
                },
                {
                  nft: {
                    collection: {
                      id: {
                        $eq: collection_id
                      }
                    }
                  }
                }
              ]
            },
            populate: {
              nft: {
                collection :true
              }
            }
          }).then(nftTradeLogs => {
            const volume_1h = nftTradeLogs.reduce((accumulator, currentValue) => {
              return accumulator + currentValue.price;
            }, 0);
            const sale_1h = nftTradeLogs.length

            return {
              timestamp,
              collection_id,
              floor_price_1h,
              volume_1h,
              sale_1h,
              volume_update_info: {
                  prev_volume_total: collection.volume_total,
                  prev_volume_24h: collection.volume_24h,
                  prev_volume_7d: collection.volume_7d
              }
            }
        
            })
          })
        
        

        
  
      })
      const collectionStatDatas = await Promise.all(statUpdatePromises)
      const filteredCollectionStateDatas = collectionStatDatas.filter(_ => _ !== null)

           /** Create */ 
      for (let i = 0; i < filteredCollectionStateDatas.length; i++) {
        const collectionStatData = filteredCollectionStateDatas[i];
        const {timestamp, collection_id} = collectionStatData
        const existingStatLog = await strapi.db.query("api::collection-stat-log.collection-stat-log").findOne({
          where: {
            timestamp: {
              $gte: timestamp - seconds_1m
            },
            collection: {
              id: {
                $eq: collection_id
              }
            }
          },
          populate: {
            collection: true
          }
        })
        if (existingStatLog)  {
          return
        }
        await strapi.entityService.create("api::collection-stat-log.collection-stat-log", {
          data: {
            ...collectionStatData,
            collection: collectionStatData.collection_id
          }
        })
        
        
      }



      /** Update Volume Stats */
      updateCollectionsStats({strapi,filteredCollectionStateDatas }).catch(error=> console.error)

    }
      
      catch (error) {
      console.error(error.message);
    }
  }

  const updateCollectionsStats = async ({strapi, filteredCollectionStateDatas}) => {

      try {
        const seconds_1h = 60 * 60
        const seconds_24h = seconds_1h * 24
        const seconds_7d = seconds_24h * 7
        
  
        const updateVolumesPromises = filteredCollectionStateDatas.map(collectionStatData => {
            
          const {timestamp,collection_id,volume_update_info, volume_1h  } = collectionStatData
          return   strapi.db.query("api::collection-stat-log.collection-stat-log").findMany({
              where: {
                timestamp: {
                  $gte: timestamp - seconds_7d +  seconds_1m
                },
                collection: {
                  id: {
                    $eq: collection_id
                  }
                }
              },
              populate: {
                collection: true
              },
              offset: 0,
              limit: 24 * 7, // 10 분 간격
              orderBy: {
                  timestamp: "desc"
              }
            }).then(collectionStats => {

              const collectionStats_24h = collectionStats.slice(0, 24)

              /** Volumes */
              const volume_7d = collectionStats.reduce((accumulator, currentValue) => {
                  return accumulator + currentValue.volume_1h;
              }, 0);
  
              const volume_24h = collectionStats_24h.reduce((acc, item) => acc + item.volume_1h, 0);

              /** Sales */
              const sale_7d = collectionStats.reduce((accumulator, currentValue) => {
                return accumulator + currentValue.sale_1h;
              }, 0);

              const sale_24h = collectionStats_24h.reduce((acc, item) => acc + item.sale_1h, 0);

              /** Changes */
              let change_24h = 0
              if (Array.isArray(collectionStats_24h) && collectionStats_24h.length > 0) {
                const currentFloorPrice = collectionStats_24h[0].floor_price_1h
                const pastFloorPrice = collectionStats_24h[collectionStats_24h.length - 1].floor_price_1h
                change_24h = calculatePriceChangeRate(currentFloorPrice, pastFloorPrice) 
              }

              let change_7d = 0
              if (Array.isArray(collectionStats) && collectionStats.length > 0) {
                const _currentFloorPrice = collectionStats[0].floor_price_1h
                const _pastFloorPrice = collectionStats[collectionStats.length - 1].floor_price_1h
                change_7d = calculatePriceChangeRate(_currentFloorPrice, _pastFloorPrice) 
              }

              return {
                  collection_id,
                  volume_7d,
                  volume_24h,
                  volume_total: volume_update_info.prev_volume_total + volume_1h,
                  change_24h,change_7d,sale_24h,sale_7d
              }
  
            })
        })
  
        const collectionUpdateDatas = await Promise.all(updateVolumesPromises)
        for (let i = 0; i < collectionUpdateDatas.length; i++) {
            const collectionUpdateData = collectionUpdateDatas[i];
            
            await strapi.entityService.update("api::collection.collection",collectionUpdateData.collection_id,{
                data: {
                 ...collectionUpdateData
                }
              })
            
        }
      } catch (error) {
          console.error(error.message)
      }
   
      

      
  }
  
  function calculatePriceChangeRate(currentFloorPrice, pastFloorPrice) {
    const changeRate = ((currentFloorPrice - pastFloorPrice) / pastFloorPrice) * 100;
    if (Number.isNaN(changeRate)) return 0
    if (!Number.isFinite(changeRate)) return 0
    return Number(changeRate.toFixed(2));
}





  module.exports = {
    stats_1h_collection
  }