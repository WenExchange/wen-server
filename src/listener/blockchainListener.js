const ethers = require("ethers");
const { Web3 } = require("web3");
const web3 = new Web3();
//TODO: change it to mainnet
const jsonRpcProvider = new ethers.providers.JsonRpcProvider(
  // "https://rpc.ankr.com/blast/c657bef90ad95db61eef20ff757471d11b8de5482613002038a6bf9d8bb84494" // mainnet
  "https://rpc.ankr.com/blast_testnet_sepolia/c657bef90ad95db61eef20ff757471d11b8de5482613002038a6bf9d8bb84494" // testnet
);
const wenExContractAddress = "0xD75104c9C2aeC1594944c8F3a2858C62DEeaE91b";
const SELECTOR_fillBatchSignedERC721Order = "0xa4d73041";
const SELECTOR_fillBatchSignedERC721Orders = "0x149b8ce6";

const LOG_TYPE_SALE = "SALE";
const LOG_TYPE_TRANSFER = "TRANSFER";
const LOG_TYPE_LISTING = "LISTING";
const LOG_TYPE_OFFER = "OFFER";
const LOG_TYPE_COLLECTION_OFFER = "COLLECTION_OFFER";
const LOG_TYPE_CANCEL_LISTING = "CANCEL_LISTING";
const LOG_TYPE_AUTO_CANCEL_LISTING = "AUTO_CANCEL_LISTING"; // 유저가 더이상 BUYER 가 아닌 경우
const LOG_TYPE_CANCEL_OFFER = "CANCEL_OFFER";
const LOG_TYPE_MINT = "MINT";

//TODO: update myCollections
const myCollections = [
  "0xC4d5966E0C4f37762414D03F165E7CbF2DC247FD",
  "0x89F2ce18C98594303378940a83625f91C3Acded3",
  "0xec1c6ebb2EDEf02422BBBcAa3fb9b39363B9D47D",
];
async function createTransferListener({ strapi }) {
  console.log("it's on");
  let filter = {
    topics: [ethers.utils.id("Transfer(address,address,uint256)")], //from, to, tokenId
  };
  let cancelFilter = {
    topics: [ethers.utils.id("ERC721OrderCancelled(address,uint256)")],
  };

  await jsonRpcProvider.removeAllListeners();
  jsonRpcProvider.on(filter, async (log, _) => {
    // // exit early if it's not our NFT
    try {
      if (!myCollections.includes(log.address)) return;

      const transferFrom = `0x${log.topics[1].slice(-40)}`;
      const transferTo = `0x${log.topics[2].slice(-40)}`;
      const tokenId = BigInt(log.topics[3]);

      //   console.log(
      //     "nft address : ",
      //     log.address,
      //     "from : ",
      //     `0x${log.topics[1].slice(-40)}`,
      //     "to : ",
      //     `0x${log.topics[2].slice(-40)}`,
      //     "token id : ",
      //     BigInt(log.topics[3]),
      //     log
      //   );

      // 1. Get NFT
      const nftData = await strapi.db.query("api::nft.nft").findOne({
        where: {
          token_id: tokenId.toString(),
          collection: { contract_address: log.address },
        },
        populate: {
          sell_order: true,
        },
      });

      // 2. Get Transaction details

      const txReceipt = await jsonRpcProvider.getTransaction(
        log.transactionHash
      );
      //   console.log(txReceipt);

      let deletingOrder;
      // 2. If Previous Owner listed on WEN ( = If it has sell-order)
      //   order를 삭제
      if (nftData.owner) {
        if (
          transferFrom.toLowerCase() == nftData.owner.toLowerCase() &&
          transferFrom.toLowerCase() != transferTo.toLowerCase() &&
          nftData.sell_order != null
        ) {
          // 옛날에 owner 였는데 더이상 NFT 를 소유하고 있지 않은 경우
          // order를 삭제
          deletingOrder = await strapi.entityService.delete(
            "api::order.order",
            nftData.sell_order.id,
            {
              populate: { nft: true },
            }
          );

          await strapi.entityService.create(
            "api::nft-trade-log.nft-trade-log",
            {
              data: {
                type: LOG_TYPE_AUTO_CANCEL_LISTING,
                from: deletingOrder.maker,
                nft: deletingOrder.nft.id,
                tx_hash: log.transactionHash,
              },
            }
          );

          console.log("deleting owner? ");

          // TODO: [FLOOR PRICE]

          console.log("CANCEL LISTING HERE 1: ");
        } else {
          console.log("check if nftData exist, nftData.sell_order exist");
          console.log(
            "deleting owner? NO! ",
            nftData.sell_order,
            nftData.owner
          );
        }
      }

      // 3. Check where the transfer from
      if (txReceipt.to == wenExContractAddress) {
        // 3-1. If it's from Wen Exchange, set Last price
        if (
          // TODO: 1155, collection offer 를 받아서 파는 경우에도 고려를 해줘야함
          txReceipt.data.includes(SELECTOR_fillBatchSignedERC721Order) ||
          txReceipt.data.includes(SELECTOR_fillBatchSignedERC721Orders)
        ) {
          if (deletingOrder) {
            // 1. nft last sale price update
            await strapi.entityService.update("api::nft.nft", nftData.id, {
              data: {
                last_sale_price: deletingOrder.price,
              },
            });
            // 2. NFT TradeLog에 추가
            await strapi.entityService.create(
              "api::nft-trade-log.nft-trade-log",
              {
                data: {
                  type: LOG_TYPE_SALE,
                  price: deletingOrder.price,
                  from: transferFrom,
                  to: transferTo,
                  nft: nftData.id,
                  tx_hash: log.transactionHash,
                },
              }
            );
            console.log("SALE ADDED HERE  Hash : ", log.transactionHash);
          } else {
            await strapi.entityService.create(
              "api::nft-trade-log.nft-trade-log",
              {
                data: {
                  type: LOG_TYPE_TRANSFER,
                  from: transferFrom,
                  to: transferTo,
                  nft: nftData.id,
                  tx_hash: log.transactionHash,
                },
              }
            );
            console.log(
              "TRANSFER ADDED HERE 1 Hash : ",
              log.transactionHash,
              deletingOrder
            );
          }
        }
      } else {
        // 3-2. If it's not from Wen Exchange, don't set Last price
        // add element and mintify

        if (transferFrom != "0x0000000000000000000000000000000000000000") {
          await strapi.entityService.create(
            "api::nft-trade-log.nft-trade-log",
            {
              data: {
                type: LOG_TYPE_TRANSFER,
                from: transferFrom,
                to: transferTo,
                nft: nftData.id,
                tx_hash: log.transactionHash,
              },
            }
          );
          console.log(
            "TRANSFER ADDED HERE 2 Hash : ",
            log.transactionHash,
            transferFrom
          );
        } else {
          await strapi.entityService.create(
            "api::nft-trade-log.nft-trade-log",
            {
              data: {
                type: LOG_TYPE_MINT,
                from: transferFrom,
                to: transferTo,
                nft: nftData.id,
                tx_hash: log.transactionHash,
              },
            }
          );
          console.log(
            "MINT ADDED HERE 2 Hash : ",
            log.transactionHash,
            transferFrom
          );
        }
      }

      // 4. 공통
      // 4-1. Owner 를 변경
      // if the SELL order, update the sell_order of the NFT
      await strapi.entityService.update("api::nft.nft", nftData.id, {
        data: {
          owner: transferTo,
        },
      });
    } catch (error) {
      console.log("error", error);
    }
  });

  jsonRpcProvider.on(cancelFilter, async (log, _) => {
    console.log("hi 222 ", log);
    const parametersTypes = [
      "address", // additional1
      "uint256", // additional2
    ];

    const encodedData = web3.eth.abi.decodeParameters(
      parametersTypes,
      log.data
    );
    const userAddress = encodedData[0];
    const nonceId = encodedData[1].toString();

    console.log(encodedData, userAddress, nonceId);

    // 1. delete order
    const result = await strapi.db.query("api::order.order").delete({
      where: {
        $and: [
          {
            maker: userAddress,
          },
          {
            nonce: nonceId,
          },
        ],
      },
      populate: {
        nft: true,
      },
    });

    // 2. create cancel listing
    if (result != null) {
      if (result.id != null) {
        await strapi.entityService.create("api::nft-trade-log.nft-trade-log", {
          data: {
            type: LOG_TYPE_CANCEL_LISTING,
            from: userAddress,
            nft: result.nft.id,
            tx_hash: log.transactionHash,
          },
        });
        console.log(
          "CANCEL LISTING HERE 2 Hash : ",
          log.transactionHash,
          "contract : ",
          result.contract_address,
          "nft id : ",
          result.token_id
        );
      }

      // TODO: [FLOOR PRICE]
    }
  });
}

module.exports = { createTransferListener };
