import hre from "hardhat";
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

import Scratch69VRFModule from "./Scratch69VRF";
import ReferralModule from "../../referrals/Referral";

import Scratch69Module from "./Scratch69";
import Scratch69StakingModule from "./Scratch69Staking";
import { getDeploymentArgs } from "@/utils/readDeployment";

const Scratch69AllModuleAll = buildModule("Scratch69AllModuleAll", (m) => {
  const { scratch69 } = m.useModule(Scratch69Module);
  const { scratch69VRF } = m.useModule(Scratch69VRFModule);
  const { referral } = m.useModule(ReferralModule);
  const { scratch69Staking } = m.useModule(Scratch69StakingModule);

  const network = hre.network.name;
  const args = getDeploymentArgs(network).Setting;

  // Inital settings
  m.call(scratch69, "setInterfaces", [[scratch69VRF, referral]], {
    after: [scratch69VRF, referral],
  });

  m.call(scratch69, "setFeeAddress", [
    [scratch69Staking, args.FeeAddress?.charity || m.getAccount(15), args.FeeAddress?.platform || m.getAccount(16)],
  ]);

  m.call(referral, "setOperator", [scratch69, true]);

  return {
    scratch69,
    scratch69VRF,
    scratch69Staking,
    referral,
  };
});

export default Scratch69AllModuleAll;
