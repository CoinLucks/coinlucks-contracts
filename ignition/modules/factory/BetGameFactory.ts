import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BetGameFactoryModule = buildModule("BetGameFactoryModule", (m) => {

  const betGameFactory = m.contract("BetGameFactory", [], {});
  return {
    betGameFactory,
  };
});

export default BetGameFactoryModule;
