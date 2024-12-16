import hre from "hardhat";
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

import DiceShakeVRFModule from "./DiceShakeVRF";
import ReferralModule from "../referrals/Referral";

import DiceShakeModule from "./DiceShake";
import DiceShakeStakingModule from "./DiceShakeStaking";
import { getDeploymentArgs } from "@/utils/readDeployment";

const DiceShakeAllModule = buildModule("DiceShakeAllModule", (m) => {
  const { diceShake } = m.useModule(DiceShakeModule);
  const { diceShakeVRF } = m.useModule(DiceShakeVRFModule);
  const { referral } = m.useModule(ReferralModule);
  const { diceShakeStaking } = m.useModule(DiceShakeStakingModule);

  const network = hre.network.name;
  const args = getDeploymentArgs(network).Setting;

  // Inital settings
  m.call(diceShake, "setInterfaces", [[diceShakeVRF, referral]], {
    after: [diceShakeVRF, referral],
  });

  m.call(diceShake, "setFeeAddress", [
    [diceShakeStaking, args.FeeAddress?.charity || m.getAccount(15), args.FeeAddress?.platform || m.getAccount(16)],
  ]);

  m.call(referral, "setOperator", [diceShake, true]);
  
  return {
    diceShake,
    diceShakeVRF,
    diceShakeStaking,
    referral
  };
});

export default DiceShakeAllModule;
