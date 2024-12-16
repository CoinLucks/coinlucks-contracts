import hre, { ignition } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import Scratch69AllModule from "@/ignition/modules/scratchers/scratch69/Scratch69All";
import { parseEther } from "ethers";
import { getDeploymentArgs } from "@/utils/readDeployment";

/**
 * @tital Deploy contract fixture
 * @notice use case: await loadFixture(deployFixture);
 * loadFixture will share the same Inital-Statement of contracts for each it() test.
 * If you want to share the Full-Statement of contracts, use before() to loadFixture
 * @param signerIndex
 * @returns
 */
export async function deployFixture(signerIndex?: number) {
  // Contracts are deployed using the first signer/account by defaul
  const accounts = await ethers.getSigners();
  const [owner, player1, player2, player3, player4, player5, player6, player7, player8, player9] = accounts;
  const publicClient = await hre.ethers.provider;

  const deployments = await ignition.deploy(Scratch69AllModule, {
    defaultSender: signerIndex ? accounts[signerIndex].address : owner.address,
  });

  const blockTime = await time.latest();
  const blockNumber = await publicClient.getBlockNumber();

  const network = hre.network.name;

  const deployArgs = getDeploymentArgs(network).Scratch69;

  return {
    ...deployments,
    owner,
    player1,
    player2,
    player3,
    player4,
    player5,
    player6,
    player7,
    player8,
    player9,
    accounts,
    publicClient,
    blockTime,
    blockNumber,
    deployArgs,
  };
}

export const printFixtureInfo = (fixture: any) => {
  const { blockTime, blockNumber, scratch69, scratch69VRF, scratch69Staking, referral, owner, player1, accounts } =
    fixture;

  console.log(`    ===============================================`);
  console.log(`    owner: ${owner.address}`);
  console.log(`    player1: ${player1.address}`);
  console.log(`    scratch69: ${scratch69.target}`);
  console.log(`    scratch69VRF: ${scratch69VRF.target}`);
  console.log(`    scratch69Staking: ${scratch69Staking.target}`);
  console.log(`    referral: ${referral.target}`);
  console.log(`    >>>>> blockTime: ${blockTime} > blockNumber: ${blockNumber}`);
  console.log(`    ===============================================`);
};

export enum Prize {
  None, // No prize
  Grand, // Three 69s
  First, // Two 69s
  Second, // One 69
  Third, // Three numbers start with 6
  Fourth, // Two numbers start with 6
  Fifth, // Two numbers end with 9
  Sixth, // One number ends with 9
}

export const prizeOdds = {
  [Prize.Grand]: 100000n,
  [Prize.First]: 1000n,
  [Prize.Second]: 500n,
  [Prize.Third]: 200n,
  [Prize.Fourth]: 50n,
  [Prize.Fifth]: 20n,
  [Prize.Sixth]: 10n,
};

export const defaultBeting = {
  betAmount: parseEther("0.01"),
  player: ethers.ZeroAddress,
  ref: ethers.ZeroAddress, // no referral
  note: "",
};

export const calculatePayout = (
  prize: Prize,
  betAmount: bigint,
  platformFee: bigint,
  jackpotPool: bigint,
): BigInt[] => {
  if (prize == Prize.None) {
    return [0n, 0n];
  }
  const payout = (betAmount * prizeOdds[prize]) / 10n;
  let jackpotAmt = 0n;

  if (prize == Prize.Grand) {
    jackpotAmt = (jackpotPool * 3000n) / 10000n; // 30% of gameStats.jackpotPool
  } else if (prize == Prize.First) {
    jackpotAmt = (jackpotPool * 1500n) / 10000n; // 15% of gameStats.jackpotPool
  } else if (prize == Prize.Second) {
    jackpotAmt = (jackpotPool * 750n) / 10000n; // 7.5% of gameStats.jackpotPool
  }
  return [payout, jackpotAmt];
};


export function caclulateStreakBonus(betAmount: bigint, streakPool: bigint) {
  return betAmount <= streakPool ? betAmount : streakPool;
}
