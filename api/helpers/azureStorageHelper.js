const appRoot = require('app-root-path');
const azure = require('azure-storage');
const { AzureBlobTransport } = require('mozenge-winston-azure-transport');
const logger = require(`${appRoot}/config/winston`);
const envHelper = require(`${appRoot}/api/helpers/envHelper`);
const azureKeyVault = require(`${appRoot}/api/middlewares/authentication/azureKeyVault`);

const envConstants = envHelper.getConstants();
const blobService = azure.createBlobService(envConstants.AZURE_STORAGE_CONNECTION_STRING);

const logsContainerName = envConstants.APP_LOGS_BLOB_CONTAINER;
let isGeneratingSharedAccessSignature = false;

let queueSvc = azure.createQueueService(envConstants.AZURE_STORAGE_CONNECTION_STRING);
let queueName = envConstants.AZURE_STORAGE_QUEUE_NAME;

let blobTransport = getBlobTransport();

function getBlobTransport() {
    return new AzureBlobTransport({
        containerUrl: envConstants.APP_LOGS_SHARED_ACCESS_SIGNATURE,
        nameFormat: 'mycareapi-logs/{yyyy}/{MM}/{dd}/info.log',
        retention: parseInt(envConstants.LOGS_RETENTION_DAYS, 10),
        onAzureStorageError
    });
}

logger.add(blobTransport);
async function onAzureStorageError(err) {
    const methodName = 'onAzureStorageError';
    if (+err.statusCode === 403 && !isGeneratingSharedAccessSignature) {
        try {
            logger.info(`${methodName} - error status 403 received. Attempting to generate shared access signature`);
            isGeneratingSharedAccessSignature = true;

            const sasUrl = generateSharedAccessSignatureUrl();

            await azureKeyVault.createSecret(process.env.APP_LOGS_SHARED_ACCESS_SIGNATURE, sasUrl);
            envConstants.APP_LOGS_SHARED_ACCESS_SIGNATURE = sasUrl;

            logger.remove(blobTransport);

            blobTransport = getBlobTransport();
            logger.add(blobTransport);

            logger.info(`${methodName} - generated and saved shared access signature successfully`);
        } catch (sasErr) {
            logger.error(`${methodName} - error occured attempting to generate and save shared access signature MSG: ${sasErr.message}`);
        } finally {
            isGeneratingSharedAccessSignature = false;
        }
    }
}

function generateSharedAccessSignatureUrl() {
    const startDate = new Date();
    const expiryDate = new Date(startDate);

    expiryDate.setDate(expiryDate.getDate() + parseInt(envConstants.SHARED_ACCESS_SIGNATURE_URL_VALIDITY_DAYS, 10));

    // !!Important - Permissions=racwdl ==> permissions need to be arranged like this or sas url will be rejected

    const { READ, DELETE, LIST, WRITE } = azure.BlobUtilities.SharedAccessPermissions;

    const sharedAccessPolicy = {
        AccessPolicy: {
            Permissions: `${READ}${WRITE}${DELETE}${LIST}`,
            Start: startDate,
            Expiry: expiryDate
        }
    };

    const token = blobService.generateSharedAccessSignature(logsContainerName, null, sharedAccessPolicy);
    return blobService.getUrl(logsContainerName, null, token, true);
}

/**
 * send message to queue
 * @param {String} messageText blockchain transaction details
 */
function createMessage(messageText) {
    return new Promise((resolve, reject) => {
        queueSvc.createMessage(queueName, messageText, function (error, results, response) {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};

/**
 * Delete message from queue. This should be called only after message has been processed successfully
 * @param {{ messageId: String, insertionTime: String, messageText: String, popReceipt: String }} message
 * Message object that was returned from a requst to get message
 * @returns {Promise}
 */
function deleteMessage(message) {
    return new Promise((resolve, reject) => {
        queueSvc.deleteMessage(queueName, message.messageId, message.popReceipt, function (error, response) {
            if (error) reject(error);
            else resolve(response);
        });
    });
};

/**
 * @typedef {Object} Message
 * @property {String} messageId
 * @property {String} insertionTime
 * @property {String} expirationTime
 * @property {String} popReceipt
 * @property {String} timeNextVisible
 * @property {Number} dequeueCount
 * @property {String} messageText original message saved to queue
 */

/**
 * @description Get messages in queue. Currently fetches max of `10` in a single batch
 * @return {Array<Message>} Returns Array of message
 */
function getMessages() {
    const options = {
        numOfMessages: 10
        // visibilityTimeout: 5 * 60 // this is commented now, but will be used later for scaling purposes
    };
    return new Promise((resolve, reject) => {
        queueSvc.getMessages(queueName, options, function (error, results, response) {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};

/**
 * Get total number of messages in the queue
 * @returns {number}
 */
function getQueueLength() {
    return new Promise((resolve, reject) => {
        queueSvc.getQueueMetadata(queueName, function (error, results, response) {
            if (error) reject(error);
            else resolve(results.approximateMessageCount);
        });
    });
};

function createQueue() {
    return new Promise((resolve, reject) => {
        queueSvc.createQueueIfNotExists(queueName, (error, results, response) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
};

module.exports = {
    createMessage,
    deleteMessage,
    getMessages,
    getQueueLength,
    createQueue,
    onAzureStorageError
};