const appRoot = require('app-root-path');
const {
    HTTP_STATUS
} = require(`${appRoot}/api/constants/Common`);

const crypto = require('crypto');
const logger = require(`${appRoot}/config/winston`);
const User = require(`${appRoot}/api/models/userModel`);
const { TOKEN_TYPE } = require(`${appRoot}/api/constants/authConstants`);
const helperMethods = require(`${appRoot}/api/helpers/helperMethods`);
const jwt = require('jsonwebtoken');

exports.login = async function (req, res) {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            const message = 'email and password are required parammeters';

            logger.error(message);
            return res.status(HTTP_STATUS.BAD_REQUEST.CODE).json({
                message
            });
        }

        const user = await User.findOne({
            email
        }).select('+hash +salt');

        if (!user) {
            logger.error(`User lookup failed`);

            return res.status(HTTP_STATUS.FORBIDDEN.CODE).json({
                message: 'User login failed. Please check email and password.'
            });
        }

        const {
            salt
        } = user;
        const hash = helperMethods.hashPassword(salt, req.body.password);

        if (!user.comparePassword(hash)) {
            logger.info(`User authentication failed. Password mismatch for user ${user}`);
            return res.status(HTTP_STATUS.FORBIDDEN.CODE).json({
                message: 'User login failed. Please check email and password.'
            });
        }

        const now = Math.floor(Date.now() / 1000);
        const hours = 60 * 60; // 1hr
        const expiration = now + hours;

        const payload = {
            // create token
            access_token: jwt.sign({
                sub: user._id,
                email: user.email,
                tokenType: TOKEN_TYPE.USER,
                exp: expiration
            }, process.env.JWT_TOKEN)
        };

        return res.status(HTTP_STATUS.OK.CODE).json(payload);
    } catch (err) {
        logger.error(`error occured during login ${err.message}`);
        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};