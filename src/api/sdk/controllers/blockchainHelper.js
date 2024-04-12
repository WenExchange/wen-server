const { jsonRpcProvider } = require("../../../utils/constants");
const { ethers } = require("ethers");
const IERC721 = require("./IERC721.js");
const IERC20 = require("./IERC20");

async function getNFTOwner(nftContract, tokenId) {
  const nft = new ethers.Contract(nftContract, IERC721.abi, jsonRpcProvider);

  const owner = await nft.ownerOf(tokenId);
  return owner.toLowerCase();
}

// TODO: TESTNET : json RPC Provider 바꿔라
async function getERC20Balance(ERC20Address, userAddress) {
  const provider = new ethers.providers.JsonRpcProvider(
    "https://blast-sepolia.blockpi.network/v1/rpc/public"
  );
  const nft = new ethers.Contract(ERC20Address, IERC20.abi, provider);

  const balance = await nft.balanceOf(userAddress);
  return BigInt(balance);
}

async function updateAllNftOwner({ strapi }) {
  const results = await strapi.db
    .query("api::nft.nft")
    .findMany({ populate: { collection: true } });

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
function weiToEther(wei) {
  const etherFloat = ethers.utils.formatEther(wei);
  return etherFloat;
}

module.exports = {
  updateAllNftOwner,
  getNFTOwner,
  weiToEther,
  getERC20Balance,
};
