const { ethers, BigNumber } = require("ethers");
const dayjs = require("dayjs");
const {
  jsonRpcProvider,
  NFT_LOG_TYPE,
  PROTOCOL_FEE,
  EVENT_TYPE,

  EX_TYPE,
  SALE_TYPE,
  PAYMENT_TOKEN,
  jsonRpcProvider_cron,
  CONTRACT_ADDRESSES
} = require("../utils/constants");
const ERC721Event = require("../web3/abis/ERC721Event.json");
const ERC1155Event = require("../web3/abis/ERC1155Event.json");
const wenETHEvent = require("../web3/abis/wenETH.json");

const { updateSalePoint } = require("../utils/airdropPrePointHelper");
const {
  updateFloorPrice,
  updateOrdersCount,
  updateOwnerCount,
} = require("./collectionStats");
const { wait } = require("../utils/helpers");
const { updateListingPoint } = require("../utils/airdropPrePointHelper");
const { updateUserBatchOrderStatus } = require("./updateUserBatchOrders");

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

const wenETHContractListener = async ({ strapi, event }) => {
  try {
    switch (event.topics[0]) {
      case EVENT_TYPE.ERC20Transfer: {
        //ERC721SellOrderFilled - ETH로 산 경우
        const eventData = decodeEvent(wenETHEvent.abi, "Transfer", event);

        // console.log("event : ", JSON.stringify(event));
        const from = eventData.from;
        const to = eventData.to;
        const value = BigNumber.from(eventData.value);

        // Check if this is transfer or sale.

        const tx_hash = event.transactionHash
        const tx = await jsonRpcProvider.getTransaction(tx_hash);
      
        
        if (tx.to.toLowerCase() === CONTRACT_ADDRESSES.WEN_EX.toLowerCase()) return 

        // Update From User
        await updateUserBatchOrderStatus({ strapi, user: from });
        // Update From User
        await updateUserBatchOrderStatus({ strapi, user: to });
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error(error.message);
  }
};

function decodeEvent(abi, eventName, log) {
  // 이벤트 ABI 정보 찾기
  const eventAbi = abi.find(
    (entry) => entry.type === "event" && entry.name === eventName
  );

  if (!eventAbi) {
    throw new Error("Event not found in ABI");
  }

  // 인덱스된 입력과 인덱스되지 않은 입력 구분
  const indexedInputs = eventAbi.inputs.filter((input) => input.indexed);
  const nonIndexedInputs = eventAbi.inputs.filter((input) => !input.indexed);

  // 데이터 타입 추출
  const indexedTypes = indexedInputs.map((input) => input.type);
  const nonIndexedTypes = nonIndexedInputs.map((input) => input.type);

  // 데이터 디코드
  const indexedData =
    indexedInputs.length > 0
      ? ethers.utils.defaultAbiCoder.decode(
          indexedTypes,
          ethers.utils.hexConcat(log.topics.slice(1))
        )
      : [];
  const nonIndexedData =
    nonIndexedTypes.length > 0
      ? ethers.utils.defaultAbiCoder.decode(nonIndexedTypes, log.data)
      : [];

  // 결과 객체 생성
  let eventData = {};
  indexedInputs.forEach((input, i) => (eventData[input.name] = indexedData[i]));
  nonIndexedInputs.forEach(
    (input, i) => (eventData[input.name] = nonIndexedData[i])
  );

  return eventData;
}

module.exports = { wenETHContractListener };
