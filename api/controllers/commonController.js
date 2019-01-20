const appRoot = require('app-root-path');
const passport = require('passport');
const {
    ROLES
} = require(`${appRoot}/api/constants/authConstants`);
const {
    HTTP_STATUS
} = require(`${appRoot}/api/constants/Common`);
const logger = require(`${appRoot}/config/winston`);

exports.protected = passport.authenticate('jwt', {
    session: false
});

exports.clientProtected = async function (req, res, next) {
    try {
        const client = req.user;

        if (client && (client.clientId && client.clientSecret)) {
            next();
        } else {
            const message = 'Unauthorized';

            return res.status(HTTP_STATUS.UNAUTHORIZED.CODE).json({ message });
        }
    } catch (err) {
        logger.error(`error occured authenticating client ${err.message}`);

        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};

exports.adminProtected = async function (req, res, next) {
    try {
        const {
            user
        } = req;

        if (user.role && user.role.includes(ROLES.ADMIN)) {
            next();
        } else {
            const message = 'Unauthorized';

            return res.status(HTTP_STATUS.UNAUTHORIZED.CODE).json({ message });
        }
    } catch (err) {
        logger.error(`error occured authenticating user ${err.message}`);

        return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE).json({
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    }
};