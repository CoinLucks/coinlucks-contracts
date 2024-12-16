import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import hre from "hardhat";
import { isBnbChain, isLocal } from "@/utils/network";
import { getDeploymentArgs } from "@/utils/readDeployment";
import CoinFlipModule from "./CoinFlip";

const CoinFlipVRFModule = buildModule("CoinFlipVRFModule", (m) => {
  const network = hre.network.name;

  const { coinFlip } = m.useModule(CoinFlipModule);

  // VRF contract
  const args = getDeploymentArgs(network).VRF;
  const subId = args.subId;
  const keyHash = args.keyHash;
  const callbackGasLimit = args.callbackGasLimit;
  const requestConfirmations = args.requestConfirmations;
  const vrfCoordinator = args.vrfCoordinator;

  let coinFlipVRF: any;

  if (!isLocal()) {
    coinFlipVRF = m.contract(
      isBnbChain() ? "BinanceVRF" : "ChainlinkVRF25",
      [
        subId,
        keyHash,
        callbackGasLimit,
        requestConfirmations,
        vrfCoordinator,
        coinFlip,
      ],
      { after: [coinFlip], id: "coinFlipVRF" },
    );
  } else {
    // mock contract for local test
    coinFlipVRF = m.contract(
      "MockVRF",
      [
        subId,
        keyHash,
        callbackGasLimit,
        requestConfirmations,
        vrfCoordinator,
        coinFlip,
      ],
      { after: [coinFlip], id: "coinFlipVRF" },
    );
  }

  return {
    coinFlipVRF,
  };
});

export default CoinFlipVRFModule;
