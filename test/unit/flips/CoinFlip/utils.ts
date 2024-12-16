import hre, { ignition } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import CoinFlipAllModule from "@/ignition/modules/flips/CoinFlipAll";
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

  const deployments = await ignition.deploy(CoinFlipAllModule, {
    defaultSender: signerIndex ? accounts[signerIndex].address : owner.address,
  });

  const blockTime = await time.latest();
  const blockNumber = await publicClient.getBlockNumber();

  const network = hre.network.name;

  const deployArgs = getDeploymentArgs(network).CoinFlip;

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
  const { blockTime, blockNumber, coinFlip, coinFlipVRF, coinFlipStaking, referral, owner, player1, accounts } =
    fixture;

  console.log(`    ===============================================`);
  console.log(`    owner: ${owner.address}`);
  console.log(`    player1: ${player1.address}`);
  console.log(`    coinFlip: ${coinFlip.target}`);
  console.log(`    coinFlipVRF: ${coinFlipVRF.target}`);
  console.log(`    coinFlipStaking: ${coinFlipStaking.target}`);
  console.log(`    referral: ${referral.target}`);
  console.log(`    >>>>> blockTime: ${blockTime} > blockNumber: ${blockNumber}`);
  console.log(`    ===============================================`);
};

export enum BetType {
  HEADS,
  TAILS,
  EDGE,
}

export const defaultBeting = {
  betType: BetType.HEADS, // BetType.HEADS
  betAmount: parseEther("0.01"),
  player: ethers.ZeroAddress,
  ref: ethers.ZeroAddress, // no referral
  note: "",
};

export const calculateMultiplier = (betType: BetType, platformFee: bigint) => {
  let multiplier = 2n * (10000n - platformFee); // 2x: heads or tails, 50x: edge
  if (betType == BetType.EDGE) {
    multiplier = (50000n * (10000n - platformFee)) / 10000n; // 20x
  }
  return multiplier;
};

export const calculatePayout = (
  won: boolean,
  betAmount: bigint,
  multiplier: bigint,
  jackpotPool: bigint,
  drawResult: number,
): BigInt[] => {
  if (!won) {
    return [0n, 0n];
  }
  const payout = (betAmount * multiplier) / 10000n;
  let jackpotAmt = 0n;
  if (drawResult == 69 || drawResult == 420) {
    // chance 1%
    jackpotAmt = (jackpotPool * 3000n) / 10000n; // 30% of gameStats.jackpotPool
  }
  return [payout, jackpotAmt];
};

export function caclulateStreakBonus(betAmount: bigint, streakPool: bigint) {
  return betAmount <= streakPool ? betAmount : streakPool;
}
