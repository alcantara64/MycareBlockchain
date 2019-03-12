const appRoot = require('app-root-path');
const proxyquire = require('proxyquire').noCallThru();
const {
    TOKEN_TYPE
} = require(`${appRoot}/api/constants/authConstants`);
const chai = require('chai');
const {
    HTTP_STATUS
} = require(`${appRoot}/api/constants/Common`);
const requestHelper = require(`${appRoot}/api/helpers/requestHelper`);
const { ROLES } = require(`${appRoot}/api/constants/authConstants`);
const dotenv = require('dotenv');
dotenv.config();

const sinon = require('sinon');
let sandbox = sinon.createSandbox();

describe('commonController', () => {
    let commonController;
    let res;
    let resJson;
    let jwt;
    let passport;

    const ROLES = {
        CLIENT: 3829433,
        ADMIN: 10283444,
        JANITOR: 48827827
    };

    beforeEach(() => {
        jwt = {};
        passport = {
            authenticate: sandbox.stub()
        };
        resJson = sandbox.spy();

        res = {
            status: sandbox.stub().returns({
                json: resJson
            })
        };

        const imports = {
            'jsonwebtoken': jwt,
            'passport': passport
        };

        commonController = proxyquire(`${appRoot}/api/controllers/commonController`, imports);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('creates passport auth middleware on initialization', () => {
        sandbox.assert.calledWith(passport.authenticate, 'jwt', {
            session: false
        });
    });

    it('authorized calls next if no role was passed', () => {
        const middlewares = commonController.authorize();

        const roleCheckMiddleWare = middlewares[1];

        const req = {};
        const next = sandbox.spy();

        roleCheckMiddleWare(req, res, next);

        sandbox.assert.called(next);
    });

    it('authorize returns status code 401 if user role does not contain required values', () => {
        const middlewares = commonController.authorize(ROLES.ADMIN);

        const roleCheckMiddleWare = middlewares[1];

        const req = {
            user: {
                _id: '90e8289hjd9edh893n928',
                role: [ROLES.JANITOR]
            }
        };
        const next = sandbox.spy();

        roleCheckMiddleWare(req, res, next);

        sandbox.assert.notCalled(next);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.UNAUTHORIZED.CODE);
        sandbox.assert.calledWith(resJson, { message: 'Unauthorized' });
    });

    it('authorize calls next if user role contains required role', () => {
        const middlewares = commonController.authorize(ROLES.ADMIN);

        const roleCheckMiddleWare = middlewares[1];

        const req = {
            user: {
                _id: '90e8289hjd9edh893n928',
                role: [ROLES.JANITOR, ROLES.ADMIN]
            }
        };
        const next = sandbox.spy();

        roleCheckMiddleWare(req, res, next);

        sandbox.assert.called(next);
    });
});