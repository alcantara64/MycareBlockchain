const appRoot = require('app-root-path');
const logger = require(`${appRoot}/config/winston`);
const web3 = require('web3');
const scopeConstants = require('../constants/ScopeConstants');

const {
    contractNames,
    ContractHelper
} = require(`${appRoot}/api/helpers/contractHelper`);

const contractHelper = new ContractHelper(contractNames.MYCARE);
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
    const startDate = Math.floor(consent.startDate.getTime() / 1000);
    const endDate = Math.floor(consent.endDate.getTime() / 1000);
    const timestamp = Math.floor(consent.timeStamp.getTime() / 1000);

    return SHARED_ACCESS.methods.addConsent(
            consent._id.toString(),
            timestamp,
            scope,
            dataSource,
            startDate,
            endDate,
            consent.connectionId,
        )
        .estimateGas()
        .then((estimatedGas) => {
            return SHARED_ACCESS.methods.addConsent(
                consent._id.toString(),
                timestamp,
                scope,
                dataSource,
                startDate,
                endDate,
                consent.connectionId,
            ).send({
                from: ACCOUNT_BASE,
                gas: estimatedGas,
            }, (err, result) => {
                if (err) {
                    logger.error(`Failed to save consent to blockchain ${err}`);
                } else {
                    logger.info(`Saved Consent to Blockchain successfully ${result}`);
                }
            });
        });
};

exports.getConsent = function getConsent(consentId) {
    return SHARED_ACCESS.methods.getConsent(consentId).call();
};

exports.addDays = function addDays(startDate, numberOfDays) {
    const returnDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate() + numberOfDays,
        startDate.getHours(),
        startDate.getMinutes(),
        startDate.getSeconds(),
    );
    return returnDate;
};

exports.addConnectionAttempt = function addConnectionAttempt(connection) {
    const timestamp = Math.floor((new Date(connection.timestamp)).getTime() / 1000);
    const data = api.addConnectionAttempt(
        connection._id.toString(),
        connection.from,
        connection.to,
        timestamp
    ).encodeABI();

    return contractHelper.sendTransaction(data);
};

exports.updateConnectionAttempt = function updateConnectionAttempt(payload) {
    const timestamp = Math.floor((new Date(payload.timestamp)).getTime() / 1000);
    const { connectionId, accepted } = payload;
    const data = api.updateConnectionAttempt(connectionId, accepted, timestamp).encodeABI();

    return contractHelper.sendTransaction(data);
};

exports.getConnectionAttempt = function getConnectionAttempt(connectionId) {
    return api.getConnectionAttempt(connectionId);
};

exports.revokeConsent = function revokeConsent(consentId, timestamp) {
    return SHARED_ACCESS.methods.revokeConsent(consentId, timestamp)
        .estimateGas()
        .then((estimatedGas) => {
            return SHARED_ACCESS.methods.revokeConsent(consentId, timestamp)
                .send({
                    from: ACCOUNT_BASE,
                    gas: estimatedGas,
                }, (err, result) => {
                    if (err) {
                        logger.error(`Failed to revoke Consent ${err}`);
                    } else {
                        logger.info(`Revoked consent Successfully: ${result}`);
                    }
                });
        });
};

exports.consentIsRevoked = function consentIsRevoked(consentId) {
    return SHARED_ACCESS.methods.consentIsRevoked(consentId);
};