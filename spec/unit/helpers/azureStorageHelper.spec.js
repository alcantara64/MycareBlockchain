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
    let logger;
    let AzureBlobTransport;
    let blobTransport;

    const accountName = 'cwest-app';
    const accountKey = '93e3HYRtaN2ILXf2Q8dreacb99E8nK3LXDIJqHisnr86cGUVXQXgdUwZeojdeur9/YK8ohkeudhu383mJdw8sg==';

    const env = {
        AZURE_STORAGE_CONNECTION_STRING: `DefaultEndpointsProtocol=https;AccountName=${accountName};AccountKey=${accountKey};EndpointSuffix=core.windows.net`,
        AZURE_STORAGE_QUEUE_NAME: 'helloQueue',
        APP_LOGS_STORAGE_TABLE: 'MyAppLogs',
        PROFILE: 'dev',
        APP_LOGS_BLOB_CONTAINER: 'https://mystorage.blob.core.windows.net/errors?sv=2018-03-28&sr=c&sig=x&st=2019-01-01T00:00:00Z&se=2219-01-01T00:00:00Z&sp=rwdl',
    };

    beforeEach(() => {
        queueSvc = {};

        envHelper = {
            getConstants() {
                return { ...env };
            }
        };

        blobTransport = {
            log: () => { }
        };

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
            add: sandbox.stub(),
            '@noCallThru': true
        };

        azureStorage = {
            createQueueService: sandbox.stub().returns(queueSvc)
        };

        const imports = {
            'azure-storage': azureStorage,
            'mozenge-winston-azure-transport': { AzureBlobTransport },
            [`${appRoot}/api/helpers/envHelper`]: envHelper,
            [`${appRoot}/config/winston`]: logger
        };

        azureStorageHelper = proxyquire(`${appRoot}/api/helpers/azureStorageHelper`, imports);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('adds azure table storage transport on initialization', () => {
        const blobTransportConfig = {
            containerUrl: env.APP_LOGS_BLOB_CONTAINER,
            nameFormat: 'blockchainApi-logs/{yyyy}/{MM}/{dd}/info.log',
            retention: 365
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
});