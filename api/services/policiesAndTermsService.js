const appRoot = require('app-root-path');
const web3 = require('web3');
const scopeConstants = require('../constants/ScopeConstants');
const helperMethods = require(`${appRoot}/api/helpers/helperMethods`);

const {
    contractNames,
    ContractHelper
} = require(`${appRoot}/api/helpers/contractHelper`);

const contractHelper = new ContractHelper(contractNames.POLICIES_AND_TERMS);
const api = contractHelper.contractMethods();

exports.addNewDocument = function (payload) {
    const {
        ipfsHash
    } = payload;
    const timestamp = helperMethods.createTimeStamp();

    const data = api.addNewDocument(ipfsHash, timestamp).encodeABI();
    return contractHelper.sendTransaction(data);
};

exports.saveAcceptance = function (payload) {
    const {
        walletAddress,
        documentHash
    } = payload;
    const timestamp = helperMethods.ISOstringToTimestamp(payload.timestamp);

    const data = api.saveAcceptance(walletAddress, documentHash, timestamp).encodeABI();
    return contractHelper.sendTransaction(data);
};

exports.getDocument = async function getDocument(documentHash) {
    const document = await api.getDocument(documentHash).call();

    if (!document.isEntity) {
        return null;
    }

    const { timestamp } = document;

    document.timestamp = helperMethods.timeStampToISOstring(timestamp);

    return document;
};

exports.getUserAcceptance = async function getUserAcceptance(walletAddress, documentHash) {
    const acceptance = await api.getUserAcceptance(walletAddress, documentHash).call();

    if (!acceptance.isEntity) {
        return null;
    }

    const { timestamp } = acceptance;

    acceptance.timestamp = helperMethods.timeStampToISOstring(timestamp);
    return acceptance;
};