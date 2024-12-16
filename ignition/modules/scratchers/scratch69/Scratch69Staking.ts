import hre from "hardhat";
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import Scratch69Module from "./Scratch69";
import BetGameFactoryModule from "../../factory/BetGameFactory";

const Scratch69StakingModule = buildModule("Scratch69StakingModule", (m) => {
  const { scratch69 } = m.useModule(Scratch69Module);
  const { betGameFactory } = m.useModule(BetGameFactoryModule);

  const scratch69Staking = m.contract("BetGameStaking", [scratch69], {
    after: [scratch69, betGameFactory],
    id: "scratch69Staking",
  });

  // add to BetGameFactory
  m.call(betGameFactory, "add", [scratch69, scratch69Staking, "scratchers", "Scratch69"]);

  return {
    scratch69Staking,
  };
});

export default Scratch69StakingModule;
