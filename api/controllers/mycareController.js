const appRoot = require('app-root-path');
const moment = require('moment');
const mycareService = require(`${appRoot}/api/services/mycareService`);
const logger = require(`${appRoot}/config/winston`);
const {
    HTTP_STATUS
} = require(`${appRoot}/api/constants/Constants`);

exports.addAccount = async function (req, res) {
    try {
        const transactionReceipt = await mycareService.AddAccount(req.body);
        logger.info(transactionReceipt);

        return res.status(HTTP_STATUS.OK.CODE).json(transactionReceipt);
    } catch (err) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: err
        });
    }
};

exports.deactivateAccount = async function (req, res) {
    try {
        const {
            walletAddress,
            timestamp
        } = req.body;

        const transactionReceipt = await mycareService.DeactivateAccount(walletAddress, timestamp);

        return res.status(HTTP_STATUS.OK.CODE).json(transactionReceipt);
    } catch (err) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: err
        });
    }
};

exports.getAccount = async function (req, res) {
    try {
        const {
            walletAddress,
            profileHash
        } = req.query;

        if (!walletAddress && !profileHash) {
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'Invalid query parameters, one of walletAddress and profileHash is required'
            });
        }

        const param = walletAddress || profileHash;

        const account = await mycareService.GetAccount(param, !!walletAddress);

        if (!account) {
            return res.status(HTTP_STATUS.NOT_FOUND.CODE).json({
                message: 'Account not found'
            });
        }

        return res.status(HTTP_STATUS.OK.CODE).json(account);
    } catch (err) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: err
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
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: err
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
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: err
        });
    }
};
