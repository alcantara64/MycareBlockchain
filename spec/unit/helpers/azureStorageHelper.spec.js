const appRoot = require('app-root-path');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const dotenv = require('dotenv');
dotenv.config();

const sandbox = sinon.createSandbox();
const { assert } = sandbox;

describe('azureStorageHelper', () => {
    let azureStorageHelper;
    let azureStorage;
    let queueSvc;
    let envHelper;
    let blobService;
    let logger;
    let AzureBlobTransport;
    let blobTransport;
    let azureKeyVault;

    const accountName = 'cwest-app';
    const accountKey = '93e3HYRtaN2ILXf2Q8dreacb99E8nK3LXDIJqHisnr86cGUVXQXgdUwZeojdeur9/YK8ohkeudhu383mJdw8sg==';

    const env = {
        AZURE_STORAGE_CONNECTION_STRING: `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`,
        AZURE_STORAGE_QUEUE_NAME: 'helloQueue',
        APP_LOGS_STORAGE_TABLE: 'MyAppLogs',
        PROFILE: 'dev',
        APP_LOGS_SHARED_ACCESS_SIGNATURE: 'https://mystorage.blob.core.windows.net/errors?sv=2018-03-28&sr=c&sig=x&st=2019-01-01T00:00:00Z&se=2219-01-01T00:00:00Z&sp=rwdl',
        APP_LOGS_BLOB_CONTAINER: 'app-logs',
        SHARED_ACCESS_SIGNATURE_URL_VALIDITY_DAYS: '365',
        LOGS_RETENTION_DAYS: '365'
    };

    beforeEach(() => {
        azureKeyVault = {};
        queueSvc = {};

        envHelper = {
            getConstants() {
                return { ...env };
            }
        };

        blobTransport = {
            log: () => { }
        };

        blobService = {};

        AzureBlobTransport = function AzureBlobTransportConstructor(args) {
            Object.assign(AzureBlobTransport, {
                instance: sandbox.stub()
            });

            AzureBlobTransport.instance(args);
            return blobTransport;
        };

        logger = {
            info: () => { },
            error: () => { },
            remove: sandbox.stub(),
            add: sandbox.stub(),
            '@noCallThru': true
        };

        azureStorage = {
            createQueueService: sandbox.stub().returns(queueSvc),
            createBlobService: sandbox.stub().returns(blobService)
        };

        const imports = {
            'azure-storage': azureStorage,
            'mozenge-winston-azure-transport': { AzureBlobTransport },
            [`${appRoot}/api/helpers/envHelper`]: envHelper,
            [`${appRoot}/config/winston`]: logger,
            [`${appRoot}/api/middlewares/authentication/azureKeyVault`]: azureKeyVault
        };

        azureStorageHelper = proxyquire(`${appRoot}/api/helpers/azureStorageHelper`, imports);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('adds azure table storage transport on initialization', () => {
        const blobTransportConfig = {
            containerUrl: env.APP_LOGS_SHARED_ACCESS_SIGNATURE,
            nameFormat: 'mycareapi-logs/{yyyy}/{MM}/{dd}/info.log',
            retention: +env.LOGS_RETENTION_DAYS,
            onAzureStorageError: azureStorageHelper.onAzureStorageError
        };
        assert.calledWith(AzureBlobTransport.instance, blobTransportConfig);
        assert.calledWith(logger.add, blobTransport);
    });

    it('initializes azure storage client on load', () => {
        assert.called(azureStorage.createQueueService);
    });

    it('can create message', async () => {
        const messageText = 'hello world';
        const results = {
            messageId: 'AAVVVBD72HJS92Shs2w228'
        };
        queueSvc.createMessage = sandbox.stub().yields(null, results);

        const response = await azureStorageHelper.createMessage(messageText);

        assert.calledWith(queueSvc.createMessage, env.AZURE_STORAGE_QUEUE_NAME, messageText);
        assert.match(response, results);
    });

    it('can delete a message', async () => {
        const message = {
            messageId: 'cf9b8ff8-8072-43d8-bcfe-5efc0e007e60',
            insertionTime: 'Wed, 03 Apr 2019 18:04:20 GMT',
            expirationTime: 'Wed, 10 Apr 2019 18:04:20 GMT',
            popReceipt: 'AgAAAAMAAAAAAAAAcsh0/Ujq1AE=',
            timeNextVisible: 'Wed, 03 Apr 2019 18:13:51 GMT',
            dequeueCount: 2,
            messageText: 'Hello world!'
        };

        const results = {
            messageId: 'AAVVVBD72HJS92Shs2w228'
        };

        queueSvc.deleteMessage = sandbox.stub().yields(null, results);

        const response = await azureStorageHelper.deleteMessage(message);

        assert.calledWith(queueSvc.deleteMessage, env.AZURE_STORAGE_QUEUE_NAME, message.messageId, message.popReceipt);
        assert.match(response, results);
    });

    it('can get messages from queue', async () => {
        const options = {
            numOfMessages: 10
        };
        const message = {
            messageId: 'cf9b8ff8-8072-43d8-bcfe-5efc0e007e60',
            insertionTime: 'Wed, 03 Apr 2019 18:04:20 GMT',
            expirationTime: 'Wed, 10 Apr 2019 18:04:20 GMT',
            popReceipt: 'AgAAAAMAAAAAAAAAcsh0/Ujq1AE=',
            timeNextVisible: 'Wed, 03 Apr 2019 18:13:51 GMT',
            dequeueCount: 2,
            messageText: 'Hello world!'
        };

        const results = [message];

        queueSvc.getMessages = sandbox.stub().yields(null, results);

        const response = await azureStorageHelper.getMessages(message);

        assert.calledWith(queueSvc.getMessages, env.AZURE_STORAGE_QUEUE_NAME, options);
        assert.match(response, results);
    });

    it('can get total number of items in queue', async () => {
        const results = {
            approximateMessageCount: 4
        };
        queueSvc.getQueueMetadata = sandbox.stub().yields(null, results);

        const response = await azureStorageHelper.getQueueLength();

        assert.calledWith(queueSvc.getQueueMetadata, env.AZURE_STORAGE_QUEUE_NAME);
        assert.match(response, results.approximateMessageCount);
    });

    it('can create queue', async () => {
        const results = {
            queueId: 'shsjshsusns262828'
        };
        queueSvc.createQueueIfNotExists = sandbox.stub().yields(null, results);

        const response = await azureStorageHelper.createQueue();

        assert.calledWith(queueSvc.createQueueIfNotExists, env.AZURE_STORAGE_QUEUE_NAME);
        assert.match(response, results);
    });

    describe('onAzureStorageError', () => {
        it('does not generate shared access signature statusCode is not 403', async () => {
            const error = {
                name: 'StorageError',
                message: 'Server failed to authenticate the request. Make sure the value of Authorization header is formed correctly including the signature.\nRequestId:0c5f4a2e-601e-0150-5624-5dbfee000000\nTime:2019-08-27T22:09:37.8862339Z',
                code: 'AuthenticationFailed',
                authenticationerrordetail: 'Signature fields not well formed.',
                statusCode: 400,
                requestId: '0c5f4a2e-601e-0150-5624-5dbfee044000',
            };

            azureKeyVault.createSecret = sandbox.stub();
            blobService.generateSharedAccessSignature = sandbox.stub();

            azureStorage.BlobUtilities = {
                SharedAccessPermissions: {
                    READ: 'r',
                    WRITE: 'w',
                    DELETE: 'd',
                    LIST: 'l',
                    CREATE: 'c',
                    ADD: 'a',
                },
            };

            await azureStorageHelper.onAzureStorageError(error);

            assert.notCalled(azureKeyVault.createSecret);
            assert.notCalled(blobService.generateSharedAccessSignature);
        });

        it('generates shared access signature statusCode is 403', async () => {
            const error = {
                name: 'StorageError',
                message: 'Server failed to authenticate the request. Make sure the value of Authorization header is formed correctly including the signature.\nRequestId:0c5f4a2e-601e-0150-5624-5dbfee000000\nTime:2019-08-27T22:09:37.8862339Z',
                code: 'AuthenticationFailed',
                authenticationerrordetail: 'Signature fields not well formed.',
                statusCode: 403,
                requestId: '0c5f4a2e-601e-0150-5624-5dbfee044000',
            };

            azureKeyVault.createSecret = sandbox.stub();

            const sharedAccessSig = '?st=2019-08-28T12%3A32%3A58Z&se=2019-08-29T12%3A32%3A58Z&sp=rl&sv=2018-03-28&sr=c&sig=u5zMXr0ptOz7lb%2FwunU4zgjRRKSCQ0H8agwhcxJoF6k%3D';
            const sasUrl = `https://mystorage.blob.core.windows.net/logs${sharedAccessSig}`
            blobService.generateSharedAccessSignature = sandbox.stub().returns(sharedAccessSig);
            blobService.getUrl = sandbox.stub().returns(sasUrl);

            azureStorage.BlobUtilities = {
                SharedAccessPermissions: {
                    READ: 'r',
                    WRITE: 'w',
                    DELETE: 'd',
                    LIST: 'l',
                    CREATE: 'c',
                    ADD: 'a'
                }
            };

            const blobTransportConfig = {
                containerUrl: sasUrl,
                nameFormat: 'mycareapi-logs/{yyyy}/{MM}/{dd}/info.log',
                retention: +env.LOGS_RETENTION_DAYS,
                onAzureStorageError: azureStorageHelper.onAzureStorageError
            };

            await azureStorageHelper.onAzureStorageError(error);

            assert.calledWith(azureKeyVault.createSecret, process.env.APP_LOGS_SHARED_ACCESS_SIGNATURE, sasUrl);
            assert.calledWith(blobService.generateSharedAccessSignature, env.APP_LOGS_BLOB_CONTAINER, null);
            assert.calledWith(blobService.getUrl, env.APP_LOGS_BLOB_CONTAINER, null);
            assert.calledWith(AzureBlobTransport.instance, blobTransportConfig);
            assert.calledWith(logger.add, blobTransport);
            assert.calledWith(logger.remove, blobTransport);
        });
    });
});