const {ethers} = require("ethers");
const { Web3 } = require("web3");
const web3 = new Web3();

function findEventByName(abi, eventName) {
    // ABI 배열을 순회하여 eventName과 일치하는 이벤트 객체를 찾습니다.
    for (let i = 0; i < abi.length; i++) {
      if (abi[i].name === eventName) {
        return abi[i];
      }
    }
    // 일치하는 이벤트가 없는 경우, null을 반환합니다.
    return null;
  }

function decodeData(abi, eventName, event) {
    const eventAbiObject = findEventByName(abi, eventName);
    const eventInputs = eventAbiObject.inputs;
  
    const dataTypes = eventInputs
      .filter((input) => !input.indexed)
      .map((input) => input.type);
    const indexedTypes = eventInputs
      .filter((input) => input.indexed)
      .map((input) => input.type);
  
    const logData = event.data;
    const topics = event.topics;
  
    const decodedIndexed = ethers.utils.defaultAbiCoder.decode(
      indexedTypes,
      ethers.utils.hexConcat(topics.slice(1))
    );
  
    const decodedData = ethers.utils.defaultAbiCoder.decode(dataTypes, logData);
    const eventData = Object.assign({}, decodedIndexed, decodedData);
  
    return eventData;
  }


const decodedMintifyLogs = (log) => {
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

  module.exports = {
    decodeData,
    decodedMintifyLogs
  }