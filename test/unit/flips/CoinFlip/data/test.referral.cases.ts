import { TestCaseType } from "@/test/types";
import { BetType, defaultBeting } from "../utils";
import { ethers } from "hardhat";
import { expect } from "chai";

/**
 * Relationship
 * player8 > player7 > player6 > player5
 * player8 > player7 > player4 > player3
 *                   > player2 > player9 (x)
 *                   > player4 > player9 (x)
 */
const betCase1 = [
  {
    description: "Should bind - Bet HEADS draw 50 > Won > player7 : player8",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player7,
        inputs: {
          ...tk,
          betType: BetType.HEADS,
          ref: params.player8.address,
        },
        outputs: {
          randoms: [50],
          won: true,
          referrers: [params.player8.address, ethers.ZeroAddress],
        },
        value: tk.betAmount,
      };
    },
  },

  {
    description: "Should bind - Bet HEADS draw 1000 > Won > player6 : player7",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player6,
        inputs: {
          ...tk,
          betType: BetType.HEADS,
          ref: params.player7.address,
        },
        outputs: {
          randoms: [1000],
          won: true,
          referrers: [params.player7.address, params.player8.address],
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should bind - Bet HEADS draw 100 > Won > player5 : player6",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player5,
        inputs: {
          ...tk,
          betType: BetType.HEADS,
          ref: params.player6.address,
        },
        outputs: {
          randoms: [100],
          won: true,
          referrers: [params.player6.address, params.player7.address],
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should bind - Bet TAILS draw 23 > Won > player4 : player7",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player4,
        inputs: {
          ...tk,
          betType: BetType.TAILS,
          ref: params.player7.address,
        },
        outputs: {
          randoms: [23],
          won: true,
          referrers: [params.player7.address, params.player8.address],
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should bind - Bet TAILS draw 99 > Won > player3: player4",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player3,
        inputs: {
          ...tk,
          betType: BetType.TAILS,
          ref: params.player4.address,
        },
        outputs: {
          randoms: [99],
          won: true,
          referrers: [params.player4.address, params.player7.address],
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should bind - Bet TAILS draw 199 > Won > player9: player2",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player9,
        inputs: {
          ...tk,
          betType: BetType.TAILS,
          ref: params.player2.address,
        },
        outputs: {
          randoms: [199],
          won: true,
          referrers: [params.player2.address, ethers.ZeroAddress],
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should not bind - Bet TAILS draw 888 > Lost > player2:player7",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
          betType: BetType.TAILS,
          ref: params.player7.address,
        },
        outputs: {
          randoms: [888],
          won: false,
        },
        value: tk.betAmount,
      };
    },

    afterFn: async (params: any) => {
      // check relationship
      const referrers = await params.referral.getReferrer(params.player2.address);
      expect(referrers[0]).to.eql(ethers.ZeroAddress);
      expect(referrers[1]).to.eql(ethers.ZeroAddress);
    },
  },
  {
    description: "Should not bind - Bet TAILS draw 666 > Lost > player9:player4",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player9,
        inputs: {
          ...tk,
          betType: BetType.TAILS,
          ref: params.player4.address,
        },
        outputs: {
          randoms: [666],
          won: false,
        },
        value: tk.betAmount,
      };
    },
    afterFn: async (params: any) => {
      // check relationship
      const referrers = await params.referral.getReferrer(params.player9.address);
      expect(referrers[0]).to.eql(params.player2.address);
      expect(referrers[1]).to.eql(ethers.ZeroAddress);
    },
  },
] as TestCaseType[];

/**
 * Relationship
 * player1 > player2 > player3 > player4
 * player1 > player2 > player5 > player6
 *                   > player7 > player8 (x)
 *                   > player7 > player9
 */
const betCase2 = [
  {
    description: "Should bind - Bet EDGE draw 1000 > Lost > player2 : player1",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
          betType: BetType.EDGE,
          ref: params.player1.address,
        },
        outputs: {
          randoms: [1000],
          won: false,
          referrers: [params.player1.address, ethers.ZeroAddress],
        },
        value: tk.betAmount,
      };
    },
  },

  {
    description: "Should bind - Bet EDGE draw 1 > Lost > player3 : player2",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player3,
        inputs: {
          ...tk,
          betType: BetType.EDGE,

          ref: params.player2.address,
        },
        outputs: {
          randoms: [1],
          won: false,
          referrers: [params.player2.address, params.player1.address],
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should bind - Bet EDGE draw 10 > Lost > player4 : player3",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player4,
        inputs: {
          ...tk,
          betType: BetType.EDGE,
          ref: params.player3.address,
        },
        outputs: {
          randoms: [100],
          won: false,
          referrers: [params.player3.address, params.player2.address],
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should bind - Bet EDGE draw 333 > Won > player5 : player2",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player5,
        inputs: {
          ...tk,
          betType: BetType.EDGE,
          ref: params.player2.address,
        },
        outputs: {
          randoms: [333],
          won: true,
          referrers: [params.player2.address, params.player1.address],
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should bind - Bet EDGE draw 888 > Won > player6: player5",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player6,
        inputs: {
          ...tk,
          betType: BetType.EDGE,
          ref: params.player5.address,
        },
        outputs: {
          randoms: [888],
          won: true,
          referrers: [params.player5.address, params.player2.address],
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should bind - Bet EDGE draw 888 > Won > player8: player7",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player8,
        inputs: {
          ...tk,
          betType: BetType.EDGE,
          ref: params.player7.address,
        },
        outputs: {
          randoms: [888],
          won: true,
          referrers: [params.player7.address, ethers.ZeroAddress],
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should not bind - Bet EDGE draw 999 > Won > player7:player2",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player7,
        inputs: {
          ...tk,
          betType: BetType.EDGE,
          ref: params.player2.address,
        },
        outputs: {
          randoms: [999],
          won: true,
        },
        value: tk.betAmount,
      };
    },

    afterFn: async (params: any) => {
      // check relationship
      const referrers = await params.referral.getReferrer(params.player7.address);
      expect(referrers[0]).to.eql(ethers.ZeroAddress);
      expect(referrers[1]).to.eql(ethers.ZeroAddress);
    },
  },
  {
    description: "Should not bind - Bet EDGE draw 369 > Lost > player9:player7",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player9,
        inputs: {
          ...tk,
          betType: BetType.HEADS,
          ref: params.player7.address,
        },
        outputs: {
          randoms: [369],
          won: false,
          referrers: [params.player7.address, ethers.ZeroAddress],
        },
        value: tk.betAmount,
      };
    },
  },
] as TestCaseType[];

export const tests = {
  case1: [...betCase1],
  case2: [...betCase2],
};
