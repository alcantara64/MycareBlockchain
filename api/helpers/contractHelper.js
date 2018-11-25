const appRoot = require('app-root-path');
const Web3 = require('web3');
const fs = require('fs');
const ethereumjs = require('ethereumjs-tx');

const buildDir = `${appRoot}/build/contracts`;

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.RPC_ENDPOINT));

const accountAddress = process.env.ACCOUNT_ADDRESS;
const privateKey = Buffer.from(process.env.ACCOUNT_PRIVATE_KEY, 'hex');

function getContractInstance (contractName, options = {}) {
    const compiledFilePath = `${buildDir}/${contractName}.json`;

    const contractJson = fs.readFileSync(compiledFilePath);
    const jsonInterface = JSON.parse(contractJson);

    const networkId = process.env.NETWORK_ID;

    const deployedContractAddress = jsonInterface.networks[networkId].address;
    return new web3.eth.Contract(jsonInterface.abi, deployedContractAddress, options);
};

function ContractHelper (contractName) {
    if (!contractName) {
        throw new Error('Contract Name is required to initialize helper');
    }

    this._contract = getContractInstance(contractName);
}

ContractHelper.prototype.sendTransaction = async function (data) {
    const nonce = await web3.eth.getTransactionCount(accountAddress);

    const rawTx = {
        nonce,
        gasPrice: '0x00',
        gasLimit: '0x2FAF080',
        to: this._contract._address,
        value: '0x00',
        data
    };

    let tx = new ethereumjs(rawTx);

    tx.sign(privateKey);

    const raw = `0x${tx.serialize().toString('hex')}`;

    return web3.eth.sendSignedTransaction(raw);
};

ContractHelper.prototype.contractMethods = function () {
    return this._contract.methods;
};

exports.contractNames = {
    MYCARE: 'MyCare'
};

exports.ContractHelper = ContractHelper;
