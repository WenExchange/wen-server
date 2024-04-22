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
} = require("../utils/constants");
const { decodeData } = require("./listenerhelpers");
const ERC721Event = require("../web3/abis/ERC721Event.json");
const ERC1155Event = require("../web3/abis/ERC1155Event.json");
const { updateSalePoint } = require("../utils/airdropPrePointHelper");
const {
  updateFloorPrice,
  updateOrdersCount,
  updateOwnerCount,
} = require("./collectionStats");
const { wait } = require("../utils/helpers");
const { updateListingPoint } = require("../utils/airdropPrePointHelper");

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

const wenContractListener = async ({ event, strapi }) => {
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
        const ERC721TokenId = eventData["8"].toNumber();

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

        const checkedInfo = await checkIsValidSellOrderSaleAndGetData({
          strapi,
          data,
        });
        if (typeof checkedInfo === "boolean") return;
        const { nftData, existedTradeLog } = checkedInfo;
        await sellOrderSaleProcessInWen({ data, strapi, nftData }).catch((e) =>
          console.error(e.message)
        );
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
        const ERC721TokenId = eventData["8"].toNumber();

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

        console.log(
          "FIRED : ERC721BuyOrderFilled",
          eventData["0"].toString(),
          "\n\n\n",
          data
        );

        const checkedInfo = await checkIsValidBuyOrderSaleAndGetData({
          strapi,
          data,
        });
        if (typeof checkedInfo === "boolean") return;
        const { nftData, existedTradeLog } = checkedInfo;
        await buyOrderSaleProcessInWen({ data, strapi, nftData }).catch((e) =>
          console.error(e.message)
        );
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

        await cancelProcessInWen({ data, strapi }).catch((e) =>
          console.error(e.message)
        );

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
    console.error(error.message);
  }
};

const checkIsValidSellOrderSaleAndGetData = async ({ strapi, data }) => {
  console.log(
    `[WEN] ERC721SellOrderFilled - 1. checkIsValidSellOrderSaleAndGetData Start data:\n`,
    data
  );
  /**
   * Validations
   * 1. DB 에 있는 NFT 인지 체크합니다.
   * 2. 이미 tradelog 에 추가이력이 있는지 체크합니다.
   * 3. sell_order 가 있는지 체크합니다. (sell order 가 없는 nft 가 sale 이 일어날 수 없음.)
   */

  try {
    const nftData = await strapi.db.query("api::nft.nft").findOne({
      where: {
        token_id: data.token_id,
        collection: { contract_address: data.contract_address },
      },
      populate: {
        sell_order: true,
        collection: true,
      },
    });

    if (!nftData) {
      console.log(
        `[WEN] ERC721SellOrderFilled - There is no nft data - contract_address: ${data.contract_address} | token_id: ${data.token_id}`
      );
      return false;
    }
    if (!nftData.sell_order) {
      throw new Error("nftData sell_order can't be an empty");
    }

    /**
     * 하나의 NFT token id 당 하나의 hash
     */
    const existedTradeLog = await strapi.db
      .query("api::nft-trade-log.nft-trade-log")
      .findOne({
        populate: {
          nft: true,
        },
        where: {
          $and: [
            {
              tx_hash: data.tx_hash,
            },
            {
              from: data.from,
            },
            {
              to: data.to,
            },
            {
              nft: {
                id: nftData.id,
              },
            },
          ],
        },
      });

    if (existedTradeLog) {
      console.log(
        `[WE N] ERC721SellOrderFilled - existedTradeLog - ${existedTradeLog}`
      );
      return false;
    }

    return { nftData, existedTradeLog };
  } catch (error) {
    console.error(
      `[WEN] checkIsValidSellOrderSaleAndGetData - error - ${error.message}`
    );
    return false;
  }
};

const checkIsValidBuyOrderSaleAndGetData = async ({ strapi, data }) => {
  /**
   * Validations
   * 1. DB 에 있는 NFT 인지 체크합니다.
   * 2. 이미 tradelog 에 추가이력이 있는지 체크합니다.
   * 3. sell_order 는 체크하지 않습니다. (Sell Order  와 다른점.)
   * 4. TODO. bid table 체쿠
   */

  try {
    const nftData = await strapi.db.query("api::nft.nft").findOne({
      where: {
        token_id: data.token_id,
        collection: { contract_address: data.contract_address },
      },
      populate: {
        collection: true,
      },
    });

    if (!nftData) {
      console.log(`[WEN] no nft data`);
      return false;
    }

    /**
     * 하나의 NFT token id, orderHash, token_id 까지 같아야함.
     */
    console.log("nft id", nftData.id);
    const existedTradeLog = await strapi.db
      .query("api::nft-trade-log.nft-trade-log")
      .findOne({
        populate: {
          nft: true,
        },
        where: {
          $and: [
            {
              tx_hash: data.tx_hash,
            },
            {
              from: data.from,
            },
            {
              to: data.to,
            },
            {
              nft: {
                id: nftData.id,
              },
            },
            { buy_order_hash: data.buy_order_hash },
          ],
        },
      });

    if (existedTradeLog) {
      console.log(
        `[WEN] checkIsValidBuyOrderSaleAndGetData - existedTradeLog - ${existedTradeLog}`
      );
      return false;
    }

    return { nftData, existedTradeLog };
  } catch (error) {
    console.error(
      `[WEN] checkIsValidBuyOrderSaleAndGetData - error - ${error.message}`
    );
    return false;
  }
};

const sellOrderSaleProcessInWen = async ({ data, strapi, nftData }) => {
  console.log(
    `[WEN] ERC721SellOrderFilled - 2. sellOrderSaleProcessInWen Start | data:\n`,
    data
  );
  /**
   * Wen DB 에 존재하는 NFT 임이 가정입니다. (Validation 완료)
   * Sell Order 가 존재하는 상태에서만 이 이벤트가 일어날 수 있습니다.
   * 1. order 를 지웁니다.
   * 2. nft trade log 에 LOG_TYPE_AUTO_CANCEL_LISTING 으로 로그를 찍습니다.
   * 3. nft 의 last_sale_price 와 Owner 를 업데이트 해줍니다.
   * 4. 그 이후에 collection 의 owner count, floor price 를 순서대로 업데이트 해줍니다.
   * 5. sale 로그 찍습니다.
   *
   */
  // order 지우고 로그 찍어주긔

  // TODO : test 끝나고 지우기

  if (nftData.sell_order) {
    console.log(
      `[WEN] ERC721SellOrderFilled (optional) delete sell order id - ${nftData.sell_order.id} `
    );
    await strapi.entityService
      .delete("api::order.order", nftData.sell_order.id, {
        populate: { nft: true },
      })
      .then((deletedOrder) => {
        return strapi.entityService
          .create("api::nft-trade-log.nft-trade-log", {
            data: {
              ex_type: data.ex_type,
              type: LOG_TYPE_AUTO_CANCEL_LISTING,
              from: data.from,
              nft: nftData.id,
              tx_hash: data.tx_hash,
              timestamp: dayjs().unix(),
            },
          })
          .then((_) => {
            return updateFloorPrice({ strapi }, data.contract_address)
              .then((_) => {
                return updateOrdersCount({ strapi }, data.contract_address);
              })
              .catch((e) => console.error(e.message));
          });
      })
      .catch((e) => console.error(e.message));
  }

  // update NFT

  await strapi.entityService
    .update("api::nft.nft", nftData.id, {
      data: {
        last_sale_price: data.price,
        owner: data.to,
      },
    })
    .then((_) => {
      console.log(
        `[WEN] ERC721SellOrderFilled - 3. nft id: ${nftData.id} updated owner ${nftData.owner} -> ${data.to}`
      );
      // update owner count after nft owner update
      return updateOwnerCount({ strapi }, data.contract_address);
    })
    .catch((e) =>
      console.error(`sellOrderSaleProcessInWen - update nft - ${e.message}`)
    );
  // SALE log

  const createdLog = await strapi.entityService
    .create("api::nft-trade-log.nft-trade-log", {
      data: {
        ex_type: data.ex_type,
        sale_type: data.sale_type,
        payment_token: data.payment_token,
        type: LOG_TYPE_SALE,
        price: data.price,
        from: data.from,
        to: data.to,
        nft: nftData.id,
        tx_hash: data.tx_hash,
        timestamp: dayjs().unix(),
      },
    })
    .catch((e) => console.error(e.message));

  console.log(
    `[WEN] ERC721SellOrderFilled - 4. nft id: ${nftData.id} created SALE log id ${createdLog.id} `
  );

  await updateSalePoint(
    data.payment_token,
    data.price,
    data.to,
    data.contract_address,
    nftData.token_id,
    createdLog.id,
    { strapi }
  );

  console.log(
    `[WEN] ERC721SellOrderFilled - 5. nft id: ${nftData.id} update sale point `
  );
};

const buyOrderSaleProcessInWen = async ({ data, strapi, nftData }) => {
  /**
   * Wen DB 에 존재하는 NFT 임이 가정입니다. (Validation 완료)
   * 1. offer, bid table 의 데이터 업데이트
   * 2. 리스팅이 되어있는 시점에서 Offer 를 받을때 기존 리스팅 삭제.
   * 2. nft 의 last_sale_price 와 Owner 를 업데이트 해줍니다.
   * 3. 그 이후에 collection 의 owner count, floor price 를 순서대로 업데이트 해줍니다.
   * 4. sale 로그 찍습니다.
   */

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
      collection: true,
      token: true,
      batch_buy_order: {
        populate: {
          buy_orders: true,
        },
      },
    },
  });
  console.log("buyOrder  !!! ", buyOrder);
  await strapi.entityService.update("api::buy-order.buy-order", buyOrder.id, {
    data: {
      is_hidden: true,
      is_sold: true,
      token_id: data.token_id,
    },
  });

  // batch buy order 상태 업데이트 해주기

  // update NFT
  await strapi.entityService
    .update("api::nft.nft", nftData.id, {
      data: {
        last_sale_price: data.price,
        owner: data.to,
      },
    })
    .then((_) => {
      // update owner count after nft owner update
      return updateOwnerCount({ strapi }, data.contract_address);
    })
    .catch((e) => console.error(e.message));

  // SALE log
  await strapi.entityService
    .create("api::nft-trade-log.nft-trade-log", {
      data: {
        ex_type: data.ex_type,
        sale_type: data.sale_type,
        payment_token: data.payment_token,
        type: LOG_TYPE_COLLECTION_OFFER,
        price: data.price,
        from: data.from,
        to: data.to,
        nft: nftData.id,
        tx_hash: data.tx_hash,
        timestamp: dayjs().unix(),
        buy_order_hash: data.buy_order_hash,
      },
    })
    .catch((e) => console.error(e.message));
};

const cancelProcessInWen = async ({ data, strapi }) => {
  /**
   * 1. Order 가 있다면 지웁니다.
   * 2. 오더가 지워진 경우 nft trade log 를 생성합니다.
   * 3. collection floor price, orderscount 를 순서대로 업데이트 합니다.
   */
  const result = await strapi.db.query("api::order.order").delete({
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
      nft: true,
    },
  });

  if (result && result.id && result.nft) {
    await strapi.entityService
      .create("api::nft-trade-log.nft-trade-log", {
        data: {
          ex_type: data.ex_type,
          type: LOG_TYPE_CANCEL_LISTING,
          from: data.maker,
          nft: result.nft.id,
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
      result.contract_address,
      result.nft.token_id,
      0,
      0,
      { strapi }
    );

    await updateFloorPrice({ strapi }, result.contract_address)
      .then((_) => {
        return updateOrdersCount({ strapi }, result.contract_address);
      })
      .catch((e) => console.error(e.message));
  }
};

module.exports = { wenContractListener };
