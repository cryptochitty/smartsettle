require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },

  networks: {
    // ── Local development ────────────────────────────────────────────────────
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },

    // ── Celo Sepolia Testnet (replaces Alfajores) ────────────────────────────
    // Chain ID : 11142220  (0xAA044C)
    // RPC      : https://forno.celo-sepolia.celo-testnet.org
    // Explorer : https://celo-sepolia.blockscout.com
    // Faucet   : https://faucet.celo.org/celo-sepolia
    celoSepolia: {
      url: process.env.CELO_SEPOLIA_RPC_URL || "https://forno.celo-sepolia.celo-testnet.org",
      chainId: 11142220,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
    },

    // ── Celo Mainnet ─────────────────────────────────────────────────────────
    // Chain ID : 42220
    // RPC      : https://forno.celo.org
    // Explorer : https://celoscan.io
    // cUSD     : 0x765DE816845861e75A25fCA122bb6898B8B1282a
    celo: {
      url: process.env.CELO_MAINNET_RPC_URL || "https://forno.celo.org",
      chainId: 42220,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
    },
  },

  // ── Contract verification ─────────────────────────────────────────────────
  etherscan: {
    apiKey: {
      celoSepolia: process.env.CELOSCAN_API_KEY || "",
      celo: process.env.CELOSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "celoSepolia",
        chainId: 11142220,
        urls: {
          apiURL: "https://api-sepolia.celoscan.io/api",
          browserURL: "https://celo-sepolia.blockscout.com",
        },
      },
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io",
        },
      },
    ],
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },

  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
};
