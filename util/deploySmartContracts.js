const shell = require('shelljs');
const appRoot = require('app-root-path');

const logger = require(`${appRoot}/config/winston`);

const curProfile = process.env.PROFILE || 'dev';
const configPath = `${appRoot}/profiles/${curProfile}.env`;

const dotenv = require('dotenv').config({ path: configPath });

const azureKeyVault = require(`${appRoot}/api/middlewares/authentication/azureKeyVault`);

function getBlockchainCredentials(callback) {
    const secretNames = [
        'RPC_ENDPOINT',
        'METAMASK_ACCOUNT_MNEMONIC',
        'NETWORK_ID'
    ];

    const getSecretsPromiseArr = secretNames.map(secret => azureKeyVault.getSecret(process.env[secret], ''));

    const secrets = {};

    Promise.all(getSecretsPromiseArr).then((result) => {
        result.forEach((secret, index) => {
            secrets[secretNames[index]] = secret.value;
        });

        callback(secrets);
    });
}

function deployContracts() {
    getBlockchainCredentials((secrets) => {
        logger.info('SECRETS ARE');
        logger.info(JSON.stringify(secrets));

        shell.exec(`RPC_ENDPOINT="${secrets.RPC_ENDPOINT}" 
        METAMASK_ACCOUNT_MNEMONIC=${secrets.METAMASK_ACCOUNT_MNEMONIC}
        NETWORK_ID=${secrets.NETWORK_ID}
        npm run deploy:contracts`);
    });
}

deployContracts();