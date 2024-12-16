// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

// OpenZeppelin contracts
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

// Interfaces
import "../interfaces/IRedeem.sol";
import "../interfaces/IBetGame.sol";
import "../interfaces/IBetGameStaking.sol";

/// @title BaseBetGame (instant on-chain game)
/// @author CoinLucks
/// @notice It consumes VRF
/// @dev BaseBetGame is a innovative cryptocurrency game template.
/// Players can win crypto rewards by betting.
/// Features
/// 1) Jackpot Pool
/// 2) Win Streak Bonus
/// 3) Loss Streak Bonus
abstract contract BaseBetGame is IBetGame, IRedeem, ReentrancyGuard, Ownable {
    // ============ Public Mutable Storage ============

    GameStats public gameStats;
    GameSetting public settings;
    GameInterface public interfaces;
    FeeDistribution public feeDistribution;
    FeeAddress public feeAddress;

    mapping(address => PlayerStats) public players;
    mapping(uint256 => Bet) public bets;
    mapping(uint256 => uint32[]) public drawNumbers;
    mapping(address => bool) public operators;

    // ======== Constructor =========

    constructor(uint256 _fee, uint256 _jackpotRate, uint256 _streakRate, uint256 _minBet, uint256 _maxBet) Ownable(msg.sender) {
        operators[msg.sender] = true;

        settings.protocolFee = _fee;
        settings.jackpotRate = _jackpotRate;
        settings.streakRate = _streakRate;
        settings.minBet = _minBet;
        settings.maxBet = _maxBet;

        settings.jackpotBonus = 3000; // 30%
        settings.baseWinStreak = 6; // 6x
        settings.winStreakSlope = 5;
        settings.winStreakCount = 5; // 5;
        settings.lossStreakCount = 5; //5;

        feeDistribution.staking = 3000; // 30%
        feeDistribution.referralLv1 = 2400; // 24%
        feeDistribution.referralLv2 = 100; // 1%
        feeDistribution.charity = 500; // 5%
        feeDistribution.platform = 4000; // 40%
    }

    //  ============ Modifiers  ============

    modifier onlyOperator() {
        require(operators[msg.sender], "Only operator");
        _;
    }

    //  ============ Functions  ============

    function _placeBet(uint256 betAmount, address player, address ref, string calldata note) internal {
        require(player != address(0) && !isContract(player), "Invalid player");
        require(msg.value == betAmount, "Invalid value");
        require(betAmount >= settings.minBet && betAmount <= settings.maxBet, "Invalid bet amount");
        require(bytes(note).length <= 500, "Note too long");

        // Validate referral and VRF
        require(ref == address(0) || (ref != player && !isContract(ref)), "Invalid ref");
        require(address(interfaces.VRF) != address(0), "VRF not set");

        // Create new bet ID
        uint256 betId;
        unchecked {
            betId = ++gameStats.currentId;
        }

        // Store bet information
        bets[betId] = Bet({player: player, betAmount: betAmount, betStatus: BetStatus.Pending, winAmount: 0});

        // All calculations are safe as they involve division by 10000
        uint256 platformFee = (betAmount * settings.protocolFee) / 10000;
        uint256 jackpotAllocate = (betAmount * (settings.jackpotRate)) / 10000;
        uint256 streakAllocate = (betAmount * (settings.streakRate)) / 10000;
        // Calculate game pool allocation as remainder
        uint256 gamePoolAllocate = betAmount - platformFee - jackpotAllocate - streakAllocate;

        // Update pool balances
        gameStats.jackpotPool += jackpotAllocate;
        gameStats.streakPool += streakAllocate;
        gameStats.gamePool += gamePoolAllocate;

        // Handle referral and fee distribution
        uint256 refFeeAmount = referralReward(betId, ref, player);
        distributeFees(betId, refFeeAmount);
    }

    function redeem(uint256 id) public virtual nonReentrant {}

    function claim() external nonReentrant {
        PlayerStats storage player = players[msg.sender];
        uint256 winningAmount = player.winnings;
        require(winningAmount > 0, "No winnings to claim");

        // Cache balances to avoid multiple SLOAD operations
        uint256 contractBalance = address(this).balance;
        uint256 poolBalance = getStakePool();

        // Calculate amount to be claimed from contract balance
        uint256 gameAmount = winningAmount > contractBalance ? contractBalance : winningAmount;

        // Calculate amount to be claimed from staking pool
        uint256 poolAmount = winningAmount - gameAmount;
        poolAmount = poolAmount > poolBalance ? poolBalance : poolAmount;

        // Calculate total claim amount
        uint256 totalClaimAmount = gameAmount + poolAmount;
        require(totalClaimAmount > 0, "Insufficient claim balance");

        // Update player state before transfers (CEI pattern)
        unchecked {
            // Safe to use unchecked due to previous overflow check
            player.winnings -= totalClaimAmount;
            player.claims += totalClaimAmount;
            gameStats.claims += totalClaimAmount;
        }

        // Transfer funds from contract balance if any
        if (gameAmount > 0) {
            safeTransfer(msg.sender, gameAmount);
        }
        // Transfer funds from staking pool if any
        if (poolAmount > 0) {
            IBetGameStaking(feeAddress.staking).claimFunds(msg.sender, poolAmount);
        }

        emit Claim(msg.sender, totalClaimAmount, poolAmount);
    }

    function deposit() public payable nonReentrant {
        gameStats.gamePool += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function depositJackpot() public payable nonReentrant {
        gameStats.jackpotPool += msg.value;
        gameStats.gamePool += msg.value;
        emit DepositJackpot(msg.sender, msg.value);
    }

    // ============ Public views ============

    function getStakePool() public view returns (uint256) {
        return feeAddress.staking.balance;
    }

    function getReferrer(address user) external view returns (address, address, address) {
        return interfaces.REFERRAL.getReferrer(user);
    }

    // ============ Internal functions ============

    /**
     * @notice Processes and redeems prizes for a completed bet
     * @dev Handles win/loss streaks, jackpot distribution, and bonus calculations
     * @param betId The ID of the bet to process
     * @param player The address of the player
     * @param won Boolean indicating if the bet was won
     * @param payout The base payout amount
     * @param jackpotAmt The jackpot amount (if won)
     * @param drawResults Array of draw results
     */
    function redeemPrize(uint256 betId, address player, bool won, uint256 payout, uint256 jackpotAmt, uint32[] memory drawResults) internal {
        Bet storage bet = bets[betId];
        PlayerStats storage stats = players[player];
        uint256 streakBonus = 0;

        // Process win case
        if (won) {
            // Update base winnings and jackpot
            stats.winnings += payout;

            // Handle jackpot if won
            if (jackpotAmt > 0) {
                stats.winnings += jackpotAmt;
                gameStats.jackpotPool -= jackpotAmt;
                emit JackpotWon(betId, player, jackpotAmt);
            }

            // Update win streak
            stats.winStreak++;
            stats.loseStreak = 0;

            // Process win streak bonus if applicable
            if (settings.winStreakCount > 0 && stats.winStreak % settings.winStreakCount == 0) {
                uint256 winRate = calculateWinRate(betId);
                uint256 multiplier = calculateStreakWinMultiplier(winRate);
                if (multiplier > 0) {
                    streakBonus = caclulateStreakBonus(stats.lastBetAmount * multiplier);
                    stats.winnings += streakBonus;
                    gameStats.streakPool -= streakBonus;
                    emit WinStreakBonus(betId, player, stats.winStreak, streakBonus);
                }
            }
        }
        // Process loss case
        else {
            stats.loseStreak++;
            stats.winStreak = 0;

            // Process loss streak cashback if applicable
            if (settings.lossStreakCount > 0 && stats.loseStreak % settings.lossStreakCount == 0) {
                streakBonus = caclulateStreakBonus(stats.lastBetAmount);
                if (streakBonus > 0) {
                    stats.winnings += streakBonus;
                    gameStats.streakPool -= streakBonus;
                    emit LossStreakBonus(betId, player, stats.loseStreak, streakBonus);
                    stats.loseStreak = 0;
                }
            }
        }
        // Update bet status and final amounts
        bet.betStatus = won ? BetStatus.Won : BetStatus.Lost;
        bet.winAmount = payout + jackpotAmt + streakBonus;
        stats.lastBetAmount = bet.betAmount;
        gameStats.payouts += bet.winAmount;
        drawNumbers[betId] = drawResults;

        emit BetResult(betId, player, drawResults, won, payout, jackpotAmt, streakBonus);
    }

    /**
     * @notice Calculate and distribute referral rewards for a bet
     * @dev Handles both level 1 (direct referrer) and level 2 (superior) rewards
     * @param betId The bet identifier
     * @param ref The referrer address
     * @param sender The player/sender address
     * @return totalFee Total referral fees paid out
     */
    function referralReward(uint256 betId, address ref, address sender) internal returns (uint256) {
        uint256 totalFee = 0;

        // Skip if referral system not set up
        if (address(interfaces.REFERRAL) == address(0)) {
            return 0;
        }

        // Get current referral relationship
        (address referrer, address superior, address referree) = interfaces.REFERRAL.getReferrer(sender);

        // Set up new referral if none exists and ref is provided
        if (referrer == address(0) && referree == address(0) && ref != address(0)) {
            interfaces.REFERRAL.setReferrer(sender, ref);
            (referrer, superior, ) = interfaces.REFERRAL.getReferrer(sender);
        }

        // Skip if protocol fee is 0
        if (settings.protocolFee == 0) {
            return 0;
        }

        // Calculate base fee amount
        Bet storage bet = bets[betId];
        uint256 baseFeeAmount = (settings.protocolFee * bet.betAmount) / 10000;

        // Process level 1 referral reward
        if (referrer != address(0) && feeDistribution.referralLv1 > 0) {
            uint256 refAmount = (baseFeeAmount * feeDistribution.referralLv1) / 10000;
            (bool success, ) = referrer.call{value: refAmount}("");
            require(success, "Referral transfer failed");
            totalFee += refAmount;
            emit ReferralReward(betId, sender, referrer, bet.betAmount, refAmount);
        }

        // Process level 2 (superior) referral reward
        if (superior != address(0) && feeDistribution.referralLv2 > 0) {
            uint256 refAmount = (baseFeeAmount * feeDistribution.referralLv2) / 10000;
            (bool success, ) = superior.call{value: refAmount}("");
            require(success, "Referral superior transfer failed");
            totalFee += refAmount;
            emit ReferralReward(betId, sender, superior, bet.betAmount, refAmount);
        }

        return totalFee;
    }

    /**
     * @notice Distributes fee to a specified address
     * @dev Sends fee amount and emits event on successful transfer
     * @param betId The bet identifier
     * @param addr Recipient address for fee
     * @param amount Fee amount to distribute
     * @return success Whether the distribution was successful
     */
    function distributeFee(uint256 betId, address addr, uint256 amount) internal returns (bool) {
        if (addr == address(0) || amount == 0) {
            return false;
        }
        (bool success, ) = addr.call{value: amount}("");
        require(success, "Fee transfer failed");

        emit DistributeFee(betId, addr, amount);
        return true;
    }

    /**
     * @notice Distributes protocol fees to different recipients (charity, staking, platform)
     * @dev Calculates and distributes fees based on configured percentages
     * @param betId The bet identifier
     * @param feeDistributed Amount of fees already distributed (e.g. referral fees)
     */
    function distributeFees(uint256 betId, uint256 feeDistributed) internal {
        // Skip if no protocol fee set
        if (settings.protocolFee == 0) {
            return;
        }

        Bet storage bet = bets[betId];
        uint256 totalFee = (bet.betAmount * settings.protocolFee) / 10000;

        // 1.  Calculate fee shares
        uint256 charityAmt = (totalFee * feeDistribution.charity) / 10000;
        uint256 stakingAmt = (totalFee * feeDistribution.staking) / 10000;
        totalFee -= feeDistributed;

        // 2. transfer funds
        if (totalFee > 0) {
            // charity
            if (totalFee >= charityAmt && distributeFee(betId, feeAddress.charity, charityAmt)) {
                totalFee -= charityAmt;
            }
            // staking
            if (totalFee >= stakingAmt && distributeFee(betId, feeAddress.staking, stakingAmt)) {
                totalFee -= stakingAmt;
            }
            // Distribute remaining fee to platform
            if (totalFee > 0) {
                distributeFee(betId, feeAddress.platform, totalFee);
            }
        }
    }

    function calculateWinRate(uint256 betId) public view virtual returns (uint256);

    function calculateStreakWinMultiplier(uint256 winRate) public view virtual returns (uint256);

    // Assign streak bonus equal to player's last bet amount, but capped by streak pool balance
    // If last bet is smaller than pool balance, bonus = last bet amount
    // If last bet is larger than pool balance, bonus = remaining pool balance
    function caclulateStreakBonus(uint256 betAmount) internal view returns (uint256) {
        return betAmount <= gameStats.streakPool ? betAmount : gameStats.streakPool;
    }

    // ============ Utils function ============
    function isContract(address account) internal view returns (bool) {
        return account.code.length > 0;
    }

    function safeTransfer(address to, uint256 amount) internal {
        (bool success, ) = to.call{value: amount}("");
        require(success, "Funds transfer failed");
    }

    // ============ onlyOwner  functions  ============

    function setOperator(address _addr, bool _enable) external onlyOwner {
        require(_addr != address(0), "W addr");
        operators[_addr] = _enable;
    }

    function setInterfaces(GameInterface calldata _interfaces) external onlyOwner {
        interfaces = _interfaces;
    }

    function setSettings(GameSetting calldata _settings) external onlyOwner {
        require(_settings.minBet < _settings.maxBet, "W bet");
        require(_settings.protocolFee <= 5000, "W fee"); // max 50%
        settings = _settings;
    }

    function setFeeDistribution(FeeDistribution calldata _fees) external onlyOwner {
        feeDistribution = _fees;
    }

    function setFeeAddress(FeeAddress calldata _addrs) external onlyOwner {
        feeAddress = _addrs;
    }

    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        safeTransfer(owner(), amount);
        emit EmergencyWithdraw(owner(), amount);
    }
}
