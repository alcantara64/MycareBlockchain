const appRoot = require('app-root-path');
const moment = require('moment');
const sharedAccessService = require(`${appRoot}/api/services/sharedAccessService`);
const logger = require(`${appRoot}/config/winston`);
const validators = require(`${appRoot}/api/shared/validators`);
const {
    HTTP_STATUS
} = require(`${appRoot}/api/constants/Constants`);

exports.saveConnectionAttempt = async function (req, res) {
    try {
        const transactionReceipt = await sharedAccessService.addConnectionAttempt(req.body);
        return res.status(HTTP_STATUS.OK.CODE).json(transactionReceipt);
    } catch (err) {
        logger.error(err);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: err
        });
    }
};

exports.updateConnectionAttempt = async function (req, res) {
    try {
        const transactionReceipt = await sharedAccessService.updateConnectionAttempt(req.body);
        return res.status(HTTP_STATUS.OK.CODE).json(transactionReceipt);
    } catch (err) {
        logger.error(err);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: err
        });
    }
};

exports.getConnectionAttempt = async function (req, res) {
    try {
        const connectionId = req.params;

        if (!connectionId) {
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'connectionId is a required parameter'
            });
        }
        const connectionAttempt = await sharedAccessService.getConnectionAttempt(req);

        return res.status(HTTP_STATUS.OK.CODE).json(connectionAttempt);
    } catch (err) {
        logger.error(err);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: err
        });
    }
};

// validators
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
            message: err
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

        const timestampIsValid = moment(payload.timestamp, moment.ISO_8601, true).isValid();
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