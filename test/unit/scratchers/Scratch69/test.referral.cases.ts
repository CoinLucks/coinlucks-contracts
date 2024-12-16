import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { printError, getBalances } from "@/utils/testUtil";
import { calculatePayout, deployFixture } from "./utils";

import { TestCaseType } from "@/test/types";
import { tests } from "./data/test.referral.cases";
import { Prize } from "./utils";

const assertFn = async (test: TestCaseType, fixture: any) => {
  const { scratch69, scratch69VRF, referral, owner, deployArgs, accounts } = fixture;
  const { inputs, outputs, sender, value } = test.fn(fixture);

  try {
    if (test.beforeFn) {
      await expect(test.beforeFn(fixture)).to.be.fulfilled;
    }

    const balanceBefore = await ethers.provider.getBalance(sender);
    const gameStats = await scratch69.gameStats();
    const newBetId = gameStats.currentId + BigInt(1);
    const protocolFee = BigInt(deployArgs.fee);
    const feeAmt = (inputs.betAmount * protocolFee) / 10000n;
    const referralLv1 = 2400n; //24%
    const referralLv2 = 100n; // 1%

    // Referrers balanceBefore
    const referrerBalances: any[] = await getBalances(outputs?.referrers);

    {
      // placeBet
      await expect(scratch69.connect(sender).placeBet(...Object.values(inputs), { value: value }))
        .to.emit(scratch69, "BetPlaced")
        .withArgs(newBetId, anyValue, anyValue, anyValue);

      // request vrf and redeem
      await expect(scratch69VRF.connect(owner).setRandomResult(newBetId, outputs.randoms))
        .to.emit(scratch69VRF, "RspRandomNumber")
        .withArgs(newBetId, anyValue, anyValue, anyValue)
        .and.to.emit(scratch69, "BetResult")
        .withArgs(newBetId, sender, anyValue, outputs.prize != Prize.None, anyValue, anyValue, anyValue);

      // check balance changed
      const balanceAfter = await ethers.provider.getBalance(sender);
      expect(balanceBefore - balanceAfter).to.greaterThan(inputs.betAmount);

      // check bet prize result
      const betPrizeResult = await scratch69.betPrizes(newBetId);
      expect(outputs.prize).to.eq(betPrizeResult);

      if (outputs.prize != Prize.None) {
        // check winAmount
        const jackpotPool = (await scratch69.gameStats()).jackpotPool;
        const [payout, jackpotAmt] = calculatePayout(outputs.prize, inputs.betAmount, protocolFee, jackpotPool);

        const bet = await scratch69.bets(newBetId);
        expect(bet.winAmount).to.be.gte(payout.valueOf() + jackpotAmt.valueOf());
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

describe("Scratch69 Referral scenarios", function () {
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
