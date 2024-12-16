import hre, { ignition } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";
import DiceShakeAllModule from "@/ignition/modules/dices/DiceShakeAll";
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

  const deployments = await ignition.deploy(DiceShakeAllModule, {
    defaultSender: signerIndex ? accounts[signerIndex].address : owner.address,
  });

  const blockTime = await time.latest();
  const blockNumber = await publicClient.getBlockNumber();

  const network = hre.network.name;

  const deployArgs = getDeploymentArgs(network).DiceShake;

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
  const { blockTime, blockNumber, diceShake, diceShakeVRF, diceShakeStaking, referral, owner, player1, accounts } =
    fixture;

  console.log(`    ===============================================`);
  console.log(`    owner: ${owner.address}`);
  console.log(`    player1: ${player1.address}`);
  console.log(`    diceShake: ${diceShake.target}`);
  console.log(`    diceShakeVRF: ${diceShakeVRF.target}`);
  console.log(`    diceShakeStaking: ${diceShakeStaking.target}`);
  console.log(`    referral: ${referral.target}`);
  console.log(`    >>>>> blockTime: ${blockTime} > blockNumber: ${blockNumber}`);
  // console.log(accounts.map((it)=>it.address));
  console.log(`    ===============================================`);
};

export enum BetType {
  SINGLE,
  RANGE,
  ODD,
  EVEN,
}

export const defaultBeting = {
  betType: BetType.SINGLE, // BetType.SINGLE
  betAmount: parseEther("0.01"),
  betNumber: 1, // bet on number 50
  rangeEnd: 0, // no range end for single bet
  isOver: true, // bet over
  player: ethers.ZeroAddress,
  ref: ethers.ZeroAddress, // no referral
  note: "",
};

export const calculateMultiplier = (
  betType: BetType,
  betNumber: number,
  rangeEnd: number,
  isOver: boolean,
  platformFee: bigint,
): bigint => {
  const base = 100n * 10000n;
  const feeMultiplier = 10000n - platformFee;

  if (betType == BetType.SINGLE) {
    if (isOver) {
      return ((base / BigInt(betNumber)) * feeMultiplier) / 10000n;
    } else {
      return ((base / BigInt(101 - betNumber)) * feeMultiplier) / 10000n;
    }
  } else if (betType == BetType.RANGE) {
    return ((base / BigInt(rangeEnd - betNumber + 1)) * feeMultiplier) / 10000n;
  } else if (betType == BetType.ODD || betType == BetType.EVEN) {
    return 2n * feeMultiplier;
  } else {
    return feeMultiplier;
  }
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
  if (drawResult == 69 || drawResult == 42) {
    // chance 1%
    jackpotAmt = (jackpotPool * 3000n) / 10000n; // 30% of gameStats.jackpotPool
  }
  return [payout, jackpotAmt];
};

export async function fastForwardTime(days: number) {
  await time.increase(days * 24 * 60 * 60);
}

export function caclulateStreakBonus(betAmount: bigint, streakPool: bigint) {
  return betAmount <= streakPool ? betAmount : streakPool;
}
