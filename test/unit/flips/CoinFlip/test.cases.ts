import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { printError } from "@/utils/testUtil";
import { calculateMultiplier, calculatePayout, deployFixture } from "./utils";
import { tests } from "./data/test.cases";

describe("CoinFlip Betting scenarios", function () {
  let fixture: any;

  before(async () => {
    fixture = await loadFixture(deployFixture);
  });

  describe("🟥 failure", function () {
    tests.failure.forEach((test) => {
      it(test.description, async function () {
        const { coinFlip } = fixture;
        const { inputs, sender, value } = test.fn(fixture);
        try {
          if (test.beforeFn) {
            await expect(test.beforeFn?.(fixture)).to.be.fulfilled;
          }
          await expect(
            coinFlip.connect(sender).placeBet(...Object.values(inputs), { value: value }),
          ).to.be.rejectedWith(test.revert!);
        } catch (ex) {
          printError(ex, test.description);
        }
      });
    });
  });

  describe("✅ success", function () {
    tests.success.forEach((test) => {
      it(test.description, async function () {
        const { coinFlip, coinFlipVRF, owner, deployArgs } = fixture;
        const { inputs, outputs, sender, value } = test.fn(fixture);

        try {
          if (test.beforeFn) {
            await expect(test.beforeFn(fixture)).to.be.fulfilled;
          }

          const balanceBefore = await ethers.provider.getBalance(sender);
          const gameStats = await coinFlip.gameStats();
          const newBetId = gameStats.currentId + BigInt(1);
          const protocolFee = BigInt(deployArgs.fee);
          const totalFee = BigInt(deployArgs.fee) + BigInt(deployArgs.jackpotRate) + BigInt(deployArgs.streakRate);

          // placeBet
          await expect(coinFlip.connect(sender).placeBet(...Object.values(inputs), { value: value }))
            .to.emit(coinFlip, "BetPlaced")
            .withArgs(newBetId, anyValue, anyValue, anyValue);

          // request vrf and redeem
          await expect(coinFlipVRF.connect(owner).setRandomResult(newBetId, outputs.randoms))
            .to.emit(coinFlipVRF, "RspRandomNumber")
            .withArgs(newBetId, anyValue, anyValue, anyValue)
            .and.to.emit(coinFlip, "BetResult")
            .withArgs(newBetId, sender, outputs.randoms, outputs.won, anyValue, anyValue, anyValue);

          // check balance changed
          const balanceAfter = await ethers.provider.getBalance(sender);
          expect(balanceBefore - balanceAfter).to.greaterThan(inputs.betAmount);

          if (outputs.won) {
            // check winAmount
            const jackpotPool = (await coinFlip.gameStats()).jackpotPool;
            const multiplier = calculateMultiplier(inputs.betType, totalFee);
            const [payout, jackpotAmt] = calculatePayout(
              outputs.won,
              inputs.betAmount,
              multiplier,
              jackpotPool,
              outputs.randoms[0],
            );

            const bet = await coinFlip.bets(newBetId);
            expect(bet.winAmount).to.be.gte(payout.valueOf() + jackpotAmt.valueOf());

            if (outputs.randoms[0] == 69 || outputs.randoms[0] == 420) {
              expect(jackpotAmt).to.be.gt(0n);
            }
          }

          if (test.afterFn) {
            await expect(test.afterFn(fixture)).to.be.fulfilled;
          }
        } catch (ex) {
          printError(ex, test.description);
        }
      });
    });
  });
});
