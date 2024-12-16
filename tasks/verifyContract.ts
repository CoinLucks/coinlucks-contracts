import { task } from "hardhat/config";
import { getDeploymentAddresses, getDeploymentArgs } from "@/utils/readDeployment";

export const tryVerify = async (fn: any) => {
  try {
    return await fn;
  } catch (ex) {
    console.error(ex);
  }
};

task("verifyContract", "verify the smartcontracts").setAction(async (_, hre) => {
  const network = hre.network.name;

  const [deployer, caller] = await hre.ethers.getSigners();

  const args = getDeploymentArgs(network).VRF;
  const subId = args.subId;
  const keyHash = args.keyHash;
  const callbackGasLimit = args.callbackGasLimit;
  const requestConfirmations = args.requestConfirmations;
  const vrfCoordinator = args.vrfCoordinator;

  const addresses = getDeploymentAddresses(hre.network.config.chainId!.toString());

  // BetGameFactory
  await tryVerify(hre.run("verify:verify", { address: addresses.BetGameFactory, constructorArguments: [] }));

  // Referral
  await tryVerify(
    hre.run("verify:verify", { address: addresses.Referral, constructorArguments: [hre.ethers.ZeroAddress] }),
  );

  // Raffles
  await tryVerify(hre.run("verify:verify", { address: addresses.RaffleContract, constructorArguments: [] }));
  await tryVerify(
    hre.run("verify:verify", {
      address: addresses.RaffleVRF,
      constructorArguments: [
        subId,
        keyHash,
        callbackGasLimit,
        requestConfirmations,
        vrfCoordinator,
        addresses.RaffleContract,
      ],
    }),
  );

  // Dices
  const argsDiceShake = getDeploymentArgs(network).DiceShake;
  await tryVerify(
    hre.run("verify:verify", {
      address: addresses.DiceShake,
      constructorArguments: [
        argsDiceShake.fee,
        argsDiceShake.jackpotRate,
        argsDiceShake.streakRate,
        argsDiceShake.minBet,
        argsDiceShake.maxBet,
      ],
    }),
  );
  await tryVerify(
    hre.run("verify:verify", {
      address: addresses.DiceShakeVRF,
      constructorArguments: [
        subId,
        keyHash,
        callbackGasLimit,
        requestConfirmations,
        vrfCoordinator,
        addresses.DiceShake,
      ],
    }),
  );
  await tryVerify(
    hre.run("verify:verify", {
      address: addresses.DiceShakeStaking,
      constructorArguments: [addresses.DiceShake],
    }),
  );

  // Flips
  const argsCoinFlip = getDeploymentArgs(network).CoinFlip;
  await tryVerify(
    hre.run("verify:verify", {
      address: addresses.CoinFlip,
      constructorArguments: [
        argsCoinFlip.fee,
        argsCoinFlip.jackpotRate,
        argsDiceShake.streakRate,
        argsCoinFlip.minBet,
        argsCoinFlip.maxBet,
      ],
    }),
  );
  await tryVerify(
    hre.run("verify:verify", {
      address: addresses.CoinFlipVRF,
      constructorArguments: [
        subId,
        keyHash,
        callbackGasLimit,
        requestConfirmations,
        vrfCoordinator,
        addresses.CoinFlip,
      ],
    }),
  );

  await tryVerify(
    hre.run("verify:verify", {
      address: addresses.CoinFlipStaking,
      constructorArguments: [addresses.CoinFlip],
    }),
  );

  // Scratchers
  const argsScratch69 = getDeploymentArgs(network).Scratch69;
  await tryVerify(
    hre.run("verify:verify", {
      address: addresses.Scratch69,
      constructorArguments: [
        argsScratch69.fee,
        argsScratch69.jackpotRate,
        argsScratch69.streakRate,
        argsScratch69.minBet,
        argsScratch69.maxBet,
      ],
    }),
  );
  await tryVerify(
    hre.run("verify:verify", {
      address: addresses.Scratch69VRF,
      constructorArguments: [
        subId,
        keyHash,
        callbackGasLimit,
        requestConfirmations,
        vrfCoordinator,
        addresses.Scratch69,
      ],
    }),
  );

  await tryVerify(
    hre.run("verify:verify", {
      address: addresses.Scratch69Staking,
      constructorArguments: [addresses.Scratch69],
    }),
  );

  // // Mocks
  // await tryVerify(hre.run("verify:verify", { address: addresses.MockUSDT, constructorArguments: [] }));
  // await tryVerify(
  //   hre.run("verify:verify", {
  //     contract: "contracts/mocks/MockNFTBoredApeYachtClub.sol:MockNFTBoredApeYachtClub",
  //     address: addresses.MockNFTBoredApeYachtClub,
  //     constructorArguments: [caller.address, 10],
  //   }),
  // );
});
