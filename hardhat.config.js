require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox');

const { ALCHEMY_TESTNET_RPC_URL, TESTNET_PRIVATE_KEY } = process.env;
module.exports = {
  solidity: "0.8.17",
  paths: {
    artifacts: "./app/src/artifacts",
  },
  defaultNetwork: "sepolia",
  networks: {
    hardhat: {},
    sepolia: {
      url: ALCHEMY_TESTNET_RPC_URL,
      accounts: [`0x${TESTNET_PRIVATE_KEY}`]
    }
  },
};
