const appRoot = require('app-root-path');
const helperMethods = require(`${appRoot}/api/helpers/helperMethods`);
const { GAS_LIMIT } = require(`${appRoot}/api/constants/transactionConstants`);
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

    const metaData = {
        parameters: {
            ipfsHash,
            timestamp
        },
        methodName: `${contractNames.POLICIES_AND_TERMS}.addNewDocument`
    };

    return contractHelper.sendTransaction(data, GAS_LIMIT.POLICIES_AND_TERMS.ADD_NEW_DOCUMENT, metaData);
};

exports.saveAcceptance = function (payload) {
    const {
        walletAddress,
        documentHash
    } = payload;
    const timestamp = helperMethods.ISOstringToTimestamp(payload.timestamp);

    const data = api.saveAcceptance(walletAddress, documentHash, timestamp).encodeABI();

    const metaData = {
        parameters: {
            walletAddress,
            documentHash,
            timestamp
        },
        methodName: `${contractNames.POLICIES_AND_TERMS}.saveAcceptance`
    };

    return contractHelper.sendTransaction(data, GAS_LIMIT.POLICIES_AND_TERMS.SAVE_ACCEPTANCE, metaData);
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