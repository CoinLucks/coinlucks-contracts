import { TestCaseType } from "@/test/types";
import { BetType, caclulateStreakBonus, calculateMultiplier, defaultBeting } from "../utils";
import { parseEther } from "ethers";
import { expect } from "chai";

const betSINGLE = [
  {
    description: "Should pass - Bet SINGLE over 50 > Won",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
          betType: BetType.SINGLE,
          betNumber: 50,
          isOver: true,
        },
        outputs: {
          randoms: [51],
          won: true,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet SINGLE over 50 > Lost",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
          betType: BetType.SINGLE,
          betNumber: 50,
          isOver: true,
        },
        outputs: {
          randoms: [50],
          won: false,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet SINGLE over 10 > Won",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
          betType: BetType.SINGLE,
          betNumber: 10,
          isOver: true,
        },
        outputs: {
          randoms: [100],
          won: true,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet SINGLE below 10 > Won",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
          betType: BetType.SINGLE,
          betNumber: 10,
          isOver: false,
        },
        outputs: {
          randoms: [9],
          won: true,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet SINGLE below 99 > Won",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
          betType: BetType.SINGLE,
          betNumber: 99,
          isOver: false,
        },
        outputs: {
          randoms: [98],
          won: true,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet SINGLE below 99 > Lost 99",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
          betType: BetType.SINGLE,
          betNumber: 99,
          isOver: false,
        },
        outputs: {
          randoms: [99],
          won: false,
        },
        value: tk.betAmount,
      };
    },
  },
] as TestCaseType[];

const betRANGE = [
  {
    description: "Should pass - Bet RANGE 30~60 > Won 50",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player3,
        inputs: {
          ...tk,
          betType: BetType.RANGE,
          betNumber: 30,
          rangeEnd: 60,
          isOver: false, // isOver doesn't matter for range bet
          note: "Range bet",
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
    description: "Should pass - Bet RANGE 30~60 > Won 30",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
          betType: BetType.RANGE,
          betNumber: 30,
          rangeEnd: 60,
          isOver: false, // isOver doesn't matter for range bet
          note: "Range bet",
        },
        outputs: {
          randoms: [30],
          won: true,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet RANGE 30~60 > Won 60",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
          betType: BetType.RANGE,
          betNumber: 30,
          rangeEnd: 60,
          isOver: false, // isOver doesn't matter for range bet
          note: "Range bet",
        },
        outputs: {
          randoms: [60],
          won: true,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet RANGE 30~60 > Lost 61",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
          betType: BetType.RANGE,
          betNumber: 30,
          rangeEnd: 60,
          isOver: false, // isOver doesn't matter for range bet
          note: "Range bet",
        },
        outputs: {
          randoms: [30],
          won: true,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet RANGE 30~60 > Lost 29",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
          betType: BetType.RANGE,
          betNumber: 30,
          rangeEnd: 60,
          isOver: false, // isOver doesn't matter for range bet
          note: "Range bet",
        },
        outputs: {
          randoms: [29],
          won: false,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet RANGE 1~30 > Won 30",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
          betType: BetType.RANGE,
          betNumber: 1,
          rangeEnd: 30,
          isOver: false, // isOver doesn't matter for range bet
          note: "Range bet",
        },
        outputs: {
          randoms: [30],
          won: true,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet RANGE 18~58 > Lost 17",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
          betType: BetType.RANGE,
          betNumber: 18,
          rangeEnd: 58,
          isOver: false, // isOver doesn't matter for range bet
          note: "Range bet",
        },
        outputs: {
          randoms: [17],
          won: false,
        },
        value: tk.betAmount,
      };
    },
  },
] as TestCaseType[];

const betODD = [
  {
    description: "Should pass - Bet Odd > Won 1",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player4,
        inputs: {
          ...tk,
          betType: BetType.ODD,
          note: "Odd bet",
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
    description: "Should pass - Bet Odd > Won 11",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player4,
        inputs: {
          ...tk,
          betType: BetType.ODD,
          note: "Odd bet",
        },
        outputs: {
          randoms: [11],
          won: true,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet Odd > Won 69",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player4,
        inputs: {
          ...tk,
          betType: BetType.ODD,
          note: "Odd bet",
        },
        outputs: {
          randoms: [69],
          won: true,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet Odd > Lost 2",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player4,
        inputs: {
          ...tk,
          betType: BetType.ODD,
          note: "Odd bet",
        },
        outputs: {
          randoms: [2],
          won: false,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet Odd > Lost 50",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player4,
        inputs: {
          ...tk,
          betType: BetType.ODD,
          note: "Odd bet",
        },
        outputs: {
          randoms: [50],
          won: false,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet Odd > Lost 100",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player4,
        inputs: {
          ...tk,
          betType: BetType.ODD,
          note: "Odd bet",
        },
        outputs: {
          randoms: [100],
          won: false,
        },
        value: tk.betAmount,
      };
    },
  },
] as TestCaseType[];

const betEVEN = [
  {
    description: "Should pass - Bet EVEN > Won 8",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player4,
        inputs: {
          ...tk,
          betType: BetType.EVEN,
          note: "EVEN bet",
        },
        outputs: {
          randoms: [8],
          won: true,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet EVEN > Won 48",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player5,
        inputs: {
          ...tk,
          betType: BetType.EVEN,
          note: "EVEN bet",
        },
        outputs: {
          randoms: [48],
          won: true,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet EVEN > Won 42",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player5,
        inputs: {
          ...tk,
          betType: BetType.EVEN,
          note: "EVEN bet",
        },
        outputs: {
          randoms: [42],
          won: true,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet EVEN > Won 100",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player4,
        inputs: {
          ...tk,
          betType: BetType.EVEN,
          note: "EVEN bet",
        },
        outputs: {
          randoms: [100],
          won: true,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet EVEN > Lost 3",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player5,
        inputs: {
          ...tk,
          betType: BetType.EVEN,
          note: "EVEN bet",
        },
        outputs: {
          randoms: [3],
          won: false,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet EVEN > Lost 11",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player5,
        inputs: {
          ...tk,
          betType: BetType.EVEN,
          note: "EVEN bet",
        },
        outputs: {
          randoms: [11],
          won: false,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Should pass - Bet EVEN > Lost 69",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player4,
        inputs: {
          ...tk,
          betType: BetType.EVEN,
          note: "EVEN bet",
        },
        outputs: {
          randoms: [69],
          won: false,
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
          betType: BetType.EVEN,
          note: "EVEN bet",
        },
        outputs: {
          randoms: [8],
          won: true,
        },
        value: tk.betAmount,
      };
    },
    beforeFn: async (params: any) => {
      const gameStats = await params.diceShake.gameStats();
      const newBetId = gameStats.currentId + BigInt(1);
      const tk = { ...defaultBeting };

      for (let i = 0; i < 4; i++) {
        await params.diceShake.connect(params.player6).placeBet(
          ...Object.values({
            ...tk,
            betType: BetType.EVEN,
            note: "Win streak bet",
          }),
          {
            value: tk.betAmount,
          },
        );
        await params.diceShakeVRF.setRandomResult(newBetId + BigInt(i), [50]);
      }
    },
    afterFn: async (params: any) => {
      const gameStats = await params.diceShake.gameStats();
      const bet = await params.diceShake.bets(gameStats.currentId);
      const winnings = caclulateStreakBonus((bet.betAmount * 35n) / 10n, gameStats.streakPool)
      expect(bet.winAmount).to.be.gte(winnings); // calculateStreakWinMultiplier > streak win payout
    },
  },
  {
    description: "Should pass - Bet Streak Win 6 times > not streak!",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player7,
        inputs: {
          ...tk,
          betType: BetType.EVEN,
          note: "EVEN bet",
        },
        outputs: {
          randoms: [8],
          won: true,
        },
        value: tk.betAmount,
      };
    },
    beforeFn: async (params: any) => {
      const gameStats = await params.diceShake.gameStats();
      const newBetId = gameStats.currentId + BigInt(1);
      const tk = { ...defaultBeting };

      for (let i = 0; i < 5; i++) {
        await params.diceShake.connect(params.player7).placeBet(
          ...Object.values({
            ...tk,
            betType: BetType.EVEN,
            note: "Win streak bet",
          }),
          {
            value: tk.betAmount,
          },
        );
        await params.diceShakeVRF.setRandomResult(newBetId + BigInt(i), [50]);
      }
    },
    afterFn: async (params: any) => {
      const gameStats = await params.diceShake.gameStats();
      const bet = await params.diceShake.bets(gameStats.currentId);

      const multiplier = calculateMultiplier(
        BetType.EVEN,
        defaultBeting.betNumber,
        defaultBeting.rangeEnd,
        defaultBeting.isOver,
        BigInt(params.deployArgs.fee) +  BigInt(params.deployArgs.jackpotRate) +  BigInt(params.deployArgs.streakRate),
      );

      expect(bet.winAmount)
        .to.be.eq((bet.betAmount * multiplier) / 10000n)
        .valueOf();
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
          betType: BetType.EVEN,
          note: "EVEN bet",
        },
        outputs: {
          randoms: [9],
          won: false,
        },
        value: tk.betAmount,
      };
    },
    beforeFn: async (params: any) => {
      const gameStats = await params.diceShake.gameStats();
      const newBetId = gameStats.currentId + BigInt(1);
      const tk = { ...defaultBeting };

      for (let i = 0; i < 4; i++) {
        await params.diceShake.connect(params.player6).placeBet(
          ...Object.values({
            ...tk,
            betType: BetType.EVEN,
            note: "Loss streak bet",
          }),
          {
            value: tk.betAmount,
          },
        );
        await params.diceShakeVRF.setRandomResult(newBetId + BigInt(i), [1]);
      }
    },
    afterFn: async (params: any) => {
      const gameStats = await params.diceShake.gameStats();
      const bet = await params.diceShake.bets(gameStats.currentId);
      const winnings = caclulateStreakBonus((bet.betAmount * 35n) / 10n, gameStats.streakPool)
      expect(bet.winAmount).to.be.gte(winnings); 
    },
  },
] as TestCaseType[];

const betEdgeCase = [
  {
    description: "Edge cases - Should handle minimum bet amount correctly",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player6,
        inputs: {
          ...tk,
          betType: BetType.SINGLE,
          betAmount: parseEther("0.01"), // Minimum bet amount
          betNumber: 50,
          isOver: false,
          note: "Minimum bet",
        },
        outputs: {
          randoms: [49],
          won: true,
        },
        value: parseEther("0.01"),
      };
    },
  },

  {
    description: "Edge cases - Should handle maximum bet amount correctly",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player6,
        inputs: {
          ...tk,
          betType: BetType.SINGLE,
          betAmount: parseEther("10"), // Maximum bet amount
          betNumber: 50,
          isOver: true,
          note: "Maximum bet",
        },
        outputs: {
          randoms: [51],
          won: true,
        },
        value: parseEther("10"),
      };
    },
  },

  {
    description: "Edge cases - Should handle bet on number 1 correctly > below > Lost",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player6,
        inputs: {
          ...tk,
          betType: BetType.SINGLE,
          betNumber: 1, // Minimum possible bet number
          isOver: false,
          note: "Bet on 1",
        },
        outputs: {
          randoms: [1],
          won: false,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Edge cases - Should handle bet on number 1 correctly > over > Lost",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player6,
        inputs: {
          ...tk,
          betType: BetType.SINGLE,
          betNumber: 1, // Minimum possible bet number
          isOver: true,
          note: "Bet on 1",
        },
        outputs: {
          randoms: [1],
          won: false,
        },
        value: tk.betAmount,
      };
    },
  },
  {
    description: "Edge cases - Should handle bet on number 1 correctly > over > Won",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player6,
        inputs: {
          ...tk,
          betType: BetType.SINGLE,
          betNumber: 1, // Minimum possible bet number
          isOver: true,
          note: "Bet on 1",
        },
        outputs: {
          randoms: [2],
          won: true,
        },
        value: tk.betAmount,
      };
    },
  },

  {
    description: "Edge cases - Should handle bet on number 100 correctly > over > Lost",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player6,
        inputs: {
          ...tk,
          betType: BetType.SINGLE,
          betNumber: 100, // Maximum possible bet number,
          isOver: true,
          note: "Bet on 100",
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
    description: "Edge cases - Should handle bet on number 100 correctly > below > Lost",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player6,
        inputs: {
          ...tk,
          betType: BetType.SINGLE,
          betNumber: 100, // Maximum possible bet number,
          isOver: false,
          note: "Bet on 100",
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
    description: "Edge cases - Should handle bet on number 100 correctly > below > Won",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player6,
        inputs: {
          ...tk,
          betType: BetType.SINGLE,
          betNumber: 100, // Maximum possible bet number,
          isOver: false,
          note: "Bet on 100",
        },
        outputs: {
          randoms: [99],
          won: true,
        },
        value: tk.betAmount,
      };
    },
  },
] as TestCaseType[];

const failure = [
  {
    description: "Should revert - Bet number must be between 1 and 100 - Bet SINGLE over 0",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
          betType: BetType.SINGLE,
          betNumber: 0,
        },
        value: tk.betAmount,
      };
    },
    revert: "Bet number must be between 1 and 100",
  },
  {
    description: "Should revert - Range end must be between bet number and 100 - Bet RANGE 5~4",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
          betType: BetType.RANGE,
          betNumber: 5,
          rangeEnd: 4,
        },
        value: tk.betAmount,
      };
    },
    revert: "Range end must be between bet number and 100",
  },
  {
    description: "Should revert - Invalid value - Bet SINGLE over 50",
    fn: (params: any) => {
      const tk = { ...defaultBeting };
      return {
        sender: params.player2,
        inputs: {
          ...tk,
          betType: BetType.SINGLE,
          betNumber: 50,
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
          betType: BetType.SINGLE,
          betNumber: 50,
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
          betType: BetType.SINGLE,
          betNumber: 50,
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
          betType: BetType.SINGLE,
          betNumber: 50,
          note: `Oftentimes, a transaction you're testing will be expected to have some effect on a wallet's balance, either its balance of Ether or its balance of some ERC-20 token. Another set of matchers allows you to verify that a transaction resulted in such a balance change.Oftentimes, a transaction you're testing will be expected to have some effect on a wallet's balance, either its balance of Ether or its balance of some ERC-20 token. Another set of matchers allows you to verify that a transaction resulted in such a balance change`,
        },
        value: tk.betAmount,
      };
    },
    revert: "Note too long",
  },
] as TestCaseType[];

export const tests = {
  success: [...betSINGLE, ...betRANGE, ...betODD, ...betEVEN, ...betStreakWin, ...betStreakLoss, ...betEdgeCase],
  failure: failure,
};
