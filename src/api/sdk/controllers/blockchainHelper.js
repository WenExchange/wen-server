const ethers = require("ethers");
const IERC721 = require("./IERC721.js");

//TODO: change it to mainnet
const jsonRpcProvider = new ethers.JsonRpcProvider(
  "https://blast-sepolia.blockpi.network/v1/rpc/public"
);

async function getNFTOwner(nftContract, tokenId) {
  const nft = new ethers.Contract(nftContract, IERC721.abi, jsonRpcProvider);

  return await nft.ownerOf(tokenId);
}

// getNFTOwner("0xec1c6ebb2EDEf02422BBBcAa3fb9b39363B9D47D", 1);

module.exports = { getNFTOwner };
