import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { getBalances } from "@/utils/testUtil";
import { BetType, defaultBeting, deployFixture } from "./utils";
import { formatEther } from "ethers";

describe("CoinFlip Properbilites scenarios", function () {
  this.timeout(30 * 60 * 1000);
  const testCount = 100;
  
  let fixture: any;

  before(async () => {
    fixture = await loadFixture(deployFixture);
  });

  const testCase = async (bet: any, counts: number) => {

    const { coinFlip, coinFlipVRF, coinFlipStaking, owner, player3, accounts } = fixture;
    const gameStats = await coinFlip.gameStats();
    let newBetId = gameStats.currentId;

    let wonCount = 0;

    for (let i = 0; i < counts; i++) {
      newBetId++;
      await expect(
        await coinFlip.connect(player3).placeBet(...Object.values(bet || defaultBeting), {
          value: defaultBeting.betAmount,
        }),
      )
        .to.emit(coinFlip, "BetPlaced")
        .withArgs(newBetId, anyValue, anyValue, anyValue);

      await expect(await coinFlipVRF.connect(owner).callbackRandomWords(newBetId, i, 1))
        .and.to.emit(coinFlip, "BetResult")
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
    const stats = await coinFlip.gameStats();
    const balances = await getBalances([coinFlip.target, coinFlipStaking.target, accounts[15], accounts[16]]);

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

  it("HEADS case", async function () {
    await testCase({ ...defaultBeting, betType: BetType.HEADS }, testCount);
  });

  it("TAILS case", async function () {
    await testCase({ ...defaultBeting, betType: BetType.TAILS }, testCount);
  });

  it("EDGE case", async function () {
    await testCase({ ...defaultBeting, betType: BetType.EDGE }, testCount);
  });
});
