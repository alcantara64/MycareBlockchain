const appRoot = require('app-root-path');
const chai = require('chai');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const {
    TOKEN_TYPE
} = require(`${appRoot}/api/constants/authConstants`);

describe('Authentication', () => {
    describe('Client Auth', () => {
        let authMiddleware;
        let authStub;
        let passport;
        let passportJWT;
        let next;
        let userModel;
        let clientModel;
        let thenable;
        const payload = {
            sub: 1234567890,
            tokenType: TOKEN_TYPE.CLIENT
        };

        beforeEach(() => {
            authStub = {};
            next = sandbox.stub();
            thenable = {
                then: (callback) => {
                    callback({});
                }
            };
            userModel = {
                findOne: sandbox.stub().returns(thenable)
            };

            clientModel = {
                findOne: sandbox.stub().returns(thenable)
            };

            function JWTStrategy(jwtOptions, callback) {
                callback(payload, next);
            }

            passportJWT = {
                Strategy: JWTStrategy,
                ExtractJwt: {
                    fromAuthHeaderWithScheme: sandbox.stub().returns('JWT')
                }
            };

            passport = {
                use: sandbox.stub()
            };
            const imports = {
                authStub,
                passport,
                'passport-jwt': passportJWT
            };

            imports[`${appRoot}/api/models/userModel`] = userModel;
            imports[`${appRoot}/api/models/clientModel`] = clientModel;

            authMiddleware = proxyquire(`${appRoot}/api/middlewares/authentication/auth`, imports);
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('finds client from db during authentication', () => {

            sinon.assert.calledWith(clientModel.findOne, {
                _id: payload.sub
            });

            sandbox.assert.calledWith(next, null, {});
        });

    });

    describe('Client Auth', () => {
        let authMiddleware;
        let authStub;
        let passport;
        let passportJWT;
        let next;
        let userModel;
        let clientModel;
        let thenable;
        const payload = {
            sub: 1234567890,
            tokenType: TOKEN_TYPE.CLIENT
        };

        beforeEach(() => {
            authStub = {};
            next = sandbox.stub();
            thenable = {
                then: (callback) => {
                    callback(null);
                }
            };
            userModel = {
                findOne: sandbox.stub().returns(thenable)
            };

            clientModel = {
                findOne: sandbox.stub().returns(thenable)
            };

            function JWTStrategy(jwtOptions, callback) {
                callback(payload, next);
            }

            passportJWT = {
                Strategy: JWTStrategy,
                ExtractJwt: {
                    fromAuthHeaderWithScheme: sandbox.stub().returns('JWT')
                }
            };

            passport = {
                use: sandbox.stub()
            };
            const imports = {
                authStub,
                passport,
                'passport-jwt': passportJWT
            };

            imports[`${appRoot}/api/models/userModel`] = userModel;
            imports[`${appRoot}/api/models/clientModel`] = clientModel;

            authMiddleware = proxyquire(`${appRoot}/api/middlewares/authentication/auth`, imports);
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('calls next with false when client is not found in database', () => {

            sinon.assert.calledWith(clientModel.findOne, {
                _id: payload.sub
            });
            sandbox.assert.calledWith(next, null, false);
        });

    });

    describe('User Auth', () => {
        let authStub;
        let passport;
        let passportJWT;
        let next;
        let userModel;
        let thenable;
        let clientModel;
        let authMiddleware;

        const payload = {
            sub: 1234567890,
            tokenType: TOKEN_TYPE.USER
        };

        beforeEach(() => {
            authStub = {};
            next = sandbox.stub();
            thenable = {
                then: (callback) => {
                    callback({});
                }
            };
            userModel = {
                findOne: sandbox.stub().returns(thenable)
            };

            clientModel = {
                findOne: sandbox.stub().returns(thenable)
            };

            function JWTStrategy(jwtOptions, callback) {
                callback(payload, next);
            }

            passportJWT = {
                Strategy: JWTStrategy,
                ExtractJwt: {
                    fromAuthHeaderWithScheme: sandbox.stub().returns('JWT')
                }
            };

            passport = {
                use: sandbox.stub()
            };
            const imports = {
                authStub,
                passport,
                'passport-jwt': passportJWT
            };

            imports[`${appRoot}/api/models/userModel`] = userModel;
            imports[`${appRoot}/api/models/clientModel`] = clientModel;

            authMiddleware = proxyquire(`${appRoot}/api/middlewares/authentication/auth`, imports);
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('finds user from db during authentication', () => {

            sinon.assert.calledWith(userModel.findOne, {
                _id: payload.sub
            });

            sandbox.assert.calledWith(next, null, {});
        });
    });

    describe('User Auth', () => {
        let authStub;
        let passport;
        let passportJWT;
        let next;
        let userModel;
        let thenable;
        let clientModel;
        let authMiddleware;

        const payload = {
            sub: 1234567890,
            tokenType: TOKEN_TYPE.USER
        };

        beforeEach(() => {
            authStub = {};
            next = sandbox.stub();
            thenable = {
                then: (callback) => {
                    callback(null);
                }
            };
            userModel = {
                findOne: sandbox.stub().returns(thenable)
            };

            clientModel = {
                findOne: sandbox.stub().returns(thenable)
            };

            function JWTStrategy(jwtOptions, callback) {
                callback(payload, next);
            }

            passportJWT = {
                Strategy: JWTStrategy,
                ExtractJwt: {
                    fromAuthHeaderWithScheme: sandbox.stub().returns('JWT')
                }
            };

            passport = {
                use: sandbox.stub()
            };
            const imports = {
                authStub,
                passport,
                'passport-jwt': passportJWT
            };

            imports[`${appRoot}/api/models/userModel`] = userModel;
            imports[`${appRoot}/api/models/clientModel`] = clientModel;

            authMiddleware = proxyquire(`${appRoot}/api/middlewares/authentication/auth`, imports);
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('returns false when user is not found in db', () => {

            sinon.assert.calledWith(userModel.findOne, {
                _id: payload.sub
            });

            sandbox.assert.calledWith(next, null, false);
        });
    });
});