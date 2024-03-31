"use strict";
const { ethers, BigNumber } = require("ethers");
require("dotenv").config();
const BN = require("bn.js");

const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3(
  "https://rpc.ankr.com/blast/73a9b5e44df22487ad7bab31df917958efd0f16bc7d83fcec50a565e1a0c1aee"
);
const wallet_platform_fee_receiver = web3.eth.accounts.wallet.add(
  process.env.PLATFORM_FEE_RECEIVER_PRIVATE_KEY
);
const wallet_wen_trade_pool_owner = web3.eth.accounts.wallet.add(
  process.env.WEN_TRADE_POOL_OWNER_PRIVATE_KEY
);

const private_team_wallet_address =
  "0xB00c8F6503bE4f4e67c9a6B01f765Cc3eeb32aF4";
const WenTradePoolAddress = "0x9894C3E9ff7Bda4Ec48242700465043a4861c29b";
const WenGasStationAddress = ""; //TODO : Gas station
const WenOGPassStakingAddress = "0xcCBA7f02f53b3cE11eBF9Bf15067429fE6479bC2";
const wenETHTokenAddress = "0xE1492F298fCDDD26e1D953c7dC88E5143aCa5FeA";
const IBlastAddress = "0x4300000000000000000000000000000000000002";

// TODO : Gas station
// var WenGasStation = require("./abis/WenGasStationV1.json");
// const WenGasStationContract = new ethers.Contract(
//   WenGasStation.abi,
//   WenGasStationAddress,
//   signer
// );

var WenTradePool = require("./abis/WenTradePoolV1.json");
const WenTradePoolContract = new web3.eth.Contract(
  WenTradePool.abi,
  WenTradePoolAddress
);

var WenETH = require("./abis/MockERC20.json");
const WenETHToken = new web3.eth.Contract(WenETH.abi, wenETHTokenAddress);

var WenOGPassStaking = require("./abis/WenOGPassStakingV1.json");
const WenOGPassStakingContract = new web3.eth.Contract(
  WenOGPassStaking.abi,
  WenOGPassStakingAddress
);

var IBlast = require("./abis/IBlast.json");
const IBlastContract = new web3.eth.Contract(IBlast.abi, IBlastAddress);

/**
 * @description Protocol Fee Receiever Job (Signer : PlatformFeeReceiver 0x4123B6B29006Ed7160B2EEDB89A0c062F976b511)
 *                  1. Send 93.4% to Team Private Wallet
 *                  2. Stake 6.6% of ETH to WenEthTradePool
 *                  3. Send 6.6% to Wen OG Pass staking
 *                  4. Call updateReward function on Wen OG pass staking
 *                  5. Update APY info -
 */

async function protocolFeeReceiverJob() {
  let gasEstimated;
  let gasLimit;
  let gasPrice;

  let beforeAdminETHBalance = await web3.eth.getBalance(
    wallet_platform_fee_receiver.address
  );
  const beforeWenTradePoolETHBalance = await web3.eth.getBalance(
    WenTradePoolAddress
  );

  const beforeTeamWalletETHBalance = await web3.eth.getBalance(
    private_team_wallet_address
  );
  const beforeContractEthBalance = await web3.eth.getBalance(
    WenTradePoolAddress
  );

  console.log(
    ethers.utils.formatEther(beforeAdminETHBalance),
    `\n`,
    ethers.utils.formatEther(beforeWenTradePoolETHBalance),
    `\n`,
    ethers.utils.formatEther(beforeTeamWalletETHBalance),
    `\n`,
    ethers.utils.formatEther(beforeContractEthBalance),
    `\n`
  );

  // 1. Send 93.4% to Team Private Wallet

  console.log(
    "original eth :  ",
    ethers.utils.formatEther(beforeAdminETHBalance)
  );
  if (parseFloat(ethers.utils.formatEther(beforeAdminETHBalance)) < 0.0051) {
    return;
  }
  const distributingAmount = new BN(beforeAdminETHBalance).sub(
    new BN(ethers.utils.parseEther("0.005").toString())
  ); // Subtract Gas Fee
  const toTeamAmount = distributingAmount.mul(new BN(934)).div(new BN(1000));
  const toWenOGPassAmount = distributingAmount.sub(toTeamAmount);
  console.log(
    "to Team :  ",
    ethers.utils.formatEther(toTeamAmount.toString()),
    "to WenOGPassAmount : ",
    ethers.utils.formatEther(toWenOGPassAmount.toString())
  );

  console.log(
    `1. Sending ${ethers.utils.formatEther(
      toTeamAmount.toString()
    )}eth to ${private_team_wallet_address}`
  );

  let txHash = await web3.eth.sendTransaction({
    from: wallet_platform_fee_receiver.address,
    to: private_team_wallet_address,
    value: toTeamAmount,
    gas: 100000,
  });

  console.log(` tx done... ${txHash.transactionHash}`);

  // 2. Stake 6.6% of ETH to WenEthTradePool
  console.log(
    `2. Staking ${ethers.utils.formatEther(
      toWenOGPassAmount.toString()
    )} to Wen Trade Pool`
  );

  const beforeAdminMaticBalance = await web3.eth.getBalance(
    WenTradePoolAddress
  );

  console.log(toEther(beforeAdminMaticBalance));
  gasEstimated = await WenTradePoolContract.methods.stake().estimateGas({
    from: wallet_platform_fee_receiver.address,
    value: new BN(toWenOGPassAmount.toString()), // 예: 0.01 ETH를 wei 단위로 변환
  });

  gasLimit = parseInt((gasEstimated * 2).toString()); //(await web3.eth.getBlock('latest')).gasLimit
  gasPrice = new BN(await web3.eth.getGasPrice())
    .mul(new BN(140))
    .div(new BN(100));

  const result = await WenTradePoolContract.methods.stake().send({
    value: new BN(toWenOGPassAmount.toString()),
    from: wallet_platform_fee_receiver.address,
    gas: gasLimit,
    gasPrice: gasPrice,
  });

  const wenETHBalance = await WenETHToken.methods
    .balanceOf(wallet_platform_fee_receiver.address)
    .call();

  console.log(
    `Tx executed ${JSON.stringify(
      result
    )}, wenETHBalance: ${ethers.utils.formatEther(wenETHBalance)}`
  );

  //   3. Send 6.6% to Wen OG Pass staking
  console.log(
    `3. Sending ${ethers.utils.formatEther(
      wenETHBalance
    )}wenETH to Wen OG Pass Staking`
  );

  gasEstimated = await WenETHToken.methods
    .transfer(WenOGPassStakingAddress, wenETHBalance)
    .estimateGas({ from: wallet_platform_fee_receiver.address });

  gasLimit = parseInt((gasEstimated * 2).toString()); //(await web3.eth.getBlock('latest')).gasLimit
  gasPrice = new BN(await web3.eth.getGasPrice())
    .mul(new BN(140))
    .div(new BN(100));

  await WenETHToken.methods
    .transfer(WenOGPassStakingAddress, wenETHBalance)
    .send({
      from: wallet_platform_fee_receiver.address,
      gas: gasLimit,
      gasPrice: gasPrice,
    });

  // 4. UpdateReward
  console.log(`4. Call updateReward function on Wen OG pass staking`);
  gasEstimated = await WenOGPassStakingContract.methods
    .updateRewardAmount()
    .estimateGas({ from: wallet_platform_fee_receiver.address });

  gasLimit = parseInt((gasEstimated * 2).toString()); //(await web3.eth.getBlock('latest')).gasLimit
  gasPrice = new BN(await web3.eth.getGasPrice())
    .mul(new BN(140))
    .div(new BN(100));

  await WenOGPassStakingContract.methods.updateRewardAmount().send({
    from: wallet_platform_fee_receiver.address,
    gas: gasLimit,
    gasPrice: gasPrice,
  });

  // 5. [TODO-APR] Update APR related Info
  // 1. 오늘 적립한 이자 저장 wenETH to Wen Staking
  // 2. Wen OG Pass Floor Price 저장

  const afterWenTradePoolETHBalance = await web3.eth.getBalance(
    WenTradePoolAddress
  );
  const afterAdminETHBalance = await web3.eth.getBalance(
    wallet_platform_fee_receiver.address
  );

  const afterTeamWalletETHBalance = await web3.eth.getBalance(
    private_team_wallet_address
  );
  const contractEthBalance = await web3.eth.getBalance(WenTradePoolAddress);

  console.log(
    ethers.utils.formatEther(afterWenTradePoolETHBalance),
    `\n`,
    ethers.utils.formatEther(afterAdminETHBalance),
    `\n`,
    ethers.utils.formatEther(afterTeamWalletETHBalance),
    `\n`,
    ethers.utils.formatEther(contractEthBalance),
    `\n`
  );

  return {
    ETHtoTeamWallet: ethers.utils.formatEther(toTeamAmount.toString()),
    wenETHtoWenStaking: ethers.utils.formatEther(wenETHBalance.toString()),
  };
}

/**
 * @description  Wen Trade Pool Job (Signer : Wen OG Pass Staking / Wen Trade Pool Ownesr 0x74EB6A2733775384D51DcEa604F7Dd4094ce1584)
 *                  1. claim all yield from Blast

 */

async function claimAllBlastYieldFromWenTradePool() {
  let gasEstimated;
  let gasLimit;
  let gasPrice;

  const beforeWenTradePoolETHBalance = new BN(
    await web3.eth.getBalance(WenTradePoolAddress)
  );

  console.log(
    `claimAllBlastYieldFromWenTradePool.. `,
    beforeWenTradePoolETHBalance.toString()
  );
  gasEstimated = await IBlastContract.methods
    .claimAllYield(WenTradePoolAddress, WenTradePoolAddress)
    .estimateGas({ from: wallet_wen_trade_pool_owner.address });

  gasLimit = parseInt((gasEstimated * 2).toString()); //(await web3.eth.getBlock('latest')).gasLimit
  gasPrice = new BN(await web3.eth.getGasPrice())
    .mul(new BN(140))
    .div(new BN(100));

  await IBlastContract.methods
    .claimAllYield(WenTradePoolAddress, WenTradePoolAddress)
    .send({
      from: wallet_wen_trade_pool_owner.address,
      gas: gasLimit,
      gasPrice: gasPrice,
    });

  const afterWenTradePoolETHBalance = new BN(
    await web3.eth.getBalance(WenTradePoolAddress)
  );

  const contractEthBalance = await web3.eth.getBalance(WenTradePoolAddress);

  // 5. [TODO-APR] Update APR related Info
  // 1. 오늘 Wen Trade Pool 에 적립한 이자 저장  (return 의 claimedETH)
  // 2. 현재 contractEthBalance 저장  (return 의 contractEthBalance)

  return {
    claimedETH: ethers.utils.formatEther(
      afterWenTradePoolETHBalance.sub(beforeWenTradePoolETHBalance).toString()
    ),
    contractEthBalance: ethers.utils.formatEther(contractEthBalance),
  };
}

/**
 * @description  Gas Station Job
 *              - TODO: Need to be updated.
 */
// //TODO: NEED TO CHANGE(CLAIM ALL GAS FEE) ON PRODUCTION
// async function claimAllGasFees() {
//   let gasEstimated;
//   let gasLimit;
//   let gasPrice;
//   let txHash;

//   const beforeAdminETHBalance = await web3.eth.getBalance(wallet.address);
//   const beforeGasStationETHBalance = await web3.eth.getBalance(
//     WenGasStationAddress
//   );

//   // Claim All Gas Fee //TODO: This should be updated to maximize gas fee refund.
//   gasEstimated = await WenGasStationContract.methods
//     // .claimGasAtMinClaimRate(new BN(1000))
//     .claimAllByContract(WenTradePoolAddress)
//     .estimateGas({
//       from: wallet.address,
//     });

//   gasLimit = parseInt((gasEstimated * 2).toString());
//   gasPrice = new BN(await web3.eth.getGasPrice())
//     .mul(new BN(140))
//     .div(new BN(100));

//   await WenGasStationContract.methods
//     // .claimGasAtMinClaimRate(new BN(1000))
//     .claimAllByContract(WenTradePoolAddress)
//     .send({
//       from: wallet.address,
//       gas: gasLimit,
//       gasPrice: gasPrice,
//     })
//     .on("transactionHash", function (hash) {
//       txHash = hash;
//     });

//   const afterGasStationETHBalance = await web3.eth.getBalance(
//     WenGasStationAddress
//   );
//   const afterAdminETHBalance = await web3.eth.getBalance(wallet.address);

//   return {
//     usedETHForGas: new BN(beforeAdminETHBalance).sub(
//       new BN(afterAdminETHBalance)
//     ),
//     claimedETH: new BN(afterGasStationETHBalance).sub(
//       new BN(beforeGasStationETHBalance)
//     ),
//     txHash,
//   };
// }

// async function distributeGasFees() {
//   let gasEstimated;
//   let gasLimit;
//   let gasPrice;
//   let txHash;

//   const beforeAdminETHBalance = await web3.eth.getBalance(wallet.address);
//   const beforeGasStationETHBalance = await web3.eth.getBalance(
//     WenGasStationAddress
//   );

//   gasEstimated = await WenGasStationContract.methods
//     .distributeFees()
//     .estimateGas({
//       from: wallet.address,
//     });

//   gasLimit = parseInt((gasEstimated * 2).toString());
//   gasPrice = new BN(await web3.eth.getGasPrice())
//     .mul(new BN(140))
//     .div(new BN(100));

//   await WenGasStationContract.methods
//     .distributeFees()
//     .send({
//       from: wallet.address,
//       gas: gasLimit,
//       gasPrice: gasPrice,
//     })
//     .on("transactionHash", function (hash) {
//       txHash = hash;
//     });

//   const afterGasStationETHBalance = await web3.eth.getBalance(
//     WenGasStationAddress
//   );
//   const afterAdminETHBalance = await web3.eth.getBalance(wallet.address);

//   return {
//     usedETHForGas: new BN(beforeAdminETHBalance).sub(
//       new BN(afterAdminETHBalance)
//     ),
//     distributedETH: new BN(beforeGasStationETHBalance).sub(
//       new BN(afterGasStationETHBalance)
//     ),
//     txHash,
//   };
// }

function toEther(num) {
  return parseFloat(web3.utils.fromWei(num, "ether")).toFixed(5);
}

async function test() {
  console.log(await claimAllBlastYieldFromWenTradePool());
}
test();
module.exports = {};
