import { task } from "hardhat/config";

task("checkGas", "check gas price").setAction(async (_, hre) => {
  const network = hre.network.name;

  const feeData = await hre.ethers.provider.getFeeData();
  console.log(`network: >> ${network}`);
  console.log("gasPrice:", hre.ethers.formatUnits(feeData.gasPrice || 0, "gwei") + " gwei");
  console.log(
    "Suggested maxPriorityFeePerGas:",
    hre.ethers.formatUnits(feeData.maxPriorityFeePerGas || 0, "gwei"),
    "gwei",
  );
  console.log("Suggested maxFeePerGas:", hre.ethers.formatUnits(feeData.maxFeePerGas || 0, "gwei"), "gwei");
});
