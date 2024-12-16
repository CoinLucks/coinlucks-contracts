import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import hre from "hardhat";
import { isBnbChain, isLocal } from "@/utils/network";
import { getDeploymentArgs } from "@/utils/readDeployment";
import DiceShakeModule from "./DiceShake";

const DiceShakeVRFModule = buildModule("DiceShakeVRFModule", (m) => {
  const network = hre.network.name;

  const { diceShake } = m.useModule(DiceShakeModule);

  // VRF contract
  const args = getDeploymentArgs(network).VRF;
  const subId = args.subId;
  const keyHash = args.keyHash;
  const callbackGasLimit = args.callbackGasLimit;
  const requestConfirmations = args.requestConfirmations;
  const vrfCoordinator = args.vrfCoordinator;

  let diceShakeVRF: any;

  if (!isLocal()) {
    diceShakeVRF = m.contract(
      isBnbChain() ? "BinanceVRF" : "ChainlinkVRF25",
      [
        subId,
        keyHash,
        callbackGasLimit,
        requestConfirmations,
        vrfCoordinator,
        diceShake,
      ],
      { after: [diceShake], id: "diceShakeVRF" },
    );
  } else {
    // mock contract for local test
    diceShakeVRF = m.contract(
      "MockVRF",
      [
        subId,
        keyHash,
        callbackGasLimit,
        requestConfirmations,
        vrfCoordinator,
        diceShake,
      ],
      { after: [diceShake], id: "diceShakeVRF" },
    );
  }

  return {
    diceShakeVRF,
  };
});

export default DiceShakeVRFModule;
