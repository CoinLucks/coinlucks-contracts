import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "hardhat";

const ReferralModule = buildModule("ReferralModule", (m) => {
  // Referral contract
  const referral = m.contract("Referral", [ethers.ZeroAddress]);

  return {
    referral,
  };
});

export default ReferralModule;
