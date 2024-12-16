import hre from "hardhat";
import { getDeploymentArgs } from "@/utils/readDeployment";
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DiceShakeModule = buildModule("DiceShakeModule", (m) => {
  const network = hre.network.name;

  const args = getDeploymentArgs(network).DiceShake;
  const fee = args.fee;
  const jackpotRate = args.jackpotRate;
  const streakRate = args.streakRate;
  const minBet = args.minBet;
  const maxBet = args.maxBet;

  const diceShake = m.contract("DiceShake", [fee, jackpotRate, streakRate, minBet, maxBet], {});

  return {
    diceShake,
  };
});

export default DiceShakeModule;
