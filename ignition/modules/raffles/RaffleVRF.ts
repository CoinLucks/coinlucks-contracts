import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import hre from "hardhat";
import { isBnbChain, isLocal } from "@/utils/network";
import { getDeploymentArgs } from "@/utils/readDeployment";
import RaffleModule from "./Raffle";

const RaffleVRFModule = buildModule("RaffleVRFModule", (m) => {
  const network = hre.network.name;

  const { raffleContract } = m.useModule(RaffleModule);

  // VRF contract
  const args = getDeploymentArgs(network).VRF;
  const subId = args.subId;
  const keyHash = args.keyHash;
  const callbackGasLimit = args.callbackGasLimit;
  const requestConfirmations = args.requestConfirmations;
  const vrfCoordinator = args.vrfCoordinator;

  let raffleVRF: any;

  if (!isLocal()) {
    raffleVRF = m.contract(
      isBnbChain() ? "BinanceVRF" : "ChainlinkVRF25",
      [
        subId,
        keyHash,
        callbackGasLimit,
        requestConfirmations,
        vrfCoordinator,
        raffleContract,
      ],
      { after: [raffleContract], id: "raffleVRF" },
    );
  } else {
    // mock contract for local test
    raffleVRF = m.contract(
      "MockVRF",
      [
        subId,
        keyHash,
        callbackGasLimit,
        requestConfirmations,
        vrfCoordinator,
        raffleContract,
      ],
      { after: [raffleContract], id: "raffleVRF" },
    );
  }

  return {
    raffleVRF,
  };
});

export default RaffleVRFModule;
