const ethers = require("ethers");
const IERC721 = require("./IERC721.js");
const { Web3 } = require("web3");
const web3 = new Web3();

const { jsonRpcProvider } = require("../../../utils/constants");

async function getNFTOwner(nftContract, tokenId) {
  const nft = new ethers.Contract(nftContract, IERC721.abi, jsonRpcProvider);

  const owner = await nft.ownerOf(tokenId);
  return owner.toLowerCase();
}

function weiToEther(wei) {
  const etherFloat = ethers.utils.formatEther(wei);

  return etherFloat;
}

module.exports = { getNFTOwner, weiToEther };
