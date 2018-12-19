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

describe('policiesAndTermsController', () => {
    let policiesAndTermsController;
    let policiesAndTermsService;
    let res;
    let resJSON;
    let contractHelper;
    let validators;

    const transactionReceipt = {
        status: true,
        hash: '0x807c81e8a72b8e897dd820d2e482e3dcea744f316bb4f0ccd612da275241c28b00000000000029993999'
    };

    const walletAddress = '0x23ff33sd8ace82c72f82c28e82addecf23795fc';
    const timestamp = '2018-11-21T11:26:34.142Z';
    const ipfsHash = '282yg82gs3ed83h9nd93die93nd3ndemdudnndu3jdjd3ndeednu27d';

    beforeEach(() => {
        policiesAndTermsService = {};
        contractHelper = {};
        validators = {};

        resJSON = sandbox.spy();

        res = {
            status: sandbox.stub().returns({
                json: resJSON
            })
        };

        const imports = {};

        imports[`${appRoot}/api/services/policiesAndTermsService`] = policiesAndTermsService;
        imports[`${appRoot}/api/helpers/contractHelper`] = contractHelper;
        imports[`${appRoot}/api/shared/validators`] = validators;

        policiesAndTermsController = proxyquire(`${appRoot}/api/controllers/policiesAndTermsController`, imports);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('can add new document', async () => {
        policiesAndTermsService.addNewDocument = sandbox.stub().resolves(transactionReceipt);

        const req = {
            body: {
                ipfsHash
            }
        };

        await policiesAndTermsController.addNewDocument(req, res);

        sandbox.assert.calledWith(policiesAndTermsService.addNewDocument, req.body);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJSON, transactionReceipt);
    });

    it('add new document returns status of 500 error occurs', async () => {
        policiesAndTermsService.addNewDocument = sandbox.stub().rejects('Invalid jsonRPC response');

        const req = {
            body: {
                ipfsHash
            }
        };

        await policiesAndTermsController.addNewDocument(req, res);

        sandbox.assert.calledWith(policiesAndTermsService.addNewDocument, req.body);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });

    it('can save acceptance successfully', async () => {
        policiesAndTermsService.saveAcceptance = sandbox.stub().resolves(transactionReceipt);

        const req = {
            body: {
                walletAddress,
                timestamp,
                documentHash: ipfsHash
            }
        };

        await policiesAndTermsController.saveAcceptance(req, res);

        sandbox.assert.calledWith(policiesAndTermsService.saveAcceptance, req.body);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJSON, transactionReceipt);
    });

    it('save acceptance returns status of 500 error occurs', async () => {
        policiesAndTermsService.saveAcceptance = sandbox.stub().rejects('Invalid jsonRPC response');

        const req = {
            body: {
                walletAddress,
                timestamp,
                documentHash: ipfsHash
            }
        };

        await policiesAndTermsController.saveAcceptance(req, res);

        sandbox.assert.calledWith(policiesAndTermsService.saveAcceptance, req.body);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });

    it('getDocument returns status 400 when document hash is missing from params', async () => {
        policiesAndTermsService.getDocument = sandbox.stub();

        const req = {
            params: {}
        };

        await policiesAndTermsController.getDocument(req, res);

        sandbox.assert.notCalled(policiesAndTermsService.getDocument);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: 'documentHash is a required parameter'
        });
    });

    it('getDocument returns status 404 when no documentis found', async () => {
        policiesAndTermsService.getDocument = sandbox.stub().resolves(null);

        const req = {
            params: {
                documentHash: ipfsHash
            }
        };

        await policiesAndTermsController.getDocument(req, res);

        sandbox.assert.calledWith(policiesAndTermsService.getDocument, req.params.documentHash);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.NOT_FOUND.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: 'document not found'
        });
    });

    it('can get document successfully', async () => {
        const document = {
            timestamp: '2018-11-21T13:22:48.069Z',
            ipfsHash
        };

        policiesAndTermsService.getDocument = sandbox.stub().resolves(document);

        const req = {
            params: {
                documentHash: ipfsHash
            }
        };

        await policiesAndTermsController.getDocument(req, res);

        sandbox.assert.calledWith(policiesAndTermsService.getDocument, req.params.documentHash);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJSON, document);
    });

    it('get document returns statusof 500 when error occurs while fetching', async () => {
        policiesAndTermsService.getDocument = sandbox.stub().rejects('Invalid jsonRPC response');

        const req = {
            params: {
                documentHash: ipfsHash
            }
        };

        await policiesAndTermsController.getDocument(req, res);

        sandbox.assert.calledWith(policiesAndTermsService.getDocument, req.params.documentHash);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, { message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE });
    });

    it('getUserAcceptance returns status 400 when document hash is missing from query params', async () => {
        policiesAndTermsService.getUserAcceptance = sandbox.spy();

        const req = {
            query: {}
        };

        await policiesAndTermsController.getUserAcceptance(req, res);

        sandbox.assert.notCalled(policiesAndTermsService.getUserAcceptance);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: 'documentHash is a required parameter'
        });
    });

    it('getUserAcceptance returns status 400 when wallet is missing from query params', async () => {
        policiesAndTermsService.getUserAcceptance = sandbox.spy();

        const req = {
            query: {
                documentHash: ipfsHash
            }
        };

        await policiesAndTermsController.getUserAcceptance(req, res);

        sandbox.assert.notCalled(policiesAndTermsService.getUserAcceptance);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: 'walletAddress is a required parameter'
        });
    });

    it('returns status of 400 if acceptance is not found', async () => {
        policiesAndTermsService.getUserAcceptance = sandbox.stub().resolves(null);

        const req = {
            query: {
                documentHash: ipfsHash,
                walletAddress
            }
        };

        await policiesAndTermsController.getUserAcceptance(req, res);

        sandbox.assert.calledWith(policiesAndTermsService.getUserAcceptance, walletAddress, ipfsHash);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.NOT_FOUND.CODE);
        sandbox.assert.calledWith(resJSON, { message: 'acceptance record not found' });
    });

    it('can retrieve acceptance or policy or terms of service', async () => {
        const acceptance = {
            timestamp: '2018-11-21T13:22:48.069Z',
            documentHash: ipfsHash
        };
        policiesAndTermsService.getUserAcceptance = sandbox.stub().resolves(acceptance);

        const req = {
            query: {
                documentHash: ipfsHash,
                walletAddress
            }
        };

        await policiesAndTermsController.getUserAcceptance(req, res);

        sandbox.assert.calledWith(policiesAndTermsService.getUserAcceptance, walletAddress, ipfsHash);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJSON, acceptance);
    });

    it('getUserAcceptance returns statusof 500 when error occurs while fetching', async () => {
        policiesAndTermsService.getUserAcceptance = sandbox.stub().rejects('Invalid jsonRPC response');

        const req = {
            query: {
                documentHash: ipfsHash,
                walletAddress
            }
        };

        await policiesAndTermsController.getUserAcceptance(req, res);

        sandbox.assert.calledWith(policiesAndTermsService.getUserAcceptance, walletAddress, ipfsHash);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, { message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE });
    });

    it('validateAcceptancePayload returns status 400 if required field is missing', () => {
        const req = {
            body: {
                documentHash: ipfsHash,
                walletAddress
            }
        };

        const result = {
            message: 'walletAddress is required',
            missingParam: true
        };

        validators.validateRequiredParams = sandbox.stub().returns(result);

        const requiredFields = ['walletAddress', 'timestamp', 'documentHash'];

        policiesAndTermsController.validateAcceptancePayload(req, res, () => {});

        sandbox.assert.calledWith(validators.validateRequiredParams, req.body, requiredFields);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJSON, { message: result.message });
    });

    it('validateAcceptancePayload calls next if all parameters are valid', () => {
        const req = {
            body: {
                documentHash: ipfsHash,
                walletAddress,
                timestamp
            }
        };

        const result = {
            message: '',
            missingParam: false
        };

        validators.validateRequiredParams = sandbox.stub().returns(result);

        const requiredFields = ['walletAddress', 'timestamp', 'documentHash'];

        const next = sandbox.spy();

        policiesAndTermsController.validateAcceptancePayload(req, res, next);

        sandbox.assert.called(next);
    });

    it('validateAcceptancePayload returns status 400 if timestamp fails validation', () => {
        const req = {
            body: {
                documentHash: ipfsHash,
                walletAddress,
                timestamp: 'invalid_timestamp'
            }
        };

        const result = {
            message: '',
            missingParam: false
        };

        validators.validateRequiredParams = sandbox.stub().returns(result);

        const requiredFields = ['walletAddress', 'timestamp', 'documentHash'];

        const next = sandbox.spy();

        policiesAndTermsController.validateAcceptancePayload(req, res, next);

        sandbox.assert.notCalled(next);

        sandbox.assert.calledWith(validators.validateRequiredParams, req.body, requiredFields);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJSON, { message: 'timestamp is not valid ISO8601 string' });
    });

    it('validateAddDocumentPayload returns status of 400 when required parameter is missing', () => {
        const req = {
            body: {}
        };

        const result = {
            message: 'ipfsHash is a required parameter',
            missingParam: true
        };

        validators.validateRequiredParams = sandbox.stub().returns(result);

        const requiredFields = ['ipfsHash'];

        const next = sandbox.spy();

        policiesAndTermsController.validateAddDocumentPayload(req, res, next);

        sandbox.assert.notCalled(next);

        sandbox.assert.calledWith(validators.validateRequiredParams, req.body, requiredFields);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJSON, { message: result.message });
    });

    it('validateAddDocumentPayload calls next when theres no missing parameter', () => {
        const req = {
            body: {
                ipfsHash
            }
        };

        const result = {
            message: 'ipfsHash is a required parameter',
            missingParam: false
        };

        validators.validateRequiredParams = sandbox.stub().returns(result);

        const next = sandbox.spy();

        policiesAndTermsController.validateAddDocumentPayload(req, res, next);

        sandbox.assert.called(next);
    });
});