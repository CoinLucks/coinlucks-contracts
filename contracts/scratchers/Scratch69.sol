// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

// Interfaces
import "../interfaces/IReferral.sol";
import "../interfaces/IVRF.sol";
import "../interfaces/IRedeem.sol";
import "../abstracts/BaseBetGame.sol";

/// @title Scratch69 (instant on-chain game)
/// @author CoinLucks
/// @notice It consumes VRF
/// @dev Scratch69 is a innovative cryptocurrency game.
/// Players scratch three numbers, each ranging from 1-69.
/// Features
/// 1) Jackpot Pool.
/// 2) Win Streak Bonus.
/// 3) Loss Streak Bonus.
contract Scratch69 is BaseBetGame {
    error NumberOutOfRange(uint32 number);

    enum Prize {
        None, // No prize
        Grand, // Three 69s
        First, // Two 69s
        Second, // One 69 and a matching pair
        Third, // Three numbers start with 6
        Fourth, // Two numbers end with 9
        Fifth, //  Two numbers start with 6
        Sixth // One number ends with 9
    }

    mapping(Prize => uint256) public prizeOdds;
    mapping(uint256 => Prize) public betPrizes;

    event PrizeOddsUpdated(Prize Prize, uint256 multiplier);

    // ============ Constructor =========

    constructor(
        uint256 _fee,
        uint256 _jackpotRate,
        uint256 _streakRate,
        uint256 _minBet,
        uint256 _maxBet
    ) BaseBetGame(_fee, _jackpotRate, _streakRate, _minBet, _maxBet) {
        prizeOdds[Prize.Grand] = 100000;
        prizeOdds[Prize.First] = 1000;
        prizeOdds[Prize.Second] = 500;
        prizeOdds[Prize.Third] = 200;
        prizeOdds[Prize.Fourth] = 50;
        prizeOdds[Prize.Fifth] = 20;
        prizeOdds[Prize.Sixth] = 10; //1x
    }

    //  ============ Public functions  ============

    /// @notice Place bet
    /// @param betAmount: bet amount
    /// @param player: Address of player, optional (you can buy a ticket to someone else)
    /// @param ref: Address of referrer, optional
    /// @param note: Remark, optional
    /// @dev Instant cashback for referrals at the time of payment
    function placeBet(uint256 betAmount, address player, address ref, string calldata note) external payable nonReentrant {
        if (player == address(0)) {
            player = msg.sender;
        }
        _placeBet(betAmount, player, ref, note);

        uint256 betId = gameStats.currentId;

        emit BetPlaced(betId, player, betAmount, note);

        bool state = interfaces.VRF.reqRandomNumber(betId, 69, 3);
        require(state, "VRF request failed");
    }

    /// @notice The method that sets the winner and transfers funds and prize
    /// @param id Id of the bet.
    /// @dev Everyone can call this method when the random number is generated by VRF.
    /// Normality triggered by the VRF contract automatically
    function redeem(uint256 id) public override nonReentrant {
        uint32[] memory drawResults = interfaces.VRF.viewRandomResult(id);
        require(drawResults.length == 3, "Invalid draw numbers");

        Bet storage bet = bets[id];
        require(bet.betStatus == BetStatus.Pending, "Already Redeem");

        Prize betPrize = calculatePrize(drawResults);
        betPrizes[id] = betPrize;

        address player = bet.player;
        uint256 payout = 0;
        uint256 jackpotAmt = 0;
        bool won = betPrize != Prize.None;

        (payout, jackpotAmt) = calculatePayout(won, bet.betAmount, betPrize);

        redeemPrize(id, player, won, payout, jackpotAmt, drawResults);
    }

    /**
     * @dev Calculate prize based on three input numbers
     * @param numbers Array of three numbers between 1 and 69
     * @return Prize The prize achieved
     */
    function calculatePrize(uint32[] memory numbers) public pure returns (Prize) {
        // Validate number range
        for (uint i = 0; i < 3; ) {
            if (numbers[i] < 1 || numbers[i] > 69) {
                revert NumberOutOfRange(numbers[i]);
            }
            unchecked {
                ++i;
            } // Gas optimization
        }

        // 1. Check for 69s - Grand, First, and Second prizes
        uint8 count69 = 0;
        for (uint i = 0; i < 3; ) {
            if (numbers[i] == 69) {
                count69++;
            }
            unchecked {
                ++i;
            }
        }

        // Award prizes based on 69 count
        if (count69 > 0) {
            if (count69 == 3) return Prize.Grand; // Grand Prize: Three 69s
            if (count69 == 2) return Prize.First; // First Prize: Two 69s
            // Second Prize: One 69 and a matching pair
            if (hasTowSame(numbers)) return Prize.Second;
        }

        // 2. Check numbers starting with 6 - Third and Fourth prizes
        uint8 startWith6 = 0;
        for (uint i = 0; i < 3; ) {
            if ((numbers[i] >= 60 && numbers[i] < 69) || numbers[i] == 6) {
                startWith6++;
            }
            unchecked {
                ++i;
            }
        }
        if (startWith6 == 3) return Prize.Third; // Third Prize: Three numbers start with 6
        if (startWith6 == 2) return Prize.Fifth; // Fifth Prize: Two numbers end with 9

        // 3. Check numbers ending with 9 - Fifth and Sixth prizes
        uint8 endWith9 = 0;
        for (uint i = 0; i < 3; ) {
            if (numbers[i] % 10 == 9) {
                endWith9++;
            }
            unchecked {
                ++i;
            }
        }
        if (endWith9 == 2) return Prize.Fourth; // Fourth Prize: Two numbers start with 6
        if (endWith9 == 1) return Prize.Sixth; // Sixth Prize: One number ends with 9

        // No prize awarded
        return Prize.None;
    }

    function hasTowSame(uint32[] memory numbers) private pure returns (bool) {
        uint32 otherNumber;
        uint32 count = 0;

        for (uint32 i = 0; i < 3; ) {
            if (numbers[i] != 69) {
                if (count == 0) {
                    otherNumber = numbers[i];
                    count = 1;
                } else if (numbers[i] == otherNumber) {
                    count++;
                }
            }
            unchecked {
                ++i;
            }
        }

        return count == 2;
    }

    function calculatePayout(bool won, uint256 betAmount, Prize prize) internal view returns (uint256, uint256) {
        if (!won) {
            return (0, 0);
        }

        uint256 jackpotAmt = 0;
        uint256 maxJackpotBonus = (gameStats.jackpotPool * settings.jackpotBonus) / 10000; // x% of gameStats.jackpotPool
        uint256 payout = (betAmount * prizeOdds[prize]) / 10;

        if (prize == Prize.Grand) {
            jackpotAmt = maxJackpotBonus; // 30% of gameStats.jackpotPool
        } else if (prize == Prize.First) {
            jackpotAmt = maxJackpotBonus / 2; // 15% of gameStats.jackpotPool
        } else if (prize == Prize.Second) {
            jackpotAmt = maxJackpotBonus / 4; // 7.5% of gameStats.jackpotPool
        }
        return (payout, jackpotAmt);
    }

    function calculateWinRate(uint256 betId) public view override returns (uint256) {
        if (betPrizes[betId] == Prize.None) {
            return 700; // 70%
        } else {
            return 300; // 30% winRate
        }
    }

    function calculateStreakWinMultiplier(uint256 winRate) public view override returns (uint256) {
        return settings.baseWinStreak > 0 ? settings.baseWinStreak - (winRate * settings.winStreakSlope) / 1000 : 0;
    }

    //  ============ onlyOwner  functions  ============

    function setPrizeOdds(Prize prizeType, uint256 multiplier) public onlyOwner {
        prizeOdds[prizeType] = multiplier;
        emit PrizeOddsUpdated(prizeType, multiplier);
    }

    function setBulksPrizeOdds(Prize[] memory prizeTypes, uint256[] memory multipliers) public onlyOwner {
        require(prizeTypes.length == multipliers.length, "Arrays length mismatch");
        for (uint256 i = 0; i < prizeTypes.length; i++) {
            setPrizeOdds(prizeTypes[i], multipliers[i]);
        }
    }
}
