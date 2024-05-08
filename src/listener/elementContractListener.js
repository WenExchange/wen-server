const { ethers } = require("ethers");
const dayjs = require("dayjs");
const DiscordManager = require("../discord/DiscordManager");
const {
  EVENT_TYPE,
  EX_TYPE,
  SALE_TYPE,
  PAYMENT_TOKEN,
  DISCORD_INFO,
} = require("../utils/constants");
const { decodeData } = require("./listenerhelpers");
const ERC721Event = require("../web3/abis/ERC721Event.json");
const ERC1155Event = require("../web3/abis/ERC1155Event.json");
const { getNFTDataAtTradeListener, getTradeLogAtTradeListener, updateNFTAtTradeListener, deleteSellOrderAtTradeListener, createSaleLogAtTradeListener } = require("./helpers");

const elementContractListener = async ({ event, strapi }) => {
  const dm = DiscordManager.getInstance(strapi)
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
        // 2. ERC 20 토큰의 양(낸 가격)
        const price = eventData["5"];
        // 3. ERC 721 컨트랙트 어드레스
        const ERC721ContractAddress = eventData["7"].toLowerCase();
        // 4. ERC 721 토큰 ID
        const ERC721TokenId = eventData["8"].toNumber();

        const maker = eventData["1"];
        const taker = eventData["2"];

        const data = {
          ex_type: EX_TYPE.ELEMENT,
          sale_type: SALE_TYPE.SELL,
          payment_token: PAYMENT_TOKEN.ETH,
          price: ethers.utils.formatEther(price),
          from: maker,
          to: taker,
          tx_hash: event.transactionHash,
          timestamp: dayjs().unix(),
          token_id: ERC721TokenId,
          contract_address: ERC721ContractAddress,
        };

        await saleProcessInElement({ data, strapi })
        console.log(`elementContractListener - ERC721SellOrderFilled`, data)
        break;
      }

      case EVENT_TYPE.ERC721BuyOrderFilled: {
        //ERC721BuyOrderFilled - WETH를 받고 판 경우
        const eventData = decodeData(
          ERC721Event.abi,
          "ERC721BuyOrderFilled",
          event
        );

        // ERC721BuyOrderFilled (bytes32 orderHash, address maker, address taker, uint256 nonce, address erc20Token, uint256 erc20TokenAmount, tuple[] fees, address erc721Token, uint256 erc721TokenId)

        // 2. ERC 20 토큰의 양(낸 가격)
        const price = eventData["5"].toString();
        // 3. ERC 721 컨트랙트 어드레스
        const ERC721ContractAddress = eventData["7"].toLowerCase();
        // 4. ERC 721 토큰 ID
        const ERC721TokenId = eventData["8"].toNumber();

        const maker = eventData["1"];
        const taker = eventData["2"];

        /**
         * BuyOrder 의 경우 maker 가 to , taker 가 from 으로 SellOrder 와 반대이다.
         */
        const data = {
          ex_type: EX_TYPE.ELEMENT,
          sale_type: SALE_TYPE.BUY,
          payment_token: PAYMENT_TOKEN.WETH,
          price: ethers.utils.formatEther(price),
          from: taker,
          to: maker,
          tx_hash: event.transactionHash,
          timestamp: dayjs().unix(),
          token_id: ERC721TokenId,
          contract_address: ERC721ContractAddress,
        };

        await saleProcessInElement({ data, strapi })
        console.log(`elementContractListener - ERC721BuyOrderFilled`, data)
        break;
      }

      case EVENT_TYPE.ERC721OrderCancelled: {
        return;
        const eventData = decodeData(
          ERC721Event.abi,
          "ERC721OrderCancelled",
          event
        );

        // ERC721BuyOrderFilled (address maker, uint256 nonce)
        const maker = eventData["0"];
        const nonce = eventData["1"];

        const data = {
          maker,
          nonce,
          tx_hash: event.transactionHash,
          timestamp: dayjs().unix(),
        };

        break;
      }

      case EVENT_TYPE.ERC1155SellOrderFilled: {
        return;
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
        return;
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
    dm.logError({ error, identifier: `elementContractListener`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG }).catch()
  }
};

const saleProcessInElement = async ({ data, strapi }) => {
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

module.exports = { elementContractListener };
