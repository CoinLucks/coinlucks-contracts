import { task } from "hardhat/config";
import assert from "assert";
import { formatEther, parseEther } from "ethers";

import { getDeploymentArgs } from "@/utils/readDeployment";
import { tryRun } from "@/utils/common";
import { VRFCoordinatorContractABI } from "./VRFCoordinatorContractABI";

task("fundSubscription", "Fund the Binance VRF Subscription")
  .addParam("amount", "Funding amount")
  .setAction(async (taskArgs, hre) => {
    const network = hre.network.name;
    const amount = taskArgs.amount;
    const [deployer, caller] = await hre.ethers.getSigners();

    const args = getDeploymentArgs(network).VRF;
    let subId = args.subId;
    if (subId) {
      const contract = new hre.ethers.Contract(args.vrfCoordinator, VRFCoordinatorContractABI, deployer);
      await tryRun(async () => {
        const oldBalance = await hre.ethers.provider.getBalance(args.vrfCoordinator);
        // the params of the function deposit includes subId, type: uint64
        await contract.deposit(subId, {
          value: parseEther(amount),
          gasLimit: 500000,
        });
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const newBalance = await hre.ethers.provider.getBalance(args.vrfCoordinator);

        assert.equal(newBalance, oldBalance + BigInt(Number(amount) * 1e18), "deposit failed");
        console.log(`network: ${network} > fundSubscription > subId: ${subId} > ${amount} > balance: ${formatEther(newBalance)}`);
      });
    }
   
  });
