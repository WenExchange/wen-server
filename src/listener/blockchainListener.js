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
const {
  jsonRpcProvider,
  NFT_LOG_TYPE,
  WEN_EX_CONTRACT_ADDRESS,
} = require("../utils/constants");

const {
  LOG_TYPE_SALE,
  LOG_TYPE_TRANSFER,
  LOG_TYPE_LISTING,
  LOG_TYPE_OFFER,
  LOG_TYPE_COLLECTION_OFFER,
  LOG_TYPE_CANCEL_LISTING,
  LOG_TYPE_AUTO_CANCEL_LISTING,
  LOG_TYPE_CANCEL_OFFER,
  LOG_TYPE_MINT,
} = NFT_LOG_TYPE;

const CollectionCacheManager = require("../cache-managers/CollectionCacheManager");
const { createNFTAtMint } = require("./listingAtMint");
const { collectionDeployerERC721And1155Listener } = require("./collectionDeployerERC721And1155Listener");

async function createTransferListener({ strapi }) {
  console.log("[TRANSFER EVENT LISTENING ON]");
  
  await jsonRpcProvider.removeAllListeners();
  let filter = {
    topics: [ethers.utils.id("Transfer(address,address,uint256)")], //from, to, tokenId
  };
  jsonRpcProvider.on(filter, async (log, _) => {
    try {
      const ccm = CollectionCacheManager.getInstance(strapi);
      const myCollections = ccm.getCollectionAddresses();
      if (!myCollections.includes(log.address.toLowerCase())) return;

      const transferFrom = `0x${log.topics[1].slice(-40)}`;
      const transferTo = `0x${log.topics[2].slice(-40)}`;
      const tokenId = BigInt(log.topics[3])

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

      const txReceipt = await jsonRpcProvider.getTransaction(
        log.transactionHash
      );

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

      if (tradeLogExists) {
        console.log("log is already exist.");
        return
      }

      /** Common Tasks */
      await updateOwner({strapi,nftData,transferTo })
      await updateOwnerCount({ strapi }, log.address);

      let deletingOrder;
      if (transferFrom === "0x0000000000000000000000000000000000000000") {
        /** Mint */
      } else {
        if (nftData.sell_order != null) {
          // sell order 가 존재하는 상태에서 transfer 가 일어났으면, Sale 혹은 cancel
          deletingOrder = await strapi.entityService.delete(
            "api::order.order",
            nftData.sell_order.id,
            {
              populate: { nft: true },
            }
          );

          if (
            nftData.sell_order.maker == transferFrom &&
            txReceipt.to == WEN_EX_CONTRACT_ADDRESS
          ) {
            /** Sale */
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
                  timestamp: dayjs().unix(),
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
                  timestamp: dayjs().unix(),
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
            await strapi.entityService.create(
              "api::nft-trade-log.nft-trade-log",
              {
                data: {
                  type: LOG_TYPE_TRANSFER,
                  from: transferFrom,
                  to: transferTo,
                  nft: nftData.id,
                  tx_hash: log.transactionHash,
                  timestamp: dayjs().unix(),
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
                timestamp: dayjs().unix(),
              },
            }
          );
          console.log("TRANSFER ADDED HERE 1 Hash : ", log.transactionHash);
        }
      }
       
    } catch (error) {
      console.log("error", error);
    }
  });

  let cancelFilter = {
    topics: [ethers.utils.id("ERC721OrderCancelled(address,uint256)")],
  };
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
            timestamp: dayjs().unix(),
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
      await updateOrdersCount({ strapi }, result.contract_address);
    } else {
      console.log("it's null", userAddress, nonceId);
    }
  });

  // jsonRpcProvider.on("block", async (blockNumber) => {
  //   collectionDeployerERC721And1155Listener({blockNumber, strapi})
  // });
}

const updateOwner = async ({strapi,nftData,transferTo  }) => {
  await strapi.entityService.update("api::nft.nft", nftData.id, {
    data: {
      owner: transferTo,
    },
  });
}


module.exports = { createTransferListener };
