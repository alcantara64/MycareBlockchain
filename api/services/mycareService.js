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

exports.DeactivateAccount = function (ownerAddress, _timestamp) {
    const timestamp = Math.floor((new Date(_timestamp)).getTime() / 1000);
    let data = api.DeactivateAccount(ownerAddress, timestamp).encodeABI();

    return contractHelper.sendTransaction(data);
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

exports.GetAccountCount = function () {
    return api.GetAccountCount().call();
};
