const appRoot = require('app-root-path');
const helperMethods = require(`${appRoot}/api/helpers/helperMethods`);
const { contractNames, ContractHelper } = require(`${appRoot}/api/helpers/contractHelper`);
const { GAS_LIMIT } = require(`${appRoot}/api/constants/transactionConstants`);

const contractHelper = new ContractHelper(contractNames.MYCARE);
const api = contractHelper.contractMethods();

exports.AddAccount = async function AddAccount (payload) {
    const { walletAddress, profileHash } = payload;
    const accountTypeValue = await api.GetAccountTypeValueFromName(payload.accountType).call();
    const timestamp = helperMethods.ISOstringToTimestamp(payload.timestamp);
    let data = await api.AddAccount(walletAddress, profileHash, timestamp, accountTypeValue).encodeABI();

    return contractHelper.sendTransaction(data, GAS_LIMIT.MYCARE.ADD_ACCOUNT);
};

exports.AddAccountType = async function AddAccountType(accountTypeName) {
    let data = await api.AddAccountType(accountTypeName).encodeABI();
    return contractHelper.sendTransaction(data, GAS_LIMIT.MYCARE.ADD_ACCOUNT_TYPE);
};

exports.DeactivateAccount = function (ownerAddress, _timestamp) {
    const timestamp = helperMethods.ISOstringToTimestamp(_timestamp);
    let data = api.DeactivateAccount(ownerAddress, timestamp).encodeABI();

    return contractHelper.sendTransaction(data, GAS_LIMIT.MYCARE.DEACTIVATE_ACCOUNT);
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

    const accountTypeName = await api.GetAccountTypeNameFromValue(account.accountType).call();
    account.accountType = accountTypeName;

    return account;
};

exports.GetAccountCount = function () {
    return api.GetAccountCount().call();
};

exports.AccountTypeExists = async function (accountTypeName) {
    const accountTypeExists = await api.AccountTypeExists(accountTypeName).call();
    return accountTypeExists;
};
