require("dotenv").config();

import "tsconfig-paths/register";
import { HardhatUserConfig } from "hardhat/config";

import "@nomicfoundation/hardhat-network-helpers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-ignition";
import "@nomicfoundation/hardhat-ignition-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";

import getAccounts from "./scripts/accounts";

//custome tasks
import "./tasks/verifyContract";
import "./tasks/binanceVRF";
import "./tasks/checkGas";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
    },
    localhost: {
      url: "http://192.168.31.47:8545",
      chainId: 1337,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
      },
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: getAccounts("testnet"),
    },
    eth: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: getAccounts("mainnet"),
      // gasPrice: 50000000000, //50Gwei
      chainId: 1,
      timeout: 600000,
    },
    // bsc network
    bsc: {
      url: "https://bsc-dataseed.bnbchain.org",
      accounts: getAccounts("mainnet"),
      // gasPrice: 5000000000, //5Gwei
      chainId: 56,
      timeout: 600000,
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
      accounts: getAccounts("testnet"),
      chainId: 97,
      // gasPrice: 11000000000, //11Gwei
      gas: 8000000,
      timeout: 600000,
    },
    // opBNB network
    opBNB: {
      url: "https://opbnb-mainnet-rpc.bnbchain.org",
      accounts: getAccounts("mainnet"),
      // gasPrice: 5000000000, //5Gwei
      chainId: 204,
      timeout: 600000,
    },
    opBNBTestnet: {
      url: "https://opbnb-testnet-rpc.bnbchain.org",
      accounts: getAccounts("testnet"),
      chainId: 5611,
      timeout: 600000,
      gas: 8000000,
    },
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: false,
      debug: {
        revertStrings: "debug",
      },
    },
  },
  paths: {
    sources: "./contracts",
    // tests: "./test",
    tests: "test/unit",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
  gasReporter: {
    currency: "BNB",
    gasPrice: 1, // GWei
    enabled: !!process.env.REPORT_GAS,
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: false,
    strict: true,
  },
  etherscan: {
    // To see the full list of supported networks, run npx hardhat verify --list-networks
    apiKey: {
      localhost: "localhost",
      mainnet: process.env.ETH_SCAN_API_KEY!,
      sepolia: process.env.ETH_TEST_SCAN_API_KEY!,
      bsc: process.env.BSC_SCAN_API_KEY!,
      bscTestnet: process.env.BSC_TEST_SCAN_API_KEY!,
      opBNB: process.env.OPBNB_SCAN_API_KEY!,
      opBNBTestnet: process.env.OPBNB_TEST_SCAN_API_KEY!,
    },
    customChains: [
      {
        network: "localhost",
        chainId: 1337,
        urls: {
          apiURL: "http://192.168.31.47/api",
          browserURL: "http://192.168.31.47",
        },
      },
      {
        network: "opBNB",
        chainId: 204,
        urls: {
          apiURL: "https://mainnet.opbnbscan.com/api",
          browserURL: "https://mainnet.opbnbscan.com",
        },
      },
      {
        network: "opBNBTestnet",
        chainId: 5611,
        urls: {
          apiURL: "https://open-platform.nodereal.io/0c82854ee7404b588cb4da1d817afb35/op-bnb-testnet/contract/",
          browserURL: "https://testnet.opbnbscan.com",
        },
      },
    ],
  },
};

export default config;
