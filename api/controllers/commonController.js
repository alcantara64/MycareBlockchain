const appRoot = require('app-root-path');
const passport = require('passport');
const {
    HTTP_STATUS
} = require(`${appRoot}/api/constants/Common`);
const logger = require(`${appRoot}/config/winston`);

const protectedRoute = passport.authenticate('jwt', {
    session: false
});

exports.authorize = function authorize(roles = []) {
    if (typeof roles === 'number') {
        roles = [roles];
    }

    return [
        protectedRoute,
        // authorize based on user role
        // todo load all authorization roles in the database and check against them
        (req, res, next) => {
            if (roles.length && !req.user.role.includes(...roles)) {
                logger.error(`User: ${req.user._id} failed role check.`);
                return res.status(HTTP_STATUS.UNAUTHORIZED.CODE).json({ message: 'Unauthorized' });
            }
            next();
        }
    ];
};