const appRoot = require('app-root-path');
const crypto = require('crypto');
const logger = require(`${appRoot}/config/winston`);
const clientService = require(`${appRoot}/api/services/clientService`);
const requestHelper = require(`${appRoot}/api/helpers/requestHelper`);
const { ROLES } = require(`${appRoot}/api/constants/authConstants`);
const emailHelper = require(`${appRoot}/api/helpers/emailHelper`);
const {
    TOKEN_TYPE,
    TOKEN_EXPIRATION_TIME
} = require(`${appRoot}/api/constants/authConstants`);
const jwt = require('jsonwebtoken');

const {
    HTTP_STATUS
} = require(`${appRoot}/api/constants/Common`);

const envHelper = require(`${appRoot}/api/helpers/envHelper`);

const envConstants = envHelper.getConstants();

exports.getAccessToken = async function (req, res) {
    try {
        const {
            clientId,
            clientSecret
        } = req.body;

        if (!clientId || !clientSecret) {
            const message = !clientId ? 'clientId is required'
                : 'clientSecret is required';

            logger.error(message);
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message
            });
        }

        logger.info(`get access token for client: ${clientId}`);

        const client = await clientService.getOne({
            clientId,
            clientSecret
        });

        if (!client) {
            logger.error(`client not found for id: ${clientId}`);

            return res.status(HTTP_STATUS.FORBIDDEN.CODE).json({
                message: 'client not found'
            });
        }

        const now = Math.floor(Date.now() / 1000);
        const expiration = now + TOKEN_EXPIRATION_TIME;

        const payload = {
            // create token
            access_token: jwt.sign({
                sub: client._id,
                email: client.email,
                tokenType: TOKEN_TYPE.CLIENT,
                exp: expiration
            }, envConstants.JWT_TOKEN)
        };

        return res.status(HTTP_STATUS.OK.CODE).json(payload);
    } catch (err) {
        logger.error(`error ocured generating access token for client: ${req.body.clientId}. MSG: ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.validateToken = function (req, res) {
    logger.info(`validate access token for client: ${req.user._id}`);
    return res.status(HTTP_STATUS.OK.CODE).json({
        message: 'Token is valid'
    });
};

exports.deleteClient = async function (req, res) {
    try {
        logger.info(`Delete client request by user: ${req.user._id}.  client: ${req.params.id}`);

        await clientService.delete(req.params.id);

        return res.status(HTTP_STATUS.OK.CODE).json({
            message: 'deleted client successful'
        });
    } catch (err) {
        logger.error(`error ocured deleting client with id ${req.params.id} ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

function sendClientCredentials(appName, clientId, clientSecret, email) {
    return emailHelper.sendMail(email, 'myCareAI :: Blockchain-api credentials', 'clientCredentials', {
        appName,
        clientId,
        clientSecret
    });
}

exports.newClient = async function (req, res) {
    try {
        logger.info(`create new client, request by user: ${req.user._id}`);

        const {
            email,
            name
        } = req.body;

        if (!email || !name) {
            const message = '"name" and "email" are required';

            logger.error(message);
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message
            });
        }

        const existingClient = await clientService.getOne({
            name
        });

        if (existingClient) {
            const message = 'client with this name exists';

            logger.error(message);
            return res.status(HTTP_STATUS.CONFLICT.CODE).json({
                message
            });
        }

        const client = {
            name,
            email,
            clientId: crypto.randomBytes(80).toString('hex'),
            clientSecret: crypto.randomBytes(80).toString('hex'),
            role: [ROLES.CLIENT]
        };

        const newClient = await clientService.create(client);

        sendClientCredentials(client.name, client.clientId, client.clientSecret, client.email);

        return res.status(HTTP_STATUS.OK.CODE).json(newClient);
    } catch (err) {
        logger.error(`error occured creating new client by user: ${req.user._id}. MSG: ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.getClientById = async function (req, res) {
    try {
        const {
            id
        } = req.params;

        if (!id) {
            const message = '"id" is required';

            logger.error(message);
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message
            });
        }

        logger.info(`getClientById request by user: ${req.user._id} clientId ${id}`);

        const client = await clientService.getOne({
            _id: id
        });

        if (!client) {
            const message = `client not found for id: ${id}`;

            return res.status(HTTP_STATUS.NOT_FOUND.CODE).json({
                message
            });
        }

        return res.status(HTTP_STATUS.OK.CODE).json(client);
    } catch (err) {
        logger.error(`getClientById call by user: ${req.user._id} failed. clientId: ${req.params.id} ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    };
};

exports.updateClient = async function (req, res) {
    try {
        logger.info(`updateClient request by user: ${req.user._id}. client: ${req.params.id}`);

        const disallowedFields = ['_id', 'clientId', 'clientSecret'];
        const updateFields = Object.keys(req.body);

        if (!updateFields.length) {
            let message = 'no update data found';
            logger.error(message);
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message
            });
        }

        for (let i = 0; i < updateFields.length; i++) {
            const field = updateFields[i];
            if (disallowedFields.includes(field)) {
                let message = `cannot update ${field}`;
                logger.error(message);
                return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY.CODE).json({
                    message
                });
            }
        }

        const { name } = req.body;

        if (name) {
            const existingClient = await clientService.getOne({
                name
            });

            if (existingClient && !(req.params.id === existingClient._id.toString())) {
                const message = 'client with this name exists';

                logger.error(message);
                return res.status(HTTP_STATUS.CONFLICT.CODE).json({
                    message
                });
            }
        }

        await clientService.update({
            _id: req.params.id
        }, req.body);

        return res.status(HTTP_STATUS.OK.CODE).json({
            message: 'update was successful'
        });
    } catch (err) {
        logger.error(`updateClient request by user: ${req.user._id} for client: ${req.params.id} failed. MSG: ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.getClients = async function (req, res) {
    try {
        logger.info(`get clients request by user: ${req.user._id}`);
        const {
            startFrom,
            limitTo
        } = requestHelper.computeQueryResultLimit(req.query.startFrom, req.query.limitTo);

        const clients = await clientService.get({}, startFrom, limitTo);

        return res.status(HTTP_STATUS.OK.CODE).json(clients);
    } catch (err) {
        logger.error(`getClients request by user: ${req.user._id} failed. MSG: ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.validateClientExists = async function (req, res, next) {
    try {
        const {
            id
        } = req.params;

        if (!id) {
            const message = '"id" is required';

            logger.error(message);
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message
            });
        }

        logger.info(`validate client exists for id ${id}`);

        const client = await clientService.getOne({
            _id: id
        });

        if (!client) {
            const message = `client not found for id ${id}`;

            return res.status(HTTP_STATUS.NOT_FOUND.CODE).json({
                message
            });
        }

        next();
    } catch (err) {
        logger.error(`error occured validating client for id ${req.params.id} ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};