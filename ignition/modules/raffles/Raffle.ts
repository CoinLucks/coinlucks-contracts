import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const RaffleModule = buildModule("RaffleModule", (m) => {
  // Raffle contract
  const raffleContract = m.contract("RaffleContract", [], {});

  return {
    raffleContract,
  };
});

export default RaffleModule;
