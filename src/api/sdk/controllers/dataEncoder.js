const { Web3 } = require("web3");
const collection = require("../../collection/controllers/collection");
const web3 = new Web3();

const SELECTOR_fillBatchSignedERC721Order = "0xa4d73041";
const SELECTOR_fillBatchSignedERC721Orders = "0x149b8ce6";

const ETH_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

function splitAddressToTakerParts(address) {
  const normalizedAddress = address.toLowerCase().replace("0x", "");
  const takerPart1 = normalizedAddress.slice(0, 16);
  const takerPart2 = normalizedAddress.slice(16);
  return { takerPart1, takerPart2 };
}

function encodeData1(
  signatureType,
  reserved,
  startNonce,
  v,
  listingTime,
  maker
) {
  // Convert inputs to BigInts for bit manipulation
  signatureType = BigInt(signatureType);
  reserved = BigInt(reserved);
  startNonce = BigInt(startNonce);
  v = BigInt(v);
  listingTime = BigInt(listingTime);
  maker = BigInt(maker); // Assuming maker is a hexadecimal string

  // Calculate each field's bit shift based on its position in data1
  const data1 =
    (signatureType << BigInt(256 - 8)) +
    (reserved << BigInt(256 - 16)) +
    (startNonce << BigInt(256 - 56)) +
    (v << BigInt(256 - 64)) +
    (listingTime << BigInt(256 - 96)) +
    maker;

  return data1.toString();
}

function encodeData2(takerPart1, expiryTime, erc20Token) {
  const bitsForErc20Token = 160n;
  const bitsForExpiryTime = 32n;
  const bitsForTakerPart1 = 64n;

  const erc20TokenBigInt = BigInt(`${erc20Token}`);
  const expiryTimeBigInt = BigInt(expiryTime);
  const takerPart1BigInt = BigInt(`0x${takerPart1}`);

  const data2 =
    (takerPart1BigInt << (bitsForExpiryTime + bitsForErc20Token)) +
    (expiryTimeBigInt << bitsForErc20Token) +
    erc20TokenBigInt;
  return data2.toString();
}

function encodeData3(takerPart2, platformFeeRecipient) {
  const bitsForPlatformFeeRecipient = 160n;
  const bitsForTakerPart2 = 96n;

  const platformFeeRecipientBigInt = BigInt(`${platformFeeRecipient}`);
  const takerPart2BigInt = BigInt(`0x${takerPart2}`);

  const data3 =
    (takerPart2BigInt << bitsForPlatformFeeRecipient) +
    platformFeeRecipientBigInt;
  return data3.toString();
}

function encodeCollectionsToBytes(collections) {
  let bytesString = "0x";

  collections.forEach((collection) => {
    const {
      filledIndexListPart1,
      nftAddress,
      collectionType,
      itemsCount,
      filledCount,
      filledIndexListPart2,
      platformFeePercentage,
      royaltyFeePercentage,
      royaltyFeeRecipient,
      items,
    } = collection;

    // nftAddress 앞의 '0x' 제거
    const nftAddressWithoutPrefix = nftAddress.slice(2);

    // head1: filledIndexListPart1 (24 characters) + nftAddress (40 characters)
    let head1 = filledIndexListPart1 + nftAddressWithoutPrefix;

    // head2를 구성하는 각 부분을 16진수 문자열로 변환
    const collectionTypeHex = collectionType.toString(16).padStart(2, "0");
    const itemsCountHex = itemsCount.toString(16).padStart(2, "0");
    const filledCountHex = filledCount.toString(16).padStart(2, "0");
    const unusedHex = "00";
    const filledIndexListPart2Hex = filledIndexListPart2.padStart(8, "0");
    const platformFeePercentageHex = platformFeePercentage
      .toString(16)
      .padStart(4, "0");
    const royaltyFeePercentageHex = royaltyFeePercentage
      .toString(16)
      .padStart(4, "0");
    const royaltyFeeRecipientWithoutPrefix = royaltyFeeRecipient.slice(2);

    // head2: collectionType + itemsCount + filledCount + unused + filledIndexListPart2 + platformFeePercentage + royaltyFeePercentage + royaltyFeeRecipient
    let head2 =
      collectionTypeHex +
      itemsCountHex +
      filledCountHex +
      unusedHex +
      filledIndexListPart2Hex +
      platformFeePercentageHex +
      royaltyFeePercentageHex +
      royaltyFeeRecipientWithoutPrefix;

    // 컬렉션의 바이트 문자열에 head1과 head2 추가
    bytesString += head1 + head2;

    // 아이템 데이터 추가
    items.forEach((item) => {
      // 아이템 데이터를 bytesString에 추가
      bytesString += item;
    });
  });

  return bytesString;
}

// 하나의 BatchSigned를 다루는 경우
function createOrderData(orderList, taker) {
  // 하나의 batchSigned이기 때문에 같음.
  let order = orderList[0];

  //   console.log("HERE!!! , ", order);
  let exData = JSON.parse(order.exchange_data);
  let encodedData1 = encodeData1(
    0,
    0,
    exData.startNonce,
    exData.v,
    order.listing_time,
    order.maker
  );
  const { takerPart1, takerPart2 } = splitAddressToTakerParts(taker);

  let encodedData2 = encodeData2(
    takerPart1,
    order.expiration_time,
    exData.paymentToken
  );

  let encodedData3 = encodeData3(
    takerPart2,
    order.collection.protocol_fee_receiver
  );

  let collectionsItemIndexList = {};
  for (let order of orderList) {
    const { collectionContract, itemIndex, totalItemsCount, items } =
      findItemIndexInCollections(
        exData,
        order.contract_address,
        order.token_id
      );

    if (!collectionsItemIndexList[collectionContract]) {
      collectionsItemIndexList[collectionContract] = {
        itemsIndex: [],
        items: [],
      };
    }

    collectionsItemIndexList[collectionContract]["itemsIndex"].push(itemIndex);

    collectionsItemIndexList[collectionContract]["items"] = items;
    collectionsItemIndexList[collectionContract].nftAddress =
      order.contract_address;
    // collectionType: 0 - basicCollection, 1 - collection
    collectionsItemIndexList[collectionContract].collectionType = 0;
    collectionsItemIndexList[collectionContract].itemsCount = totalItemsCount;
    collectionsItemIndexList[collectionContract].platformFeePercentage =
      order.collection.protocol_fee_point;
    collectionsItemIndexList[collectionContract].royaltyFeePercentage =
      order.collection.royalty_fee_point;
    collectionsItemIndexList[collectionContract].royaltyFeeRecipient =
      order.collection.royalty_fee_receiver;
  }

  let collectionData = [];
  //   console.log("exData.basicCollections", exData.basicCollections);
  //   console.log("collectionsItemIndexList", collectionsItemIndexList);
  // 객체의 모든 키(key)를 순회하는 for...in 루프
  for (const exDataCollection of exData.basicCollections) {
    if (exDataCollection.nftAddress in collectionsItemIndexList) {
      let coll;
      //   console.log(
      //     "collectionsItemIndexList ",
      //     collectionsItemIndexList[exDataCollection.nftAddress]
      //   );
      const data = collectionsItemIndexList[exDataCollection.nftAddress];
      const itemIndexList =
        collectionsItemIndexList[exDataCollection.nftAddress].itemsIndex;

      const { filledIndexListPart1, filledIndexListPart2 } =
        generateFilledIndexListParts(itemIndexList);

      const formattedItemsList = createFormattedItemsList(data.items);

      coll = {
        filledIndexListPart1,
        nftAddress: data.nftAddress,
        collectionType: data.collectionType,
        itemsCount: data.itemsCount,
        filledCount: itemIndexList.length,
        filledIndexListPart2,
        platformFeePercentage: exDataCollection.platformFee,
        royaltyFeePercentage: exDataCollection.royaltyFee,
        royaltyFeeRecipient: exDataCollection.royaltyFeeRecipient,
        // 아래서 index 구할 때 토큰 아이디랑 가격도 같이 해서 가져오면 됨
        items: formattedItemsList,
      };
      //   console.log("collection data 22  : ", collection, exDataCollection);

      collectionData.push(coll);
    } else {
      const formattedItemsList = createFormattedItemsList(
        exDataCollection.items
      );
      const { filledIndexListPart1, filledIndexListPart2 } =
        generateFilledIndexListParts([]);
      const collection = {
        filledIndexListPart1,
        nftAddress: exDataCollection.nftAddress,
        collectionType: 0,
        itemsCount: exDataCollection.items.length,
        filledCount: 0,
        filledIndexListPart2,
        platformFeePercentage: exDataCollection.platformFee,
        royaltyFeePercentage: exDataCollection.royaltyFee,
        royaltyFeeRecipient: exDataCollection.royaltyFeeRecipient,
        // 아래서 index 구할 때 토큰 아이디랑 가격도 같이 해서 가져오면 됨
        items: formattedItemsList,
      };

      //   console.log("collection data 11  : ", collection, exDataCollection);
      collectionData.push(collection);
    }
  }

  //   console.log("hehe", collectionData);

  const collectionBytes = encodeCollectionsToBytes(collectionData);

  let parameterData = createFillBatchSignedOrder({
    encodedData1,
    encodedData2,
    encodedData3,
    r: exData.r,
    s: exData.s,
    bytes: collectionBytes,
  });

  // console.log("data !! ", {
  //   encodedData1,
  //   encodedData2,
  //   encodedData3,
  //   r: exData.r,
  //   s: exData.s,
  //   bytes: collectionBytes,
  // });

  return {
    parameterData,
    data: {
      encodedData1,
      encodedData2,
      encodedData3,
      r: exData.r,
      s: exData.s,
      bytes: collectionBytes,
    },
  };
}

// 여러 개의 BatchSigned를 다루는 경우
function createOrdersData(orderList, taker) {
  // GetSignedOrderObject
  // BatchSigned 별로 나누어야함.

  let firstRoyaltyFeeReciepient;

  let orderBySigned = {};
  for (let order of orderList) {
    if (!firstRoyaltyFeeReciepient) {
      firstRoyaltyFeeReciepient = order.collection.royalty_fee_receiver;
    }

    let planeHash = getPlaneHash(order.hash);
    if (!orderBySigned[planeHash]) {
      orderBySigned[planeHash] = {
        orders: [],
      };
    }
    orderBySigned[planeHash].orders.push(order);
  }

  const signedList = [];
  for (const key in orderBySigned) {
    const _orderList = orderBySigned[key].orders;
    const paramData = createOrderData(_orderList, taker).data;
    signedList.push([
      paramData.encodedData1,
      paramData.encodedData2,
      paramData.encodedData3,
      paramData.r, // 실제 bytes32 값
      paramData.s, // 실제 bytes32 값
      paramData.bytes, // 실제 bytes 데이터
    ]);
  }

  const { additional1, additional2 } = createAdditionalValues(
    "0",
    ETH_ADDRESS,
    "0",
    firstRoyaltyFeeReciepient
  );

  const parameterData = createFillBatchSignedOrders({
    signedList,
    additional1,
    additional2,
  });

  return { parameterData };
}

function getPlaneHash(orderHash) {
  return orderHash.split("_")[0];
}

function createAdditionalValues(
  withdrawETHAmountStr,
  erc20TokenStr,
  revertIfIncompleteStr,
  royaltyFeeRecipientStr
) {
  // 스트링을 BigInt로 변환
  const withdrawETHAmount = BigInt(withdrawETHAmountStr);
  const erc20Token = BigInt(erc20TokenStr);
  const revertIfIncomplete = BigInt(revertIfIncompleteStr);
  const royaltyFeeRecipient = BigInt(royaltyFeeRecipientStr);

  // Shift 값
  const shift160Bits = BigInt(160);
  const shift248Bits = BigInt(248); // revertIfIncomplete를 위한 shift 값

  // additional1 생성
  const additional1 = (withdrawETHAmount << shift160Bits) | erc20Token;

  // additional2 생성
  // 여기서 revertIfIncomplete는 가장 상위 8비트에 위치해야 하므로, 총 256비트 중에서 248비트를 shift합니다.
  const additional2 =
    (revertIfIncomplete << shift248Bits) | royaltyFeeRecipient;

  return {
    additional1: BigInt(additional1),
    additional2: BigInt(additional2),
  };
}
function findItemIndexInCollections(collectionsData, nftAddress, nftId) {
  // Loop through each collection in basicCollections
  for (let i = 0; i < collectionsData.basicCollections.length; i++) {
    const collection = collectionsData.basicCollections[i];
    // Check if the current collection's nftAddress matches the search nftAddress
    if (collection.nftAddress.toLowerCase() == nftAddress.toLowerCase()) {
      // Loop through each item in the current collection
      for (let j = 0; j < collection.items.length; j++) {
        // Check if the current item's nftId matches the search nftId
        if (collection.items[j].nftId.toString() == nftId) {
          // Return the indices of the collection and item if a match is found
          return {
            collectionContract: collection.nftAddress.toLowerCase(),
            itemIndex: j,
            totalItemsCount: collection.items.length,
            erc20TokenAmount: collection.items[j].erc20TokenAmount,
            items: collection.items,
          };
        }
      }
    }
  }
  // Return -1 for both indices if no match is found
  return { collectionIndex: null, itemIndex: -1 };
}

function generateFilledIndexListParts(indexList) {
  // filledIndexListPart1과 filledIndexListPart2 초기화
  let filledIndexListPart1 = "";
  let filledIndexListPart2 = "";

  // 최대 12개의 인덱스를 처리하여 filledIndexListPart1 생성
  for (let i = 0; i < 12; i++) {
    if (i < indexList.length) {
      filledIndexListPart1 += indexList[i].toString(16).padStart(2, "0");
    } else {
      filledIndexListPart1 += "00";
    }
  }

  // 인덱스 12번부터 16번까지 처리하여 filledIndexListPart2 생성
  for (let i = 12; i < 16; i++) {
    if (i < indexList.length) {
      filledIndexListPart2 += indexList[i].toString(16).padStart(2, "0");
    } else {
      filledIndexListPart2 += "00";
    }
  }

  // 결과 반환
  return {
    filledIndexListPart1: filledIndexListPart1,
    filledIndexListPart2: filledIndexListPart2,
  };
}

function createFormattedItemsList(itemsList) {
  let formattedItemsList = [];
  for (let item of itemsList) {
    // Convert price and id to hexadecimal strings
    const priceHex = BigInt(item.erc20TokenAmount)
      .toString(16)
      .padStart(24, "0");
    const idHex = BigInt(item.nftId).toString(16).padStart(16, "0");
    // Combine price and id with padding to match the specified format
    const tokenData = priceHex + "000000000000000000000000" + idHex;
    formattedItemsList.push(tokenData);
  }

  return formattedItemsList;
}

function createFillBatchSignedOrder(param) {
  let data = web3.eth.abi.encodeParameters(
    ["(uint256,uint256,uint256,bytes32,bytes32)", "bytes"],
    [
      [
        param.encodedData1,
        param.encodedData2,
        param.encodedData3,
        param.r,
        param.s,
      ],
      param.bytes,
    ]
  );
  return SELECTOR_fillBatchSignedERC721Order + data.substring(2);
}

function createFillBatchSignedOrders(param) {
  const parametersTypes = [
    {
      type: "tuple[]",
      components: [
        { type: "uint256", name: "data1" },
        { type: "uint256", name: "data2" },
        { type: "uint256", name: "data3" },
        { type: "bytes32", name: "r" },
        { type: "bytes32", name: "s" },
        { type: "bytes", name: "collections" },
      ],
    },
    "uint256", // additional1
    "uint256", // additional2
  ];

  const parametersValues = [
    param.signedList,
    param.additional1, // additional1의 값
    param.additional2, // additional2의 값
  ];

  const data = web3.eth.abi.encodeParameters(parametersTypes, parametersValues);

  return SELECTOR_fillBatchSignedERC721Orders + data.substring(2);
}

module.exports = {
  createOrderData,
  createOrdersData,
};
