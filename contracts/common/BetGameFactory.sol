// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

// OpenZeppelin contracts
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title BetGameFactory
/// @author CoinLucks
/// @notice Manage a game list
contract BetGameFactory is Ownable {
    struct Game {
        string playType;
        string name;
        address staking;
    }

    mapping(address => Game) public games;

    event GameAdded(address addr, address staking, string playType, string name);
    event GameEdited(address addr, address staking, string playType, string name);

    constructor() Ownable(msg.sender) {}

    function add(address addr, address staking, string calldata playType, string calldata name) external onlyOwner {
        require(bytes(games[addr].playType).length == 0, "Duplicate");
        games[addr] = Game({staking: staking, playType: playType, name: name});
        emit GameAdded(addr, staking, playType, name);
    }

    function set(address addr, address staking, string calldata playType, string calldata name) external onlyOwner {
        games[addr] = Game({staking: staking, playType: playType, name: name});
        emit GameEdited(addr, staking, playType, name);
    }
}
