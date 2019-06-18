const appRoot = require('app-root-path');
// const dotenv = require('dotenv');
// dotenv.config();
const azureKeyVault = require(`${appRoot}/api/middlewares/authentication/azureKeyVault`);

let secrets;

module.exports.initialize = async function initialize() {
    // Blockchain
    const RPC_ENDPOINT = (await azureKeyVault.getSecret(process.env.RPC_ENDPOINT, '')).value;
    const ACCOUNT_ADDRESS = (await azureKeyVault.getSecret(process.env.ACCOUNT_ADDRESS, '')).value;
    const ACCOUNT_PRIVATE_KEY = (await azureKeyVault.getSecret(process.env.ACCOUNT_PRIVATE_KEY, '')).value;
    const NETWORK_ID = (await azureKeyVault.getSecret(process.env.NETWORK_ID, '')).value;
    const METAMASK_ACCOUNT_MNEMONIC = (await azureKeyVault.getSecret(process.env.METAMASK_ACCOUNT_MNEMONIC, '')).value;

    // Admin
    const ADMIN_EMAIL = (await azureKeyVault.getSecret(process.env.ADMIN_EMAIL, '')).value;
    const ADMIN_PASSWORD = (await azureKeyVault.getSecret(process.env.ADMIN_PASSWORD, '')).value;

    // email
    const EMAIL_HOST = (await azureKeyVault.getSecret(process.env.EMAIL_HOST, '')).value;
    const EMAIL_USER = (await azureKeyVault.getSecret(process.env.EMAIL_USER, '')).value;
    const EMAIL_PASS = (await azureKeyVault.getSecret(process.env.EMAIL_PASS, '')).value;

    // jwt
    const JWT_TOKEN = (await azureKeyVault.getSecret(process.env.JWT_TOKEN, '')).value;

    // database
    const MONGODB_URI = (await azureKeyVault.getSecret(process.env.MONGODB_URI, '')).value;

    // azure storage
    const AZURE_STORAGE_CONNECTION_STRING = (await azureKeyVault.getSecret(process.env.AZURE_STORAGE_CONNECTION_STRING, '')).value;
    const AZURE_STORAGE_QUEUE_NAME = (await azureKeyVault.getSecret(process.env.AZURE_STORAGE_QUEUE_NAME, '')).value;

    secrets = {
        RPC_ENDPOINT,
        ACCOUNT_ADDRESS,
        ACCOUNT_PRIVATE_KEY,
        NETWORK_ID,
        METAMASK_ACCOUNT_MNEMONIC,
        ADMIN_EMAIL,
        ADMIN_PASSWORD,
        EMAIL_HOST,
        EMAIL_USER,
        EMAIL_PASS,
        JWT_TOKEN,
        MONGODB_URI,
        AZURE_STORAGE_CONNECTION_STRING,
        AZURE_STORAGE_QUEUE_NAME
    };
};

const envConstants = {
    PORT: process.env.PORT
};

module.exports.getConstants = function getConstants() {
    return Object.assign({}, envConstants, secrets);
};