import hre from "hardhat";
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import CoinFlipVRFModule from "./CoinFlipVRF";
import ReferralModule from "../referrals/Referral";

import CoinFlipModule from "./CoinFlip";
import CoinFlipStakingModule from "./CoinFlipStaking";
import { getDeploymentArgs } from "@/utils/readDeployment";

const CoinFlipAllModule = buildModule("CoinFlipAllModule", (m) => {
  const { coinFlip } = m.useModule(CoinFlipModule);
  const { coinFlipVRF } = m.useModule(CoinFlipVRFModule);
  const { referral } = m.useModule(ReferralModule);
  const { coinFlipStaking } = m.useModule(CoinFlipStakingModule);

  const network = hre.network.name;

  const args = getDeploymentArgs(network).Setting;

  // Inital settings
  m.call(coinFlip, "setInterfaces", [[coinFlipVRF, referral]], {
    after: [coinFlipVRF, referral],
  });
  m.call(coinFlip, "setFeeAddress", [
    [coinFlipStaking, args.FeeAddress?.charity || m.getAccount(15), args.FeeAddress?.platform || m.getAccount(16)],
  ]);

  m.call(referral, "setOperator", [coinFlip, true]);

  return {
    coinFlip,
    coinFlipVRF,
    coinFlipStaking,
    referral,
  };
});

export default CoinFlipAllModule;
