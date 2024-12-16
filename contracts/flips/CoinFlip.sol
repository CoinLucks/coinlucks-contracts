// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

// Interfaces
import "../interfaces/IReferral.sol";
import "../interfaces/IVRF.sol";
import "../interfaces/IRedeem.sol";
import "../abstracts/BaseBetGame.sol";

/// @title CoinFlip (instant on-chain game)
/// @author CoinLucks
/// @notice It consumes VRF
/// @dev CoinFlip is a innovative cryptocurrency game.
/// Players can win crypto rewards by betting on HEADS, TAILS, or EDGE in a coin flip.
/// Features
/// 1) Jackpot Pool: Win by drawing number 69/420 to hit the jackpotPool prize.
/// 2) Win Streak Bonus: Win 5 times in a row to receive an extra payout of 5x betAmount.
/// 3) Loss Streak Bonus: Lose 5 times in a row to receive a payout of 1x betAmount.
contract CoinFlip is BaseBetGame {
    enum BetType {
        HEADS,
        TAILS,
        EDGE
    }

    struct BetExt {
        BetType betType;
        uint256 multiplier;
    }

    uint256 public edgeMultiplier = 500000; //default 50x
    uint256[] public edgeNumbers = [333, 666, 888, 999];
    uint256[] public jackpotNumbers = [69, 420];

    mapping(uint256 => BetExt) public betExts; // Store every user betExt

    // ======== Constructor =========

    constructor(
        uint256 _fee,
        uint256 _jackpotRate,
        uint256 _streakRate,
        uint256 _minBet,
        uint256 _maxBet
    ) BaseBetGame(_fee, _jackpotRate, _streakRate, _minBet, _maxBet) {}

    /// @notice Place bet
    /// @param betType: betType
    /// @param betAmount: bet amount
    /// @param player: Address of player, optional (you can buy a ticket to someone else)
    /// @param ref: Address of referrer, optional
    /// @param note: Remark, optional
    function placeBet(BetType betType, uint256 betAmount, address player, address ref, string calldata note) external payable nonReentrant {
        if (player == address(0)) {
            player = msg.sender;
        }
        _placeBet(betAmount, player, ref, note);

        uint256 betId = gameStats.currentId;
        uint256 multiplier = calculateMultiplier(betType);

        BetExt memory betExt = BetExt({betType: betType, multiplier: multiplier});
        betExts[betId] = betExt;

        emit BetPlaced(betId, player, betAmount, note);

        bool state = interfaces.VRF.reqRandomNumber(betId, 1000, 1);
        require(state, "VRF request failed");
    }

    /// @notice The method that sets the winner and transfers funds and prize
    /// @param id Id of the bet.
    /// @dev Everyone can call this method when the random number is generated by VRF.
    /// Normality triggered by the VRF contract automatically
    function redeem(uint256 id) public override nonReentrant {
        uint32[] memory drawResults = interfaces.VRF.viewRandomResult(id);
        require(drawResults.length == 1, "Invalid draw numbers");

        uint32 drawResult = drawResults[0];
        require(drawResult > 0 && drawResult <= 10000, "Invalid draw number");

        Bet storage bet = bets[id];
        BetExt storage betExt = betExts[id];
        require(bet.betStatus == BetStatus.Pending, "Already Redeem");

        address player = bet.player;
        uint256 payout = 0;
        uint256 jackpotAmt = 0;

        bool won = calculatePrize(drawResult, betExt.betType);

        (payout, jackpotAmt) = calculatePayout(won, bet.betAmount, betExt.multiplier, drawResult);

        redeemPrize(id, player, won, payout, jackpotAmt, drawResults);
    }

    function calculateMultiplier(BetType betType) public view returns (uint256) {
        uint256 totalFee = settings.protocolFee + settings.jackpotRate + settings.streakRate;
        uint256 multiplier = 2 * (10000 - totalFee); // 2x: heads or tails, 50x: edge
        if (betType == BetType.EDGE) {
            multiplier = (edgeMultiplier * (10000 - totalFee)) / 10000;
        }
        return multiplier;
    }

    function calculatePrize(uint32 drawResult, BetType betType) public view returns (bool) {
        if (betType == BetType.EDGE) {
            // chance 0.4%
            return isInArray(edgeNumbers, drawResult);
        } else {
            // chance 49.8%
            return !isInArray(edgeNumbers, drawResult) && betType == ((drawResult % 2 == 0) ? BetType.HEADS : BetType.TAILS);
        }
    }

    function calculatePayout(bool won, uint256 betAmount, uint256 multiplier, uint256 drawResult) internal view returns (uint256, uint256) {
        if (!won) {
            return (0, 0);
        }

        uint256 payout = (betAmount * multiplier) / 10000;
        uint256 jackpotAmt = 0;

        if (isInArray(jackpotNumbers, drawResult)) {
            // chance 0.2%
            jackpotAmt = (gameStats.jackpotPool * settings.jackpotBonus) / 10000; // 30% of gameStats.jackpotPool
        }
        return (payout, jackpotAmt);
    }

    // ============ Internal functions ============

    function isInArray(uint256[] memory array, uint256 number) internal pure returns (bool) {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == number) {
                return true;
            }
        }
        return false;
    }

    function calculateWinRate(uint256 betId) public view override returns (uint256) {
        BetExt storage betExt = betExts[betId];
        if (betExt.betType == BetType.EDGE) {
            return 4; // 0.4%
        } else {
            return 498; // 49.8%
        }
    }

    function calculateStreakWinMultiplier(uint256 winRate) public view override returns (uint256) {
        return settings.baseWinStreak > 0 ? settings.baseWinStreak - (winRate * settings.winStreakSlope) / 1000 : 0;
    }
}
