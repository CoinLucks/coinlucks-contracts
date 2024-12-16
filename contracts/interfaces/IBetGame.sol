// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IReferral.sol";
import "../interfaces/IVRF.sol";

struct GameInterface {
    IVRF VRF;
    IReferral REFERRAL;
}

struct Bet {
    address player;
    uint256 betAmount;
    BetStatus betStatus;
    uint256 winAmount;
}

struct GameStats {
    // Total number of games played since contract deployment
    uint256 currentId;
    // Total amount of pending rewards to be paid out (including jackpot and streak rewards)
    uint256 payouts;
    // Total amount of rewards that have been claimed by users
    uint256 claims;
    // Total amount ever added to game pool (historical record, only increases)
    uint256 gamePool;
    // Current balance of jackpot pool
    uint256 jackpotPool;
    // Current balance of streak reward pool
    uint256 streakPool;
}

struct GameSetting {
    // Platform fee rate in basis points, e.g. 350 = 3.5%
    uint256 protocolFee;
    // Percentage of bet amount that goes to jackpot pool in basis points, e.g. 1000 = 10%
    uint256 jackpotRate;
    // Percentage of jackpot pool awarded to winner in basis points, e.g. 2500 = 25%
    uint256 jackpotBonus;
    // Minimum bet amount allowed (in wei)
    uint256 minBet;
    // Maximum bet amount allowed (in wei)
    uint256 maxBet;
    // Percentage of bet amount that goes to streak reward pool in basis points, e.g. 100 = 1%
    uint256 streakRate;
    // Base multiplier for win streak rewards, e.g. 3x bet amount
    uint256 baseWinStreak;
    // Dynamic balance parameter to adjust streak reward based on win rate
    // Higher slope means reward decreases faster as win rate increases
    // e.g. if slope=5, every 0.1% (1/1000) increase in win rate reduces reward by 0.005x
    uint256 winStreakSlope;
    // Number of consecutive wins needed to trigger win streak reward
    uint8 winStreakCount;
    // Number of consecutive losses needed to trigger loss streak reward
    uint8 lossStreakCount;
}

struct FeeDistribution {
    // Percentage allocated to staking rewards in basis points, e.g. 1000 = 10%
    uint256 staking;
    // Percentage for level 1 referral rewards in basis points, e.g. 2500 = 25%
    uint256 referralLv1;
    // Percentage for level 2 referral rewards in basis points, e.g. 200 = 2%
    uint256 referralLv2;
    // Percentage allocated to charity wallet in basis points, e.g. 500 = 5%
    uint256 charity;
    // Percentage allocated to platform treasury in basis points, e.g. 1000 = 10%
    uint256 platform;
}

struct FeeAddress {
    // Address to receive staking rewards
    address staking;
    // Address to receive charity donations
    address charity;
    // Address to receive platform fees
    address platform;
}

struct PlayerStats {
    // Total amount won by player (including streak/jackpot rewards)
    uint256 winnings;
    // Total amount of rewards claimed by player
    uint256 claims;
    // Amount of player's most recent bet
    uint256 lastBetAmount;
    // Current number of consecutive wins
    uint8 winStreak;
    // Current number of consecutive losses
    uint8 loseStreak;
}

enum BetStatus {
    Pending,
    Won,
    Lost
}

interface IBetGame {
    // =========== Events ===========

    event BetPlaced(uint256 indexed betId, address indexed player, uint256 betAmount, string note);
    event BetResult(uint256 indexed betId, address indexed player, uint32[] drawResults, bool won, uint256 payout, uint256 jackpot, uint256 streakBonus);
    event JackpotWon(uint256 indexed betId, address indexed player, uint256 amount);
    event WinStreakBonus(uint256 indexed betId, address indexed player, uint256 streak, uint256 bonus);
    event LossStreakBonus(uint256 indexed betId, address indexed player, uint256 streak, uint256 bonus);
    event Claim(address indexed sender, uint256 value, uint256 poolAmt);
    event Deposit(address indexed sender, uint256 value);
    event DepositJackpot(address indexed sender, uint256 value);
    event ReferralReward(uint256 indexed betId, address indexed user, address indexed referrer, uint256 value, uint256 amount);
    event DistributeFee(uint256 indexed betId, address indexed addr, uint256 amount);
    event EmergencyWithdraw(address indexed owner, uint256 amount);

    // ============ Public Functions ============

    function claim() external;
    function deposit() external payable;
    function depositJackpot() external payable;

    function getStakePool() external view returns (uint256);
    function getReferrer(address user) external view returns (address, address, address);
}
