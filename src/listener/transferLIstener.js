const ethers = require("ethers");
//TODO: change it to mainnet
const jsonRpcProvider = new ethers.JsonRpcProvider(
  // "https://rpc.ankr.com/blast/c657bef90ad95db61eef20ff757471d11b8de5482613002038a6bf9d8bb84494" // mainnet
  "https://rpc.ankr.com/blast_testnet_sepolia/c657bef90ad95db61eef20ff757471d11b8de5482613002038a6bf9d8bb84494" // testnet
);

const myCollections = [
  "0xC4d5966E0C4f37762414D03F165E7CbF2DC247FD",
  "0x89F2ce18C98594303378940a83625f91C3Acded3",
  "0xec1c6ebb2EDEf02422BBBcAa3fb9b39363B9D47D",
];
async function createTransferListener() {
  console.log("it's on");
  let filter = {
    topics: [ethers.id("Transfer(address,address,uint256)")], //from, to, tokenId
  };

  jsonRpcProvider.removeAllListeners();
  jsonRpcProvider.on(filter, (log, _) => {
    // // exit early if it's not our NFT
    try {
      if (!myCollections.includes(log.address)) return;

      console.log(
        "nft address : ",
        log.address,
        "from : ",
        `0x${log.topics[1].slice(-40)}`,
        "to : ",
        `0x${log.topics[2].slice(-40)}`,
        "token id : ",
        BigInt(log.topics[3])
      );

      //   console.log("LOG!!!!!!", log);
    } catch (error) {
      console.log("error");
    }

    //this pushes a new nft to mongodb
    // return this.nftsService.createOrUpdateNft(newNft);
  });
}

module.exports = { createTransferListener };
