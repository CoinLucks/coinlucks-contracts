import hre from "hardhat";
import { getDeploymentArgs } from "@/utils/readDeployment";
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Scratch69Module = buildModule("Scratch69Module", (m) => {
  const network = hre.network.name;

  const args = getDeploymentArgs(network).Scratch69;
  const fee = args.fee;
  const jackpotRate = args.jackpotRate;
  const streakRate = args.streakRate;
  const minBet = args.minBet;
  const maxBet = args.maxBet;

  const scratch69 = m.contract("Scratch69", [fee, jackpotRate, streakRate, minBet, maxBet], {});

  return {
    scratch69,
  };
});

export default Scratch69Module;
