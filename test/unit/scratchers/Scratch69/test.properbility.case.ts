import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { getBalances } from "@/utils/testUtil";
import { defaultBeting, deployFixture } from "./utils";
import { formatEther } from "ethers";

describe("Scratch69 Properbilites scenarios", function () {
  this.timeout(30 * 60 * 1000);
  const testCount = 100;

  let fixture: any;

  before(async () => {
    fixture = await loadFixture(deployFixture);
  });

  it("ALL Prize", async function () {
    const { scratch69, scratch69VRF, scratch69Staking, owner, player3, accounts } = fixture;
    const gameStats = await scratch69.gameStats();
    let newBetId = gameStats.currentId;
    let counts = testCount;
    let wonCount = 0;
    const prizeResult: Record<any, number> = {};
    for (let i = 0; i < counts; i++) {
      newBetId++;
      await expect(
        await scratch69.connect(player3).placeBet(...Object.values(defaultBeting), {
          value: defaultBeting.betAmount,
        }),
      )
        .to.emit(scratch69, "BetPlaced")
        .withArgs(newBetId, anyValue, anyValue, anyValue);

      await expect(await scratch69VRF.connect(owner).callbackRandomWords(newBetId, i, 3))
        .and.to.emit(scratch69, "BetResult")
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

      const prize = await scratch69.betPrizes(newBetId);
      if (prizeResult[prize]) {
        prizeResult[prize]++;
      } else {
        prizeResult[prize] = 1;
      }
    }

    const stats = await scratch69.gameStats();
    const balances = await getBalances([scratch69.target, scratch69Staking.target, accounts[15], accounts[16]]);

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

    const prizes = Object.keys(prizeResult).map((key) => {
      return { key, value: ((prizeResult[key] / counts) * 100).toFixed(4) };
    });
    console.log(prizes);
  });
});
