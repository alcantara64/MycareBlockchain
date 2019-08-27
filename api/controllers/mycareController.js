const appRoot = require('app-root-path');
const moment = require('moment');
const mycareService = require(`${appRoot}/api/services/mycareService`);
const logger = require(`${appRoot}/config/winston`);
const keyHelper = require(`${appRoot}/api/helpers/keyHelper`);

const {
    HTTP_STATUS
} = require(`${appRoot}/api/constants/Common`);

exports.addAccount = async function (req, res) {
    const methodName = 'mycareController.addAccount';
    try {
        logger.info(`${methodName}`, { userId: req.user._id.toString() });

        const accountTypeIsValid = await mycareService.AccountTypeExists(req.body.accountType);
        if (!accountTypeIsValid) {
            logger.error(`${methodName} - invalid account type`, { userId: req.user._id.toString() });
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'invalid account type'
            });
        }

        const transactionReceipt = await mycareService.AddAccount(req.body);
        logger.info(`${methodName} - successful`, { userId: req.user._id.toString() });
        logger.debug(transactionReceipt);

        return res.status(HTTP_STATUS.OK.CODE).json(transactionReceipt);
    } catch (err) {
        logger.error(`${methodName} - error occured while adding account - ${err.message}`, { userId: req.user._id.toString() });
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.addAccountType = async function (req, res) {
    const methodName = 'mycareController.addAccountType';
    try {
        const { accountType } = req.body;
        if (!accountType) {
            logger.error(`${methodName} - accountType is missing`, { userId: req.user._id.toString() });
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'accountType is required'
            });
        }

        const accountTypeIsString = (typeof accountType) === 'string' && isNaN(accountType);
        if (!accountTypeIsString) {
            logger.error(`${methodName} - accountType "${accountType}" is not a valid string`, { userId: req.user._id.toString() });
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'accountType must be a valid string'
            });
        }

        const accountTypeLengthisValid = req.body.accountType.length > 2 && req.body.accountType.length <= 16;
        if (!accountTypeLengthisValid) {
            logger.error(`${methodName} - accountType "${accountType}" must be string with length greater than 2 and less than 16`, { userId: req.user._id.toString() });
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'accountType must be string with length greater than 2 and less than or equal to 16'
            });
        }

        const accountTypeExists = await mycareService.AccountTypeExists(req.body.accountType);
        if (accountTypeExists) {
            logger.error(`${methodName} - accountType ${req.body.accountType} already exists`, { userId: req.user._id.toString() });
            return res.status(HTTP_STATUS.CONFLICT.CODE).json({
                message: 'accountType already exists'
            });
        }

        const transactionReceipt = await mycareService.AddAccountType(req.body.accountType);

        logger.error(`${methodName} - accountType was added successfully`, { userId: req.user._id.toString() });
        return res.status(HTTP_STATUS.OK.CODE).json(transactionReceipt);
    } catch (err) {
        logger.error(`error occured while adding account type - ${err.message}`, { userId: req.user._id.toString() });
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
    const methodName = 'mycareController.methodName';
    try {
        logger.info(`${methodName}`, { userId: req.user._id.toString() });

        const accountDetails = keyHelper.generateAddressAndPrivateKeyPair();
        logger.debug(`${methodName} - successful. accountDetails: ${JSON.stringify(accountDetails)}`,
            { userId: req.user._id.toString() });

        return res.status(HTTP_STATUS.OK.CODE).json(accountDetails);
    } catch (err) {
        logger.error(`${methodName} - error occured generating ethereum account ${err.message}`,
            { userId: req.user._id.toString() });

        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

// validators

exports.validateDeactivateAccountParams = function (req, res, next) {
    const expectedParams = ['walletAddress', 'timestamp'];

    exports.validateAccountParams(req, res, next, expectedParams);
};

exports.validateAddAccountParams = function (req, res, next) {
    const expectedParams = ['walletAddress', 'profileHash', 'timestamp', 'accountType'];

    exports.validateAccountParams(req, res, next, expectedParams);
};

exports.validateAccountParams = function validateAccountParams(req, res, next, expectedParams) {
    const methodName = 'mycareController.validateAccountParams';
    try {
        logger.info(methodName, { userId: req.user._id.toString() });
        for (let i = 0; i < expectedParams.length; i++) {
            const param = expectedParams[i];

            if (!req.body[param]) {
                logger.error(`${methodName} - ${req.body[param]} is missing`, { userId: req.user._id.toString() });
                return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                    message: `${param} is a required parameter`
                });
            }
        }

        // validate timestamp is valid datetime string
        const timestampIsValid = moment(req.body.timestamp, moment.ISO_8601, true).isValid();
        if (!timestampIsValid) {
            logger.error(`${methodName} - timestamp: "{req.body.timestamp}" timestamp is not valid ISO8601 string`,
                { userId: req.user._id.toString() });

            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'timestamp is not valid ISO8601 string'
            });
        }

        next();
    } catch (err) {
        logger.error(`${methodName} - error occured during validation - ${err.message}`, { userId: req.user._id.toString() });

        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};