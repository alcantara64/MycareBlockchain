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

describe('authController', () => {
    let authController;
    let clientService;
    let res;
    let resJson;
    let Client;
    let jwt;
    let contractHelper;
    let emailHelper;
    let crypto;

    beforeEach(() => {
        clientService = {};
        contractHelper = {};
        Client = {};
        jwt = {};
        crypto = {};
        emailHelper = {
            sendMail: sandbox.stub()
        };

        resJson = sandbox.spy();

        res = {
            status: sandbox.stub().returns({
                json: resJson
            })
        };

        const imports = {
            'jsonwebtoken': jwt,
            'crypto': crypto
        };

        imports[`${appRoot}/api/services/clientService`] = clientService;
        imports[`${appRoot}/api/helpers/contractHelper`] = contractHelper;
        imports[`${appRoot}/api/helpers/emailHelper`] = emailHelper;
        imports[`${appRoot}/api/models/clientsModel`] = Client;

        authController = proxyquire(`${appRoot}/api/controllers/authController`, imports);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('returns ststus 400 if no clientId is supplied', () => {
        const req = {
            body: {
                clientSecret: '123456'
            }
        };

        authController.getAccessToken(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJson, {
            message: 'clientId is required'
        });
    });

    it('returns status 400 if no clientId is supplied', () => {
        const req = {
            body: {
                clientId: '2jh8hddjbeu39ee3hdndne3edeu3n'
            }
        };

        authController.getAccessToken(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJson, {
            message: 'clientSecret is required'
        });
    });

    it('returns status 403 if no client is found', async () => {
        const req = {
            body: {
                clientId: '2jh8hddjbeu39ee3hdndne3edeu3n',
                clientSecret: '2jh8hddjbeu39ee3hdndne3edeu3n'
            }
        };

        clientService.getOne = sandbox.stub().resolves(null);

        await authController.getAccessToken(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.FORBIDDEN.CODE);
        sandbox.assert.calledWith(resJson, {
            message: `client not found for id ${req.body.clientId}`
        });

        sandbox.assert.calledWith(clientService.getOne, {
            clientId: req.body.clientId,
            clientSecret: req.body.clientSecret
        });
    });

    it('returns status 403 if no client is found', async () => {
        const req = {
            body: {
                clientId: '2jh8hddjbeu39ee3hdndne3edeu3n',
                clientSecret: '2jh8hddjbeu39ee3hdndne3edeu3n'
            }
        };

        clientService.getOne = sandbox.stub().resolves(null);

        await authController.getAccessToken(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.FORBIDDEN.CODE);
        sandbox.assert.calledWith(resJson, {
            message: `client not found for id ${req.body.clientId}`
        });

        sandbox.assert.calledWith(clientService.getOne, {
            clientId: req.body.clientId,
            clientSecret: req.body.clientSecret
        });
    });

    it('returns status 200 if clientId and clietSecret', async () => {
        const req = {
            body: {
                clientId: '2jh8hddjbeu39ee3hdndne3edeu3n',
                clientSecret: '2jh8hddjbeu39ee3hdndne3edeu3n'
            }
        };

        const client = {
            _id: 'dhndkhbfffhfhcjjfjfmhf',
            email: 'org@newwave.io'
        };

        const token = 'zyE5haSr4Pdag5dmxCgcm2NqgJxCGg6OFaNmFy1/Vmg16lG/hkZtrPrZsiTvfqI';

        jwt.sign = sandbox.stub().returns(token);

        clientService.getOne = sandbox.stub().resolves(client);

        await authController.getAccessToken(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJson, {
            access_token: token
        });

        sandbox.assert.called(jwt.sign);

        sandbox.assert.calledWith(clientService.getOne, {
            clientId: req.body.clientId,
            clientSecret: req.body.clientSecret
        });
    });

    it('returns 500 error code when error occurs', async () => {
        const req = {
            body: {
                clientId: '2jh8hddjbeu39ee3hdndne3edeu3n',
                clientSecret: '2jh8hddjbeu39ee3hdndne3edeu3n'
            }
        };

        const token = 'zyE5haSr4Pdag5dmxCgcm2NqgJxCGg6OFaNmFy1/Vmg16lG/hkZtrPrZsiTvfqI';

        jwt.sign = sandbox.stub().returns(token);

        clientService.getOne = sandbox.stub().rejects(new Error('db connection error'));

        await authController.getAccessToken(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJson, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });

        sandbox.assert.calledWith(clientService.getOne, {
            clientId: req.body.clientId,
            clientSecret: req.body.clientSecret
        });
    });

    it('can delete a client', async () => {
        const req = {
            params: {
                id: 'd278hdndedddudjdge8ebd3'
            }
        };

        clientService.delete = sandbox.stub().resolves(true);

        await authController.deleteClient(req, res);

        sandbox.assert.calledWith(clientService.delete, req.params.id);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJson, {
            message: 'deleted client successful'
        });
    });

    it('returns status 500 if delete fails', async () => {
        const req = {
            params: {
                id: 'd278hdndedddudjdge8ebd3'
            }
        };

        clientService.delete = sandbox.stub().rejects(false);

        await authController.deleteClient(req, res);

        sandbox.assert.calledWith(clientService.delete, req.params.id);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJson, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });


    it('newClient returns status of 400 if email is not provided', () => {
        const req = {
            body: {
                name: 'mycareAPI'
            }
        };

        authController.newClient(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJson, {
            message: '"name" and "email" are required'
        });
    });

    it('newClient returns status of 400 if email is not provided', () => {
        const req = {
            body: {
                email: 'org@mycaree.com'
            }
        };

        authController.newClient(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJson, {
            message: '"name" and "email" are required'
        });
    });

    it('newClient returns status of 400 if client with name already exists', async () => {
        const req = {
            body: {
                name: 'mycareAPI',
                email: 'org@mycaree.com'
            }
        };

        const client = {
            _id: 'dhndkhbfffhfhcjjfjfmhf',
            email: 'org@newwave.io'
        };

        clientService.getOne = sandbox.stub().resolves(client);

        await authController.newClient(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.CONFLICT.CODE);
        sandbox.assert.calledWith(resJson, {
            message: 'client with this name exists'
        });
    });

    it('newClient returns 500 status when server error occurs', async () => {
        const req = {
            body: {
                name: 'mycareAPI',
                email: 'org@mycaree.com'
            }
        };

        clientService.getOne = sandbox.stub().rejects(new Error('database connection error'));

        await authController.newClient(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJson, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });

    it('can create new client successfully', async () => {
        const req = {
            body: {
                name: 'mycareAPI',
                email: 'org@mycaree.com'
            }
        };

        clientService.getOne = sandbox.stub().resolves(null);

        const randomStr = 'sjknddddddkddjdmhij393d83j';

        const toString = sandbox.stub().returns(randomStr);

        crypto.randomBytes = sandbox.stub().returns({
            toString
        });

        const client = {
            name: req.body.name,
            email: req.body.email,
            clientId: randomStr,
            clientSecret: randomStr,
            role: [ROLES.CLIENT]
        };

        clientService.create = sandbox.stub().resolves(client);

        await authController.newClient(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJson, client);

        sandbox.assert.calledWith(clientService.create, client);
        sandbox.assert.calledWith(emailHelper.sendMail,
            client.email,
            'myCareAI :: Blockchain-api credentials',
            'clientCredentials', {
                appName: client.name,
                clientId: client.clientId,
                clientSecret: client.clientSecret
            });
    });

    it('getClientById returns status 400 if id is not supplied', () => {
        const req = {
            params: {}
        };

        authController.getClientById(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJson, {
            message: '"id" is required'
        });
    });

    it('getClientById returns status 404 client is not found', async () => {
        const req = {
            params: {
                id: 'dhdfjke9hnfji3fffggg'
            }
        };

        clientService.getOne = sandbox.stub().resolves(null);

        await authController.getClientById(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.NOT_FOUND.CODE);
        sandbox.assert.calledWith(resJson, {
            message: `client not found for id ${req.params.id}`
        });
    });

    it('can get client by id successfully', async () => {
        const req = {
            params: {
                id: 'dhdfjke9hnfji3fffggg'
            }
        };

        const client = {
            _id: req.params.id,
            email: 'org@newwave.io'
        };

        clientService.getOne = sandbox.stub().resolves(client);

        await authController.getClientById(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJson, client);
    });

    it('getClientById returns 500 status if error occurs fetching client', async () => {
        const req = {
            params: {
                id: 'dhdfjke9hnfji3fffggg'
            }
        };

        const client = {
            _id: req.params.id,
            email: 'org@newwave.io'
        };

        clientService.getOne = sandbox.stub().rejects(new Error('database connection error'));

        await authController.getClientById(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJson, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });

    it('returns status 400 if no update is sent', () => {
        const req = {
            params: { id: 'jdn9kenwjoiwcooocieocdnc9303c' },
            body: {}
        };

        authController.updateClient(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJson, {
            message: 'no update data found'
        });
    });

    it('returns status 422 if thers an attempt to update clientId', () => {
        const req = {
            params: { id: 'jdn9kenwjoiwcooocieocdnc9303c' },
            body: {
                clientId: 'ddjddk93dm393emi'
            }
        };

        authController.updateClient(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.UNPROCESSABLE_ENTITY.CODE);
        sandbox.assert.calledWith(resJson, {
            message: 'cannot update clientId'
        });
    });

    it('returns status 422 if thers an attempt to update clientSecret', () => {
        const req = {
            params: { id: 'jdn9kenwjoiwcooocieocdnc9303c' },
            body: {
                clientSecret: 'ddjddk93dm393emi'
            }
        };

        authController.updateClient(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.UNPROCESSABLE_ENTITY.CODE);
        sandbox.assert.calledWith(resJson, {
            message: 'cannot update clientSecret'
        });
    });

    it('update client returns conflict code when client name is unavailable', async () => {
        const req = {
            params: {
                id: 'hddkdhdk8y83d93dnddnskskw93'
            },
            body: {
                name: 'newName'
            }
        };

        const dbClient = {
            _id: '328deiheuu8yi2g2iu28idbucee',
            name: 'mycare-API',
            email: 'mycare@newwave.io',
            clientId: 'ffe738a93dc838e28d28c882eadeeccbe3f2c',
            clientToken: 'b2492f8393e93a38483d83e82827b837f82fcea3b92a38d83c8e8a8'
        };

        clientService.update = sandbox.stub().resolves(true);
        clientService.getOne = sandbox.stub().resolves(dbClient);

        await authController.updateClient(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.CONFLICT.CODE);
        sandbox.assert.calledWith(resJson, {
            message: 'client with this name exists'
        });
        sandbox.assert.calledWith(clientService.getOne, {
            name: req.body.name
        });
    });

    it('can update client successfully', async () => {
        const req = {
            params: {
                id: 'hddkdhdk8y'
            },
            body: {
                name: 'newName'
            }
        };

        clientService.update = sandbox.stub().resolves(true);
        clientService.getOne = sandbox.stub().resolves(null);

        await authController.updateClient(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJson, {
            message: 'update was successful'
        });
        sandbox.assert.calledWith(clientService.update, {
            _id: req.params.id
        }, req.body);
    });

    it('update client returns status 500 when error occurs', async () => {
        const req = {
            params: {
                id: 'hddkdhdk8y'
            },
            body: {
                name: 'newName'
            }
        };

        clientService.update = sandbox.stub().rejects(false);
        clientService.getOne = sandbox.stub().resolves(null);

        await authController.updateClient(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJson, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
        sandbox.assert.calledWith(clientService.getOne, {
            name: req.body.name
        });
        sandbox.assert.calledWith(clientService.update, {
            _id: req.params.id
        }, req.body);
    });

    it('can get clients', async () => {
        const req = {
            query: {
                startFrom: 1,
                limitTo: 80
            }
        };

        const clients = [{
            _id: 'dkddoedmi3inddie',
            name: 'eobAPI'
        }];

        clientService.get = sandbox.stub().resolves(clients);

        const {
            startFrom,
            limitTo
        } = requestHelper.computeQueryResultLimit(req.query.startFrom, req.query.limitTo);

        await authController.getClients(req, res);

        sandbox.assert.calledWith(clientService.get, {}, startFrom, limitTo);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJson, clients);
    });

    it('getClients returns 500 error if error occurs', async () => {
        const req = {
            query: {
                startFrom: 1,
                limitTo: 80
            }
        };

        const clients = [{
            _id: 'dkddoedmi3inddie',
            name: 'eobAPI'
        }];

        clientService.get = sandbox.stub().rejects(new Error('DATABASE Error ocured'));

        const {
            startFrom,
            limitTo
        } = requestHelper.computeQueryResultLimit(req.query.startFrom, req.query.limitTo);

        await authController.getClients(req, res);

        sandbox.assert.calledWith(clientService.get, {}, startFrom, limitTo);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJson, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });

    it('validateClientExists returns status 400 if id is missing', () => {
        const req = {
            params: {}
        };

        const next = sandbox.spy();

        authController.validateClientExists(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJson, {
            message: '"id" is required'
        });
        sandbox.assert.notCalled(next);
    });

    it('validateClientExists returns status 404 client is not found', async () => {
        const req = {
            params: {
                id: 'dddjd93uffhicdj'
            }
        };
        const next = sandbox.spy();

        clientService.getOne = sandbox.stub().resolves(null);

        await authController.validateClientExists(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.NOT_FOUND.CODE);
        sandbox.assert.calledWith(resJson, {
            message: `client not found for id ${req.params.id}`
        });
        sandbox.assert.notCalled(next);
    });

    it('validateClientExists calls next if client is found', async () => {
        const req = {
            params: {
                id: 'dddjd93uffhicdj'
            }
        };

        const next = sandbox.spy();

        const client = {
            _id: 'sjsjsddjd'
        };

        clientService.getOne = sandbox.stub().resolves(client);

        await authController.validateClientExists(req, res, next);

        sandbox.assert.called(next);
    });

    it('validateClientExists returns status 500 if error occurs', async () => {
        const req = {
            params: {
                id: 'dddjd93uffhicdj'
            }
        };

        const next = sandbox.spy();

        clientService.getOne = sandbox.stub().rejects(new Error('Database error occured'));

        await authController.validateClientExists(req, res, next);

        sandbox.assert.notCalled(next);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJson, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });
});