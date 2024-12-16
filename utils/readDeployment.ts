import * as fs from "fs";
import * as path from "path";

const PROJECT_ROOT = path.resolve(__dirname, "..");
const CONFIG_PATH = path.resolve(PROJECT_ROOT, "ignition/config");
const DEPLOYMENT_PATH = path.resolve(PROJECT_ROOT, "ignition/deployments");

export function getDeploymentArgs(networkName: string) {
  let folderName = networkName;
  if (networkName === "hardhat") {
    folderName = "localhost";
  }

  const filepath = path.resolve(CONFIG_PATH, `${folderName}.json`);
  if (!fs.existsSync(filepath)) {
    throw new Error("missing ignition config file for network " + networkName);
  }
  const data = JSON.parse(fs.readFileSync(filepath, "utf8"));

  return data;
}

export function getDeploymentAddresses(chainId: string) {
  const folderName = `chain-${chainId}`;
  const networkFolderName = fs.readdirSync(DEPLOYMENT_PATH).filter((f) => f === folderName)[0];
  if (networkFolderName === undefined) {
    throw new Error("missing deployment files for endpoint " + folderName);
  }
  const filepath = path.resolve(DEPLOYMENT_PATH, folderName, `deployed_addresses.json`);
  const data = JSON.parse(fs.readFileSync(filepath, "utf8"));

  return {
    BetGameFactory: data["BetGameFactoryModule#BetGameFactory"],

    RaffleContract: data["RaffleModule#RaffleContract"],
    RaffleVRF: data["RaffleVRFModule#raffleVRF"],
    Referral: data["ReferralModule#Referral"],

    DiceShake: data["DiceShakeModule#DiceShake"],
    DiceShakeStaking: data["DiceShakeStakingModule#diceShakeStaking"],
    DiceShakeVRF: data["DiceShakeVRFModule#diceShakeVRF"],

    CoinFlip: data["CoinFlipModule#CoinFlip"],
    CoinFlipStaking: data["CoinFlipStakingModule#coinFlipStaking"],
    CoinFlipVRF: data["CoinFlipVRFModule#coinFlipVRF"],

    Scratch69: data["Scratch69Module#Scratch69"],
    Scratch69Staking: data["Scratch69StakingModule#scratch69Staking"],
    Scratch69VRF: data["Scratch69VRFModule#scratch69VRF"],

    MockUSDT: data["MocksModule#MockUSDT"],
    MockNFTBoredApeYachtClub: data["MocksModule#MockNFTBoredApeYachtClub"],
  };
}
