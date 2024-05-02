const { ethers, BigNumber } = require("ethers");

const dayjs = require("dayjs");
const DiscordManager = require("../discord/DiscordManager");
const {
  jsonRpcProvider,
  NFT_LOG_TYPE,
  PROTOCOL_FEE,
  EVENT_TYPE,
  EX_TYPE,
  SALE_TYPE,
  DISCORD_INFO,
} = require("../utils/constants");

const {
  updateFloorPrice,
  updateOrdersCount,
  updateOwnerCount,
} = require("./collectionStats");
const { decodedMintifyLogs } = require("./listenerhelpers");
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

const mintifyContractListener = async ({ event, strapi, ex_type }) => {
  switch (event.topics[0]) {
    case EVENT_TYPE.OrderFulfilled: {
      const result = decodedMintifyLogs(event);

      // [기존] Mintify 에서 왔다.
      // [추가] SALE 인 경우에만 Buy Order (0) / Sell Order (1)
      // [추가] SALE 인 경우에만 Payment Token 종류 - price외에 payment token 이라 추가.

      let _data
      try {
        _data = extractData(result);
      } catch (error) {
        console.error(error.message)
        return 
      }

      const data = {
        ..._data,
        ex_type,
        sale_type: _data.sale_type === 0 ? SALE_TYPE.BUY : SALE_TYPE.SELL,
        payment_token: _data.paymentToken,
        price: _data.price,
        from: _data.from,
        to: _data.to,
        tx_hash: event.transactionHash,
        timestamp: dayjs().unix(),
        token_id: _data.tokenId,
        contract_address: _data.contract,
      };

      // data 의 생김새
      // {
      //   from: data.offerer, // NFT 를 보내는 사람
      //   to: data.recipient, // NFT 를 받는사람
      //   price,  // 단위는 ETHER
      //   paymentToken: 1, // 1: ETH , 2 : WETH, 5 : WENETH
      //   sale_type: 1, // 0: BUY , 1: SELL
      //   tokenId: data.offer[0].identifier, // NFT Token ID
      //   contract: data.offer[0].token, // NFT CONTRACT
      // }

      if (data.sale_type === SALE_TYPE.SELL) {
        const checkedInfo = await checkIsValidSellOrderSaleAndGetData({
          strapi,
          data,
        });
        if (typeof checkedInfo === "boolean") return;
        const { nftData, existedTradeLog } = checkedInfo;
        await sellOrderSaleProcessInMintify({ data, strapi, nftData })

      } else if (data.sale_type === SALE_TYPE.BUY) {
        const checkedInfo = await checkIsValidBuyOrderSaleAndGetData({
          strapi,
          data,
        });
        if (typeof checkedInfo === "boolean") return;
        const { nftData, existedTradeLog } = checkedInfo;
        await buyOrderSaleProcessInElement({ data, strapi, nftData }).catch((e) =>
          console.error(e.message)
        );
      }

      break;
    }

    default:
      break;
  }
};

const checkIsValidSellOrderSaleAndGetData = async ({ strapi, data }) => {
  console.log(
    `${data?.ex_type} | ${data.sale_type} | ${data.contract_address} | ${data.token_id} - checkIsValidSellOrderSaleAndGetData`, data
  );
  const dm = DiscordManager.getInstance()
  /**
   * Validations
   * 1. DB 에 있는 NFT 인지 체크합니다.
   * 2. 이미 tradelog 에 추가이력이 있는지 체크합니다.
   * 3. sell_order 가 있는지 체크합니다. (sell order 가 없는 nft 가 sale 이 일어날 수 없음.)
   */

  try {
    const nftData = await strapi.db.query("api::nft.nft").findOne({
      where: {
        $and: [
          {
            token_id: data.token_id,
          },
          {
            collection: { contract_address: data.contract_address },
          }
        ]
      },
      populate: {
        sell_order: true,
      },
    });

    if (!nftData) {
      return false;
    }
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
      dm.logError({ error: new Error(`contract_address: ${data.contract_address} | token_id: ${data.token_id}`), identifier: `${data?.ex_type} | ${data.sale_type} | checkIsValidSellOrderSaleAndGetData | existedTradeLog`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG })

      return false;
    }

    // 외부 거래소에서 일어난 거래는 sell_order 가 없을 수 있다.
    // if (!nftData.sell_order) {
    //   console.log(
    //     `[MIN] ${data.sale_type} - Already deleted sell_order - contract_address: ${data.contract_address} | token_id: ${data.token_id}`
    //   );
    //   dm.logError({error: new Error(`${data.sale_type} - Already deleted sell_order - contract_address: ${data.contract_address} | token_id: ${data.token_id}`), identifier: "[MIN] checkIsValidSellOrderSaleAndGetData", channelId:DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG })
    //   return false
    // }

    return { nftData, existedTradeLog };
  } catch (error) {
    dm.logError({ error, identifier: `${data?.ex_type} | ${data.sale_type} | checkIsValidSellOrderSaleAndGetData`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG })
    return false;
  }
};

const checkIsValidBuyOrderSaleAndGetData = async ({ strapi, data }) => {
  const dm = DiscordManager.getInstance()
  console.log(
    `${data?.ex_type} | ${data.sale_type} | ${data.contract_address} | ${data.token_id} - checkIsValidBuyOrderSaleAndGetData`, data
  );
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
        $and: [
          {
            token_id: data.token_id,
          },
          {
            collection: { contract_address: data.contract_address },
          },
          {
            collection: {
              publishedAt: {
                $notNull: true
              }
            }
          }
        ]
      },
      populate: {
        sell_order: true,
      },
    });

    if (!nftData) {
      return false;
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
      dm.logError({ error: new Error(`contract_address: ${data.contract_address} | token_id: ${data.token_id}`), identifier: `${data?.ex_type} | ${data.sale_type} | checkIsValidBuyOrderSaleAndGetData | existedTradeLog`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG })
      return false;
    }

    return { nftData, existedTradeLog };
  } catch (error) {
    dm.logError({ error, identifier: `${data?.ex_type} | ${data.sale_type} | checkIsValidBuyOrderSaleAndGetData`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG })
    return false;
  }
};

const sellOrderSaleProcessInMintify = async ({ data, strapi, nftData }) => {
  const dm = DiscordManager.getInstance()
  console.log(
    `${data?.ex_type} | ${data.sale_type} | ${nftData.name} | ${nftData.token_id} - Start`
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
  // order 있다면 지우고 로그 찍어주긔
  if (nftData.sell_order) {
    await deleteSellOrderProcess({ data, strapi, nftData, dm })
  }

  // update NFT
  try {
      await strapi.db.query("api::nft.nft").update({
        where: {
          id: nftData.id
        },
        data: {
          last_sale_price: data.price,
          owner: data.to,
        },
      })

  } catch (error) {
    dm.logError({ error, identifier: `${data?.ex_type} | ${data?.sale_type} | sellOrderSaleProcessInMintify | updateNFT`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG })
    throw new Error(error)
  }

  try {
    await updateOwnerCount({ strapi }, data.contract_address);
  } catch (error) {
    dm.logError({ error, identifier: `${data?.ex_type} | ${data?.sale_type} | sellOrderSaleProcessInMintify | updateOwnerCount`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG })
  }

  // SALE log
  try {
    await strapi.entityService
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
  } catch (error) {
    dm.logError({ error, identifier: `${data?.ex_type} | ${data?.sale_type} | sellOrderSaleProcessInMintify | Create Sale Log`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG })
    throw new Error(error)
  }

  console.log(
    `${data?.ex_type} | ${data.sale_type} | ${nftData.name} | ${nftData.token_id} - Complete`
  );

};



const buyOrderSaleProcessInElement = async ({ data, strapi, nftData }) => {
  console.log(
    `${data?.ex_type} | ${data.sale_type} | ${nftData.name} | ${nftData.token_id} - Start`
  );

  /**
   * Wen DB 에 존재하는 NFT 임이 가정입니다. (Validation 완료)
   * 1. [TODO] offer, bid table 의 데이터 지우기
   * 2. Wen 에 리스팅이 되어있으면 지워주기
   * 2. nft 의 last_sale_price 와 Owner 를 업데이트 해줍니다.
   * 3. 그 이후에 collection 의 owner count, floor price 를 순서대로 업데이트 해줍니다.
   * 4. sale 로그 찍습니다.
   *
   */

  const dm = DiscordManager.getInstance()

  // TODO offer 테이블 지워주기
  if (nftData.sell_order) {
    await deleteSellOrderProcess({ data, strapi, nftData, dm })
  }

  // update NFT
  try {
    await strapi.entityService
      .update("api::nft.nft", nftData.id, {
        data: {
          last_sale_price: data.price,
          owner: data.to,
        },
      })
  } catch (error) {
    dm.logError({ error, identifier: `${data?.ex_type} | ${data?.sale_type} | buyOrderSaleProcessInElement | updateNFT`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG })
    throw new Error(error)
  }
  try {
    await updateOwnerCount({ strapi }, data.contract_address);
  } catch (error) {
    dm.logError({ error, identifier: `${data?.ex_type} | ${data?.sale_type} | buyOrderSaleProcessInElement | updateOwnerCount`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG })
  }

  // SALE log
  try {
    await strapi.entityService
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
  } catch (error) {
    dm.logError({ error, identifier: `${data?.ex_type} | ${data?.sale_type} | buyOrderSaleProcessInElement | Create Sale Log`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG })
    throw new Error(error)
  }

  console.log(
    `${data?.ex_type} | ${data.sale_type} | ${nftData.name} | ${nftData.token_id} - Complete`
  );

};

const deleteSellOrderProcess = async ({ nftData, data, strapi, dm }) => {
  try {
    const deletedOrder = await strapi.entityService
      .delete("api::order.order", nftData.sell_order.id, {
        populate: { nft: true },
      })

    if (deletedOrder) {
      await strapi.entityService
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
      await updateListingPoint(
        true,
        data.from,
        data.contract_address,
        nftData.token_id,
        0,
        0,
        { strapi }
      )
      await updateFloorPrice({ strapi }, data.contract_address)
      await updateOrdersCount({ strapi }, data.contract_address);

    }

  } catch (error) {
    console.error(`${data?.ex_type} ${data.sale_type} - error - ${error.message}`);
    dm.logError({ error, identifier: `${data?.ex_type} | ${data.sale_type} | deleteSellOrderProcess`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG })
  }
}

const extractData = (data) => {
  if (data.offer[0].itemType == "2") {
    // Sell Order - 내 NFT 팔게!
    const price = sumAmountsInEther(data.consideration);
    console.log("sum Amounts In Ether : Sell Order : ", price);

    return {
      from: data.offerer,
      to: data.recipient,
      price,
      paymentToken: 1, // ETH
      sale_type: 1,
      tokenId: data.offer[0].identifier,
      contract: data.offer[0].token,
    };
  } else if (data.offer[0].itemType == "1") {
    // Buy Order - 내가 x WETH 주고 NFT 살게!
    console.log("buy order :", extractPriceAndTokenId(data));
    const { price, tokenId, contract } = extractPriceAndTokenId(data);
    return {
      from: data.recipient,
      to: data.offerer,
      price,
      paymentToken: 2, // WETH
      sale_type: 0,
      tokenId,
      contract,
    };
  } else {
    throw new Error("UNKNOWN DATA")
  }
};
const sumAmountsInEther = (consideration) => {
  // BigNumber를 사용하여 모든 amount 값을 더함
  let totalAmount = consideration.reduce((acc, item) => {
    return acc.add(ethers.BigNumber.from(item.amount));
  }, ethers.BigNumber.from(0)); // 초기값을 BigNumber 0으로 설정

  // 더한 결과를 이더 단위로 변환
  let totalInEther = ethers.utils.formatEther(totalAmount);

  return totalInEther; // 이더 단위의 문자열 결과 반환
};

const extractPriceAndTokenId = (data) => {
  // price는 offer 배열의 첫 번째 요소의 amount를 이더 단위로 변환한 값
  const priceInWei = ethers.BigNumber.from(data.offer[0].amount);
  const priceInEther = ethers.utils.formatEther(priceInWei);

  // tokenId는 consideration 배열에서 itemType이 2인 객체의 identifier 값
  const tokenItem = data.consideration.find((item) => item.itemType === "2");
  const tokenId = tokenItem ? tokenItem.identifier : null;
  const contract = tokenItem ? tokenItem.token : null;
  return {
    price: priceInEther,
    tokenId: tokenId,
    contract: contract,
  };
};

module.exports = { mintifyContractListener };
