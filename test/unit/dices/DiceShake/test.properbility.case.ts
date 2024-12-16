import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { getBalances } from "@/utils/testUtil";
import { BetType, defaultBeting, deployFixture } from "./utils";
import { formatEther } from "ethers";

describe("DiceShake Properbilites scenarios", function () {
  this.timeout(30 * 60 * 1000);
  const testCount = 100;

  let fixture: any;

  before(async () => {
    fixture = await loadFixture(deployFixture);
  });

  const testCase = async (bet: any, counts: number) => {
    const { diceShake, diceShakeVRF, diceShakeStaking, owner, player3, accounts } = fixture;
    const gameStats = await diceShake.gameStats();
    let newBetId = gameStats.currentId;

    let wonCount = 0;

    for (let i = 0; i < counts; i++) {
      newBetId++;
      await expect(
        await diceShake.connect(player3).placeBet(...Object.values(bet || defaultBeting), {
          value: defaultBeting.betAmount,
        }),
      )
        .to.emit(diceShake, "BetPlaced")
        .withArgs(newBetId, anyValue, anyValue, anyValue);

      await expect(await diceShakeVRF.connect(owner).callbackRandomWords(newBetId, i, 1))
        .and.to.emit(diceShake, "BetResult")
        .withArgs(
          newBetId,
          player3,
          anyValue,
          (won) => {
            if (won) wonCount++;
            return true;
          },
          anyValue,
          anyValue,
          anyValue,
        );
    }

    const stats = await diceShake.gameStats();
    const balances = await getBalances([diceShake.target, diceShakeStaking.target, accounts[15], accounts[16]]);

    const statisitc = {
      counts: `${wonCount} / ${counts}`,
      winRate: `${((wonCount / counts) * 100).toFixed(2)}%`,
      bets: Number(formatEther(BigInt(counts) * defaultBeting.betAmount)),
      payouts: Number(formatEther(stats.payouts)).toFixed(4),
      gamePool: Number(formatEther(stats.gamePool)).toFixed(4),
      jackpotPool: Number(formatEther(stats.jackpotPool)).toFixed(4),
      streakPool: Number(formatEther(stats.streakPool)).toFixed(4),
      staking: Number(formatEther(balances[1])).toFixed(4),
      charity: (Number(formatEther(balances[2])) - 10000).toFixed(4),
      platformFee: (Number(formatEther(balances[3])) - 10000).toFixed(4),
      platformProfit: Number(formatEther(balances[0] - stats.payouts)).toFixed(4),
    };

    console.table([statisitc]);
  };

  it("50% chance case", async function () {
    await testCase({ ...defaultBeting, betType: BetType.RANGE, betNumber: 1, rangeEnd: 50 }, testCount);
  });

  it("30% chance case", async function () {
    await testCase({ ...defaultBeting, betType: BetType.RANGE, betNumber: 1, rangeEnd: 30 }, testCount);
  });

  it("70% chance case", async function () {
    await testCase({ ...defaultBeting, betType: BetType.RANGE, betNumber: 1, rangeEnd: 70 }, testCount);
  });
});
