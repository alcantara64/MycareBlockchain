const appRoot = require('app-root-path');
const helperMethods = require(`${appRoot}/api/helpers/helperMethods`);
const { contractNames, ContractHelper } = require(`${appRoot}/api/helpers/contractHelper`);

const contractHelper = new ContractHelper(contractNames.MYCARE);
const api = contractHelper.contractMethods();

exports.AddAccount = async function AddAccount (payload) {
    const { walletAddress, profileHash } = payload;
    const timestamp = helperMethods.ISOstringToTimestamp(payload.timestamp);
    let data = api.AddAccount(walletAddress, profileHash, timestamp).encodeABI();

    return contractHelper.sendTransaction(data);
};

exports.DeactivateAccount = function (ownerAddress, _timestamp) {
    const timestamp = helperMethods.ISOstringToTimestamp(_timestamp);
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

    account.created = helperMethods.timeStampToISOstring(account.created);
    account.updated = helperMethods.timeStampToISOstring(account.updated);

    return account;
};

exports.GetAccountCount = function () {
    return api.GetAccountCount().call();
};
