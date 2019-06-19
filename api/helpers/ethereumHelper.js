const appRoot = require('app-root-path');
const Web3 = require('web3');
const Crypto = require('crypto');
const envHelper = require(`${appRoot}/api/helpers/envHelper`);
const logger = require(`${appRoot}/config/winston`);

const env = envHelper.getConstants();

let web3;

//  Config
const web3http = env.RPC_ENDPOINT;
if (web3 !== undefined) {
    logger.info(`Web3= ${web3}`);
    web3 = new Web3(web3.currentProvider);
} else {
    web3 = new Web3(new Web3.providers.HttpProvider(web3http));
}

exports.getAccount = function getAccount(privateKeyText) {
    return web3.eth.accounts.privateKeyToAccount(privateKeyText);
};

exports.generateRandomEthereumKey = function generateRandomEthereumKey() {
    return `0x${Crypto.randomBytes(32).toString('hex')}`;
};