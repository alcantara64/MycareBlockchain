const appRoot = require('app-root-path');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { TOKEN_TYPE } = require(`${appRoot}/api/constants/authConstants`);
const {
    HTTP_STATUS
} = require(`${appRoot}/api/constants/Common`);

describe('UserController', () => {
    let userController;
    let resJson;
    let res;
    let User;
    let helperMethods;
    let jwt;

    beforeEach(() => {
        resJson = sandbox.spy();
        User = {};
        helperMethods = {};
        jwt = {};

        res = {
            status: sandbox.stub().returns({
                json: resJson
            })
        };

        const imports = {
            'jsonwebtoken': jwt
        };
        imports[`${appRoot}/api/models/userModel`] = User;
        imports[`${appRoot}/api/helpers/helperMethods`] = helperMethods;

        userController = proxyquire(`${appRoot}/api/controllers/userController`, imports);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('returns ststus 400 if no email is supplied', () => {
        const req = {
            body: {
                password: '123456'
            }
        };

        userController.login(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJson, {
            message: 'email and password are required parammeters'
        });
    });

    it('returns status 400 if no email is supplied', () => {
        const req = {
            body: {
                email: 'user@email.com'
            }
        };

        userController.login(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJson, {
            message: 'email and password are required parammeters'
        });
    });

    it('returns status 403 if no user is found for email', async () => {
        const req = {
            body: {
                email: 'user@email.com',
                password: '123456'
            }
        };

        const select = sandbox.stub().resolves(null);

        User.findOne = sandbox.stub().returns({
            select
        });

        await userController.login(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.FORBIDDEN.CODE);
        sandbox.assert.calledWith(resJson, {
            message: 'User login failed. Please check email and password.'
        });

        sandbox.assert.calledWith(User.findOne, {
            email: req.body.email
        });
        sandbox.assert.calledWith(select, '+hash +salt');
    });

    it('returns status 403 if password doesnt match', async () => {
        const req = {
            body: {
                email: 'user@email.com',
                password: '123456'
            }
        };

        const user = {
            firstName: 'John',
            lastName: 'Doe',
            salt: 'jjd8493mdjd8u3jd39oi',
            comparePassword: sandbox.stub().returns(false)
        };

        const select = sandbox.stub().resolves(user);

        User.findOne = sandbox.stub().returns({
            select
        });

        const hash = 'dddkueemdkeunndjeiem';

        helperMethods.hashPassword = sandbox.stub().returns(hash);

        await userController.login(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.FORBIDDEN.CODE);
        sandbox.assert.calledWith(resJson, {
            message: 'User login failed. Please check email and password.'
        });

        sandbox.assert.calledWith(user.comparePassword, hash);
        sandbox.assert.calledWith(helperMethods.hashPassword, user.salt, req.body.password);

        sandbox.assert.calledWith(User.findOne, {
            email: req.body.email
        });
        sandbox.assert.calledWith(select, '+hash +salt');
    });

    it('returns status 200 if email and password is valid', async () => {
        const req = {
            body: {
                email: 'user@email.com',
                password: '123456'
            }
        };

        const user = {
            _id: 'e738ddg83bdndg8bc9edj9bd3e',
            firstName: 'John',
            lastName: 'Doe',
            salt: 'jjd8493mdjd8u3jd39oi',
            email: req.body.email,
            comparePassword: sandbox.stub().returns(true)
        };

        const select = sandbox.stub().resolves(user);

        User.findOne = sandbox.stub().returns({
            select
        });

        const hash = 'dddkueemdkeunndjeiem';

        helperMethods.hashPassword = sandbox.stub().returns(hash);

        const token = 'zyE5haSr4Pdag5dmxCgcm2NqgJxCGg6OFaNmFy1/Vmg16lG/hkZtrPrZsiTvfqI';

        jwt.sign = sandbox.stub().returns(token);

        await userController.login(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJson, {
            access_token: token
        });

        sandbox.assert.calledWith(user.comparePassword, hash);
        sandbox.assert.calledWith(helperMethods.hashPassword, user.salt, req.body.password);

        const jwtArgs = {
            sub: user._id,
            email: user.email,
            tokenType: TOKEN_TYPE.USER
        };

        sandbox.assert.called(jwt.sign);

        sandbox.assert.calledWith(User.findOne, {
            email: req.body.email
        });
        sandbox.assert.calledWith(select, '+hash +salt');
    });

    it('returns status of 500 if server error occurs', async () => {
        const req = {
            body: {
                email: 'user@email.com',
                password: '123456'
            }
        };

        const select = sandbox.stub().rejects(new Error('db disconnected'));

        User.findOne = sandbox.stub().returns({
            select
        });

        await userController.login(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJson, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });

        sandbox.assert.calledWith(User.findOne, {
            email: req.body.email
        });
        sandbox.assert.calledWith(select, '+hash +salt');
    });
});