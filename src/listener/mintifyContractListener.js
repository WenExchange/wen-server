const { ethers, BigNumber } = require("ethers");
const fs = require("fs").promises;

const dayjs = require("dayjs");
const DiscordManager = require("../discord/DiscordManager");
const {
  jsonRpcProvider,
  NFT_LOG_TYPE,
  PROTOCOL_FEE,
  EVENT_TYPE,
  EX_TYPE,
} = require("../utils/constants");

const { Web3 } = require("web3");
const web3 = new Web3();

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

const mintifyContractListener = async ({ event, strapi }) => {
  try {
    switch (event.topics[0]) {
      case "0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31": {
        const result = decodeEventLog(event);

        // [기존] Mintify 에서 왔다.
        // [추가] SALE 인 경우에만 Buy Order (0) / Sell Order (1)
        // [추가] SALE 인 경우에만 Payment Token 종류 - price외에 payment token 이라 추가.

        const data = extractData(result);
        const txHash = event.transactionHash;

        console.log("added : ", txHash);
        console.log("data", data);

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

        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error(error.message);
  }
};

const decodeEventLog = (log) => {
  const MintifyOrderFulfilledABI = [
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "bytes32",
          name: "orderHash",
          type: "bytes32",
        },
        {
          indexed: true,
          internalType: "address",
          name: "offerer",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "zone",
          type: "address",
        },
        {
          indexed: false,
          internalType: "address",
          name: "recipient",
          type: "address",
        },
        {
          components: [
            { internalType: "enum ItemType", name: "itemType", type: "uint8" },
            { internalType: "address", name: "token", type: "address" },
            { internalType: "uint256", name: "identifier", type: "uint256" },
            { internalType: "uint256", name: "amount", type: "uint256" },
          ],
          indexed: false,
          internalType: "struct SpentItem[]",
          name: "offer",
          type: "tuple[]",
        },
        {
          components: [
            { internalType: "enum ItemType", name: "itemType", type: "uint8" },
            { internalType: "address", name: "token", type: "address" },
            { internalType: "uint256", name: "identifier", type: "uint256" },
            { internalType: "uint256", name: "amount", type: "uint256" },
            {
              internalType: "address payable",
              name: "recipient",
              type: "address",
            },
          ],
          indexed: false,
          internalType: "struct ReceivedItem[]",
          name: "consideration",
          type: "tuple[]",
        },
      ],
      name: "OrderFulfilled",
      type: "event",
    },
  ];

  // Decode the data and topics using the ABI
  const decodedLogs = web3.eth.abi.decodeLog(
    MintifyOrderFulfilledABI[0].inputs,
    log.data,
    log.topics.slice(1) // Exclude the event signature topic
  );

  // Map the decoded data to your object structure
  return {
    orderHash: decodedLogs.orderHash,
    offerer: decodedLogs.offerer,
    zone: decodedLogs.zone,
    recipient: decodedLogs.recipient,
    offer: decodedLogs.offer.map((item) => ({
      itemType: item.itemType.toString(),
      token: item.token.toString(),
      identifier: item.identifier.toString(),
      amount: item.amount.toString(),
    })),
    consideration: decodedLogs.consideration.map((item) => ({
      itemType: item.itemType.toString(),
      token: item.token.toString(),
      identifier: item.identifier.toString(),
      amount: item.amount.toString(),
      recipient: item.recipient,
    })),
  };
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
    return {
      error: `UNKNOWN DATA : ${data}`,
    };
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
