const appRoot = require('app-root-path');
const proxyquire = require('proxyquire').noCallThru();
const chai = require('chai');
const {
    HTTP_STATUS
} = require(`${appRoot}/api/constants/Common`);
const dotenv = require('dotenv');
dotenv.config();

const sinon = require('sinon');
let sandbox = sinon.createSandbox();

describe('mycareController', () => {
    let mycareController;
    let mycareService;
    let res;
    let resJSON;
    let contractHelper;

    const transactionReceipt = {
        status: true,
        hash: '0x807c81e8a72b8e897dd820d2e482e3dcea744f316bb4f0ccd612da275241c28b00000000000029993999'
    };

    const walletAddress = '0x23ff33sd8ace82c72f82c28e82addecf23795fc';
    const timestamp = '2018-11-21T11:26:34.142Z';
    const profileHash = '282yg82gs3ed83h9nd93die93nd3ndemdudnndu3jdjd3ndeednu27d';

    beforeEach(() => {
        mycareService = {};
        contractHelper = {};

        resJSON = sandbox.spy();

        res = {
            status: sandbox.stub().returns({
                json: resJSON
            })
        };

        const imports = {};

        imports[`${appRoot}/api/services/mycareService`] = mycareService;
        imports[`${appRoot}/api/helpers/contractHelper`] = contractHelper;

        mycareController = proxyquire(`${appRoot}/api/controllers/mycareController`, imports);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('can add account', async () => {
        mycareService.AddAccount = sandbox.stub().resolves(transactionReceipt);

        const req = {
            body: {
                walletAddress,
                profileHash: '282yg82gs3ed83h9nd93die93nd3ndemdudnndu3jdjd3ndeednu27d',
                timestamp
            }
        };

        await mycareController.addAccount(req, res);

        sandbox.assert.calledWith(mycareService.AddAccount, req.body);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJSON, transactionReceipt);
    });

    it('add account sends status of 500 when theres a server error', async () => {
        mycareService.AddAccount = sandbox.stub().rejects('Unexpected error occured');

        const req = {
            body: {
                walletAddress,
                profileHash,
                timestamp
            }
        };

        await mycareController.addAccount(req, res);

        sandbox.assert.calledWith(mycareService.AddAccount, req.body);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });

    it('can deactivate account successfully', async () => {
        mycareService.DeactivateAccount = sandbox.stub().resolves(transactionReceipt);

        const req = {
            body: {
                walletAddress,
                timestamp
            }
        };

        await mycareController.deactivateAccount(req, res);

        sandbox.assert.calledWith(mycareService.DeactivateAccount, req.body.walletAddress, req.body.timestamp);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJSON, transactionReceipt);
    });

    it('deactivate account returns status 500 error when occurs', async () => {
        mycareService.DeactivateAccount = sandbox.stub().rejects('Unexpected error occured');

        const req = {
            body: {
                walletAddress,
                timestamp
            }
        };

        await mycareController.deactivateAccount(req, res);

        sandbox.assert.calledWith(mycareService.DeactivateAccount, req.body.walletAddress, req.body.timestamp);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });

    it('get account returns server error when profileHash and walletAddress isnt found', async () => {
        const req = {
            query: {}
        };

        await mycareController.getAccount(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: 'Invalid query parameters, one of walletAddress and profileHash is required'
        });
    });

    it('returns 404 if account is not found for walletAddress', async () => {
        const req = {
            query: {
                walletAddress
            }
        };

        mycareService.GetAccount = sandbox.stub().resolves(null);

        await mycareController.getAccount(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.NOT_FOUND.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: 'Account not found'
        });
        sandbox.assert.calledWith(mycareService.GetAccount, walletAddress, true);
    });

    it('returns 404 if account is not found for profileHash', async () => {
        const req = {
            query: {
                profileHash
            }
        };

        mycareService.GetAccount = sandbox.stub().resolves(null);

        await mycareController.getAccount(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.NOT_FOUND.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: 'Account not found'
        });
        sandbox.assert.calledWith(mycareService.GetAccount, profileHash, false);
    });

    it('returns status of 200 when account is found', async () => {
        const req = {
            query: {
                profileHash
            }
        };

        const account = {
            isEntity: true
        };

        mycareService.GetAccount = sandbox.stub().resolves(account);

        await mycareController.getAccount(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJSON, account);
        sandbox.assert.calledWith(mycareService.GetAccount, profileHash, false);
    });

    it('get account returns status of 500 when error occurs', async () => {
        const req = {
            query: {
                profileHash
            }
        };

        const account = {
            isEntity: true
        };

        mycareService.GetAccount = sandbox.stub().rejects('Unexpected erorr occured');

        await mycareController.getAccount(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
        sandbox.assert.calledWith(mycareService.GetAccount, profileHash, false);
    });

    it('can get account count', async () => {
        const count = 300;
        mycareService.GetAccountCount = sandbox.stub().resolves(count);

        const req = {};

        await mycareController.getAccountsCount(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJSON, {
            count
        });
    });

    it('get account count returns satus of 500 when error occurs', async () => {
        mycareService.GetAccountCount = sandbox.stub().rejects('Unexpected error occured');

        const req = {};

        await mycareController.getAccountsCount(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });

    it('can validate paramters when deactivating account', () => {
        mycareController.validateAccountParams = sandbox.stub();

        const req = {
            body: {
                walletAddress,
                timestamp
            }
        };

        const next = () => {};
        const expectedParams = ['walletAddress', 'timestamp'];

        mycareController.validateDeactivateAccountParams(req, res, next);

        sandbox.assert.calledWith(mycareController.validateAccountParams, req, res, next, expectedParams);
    });

    it('can validate paramters when adding new account', () => {
        mycareController.validateAccountParams = sandbox.stub();

        const req = {
            body: {
                walletAddress,
                timestamp
            }
        };

        const next = () => {};
        const expectedParams = ['walletAddress', 'profileHash', 'timestamp'];

        mycareController.validateAddAccountParams(req, res, next);

        sandbox.assert.calledWith(mycareController.validateAccountParams, req, res, next, expectedParams);
    });
});