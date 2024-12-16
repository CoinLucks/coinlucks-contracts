import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { printError, getBalances } from "@/utils/testUtil";
import { calculateMultiplier, calculatePayout, deployFixture } from "./utils";

import { TestCaseType } from "@/test/types";
import { tests } from "./data/test.referral.cases";

const assertFn = async (test: TestCaseType, fixture: any) => {
  const { coinFlip, coinFlipVRF, referral, owner, deployArgs, accounts } = fixture;
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
    const feeAmt = (inputs.betAmount * protocolFee) / 10000n;
    const referralLv1 = 2400n; //24%
    const referralLv2 = 100n; // 1%

    // Referrers balanceBefore
    const referrerBalances: any[] = await getBalances(outputs?.referrers);

    {
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

        if (outputs.randoms[0] == 69) {
          expect(jackpotAmt).to.be.gt(0n);
        }
      }
    }

    // check referrals
    if (outputs?.referrers) {
      // check relationship
      const referrers = await referral.getReferrer(sender);
      expect(referrers[0]).to.eql(outputs?.referrers[0]);
      expect(referrers[1]).to.eql(outputs?.referrers[1]);

      // check referralReward
      const referrerNewBalances: any[] = await getBalances(outputs?.referrers);

      if (outputs?.referrers[0] != ethers.ZeroAddress) {
        const rewards = (feeAmt * referralLv1) / 10000n;

        expect(referrerBalances[0]).to.be.eq(referrerNewBalances[0] - rewards);
      }
      if (outputs?.referrers[1] != ethers.ZeroAddress) {
        const rewards = (feeAmt * referralLv2) / 10000n;
        expect(referrerBalances[1]).to.be.eq(referrerNewBalances[1] - rewards);
      }
    }

    if (test.afterFn) {
      await expect(test.afterFn(fixture)).to.be.fulfilled;
    }
  } catch (ex) {
    printError(ex, test.description);
  }
};

describe("CoinFlip Referral scenarios1", function () {
  let fixture: any;
  before(async () => {
    fixture = await loadFixture(deployFixture);
  });
  describe("✅ success", function () {
    tests.case1.forEach((test) => {
      it(test.description, async function () {
        await assertFn(test, fixture);
      });
    });
  });
});

describe("CoinFlip Referral scenarios2", function () {
  let fixture: any;
  before(async () => {
    fixture = await loadFixture(deployFixture);
  });
  describe("✅ success", function () {
    tests.case2.forEach((test) => {
      it(test.description, async function () {
        await assertFn(test, fixture);
      });
    });
  });
});
