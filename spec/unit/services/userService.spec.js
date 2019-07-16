const appRoot = require('app-root-path');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const { ROLES } = require(`${appRoot}/api/constants/authConstants`);

const sandbox = sinon.createSandbox();
const { assert } = sandbox;

describe('UserService', function () {
    let userService;
    let User;
    let fs;
    let envHelper;
    let crypto;
    let helperMethods;

    const envConstants = {
        ADMIN_EMAIL: 'missy@email.com',
        ADMIN_PASSWORD: '123456'
    };

    beforeEach(() => {
        User = {};
        fs = {};
        crypto = {};
        helperMethods = {};

        envHelper = {
            getConstants() {
                return { ...envConstants };
            }
        };

        const imports = {
            fs,
            crypto,
            [`${appRoot}/api/models/userModel`]: User,
            [`${appRoot}/api/helpers/envHelper`]: envHelper,
            [`${appRoot}/api/helpers/helperMethods`]: helperMethods
        };

        userService = proxyquire(`${appRoot}/api/services/userService`, imports);
    });

    describe('createAdminUser', () => {
        it('does not create new user if one already exists', async () => {
            User.findOne = sandbox.stub().resolves({});
            User.create = sandbox.stub();
            const userDataJSON = `{"firstName":"Missy","lastName":"Dreen"}`;

            fs.readFileSync = sandbox.stub().returns(userDataJSON);
            await userService.createAdminUser();

            assert.calledWith(fs.readFileSync, `${appRoot}/util/seedData/adminUser.json`);
            assert.calledWith(User.findOne, { email: envConstants.ADMIN_EMAIL });
            assert.notCalled(User.create);
        });

        it('creates new user if one doesnt exist', async () => {
            User.findOne = sandbox.stub().resolves(null);
            User.create = sandbox.stub();
            const userDataJSON = `{"firstName":"Missy","lastName":"Dreen"}`;

            const hash = 'nsdnsdsdjsndjncidnc8e83hcdudhuie8';
            helperMethods.hashPassword = sandbox.stub().returns(hash);

            const salt = 'iodnsdnco0ienndncoidncownoenwshf';

            const toString = sandbox.stub().returns(salt);

            crypto.randomBytes = sandbox.stub().returns({
                toString
            });

            fs.readFileSync = sandbox.stub().returns(userDataJSON);
            await userService.createAdminUser();

            const user = { ...JSON.parse(userDataJSON), salt, hash, role: [ROLES.ADMIN], email: envConstants.ADMIN_EMAIL };

            assert.calledWith(fs.readFileSync, `${appRoot}/util/seedData/adminUser.json`);
            assert.calledWith(User.findOne, { email: envConstants.ADMIN_EMAIL });
            assert.calledWith(User.create, user);
            assert.calledWith(helperMethods.hashPassword, user.salt, envConstants.ADMIN_PASSWORD);
        });
    });
});