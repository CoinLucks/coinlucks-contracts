import { TestCaseType } from "@/test/types";
import { BetType, defaultBeting } from "../utils";
import { ethers } from "hardhat";
import { expect } from "chai";
import { formatEther, parseEther } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const stakes = [
  {
    description: "Should pass - Stake 0.1 ether player7",
    fn: (params: any) => {
      return {
        sender: params.player7,
        outputs: {
          level: 1,
        },
        value: parseEther("0.1"),
      };
    },
  },

  {
    description: "Should pass - Stake 1 ether player6",
    fn: (params: any) => {
      return {
        sender: params.player6,
        outputs: {
          level: 2,
        },
        value: parseEther("1"),
      };
    },
  },
  {
    description: "Should pass - Stake 5 ether player5",
    fn: (params: any) => {
      return {
        sender: params.player5,
        outputs: {
          level: 3,
        },
        value: parseEther("5"),
      };
    },
  },
  {
    description: "Should pass - Stake 50 ether player4",
    fn: (params: any) => {
      return {
        sender: params.player4,
        outputs: {
          level: 4,
        },
        value: parseEther("20"),
      };
    },
  },
  {
    description: "Should pass - Stake 100 ether player3",
    fn: (params: any) => {
      return {
        sender: params.player3,
        outputs: {
          level: 5,
        },
        value: parseEther("100"),
      };
    },
  },
] as TestCaseType[];

const unstakes = [
  {
    description: "Should pass - UnStake erly out player7",
    fn: (params: any) => {
      return {
        sender: params.player7,
        outputs: {
          level: 0,
          erlyOut: true,
          increaseTime: 7 * 24 * 60 * 60 + 1, // 7 days
        },
      };
    },
  },

  {
    description: "Should pass - UnStake not erly out player6",
    fn: (params: any) => {
      return {
        sender: params.player6,
        outputs: {
          level: 0,
          erlyOut: false,
          increaseTime: 6 * 24 * 60 * 60 + 1, // 6 days
        },
      };
    },
  },

  {
    description: "Should pass - UnStake not erly out player5",
    fn: (params: any) => {
      return {
        sender: params.player5,
        outputs: {
          level: 0,
          erlyOut: false,
        },
      };
    },
  },
] as TestCaseType[];

const claims = [
  {
    description: "Should pass - Claim autoCompound false player4",
    fn: (params: any) => {
      return {
        sender: params.player4,
        outputs: {
          autoCompound: false,
        },
      };
    },
    beforeFn: async (params: any) => {
      await params.diceShakeStaking.connect(params.player4).stake({ value: parseEther("1") });
      await params.diceShakeStaking.connect(params.owner).addRewards({ value: parseEther("1") });
    },
  },
  {
    description: "Should pass - Claim autoCompound true player3",
    fn: (params: any) => {
      return {
        sender: params.player3,
        outputs: {
          autoCompound: true,
        },
      };
    },
    beforeFn: async (params: any) => {
      await params.diceShakeStaking.connect(params.player3).stake({ value: parseEther("50") });
      await params.diceShakeStaking.connect(params.owner).addRewards({ value: parseEther("2") });
      await params.diceShakeStaking.connect(params.player3).setAutoCompound(true);
    },
  },
  {
    description: "Should pass - Claim autoCompound true player2",
    fn: (params: any) => {
      return {
        sender: params.player2,
        outputs: {
          autoCompound: true,
        },
      };
    },
    beforeFn: async (params: any) => {
      await params.diceShakeStaking.connect(params.player2).stake({ value: parseEther("100") });
      await params.diceShakeStaking.connect(params.owner).addRewards({ value: parseEther("3") });
      // await time.increase(7* 24 * 60 * 60 + 1); // 7 days + 1 second
      await params.diceShakeStaking.connect(params.player2).setAutoCompound(true);
    },
  },
] as TestCaseType[];

const rewards = [
  {
    description: "Should pass - getPendingRewards 7 days",
    fn: (params: any) => {
      return {
        sender: params.owner,
        outputs: {},
        value: parseEther("1"),
      };
    },
    beforeFn: async (params: any) => {
      await params.diceShakeStaking.connect(params.player1).stake({ value: parseEther("0.1") });
      await params.diceShakeStaking.connect(params.player2).stake({ value: parseEther("1") });
      await params.diceShakeStaking.connect(params.player3).stake({ value: parseEther("5") });
      await params.diceShakeStaking.connect(params.player4).stake({ value: parseEther("20") });
      await params.diceShakeStaking.connect(params.player5).stake({ value: parseEther("100") });
      await time.increase(7 * 24 * 60 * 60 - 60 * 60); // 7 days - 1hour
      const pool = await params.diceShakeStaking.pool();
      expect(pool.totalStaked).to.eq(parseEther("126.1"));

      const p1 = await params.diceShakeStaking.getPendingRewards(params.player1.address);
      const p2 = await params.diceShakeStaking.getPendingRewards(params.player2.address);
      const p3 = await params.diceShakeStaking.getPendingRewards(params.player3.address);
      const p4 = await params.diceShakeStaking.getPendingRewards(params.player4.address);
      const p5 = await params.diceShakeStaking.getPendingRewards(params.player5.address);

      expect(p1 + p2 + p3 + p4 + p5).to.lte(parseEther("0.5"));
    },
    afterFn: async (params: any) => {
      await params.diceShakeStaking.connect(params.player1).claimRewards();
      await params.diceShakeStaking.connect(params.player2).claimRewards();
      await params.diceShakeStaking.connect(params.player3).claimRewards();
      await params.diceShakeStaking.connect(params.player4).claimRewards();
      await params.diceShakeStaking.connect(params.player5).claimRewards();
      await time.increase(7 * 24 * 60 * 60 - 60 * 60); // 7 days - 1hour
      const p1 = await params.diceShakeStaking.getPendingRewards(params.player1.address);
      const p2 = await params.diceShakeStaking.getPendingRewards(params.player2.address);
      const p3 = await params.diceShakeStaking.getPendingRewards(params.player3.address);
      const p4 = await params.diceShakeStaking.getPendingRewards(params.player4.address);
      const p5 = await params.diceShakeStaking.getPendingRewards(params.player5.address);

      expect(p1 + p2 + p3 + p4 + p5).to.lte(parseEther("0.5"));
    },
  },

  {
    description: "Should pass - getPendingRewards 14 days",
    fn: (params: any) => {
      return {
        sender: params.owner,
        outputs: {},
        value: parseEther("1"),
      };
    },
    beforeFn: async (params: any) => {
      await params.diceShakeStaking.connect(params.player1).stake({ value: parseEther("0.1") });
      await params.diceShakeStaking.connect(params.player2).stake({ value: parseEther("1") });
      await params.diceShakeStaking.connect(params.player3).stake({ value: parseEther("5") });
      await params.diceShakeStaking.connect(params.player4).stake({ value: parseEther("20") });
      await params.diceShakeStaking.connect(params.player5).stake({ value: parseEther("100") });
      await time.increase(14 * 24 * 60 * 60 + 1);
      const pool = await params.diceShakeStaking.pool();
      expect(pool.totalStaked).to.eq(parseEther("126.1"));
    },
    afterFn: async (params: any) => {
      const p1 = await params.diceShakeStaking.getPendingRewards(params.player1.address);
      const p2 = await params.diceShakeStaking.getPendingRewards(params.player2.address);
      const p3 = await params.diceShakeStaking.getPendingRewards(params.player3.address);
      const p4 = await params.diceShakeStaking.getPendingRewards(params.player4.address);
      const p5 = await params.diceShakeStaking.getPendingRewards(params.player5.address);
      const pool = await params.diceShakeStaking.pool();

      expect(p1 + p2 + p3 + p4 + p5).to.lte(parseEther("1"));
    },
  },
] as TestCaseType[];

export const tests = {
  stakes: stakes,
  unstakes: unstakes,
  claims: claims,
  rewards: rewards,
};
