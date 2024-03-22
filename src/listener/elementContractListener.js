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
const ERC1155Event = require("../web3/abis/ERC1155Event.json")


const elementContractListener = async (event) => {
  console.log(event);
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
      const ERC721TokenId = eventData["8"].toString();
      
      const maker = eventData["1"]
      const taker = eventData["2"]
      const data = {
        type: NFT_LOG_TYPE.LOG_TYPE_SALE,
        ex_type:EX_TYPE.ELEMENT,
        price: ethers.utils.formatEther(price),
        from: maker,
        to: taker,
        tx_hash: event.transactionHash,
        timestamp: dayjs().unix(),
        token_id: ERC721TokenId,
        contract_address: ERC721ContractAddress
      }
      console.log(333,"ERC721SellOrderFilled - data",data );

      // order 없었으면 sale 만 등록 

      // 1. order 있으면 delete 
      // 2. create tradelog (sale)
      // 3. wen 이면 last-sale-price 업데이트
      // 4. create tradelog (auto cancel listing)
 

      //TODO: ADD SALE DATA HERE

      break;
    }


    case EVENT_TYPE.ERC721BuyOrderFilled: {
      //ERC721BuyOrderFilled - WETH를 받고 판 경우
      const eventData = decodeData(
        ERC721Event.abi,
        "ERC721BuyOrderFilled",
        event
      );

      console.log("333", eventData);
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
        ex_type:EX_TYPE.ELEMENT,
        price: ethers.utils.formatEther(price),
        from: maker,
        to: taker,
        tx_hash: event.transactionHash,
        timestamp: dayjs().unix(),
        token_id: ERC721TokenId,
        contract_address: ERC721ContractAddress
      }

      console.log(333,`ERC721BuyOrderFilled - datas`,data );


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
      
      //  1. find order
      //  2. order 있으면 delete order
      //  3. create trade log (cancel listing)


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
      console.log("222", eventData);
      // 9. ERC 1155 토큰 ID에 해당하는 걸 몇 개 샀는지
      const ERC1155FilledAmount = eventData["9"].toString();

      break;
    }

    default:
      break;
  }
}
module.exports = { elementContractListener };
