const DiscordManager = require("../discord/DiscordManager");
const { updateListingPoint } = require("../utils/airdropPrePointHelper");
const {
    NFT_LOG_TYPE,
    DISCORD_INFO,
  } = require("../utils/constants");
const { updateOwnerCount, updateFloorPrice, updateOrdersCount } = require("./collectionStats");
  const {
    LOG_TYPE_SALE,
    LOG_TYPE_AUTO_CANCEL_LISTING,
  } = NFT_LOG_TYPE;



const getNFTDataAtTradeListener = async ({ strapi, data }) => {
    try {
        const nftData = await strapi.db.query("api::nft.nft").findOne({
            where: {
                $and: [
                    {
                        token_id: data.token_id,
                    },
                    {
                        collection: { contract_address: data.contract_address },
                    },
                    {
                        collection: {
                            publishedAt: {
                                $notNull: true
                            }
                        }
                    }
                ]
            },
            populate: {
                sell_order: {
                    select: ["id"]
                }
            },
        });

        return nftData;
    } catch (error) {
        return false;
    }
}

const getTradeLogAtTradeListener = async ({ strapi, data, nftData }) => {

    try {
        const existedTradeLog = await strapi.db
            .query("api::nft-trade-log.nft-trade-log")
            .findOne({
                where: {
                    $and: [
                        {
                            tx_hash: data.tx_hash,
                        },
                        {
                            from: data.from,
                        },
                        {
                            to: data.to,
                        },
                        {
                            nft: {
                                id: nftData.id,
                            },
                        },
                    ],
                },
            });


        return existedTradeLog
    } catch (error) {
        return false;
    }
};

const updateNFTAtTradeListener = async ({ strapi, data, nftData }) => {
    if (Number(nftData.last_sale_price) !== Number(data.price) || nftData.owner.toLowerCase() !== data.to) {
        await strapi.entityService
            .update("api::nft.nft", nftData.id, {
                data: {
                    last_sale_price: data.price,
                    owner: data.to,
                },
            })
        try {
            await updateOwnerCount({ strapi }, data.contract_address);
        } catch (error) {
            const dm = DiscordManager.getInstance(strapi)
            dm.logError({ error, identifier: `updateNFTAtTradeListener`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG }).catch()
        }
        
    }
}

const deleteSellOrderAtTradeListener = async ({ strapi, data, nftData, isListingAirdrop = true }) => {
    if (nftData.sell_order) {
        const deletedOrder = await strapi.entityService
            .delete("api::order.order", nftData.sell_order.id)

        if (deletedOrder) {
            strapi.entityService
                .create("api::nft-trade-log.nft-trade-log", {
                    data: {
                        ex_type: data.ex_type,
                        type: LOG_TYPE_AUTO_CANCEL_LISTING,
                        from: data.from,
                        nft: nftData.id,
                        tx_hash: data.tx_hash,
                        timestamp: dayjs().unix(),
                    },
                }).catch((e) => console.error(e.message));
            try {
                if (isListingAirdrop) {
                    await updateListingPoint(
                        true,
                        data.from,
                        data.contract_address,
                        nftData.token_id,
                        0,
                        0,
                        { strapi }
                    )
                }
                
                await updateFloorPrice({ strapi }, data.contract_address)
                await updateOrdersCount({ strapi }, data.contract_address);
            } catch (error) {
                const dm = DiscordManager.getInstance(strapi)
                dm.logError({ error, identifier: `deleteSellOrderAtTradeListener`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG }).catch()
            }
        }


    }
}

const createSaleLogAtTradeListener = async ({ strapi, data, nftData, isOffer= false }) => {
    const tradeLog = await getTradeLogAtTradeListener({ strapi, data, nftData })
    if (!tradeLog) {
        const createData = {
            ex_type: data.ex_type,
            sale_type: data.sale_type,
            payment_token: data.payment_token,
            type: isOffer ? LOG_TYPE_COLLECTION_SALE : LOG_TYPE_SALE,
            price: data.price,
            from: data.from,
            to: data.to,
            nft: nftData.id,
            tx_hash: data.tx_hash,
            timestamp: dayjs().unix(),
        }
        if (isOffer) {
            data["buy_order_hash"] = data.buy_order_hash
        }
        strapi.entityService
            .create("api::nft-trade-log.nft-trade-log", {
                data: createData
            })
            .catch((e) => console.error(e.message));
    }
}

module.exports = {
    getNFTDataAtTradeListener,
    getTradeLogAtTradeListener,
    updateNFTAtTradeListener,
    deleteSellOrderAtTradeListener,
    createSaleLogAtTradeListener
}