const HDWalletProvider = require('truffle-hdwallet-provider');

const rpcEndpoint = process.env.RPC_ENDPOINT;
const mainNetId = process.env.NETWORK_ID;
module.exports = {
    networks: {
        development: {
            host: '127.0.0.1',
            port: 8545,
            network_id: '*'
        },
        mainnet: {
            provider: new HDWalletProvider(process.env.ACCOUNT_PRIVATE_KEY, rpcEndpoint),
            network_id: mainNetId,
            gasPrice: 0,
            from: process.env.ACCOUNT_ADDRESS
        }
    },
    mocha: {
        timeout: 90000
    },
    compilers: {
        solc: {
            version: '0.5.11'
        }
    }
};
