const appRoot = require('app-root-path');
const web3 = require('web3');
const scopeConstants = require('../constants/ScopeConstants');
const helperMethods = require(`${appRoot}/api/helpers/helperMethods`);

const {
    contractNames,
    ContractHelper
} = require(`${appRoot}/api/helpers/contractHelper`);

const contractHelper = new ContractHelper(contractNames.SHARED_ACCESS);
const api = contractHelper.contractMethods();

exports.integersToBytes = function integersToBytes(integersList) {
    const scope = integersList.reduce((x, y) => x | y);
    const hex = `0X${scope.toString(16)}`;

    return web3.utils.padLeft(hex, 32);
};

exports.addConsent = function addConsent(consent) {
    const scopeIntegers = consent.scope.map(x => scopeConstants[x]);

    const scope = this.integersToBytes(scopeIntegers);

    const dataSource = JSON.stringify(consent.dataSource);
    const startDate = helperMethods.ISOstringToTimestamp(consent.startDate);
    const endDate = helperMethods.ISOstringToTimestamp(consent.endDate);
    const timestamp = helperMethods.ISOstringToTimestamp(consent.timestamp);

    const data = api.addConsent(
        consent.consentId,
        timestamp,
        scope,
        dataSource,
        startDate,
        endDate,
        consent.connectionId
    ).encodeABI();

    return contractHelper.sendTransaction(data);
};

exports.revokeConsent = function revokeConsent(payload) {
    const { consentId } = payload;

    const timestamp = helperMethods.ISOstringToTimestamp(payload.timestamp);

    const data = api.revokeConsent(consentId, timestamp).encodeABI();
    return contractHelper.sendTransaction(data);
};

exports.consentIsRevoked = async function consentIsRevoked(consentId) {
    const consentStatus = await api.consentIsRevoked(consentId);

    if (!consentStatus.isEntity) {
        return null;
    }

    return consentStatus;
};

exports.getConsent = async function getConsent(consentId) {
    const consent = await api.getConsent(consentId).call();

    if (!consent.isEntity) {
        return null;
    }

    const {
        startDate,
        endDate,
        timestamp,
        dataSource
    } = consent;

    consent.startDate = helperMethods.timeStampToISOstring(startDate);
    consent.endDate = helperMethods.timeStampToISOstring(endDate);
    consent.timestamp = helperMethods.timeStampToISOstring(timestamp);
    consent.dataSource = JSON.parse(dataSource);

    return consent;
};

exports.addConnectionAttempt = function addConnectionAttempt(connection) {
    const timestamp = Math.floor((new Date(connection.created)).getTime() / 1000);
    const data = api.addConnectionAttempt(
        connection.connectionId.toString(),
        connection.from,
        connection.to,
        timestamp
    ).encodeABI();

    return contractHelper.sendTransaction(data);
};

exports.updateConnectionAttempt = function updateConnectionAttempt(payload) {
    const timestamp = Math.floor((new Date(payload.timestamp)).getTime() / 1000);
    const {
        connectionId,
        accepted
    } = payload;
    const data = api.updateConnectionAttempt(connectionId, accepted, timestamp).encodeABI();

    return contractHelper.sendTransaction(data);
};

exports.getConnectionAttempt = async function getConnectionAttempt(connectionId) {
    const connectionAttempt = await api.getConnectionAttempt(connectionId).call();

    if (!connectionAttempt.isEntity) {
        return null;
    }

    const {
        created,
        updated
    } = connectionAttempt;

    connectionAttempt.created = helperMethods.timeStampToISOstring(created);
    connectionAttempt.updated = helperMethods.timeStampToISOstring(updated);

    return connectionAttempt;
};