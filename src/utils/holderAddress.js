
const fs = require('fs');

const getHoldersAddress = async ({strapi, contract_address, toJsonFile= true}) => {
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


  module.exports = {
    getHoldersAddress
  }