const {
  getContractMetadata,
  createCollection
} = require("../listener/collectionDeployerERC721And1155Listener");
const { ethers } = require("ethers");
const {
  jsonRpcProvider,
  NFT_LOG_TYPE,
  IPFS
} = require("./constants");
const ERC721 = require("../web3/abis/ERC721.json");
const DiscordManager = require("../discord/DiscordManager");
const { fetchMetadata } = require("../listener/listingAtMint");

const listingCollectionScript = async ({address, strapi}) => {

  let collection = await strapi.db.query("api::collection.collection").findOne({
    where: {
      contract_address: address
    }
  })
  if (!collection) {
    let metadataInfo = await getContractMetadata(address);
        if (typeof metadataInfo === "boolean") return;
        if (!metadataInfo.isERC721) return;

      const creator_address = "";
      const name = metadataInfo.name;
      const total_supply = metadataInfo.total_supply;
      const token_type = metadataInfo.isERC721 ? "ERC721" : "ERC1155";
      collection = await createCollection({
        strapi,
        contract_address: address,
        creator_address,
        name,
        token_type,
        total_supply
      });
    }
  

  const collectionContract = new ethers.Contract(
    address,
    ERC721,
    jsonRpcProvider
  );

  let start_token_id = 0;
  try {
    const tokenURI = await collectionContract.tokenURI(start_token_id);
    if (!tokenURI) start_token_id = 1;
  } catch (error) {
    start_token_id = 1;
  }

  const token_id_list = Array.from(
    { length: collection.total_supply },
    (_, i) => i + start_token_id
  );

  for (let i = 0; i < token_id_list.length; i++) {
    const token_id = token_id_list[i];
    await createNFT({ strapi, collection, collectionContract, token_id });
  }
};

const createNFT = async ({ strapi, collection, collectionContract, token_id }) => {
  try {

    console.log(`Start Create NFT at Mint`);
    const dm = DiscordManager.getInstance();
    try {

      // 1.1 check exist nft
      const existNFT = await strapi.db.query("api::nft.nft").findOne({
        where: {
          $and: [
            {
              collection: {
                id: collection.id
              },
            },
            {
              token_id,
            },
          ]
        }
      })
      if (existNFT) {
        console.log(`${existNFT.name} NFT already exist`);
        return 
      }

      
      // 1. fetch metadata
      let metadata = await fetchMetadata({
        collectionContract,
        tokenId: token_id,
        timeout: 10 * 1000
      });
      const owner = await collectionContract.ownerOf(token_id).catch(null);
      if (!owner) throw new Error("invalid owner");

      if (!metadata) {
        metadata = {
          token_id,
          name: `${collection.name} #${token_id}`,
          image_url: "",
          traits: null,
          try_count: 1
        }
        console.log(`${metadata.name} NFT at Mint (invalid metadata)`);

      } else {
        console.log(`${metadata.name} NFT at Mint (valid metadata)`);
      }

      // 2. create NFT
      const createdNFT = await strapi.db.query("api::nft.nft")
      .create({
        data: {
          collection: collection.id,
          ...metadata,
          owner
        }
      })


      dm.logNFTMinting({ contract_address: collection.contract_address, createdNFT }).catch(
        (err) => console.error(err.message)
      );
      // publish
      if (
        !collection.publishedAt 
      ) {
        const updatedCollection = await strapi.db.query("api::collection.collection")
        .update({
          where: {
            id: collection.id,
          },
          data: {
            publishedAt: new Date(),
            logo_url: createdNFT?.image_url || ""
          }
        })
        

        dm.logListingCollectionPublish(updatedCollection).catch((err) =>
          console.error(err.message)
        );
      }
    } catch (error) {
      console.error(`Create NFT Error - ${collection.name} - ${token_id} - ${error.message}`);
      // dm.logListingNFTError({
      //   collection,
      //   error,
      //   tokenId: token_id
      // }).catch((err) => console.error(err.message));
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  listingCollectionScript
};
