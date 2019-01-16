const appRoot = require('app-root-path');
const Client = require(`${appRoot}/api/models/clientModel`);
const passport = require('passport');
const passportJWT = require('passport-jwt');
const ExtractJWT = passportJWT.ExtractJwt;
const JWTStrategy = passportJWT.Strategy;
const {
    TOKEN_TYPE,
    ROLES
} = require(`${appRoot}/api/constants/authConstants`);

const jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJWT.fromAuthHeaderWithScheme('Bearer');
jwtOptions.secretOrKey = process.env.JWT_TOKEN;

const strategy = new JWTStrategy(jwtOptions, (jwtPayload, next) => {
    const tokenExpired = Math.floor(Date.now() / 1000) > jwtPayload.exp;
    switch (jwtOptions.TOKEN_TYPE) {
        case TOKEN_TYPE.CLIENT:
            Client.findOne({
                _id: jwtPayload.sub
            }).then((client) => {
                if (client && !tokenExpired) {
                    next(null, client);
                } else {
                    next(null, false);
                }
            });

        case TOKEN_TYPE.USER:
            User.findOne()
                .then((user) => {
                    if (user && !tokenExpired && user.role.includes(ROLES.ADMIN)) {
                        next(null, client);
                    } else {
                        next(null, false);
                    }
                });
        default:
            next(null, false);
    }
});

passport.use(strategy);