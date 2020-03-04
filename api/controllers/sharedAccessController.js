const appRoot = require('app-root-path');
const moment = require('moment');
const sharedAccessService = require(`${appRoot}/api/services/sharedAccessService`);
const scopeConstants = require(`${appRoot}/api/constants/aggregateScopeConstants`);
const logger = require(`${appRoot}/config/winston`);
const validators = require(`${appRoot}/api/shared/validators`);

const {
    HTTP_STATUS
} = require(`${appRoot}/api/constants/Common`);

exports.addConsent = async function (req, res) {
    try {
        logger.info('Save consent');
        const transactionReceipt = await sharedAccessService.addConsent(req.body);

        logger.debug(transactionReceipt);

        return res.status(HTTP_STATUS.OK.CODE).json(transactionReceipt);
    } catch (err) {
        logger.error(`error occured while saving consent - ${err.message}`);
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
        logger.error(`error occured while revoking consent - ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.canAccess = async function (req, res) {
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

        const hasAccess = await sharedAccessService.canAccess(consentId);

        return res.status(HTTP_STATUS.OK.CODE).json({ canAccess: hasAccess });
    } catch (err) {
        logger.error(`error occured while verifying access - ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.getConsent = async function (req, res) {
    try {
        logger.info('Get consent');

        const {
            consentId,
            scope
        } = req.query;

        const consent = await sharedAccessService.getConsent(consentId, scope);

        if (!consent) {
            logger.error(`Consent not found for id - ${consentId}`);

            return res.status(HTTP_STATUS.NOT_FOUND.CODE).json({
                message: 'Consent not found'
            });
        }

        return res.status(HTTP_STATUS.OK.CODE).json(consent);
    } catch (err) {
        logger.error(`error occured while fetching consent - ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.saveConnection = async function (req, res) {
    try {
        logger.info('Save connection ');

        const transactionReceipt = await sharedAccessService.addConnection(req.body);
        logger.debug(transactionReceipt);

        return res.status(HTTP_STATUS.OK.CODE).json(transactionReceipt);
    } catch (err) {
        logger.error(`error occured while saving connection - ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.updateConnection = async function (req, res) {
    try {
        logger.info('Update connection');

        const transactionReceipt = await sharedAccessService.updateConnection(req.body);
        logger.debug(transactionReceipt);

        return res.status(HTTP_STATUS.OK.CODE).json(transactionReceipt);
    } catch (err) {
        logger.error(`error occured while updating connection - ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.getConnection = async function (req, res) {
    try {
        logger.info('Get connection ');

        const {
            connectionId
        } = req.params;

        if (!connectionId) {
            logger.error('connectionId is a required parameter');

            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'connectionId is a required parameter'
            });
        }

        const connection = await sharedAccessService.getConnection(connectionId);

        if (!connection) {
            logger.error(`Connection not found for connectionId - ${connectionId}`);

            return res.status(HTTP_STATUS.NOT_FOUND.CODE).json({
                message: 'Connection not found'
            });
        }

        return res.status(HTTP_STATUS.OK.CODE).json(connection);
    } catch (err) {
        logger.error(`error occured while fetching connection  - ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

/**
 * Check if given scopes are among the know list of scopes
 * @param {Array<String>} scope array of scopes
 */
function invalidScope(scope) {
    let invalidScopeName = '';
    if (scope.length < 1) {
        return true;
    }

    const knownScopes = Object.keys(scopeConstants);
    // for (const val of scope) {
    for (let i = 0; i < scope.length; i += 1) {
        const value = scope[i];
        if (!knownScopes.includes(value)) {
            invalidScopeName = value;
            break;
        }
    }

    return invalidScopeName;
}

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

        if (!payload.dataSource.length) {
            logger.error('No datasource was specified');

            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'No datasource was specified'
            });
        }

        const { scope } = payload;
        const invalidScopeValue = invalidScope(scope);
        const emptyScope = scope.length < 1;

        if (emptyScope || invalidScopeValue) {
            const message = emptyScope ? 'no scope was sent' : `scope ${invalidScopeValue} is invalid`;
            logger.error(`validateAddConsentParams - ${message}`);

            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message
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
        logger.error(`error occured during validation - ${err.message}`);

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
        logger.error(`error occured during validation - ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.validateUpdateConnectionPayload = function (req, res, next) {
    try {
        const payload = req.body;
        const requiredFields = ['timestamp', 'deleted', 'connectionId'];

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
        logger.error(`error occured during validation - ${err.message}`);
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
        logger.error(`error occured during validation - ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.validateGetConsentParams = function (req, res, next) {
    try {
        const payload = req.query;
        const requiredFields = ['consentId', 'scope'];

        const result = validators.validateRequiredParams(payload, requiredFields);

        if (result.missingParam) {
            logger.error(result.message);

            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: result.message
            });
        }

        payload.scope = JSON.parse(payload.scope);

        if (!payload.scope.length) {
            logger.error('No scope was specified');

            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'No scope was specified'
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