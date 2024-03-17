const { ethers } = require("ethers");
const fs = require("fs");
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
const {jsonRpcProvider} = require("./constants")


// 1. [ethers] fetch colleciton info (total_supply, start_id_index ) => Collection DB
// 2. [ethers] fetchTokenData (token_id, image_url, name, owner) => NFT DB
// 3. [db] collection db create (slug , name, contract_address)
// 4. [db] nft db create 
// 5. (optional) Image Upload

const getCollectionDataByContract = async (contract_address) => {
  const collectionContract =  new ethers.Contract(contract_address, contractABI, jsonRpcProvider);
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
    collectionContractProvider : collectionContract, 
    contract_address,
    total_supply,
    token_id_list: Array.from(
      { length: total_supply },
      (_, i) => i + start_token_id
    )

  }
}

async function fetchAllTokensAndSave(collectionData) {

const {total_supply, token_id_list, contract_address, collectionContractProvider} = collectionData

  const chunkSize = 50;
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
      fetchTokenData(collectionContractProvider, tokenId).then(res => {
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

  console.log(`Success nft data - ${successfulData[0]}`);
  // fs.writeFile(`./src/utils/${contract_address}.json`, JSON.stringify(successfulData, null, 2), (writeErr) => {
  //   if (writeErr) {
  //     console.error("Error saving the file:", writeErr);
  //   } else {
  //     console.log(
  //       `Successfully updated token data in ${contract_address}.json, total Supply ${total_supply} arrayLength : ${successfulData.length}`
  //     );
  //   }
  // });
  return successfulData
}

async function fetchTokenData(collectionContractProvider, tokenId) {
  try {
    // console.log("token id", tokenId);
    const tokenURI = await collectionContractProvider.tokenURI(tokenId);
    const owner = await collectionContractProvider.ownerOf(tokenId)
    const httpURL = tokenURI.replace(
      "ipfs://",
      "https://wen-exchange.quicknode-ipfs.com/ipfs/"
    );
    const response = await fetch(httpURL);
    const metadata = await response.json();

    let image_url = metadata?.image || "";
    if (image_url.startsWith('ipfs://')) {
      image_url = image_url.replace('ipfs://', 'https://wen-exchange.quicknode-ipfs.com/ipfs/');
  }
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
  const collectionData = await getCollectionDataByContract(listingCollectionInfo.contract_address)
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

  const {nftDataList} = collectionDataForDB
  const nftCreatePromises = nftDataList.map(nftData => {
    return strapi.entityService.create('api::nft.nft', {
      data: {
          ...nftData,
          collection: collection.id
      },
  });
  })

  await Promise.all(nftCreatePromises)
  
}

const willListingCollecitons = [
  {
    name: "Super Sushi Samurai",
    description: "Dive into the world of decentralised gaming and unleash your Sushi Samurai and pet to dominate Rice Kingdom. A social strategy focussed idle game powered by the Blast network.",
    contract_address: "0xdd22cee7fb6257f3bad43cc66562fb7925756114",
    twitter: "https://twitter.com/SSS_HQ",
    logo_url: "https://v5.airtableusercontent.com/v3/u/26/26/1710705600000/0-b-rXfS8xZEBpVpEXuTgw/zphYCbuUUzkpBmhmyhdtNdzEBwK8ojQmujLqDIZ8k-xf546oC0Wfns6JzzVVQbxLc9wlj-FZ2I84RL1Gc2fwXhr1Szcq-CNBWj9kKkxG0IEbUMfVWgAWFmebOQYzmMONz4AZInJR01lyW7GRC9Ie0A/qbIsH09BdOZKpqBYLsOrnFTxVDhdmzQP5I6JVpAaElY",
    banner_url: "https://v5.airtableusercontent.com/v3/u/26/26/1710705600000/YSVnN4z2SzmPTtcdT1DWyQ/FjV9eHOMYCaSjmWwRTKm1K7uPnyFKMx9Gi3lkXmM3uYYiZMFdbzRGNJlLDsmgrvyCQePWnx-52r9n75YFYtk8JAK6HFHvitWygeW3pqfe4KjgpNAm4Z7Ybggzi9vBzEJUQV8NRqOtxPUkYcdwqFClQ/4M8r-7X7nkE1DzrbhhXT7e9pWIDuk0uWm5zcGYbrSWs",
    
  }
]


const listing = async ({strapi}) => {
  try {
    for (let i = 0; i < willListingCollecitons.length; i++) {
      const willListingColleciton = willListingCollecitons[i];
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
        total_supply: collectionDataByEthers.collectionData.total_supply,
        nftDataList: collectionDataByEthers.nftDataList
      }

      if (!checkIsValidCollectionDataForDB(collectionDataForDB)) {
        console.log(`Not Valid Data - ${willListingColleciton.name}`)
        continue
      }
      
      await createCollectionAndNFTData({strapi,collectionDataForDB })




      
    }


    
  } catch (error) {
    console.error(error.message)
  }
}

// listing({strapi: null})

module.exports = {
  listing
}