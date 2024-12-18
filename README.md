# CoinLucks Smart Contracts

### CoinLucks > Web3 Fair-to-Win Platform

CoinLucks is a comprehensive suite of blockchain-based gambling smart contracts, offering various games including raffles, coin flips, dice shakes, and scratch cards. The project leverages Binance VRF for verifiable randomness and implements staking and referral systems.

## Repository Structure

The repository is organized as follows:

- `contracts/`: Contains all Solidity smart contracts
  - `abstracts/`: Base contract implementations
  - `common/`: Shared contract functionalities
  - `dices/`: Dice game contracts
  - `flips/`: Coin flip game contracts
  - `interfaces/`: Contract interfaces
  - `libraries/`: Utility libraries
  - `mocks/`: Mock contracts for testing
  - `oracles/`: VRF-related contracts
  - `raffles/`: Raffle game contracts
  - `scratchers/`: Scratch card game contracts
  - `stake/`: Staking-related contracts
  - `vrfs/`: VRF implementation contracts
- `ignition/`: Deployment configuration and modules
- `scripts/`: Utility scripts
- `tasks/`: Custom Hardhat tasks
- `test/`: Test suites for all contracts
- `utils/`: Utility functions for testing and deployment

## Usage Instructions

### Prerequisites

- Node.js (v14+)
- Yarn package manager
- Hardhat

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/coinlucks/coinlucks-contracts.git
   cd coinlucks-contracts
   ```

2. Install dependencies:
   ```
   yarn install
   ```

3. Compile contracts:
   ```
   yarn compile
   ```

### Testing

Run all tests:
```
yarn test
```

Run specific game tests:
```
yarn test:coinflip
yarn test:diceshake
yarn test:scratch69
```

### Deployment

Deploy to local network:
```
yarn deploy:local-dices
yarn deploy:local-flips
yarn deploy:local-scratchers
yarn deploy:local-raffles
```

Deploy to testnet (opBNB Testnet):
```
yarn deploy:test-dices
yarn deploy:test-flips
yarn deploy:test-scratchers
yarn deploy:test-raffles
```

### Verification

Verify contracts on testnet:
```
yarn verify:test
```

### Binance VRF Setup

Create VRF subscription:
```
yarn binanceVRF:subscription
```

Fund VRF subscription:
```
yarn binanceVRF:fund
```

Add consumer to VRF subscription:
```
yarn binanceVRF:addConsumer
```

## Data Flow

1. User initiates a bet/raffle entry through the game contract (e.g., CoinFlip, DiceShake, Scratch69, RaffleContract).
2. The game contract requests a random number from the VRF contract (BinanceVRF or ChainlinkVRF25).
3. The VRF contract sends a request to the Binance VRF Coordinator.
4. The VRF Coordinator returns a verifiably random number to the VRF contract.
5. The VRF contract calls back to the game contract with the random number.
6. The game contract processes the bet result using the random number.
7. Winnings are distributed, including potential jackpot and streak bonuses.
8. If applicable, referral rewards are processed through the Referral contract.
9. Users can stake their tokens in the respective staking contracts for each game.

```
[User] -> [Game Contract] -> [VRF Contract] -> [VRF Coordinator]
                                            <-
         <- [Game Contract] <- [VRF Contract]
[User] <- [Game Contract] -> [Referral Contract]
[User] -> [Staking Contract]
```

## Deployment

### Prerequisites

- Funded account on the target network
- VRF subscription set up on the target network

### Environment Setup

1. Create a `.env` file in the project root with the following variables:
   ```
   INFURA_API_KEY=your_infura_api_key
   BSC_SCAN_API_KEY=your_bscscan_api_key
   BSC_TEST_SCAN_API_KEY=your_bscscan_testnet_api_key
   OPBNB_SCAN_API_KEY=your_opbnbscan_api_key
   OPBNB_TEST_SCAN_API_KEY=your_opbnbscan_testnet_api_key
   ```

2. Update the `ignition/config/{network}.json` file with the appropriate VRF and game settings for your target network.

### Deployment Steps

1. Deploy the contracts to the desired network:
   ```
   yarn deploy:test-dices
   yarn deploy:test-flips
   yarn deploy:test-scratchers
   yarn deploy:test-raffles
   ```

2. Verify the deployed contracts:
   ```
   yarn verify:test
   ```

3. Set up the VRF subscription and add the deployed contracts as consumers:
   ```
   yarn binanceVRF:subscription
   yarn binanceVRF:fund
   yarn binanceVRF:addConsumer
   ```

4. Update the frontend application with the new contract addresses from the `ignition/deployments/{chain-id}/deployed_addresses.json` file.

## Infrastructure

The project utilizes the following key infrastructure components:

- Hardhat: Development environment and task runner
- Binance VRF: Verifiable Random Function for secure randomness
- OpenZeppelin: Secure smart contract components
- Ethers.js: Ethereum wallet implementation and utilities

Key infrastructure resources:

- VRF Coordinator: `0x4E0C997c986539708aB8903a31447f7456dde212` (opBNB)
- VRF Key Hash: `0xcd65a78499993598be303c914c3e37b0103ead6b1f279d1dbfa0ef080e7141a4` (opBNB)

Lambda functions:
- `DiceShake`: Main contract for the dice game
- `CoinFlip`: Main contract for the coin flip game
- `Scratch69`: Main contract for the scratch card game
- `RaffleContract`: Main contract for the raffle game

VRF contracts:
- `BinanceVRF`: VRF implementation for Binance Smart Chain
- `ChainlinkVRF25`: VRF implementation for other networks (optional)

Staking contracts:
- `DiceShakeStaking`: Staking contract for the dice game
- `CoinFlipStaking`: Staking contract for the coin flip game
- `Scratch69Staking`: Staking contract for the scratch card game