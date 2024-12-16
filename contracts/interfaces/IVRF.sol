// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVRF {
    event ReqRandomNumber(uint256 id, uint256 max, uint32 num, uint256 requestId);
    event RspRandomNumber(uint256 id, uint256 requestId, uint256[] randomness, uint32[] numbers);

    /**
     * @notice Request randomness from a user-provided max
     * @param max: max provided by the Executor (lastTicketId)
     * @param num: generate multiple random numbers
     */
    function reqRandomNumber(uint256 id, uint256 max, uint32 num) external returns (bool);

    /**
     * Views random result
     */
    function viewRandomResult(uint256 id) external view returns (uint32[] memory);
}
