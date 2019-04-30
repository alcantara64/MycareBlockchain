const crypto = require('crypto');

exports.ISOstringToTimestamp = function (isoString) {
    const date = new Date(isoString);
    return Math.floor(date.getTime() / 1000);
};

exports.timeStampToISOstring = function (timestamp) {
    const time = Number(timestamp);
    return (new Date(time * 1000)).toISOString();
};

exports.createTimeStamp = function (timestamp) {
    return Math.floor(Date.now() / 1000);
};

exports.hashPassword = function (salt, password) {
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
};

/**
 * Provides functionality for asynchronous module loading
 */
exports.requireAsync = function (pathToModule, callback) {
    // require(pathToModule).initialize(callback);
    require(pathToModule)(callback);
};