import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import hre from "hardhat";
import { isBnbChain, isLocal } from "@/utils/network";
import { getDeploymentArgs } from "@/utils/readDeployment";
import Scratch69Module from "./Scratch69";


const Scratch69VRFModule = buildModule("Scratch69VRFModule", (m) => {
  const network = hre.network.name;

  const { scratch69 } = m.useModule(Scratch69Module);

  // VRF contract
  const args = getDeploymentArgs(network).VRF;
  const subId = args.subId;
  const keyHash = args.keyHash;
  const callbackGasLimit = args.callbackGasLimit;
  const requestConfirmations = args.requestConfirmations;
  const vrfCoordinator = args.vrfCoordinator;

  let scratch69VRF: any;

  if (!isLocal()) {
    scratch69VRF = m.contract(
      isBnbChain() ? "BinanceVRF" : "ChainlinkVRF25",
      [
        subId,
        keyHash,
        callbackGasLimit,
        requestConfirmations,
        vrfCoordinator,
        scratch69,
      ],
      { after: [scratch69], id: "scratch69VRF" },
    );
  } else {
    // mock contract for local test
    scratch69VRF = m.contract(
      "MockVRF",
      [
        subId,
        keyHash,
        callbackGasLimit,
        requestConfirmations,
        vrfCoordinator,
        scratch69,
      ],
      { after: [scratch69], id: "scratch69VRF" },
    );
  }

  return {
    scratch69VRF,
  };
});

export default Scratch69VRFModule;
