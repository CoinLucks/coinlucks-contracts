// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

// OpenZeppelin contracts
import "@openzeppelin/contracts/access/Ownable.sol";

import "../interfaces/IReferral.sol";

/// @title Referral System of CoinLucks
/// @author CoinLucks
/// @notice All game contracts of CoinLucks share this referral mechanism
contract Referral is IReferral, Ownable {
    struct Relation {
        address referrer;
        address referree; // first child
    }
    mapping(address => Relation) public referrals;
    mapping(address => bool) public operators;

    constructor(address _operator) Ownable(msg.sender) {
        operators[msg.sender] = true;
        if (_operator != address(0)) {
            operators[_operator] = true;
        }
    }

    function setReferrer(address _user, address _referrer) external returns (bool) {
        require(_referrer != _user, "Invalid referrer");
        require(!isContract(_referrer), "Only EOA");
        require(operators[msg.sender], "No permission"); // onlyOperator
        require(referrals[_user].referrer == address(0) && referrals[_user].referree == address(0), "Already Bind");

        referrals[_user].referrer = _referrer; // bind referrer
        if (referrals[_referrer].referree == address(0)) {
            referrals[_referrer].referree = _user; //bind first referree, to avoid circular binding
        }

        emit BindReferrer(_user, _referrer);

        return true;
    }

    function getReferrer(address _user) external view returns (address, address, address) {
        address referrer = referrals[_user].referrer;
        address referrer2 = referrer == address(0) ? address(0) : referrals[referrer].referrer;
        return (referrer, referrer2, referrals[_user].referree);
    }

    function isContract(address account) internal view returns (bool) {
        // This method relies on extcodesize/address.code.length, which returns 0
        // for contracts in construction, since the code is only stored at the end
        // of the constructor execution.
        return account.code.length > 0;
    }

    function setOperator(address _addr, bool _enable) external onlyOwner {
        require(_addr != address(0), "Invalid addr");
        operators[_addr] = _enable;
    }
}
