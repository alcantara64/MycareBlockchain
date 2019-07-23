const appRoot = require('app-root-path');
const azureKeyVault = require(`${appRoot}/api/middlewares/authentication/azureKeyVault`);
const secretNames = require(`${appRoot}/api/constants/envSecretNames`);

const secrets = {};

module.exports.initialize = async function initialize() {
    const getSecretsPromiseArr = secretNames.map(secret => azureKeyVault.getSecret(process.env[secret], ''));

    const result = await Promise.all(getSecretsPromiseArr);

    result.forEach((secret, index) => {
        secrets[secretNames[index]] = secret.value;
    });
};

const envConstants = {
    PORT: process.env.PORT,
    PROFILE: process.env.PROFILE || 'dev'
};

module.exports.getConstants = function getConstants() {
    return Object.assign({}, envConstants, secrets);
};