// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// OpenZeppelin contracts
import "@openzeppelin/contracts/access/Ownable.sol";

// Binance oracle contracts
import "../oracles/VRFConsumerBase.sol";
import "../oracles/VRFCoordinatorInterface.sol";

// interfaces
import {IRedeem} from "../interfaces/IRedeem.sol";
import {IVRF} from "../interfaces/IVRF.sol";

/// @title Mock VRF (Binance Oracle)
/// @author CoinLucks
/// @notice It is the contract for Randomness Number Generation
/// @dev Each game contract has its own VRF contract
/// see https://oracle.binance.com/docs/vrf/overview/
contract MockVRF is VRFConsumerBase, IVRF, Ownable {
    uint256 private currentNonce;

    VRFCoordinatorInterface private COORDINATOR;
    IRedeem public immutable EXECUTOR;

    bytes32 private keyHash;
    uint64 private subId;
    uint16 private requestConfirmations;
    uint32 private callbackGasLimit;
    bool public autoRedeem = true;

    mapping(uint256 => uint32[]) public randomResults; // betId => ticket FinalNumber
    mapping(uint256 => uint256) public requestToRaffleId; // requestId => betId
    mapping(uint256 => uint256) public requestToMaxNum; // requestId => max num
    mapping(uint256 => uint256) public requestIds; // betId => requestId

    constructor(
        uint64 _subId,
        bytes32 _keyHash,
        uint32 _callbackGasLimit,
        uint16 _requestConfirmations,
        address _vrfCoordinator,
        address _executor
    ) VRFConsumerBase(_vrfCoordinator) Ownable(msg.sender) {
        COORDINATOR = VRFCoordinatorInterface(_vrfCoordinator);
        subId = _subId;
        keyHash = _keyHash;
        callbackGasLimit = _callbackGasLimit;
        requestConfirmations = _requestConfirmations;
        EXECUTOR = IRedeem(_executor);
    }

    /**
     * @notice Request randomness from a user-provided max
     * @param max: max provided by the Executor (lastTicketId)
     * @param num: generate multiple random numbers
     */
    function reqRandomNumber(uint256 betId, uint256 max, uint32 num) external override returns (bool) {
        require(msg.sender == address(EXECUTOR), "Only executor");
        require(max > 0, "Invalid max input");
        require(requestIds[betId] == 0, "Duplicate request");

        // Will revert if subscription is not set and funded.
        currentNonce++;
        uint64 nonce = uint64(currentNonce);
        (uint256 requestId, ) = computeRequestId(keyHash, msg.sender, subId, nonce);

        requestToRaffleId[requestId] = betId;
        requestToMaxNum[requestId] = max;
        requestIds[betId] = requestId;

        emit ReqRandomNumber(betId, max, num, requestId);

        return true;
    }

    function computeRequestId(bytes32 _keyHash, address _sender, uint64 _subId, uint64 _nonce) private pure returns (uint256, uint256) {
        uint256 preSeed = uint256(keccak256(abi.encode(_keyHash, _sender, _subId, _nonce)));
        return (uint256(keccak256(abi.encode(_keyHash, preSeed))), preSeed);
    }

    /**
     * @notice View random result
     */
    function viewRandomResult(uint256 betId) external view override returns (uint32[] memory) {
        return randomResults[betId];
    }

    /**
     * @notice Callback function used by ChainLink's VRF Coordinator
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        uint256 betId = requestToRaffleId[requestId];
        require(betId > 0, "Wrong betId or requestId");
        require(randomResults[betId].length == 0, "Duplicate call");

        // Between 1 and max:
        for (uint256 i = 0; i < randomWords.length; i++) {
            randomResults[betId].push(uint32((randomWords[i] % requestToMaxNum[requestId]) + 1));
        }

        // call back
        if (address(EXECUTOR) != address(0) && autoRedeem) {
            EXECUTOR.redeem(betId);
        }

        emit RspRandomNumber(betId, requestId, randomWords, randomResults[betId]);
    }

    // ============ only Owner ============

    // Mock for testing
    function setRandomResult(uint256 betId, uint256[] memory randomWords) external onlyOwner {
        require(requestIds[betId] > 0, "Require request");
        require(randomResults[betId].length == 0, "Duplicate call");

        for (uint256 i = 0; i < randomWords.length; i++) {
            randomResults[betId].push(uint32(randomWords[i]));
        }
        if (address(EXECUTOR) != address(0) && autoRedeem) {
            EXECUTOR.redeem(betId);
        }

        emit RspRandomNumber(betId, requestToRaffleId[betId], randomWords, randomResults[betId]);
    }

    /**
     * @notice Callback for enmergency case
     */
    function callbackRandomWords(uint256 betId, uint256 seed, uint32 num) external onlyOwner {
        require(requestIds[betId] > 0, "Require request");
        require(randomResults[betId].length == 0, "Duplicate call");
        uint256 requestId = requestIds[betId];
        uint256[] memory randomWords = new uint256[](num);

        // generate random by owner
        for (uint256 i = 0; i < num; i++) {
            uint256 random = uint256(
                keccak256(abi.encodePacked(seed, block.timestamp, block.prevrandao, block.number, uint(blockhash(block.number - requestConfirmations)), i))
            );
            randomWords[i] = random;
            // Between 1 and max:
            randomResults[betId].push(uint32((random % requestToMaxNum[requestId]) + 1));
        }

        if (address(EXECUTOR) != address(0) && autoRedeem) {
            EXECUTOR.redeem(betId);
        }

        emit RspRandomNumber(betId, requestToRaffleId[betId], randomWords, randomResults[betId]);
    }

    /**
     * @notice Change the setSubId
     * @param _subId: new subId
     */
    function setSubId(uint64 _subId) external onlyOwner {
        subId = _subId;
    }

    /**
     * @notice Change the keyHash
     * @param _keyHash: new keyHash
     */
    function setKeyHash(bytes32 _keyHash) external onlyOwner {
        keyHash = _keyHash;
    }

    /**
     * @notice Change the requestConfirmations and callbackGasLimit
     * @param _requestConfirmations: requestConfirmations
     * @param _callbackGasLimit: callbackGasLimit
     */
    function setParams(uint16 _requestConfirmations, uint32 _callbackGasLimit) external onlyOwner {
        requestConfirmations = _requestConfirmations;
        callbackGasLimit = _callbackGasLimit;
    }
}
