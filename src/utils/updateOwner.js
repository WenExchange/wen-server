const {  jsonRpcProvider, jsonRpcProvider_cron }  = require("./constants") 
const { ethers }  = require("ethers") 
const IERC721 = require("../api/sdk/controllers/IERC721");
const { getISOString } = require("./helpers");
const dayjs = require("dayjs")


const getNFTsAndUpdateOwnerOfNFTs = async ({strapi}) => {
    const seconds_1h = 60 * 60
    const seconds_1d = seconds_1h * 24
    const unit = 20

    let totalUpdatedCount = 0
    for (let i = 1137; i < 70000 / 20; i++) {
        console.log(`${i} start`);
        const start = i * unit
        const end = unit * (i+1)
        const batchNFTs =  await strapi.db.query("api::nft.nft").findMany({
            populate: {
                collection: true,
                sell_order: true
            },
            where: {
                $and: [
                    {
                        collection: {
                            publishedAt: {
                                $notNull: true
                            }
                        },
                    },
                    {
                        collection: {
                            airdrop_multiplier: {
                                $gt: 1
                            }
                        }
                    }
                ]
            },
            offset: start,
            limit: unit
        })
        try {
            const updatedCount = await updateOwnerOfNFTs({strapi,nfts: batchNFTs})
            totalUpdatedCount += updatedCount
        } catch (error) {
            console.error(`333 error - ${error.message}`)
        }
        
  
        
    }

    console.log(333, "totalUpdatedCount",totalUpdatedCount);
}

const updateOwnerOfNFTs = async ({strapi, nfts}) => {

    const willUpdateOwnerPromises = nfts.map(nft => {
        const collectionContract = new ethers.Contract(nft.collection.contract_address, IERC721.abi, jsonRpcProvider_cron)
        return collectionContract.ownerOf(nft.token_id).then(realOwner => {
            try {
                if (realOwner.toLowerCase() !== nft.owner.toLowerCase()) {
                  
                    if (nft.sell_order) {
                        
                        console.log(`${nft.id} ${nft.name} will delete order and change owner ${nft.owner} -> ${realOwner}`)
                        return strapi.entityService.delete("api::order.order",nft.sell_order.id).then(_ => strapi.entityService.update("api::nft.nft",nft.id, {
                            data: {
                                owner: realOwner
                            }
                        }) ).catch(e => null)
                    }
                    console.log(`${nft.id} ${nft.name} will change owner ${nft.owner} -> ${realOwner}`)
                    
                    return strapi.entityService.update("api::nft.nft",nft.id, {
                        data: {
                            owner: realOwner
                        }
                    }).catch(e => null)
                }
                return null
            } catch (error) {
                console.error(`${nft.id} error - ${error.message}`)
                return null
            }
           
        }).catch(e => null)
    })
    let result  = await Promise.all(willUpdateOwnerPromises)
    result = result.filter(_ => _ !== null)
    console.log(`${result.length} NFTs are updated to real owner`);
    return result.length
}

const getNFTsAndAddOwnerOfNFTs = async ({strapi}) => {
    const unit = 10000
    const seconds_1h = 60 * 60
    const seconds_1d = seconds_1h * 24

    const nfts = await strapi.db.query("api::nft.nft").findMany({
        populate: {
            collection: true
        },
        where: {
            $and: [
                {
                    collection: {
                        publishedAt: {
                            $notNull: true
                        }
                    },
                },
                {
                    owner: {
                        $null: true
                    }
                }
                // {
                //     createdAt: {
                //         $gt: getISOString(dayjs().unix() - seconds_1d)
                //     }
                // }
            ]
            
            
        },
    })

    console.log(333, "nfts", nfts.length);

    await addOwner({strapi, nfts})
    
        

        
        
    

}

const addOwner = async ({strapi, nfts}) => {
    console.log(`Start owner check`)
    const willUpdateOwnerPromises = nfts.map(nft => {
        const collectionContract = new ethers.Contract(nft.collection.contract_address, IERC721.abi, jsonRpcProvider)
        return collectionContract.ownerOf(nft.token_id).then(realOwner => {
            try {
                return strapi.entityService.update("api::nft.nft",nft.id, {
                    data: {
                        owner: realOwner
                    }
                })
            } catch (error) {
                console.error(`${nft.id} error - ${error.message}`)
                return null
            }
           
        }).catch(e => {
            console.log(`${nft.name} - error - ${e.message}`);
            return null
        })
    })

    await Promise.all(willUpdateOwnerPromises)
}

const deleteOrders = async ({strapi}) => {
    const unit = 10000
    const seconds_1h = 60 * 60
    const seconds_1d = seconds_1h * 24

    const orders = await strapi.db.query("api::order.order").findMany({
        populate: {
            nft: true
        },
    })

    const deletePromises = orders.map(order => {
        if (order.maker.toLowerCase() !== order.nft.owner.toLowerCase()) {
            return strapi.db.query("api::order.order").delete({
                where: {
                    id: {
                        $eq: order.id
                    }
                }
            })
        } else {
            return null
        }
    })

    const result = await Promise.all(deletePromises)
    console.log(333, "result",result.filter(_ => _ !== null));
    
}

module.exports  = {
    getNFTsAndUpdateOwnerOfNFTs,
    getNFTsAndAddOwnerOfNFTs,
    updateOwnerOfNFTs,
    deleteOrders
}