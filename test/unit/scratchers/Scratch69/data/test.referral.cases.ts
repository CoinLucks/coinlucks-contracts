import { TestCaseType } from "@/test/types";
import { Prize, defaultBeting } from "../utils";
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
    description: "Should bind - Bet Prize.Fourth > Won > player7 : player8",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player7,
        inputs: {
          ...tk,

          ref: params.player8.address,
        },
        outputs: {
          randoms: [19, 2, 9],
          prize: Prize.Fourth,
          referrers: [params.player8.address, ethers.ZeroAddress],
        },
        value: tk.betAmount,
      };
    },
  },

  {
    description: "Should bind - Bet Prize.Fourth > Won > player6 : player7",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player6,
        inputs: {
          ...tk,

          ref: params.player7.address,
        },
        outputs: {
          randoms: [19, 1, 59],
          prize: Prize.Fourth,
          referrers: [params.player7.address, params.player8.address],
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should bind - Bet Prize.Third > Won > player5 : player6",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player5,
        inputs: {
          ...tk,

          ref: params.player6.address,
        },
        outputs: {
          randoms: [62, 6, 60],
          prize: Prize.Third,
          referrers: [params.player6.address, params.player7.address],
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should bind - Bet Third > Won > player4 : player7",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player4,
        inputs: {
          ...tk,

          ref: params.player7.address,
        },
        outputs: {
          randoms: [64, 6, 6],
          prize: Prize.Third,
          referrers: [params.player7.address, params.player8.address],
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should bind - Bet First > Won > player3: player4",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player3,
        inputs: {
          ...tk,

          ref: params.player4.address,
        },
        outputs: {
          randoms: [69, 9, 69],
          prize: Prize.First,
          referrers: [params.player4.address, params.player7.address],
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should bind - Bet Second > Won > player9: player2",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player9,
        inputs: {
          ...tk,

          ref: params.player2.address,
        },
        outputs: {
          randoms: [69, 6, 6],
          prize: Prize.Second,
          referrers: [params.player2.address, ethers.ZeroAddress],
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should not bind - Bet Grand > Lost > player2:player7",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,

          ref: params.player7.address,
        },
        outputs: {
          randoms: [15, 6, 22],
          prize: Prize.None,
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
    description: "Should not bind - Bet > Lost > player9:player4",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player9,
        inputs: {
          ...tk,

          ref: params.player4.address,
        },
        outputs: {
          randoms: [2, 4, 1],
          prize: Prize.None,
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

export const tests = {
  case1: [...betCase1],
};
