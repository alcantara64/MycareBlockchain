const adalNode = require('adal-node'); // Used for authentication
const moment = require('moment');
const azureKeyVault = require('azure-keyvault');
const appRoot = require('app-root-path');
const logger = require(`${appRoot}/config/winston`);
const constants = require(`${appRoot}/api/constants/ScopeConstants`);

function authenticator(challenge, callback) {
    // Create a new authentication context.
    const context = new adalNode.AuthenticationContext(challenge.authorization);
    // Use the context to acquire an authentication token.
    // eslint-disable-next-line max-len
    return context.acquireTokenWithClientCredentials(challenge.resource, process.env.CLIENT_ID, process.env.CLIENT_SECRET, (err, tokenResponse) => {
        if (err) throw err;
        // Calculate the value to be set in the request's Authorization header and resume the call.
        const authorizationValue = `${tokenResponse.tokenType} ${tokenResponse.accessToken}`;
        return callback(null, authorizationValue);
    });
}

const credentials = new azureKeyVault.KeyVaultCredentials(authenticator);
const client = new azureKeyVault.KeyVaultClient(credentials);

logger.info(`client: ${client}`);

function createkey(keyname, callback) {
    logger.info(`Creating key with name: ${keyname}`);
    const keyType = 'RSA';
    // eslint-disable-next-line no-use-before-define
    client.createKey(process.env.VAULT_URI, keyname, keyType, getKeyOptions(), (err, result) => {
        if (err) {
            logger.error(`error occurred in createKey function : ${err.message}`);
            throw err;
        }
        logger.info(`Key created: ${JSON.stringify(result)}`);
        callback(result);
    });
}

function deletekey(keyname, callback) {
    logger.info('Deleting key...');
    client.deleteKey(process.env.VAULT_URI, keyname, (err, result) => {
        if (err) {
            logger.error(`error occurred in deletekey function : ${err.message}`);
            throw err;
        }
        logger.info(`Key deleted: ${JSON.stringify(result)}`);
        callback(result);
    });
}

function getallkeys(maxresults, callback) {
    logger.info(`Retrieving ${maxresults} keys...`);
    client.getKeys(process.env.VAULT_URI, maxresults, (err, result) => {
        if (err) {
            logger.error(`error occurred in getallkeys function : ${err.message}`);
            throw err;
        }
        logger.info(`${result.value.length} keys returned.`);
        callback(result);
    });
}

function encrypt(kid, textToEncrypt, callback) {
    logger.info(`Encrypting ${textToEncrypt}`);
    client.encrypt(kid, 'RSA-OAEP', new Buffer(textToEncrypt), (err, result) => {
        if (err) {
            logger.error(`error occurred in encrypt function : ${err.message}`);
            throw err;
        }
        logger.info(`Encryption result: ${JSON.stringify(result)}`);
        callback(result.result.toString('base64'));
    });
}

function decrypt(kid, cipherText, callback) {
    logger.info(`Decrypting value ${cipherText}`);
    client.decrypt(kid, 'RSA-OAEP', Buffer.from(cipherText, 'base64'), (err, result) => {
        if (err) {
            logger.error(`error occurred in decrypt function :  ${err.message}`);
            throw err;
        }
        logger.info(`Decryption result: ${JSON.stringify(result)}`);
        callback(result);
    });
}

function createSecret(secretName, secretValue, callback) {
    logger.info(`Creating new secret with name ${secretName} and value ${secretValue}`);
    const attributes = {
        expires: constants.AzureKeyVault_Expiration_Date
    };
    const secretOptions = {
        contentType: 'application/text',
        secretAttributes: attributes,
    };
    logger.info(`secretOptions: ${JSON.stringify(secretOptions, null, ' ')}`);
    client.setSecret(process.env.VAULT_URI, secretName, secretValue, secretOptions, (err, result) => {
        if (err) {
            logger.error(`error occurred in createSecret function :  ${err.message}`);
            throw err;
        }
        logger.info(`Secret written: ${JSON.stringify(result, null, ' ')}`);
        callback(result);
    });
}

function deleteSecret(secretName, callback) {
    logger.info(`Deleting secret with name ${secretName}`);

    client.deleteSecret(process.env.VAULT_URI, secretName, (err, result) => {
        if (err) {
            logger.error(`err: ${err.message}`);
            throw err;
        }
        logger.info('Secret deleted successfully');
        callback(result);
    });
}

async function getSecret(secretName, secretVersion) {

    const promise = new Promise((async (resolve, reject) => {
        try {

            client.getSecret(process.env.VAULT_URI, secretName, '', (err, result) => {
                if (err) {
                    logger.error(`error occurred in getSecret function :   ${err.message}`);
                    reject(err);
                }
                resolve(JSON.stringify(result));
            });
        } catch (error) {
            logger.error(`getSecret error : ${error}`);
        }
    }));
    const result = await promise;
    return result;
}

function getKeyOptions() {
    const attributes = {};
    attributes.enabled = true;
    attributes.notBefore = moment().toNow();
    attributes.expires = moment().add(1, 'year');

    const keyOptions = {};
    keyOptions.keySize = 2048;
    keyOptions.keyOps = ['encrypt', 'decrypt', 'sign', 'verify', 'wrapKey', 'unwrapKey'];
    keyOptions.tags = null;
    keyOptions.keyAttributes = JSON.stringify(attributes);

    return JSON.stringify(keyOptions);
}

module.exports.createkey = createkey;
module.exports.deletekey = deletekey;
module.exports.getallkeys = getallkeys;
module.exports.encrypt = encrypt;
module.exports.decrypt = decrypt;
module.exports.createSecret = createSecret;
module.exports.getSecret = getSecret;
module.exports.deleteSecret = deleteSecret;