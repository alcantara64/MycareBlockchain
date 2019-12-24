const appRoot = require('app-root-path');
const web3 = require('web3');
const scopeConstants = require('../constants/aggregateScopeConstants');
const helperMethods = require(`${appRoot}/api/helpers/helperMethods`);
const BigInt = require('big-integer');
const { GAS_LIMIT } = require(`${appRoot}/api/constants/transactionConstants`);
const {
    contractNames,
    ContractHelper
} = require(`${appRoot}/api/helpers/contractHelper`);

const contractHelper = new ContractHelper(contractNames.SHARED_ACCESS);
const api = contractHelper.contractMethods();

exports.integersToBytes = function (integersList) {
    const bigIntsArray = integersList.map(x => BigInt(x));

    const scope = bigIntsArray.reduce((x, y) => x.or(y));

    const hex = `0X${scope.toString(16)}`;

    return web3.utils.padLeft(hex, 32);
};

/**
 * Checks if scope contains integer
* @param scope {string} scope hexadecimal string
* @param intVal {number} intVal integer
*/
exports.scopeContainsInteger = function (scope, intVal) {
    const scopeInt = BigInt(scope.slice(2), 16);

    const bigintVal = BigInt(intVal);

    const result = scopeInt.and(bigintVal);

    return result.equals(bigintVal);
};

exports.addConsent = function addConsent(consent) {
    const scopeIntegers = consent.scope.map(x => scopeConstants[x]);

    const scope = this.integersToBytes(scopeIntegers);

    const startDate = helperMethods.ISOstringToTimestamp(consent.startDate);
    const endDate = helperMethods.ISOstringToTimestamp(consent.endDate);
    const timestamp = helperMethods.ISOstringToTimestamp(consent.timestamp);

    const data = api.addConsent(
        consent.consentId,
        timestamp,
        scope,
        consent.dataSource,
        startDate,
        endDate,
        consent.connectionId
    ).encodeABI();

    const metaData = {
        parameters: {
            consentId: consent.consentId,
            scope,
            startDate,
            dataSource: consent.dataSource,
            endDate,
            timestamp,
            connectionId: consent.connectionId
        },
        methodName: `${contractNames.SHARED_ACCESS}.addConsent`
    };

    return contractHelper.sendTransaction(data, GAS_LIMIT.SHARED_ACCESS.ADD_CONSENT, metaData);
};

exports.revokeConsent = function revokeConsent(payload) {
    const { consentId } = payload;

    const timestamp = helperMethods.ISOstringToTimestamp(payload.timestamp);

    const data = api.revokeConsent(consentId, timestamp).encodeABI();

    const metaData = {
        parameters: {
            consentId,
            timestamp
        },
        methodName: `${contractNames.SHARED_ACCESS}.revokeConsent`
    };
    return contractHelper.sendTransaction(data, GAS_LIMIT.SHARED_ACCESS.REVOKE_CONSENT, metaData);
};

exports.canAccess = function (consentId) {
    return api.canAccess(consentId).call();
};

exports.getConsent = async function getConsent(consentId, scopeArray) {
    const consent = await api.getConsent(consentId).call();

    if (!consent.isEntity) {
        return null;
    }

    const {
        startDate,
        endDate,
        created,
        updated,
        scope
    } = consent;

    const savedScope = scopeArray.filter(scopeStr => {
        return this.scopeContainsInteger(scope, scopeConstants[scopeStr]);
    });

    consent.startDate = helperMethods.timeStampToISOstring(startDate);
    consent.endDate = helperMethods.timeStampToISOstring(endDate);
    consent.created = helperMethods.timeStampToISOstring(created);
    consent.updated = helperMethods.timeStampToISOstring(updated);
    consent.scope = savedScope;

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

    const metaData = {
        parameters: {
            connectionId: connection.connectionId,
            timestamp,
            from: connection.from,
            to: connection.to
        },
        methodName: `${contractNames.SHARED_ACCESS}.addConnectionAttempt`
    };

    return contractHelper.sendTransaction(data, GAS_LIMIT.SHARED_ACCESS.ADD_CONNECTION_ATTEMPT, metaData);
};

exports.updateConnectionAttempt = function updateConnectionAttempt(payload) {
    const timestamp = Math.floor((new Date(payload.timestamp)).getTime() / 1000);
    const {
        connectionId,
        accepted
    } = payload;
    const data = api.updateConnectionAttempt(connectionId, accepted, timestamp).encodeABI();

    const metaData = {
        parameters: {
            connectionId,
            accepted,
            timestamp
        },
        methodName: `${contractNames.SHARED_ACCESS}.updateConnectionAttempt`
    };

    return contractHelper.sendTransaction(data, GAS_LIMIT.SHARED_ACCESS.UPDATE_CONNECTION_ATTEMPT, metaData);
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