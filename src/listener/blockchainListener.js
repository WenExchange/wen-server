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
  "0x7E3D4B14E191533B44470889b6d0d36F232de1A3",
  "0xEFFBE8DFc7B147a59Dd407Efb8b5510804C02236",
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

      // 1. NFT 의 sell order가 존재함?
      // 1-1. YES. NFT Owner 가 transferFrom 임?

      //

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
      if (transferFrom != "0x0000000000000000000000000000000000000000") {
        if (nftData.sell_order != null) {
          if (nftData.owner == transferFrom) {
            // SALE임

            deletingOrder = await strapi.entityService.delete(
              "api::order.order",
              nftData.sell_order.id,
              {
                populate: { nft: true },
              }
            );

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

            console.log("SALE : Order deleted Id", deletingOrder.id);

            // TODO: [FLOOR PRICE]

            console.log("CANCEL LISTING HERE 1: ");
          } else {
            // 에러상황. owner 를 잘못 tracking 하고 있었다는 것.
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
            console.log("ERROR Owner traking failed: ", log.transactionHash);
          }
        } else {
          // 그냥 Transfer 임
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
          console.log("TRANSFER ADDED HERE 1 Hash : ", log.transactionHash);
        }
      } else {
        await strapi.entityService.create("api::nft-trade-log.nft-trade-log", {
          data: {
            type: LOG_TYPE_MINT,
            from: transferFrom,
            to: transferTo,
            nft: nftData.id,
            tx_hash: log.transactionHash,
          },
        });
        console.log(
          "MINT ADDED HERE 2 Hash : ",
          log.transactionHash,
          transferFrom
        );
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
