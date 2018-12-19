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

describe('sharedAccessController', () => {
    let sharedAccessController;
    let sharedAccessService;
    let res;
    let resJSON;
    let contractHelper;
    let validators;

    const consent = {
        timestamp: '2018-11-28T13:01:04.956Z',
        scope: ['Medication', 'MessageDefinition', 'ServiceDefinition', 'Specimen'],
        dataSource: ['0x5EF18be6e742c63AA2Dab7F52C1B699040875808', '0xd9Ef690a2836b5e50098A391Ebd490A96a416EEc'],
        startDate: '2018-11-28T13:01:04.956Z',
        endDate: '2018-11-28T13:01:04.956Z',
        consentId: 'consent12',
        connectionId: 'connect1'
    };

    const transactionReceipt = {
        status: true,
        hash: '0x807c81e8a72b8e897dd820d2e482e3dcea744f316bb4f0ccd612da275241c28b00000000000029993999'
    };

    const walletAddress = '0x23ff33sd8ace82c72f82c28e82addecf23795fc';
    const timestamp = '2018-11-21T11:26:34.142Z';
    const ipfsHash = '282yg82gs3ed83h9nd93die93nd3ndemdudnndu3jdjd3ndeednu27d';

    beforeEach(() => {
        sharedAccessService = {};
        contractHelper = {};
        validators = {};

        resJSON = sandbox.spy();

        res = {
            status: sandbox.stub().returns({
                json: resJSON
            })
        };

        const imports = {};

        imports[`${appRoot}/api/services/sharedAccessService`] = sharedAccessService;
        imports[`${appRoot}/api/helpers/contractHelper`] = contractHelper;
        imports[`${appRoot}/api/shared/validators`] = validators;

        sharedAccessController = proxyquire(`${appRoot}/api/controllers/sharedAccessController`, imports);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('can add consent', async () => {
        sharedAccessService.addConsent = sandbox.stub().resolves(transactionReceipt);

        const req = {
            body: consent
        };

        await sharedAccessController.addConsent(req, res);

        sandbox.assert.calledWith(sharedAccessService.addConsent, req.body);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJSON, transactionReceipt);
    });

    it('add consent returns status of 500 when error occurs', async () => {
        sharedAccessService.addConsent = sandbox.stub().rejects('Invalid jsonRPC response');

        const req = {
            body: consent
        };

        await sharedAccessController.addConsent(req, res);

        sandbox.assert.calledWith(sharedAccessService.addConsent, req.body);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });

    it('can revoke consent', async () => {
        sharedAccessService.revokeConsent = sandbox.stub().resolves(transactionReceipt);

        const req = {
            body: {
                consentId: 'consent12',
                timestamp: '2018-11-28T14:23:28.233Z'
            }
        };

        await sharedAccessController.revokeConsent(req, res);

        sandbox.assert.calledWith(sharedAccessService.revokeConsent, req.body);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJSON, transactionReceipt);
    });

    it('add consent returns status of 500 when error occurs', async () => {
        sharedAccessService.revokeConsent = sandbox.stub().rejects('Invalid jsonRPC response');

        const req = {
            body: consent
        };

        await sharedAccessController.revokeConsent(req, res);

        sandbox.assert.calledWith(sharedAccessService.revokeConsent, req.body);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });

    it('canAccess returns status of 400 when consentId is missing', async () => {
        sharedAccessService.canAccess = sandbox.stub().rejects('Invalid jsonRPC response');

        const req = {
            params: {}
        };

        await sharedAccessController.canAccess(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: 'consentId is a required parameter'
        });
    });

    it('can verify access validity', async () => {
        sharedAccessService.canAccess = sandbox.stub().resolves(true);

        const req = {
            params: {
                consentId: '3kdeudd9dle9edmdo38fi'
            }
        };

        await sharedAccessController.canAccess(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJSON, {
            canAccess: true
        });
    });

    it('returns status 500 when verifying access fails', async () => {
        sharedAccessService.canAccess = sandbox.stub().rejects('Invalid jsonRPC response');

        const req = {
            params: {
                consentId: '3kdeudd9dle9edmdo38fi'
            }
        };

        await sharedAccessController.canAccess(req, res);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });

    it('get consent returns 400 status if consent is not found', async () => {
        sharedAccessService.getConsent = sandbox.stub().resolves(null);

        const req = {
            query: {
                consentId: '3kdeudd9dle9edmdo38fi',
                scope: ['Medication', 'Procedure']
            }
        };

        await sharedAccessController.getConsent(req, res);

        sandbox.assert.calledWith(sharedAccessService.getConsent, req.query.consentId, req.query.scope);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.NOT_FOUND.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: 'Consent not found'
        });
    });

    it('get consent returns 200 status when consent is found', async () => {
        sharedAccessService.getConsent = sandbox.stub().resolves(consent);

        const req = {
            query: {
                consentId: '3kdeudd9dle9edmdo38fi',
                scope: ['Medication', 'Procedure']
            }
        };

        await sharedAccessController.getConsent(req, res);

        sandbox.assert.calledWith(sharedAccessService.getConsent, req.query.consentId, req.query.scope);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJSON, consent);
    });

    it('get consent returns 500 status if error occurs while fetching consent', async () => {
        sharedAccessService.getConsent = sandbox.stub().rejects('Invalid jsonRPC response');

        const req = {
            query: {
                consentId: '3kdeudd9dle9edmdo38fi',
                scope: ['Medication', 'Procedure']
            }
        };

        await sharedAccessController.getConsent(req, res);

        sandbox.assert.calledWith(sharedAccessService.getConsent, req.query.consentId, req.query.scope);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });

    it('can save connection attempt', async () => {
        sharedAccessService.addConnectionAttempt = sandbox.stub().resolves(transactionReceipt);

        const req = {
            body: {
                created: '2018-12-11T14:21:00.404Z',
                connectionId: 'ddkd93jd8fir0d',
                from: '0x5EF18be6e742c63AA2Dab7F52C1B699040875808',
                to: '0xd9Ef690a2836b5e50098A391Ebd490A96a416EEc'
            }
        };

        await sharedAccessController.saveConnectionAttempt(req, res);

        sandbox.assert.calledWith(sharedAccessService.addConnectionAttempt, req.body);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJSON, transactionReceipt);
    });

    it('add connection attempt returns status 500 when error occurs', async () => {
        sharedAccessService.addConnectionAttempt = sandbox.stub().rejects('Invalid jsonRPC response');

        const req = {
            body: {
                created: '2018-12-11T14:21:00.404Z',
                connectionId: 'ddkd93jd8fir0d',
                from: '0x5EF18be6e742c63AA2Dab7F52C1B699040875808',
                to: '0xd9Ef690a2836b5e50098A391Ebd490A96a416EEc'
            }
        };

        await sharedAccessController.saveConnectionAttempt(req, res);

        sandbox.assert.calledWith(sharedAccessService.addConnectionAttempt, req.body);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });

    it('can update connection attempt', async () => {
        sharedAccessService.updateConnectionAttempt = sandbox.stub().resolves(transactionReceipt);

        const req = {
            body: {
                created: '2018-12-11T14:21:00.404Z',
                connectionId: 'ddkd93jd8fir0d',
                from: '0x5EF18be6e742c63AA2Dab7F52C1B699040875808',
                to: '0xd9Ef690a2836b5e50098A391Ebd490A96a416EEc'
            }
        };

        await sharedAccessController.updateConnectionAttempt(req, res);

        sandbox.assert.calledWith(sharedAccessService.updateConnectionAttempt, req.body);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJSON, transactionReceipt);
    });

    it('update connection attempt returns status 500 when error occurs', async () => {
        sharedAccessService.updateConnectionAttempt = sandbox.stub().rejects('Invalid jsonRPC response');

        const req = {
            body: {
                created: '2018-12-11T14:21:00.404Z',
                connectionId: 'ddkd93jd8fir0d',
                from: '0x5EF18be6e742c63AA2Dab7F52C1B699040875808',
                to: '0xd9Ef690a2836b5e50098A391Ebd490A96a416EEc'
            }
        };

        await sharedAccessController.updateConnectionAttempt(req, res);

        sandbox.assert.calledWith(sharedAccessService.updateConnectionAttempt, req.body);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });

    it('get consent returns 400 status when connectionId is missing', async () => {
        sharedAccessService.getConnectionAttempt = sandbox.stub().resolves(consent);

        const req = {
            params: {}
        };

        await sharedAccessController.getConnectionAttempt(req, res);

        sandbox.assert.notCalled(sharedAccessService.getConnectionAttempt);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: 'connectionId is a required parameter'
        });
    });

    it('get consent returns 200 status when connection attempt is found', async () => {
        sharedAccessService.getConnectionAttempt = sandbox.stub().resolves(consent);

        const req = {
            params: {
                connectionId: '3kdeudd9dle9edmdo38fi'
            }
        };

        await sharedAccessController.getConnectionAttempt(req, res);

        sandbox.assert.calledWith(sharedAccessService.getConnectionAttempt, req.params.connectionId);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.OK.CODE);
        sandbox.assert.calledWith(resJSON, consent);
    });

    it('get consent returns 404 status when connection attempt is not found', async () => {
        sharedAccessService.getConnectionAttempt = sandbox.stub().resolves(null);

        const req = {
            params: {
                connectionId: '3kdeudd9dle9edmdo38fi'
            }
        };

        await sharedAccessController.getConnectionAttempt(req, res);

        sandbox.assert.calledWith(sharedAccessService.getConnectionAttempt, req.params.connectionId);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.NOT_FOUND.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: 'Connection attempt not found'
        });
    });

    it('get consent returns 500 status if error occurs while fetching connection attempt', async () => {
        sharedAccessService.getConnectionAttempt = sandbox.stub().rejects('Invalid jsonRPC response');

        const req = {
            params: {
                connectionId: '3kdeudd9dle9edmdo38fi'
            }
        };

        await sharedAccessController.getConnectionAttempt(req, res);

        sandbox.assert.calledWith(sharedAccessService.getConnectionAttempt, req.params.connectionId);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });

    it('validateAddConsentParams returns status 400 if required field is missing', () => {
        const req = {
            body: {
                dataSource: consent.dataSource
            }
        };

        const result = {
            message: 'scope is required',
            missingParam: true
        };

        validators.validateRequiredParams = sandbox.stub().returns(result);

        const requiredFields = ['timestamp', 'scope', 'dataSource', 'startDate', 'endDate', 'consentId', 'connectionId'];

        sharedAccessController.validateAddConsentParams(req, res, () => {});

        sandbox.assert.calledWith(validators.validateRequiredParams, req.body, requiredFields);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: result.message
        });
    });

    it('validateAddConsentParams calls next if all parameters are valid', () => {
        const req = {
            body: {
                ...consent
            }
        };

        const result = {
            message: '',
            missingParam: false
        };

        validators.validateRequiredParams = sandbox.stub().returns(result);

        const requiredFields = ['timestamp', 'scope', 'dataSource', 'startDate', 'endDate', 'consentId', 'connectionId'];

        const next = sandbox.spy();

        sharedAccessController.validateAddConsentParams(req, res, next);
        sandbox.assert.calledWith(validators.validateRequiredParams, req.body, requiredFields);
        sandbox.assert.called(next);
    });

    it('validateAddConsentParams returns bad request if datasource is an empty array', () => {
        const req = {
            body: {
                ...consent,
                dataSource: []
            }
        };

        const result = {
            message: '',
            missingParam: false
        };

        validators.validateRequiredParams = sandbox.stub().returns(result);

        const requiredFields = ['timestamp', 'scope', 'dataSource', 'startDate', 'endDate', 'consentId', 'connectionId'];

        const next = sandbox.spy();

        sharedAccessController.validateAddConsentParams(req, res, next);
        sandbox.assert.calledWith(validators.validateRequiredParams, req.body, requiredFields);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: 'No datasource was specified'
        });
    });

    it('validateAddConsentParams returns bad request if scope is an empty array', () => {
        const req = {
            body: {
                ...consent,
                scope: []
            }
        };

        const result = {
            message: '',
            missingParam: false
        };

        validators.validateRequiredParams = sandbox.stub().returns(result);

        const requiredFields = ['timestamp', 'scope', 'dataSource', 'startDate', 'endDate', 'consentId', 'connectionId'];

        const next = sandbox.spy();

        sharedAccessController.validateAddConsentParams(req, res, next);
        sandbox.assert.calledWith(validators.validateRequiredParams, req.body, requiredFields);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: 'No scope was specified'
        });
    });

    it('validateAddConsentParams returns status 400 if timestamp fails validation', () => {
        const req = {
            body: {
                ...consent,
                timestamp: 'invalid_timestamp'
            }
        };

        const result = {
            message: '',
            missingParam: false
        };

        validators.validateRequiredParams = sandbox.stub().returns(result);

        const requiredFields = ['timestamp', 'scope', 'dataSource', 'startDate', 'endDate', 'consentId', 'connectionId'];

        const next = sandbox.spy();

        sharedAccessController.validateAddConsentParams(req, res, next);

        sandbox.assert.notCalled(next);

        sandbox.assert.calledWith(validators.validateRequiredParams, req.body, requiredFields);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: 'timestamp is not valid ISO8601 string'
        });
    });

    it('validateAddConsentParams returns status 500 if unknown error occurs', () => {
        // req without body will cause an error
        const req = {};

        const next = sandbox.spy();
        validators.validateRequiredParams = sandbox.stub();

        const requiredFields = ['timestamp', 'scope', 'dataSource', 'startDate', 'endDate', 'consentId', 'connectionId'];

        sharedAccessController.validateAddConsentParams(req, res, next);

        sandbox.assert.notCalled(next);

        sandbox.assert.calledWith(validators.validateRequiredParams, req.body, requiredFields);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });

    it('validateRevokeConsentParams returns status 400 if required field is missing', () => {
        const req = {
            body: {
                timestamp: consent.timestamp
            }
        };

        const result = {
            message: 'consentId is required',
            missingParam: true
        };

        validators.validateRequiredParams = sandbox.stub().returns(result);

        const requiredFields = ['timestamp', 'consentId'];

        sharedAccessController.validateRevokeConsentParams(req, res, () => {});

        sandbox.assert.calledWith(validators.validateRequiredParams, req.body, requiredFields);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: result.message
        });
    });

    it('validateRevokeConsentParams calls next if all parameters are valid', () => {
        const req = {
            body: {
                timestamp: consent.timestamp,
                consentId: 'ch233d83ndd93d9dn3'
            }
        };

        const result = {
            message: '',
            missingParam: false
        };

        validators.validateRequiredParams = sandbox.stub().returns(result);

        const requiredFields = ['timestamp', 'consentId'];
        const next = sandbox.spy();

        sharedAccessController.validateRevokeConsentParams(req, res, next);
        sandbox.assert.calledWith(validators.validateRequiredParams, req.body, requiredFields);
        sandbox.assert.called(next);
    });

    it('validateRevokeConsentParams returns status 500 if unknown error occurs', () => {
        // req without body will cause an error
        const req = {};

        const next = sandbox.spy();
        validators.validateRequiredParams = sandbox.stub();

        const requiredFields = ['timestamp', 'consentId'];

        sharedAccessController.validateRevokeConsentParams(req, res, next);

        sandbox.assert.notCalled(next);

        sandbox.assert.calledWith(validators.validateRequiredParams, req.query, requiredFields);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });

    it('validateRevokeConsentParams returns status 400 if timestamp fails validation', () => {
        const req = {
            body: {
                timestamp: 'invalid_time_stamp',
                consentId: 'ch233d83ndd93d9dn3'
            }
        };

        const result = {
            message: '',
            missingParam: false
        };

        validators.validateRequiredParams = sandbox.stub().returns(result);

        const requiredFields = ['timestamp', 'consentId'];

        const next = sandbox.spy();

        sharedAccessController.validateRevokeConsentParams(req, res, next);

        sandbox.assert.notCalled(next);

        sandbox.assert.calledWith(validators.validateRequiredParams, req.body, requiredFields);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: 'timestamp is not valid ISO8601 string'
        });
    });

    it('validateUpdateConnectionPayload returns status 400 if required field is missing', () => {
        const req = {
            body: {
                timestamp: consent.timestamp,
                connectionId: 'sgdhf77494jdjdo48fj39emdieu'
            }
        };

        const result = {
            message: 'accepted is required',
            missingParam: true
        };

        validators.validateRequiredParams = sandbox.stub().returns(result);

        const requiredFields = ['accepted', 'timestamp', 'connectionId'];

        sharedAccessController.validateUpdateConnectionPayload(req, res, () => {});

        sandbox.assert.calledWith(validators.validateRequiredParams, req.body, requiredFields);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: result.message
        });
    });

    it('validateUpdateConnectionPayload calls next if all parameters are valid', () => {
        const req = {
            body: {
                timestamp: consent.timestamp,
                connectionId: 'ch233d83ndd93d9dn3',
                accepted: true
            }
        };

        const result = {
            message: '',
            missingParam: false
        };

        validators.validateRequiredParams = sandbox.stub().returns(result);

        const requiredFields = ['accepted', 'timestamp', 'connectionId'];
        const next = sandbox.spy();

        sharedAccessController.validateUpdateConnectionPayload(req, res, next);
        sandbox.assert.calledWith(validators.validateRequiredParams, req.body, requiredFields);
        sandbox.assert.called(next);
    });

    it('validateUpdateConnectionPayload returns status 400 if timestamp fails validation', () => {
        const req = {
            body: {
                timestamp: 'invalid_time_stamp',
                connectionId: 'ch233d83ndd93d9dn3',
                accepted: true
            }
        };

        const result = {
            message: '',
            missingParam: false
        };

        validators.validateRequiredParams = sandbox.stub().returns(result);

        const requiredFields = ['accepted', 'timestamp', 'connectionId'];

        const next = sandbox.spy();

        sharedAccessController.validateUpdateConnectionPayload(req, res, next);

        sandbox.assert.notCalled(next);

        sandbox.assert.calledWith(validators.validateRequiredParams, req.body, requiredFields);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: 'timestamp is not valid ISO8601 string'
        });
    });

    it('validateAddConsentParams returns status 500 if unknown error occurs', () => {
        // req without body will cause an error
        const req = {};

        const next = sandbox.spy();
        validators.validateRequiredParams = sandbox.stub();

        const requiredFields = ['accepted', 'timestamp', 'connectionId'];

        sharedAccessController.validateUpdateConnectionPayload(req, res, next);

        sandbox.assert.notCalled(next);

        sandbox.assert.calledWith(validators.validateRequiredParams, req.body, requiredFields);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });

    it('validateSaveConnectionPayload returns status 400 if required field is missing', () => {
        const req = {
            body: {
                created: '2018-12-11T14:21:00.404Z',
                connectionId: 'ddkd93jd8fir0d',
                from: '0x5EF18be6e742c63AA2Dab7F52C1B699040875808'
            }
        };

        const result = {
            message: 'to is required',
            missingParam: true
        };

        validators.validateRequiredParams = sandbox.stub().returns(result);

        const requiredFields = ['created', 'from', 'to', 'connectionId'];

        sharedAccessController.validateSaveConnectionPayload(req, res, () => {});

        sandbox.assert.calledWith(validators.validateRequiredParams, req.body, requiredFields);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: result.message
        });
    });

    it('validateSaveConnectionPayload calls next if all parameters are valid', () => {
        const req = {
            body: {
                created: '2018-12-11T14:21:00.404Z',
                connectionId: 'ddkd93jd8fir0d',
                from: '0x5EF18be6e742c63AA2Dab7F52C1B699040875808',
                to: '0xd9Ef690a2836b5e50098A391Ebd490A96a416EEc'
            }
        };

        const result = {
            message: '',
            missingParam: false
        };

        validators.validateRequiredParams = sandbox.stub().returns(result);

        const requiredFields = ['created', 'from', 'to', 'connectionId'];
        const next = sandbox.spy();

        sharedAccessController.validateSaveConnectionPayload(req, res, next);
        sandbox.assert.calledWith(validators.validateRequiredParams, req.body, requiredFields);
        sandbox.assert.called(next);
    });

    it('validateSaveConnectionPayload returns status 400 if timestamp fails validation', () => {
        const req = {
            body: {
                created: 'in_valid_timestamp',
                connectionId: 'ddkd93jd8fir0d',
                from: '0x5EF18be6e742c63AA2Dab7F52C1B699040875808',
                to: '0xd9Ef690a2836b5e50098A391Ebd490A96a416EEc'
            }
        };

        const result = {
            message: '',
            missingParam: false
        };

        validators.validateRequiredParams = sandbox.stub().returns(result);

        const requiredFields = ['created', 'from', 'to', 'connectionId'];

        const next = sandbox.spy();

        sharedAccessController.validateSaveConnectionPayload(req, res, next);

        sandbox.assert.notCalled(next);

        sandbox.assert.calledWith(validators.validateRequiredParams, req.body, requiredFields);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: 'created is not valid ISO8601 string'
        });
    });

    it('validateAddConsentParams returns status 500 if unknown error occurs', () => {
        // req without body will cause an error
        const req = {};

        const next = sandbox.spy();
        validators.validateRequiredParams = sandbox.stub();

        const requiredFields = ['created', 'from', 'to', 'connectionId'];

        sharedAccessController.validateSaveConnectionPayload(req, res, next);

        sandbox.assert.notCalled(next);

        sandbox.assert.calledWith(validators.validateRequiredParams, req.body, requiredFields);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });

    // fffff
    it('validateGetConsentParams returns status 400 if required field is missing', () => {
        const req = {
            query: {
                consentId: 'ddkd93jd8fir0d'
            }
        };

        const result = {
            message: 'scope is required',
            missingParam: true
        };

        validators.validateRequiredParams = sandbox.stub().returns(result);

        const requiredFields = ['consentId', 'scope'];

        sharedAccessController.validateGetConsentParams(req, res, () => {});

        sandbox.assert.calledWith(validators.validateRequiredParams, req.query, requiredFields);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: result.message
        });
    });

    it('validateGetConsentParams calls next if all parameters are valid', () => {
        const req = {
            query: {
                consentId: 'ddkd93jd8fir0d',
                scope: JSON.stringify(consent.scope)
            }
        };

        const result = {
            message: '',
            missingParam: false
        };

        validators.validateRequiredParams = sandbox.stub().returns(result);

        const requiredFields = ['consentId', 'scope'];
        const next = sandbox.spy();

        sharedAccessController.validateGetConsentParams(req, res, next);
        sandbox.assert.calledWith(validators.validateRequiredParams, req.query, requiredFields);
        sandbox.assert.called(next);
    });

    it('validateGetConsentParams eturns status 400 if scope is an empty array', () => {
        const req = {
            query: {
                consentId: 'ddkd93jd8fir0d',
                scope: JSON.stringify([])
            }
        };

        const result = {
            message: '',
            missingParam: false
        };

        validators.validateRequiredParams = sandbox.stub().returns(result);

        const requiredFields = ['consentId', 'scope'];
        const next = sandbox.spy();

        sharedAccessController.validateGetConsentParams(req, res, next);
        sandbox.assert.calledWith(validators.validateRequiredParams, req.query, requiredFields);
        sandbox.assert.notCalled(next);

        sandbox.assert.calledWith(res.status, HTTP_STATUS.BAD_REQUEST.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: 'No scope was specified'
        });
    });

    it('validateAddConsentParams returns status 500 if unknown error occurs', () => {
        // req without body will cause an error
        const req = {};

        const next = sandbox.spy();
        validators.validateRequiredParams = sandbox.stub();

        const requiredFields = ['consentId', 'scope'];

        sharedAccessController.validateGetConsentParams(req, res, next);

        sandbox.assert.notCalled(next);

        sandbox.assert.calledWith(validators.validateRequiredParams, req.query, requiredFields);
        sandbox.assert.calledWith(res.status, HTTP_STATUS.INTERNAL_SERVER_ERROR.CODE);
        sandbox.assert.calledWith(resJSON, {
            message: HTTP_STATUS.INTERNAL_SERVER_ERROR.MESSAGE
        });
    });
});