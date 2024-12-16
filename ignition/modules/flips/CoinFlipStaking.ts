import hre from "hardhat";
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import CoinFlipModule from "./CoinFlip";
import BetGameFactoryModule from "../factory/BetGameFactory";

const CoinFlipStakingModule = buildModule("CoinFlipStakingModule", (m) => {
  const { coinFlip } = m.useModule(CoinFlipModule);
  const { betGameFactory } = m.useModule(BetGameFactoryModule);
  const coinFlipStaking = m.contract("BetGameStaking", [coinFlip], {
    after: [coinFlip, betGameFactory],
    id: "coinFlipStaking",
  });

  // add to BetGameFactory
  m.call(betGameFactory, "add", [coinFlip, coinFlipStaking, "flips", "CoinFlip"]);

  return {
    coinFlipStaking,
  };
});

export default CoinFlipStakingModule;
