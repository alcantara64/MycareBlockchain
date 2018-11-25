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

exports.validateAddAccountParams = function (req, res, next) {
    try {
        const expectedParams = ['walletAddress', 'profileHash', 'timestamp'];

        for (let i = 0; i < expectedParams.length; i++) {
            const param = expectedParams[i];

            if (!req.body[param]) {
                return res.status(HTTP_STATUS.OK.CODE).json({
                    message: `${param} is a required parameter`
                });
            }
        }

        // validate timestamp is valida datetime string
        const timestampIsValid = moment(req.body.timestamp, moment.ISO_8601, true).isValid();
        if (!timestampIsValid) {
            return res.status(HTTP_STATUS.OK.CODE).json({
                message: 'timestamp is not valid ISO8601 string'
            });
        }

        next();
    } catch (err) {
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR
        });
    }
};
