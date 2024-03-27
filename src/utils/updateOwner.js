const {  jsonRpcProvider }  = require("./constants") 
const { ethers }  = require("ethers") 
const IERC721 = require("../api/sdk/controllers/IERC721");
const { getISOString } = require("./helpers");
const dayjs = require("dayjs")


const getNFTsAndUpdateOwnerOfNFTs = async ({strapi}) => {
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
                    createdAt: {
                        $gt: getISOString(dayjs().unix() - seconds_1d)
                    }
                }
            ]
            
            
        }
    })

    // await addOwner({strapi,nfts })

        await updateOwnerOfNFTs({strapi,nfts})

        
        
    

}

const updateOwnerOfNFTs = async ({strapi, nfts}) => {
    

    console.log(`Start owner check`)
    const willUpdateOwnerPromises = nfts.map(nft => {
        const collectionContract = new ethers.Contract(nft.collection.contract_address, IERC721.abi, jsonRpcProvider)
        return collectionContract.ownerOf(nft.token_id).then(realOwner => {
            try {
                if (realOwner.toLowerCase() !== nft.owner.toLowerCase()) {
                    if (nft.sell_order) {
                        return strapi.entityService.delete("api::order.order",nft.sell_order.id).then(_ => strapi.entityService.update("api::nft.nft",nft.id, {
                            data: {
                                owner: realOwner
                            }
                        }) )
                    }
                    return strapi.entityService.update("api::nft.nft",nft.id, {
                        data: {
                            owner: realOwner
                        }
                    })
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
    console.log(result.length);
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

module.exports  = {
    getNFTsAndUpdateOwnerOfNFTs,
    updateOwnerOfNFTs
}