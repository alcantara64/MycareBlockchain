const appRoot = require('app-root-path');
const Web3 = require('web3');
const fs = require('fs');
const Ethereumjs = require('ethereumjs-tx');
const events = require('events');
const azureStorageHelper = require(`${appRoot}/api/helpers/azureStorageHelper`);
const logger = require(`${appRoot}/config/winston`);
const envHelper = require(`${appRoot}/api/helpers/envHelper`);

const envConstants = envHelper.getConstants();

const buildDir = `${appRoot}/build/contracts`;
const rpcEndpoint = envConstants.RPC_ENDPOINT;

const web3 = new Web3(new Web3.providers.HttpProvider(rpcEndpoint));

const accountAddress = envConstants.ACCOUNT_ADDRESS;
const privateKey = Buffer.from(envConstants.ACCOUNT_PRIVATE_KEY, 'hex');

/**
 * @description indicates if message handler is currently processing some message
 * @type {Boolean}
 */
let messageHandlerBusy = false;

const TX_EVENTS = {
    ADDED_TX_TO_QUEUE: 'added_new_transaction_to_queue',
    TX_PROCESSING_COMPLETED: 'completed_transaction_processing'
};

const eventEmitter = new events.EventEmitter();
eventEmitter.addListener(TX_EVENTS.ADDED_TX_TO_QUEUE, handleNewTxInQueue);
eventEmitter.addListener(TX_EVENTS.TX_PROCESSING_COMPLETED, checkIfTxInQueue);
checkIfTxInQueue();

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
                contractAddress,
                txMetaData
            } = txObj;

            try {
                await exports.sendSignedTransaction(data, gasLimit, contractAddress);
            } catch (sendErr) {
                // set number of times transaction has been processed
                txObj.txMetaData.txProcessedCount = txObj.txMetaData.txProcessedCount + 1;
                txObj.txMetaData.lastErrorLogged = sendErr.message;
                logger.error(`sendSignedTransaction failed for message: ${message.messageId}
                    with ERROR: ${sendErr.message}. transaction metaData: ${JSON.stringify(txMetaData)}`);

                // update message
                logger.info(`updating txObject for message: ${message.messageId}`);
                const messageText = JSON.stringify(txObj);
                await azureStorageHelper.updateMessage(message, messageText);
                logger.info(`Updated message ${message.messageId} successfully`);

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
    const queueHasNewMessages = await azureStorageHelper.queueHasNewMessages();

    if (queueHasNewMessages) {
        eventEmitter.emit(TX_EVENTS.ADDED_TX_TO_QUEUE);
    } else {
        messageHandlerBusy = false;
    }
}

function getContractInstance(contractName, options = {}) {
    try {
        const compiledFilePath = `${buildDir}/${contractName}.json`;

        const contractJson = fs.readFileSync(compiledFilePath);
        const jsonInterface = JSON.parse(contractJson);

        const networkId = envConstants.NETWORK_ID;
        const deployedContractAddress = jsonInterface.networks[networkId].address;
        return new web3.eth.Contract(jsonInterface.abi, deployedContractAddress, options);
    } catch (err) {
        logger.error(`Error occured while getting contract instance : ${err}. Check to confirm if your networkId is correct `);
    }
};

function ContractHelper(contractName) {
    if (!contractName) {
        throw new Error('Contract Name is required to initialize helper');
    }

    this._contract = getContractInstance(contractName);
}

exports.sendSignedTransaction = async function (data, gasLimit, contractAddress) {
    const nonce = await web3.eth.getTransactionCount(accountAddress);
    logger.info(`Transaction Number: ${nonce}`);

    const rawTx = {
        nonce,
        gasPrice: '0x00',
        gasLimit,
        to: contractAddress,
        value: '0x00',
        data
    };

    let tx = new Ethereumjs(rawTx);

    tx.sign(privateKey);

    const raw = `0x${tx.serialize().toString('hex')}`;

    const txReceipt = await web3.eth.sendSignedTransaction(raw);
    logger.info(`TxReceipt for Tx Number ${nonce}: ${JSON.stringify(txReceipt)}`);
};

/**
 * saves new transaction in storage queue
 * @param {string} data abi encoded string
 * @param {Number} gasLimit
 * @param {{
 * parameters: {},
 * methodName: string
 * }} txMetaData contains the raw information that is being saved to blockchain
 * as well as the name of the contract method being executed
 */
ContractHelper.prototype.sendTransaction = async function (data, gasLimit, txMetaData) {
    const txCreatedDate = (new Date()).toISOString();

    txMetaData.txCreatedDate = txCreatedDate;
    txMetaData.txProcessedCount = 0;
    txMetaData.lastErrorLogged = '';

    const txObj = {
        data,
        gasLimit,
        contractAddress: this._contract._address,
        txMetaData
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
exports.handleNewTxInQueue = handleNewTxInQueue;
exports.TX_EVENTS = TX_EVENTS;
exports.checkIfTxInQueue = checkIfTxInQueue;