const appRoot = require('app-root-path');
const moment = require('moment');
const policiesAndTermsService = require(`${appRoot}/api/services/policiesAndTermsService`);
const logger = require(`${appRoot}/config/winston`);
const validators = require(`${appRoot}/api/shared/validators`);

const {
    HTTP_STATUS
} = require(`${appRoot}/api/constants/Common`);

// validators

exports.addNewDocument = async function (req, res) {
    try {
        logger.info('Adding new document');
        const transactionReceipt = await policiesAndTermsService.addNewDocument(req.body);

        logger.debug(transactionReceipt);

        return res.status(HTTP_STATUS.OK.CODE).json(transactionReceipt);
    } catch (err) {
        logger.error(`error occured while adding new document - ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.saveAcceptance = async function (req, res) {
    try {
        logger.info('Saving acceptance');
        const transactionReceipt = await policiesAndTermsService.saveAcceptance(req.body);

        logger.debug(transactionReceipt);

        return res.status(HTTP_STATUS.OK.CODE).json(transactionReceipt);
    } catch (err) {
        logger.error(`error occured while saving acceptance - ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.getDocument = async function (req, res) {
    try {
        const {
            documentHash
        } = req.params;

        logger.info('Get document');

        if (!documentHash) {
            logger.error('documentHash is a required parameter');

            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: 'documentHash is a required parameter'
            });
        }
        const document = await policiesAndTermsService.getDocument(documentHash);

        if (!document) {
            logger.error(`document not found for hash ${documentHash}`);

            return res.status(HTTP_STATUS.NOT_FOUND.CODE).json({
                message: 'document not found'
            });
        }

        return res.status(HTTP_STATUS.OK.CODE).json(document);
    } catch (err) {
        logger.error(`error occured while getting document - ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.getUserAcceptance = async function (req, res) {
    try {
        const {
            walletAddress,
            documentHash
        } = req.query;

        logger.info('Get User Acceptance');

        if (!documentHash || !walletAddress) {
            const missingParam = !documentHash ? 'documentHash' : 'walletAddress';

            logger.error(`${missingParam} is a required parameter`);

            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: `${missingParam} is a required parameter`
            });
        }
        const acceptance = await policiesAndTermsService.getUserAcceptance(walletAddress, documentHash);

        if (!acceptance) {
            logger.error(`acceptance record not found for walletAddress - ${walletAddress} and documentHash - ${documentHash}`);

            return res.status(HTTP_STATUS.NOT_FOUND.CODE).json({
                message: 'acceptance record not found'
            });
        }

        return res.status(HTTP_STATUS.OK.CODE).json(acceptance);
    } catch (err) {
        logger.error(`error occured while getting user acceptance - ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.validateAcceptancePayload = function (req, res, next) {
    try {
        const payload = req.body;
        const requiredFields = ['walletAddress', 'timestamp', 'documentHash'];

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

exports.validateAddDocumentPayload = function (req, res, next) {
    try {
        const payload = req.body;
        const requiredFields = ['ipfsHash'];

        const result = validators.validateRequiredParams(payload, requiredFields);

        if (result.missingParam) {
            logger.error(result.message);
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message: result.message
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