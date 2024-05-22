
const fs = require('fs');

const getHoldersAddress = async ({ strapi, contract_address, toJsonFile = false }) => {
    const nfts = await strapi.db.query('api::nft.nft').findMany({
        where: {
            collection: {
                contract_address
            }
        },
        select: ["owner"]
    })



    let holders = nfts.map(_ => _.owner)
    const uniqueHolders = Array.from(new Set(holders));
    if (toJsonFile) {
        fs.writeFile('holders.json', JSON.stringify(uniqueHolders, null, 2), (err) => {
            if (err) throw err;
            console.log('holders.json has been saved.');
        });
    }
}

const getBidders = async ({ strapi, toJsonFile = false }) => {
    const buyOrders = await strapi.db.query("api::buy-order.buy-order").findMany({
        where: {
            single_price_eth: {
                $gte: 0.001
            }
        }
    })

    const bidders = buyOrders.map(buyOrder => buyOrder.maker)
    const biddersByCount = {}
    for (let i = 0; i < bidders.length; i++) {
        const bidder = bidders[i];
        if (biddersByCount[bidder]) {
            biddersByCount[bidder] = biddersByCount[bidder] + 1
        } else {
            biddersByCount[bidder] = 1
        }
    }

    const filteredBidders = []

    for (const address in biddersByCount) {
        const count = biddersByCount[address];
        if (count >= 3) {
            filteredBidders.push(address)
        }
    }


    console.log(333, filteredBidders);

    if (toJsonFile) {
        fs.writeFile('bidders.json', JSON.stringify(filteredBidders, null, 2), (err) => {
            if (err) throw err;
            console.log('bidders.json has been saved.');
        });
    }
}


module.exports = {
    getHoldersAddress,
    getBidders
}