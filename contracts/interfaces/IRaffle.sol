// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IReferral.sol";
import "../interfaces/IVRF.sol";

// raffle status
enum STATUS {
    PENDING, // raffle created but not start
    OPEN, // the seller stakes the cryptos for the raffle
    CLOSE, // raffle close, and request VRF to redeem
    END, // the raffle is finished, and NFT and funds were transferred
    CANCEL // operator asks to cancel the raffle. Players has 30 days to ask for a refund
}

enum PRIZE_TYPE {
    NATIVE, // native token
    TOKEN, // ERC20
    NFT // ERC721/ERC1155
}

struct GameInfo {
    IVRF VRF;
    IReferral REFERRAL;
    uint256 currentId; // current raffleId
    uint256 protocolFee; // Percentage of protocol fee (600 = 6%, 1,000 = 10%)
}

struct FeeDistribution {
    uint256 staking;
    uint256 referralLv1;
    uint256 referralLv2;
    uint256 charity;
    uint256 platform;
}

struct FeeAddress {
    address staking;
    address charity;
    address platform;
}

struct Eligibility {
    address token; // exclusive token contract address
    uint256 tokenId; // exclusive tokenId if ERC721/ERC1155
    uint256 amount; // exclusive token holding amount required
}

struct Prize {
    PRIZE_TYPE prizeType;
    address token; // ERC20/ERC721/ERC1155 contract address
    uint256 amount; // number (can be a percentage, an id, an amount, etc. depending on the competition)
    uint256 tokenId; // NFT id of the NFT
}

struct Raffle {
    STATUS status; // raffle status
    bool hasFree; // enable free ticket (only once for each wallet)
    uint256 platformFee; // percentage of the funds raised that goes to the platform
    uint256 endTime; // raffle deadline
    uint256 maxPerUser; // maximum number of tickets allowed per user, to avoid abuse
    uint256 price; // ticket unit-price  (in wei)
    uint256 ticketsCount; // to easy frontend, the length of the tickets array is saved here
    uint256 amountRaised; // funds raised so far in wei
    uint256 amountCollected; // funds raised so far in wei (without referral cashback)
    uint256 randomNumber; // normalized (0-Entries array size) random number generated by the VRF
    uint256 eligibility; // eligibility count
    address seller; // address of the seller
    address winner; // address of thed winner of the raffle. Address(0) if no winner yet
    // Prize prize; // prize of raffle
}

struct Ticket {
    address user; // wallet address of the user
    uint256 id; // Ticket index of array (ticketId)
    uint256 start; // ticket start number
    uint256 end; // ticket end number (current amount of tickets bought in the raffle)
}

struct UserState {
    uint256 counts; // Max ticket per wallet, Store ticket count of user for earch raffle
    bool gotFree; // got free ticket
}

interface IRaffle {
    // ============ Events ============

    // Emitted when the raffle is created
    event RaffleCreated(uint256 indexed raffleId, address indexed seller, uint256 endTime, string note);

    // Emitted when raffle time's up, trigger VRF to request randomness
    event RaffleClosed(uint256 indexed raffleId, address indexed caller, uint256 amountRaised);

    // Emitted when raffle is canceled (without tickets)
    event RaffleCancelled(uint256 indexed raffleId, address indexed caller, uint256 amountRaised);

    // Emitted when the raffle is finished (success), call by setWinner function
    event RaffleEnded(
        uint256 indexed raffleId,
        address indexed caller,
        address indexed winner,
        uint256 amountRaised,
        uint256 ticketsCount,
        uint256 randomNumber
    );

    // Event sent when one or more tickets are sold (info from the price structure)
    event BuyTicket(uint256 indexed raffleId, address indexed user, uint256 ticketId, uint256 num, uint256 currentSize, string note);

    // Emitted when tickets are transfer out
    event TransferTickets(uint256 raffleId, address from, address to, uint256[] ticketIds);

    // Emitted when cash back to referrer
    event ReferralReward(uint256 indexed raffleId, address indexed user, address indexed referrer, uint256 value, uint256 amount);

    // Emitted when raffle ended, transfer fees to share-part addresses
    event DistributeFee(uint256 indexed betId, address indexed addr, uint256 amount);

    // Emitted when raffle ended, transfer fund to seller
    event TransferFund(uint256 indexed raffleId, address indexed seller, uint256 amount);

    // Emitted when raffle ended, transfer prize to winner
    event TransferPrize(uint256 indexed raffleId, address indexed to, Prize prize);
    // ============ Public Functions ============

    function create(
        bool hasFree,
        uint256 endTime,
        uint256 maxPerUser,
        uint256 price,
        Prize calldata prize,
        Eligibility[] calldata eligibility,
        string calldata note
    ) external payable returns (uint256);
    function close(uint256 raffleId) external;
    function cancel(uint256 raffleId) external;
    function buy(uint256 raffleId, uint256 num, address ref, address to, string calldata note) external payable;
    function transferTickets(uint256 raffleId, address to, uint256[] calldata ids) external;
    function claimReward(uint256 id, uint256 ticketId) external;

    // ============ Public Views ============
    function getWinNumber(uint256 raffleId) external view returns (uint32);
    function findWinnerFromRandom(uint256 raffleId, uint256 _random) external view returns (address);
    function getReferrer(address user) external view returns (address, address, address);
}