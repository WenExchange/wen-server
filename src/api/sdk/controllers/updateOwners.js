const { jsonRpcProvider } = require("../../../utils/constants");
const {ethers} = require("ethers");
const IERC721 = require("./IERC721.js");
const { Web3 } = require("web3");
const web3 = new Web3();

async function getNFTOwner(nftContract, tokenId) {
  const nft = new ethers.Contract(nftContract, IERC721.abi, jsonRpcProvider);

  const owner = await nft.ownerOf(tokenId);
  return owner.toLowerCase();
}

async function updateAllNftOwner({ strapi }) {
  const results = await strapi.db.query("api::nft.nft").findMany({
    where: { owner: { $null: true } },
    populate: { collection: true },
  });

  let totalCount = 0;
  for (let result of results) {
    const owner = await getNFTOwner(
      result.collection.contract_address,
      result.token_id
    );
    if (result.owner) {
      if (result.owner.toLowerCase() != owner.toLowerCase()) {
        await strapi.entityService.update("api::nft.nft", result.id, {
          data: { owner: owner },
        });
      } else {
        console.log(
          "no change",
          owner,
          result.owner,
          result.token_id,
          result.collection.slug
        );
      }
    } else {
      await strapi.entityService.update("api::nft.nft", result.id, {
        data: { owner: owner },
      });
    }

    console.log("total count ", totalCount++);
  }
}

async function updateAllOrderFee({ strapi }) {
  const results = await strapi.db.query("api::order.order").findMany({
    populate: { collection: true },
  });

  let totalCount = 0;
  for (let result of results) {
    const exchageData = JSON.parse(result.exchange_data);
    const royaltyFeeReceiver =
      exchageData.basicCollections[0].royaltyFeeRecipient;
    const royaltyFeePoint = exchageData.basicCollections[0].royaltyFee;
    console.log(royaltyFeeReceiver, royaltyFeePoint);

    // if (result.royalty_fee_point == null) {
    await strapi.entityService.update("api::order.order", result.id, {
      data: {
        royalty_fee_receiver: royaltyFeeReceiver,
        royalty_fee_point: royaltyFeePoint,
      },
    });
    console.log("result update ");
    totalCount++;
    // }
  }
  console.log("updated total count ", totalCount);
}

module.exports = { updateAllNftOwner, updateAllOrderFee };
