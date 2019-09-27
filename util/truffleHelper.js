const shell = require('shelljs');
const appRoot = require('app-root-path');
const program = require('commander');

const curProfile = process.env.PROFILE || 'dev';
const configPath = `${appRoot}/profiles/${curProfile}.env`;

require('dotenv').config({ path: configPath });

const azureKeyVault = require(`${appRoot}/api/middlewares/authentication/azureKeyVault`);

program
    .version('"Truffle commands runner" -v0.1.0', '-v, --version')
    .option('-m, --migrate', 'Migrate smart contracts')
    .option('-t, --test', 'Run smart contract tests')
    .option('-c, --coverage', 'Run code coverage analysis')
    .parse(process.argv);

let truffleCommand = '';

if (program.migrate) {
    truffleCommand = 'truffle migrate --reset --all --network mainnet';
} else if (program.test) {
    truffleCommand = 'truffle test';
} else if (program.coverage) {
    truffleCommand = `./node_modules/.bin/solidity-coverage`;
} else {
    const errMsg = 'Invalid or no command line options supplied';
    throw new Error(errMsg);
}

function getBlockchainCredentials(callback) {
    const secretNames = [
        'RPC_ENDPOINT',
        'NETWORK_ID',
        'ACCOUNT_ADDRESS',
        'ACCOUNT_PRIVATE_KEY'
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

function runTruffleCommand() {
    getBlockchainCredentials((secrets) => {
        shell.exec(`RPC_ENDPOINT="${secrets.RPC_ENDPOINT}" 
        NETWORK_ID=${secrets.NETWORK_ID}
        ACCOUNT_ADDRESS=${secrets.ACCOUNT_ADDRESS}
        ACCOUNT_PRIVATE_KEY=${secrets.ACCOUNT_PRIVATE_KEY}
        ${truffleCommand}`);
    });
}

runTruffleCommand();