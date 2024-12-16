// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

import "../interfaces/IBetGameStaking.sol";

contract BetGameStaking is IBetGameStaking, ReentrancyGuard, Ownable, Pausable {
    uint256 public constant PRECISION = 1e18; // Unified precision constant
    uint256 public constant EARLY_UNSTAKE_FEE = 500; // 5% fee
    uint256 public lockPeriod = 7 days;
    uint256 public maxStakeAmount = 1000 ether;

    uint256 public baseRewardRate = 100; // 1% daily
    uint256 public maxRewardRate = 150; // 1.5% daily
    uint256 public maxRewardThreshold = 100 ether;
    uint256 public rewardReleasePeriod = 14 days;

    RewardPool public pool;
    mapping(address => Stake) public stakes;
    mapping(address => bool) public betGames;

    constructor(address _game) Ownable(msg.sender) {
        betGames[_game] = true;
        pool.lastUpdateTimestamp = block.timestamp;
    }

    modifier onlyGame() {
        require(betGames[msg.sender] == true || msg.sender == owner(), "Only game contract");
        _;
    }

    function stake() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Stake amount must be greater than 0");
        require(stakes[msg.sender].amount + msg.value <= maxStakeAmount, "Exceeds max stake amount");

        _updateRewards();

        uint256 newAmount = stakes[msg.sender].amount + msg.value;
        uint256 newWeightedAmount = _calculateNewWeightedAmount(newAmount);

        if (stakes[msg.sender].amount > 0) {
            uint256 reward = _calculateReward(msg.sender);
            stakes[msg.sender].rewardDebt += reward;
        }

        pool.totalStaked += msg.value;
        pool.totalWeightedStake = pool.totalWeightedStake + newWeightedAmount - stakes[msg.sender].weightedAmount;

        stakes[msg.sender].amount = newAmount;
        stakes[msg.sender].weightedAmount = newWeightedAmount;
        stakes[msg.sender].lastUpdateTimestamp = block.timestamp;
        stakes[msg.sender].rewardDebt = (newWeightedAmount * pool.accumulatedRewardsPerShare) / PRECISION;

        emit Staked(msg.sender, msg.value);
    }

    function unstake() external nonReentrant {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No stake to withdraw");

        _updateRewards();

        uint256 reward = _calculateReward(msg.sender);
        uint256 amount = userStake.amount;
        uint256 fee = 0;

        if (block.timestamp < userStake.lastUpdateTimestamp + lockPeriod) {
            fee = (amount * EARLY_UNSTAKE_FEE) / 1e4;
            amount -= fee;
            pool.totalRewardsReceived += fee;
            emit EarlyUnstakeFeeDistributed(msg.sender, fee);
        }

        uint256 totalPayout = amount + reward;
        require(address(this).balance >= totalPayout, "Insufficient contract balance");

        pool.totalWeightedStake = pool.totalWeightedStake > userStake.weightedAmount ? pool.totalWeightedStake - userStake.weightedAmount : 0;
        pool.totalStaked = pool.totalStaked > userStake.amount ? pool.totalStaked - userStake.amount : 0;

        delete stakes[msg.sender];

        safeTransfer(msg.sender, totalPayout);

        emit Unstaked(msg.sender, amount, fee, reward);
    }

    function claimRewards() external nonReentrant {
        _updateRewards();

        uint256 reward = _calculateReward(msg.sender);
        require(reward > 0, "No rewards to claim");

        Stake storage userStake = stakes[msg.sender];
        if (userStake.autoCompound) {
            uint256 newAmount = userStake.amount + reward;
            uint256 newWeightedAmount = _calculateNewWeightedAmount(newAmount);

            pool.totalWeightedStake = pool.totalWeightedStake + newWeightedAmount - userStake.weightedAmount;
            pool.totalStaked += reward;

            userStake.amount = newAmount;
            userStake.weightedAmount = newWeightedAmount;

            emit RewardCompounded(msg.sender, reward, newAmount);
        } else {
            require(address(this).balance >= reward, "Insufficient contract balance");
            safeTransfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }

        userStake.lastUpdateTimestamp = block.timestamp;
        userStake.rewardDebt = (userStake.weightedAmount * pool.accumulatedRewardsPerShare) / PRECISION;
    }

    function setAutoCompound(bool _autoCompound) external {
        _updateRewards();
        uint256 reward = _calculateReward(msg.sender);
        if (reward > 0) {
            uint256 oldWeightedAmount = stakes[msg.sender].weightedAmount;
            if (_autoCompound) {
                stakes[msg.sender].amount += reward;
                stakes[msg.sender].weightedAmount = _calculateNewWeightedAmount(stakes[msg.sender].amount);
                pool.totalStaked += reward;
                pool.totalWeightedStake += stakes[msg.sender].weightedAmount - oldWeightedAmount;
            } else {
                stakes[msg.sender].rewardDebt += reward;
            }
        }
        stakes[msg.sender].autoCompound = _autoCompound;
        stakes[msg.sender].lastUpdateTimestamp = block.timestamp;
        stakes[msg.sender].rewardDebt = (stakes[msg.sender].weightedAmount * pool.accumulatedRewardsPerShare) / PRECISION;
        emit AutoCompoundSet(msg.sender, _autoCompound);
    }

    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        emit Deposit(msg.sender, msg.value);
    }

    function getPendingRewards(address user) external view returns (uint256) {
        return _calculateReward(user);
    }

    function getAPR() public view returns (uint256) {
        if (pool.totalWeightedStake == 0) return 0;

        uint256 rewardsToDistribute = pool.totalRewardsReceived - pool.totalRewardsDistributed;

        // Simplified calculation
        uint256 fourteenDayReturn = (rewardsToDistribute * PRECISION) / pool.totalWeightedStake;

        uint256 periodsPerYear = (365 days) / rewardReleasePeriod;
        uint256 simpleAPY = fourteenDayReturn * periodsPerYear;

        return simpleAPY / PRECISION; // Adjusted for precision
    }

    function calculateRewardRate(uint256 amount) public view returns (uint256) {
        if (amount >= maxRewardThreshold) {
            return maxRewardRate;
        }
        return baseRewardRate + ((maxRewardRate - baseRewardRate) * amount) / maxRewardThreshold;
    }

    function addRewards() public payable onlyGame {
        require(msg.value > 0, "Reward amount must be greater than 0");
        _updateRewards();
        pool.totalRewardsReceived += msg.value;
        emit RewardsDistributed(msg.value, pool.accumulatedRewardsPerShare);
    }

    function claimFunds(address player, uint256 amount) external onlyGame nonReentrant {
        require(address(this).balance >= amount, "Insufficient balance");
        safeTransfer(player, amount);
        emit FundsProvidedToBetGame(msg.sender, player, amount);
    }

    function _calculateReward(address user) internal view returns (uint256) {
        Stake storage userStake = stakes[user];
        if (userStake.amount == 0) return 0;

        uint256 currentAccRewardPerShare = pool.accumulatedRewardsPerShare;
        uint256 pendingRewards = pool.totalRewardsReceived - pool.totalRewardsDistributed;

        if (pool.totalWeightedStake > 0 && pendingRewards > 0) {
            uint256 timeElapsed = block.timestamp - pool.lastUpdateTimestamp;
            uint256 rewardsToDistribute = Math.min(pendingRewards, (pendingRewards * timeElapsed) / rewardReleasePeriod);
            currentAccRewardPerShare += (rewardsToDistribute * PRECISION) / pool.totalWeightedStake;
        }

        uint256 accumulatedReward = (userStake.weightedAmount * currentAccRewardPerShare) / PRECISION;
        return accumulatedReward > userStake.rewardDebt ? accumulatedReward - userStake.rewardDebt : 0;
    }

    function _updateRewards() internal {
        if (pool.totalWeightedStake == 0) {
            pool.lastUpdateTimestamp = block.timestamp;
            return;
        }

        uint256 pendingRewards = pool.totalRewardsReceived - pool.totalRewardsDistributed;
        if (pendingRewards == 0) {
            pool.lastUpdateTimestamp = block.timestamp;
            return;
        }

        uint256 timeElapsed = block.timestamp - pool.lastUpdateTimestamp;
        uint256 rewardsToDistribute = Math.min(pendingRewards, (pendingRewards * timeElapsed) / rewardReleasePeriod);

        if (rewardsToDistribute > 0) {
            pool.accumulatedRewardsPerShare += (rewardsToDistribute * PRECISION) / pool.totalWeightedStake;
            pool.totalRewardsDistributed += rewardsToDistribute;
        }

        pool.lastUpdateTimestamp = block.timestamp;
    }

    function _calculateNewWeightedAmount(uint256 amount) internal view returns (uint256) {
        uint256 rewardRate = calculateRewardRate(amount);
        return (amount * rewardRate * PRECISION) / baseRewardRate / PRECISION;
    }

    // ============ Utils function ============

    function safeTransfer(address to, uint256 amount) internal {
        (bool success, ) = to.call{value: amount}("");
        require(success, "Funds transfer failed");
    }

    // ============ onlyOwner  functions  ============

    function setGames(address _game, bool _enable) external onlyOwner {
        betGames[_game] = _enable;
        emit SetGames(_game, _enable);
    }

    function setRewardRates(uint256 _baseRate, uint256 _maxRate, uint256 _threshold) public onlyOwner {
        require(_baseRate <= _maxRate, "Base rate must be <= max rate");
        require(_maxRate <= 1000, "Max rate cannot exceed 10% daily");
        require(_threshold > 0, "Threshold must be > 0");
        baseRewardRate = _baseRate;
        maxRewardRate = _maxRate;
        maxRewardThreshold = _threshold;
        emit RewardRatesUpdated(_baseRate, _maxRate, _threshold);
    }

    function setLockPeriod(uint256 _lockPeriod) external onlyOwner {
        lockPeriod = _lockPeriod;
        emit LockPeriodUpdated(_lockPeriod);
    }

    function setMaxStakeAmount(uint256 _maxStakeAmount) external onlyOwner {
        maxStakeAmount = _maxStakeAmount;
        emit MaxStakeAmountUpdated(_maxStakeAmount);
    }

    function setRewardReleasePeriod(uint256 _period) external onlyOwner {
        require(_period >= 7 days && _period <= 30 days, "Invalid release period");
        rewardReleasePeriod = _period;
        emit RewardReleasePeriodUpdated(_period);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        safeTransfer(owner(), amount);
        emit EmergencyWithdraw(owner(), amount);
    }

    receive() external payable {
        addRewards();
    }
}
