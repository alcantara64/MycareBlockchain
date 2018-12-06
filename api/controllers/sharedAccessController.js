const appRoot = require('app-root-path');
const moment = require('moment');
const sharedAccessService = require(`${appRoot}/api/services/sharedAccessService`);
const logger = require(`${appRoot}/config/winston`);
const validators = require(`${appRoot}/api/shared/validators`);

const {
    HTTP_STATUS
} = require(`${appRoot}/api/constants/Constants`);

exports.addConsent = async function (req, res) {
    try {
        logger.info('Save consent');
        const transactionReceipt = await sharedAccessService.addConsent(req.body);

        logger.debug(transactionReceipt);

        return res.status(HTTP_STATUS.OK.CODE).json(transactionReceipt);
    } catch (err) {
        logger.error(`error occured while saving consent - ${err}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.revokeConsent = async function (req, res) {
    try {
        logger.info('Revoke consent');

        const transactionReceipt = await sharedAccessService.revokeConsent(req.body);
        logger.debug(transactionReceipt);

        return res.status(HTTP_STATUS.OK.CODE).json(transactionReceipt);
    } catch (err) {
        logger.error(`error occured while revoking consent - ${err}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.consentIsRevoked = async function (req, res) {
    try {
        logger.info('Check if consent is revoked');

        const {
            consentId
        } = req.params;

        if (!consentId) {
            logger.error('consentId is a required parameter');
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'consentId is a required parameter'
            });
        }

        const consentStatus = await sharedAccessService.getConsent(consentId);

        if (!consentStatus) {
            logger.error(`Consent not found for id - ${consentId}`);

            return res.status(HTTP_STATUS.NOT_FOUND.CODE).json({
                message: 'Consent not found'
            });
        }

        return res.status(HTTP_STATUS.OK.CODE).json(consentStatus);
    } catch (err) {
        logger.error(`error occured while checking if consent is revoked - ${err}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.getConsent = async function (req, res) {
    try {
        logger.info('Get consent');

        const {
            consentId
        } = req.params;

        if (!consentId) {
            logger.error('consentId is a required parameter');

            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'consentId is a required parameter'
            });
        }
        const consent = await sharedAccessService.getConsent(consentId);

        if (!consent) {
            logger.error(`Consent not found for id - ${consentId}`);

            return res.status(HTTP_STATUS.NOT_FOUND.CODE).json({
                message: 'Consent not found'
            });
        }

        return res.status(HTTP_STATUS.OK.CODE).json(consent);
    } catch (err) {
        logger.error(`error occured while fetching consent - ${err}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.saveConnectionAttempt = async function (req, res) {
    try {
        logger.info('Save connection attempt');

        const transactionReceipt = await sharedAccessService.addConnectionAttempt(req.body);
        logger.debug(transactionReceipt);

        return res.status(HTTP_STATUS.OK.CODE).json(transactionReceipt);
    } catch (err) {
        logger.error(`error occured while saving connection attempt - ${err}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.updateConnectionAttempt = async function (req, res) {
    try {
        logger.info('Update connection attempt');

        const transactionReceipt = await sharedAccessService.updateConnectionAttempt(req.body);
        logger.debug(transactionReceipt);

        return res.status(HTTP_STATUS.OK.CODE).json(transactionReceipt);
    } catch (err) {
        logger.error(`error occured while updating connection attempt - ${err}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.getConnectionAttempt = async function (req, res) {
    try {
        logger.info('Get connection attempt');

        const {
            connectionId
        } = req.params;

        if (!connectionId) {
            logger.error('connectionId is a required parameter');

            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'connectionId is a required parameter'
            });
        }

        const connectionAttempt = await sharedAccessService.getConnectionAttempt(connectionId);

        if (!connectionAttempt) {
            logger.error(`Connection attempt not found for connectionId - ${connectionId}`);

            return res.status(HTTP_STATUS.NOT_FOUND.CODE).json({
                message: 'Connection attempt not found'
            });
        }

        return res.status(HTTP_STATUS.OK.CODE).json(connectionAttempt);
    } catch (err) {
        logger.error(`error occured while fetching connection attempt - ${err}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

// validators
exports.validateAddConsentParams = function (req, res, next) {
    try {
        const payload = req.body;
        const requiredFields = ['timestamp', 'scope', 'dataSource', 'startDate', 'endDate', 'consentId', 'connectionId'];

        const result = validators.validateRequiredParams(payload, requiredFields);

        if (result.missingParam) {
            logger.error(result.message);

            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: result.message
            });
        }

        const timestampIsValid = moment(payload.timestamp, moment.ISO_8601, true).isValid();
        if (!timestampIsValid) {
            logger.error('timestamp is not valid ISO8601 string');
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'timestamp is not valid ISO8601 string'
            });
        }
        next();
    } catch (err) {
        logger.error(err);

        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.validateRevokeConsentParams = function (req, res, next) {
    try {
        const payload = req.body;
        const requiredFields = ['timestamp', 'consentId'];

        const result = validators.validateRequiredParams(payload, requiredFields);

        if (result.missingParam) {
            logger.error(result.message);

            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: result.message
            });
        }

        const timestampIsValid = moment(payload.timestamp, moment.ISO_8601, true).isValid();
        if (!timestampIsValid) {
            logger.error('timestamp is not valid ISO8601 string');

            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'timestamp is not valid ISO8601 string'
            });
        }
        next();
    } catch (err) {
        logger.error(err);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.validateUpdateConnectionPayload = function (req, res, next) {
    try {
        const payload = req.body;
        const requiredFields = ['accepted', 'timestamp', 'connectionId'];

        const result = validators.validateRequiredParams(payload, requiredFields);

        if (result.missingParam) {
            logger.error(result.message);

            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: result.message
            });
        }

        const timestampIsValid = moment(payload.timestamp, moment.ISO_8601, true).isValid();
        if (!timestampIsValid) {
            logger.error('timestamp is not valid ISO8601 string');

            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'timestamp is not valid ISO8601 string'
            });
        }
        next();
    } catch (err) {
        logger.error(err);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.validateSaveConnectionPayload = function (req, res, next) {
    try {
        const payload = req.body;
        const requiredFields = ['created', 'from', 'to', 'connectionId'];

        const result = validators.validateRequiredParams(payload, requiredFields);

        if (result.missingParam) {
            logger.error(result.message);

            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: result.message
            });
        }

        const timestampIsValid = moment(payload.created, moment.ISO_8601, true).isValid();
        if (!timestampIsValid) {
            logger.error('created is not valid ISO8601 string');

            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'created is not valid ISO8601 string'
            });
        }

        next();
    } catch (err) {
        logger.error(err);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};