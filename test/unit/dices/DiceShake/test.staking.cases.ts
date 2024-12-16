import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { printError, getBalances } from "@/utils/testUtil";
import { deployFixture, fastForwardTime } from "./utils";
import { tests } from "./data/test.staking.cases";
import { TestCaseType } from "@/test/types";
import { parseEther } from "ethers";

const assertStakeFn = async (test: TestCaseType, fixture: any) => {
  const { diceShake, diceShakeStaking, owner, deployArgs } = fixture;
  const { outputs, sender, value } = test.fn(fixture);

  try {
    if (test.beforeFn) {
      await expect(test.beforeFn(fixture)).to.be.fulfilled;
    }
    // before statements
    const balanceBefores = await getBalances([sender.address, diceShake.target, diceShakeStaking.target]);
    const stake = await diceShakeStaking.stakes(sender.address);
    const pool = await diceShakeStaking.pool();

    const totalStaked = pool.totalStaked;

    // stake action
    await expect(diceShakeStaking.connect(sender).stake({ value: value }))
      .to.emit(diceShakeStaking, "Staked")
      .withArgs(sender.address, value);

    // after statements
    const balanceAfters = await getBalances([sender.address, diceShake.target, diceShakeStaking.target]);
    const stakeAfter = await diceShakeStaking.stakes(sender.address);

    const poolAfter = await diceShakeStaking.pool();

    const totalStakedAfter = poolAfter.totalStaked;

    // check balances changed
    expect(balanceBefores[0] - balanceAfters[0]).to.greaterThan(value);
    expect(balanceAfters[2] - balanceBefores[2]).to.eq(value);

    // check user stake
    expect(stakeAfter.amount - stake.amount).to.eq(value);

    // check staking
    expect(totalStakedAfter - totalStaked).to.eq(value);

    if (test.afterFn) {
      await expect(test.afterFn(fixture)).to.be.fulfilled;
    }

    // console.log(
    //   `game balance: ${formatEther(balanceAfters[1])}, stake balance: ${formatEther(balanceAfters[2])}, totalStaked: ${formatEther(totalStakedAfter)}, totalRewardsReceived:${formatEther(totalRewardsReceivedAfter)}`,
    // );
  } catch (ex) {
    printError(ex, test.description);
  }
};

const assertUnStakeFn = async (test: TestCaseType, fixture: any) => {
  const { diceShake, diceShakeStaking, owner, deployArgs } = fixture;
  const { outputs, sender, value } = test.fn(fixture);

  try {
    if (test.beforeFn) {
      await expect(test.beforeFn(fixture)).to.be.fulfilled;
    }
    // before statements
    const balanceBefores = await getBalances([sender.address, diceShake.target, diceShakeStaking.target]);
    const stake = await diceShakeStaking.stakes(sender.address);

    const pool = await diceShakeStaking.pool();

    const totalStaked = pool.totalStaked;
    const totalRewardsDistributed = pool.totalRewardsDistributed;

    // unstake action
    let assert = expect(diceShakeStaking.connect(sender).unstake())
      .to.emit(diceShakeStaking, "Unstaked")
      .withArgs(sender.address, anyValue, anyValue, anyValue);

    if (outputs?.erlyOut == true) {
      assert = assert.and.to.emit(diceShakeStaking, "EarlyUnstakeFeeDistributed");
    }
    await assert;

    if (outputs?.increaseTime) {
      time.increase(outputs?.increaseTime);
    }

    // after statements
    const balanceAfters = await getBalances([sender.address, diceShake.target, diceShakeStaking.target]);
    const stakeAfter = await diceShakeStaking.stakes(sender.address);
    const poolAfter = await diceShakeStaking.pool();
    const totalStakedAfter = poolAfter.totalStaked;
    const totalRewardsDistributedAfter = poolAfter.totalRewardsDistributed;

    // check balances changed

    if (outputs?.erlyOut == true) {
      expect(balanceBefores[2] - balanceAfters[2]).to.gte((stake.amount * 90n) / 100n); // diceShakeStaking
    } else {
      expect(balanceBefores[2] - balanceAfters[2]).to.gte(stake.amount);
    }

    // check user stake
    expect(stakeAfter.amount).to.eq(0n);

    // check staking
    expect(totalStaked - totalStakedAfter).to.eq(stake.amount);
    expect(totalRewardsDistributedAfter).to.gte(totalRewardsDistributed);

    if (test.afterFn) {
      await expect(test.afterFn(fixture)).to.be.fulfilled;
    }
  } catch (ex) {
    printError(ex, test.description);
  }
};

const assertClaimRewardsFn = async (test: TestCaseType, fixture: any) => {
  const { diceShake, diceShakeStaking, owner, deployArgs } = fixture;
  const { outputs, sender, value } = test.fn(fixture);

  try {
    if (test.beforeFn) {
      await expect(test.beforeFn(fixture)).to.be.fulfilled;
    }
    // before statements
    const balanceBefores = await getBalances([sender.address, diceShake.target, diceShakeStaking.target]);
    const stake = await diceShakeStaking.stakes(sender.address);
    const pool = await diceShakeStaking.pool();
    const totalStaked = pool.totalStaked;
    const totalRewardsDistributed = pool.totalRewardsDistributed;

    await time.increase(7 * 24 * 60 * 60 + 1); // 7 days + 1 second
    const rewards = await diceShakeStaking.getPendingRewards(sender.address);

    // claim action
    let assert;
    if (outputs?.autoCompound == true) {
      assert = expect(diceShakeStaking.connect(sender).claimRewards())
        .to.emit(diceShakeStaking, "RewardCompounded")
        .withArgs(sender.address, anyValue, anyValue);
    } else {
      expect(diceShakeStaking.connect(sender).claimRewards())
        .to.emit(diceShakeStaking, "RewardPaid")
        .withArgs(sender.address, rewards);
    }
    await assert;

    // after statements
    const balanceAfters = await getBalances([sender.address, diceShake.target, diceShakeStaking.target]);
    const stakeAfter = await diceShakeStaking.stakes(sender.address);
    const poolAfter = await diceShakeStaking.pool();
    const totalStakedAfter = poolAfter.totalStaked;
    const totalRewardsDistributedAfter = poolAfter.totalRewardsDistributed;
    // check balances changed
    if (outputs?.autoCompound == true) {
      expect(balanceAfters[0]).to.lt(balanceBefores[0]); // user
    } else {
      expect(balanceAfters[0]).to.gte(balanceBefores[0]); // user
    }

    expect(balanceBefores[2]).to.gte(balanceAfters[2]); // diceShakeStaking

    // check user stake
    expect(totalRewardsDistributedAfter).to.gte(totalRewardsDistributed);
    if (outputs?.autoCompound == true) {
      expect(stakeAfter.amount).to.gte(stake.amount);
      expect(totalStakedAfter).to.gte(totalStaked);
    } else {
      expect(stakeAfter.amount).to.eq(stake.amount);
      expect(totalStakedAfter).to.eq(totalStaked);
    }

    if (test.afterFn) {
      await expect(test.afterFn(fixture)).to.be.fulfilled;
    }
  } catch (ex) {
    printError(ex, test.description);
  }
};

const assertAddRewardsFn = async (test: TestCaseType, fixture: any) => {
  const { diceShakeStaking, owner, deployArgs } = fixture;
  const { outputs, sender, value } = test.fn(fixture);

  try {
    // before statements
    const pool = await diceShakeStaking.pool();
    const totalRewardsReceived = pool.totalRewardsReceived;

    if (test.beforeFn) {
      await expect(test.beforeFn(fixture)).to.be.fulfilled;
    }

    // claimRewards action
    let assert = expect(diceShakeStaking.connect(sender).addRewards({ value: value }))
      .to.emit(diceShakeStaking, "RewardsDistributed")
      .withArgs(value, anyValue);

    await assert;

    // after statements
    const poolAfter = await diceShakeStaking.pool();
    const totalRewardsReceivedAfter = poolAfter.totalRewardsReceived;

    // check staking statements
    expect(totalRewardsReceived + value).to.eq(totalRewardsReceivedAfter);

    if (test.afterFn) {
      await expect(test.afterFn(fixture)).to.be.fulfilled;
    }
  } catch (ex) {
    printError(ex, test.description);
  }
};

describe("BetGameStaking", function () {
  let fixture: any;
  before(async () => {
    fixture = await loadFixture(deployFixture);
  });

  describe("Staking", function () {
    tests.stakes.forEach((test) => {
      it(test.description, async function () {
        await assertStakeFn(test, fixture);
      });
    });
  });

  describe("Unstaking", function () {
    tests.unstakes.forEach((test) => {
      it(test.description, async function () {
        await assertUnStakeFn(test, fixture);
      });
    });
  });

  describe("ClaimRewards", function () {
    before(async () => {
      fixture = await loadFixture(deployFixture);
    });
    tests.claims.forEach((test) => {
      it(test.description, async function () {
        await assertClaimRewardsFn(test, fixture);
      });
    });
  });

  describe("Rewards caculate", function () {
    tests.rewards.forEach((test) => {
      it(test.description, async function () {
        fixture = await loadFixture(deployFixture);
        await assertAddRewardsFn(test, fixture);
      });
    });
  });

  describe("Admin functions", function () {
    beforeEach(async () => {
      fixture = await loadFixture(deployFixture);
    });

    it("Should allow owner to set reward rates", async function () {
      const { diceShakeStaking: betGameStaking, owner } = fixture;
      const newBaseRate = 150;
      const newMaxRate = 200;
      const newThreshold = parseEther("50");

      await betGameStaking.connect(owner).setRewardRates(newBaseRate, newMaxRate, newThreshold);

      expect(await betGameStaking.baseRewardRate()).to.equal(newBaseRate);
      expect(await betGameStaking.maxRewardRate()).to.equal(newMaxRate);
      expect(await betGameStaking.maxRewardThreshold()).to.equal(newThreshold);
    });

    it("Should not allow non-owner to set reward rates", async function () {
      const { diceShakeStaking: betGameStaking, player1 } = fixture;
      await expect(
        betGameStaking.connect(player1).setRewardRates(150, 200, parseEther("50")),
      ).to.be.revertedWithCustomError(betGameStaking, "OwnableUnauthorizedAccount");
    });
  });
});

describe("BetGameStaking Complex Scenarios", function () {
  let fixture;
  beforeEach(async () => {
    fixture = await loadFixture(deployFixture);
  });

  describe("Complex Staking Scenarios", function () {
    it("Should correctly calculate rewards for multiple users with different stake amounts", async function () {
      const { diceShakeStaking: betGameStaking, owner, player1, player2, player3 } = fixture;
      await betGameStaking.connect(player1).stake({ value: parseEther("10") });
      await betGameStaking.connect(player2).stake({ value: parseEther("50") });
      await betGameStaking.connect(player3).stake({ value: parseEther("100") });

      await betGameStaking.connect(owner).addRewards({ value: parseEther("1") });

      await fastForwardTime(30); // Fast forward 30 days

      const player1Reward = await betGameStaking.getPendingRewards(player1.address);
      const player2Reward = await betGameStaking.getPendingRewards(player2.address);
      const player3Reward = await betGameStaking.getPendingRewards(player3.address);

      expect(player1Reward).to.be.closeTo(parseEther("0.047"), parseEther("0.001"));
      expect(player2Reward).to.be.closeTo(parseEther("0.280"), parseEther("0.001"));
      expect(player3Reward).to.be.closeTo(parseEther("0.672"), parseEther("0.001"));

      expect(player1Reward + player2Reward + player3Reward).to.lte(parseEther("1"));
    });

    it("Should handle staking, unstaking, and re-staking correctly", async function () {
      const { diceShakeStaking: betGameStaking, player1 } = fixture;
      await betGameStaking.connect(player1).stake({ value: parseEther("20") });
      await fastForwardTime(15);

      const initialReward = await betGameStaking.getPendingRewards(player1.address);
      await betGameStaking.connect(player1).unstake();

      await fastForwardTime(7);

      await betGameStaking.connect(player1).stake({ value: parseEther("30") });
      await fastForwardTime(15);

      const finalReward = await betGameStaking.getPendingRewards(player1.address);
      expect(finalReward).to.be.gte(initialReward);
    });
  });

  describe("Early Unstake Scenarios", function () {
    it("Should apply early unstake fee and distribute it correctly", async function () {
      const { diceShakeStaking: betGameStaking, player1 } = fixture;
      await betGameStaking.connect(player1).stake({ value: parseEther("50") });
      await fastForwardTime(3); // Less than lock period

      const initialContractBalance = await ethers.provider.getBalance(betGameStaking.target);
      await betGameStaking.connect(player1).unstake();
      const finalContractBalance = await ethers.provider.getBalance(betGameStaking.target);

      const expectedFee = (parseEther("50") * 500n) / 10000n; // 5% fee
      expect(finalContractBalance).to.be.closeTo(expectedFee, parseEther("0.001"));
    });

    it("Should not apply fee after lock period", async function () {
      const { diceShakeStaking: betGameStaking, player2 } = fixture;
      await betGameStaking.connect(player2).stake({ value: parseEther("40") });
      await fastForwardTime(8); // More than lock period

      const initialBalance = await ethers.provider.getBalance(player2.address);
      const tx = await betGameStaking.connect(player2).unstake();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * tx.gasPrice!;

      const finalBalance = await ethers.provider.getBalance(player2.address);
      const expectedBalance = initialBalance + parseEther("40") - BigInt(gasUsed);

      expect(finalBalance).to.be.closeTo(expectedBalance, parseEther("0.001"));
    });
  });

  describe("Compound Interest Scenarios", function () {
    it("Should correctly apply compound interest when autoCompound is enabled", async function () {
      const { diceShakeStaking: betGameStaking, owner, player1 } = fixture;
      await betGameStaking.connect(player1).stake({ value: parseEther("100") });
      await betGameStaking.connect(player1).setAutoCompound(true);

      await betGameStaking.connect(owner).addRewards({ value: parseEther("10") });

      for (let i = 0; i < 10; i++) {
        await fastForwardTime(7);
        const rewards = await betGameStaking.getPendingRewards(player1.address);
        if (rewards > 0) {
          await betGameStaking.connect(player1).claimRewards();
        }
      }

      const finalStake = await betGameStaking.stakes(player1.address);
      expect(finalStake.amount).to.be.gt(parseEther("100"));
    });

    it("Should not compound interest when autoCompound is disabled", async function () {
      const { diceShakeStaking: betGameStaking, owner, player2 } = fixture;
      await betGameStaking.connect(player2).stake({ value: parseEther("100") });
      await betGameStaking.connect(player2).setAutoCompound(false);

      await betGameStaking.connect(owner).addRewards({ value: parseEther("10") });

      for (let i = 0; i < 10; i++) {
        await fastForwardTime(7);
        const rewards = await betGameStaking.getPendingRewards(player2.address);
        if (rewards > 0) {
          await betGameStaking.connect(player2).claimRewards();
        }
      }

      const finalStake = await betGameStaking.stakes(player2.address);
      expect(finalStake.amount).to.equal(parseEther("100"));
    });
  });

  describe("Reward Distribution Scenarios", function () {
    it("Should correctly distribute rewards when new stakers join", async function () {
      const { diceShakeStaking: betGameStaking, owner, player1, player2 } = fixture;
      await betGameStaking.connect(player1).stake({ value: parseEther("100") });
      await betGameStaking.connect(owner).addRewards({ value: parseEther("10") });

      await fastForwardTime(15);

      await betGameStaking.connect(player2).stake({ value: parseEther("100") });

      await fastForwardTime(15);

      const player1Reward = await betGameStaking.getPendingRewards(player1.address);
      const player2Reward = await betGameStaking.getPendingRewards(player2.address);

      expect(player1Reward).to.be.gt(player2Reward);
    });

    it("Should handle reward distribution correctly when total stake changes", async function () {
      const { diceShakeStaking: betGameStaking, owner, player1, player2 } = fixture;
      await betGameStaking.connect(player1).stake({ value: parseEther("100") });
      await betGameStaking.connect(player2).stake({ value: parseEther("100") });

      await betGameStaking.connect(owner).addRewards({ value: parseEther("10") });

      await fastForwardTime(15);

      await betGameStaking.connect(player2).unstake(); // Bob unstakes

      await fastForwardTime(15);

      const player1Reward = await betGameStaking.getPendingRewards(player1.address);
      const player2Reward = await betGameStaking.getPendingRewards(player2.address);

      expect(player1Reward).to.be.gt(player2Reward);
    });
  });

  describe("Boundary Conditions and Extreme Scenarios", function () {
    it("Should handle extremely small stake amounts", async function () {
      const { diceShakeStaking: betGameStaking, owner, player1 } = fixture;
      const smallStake = 1; // 1 wei
      await betGameStaking.connect(player1).stake({ value: smallStake });
      await betGameStaking.connect(owner).addRewards({ value: parseEther("1") });
      await fastForwardTime(30);

      const reward = await betGameStaking.getPendingRewards(player1.address);
      expect(reward).to.be.gte(0);
    });

    it("Should handle extremely large stake amounts", async function () {
      const { diceShakeStaking: betGameStaking, owner, player1 } = fixture;
      const largeStake = parseEther("9000");
      await betGameStaking.connect(owner).setMaxStakeAmount(largeStake);
      await betGameStaking.connect(player1).stake({ value: largeStake });
      await betGameStaking.connect(owner).addRewards({ value: parseEther("1000") });
      await fastForwardTime(30);

      const reward = await betGameStaking.getPendingRewards(player1.address);
      expect(reward).to.closeTo(parseEther("1000"), parseEther("0.001"));
    });

    it("Should correctly distribute rewards when reward pool is nearly depleted", async function () {
      const { diceShakeStaking: betGameStaking, owner, player1, player2 } = fixture;
      await betGameStaking.connect(player1).stake({ value: parseEther("100") });
      await betGameStaking.connect(player2).stake({ value: parseEther("100") });
      await betGameStaking.connect(owner).addRewards({ value: parseEther("0.0001") });

      await fastForwardTime(30);

      const player1Reward = await betGameStaking.getPendingRewards(player1.address);
      const player2Reward = await betGameStaking.getPendingRewards(player2.address);

      expect(player1Reward).to.be.gt(0);
      expect(player2Reward).to.be.gt(0);
      expect(player1Reward + player2Reward).to.be.lte(parseEther("0.0001"));
    });

    it("Should handle very long staking periods (e.g., 10 years) correctly", async function () {
      const { diceShakeStaking: betGameStaking, owner, player1 } = fixture;
      await betGameStaking.connect(player1).stake({ value: parseEther("10") });
      await betGameStaking.connect(owner).addRewards({ value: parseEther("100") });

      await fastForwardTime(3650); // 10 years

      const reward = await betGameStaking.getPendingRewards(player1.address);
      expect(reward).to.be.gt(0);

      // Check that reward doesn't exceed total available rewards
      const pool = await betGameStaking.pool();
      expect(reward).to.be.lte(pool.totalRewardsReceived);
    });

    it("Should handle multiple users with auto-compound over a very long period", async function () {
      const { diceShakeStaking: betGameStaking, owner, player1, player2, player3 } = fixture;
      await betGameStaking.connect(player1).stake({ value: parseEther("10") });
      await betGameStaking.connect(player2).stake({ value: parseEther("20") });
      await betGameStaking.connect(player3).stake({ value: parseEther("30") });

      await betGameStaking.connect(player1).setAutoCompound(true);
      await betGameStaking.connect(player2).setAutoCompound(true);
      await betGameStaking.connect(player3).setAutoCompound(true);

      await betGameStaking.connect(owner).addRewards({ value: parseEther("1000") });

      for (let i = 0; i < 120; i++) {
        // Simulate 10 years with monthly compounding
        await fastForwardTime(30);
        if ((await betGameStaking.getPendingRewards(player1.address)) > 0) {
          await betGameStaking.connect(player1).claimRewards();
        }
        if ((await betGameStaking.getPendingRewards(player2.address)) > 0) {
          await betGameStaking.connect(player2).claimRewards();
        }
        if ((await betGameStaking.getPendingRewards(player3.address)) > 0) {
          await betGameStaking.connect(player3).claimRewards();
        }
      }

      const player1Stake = await betGameStaking.stakes(player1.address);
      const player2Stake = await betGameStaking.stakes(player2.address);
      const player3Stake = await betGameStaking.stakes(player3.address);

      expect(player1Stake.amount).to.be.gt(parseEther("10"));
      expect(player2Stake.amount).to.be.gt(parseEther("20"));
      expect(player3Stake.amount).to.be.gt(parseEther("30"));

      // Check that total staked amount doesn't exceed initial stakes plus total rewards
      const totalStaked = player1Stake.amount + player2Stake.amount + player3Stake.amount;
      const initialStakes = parseEther("60"); // 10 + 20 + 30
      const totalRewards = parseEther("1000");
      expect(totalStaked).to.be.lte(initialStakes + totalRewards);
    });

    it("Should handle rapid staking and unstaking from multiple users", async function () {
      const { diceShakeStaking: betGameStaking, player1, player2 } = fixture;
      for (let i = 0; i < 10; i++) {
        await betGameStaking.connect(player1).stake({ value: parseEther("1") });
        await betGameStaking.connect(player2).stake({ value: parseEther("2") });
        await fastForwardTime(1);
        await betGameStaking.connect(player1).unstake();
        await betGameStaking.connect(player2).unstake();
      }

      const player1Stake = await betGameStaking.stakes(player1.address);
      const player2Stake = await betGameStaking.stakes(player2.address);

      expect(player1Stake.amount).to.equal(0);
      expect(player2Stake.amount).to.equal(0);
    });
  });
});
