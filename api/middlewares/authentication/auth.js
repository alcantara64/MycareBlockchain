const appRoot = require('app-root-path');
const Client = require(`${appRoot}/api/models/clientModel`);
const User = require(`${appRoot}/api/models/userModel`);
const passport = require('passport');
const passportJWT = require('passport-jwt');
const ExtractJWT = passportJWT.ExtractJwt;
const JWTStrategy = passportJWT.Strategy;
const {
    TOKEN_TYPE
} = require(`${appRoot}/api/constants/authConstants`);

const jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJWT.fromAuthHeaderWithScheme('Bearer');
jwtOptions.secretOrKey = process.env.JWT_TOKEN;

const strategy = new JWTStrategy(jwtOptions, (jwtPayload, next) => {
    const tokenExpired = Math.floor(Date.now() / 1000) > jwtPayload.exp;

    switch (jwtPayload.tokenType) {
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
            break;

        case TOKEN_TYPE.USER:
            User.findOne({
                    _id: jwtPayload.sub
                })
                .then((user) => {
                    if (user && !tokenExpired) {
                        next(null, user);
                    } else {
                        next(null, false);
                    }
                });
            break;
        default:
            next(null, false);
            break;
    }
});

passport.use(strategy);