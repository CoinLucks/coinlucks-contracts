// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IReferral {
    /// @notice Emit event when binding success
    /// @param user user address
    /// @param referrer referrer address
    event BindReferrer(address indexed user, address indexed referrer);

    /// @notice Binding referrer for user
    /// @dev address(0) is not allowed, Only contract callable
    /// @param _user user address
    /// @param _referrer address of referrer
    /// @return bool
    function setReferrer(address _user, address _referrer) external returns (bool);

    /// @notice Get referrers first referree and  of an address
    /// @dev This referral system supports a two-level invitation relationship.
    /// @param _user user address
    /// @return (referrer address, superior referrer address, first referree address)
    function getReferrer(address _user) external view returns (address, address, address);
}
