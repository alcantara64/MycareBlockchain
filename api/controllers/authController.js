const appRoot = require('app-root-path');
const logger = require(`${appRoot}/config/winston`);
const clientService = require(`${appRoot}/api/services/clientService`);
const jwt = require('jsonwebtoken');

const {
    HTTP_STATUS
} = require(`${appRoot}/api/constants/Common`);

exports.getAccessToken = async function (req, res) {
    try {
        const {
            clientId,
            clientSecret
        } = req.body;

        if (!clientId || !clientSecret) {
            const message = 'clientId and clientSecret are required parammeters';

            logger.error(message);
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message
            });
        }

        const client = await clientService.getOne({
            clientId,
            clientSecret
        });

        if (!client) {
            const message = 'client not found';
            logger.error(message);

            return res.status(HTTP_STATUS.NOT_FOUND.CODE).json({
                message
            });
        }

        const now = Math.floor(Date.now() / 1000); 
        const hours = 2 * 60 * 60; // 2hrs in seconds
        const expiration = now + hours;

        const payload = {
            // create token
            access_token: jwt.sign({
                sub: client._id,
                email: client.email,
                exp: expiration
            }, process.env.JWT_TOKEN)
        };

        return res.status(HTTP_STATUS.OK.CODE).json(payload);
    } catch (err) {
        logger.error(`error ocured generating access token ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};