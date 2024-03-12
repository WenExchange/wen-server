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
  jsonRpcProvider.on(filter, async (log, _) => {
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
        BigInt(log.topics[3]),
        log
      );

      // 1. Get NFT
      const nftData = await strapi.db.query("api::nft.nft").findOne({
        where: {
          token_id: BigInt(log.topics[3]).toString(),
          collection: { contract_address: log.address },
        },
      });

      // 2. Get Transaction details

      const txReceipt = await jsonRpcProvider.getTransaction(
        log.transactionHash
      );
      console.log(txReceipt.toString());

      // 2. If Previous Owner listed on WEN ( = If it has sell-order)
      // order를 삭제

      // 3. Check where the transfer from

      // 3-1. If it's from Wen Exchange, set Last price

      // 3-2. If it's not from Wen Exchange, don't set Last price

      // 4. 공통
      // 4-1. Owner 를 변경
      // 4-2. History를 변경 추가(Sale, Transfer)

      // 3. If Owner
    } catch (error) {
      console.log("error");
    }
  });
}

module.exports = { createTransferListener };
