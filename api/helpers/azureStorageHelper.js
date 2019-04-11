const appRoot = require('app-root-path');
const azure = require('azure-storage');
const azureKeyVault = require(`${appRoot}/api/middlewares/authentication/azureKeyVault`);

let queueSvc;
let queueName;

module.exports = function (callback) {
    getConnectionCredsFromVault().then((credentials) => {
        queueName = credentials.AZURE_STORAGE_QUEUE_NAME;
        queueSvc = azure.createQueueService(credentials.AZURE_STORAGE_CONNECTION_STRING);

        const storageHelper = { createMessage, deleteMessage, getMessages, getQueueLength, createQueue };
        callback(storageHelper);
    });
};

/**
 * Gets the needed credentials to connect to azure storage queue from Azure keyvault
 * @returns {Promise<{AZURE_STORAGE_QUEUE_NAME: String, AZURE_STORAGE_CONNECTION_STRING: String}>} connectionCredentials
 */
async function getConnectionCredsFromVault() {
    const AZURE_STORAGE_CONNECTION_STRING = await azureKeyVault.getSecret(process.env.AZURE_STORAGE_CONNECTION_STRING, '');
    const AZURE_STORAGE_QUEUE_NAME = await azureKeyVault.getSecret(process.env.AZURE_STORAGE_QUEUE_NAME, '');

    return {
        AZURE_STORAGE_QUEUE_NAME: AZURE_STORAGE_QUEUE_NAME.value,
        AZURE_STORAGE_CONNECTION_STRING: AZURE_STORAGE_CONNECTION_STRING.value
    };
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