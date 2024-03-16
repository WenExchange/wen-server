const ethers = require("ethers");
const { Web3 } = require("web3");
const dayjs = require("dayjs");
const web3 = new Web3();
const {
  updateFloorPrice,
  updateOrdersCount,
  updateOwnerCount,
} = require("./collectionStats");

//TODO: change it to mainnet
const {jsonRpcProvider, NFT_LOG_TYPE} = require("../utils/constants")
const wenExContractAddress = "0xD75104c9C2aeC1594944c8F3a2858C62DEeaE91b";
const SELECTOR_fillBatchSignedERC721Order = "0xa4d73041";
const SELECTOR_fillBatchSignedERC721Orders = "0x149b8ce6";

const {LOG_TYPE_SALE,LOG_TYPE_TRANSFER ,LOG_TYPE_LISTING, LOG_TYPE_OFFER, LOG_TYPE_COLLECTION_OFFER, LOG_TYPE_CANCEL_LISTING, LOG_TYPE_AUTO_CANCEL_LISTING, LOG_TYPE_CANCEL_OFFER, LOG_TYPE_MINT} = NFT_LOG_TYPE

const CollectionCacheManager = require("../cache-managers/CollectionCacheManager")

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
      const ccm = CollectionCacheManager.getInstance(strapi)
      const myCollections = ccm.getCollectionAddresses()
      console.log("cached collection address -", myCollections.length);
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

      // 1-1. If nft doesn't exist, return
      if (!nftData) {
        console.log("There is no NFT DATA.");
        return;
      }

      // 2. Get Transaction details

      await jsonRpcProvider.getTransaction(log.transactionHash);

      let tradeLogExists = await strapi.db
        .query("api::nft-trade-log.nft-trade-log")
        .findOne({
          where: {
            tx_hash: log.transactionHash,
            from: transferFrom,
            to: transferTo,
            nft: nftData.id,
          },
        });

      if (!tradeLogExists) {
        let deletingOrder;
        if (transferFrom != "0x0000000000000000000000000000000000000000") {
          if (nftData.sell_order != null) {
            if (nftData.sell_order.maker == transferFrom) {
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
                  last_sale_price: deletingOrder.price_eth,
                },
              });
              // 2. NFT TradeLog에 추가
              await strapi.entityService.create(
                "api::nft-trade-log.nft-trade-log",
                {
                  data: {
                    type: LOG_TYPE_SALE,
                    price: deletingOrder.price_eth,
                    from: transferFrom,
                    to: transferTo,
                    nft: nftData.id,
                    tx_hash: log.transactionHash,
                    timestamp: dayjs().unix()
                  },
                }
              );
              //3. log added
              await strapi.entityService.create(
                "api::nft-trade-log.nft-trade-log",
                {
                  data: {
                    type: LOG_TYPE_AUTO_CANCEL_LISTING,
                    from: deletingOrder.maker,
                    nft: deletingOrder.nft.id,
                    tx_hash: log.transactionHash,
                    timestamp: dayjs().unix()
                  },
                }
              );

              console.log("SALE : Order deleted Id", deletingOrder.id);

              // 4. floor price update
              await updateFloorPrice({ strapi }, log.address);

              // 5. update listing count
              await updateOrdersCount({ strapi }, log.address);

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
                    timestamp: dayjs().unix()
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
                  timestamp: dayjs().unix()
                },
              }
            );
            console.log("TRANSFER ADDED HERE 1 Hash : ", log.transactionHash);
          }
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
                timestamp: dayjs().unix()
              },
            }
          );
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

        //4-2. Owner Count 를 변경
        await updateOwnerCount({ strapi }, log.address);
      } else {
        console.log("log is already exist.");
      }
    } catch (error) {
      console.log("error", error);
    }
  });

  jsonRpcProvider.on(cancelFilter, async (log, _) => {
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
        //2-1. create cancle listing
        await strapi.entityService.create("api::nft-trade-log.nft-trade-log", {
          data: {
            type: LOG_TYPE_CANCEL_LISTING,
            from: userAddress,
            nft: result.nft.id,
            tx_hash: log.transactionHash,
            timestamp: dayjs().unix()
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
      // 2-2. updateFloorPrice
      await updateFloorPrice({ strapi }, result.contract_address);
      // 2-3. update listing count
      await updateOrdersCount({ strapi }, log.address);
    } else {
      console.log("it's null", userAddress, nonceId);
    }
  });
}

module.exports = { createTransferListener };
