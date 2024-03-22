const  {ethers}  = require("ethers");
const voucher_codes = require("voucher-code-generator");
const dayjs = require("dayjs");
const slugify = require("slugify");
const DiscordManager = require("../discord/DiscordManager");
const {
  jsonRpcProvider,
  NFT_LOG_TYPE,
  PROTOCOL_FEE,
  EVENT_TYPE,
  EX_TYPE
} = require("../utils/constants");
const { decodeData } = require("./listenerhelpers");
const ERC721Event = require("../web3/abis/ERC721Event.json")
const ERC1155Event = require("../web3/abis/ERC1155Event.json");
const { updateFloorPrice, updateOrdersCount, updateOwnerCount } = require("./collectionStats");
const { updateOwner } = require("./blockchainListener");

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


const wenContractListener = async ({event, strapi}) => {
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
        console.log("111", eventData);
        // 2. ERC 20 토큰의 양(낸 가격)
        const price = eventData["5"]
        // 3. ERC 721 컨트랙트 어드레스
        const ERC721ContractAddress = eventData["7"];
        // 4. ERC 721 토큰 ID
        const ERC721TokenId = eventData["8"].toNumber();
        
        const maker = eventData["1"]
        const taker = eventData["2"]
        const data = {
          type: NFT_LOG_TYPE.LOG_TYPE_SALE,
          ex_type:EX_TYPE.WEN,
          price: ethers.utils.formatEther(price),
          from: maker,
          to: taker,
          tx_hash: event.transactionHash,
          timestamp: dayjs().unix(),
          token_id: ERC721TokenId,
          contract_address: ERC721ContractAddress.toLowerCase()
        }

        console.log(333,"ERC721SellOrderFilled - data",data );

        /** Validations */
        const nftData = await strapi.db.query("api::nft.nft").findOne({
          where: {
            token_id: data.ERC721TokenId,
            collection: { contract_address: {
              $eq: data.contract_address
            } },
          },
          populate: {
            sell_order: true,
            collection: true
          },
        });

        if (!nftData) {
          // TODO: Discord Error Log
          return 
        } 

        const existedTradeLog = await strapi.db
        .query("api::nft-trade-log.nft-trade-log")
        .findOne({
          where: {
            tx_hash: data.tx_hash,
            from: data.from,
            to: data.to,
            nft: nftData.id,
          },
        });

        if (existedTradeLog) return 

        saleProcessInWen({data, strapi,nftData}).catch()
        break;
      }
  
  
      case EVENT_TYPE.ERC721BuyOrderFilled: {
        //ERC721BuyOrderFilled - WETH를 받고 판 경우
        const eventData = decodeData(
          ERC721Event.abi,
          "ERC721BuyOrderFilled",
          event
        );

        // ERC721BuyOrderFilled (bytes32 orderHash, address maker, address taker, uint256 nonce, address erc20Token, uint256 erc20TokenAmount, tuple[] fees, address erc721Token, uint256 erc721TokenId)          console.log("111", eventData);
  
        // 2. ERC 20 토큰의 양(낸 가격)
        const price = eventData["5"].toString();
        // 3. ERC 721 컨트랙트 어드레스
        const ERC721ContractAddress = eventData["7"];
        // 4. ERC 721 토큰 ID
        const ERC721TokenId = eventData["8"].toString();
  
        const maker = eventData["1"]
        const taker = eventData["2"]
  
        const data = {
          type: NFT_LOG_TYPE.LOG_TYPE_SALE,
          ex_type:EX_TYPE.WEN,
          price: ethers.utils.formatEther(price),
          from: maker,
          to: taker,
          tx_hash: event.transactionHash,
          timestamp: dayjs().unix(),
          token_id: ERC721TokenId,
          contract_address: ERC721ContractAddress
        }
        // TODO  
  
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
        const maker = eventData["0"]
        const nonce = eventData["1"]

        const data = {
          maker,
          nonce,
          tx_hash: event.transactionHash,
          timestamp: dayjs().unix(),
        }

        cancelProcessInWen({data,strapi}).catch()
        
        break;
      }
  
  
      case EVENT_TYPE.ERC1155SellOrderFilled: {
        //ERC1155SellOrderFilled - ETH 로 산경우
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
        //ERC1155BuyOrderFilled -WETH 를 받고 판경우
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
    console.error(error.message)
  }

}

const saleProcessInWen = async ({data, strapi, nftData}) => {
  // order 지우고 로그 찍어주긔
  strapi.entityService.delete(
    "api::order.order",
    nftData.sell_order.id,
    {
      populate: { nft: true },
    }
  ).then(deletedOrder => {
    return strapi.entityService.create(
      "api::nft-trade-log.nft-trade-log",
      {
        data: {
          ex_type: EX_TYPE.WEN,
          type: LOG_TYPE_AUTO_CANCEL_LISTING,
          from: data.from,
          nft: nftData.id,
          tx_hash: data.tx_hash,
          timestamp: dayjs().unix(),
        },
      }
    );
  }).catch()

  
  // update NFT
  strapi.entityService.update("api::nft.nft", nftData.id, {
  data: {
    last_sale_price: data.price,
    owner: data.to
  },
  }).then(_ => {
  // update owner count after nft owner update
  updateOwnerCount({ strapi }, data.contract_address).catch()
  }).catch()

  // SALE log
  strapi.entityService.create(
  "api::nft-trade-log.nft-trade-log",
  {
    data: {
      ex_type: EX_TYPE.WEN,
      type: LOG_TYPE_SALE,
      price: data.price,
      from: data.from,
      to: data.to,
      nft: nftData.id,
      tx_hash: data.tx_hash,
      timestamp: dayjs().unix(),
    },
  }
  );
}

const cancelProcessInWen = async ({data, strapi}) => {
//  1. Wen 에 리스팅 내역이 있으면 지워주고
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
  strapi.entityService.create("api::nft-trade-log.nft-trade-log", {
    data: {
      ex_type: EX_TYPE.WEN,
      type: LOG_TYPE_CANCEL_LISTING,
      from: data.maker,
      nft: result.nft.id,
      tx_hash: data.tx_hash,
      timestamp: data.timestamp
    },
  }).catch()
  updateFloorPrice({ strapi }, result.contract_address).catch()
  updateOrdersCount({ strapi }, result.contract_address).catch();
}
}

module.exports = { wenContractListener };
