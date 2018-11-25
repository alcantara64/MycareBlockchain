const appRoot = require('app-root-path');
const { contractNames, ContractHelper } = require(`../helpers/contractHelper`);
const logger = require(`${appRoot}/config/winston`);

const contractHelper = new ContractHelper(contractNames.MYCARE);
const api = contractHelper.contractMethods();

exports.AddAccount = async function AddAccount (payload) {
    const { walletAddress, profileHash } = payload;
    const timestamp = Math.floor((new Date(payload.timestamp)).getTime() / 1000);
    let data = api.AddAccount(walletAddress, profileHash, timestamp).encodeABI();

    return contractHelper.sendTransaction(data);

    // try {
    //     const receipt = await contractHelper.sendTransaction(data);
    //     logger.info('Add Account to blochain successful');
    //     logger.info(receipt);
    // } catch (err) {
    //     logger.error('Add account to blockchain failed');
    //     logger.error(err);
    //     throw err;
    // }
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
}

exports.GetAccountByAddress = function GetAccountByAddress(myAddress) {
    return MYCARE.methods.GetAccount(myAddress).send({
        from: ACCOUNT_BASE,
        gas: 30000,
    }, (err, result) => {
        if (err) {
            logger.error(`${result}`);
            return {};
        }
        logger.info(`${result}`);
        const hash = this.toAscii(result[1]);
        return {
            owner: result[0],
            ipfs_hash: hash,
            profile: result[2]
        };
    });
};

exports.GetAccountByProfile = function GetAccountByProfile(profile) {
    const encodedProfile = this.fromAscii(profile);
    MYCARE.methods.GetAcountByProfile(encodedProfile).then((err, result) => {
        if (err) {
            logger.info(`${err}`);
            return {};
        }
        logger.info(`${result}`);
        const hash = this.toAscii(result[1]);
        return {
            owner: result[0],
            ipfs_hash: hash,
            profile: result[2]
        };
    });
};

// GDH - these need to be made properly async !
exports.GetAccountCount = function GetAccountCount() {
    MYCARE.methods.Count().call().then((f) => {
        logger.info(`Count: ${f}`);
        return f;
    });
};

/** ******************************************************************************************* */
/* Documents                                                                                     */
/** ******************************************************************************************* */

exports.AddDocument = function AddDocument(owner, by, timestamp, ipfsHash, filePass) {
    logger.info(`Adding document hash: ${ipfsHash}, for: ${owner}`);
    // TODO FIX THIS - need to if we are inserting on behalf of someone
    logger.info(`MyCareHelper: ipfsHash: ${ipfsHash}`);
    MYCARE.methods.addPersonalRecord(owner, ipfsHash, filePass, timestamp).send({
        from: ACCOUNT_BASE,
        gas: 2000000,
    }, (err, result) => {
        if (err) {
            logger.error(`${err}`);
            return;
        } else {
            logger.info(`${result}`);
            return;
        }
    });
};


exports.GetDocument = function GetDocument(owner, ipfsHash) {
    logger.info(`Adding document hash: ${ipfsHash} for: ${owner}`);
    MYCARE.methods.getPersonalRecord(owner, ipfsHash).call().then((err, result) => {
        if (err) {
            logger.error(`${err}`);
            return {};
        }
        logger.info(`${result}`);
        return {
            password: result[0],
            inserted: result[1]
        };
    });
};

exports.GetDocumentCount = function GetDocumentCount(owner) {
    MYCARE.methods.getPersonalRecordsCount(owner).call().then((err, result) => {
        if (err) {
            logger.error(`${err}`);
            return {};
        }
        logger.info(`${result}`);
        return result;
    });
};

/** ******************************************************************************************* */
/* SHARING                                                                                       */
/** ******************************************************************************************* */

exports.ShareOne = function ShareOne(owner, viewer, documentHash, timestamp) {
    return this.Share(owner, viewer, 1, documentHash, timestamp);
};

exports.DenyAll = function DenyAll(owner, viewer, documentHash, timestamp) {
    return this.Share(owner, viewer, 2, documentHash, timestamp);
};

exports.ShareAll = function ShareAll(owner, viewer, documentHash, timestamp) {
    return this.Share(owner, viewer, 0, documentHash, timestamp);
};

exports.DenyOne = function DenyOne(owner, viewer, documentHash, timestamp) {
    return this.Share(owner, viewer, 3, documentHash, timestamp);
};

exports.Share = function Share(owner, viewer, shareType, documentHash, timestamp) {
    MYCARE.methods.Share(owner, viewer, shareType, documentHash, timestamp).send({
        from: ACCOUNT_BASE,
        gas: 2000000,
    }, (err, result) => {
        if (err) {
            logger.error(`Share Error: ${err}`);
            return {};
        }
        logger.info(`${result}`);
        return result;
    });
};

exports.CanAccess = function CanAccess(owner, viewer, documentHash) {
    MYCARE.methods.CanAccess(owner, viewer, documentHash).call().then((err, result) => {
        if (err) {
            logger.error(`Can Access Error: ${err}`);
            return {};
        }
        logger.info(`${result}`);
        return result;
    });
};

exports.HasSharedWith = function HasShardWith(owner, viewer) {
    MYCARE.methods.HasSharedWith(owner, viewer).call().then((err, result) => {
        if (err) {
            logger(`HasSharedWith Error: ${err}`);
            return {};
        }
        logger.info(`${result}`);
        return result;
    });
};

exports.fromAscii = function fromAscii(str, padding) {
    let hex = '0x';
    for (let i = 0; i < str.length; i += 1) {
        const code = str.charCodeAt(i);
        const n = code.toString(16);
        hex += n.length < 2 ? `0${n}` : n;
    }
    return hex + '0'.repeat((padding * 2) - (hex.length + 2));
};

exports.toAscii = function toAscii(hex) {
    let str = '';
    let i = 0;
    const l = hex.length;
    if (hex.substring(0, 2) === '0x') {
        i = 2;
    }
    for (; i < l; i += 2) {
        const code = parseInt(hex.substr(i, 2), 16);
        if (code !== 0) {
            str += String.fromCharCode(code);
        }
    }
    return str;
};