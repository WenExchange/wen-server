const { ethers } = require("ethers");
const dayjs = require("dayjs");
const DiscordManager = require("../discord/DiscordManager");
const {
  jsonRpcProvider,
  NFT_LOG_TYPE,
  PROTOCOL_FEE,
  EVENT_TYPE,
  EX_TYPE,
  SALE_TYPE,
  PAYMENT_TOKEN,
  DISCORD_INFO,
} = require("../utils/constants");
const { decodeData } = require("./listenerhelpers");
const ERC721Event = require("../web3/abis/ERC721Event.json");
const ERC1155Event = require("../web3/abis/ERC1155Event.json");
const { updateSalePoint } = require("../utils/airdropPrePointHelper");
const {
  updateFloorPrice,
  updateOrdersCount,
  updateOwnerCount,
  updateBestOffer,
} = require("./collectionStats");
const { wait } = require("../utils/helpers");
const { updateListingPoint } = require("../utils/airdropPrePointHelper");
const {
  updateUserBatchOrderStatus,
  updateUserBatchOrderStatusWithoutUpdateBestOffer,
} = require("./updateUserBatchOrders");
const { getNFTDataAtTradeListener, deleteSellOrderAtTradeListener, createSaleLogAtTradeListener, updateNFTAtTradeListener } = require("./helpers");

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
  LOG_TYPE_COLLECTION_SALE,
} = NFT_LOG_TYPE;

const wenContractListener = async ({ event, strapi }) => {
  const dm = DiscordManager.getInstance(strapi)
  try {
    switch (event.topics[0]) {
      case EVENT_TYPE.ERC721SellOrderFilled: {
        //ERC721SellOrderFilled - ETH로 산 경우
        const eventData = decodeData(
          ERC721Event.abi,
          "ERC721SellOrderFilled",
          event
        );

        // ERC721SellOrderFilled (bytes32 orderHash, address maker, address taker, uint256 nonce, address erc20Token, uint256 erc20TokenAmount, tuple[] fees, address erc721Token, uint256 erc721TokenId)
        // 2. ERC 20 토큰의 양(낸 가격)
        const price = eventData["5"];
        // 3. ERC 721 컨트랙트 어드레스
        const ERC721ContractAddress = eventData["7"].toLowerCase();
        // 4. ERC 721 토큰 ID
        const ERC721TokenId = eventData["8"].toString();

        const maker = eventData["1"];
        const taker = eventData["2"];

        const data = {
          ex_type: EX_TYPE.WEN,
          sale_type: SALE_TYPE.SELL,
          payment_token: PAYMENT_TOKEN.ETH,
          price: ethers.utils.formatEther(price),
          from: maker,
          to: taker,
          tx_hash: event.transactionHash,
          timestamp: dayjs().unix(),
          token_id: ERC721TokenId,
          contract_address: ERC721ContractAddress,
        };


        await saleProcessInWen({ data, strapi })
        console.log(`wenContractListener - ERC721SellOrderFilled`, data)
        break;
      }

      case EVENT_TYPE.ERC721BuyOrderFilled: {
        //ERC721BuyOrderFilled - WETH를 받고 판 경우
        const eventData = decodeData(
          ERC721Event.abi,
          "ERC721BuyOrderFilled",
          event
        );

        // ERC721BuyOrderFilled (bytes32 orderHash, address maker, address taker, uint256 nonce, address erc20Token, uint256 erc20TokenAmount, tuple[] fees, address erc721Token, uint256 erc721TokenId)  s

        // buy order hash
        const buyOrderHash = eventData["0"].toString();
        // 2. ERC 20 토큰의 양(낸 가격)
        const price = eventData["5"].toString();
        // 3. ERC 721 컨트랙트 어드레스
        const ERC721ContractAddress = eventData["7"].toLowerCase();
        // 4. ERC 721 토큰 ID
        const ERC721TokenId = eventData["8"].toString();

        const maker = eventData["1"];
        const taker = eventData["2"];

        /**
         * BuyOrder 의 경우 maker 가 to , taker 가 from 으로 SellOrder 와 반대이다.
         */
        const data = {
          ex_type: EX_TYPE.WEN,
          sale_type: SALE_TYPE.BUY,
          payment_token: PAYMENT_TOKEN.WENETH,
          price: ethers.utils.formatEther(price),
          from: taker,
          to: maker,
          tx_hash: event.transactionHash,
          timestamp: dayjs().unix(),
          token_id: ERC721TokenId,
          contract_address: ERC721ContractAddress,
          buy_order_hash: buyOrderHash,
        };

        try {
          await buyOrderSaleProcessInWen({ data, strapi })
          console.log(`wenContractListener - ERC721BuyOrderFilled`, data)
        } catch (error) {
          strapi.log.error(`wenContractListener - ${error.message}`)
          const errorDetail =
            "[Error] wenContractListener - EVENT_TYPE.ERC721BuyOrderFilled \n" +
            "data : " +
            data.toString() +
            "error message" +
            error.message;
          strapi.entityService
            .create("api::error-log.error-log", {
              data: {
                error_detail: errorDetail,
              },
            })
            .catch();

          throw new Error(error)
        }
        break;
      }

      case EVENT_TYPE.ERC721OrderCancelled: {
        //ERC721BuyOrderFilled - WETH를 받고 판 경우
        const eventData = decodeData(
          ERC721Event.abi,
          "ERC721OrderCancelled",
          event
        );

        // ERC721BuyOrderFilled (address maker, uint256 nonce)
        const maker = eventData["0"];
        const nonce = eventData["1"];

        const data = {
          ex_type: EX_TYPE.WEN,
          maker,
          nonce,
          tx_hash: event.transactionHash,
          timestamp: dayjs().unix(),
        };

        await cancelProcessInWen({ data, strapi })
        console.log(`wenContractListener - ERC721OrderCancelled`, data)
        break;
      }

      case EVENT_TYPE.IncrementHashNonce: {
        //ERC721BuyOrderFilled - WETH를 받고 판 경우
        const eventData = decodeData(
          ERC721Event.abi,
          "HashNonceIncremented",
          event
        );

        // HashNonceIncremented (address maker, uint256 newHashNonce)
        const maker = eventData["0"];
        const newHashNonce = eventData["1"];

        const data = {
          ex_type: EX_TYPE.WEN,
          maker,
          newHashNonce,
          tx_hash: event.transactionHash,
          timestamp: dayjs().unix(),
        };

        await cancelAllOrdersInWen({ data, strapi })

        // update user hash_nonce
        const updated = await strapi.db
          .query("api::exchange-user.exchange-user")
          .update({
            where: { address: data.maker },
            data: {
              hash_nonce: newHashNonce,
            },
          });
        
          console.log(`wenContractListener - IncrementHashNonce`, data)
        break;
      }

      case EVENT_TYPE.ERC1155SellOrderFilled: {
        return;
        const eventData = decodeData(
          ERC1155Event.abi,
          "ERC1155SellOrderFilled",
          event
        );

        //ERC1155SellOrderFilled (bytes32 orderHash, address maker, address taker, uint256 nonce, address erc20Token, uint256 erc20FillAmount, tuple[] fees, address erc1155Token, uint256 erc1155TokenId, uint128 erc1155FillAmount)
        // 2. ERC 20 토큰의 양(낸 가격)
        const price = eventData["5"].toString();
        // 3. ERC 721 컨트랙트 어드레스
        const ERC1155ContractAddress = event["7"];
        // 4. ERC 721 토큰 ID
        const ERC1155TokenId = eventData["8"].tokenId;
        // 9. ERC 1155 토큰 ID에 해당하는 걸 몇 개 샀는지
        const ERC1155FilledAmount = eventData["9"].toString();
        break;
      }

      case EVENT_TYPE.ERC1155BuyOrderFilled: {
        return;
        const eventData = decodeData(
          ERC1155Event.abi,
          "ERC1155BuyOrderFilled",
          event
        );
        //ERC1155BuyOrderFilled (bytes32 orderHash, address maker, address taker, uint256 nonce, address erc20Token, uint256 erc20FillAmount, tuple[] fees, address erc1155Token, uint256 erc1155TokenId, uint128 erc1155FillAmount)
        // 1. ERC 20 토큰 (ETH : 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE, wETH : )
        const ERC20Token = eventData["4"];
        // 2. ERC 20 토큰의 양(낸 가격)
        const price = eventData["5"].toString();
        // 3. ERC 721 컨트랙트 어드레스
        const ERC1155ContractAddress = eventData["7"];
        // 4. ERC 721 토큰 ID
        const ERC1155TokenId = eventData["8"].tokenId;
        // 9. ERC 1155 토큰 ID에 해당하는 걸 몇 개 샀는지
        const ERC1155FilledAmount = eventData["9"].toString();

        break;
      }

      default:
        break;
    }
  } catch (error) {
    dm.logError({ error, identifier: `wenContractListener`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG }).catch()
    strapi.log.error(`wenContractListener - ${error.message}`)
  }
};


const saleProcessInWen = async ({ data, strapi }) => {
  /**
   * 1. nft update
   * 2. order 지우기
   * 3. sale 로그 찍습니다.
   */

  const nftData = await getNFTDataAtTradeListener({ strapi, data })
  if (!nftData) return
  // 1. NFT update
  await updateNFTAtTradeListener({ strapi, data, nftData })
  // 2. order 지우기
  await deleteSellOrderAtTradeListener({ strapi, data, nftData, isListingAirdrop: false })
  // 3. sale log
  const createdLog = await createSaleLogAtTradeListener({ strapi, data, nftData })

  if (createdLog) {
    await updateSalePoint(
      data.payment_token,
      data.price,
      data.to,
      data.contract_address,
      nftData.token_id,
      createdLog.id,
      { strapi }
    );
  }
  

};

const buyOrderSaleProcessInWen = async ({ data, strapi }) => {

  // buy order 상태 업데이트
  const buyOrder = await strapi.db.query("api::buy-order.buy-order").findOne({
    where: {
      $and: [
        { order_hash: data.buy_order_hash },
        { is_hidden: false },
        { is_sold: false },
        { collection: { contract_address: data.contract_address } },
      ],
    },
    populate: {
      batch_buy_order: {
        populate: {
          buy_orders: {
            select: ["is_sold"]
          },
        },
      },
    },
  });

  if (buyOrder) {
    await strapi.entityService.update("api::buy-order.buy-order", buyOrder.id, {
      data: {
        is_hidden: true,
        is_sold: true,
        token_id: data.token_id,
      },
    });
    let isSoldFalseCount = 0;
    for (let order of buyOrder.batch_buy_order.buy_orders) {
      if (!order.is_sold) {
        isSoldFalseCount++;
      }
    }

    // =isSold = false 가 하나인 경우(마지막 남은 order)인 경우 is_all_sold를 true 로 바꿔준다.
    if (isSoldFalseCount === 1) {
      await strapi.entityService.update(
        "api::batch-buy-order.batch-buy-order",
        buyOrder.batch_buy_order.id,
        {
          data: {
            is_all_sold: true,
          },
        }
      );
    }

    try {
      await updateUserBatchOrderStatusWithoutUpdateBestOffer({
        strapi,
        user: data.to,
      });
      await updateUserBatchOrderStatusWithoutUpdateBestOffer({
        strapi,
        user: data.from,
      });
      await updateBestOffer({
        strapi,
        contractAddress: data.contract_address,
      });
    } catch (error) {
      const dm = DiscordManager.getInstance(strapi)
      dm.logError({ error, identifier: `buyOrderSaleProcessInWen`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG }).catch()
      strapi.log.error(`buyOrderSaleProcessInWen - ${error.message}`)
    }

  }

  const nftData = await getNFTDataAtTradeListener({ strapi, data })
  if (!nftData) return

  // 1. NFT update
  await updateNFTAtTradeListener({ strapi, data, nftData })

  // 2. order 지우기
  await deleteSellOrderAtTradeListener({ strapi, data, nftData })

  // 3. sale log
  await createSaleLogAtTradeListener({ strapi, data, nftData, isOffer: true })

};

const cancelAllOrdersInWen = async ({ data, strapi }) => {
  /**
   * 1. 유저의 (Sell)Order 가 있다면 지웁니다.
   * 1-1. Sell Order가 지워진 것이 있다면 해당 collection들을 업데이트를 해줍니다.
   *
   * 2. 유저의 Batch Buy Order가 있다면 지웁니다.
   * 2-1. Batch Buy Order가 지워진 것이 있으면 해당 collection을 업데이트 해줍니다.
   */

  // 1. Order 중 hash Nonce가 data.newHashNonce 가 아닌 것을 모두 찾습니다.

  let sellOrderList = await strapi.db.query("api::order.order").findMany({
    where: {
      $and: [
        {
          maker: data.maker,
        },
        {
          $not: {
            hash_nonce: data.newHashNonce,
          },
        },
      ],
    },
    populate: {
      nft: {
        select: ["id", "token_id"]
      },
    },
  });

  if (sellOrderList && sellOrderList.length > 0) {
    for (let i = 0; i < sellOrderList.length; i++) {
      const sellOrder = sellOrderList[i];
      let deletedOrder = await strapi.entityService.delete(
        "api::order.order",
        sellOrder.id
      );

      if (deletedOrder){
        await strapi.entityService
        .create("api::nft-trade-log.nft-trade-log", {
          data: {
            ex_type: data.ex_type,
            type: LOG_TYPE_CANCEL_LISTING,
            from: data.maker,
            nft: sellOrder.nft.id,
            tx_hash: data.tx_hash,
            timestamp: dayjs().unix(),
          },
        })

        await updateListingPoint(
          true,
          data.maker,
          sellOrder.contract_address,
          sellOrder.nft.token_id,
          0,
          0,
          { strapi }
        );

        await updateFloorPrice({ strapi }, sellOrder.contract_address)
        await updateOrdersCount({ strapi }, sellOrder.contract_address);

      }
    }
  }

  let buyOrderList = await strapi.db
    .query("api::batch-buy-order.batch-buy-order")
    .findMany({
      where: {
        $and: [
          { is_cancelled: false },
          { is_all_sold: false },
          {
            $not: {
              hash_nonce: data.newHashNonce,
            },
          },
          { maker: data.maker },
        ],
      },
      populate: {
        collection: {
          select: ["contract_address"]
        },
      },
    });

  if (buyOrderList && buyOrderList.length > 0) {
    const contractAddresses = new Set();

    for (let i = 0; i < buyOrderList.length; i++) {
      const buyOrder = buyOrderList[i];
      await strapi.entityService.update(
        "api::batch-buy-order.batch-buy-order",
        buyOrder.id,
        {
          data: {
            is_cancelled: true,
          },
        }
      );
      contractAddresses.add(buyOrder.collection.contract_address);

      await strapi.entityService
        .create("api::nft-trade-log.nft-trade-log", {
          data: {
            ex_type: data.ex_type,
            type: LOG_TYPE_CANCEL_OFFER,
            from: data.maker,
            tx_hash: data.tx_hash,
            timestamp: dayjs().unix(),
          },
        })
    }

    for (const address of contractAddresses) {
      await updateBestOffer({
        strapi,
        contractAddress: address,
      });
    }
  }
};

const cancelProcessInWen = async ({ data, strapi }) => {
  /**
   * 1. Order 가 있다면 지웁니다.
   * 1-1. 오더가 지워진 경우 nft trade log 를 생성합니다.
   * 1-2. collection floor price, orderscount 를 순서대로 업데이트 합니다.
   *
   * 2. order에서 없다면, batch-buy-order에서 확인하고 지웁니다.
   */
  let deletedOrder = await strapi.db.query("api::order.order").delete({
    where: {
      $and: [
        {
          maker: data.maker,
        },
        {
          nonce: data.nonce,
        },
      ],
    },
    populate: {
      nft: {
        select: ["id", "token_id"]
      },
    },
  });

  if (deletedOrder) {
    await strapi.entityService
      .create("api::nft-trade-log.nft-trade-log", {
        data: {
          ex_type: data.ex_type,
          type: LOG_TYPE_CANCEL_LISTING,
          from: data.maker,
          nft: deletedOrder.nft.id,
          tx_hash: data.tx_hash,
          timestamp: dayjs().unix(),
        },
      })
      .catch((e) =>
        console.error(
          `cancelProcessInWen - create nft-trade-log - ${e.message}`
        )
      );

    // CANCEL LISTING HISTORY LOG IF ANY
    await updateListingPoint(
      true,
      data.maker,
      deletedOrder.contract_address,
      deletedOrder.nft.token_id,
      0,
      0,
      { strapi }
    );

    await updateFloorPrice({ strapi }, deletedOrder.contract_address)
      .then((_) => {
        return updateOrdersCount({ strapi }, deletedOrder.contract_address);
      })
      .catch((e) => console.error(e.message));
  } else {
    deletedOrder = await strapi.db
      .query("api::batch-buy-order.batch-buy-order")
      .findOne({
        where: {
          $and: [
            {
              maker: data.maker,
            },
            {
              nonce: data.nonce,
            },
          ],
        },
        populate: {
          collection: {
            select: ["contract_address"]
          },
        },
      });

    if (deletedOrder) {
      await strapi.entityService.update(
        "api::batch-buy-order.batch-buy-order",
        deletedOrder.id,
        {
          data: {
            is_cancelled: true,
          },
        }
      );

      await strapi.entityService
        .create("api::nft-trade-log.nft-trade-log", {
          data: {
            ex_type: data.ex_type,
            type: LOG_TYPE_CANCEL_OFFER,
            from: data.maker,
            tx_hash: data.tx_hash,
            timestamp: dayjs().unix(),
          },
        })

      await updateBestOffer({
        strapi,
        contractAddress: deletedOrder.collection.contract_address,
      });
    }
  }
};

module.exports = { wenContractListener };
