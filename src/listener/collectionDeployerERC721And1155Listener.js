const {ethers} = require("ethers");
const voucher_codes = require("voucher-code-generator");
const dayjs = require("dayjs");
const slugify = require("slugify");
const DiscordManager = require("../discord/DiscordManager");
const {
  jsonRpcProvider_cron,
  PROTOCOL_FEE,
  DISCORD_INFO
} = require("../utils/constants");
const CollectionCacheManager = require("../cache-managers/CollectionCacheManager");
const { wait } = require("../utils/helpers");

const getContractMetadata = async (address) => {
  const abi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function supportsInterface(bytes4 interfaceId) view returns (bool)",
    "function totalSupply() view returns (uint256)",
    "function maxSupply() view returns (uint256)"
  ];
  const contract = new ethers.Contract(address, abi, jsonRpcProvider_cron);
  try {
    const isERC721 = await contract
      .supportsInterface("0x80ac58cd")
      .catch((err) => false);
    const isERC1155 = await contract
      .supportsInterface("0xd9b67a26")
      .catch((err) => false);
      let total_supply = 0
      try {
        total_supply = await contract
      .totalSupply()
      .then((res) => res.toNumber())
      } catch (error) {
        console.error(`getContractMetadata - ${error.message}`)
      }
      if (Number.isNaN(total_supply) || total_supply <= 0) {
        try {
          total_supply = await contract
        .maxSupply()
        .then((res) => res.toNumber())
        } catch (error) {
          console.error(`getContractMetadata - ${error.message}`)
        }
      }

      if (typeof total_supply !== "number") {
        total_supply = 0
      }
    

    const nameId = voucher_codes.generate({
      length: 4,
      count: 1,
      charset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    })[0];

    let name = `Auto Detecting Collection ${nameId}`
    try {
      name = await contract.name()
    } catch (error) {
      console.error(`getContractMetadata - ${error.message}`)
      return false
    }

    const regex = /test/i; // 'i' 플래그를 사용하여 대소문자를 구분하지 않습니다.

    if (typeof name === "string" && regex.test(name)) {
      return  false
    }
   

    
    return { isERC721, isERC1155, name, total_supply };
  } catch (error) {
    console.log(`getContractMetadata - error ${error.message}`);
    const dm = DiscordManager.getInstance()
    dm.logError({ error, identifier: `collectionDeployerERC721And1155Listener | getContractMetadata`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG }).catch()
    return false;
  }
};

const createCollection = async ({
  strapi,
  contract_address,
  creator_address,
  name,
  token_type,
  total_supply
}) => {
  console.log(`Checked Collection Contract Deploy`);
  const dm = DiscordManager.getInstance();
  const ccm = CollectionCacheManager.getInstance();
  let errorCollectionInfo;
  try {
    const collection = ccm.getCollectionByAddress(contract_address);
    if (collection) {
      console.log("Already exist collection contract");
      return;
    }

    let slug = slugify(`${name}`, {
      lower: true,
      remove: /[*+~.()'"!:@]/g,
      strict: true
    });

    const collectionBySlug = ccm.getCollectionBySlug(slug);
    if (collectionBySlug) {
      const slugId = voucher_codes.generate({
        length: 4,
        count: 1,
        charset: "0123456789abcdefghijklmnopqrstuvwxyz"
      })[0];
      slug = `${slug}-${slugId}`;
    }

    errorCollectionInfo = {
      slug,
      contract_address,
      creator_address,
      name,
      token_type,
      description:
        "This collection has no description yet. Contact the owner of this collection about setting it up on Wen!",
      protocol_fee_receiver: PROTOCOL_FEE.RECEIVER,
      protocol_fee_point: PROTOCOL_FEE.POINT,
      total_supply,
      publishedAt: null
    };


    const createdCollection = await strapi.db.query("api::collection.collection").create({
      data: {
        slug,
        contract_address,
        creator_address,
        name,
        token_type,
        description:
          "This collection has no description yet. Contact the owner of this collection about setting it up on Wen!",
        protocol_fee_receiver: PROTOCOL_FEE.RECEIVER,
        protocol_fee_point: PROTOCOL_FEE.POINT,
        total_supply,
        publishedAt: null
      }
    })
    
    ccm.fetchAndUpdateCollections({strapi}).catch()

    dm.logDetectingCollection(createdCollection).catch((err) =>
      console.error(err.message)
    );
    return createdCollection;
  } catch (error) {
    console.error(`createCollection - error ${error}`)
    dm.logListingCollectionError({
      error,
      collection: errorCollectionInfo
    }).catch((err) => console.error(err.message));
  }
};

const collectionDeployerERC721And1155Listener = async ({blockNumber, strapi}) => {
  // // exit early if it's not our NFTs
  try {
    const block = await jsonRpcProvider_cron.getBlockWithTransactions(blockNumber);
    for (const tx of block.transactions) {
      if (tx.to === null) {
        const receipt = await jsonRpcProvider_cron.getTransactionReceipt(tx.hash);
        const contract_address = receipt.contractAddress;
        let metadataInfo = await getContractMetadata(contract_address);
        if (typeof metadataInfo === "boolean") return;
        if (!metadataInfo.isERC721) return;

        const creator_address = tx.from;
        const name = metadataInfo.name;
        const total_supply = metadataInfo.total_supply;
        const token_type = metadataInfo.isERC721 ? "ERC721" : "ERC1155";
        await createCollection({
          strapi,
          contract_address,
          creator_address,
          name,
          token_type,
          total_supply
        });
      }
    }
  } catch (error) {
    const dm = DiscordManager.getInstance()
    dm.logError({ error, identifier: `collectionDeployerERC721And1155Listener`, channelId: DISCORD_INFO.CHANNEL.LISTENER_ERROR_LOG }).catch()

    
  }
};
module.exports = {
  collectionDeployerERC721And1155Listener,
  getContractMetadata,
  createCollection
};
