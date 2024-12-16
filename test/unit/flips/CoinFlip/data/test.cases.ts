import { TestCaseType } from "@/test/types";
import { BetType, caclulateStreakBonus, defaultBeting } from "../utils";
import { parseEther } from "ethers";
import { expect } from "chai";

const normalCases = [
  {
    description: "Should pass - Bet HEADS > Won 50",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player1,
        inputs: {
          ...tk,
          betType: BetType.HEADS,
        },
        outputs: {
          randoms: [50],
          won: true,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet HEADS > Lost 99",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
          betType: BetType.HEADS,
        },
        outputs: {
          randoms: [99],
          won: false,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet TAILS > Won 1",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
          betType: BetType.TAILS,
        },
        outputs: {
          randoms: [1],
          won: true,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet TAILS > Lost 100",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player3,
        inputs: {
          ...tk,
          betType: BetType.TAILS,
        },
        outputs: {
          randoms: [100],
          won: false,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet EDGE > Lost 100",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player3,
        inputs: {
          ...tk,
          betType: BetType.EDGE,
        },
        outputs: {
          randoms: [100],
          won: false,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet EDGE > Lost 169",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player1,
        inputs: {
          ...tk,
          betType: BetType.EDGE,
        },
        outputs: {
          randoms: [169],
          won: false,
        },
        value: tk.betAmount,
      };
    },
  },

  {
    description: "Should pass - Bet EDGE > Lost 69",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player1,
        inputs: {
          ...tk,
          betType: BetType.EDGE,
        },
        outputs: {
          randoms: [69],
          won: false,
        },
        value: tk.betAmount,
      };
    },
  },

  {
    description: "Should pass - Bet EDGE > Won 333",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
          betType: BetType.EDGE,
        },
        outputs: {
          randoms: [333],
          won: true,
        },
        value: tk.betAmount,
      };
    },
  },

  {
    description: "Should pass - Bet EDGE > Won 666",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player3,
        inputs: {
          ...tk,
          betType: BetType.EDGE,
        },
        outputs: {
          randoms: [666],
          won: true,
        },
        value: tk.betAmount,
      };
    },
  },

  {
    description: "Should pass - Bet EDGE > Won 888",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player1,
        inputs: {
          ...tk,
          betType: BetType.EDGE,
        },
        outputs: {
          randoms: [888],
          won: true,
        },
        value: tk.betAmount,
      };
    },
  },

  {
    description: "Should pass - Bet EDGE > Won 999",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player1,
        inputs: {
          ...tk,
          betType: BetType.EDGE,
        },
        outputs: {
          randoms: [999],
          won: true,
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
          betType: BetType.HEADS,
          note: "HEADS bet",
        },
        outputs: {
          randoms: [8],
          won: true,
        },
        value: tk.betAmount,
      };
    },
    beforeFn: async (params: any) => {
      const gameStats = await params.coinFlip.gameStats();
      const newBetId = gameStats.currentId + BigInt(1);
      const tk = { ...defaultBeting };

      for (let i = 0; i < 4; i++) {
        await params.coinFlip.connect(params.player6).placeBet(
          ...Object.values({
            ...tk,
            betType: BetType.HEADS,
            note: "Win streak bet",
          }),
          {
            value: tk.betAmount,
          },
        );
        await params.coinFlipVRF.setRandomResult(newBetId + BigInt(i), [50]);
      }
    },
    afterFn: async (params: any) => {
      const gameStats = await params.coinFlip.gameStats();
      const bet = await params.coinFlip.bets(gameStats.currentId);

      const winnings = caclulateStreakBonus((bet.betAmount * 35n) / 10n, gameStats.streakPool);
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
          betType: BetType.HEADS,
          note: "HEADS bet",
        },
        outputs: {
          randoms: [9],
          won: false,
        },
        value: tk.betAmount,
      };
    },
    beforeFn: async (params: any) => {
      const gameStats = await params.coinFlip.gameStats();
      const newBetId = gameStats.currentId + BigInt(1);
      const tk = { ...defaultBeting };

      for (let i = 0; i < 4; i++) {
        await params.coinFlip.connect(params.player6).placeBet(
          ...Object.values({
            ...tk,
            betType: BetType.HEADS,
            note: "Loss streak bet",
          }),
          {
            value: tk.betAmount,
          },
        );
        await params.coinFlipVRF.setRandomResult(newBetId + BigInt(i), [1]);
      }
    },
    afterFn: async (params: any) => {
      const gameStats = await params.coinFlip.gameStats();
      const bet = await params.coinFlip.bets(gameStats.currentId);

      const winnings = caclulateStreakBonus((bet.betAmount * 35n) / 10n, gameStats.streakPool);
      expect(bet.winAmount).to.be.gte(winnings);
    },
  },
] as TestCaseType[];

const failure = [
  {
    description: "Should revert - Invalid value - Bet HEADS 0 ether",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
          betType: BetType.HEADS,
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
          betType: BetType.HEADS,
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
          betType: BetType.HEADS,
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
          betType: BetType.HEADS,
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
