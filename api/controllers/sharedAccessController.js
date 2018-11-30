const appRoot = require('app-root-path');
const moment = require('moment');
const sharedAccessService = require(`${appRoot}/api/services/sharedAccessService`);
const logger = require(`${appRoot}/config/winston`);
const validators = require(`${appRoot}/api/shared/validators`);

const {
    HTTP_STATUS
} = require(`${appRoot}/api/constants/Constants`);

exports.addConsent = async function(req, res) {
    try {
        const transactionReceipt = await sharedAccessService.addConsent(req.body);

        return res.status(HTTP_STATUS.OK.CODE).json(transactionReceipt);
    } catch (err) {
        logger.error(err);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({ message: err.message });
    }
};

exports.revokeConsent = async function(req, res) {
    try {
        const transactionReceipt = await sharedAccessService.revokeConsent(req.body);
        return res.status(HTTP_STATUS.OK.CODE).json(transactionReceipt);
    } catch (err) {
        logger.error(err);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: err.message
        });
    }
};

exports.consentIsRevoked = async function(req, res) {
    try {
        const { consentId } = req.params;

        if (!consentId) {
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'consentId is a required parameter'
            });
        }
        const consentStatus = await sharedAccessService.getConsent(consentId);

        if (!consentStatus) {
            return res.status(HTTP_STATUS.NOT_FOUND.CODE).json({
                message: 'Consent not found'
            });
        }

        return res.status(HTTP_STATUS.OK.CODE).json(consentStatus);
    } catch (err) {
        logger.error(err);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: err.message
        });
    }
};

exports.getConsent = async function (req, res) {
    try {
        const { consentId } = req.params;

        if (!consentId) {
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'consentId is a required parameter'
            });
        }
        const consent = await sharedAccessService.getConsent(consentId);

        if (!consent) {
            return res.status(HTTP_STATUS.NOT_FOUND.CODE).json({
                message: 'Consent not found'
            });
        }

        return res.status(HTTP_STATUS.OK.CODE).json(consent);
    } catch (err) {
        logger.error(err);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: err.message
        });
    }
};

exports.saveConnectionAttempt = async function (req, res) {
    try {
        const transactionReceipt = await sharedAccessService.addConnectionAttempt(req.body);
        return res.status(HTTP_STATUS.OK.CODE).json(transactionReceipt);
    } catch (err) {
        logger.error(err);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({ message: err.message });
    }
};

exports.updateConnectionAttempt = async function (req, res) {
    try {
        const transactionReceipt = await sharedAccessService.updateConnectionAttempt(req.body);
        return res.status(HTTP_STATUS.OK.CODE).json(transactionReceipt);
    } catch (err) {
        logger.error(err);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: err.message
        });
    }
};

exports.getConnectionAttempt = async function (req, res) {
    try {
        const { connectionId } = req.params;

        if (!connectionId) {
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'connectionId is a required parameter'
            });
        }
        const connectionAttempt = await sharedAccessService.getConnectionAttempt(connectionId);

        if (!connectionAttempt) {
            return res.status(HTTP_STATUS.NOT_FOUND.CODE).json({
                message: 'Connection attempt not found'
            });
        }

        return res.status(HTTP_STATUS.OK.CODE).json(connectionAttempt);
    } catch (err) {
        logger.error(err);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: err.message
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
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: result.message
            });
        }

        const timestampIsValid = moment(payload.timestamp, moment.ISO_8601, true).isValid();
        if (!timestampIsValid) {
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'timestamp is not valid ISO8601 string'
            });
        }
        next();
    } catch (err) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: err.message
        });
    }
};

exports.validateRevokeConsentParams = function (req, res, next) {
    try {
        const payload = req.body;
        const requiredFields = ['timestamp', 'consentId'];

        const result = validators.validateRequiredParams(payload, requiredFields);

        if (result.missingParam) {
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: result.message
            });
        }

        const timestampIsValid = moment(payload.timestamp, moment.ISO_8601, true).isValid();
        if (!timestampIsValid) {
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'timestamp is not valid ISO8601 string'
            });
        }
        next();
    } catch (err) {
        logger.error(err);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: err.message
        });
    }
};

exports.validateUpdateConnectionPayload = function (req, res, next) {
    try {
        const payload = req.body;
        const requiredFields = ['accepted', 'timestamp', 'connectionId'];

        const result = validators.validateRequiredParams(payload, requiredFields);

        if (result.missingParam) {
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: result.message
            });
        }

        const timestampIsValid = moment(payload.timestamp, moment.ISO_8601, true).isValid();
        if (!timestampIsValid) {
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'timestamp is not valid ISO8601 string'
            });
        }
        next();
    } catch (err) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: err.message
        });
    }
};

exports.validateSaveConnectionPayload = function (req, res, next) {
    try {
        const payload = req.body;
        const requiredFields = ['created', 'from', 'to', 'connectionId'];

        const result = validators.validateRequiredParams(payload, requiredFields);

        if (result.missingParam) {
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: result.message
            });
        }

        const timestampIsValid = moment(payload.created, moment.ISO_8601, true).isValid();
        if (!timestampIsValid) {
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'created is not valid ISO8601 string'
            });
        }

        next();
    } catch (err) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: err.message
        });
    }
};