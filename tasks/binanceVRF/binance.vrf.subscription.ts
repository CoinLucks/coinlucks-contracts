import { task } from "hardhat/config";
import { getDeploymentArgs } from "@/utils/readDeployment";
import { VRFCoordinatorContractABI } from "./VRFCoordinatorContractABI";
import { tryRun } from "@/utils/common";

task("createSubscription", "Create Binance VRF Subscription").setAction(async (_, hre) => {
  const network = hre.network.name;

  const [deployer, caller] = await hre.ethers.getSigners();

  const args = getDeploymentArgs(network).VRF;
  let subId = args.subId;

  if (subId == "") {
    const contract = new hre.ethers.Contract(args.vrfCoordinator, VRFCoordinatorContractABI, deployer);

    await tryRun(async () => {
      const tx = await contract.createSubscription();
      console.log("Transaction submitted:", tx.hash);

      const receipt = await tx.wait();

      const event = receipt.logs.find(
        (log) => log.topics[0] === "0x464722b4166576d3dcbba877b999bc35cf911f4eaf434b7eba68fa113951d0bf",
      );

      if (event) {
        subId = BigInt(event.topics[1]).toString();
        console.log(`Subscription created with ID: ${subId}`);
      }
    });
  }
  console.log(`network: ${network} > createSubscription > subId: ${subId}`);
});
