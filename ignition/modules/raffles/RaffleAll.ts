import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import RaffleModule from "./Raffle";
import RaffleVRFModule from "./RaffleVRF";
import ReferralModule from "../referrals/Referral";
import { isLocal } from "@/utils/network";

const RaffleAllModule = buildModule("RaffleAllModule", (m) => {
  // Raffle contracts
  const { raffleContract } = m.useModule(RaffleModule);
  const { raffleVRF } = m.useModule(RaffleVRFModule);
  const { referral } = m.useModule(ReferralModule);

  // Inital settings
  m.call(raffleContract, "setInterface", [raffleVRF, referral], {
    after: [raffleVRF, referral],
  });

  m.call(referral, "setOperator", [raffleContract, true]);

  // Set verify address
  if (isLocal()) {
  } else {
    // from json
  }

  return {
    raffleContract,
    raffleVRF,
    referral
  };
});

export default RaffleAllModule;
