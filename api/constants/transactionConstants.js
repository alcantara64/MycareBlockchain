const variance = 100000;

function computeGasLimit(limit) {
    return 0; //limit + variance;
}

exports.GAS_LIMIT = {
    MYCARE: {
        ADD_ACCOUNT: computeGasLimit(3000000),
        DEACTIVATE_ACCOUNT: computeGasLimit(18891),
        ADD_ACCOUNT_TYPE: computeGasLimit(89747)
    },
    SHARED_ACCESS: {
        ADD_CONNECTION: computeGasLimit(136864),
        UPDATE_CONNECTION: computeGasLimit(34046),
        ADD_CONSENT: computeGasLimit(241238),
        REVOKE_CONSENT: computeGasLimit(34077)
    },
    POLICIES_AND_TERMS: {
        ADD_NEW_DOCUMENT: computeGasLimit(295149),
        SAVE_ACCEPTANCE: computeGasLimit(3000000)
    }
    
};