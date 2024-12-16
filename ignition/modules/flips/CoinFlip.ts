import hre from "hardhat";
import { getDeploymentArgs } from "@/utils/readDeployment";
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CoinFlipModule = buildModule("CoinFlipModule", (m) => {
  const network = hre.network.name;

  const args = getDeploymentArgs(network).CoinFlip;
  const fee = args.fee;
  const jackpotRate = args.jackpotRate;
  const streakRate = args.streakRate;
  const minBet = args.minBet;
  const maxBet = args.maxBet;

  const coinFlip = m.contract("CoinFlip", [fee, jackpotRate, streakRate, minBet, maxBet], {});

  return {
    coinFlip,
  };
});

export default CoinFlipModule;
