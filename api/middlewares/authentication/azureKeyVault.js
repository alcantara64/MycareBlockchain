const adalNode = require('adal-node'); // Used for authentication
const moment = require('moment');
const azureKeyVault = require('azure-keyvault');
const appRoot = require('app-root-path');
const logger = require(`${appRoot}/config/winston`);
const constants = require(`${appRoot}/api/constants/Common`);

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

function createkey(keyname) {
    logger.info(`Creating key with name: ${keyname}`);
    const keyType = 'RSA';
    // eslint-disable-next-line no-use-before-define
    return client.createKey(process.env.VAULT_URI, keyname, keyType, getKeyOptions());
}

function deletekey(keyname) {
    logger.info('Deleting key...');
    return client.deleteKey(process.env.VAULT_URI, keyname);
}

function getallkeys(maxresults) {
    logger.info(`Retrieving ${maxresults} keys...`);
    return client.getKeys(process.env.VAULT_URI, maxresults);
}

async function encrypt(kid, textToEncrypt) {
    logger.info(`Encrypting ${textToEncrypt}`);
    const { result } = await client.encrypt(kid, 'RSA-OAEP', Buffer.from(textToEncrypt));

    return result.toString('base64');
}

function decrypt(kid, cipherText) {
    logger.info(`Decrypting value ${cipherText}`);
    return client.decrypt(kid, 'RSA-OAEP', Buffer.from(cipherText, 'base64'));
}

function createSecret(secretName, secretValue) {
    logger.info(`Creating new secret with name ${secretName}`);
    const attributes = {
        expires: constants.AzureKeyVault_Expiration_Date
    };
    const secretOptions = {
        contentType: 'application/text',
        secretAttributes: attributes
    };
    logger.info(`secretOptions: ${JSON.stringify(secretOptions, null, ' ')}`);
    return client.setSecret(process.env.VAULT_URI, secretName, secretValue, secretOptions);
}

function deleteSecret(secretName) {
    logger.info(`Deleting secret with name ${secretName}`);

    return client.deleteSecret(process.env.VAULT_URI, secretName);
}

async function getSecret(secretName) {
    return client.getSecret(process.env.VAULT_URI, secretName, '')
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