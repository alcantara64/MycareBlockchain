const HDWalletProvider = require('truffle-hdwallet-provider');
const dotenv = require('dotenv');
dotenv.config();

const rpcEndpoint = process.env.RPC_ENDPOINT;
const mnemonic = process.env.METAMASK_ACCOUNT_MNEMONIC;
const mainNetId = process.env.NETWORK_ID;

module.exports = {
    networks: {
        development: {
            host: '127.0.0.1',
            port: process.env.GANACHE_PORT,
            network_id: '*'
        },
        mainnet: {
            provider: new HDWalletProvider(mnemonic, rpcEndpoint),
            network_id: mainNetId,
            gasPrice: 0
        }
    },
    mocha: {
        timeout: 90000
    }
};
