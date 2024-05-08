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

const { decodedMintifyLogs } = require("./listenerhelpers");
const { getNFTDataAtTradeListener, updateNFTAtTradeListener, deleteSellOrderAtTradeListener, createSaleLogAtTradeListener } = require("./helpers");


const mintifyContractListener = async ({ event, strapi, ex_type }) => {
  const dm = DiscordManager.getInstance(strapi)
  try {
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
          await saleProcessInMintify({data, strapi})
        } else if (data.sale_type === SALE_TYPE.BUY) {
          await saleProcessInMintify({data, strapi})
        } else {
  
        }
        console.log(`mintifyContractListener - ${data.sale_type}`, data)
  
        break;
      }
  
      default:
        break;
    }
  } catch (error) {
    dm.logError({ error, identifier: `mintifyContractListener`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG }).catch()
  }
  
};


const saleProcessInMintify = async ({ data, strapi }) => {
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
  await deleteSellOrderAtTradeListener({ strapi, data, nftData })
  // 3. sale log
  await createSaleLogAtTradeListener({ strapi, data, nftData })

};


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
