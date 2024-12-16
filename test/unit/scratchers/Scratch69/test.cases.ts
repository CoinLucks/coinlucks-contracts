import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { printError } from "@/utils/testUtil";
import { calculatePayout, deployFixture, Prize } from "./utils";
import { tests } from "./data/test.cases";

describe("Scratch69 Betting scenarios", function () {
  let fixture: any;

  before(async () => {
    fixture = await loadFixture(deployFixture);
  });

  describe("🟥 failure", function () {
    tests.failure.forEach((test) => {
      it(test.description, async function () {
        const { scratch69 } = fixture;
        const { inputs, sender, value } = test.fn(fixture);
        try {
          if (test.beforeFn) {
            await expect(test.beforeFn?.(fixture)).to.be.fulfilled;
          }
          await expect(
            scratch69.connect(sender).placeBet(...Object.values(inputs), { value: value }),
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
        const { scratch69, scratch69VRF, owner, deployArgs } = fixture;
        const { inputs, outputs, sender, value } = test.fn(fixture);

        try {
          if (test.beforeFn) {
            await expect(test.beforeFn(fixture)).to.be.fulfilled;
          }

          const balanceBefore = await ethers.provider.getBalance(sender);
          const gameStats = await scratch69.gameStats();
          const newBetId = gameStats.currentId + BigInt(1);
          const protocolFee = BigInt(deployArgs.fee);

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

            const [payout, jackpotAmt] = calculatePayout(betPrizeResult, inputs.betAmount, protocolFee, jackpotPool);

            const bet = await scratch69.bets(newBetId);
            expect(bet.winAmount).to.be.gte(payout.valueOf() + jackpotAmt.valueOf());

            // if (Prize.First >= (Prize.First >= outputs.prize) && outputs.prize <= Prize.Fifth) {
            //   expect(jackpotAmt).to.be.gt(0n);
            // }
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

  describe("Prize calculations", function () {
    it("Should correctly calculate Grand Prize", async function () {
      const { scratch69 } = fixture;

      const prize = await scratch69.calculatePrize([69, 69, 69]);
      expect(prize).to.equal(1); // Prize.Grand Three 69s
    });

    it("Should correctly calculate First Prize", async function () {
      const { scratch69 } = fixture;

      const prize = await scratch69.calculatePrize([69, 9, 69]);
      expect(prize).to.equal(2); // Prize.First Two 69s
    });

    it("Should correctly calculate Second Prize", async function () {
      const { scratch69 } = fixture;

      const prize = await scratch69.calculatePrize([19, 69, 19]);
      expect(prize).to.equal(3); // Prize.Second One 69 and a matching pair
    });

    it("Should correctly calculate Third Prize", async function () {
      const { scratch69 } = fixture;

      const prize = await scratch69.calculatePrize([6, 62, 66]);
      expect(prize).to.equal(4); // Prize.Third Three numbers start with 6
    });

    it("Should correctly calculate Fourth Prize", async function () {
      const { scratch69 } = fixture;

      const prize = await scratch69.calculatePrize([19, 2, 9]);
      expect(prize).to.equal(5); // Prize.Fourth Two numbers end with 9
    });

    it("Should correctly calculate Fifth Prize", async function () {
      const { scratch69 } = fixture;

      const prize = await scratch69.calculatePrize([6, 19, 65]);
      expect(prize).to.equal(6); // Prize.Fifth Two numbers start with 6
    });

    it("Should correctly calculate Sixth Prize", async function () {
      const { scratch69 } = fixture;

      const prize = await scratch69.calculatePrize([50, 50, 9]);
      expect(prize).to.equal(7); // Prize.Sixth One number ends with 9
    });

    it("Should correctly handle no prize", async function () {
      const { scratch69 } = fixture;

      const prize = await scratch69.calculatePrize([1, 2, 3]);
      expect(prize).to.equal(0); // Prize.None
    });
  });

  describe("Owner functions", function () {
    it("Should allow owner to set prize odds", async function () {
      const { scratch69, owner } = fixture;

      await expect(scratch69.connect(owner).setPrizeOdds(1, 200000))
        .to.emit(scratch69, "PrizeOddsUpdated")
        .withArgs(1, 200000);

      expect(await scratch69.prizeOdds(1)).to.equal(200000);
    });

    it("Should allow owner to set bulk prize odds", async function () {
      const { scratch69, owner } = fixture;

      const prizeTypes = [1, 2, 3];
      const multipliers = [200000, 20000, 2000];

      await scratch69.connect(owner).setBulksPrizeOdds(prizeTypes, multipliers);

      for (let i = 0; i < prizeTypes.length; i++) {
        expect(await scratch69.prizeOdds(prizeTypes[i])).to.equal(multipliers[i]);
      }
    });

    it("Should revert when non-owner tries to set prize odds", async function () {
      const { scratch69, player1 } = fixture;

      await expect(scratch69.connect(player1).setPrizeOdds(1, 200000)).to.be.reverted;
    });
  });

  describe("Edge cases", function () {
    it("Should handle minimum bet amount correctly", async function () {
      const { scratch69, player1, deployArgs } = fixture;
      const minBet = BigInt(deployArgs.minBet);
      await expect(
        scratch69.connect(player1).placeBet(
          minBet, // Minimum bet amount
          ethers.ZeroAddress,
          ethers.ZeroAddress,
          "Minimum bet",
          {
            value: minBet,
          },
        ),
      ).to.emit(scratch69, "BetPlaced");
    });

    it("Should handle maximum bet amount correctly", async function () {
      const { scratch69, player1, deployArgs } = fixture;
      const maxBet = BigInt(deployArgs.maxBet);
      await expect(
        scratch69.connect(player1).placeBet(
          maxBet, // Maximum bet amount
          ethers.ZeroAddress,
          ethers.ZeroAddress,
          "Maximum bet",
          {
            value: maxBet,
          },
        ),
      ).to.emit(scratch69, "BetPlaced");
    });
  });
});
