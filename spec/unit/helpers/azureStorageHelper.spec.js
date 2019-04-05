const appRoot = require('app-root-path');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

const sandbox = sinon.createSandbox();
const { assert } = sandbox;

describe('azureStorageHelper', () => {
    let azureStorageHelper;
    let azureStorage;
    let queueSvc;

    const queueName = process.env.AZURE_STORAGE_QUEUE_NAME;

    beforeEach(() => {
        queueSvc = {};

        azureStorage = {
            createQueueService: sandbox.stub().returns(queueSvc)
        };

        const imports = {
            'azure-storage': azureStorage
        };

        azureStorageHelper = proxyquire(`${appRoot}/api/helpers/azureStorageHelper`, imports);
    });

    afterEach(() => {
        sandbox.restore();
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

        assert.calledWith(queueSvc.createMessage, queueName, messageText);
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

        assert.calledWith(queueSvc.deleteMessage, queueName, message.messageId, message.popReceipt);
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

        assert.calledWith(queueSvc.getMessages, queueName, options);
        assert.match(response, results);
    });

    it('can get total number of items in queue', async () => {
        const results = {
            approximateMessageCount: 4
        };
        queueSvc.getQueueMetadata = sandbox.stub().yields(null, results);

        const response = await azureStorageHelper.getQueueLength();

        assert.calledWith(queueSvc.getQueueMetadata, queueName);
        assert.match(response, results.approximateMessageCount);
    });

    it('can create queue', async () => {
        const results = {
            queueId: 'shsjshsusns262828'
        };
        queueSvc.createQueueIfNotExists = sandbox.stub().yields(null, results);

        const response = await azureStorageHelper.createQueue();

        assert.calledWith(queueSvc.createQueueIfNotExists, queueName);
        assert.match(response, results);
    });
});