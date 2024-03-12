const ethers = require("ethers");
const IERC721 = require("./IERC721.js");

//TODO: change it to mainnet
const jsonRpcProvider = new ethers.JsonRpcProvider(
  // "https://rpc.ankr.com/blast/c657bef90ad95db61eef20ff757471d11b8de5482613002038a6bf9d8bb84494" // mainnet
  "https://rpc.ankr.com/blast_testnet_sepolia/c657bef90ad95db61eef20ff757471d11b8de5482613002038a6bf9d8bb84494" // testnet
);

async function getNFTOwner(nftContract, tokenId) {
  const nft = new ethers.Contract(nftContract, IERC721.abi, jsonRpcProvider);

  // console.log("nft owner!!! ", await nft.ownerOf(tokenId));
  const owner = await nft.ownerOf(tokenId);
  return owner.toLowerCase();
}

// getNFTOwner("0xec1c6ebb2EDEf02422BBBcAa3fb9b39363B9D47D", 1);

module.exports = { getNFTOwner };
