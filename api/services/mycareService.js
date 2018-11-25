const appRoot = require('app-root-path');
// const { contractNames, ContractHelper } = require(`../helpers/contractHelper`);
const { contractNames, ContractHelper } = require(`${appRoot}/api/helpers/contractHelper`);
const logger = require(`${appRoot}/config/winston`);

const contractHelper = new ContractHelper(contractNames.MYCARE);
const api = contractHelper.contractMethods();

exports.AddAccount = async function AddAccount (payload) {
    const { walletAddress, profileHash } = payload;
    const timestamp = Math.floor((new Date(payload.timestamp)).getTime() / 1000);
    let data = api.AddAccount(walletAddress, profileHash, timestamp).encodeABI();

    return contractHelper.sendTransaction(data);
};

exports.deactivateAccount = function deactivateAccount(ownerAddress, timestamp) {
    MYCARE.methods.DeactivateAccount(ownerAddress, timestamp)
        .estimateGas()
        .then(estimatedGas => {
            return MYCARE.methods.DeactivateAccount(ownerAddress, timestamp)
                .send({
                    from: ACCOUNT_BASE,
                    gas: estimatedGas,
                }, (err, result) => {
                    if (err) {
                        logger.error(`Account Deactivation failed ${err}`);
                    } else {
                        logger.info('Account Deactivation was successfully');
                    }
                })
        });
};

exports.GetAccount = async function (param, isWalletAddress = true) {
    let account;

    if (isWalletAddress) {
        account = await api.GetAccount(param).call();
    } else {
        account = await api.GetAccountByProfile(param).call();
    }

    if (!account.isEntity) {
        return null;
    }

    account.created = (new Date(+account.created)).toISOString();
    account.updated = (new Date(+account.updated)).toISOString();

    return account;
};

// GDH - these need to be made properly async !
exports.GetAccountCount = function GetAccountCount() {
    MYCARE.methods.Count().call().then((f) => {
        logger.info(`Count: ${f}`);
        return f;
    });
};
