const ethers = require("ethers");
const voucher_codes = require("voucher-code-generator");
const dayjs = require("dayjs");
const slugify = require("slugify");
const DiscordManager = require("../discord/DiscordManager");
const {
  jsonRpcProvider,
  NFT_LOG_TYPE,
  PROTOCOL_FEE
} = require("../utils/constants");
const { decodeData } = require("./listenerhelpers");
const ERC721Event = require("../web3/abis/ERC721Event.json")
const ERC1155Event = require("../web3/abis/ERC1155Event.json")

const EVNET_TYPE = {
  "ERC721SellOrderFilled": "0x9c248aa1a265aa616f707b979d57f4529bb63a4fc34dc7fc61fdddc18410f74e",
  "ERC721BuyOrderFilled": "0xd90a5c60975c6ff8eafcf02088e7b50ae5d9e156a79206ba553df1c4fb4594c2",
  "ERC1155SellOrderFilled": "0xfcde121a3f6a9b14a3ce266d61fc00940de86c4d8c1d733fe62d503ae5d99ff9",
  "ERC1155BuyOrderFilled" : "0x105616901449a64554ca9246a5bbcaca973b40b3c0055e5070c6fa191618d9f3"


}

const elementContractListener = async (event) => {
  console.log(event);
  switch (event.topics[0]) {
    case "0x9c248aa1a265aa616f707b979d57f4529bb63a4fc34dc7fc61fdddc18410f74e": {
      //ERC721SellOrderFilled - ETH로 산 경우
      const eventData = decodeData(
        ERC721Event.abi,
        "ERC721SellOrderFilled",
        event
      );

      // ERC721SellOrderFilled (bytes32 orderHash, address maker, address taker, uint256 nonce, address erc20Token, uint256 erc20TokenAmount, tuple[] fees, address erc721Token, uint256 erc721TokenId)
      console.log("111", eventData);
      // 1. ERC 20 토큰 (ETH : 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE, wETH : )
      const ERC20Token = eventData["4"];
      // 2. ERC 20 토큰의 양(낸 가격)
      const price = eventData["5"].toString();
      // 3. ERC 721 컨트랙트 어드레스
      const ERC721ContractAddress = eventData["7"];
      // 4. ERC 721 토큰 ID
      const ERC721TokenId = eventData["8"].toString();

      console.log("ERC20Token", ERC20Token);
      console.log("price", price);
      console.log("ERC721ContractAddress", ERC721ContractAddress);
      console.log("ERC721TokenId", ERC721TokenId);

      //TODO: ADD SALE DATA HERE

      break;
    }

    case "0xfcde121a3f6a9b14a3ce266d61fc00940de86c4d8c1d733fe62d503ae5d99ff9": {
      //ERC1155SellOrderFilled - ETH 로 산경우
      const eventData = decodeData(
        ERC1155Event.abi,
        "ERC1155SellOrderFilled",
        event
      );

      //ERC1155SellOrderFilled (bytes32 orderHash, address maker, address taker, uint256 nonce, address erc20Token, uint256 erc20FillAmount, tuple[] fees, address erc1155Token, uint256 erc1155TokenId, uint128 erc1155FillAmount)
      // 1. ERC 20 토큰 (ETH : 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE, wETH : )
      const ERC20Token = eventData["4"];
      // 2. ERC 20 토큰의 양(낸 가격)
      const price = eventData["5"].toString();
      // 3. ERC 721 컨트랙트 어드레스
      const ERC1155ContractAddress = event["7"];
      // 4. ERC 721 토큰 ID
      const ERC1155TokenId = eventData["8"].tokenId;
      // 9. ERC 1155 토큰 ID에 해당하는 걸 몇 개 샀는지
      const ERC1155FilledAmount = eventData["9"].toString();

      console.log("222", eventData);

      console.log("ERC20Token", ERC20Token);
      console.log("price", price);
      console.log("ERC1155ContractAddress", ERC1155ContractAddress);
      console.log("ERC1155TokenId", ERC1155TokenId);
      console.log("ERC1155FilledAmount", ERC1155FilledAmount);

      //TODO: ADD SALE DATA HERE

      break;
    }

    case "0xd90a5c60975c6ff8eafcf02088e7b50ae5d9e156a79206ba553df1c4fb4594c2": {
      //ERC721BuyOrderFilled - WETH를 받고 판 경우
      const eventData = decodeData(
        ERC721EventABI.abi,
        "ERC721BuyOrderFilled",
        event
      );

      console.log("333", eventData);
      // ERC721BuyOrderFilled (bytes32 orderHash, address maker, address taker, uint256 nonce, address erc20Token, uint256 erc20TokenAmount, tuple[] fees, address erc721Token, uint256 erc721TokenId)          console.log("111", eventData);
      // 1. ERC 20 토큰 (ETH : 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE, wETH : )
      const ERC20Token = eventData["4"];
      // 2. ERC 20 토큰의 양(낸 가격)
      const price = eventData["5"].toString();
      // 3. ERC 721 컨트랙트 어드레스
      const ERC721ContractAddress = eventData["7"];
      // 4. ERC 721 토큰 ID
      const ERC721TokenId = eventData["8"].toString();

      console.log("ERC20Token", ERC20Token);
      console.log("price", price);
      console.log("ERC721ContractAddress", ERC721ContractAddress);
      console.log("ERC721TokenId", ERC721TokenId);

      //TODO: ADD SALE DATA HERE

      break;
    }

    case "0x105616901449a64554ca9246a5bbcaca973b40b3c0055e5070c6fa191618d9f3": {
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

      console.log("ERC20Token", ERC20Token);
      console.log("price", price);
      console.log("ERC1155ContractAddress", ERC1155ContractAddress);
      console.log("ERC1155TokenId", ERC1155TokenId);
      console.log("ERC1155FilledAmount", ERC1155FilledAmount);

      //TODO: ADD SALE DATA HERE

      break;
    }

    default:
      break;
  }
}
module.exports = { elementContractListener };
