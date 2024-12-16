// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IBetGameStaking {
    // Structs
    struct Stake {
        uint256 amount;
        uint256 weightedAmount;
        uint256 rewardDebt;
        uint256 lastUpdateTimestamp;
        bool autoCompound;
    }

    struct RewardPool {
        uint256 accumulatedRewardsPerShare;
        uint256 lastUpdateTimestamp;
        uint256 totalStaked;
        uint256 totalWeightedStake; // Total weighted stake across all users
        uint256 totalRewardsReceived;
        uint256 totalRewardsDistributed;
    }

    // Events
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 fee, uint256 reward);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardCompounded(address indexed user, uint256 reward, uint256 newStakeAmount);
    event AutoCompoundSet(address indexed user, bool autoCompound);
    event EarlyUnstakeFeeDistributed(address indexed user, uint256 amount);
    event RewardsDistributed(uint256 amount, uint256 newAccumulatedRewardsPerShare);
    event FundsProvidedToBetGame(address indexed game, address indexed user, uint256 amount);
    event LockPeriodUpdated(uint256 newLockPeriod);
    event MaxStakeAmountUpdated(uint256 newMaxStakeAmount);
    event RewardRatesUpdated(uint256 baseRate, uint256 maxRate, uint256 threshold);
    event RewardReleasePeriodUpdated(uint256 period);
    event SetGames(address indexed game, bool enable);
    event EmergencyWithdraw(address indexed owner, uint256 amount);
    event Deposit(address indexed sender, uint256 amount);

    // External views
    function getPendingRewards(address user) external view returns (uint256);
    function calculateRewardRate(uint256 amount) external view returns (uint256);
    function getAPR() external view returns (uint256);

    // External functions
    function stake() external payable;
    function unstake() external;
    function claimRewards() external;
    function setAutoCompound(bool _autoCompound) external;
    function deposit() external payable;

    // Interaction functions
    function addRewards() external payable;
    function claimFunds(address player, uint256 amount) external;

    // Admin functions
    function setRewardRates(uint256 _baseRate, uint256 _maxRate, uint256 _threshold) external;
    function setLockPeriod(uint256 _lockPeriod) external;
    function setMaxStakeAmount(uint256 _maxStakeAmount) external;
    function pause() external;
    function unpause() external;
    function emergencyWithdraw(uint256 amount) external;
}
