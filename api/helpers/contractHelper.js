const appRoot = require('app-root-path');
const Web3 = require('web3');
const fs = require('fs');
const ethereumjs = require('ethereumjs-tx');
const events = require('events');
const azureKeyVault = require(`${appRoot}/api/middlewares/authentication/azureKeyVault`);
const { requireAsync } = require(`${appRoot}/api/helpers/helperMethods`);
const axios = require('axios');
const logger = require(`${appRoot}/config/winston`);

const buildDir = `${appRoot}/build/contracts`;

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.RPC_ENDPOINT));

let accountAddress;
let privateKey;

/**
 * @description indicates if message handler is currently processing some message
 * @type {Boolean}
 */
let messageHandlerBusy = false;

const TX_EVENTS = {
    ADDED_TX_TO_QUEUE: 'added_new_transaction_to_queue',
    TX_PROCESSING_COMPLETED: 'completed_transaction_processing',
    INITIALIZED_TX_CREDENTIALS: 'initialized_transaction_credentials'
};

const eventEmitter = new events.EventEmitter();
eventEmitter.addListener(TX_EVENTS.ADDED_TX_TO_QUEUE, handleNewTxInQueue);
eventEmitter.addListener(TX_EVENTS.TX_PROCESSING_COMPLETED, checkIfTxInQueue);
eventEmitter.addListener(TX_EVENTS.INITIALIZED_TX_CREDENTIALS, checkIfTxInQueue);

let azureStorageHelper;
// asynchronously load azureStorageHelper
requireAsync(`${appRoot}/api/helpers/azureStorageHelper`, (storageHelper) => {
    azureStorageHelper = storageHelper;

    initializeTransactionCredentials().then(() => {
        eventEmitter.emit(TX_EVENTS.INITIALIZED_TX_CREDENTIALS);
    });
});

// exports.processNewTxInQueue = async () => {
async function handleNewTxInQueue() {
    try {
        messageHandlerBusy = true;
        const results = await azureStorageHelper.getMessages();

        logger.info('Processing messages from queue');
        for (const message of results) {
            const txObj = JSON.parse(message.messageText);
            const {
                data,
                gasLimit,
                contractAddress
            } = txObj;

            try {
                await exports.sendSignedTransaction(data, gasLimit, contractAddress);
            } catch (sendErr) {
                logger.error(`sendSignedTransaction failed for message: ${message.messageId} with ERROR: ${sendErr.message}`);
                continue;
            }

            try {
                await azureStorageHelper.deleteMessage(message);
            } catch (delError) {
                logger.error(`deleteMessage for messageId: ${message.messageId} FAILED with error: ${delError.message}`);
            }
        }
    } catch (err) {
        logger.error(`processNewTxInQueue - Error occured processing transactions. MSG: ${err.message}`);
    } finally {
        logger.info('Completed processing batch of messages');
        eventEmitter.emit(TX_EVENTS.TX_PROCESSING_COMPLETED);
    }
}

async function checkIfTxInQueue() {
    const messageCount = await azureStorageHelper.getQueueLength();

    if (messageCount > 0) {
        eventEmitter.emit(TX_EVENTS.ADDED_TX_TO_QUEUE);
    } else {
        messageHandlerBusy = false;
    }
}

function getContractInstance(contractName, options = {}) {
    const compiledFilePath = `${buildDir}/${contractName}.json`;

    const contractJson = fs.readFileSync(compiledFilePath);
    const jsonInterface = JSON.parse(contractJson);

    const networkId = process.env.NETWORK_ID;

    const deployedContractAddress = jsonInterface.networks[networkId].address;
    return new web3.eth.Contract(jsonInterface.abi, deployedContractAddress, options);
};

async function initializeTransactionCredentials() {
    const accountAddressJSON = await azureKeyVault.getSecret(process.env.ACCOUNT_ADDRESS, '');
    accountAddress = accountAddressJSON.value;

    const privateKeyJSON = await azureKeyVault.getSecret(process.env.ACCOUNT_PRIVATE_KEY, '');
    privateKey = Buffer.from(privateKeyJSON.value, 'hex');
}

function ContractHelper(contractName) {
    if (!contractName) {
        throw new Error('Contract Name is required to initialize helper');
    }

    this._contract = getContractInstance(contractName);
}

/**
 * @description calls parity_nextNonce api. The returned value gives the next available nonce
 * for a transaction taking all pending transactions into consideration.
 * This is meant to be an rpc call, see more here `https://wiki.parity.io/JSONRPC-parity-module#parity_nextnonce`
 * Note that is is only available if connection is established to a parity node.
 * This means this call wont work if connecton is establlished to a geth node
 */
async function getTransactionCount() {
    const response = await axios({
        method: 'post',
        url: process.env.RPC_ENDPOINT,
        data: {
            method: 'parity_nextNonce',
            params: [accountAddress],
            id: 1, // https://ethereum.stackexchange.com/questions/50647/json-rpc-api-id
            jsonrpc: '2.0'
        }
    });
    return Number(response.data.result);
}

exports.sendSignedTransaction = async function (data, gasLimit, contractAddress) {
    const nonce = await getTransactionCount();
    logger.info(`Transaction Number: ${nonce}`);

    const rawTx = {
        nonce,
        gasPrice: '0x00',
        gasLimit,
        to: contractAddress,
        value: '0x00',
        data
    };

    let tx = new ethereumjs(rawTx);

    tx.sign(privateKey);

    const raw = `0x${tx.serialize().toString('hex')}`;

    const txReceipt = await web3.eth.sendSignedTransaction(raw);
    logger.info(`TxReceipt for Tx Number ${nonce}: ${JSON.stringify(txReceipt)}`);
};

ContractHelper.prototype.sendTransaction = async function (data, gasLimit) {
    const txObj = {
        data,
        gasLimit,
        contractAddress: this._contract._address
    };

    const messageText = JSON.stringify(txObj);

    await azureStorageHelper.createMessage(messageText);

    if (!messageHandlerBusy) {
        eventEmitter.emit(TX_EVENTS.ADDED_TX_TO_QUEUE);
    };

    return messageText;
};

ContractHelper.prototype.contractMethods = function () {
    return this._contract.methods;
};

exports.contractNames = {
    MYCARE: 'MyCare',
    SHARED_ACCESS: 'SharedAccess',
    POLICIES_AND_TERMS: 'PoliciesAndTerms'
};

exports.ContractHelper = ContractHelper;
exports.initializeTransactionCredentials = initializeTransactionCredentials;
exports.handleNewTxInQueue = handleNewTxInQueue;
exports.TX_EVENTS = TX_EVENTS;
exports.checkIfTxInQueue = checkIfTxInQueue;