const azure = require('azure-storage');

const queueSvc = azure.createQueueService();
const queueName = process.env.AZURE_STORAGE_QUEUE_NAME;

/**
 * send message to queue
 * @param {String} messageText blockchain transaction details
 */
exports.createMessage = (messageText) => {
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
exports.deleteMessage = (message) => {
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
exports.getMessages = () => {
    const options = {
        numOfMessages: 10
        // visibilityTimeout: 5 * 60
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
exports.getQueueLength = () => {
    return new Promise((resolve, reject) => {
        queueSvc.getQueueMetadata(queueName, function (error, results, response) {
            if (error) reject(error);
            else resolve(results.approximateMessageCount);
        });
    });
};

exports.createQueue = () => {
    return new Promise((resolve, reject) => {
        queueSvc.createQueueIfNotExists(queueName, (error, results, response) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
};

/**
 * Message definition
 * @typedef {Message}
 * @property {String} messageId
 * @property {String} insertionTime
 * @property {String} expirationTime
 * @property {String} popReceipt
 * @property {String} timeNextVisible
 * @property {Number} dequeueCount
 * @property {String} messageText
 * @returns Message
 */