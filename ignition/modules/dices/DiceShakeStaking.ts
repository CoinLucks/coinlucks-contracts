import hre from "hardhat";
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import DiceShakeModule from "./DiceShake";
import BetGameFactoryModule from "../factory/BetGameFactory";

const DiceShakeStakingModule = buildModule("DiceShakeStakingModule", (m) => {
  const { diceShake } = m.useModule(DiceShakeModule);
  const { betGameFactory } = m.useModule(BetGameFactoryModule);

  const diceShakeStaking = m.contract("BetGameStaking", [diceShake], {
    after: [diceShake, betGameFactory],
    id: "diceShakeStaking",
  });

  // add to BetGameFactory
  m.call(betGameFactory, "add", [diceShake, diceShakeStaking, "dices", "DiceShake"]);

  return {
    diceShakeStaking,
  };
});

export default DiceShakeStakingModule;
