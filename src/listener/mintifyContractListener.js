const { ethers } = require("ethers");
const dayjs = require("dayjs");
const DiscordManager = require("../discord/DiscordManager");
const {
  jsonRpcProvider,
  NFT_LOG_TYPE,
  PROTOCOL_FEE,
  EVENT_TYPE,
  EX_TYPE,
} = require("../utils/constants");
const { decodeData } = require("./listenerhelpers");
const ERC721Event = require("../web3/abis/ERC721Event.json");
const ERC1155Event = require("../web3/abis/ERC1155Event.json");
const {
  updateFloorPrice,
  updateOrdersCount,
  updateOwnerCount,
} = require("./collectionStats");
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

const MintifyOrderFulfilledObject = {
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
        {
          internalType: "enum ItemType",
          name: "itemType",
          type: "uint8",
        },
        { internalType: "address", name: "token", type: "address" },
        {
          internalType: "uint256",
          name: "identifier",
          type: "uint256",
        },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      indexed: false,
      internalType: "struct SpentItem[]",
      name: "offer",
      type: "tuple[]",
    },
    {
      components: [
        {
          internalType: "enum ItemType",
          name: "itemType",
          type: "uint8",
        },
        { internalType: "address", name: "token", type: "address" },
        {
          internalType: "uint256",
          name: "identifier",
          type: "uint256",
        },
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
};

const mintifyContractListener = async ({ event, strapi }) => {
  try {
    switch (event.topics[0]) {
      case "0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31": {
        const result = decodeEventLog(event);
        console.log("result! hash: ", event.transactionHash, "\n", result);

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
      itemType: item.itemType,
      token: item.token,
      identifier: item.identifier.toString(),
      amount: item.amount.toString(),
    })),
    consideration: decodedLogs.consideration.map((item) => ({
      itemType: item.itemType,
      token: item.token,
      identifier: item.identifier.toString(),
      amount: item.amount.toString(),
      recipient: item.recipient,
    })),
  };
};

module.exports = { mintifyContractListener };
