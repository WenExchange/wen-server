const { ethers } = require("ethers");
const fs = require("fs");
const axios = require("axios")
const path = require("path");
const slugify = require('slugify');
const contractABI = [
  {
    inputs: [
      {
        internalType: "string",
        name: "baseURI",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "maxTokenCount",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "ERC721EnumerableForbiddenBatchMint",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "ERC721IncorrectOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "ERC721InsufficientApproval",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "approver",
        type: "address",
      },
    ],
    name: "ERC721InvalidApprover",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "ERC721InvalidOperator",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "ERC721InvalidOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "receiver",
        type: "address",
      },
    ],
    name: "ERC721InvalidReceiver",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    name: "ERC721InvalidSender",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "ERC721NonexistentToken",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "ERC721OutOfBoundsIndex",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "approved",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "ApprovalForAll",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    stateMutability: "payable",
    type: "fallback",
  },
  {
    inputs: [],
    name: "_paused",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "getApproved",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "isApprovedForAll",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "isMinted",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "maxTokenIds",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "mint",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "ownerOf",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "data",
        type: "bytes",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bool",
        name: "val",
        type: "bool",
      },
    ],
    name: "setPaused",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "tokenByIndex",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "tokenIds",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "index",
        type: "uint256",
      },
    ],
    name: "tokenOfOwnerByIndex",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "tokenURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];
const {jsonRpcProvider, PROTOCOL_FEE, IPFS} = require("./constants")


// 1. [ethers] fetch colleciton info (total_supply, start_id_index ) => Collection DB
// 2. [ethers] fetchTokenData (token_id, image_url, name, owner) => NFT DB
// 3. [db] collection db create (slug , name, contract_address)
// 4. [db] nft db create 
// 5. (optional) Image Upload

const getCollectionDataByContract = async (listingCollectionInfo) => {
  const collectionContract =  new ethers.Contract(listingCollectionInfo.contract_address, contractABI, jsonRpcProvider);
  let total_supply = await collectionContract.totalSupply();
  total_supply = total_supply.toNumber()
  let start_token_id = 0
  try {
    const tokenURI = await collectionContract.tokenURI(start_token_id);
    if (!tokenURI)  start_token_id = 1
  } catch (error) {
    start_token_id = 1
  }

  return {
    ...listingCollectionInfo,
    collectionContractProvider : collectionContract, 
    total_supply,
    token_id_list: Array.from(
      { length: total_supply },
      (_, i) => i + start_token_id
    )

  }
}

async function fetchAllTokensAndSave(collectionData) {

const {total_supply, token_id_list, contract_address, collectionContractProvider} = collectionData
  const chunkSize = 200;
  const chunks = [];

  for (let i = 0; i < token_id_list.length; i += chunkSize) {
    console.log(`start chunk ${i + 1} ~ ${i + chunkSize + 1}`);
    chunks.push(token_id_list.slice(i, i + chunkSize));
  }

  const allTokensData = [];

  let chunkCount = 0
  for (const chunk of chunks) {
    console.log(`start chunk ${chunkCount}`);
    const fetchPromises = chunk.map((tokenId) =>
      fetchTokenData({collectionData, collectionContractProvider, tokenId}).then(res => {
        return {
          ...res,
          contract_address
        }
      })
    );
    const results = await Promise.all(fetchPromises);
    allTokensData.push(...results);
    chunkCount += 1
  }

  // Filter out successful and failed data
  const successfulData = allTokensData.filter(
    (data) => data !== null
  );

  console.log(`Success nft data list`);

  return successfulData
}

async function fetchTokenData({collectionData, collectionContractProvider, tokenId}) {
  try {
    // console.log("token id", tokenId);
    let tokenURI = await collectionContractProvider.tokenURI(tokenId)
    // if (collectionData.name === "Eryndor") tokenURI = `ipfs://QmX2aQgepNMxFjsozGnLkPzkyV6nBUhgwDjCpBbAj5dkHa/${tokenId}`
    
    const owner = await collectionContractProvider.ownerOf(tokenId)
    if (tokenURI.startsWith('ipfs://')) 
      tokenURI = tokenURI.replace('ipfs://', IPFS.GATEWAY_URL);
  

    const metadata = await axios.get(tokenURI).then(res => res.data);

    let image_url = metadata?.image || "";
  const attributes = Array.isArray(metadata?.attributes) && metadata?.attributes.length > 0 ? metadata.attributes : null;
    return {
      name: metadata.name,
      image_url,
      token_id: tokenId,
      traits: attributes,
      owner
    };
  } catch (error) {

    console.error("Error fetching token data for token ID:", tokenId, error);
    // Differentiate between 'ERC721NonexistentToken' and other errors
    return null
  }
}



const getEthersData = async (listingCollectionInfo) => {
  console.log(`Start Fetch Ethers Data - ${listingCollectionInfo.name}`)
  const collectionData = await getCollectionDataByContract(listingCollectionInfo)
  const nftDataList =  await fetchAllTokensAndSave(collectionData)
  return {
    collectionData,
    nftDataList
  }
}

const checkIsValidCollectionDataForDB = (collectionDataForDB) => {
  try {
    const {name, description,contract_address, slug, nftDataList} = collectionDataForDB
    const isValidName = name && typeof name === "string" && name.length > 0
    const isValidSlug = slug && typeof slug === "string" && slug.length > 0
    const isValidDes = description && typeof description === "string" 
    const isValidContractAddress = contract_address && typeof contract_address === "string" && contract_address.length === 42

    const isValidList = nftDataList.map(nftData => {
      const {name, image_url, token_id} = nftData
      const isValidName = name && typeof name === "string" && name.length > 0
      const isValidImage = image_url && typeof image_url === "string" && image_url.length > 0
      const isValidTokenId = typeof token_id === "number" && token_id >= 0
      return isValidName && isValidImage && isValidTokenId
    })

    const isValidNFTData = isValidList.filter(_ => _ === false).length === 0

    return isValidName && isValidSlug && isValidDes && isValidContractAddress && isValidNFTData
  } catch (error) {
    return false
  }
  
}

const createCollectionAndNFTData = async ({strapi, collectionDataForDB}) => {
  console.log(`Create Collection DB - ${collectionDataForDB.name}`);
  const collection = await strapi.entityService.create(
    "api::collection.collection",
    {
      data: {
        ...collectionDataForDB,
      },
    }
  );

  console.log(`Complete Collection DB - ${collection.id} ${collection.name}`);

  const {nftDataList} = collectionDataForDB
  const nftCreatePromises = nftDataList.map(nftData => {
    return strapi.entityService.create('api::nft.nft', {
      data: {
          ...nftData,
          collection: collection.id
      },
  }).then(nft => console.log(`NFT Created - ${nft.id} - ${nft.name}`));
  })
  console.log(`Create NFT DB - ${collectionDataForDB.name}`);
  await Promise.all(nftCreatePromises)
  
}


const willListingCollecitons = [

  // {
  //   name: "Blade Module NFT",
  //   description: "Blade Module NFTs, obtained from Daily Loot Boxes, contain Blast Gold, $BLADE, and all future airdrops happening on Blast_L2!",
  //   contract_address: "0x7571058f0423d9bd24b798ecd4135c47f78dbf08",
  //   twitter: "https://twitter.com/bladeswapxyz",
  //   discord: "https://discord.com/invite/QX85NaC9h2",
  //   website: "https://bladeswap.xyz/",
  //   logo_url: "https://d1kb1oeulsx0pq.cloudfront.net/blade_module_logo_20a2822bf6.jpeg",
  //   banner_url: "https://d1kb1oeulsx0pq.cloudfront.net/blade_module_banner_e62c23fbb3.jpeg",
    
  // },

  // {
  //   name: "Blast pepe",
  //   description: "First pepe NFT on blast",
  //   contract_address: "0x28bde6a47bf489a595f02cd528f021cf6756dc98",
  //   twitter: "https://twitter.com/blastpepes",
  //   discord: "https://discord.com/invite/blastpepe",
  //   website: "https://blastpepes.com/",
  //   logo_url: "https://d1kb1oeulsx0pq.cloudfront.net/blast_pepe_logo_aa34c1ca4c.png",
  //   banner_url: "https://d1kb1oeulsx0pq.cloudfront.net/blast_pepe_banner_b48df357bd.jpeg",
    
  // },


  // {
  //   name: "Pigs Get Blasted",
  //   description: "Diabolical game theory with art by NOMOZ. Award winner in Blast Competition",
  //   contract_address: "0xf6d13f878f95ebf06a0e468cebf4d97e759a7e2e",
  //   twitter: "https://twitter.com/pigsgetblasted",
  //   discord: "",
  //   website: "https://www.pigsgetblasted.com/",
  //   logo_url: "https://d1kb1oeulsx0pq.cloudfront.net/blade_module_logo_20a2822bf6.jpeg",
  //   banner_url: "https://d1kb1oeulsx0pq.cloudfront.net/blade_module_banner_e62c23fbb3.jpeg",
    
  // },


  {
    name: "LightCycle",
    description: "LightCycle - a hyper-realistic virtual commercial city, has been created using Unreal Engine 5 and real-time edge rendering.",
    contract_address: "0xa56cac24af898429e6fedb98173fb8b849c81e98",
    twitter: "https://twitter.com/LightCycle_City",
    discord: "https://discord.com/invite/flashbit",
    website: "https://side.xyz/lightcycle",
    logo_url: "https://d1kb1oeulsx0pq.cloudfront.net/light_cycle_logo_74ee246e7f.jpeg",
    banner_url: "https://d1kb1oeulsx0pq.cloudfront.net/light_cycle_banner_9f45afe353.jpeg",
  },


]


const listing = async ({strapi}) => {
  let failCollection
    for (let i = 0; i < willListingCollecitons.length; i++) {
      try {

      const willListingColleciton = willListingCollecitons[i];
      failCollection = willListingCollecitons[i];
      console.log(`Start Listing Process - ${willListingColleciton.name}`);
      const collectionDataByEthers = await getEthersData(willListingColleciton)
      const slug = slugify(willListingColleciton.name, {
        lower: true,      
        remove: /[*+~.()'"!:@]/g,
        strict: true
    });
      const collectionDataForDB = {
        ...willListingColleciton,
        slug,
        protocol_fee_receiver: PROTOCOL_FEE.RECEIVER,
        protocol_fee_point: PROTOCOL_FEE.POINT,
        total_supply: collectionDataByEthers.collectionData.total_supply,
        nftDataList: collectionDataByEthers.nftDataList
      }

      if (!checkIsValidCollectionDataForDB(collectionDataForDB)) {
        console.log(`Not Valid Data - ${willListingColleciton.name}`)
        continue
      }

      // fs.writeFile(`./src/utils/${collectionDataForDB.slug}.json`, JSON.stringify(collectionDataForDB, null, 2), (writeErr) => {
      //   if (writeErr) {
      //     console.error("Error saving the file:", writeErr);
      //   } else {
      //     console.log(
      //       `Successfully updated token data in ${collectionDataForDB.slug}.json`
      //     );
      //   }
      // });
      
      await createCollectionAndNFTData({strapi,collectionDataForDB })



    } catch (error) {
      console.error(error.message)
      console.log(`Fail Listing - ${failCollection.name}`);
      continue
    }
      
    }


    

}

// listing({strapi: null})

module.exports = {
  listing
}