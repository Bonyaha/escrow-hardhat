# Decentralized Escrow Application

This is an Escrow Dapp built with [Hardhat](https://hardhat.org/).

## Project Layout

There are three top-level folders:

1. `/app` - contains the front-end application
2. `/contracts` - contains the solidity contract
3. `/tests` - contains tests for the solidity contract

## Setup

Install dependencies in the top-level directory with `npm install`.

After you have installed hardhat locally, you can use commands to test and compile the contracts, among other things. To learn more about these commands run `npx hardhat help`.

Compile the contracts using `npx hardhat compile`. The artifacts will be placed in the `/app` folder, which will make it available to the front-end. This path configuration can be found in the `hardhat.config.js` file.

To keep things simple we are going to start our own local blockchain and test our code locally. You can start your local blockchain with `npx hardhat node`

## Front-End

`cd` into the `/app` directory and run `npm install`

To run the front-end application run `npm run dev` from the `/escrow-hardhat` directory (it will run json server and react app simultaneously). Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

