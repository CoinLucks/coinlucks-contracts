# CoinLucks Contracts

## Development & Test

### Install

```bash
yarn install
```

### Local Harhat Network

```bash
yarn chain
```

### Compile

```bash
yarn compile
```

### Config & Args

config file path:

/ignition/config/{network}.json

### Deploy

```bash
yarn deploy:local-dices
yarn deploy:local-flips
yarn deploy:local-scratchers
yarn deploy:local-raffles
yarn deploy:local-mocks
```
- You can deploy contracts to different networks.
- mocks: Mock Token contracts and VRF contracts

### Verify Contracts

```bash
yarn verify:local
```

### Run Tests

```bash
yarn test
```

### Or Run Unit Tests

```bash
yarn test:coinflip
yarn test:diceshake
yarn test:scratch69

```

## Testnet & Mainnet

### VRF - createSubscription

```bash
yarn binanceVRF:subscription
```

### VRF - fundSubscription

```bash
yarn binanceVRF:fund
```

### VRF - addConsumer

```bash
yarn binanceVRF:addConsumer
```