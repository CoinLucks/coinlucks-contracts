import { TestCaseType } from "@/test/types";
import { Prize, caclulateStreakBonus, defaultBeting } from "../utils";
import { parseEther } from "ethers";
import { expect } from "chai";

const normalCases = [
  {
    description: "Should pass - Bet Fifth > Won.",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player1,
        inputs: {
          ...tk,
        },
        outputs: {
          randoms: [6, 5, 65],

          prize: Prize.Fifth,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet > Lost",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
        },
        outputs: {
          randoms: [44, 44, 44],
          prize: Prize.None,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet Fourth > Won",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
        },
        outputs: {
          randoms: [9, 1, 39],
          prize: Prize.Fourth,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet Third > Won",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player3,
        inputs: {
          ...tk,
        },
        outputs: {
          randoms: [6, 61, 65],
          prize: Prize.Third,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet Second > Won",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player3,
        inputs: {
          ...tk,
        },
        outputs: {
          randoms: [50, 50, 69],
          prize: Prize.Second,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet Grand > Won",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player1,
        inputs: {
          ...tk,
        },
        outputs: {
          randoms: [69, 69, 69],
          prize: Prize.Grand,
        },
        value: tk.betAmount,
      };
    },
  },

  {
    description: "Should pass - Bet First > Won",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player1,
        inputs: {
          ...tk,
        },
        outputs: {
          randoms: [69, 9, 69],
          prize: Prize.First,
        },
        value: tk.betAmount,
      };
    },
  },
] as TestCaseType[];

const betStreakWin = [
  {
    description: "Should pass - Bet Streak Win 5 times",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player6,
        inputs: {
          ...tk,

          note: "bet",
        },
        outputs: {
          randoms: [9, 60, 29],
          prize: Prize.Fourth,
        },
        value: tk.betAmount,
      };
    },
    beforeFn: async (params: any) => {
      const gameStats = await params.scratch69.gameStats();
      const newBetId = gameStats.currentId + BigInt(1);
      const tk = { ...defaultBeting };

      for (let i = 0; i < 4; i++) {
        await params.scratch69.connect(params.player6).placeBet(
          ...Object.values({
            ...tk,

            note: "Win streak bet",
          }),
          {
            value: tk.betAmount,
          },
        );
        await params.scratch69VRF.setRandomResult(newBetId + BigInt(i), [50, 69, 1]);
      }
    },
    afterFn: async (params: any) => {
      const gameStats = await params.scratch69.gameStats();
      const bet = await params.scratch69.bets(gameStats.currentId);
      const winnings = caclulateStreakBonus((bet.betAmount * 35n) / 10n, gameStats.streakPool)
      expect(bet.winAmount).to.be.gte(winnings); // calculateStreakWinMultiplier > streak win payout
    },
  },
] as TestCaseType[];

const betStreakLoss = [
  {
    description: "Should pass - Bet Streak Loss 5 times",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player6,
        inputs: {
          ...tk,

          note: "bet",
        },
        outputs: {
          randoms: [8, 2, 2],
          prize: Prize.None,
        },
        value: tk.betAmount,
      };
    },
    beforeFn: async (params: any) => {
      const gameStats = await params.scratch69.gameStats();
      const newBetId = gameStats.currentId + BigInt(1);
      const tk = { ...defaultBeting };

      for (let i = 0; i < 4; i++) {
        await params.scratch69.connect(params.player6).placeBet(
          ...Object.values({
            ...tk,

            note: "Loss streak bet",
          }),
          {
            value: tk.betAmount,
          },
        );
        await params.scratch69VRF.setRandomResult(newBetId + BigInt(i), [1, 3, 7]);
      }
    },
    afterFn: async (params: any) => {
      const gameStats = await params.scratch69.gameStats();
      const bet = await params.scratch69.bets(gameStats.currentId);
      const winnings = caclulateStreakBonus((bet.betAmount * 35n) / 10n, gameStats.streakPool);
      expect(bet.winAmount).to.be.gte(winnings);
    },
  },
] as TestCaseType[];

const failure = [
  {
    description: "Should revert - Invalid value - Bet 0 ether",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
        },
        value: "0",
      };
    },
    revert: "Invalid value",
  },
  {
    description: "Should revert - Invalid bet amount - Bet less then minBet",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,

          betAmount: BigInt(params.deployArgs.minBet) - 1n,
        },
        value: BigInt(params.deployArgs.minBet) - 1n,
      };
    },
    revert: "Invalid bet amount",
  },
  {
    description: "Should revert - Invalid bet amount - Bet more then maxBet",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,

          betAmount: BigInt(params.deployArgs.maxBet) + 1n,
        },
        value: BigInt(params.deployArgs.maxBet) + 1n,
      };
    },
    revert: "Invalid bet amount",
  },
  {
    description: "Should revert - Note too long",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,

          note: `Oftentimes, a transaction you're testing will be expected to have some effect on a wallet's balance, either its balance of Ether or its balance of some ERC-20 token. Another set of matchers allows you to verify that a transaction resulted in such a balance change.Oftentimes, a transaction you're testing will be expected to have some effect on a wallet's balance, either its balance of Ether or its balance of some ERC-20 token. Another set of matchers allows you to verify that a transaction resulted in such a balance change`,
        },
        value: tk.betAmount,
      };
    },
    revert: "Note too long",
  },
] as TestCaseType[];

export const tests = {
  success: [...normalCases, ...betStreakWin, ...betStreakLoss],
  failure: failure,
};
