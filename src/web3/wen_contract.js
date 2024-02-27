"use strict";

require("dotenv").config();
const BN = require("bn.js");

//WEB3 Config
const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3(process.env.BLAST_TESTNET_RPC_URL);
const wallet = web3.eth.accounts.wallet.add(process.env.WEN_BOT_PRIVATE_KEY);

// [ Testnet Contract Addresses ]
// Wen Trade Pool
const WenTradePoolAddress = "0x2d8c05bc2669C4f33B140871b4171f0555DE0E86";
// Gas station
const WenGasStationAddress = "0xE1178f7eD637e70B551596e48c651CAF3394c247";
var WenGasStation = require("./abis/WenGasStationV1.json");
const WenGasStationContract = new web3.eth.Contract(
  WenGasStation.abi,
  WenGasStationAddress
);

async function claimAllBlastYieldFromWenTradePool() {
  let gasEstimated;
  let gasLimit;
  let gasPrice;
  let txHash;

  const beforeAdminETHBalance = await web3.eth.getBalance(wallet.address);
  const beforeWenTradePoolETHBalance = await web3.eth.getBalance(
    WenTradePoolAddress
  );

  // Claim All Yield
  gasEstimated = await WenGasStationContract.methods
    .claimAllYield(WenTradePoolAddress, WenTradePoolAddress)
    .estimateGas({
      from: wallet.address,
    });

  gasLimit = parseInt((gasEstimated * 2).toString());
  gasPrice = new BN(await web3.eth.getGasPrice())
    .mul(new BN(140))
    .div(new BN(100));

  await WenGasStationContract.methods
    .claimAllYield(WenTradePoolAddress, WenTradePoolAddress)
    .send({
      from: wallet.address,
      gas: gasLimit,
      gasPrice: gasPrice,
    })
    .on("transactionHash", function (hash) {
      txHash = hash;
    });

  const afterWenTradePoolETHBalance = await web3.eth.getBalance(
    WenTradePoolAddress
  );
  const afterAdminETHBalance = await web3.eth.getBalance(wallet.address);

  const contractEthBalance = await web3.eth.getBalance(WenTradePoolAddress);

  return {
    usedETHForGas: new BN(beforeAdminETHBalance).sub(
      new BN(afterAdminETHBalance)
    ),
    claimedETH: new BN(afterWenTradePoolETHBalance).sub(
      new BN(beforeWenTradePoolETHBalance)
    ),
    txHash,
    contractEthBalance: new BN(contractEthBalance),
  };
}

//TODO: NEED TO CHANGE(CLAIM ALL GAS FEE) ON PRODUCTION
async function claimAllGasFees() {
  let gasEstimated;
  let gasLimit;
  let gasPrice;
  let txHash;

  const beforeAdminETHBalance = await web3.eth.getBalance(wallet.address);
  const beforeGasStationETHBalance = await web3.eth.getBalance(
    WenGasStationAddress
  );

  // Claim All Gas Fee //TODO: This should be updated to maximize gas fee refund.
  gasEstimated = await WenGasStationContract.methods
    // .claimGasAtMinClaimRate(new BN(1000))
    .claimAllByContract(WenTradePoolAddress)
    .estimateGas({
      from: wallet.address,
    });

  gasLimit = parseInt((gasEstimated * 2).toString());
  gasPrice = new BN(await web3.eth.getGasPrice())
    .mul(new BN(140))
    .div(new BN(100));

  await WenGasStationContract.methods
    // .claimGasAtMinClaimRate(new BN(1000))
    .claimAllByContract(WenTradePoolAddress)
    .send({
      from: wallet.address,
      gas: gasLimit,
      gasPrice: gasPrice,
    })
    .on("transactionHash", function (hash) {
      txHash = hash;
    });

  const afterGasStationETHBalance = await web3.eth.getBalance(
    WenGasStationAddress
  );
  const afterAdminETHBalance = await web3.eth.getBalance(wallet.address);

  return {
    usedETHForGas: new BN(beforeAdminETHBalance).sub(
      new BN(afterAdminETHBalance)
    ),
    claimedETH: new BN(afterGasStationETHBalance).sub(
      new BN(beforeGasStationETHBalance)
    ),
    txHash,
  };
}

async function distributeGasFees() {
  let gasEstimated;
  let gasLimit;
  let gasPrice;
  let txHash;

  const beforeAdminETHBalance = await web3.eth.getBalance(wallet.address);
  const beforeGasStationETHBalance = await web3.eth.getBalance(
    WenGasStationAddress
  );

  gasEstimated = await WenGasStationContract.methods
    .distributeFees()
    .estimateGas({
      from: wallet.address,
    });

  gasLimit = parseInt((gasEstimated * 2).toString());
  gasPrice = new BN(await web3.eth.getGasPrice())
    .mul(new BN(140))
    .div(new BN(100));

  await WenGasStationContract.methods
    .distributeFees()
    .send({
      from: wallet.address,
      gas: gasLimit,
      gasPrice: gasPrice,
    })
    .on("transactionHash", function (hash) {
      txHash = hash;
    });

  const afterGasStationETHBalance = await web3.eth.getBalance(
    WenGasStationAddress
  );
  const afterAdminETHBalance = await web3.eth.getBalance(wallet.address);

  return {
    usedETHForGas: new BN(beforeAdminETHBalance).sub(
      new BN(afterAdminETHBalance)
    ),
    distributedETH: new BN(beforeGasStationETHBalance).sub(
      new BN(afterGasStationETHBalance)
    ),
    txHash,
  };
}

// async function test() {
//   let result = await claimAllBlastYieldFromWenTradePool();
//   console.log(
//     "result: ",
//     toEther(result.usedETHForGas).toString(),
//     "  & ",
//     toEther(result.claimedETH).toString(),
//     "  hash : ",
//     result.txHash
//   );
// }

// async function getBalance(address, tokenAddress) {
//   const tokenContract = new web3.eth.Contract(IERC20.abi, tokenAddress);
//   const tokenBalance = await tokenContract.methods.balanceOf(address).call();
//   return tokenBalance;
// }

function toEther(num) {
  return parseFloat(web3.utils.fromWei(num, "ether")).toFixed(18);
}

module.exports = {
  distributeGasFees,
  claimAllBlastYieldFromWenTradePool,
  claimAllGasFees,
};
