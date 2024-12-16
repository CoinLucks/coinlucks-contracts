import { task } from "hardhat/config";
import assert from "assert";
import { getDeploymentAddresses, getDeploymentArgs } from "@/utils/readDeployment";
import { tryRun } from "@/utils/common";
import { VRFCoordinatorContractABI } from "./VRFCoordinatorContractABI";
import { formatEther } from "ethers";

task("addConsumer", "Add consumer contract to the subscription account").setAction(async (_, hre) => {
  const network = hre.network.name;

  const [deployer, caller] = await hre.ethers.getSigners();
  const addresses = getDeploymentAddresses(hre.network.config.chainId!.toString());

  const args = getDeploymentArgs(network).VRF;
  let subId = args.subId;
  if (subId) {
    const contract = new hre.ethers.Contract(args.vrfCoordinator, VRFCoordinatorContractABI, deployer);

    await tryRun(async () => {
      await printSubscription(contract, subId);

      await contract.addConsumer(subId, addresses.CoinFlipVRF);
      await contract.addConsumer(subId, addresses.DiceShakeVRF);
      await contract.addConsumer(subId, addresses.Scratch69VRF);
      // await contract.addConsumer(subId, addresses.RaffleVRF);

      await new Promise((resolve) => setTimeout(resolve, 3000));

      await printSubscription(contract, subId);
      // console.assert(subInfo, "add and getSubscription failed");

      // if (
      //   subInfo.consumers.length !== newSubInfo.consumers.length &&
      //   subInfo.consumers.length !== newSubInfo.consumers.length - 1
      // ) {
      //   assert.fail("addConsumer failed");
      // }
    });
  }
  console.log(`network: ${network} > addConsumer > subId: ${subId} >`);
});

task("getConsumers", "Check subscription account information").setAction(async (_, hre) => {
  const network = hre.network.name;

  const [deployer, caller] = await hre.ethers.getSigners();

  const args = getDeploymentArgs(network).VRF;
  let subId = args.subId;
  if (subId) {
    const contract = new hre.ethers.Contract(args.vrfCoordinator, VRFCoordinatorContractABI, deployer);

    await printSubscription(contract, subId);
  }
});

async function printSubscription(contract, subId) {
  await tryRun(async () => {
    const subInfo = await contract.getSubscription(subId);

    const [balance, count, owner, list] = subInfo;
    const info = {
      balance: formatEther(balance),
      count: count,
      owner: owner,
      list: list,
    };
    console.table([info]);
  });
}
