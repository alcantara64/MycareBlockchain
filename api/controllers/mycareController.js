const appRoot = require('app-root-path');
const moment = require('moment');
const mycareService = require(`${appRoot}/api/services/mycareService`);
const logger = require(`${appRoot}/config/winston`);
const keyHelper = require(`${appRoot}/api/helpers/keyHelper`);

const {
    HTTP_STATUS
} = require(`${appRoot}/api/constants/Constants`);

exports.addAccount = async function (req, res) {
    try {
        logger.info('Add account');
        const transactionReceipt = await mycareService.AddAccount(req.body);
        logger.debug(transactionReceipt);

        return res.status(HTTP_STATUS.OK.CODE).json(transactionReceipt);
    } catch (err) {
        logger.error(`error occured while adding account - ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.deactivateAccount = async function (req, res) {
    try {
        const {
            walletAddress,
            timestamp
        } = req.body;

        logger.info('Deactivate account');

        const transactionReceipt = await mycareService.DeactivateAccount(walletAddress, timestamp);

        logger.debug(transactionReceipt);

        return res.status(HTTP_STATUS.OK.CODE).json(transactionReceipt);
    } catch (err) {
        logger.error(`error occured while deactivating account - ${err.message}`);

        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.getAccount = async function (req, res) {
    try {
        const {
            walletAddress,
            profileHash
        } = req.query;

        logger.info('Get Account');

        if (!walletAddress && !profileHash) {
            logger.error('Invalid query parameters, one of walletAddress and profileHash is required');

            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'Invalid query parameters, one of walletAddress and profileHash is required'
            });
        }

        const param = walletAddress || profileHash;

        const account = await mycareService.GetAccount(param, !!walletAddress);

        if (!account) {
            logger.error(`account not found for ${walletAddress ? 'walletAddress' : 'profileHash'} - ${param}`);

            return res.status(HTTP_STATUS.NOT_FOUND.CODE).json({
                message: 'Account not found'
            });
        }

        return res.status(HTTP_STATUS.OK.CODE).json(account);
    } catch (err) {
        logger.error(`error occured while getting account - ${err.message}`);

        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.getAccountsCount = async function (req, res) {
    try {
        const count = await mycareService.GetAccountCount();

        return res.status(HTTP_STATUS.OK.CODE).json({
            count
        });
    } catch (err) {
        logger.error(`error occured while getting accounts count - ${err.message}`);

        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.generateChainAccount = function (req, res) {
    try {
        logger.info('Generate ethereum account');

        const accountDetails = keyHelper.generateAddressAndPrivateKeyPair();

        return res.status(HTTP_STATUS.OK.CODE).json(accountDetails);
    } catch (err) {
        logger.error(`error occured generating ethereum account ${err.message}`);

        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

// validators

exports.validateDeactivateAccountParams = function (req, res, next) {
    const expectedParams = ['walletAddress', 'timestamp'];

    validateAccountParams(req, res, next, expectedParams);
};

exports.validateAddAccountParams = function (req, res, next) {
    const expectedParams = ['walletAddress', 'profileHash', 'timestamp'];

    validateAccountParams(req, res, next, expectedParams);
};

function validateAccountParams(req, res, next, expectedParams) {
    try {
        for (let i = 0; i < expectedParams.length; i++) {
            const param = expectedParams[i];

            if (!req.body[param]) {
                return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                    message: `${param} is a required parameter`
                });
            }
        }

        // validate timestamp is valid datetime string
        const timestampIsValid = moment(req.body.timestamp, moment.ISO_8601, true).isValid();
        if (!timestampIsValid) {
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'timestamp is not valid ISO8601 string'
            });
        }

        next();
    } catch (err) {
        logger.error(`error occured during validation - ${err.message}`);

        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};