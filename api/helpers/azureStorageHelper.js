const appRoot = require('app-root-path');
const azure = require('azure-storage');
const azureLogger = require('winston-azuretable').AzureLogger;
const logger = require(`${appRoot}/config/winston`);
const envHelper = require(`${appRoot}/api/helpers/envHelper`);

const envConstants = envHelper.getConstants();

let queueSvc = azure.createQueueService(envConstants.AZURE_STORAGE_CONNECTION_STRING);
let queueName = envConstants.AZURE_STORAGE_QUEUE_NAME;

const tableStorageOptions = {
    account: getStorageAccountName(),
    tableName: envConstants.APP_LOGS_STORAGE_TABLE,
    key: getStorageAccountKey(),
    partitionKey: envConstants.PROFILE
};

logger.add(azureLogger, tableStorageOptions);

function getStorageAccountName() {
    const matches = /AccountName=(.*?);/.exec(envConstants.AZURE_STORAGE_CONNECTION_STRING);
    return matches[1];
}

function getStorageAccountKey() {
    const matches = /AccountKey=(.*?);/.exec(envConstants.AZURE_STORAGE_CONNECTION_STRING);
    return matches[1];
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
    createQueue
};