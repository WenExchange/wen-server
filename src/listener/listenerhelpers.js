const {ethers} = require("ethers");

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

  module.exports = {
    decodeData
  }